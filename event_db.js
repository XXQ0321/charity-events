// Database connection module for charity events
const mysql = require('mysql2/promise');

// Database configuration

 const dbConfig = {
    host: 'localhost',
     port: 3306,
     user: 'root',
     password: '123456',
     database: 'charityevents_db',
     waitForConnections: true,
     connectionLimit: 10,
     queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
async function testConnection() {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
    return true;
}

// Execute query function
async function executeQuery(sql, params = []) {
    const [results] = await pool.execute(sql, params);
    return results;
}

// Get all events with optional filters
async function getAllEvents(filters = {}) {
    let sql = `
        SELECT e.*, ed.description, ed.purpose, ed.ticket_price, 
               ed.goal_amount, ed.current_amount,
               CASE 
                   WHEN e.event_end_date < CURDATE() THEN 'past'
                   WHEN e.event_start_date <= CURDATE() AND e.event_end_date >= CURDATE() THEN 'ongoing'
                   ELSE 'upcoming'
               END as status
        FROM event e 
        LEFT JOIN event_detail ed ON e.id = ed.event_id 
        WHERE e.is_violated = FALSE
    `;
    
    const params = [];
    
    if (filters.category) {
        sql += ' AND e.category = ?';
        params.push(filters.category);
    }
    
    if (filters.location) {
        sql += ' AND e.location LIKE ?';
        params.push(`%${filters.location}%`);
    }
    
    if (filters.dateFrom) {
        sql += ' AND e.event_start_date >= ?';
        params.push(filters.dateFrom);
    }
    
    if (filters.dateTo) {
        sql += ' AND e.event_end_date <= ?';
        params.push(filters.dateTo);
    }
    
    if (filters.status) {
        sql += ' AND CASE WHEN e.event_end_date < CURDATE() THEN "past" WHEN e.event_start_date <= CURDATE() AND e.event_end_date >= CURDATE() THEN "ongoing" ELSE "upcoming" END = ?';
        params.push(filters.status);
    }
    
    sql += ' ORDER BY e.event_start_date ASC';
    
    return await executeQuery(sql, params);
}

// Get event by ID
async function getEventById(eventId) {
    const sql = `
        SELECT e.*, ed.description, ed.purpose, ed.ticket_price, 
               ed.goal_amount, ed.current_amount, ed.registration_form,
               CASE 
                   WHEN e.event_end_date < CURDATE() THEN 'past'
                   WHEN e.event_start_date <= CURDATE() AND e.event_end_date >= CURDATE() THEN 'ongoing'
                   ELSE 'upcoming'
               END as status
        FROM event e 
        LEFT JOIN event_detail ed ON e.id = ed.event_id 
        WHERE e.id = ? AND e.is_violated = FALSE
    `;
    
    const results = await executeQuery(sql, [eventId]);
    return results[0] || null;
}



// Mark event as violated
async function markEventViolated(eventId) {
    const sql = 'UPDATE event SET is_violated = TRUE WHERE id = ?';
    return await executeQuery(sql, [eventId]);
}

// Get events by category
async function getEventsByCategory(category) {
    const sql = `
        SELECT e.*, ed.description, ed.purpose, ed.ticket_price, 
               ed.goal_amount, ed.current_amount,
               CASE 
                   WHEN e.event_end_date < CURDATE() THEN 'past'
                   WHEN e.event_start_date <= CURDATE() AND e.event_end_date >= CURDATE() THEN 'ongoing'
                   ELSE 'upcoming'
               END as status
        FROM event e 
        LEFT JOIN event_detail ed ON e.id = ed.event_id 
        WHERE e.category = ? AND e.is_violated = FALSE
        ORDER BY e.event_start_date ASC
    `;
    
    return await executeQuery(sql, [category]);
}

// Get distinct categories
async function getCategories() {
    const sql = 'SELECT DISTINCT category FROM event WHERE is_violated = FALSE ORDER BY category';
    const results = await executeQuery(sql);
    return results.map(row => row.category);
}

module.exports = {
    testConnection,
    executeQuery,
    getAllEvents,
    getEventById,
    markEventViolated,
    getEventsByCategory,
    getCategories
};
