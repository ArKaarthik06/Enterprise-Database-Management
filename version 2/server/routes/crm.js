const express = require('express');
const router = express.Router();
const { getDb, queryAll, queryOne, runQuery, runTransaction } = require('../db/database');
const { sendDbError, notifyClient, notifyEmployee } = require('../db/notify');

const LEAD_STAGES = ['New', 'Contacted', 'Proposal', 'Won', 'Lost'];
const INVOICE_STATUSES = ['Pending', 'Paid', 'Overdue', 'Cancelled'];

// ==========================================
// LEADS (Sales Pipeline)
// ==========================================

// GET /api/crm/leads
router.get('/leads', async (req, res) => {
    try {
        const db = await getDb();
        const leads = queryAll(db, `
            SELECT l.*, e.first_name, e.last_name,
                   (SELECT COUNT(*) FROM interactions i WHERE i.entity_type = 'Lead' AND i.entity_id = l.lead_id) AS interaction_count
            FROM leads l
            LEFT JOIN employees e ON l.assigned_to = e.employee_id
            ORDER BY l.created_at DESC
        `);
        res.json(leads);
    } catch (err) {
        sendDbError(res, err);
    }
});

// POST /api/crm/leads
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
        `, [company_name, contact_name, email || null, phone || null, expected_value || 0, assigned_to || null]);
        res.json({ message: 'Lead created', lead_id: result.lastInsertRowid });
    } catch (err) {
        sendDbError(res, err);
    }
});

// PUT /api/crm/leads/:id
router.put('/leads/:id', async (req, res) => {
    const editable = ['company_name', 'contact_name', 'email', 'phone', 'expected_value', 'assigned_to', 'status'];
    const keys = editable.filter(k => req.body[k] !== undefined);
    if (keys.length === 0) return res.status(400).json({ error: 'No editable fields provided' });
    if (req.body.status && !LEAD_STAGES.includes(req.body.status)) return res.status(400).json({ error: 'Invalid lead stage' });

    try {
        const db = await getDb();
        const current = queryOne(db, `SELECT * FROM leads WHERE lead_id = ?`, [req.params.id]);
        if (!current) return res.status(404).json({ error: 'Lead not found' });

        runTransaction(db, () => {
            const values = keys.map(k => (req.body[k] === '' ? null : req.body[k]));
            runQuery(db, `UPDATE leads SET ${keys.map(k => `${k} = ?`).join(', ')} WHERE lead_id = ?`, [...values, req.params.id]);
            if (req.body.assigned_to && String(req.body.assigned_to) !== String(current.assigned_to)) {
                notifyEmployee(db, req.body.assigned_to, 'Lead assigned to you', `You now own the ${current.company_name} opportunity.`);
            }
        });
        res.json({ message: 'Lead updated' });
    } catch (err) {
        sendDbError(res, err);
    }
});

// PUT /api/crm/leads/:id/status
// Update deal stage
router.put('/leads/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!LEAD_STAGES.includes(status)) return res.status(400).json({ error: 'Invalid lead stage' });
    try {
        const db = await getDb();
        runQuery(db, `UPDATE leads SET status = ? WHERE lead_id = ?`, [status, id]);
        res.json({ message: 'Status updated' });
    } catch (err) {
        sendDbError(res, err);
    }
});

// DELETE /api/crm/leads/:id  (also removes its polymorphic interactions)
router.delete('/leads/:id', async (req, res) => {
    try {
        const db = await getDb();
        runTransaction(db, () => {
            runQuery(db, `DELETE FROM interactions WHERE entity_type = 'Lead' AND entity_id = ?`, [req.params.id]);
            runQuery(db, `DELETE FROM leads WHERE lead_id = ?`, [req.params.id]);
        });
        res.json({ message: 'Lead deleted' });
    } catch (err) {
        sendDbError(res, err);
    }
});

// POST /api/crm/leads/:id/convert
// Turns a lead into a client, marks it Won, and logs the conversion - one transaction.
router.post('/leads/:id/convert', async (req, res) => {
    const { employee_id } = req.body;
    try {
        const db = await getDb();
        const lead = queryOne(db, `SELECT * FROM leads WHERE lead_id = ?`, [req.params.id]);
        if (!lead) return res.status(404).json({ error: 'Lead not found' });

        const duplicate = queryOne(db, `SELECT client_id FROM clients WHERE company = ? AND IFNULL(email, '') = IFNULL(?, '')`,
            [lead.company_name, lead.email]);
        if (duplicate) return res.status(409).json({ error: `${lead.company_name} is already a client (#${duplicate.client_id})` });

        const clientId = runTransaction(db, () => {
            const { lastInsertRowid } = runQuery(db, `INSERT INTO clients (name, company, email, phone) VALUES (?, ?, ?, ?)`,
                [lead.contact_name, lead.company_name, lead.email, lead.phone]);
            runQuery(db, `UPDATE leads SET status = 'Won' WHERE lead_id = ?`, [lead.lead_id]);
            runQuery(db, `
                INSERT INTO interactions (entity_type, entity_id, interaction_type, notes, employee_id)
                VALUES ('Lead', ?, 'Note', ?, ?)
            `, [lead.lead_id, `Converted to client #${lastInsertRowid}`, employee_id || null]);
            return lastInsertRowid;
        });
        res.json({ message: `${lead.company_name} converted to client`, client_id: clientId });
    } catch (err) {
        sendDbError(res, err);
    }
});

