const express = require('express');
const router = express.Router();
const { getDb, queryAll, queryOne, runQuery, runTransaction } = require('../db/database');
const { sendDbError, notifyUser } = require('../db/notify');

// ==========================================
// LOOKUPS (dropdown data for every form)
// ==========================================

// GET /api/org/lookups
router.get('/lookups', async (req, res) => {
    try {
        const db = await getDb();
        res.json({
            roles: queryAll(db, `SELECT role_id, role_name FROM roles ORDER BY role_id`),
            departments: queryAll(db, `SELECT department_id, name FROM departments ORDER BY name`),
            designations: queryAll(db, `SELECT designation_id, title, department_id, level FROM designations ORDER BY department_id, level DESC`),
            employees: queryAll(db, `
                SELECT e.employee_id, e.first_name, e.last_name, e.department_id, e.status, ds.title AS designation
                FROM employees e
                LEFT JOIN designations ds ON e.designation_id = ds.designation_id
                ORDER BY e.first_name, e.last_name
            `),
            teams: queryAll(db, `SELECT team_id, name, department_id FROM teams ORDER BY name`),
            clients: queryAll(db, `SELECT client_id, name, company FROM clients ORDER BY company`),
            projects: queryAll(db, `SELECT project_id, name, client_id, status FROM projects ORDER BY name`)
        });
    } catch (err) {
        sendDbError(res, err);
    }
});

// ==========================================
// DEPARTMENTS
// ==========================================

router.get('/departments', async (req, res) => {
    try {
        const db = await getDb();
        res.json(queryAll(db, `
            SELECT d.*,
                   h.first_name AS head_first, h.last_name AS head_last,
                   (SELECT COUNT(*) FROM employees e WHERE e.department_id = d.department_id) AS headcount,
                   (SELECT COUNT(*) FROM designations ds WHERE ds.department_id = d.department_id) AS designation_count,
                   (SELECT COUNT(*) FROM teams t WHERE t.department_id = d.department_id) AS team_count,
                   (SELECT ROUND(AVG(e.salary), 2) FROM employees e WHERE e.department_id = d.department_id) AS avg_salary
            FROM departments d
            LEFT JOIN employees h ON d.head_id = h.employee_id
            ORDER BY d.name
        `));
    } catch (err) {
        sendDbError(res, err);
    }
});

router.post('/departments', async (req, res) => {
    const { name, description, head_id } = req.body;
    if (!name) return res.status(400).json({ error: 'Department name is required' });
    try {
        const db = await getDb();
        const result = runQuery(db, `INSERT INTO departments (name, description, head_id) VALUES (?, ?, ?)`,
            [name, description || null, head_id || null]);
        res.json({ message: 'Department created', department_id: result.lastInsertRowid });
    } catch (err) {
        sendDbError(res, err);
    }
});

router.put('/departments/:id', async (req, res) => {
    const { name, description, head_id } = req.body;
    if (!name) return res.status(400).json({ error: 'Department name is required' });
    try {
        const db = await getDb();
        runQuery(db, `UPDATE departments SET name = ?, description = ?, head_id = ? WHERE department_id = ?`,
            [name, description || null, head_id || null, req.params.id]);
        res.json({ message: 'Department updated' });
    } catch (err) {
        sendDbError(res, err);
    }
});

router.delete('/departments/:id', async (req, res) => {
    try {
        const db = await getDb();
        const { c } = queryOne(db, `SELECT COUNT(*) AS c FROM employees WHERE department_id = ?`, [req.params.id]);
        if (c > 0) {
            return res.status(409).json({ error: `Cannot delete: ${c} employee(s) still belong to this department (ON DELETE RESTRICT).` });
        }
        runQuery(db, `DELETE FROM departments WHERE department_id = ?`, [req.params.id]);
        res.json({ message: 'Department deleted' });
    } catch (err) {
        sendDbError(res, err);
    }
});

// ==========================================
// DESIGNATIONS
// ==========================================

router.get('/designations', async (req, res) => {
    try {
        const db = await getDb();
        res.json(queryAll(db, `
            SELECT ds.*, d.name AS department_name,
                   (SELECT COUNT(*) FROM employees e WHERE e.designation_id = ds.designation_id) AS headcount
            FROM designations ds
            JOIN departments d ON ds.department_id = d.department_id
            ORDER BY d.name, ds.level DESC
        `));
    } catch (err) {
        sendDbError(res, err);
    }
});

