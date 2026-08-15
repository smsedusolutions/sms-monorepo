const express = require('express');
const router = express.Router({ mergeParams: true });
const { Authenticated, authorizeRoles } = require('@sms/shared/middlewares');
const { paginate } = require('../utils/pagination');

const {
    getDashboardStats,
    getDefaulters,
    getPendingFees,
    getTodayCollection,
    getMonthlyCollection,
    getClasswiseCollection,
    getDiscountReport,
    exportCollectionToExcel
} = require('../controllers/feeDashboard.controller');

// Apply auth globally
router.use(Authenticated);
router.use(authorizeRoles('sch_admin', 'principal'));

// Summary Stats
router.get('/stats', getDashboardStats);

// Defaulters List
router.get('/defaulters', paginate, getDefaulters);

// Pending Fees Report
router.get('/pending', getPendingFees);

// Today's Collection details
router.get('/collection/today', getTodayCollection);

// Monthly Collection details
router.get('/collection/monthly', getMonthlyCollection);

// Class-wise Collection details
router.get('/collection/classwise', getClasswiseCollection);

// Applied Discounts Report
router.get('/discounts', getDiscountReport);

// Export collections to Excel-CSV
router.get('/collection/export', exportCollectionToExcel);

module.exports = router;
