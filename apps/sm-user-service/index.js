const express = require('express');
const cors = require('cors');
const compression = require('compression');
require('dotenv').config();

const { connectDB, ensureDbConnection } = require('./configs/db');
const teacherRoutes = require('./routes/teacher.routes');
const studentRoutes = require('./routes/student.routes');
const promotionRoutes = require('./routes/promotion.routes');
const parentRoutes = require('./routes/parent.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const requestRoutes = require('./routes/request.routes');
const classRoutes = require('./routes/class.routes');
const subjectRoutes = require('./routes/subject.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const leaveRoutes = require('./routes/leave.routes');
const uploadRoutes = require('./routes/upload.routes');
const parentPortalRoutes = require('./routes/parent-portal.routes');
const announcementRoutes = require('./routes/announcement.routes');
const notificationRoutes = require('./routes/notification.routes');
const activityLogRoutes = require('./routes/activityLog.routes');
const driverRoutes = require('./routes/driver.routes');
const principalRoutes = require('./routes/principal.routes');
const emailTemplateRoutes = require('./routes/emailTemplate.routes');
const testEmailRoutes = require('./routes/testEmail.routes');
const roleRoutes = require('./routes/role.routes');
const disciplineRoutes = require('./routes/discipline.routes');
const { initCronJobs } = require('./utils/cronJobs');
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

// School-specific user routes (stored in school databases)
app.use('/api/school/:schoolId/teachers', teacherRoutes);
app.use('/api/school/:schoolId/students', studentRoutes);
app.use('/api/school/:schoolId/promotion', promotionRoutes);
app.use('/api/school/:schoolId/parents', parentRoutes);
app.use('/api/school/:schoolId/dashboard', dashboardRoutes);
app.use('/api/school/:schoolId/requests', requestRoutes);
app.use('/api/school/:schoolId/classes', classRoutes);
app.use('/api/school/:schoolId/subjects', subjectRoutes);
app.use('/api/school/:schoolId/attendance', attendanceRoutes);
app.use('/api/school/:schoolId/leave', leaveRoutes);
app.use('/api/school/:schoolId/parent-portal', parentPortalRoutes);
app.use('/api/school/:schoolId/announcements', announcementRoutes);
app.use('/api/school/:schoolId/notifications', notificationRoutes);
app.use('/api/school/:schoolId/logs', activityLogRoutes);
app.use('/api/school/:schoolId/email-templates', emailTemplateRoutes);
app.use('/api/school/:schoolId/drivers', driverRoutes);
app.use('/api/school/:schoolId/principals', principalRoutes);
app.use('/api/school/:schoolId/discipline', disciplineRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/test', testEmailRoutes);
app.use('/api/school/upload', uploadRoutes);

// Health check endpoint
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is running' });
});
app.get("/", (_req, res) => {
    res.send(`🚀 Server is running Securely`);
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
    console.log(`🚀 sm-user-service running on port ${PORT}`);
    try {
        await connectDB();
        initCronJobs();
    } catch (error) {
        console.error('⚠️ Initial database connection warning:', error.message);
    }
});

module.exports = app;
