const { queryOne, runQuery } = require('./database');

// notifications.user_id references users, while most workflow events are keyed by
// employee_id / client_id. These helpers resolve the login account and skip records
// that have none (e.g. employees added without a user account).

function notifyUser(db, userId, title, message) {
    if (!userId) return;
    runQuery(db, 'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)', [userId, title, message]);
}

function notifyEmployee(db, employeeId, title, message) {
    if (!employeeId) return;
    const row = queryOne(db, 'SELECT user_id FROM employees WHERE employee_id = ?', [employeeId]);
    notifyUser(db, row && row.user_id, title, message);
}

function notifyClient(db, clientId, title, message) {
    if (!clientId) return;
    const row = queryOne(db, 'SELECT user_id FROM clients WHERE client_id = ?', [clientId]);
    notifyUser(db, row && row.user_id, title, message);
}

// Translates SQLite constraint errors into messages a user can act on.
function friendlyDbError(err) {
    const msg = err && err.message ? err.message : String(err);
    if (msg.includes('FOREIGN KEY constraint failed')) {
        return { status: 409, error: 'This record is still referenced by other records (foreign key constraint). Reassign or remove those first.' };
    }
    if (msg.includes('UNIQUE constraint failed')) {
        const field = msg.split('UNIQUE constraint failed:')[1];
        return { status: 409, error: `A record with this value already exists${field ? ` (${field.trim()})` : ''}.` };
    }
    if (msg.includes('NOT NULL constraint failed')) {
        const field = msg.split('NOT NULL constraint failed:')[1];
        return { status: 400, error: `Required field missing${field ? ` (${field.trim()})` : ''}.` };
    }
    return { status: 500, error: msg };
}

function sendDbError(res, err) {
    const { status, error } = friendlyDbError(err);
    res.status(status).json({ error });
}

// Local calendar date / time, used for attendance and payment dates.
function today() {
    return new Date().toLocaleDateString('en-CA');
}

function nowTime() {
    return new Date().toTimeString().slice(0, 5);
}

module.exports = { notifyUser, notifyEmployee, notifyClient, friendlyDbError, sendDbError, today, nowTime };
