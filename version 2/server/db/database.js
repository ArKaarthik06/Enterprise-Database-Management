const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

let dbInstance = null;

function getDbFilePath() {
    if (process.env.DB_FILE_PATH) {
        return process.env.DB_FILE_PATH;
    }

    const bundledDbPath = path.join(__dirname, 'enterprise.db');

    if (process.env.VERCEL || process.env.SQLITE_USE_TMP === '1') {
        const tmpDbPath = path.join('/tmp', 'enterprise.db');
        if (!fs.existsSync(tmpDbPath) && fs.existsSync(bundledDbPath)) {
            fs.copyFileSync(bundledDbPath, tmpDbPath);
        }
        return tmpDbPath;
    }

    return bundledDbPath;
}

async function getDb() {
    if (dbInstance) return dbInstance;

    // Initialize better-sqlite3
    const dbFilePath = getDbFilePath();
    dbInstance = new Database(dbFilePath);

    // ACID Principle: Durability & Isolation
    // WAL (Write-Ahead Logging) mode significantly improves concurrency (Isolation) 
    // by allowing simultaneous readers and a writer. It also ensures that transactions 
    // are written safely to disk via atomic log appends before confirming (Durability).
    if (process.env.SQLITE_READONLY !== '1') {
        dbInstance.pragma('journal_mode = WAL');
    }
    
    // ACID Principle: Consistency
    // Enforcing foreign key constraints ensures database schema consistency so that 
    // invalid relational data cannot be inserted.
    dbInstance.pragma('foreign_keys = ON');

    // Check if tables exist
    const stmt = dbInstance.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users';");
    const res = stmt.get();
    if (!res) {
        console.log('Initializing SQLite Database schema & seed data...');
        const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
        dbInstance.exec(schemaSql);

        const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf-8');
        dbInstance.exec(seedSql);

        console.log('SQLite Database initialized and seeded successfully!');
    }

    return dbInstance;
}

// Dummy function to prevent breaking older code that might import it.
// With better-sqlite3, writes are directly flushed to disk by the OS, 
// completely eliminating the flawed Durability of the old in-memory buffer dump.
function saveDatabase() {}

// Helper query function for SELECT (returns array of objects)
function queryAll(db, sql, params = []) {
    console.log("Executing Query:", sql);
    const stmt = db.prepare(sql);
    return stmt.all(params);
}

// Helper query function for single row
function queryOne(db, sql, params = []) {
    console.log("Executing Query:", sql);
    const stmt = db.prepare(sql);
    return stmt.get(params);
}

// Helper run function for INSERT/UPDATE/DELETE
function runQuery(db, sql, params = []) {
    console.log("Executing Mutation Query:", sql);
    const stmt = db.prepare(sql);
    const info = stmt.run(params);
    return {
        changes: info.changes,
        lastInsertRowid: info.lastInsertRowid
    };
}

// ACID Principle: Atomicity & Isolation
// runTransaction allows multiple queries to be executed as a single all-or-nothing unit of work.
// If any query fails, better-sqlite3 automatically rolls back all changes in the callback,
// enforcing strict Atomicity. It also isolates these changes until the callback successfully completes.
function runTransaction(db, callback) {
    const transaction = db.transaction(callback);
    return transaction();
}

module.exports = {
    getDb,
    saveDatabase,
    queryAll,
    queryOne,
    runQuery,
    runTransaction
};
