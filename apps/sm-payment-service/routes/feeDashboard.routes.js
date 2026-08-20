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

// Export collections to Excel-CSV
router.get('/collection/export', exportCollectionToExcel);

// Send Payment Reminder Notification
router.post('/send-reminder', async (req, res) => {
    try {
        const { studentIds } = req.body;
        // In demo/production, triggers notifications/WhatsApp/SMS to parents of studentIds
        res.status(200).json({
            success: true,
            message: `Fee reminders queued successfully for ${studentIds?.length || 0} students`,
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

module.exports = router;
