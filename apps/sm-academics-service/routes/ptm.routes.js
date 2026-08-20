const express = require('express');
const router = express.Router({ mergeParams: true });
const { Authenticated, authorizeRoles } = require('@sms/shared/middlewares');
const {
    createPTMSession,
    getAllPTMSessions,
    getPTMForParent,
    getPTMSlots,
    bookPTMSlot,
    getPTMForTeacher,
} = require('../controllers/ptm.controller');

// Create PTM session (Admin)
router.post(
    '/',
    Authenticated,
    authorizeRoles('sch_admin', 'principal'),
    createPTMSession
);

// Get all PTM sessions (Admin / List)
router.get(
    '/',
    Authenticated,
    getAllPTMSessions
);

// Get PTM sessions for parent
router.get(
    '/parent/:parentId',
    Authenticated,
    getPTMForParent
);

// Get available slots for a session
router.get(
    '/:sessionId/slots',
    Authenticated,
    getPTMSlots
);

// Book a slot (Parent)
router.post(
    '/:sessionId/book',
    Authenticated,
    authorizeRoles('parent', 'sch_admin'),
    bookPTMSlot
);

// Get sessions for teacher
router.get(
    '/teacher/:teacherId',
    Authenticated,
    authorizeRoles('teacher', 'sch_admin', 'principal'),
    getPTMForTeacher
);

module.exports = router;
