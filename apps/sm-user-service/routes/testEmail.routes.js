const express = require('express');
const router = express.Router();
const { sendTestEmail, verifyEmailConfig } = require('../controllers/testEmail.controller');
const { Authenticated, authorizeRoles } = require('@sms/shared/middlewares');

// SECURITY: These endpoints were unauthenticated — anyone could send phishing emails.
// Now restricted to authenticated school admins and super admins only.

// Test email sending — requires admin authentication
router.post('/send-email', Authenticated, authorizeRoles('sch_admin', 'super_admin'), sendTestEmail);

// Verify email configuration — requires admin authentication
router.get('/verify-email-config', Authenticated, authorizeRoles('sch_admin', 'super_admin'), verifyEmailConfig);

module.exports = router;
