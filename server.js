// Charity Events API Server
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./event_db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Test database connection on startup
async function initializeDatabase() {
    const isConnected = await db.testConnection();
    if (!isConnected) {
        console.error('Failed to connect to database. Server will not start.');
        process.exit(1);
    }
}

// API Routes

// Get all events with optional filters
app.get('/api/events', async (req, res) => {
    const filters = {
        category: req.query.category,
        location: req.query.location,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
        status: req.query.status
    };
    
    // Remove undefined values
    Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
            delete filters[key];
        }
    });
    
    const events = await db.getAllEvents(filters);
    res.json(events);
});

// Get event by ID
app.get('/api/events/:id', async (req, res) => {
    const eventId = parseInt(req.params.id);
    if (isNaN(eventId)) {
        return res.status(400).json({ error: 'Invalid event ID' });
    }
    
    const event = await db.getEventById(eventId);
    if (!event) {
        return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(event);
});



// Mark event as violated
app.put('/api/events/:id/violate', async (req, res) => {
    const eventId = parseInt(req.params.id);
    if (isNaN(eventId)) {
        return res.status(400).json({ error: 'Invalid event ID' });
    }
    
    await db.markEventViolated(eventId);
    res.json({ message: 'Event marked as violated successfully' });
});

// Get events by category
app.get('/api/events/category/:category', async (req, res) => {
    const { category } = req.params;
    const events = await db.getEventsByCategory(category);
    res.json(events);
});

// Get all categories
app.get('/api/categories', async (req, res) => {
    const categories = await db.getCategories();
    res.json(categories);
});

// Serve the main HTML file for all other routes (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function startServer() {
    await initializeDatabase();
    app.listen(PORT, () => {
        console.log(`Charity Events API server running on port ${PORT}`);
        console.log(`Access the website at: http://localhost:${PORT}`);
    });
}

startServer();
