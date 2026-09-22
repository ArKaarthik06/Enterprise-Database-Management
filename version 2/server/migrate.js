const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'db', 'enterprise.db');
const schemaPath = path.join(__dirname, 'db', 'schema.sql');

const newTablesSQL = `
-- 16. Leads Table
CREATE TABLE IF NOT EXISTS leads (
    lead_id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name VARCHAR(100) NOT NULL,
    contact_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(15),
    status VARCHAR(20) DEFAULT 'New',
    expected_value DECIMAL(10,2) DEFAULT 0.00,
    assigned_to INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES employees(employee_id) ON DELETE SET NULL
);

-- 17. Interactions Table
CREATE TABLE IF NOT EXISTS interactions (
    interaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type VARCHAR(20) NOT NULL,
    entity_id INTEGER NOT NULL,
    interaction_type VARCHAR(20) NOT NULL,
    notes TEXT,
    employee_id INTEGER,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE SET NULL
);
`;

// Append to schema.sql if it's not already there
const currentSchema = fs.readFileSync(schemaPath, 'utf8');
if (!currentSchema.includes('CREATE TABLE IF NOT EXISTS leads')) {
    fs.appendFileSync(schemaPath, '\n' + newTablesSQL);
    console.log('Appended new tables to schema.sql');
} else {
    console.log('Schema already contains new tables');
}

// Execute on existing DB
try {
    const db = new Database(dbPath);
    db.exec(newTablesSQL);
    console.log('Migration successfully executed on enterprise.db');
    db.close();
} catch (err) {
    console.error('Error executing migration:', err);
}
