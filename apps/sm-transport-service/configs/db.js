// apps/sm-transport-service/configs/db.js

const mongoose = require('mongoose');

// Global connection cache for serverless environments
let cachedConnection = null;
let reconnecting = false;

/**
 * Connect to the main MongoDB instance.
 * Returns a cached connection if already established.
 */
const connectDB = async () => {
    if (cachedConnection && mongoose.connection.readyState === 1) {
        console.log('✅ Using cached MongoDB connection (transport service)');
        return cachedConnection;
    }

    if (reconnecting) {
        console.log('⏳ Reconnection already in progress...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        return connectDB();
    }

    try {
        reconnecting = true;
        const options = {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 90000,
            maxPoolSize: 25,
            minPoolSize: 5,
            maxIdleTimeMS: 30000,
            retryWrites: true,
            retryReads: true,
            autoCreate: true,
            autoIndex: true,
        };
        console.log('🔄 Connecting to MongoDB (transport service)...');
        console.log('MONGO_URI exists:', !!process.env.MONGO_URI);
        const connection = await mongoose.connect(process.env.MONGO_URI, options);
        cachedConnection = connection;
        reconnecting = false;
        console.log('✅ MongoDB Connected Successfully (transport service)');

        // Event listeners for auto‑reconnect handling
        mongoose.connection.on('disconnected', () => {
            console.log('⚠️ MongoDB disconnected - will auto-reconnect on next request');
            cachedConnection = null;
        });
        mongoose.connection.on('error', err => {
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
        console.error('❌ MongoDB Connection Error:', error.message);
        cachedConnection = null;
        reconnecting = false;
        throw error;
    }
};

/** Middleware to ensure a live DB connection before handling a request */
const ensureDbConnection = async (req, res, next) => {
    try {
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
            error: error.message,
        });
    }
};

// Cache for per‑school database connections
const schoolDbConnections = {};

/**
 * Retrieve a mongoose connection scoped to a specific school's database.
 * @param {string} schoolDbName - The name of the school's DB (e.g., 'school-db-abc').
 */
const getSchoolDbConnection = (schoolDbName) => {
    if (!schoolDbName) {
        throw new Error('schoolDbName is required');
    }
    if (schoolDbConnections[schoolDbName]) {
        return schoolDbConnections[schoolDbName];
    }
    if (mongoose.connection.readyState !== 1) {
        throw new Error('Main MongoDB connection is not established. Call connectDB() first.');
    }
    const schoolConnection = mongoose.connection.useDb(schoolDbName, { useCache: true });
    schoolDbConnections[schoolDbName] = schoolConnection;
    return schoolConnection;
};

module.exports = { connectDB, getSchoolDbConnection, ensureDbConnection };
