const express = require('express');
const router = express.Router();
const { getDb, queryAll, queryOne, runQuery, runTransaction } = require('../db/database');
const { sendDbError, notifyEmployee, today, nowTime } = require('../db/notify');

// Check-ins after this time are recorded as 'Late'.
const LATE_AFTER = '09:30';

// ==========================================
// LEAVE REQUESTS
// ==========================================

// GET /api/hr/leaves?manager_id=1  |  ?employee_id=4  |  (none = all, for HR)
router.get('/leaves', async (req, res) => {
    const { manager_id, employee_id } = req.query;
    const where = [];
    const params = [];
    if (manager_id) { where.push('e.manager_id = ?'); params.push(manager_id); }
    if (employee_id) { where.push('lr.employee_id = ?'); params.push(employee_id); }

    try {
        const db = await getDb();
        const leaves = queryAll(db, `
            SELECT lr.*, e.first_name, e.last_name,
                   a.first_name AS approver_first, a.last_name AS approver_last,
                   CAST(julianday(lr.end_date) - julianday(lr.start_date) + 1 AS INTEGER) AS days
            FROM leave_requests lr
            JOIN employees e ON lr.employee_id = e.employee_id
            LEFT JOIN employees a ON lr.approved_by = a.employee_id
            ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
            ORDER BY CASE lr.status WHEN 'Pending' THEN 0 ELSE 1 END, lr.start_date DESC
        `, params);
        res.json(leaves);
    } catch (err) {
        sendDbError(res, err);
    }
});

// GET /api/hr/leaves/summary?employee_id=4
// Approved leave days taken this year, grouped by type
router.get('/leaves/summary', async (req, res) => {
    const { employee_id } = req.query;
    if (!employee_id) return res.status(400).json({ error: 'employee_id is required' });
    try {
        const db = await getDb();
        res.json(queryAll(db, `
            SELECT leave_type,
                   SUM(CAST(julianday(end_date) - julianday(start_date) + 1 AS INTEGER)) AS days,
                   COUNT(*) AS requests
            FROM leave_requests
            WHERE employee_id = ? AND status = 'Approved' AND strftime('%Y', start_date) = strftime('%Y', 'now')
            GROUP BY leave_type
        `, [employee_id]));
    } catch (err) {
        sendDbError(res, err);
    }
});

// PUT /api/hr/leaves/:leave_id
// Approve or Reject a pending leave request
router.put('/leaves/:leave_id', async (req, res) => {
    const leaveId = req.params.leave_id;
    const { status, manager_id } = req.body;

    if (!['Approved', 'Rejected'].includes(status) || !manager_id) {
        return res.status(400).json({ error: 'Valid status and manager_id required' });
    }

    try {
        const db = await getDb();
        const leave = queryOne(db, `SELECT * FROM leave_requests WHERE leave_id = ?`, [leaveId]);
        if (!leave) return res.status(404).json({ error: 'Leave request not found' });
        if (leave.status !== 'Pending') return res.status(409).json({ error: `This request was already ${leave.status.toLowerCase()}` });

        // ACID Principle: Atomicity - the decision and the employee's notification commit together
        runTransaction(db, () => {
            runQuery(db, `UPDATE leave_requests SET status = ?, approved_by = ? WHERE leave_id = ?`, [status, manager_id, leaveId]);
            notifyEmployee(db, leave.employee_id, `Leave ${status.toLowerCase()}`,
                `Your ${leave.leave_type} (${leave.start_date} to ${leave.end_date}) was ${status.toLowerCase()}.`);
        });
        res.json({ message: `Leave ${status.toLowerCase()}` });
    } catch (err) {
        sendDbError(res, err);
    }
});

