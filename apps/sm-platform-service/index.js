const express = require("express");
const cors = require("cors");
const compression = require("compression");
require("dotenv").config();

const { connectDB, ensureDbConnection } = require('./configs/db');
const schoolRoutes = require('./routes/school.routes');
const userRoutes = require('./routes/user.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const uploadRoutes = require('./routes/upload.routes');
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

app.use('/api/admin/school', schoolRoutes);
app.use('/api/admin/user', userRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/admin/upload', uploadRoutes);

// Health check endpoint
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});
app.get("/", (_req, res) => {
  res.send(`🚀 Platform Service is running`);
});

// Start server
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Platform Service is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to database:", error.message);
    process.exit(1);
  });

module.exports = app;
