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

    // 1. Check URL query string e.g. ws://localhost:5008?token=JWT_HERE
    const parsedUrl = url.parse(req.url, true);
    if (parsedUrl.query && parsedUrl.query.token) {
      token = parsedUrl.query.token;
      // Handle array query params if passed multiple times
      if (Array.isArray(token)) token = token[0];
    }

    // 2. Fallback to Sec-WebSocket-Protocol or Authorization header
    if (!token && req.headers["authorization"]) {
      const authHeader = req.headers["authorization"];
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      } else {
        token = authHeader;
      }
    }

    if (!token && req.headers["sec-websocket-protocol"]) {
      token = req.headers["sec-websocket-protocol"];
    }

    if (!token) {
      return null;
    }

    // Sanitize token string
    token = token.toString().trim();
    if (token.startsWith('"') && token.endsWith('"')) {
      token = token.slice(1, -1);
    }
    if (token.startsWith("Bearer ")) {
      token = token.substring(7).trim();
    }

    const secret = (process.env.JWT_SECRET || "").trim();
    if (!secret) {
      console.error("❌ [wsAuth] JWT_SECRET environment variable is not set — rejecting connection.");
      return null;
    }

    const decoded = jwt.verify(token, secret);
    return decoded;
  } catch (err) {
    if (err.name === "JsonWebTokenError" && err.message === "invalid signature") {
      console.error(
        "❌ [WebSocket wsAuth] Auth error: invalid signature. (The token in localStorage was signed by a different JWT_SECRET. Please log out and log back in to generate a fresh token)."
      );
    } else {
      console.error("❌ [WebSocket wsAuth] Auth error:", err.message);
    }
    return null;
  }
};

module.exports = { verifyWsToken };
