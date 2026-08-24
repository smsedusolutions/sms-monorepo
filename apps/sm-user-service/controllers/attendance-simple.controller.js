const mongoose = require("mongoose");
const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");
const { SchoolModel: School, AttendanceSimpleSchema: attendanceSimpleSchema, StudentSchema: studentSchema } = require("@sms/shared");

// Helper to get the model for a specific school
const getAttendanceModel = async (schoolId) => {
    const schoolDbName = await getSchoolDbName(schoolId);
    const schoolDb = getSchoolDbConnection(schoolDbName);
    return schoolDb.model("AttendanceSimple", attendanceSimpleSchema);
};

// Generate unique attendance ID
const generateAttendanceId = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `ATT${timestamp}${random}`.toUpperCase();
};

// Get today's date at midnight for comparisons
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
 * Mark attendance for a class (bulk)
 * POST /api/school/:schoolId/attendance/simple/mark
 */
const markClassAttendance = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { classId, sectionId, date, attendanceRecords } = req.body;
        // attendanceRecords = [{ studentId, status, remarks? }]

        if (!classId || !attendanceRecords || !Array.isArray(attendanceRecords)) {
            return res.status(400).json({
                success: false,
                message: "classId and attendanceRecords are required",
            });
        }

        const AttendanceModel = await getAttendanceModel(schoolId);
        const attendanceDate = getDateOnly(date || new Date());
        const markedBy = req.user?.userId || req.user?.teacherId || "system";
        const markedByRole = req.user?.role || "teacher";

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
                markedByRole,
                classId,
                schoolId,
            };
            if (sectionId) updateFields.sectionId = sectionId;
            if (record.remarks !== undefined) updateFields.remarks = record.remarks;

            return {
                updateOne: {
                    filter: {
                        studentId: record.studentId,
                        date: attendanceDate,
                    },
                    update: {
                        $set: updateFields,
                        $setOnInsert: {
                            attendanceId: generateAttendanceId(),
                            date: attendanceDate,
                            studentId: record.studentId,
                        },
                    },
                    upsert: true,
                },
            };
        });

        const bulkResult = await AttendanceModel.bulkWrite(bulkOps, { ordered: false });

        res.status(200).json({
            success: true,
            message: `Attendance marked for ${validRecords.length} students`,
            data: {
                totalCount: validRecords.length,
                matchedCount: bulkResult.matchedCount,
                modifiedCount: bulkResult.modifiedCount,
                upsertedCount: bulkResult.upsertedCount,
            },
        });
    } catch (error) {
        console.error("Error marking attendance:", error);
        res.status(500).json({
            success: false,
            message: "Failed to mark attendance",
            error: error.message,
        });
    }
};

/**
 * Get class attendance for a specific date
 * GET /api/school/:schoolId/attendance/simple/class/:classId/:date
 */
const getClassAttendance = async (req, res) => {
    try {
        const { schoolId, classId, date } = req.params;
        const { sectionId } = req.query;

        const AttendanceModel = await getAttendanceModel(schoolId);
        const attendanceDate = getDateOnly(date);

        const query = { classId, date: attendanceDate };
        if (sectionId) query.sectionId = sectionId;

        const attendance = await AttendanceModel.find(query).lean();

        res.status(200).json({
            success: true,
            data: attendance,
        });
    } catch (error) {
        console.error("Error getting class attendance:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get class attendance",
            error: error.message,
        });
    }
};

/**
 * Get student attendance history
 * GET /api/school/:schoolId/attendance/simple/student/:studentId
 */
const getStudentAttendance = async (req, res) => {
    try {
        const { schoolId, studentId } = req.params;
        const { startDate, endDate } = req.query;

        const AttendanceModel = await getAttendanceModel(schoolId);

        const query = { studentId };
        if (startDate && endDate) {
            query.date = {
                $gte: getDateOnly(startDate),
                $lte: getDateOnly(endDate),
            };
        }

        const attendance = await AttendanceModel.find(query)
            .sort({ date: -1 })
            .lean();

        // Calculate summary
        const summary = {
            total: attendance.length,
            present: attendance.filter((a) => a.status === "present").length,
            absent: attendance.filter((a) => a.status === "absent").length,
            late: attendance.filter((a) => a.status === "late").length,
            halfDay: attendance.filter((a) => a.status === "half_day").length,
            leave: attendance.filter((a) => a.status === "leave").length,
        };
        summary.percentage = summary.total > 0
            ? ((summary.present + summary.late + summary.halfDay * 0.5) / summary.total * 100).toFixed(2)
            : 0;

        res.status(200).json({
            success: true,
            data: { attendance, summary },
        });
    } catch (error) {
        console.error("Error getting student attendance:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get student attendance",
            error: error.message,
        });
    }
};

/**
 * Update single attendance record
 * PUT /api/school/:schoolId/attendance/simple/:attendanceId
 */
const updateAttendance = async (req, res) => {
    try {
        const { schoolId, attendanceId } = req.params;
        const { status, remarks } = req.body;

        const AttendanceModel = await getAttendanceModel(schoolId);

        const attendance = await AttendanceModel.findOne({ attendanceId });
        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: "Attendance record not found",
            });
        }

        if (status) attendance.status = status;
        if (remarks !== undefined) attendance.remarks = remarks;
        attendance.markedBy = req.user?.userId || req.user?.teacherId;
        attendance.markedByRole = req.user?.role;

        await attendance.save();

        res.status(200).json({
            success: true,
            message: "Attendance updated successfully",
            data: attendance,
        });
    } catch (error) {
        console.error("Error updating attendance:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update attendance",
            error: error.message,
        });
    }
};

/**
 * Get attendance summary/stats for a date range
 * GET /api/school/:schoolId/attendance/simple/summary
 */
const getAttendanceSummary = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { startDate, endDate, classId, sectionId } = req.query;

        const AttendanceModel = await getAttendanceModel(schoolId);

        const query = { schoolId };
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
            halfDay: attendance.filter((a) => a.status === "half_day").length,
            leave: attendance.filter((a) => a.status === "leave").length,
        };
        summary.attendancePercentage = summary.totalRecords > 0
            ? ((summary.present + summary.late + summary.halfDay * 0.5) / summary.totalRecords * 100).toFixed(2)
            : 0;

        res.status(200).json({
            success: true,
            data: summary,
        });
    } catch (error) {
        console.error("Error getting attendance summary:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get attendance summary",
            error: error.message,
        });
    }
};

module.exports = {
    markClassAttendance,
    getClassAttendance,
    getStudentAttendance,
    updateAttendance,
    getAttendanceSummary,
};
