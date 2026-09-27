const express = require('express');
const router = express.Router();
const { getDb, queryAll, queryOne, runQuery, runTransaction } = require('../db/database');
const { sendDbError, notifyEmployee, notifyClient } = require('../db/notify');

const PROJECT_SELECT = `
    SELECT p.*, c.name AS client_name, c.company AS client_company,
           t.name AS team_name,
           m.first_name AS manager_first, m.last_name AS manager_last,
           (SELECT COUNT(*) FROM tasks tk WHERE tk.project_id = p.project_id) AS task_total,
           (SELECT COUNT(*) FROM tasks tk WHERE tk.project_id = p.project_id AND tk.status = 'Completed') AS task_done
    FROM projects p
    LEFT JOIN clients c ON p.client_id = c.client_id
    LEFT JOIN teams t ON p.team_id = t.team_id
    LEFT JOIN employees m ON p.manager_id = m.employee_id
`;

// GET /api/projects?status=
router.get('/', async (req, res) => {
    const { status } = req.query;
    try {
        const db = await getDb();
        const projects = status
            ? queryAll(db, `${PROJECT_SELECT} WHERE p.status = ? ORDER BY p.project_id DESC`, [status])
            : queryAll(db, `${PROJECT_SELECT} ORDER BY p.project_id DESC`);
        res.json(projects);
    } catch (err) {
        sendDbError(res, err);
    }
});

// GET /api/projects/my-projects
router.get('/my-projects', async (req, res) => {
    const { manager_id } = req.query;
    if (!manager_id) {
        return res.status(400).json({ error: 'manager_id is required' });
    }

    try {
        const db = await getDb();
        const projects = queryAll(db, `${PROJECT_SELECT} WHERE p.manager_id = ? ORDER BY p.project_id DESC`, [manager_id]);
        res.json(projects);
    } catch (err) {
        sendDbError(res, err);
    }
});

// GET /api/projects/requests
// Client-submitted projects that nobody has picked up yet
router.get('/requests', async (req, res) => {
    try {
        const db = await getDb();
        res.json(queryAll(db, `${PROJECT_SELECT} WHERE p.manager_id IS NULL OR p.status = 'Pending Assignment' ORDER BY p.project_id DESC`));
    } catch (err) {
        sendDbError(res, err);
    }
});