// POST /api/hr/leaves
// Submit a leave request
router.post('/leaves', async (req, res) => {
    const { employee_id, leave_type, start_date, end_date, reason } = req.body;
    if (!employee_id || !leave_type || !start_date || !end_date) {
        return res.status(400).json({ error: 'Missing fields' });
    }
    if (end_date < start_date) {
        return res.status(400).json({ error: 'End date cannot be before start date' });
    }
    try {
        const db = await getDb();
        const overlap = queryOne(db, `
            SELECT leave_id FROM leave_requests
            WHERE employee_id = ? AND status IN ('Pending', 'Approved')
              AND start_date <= ? AND end_date >= ?
        `, [employee_id, end_date, start_date]);
        if (overlap) {
            return res.status(409).json({ error: 'You already have a pending or approved leave overlapping these dates' });
        }

        const leaveId = runTransaction(db, () => {
            const result = runQuery(db, `
                INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, reason, status)
                VALUES (?, ?, ?, ?, ?, 'Pending')
            `, [employee_id, leave_type, start_date, end_date, reason || null]);
            const emp = queryOne(db, `SELECT first_name, last_name, manager_id FROM employees WHERE employee_id = ?`, [employee_id]);
            if (emp && emp.manager_id) {
                notifyEmployee(db, emp.manager_id, 'Leave request awaiting approval',
                    `${emp.first_name} ${emp.last_name} requested ${leave_type} from ${start_date} to ${end_date}.`);
            }
            return result.lastInsertRowid;
        });
        res.json({ message: 'Leave request submitted', leave_id: leaveId });
    } catch (err) {
        sendDbError(res, err);
    }
});

// PATCH /api/hr/leaves/:leave_id/cancel
// Employee withdraws their own pending request
router.patch('/leaves/:leave_id/cancel', async (req, res) => {
    const { employee_id } = req.body;
    try {
        const db = await getDb();
        const result = runQuery(db, `
            UPDATE leave_requests SET status = 'Cancelled'
            WHERE leave_id = ? AND employee_id = ? AND status = 'Pending'
        `, [req.params.leave_id, employee_id]);
        if (result.changes === 0) return res.status(409).json({ error: 'Only your own pending requests can be cancelled' });
        res.json({ message: 'Leave request cancelled' });
    } catch (err) {
        sendDbError(res, err);
    }
});

// ==========================================
// PERFORMANCE REVIEWS
// ==========================================

// GET /api/hr/reviews?employee_id=1
// Get performance reviews for a specific employee
router.get('/reviews', async (req, res) => {
    const employeeId = req.query.employee_id;
    if (!employeeId) return res.status(400).json({ error: 'employee_id is required' });

    try {
        const db = await getDb();
        const reviews = queryAll(db, `
            SELECT pr.*, r.first_name as reviewer_first, r.last_name as reviewer_last
            FROM performance_reviews pr
            JOIN employees r ON pr.reviewer_id = r.employee_id
            WHERE pr.employee_id = ?
            ORDER BY pr.review_date DESC
        `, [employeeId]);
        res.json(reviews);
    } catch (err) {
        sendDbError(res, err);
    }
});

// POST /api/hr/reviews
// Submit a performance review
router.post('/reviews', async (req, res) => {
    const { employee_id, reviewer_id, rating, comments } = req.body;

    if (!employee_id || !reviewer_id || !rating) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    const numericRating = Number(rating);
    if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1.0 and 5.0' });
    }
    if (String(employee_id) === String(reviewer_id)) {
        return res.status(400).json({ error: 'Employees cannot review themselves' });
    }

    try {
        const db = await getDb();
        const date = new Date().toISOString().split('T')[0];
        const reviewId = runTransaction(db, () => {
            const result = runQuery(db, `
                INSERT INTO performance_reviews (employee_id, reviewer_id, review_date, rating, comments)
                VALUES (?, ?, ?, ?, ?)
            `, [employee_id, reviewer_id, date, numericRating, comments]);
            notifyEmployee(db, employee_id, 'New performance review', `You received a ${numericRating.toFixed(1)}/5 review.`);
            return result.lastInsertRowid;
        });
        res.json({ message: 'Review added', review_id: reviewId });
    } catch (err) {
        sendDbError(res, err);
    }
});

// ==========================================
// ATTENDANCE
// ==========================================

// GET /api/hr/attendance?manager_id=1  |  ?employee_id=4
router.get('/attendance', async (req, res) => {
    const { manager_id, employee_id } = req.query;
    if (!manager_id && !employee_id) return res.status(400).json({ error: 'manager_id or employee_id is required' });

    try {
        const db = await getDb();
        const attendance = queryAll(db, `
            SELECT a.*, e.first_name, e.last_name
            FROM attendance a
            JOIN employees e ON a.employee_id = e.employee_id
            WHERE ${manager_id ? 'e.manager_id = ?' : 'a.employee_id = ?'}
            ORDER BY a.date DESC, a.check_in DESC
            LIMIT 60
        `, [manager_id || employee_id]);
        res.json(attendance);
    } catch (err) {
        sendDbError(res, err);
    }
});

