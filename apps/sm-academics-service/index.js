const express = require('express');
const cors = require('cors');
const compression = require('compression');
require('dotenv').config();

const { connectDB, ensureDbConnection } = require('./configs/db');
const timetableRoutes = require('./routes/timetable.routes');
const examRoutes = require('./routes/exam.routes');
const homeworkRoutes = require('./routes/homework.routes');
const academicYearRoutes = require('./routes/academic-year.routes');
const ptmRoutes = require('./routes/ptm.routes');
const calendarRoutes = require('./routes/calendar.routes');
const syllabusRoutes = require('./routes/syllabus.routes');
const { commonRateLimiter } = require('@sms/shared/middlewares');
const { getCorsOptions } = require('@sms/shared/utils');

const app = express();

// Trust proxy for Vercel / serverless / reverse proxies to resolve client IPs accurately
app.set('trust proxy', 1);

// Unified dynamic CORS configuration
const corsOptions = getCorsOptions();
app.use(cors(corsOptions));

app.use(compression());
app.use(commonRateLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB auto-reconnection middleware - ensures DB is connected before processing requests
app.use(ensureDbConnection);

// Routes (school-specific)
app.use('/api/academics/school/:schoolId', timetableRoutes);
app.use('/api/academics/school/:schoolId', examRoutes);
app.use('/api/academics/school/:schoolId', academicYearRoutes);
app.use('/api/academics/school/:schoolId/homework', homeworkRoutes);
app.use('/api/academics/school/:schoolId/ptm', ptmRoutes);
app.use('/api/academics/school/:schoolId/calendar', calendarRoutes);
app.use('/api/academics/school/:schoolId/syllabus', syllabusRoutes);

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
