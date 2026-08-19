const express = require('express');
const router = express.Router({ mergeParams: true });
const { Authenticated, authorizeRoles } = require('@sms/shared/middlewares');
const {
    getDisciplineRecords,
    logDisciplineIncident,
} = require('../controllers/discipline.controller');

// Get discipline records (Admin & Principal & Teacher)
router.get(
    '/',
    Authenticated,
    authorizeRoles('sch_admin', 'principal', 'teacher'),
    getDisciplineRecords
);

// Log discipline incident (Admin & Principal & Teacher)
router.post(
    '/',
    Authenticated,
    authorizeRoles('sch_admin', 'principal', 'teacher'),
    logDisciplineIncident
);

module.exports = router;
