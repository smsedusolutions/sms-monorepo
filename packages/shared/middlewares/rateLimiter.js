const rateLimit = require('express-rate-limit');

/**
 * Common rate limiter middleware for all services
 * Default: 100 requests per 15 minutes per IP
 */
const commonRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per 15 minutes (avoids rate limiting active SPA dashboards)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        success: false,
        message: "Too many requests from this IP, please try again after 15 minutes",
    },
    // Skip rate limiting for localhost and loopback addresses
    skip: (req) => {
        const ip = req.ip || req.connection.remoteAddress;
        return ip === '::1' || ip === '127.0.0.1' || ip.includes('::ffff:127.0.0.1');
    },
});

/**
 * Auth rate limiter for login endpoints
 * Default: 20 requests per 15 minutes per IP
 */
const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many login attempts from this IP, please try again after 15 minutes",
    },
    skip: (req) => {
        const ip = req.ip || req.connection.remoteAddress;
        return ip === '::1' || ip === '127.0.0.1' || ip.includes('::ffff:127.0.0.1');
    },
});

/**
 * Stricter rate limiter for sensitive operations (OTP, etc.)
 * Default: 5 requests per 15 minutes per IP
 */
const strictRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many attempts, please try again after 15 minutes",
    },
    skip: (req) => {
        const ip = req.ip || req.connection.remoteAddress;
        return ip === '::1' || ip === '127.0.0.1' || ip.includes('::ffff:127.0.0.1');
    },
});

module.exports = {
    commonRateLimiter,
    authRateLimiter,
    strictRateLimiter
};
