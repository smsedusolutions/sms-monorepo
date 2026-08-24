const mongoose = require("mongoose");
const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");
const { SchoolModel: School, TeacherAttendanceSchema: teacherAttendanceSchema } = require("@sms/shared");

// Helper to get the model for a specific school
const getAttendanceModel = async (schoolId) => {
    const schoolDbName = await getSchoolDbName(schoolId);
    const schoolDb = getSchoolDbConnection(schoolDbName);
    return schoolDb.model("TeacherAttendance", teacherAttendanceSchema);
};

// Generate unique attendance ID
const generateAttendanceId = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `TATT${timestamp}${random}`.toUpperCase();
};

// Timezone helper: get school's configured timezone or default to Asia/Kolkata
const getSchoolTimeZone = (school) => {
    return school?.attendanceSettings?.timezone || school?.timezone || "Asia/Kolkata";
};

// Get current hour, minute and total minutes from midnight in school timezone
const getSchoolLocalTime = (date = new Date(), timeZone = "Asia/Kolkata") => {
    try {
        const timeStr = date.toLocaleTimeString("en-GB", {
            timeZone,
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
        });
        const [h, m] = timeStr.split(":").map(Number);
        const hours = isNaN(h) ? date.getUTCHours() : (h === 24 ? 0 : h);
        const minutes = isNaN(m) ? date.getUTCMinutes() : m;
        return { hours, minutes, totalMinutes: hours * 60 + minutes };
    } catch (e) {
        return {
            hours: date.getHours(),
            minutes: date.getMinutes(),
            totalMinutes: date.getHours() * 60 + date.getMinutes(),
        };
    }
};

// Parse time string (e.g. "08:00", "16:00", "8:30 AM") to minutes from midnight
const parseTimeToMinutes = (timeStr, defaultH = 8, defaultM = 0) => {
    if (!timeStr || typeof timeStr !== "string") return defaultH * 60 + defaultM;
    const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?(?:\s*(AM|PM))?$/i);
    if (match) {
        let h = parseInt(match[1], 10);
        const m = parseInt(match[2], 10);
        const ampm = match[3] && match[3].toUpperCase();
        if (ampm === "PM" && h < 12) h += 12;
        if (ampm === "AM" && h === 12) h = 0;
        return h * 60 + (isNaN(m) ? defaultM : m);
    }
    const parts = timeStr.split(":");
    let h = parseInt(parts[0], 10);
    let m = parseInt(parts[1], 10);
    if (isNaN(h)) h = defaultH;
    if (isNaN(m)) m = defaultM;
    return h * 60 + m;
};

// Format time string to 12-hour AM/PM format
const format12Hour = (timeStr) => {
    if (!timeStr) return "";
    const minutes = parseTimeToMinutes(timeStr, 8, 0);
    let h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12;
    if (h === 0) h = 12;
    const minPart = m > 0 ? `:${String(m).padStart(2, "0")}` : "";
    return `${h}${minPart} ${ampm}`;
};

// Get today's date at midnight in school timezone (as UTC midnight Date object)
const getDateOnly = (dateArg = new Date(), timeZone = "Asia/Kolkata") => {
    let year, month, day;
    if (typeof dateArg === "string" && dateArg.includes("-")) {
        const parts = dateArg.split("T")[0].split("-").map(Number);
        year = parts[0];
        month = parts[1];
        day = parts[2];
    } else {
        const d = dateArg instanceof Date ? dateArg : new Date(dateArg);
        try {
            const dateStr = d.toLocaleDateString("en-CA", { timeZone });
            const parts = dateStr.split("-").map(Number);
            year = parts[0];
            month = parts[1];
            day = parts[2];
        } catch (e) {
            year = d.getFullYear();
            month = d.getMonth() + 1;
            day = d.getDate();
        }
    }
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
};

