const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { matchOrigin } = require('@sms/shared/utils');

const { connectDB, ensureDbConnection } = require('./configs/db');
const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const app = express();

// CORS Configuration
const allowedUrls = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(url => url.trim())
    : ['http://localhost:3000', 'http://localhost:5173', "https://sms-web-ui.vercel.app"];

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin || allowedUrls.some(url => matchOrigin(origin, url))) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    credentials: true,
    optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB auto-reconnection middleware - ensures DB is connected before processing requests
app.use(ensureDbConnection);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth/:schoolId/dashboard', dashboardRoutes);

// Health check endpoint
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is running' });
});
app.get("/", (_req, res) => {
    res.send(`🚀 Server is running Securely`);
});

// Start server
const PORT = process.env.PORT || 5000;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Failed to connect to database:', error.message);
        process.exit(1);
    });

module.exports = app;

// Trigger redeployment
