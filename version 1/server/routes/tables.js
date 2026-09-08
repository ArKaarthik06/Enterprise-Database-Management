const express = require('express');
const router = express.Router();
const { getDb, queryAll, queryOne } = require('../db/database');

const VALID_TABLES = [
    'roles', 'users', 'departments', 'designations', 'employees',
    'projects', 'tasks', 'clients', 'invoices', 'assets',
    'notifications', 'attendance', 'leave_requests', 'payroll', 'performance_reviews'
];

// List all available tables with row counts and column metadata
router.get('/', async (req, res) => {
    try {
        const db = await getDb();
        const tablesInfo = VALID_TABLES.map(tableName => {
            const countObj = queryOne(db, `SELECT COUNT(*) as count FROM ${tableName}`);
            const pragma = queryAll(db, `PRAGMA table_info(${tableName})`);
            const columns = pragma.map(c => ({
                name: c.name,
                type: c.type,
                pk: Boolean(c.pk)
            }));
            
            return {
                name: tableName,
                rowCount: countObj ? countObj.count : 0,
                columnCount: columns.length,
                columns
            };
        });
        
        res.json(tablesInfo);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get table schema & detailed columns info
router.get('/:tableName/schema', async (req, res) => {
    const { tableName } = req.params;
    if (!VALID_TABLES.includes(tableName)) {
        return res.status(400).json({ error: `Invalid table name: ${tableName}` });
    }

    try {
        const db = await getDb();
        const columns = queryAll(db, `PRAGMA table_info(${tableName})`);
        const foreignKeys = queryAll(db, `PRAGMA foreign_key_list(${tableName})`);
        res.json({ tableName, columns, foreignKeys });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Fetch table data with search, sort, pagination
router.get('/:tableName', async (req, res) => {
    const { tableName } = req.params;
    if (!VALID_TABLES.includes(tableName)) {
        return res.status(400).json({ error: `Invalid table name: ${tableName}` });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const sortBy = req.query.sortBy || null;
    const sortOrder = (req.query.sortOrder || 'ASC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    const search = req.query.search || '';

    try {
        const db = await getDb();
        const columnsInfo = queryAll(db, `PRAGMA table_info(${tableName})`);
        const columnNames = columnsInfo.map(c => c.name);

        let whereClause = '';
        const queryParams = [];

        if (search) {
            const textCols = columnsInfo.filter(c => 
                c.type.includes('VARCHAR') || c.type.includes('TEXT') || c.type.includes('CHAR')
            ).map(c => c.name);

            if (textCols.length > 0) {
                const conditions = textCols.map(col => `${col} LIKE ?`);
                whereClause = ' WHERE (' + conditions.join(' OR ') + ')';
                textCols.forEach(() => queryParams.push(`%${search}%`));
            }
        }

        // Total count
        const totalResult = queryOne(db, `SELECT COUNT(*) as count FROM ${tableName}${whereClause}`, queryParams);
        const totalRows = totalResult ? totalResult.count : 0;

        // Sorting
        let orderByClause = '';
        if (sortBy && columnNames.includes(sortBy)) {
            orderByClause = ` ORDER BY ${sortBy} ${sortOrder}`;
        } else {
            const pkCol = columnsInfo.find(c => c.pk === 1)?.name || columnNames[0];
            if (pkCol) {
                orderByClause = ` ORDER BY ${pkCol} ASC`;
            }
        }

        // Data fetch
        const querySql = `SELECT * FROM ${tableName}${whereClause}${orderByClause} LIMIT ? OFFSET ?`;
        const rows = queryAll(db, querySql, [...queryParams, limit, offset]);

        res.json({
            tableName,
            columns: columnsInfo,
            data: rows,
            pagination: {
                page,
                limit,
                totalRows,
                totalPages: Math.ceil(totalRows / limit) || 1
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
