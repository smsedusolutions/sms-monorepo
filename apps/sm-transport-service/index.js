// apps/sm-transport-service/index.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB, ensureDbConnection } = require('./configs/db');
const transportRoutes = require('./routes/transport.routes');
const vehicleRoutes = require('./routes/vehicle.routes');
const { commonRateLimiter } = require('@sms/shared/middlewares');
const { initSocket } = require('./utils/socketManager');
const { initCronJobs } = require('./utils/cronJobs');
const { matchOrigin } = require('@sms/shared/utils');
const http = require('http');

const app = express();

// CORS Configuration
const allowedUrls = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(url => url.trim())
    : ['http://localhost:3000', 'http://localhost:5173', "https://sms-web-ui.vercel.app"];

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedUrls.some(url => matchOrigin(origin, url))) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    credentials: true,
    optionsSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOptions));
app.use(commonRateLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure DB connection before handling requests
app.use(ensureDbConnection);

// Transport routes – scoped per school
app.use('/api/transport/school/:schoolId', transportRoutes);
app.use('/api/transport/school/:schoolId/vehicles', vehicleRoutes);

// Health check endpoint
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'OK', message: 'Transport Service is running' });
});

// Root endpoint
app.get('/', (_req, res) => {
    res.send('🚌 SMS Transport Service is running securely');
});

const PORT = process.env.PORT || 5004;

const server = http.createServer(app);
const io = initSocket(server);

connectDB()
    .then(() => {
        server.listen(PORT, () => {
            console.log(`🚌 Transport Service (Socket + API) is running on port ${PORT}`);
            initCronJobs();
        });
    })
    .catch(error => {
        console.error('Failed to connect to database:', error.message);
        process.exit(1);
    });

module.exports = app;

// Trigger redeployment
