const express = require('express');
const router = express.Router({ mergeParams: true });
const { Authenticated, authorizeRoles } = require('@sms/shared/middlewares');
const {
    getCalendarEvents,
    createCalendarEvent,
    deleteCalendarEvent,
} = require('../controllers/calendar.controller');

// Get calendar events (All authenticated users)
router.get(
    '/',
    Authenticated,
    getCalendarEvents
);

// Create calendar event (Admin & Principal)
router.post(
    '/',
    Authenticated,
    authorizeRoles('sch_admin', 'principal'),
    createCalendarEvent
);

// Delete calendar event
router.delete(
    '/:eventId',
    Authenticated,
    authorizeRoles('sch_admin', 'principal'),
    deleteCalendarEvent
);

module.exports = router;
