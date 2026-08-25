const rateLimit = require('express-rate-limit');

/**
 * Robust IP resolver for serverless, reverse-proxies (Vercel, Railway, Nginx), and local environments.
 */
function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded && typeof forwarded === 'string') {
        return forwarded.split(',')[0].trim();
    }
    return req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '127.0.0.1';
}

/**
 * Determines whether a request should bypass rate limiting.
 * Always skips OPTIONS preflight requests to prevent CORS handshake breakage.
 */
function shouldSkip(req) {
    // 1. Never rate-limit CORS preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
        return true;
    }

    // 2. Global disable flags for development, tests, or admin overrides
    if (
        process.env.DISABLE_RATE_LIMIT === 'true' ||
        process.env.SKIP_RATE_LIMIT === 'true' ||
        process.env.NODE_ENV === 'test'
    ) {
        return true;
    }

    // 3. Skip loopback addresses in local development
    const ip = getClientIp(req);
    return ip === '::1' || ip === '127.0.0.1' || ip.includes('::ffff:127.0.0.1');
}

/**
 * Standard 429 JSON response handler
 */
function rateLimitHandler(req, res, _next, options) {
    const retryAfterSeconds = Math.ceil(options.windowMs / 1000);
    res.setHeader('Retry-After', retryAfterSeconds);
    return res.status(options.statusCode || 429).json({
        success: false,
        message: typeof options.message === 'string'
            ? options.message
            : (options.message?.message || "Too many requests from this IP, please try again later."),
        retryAfter: retryAfterSeconds,
    });
}

/**
 * Common rate limiter middleware for all standard API routes
 * Default: 2000 requests per 15 minutes per IP (supports busy SPA dashboards with concurrent polling)
 */
const commonRateLimiter = rateLimit({
    windowMs: parseInt(process.env.COMMON_RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.COMMON_RATE_LIMIT_MAX || process.env.RATE_LIMIT_MAX, 10) || 2000,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => getClientIp(req),
    skip: shouldSkip,
    handler: rateLimitHandler,
    validate: { trustProxy: false },
    message: "Too many requests from this IP, please try again after 15 minutes",
});

/**
 * Auth rate limiter for login endpoints
 * Default: 30 attempts per 15 minutes per IP
 */
const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 30,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => getClientIp(req),
    skip: shouldSkip,
    handler: rateLimitHandler,
    validate: { trustProxy: false },
    message: "Too many login attempts from this IP, please try again after 15 minutes",
});

/**
 * Stricter rate limiter for sensitive operations (OTP requests, password resets)
 * Default: 10 attempts per 15 minutes per IP
 */
const strictRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: parseInt(process.env.STRICT_RATE_LIMIT_MAX, 10) || 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => getClientIp(req),
    skip: shouldSkip,
    handler: rateLimitHandler,
    validate: { trustProxy: false },
    message: "Too many attempts for this sensitive action, please try again after 15 minutes",
});

module.exports = {
    getClientIp,
    shouldSkip,
    commonRateLimiter,
    authRateLimiter,
    strictRateLimiter,
};
