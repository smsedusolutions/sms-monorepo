require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const compression = require("compression");
const { getCorsOptions } = require("@sms/shared/utils");
const { commonRateLimiter } = require("@sms/shared/middlewares");

console.log(
  "🔑 [sm-notification-service] Active JWT_SECRET prefix:",
  process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 4) + "****" : "MISSING"
);

const { connectDB, ensureDbConnection } = require("./configs/db");
const pushRoutes = require("./routes/push.routes");
const internalRoutes = require("./routes/internal.routes");
const { initWebSocketGateway } = require("./websocket/wsGateway");
const { initVapid } = require("./utils/webPush");

const app = express();

// Trust proxy for reverse proxies / serverless / hosting providers
app.set("trust proxy", 1);

// Unified dynamic CORS configuration
const corsOptions = getCorsOptions();
app.use(cors(corsOptions));

app.use(compression());
app.use(commonRateLimiter);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// MongoDB auto-reconnection middleware
app.use(ensureDbConnection);

// Health Check Endpoint
app.get("/health", (_req, res) => {
  return res.status(200).json({
    status: "ok",
    service: "sm-notification-service",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (_req, res) => {
  res.send("🚀 Notification & Web Push Service is running Securely");
});

// Mount Routes
app.use("/api/push", pushRoutes);
app.use("/push", pushRoutes);
app.use("/api/internal", internalRoutes);
app.use("/internal", internalRoutes);

// Global Error Handler
app.use((err, _req, res, _next) => {
  console.error("❌ [sm-notification-service] Global Error:", err);
  return res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5008;

// Create HTTP Server & Attach WebSockets Gateway
const server = http.createServer(app);
initWebSocketGateway(server);

// Connect Database and Start Listening
connectDB()
  .then(() => {
    initVapid();
    server.listen(PORT, () => {
      console.log(`===========================================`);
      console.log(`🔔 sm-notification-service running on port ${PORT}`);
      console.log(`⚡ WebSocket Gateway active on ws://localhost:${PORT}`);
      console.log(`===========================================`);
    });
  })
  .catch((error) => {
    console.error("❌ Failed to connect to database:", error.message);
    process.exit(1);
  });

module.exports = app;
