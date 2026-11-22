const { matchOrigin } = require('./originMatcher');

const DEFAULT_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:*',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:*',
    'https://demoschool.smsedusolutions.in',
    'http://demoschool.smsedusolutions.in',
    'https://smsedusolutions.in',
    'https://www.smsedusolutions.in',
    'https://*.smsedusolutions.in',
    'https://*smsedusolutions.in',
    '*.smsedusolutions.in',
    'https://smsedusolutions.vercel.app',
    'https://sms-web-ui.vercel.app',
    'https://*.vercel.app',
    'https://*vercel.app',
    '*.vercel.app',
];

/**
 * Resolves the merged list of allowed origins from defaults, environment variables (ALLOWED_ORIGIN / ALLOWED_ORIGINS), and custom additions.
 * @param {string[]|string} [customOrigins]
 * @returns {string[]}
 */
function getAllowedOrigins(customOrigins = []) {
    const envVars = [
        process.env.ALLOWED_ORIGIN,
        process.env.ALLOWED_ORIGINS,
        process.env.CORS_ORIGIN,
        process.env.CORS_ORIGINS,
        process.env.FRONTEND_URL,
        process.env.CLIENT_URL,
    ];

    const parsedEnv = envVars
        .filter(Boolean)
        .flatMap(val => (typeof val === 'string' ? val.split(',') : []))
        .map(url => url.trim().replace(/^["']|["']$/g, '').replace(/\/+$/, ''))
        .filter(Boolean);

    const extra = Array.isArray(customOrigins) ? customOrigins : (customOrigins ? [customOrigins] : []);
    const merged = [...DEFAULT_ALLOWED_ORIGINS, ...parsedEnv, ...extra];
    return Array.from(new Set(merged.filter(Boolean)));
}

/**
 * Checks if a specific origin is permitted.
 * @param {string} origin
 * @param {string[]|string} [customOrigins]
 * @returns {boolean}
 */
function isOriginAllowed(origin, customOrigins = []) {
    // Requests with no origin (mobile apps, Postman, curl, server-to-server) are always permitted
    if (!origin) return true;

    const normOrigin = String(origin).trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '').toLowerCase();

    // Direct in-code hardcoded whitelist for immediate resolution
    if (
        normOrigin === 'https://demoschool.smsedusolutions.in' ||
        normOrigin === 'http://demoschool.smsedusolutions.in' ||
        normOrigin === 'https://www.smsedusolutions.in' ||
        normOrigin === 'http://www.smsedusolutions.in' ||
        normOrigin === 'https://smsedusolutions.in' ||
        normOrigin === 'http://smsedusolutions.in' ||
        normOrigin === 'https://smsedusolutions.vercel.app' ||
        normOrigin === 'https://sms-web-ui.vercel.app' ||
        normOrigin.endsWith('.smsedusolutions.in') ||
        normOrigin.endsWith('.vercel.app')
    ) {
        return true;
    }

    const allowedList = getAllowedOrigins(customOrigins);
    return allowedList.some(pattern => matchOrigin(origin, pattern));
}

/**
 * Returns a complete, production-ready CORS configuration object for the `cors` package.
 * @param {Object} [customOptions]
 * @returns {Object}
 */
function getCorsOptions(customOptions = {}) {
    const { allowedOrigins: extraOrigins, ...otherOptions } = customOptions;

    return {
        origin: (origin, callback) => {
            if (isOriginAllowed(origin, extraOrigins)) {
                return callback(null, true);
            }
            console.warn(`[CORS] Blocked request from unlisted origin: "${origin}"`);
            // Return null, false to reject origin without throwing 500 error
            return callback(null, false);
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-Requested-With',
            'Accept',
            'Origin',
            'Cache-Control',
            'Pragma',
            'X-School-Id',
            'X-User-Role',
            'X-Forwarded-For',
            'RateLimit-Limit',
            'RateLimit-Remaining',
            'RateLimit-Reset',
            'sentry-trace',
            'baggage',
            'x-client-version',
        ],
        exposedHeaders: [
            'Content-Range',
            'X-Content-Range',
            'RateLimit-Limit',
            'RateLimit-Remaining',
            'RateLimit-Reset',
            'Retry-After',
        ],
        credentials: true,
        optionsSuccessStatus: 200,
        ...otherOptions,
    };
}

module.exports = {
    DEFAULT_ALLOWED_ORIGINS,
    getAllowedOrigins,
    isOriginAllowed,
    getCorsOptions,
};
