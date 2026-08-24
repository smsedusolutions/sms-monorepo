const mongoose = require("mongoose");
const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");
const { SchoolModel: School, AttendanceCheckinSchema: attendanceCheckinSchema, StudentSchema: studentSchema } = require("@sms/shared");

// Helper to get the model for a specific school
const getAttendanceModel = async (schoolId) => {
    const schoolDbName = await getSchoolDbName(schoolId);
    const schoolDb = getSchoolDbConnection(schoolDbName);
    return schoolDb.model("AttendanceCheckin", attendanceCheckinSchema);
};

// Generate unique log ID
const generateLogId = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `LOG${timestamp}${random}`.toUpperCase();
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

// Calculate status based on check-in time and settings
const calculateStatus = (checkInTime, workingHours, lateThreshold = 15, halfDayThreshold = 240, totalMinutes = 0, timeZone = "Asia/Kolkata") => {
    if (!checkInTime) return "absent";

    const { totalMinutes: checkInMinutes } = getSchoolLocalTime(new Date(checkInTime), timeZone);
    const startMinutes = parseTimeToMinutes(workingHours?.start || "08:00", 8, 0);

    const delayMinutes = checkInMinutes - startMinutes;

    if (totalMinutes > 0 && totalMinutes < halfDayThreshold) {
        return "half_day";
    }
    if (delayMinutes > lateThreshold) {
        return "late";
    }
    return "present";
};

/**
 * Check In - Student or Teacher
 * POST /api/school/:schoolId/attendance/checkin/in
 */
const checkIn = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { userId, userType, classId, sectionId, method, workingHours, lateThreshold } = req.body;

        if (!userId || !userType) {
            return res.status(400).json({
                success: false,
                message: "userId and userType are required",
            });
        }

        const school = await School.findOne({ schoolId });
        const timeZone = getSchoolTimeZone(school);
        const AttendanceModel = await getAttendanceModel(schoolId);
        const today = getDateOnly(new Date(), timeZone);
        const endOfDay = getEndOfDay(today);
        const now = new Date();

        // Check if already checked in today
        let attendance = await AttendanceModel.findOne({
            userId,
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
            // Update existing record (was marked absent, now checking in)
            attendance.checkInTime = now;
            attendance.checkInMethod = method || "manual";
            attendance.status = "pending";
        } else {
            // Create new
            attendance = new AttendanceModel({
                logId: generateLogId(),
                schoolId,
                userId,
                userType,
                classId,
                sectionId,
                date: today,
                checkInTime: now,
                checkInMethod: method || "manual",
                status: "pending",
            });
        }

        await attendance.save();

        res.status(200).json({
            success: true,
            message: "Checked in successfully",
            data: attendance,
        });
    } catch (error) {
        console.error("Error during check-in:", error);
        res.status(500).json({
            success: false,
            message: "Failed to check in",
            error: error.message,
        });
    }
};

/**
 * Check Out - Student or Teacher
 * POST /api/school/:schoolId/attendance/checkin/out
 */
const checkOut = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { userId, method, workingHours, lateThreshold, halfDayThreshold } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "userId is required",
            });
        }

        const school = await School.findOne({ schoolId });
        const timeZone = getSchoolTimeZone(school);
        const AttendanceModel = await getAttendanceModel(schoolId);
        const today = getDateOnly(new Date(), timeZone);
        const endOfDay = getEndOfDay(today);
        const now = new Date();

        const attendance = await AttendanceModel.findOne({
            userId,
            date: { $gte: today, $lte: endOfDay },
        });

        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: "No check-in record found for today",
            });
        }

        if (!attendance.checkInTime) {
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

        // Calculate total minutes
        const totalMinutes = Math.floor((now - attendance.checkInTime) / 60000);

        // Calculate final status
        const settings = {
            start: workingHours?.start || school?.attendanceSettings?.workingHours?.start || "08:00",
            end: workingHours?.end || school?.attendanceSettings?.workingHours?.end || "16:00",
        };
        const status = calculateStatus(
            attendance.checkInTime,
            settings,
            lateThreshold || school?.attendanceSettings?.lateThresholdMinutes || 15,
            halfDayThreshold || school?.attendanceSettings?.halfDayThresholdMinutes || 240,
            totalMinutes,
            timeZone
        );

        attendance.checkOutTime = now;
        attendance.checkOutMethod = method || "manual";
        attendance.totalMinutes = totalMinutes;
        attendance.status = status;

        await attendance.save();

        res.status(200).json({
            success: true,
            message: "Checked out successfully",
            data: attendance,
        });
    } catch (error) {
        console.error("Error during check-out:", error);
        res.status(500).json({
            success: false,
            message: "Failed to check out",
            error: error.message,
        });
    }
};

