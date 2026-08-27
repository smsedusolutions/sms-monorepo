const express = require('express');
const router = express.Router({ mergeParams: true });
const { Authenticated } = require('@sms/shared/middlewares');
const {
    getMyNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    sendChatInviteNotification,
    broadcastNotification,
} = require('../controllers/notification.controller');

// Broadcast notification to all school users & devices (Admin / Principal only)
router.post(
    '/broadcast',
    Authenticated,
    broadcastNotification
);

// Get my notifications (All authenticated users)
router.get(
    '/',
    Authenticated,
    getMyNotifications
);

// Get unread count (for bell icon badge)
router.get(
    '/unread-count',
    Authenticated,
    getUnreadCount
);

// Mark all as read
router.put(
    '/mark-all-read',
    Authenticated,
    markAllAsRead
);

// Mark single notification as read
router.put(
    '/:notificationId/read',
    Authenticated,
    markAsRead
);

// Send chat invitation notification
router.post(
    '/chat-invite',
    Authenticated,
    sendChatInviteNotification
);

// Delete notification
router.delete(
    '/:notificationId',
    Authenticated,
    deleteNotification
);

module.exports = router;