// POST /api/hr/attendance
// Log (or correct) attendance for a team member. One record per employee per day.
router.post('/attendance', async (req, res) => {
    const { employee_id, date, check_in, check_out, status } = req.body;
    if (!employee_id || !date || !status) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    if (check_in && check_out && check_out < check_in) {
        return res.status(400).json({ error: 'Check-out cannot be before check-in' });
    }

    try {
        const db = await getDb();
        const existing = queryOne(db, `SELECT attendance_id FROM attendance WHERE employee_id = ? AND date = ?`, [employee_id, date]);
        if (existing) {
            runQuery(db, `UPDATE attendance SET check_in = ?, check_out = ?, status = ? WHERE attendance_id = ?`,
                [check_in || null, check_out || null, status, existing.attendance_id]);
            return res.json({ message: 'Attendance record updated', attendance_id: existing.attendance_id });
        }
        const result = runQuery(db, `
            INSERT INTO attendance (employee_id, date, check_in, check_out, status)
            VALUES (?, ?, ?, ?, ?)
        `, [employee_id, date, check_in || null, check_out || null, status]);
        res.json({ message: 'Attendance logged', attendance_id: result.lastInsertRowid });
    } catch (err) {
        sendDbError(res, err);
    }
});

// GET /api/hr/attendance/today?employee_id=4
router.get('/attendance/today', async (req, res) => {
    const { employee_id } = req.query;
    if (!employee_id) return res.status(400).json({ error: 'employee_id is required' });
    try {
        const db = await getDb();
        res.json(queryOne(db, `SELECT * FROM attendance WHERE employee_id = ? AND date = ?`, [employee_id, today()]) || null);
    } catch (err) {
        sendDbError(res, err);
    }
});

// POST /api/hr/attendance/check-in
router.post('/attendance/check-in', async (req, res) => {
    const { employee_id } = req.body;
    if (!employee_id) return res.status(400).json({ error: 'employee_id is required' });
    try {
        const db = await getDb();
        const existing = queryOne(db, `SELECT * FROM attendance WHERE employee_id = ? AND date = ?`, [employee_id, today()]);
        if (existing && existing.check_in) return res.status(409).json({ error: `Already checked in at ${existing.check_in}` });

        const time = nowTime();
        const status = time > LATE_AFTER ? 'Late' : 'Present';
        if (existing) {
            runQuery(db, `UPDATE attendance SET check_in = ?, status = ? WHERE attendance_id = ?`, [time, status, existing.attendance_id]);
        } else {
            runQuery(db, `INSERT INTO attendance (employee_id, date, check_in, status) VALUES (?, ?, ?, ?)`, [employee_id, today(), time, status]);
        }
        res.json({ message: `Checked in at ${time}`, status });
    } catch (err) {
        sendDbError(res, err);
    }
});

// POST /api/hr/attendance/check-out
router.post('/attendance/check-out', async (req, res) => {
    const { employee_id } = req.body;
    if (!employee_id) return res.status(400).json({ error: 'employee_id is required' });
    try {
        const db = await getDb();
        const existing = queryOne(db, `SELECT * FROM attendance WHERE employee_id = ? AND date = ?`, [employee_id, today()]);
        if (!existing || !existing.check_in) return res.status(409).json({ error: 'You have not checked in today' });
        if (existing.check_out) return res.status(409).json({ error: `Already checked out at ${existing.check_out}` });

        const time = nowTime();
        runQuery(db, `UPDATE attendance SET check_out = ? WHERE attendance_id = ?`, [time, existing.attendance_id]);
        res.json({ message: `Checked out at ${time}` });
    } catch (err) {
        sendDbError(res, err);
    }
});

// ==========================================
// PAYROLL
// ==========================================

// GET /api/hr/payroll?month=9&year=2026
router.get('/payroll', async (req, res) => {
    const { month, year } = req.query;
    if (!month || !year) return res.status(400).json({ error: 'month and year are required' });
    try {
        const db = await getDb();
        res.json(queryAll(db, `
            SELECT py.*, e.first_name, e.last_name, d.name AS department_name
            FROM payroll py
            JOIN employees e ON py.employee_id = e.employee_id
            LEFT JOIN departments d ON e.department_id = d.department_id
            WHERE py.month = ? AND py.year = ?
            ORDER BY e.first_name
        `, [month, year]));
    } catch (err) {
        sendDbError(res, err);
    }
});

