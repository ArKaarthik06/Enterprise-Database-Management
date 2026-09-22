const express = require('express');
const router = express.Router();
const { getDb, queryAll, runQuery } = require('../db/database');

// ==========================================
// LEADS (Sales Pipeline)
// ==========================================

// GET /api/crm/leads
// Fetch all leads for a manager or assigned rep
router.get('/leads', async (req, res) => {
    const employeeId = req.query.employee_id;
    if (!employeeId) return res.status(400).json({ error: 'employee_id is required' });

    try {
        const db = await getDb();
        const leads = queryAll(db, `
            SELECT l.*, e.first_name, e.last_name
            FROM leads l
            LEFT JOIN employees e ON l.assigned_to = e.employee_id
            ORDER BY l.created_at DESC
        `);
        // In a real app we might filter by assigned_to or manager, but for this CRM demo, let's return all.
        res.json(leads);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/crm/leads
// Create a new lead
router.post('/leads', async (req, res) => {
    const { company_name, contact_name, email, phone, expected_value, assigned_to } = req.body;
    if (!company_name || !contact_name) {
        return res.status(400).json({ error: 'Company Name and Contact Name are required' });
    }

    try {
        const db = await getDb();
        const result = runQuery(db, `
            INSERT INTO leads (company_name, contact_name, email, phone, status, expected_value, assigned_to)
            VALUES (?, ?, ?, ?, 'New', ?, ?)
        `, [company_name, contact_name, email, phone, expected_value || 0, assigned_to]);
        res.json({ message: 'Lead created', lead_id: result.lastInsertRowid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/crm/leads/:id/status
// Update deal stage
router.put('/leads/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const db = await getDb();
        runQuery(db, `UPDATE leads SET status = ? WHERE lead_id = ?`, [status, id]);
        res.json({ message: 'Status updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// CLIENTS (Converted / Active Customers)
// ==========================================

// GET /api/crm/clients
router.get('/clients', async (req, res) => {
    try {
        const db = await getDb();
        const clients = queryAll(db, `SELECT * FROM clients ORDER BY client_id DESC`);
        res.json(clients);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/crm/clients
router.post('/clients', async (req, res) => {
    const { name, company, email, phone, address } = req.body;
    if (!name || !company) return res.status(400).json({ error: 'Name and Company are required' });

    try {
        const db = await getDb();
        const result = runQuery(db, `
            INSERT INTO clients (name, company, email, phone, address)
            VALUES (?, ?, ?, ?, ?)
        `, [name, company, email, phone, address]);
        res.json({ message: 'Client added', client_id: result.lastInsertRowid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// INTERACTIONS (Calls, Emails, Meetings)
// ==========================================

// GET /api/crm/interactions?entity_type=Lead&entity_id=1
router.get('/interactions', async (req, res) => {
    const { entity_type, entity_id } = req.query;
    if (!entity_type || !entity_id) return res.status(400).json({ error: 'entity_type and entity_id required' });

    try {
        const db = await getDb();
        const interactions = queryAll(db, `
            SELECT i.*, e.first_name, e.last_name
            FROM interactions i
            LEFT JOIN employees e ON i.employee_id = e.employee_id
            WHERE i.entity_type = ? AND i.entity_id = ?
            ORDER BY i.date DESC
        `, [entity_type, entity_id]);
        res.json(interactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/crm/interactions
router.post('/interactions', async (req, res) => {
    const { entity_type, entity_id, interaction_type, notes, employee_id } = req.body;
    if (!entity_type || !entity_id || !interaction_type) return res.status(400).json({ error: 'Missing fields' });

    try {
        const db = await getDb();
        runQuery(db, `
            INSERT INTO interactions (entity_type, entity_id, interaction_type, notes, employee_id)
            VALUES (?, ?, ?, ?, ?)
        `, [entity_type, entity_id, interaction_type, notes, employee_id]);
        res.json({ message: 'Interaction logged' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// INVOICES
// ==========================================

// GET /api/crm/invoices
router.get('/invoices', async (req, res) => {
    try {
        const db = await getDb();
        const invoices = queryAll(db, `
            SELECT i.*, c.name as client_name, c.company as client_company, p.name as project_name
            FROM invoices i
            LEFT JOIN clients c ON i.client_id = c.client_id
            LEFT JOIN projects p ON i.project_id = p.project_id
            ORDER BY i.issue_date DESC
        `);
        res.json(invoices);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/crm/invoices
router.post('/invoices', async (req, res) => {
    const { client_id, project_id, amount, issue_date, due_date } = req.body;
    if (!client_id || !project_id || !amount) return res.status(400).json({ error: 'Missing fields' });

    try {
        const db = await getDb();
        runQuery(db, `
            INSERT INTO invoices (client_id, project_id, amount, issue_date, due_date, status)
            VALUES (?, ?, ?, ?, ?, 'Unpaid')
        `, [client_id, project_id, amount, issue_date, due_date]);
        res.json({ message: 'Invoice generated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
