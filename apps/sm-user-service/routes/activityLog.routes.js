const express = require('express');
const router = express.Router({ mergeParams: true });
const { Authenticated } = require('@sms/shared/middlewares');
const { getLogs, getLogById, getLogStats, clearLogs } = require('../controllers/activityLog.controller');

// GET all activity logs (School Admin Only)
router.get(
    '/',
    Authenticated,
    getLogs
);

// GET log stats (School Admin Only)
router.get(
    '/stats',
    Authenticated,
    getLogStats
);

// GET single log by ID with metadata (School Admin Only)
router.get(
    '/:logId',
    Authenticated,
    getLogById
);

// DELETE clear logs (School Admin Only)
router.delete(
    '/clear',
    Authenticated,
    clearLogs
);

module.exports = router;
