const mongoose = require("mongoose");

// Global connection cache for serverless
let cachedConnection = null;
let reconnecting = false;

const connectDB = async () => {
  // Return cached connection if exists (CRITICAL for serverless)
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log("✅ Using cached MongoDB connection");
    return cachedConnection;
  }

  // Prevent multiple simultaneous reconnection attempts
  if (reconnecting) {
    console.log("⏳ Reconnection already in progress...");
    // Wait for ongoing reconnection
    await new Promise(resolve => setTimeout(resolve, 1000));
    return connectDB();
  }

  try {
    reconnecting = true;

    // Serverless-optimized connection options with auto-reconnection
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

    console.log("🔄 Connecting to MongoDB...");
    console.log("MONGO_URI exists:", !!process.env.MONGO_URI);
    console.log("MONGO_URI prefix:", process.env.MONGO_URI?.substring(0, 30) + "...");

    const connection = await mongoose.connect(process.env.MONGO_URI, options);

    cachedConnection = connection;
    reconnecting = false;
    console.log("✅ MongoDB Connected Successfully");

    // Connection event listeners with auto-reconnection
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected - will auto-reconnect on next request');
      cachedConnection = null;
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
      cachedConnection = null;
      reconnecting = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected successfully');
      cachedConnection = mongoose.connection;
    });

    return connection;
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    cachedConnection = null;
    reconnecting = false;

    if (error.code === "ENOTFOUND" || error.name === "MongoServerSelectionError") {
      console.log("⏳ [sm-user-service] Retrying MongoDB connection in 3s...");
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return connectDB();
    }
    throw error;
  }
};

/**
 * Middleware to ensure MongoDB connection before processing requests
 * Automatically reconnects if disconnected
 */
const ensureDbConnection = async (req, res, next) => {
  try {
    // Check if connection is active
    if (mongoose.connection.readyState !== 1) {
      console.log('🔄 MongoDB disconnected, reconnecting...');
      await connectDB();
    }
    next();
  } catch (error) {
    console.error('❌ Failed to establish MongoDB connection:', error);
    return res.status(503).json({
      success: false,
      message: 'Database connection unavailable. Please try again.',
      error: error.message
    });
  }
};

// Cache for school database connections
const schoolDbConnections = {};

/**
 * Get a connection to a specific school's database
 * @param {string} schoolDbName - The school database name (e.g., 'school-db-myschool')
 * @returns {mongoose.Connection} - A mongoose connection to the school's database
 */
const getSchoolDbConnection = (schoolDbName) => {
  if (!schoolDbName) {
    throw new Error("schoolDbName is required");
  }

  // Return cached connection if exists
  if (schoolDbConnections[schoolDbName]) {
    return schoolDbConnections[schoolDbName];
  }

  // Ensure main connection exists
  if (mongoose.connection.readyState !== 1) {
    throw new Error("Main MongoDB connection is not established. Call connectDB() first.");
  }

  // Create a new connection to the school's database using useDb()
  // useDb() shares the same connection pool as the main connection
  const schoolConnection = mongoose.connection.useDb(schoolDbName, { useCache: true });

  // Cache the connection
  schoolDbConnections[schoolDbName] = schoolConnection;

  return schoolConnection;
};

// Export the connection functions
module.exports = { connectDB, getSchoolDbConnection, ensureDbConnection };