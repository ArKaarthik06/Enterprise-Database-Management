const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db/database');

const authRoutes = require('./routes/auth');
const tableRoutes = require('./routes/tables');
const queryRoutes = require('./routes/query');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/query', queryRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        database: 'SQLite',
        system: 'Enterprise Management System DBMS',
        timestamp: new Date().toISOString()
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`Enterprise DBMS Server running on http://localhost:${PORT}`);
    console.log(`SQLite Database loaded with 15 relational tables.`);
    console.log(`====================================================`);
});