// POST /api/hr/payroll/run  { month, year }
// Generates a Pending payroll row for every active employee who doesn't have one yet.
router.post('/payroll/run', async (req, res) => {
    const month = Number(req.body.month);
    const year = Number(req.body.year);
    if (!month || month < 1 || month > 12 || !year) return res.status(400).json({ error: 'Valid month (1-12) and year are required' });

    try {
        const db = await getDb();
        // ACID Principle: Atomicity - the whole payroll run commits or none of it does
        const created = runTransaction(db, () => {
            const pending = queryAll(db, `
                SELECT e.employee_id, e.salary FROM employees e
                WHERE e.status = 'Active'
                  AND NOT EXISTS (SELECT 1 FROM payroll py WHERE py.employee_id = e.employee_id AND py.month = ? AND py.year = ?)
            `, [month, year]);
            pending.forEach(emp => {
                const basic = Math.round((emp.salary / 12) * 100) / 100;
                runQuery(db, `
                    INSERT INTO payroll (employee_id, month, year, basic_salary, bonus, deductions, net_salary, status)
                    VALUES (?, ?, ?, ?, 0, 0, ?, 'Pending')
                `, [emp.employee_id, month, year, basic, basic]);
            });
            return pending.length;
        });
        res.json({ message: created ? `Generated ${created} payroll record(s)` : 'Payroll already generated for all active employees', created });
    } catch (err) {
        sendDbError(res, err);
    }
});

// PATCH /api/hr/payroll/:id  { bonus, deductions, status }
router.patch('/payroll/:id', async (req, res) => {
    try {
        const db = await getDb();
        const row = queryOne(db, `SELECT * FROM payroll WHERE payroll_id = ?`, [req.params.id]);
        if (!row) return res.status(404).json({ error: 'Payroll record not found' });
        if (row.status === 'Paid' && (req.body.bonus !== undefined || req.body.deductions !== undefined)) {
            return res.status(409).json({ error: 'Paid payroll records cannot be edited' });
        }

        const bonus = req.body.bonus !== undefined ? Number(req.body.bonus) || 0 : row.bonus;
        const deductions = req.body.deductions !== undefined ? Number(req.body.deductions) || 0 : row.deductions;
        const net = Math.round((row.basic_salary + bonus - deductions) * 100) / 100;
        if (net < 0) return res.status(400).json({ error: 'Deductions cannot exceed basic salary plus bonus' });

        const status = req.body.status || row.status;
        const paymentDate = status === 'Paid' ? (row.payment_date || today()) : null;

        runTransaction(db, () => {
            runQuery(db, `UPDATE payroll SET bonus = ?, deductions = ?, net_salary = ?, status = ?, payment_date = ? WHERE payroll_id = ?`,
                [bonus, deductions, net, status, paymentDate, row.payroll_id]);
            if (status === 'Paid' && row.status !== 'Paid') {
                notifyEmployee(db, row.employee_id, 'Salary credited', `Your salary for ${row.month}/${row.year} ($${net.toLocaleString()}) has been paid.`);
            }
        });
        res.json({ message: 'Payroll updated', net_salary: net });
    } catch (err) {
        sendDbError(res, err);
    }
});

// POST /api/hr/payroll/pay-all  { month, year }
router.post('/payroll/pay-all', async (req, res) => {
    const { month, year } = req.body;
    if (!month || !year) return res.status(400).json({ error: 'month and year are required' });
    try {
        const db = await getDb();
        const paid = runTransaction(db, () => {
            const rows = queryAll(db, `SELECT * FROM payroll WHERE month = ? AND year = ? AND status != 'Paid'`, [month, year]);
            rows.forEach(row => {
                runQuery(db, `UPDATE payroll SET status = 'Paid', payment_date = ? WHERE payroll_id = ?`, [today(), row.payroll_id]);
                notifyEmployee(db, row.employee_id, 'Salary credited', `Your salary for ${month}/${year} ($${row.net_salary.toLocaleString()}) has been paid.`);
            });
            return rows.length;
        });
        res.json({ message: `Marked ${paid} payroll record(s) as paid`, paid });
    } catch (err) {
        sendDbError(res, err);
    }
});

module.exports = router;
