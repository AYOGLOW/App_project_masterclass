const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Get all slots/bookings
app.get('/api/slots', (req, res) => {
    db.all(`SELECT date, time_slot, status FROM bookings WHERE status != 'Cancelled'`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Book a slot
app.post('/api/book', (req, res) => {
    const { planner_name, event_type, date, time_slot } = req.body;
    
    if (!planner_name || !event_type || !date || !time_slot) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    // Check for double booking
    let conflictQuery = `SELECT id FROM bookings WHERE date = ? AND (time_slot = ? OR time_slot = 'Full Day (8AM - 8PM)') AND status != 'Cancelled'`;
    let queryParams = [date, time_slot];
    if (time_slot === 'Full Day (8AM - 8PM)') {
        conflictQuery = `SELECT id FROM bookings WHERE date = ? AND status != 'Cancelled'`;
        queryParams = [date];
    }

    db.get(conflictQuery, queryParams, (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) return res.status(409).json({ error: 'Slot is already booked or pending.' });

        // Create booking
        const stmt = db.prepare(`INSERT INTO bookings (planner_name, event_type, date, time_slot, status) VALUES (?, ?, ?, ?, 'Pending')`);
        stmt.run([planner_name, event_type, date, time_slot], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID, message: 'Booking requested successfully.' });
        });
        stmt.finalize();
    });
});

// Admin: Get all bookings
app.get('/api/admin/bookings', (req, res) => {
    db.all(`SELECT * FROM bookings ORDER BY created_at DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Admin: Approve booking
app.post('/api/admin/approve/:id', (req, res) => {
    const { id } = req.params;
    db.run(`UPDATE bookings SET status = 'Approved' WHERE id = ?`, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Booking not found.' });
        res.json({ message: 'Booking approved.' });
    });
});

// Admin: Cancel/Delete booking
app.post('/api/admin/cancel/:id', (req, res) => {
    const { id } = req.params;
    db.run(`UPDATE bookings SET status = 'Cancelled' WHERE id = ?`, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Booking not found.' });
        res.json({ message: 'Booking cancelled.' });
    });
});

// Check status by name
app.get('/api/status', (req, res) => {
    const { name } = req.query;
    if (!name) return res.status(400).json({ error: 'Name is required.' });
    
    db.all(`SELECT * FROM bookings WHERE planner_name LIKE ? ORDER BY created_at DESC`, [`%${name}%`], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Secret Admin Dashboard route
app.get('/admin-dashboard-xyz789', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-dashboard-xyz789.html'));
});

// Catch-all route to serve index.html
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

module.exports = app;
