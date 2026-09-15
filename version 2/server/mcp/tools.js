const { getDb, queryAll, queryOne, runQuery, runTransaction } = require('../db/database');

const MAX_ROWS = 100;
const WRITE_TOOLS_ENABLED = process.env.MCP_ENABLE_WRITE_TOOLS === '1';

function jsonText(payload) {
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(payload, null, 2)
            }
        ]
    };
}

function quoteIdentifier(identifier) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
        throw new Error(`Invalid SQL identifier: ${identifier}`);
    }
    return `"${identifier}"`;
}

function normalizeLimit(limit) {
    const parsed = Number.parseInt(limit, 10);
    if (Number.isNaN(parsed) || parsed < 1) return MAX_ROWS;
    return Math.min(parsed, MAX_ROWS);
}

function isReadOnlySql(sql) {
    const trimmed = String(sql || '').trim().replace(/;+\s*$/, '');
    return /^(SELECT|WITH|PRAGMA\s+(table_info|foreign_key_list|index_list|index_info)\b|EXPLAIN\b)/i.test(trimmed)
        && !/;\s*\S/.test(trimmed)
        && !/\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|REPLACE|TRUNCATE|ATTACH|DETACH|VACUUM)\b/i.test(trimmed);
}

function getUserTables(db) {
    return queryAll(db, `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name NOT LIKE 'sqlite_%'
        ORDER BY name
    `).map(row => row.name);
}

function ensureTableExists(db, tableName) {
    const tables = getUserTables(db);
    if (!tables.includes(tableName)) {
        throw new Error(`Table '${tableName}' does not exist. Available tables: ${tables.join(', ')}`);
    }
}

function getTableSchema(db, tableName) {
    ensureTableExists(db, tableName);
    const columns = queryAll(db, `PRAGMA table_info(${quoteIdentifier(tableName)})`);
    const foreignKeys = queryAll(db, `PRAGMA foreign_key_list(${quoteIdentifier(tableName)})`);
    const indexes = queryAll(db, `PRAGMA index_list(${quoteIdentifier(tableName)})`);

    return {
        tableName,
        columns: columns.map(column => ({
            name: column.name,
            type: column.type,
            notNull: Boolean(column.notnull),
            defaultValue: column.dflt_value,
            primaryKeyPosition: column.pk
        })),
        foreignKeys: foreignKeys.map(key => ({
            column: key.from,
            referencesTable: key.table,
            referencesColumn: key.to,
            onUpdate: key.on_update,
            onDelete: key.on_delete
        })),
        indexes: indexes.map(index => ({
            name: index.name,
            unique: Boolean(index.unique),
            origin: index.origin
        }))
    };
}

function listTablesTool() {
    return {
        name: 'list_tables',
        description: 'List all database tables, row counts, columns, and foreign-key relationships.',
        annotations: {
            title: 'List database tables',
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false
        },
        inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false
        }
    };
}

function describeTableTool() {
    return {
        name: 'describe_table',
        description: 'Describe one database table with columns, primary keys, foreign keys, and indexes.',
        annotations: {
            title: 'Describe database table',
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false
        },
        inputSchema: {
            type: 'object',
            properties: {
                tableName: {
                    type: 'string',
                    description: 'Exact table name to inspect.'
                }
            },
            required: ['tableName'],
            additionalProperties: false
        }
    };
}

function runReadQueryTool() {
    return {
        name: 'run_read_query',
        description: 'Execute a safe read-only SQLite query and return rows. Only SELECT, WITH, EXPLAIN, and schema PRAGMA queries are allowed.',
        annotations: {
            title: 'Run read-only SQL query',
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false
        },
        inputSchema: {
            type: 'object',
            properties: {
                sql: {
                    type: 'string',
                    description: 'Read-only SQL query.'
                },
                limit: {
                    type: 'integer',
                    description: `Maximum rows to return, capped at ${MAX_ROWS}.`
                }
            },
            required: ['sql'],
            additionalProperties: false
        }
    };
}

function getCustomerByIdTool() {
    return {
        name: 'get_customer_by_id',
        description: 'Fetch a customer/client record by ID. In this schema, customers are stored in the clients table.',
        annotations: {
            title: 'Get customer by ID',
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false
        },
        inputSchema: {
            type: 'object',
            properties: {
                customerId: {
                    type: 'integer',
                    description: 'Client/customer ID.'
                }
            },
            required: ['customerId'],
            additionalProperties: false
        }
    };
}

function createOrderTool() {
    return {
        name: 'create_order',
        description: 'Create a client order as an invoice linked to an existing client and project.',
        annotations: {
            title: 'Create order',
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: false
        },
        inputSchema: {
            type: 'object',
            properties: {
                customerId: {
                    type: 'integer',
                    description: 'Client/customer ID from the clients table.'
                },
                projectId: {
                    type: 'integer',
                    description: 'Project ID from the projects table.'
                },
                items: {
                    type: 'array',
                    items: { type: 'object' },
                    description: 'Optional order line items for model context. They are not stored because this schema has no order_items table.'
                },
                totalAmount: {
                    type: 'number',
                    description: 'Invoice/order amount.'
                },
                issueDate: {
                    type: 'string',
                    description: 'Invoice issue date in YYYY-MM-DD format. Defaults to today.'
                },
                dueDate: {
                    type: 'string',
                    description: 'Invoice due date in YYYY-MM-DD format. Defaults to issue date.'
                },
                status: {
                    type: 'string',
                    description: 'Invoice status, for example Pending, Paid, or Overdue.'
                }
            },
            required: ['customerId', 'projectId', 'totalAmount'],
            additionalProperties: false
        }
    };
}

