const express = require('express');
const router = express.Router();
const { getDb, queryOne, queryAll } = require('../db/database');

// Login Endpoint
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const db = await getDb();
        const user = queryOne(db, `
            SELECT u.user_id, u.username, u.email, u.role_id, r.role_name, 
                   e.first_name, e.last_name, e.employee_id,
                   c.client_id, c.name as client_name, c.company as client_company
            FROM users u
            JOIN roles r ON u.role_id = r.role_id
            LEFT JOIN employees e ON u.user_id = e.user_id
            LEFT JOIN clients c ON u.user_id = c.user_id
            WHERE (u.username = ? OR u.email = ?) AND u.password_hash = ? AND u.is_active = 1
        `, [username, username, password]);

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials or inactive account' });
        }

            res.json({
                message: 'Authentication successful',
                user: {
                    id: user.user_id,
                    username: user.username,
                    email: user.email,
                    role: user.role_name,
                    name: user.first_name ? `${user.first_name} ${user.last_name}` : (user.client_name ? user.client_name : user.username),
                    employee_id: user.employee_id || null,
                    client_id: user.client_id || null,
                    company: user.client_company || null
                },
                token: `demo-jwt-token-${user.user_id}-${Date.now()}`
            });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Quick Demo Users List
router.get('/quick-users', async (req, res) => {
    try {
        const db = await getDb();
        const users = queryAll(db, `
            SELECT u.username, u.password_hash as password, r.role_name, 
                   COALESCE(e.first_name || ' ' || e.last_name, c.name, u.username) as name
            FROM users u
            JOIN roles r ON u.role_id = r.role_id
            LEFT JOIN employees e ON u.user_id = e.user_id
            LEFT JOIN clients c ON u.user_id = c.user_id
        `);
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
