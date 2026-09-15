const express = require('express');
const router = express.Router();
const { getDb, queryAll, runQuery, runTransaction } = require('../db/database');

// --- MANAGER ENDPOINTS ---

// Get subordinates for a manager
router.get('/manager/subordinates', async (req, res) => {
    const managerId = req.query.employee_id;
    if (!managerId) return res.status(400).json({ error: 'Manager Employee ID required' });

    try {
        const db = await getDb();
        const sql = `
            SELECT e.employee_id, e.first_name, e.last_name, e.status, d.name as department
            FROM employees e
            LEFT JOIN departments d ON e.department_id = d.department_id
            WHERE e.manager_id = ?
        `;
        const subordinates = queryAll(db, sql, [managerId]);
        res.json(subordinates);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get pending leave requests for a manager's subordinates
router.get('/manager/leaves', async (req, res) => {
    const managerId = req.query.employee_id;
    if (!managerId) return res.status(400).json({ error: 'Manager Employee ID required' });

    try {
        const db = await getDb();
        const sql = `
            SELECT l.leave_id, l.leave_type, l.start_date, l.end_date, l.reason, l.status, e.first_name, e.last_name
            FROM leave_requests l
            JOIN employees e ON l.employee_id = e.employee_id
            WHERE e.manager_id = ? AND l.status = 'Pending'
        `;
        const leaves = queryAll(db, sql, [managerId]);
        res.json(leaves);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Approve leave (ACID Transaction)
router.post('/manager/approve-leave', async (req, res) => {
    const { leave_id, manager_id } = req.body;
    if (!leave_id || !manager_id) return res.status(400).json({ error: 'leave_id and manager_id required' });

    try {
        const db = await getDb();
        // ACID Principle: Atomicity & Isolation
        // We wrap the update and the potential notification in a single transaction.
        runTransaction(db, () => {
            const sqlUpdate = `UPDATE leave_requests SET status = 'Approved', approved_by = ? WHERE leave_id = ?`;
            runQuery(db, sqlUpdate, [manager_id, leave_id]);
            
            // Log an approval record or notification if we wanted to (omitted for brevity, but Atomicity is maintained)
        });
        res.json({ message: 'Leave request approved successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- EMPLOYEE ENDPOINTS ---

// Get employee's own leave requests
router.get('/employee/leaves', async (req, res) => {
    const employeeId = req.query.employee_id;
    if (!employeeId) return res.status(400).json({ error: 'Employee ID required' });

    try {
        const db = await getDb();
        const sql = `
            SELECT leave_id, leave_type, start_date, end_date, reason, status
            FROM leave_requests
            WHERE employee_id = ?
            ORDER BY leave_id DESC
        `;
        const leaves = queryAll(db, sql, [employeeId]);
        res.json(leaves);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Submit new leave request (ACID Transaction)
router.post('/employee/request-leave', async (req, res) => {
    const { employee_id, leave_type, start_date, end_date, reason } = req.body;
    if (!employee_id || !leave_type || !start_date || !end_date) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const db = await getDb();
        // ACID Principle: Atomicity & Isolation
        // Insert the leave request atomically.
        runTransaction(db, () => {
            const sql = `
                INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, reason, status)
                VALUES (?, ?, ?, ?, ?, 'Pending')
            `;
            runQuery(db, sql, [employee_id, leave_type, start_date, end_date, reason]);
        });
        res.json({ message: 'Leave request submitted successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- CLIENT ENDPOINTS ---

// Get client's own projects
router.get('/client/projects', async (req, res) => {
    const clientId = req.query.client_id;
    if (!clientId) return res.status(400).json({ error: 'Client ID required' });

    try {
        const db = await getDb();
        const sql = `
            SELECT project_id, name, description, start_date, end_date, status, manager_id, team_id
            FROM projects
            WHERE client_id = ?
            ORDER BY project_id DESC
        `;
        const projects = queryAll(db, sql, [clientId]);
        res.json(projects);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Submit a new project request
router.post('/client/request-project', async (req, res) => {
    const { client_id, name, description, start_date, end_date } = req.body;
    if (!client_id || !name) {
        return res.status(400).json({ error: 'Client ID and project name are required' });
    }

    try {
        const db = await getDb();
        runTransaction(db, () => {
            const sql = `
                INSERT INTO projects (client_id, name, description, start_date, end_date, status)
                VALUES (?, ?, ?, ?, ?, 'Pending Assignment')
            `;
            runQuery(db, sql, [client_id, name, description, start_date, end_date]);
        });
        res.json({ message: 'Project request submitted successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- MANAGER TEAM ASSIGNMENT ENDPOINTS ---

// Get projects for assignment (no team assigned yet)
router.get('/manager/unassigned-projects', async (req, res) => {
    try {
        const db = await getDb();
        const sql = `
            SELECT p.project_id, p.name, p.description, p.start_date, p.end_date, p.status, c.name as client_name
            FROM projects p
            LEFT JOIN clients c ON p.client_id = c.client_id
            WHERE p.team_id IS NULL
            ORDER BY p.project_id DESC
        `;
        const projects = queryAll(db, sql);
        res.json(projects);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all teams for dropdown
router.get('/manager/teams', async (req, res) => {
    try {
        const db = await getDb();
        const sql = `
            SELECT team_id, name 
            FROM teams
            ORDER BY name
        `;
        const teams = queryAll(db, sql);
        res.json(teams);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Assign team to project
router.post('/manager/assign-team', async (req, res) => {
    const { project_id, team_id, manager_id } = req.body;
    if (!project_id || !team_id || !manager_id) {
        return res.status(400).json({ error: 'project_id, team_id, and manager_id are required' });
    }

    try {
        const db = await getDb();
        runTransaction(db, () => {
            const sqlUpdate = `
                UPDATE projects 
                SET team_id = ?, manager_id = ?, status = 'In Progress' 
                WHERE project_id = ?
            `;
            runQuery(db, sqlUpdate, [team_id, manager_id, project_id]);
        });
        res.json({ message: 'Team assigned to project successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