// POST /api/projects
router.post('/', async (req, res) => {
    const { name, description, start_date, end_date, manager_id, client_id, team_id, status } = req.body;
    if (!name || !manager_id) {
        return res.status(400).json({ error: 'Name and manager_id are required' });
    }
    if (start_date && end_date && end_date < start_date) {
        return res.status(400).json({ error: 'End date cannot be before start date' });
    }

    try {
        const db = await getDb();
        const result = runQuery(db, `
            INSERT INTO projects (name, description, start_date, end_date, manager_id, client_id, team_id, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [name, description || null, start_date || null, end_date || null, manager_id, client_id || null, team_id || null, status || 'In Progress']);
        res.json({ message: 'Project created', project_id: result.lastInsertRowid });
    } catch (err) {
        sendDbError(res, err);
    }
});

// PUT /api/projects/:id
router.put('/:id', async (req, res) => {
    const editable = ['name', 'description', 'start_date', 'end_date', 'status', 'manager_id', 'client_id', 'team_id'];
    const keys = editable.filter(k => req.body[k] !== undefined);
    if (keys.length === 0) return res.status(400).json({ error: 'No editable fields provided' });

    try {
        const db = await getDb();
        const current = queryOne(db, `SELECT * FROM projects WHERE project_id = ?`, [req.params.id]);
        if (!current) return res.status(404).json({ error: 'Project not found' });

        const start = req.body.start_date ?? current.start_date;
        const end = req.body.end_date ?? current.end_date;
        if (start && end && end < start) return res.status(400).json({ error: 'End date cannot be before start date' });

        runTransaction(db, () => {
            const values = keys.map(k => (req.body[k] === '' ? null : req.body[k]));
            runQuery(db, `UPDATE projects SET ${keys.map(k => `${k} = ?`).join(', ')} WHERE project_id = ?`, [...values, req.params.id]);
            if (req.body.status && req.body.status !== current.status) {
                notifyClient(db, current.client_id, 'Project status changed', `"${current.name}" is now ${req.body.status}.`);
            }
        });
        res.json({ message: 'Project updated' });
    } catch (err) {
        sendDbError(res, err);
    }
});

// DELETE /api/projects/:id  (tasks and invoices cascade per schema)
router.delete('/:id', async (req, res) => {
    try {
        const db = await getDb();
        runQuery(db, `DELETE FROM projects WHERE project_id = ?`, [req.params.id]);
        res.json({ message: 'Project deleted' });
    } catch (err) {
        sendDbError(res, err);
    }
});

// GET /api/projects/:projectId/team-members
// Members of the project's team; falls back to all active employees when no team is set.
router.get('/:projectId/team-members', async (req, res) => {
    const { projectId } = req.params;
    try {
        const db = await getDb();
        const project = queryOne(db, `SELECT team_id FROM projects WHERE project_id = ?`, [projectId]);

        if (project && project.team_id) {
            const members = queryAll(db, `
                SELECT e.employee_id, e.first_name, e.last_name
                FROM team_members tm
                JOIN employees e ON tm.employee_id = e.employee_id
                WHERE tm.team_id = ?
            `, [project.team_id]);
            if (members.length > 0) return res.json(members);
        }
        res.json(queryAll(db, `SELECT employee_id, first_name, last_name FROM employees WHERE status = 'Active' ORDER BY first_name`));
    } catch (err) {
        sendDbError(res, err);
    }
});

// GET /api/projects/employee-tasks
router.get('/employee-tasks', async (req, res) => {
    const { employee_id } = req.query;
    if (!employee_id) {
        return res.status(400).json({ error: 'employee_id is required' });
    }

    try {
        const db = await getDb();
        const tasks = queryAll(db, `
            SELECT t.*, p.name as project_name
            FROM tasks t
            JOIN projects p ON t.project_id = p.project_id
            WHERE t.assigned_to = ?
            ORDER BY CASE t.status WHEN 'Completed' THEN 1 ELSE 0 END, t.due_date IS NULL, t.due_date ASC
        `, [employee_id]);
        res.json(tasks);
    } catch (err) {
        sendDbError(res, err);
    }
});

// GET /api/projects/:projectId/tasks
router.get('/:projectId/tasks', async (req, res) => {
    const { projectId } = req.params;
    try {
        const db = await getDb();
        const tasks = queryAll(db, `
            SELECT t.*, e.first_name, e.last_name
            FROM tasks t
            LEFT JOIN employees e ON t.assigned_to = e.employee_id
            WHERE t.project_id = ?
            ORDER BY t.task_id DESC
        `, [projectId]);
        res.json(tasks);
    } catch (err) {
        sendDbError(res, err);
    }
});

// POST /api/projects/:projectId/tasks
router.post('/:projectId/tasks', async (req, res) => {
    const { projectId } = req.params;
    const { title, description, assigned_to, priority, due_date, status } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }

    try {
        const db = await getDb();
        const taskId = runTransaction(db, () => {
            const result = runQuery(db, `
                INSERT INTO tasks (project_id, title, description, assigned_to, priority, due_date, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [projectId, title, description || null, assigned_to || null, priority || 'Medium', due_date || null, status || 'Pending']);
            if (assigned_to) {
                notifyEmployee(db, assigned_to, 'New task assigned', `You were assigned "${title}"${due_date ? ` (due ${due_date})` : ''}.`);
            }
            return result.lastInsertRowid;
        });

        res.json({ message: 'Task created successfully', taskId });
    } catch (err) {
        sendDbError(res, err);
    }
});

// PATCH /api/projects/tasks/:taskId/status
router.patch('/tasks/:taskId/status', async (req, res) => {
    const { taskId } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ error: 'Status is required' });
    }

    try {
        const db = await getDb();
        runQuery(db, `UPDATE tasks SET status = ? WHERE task_id = ?`, [status, taskId]);
        res.json({ message: 'Task status updated' });
    } catch (err) {
        sendDbError(res, err);
    }
});

// PUT /api/projects/tasks/:taskId
router.put('/tasks/:taskId', async (req, res) => {
    const editable = ['title', 'description', 'assigned_to', 'priority', 'status', 'due_date'];
    const keys = editable.filter(k => req.body[k] !== undefined);
    if (keys.length === 0) return res.status(400).json({ error: 'No editable fields provided' });

    try {
        const db = await getDb();
        const current = queryOne(db, `SELECT * FROM tasks WHERE task_id = ?`, [req.params.taskId]);
        if (!current) return res.status(404).json({ error: 'Task not found' });

        runTransaction(db, () => {
            const values = keys.map(k => (req.body[k] === '' ? null : req.body[k]));
            runQuery(db, `UPDATE tasks SET ${keys.map(k => `${k} = ?`).join(', ')} WHERE task_id = ?`, [...values, req.params.taskId]);
            const newAssignee = req.body.assigned_to;
            if (newAssignee && String(newAssignee) !== String(current.assigned_to)) {
                notifyEmployee(db, newAssignee, 'Task assigned to you', `You were assigned "${req.body.title || current.title}".`);
            }
        });
        res.json({ message: 'Task updated' });
    } catch (err) {
        sendDbError(res, err);
    }
});

// DELETE /api/projects/tasks/:taskId
router.delete('/tasks/:taskId', async (req, res) => {
    try {
        const db = await getDb();
        runQuery(db, `DELETE FROM tasks WHERE task_id = ?`, [req.params.taskId]);
        res.json({ message: 'Task deleted' });
    } catch (err) {
        sendDbError(res, err);
    }
});

module.exports = router;
