const express = require('express');
const router = express.Router();
const { getDb, queryAll, queryOne, runQuery, runTransaction } = require('../db/database');

const PRESET_QUERIES = [
    {
        id: 'category-monthly-sales',
        title: 'Monthly Client Sales & Invoice Revenues',
        category: 'Financial Analytics',
        description: 'Calculates total invoice revenue grouped by Client, Project, and Payment Status with SUM and COUNT aggregations.',
        sql: `SELECT 
    c.company AS client_name,
    p.name AS project_name,
    COUNT(i.invoice_id) AS total_invoices,
    SUM(i.amount) AS total_billed_amount,
    SUM(CASE WHEN i.status = 'Paid' THEN i.amount ELSE 0 END) AS paid_revenue,
    SUM(CASE WHEN i.status = 'Pending' OR i.status = 'Overdue' THEN i.amount ELSE 0 END) AS outstanding_amount
FROM clients c
JOIN invoices i ON c.client_id = i.client_id
JOIN projects p ON i.project_id = p.project_id
GROUP BY c.client_id, p.project_id
ORDER BY total_billed_amount DESC;`
    },
    {
        id: 'dept-payroll-salary',
        title: 'Department Salary & Net Payroll Summary',
        category: 'HR & Payroll',
        description: 'Computes department headcounts, average base salaries, total bonuses, deductions, and total net payroll payouts.',
        sql: `SELECT 
    d.name AS department_name,
    COUNT(e.employee_id) AS total_employees,
    ROUND(AVG(e.salary), 2) AS avg_base_salary,
    ROUND(MIN(e.salary), 2) AS min_salary,
    ROUND(MAX(e.salary), 2) AS max_salary,
    ROUND(SUM(py.net_salary), 2) AS total_net_payroll_paid
FROM departments d
JOIN employees e ON d.department_id = e.department_id
LEFT JOIN payroll py ON e.employee_id = py.employee_id
GROUP BY d.department_id
ORDER BY avg_base_salary DESC;`
    },
    {
        id: 'employee-performance-ratings',
        title: 'Employee Performance Ratings & Manager Hierarchy',
        category: 'Performance',
        description: 'Multi-table JOIN query displaying employee details, manager name, designation, department, and latest review rating.',
        sql: `SELECT 
    e.employee_id,
    (e.first_name || ' ' || e.last_name) AS employee_name,
    d.name AS department,
    des.title AS designation,
    COALESCE(m.first_name || ' ' || m.last_name, 'Top Executive') AS manager_name,
    pr.rating AS performance_rating,
    pr.comments AS reviewer_feedback
FROM employees e
JOIN departments d ON e.department_id = d.department_id
JOIN designations des ON e.designation_id = des.designation_id
LEFT JOIN employees m ON e.manager_id = m.employee_id
LEFT JOIN performance_reviews pr ON e.employee_id = pr.employee_id
ORDER BY pr.rating DESC;`
    },
    {
        id: 'project-task-completion',
        title: 'Project Task Completion Ratios & Lead Managers',
        category: 'Project Management',
        description: 'Summarizes projects, assigned project managers, total tasks, completed tasks count, and pending tasks count.',
        sql: `SELECT 
    p.project_id,
    p.name AS project_name,
    p.status AS project_status,
    (m.first_name || ' ' || m.last_name) AS project_manager,
    COUNT(t.task_id) AS total_tasks,
    SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) AS completed_tasks,
    SUM(CASE WHEN t.status = 'In Progress' THEN 1 ELSE 0 END) AS in_progress_tasks,
    SUM(CASE WHEN t.status = 'Pending' THEN 1 ELSE 0 END) AS pending_tasks
FROM projects p
LEFT JOIN employees m ON p.manager_id = m.employee_id
LEFT JOIN tasks t ON p.project_id = t.project_id
GROUP BY p.project_id;`
    },
    {
        id: 'asset-allocation-status',
        title: 'Hardware & Infrastructure Asset Allocation',
        category: 'Asset Management',
        description: 'Analyzes enterprise hardware assets assigned to employees and their operational status.',
        sql: `SELECT 
    a.category AS asset_category,
    COUNT(a.asset_id) AS total_assets,
    SUM(CASE WHEN a.status = 'In Use' THEN 1 ELSE 0 END) AS in_use_count,
    SUM(CASE WHEN a.status = 'Maintenance' THEN 1 ELSE 0 END) AS maintenance_count
FROM assets a
GROUP BY a.category
ORDER BY total_assets DESC;`
    },
    {
        id: 'attendance-leave-summary',
        title: 'Attendance Ratios & Leave Request Analysis',
        category: 'HR & Operations',
        description: 'Calculates attendance log entries, present vs absent counts, and approved leave days for staff.',
        sql: `SELECT 
    (e.first_name || ' ' || e.last_name) AS employee_name,
    d.name AS department,
    COUNT(DISTINCT att.attendance_id) AS total_logged_days,
    SUM(CASE WHEN att.status = 'Present' THEN 1 ELSE 0 END) AS days_present,
    COUNT(DISTINCT lr.leave_id) AS total_leave_requests,
    SUM(CASE WHEN lr.status = 'Approved' THEN 1 ELSE 0 END) AS approved_leaves
FROM employees e
JOIN departments d ON e.department_id = d.department_id
LEFT JOIN attendance att ON e.employee_id = att.employee_id
LEFT JOIN leave_requests lr ON e.employee_id = lr.employee_id
GROUP BY e.employee_id;`
    }
];

