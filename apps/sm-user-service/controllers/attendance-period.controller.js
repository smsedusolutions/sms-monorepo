const mongoose = require("mongoose");
const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");
const { SchoolModel: School, AttendancePeriodSchema: attendancePeriodSchema, StudentSchema: studentSchema } = require("@sms/shared");
const { logActivity } = require("@sms/shared/utils");

// Helper to get the model for a specific school
const getAttendanceModel = async (schoolId) => {
    const schoolDbName = await getSchoolDbName(schoolId);
    const schoolDb = getSchoolDbConnection(schoolDbName);
    return schoolDb.model("AttendancePeriod", attendancePeriodSchema);
};

// Generate unique attendance ID
const generateAttendanceId = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `ATTP${timestamp}${random} `.toUpperCase();
};

// Get today's date at midnight
const getDateOnly = (dateArg = new Date()) => {
    let d;
    if (typeof dateArg === "string" && dateArg.includes("-")) {
        const [year, month, day] = dateArg.split("-").map(Number);
        d = new Date();
        d.setFullYear(year, month - 1, day);
    } else {
        d = new Date(dateArg);
    }
    d.setHours(0, 0, 0, 0);
    return d;
};

/**
 * Mark attendance for a class period (bulk)
 * POST /api/school/:schoolId/attendance/period/mark
 */
const markPeriodAttendance = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { classId, sectionId, date, period, subjectId, teacherId, attendanceRecords, isSubstitute } = req.body;
        // attendanceRecords = [{ studentId, status, remarks? }]

        if (!classId || !period || !subjectId || !teacherId || !attendanceRecords || !Array.isArray(attendanceRecords)) {
            return res.status(400).json({
                success: false,
                message: "classId, period, subjectId, teacherId, and attendanceRecords are required",
            });
        }

        const AttendanceModel = await getAttendanceModel(schoolId);
        const attendanceDate = getDateOnly(date || new Date());
        const markedBy = req.user?.userId || req.user?.teacherId || "system";

        const validRecords = attendanceRecords.filter((r) => r && r.studentId && r.status);

        if (validRecords.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No valid attendance records to mark",
                data: { totalCount: 0 },
            });
        }

        // Prepare bulkWrite operations (1 atomic MongoDB command)
        const bulkOps = validRecords.map((record) => {
            const updateFields = {
                status: record.status,
                markedBy,
                subjectId,
                teacherId,
                classId,
                schoolId,
                isSubstitute: isSubstitute || false,
            };
            if (sectionId) updateFields.sectionId = sectionId;
            if (record.remarks !== undefined) updateFields.remarks = record.remarks;

            return {
                updateOne: {
                    filter: {
                        studentId: record.studentId,
                        date: attendanceDate,
                        period: Number(period),
                    },
                    update: {
                        $set: updateFields,
                        $setOnInsert: {
                            attendanceId: generateAttendanceId(),
                            date: attendanceDate,
                            period: Number(period),
                            studentId: record.studentId,
                        },
                    },
                    upsert: true,
                },
            };
        });

        const bulkResult = await AttendanceModel.bulkWrite(bulkOps, { ordered: false });

        const response = res.status(200).json({
            success: true,
            message: `Period ${period} attendance marked for ${validRecords.length} students`,
            data: {
                totalCount: validRecords.length,
                matchedCount: bulkResult.matchedCount,
                modifiedCount: bulkResult.modifiedCount,
                upsertedCount: bulkResult.upsertedCount,
            },
        });

        // Integrated Logging
        logActivity({
            schoolDb: getSchoolDbConnection(await getSchoolDbName(schoolId)),
            schoolId,
            actor: req.user,
            action: "UPDATE",
            entity: "Attendance",
            entityId: `${classId}-${sectionId}-${period}`,
            entityLabel: `Class ${classId} - Period ${period}`,
            description: `Marked period ${period} attendance for Class ${classId} (${results.length} students)`,
            metadata: { classId, sectionId, period, date: attendanceDate, count: results.length }
        });

        return response;
    } catch (error) {
        console.error("Error marking period attendance:", error);
        res.status(500).json({
            success: false,
            message: "Failed to mark period attendance",
            error: error.message,
        });
    }
};

/**
 * Get class attendance for a specific date and period
 * GET /api/school/:schoolId/attendance/period/class/:classId/:date/:period
 */
