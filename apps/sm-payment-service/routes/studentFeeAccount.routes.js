const express = require('express');
const router = express.Router({ mergeParams: true });
const { Authenticated, authorizeRoles } = require('@sms/shared/middlewares');
const { paginate } = require('../utils/pagination');

const {
    assignStructure,
    getAccounts,
    getAccountById,
    getAccountsByStudent,
    updateAccountNotes,
    freezeAccount,
    unfreezeAccount
} = require('../controllers/studentFeeAccount.controller');

// Apply auth globally
router.use(Authenticated);

// Assign Structure to Class/Students (Admin only)
router.post(
    '/structures/:structureId/assign',
    authorizeRoles('sch_admin'),
    assignStructure
);

// Get all ledgers (Admin & Principal)
router.get(
    '/',
    authorizeRoles('sch_admin', 'principal'),
    paginate,
    getAccounts
);

// Get student ledgers (Admin, Principal, Student, and Parent allowed)
// NOTE: must be registered BEFORE /:accountId to prevent Express
// from matching "student" as an accountId value.
router.get(
    '/student/:studentId',
    authorizeRoles('sch_admin', 'student', 'parent', 'principal'),
    getAccountsByStudent
);

// Get account details by ID (Admin & Principal)
router.get(
    '/:accountId',
    authorizeRoles('sch_admin', 'principal'),
    getAccountById
);

// Notes update (Admin only)
router.patch(
    '/:accountId/notes',
    authorizeRoles('sch_admin'),
    updateAccountNotes
);

// Freeze ledger (Admin only)
router.patch(
    '/:accountId/freeze',
    authorizeRoles('sch_admin'),
    freezeAccount
);

// Unfreeze ledger (Admin only)
router.patch(
    '/:accountId/unfreeze',
    authorizeRoles('sch_admin'),
    unfreezeAccount
);

module.exports = router;