// Get end of day (23:59:59.999 UTC)
const getEndOfDay = (startDate) => {
    const end = new Date(startDate);
    end.setUTCHours(23, 59, 59, 999);
    return end;
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth's radius in meters
    const toRad = (deg) => deg * (Math.PI / 180);

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
};

/**
 * Teacher self check-in
 * POST /api/school/:schoolId/attendance/teacher/check-in
 * Body: { latitude, longitude } - teacher's current location
 */
const teacherCheckIn = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const teacherId = req.user?.teacherId || req.body.teacherId;
        const { latitude, longitude } = req.body;

        if (!teacherId) {
            return res.status(400).json({
                success: false,
                message: "teacherId is required",
            });
        }

        // Get school details for location & working hours validation
        const school = await School.findOne({ schoolId });
        if (!school) {
            return res.status(404).json({
                success: false,
                message: "School not found",
            });
        }

        const timeZone = getSchoolTimeZone(school);
        const today = getDateOnly(new Date(), timeZone);
        const endOfDay = getEndOfDay(today);
        const now = new Date();
        console.log("[DEBUG teacherCheckIn] schoolId:", schoolId, "teacherId:", teacherId, "today:", today.toISOString(), "now:", now.toISOString());

        // Validate working hours in school's timezone
        const workingHours = school.attendanceSettings?.workingHours || { start: "08:00", end: "16:00" };
        const { totalMinutes: currentMinutes } = getSchoolLocalTime(now, timeZone);

        const startMinutes = parseTimeToMinutes(workingHours.start || "08:00", 8, 0);
        const endMinutes = parseTimeToMinutes(workingHours.end || "16:00", 16, 0);
        const formattedRange = `${format12Hour(workingHours.start || "08:00")} - ${format12Hour(workingHours.end || "16:00")}`;

        if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
            return res.status(403).json({
                success: false,
                message: `Teacher check-in is only allowed during school working hours (${formattedRange}).`,
            });
        }

        // Validate location if school has coordinates configured
        if (school.location?.latitude && school.location?.longitude) {
            if (!latitude || !longitude) {
                return res.status(400).json({
                    success: false,
                    message: "Location is required for check-in. Please enable GPS.",
                });
            }

            const distance = calculateDistance(
                latitude,
                longitude,
                school.location.latitude,
                school.location.longitude
            );

            const allowedRadius = school.location.radiusMeters || 100;

            if (distance > allowedRadius) {
                return res.status(403).json({
                    success: false,
                    message: `You must be within ${allowedRadius}m of school to check in. Current distance: ${Math.round(distance)}m`,
                    data: { distance: Math.round(distance), allowedRadius },
                });
            }
        }

        const AttendanceModel = await getAttendanceModel(schoolId);

        // Check if already checked in
        let attendance = await AttendanceModel.findOne({
            teacherId,
            date: { $gte: today, $lte: endOfDay },
        });

        if (attendance && attendance.checkInTime) {
            return res.status(400).json({
                success: false,
                message: "Already checked in today",
                data: attendance,
            });
        }

        if (attendance) {
            // Update existing (was marked absent/leave)
            attendance.checkInTime = now;
            attendance.status = "present";
            attendance.markedBy = teacherId;
            attendance.markedByRole = "teacher";
            attendance.checkInLocation = { latitude, longitude };
        } else {
            // Create new
            attendance = new AttendanceModel({
                attendanceId: generateAttendanceId(),
                schoolId,
                teacherId,
                date: today,
                checkInTime: now,
                status: "present",
                markedBy: teacherId,
                markedByRole: "teacher",
                checkInLocation: { latitude, longitude },
            });
        }

        await attendance.save();

        res.status(200).json({
            success: true,
            message: "Checked in successfully",
            data: attendance,
        });
    } catch (error) {
        console.error("Error during teacher check-in:", error);
        res.status(500).json({
            success: false,
            message: "Failed to check in",
            error: error.message,
        });
    }
};

/**
 * Teacher self check-out
 * POST /api/school/:schoolId/attendance/teacher/check-out
 */
