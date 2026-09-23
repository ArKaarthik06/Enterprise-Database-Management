const express = require('express');
const router = express.Router();
const { getDb, queryAll, runQuery } = require('../db/database');

// ==========================================
// LEAVE REQUESTS
// ==========================================

// GET /api/hr/leaves?manager_id=1
// Get leave requests for employees reporting to the manager
router.get('/leaves', async (req, res) => {
    const managerId = req.query.manager_id;
    if (!managerId) return res.status(400).json({ error: 'manager_id is required' });

    try {
        const db = await getDb();
        const leaves = queryAll(db, `
            SELECT lr.*, e.first_name, e.last_name 
            FROM leave_requests lr
            JOIN employees e ON lr.employee_id = e.employee_id
            WHERE e.manager_id = ?
            ORDER BY lr.start_date DESC
        `, [managerId]);
        res.json(leaves);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/hr/leaves/:leave_id
// Approve or Reject a leave request
router.put('/leaves/:leave_id', async (req, res) => {
    const leaveId = req.params.leave_id;
    const { status, manager_id } = req.body;

    if (!['Approved', 'Rejected'].includes(status) || !manager_id) {
        return res.status(400).json({ error: 'Valid status and manager_id required' });
    }

    try {
        const db = await getDb();
        runQuery(db, `
            UPDATE leave_requests 
            SET status = ?, approved_by = ?
            WHERE leave_id = ?
        `, [status, manager_id, leaveId]);
        res.json({ message: `Leave ${status.toLowerCase()}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/hr/leaves
// Submit a leave request (useful for testing/demo)
router.post('/leaves', async (req, res) => {
    const { employee_id, leave_type, start_date, end_date, reason } = req.body;
    if (!employee_id || !leave_type || !start_date || !end_date) {
        return res.status(400).json({ error: 'Missing fields' });
    }
    try {
        const db = await getDb();
        const result = runQuery(db, `
            INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, reason)
            VALUES (?, ?, ?, ?, ?)
        `, [employee_id, leave_type, start_date, end_date, reason]);
        res.json({ message: 'Leave request submitted', leave_id: result.lastInsertRowid });
    } catch (err) {
        res.status(500).json({ error: err.message });
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
        res.status(500).json({ error: err.message });
    }
});

// POST /api/hr/reviews
// Submit a performance review
router.post('/reviews', async (req, res) => {
    const { employee_id, reviewer_id, rating, comments } = req.body;

    if (!employee_id || !reviewer_id || !rating) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const db = await getDb();
        const date = new Date().toISOString().split('T')[0];
        const result = runQuery(db, `
            INSERT INTO performance_reviews (employee_id, reviewer_id, review_date, rating, comments)
            VALUES (?, ?, ?, ?, ?)
        `, [employee_id, reviewer_id, date, rating, comments]);
        res.json({ message: 'Review added', review_id: result.lastInsertRowid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// ATTENDANCE
// ==========================================



// GET /api/hr/attendance?manager_id=1
// Get recent attendance for team
router.get('/attendance', async (req, res) => {
    const managerId = req.query.manager_id;
    if (!managerId) return res.status(400).json({ error: 'manager_id is required' });

    try {
        const db = await getDb();
        const attendance = queryAll(db, `
            SELECT a.*, e.first_name, e.last_name
            FROM attendance a
            JOIN employees e ON a.employee_id = e.employee_id
            WHERE e.manager_id = ?
            ORDER BY a.date DESC
            LIMIT 50
        `, [managerId]);
        res.json(attendance);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/hr/attendance
// Log attendance for a team member
router.post('/attendance', async (req, res) => {
    const { employee_id, date, check_in, check_out, status } = req.body;
    if (!employee_id || !date || !status) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    try {
        const db = await getDb();
        const result = runQuery(db, `
            INSERT INTO attendance (employee_id, date, check_in, check_out, status)
            VALUES (?, ?, ?, ?, ?)
        `, [employee_id, date, check_in || null, check_out || null, status]);
        res.json({ message: 'Attendance logged', attendance_id: result.lastInsertRowid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
