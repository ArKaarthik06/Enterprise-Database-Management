const express = require('express');
const router = express.Router();
const { getDb, queryAll, queryOne, runQuery, runTransaction } = require('../db/database');
const { sendDbError, notifyEmployee } = require('../db/notify');

const EMPLOYEE_SELECT = `
    SELECT e.*, d.name AS department_name, ds.title AS designation_title,
           m.first_name AS manager_first, m.last_name AS manager_last,
           u.username, u.email, u.is_active, r.role_name
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.department_id
    LEFT JOIN designations ds ON e.designation_id = ds.designation_id
    LEFT JOIN employees m ON e.manager_id = m.employee_id
    LEFT JOIN users u ON e.user_id = u.user_id
    LEFT JOIN roles r ON u.role_id = r.role_id
`;

// A designation belongs to exactly one department; reject mismatched pairs.
function checkDesignation(db, departmentId, designationId) {
    const row = queryOne(db, `SELECT department_id FROM designations WHERE designation_id = ?`, [designationId]);
    if (!row) return 'Designation not found';
    if (String(row.department_id) !== String(departmentId)) return 'Designation does not belong to the selected department';
    return null;
}

// GET /api/employees?search=&department_id=&status=
router.get('/', async (req, res) => {
    const { search, department_id, status } = req.query;
    const where = [];
    const params = [];
    if (search) {
        where.push(`(e.first_name LIKE ? OR e.last_name LIKE ? OR u.email LIKE ? OR e.phone LIKE ?)`);
        params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (department_id) { where.push('e.department_id = ?'); params.push(department_id); }
    if (status) { where.push('e.status = ?'); params.push(status); }

    try {
        const db = await getDb();
        const sql = `${EMPLOYEE_SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY e.first_name, e.last_name`;
        res.json(queryAll(db, sql, params));
    } catch (err) {
        sendDbError(res, err);
    }
});

// GET /api/employees/my-team
// Fetch employees reporting to the logged in manager
router.get('/my-team', async (req, res) => {
    // In a real app we'd extract manager_id from an auth middleware / JWT
    // Here we'll pass it via a query param for simplicity in this MVP
    const managerId = req.query.manager_id;
    if (!managerId) {
        return res.status(400).json({ error: 'manager_id is required' });
    }

    try {
        const db = await getDb();
        const team = queryAll(db, `${EMPLOYEE_SELECT} WHERE e.manager_id = ? ORDER BY e.first_name`, [managerId]);
        res.json(team);
    } catch (err) {
        sendDbError(res, err);
    }
});

// POST /api/employees
// Create an employee and (optionally) their login account atomically.
router.post('/', async (req, res) => {
    const {
        first_name, last_name, dob, gender, phone, address,
        department_id, designation_id, manager_id, joining_date, salary, status,
        username, email, password, role_id
    } = req.body;

    if (!first_name || !last_name || !department_id || !designation_id) {
        return res.status(400).json({ error: 'First name, last name, department and designation are required' });
    }
    if (username && (!email || !password)) {
        return res.status(400).json({ error: 'Email and password are required to create a login account' });
    }

    try {
        const db = await getDb();
        const mismatch = checkDesignation(db, department_id, designation_id);
        if (mismatch) return res.status(400).json({ error: mismatch });

        // ACID Principle: Atomicity
        // The user row and the employee row are created together or not at all.
        const employeeId = runTransaction(db, () => {
            let userId = null;
            if (username) {
                const employeeRole = queryOne(db, `SELECT role_id FROM roles WHERE role_name = 'Employee'`);
                userId = runQuery(db,
                    `INSERT INTO users (username, email, password_hash, role_id, is_active) VALUES (?, ?, ?, ?, 1)`,
                    [username, email, password, role_id || (employeeRole && employeeRole.role_id) || 4]
                ).lastInsertRowid;
            }
            const result = runQuery(db, `
                INSERT INTO employees (user_id, first_name, last_name, dob, gender, phone, address,
                    department_id, designation_id, manager_id, joining_date, salary, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                userId, first_name, last_name, dob || null, gender || null, phone || null, address || null,
                department_id, designation_id, manager_id || null,
                joining_date || new Date().toISOString().split('T')[0], salary || 0, status || 'Active'
            ]);
            if (manager_id) {
                notifyEmployee(db, manager_id, 'New team member', `${first_name} ${last_name} now reports to you.`);
            }
            return result.lastInsertRowid;
        });

        res.json({ message: 'Employee created', employee_id: employeeId });
    } catch (err) {
        sendDbError(res, err);
    }
});

// POST /api/employees/add-subordinate
// Add a new employee reporting to the manager
router.post('/add-subordinate', async (req, res) => {
    const {
        manager_id, first_name, last_name,
        department_id, designation_id, joining_date, salary
    } = req.body;

    if (!manager_id || !first_name || !last_name || !department_id || !designation_id) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const db = await getDb();
        const mismatch = checkDesignation(db, department_id, designation_id);
        if (mismatch) return res.status(400).json({ error: mismatch });

        const result = runQuery(db, `
            INSERT INTO employees (
                first_name, last_name, department_id, designation_id, manager_id, joining_date, salary, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')
        `, [
            first_name, last_name, department_id, designation_id, manager_id,
            joining_date || new Date().toISOString().split('T')[0], salary || 0.00
        ]);

        res.json({ message: 'Employee added successfully', employee_id: result.lastInsertRowid });
    } catch (err) {
        sendDbError(res, err);
    }
});

// PUT /api/employees/:id
// Edit HR fields. Changing status also enables/disables the linked login.
router.put('/:id', async (req, res) => {
    const employeeId = req.params.id;
    const editable = ['first_name', 'last_name', 'dob', 'gender', 'phone', 'address', 'department_id',
        'designation_id', 'manager_id', 'joining_date', 'salary', 'status'];
    const keys = editable.filter(k => req.body[k] !== undefined);
    if (keys.length === 0) return res.status(400).json({ error: 'No editable fields provided' });
    if (req.body.manager_id && String(req.body.manager_id) === String(employeeId)) {
        return res.status(400).json({ error: 'An employee cannot be their own manager' });
    }

    try {
        const db = await getDb();
        const current = queryOne(db, `SELECT * FROM employees WHERE employee_id = ?`, [employeeId]);
        if (!current) return res.status(404).json({ error: 'Employee not found' });

        const deptId = req.body.department_id ?? current.department_id;
        const desigId = req.body.designation_id ?? current.designation_id;
        const mismatch = checkDesignation(db, deptId, desigId);
        if (mismatch) return res.status(400).json({ error: mismatch });

        runTransaction(db, () => {
            const values = keys.map(k => (req.body[k] === '' ? null : req.body[k]));
            runQuery(db, `UPDATE employees SET ${keys.map(k => `${k} = ?`).join(', ')} WHERE employee_id = ?`, [...values, employeeId]);

            if (req.body.status && current.user_id) {
                runQuery(db, `UPDATE users SET is_active = ? WHERE user_id = ?`, [req.body.status === 'Inactive' ? 0 : 1, current.user_id]);
            }
            if (req.body.salary !== undefined && Number(req.body.salary) !== Number(current.salary)) {
                notifyEmployee(db, employeeId, 'Salary updated', `Your base salary is now $${Number(req.body.salary).toLocaleString()}.`);
            }
        });
        res.json({ message: 'Employee updated' });
    } catch (err) {
        sendDbError(res, err);
    }
});

module.exports = router;
