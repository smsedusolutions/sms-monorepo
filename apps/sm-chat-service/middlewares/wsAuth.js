const jwt = require("jsonwebtoken");
const url = require("url");

/**
 * Authenticates a WebSocket connection using JWT from query parameter `token` or Authorization header.
 * @param {import('http').IncomingMessage} req 
 * @returns {object|null} Decoded user payload or null if unauthorized
 */
const verifyWsToken = (req) => {
  try {
    let token = null;

    // 1. Check URL query string e.g. ws://localhost:5007?token=JWT_HERE
    const parsedUrl = url.parse(req.url, true);
    if (parsedUrl.query && parsedUrl.query.token) {
      token = parsedUrl.query.token;
    }

    // 2. Fallback to Sec-WebSocket-Protocol or Authorization header
    if (!token && req.headers["authorization"]) {
      const authHeader = req.headers["authorization"];
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return null;
    }

    const secret = process.env.JWT_SECRET || "wertyujikjnb";
    const decoded = jwt.verify(token, secret);
    return decoded;
  } catch (err) {
    console.error("❌ WebSocket auth error:", err.message);
    return null;
  }
};

module.exports = { verifyWsToken };
