const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Get all slots/bookings
app.get('/api/slots', async (req, res) => {
    try {
        const result = await db.query(`SELECT date, time_slot, status FROM bookings WHERE status != 'Cancelled'`);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Book a slot
app.post('/api/book', async (req, res) => {
    const { planner_name, event_type, date, time_slot } = req.body;
    
    if (!planner_name || !event_type || !date || !time_slot) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        // Check for double booking
        let conflictQuery = `SELECT id FROM bookings WHERE date = $1 AND (time_slot = $2 OR time_slot = 'Full Day (8AM - 8PM)') AND status != 'Cancelled'`;
        let queryParams = [date, time_slot];
        
        if (time_slot === 'Full Day (8AM - 8PM)') {
            conflictQuery = `SELECT id FROM bookings WHERE date = $1 AND status != 'Cancelled'`;
            queryParams = [date];
        }

        const conflictCheck = await db.query(conflictQuery, queryParams);
        if (conflictCheck.rows.length > 0) {
            return res.status(409).json({ error: 'Slot is already booked or pending.' });
        }

        // Create booking
        const insertQuery = `
            INSERT INTO bookings (planner_name, event_type, date, time_slot, status) 
            VALUES ($1, $2, $3, $4, 'Pending') 
            RETURNING id
        `;
        const insertResult = await db.query(insertQuery, [planner_name, event_type, date, time_slot]);
        
        res.status(201).json({ id: insertResult.rows[0].id, message: 'Booking requested successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Get all bookings
app.get('/api/admin/bookings', async (req, res) => {
    try {
        const result = await db.query(`SELECT * FROM bookings ORDER BY created_at DESC`);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Approve booking
app.post('/api/admin/approve/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(`UPDATE bookings SET status = 'Approved' WHERE id = $1`, [id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Booking not found.' });
        res.json({ message: 'Booking approved.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Cancel/Delete booking
app.post('/api/admin/cancel/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(`UPDATE bookings SET status = 'Cancelled' WHERE id = $1`, [id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Booking not found.' });
        res.json({ message: 'Booking cancelled.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Check status by name
app.get('/api/status', async (req, res) => {
    const { name } = req.query;
    if (!name) return res.status(400).json({ error: 'Name is required.' });
    
    try {
        const result = await db.query(`SELECT * FROM bookings WHERE planner_name ILIKE $1 ORDER BY created_at DESC`, [`%${name}%`]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Secret Admin Dashboard route
app.get('/admin-dashboard-xyz789', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'admin-dashboard-xyz789.html'));
});

// Catch-all route to serve index.html
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

module.exports = app;