const teacherCheckOut = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const teacherId = req.user?.teacherId || req.body.teacherId;

        if (!teacherId) {
            return res.status(400).json({
                success: false,
                message: "teacherId is required",
            });
        }

        const school = await School.findOne({ schoolId });
        const timeZone = getSchoolTimeZone(school);
        const AttendanceModel = await getAttendanceModel(schoolId);
        const today = getDateOnly(new Date(), timeZone);
        const endOfDay = getEndOfDay(today);
        const now = new Date();

        const attendance = await AttendanceModel.findOne({
            teacherId,
            date: { $gte: today, $lte: endOfDay },
        });

        if (!attendance || !attendance.checkInTime) {
            return res.status(400).json({
                success: false,
                message: "Must check in before checking out",
            });
        }

        if (attendance.checkOutTime) {
            return res.status(400).json({
                success: false,
                message: "Already checked out today",
                data: attendance,
            });
        }

        attendance.checkOutTime = now;
        attendance.totalMinutes = Math.floor((now - attendance.checkInTime) / 60000);

        await attendance.save();

        res.status(200).json({
            success: true,
            message: "Checked out successfully",
            data: attendance,
        });
    } catch (error) {
        console.error("Error during teacher check-out:", error);
        res.status(500).json({
            success: false,
            message: "Failed to check out",
            error: error.message,
        });
    }
};

/**
 * Get teacher's own attendance status for today
 * GET /api/school/:schoolId/attendance/teacher/status
 */
const getTeacherStatus = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const teacherId = req.user?.teacherId || req.query.teacherId;

        const school = await School.findOne({ schoolId });
        const timeZone = getSchoolTimeZone(school);
        const AttendanceModel = await getAttendanceModel(schoolId);
        const today = getDateOnly(new Date(), timeZone);
        const endOfDay = getEndOfDay(today);

        console.log("[DEBUG getTeacherStatus] schoolId:", schoolId, "teacherId:", teacherId, "today:", today.toISOString(), "endOfDay:", endOfDay.toISOString());

        const attendance = await AttendanceModel.findOne({
            teacherId,
            date: { $gte: today, $lte: endOfDay },
        });

        console.log("[DEBUG getTeacherStatus] Found:", attendance ? JSON.stringify({ teacherId: attendance.teacherId, date: attendance.date, status: attendance.status }) : "null");

        res.status(200).json({
            success: true,
            data: attendance || { checkedIn: false },
        });
    } catch (error) {
        console.error("Error getting teacher status:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get teacher status",
            error: error.message,
        });
    }
};

/**
 * Admin marks teacher attendance (bulk)
 * POST /api/school/:schoolId/attendance/teacher/mark
 */
const markTeacherAttendance = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { date, attendanceRecords } = req.body;
        // attendanceRecords = [{ teacherId, status, leaveType?, remarks? }]

        if (!attendanceRecords || !Array.isArray(attendanceRecords)) {
            return res.status(400).json({
                success: false,
                message: "attendanceRecords array is required",
            });
        }

        const school = await School.findOne({ schoolId });
        const timeZone = getSchoolTimeZone(school);
        const AttendanceModel = await getAttendanceModel(schoolId);
        const attendanceDate = getDateOnly(date || new Date(), timeZone);
        const markedBy = req.user?.userId || "system";
        const markedByRole = req.user?.role || "sch_admin";

        const validRecords = attendanceRecords.filter((r) => r && r.teacherId && r.status);

        if (validRecords.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No valid teacher attendance records to mark",
                data: { totalCount: 0 },
            });
        }

        // Prepare bulkWrite operations (1 atomic MongoDB command)
        const bulkOps = validRecords.map((record) => {
            const updateFields = {
                status: record.status,
                markedBy,
                markedByRole,
                schoolId,
            };
            if (record.leaveType) updateFields.leaveType = record.leaveType;
            if (record.remarks !== undefined) updateFields.remarks = record.remarks;

            return {
                updateOne: {
                    filter: {
                        teacherId: record.teacherId,
                        date: attendanceDate,
                    },
                    update: {
                        $set: updateFields,
                        $setOnInsert: {
                            attendanceId: generateAttendanceId(),
                            date: attendanceDate,
                            teacherId: record.teacherId,
                        },
                    },
                    upsert: true,
                },
            };
        });

        const bulkResult = await AttendanceModel.bulkWrite(bulkOps, { ordered: false });

        res.status(200).json({
            success: true,
            message: `Teacher attendance marked for ${validRecords.length} teachers`,
            data: {
                totalCount: validRecords.length,
                matchedCount: bulkResult.matchedCount,
                modifiedCount: bulkResult.modifiedCount,
                upsertedCount: bulkResult.upsertedCount,
            },
        });
    } catch (error) {
        console.error("Error marking teacher attendance:", error);
        res.status(500).json({
            success: false,
            message: "Failed to mark teacher attendance",
            error: error.message,
        });
    }
};

