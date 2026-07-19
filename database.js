const { Pool } = require('pg');

// Use Vercel's POSTGRES_URL. We use ssl for secure cloud connections.
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: process.env.POSTGRES_URL ? { rejectUnauthorized: false } : false
});

// Initialize table on startup if it doesn't exist
pool.query(`
    CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        planner_name VARCHAR(255) NOT NULL,
        event_type VARCHAR(255) NOT NULL,
        date VARCHAR(50) NOT NULL,
        time_slot VARCHAR(100) NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`, (err, res) => {
    if (err) {
        console.error('Error creating database table:', err.message);
    } else {
        console.log('Postgres database initialized successfully.');
    }
});

module.exports = pool;