function updateInventoryTool() {
    return {
        name: 'update_inventory',
        description: 'Update inventory/assets status. This schema uses assets as inventory-like records.',
        annotations: {
            title: 'Update inventory',
            readOnlyHint: false,
            destructiveHint: true,
            idempotentHint: false,
            openWorldHint: false
        },
        inputSchema: {
            type: 'object',
            properties: {
                assetId: { type: 'integer' },
                status: { type: 'string' },
                assignedTo: {
                    type: ['integer', 'null'],
                    description: 'Employee ID to assign the asset to, or null to unassign.'
                }
            },
            required: ['assetId'],
            additionalProperties: false
        }
    };
}

function getToolDefinitions() {
    const tools = [
        listTablesTool(),
        describeTableTool(),
        runReadQueryTool(),
        getCustomerByIdTool()
    ];

    if (WRITE_TOOLS_ENABLED) {
        tools.push(createOrderTool(), updateInventoryTool());
    }

    return tools;
}

async function callTool(name, args = {}) {
    const db = await getDb();

    if (name === 'list_tables') {
        const tables = getUserTables(db).map(tableName => {
            const rowCount = queryOne(db, `SELECT COUNT(*) AS count FROM ${quoteIdentifier(tableName)}`);
            return {
                ...getTableSchema(db, tableName),
                rowCount: rowCount ? rowCount.count : 0
            };
        });
        return jsonText({ database: 'SQLite', tables });
    }

    if (name === 'describe_table') {
        return jsonText(getTableSchema(db, args.tableName));
    }

    if (name === 'run_read_query') {
        if (!isReadOnlySql(args.sql)) {
            throw new Error('Only one read-only SELECT/WITH/EXPLAIN/schema PRAGMA statement is allowed.');
        }

        const limit = normalizeLimit(args.limit);
        const startedAt = process.hrtime();
        const rows = queryAll(db, args.sql);
        const diff = process.hrtime(startedAt);
        const slicedRows = rows.slice(0, limit);

        return jsonText({
            sql: args.sql,
            rows: slicedRows,
            rowCount: slicedRows.length,
            totalRowsBeforeLimit: rows.length,
            columns: rows.length > 0 ? Object.keys(rows[0]) : [],
            executionTimeMs: Number((diff[0] * 1000 + diff[1] / 1e6).toFixed(2))
        });
    }

    if (name === 'get_customer_by_id') {
        ensureTableExists(db, 'clients');
        const customer = queryOne(db, 'SELECT * FROM clients WHERE client_id = ?', [args.customerId]);
        return jsonText({
            customerId: args.customerId,
            customer,
            note: customer ? 'Customer records are stored in the clients table.' : 'No customer/client found for this ID.'
        });
    }

    if (name === 'create_order') {
        if (!WRITE_TOOLS_ENABLED) {
            throw new Error('Write tools are disabled. Set MCP_ENABLE_WRITE_TOOLS=1 to enable create_order.');
        }

        ensureTableExists(db, 'clients');
        ensureTableExists(db, 'projects');
        ensureTableExists(db, 'invoices');

        const client = queryOne(db, 'SELECT client_id FROM clients WHERE client_id = ?', [args.customerId]);
        if (!client) {
            throw new Error(`No client/customer found with ID ${args.customerId}.`);
        }

        const project = queryOne(db, 'SELECT project_id FROM projects WHERE project_id = ?', [args.projectId]);
        if (!project) {
            throw new Error(`No project found with ID ${args.projectId}.`);
        }

        const issueDate = args.issueDate || new Date().toISOString().slice(0, 10);
        const dueDate = args.dueDate || issueDate;
        const result = runTransaction(db, () => {
            return runQuery(
                db,
                'INSERT INTO invoices (client_id, project_id, amount, issue_date, due_date, status) VALUES (?, ?, ?, ?, ?, ?)',
                [args.customerId, args.projectId, args.totalAmount, issueDate, dueDate, args.status || 'Pending']
            );
        });

        return jsonText({
            message: 'Order created successfully as an invoice.',
            ignoredItems: Array.isArray(args.items) ? args.items.length : 0,
            result
        });
    }

    if (name === 'update_inventory') {
        if (!WRITE_TOOLS_ENABLED) {
            throw new Error('Write tools are disabled. Set MCP_ENABLE_WRITE_TOOLS=1 to enable update_inventory.');
        }

        ensureTableExists(db, 'assets');
        const updates = [];
        const values = [];

        if (Object.prototype.hasOwnProperty.call(args, 'status')) {
            updates.push('status = ?');
            values.push(args.status);
        }

        if (Object.prototype.hasOwnProperty.call(args, 'assignedTo')) {
            updates.push('assigned_to = ?');
            values.push(args.assignedTo);
        }

        if (updates.length === 0) {
            throw new Error('Provide at least one field to update: status or assignedTo.');
        }

        values.push(args.assetId);
        const result = runTransaction(db, () => {
            return runQuery(db, `UPDATE assets SET ${updates.join(', ')} WHERE asset_id = ?`, values);
        });

        return jsonText({
            message: 'Inventory/asset updated successfully.',
            result
        });
    }

    throw new Error(`Unknown tool: ${name}`);
}

module.exports = {
    callTool,
    getToolDefinitions
};