// ==========================================
// CLIENTS (Converted / Active Customers)
// ==========================================

// GET /api/crm/clients
router.get('/clients', async (req, res) => {
    try {
        const db = await getDb();
        const clients = queryAll(db, `
            SELECT c.*, u.username,
                   (SELECT COUNT(*) FROM projects p WHERE p.client_id = c.client_id) AS project_count,
                   (SELECT COALESCE(SUM(amount), 0) FROM invoices i WHERE i.client_id = c.client_id) AS total_billed,
                   (SELECT COALESCE(SUM(amount), 0) FROM invoices i WHERE i.client_id = c.client_id AND i.status != 'Paid' AND i.status != 'Cancelled') AS outstanding
            FROM clients c
            LEFT JOIN users u ON c.user_id = u.user_id
            ORDER BY c.company
        `);
        res.json(clients);
    } catch (err) {
        sendDbError(res, err);
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
        `, [name, company, email || null, phone || null, address || null]);
        res.json({ message: 'Client added', client_id: result.lastInsertRowid });
    } catch (err) {
        sendDbError(res, err);
    }
});

// PUT /api/crm/clients/:id
router.put('/clients/:id', async (req, res) => {
    const { name, company, email, phone, address } = req.body;
    if (!name || !company) return res.status(400).json({ error: 'Name and Company are required' });
    try {
        const db = await getDb();
        runQuery(db, `UPDATE clients SET name = ?, company = ?, email = ?, phone = ?, address = ? WHERE client_id = ?`,
            [name, company, email || null, phone || null, address || null, req.params.id]);
        res.json({ message: 'Client updated' });
    } catch (err) {
        sendDbError(res, err);
    }
});

// DELETE /api/crm/clients/:id  (projects, tasks and invoices cascade per schema)
router.delete('/clients/:id', async (req, res) => {
    try {
        const db = await getDb();
        runTransaction(db, () => {
            runQuery(db, `DELETE FROM interactions WHERE entity_type = 'Client' AND entity_id = ?`, [req.params.id]);
            runQuery(db, `DELETE FROM clients WHERE client_id = ?`, [req.params.id]);
        });
        res.json({ message: 'Client deleted' });
    } catch (err) {
        sendDbError(res, err);
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
        sendDbError(res, err);
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
        `, [entity_type, entity_id, interaction_type, notes, employee_id || null]);
        res.json({ message: 'Interaction logged' });
    } catch (err) {
        sendDbError(res, err);
    }
});

