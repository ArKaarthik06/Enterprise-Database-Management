const express = require('express');
const router = express.Router();
const { getDb, queryAll, queryOne, runQuery, runTransaction } = require('../db/database');
const { sendDbError, notifyEmployee, notifyClient } = require('../db/notify');

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

// --- MANAGER WORKFLOWS (Assets & Teams) ---

// Get all assets
router.get('/manager/assets', async (req, res) => {
    try {
        const db = await getDb();
        const sql = `
            SELECT a.*, e.first_name, e.last_name
            FROM assets a
            LEFT JOIN employees e ON a.assigned_to = e.employee_id
            ORDER BY a.asset_id DESC
        `;
        const assets = queryAll(db, sql);
        res.json(assets);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Assign or revoke asset
router.put('/manager/assets/:id/assign', async (req, res) => {
    const assetId = req.params.id;
    const { assigned_to, status } = req.body; // if assigned_to is null, it's a revoke
    try {
        const db = await getDb();
        runTransaction(db, () => {
            const sql = `UPDATE assets SET assigned_to = ?, status = ? WHERE asset_id = ?`;
            runQuery(db, sql, [assigned_to || null, status, assetId]);
            if (assigned_to) {
                const asset = queryOne(db, `SELECT name FROM assets WHERE asset_id = ?`, [assetId]);
                notifyEmployee(db, assigned_to, 'Asset issued to you', `${asset ? asset.name : 'An asset'} has been assigned to you.`);
            }
        });
        res.json({ message: 'Asset assignment updated' });
    } catch (err) {
        sendDbError(res, err);
    }
});

// Register a new asset
router.post('/manager/assets', async (req, res) => {
    const { name, category, purchase_date, assigned_to } = req.body;
    if (!name || !category) return res.status(400).json({ error: 'Name and category are required' });
    try {
        const db = await getDb();
        const result = runQuery(db, `INSERT INTO assets (name, category, purchase_date, assigned_to, status) VALUES (?, ?, ?, ?, ?)`,
            [name, category, purchase_date || null, assigned_to || null, assigned_to ? 'In Use' : 'Available']);
        res.json({ message: 'Asset registered', asset_id: result.lastInsertRowid });
    } catch (err) {
        sendDbError(res, err);
    }
});

// Edit asset details / lifecycle status (Available, In Use, Maintenance, Retired)
router.put('/manager/assets/:id', async (req, res) => {
    const { name, category, purchase_date, status } = req.body;
    if (!name || !category || !status) return res.status(400).json({ error: 'Name, category and status are required' });
    try {
        const db = await getDb();
        // Retired or available assets can't stay assigned to anyone
        const clearAssignee = ['Available', 'Retired'].includes(status);
        runQuery(db, `
            UPDATE assets SET name = ?, category = ?, purchase_date = ?, status = ?
                ${clearAssignee ? ', assigned_to = NULL' : ''}
            WHERE asset_id = ?
        `, [name, category, purchase_date || null, status, req.params.id]);
        res.json({ message: 'Asset updated' });
    } catch (err) {
        sendDbError(res, err);
    }
});

router.delete('/manager/assets/:id', async (req, res) => {
    try {
        const db = await getDb();
        runQuery(db, `DELETE FROM assets WHERE asset_id = ?`, [req.params.id]);
        res.json({ message: 'Asset deleted' });
    } catch (err) {
        sendDbError(res, err);
    }
});

// Get all teams
router.get('/manager/teams', async (req, res) => {
    try {
        const db = await getDb();
        const sql = `
            SELECT t.*, e.first_name as manager_first, e.last_name as manager_last, d.name AS department_name,
                   (SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = t.team_id) AS member_count,
                   (SELECT COUNT(*) FROM projects p WHERE p.team_id = t.team_id) AS project_count
            FROM teams t
            LEFT JOIN employees e ON t.manager_id = e.employee_id
            LEFT JOIN departments d ON t.department_id = d.department_id
            ORDER BY t.name
        `;
        const teams = queryAll(db, sql);
        res.json(teams);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get employees to assign to teams
router.get('/manager/all-employees', async (req, res) => {
    try {
        const db = await getDb();
        const sql = `
            SELECT e.employee_id, e.first_name, e.last_name, d.title as role 
            FROM employees e
            LEFT JOIN designations d ON e.designation_id = d.designation_id
        `;
        const emps = queryAll(db, sql);
        res.json(emps);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all departments
router.get('/manager/departments', async (req, res) => {
    try {
        const db = await getDb();
        const sql = `SELECT * FROM departments ORDER BY name`;
        res.json(queryAll(db, sql));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create new team
router.post('/manager/teams', async (req, res) => {
    const { name, department_id, manager_id } = req.body;
    if (!name || !department_id) return res.status(400).json({ error: 'name and department_id required' });

    try {
        const db = await getDb();
        runTransaction(db, () => {
            const sql = `INSERT INTO teams (name, department_id, manager_id) VALUES (?, ?, ?)`;
            runQuery(db, sql, [name, department_id, manager_id || null]);
        });
        res.json({ message: 'Team created successfully' });
    } catch (err) {
        sendDbError(res, err);
    }
});

// Rename team / change department or team lead
router.put('/manager/teams/:teamId', async (req, res) => {
    const { name, department_id, manager_id } = req.body;
    if (!name || !department_id) return res.status(400).json({ error: 'name and department_id required' });
    try {
        const db = await getDb();
        runQuery(db, `UPDATE teams SET name = ?, department_id = ?, manager_id = ? WHERE team_id = ?`,
            [name, department_id, manager_id || null, req.params.teamId]);
        res.json({ message: 'Team updated' });
    } catch (err) {
        sendDbError(res, err);
    }
});

// Delete team (memberships cascade, projects keep running with team_id = NULL)
router.delete('/manager/teams/:teamId', async (req, res) => {
    try {
        const db = await getDb();
        runQuery(db, `DELETE FROM teams WHERE team_id = ?`, [req.params.teamId]);
        res.json({ message: 'Team deleted' });
    } catch (err) {
        sendDbError(res, err);
    }
});

// Get members of a specific team
router.get('/manager/teams/:teamId/members', async (req, res) => {
    const teamId = req.params.teamId;
    try {
        const db = await getDb();
        const sql = `
            SELECT e.employee_id, e.first_name, e.last_name, d.title as role
            FROM employees e
            JOIN team_members tm ON e.employee_id = tm.employee_id
            LEFT JOIN designations d ON e.designation_id = d.designation_id
            WHERE tm.team_id = ?
        `;
        res.json(queryAll(db, sql, [teamId]));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add member to team
router.post('/manager/teams/:teamId/members', async (req, res) => {
    const teamId = req.params.teamId;
    const { employee_id } = req.body;
    if (!employee_id) return res.status(400).json({ error: 'employee_id required' });

    try {
        const db = await getDb();
        runTransaction(db, () => {
            const sql = `INSERT INTO team_members (team_id, employee_id) VALUES (?, ?)`;
            runQuery(db, sql, [teamId, employee_id]);
        });
        res.json({ message: 'Member added to team' });
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Employee is already in this team' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Remove member from team
router.delete('/manager/teams/:teamId/members/:employeeId', async (req, res) => {
    const { teamId, employeeId } = req.params;
    try {
        const db = await getDb();
        runTransaction(db, () => {
            const sql = `DELETE FROM team_members WHERE team_id = ? AND employee_id = ?`;
            runQuery(db, sql, [teamId, employeeId]);
        });
        res.json({ message: 'Member removed from team' });
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

// Get employee's payroll history
router.get('/employee/payroll', async (req, res) => {
    const employeeId = req.query.employee_id;
    if (!employeeId) return res.status(400).json({ error: 'Employee ID required' });

    try {
        const db = await getDb();
        const sql = `
            SELECT payroll_id, month, year, basic_salary, bonus, deductions, net_salary, payment_date, status
            FROM payroll
            WHERE employee_id = ?
            ORDER BY year DESC, month DESC
        `;
        const payroll = queryAll(db, sql, [employeeId]);
        res.json(payroll);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get employee's assigned assets
router.get('/employee/assets', async (req, res) => {
    const employeeId = req.query.employee_id;
    if (!employeeId) return res.status(400).json({ error: 'Employee ID required' });

    try {
        const db = await getDb();
        const sql = `
            SELECT asset_id, name, category, purchase_date, status
            FROM assets
            WHERE assigned_to = ?
        `;
        const assets = queryAll(db, sql, [employeeId]);
        res.json(assets);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get employee's profile
router.get('/employee/profile', async (req, res) => {
    const employeeId = req.query.employee_id;
    if (!employeeId) return res.status(400).json({ error: 'Employee ID required' });

    try {
        const db = await getDb();
        const sql = `
            SELECT employee_id, first_name, last_name, dob, gender, phone, address, joining_date, salary
            FROM employees
            WHERE employee_id = ?
        `;
        const profile = queryAll(db, sql, [employeeId]);
        res.json(profile[0] || {});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update employee's profile
router.put('/employee/profile', async (req, res) => {
    const { employee_id, phone, address, gender, dob } = req.body;
    if (!employee_id) return res.status(400).json({ error: 'Employee ID required' });

    try {
        const db = await getDb();
        runTransaction(db, () => {
            const sql = `
                UPDATE employees
                SET phone = ?, address = ?, gender = ?, dob = ?
                WHERE employee_id = ?
            `;
            runQuery(db, sql, [phone, address, gender, dob, employee_id]);
        });
        res.json({ message: 'Profile updated successfully' });
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
            SELECT p.project_id, p.name, p.description, p.start_date, p.end_date, p.status, p.manager_id, p.team_id,
                   m.first_name AS manager_first, m.last_name AS manager_last, t.name AS team_name,
                   (SELECT COUNT(*) FROM tasks tk WHERE tk.project_id = p.project_id) AS task_total,
                   (SELECT COUNT(*) FROM tasks tk WHERE tk.project_id = p.project_id AND tk.status = 'Completed') AS task_done
            FROM projects p
            LEFT JOIN employees m ON p.manager_id = m.employee_id
            LEFT JOIN teams t ON p.team_id = t.team_id
            WHERE p.client_id = ?
            ORDER BY p.project_id DESC
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
    if (start_date && end_date && end_date < start_date) {
        return res.status(400).json({ error: 'End date cannot be before start date' });
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
            const project = queryOne(db, `SELECT client_id, name FROM projects WHERE project_id = ?`, [project_id]);
            if (project) {
                notifyClient(db, project.client_id, 'Project accepted', `"${project.name}" has been assigned a team and is now In Progress.`);
            }
        });
        res.json({ message: 'Team assigned to project successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