router.post('/designations', async (req, res) => {
    const { title, department_id, level } = req.body;
    if (!title || !department_id) return res.status(400).json({ error: 'Title and department are required' });
    try {
        const db = await getDb();
        const result = runQuery(db, `INSERT INTO designations (title, department_id, level) VALUES (?, ?, ?)`,
            [title, department_id, level || 1]);
        res.json({ message: 'Designation created', designation_id: result.lastInsertRowid });
    } catch (err) {
        sendDbError(res, err);
    }
});

router.put('/designations/:id', async (req, res) => {
    const { title, department_id, level } = req.body;
    if (!title || !department_id) return res.status(400).json({ error: 'Title and department are required' });
    try {
        const db = await getDb();
        runQuery(db, `UPDATE designations SET title = ?, department_id = ?, level = ? WHERE designation_id = ?`,
            [title, department_id, level || 1, req.params.id]);
        res.json({ message: 'Designation updated' });
    } catch (err) {
        sendDbError(res, err);
    }
});

router.delete('/designations/:id', async (req, res) => {
    try {
        const db = await getDb();
        runQuery(db, `DELETE FROM designations WHERE designation_id = ?`, [req.params.id]);
        res.json({ message: 'Designation deleted' });
    } catch (err) {
        sendDbError(res, err);
    }
});

// ==========================================
// USER ACCOUNTS & ROLES
// ==========================================

router.get('/users', async (req, res) => {
    try {
        const db = await getDb();
        res.json(queryAll(db, `
            SELECT u.user_id, u.username, u.email, u.role_id, u.is_active, u.created_at, r.role_name,
                   e.employee_id, e.first_name, e.last_name,
                   c.client_id, c.company AS client_company
            FROM users u
            JOIN roles r ON u.role_id = r.role_id
            LEFT JOIN employees e ON e.user_id = u.user_id
            LEFT JOIN clients c ON c.user_id = u.user_id
            ORDER BY u.user_id
        `));
    } catch (err) {
        sendDbError(res, err);
    }
});

// POST /api/org/users  - create a login, optionally linking it to an employee or client in one transaction
router.post('/users', async (req, res) => {
    const { username, email, password, role_id, employee_id, client_id } = req.body;
    if (!username || !email || !password || !role_id) {
        return res.status(400).json({ error: 'Username, email, password and role are required' });
    }
    try {
        const db = await getDb();
        const userId = runTransaction(db, () => {
            const { lastInsertRowid } = runQuery(db,
                `INSERT INTO users (username, email, password_hash, role_id, is_active) VALUES (?, ?, ?, ?, 1)`,
                [username, email, password, role_id]);
            if (employee_id) {
                const linked = runQuery(db, `UPDATE employees SET user_id = ? WHERE employee_id = ? AND user_id IS NULL`, [lastInsertRowid, employee_id]);
                if (linked.changes === 0) throw new Error('Employee not found or already has a login account');
            }
            if (client_id) {
                const linked = runQuery(db, `UPDATE clients SET user_id = ? WHERE client_id = ? AND user_id IS NULL`, [lastInsertRowid, client_id]);
                if (linked.changes === 0) throw new Error('Client not found or already has a login account');
            }
            notifyUser(db, lastInsertRowid, 'Welcome aboard', 'Your Enterprise DBMS account has been created.');
            return lastInsertRowid;
        });
        res.json({ message: 'User account created', user_id: userId });
    } catch (err) {
        sendDbError(res, err);
    }
});

// PATCH /api/org/users/:id  - change role, activate/deactivate, reset password
router.patch('/users/:id', async (req, res) => {
    const { role_id, is_active, password, email } = req.body;
    const sets = [];
    const params = [];
    if (role_id !== undefined) { sets.push('role_id = ?'); params.push(role_id); }
    if (is_active !== undefined) { sets.push('is_active = ?'); params.push(is_active ? 1 : 0); }
    if (password) { sets.push('password_hash = ?'); params.push(password); }
    if (email) { sets.push('email = ?'); params.push(email); }
    if (sets.length === 0) return res.status(400).json({ error: 'Nothing to update' });

    try {
        const db = await getDb();
        runQuery(db, `UPDATE users SET ${sets.join(', ')} WHERE user_id = ?`, [...params, req.params.id]);
        res.json({ message: 'User account updated' });
    } catch (err) {
        sendDbError(res, err);
    }
});

module.exports = router;