/**
 * Get all teachers' attendance for a date
 * GET /api/school/:schoolId/attendance/teacher/daily/:date
 */
const getTeachersAttendance = async (req, res) => {
    try {
        const { schoolId, date } = req.params;

        const school = await School.findOne({ schoolId });
        const timeZone = getSchoolTimeZone(school);
        const AttendanceModel = await getAttendanceModel(schoolId);
        const attendanceDate = getDateOnly(date, timeZone);
        
        // Use date range query for robustness (start of day to end of day)
        const startOfDay = new Date(attendanceDate);
        const endOfDay = getEndOfDay(attendanceDate);

        console.log("[DEBUG getTeachersAttendance] schoolId:", schoolId, "dateParam:", date, "startOfDay:", startOfDay.toISOString(), "endOfDay:", endOfDay.toISOString());

        const attendance = await AttendanceModel.find({
            date: { $gte: startOfDay, $lte: endOfDay },
        }).lean();

        console.log("[DEBUG getTeachersAttendance] Found", attendance.length, "records. Records:", JSON.stringify(attendance.map(a => ({ teacherId: a.teacherId, date: a.date, status: a.status }))));

        // Summary
        const summary = {
            total: attendance.length,
            present: attendance.filter((a) => a.status === "present").length,
            absent: attendance.filter((a) => a.status === "absent").length,
            late: attendance.filter((a) => a.status === "late").length,
            halfDay: attendance.filter((a) => a.status === "half_day").length,
            leave: attendance.filter((a) => a.status === "leave").length,
        };

        res.status(200).json({
            success: true,
            data: { attendance, summary },
        });
    } catch (error) {
        console.error("Error getting teachers attendance:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get teachers attendance",
            error: error.message,
        });
    }
};

/**
 * Get single teacher's attendance history
 * GET /api/school/:schoolId/attendance/teacher/:teacherId/history
 */
const getTeacherHistory = async (req, res) => {
    try {
        const { schoolId, teacherId } = req.params;
        const { startDate, endDate } = req.query;

        const school = await School.findOne({ schoolId });
        const timeZone = getSchoolTimeZone(school);
        const AttendanceModel = await getAttendanceModel(schoolId);

        const query = { teacherId };
        if (startDate && endDate) {
            query.date = {
                $gte: getDateOnly(startDate, timeZone),
                $lte: getEndOfDay(getDateOnly(endDate, timeZone)),
            };
        }

        const attendance = await AttendanceModel.find(query)
            .sort({ date: -1 })
            .lean();

        // Summary
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
        console.error("Error getting teacher history:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get teacher history",
            error: error.message,
        });
    }
};

module.exports = {
    teacherCheckIn,
    teacherCheckOut,
    getTeacherStatus,
    markTeacherAttendance,
    getTeachersAttendance,
    getTeacherHistory,
};
