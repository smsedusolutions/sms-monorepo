/**
 * Middleware to protect internal service-to-service endpoints.
 * Requires header `X-Internal-Secret` matching `process.env.INTERNAL_SECRET`.
 */
const internalAuth = (req, res, next) => {
  const secretHeader =
    req.headers["x-internal-secret"] || req.headers["X-Internal-Secret"];

  const expectedSecret = process.env.INTERNAL_SECRET;

  if (!expectedSecret) {
    console.error("❌ [internalAuth] INTERNAL_SECRET not configured on server.");
    return res.status(500).json({
      success: false,
      message: "Internal authentication misconfigured",
    });
  }

  if (!secretHeader || secretHeader !== expectedSecret) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Invalid or missing internal authentication token",
    });
  }

  next();
};

module.exports = { internalAuth };
