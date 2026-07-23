const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { matchOrigin } = require('@sms/shared/utils');

const { connectDB, ensureDbConnection } = require('./configs/db');
const schoolRoutes = require('./routes/school.routes');
const userRoutes = require('./routes/user.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const uploadRoutes = require('./routes/upload.routes');
const { commonRateLimiter } = require('@sms/shared/middlewares');

const app = express();

// CORS Configuration
const allowedUrls = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((url) => url.trim())
  : [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://sms-web-ui.vercel.app",
  ];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin || allowedUrls.some(url => matchOrigin(origin, url))) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOptions));
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

// Trigger redeployment
