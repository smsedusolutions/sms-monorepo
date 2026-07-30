const mongoose = require("mongoose");

let cachedConnection = null;
let reconnecting = false;

const connectDB = async () => {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log("✅ [sm-chat-service] Using cached MongoDB connection");
    return cachedConnection;
  }

  if (reconnecting) {
    console.log("⏳ [sm-chat-service] Reconnection already in progress...");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return connectDB();
  }

  try {
    reconnecting = true;

    const options = {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 90000,
      maxPoolSize: 10,
      minPoolSize: 1,
      maxIdleTimeMS: 10000,
      retryWrites: true,
      retryReads: true,
      autoCreate: true,
      autoIndex: true,
    };

    const mongoUri = process.env.CHAT_MONGO_URI || process.env.MONGO_URI;
    console.log("🔄 [sm-chat-service] Connecting to Dedicated Chat MongoDB...");
    const connection = await mongoose.connect(mongoUri, options);

    cachedConnection = connection;
    reconnecting = false;
    console.log("✅ [sm-chat-service] MongoDB Connected Successfully");

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️ [sm-chat-service] MongoDB disconnected - will auto-reconnect on next request");
      cachedConnection = null;
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ [sm-chat-service] MongoDB connection error:", err.message);
      cachedConnection = null;
      reconnecting = false;
    });

    return connection;
  } catch (error) {
    console.error("❌ [sm-chat-service] MongoDB Connection Error:", error.message);
    cachedConnection = null;
    reconnecting = false;

    // Retry connection after 3s for DNS/network blips
    if (error.code === "ENOTFOUND" || error.name === "MongoServerSelectionError") {
      console.log("⏳ [sm-chat-service] Retrying Mongo connection in 3s...");
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return connectDB();
    }
    throw error;
  }
};

const ensureDbConnection = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    next();
  } catch (error) {
    return res.status(503).json({
      success: false,
      message: "Database connection unavailable.",
      error: error.message,
    });
  }
};

module.exports = { connectDB, ensureDbConnection };
