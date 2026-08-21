const express = require('express');
const router = express.Router({ mergeParams: true });
const { Authenticated, authorizeRoles } = require('@sms/shared/middlewares');
const {
    getCalendarEvents,
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
} = require('../controllers/calendar.controller');

// Get calendar events (All authenticated users - filtered by role)
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

// Update calendar event (Admin & Principal)
router.put(
    '/:eventId',
    Authenticated,
    authorizeRoles('sch_admin', 'principal'),
    updateCalendarEvent
);

// Delete calendar event (Admin & Principal)
router.delete(
    '/:eventId',
    Authenticated,
    authorizeRoles('sch_admin', 'principal'),
    deleteCalendarEvent
);

module.exports = router;
