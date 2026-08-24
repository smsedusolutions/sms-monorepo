const jwt = require("jsonwebtoken");

// SECURITY (Secret Key Leak): Fail loudly at startup if JWT_SECRET is not configured.
// The fallback 'wertyujikjnb' was a known-weak hardcoded value; it has been removed.
if (!process.env.JWT_SECRET) {
    throw new Error(
        '[auth middleware] JWT_SECRET environment variable is not set. ' +
        'Set a strong random secret (min 32 chars) in your .env file.'
    );
}

/**
 * Middleware to check if user is authenticated
 * Verifies JWT token from Authorization header and attaches decoded user to req.user
 */
const checkAuth = (req, res, next) => {
    const auth = req.headers["authorization"] || req.headers["Authorization"];
    if (!auth || !auth.startsWith("Bearer")) {
        return res
            .status(403)
            .json({ message: "Unauthorized, JWT token is required" });
    }
    try {
        const token = auth.split(" ")[1];
        if (!token) {
            return res
                .status(403)
                .json({ message: "Unauthorized, JWT token is missing" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res
            .status(403)
            .json({ message: "Unauthorized, JWT token is invalid or expired" });
    }
};

// Alias for backward compatibility
const Authenticated = checkAuth;

module.exports = { checkAuth, Authenticated };
