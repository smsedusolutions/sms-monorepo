const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");
const { ActivityLogSchema } = require("@sms/shared");
const { getPaginationParams, formatPaginationResponse } = require("../utils/pagination");
const { escapeRegex } = require("@sms/shared/utils"); // SECURITY: ReDoS

/**
 * Get ActivityLog model for a specific school
 */
const getActivityLogModel = (schoolDbName) => {
    const schoolDb = getSchoolDbConnection(schoolDbName);
    return schoolDb.models.ActivityLog || schoolDb.model('ActivityLog', ActivityLogSchema);
};

/**
 * GET All Activity Logs (Paginated & Filtered)
 * GET /api/school/:schoolId/logs
 */
const getLogs = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { 
            actorRole, 
            entity, 
            action, 
            startDate, 
            endDate, 
            search,
            page: reqPage,
            limit: reqLimit
        } = req.query;

        const schoolDbName = await getSchoolDbName(schoolId);
        if (!schoolDbName) {
            return res.status(404).json({ success: false, message: "School not found" });
        }

        const ActivityLog = getActivityLogModel(schoolDbName);
        const { page, limit, skip } = getPaginationParams(req.query);

        // Build Query
        const query = { schoolId };
        // SECURITY (NoSQL Injection): Only accept plain string values for query filters.
        // If an attacker sends {"$gt": ""} as a query param, typeof check rejects it.
        if (actorRole && typeof actorRole === 'string') query.actorRole = actorRole;
        if (entity && typeof entity === 'string') query.entity = entity;
        if (action && typeof action === 'string') query.action = action;

        // Date Range Filter
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        // Search Filter (Actor Name or Description)
        if (search && typeof search === 'string') {
            // SECURITY (ReDoS): escape user-supplied search string before building RegExp
            const searchRegex = new RegExp(escapeRegex(search.trim()), 'i');
            query.$or = [
                { actorName: searchRegex },
                { description: searchRegex },
                { entityLabel: searchRegex }
            ];
        }

        const [logs, total] = await Promise.all([
            ActivityLog.find(query)
                .select("-metadata")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            ActivityLog.countDocuments(query)
        ]);

        const response = formatPaginationResponse(logs, total, page, limit);

        res.status(200).json({
            success: true,
            message: "Activity logs fetched successfully",
            ...response
        });
    } catch (error) {
        console.error("Get Logs Error:", error.message);
        res.status(500).json({ success: false, message: "Failed to fetch logs", error: error.message });
    }
};

/**
 * GET Single Activity Log by ID (includes metadata for specific logId lookup)
 * GET /api/school/:schoolId/logs/:logId
 */
const getLogById = async (req, res) => {
    try {
        const { schoolId, logId } = req.params;
        const schoolDbName = await getSchoolDbName(schoolId);
        if (!schoolDbName) return res.status(404).json({ success: false, message: "School not found" });

        const ActivityLog = getActivityLogModel(schoolDbName);
        const log = await ActivityLog.findOne({ schoolId, logId });

        if (!log) {
            return res.status(404).json({ success: false, message: "Activity log not found" });
        }

        res.status(200).json({
            success: true,
            data: log
        });
    } catch (error) {
        console.error("Get Log By ID Error:", error.message);
        res.status(500).json({ success: false, message: "Failed to fetch log details", error: error.message });
    }
};

/**
 * GET Activity Log Stats
 * GET /api/school/:schoolId/logs/stats
 */
const getLogStats = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const schoolDbName = await getSchoolDbName(schoolId);
        if (!schoolDbName) return res.status(404).json({ success: false, message: "School not found" });

        const ActivityLog = getActivityLogModel(schoolDbName);

        // 1. Total Today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const totalToday = await ActivityLog.countDocuments({ 
            createdAt: { $gte: todayStart } 
        });

        // 2. Most Active User (Aggregate)
        const activeUserAggregation = await ActivityLog.aggregate([
            { $match: { createdAt: { $gte: todayStart } } },
            { $group: { _id: "$actorId", name: { $first: "$actorName" }, count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]);

        // 3. Last Activity
        const lastActivity = await ActivityLog.findOne().sort({ createdAt: -1 }).select('createdAt actorName description');

        // 4. Logs Expiring in 7 Days (Count)
        const warningThresholdDateStart = new Date();
        warningThresholdDateStart.setDate(warningThresholdDateStart.getDate() - 83);
        warningThresholdDateStart.setHours(0, 0, 0, 0);
        const warningThresholdDateEnd = new Date(warningThresholdDateStart);
        warningThresholdDateEnd.setHours(23, 59, 59, 999);
        
        const expiringIn7DaysCount = await ActivityLog.countDocuments({
            createdAt: { $gte: warningThresholdDateStart, $lte: warningThresholdDateEnd }
        });

        res.status(200).json({
            success: true,
            data: {
                totalToday,
                mostActiveUser: activeUserAggregation[0] || null,
                lastActivity: lastActivity || null,
                expiringIn7DaysCount
            }
        });
    } catch (error) {
        console.error("Get Log Stats Error:", error.message);
        res.status(500).json({ success: false, message: "Failed to fetch log stats" });
    }
};

/**
 * DELETE Clear Logs (Admin Only)
 * DELETE /api/school/:schoolId/logs/clear
 */
const clearLogs = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const schoolDbName = await getSchoolDbName(schoolId);
        if (!schoolDbName) return res.status(404).json({ success: false, message: "School not found" });

        const ActivityLog = getActivityLogModel(schoolDbName);
        
        // Soft clear? Or hard? Let's go with hard delete for now as requested.
        const result = await ActivityLog.deleteMany({ schoolId });

        res.status(200).json({
            success: true,
            message: `Cleared ${result.deletedCount} activity logs.`
        });
    } catch (error) {
        console.error("Clear Logs Error:", error.message);
        res.status(500).json({ success: false, message: "Failed to clear logs" });
    }
};

module.exports = {
    getLogs,
    getLogById,
    getLogStats,
    clearLogs
};
