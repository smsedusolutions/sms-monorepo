require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const compression = require("compression");
const { getCorsOptions } = require("@sms/shared/utils");
const { commonRateLimiter } = require("@sms/shared/middlewares");

console.log("🔑 [sm-chat-service] Active JWT_SECRET prefix:", process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 4) + "****" : "MISSING");

const { connectDB } = require("./configs/db");
const keyRoutes = require("./routes/key.routes");
const roomRoutes = require("./routes/room.routes");
const attachmentRoutes = require("./routes/attachment.routes");
const { initWebSocketGateway } = require("./websocket/wsGateway");

const app = express();

// Trust proxy for reverse proxies / serverless / hosting providers
app.set("trust proxy", 1);

// Unified dynamic CORS configuration
const corsOptions = getCorsOptions();
app.use(cors(corsOptions));

app.use(compression());
app.use(commonRateLimiter);
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Health Check Endpoint
app.get("/health", (req, res) => {
  return res.status(200).json({
    status: "ok",
    service: "sm-chat-service",
    timestamp: new Date().toISOString(),
  });
});

// REST API Routes
app.use("/api/chat/keys", keyRoutes);
app.use("/api/chat/rooms", roomRoutes);
app.use("/api/chat/attachments", attachmentRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("❌ [sm-chat-service] Global Error:", err);
  return res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5007;

// Create HTTP Server & Attach WebSockets Gateway
const server = http.createServer(app);
initWebSocketGateway(server);

// Connect Database and Start Listening
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`===========================================`);
      console.log(`💬 sm-chat-service running on port ${PORT}`);
      console.log(`⚡ WebSocket Gateway active on ws://localhost:${PORT}`);
      console.log(`===========================================`);
    });
  })
  .catch((error) => {
    console.error("❌ Failed to connect to database:", error.message);
    process.exit(1);
  });

module.exports = app;
