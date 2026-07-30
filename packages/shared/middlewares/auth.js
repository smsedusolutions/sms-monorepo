const jwt = require("jsonwebtoken");

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
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "wertyujikjnb");
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
