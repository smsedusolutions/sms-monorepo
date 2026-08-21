const express = require("express");
const router = express.Router();

const { login, verifyToken, createAdmin, requestSuperAdminOtp, confirmSuperAdminOtp } = require("../controllers/auth.controller");
const { Authenticated, authorizeRoles, authRateLimiter, strictRateLimiter } = require("@sms/shared/middlewares");

// Public routes (rate-limited for security)
router.post("/login", authRateLimiter, login); // Unified login for all user types (20 attempts / 15m)
router.post("/super-admin/request-otp", strictRateLimiter, requestSuperAdminOtp); // 5 attempts / 15m
router.post("/super-admin/confirm-otp", strictRateLimiter, confirmSuperAdminOtp); // 5 attempts / 15m

// Protected routes
router.get("/verify-token", Authenticated, verifyToken);
router.post("/create-admin", Authenticated, authorizeRoles("super_admin"), createAdmin);

module.exports = router;