/**
 * Get today's check-in status for a user
 * GET /api/school/:schoolId/attendance/checkin/status/:userId
 */
const getCheckInStatus = async (req, res) => {
    try {
        const { schoolId, userId } = req.params;

        const school = await School.findOne({ schoolId });
        const timeZone = getSchoolTimeZone(school);
        const AttendanceModel = await getAttendanceModel(schoolId);
        const today = getDateOnly(new Date(), timeZone);
        const endOfDay = getEndOfDay(today);

        const attendance = await AttendanceModel.findOne({
            userId,
            date: { $gte: today, $lte: endOfDay },
        });

        res.status(200).json({
            success: true,
            data: attendance || { checked: false },
        });
    } catch (error) {
        console.error("Error getting check-in status:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get check-in status",
            error: error.message,
        });
    }
};

/**
 * Get all check-in records for a date
 * GET /api/school/:schoolId/attendance/checkin/daily/:date
 */
const getDailyCheckins = async (req, res) => {
    try {
        const { schoolId, date } = req.params;
        const { userType, classId, sectionId } = req.query;

        const school = await School.findOne({ schoolId });
        const timeZone = getSchoolTimeZone(school);
        const AttendanceModel = await getAttendanceModel(schoolId);
        const attendanceDate = getDateOnly(date, timeZone);
        const startOfDay = new Date(attendanceDate);
        const endOfDay = getEndOfDay(attendanceDate);

        const query = { date: { $gte: startOfDay, $lte: endOfDay } };
        if (userType) query.userType = userType;
        if (classId) query.classId = classId;
        if (sectionId) query.sectionId = sectionId;

        const attendance = await AttendanceModel.find(query)
            .sort({ checkInTime: 1 })
            .lean();

        // Summary
        const summary = {
            total: attendance.length,
            checkedIn: attendance.filter((a) => a.checkInTime).length,
            checkedOut: attendance.filter((a) => a.checkOutTime).length,
            present: attendance.filter((a) => a.status === "present").length,
            late: attendance.filter((a) => a.status === "late").length,
            halfDay: attendance.filter((a) => a.status === "half_day").length,
            pending: attendance.filter((a) => a.status === "pending").length,
        };

        res.status(200).json({
            success: true,
            data: { attendance, summary },
        });
    } catch (error) {
        console.error("Error getting daily check-ins:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get daily check-ins",
            error: error.message,
        });
    }
};

/**
 * Manual mark attendance (admin override)
 * POST /api/school/:schoolId/attendance/checkin/manual
 */
const manualMarkAttendance = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { userId, userType, classId, sectionId, date, status, remarks } = req.body;

        if (!userId || !userType || !status) {
            return res.status(400).json({
                success: false,
                message: "userId, userType, and status are required",
            });
        }

        const school = await School.findOne({ schoolId });
        const timeZone = getSchoolTimeZone(school);
        const AttendanceModel = await getAttendanceModel(schoolId);
        const attendanceDate = getDateOnly(date || new Date(), timeZone);
        const startOfDay = new Date(attendanceDate);
        const endOfDay = getEndOfDay(attendanceDate);

        let attendance = await AttendanceModel.findOne({
            userId,
            date: { $gte: startOfDay, $lte: endOfDay },
        });

        if (attendance) {
            // Update existing
            attendance.status = status;
            attendance.remarks = remarks;
            attendance.markedBy = req.user?.userId;
        } else {
            // Create new
            attendance = new AttendanceModel({
                logId: generateLogId(),
                schoolId,
                userId,
                userType,
                classId,
                sectionId,
                date: attendanceDate,
                status,
                remarks,
                markedBy: req.user?.userId,
            });
        }

        await attendance.save();

        res.status(200).json({
            success: true,
            message: "Attendance marked successfully",
            data: attendance,
        });
    } catch (error) {
        console.error("Error manual marking attendance:", error);
        res.status(500).json({
            success: false,
            message: "Failed to mark attendance",
            error: error.message,
        });
    }
};

module.exports = {
    checkIn,
    checkOut,
    getCheckInStatus,
    getDailyCheckins,
    manualMarkAttendance,
};
