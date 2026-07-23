const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { matchOrigin } = require('@sms/shared/utils');

const { connectDB, ensureDbConnection } = require('./configs/db');
const { commonRateLimiter } = require('@sms/shared/middlewares');

// Router imports
const feeCategoryRoutes = require('./routes/feeCategory.routes');
const feeStructureRoutes = require('./routes/feeStructure.routes');
const studentFeeAccountRoutes = require('./routes/studentFeeAccount.routes');
const feeTransactionRoutes = require('./routes/feeTransaction.routes');
const feeReceiptRoutes = require('./routes/feeReceipt.routes');
const feeDiscountRoutes = require('./routes/feeDiscount.routes');
const studentDiscountRoutes = require('./routes/studentDiscount.routes');
const feeAdjustmentRoutes = require('./routes/feeAdjustment.routes');
const feeDashboardRoutes = require('./routes/feeDashboard.routes');

const app = express();

// CORS Configuration
const allowedUrls = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(url => url.trim())
    : ['http://localhost:3000', 'http://localhost:5173', 'https://sms-web-ui.vercel.app'];

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

// Middlewares
app.use(cors(corsOptions));
app.use(commonRateLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure database connection middleware
app.use(ensureDbConnection);

// School-specific Fee Management routes
app.use('/api/school/:schoolId/fees/categories', feeCategoryRoutes);
app.use('/api/school/:schoolId/fees/structures', feeStructureRoutes);
app.use('/api/school/:schoolId/fees/assignments', studentFeeAccountRoutes);
app.use('/api/school/:schoolId/fees/payments', feeTransactionRoutes);
app.use('/api/school/:schoolId/fees/receipts', feeReceiptRoutes);
app.use('/api/school/:schoolId/fees/discounts', feeDiscountRoutes);
app.use('/api/school/:schoolId/fees/student-discounts', studentDiscountRoutes);
app.use('/api/school/:schoolId/fees/adjustments', feeAdjustmentRoutes);
app.use('/api/school/:schoolId/fees/dashboard', feeDashboardRoutes);

// Health Check
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'OK', message: 'Payment Service is running' });
});
app.get('/', (_req, res) => {
    res.send('🚀 Payment Service is running Securely on Port 5005');
});

// Start Server
const PORT = process.env.PORT || 5005;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Payment Service is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Failed to connect to database:', error.message);
        process.exit(1);
    });

module.exports = app;

// Trigger redeployment
