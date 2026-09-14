const express = require('express');
const router = express.Router();
const { getDb, queryAll, queryOne, runQuery, runTransaction } = require('../db/database');

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

// Insert new row into table
router.post('/:tableName', async (req, res) => {
    const { tableName } = req.params;
    if (!VALID_TABLES.includes(tableName)) {
        return res.status(400).json({ error: `Invalid table name: ${tableName}` });
    }

    const rowData = req.body;
    if (!rowData || typeof rowData !== 'object' || Object.keys(rowData).length === 0) {
        return res.status(400).json({ error: 'Request body must contain column key-value pairs' });
    }

    try {
        const db = await getDb();
        const columnsInfo = queryAll(db, `PRAGMA table_info(${tableName})`);
        const validColumnNames = columnsInfo.map(c => c.name);

        const keys = Object.keys(rowData).filter(k => validColumnNames.includes(k));
        if (keys.length === 0) {
            return res.status(400).json({ error: 'No valid column fields provided' });
        }

        const placeholders = keys.map(() => '?').join(', ');
        const values = keys.map(k => rowData[k]);
        const sql = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`;

        // ACID Principle: Atomicity & Isolation
        // Wrapping this in a transaction ensures that the insert is atomic and isolated.
        const result = runTransaction(db, () => {
            return runQuery(db, sql, values);
        });
        res.json({ message: 'Record inserted successfully', result });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update existing row in table
router.put('/:tableName/:id', async (req, res) => {
    const { tableName, id } = req.params;
    if (!VALID_TABLES.includes(tableName)) {
        return res.status(400).json({ error: `Invalid table name: ${tableName}` });
    }

    const rowData = req.body;
    if (!rowData || typeof rowData !== 'object' || Object.keys(rowData).length === 0) {
        return res.status(400).json({ error: 'Request body must contain column key-value pairs' });
    }

    try {
        const db = await getDb();
        const columnsInfo = queryAll(db, `PRAGMA table_info(${tableName})`);
        const validColumnNames = columnsInfo.map(c => c.name);
        const pkCol = columnsInfo.find(c => c.pk === 1)?.name || columnsInfo[0]?.name;

        if (!pkCol) {
            return res.status(400).json({ error: 'Could not determine Primary Key column for table' });
        }

        const setKeys = Object.keys(rowData).filter(k => validColumnNames.includes(k) && k !== pkCol);
        if (setKeys.length === 0) {
            return res.status(400).json({ error: 'No valid update fields provided' });
        }

        const setClause = setKeys.map(k => `${k} = ?`).join(', ');
        const values = [...setKeys.map(k => rowData[k]), id];
        const sql = `UPDATE ${tableName} SET ${setClause} WHERE ${pkCol} = ?`;

        // ACID Principle: Atomicity & Isolation
        // Wrapping this in a transaction ensures that the update is atomic and isolated.
        const result = runTransaction(db, () => {
            return runQuery(db, sql, values);
        });
        res.json({ message: 'Record updated successfully', result });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete row from table
router.delete('/:tableName/:id', async (req, res) => {
    const { tableName, id } = req.params;
    if (!VALID_TABLES.includes(tableName)) {
        return res.status(400).json({ error: `Invalid table name: ${tableName}` });
    }

    try {
        const db = await getDb();
        const columnsInfo = queryAll(db, `PRAGMA table_info(${tableName})`);
        const pkCol = columnsInfo.find(c => c.pk === 1)?.name || columnsInfo[0]?.name;

        if (!pkCol) {
            return res.status(400).json({ error: 'Could not determine Primary Key column for table' });
        }

        const sql = `DELETE FROM ${tableName} WHERE ${pkCol} = ?`;
        // ACID Principle: Atomicity & Isolation
        // Wrapping this in a transaction ensures that the delete operation is atomic and isolated.
        const result = runTransaction(db, () => {
            return runQuery(db, sql, [id]);
        });
        res.json({ message: 'Record deleted successfully', result });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;

