// apps/sm-transport-service/index.js

const express = require('express');
const cors = require('cors');
const compression = require('compression');
require('dotenv').config();

const { connectDB, ensureDbConnection } = require('./configs/db');
const transportRoutes = require('./routes/transport.routes');
const vehicleRoutes = require('./routes/vehicle.routes');
const { commonRateLimiter } = require('@sms/shared/middlewares');
const { initSocket } = require('./utils/socketManager');
const { initCronJobs } = require('./utils/cronJobs');
const { getCorsOptions } = require('@sms/shared/utils');
const http = require('http');

const app = express();

// Trust proxy for Vercel / serverless / reverse proxies to resolve client IPs accurately
app.set('trust proxy', 1);

// Unified dynamic CORS Configuration
const corsOptions = getCorsOptions();
app.use(cors(corsOptions));

app.use(compression());
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