// Presets list
router.get('/presets', (req, res) => {
    res.json(PRESET_QUERIES);
});

// Run preset query by ID
router.get('/preset/:id', async (req, res) => {
    const preset = PRESET_QUERIES.find(p => p.id === req.params.id);
    if (!preset) {
        return res.status(404).json({ error: 'Preset query not found' });
    }

    const startTime = process.hrtime();
    try {
        const db = await getDb();
        const rows = queryAll(db, preset.sql);
        const diff = process.hrtime(startTime);
        const executionTimeMs = (diff[0] * 1000 + diff[1] / 1e6).toFixed(2);

        res.json({
            preset,
            data: rows,
            rowCount: rows.length,
            executionTimeMs,
            columns: rows.length > 0 ? Object.keys(rows[0]) : []
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Execute raw custom SQL
router.post('/execute', async (req, res) => {
    const { sql } = req.body;
    if (!sql || typeof sql !== 'string') {
        return res.status(400).json({ error: 'SQL query string is required' });
    }

    const trimmedSql = sql.trim();
    const startTime = process.hrtime();

    try {
        const db = await getDb();
        const isSelect = /^SELECT/i.test(trimmedSql) || /^PRAGMA/i.test(trimmedSql) || /^EXPLAIN/i.test(trimmedSql);
        
        if (isSelect) {
            const rows = queryAll(db, trimmedSql);
            const diff = process.hrtime(startTime);
            const executionTimeMs = (diff[0] * 1000 + diff[1] / 1e6).toFixed(2);

            return res.json({
                queryType: 'SELECT',
                data: rows,
                rowCount: rows.length,
                columns: rows.length > 0 ? Object.keys(rows[0]) : [],
                executionTimeMs
            });
        } else {
            // ACID Principle: Atomicity & Isolation
            // Wrap arbitrary mutation queries in a transaction. This guarantees that if a custom script
            // contains multiple statements (if supported), they are atomic and isolated.
            const result = runTransaction(db, () => {
                return runQuery(db, trimmedSql);
            });
            const diff = process.hrtime(startTime);
            const executionTimeMs = (diff[0] * 1000 + diff[1] / 1e6).toFixed(2);

            return res.json({
                queryType: 'MUTATION',
                changes: result.changes,
                lastInsertRowid: result.lastInsertRowid,
                executionTimeMs
            });
        }
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Analytics Dashboard Aggregations
router.get('/analytics-summary', async (req, res) => {
    try {
        const db = await getDb();

        const deptSalaries = queryAll(db, `
            SELECT d.name as department, ROUND(AVG(e.salary), 2) as avg_salary, COUNT(e.employee_id) as employee_count
            FROM departments d
            LEFT JOIN employees e ON d.department_id = e.department_id
            GROUP BY d.department_id
        `);

        const invoiceSummary = queryAll(db, `
            SELECT status, SUM(amount) as total_amount, COUNT(invoice_id) as count
            FROM invoices
            GROUP BY status
        `);

        const taskStatus = queryAll(db, `
            SELECT status, COUNT(task_id) as count
            FROM tasks
            GROUP BY status
        `);

        const assetCategory = queryAll(db, `
            SELECT category, COUNT(asset_id) as count
            FROM assets
            GROUP BY category
        `);

        const empCount = queryOne(db, 'SELECT COUNT(*) as c FROM employees');
        const deptCount = queryOne(db, 'SELECT COUNT(*) as c FROM departments');
        const projCount = queryOne(db, 'SELECT COUNT(*) as c FROM projects');
        const clientCount = queryOne(db, 'SELECT COUNT(*) as c FROM clients');
        const invCount = queryOne(db, 'SELECT COUNT(*) as c FROM invoices');
        const assetCount = queryOne(db, 'SELECT COUNT(*) as c FROM assets');
        const revCount = queryOne(db, "SELECT COALESCE(SUM(amount), 0) as s FROM invoices WHERE status = 'Paid'");

        res.json({
            deptSalaries,
            invoiceSummary,
            taskStatus,
            assetCategory,
            counts: {
                employees: empCount ? empCount.c : 0,
                departments: deptCount ? deptCount.c : 0,
                projects: projCount ? projCount.c : 0,
                clients: clientCount ? clientCount.c : 0,
                invoices: invCount ? invCount.c : 0,
                assets: assetCount ? assetCount.c : 0,
                totalRevenue: revCount ? revCount.s : 0
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
