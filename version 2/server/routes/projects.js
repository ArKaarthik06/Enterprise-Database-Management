const express = require('express');
const router = express.Router();
const { getDb, queryAll, runQuery } = require('../db/database');

// GET /api/projects/my-projects
router.get('/my-projects', async (req, res) => {
    const { manager_id } = req.query;
    if (!manager_id) {
        return res.status(400).json({ error: 'manager_id is required' });
    }

    try {
        const db = await getDb();
        const projects = queryAll(db, `
            SELECT p.*, c.name as client_name, c.company as client_company
            FROM projects p
            LEFT JOIN clients c ON p.client_id = c.client_id
            WHERE p.manager_id = ?
        `, [manager_id]);
        res.json(projects);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/projects
router.post('/', async (req, res) => {
    const { name, description, start_date, end_date, manager_id, client_id, team_id } = req.body;
    if (!name || !manager_id) {
        return res.status(400).json({ error: 'Name and manager_id are required' });
    }
    
    try {
        const db = await getDb();
        const result = runQuery(db, `
            INSERT INTO projects (name, description, start_date, end_date, manager_id, client_id, team_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [name, description, start_date, end_date, manager_id, client_id || null, team_id || null]);
        res.json({ message: 'Project created', project_id: result.lastInsertRowid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/projects/:projectId/team-members
router.get('/:projectId/team-members', async (req, res) => {
    const { projectId } = req.params;
    try {
        const db = await getDb();
        // First get the team_id for the project, if any
        const project = queryAll(db, `SELECT team_id FROM projects WHERE project_id = ?`, [projectId])[0];
        
        if (project && project.team_id) {
            // Fetch employees in that team
            const members = queryAll(db, `
                SELECT e.employee_id, e.first_name, e.last_name 
                FROM team_members tm
                JOIN employees e ON tm.employee_id = e.employee_id
                WHERE tm.team_id = ?
            `, [project.team_id]);
            res.json(members);
        } else {
            // If no team, we can fallback to an empty array or fetch all active employees. 
            // We'll return an empty array and let the frontend handle it or fallback to manager's subordinates.
            res.json([]);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
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
            ORDER BY t.due_date ASC
        `, [employee_id]);
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: err.message });
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
        `, [projectId]);
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/projects/:projectId/tasks
router.post('/:projectId/tasks', async (req, res) => {
    const { projectId } = req.params;
    const { title, description, assigned_to, priority, due_date } = req.body;
    
    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }

    try {
        const db = await getDb();
        const result = runQuery(db, `
            INSERT INTO tasks (project_id, title, description, assigned_to, priority, due_date, status)
            VALUES (?, ?, ?, ?, ?, ?, 'Pending')
        `, [projectId, title, description, assigned_to || null, priority || 'Medium', due_date || null]);
        
        res.json({ message: 'Task created successfully', taskId: result.lastInsertRowid });
    } catch (err) {
        res.status(500).json({ error: err.message });
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
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
