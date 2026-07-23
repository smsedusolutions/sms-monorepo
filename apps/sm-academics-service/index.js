const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { matchOrigin } = require('@sms/shared/utils');

const { connectDB, ensureDbConnection } = require('./configs/db');
const timetableRoutes = require('./routes/timetable.routes');
const examRoutes = require('./routes/exam.routes');
const homeworkRoutes = require('./routes/homework.routes');
const { commonRateLimiter } = require('@sms/shared/middlewares');

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
app.use(commonRateLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB auto-reconnection middleware - ensures DB is connected before processing requests
app.use(ensureDbConnection);

// Routes (school-specific)
app.use('/api/academics/school/:schoolId', timetableRoutes);
app.use('/api/academics/school/:schoolId', examRoutes);
app.use('/api/academics/school/:schoolId/homework', homeworkRoutes);

// Health check endpoint
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'OK', message: 'Academics Service is running' });
});

app.get("/", (_req, res) => {
    res.send(`🎓 SMS Academics Service is running securely`);
});

// Start server
const PORT = process.env.PORT || 5003;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`🎓 Academics Service is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Failed to connect to database:', error.message);
        process.exit(1);
    });

module.exports = app;

// Trigger redeployment
