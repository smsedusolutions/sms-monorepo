const express = require('express');
const router = express.Router({ mergeParams: true });
const { Authenticated, authorizeRoles } = require('@sms/shared/middlewares');
const { paginate } = require('../utils/pagination');

const {
    recordPayment,
    getPayments,
    getPaymentById,
    getPaymentsByStudent,
    issueRefund
} = require('../controllers/feePayment.controller');

// Apply auth globally
router.use(Authenticated);

// Record a payment (Admin & Principal)
router.post(
    '/',
    authorizeRoles('sch_admin', 'principal'),
    recordPayment
);

// List all payments (Admin & Principal)
router.get(
    '/',
    authorizeRoles('sch_admin', 'principal'),
    paginate,
    getPayments
);

// Get student's payments (Admin, Principal, Student, and Parent allowed)
router.get(
    '/student/:studentId',
    authorizeRoles('sch_admin', 'student', 'parent', 'principal'),
    getPaymentsByStudent
);

// Get single payment details (Admin, Principal, Student, and Parent allowed)
router.get(
    '/:transactionId',
    authorizeRoles('sch_admin', 'student', 'parent', 'principal'),
    getPaymentById
);

// Process a refund (Admin only)
router.post(
    '/:paymentId/refund',
    authorizeRoles('sch_admin'),
    issueRefund
);

module.exports = router;