// DELETE /api/crm/interactions/:id
router.delete('/interactions/:id', async (req, res) => {
    try {
        const db = await getDb();
        runQuery(db, `DELETE FROM interactions WHERE interaction_id = ?`, [req.params.id]);
        res.json({ message: 'Interaction deleted' });
    } catch (err) {
        sendDbError(res, err);
    }
});

// ==========================================
// INVOICES
// ==========================================

// GET /api/crm/invoices?client_id=
router.get('/invoices', async (req, res) => {
    const { client_id } = req.query;
    try {
        const db = await getDb();
        const invoices = queryAll(db, `
            SELECT i.*, c.name as client_name, c.company as client_company, p.name as project_name,
                   (i.status NOT IN ('Paid', 'Cancelled') AND i.due_date < date('now')) AS is_overdue
            FROM invoices i
            LEFT JOIN clients c ON i.client_id = c.client_id
            LEFT JOIN projects p ON i.project_id = p.project_id
            ${client_id ? 'WHERE i.client_id = ?' : ''}
            ORDER BY i.issue_date DESC, i.invoice_id DESC
        `, client_id ? [client_id] : []);
        res.json(invoices);
    } catch (err) {
        sendDbError(res, err);
    }
});

// POST /api/crm/invoices
router.post('/invoices', async (req, res) => {
    const { client_id, project_id, amount, issue_date, due_date } = req.body;
    if (!client_id || !project_id || !amount || !issue_date || !due_date) {
        return res.status(400).json({ error: 'Client, project, amount, issue date and due date are required' });
    }
    if (Number(amount) <= 0) return res.status(400).json({ error: 'Amount must be greater than zero' });
    if (due_date < issue_date) return res.status(400).json({ error: 'Due date cannot be before issue date' });

    try {
        const db = await getDb();
        const project = queryOne(db, `SELECT client_id, name FROM projects WHERE project_id = ?`, [project_id]);
        if (!project) return res.status(400).json({ error: 'Project not found' });
        if (String(project.client_id) !== String(client_id)) {
            return res.status(400).json({ error: 'That project does not belong to the selected client' });
        }

        const invoiceId = runTransaction(db, () => {
            const result = runQuery(db, `
                INSERT INTO invoices (client_id, project_id, amount, issue_date, due_date, status)
                VALUES (?, ?, ?, ?, ?, 'Pending')
            `, [client_id, project_id, amount, issue_date, due_date]);
            notifyClient(db, client_id, 'New invoice issued',
                `Invoice INV-${String(result.lastInsertRowid).padStart(4, '0')} for "${project.name}" ($${Number(amount).toLocaleString()}) is due ${due_date}.`);
            return result.lastInsertRowid;
        });
        res.json({ message: 'Invoice generated', invoice_id: invoiceId });
    } catch (err) {
        sendDbError(res, err);
    }
});

// PATCH /api/crm/invoices/:id/status
router.patch('/invoices/:id/status', async (req, res) => {
    const { status } = req.body;
    if (!INVOICE_STATUSES.includes(status)) return res.status(400).json({ error: `Status must be one of ${INVOICE_STATUSES.join(', ')}` });
    try {
        const db = await getDb();
        const invoice = queryOne(db, `SELECT * FROM invoices WHERE invoice_id = ?`, [req.params.id]);
        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

        runTransaction(db, () => {
            runQuery(db, `UPDATE invoices SET status = ? WHERE invoice_id = ?`, [status, invoice.invoice_id]);
            if (status === 'Paid' && invoice.status !== 'Paid') {
                notifyClient(db, invoice.client_id, 'Payment received',
                    `Thank you - INV-${String(invoice.invoice_id).padStart(4, '0')} is marked as paid.`);
            }
        });
        res.json({ message: `Invoice marked ${status}` });
    } catch (err) {
        sendDbError(res, err);
    }
});

// DELETE /api/crm/invoices/:id
router.delete('/invoices/:id', async (req, res) => {
    try {
        const db = await getDb();
        runQuery(db, `DELETE FROM invoices WHERE invoice_id = ?`, [req.params.id]);
        res.json({ message: 'Invoice deleted' });
    } catch (err) {
        sendDbError(res, err);
    }
});

module.exports = router;
