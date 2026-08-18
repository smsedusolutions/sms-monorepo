const express = require('express');
const router = express.Router({ mergeParams: true });
const { Authenticated, authorizeRoles } = require('@sms/shared/middlewares');

const {
    getAcademicYears,
    getCurrentAcademicYear,
    createAcademicYear,
    updateAcademicYear,
    setCurrentAcademicYear,
    deleteAcademicYear
} = require('../controllers/academic-year.controller');

// Read operations - accessible to all authenticated users
router.get('/academic-years', Authenticated, getAcademicYears);
router.get('/academic-years/current', Authenticated, getCurrentAcademicYear);

// Write operations - Admin / Super Admin only
router.post('/academic-years', Authenticated, authorizeRoles('sch_admin'), createAcademicYear);
router.put('/academic-years/:id', Authenticated, authorizeRoles('sch_admin'), updateAcademicYear);
router.patch('/academic-years/:id/set-current', Authenticated, authorizeRoles('sch_admin'), setCurrentAcademicYear);
router.delete('/academic-years/:id', Authenticated, authorizeRoles('sch_admin'), deleteAcademicYear);

module.exports = router;
