const express = require('express');
const router = express.Router();
const { getDb, queryAll, runQuery } = require('../db/database');

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
        const team = queryAll(db, `
            SELECT e.*, d.name as department_name, ds.title as designation_title
            FROM employees e
            LEFT JOIN departments d ON e.department_id = d.department_id
            LEFT JOIN designations ds ON e.designation_id = ds.designation_id
            WHERE e.manager_id = ?
        `, [managerId]);

        res.json(team);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/employees/add-subordinate
// Add a new employee reporting to the manager
router.post('/add-subordinate', async (req, res) => {
    const { 
        manager_id, first_name, last_name, email, 
        department_id, designation_id, joining_date, salary 
    } = req.body;

    if (!manager_id || !first_name || !last_name || !department_id || !designation_id) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const db = await getDb();
        
        // Use a transaction since we might want to create a user account too in the future.
        // For now, we'll just insert into employees.
        
        // Set a default user_id if null (or we could omit it if allowed by schema). 
        // Schema says user_id is UNIQUE, so we'll leave it null for purely CRM added people unless we create a user.
        
        const insertQuery = `
            INSERT INTO employees (
                first_name, last_name, department_id, designation_id, manager_id, joining_date, salary, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')
        `;
        
        const safeDate = joining_date || new Date().toISOString().split('T')[0];
        const safeSalary = salary || 0.00;

        const result = runQuery(db, insertQuery, [
            first_name, last_name, department_id, designation_id, manager_id, safeDate, safeSalary
        ]);

        res.json({ message: 'Employee added successfully', employee_id: result.lastInsertRowid });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
