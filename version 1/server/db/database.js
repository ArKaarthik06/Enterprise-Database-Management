const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbFilePath = path.join(__dirname, 'enterprise.db');
let dbInstance = null;

async function getDb() {
    if (dbInstance) return dbInstance;

    const SQL = await initSqlJs();

    if (fs.existsSync(dbFilePath)) {
        const fileBuffer = fs.readFileSync(dbFilePath);
        dbInstance = new SQL.Database(fileBuffer);
    } else {
        dbInstance = new SQL.Database();
    }

    // Enable foreign keys
    dbInstance.run('PRAGMA foreign_keys = ON;');

    // Check if tables exist
    const res = dbInstance.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='users';");
    if (res.length === 0 || res[0].values.length === 0) {
        console.log('Initializing SQLite Database schema & seed data...');
        const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
        dbInstance.run(schemaSql);

        const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf-8');
        dbInstance.run(seedSql);

        saveDatabase();
        console.log('SQLite Database initialized and seeded successfully!');
    }

    return dbInstance;
}

function saveDatabase() {
    if (dbInstance) {
        const data = dbInstance.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(dbFilePath, buffer);
    }
}

// Helper query function for SELECT (returns array of objects)
function queryAll(db, sql, params = []) {
    const stmt = db.prepare(sql);
    if (params && params.length > 0) {
        stmt.bind(params);
    }
    const results = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
}

// Helper query function for single row
function queryOne(db, sql, params = []) {
    const results = queryAll(db, sql, params);
    return results.length > 0 ? results[0] : null;
}

// Helper run function for INSERT/UPDATE/DELETE
function runQuery(db, sql, params = []) {
    db.run(sql, params);
    saveDatabase();
    const changesObj = queryOne(db, 'SELECT changes() as changes, last_insert_rowid() as id');
    return {
        changes: changesObj ? changesObj.changes : 0,
        lastInsertRowid: changesObj ? changesObj.id : 0
    };
}

module.exports = {
    getDb,
    saveDatabase,
    queryAll,
    queryOne,
    runQuery
};