const getPeriodAttendance = async (req, res) => {
    try {
        const { schoolId, classId, date, period } = req.params;
        const { sectionId } = req.query;

        const AttendanceModel = await getAttendanceModel(schoolId);
        const attendanceDate = getDateOnly(date);

        const query = { classId, date: attendanceDate, period: parseInt(period) };
        if (sectionId) query.sectionId = sectionId;

        const attendance = await AttendanceModel.find(query).lean();

        res.status(200).json({
            success: true,
            data: attendance,
        });
    } catch (error) {
        console.error("Error getting period attendance:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get period attendance",
            error: error.message,
        });
    }
};

/**
 * Get all periods attendance for a class on a date
 * GET /api/school/:schoolId/attendance/period/class/:classId/:date
 */
const getDayAttendance = async (req, res) => {
    try {
        const { schoolId, classId, date } = req.params;
        const { sectionId } = req.query;

        const AttendanceModel = await getAttendanceModel(schoolId);
        const attendanceDate = getDateOnly(date);

        const query = { classId, date: attendanceDate };
        if (sectionId) query.sectionId = sectionId;

        const attendance = await AttendanceModel.find(query)
            .sort({ period: 1 })
            .lean();

        // Group by period
        const byPeriod = {};
        attendance.forEach((record) => {
            if (!byPeriod[record.period]) {
                byPeriod[record.period] = [];
            }
            byPeriod[record.period].push(record);
        });

        res.status(200).json({
            success: true,
            data: { attendance, byPeriod },
        });
    } catch (error) {
        console.error("Error getting day attendance:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get day attendance",
            error: error.message,
        });
    }
};

/**
 * Get student period-wise attendance history
 * GET /api/school/:schoolId/attendance/period/student/:studentId
 */
const getStudentPeriodAttendance = async (req, res) => {
    try {
        const { schoolId, studentId } = req.params;
        const { startDate, endDate, subjectId } = req.query;

        const AttendanceModel = await getAttendanceModel(schoolId);

        const query = { studentId };
        if (startDate && endDate) {
            query.date = {
                $gte: getDateOnly(startDate),
                $lte: getDateOnly(endDate),
            };
        }
        if (subjectId) query.subjectId = subjectId;

        const attendance = await AttendanceModel.find(query)
            .sort({ date: -1, period: 1 })
            .lean();

        // Calculate summary by subject
        const subjectSummary = {};
        attendance.forEach((a) => {
            if (!subjectSummary[a.subjectId]) {
                subjectSummary[a.subjectId] = { total: 0, present: 0, absent: 0, late: 0 };
            }
            subjectSummary[a.subjectId].total++;
            subjectSummary[a.subjectId][a.status]++;
        });

        // Calculate overall
        const overall = {
            total: attendance.length,
            present: attendance.filter((a) => a.status === "present").length,
            absent: attendance.filter((a) => a.status === "absent").length,
            late: attendance.filter((a) => a.status === "late").length,
        };
        overall.percentage = overall.total > 0
            ? ((overall.present + overall.late) / overall.total * 100).toFixed(2)
            : 0;

        res.status(200).json({
            success: true,
            data: { attendance, subjectSummary, overall },
        });
    } catch (error) {
        console.error("Error getting student period attendance:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get student period attendance",
            error: error.message,
        });
    }
};

/**
 * Get subject-wise attendance summary
 * GET /api/school/:schoolId/attendance/period/subject/:subjectId/summary
 */
const getSubjectAttendanceSummary = async (req, res) => {
    try {
        const { schoolId, subjectId } = req.params;
        const { startDate, endDate, classId, sectionId } = req.query;

        const AttendanceModel = await getAttendanceModel(schoolId);

        const query = { subjectId };
        if (startDate && endDate) {
            query.date = {
                $gte: getDateOnly(startDate),
                $lte: getDateOnly(endDate),
            };
        }
        if (classId) query.classId = classId;
        if (sectionId) query.sectionId = sectionId;

        const attendance = await AttendanceModel.find(query).lean();

        const summary = {
            totalRecords: attendance.length,
            present: attendance.filter((a) => a.status === "present").length,
            absent: attendance.filter((a) => a.status === "absent").length,
            late: attendance.filter((a) => a.status === "late").length,
            uniqueDates: [...new Set(attendance.map((a) => a.date.toISOString().split("T")[0]))].length,
        };
        summary.attendancePercentage = summary.totalRecords > 0
            ? ((summary.present + summary.late) / summary.totalRecords * 100).toFixed(2)
            : 0;

        res.status(200).json({
            success: true,
            data: summary,
        });
    } catch (error) {
        console.error("Error getting subject attendance summary:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get subject attendance summary",
            error: error.message,
        });
    }
};

module.exports = {
    markPeriodAttendance,
    getPeriodAttendance,
    getDayAttendance,
    getStudentPeriodAttendance,
    getSubjectAttendanceSummary,
};
