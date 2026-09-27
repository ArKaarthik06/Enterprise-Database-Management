const express = require('express');
const router = express.Router();
const { getDb, queryAll, runQuery } = require('../db/database');

// Get all notifications for a user
router.get('/', async (req, res) => {
    const userId = req.query.user_id;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    try {
        const db = await getDb();
        const sql = `
            SELECT notification_id, title, message, is_read, created_at
            FROM notifications
            WHERE user_id = ?
            ORDER BY created_at DESC, notification_id DESC
            LIMIT 50
        `;
        const notifications = queryAll(db, sql, [userId]);
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mark notification as read
router.patch('/:id/read', async (req, res) => {
    const notificationId = req.params.id;

    try {
        const db = await getDb();
        const sql = `UPDATE notifications SET is_read = 1 WHERE notification_id = ?`;
        runQuery(db, sql, [notificationId]);
        res.json({ message: 'Notification marked as read' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mark every notification for a user as read
router.patch('/read-all', async (req, res) => {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'User ID required' });

    try {
        const db = await getDb();
        runQuery(db, `UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0`, [user_id]);
        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Dismiss a notification
router.delete('/:id', async (req, res) => {
    try {
        const db = await getDb();
        runQuery(db, `DELETE FROM notifications WHERE notification_id = ?`, [req.params.id]);
        res.json({ message: 'Notification deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new notification (system level mostly, but accessible here)
router.post('/', async (req, res) => {
    const { user_id, title, message } = req.body;
    if (!user_id || !title || !message) return res.status(400).json({ error: 'Missing required fields' });

    try {
        const db = await getDb();
        const sql = `INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)`;
        runQuery(db, sql, [user_id, title, message]);
        res.json({ message: 'Notification created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
