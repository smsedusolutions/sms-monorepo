const mongoose = require("mongoose");
const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");
const {
    AttendanceSimpleSchema: attendanceSimpleSchema,
    AttendancePeriodSchema: attendancePeriodSchema,
    AttendanceCheckinSchema: attendanceCheckinSchema,
    TeacherAttendanceSchema: teacherAttendanceSchema,
    StudentSchema: studentSchema,
    TeacherSchema: teacherSchema,
    ClassSchema: classSchema
} = require("@sms/shared");

/**
 * Helper to populate names (Student, Teacher, Class, Section) in attendance records
 */
const populateNames = async (schoolDb, attendanceData) => {
    if (!attendanceData || (Array.isArray(attendanceData) && attendanceData.length === 0)) return attendanceData;

    const dataArray = Array.isArray(attendanceData) ? attendanceData : [attendanceData];
    
    const StudentModel = schoolDb.model("Student", studentSchema);
    const TeacherModel = schoolDb.model("Teacher", teacherSchema);
    const ClassModel = schoolDb.model("Class", classSchema);

    const studentIds = [...new Set(dataArray.map(a => a.studentId || (a.userType === "student" ? a.userId : null)).filter(Boolean))];
    const teacherIds = [...new Set(dataArray.map(a => a.teacherId || (a.userType === "teacher" ? a.userId : null)).filter(Boolean))];
    const classIds = [...new Set(dataArray.map(a => a.classId).filter(Boolean))];

    const [students, teachers, classes] = await Promise.all([
        StudentModel.find({ studentId: { $in: studentIds } }).select("studentId firstName lastName rollNumber").lean(),
        TeacherModel.find({ teacherId: { $in: teacherIds } }).select("teacherId firstName lastName").lean(),
        ClassModel.find({ classId: { $in: classIds } }).select("classId name sections").lean()
    ]);

    const studentMap = Object.fromEntries(students.map(s => [s.studentId, { name: `${s.firstName} ${s.lastName}`, rollNumber: s.rollNumber }]));
    const teacherMap = Object.fromEntries(teachers.map(t => [t.teacherId, `${t.firstName} ${t.lastName}`]));
    const classMap = Object.fromEntries(classes.map(c => [c.classId, c.name]));
    const sectionMap = {};
    classes.forEach(c => {
        if (c.sections) {
            c.sections.forEach(s => {
                sectionMap[`${c.classId}#${s.sectionId}`] = s.name;
            });
        }
    });

    const populated = dataArray.map(a => {
        const studentInfo = studentMap[a.studentId || (a.userType === "student" ? a.userId : null)];
        return {
            ...a,
            studentName: studentInfo?.name || null,
            rollNumber: studentInfo?.rollNumber || null,
            teacherName: teacherMap[a.teacherId || (a.userType === "teacher" ? a.userId : null)] || null,
            className: classMap[a.classId] || a.classId,
            sectionName: sectionMap[`${a.classId}#${a.sectionId}`] || a.sectionId
        };
    });

    return Array.isArray(attendanceData) ? populated : populated[0];
};

// Get today's date at midnight UTC for consistent cross-timezone comparisons
const getDateOnly = (dateArg = new Date()) => {
    let year, month, day;
    if (typeof dateArg === "string" && dateArg.includes("-")) {
        const parts = dateArg.split("T")[0].split("-").map(Number);
        year = parts[0];
        month = parts[1];
        day = parts[2];
    } else {
        const d = dateArg instanceof Date ? dateArg : new Date(dateArg);
        year = d.getUTCFullYear();
        month = d.getUTCMonth() + 1;
        day = d.getUTCDate();
    }
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
};

// Helper to get school database connection
const getSchoolDb = async (schoolId) => {
    const schoolDbName = await getSchoolDbName(schoolId);
    return getSchoolDbConnection(schoolDbName);
};

/**
 * Get daily attendance report
 * GET /api/school/:schoolId/attendance/reports/daily
 */
const getDailyReport = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { date, mode, classId, sectionId } = req.query;

        const schoolDb = await getSchoolDb(schoolId);
        const attendanceDate = getDateOnly(date || new Date());

        let studentData = { attendance: [], summary: {} };
        let teacherData = { attendance: [], summary: {} };

        // Get student attendance based on mode
        if (mode === "simple" || !mode) {
            const AttendanceModel = schoolDb.model("AttendanceSimple", attendanceSimpleSchema);
            const query = { date: { $gte: attendanceDate, $lte: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000 - 1) } };
            if (classId) query.classId = classId;
            if (sectionId) query.sectionId = sectionId;

            const attendance = await AttendanceModel.find(query).lean();
            const populatedAttendance = await populateNames(schoolDb, attendance);
            studentData = {
                attendance: populatedAttendance,
                summary: {
                    total: populatedAttendance.length,
                    present: populatedAttendance.filter((a) => a.status === "present").length,
                    absent: populatedAttendance.filter((a) => a.status === "absent").length,
                    late: populatedAttendance.filter((a) => a.status === "late").length,
                    halfDay: populatedAttendance.filter((a) => a.status === "half_day").length,
                    leave: populatedAttendance.filter((a) => a.status === "leave").length,
                },
            };
        } else if (mode === "period_wise") {
            const AttendanceModel = schoolDb.model("AttendancePeriod", attendancePeriodSchema);
            const query = { date: { $gte: attendanceDate, $lte: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000 - 1) } };
            if (classId) query.classId = classId;
            if (sectionId) query.sectionId = sectionId;

            const attendance = await AttendanceModel.find(query).sort({ period: 1 }).lean();
            const populatedAttendance = await populateNames(schoolDb, attendance);

            // Group by student and count unique attendance
            const studentAttendance = {};
            populatedAttendance.forEach((a) => {
                if (!studentAttendance[a.studentId]) {
                    studentAttendance[a.studentId] = { 
                        studentId: a.studentId, 
                        studentName: a.studentName,
                        className: a.className,
                        sectionName: a.sectionName,
                        present: 0, 
                        absent: 0, 
                        late: 0, 
                        total: 0 
                    };
                }
                studentAttendance[a.studentId][a.status]++;
                studentAttendance[a.studentId].total++;
            });

            studentData = {
                attendance: populatedAttendance,
                byStudent: studentAttendance,
                summary: {
                    totalRecords: populatedAttendance.length,
                    present: populatedAttendance.filter((a) => a.status === "present").length,
                    absent: populatedAttendance.filter((a) => a.status === "absent").length,
                    late: populatedAttendance.filter((a) => a.status === "late").length,
                },
            };
        } else if (mode === "check_in_out") {
            const AttendanceModel = schoolDb.model("AttendanceCheckin", attendanceCheckinSchema);
            const query = { 
                date: { $gte: attendanceDate, $lte: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000 - 1) }, 
                userType: "student" 
            };
            if (classId) query.classId = classId;
            if (sectionId) query.sectionId = sectionId;

            const attendance = await AttendanceModel.find(query).lean();
            const populatedAttendance = await populateNames(schoolDb, attendance);
            studentData = {
                attendance: populatedAttendance,
                summary: {
                    total: populatedAttendance.length,
                    present: populatedAttendance.filter((a) => a.status === "present").length,
                    late: populatedAttendance.filter((a) => a.status === "late").length,
                    halfDay: populatedAttendance.filter((a) => a.status === "half_day").length,
                    pending: populatedAttendance.filter((a) => a.status === "pending").length,
                },
            };
        }

        // Get teacher attendance (always simple mode)
        const TeacherAttendanceModel = schoolDb.model("TeacherAttendance", teacherAttendanceSchema);
        const query = { date: { $gte: attendanceDate, $lte: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000 - 1) } };
        const teacherAttendance = await TeacherAttendanceModel.find(query).lean();
        const populatedTeacherAttendance = await populateNames(schoolDb, teacherAttendance);
        teacherData = {
            attendance: populatedTeacherAttendance,
            summary: {
                total: populatedTeacherAttendance.length,
                present: populatedTeacherAttendance.filter((a) => a.status === "present").length,
                absent: populatedTeacherAttendance.filter((a) => a.status === "absent").length,
                late: populatedTeacherAttendance.filter((a) => a.status === "late").length,
                halfDay: populatedTeacherAttendance.filter((a) => a.status === "half_day").length,
                leave: populatedTeacherAttendance.filter((a) => a.status === "leave").length,
            },
        };

        res.status(200).json({
            success: true,
            data: {
                date: attendanceDate,
                mode: mode || "simple",
                students: studentData,
                teachers: teacherData,
            },
        });
    } catch (error) {
        console.error("Error getting daily report:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get daily report",
            error: error.message,
        });
    }
};

/**
 * Get monthly attendance report
 * GET /api/school/:schoolId/attendance/reports/monthly
 */
const getMonthlyReport = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { year, month, mode, classId, sectionId, type } = req.query;
        // type = "student" | "teacher" | "both"

        const schoolDb = await getSchoolDb(schoolId);

        // Calculate date range for the month
        const y = parseInt(year) || new Date().getFullYear();
        const m = parseInt(month) || new Date().getMonth() + 1;
        const startDate = new Date(y, m - 1, 1);
        const endDate = new Date(y, m, 0);
        endDate.setHours(23, 59, 59, 999);

        const report = {
            year: y,
            month: m,
            startDate,
            endDate,
            students: null,
            teachers: null,
        };

        // Student report
        if (type === "student" || type === "both" || !type) {
            let AttendanceModel;
            if (mode === "period_wise") {
                AttendanceModel = schoolDb.model("AttendancePeriod", attendancePeriodSchema);
            } else if (mode === "check_in_out") {
                AttendanceModel = schoolDb.model("AttendanceCheckin", attendanceCheckinSchema);
            } else {
                AttendanceModel = schoolDb.model("AttendanceSimple", attendanceSimpleSchema);
            }

            const query = {
                date: { $gte: startDate, $lte: endDate },
            };
            if (classId) query.classId = classId;
            if (sectionId) query.sectionId = sectionId;
            if (mode === "check_in_out") query.userType = "student";

            const attendance = await AttendanceModel.find(query).lean();
            const populatedAttendance = await populateNames(schoolDb, attendance);

            // Group by student
            const byStudent = {};
            populatedAttendance.forEach((a) => {
                const sid = a.studentId || a.userId;
                if (!byStudent[sid]) {
                    byStudent[sid] = {
                        studentId: sid,
                        studentName: a.studentName,
                        classId: a.classId,
                        className: a.className,
                        sectionId: a.sectionId,
                        sectionName: a.sectionName,
                        present: 0,
                        absent: 0,
                        late: 0,
                        halfDay: 0,
                        leave: 0,
                        total: 0,
                    };
                }
                byStudent[sid][a.status] = (byStudent[sid][a.status] || 0) + 1;
                byStudent[sid].total++;
            });

            // Calculate percentages
            Object.values(byStudent).forEach((s) => {
                s.percentage = s.total > 0
                    ? (((s.present || 0) + (s.late || 0) + (s.halfDay || 0) * 0.5) / s.total * 100).toFixed(2)
                    : 0;
            });

            report.students = {
                byStudent: Object.values(byStudent),
                totalRecords: populatedAttendance.length,
                workingDays: [...new Set(populatedAttendance.map((a) => a.date.toISOString().split("T")[0]))].length,
            };
        }

        // Teacher report
        if (type === "teacher" || type === "both" || !type) {
            const TeacherAttendanceModel = schoolDb.model("TeacherAttendance", teacherAttendanceSchema);
            const teacherAttendance = await TeacherAttendanceModel.find({
                date: { $gte: startDate, $lte: endDate },
            }).lean();
            const populatedTeacherAttendance = await populateNames(schoolDb, teacherAttendance);

            // Group by teacher
            const byTeacher = {};
            populatedTeacherAttendance.forEach((a) => {
                if (!byTeacher[a.teacherId]) {
                    byTeacher[a.teacherId] = {
                        teacherId: a.teacherId,
                        teacherName: a.teacherName,
                        present: 0,
                        absent: 0,
                        late: 0,
                        halfDay: 0,
                        leave: 0,
                        total: 0,
                    };
                }
                byTeacher[a.teacherId][a.status]++;
                byTeacher[a.teacherId].total++;
            });

            Object.values(byTeacher).forEach((t) => {
                t.percentage = t.total > 0
                    ? (((t.present || 0) + (t.late || 0) + (t.halfDay || 0) * 0.5) / t.total * 100).toFixed(2)
                    : 0;
            });

            report.teachers = {
                byTeacher: Object.values(byTeacher),
                totalRecords: teacherAttendance.length,
                workingDays: [...new Set(teacherAttendance.map((a) => a.date.toISOString().split("T")[0]))].length,
            };
        }

        res.status(200).json({
            success: true,
            data: report,
        });
    } catch (error) {
        console.error("Error getting monthly report:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get monthly report",
            error: error.message,
        });
    }
};

/**
 * Get date range attendance report
 * GET /api/school/:schoolId/attendance/reports/range
 */
const getDateRangeReport = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { startDate, endDate, mode, classId, sectionId, studentId, teacherId, type } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: "startDate and endDate are required",
            });
        }

        const schoolDb = await getSchoolDb(schoolId);
        const start = getDateOnly(startDate);
        const end = getDateOnly(endDate);
        end.setUTCHours(23, 59, 59, 999);

        const report = {
            startDate: start,
            endDate: end,
            students: null,
            teachers: null,
        };

        // Student report if needed
        if (type === "student" || type === "both" || !type) {
            let AttendanceModel;
            if (mode === "period_wise") {
                AttendanceModel = schoolDb.model("AttendancePeriod", attendancePeriodSchema);
            } else if (mode === "check_in_out") {
                AttendanceModel = schoolDb.model("AttendanceCheckin", attendanceCheckinSchema);
            } else {
                AttendanceModel = schoolDb.model("AttendanceSimple", attendanceSimpleSchema);
            }

            const query = { date: { $gte: start, $lte: end } };
            if (classId) query.classId = classId;
            if (sectionId) query.sectionId = sectionId;
            if (studentId) query.studentId = studentId;
            if (mode === "check_in_out") query.userType = "student";

            const attendance = await AttendanceModel.find(query).sort({ date: 1 }).lean();

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

            report.students = { records: attendance, summary };
        }

        // Teacher report if needed
        if (type === "teacher" || type === "both" || !type) {
            const TeacherAttendanceModel = schoolDb.model("TeacherAttendance", teacherAttendanceSchema);
            const query = { date: { $gte: start, $lte: end } };
            if (teacherId) query.teacherId = teacherId;

            const teacherAttendance = await TeacherAttendanceModel.find(query).sort({ date: 1 }).lean();

            const summary = {
                total: teacherAttendance.length,
                present: teacherAttendance.filter((a) => a.status === "present").length,
                absent: teacherAttendance.filter((a) => a.status === "absent").length,
                late: teacherAttendance.filter((a) => a.status === "late").length,
                halfDay: teacherAttendance.filter((a) => a.status === "half_day").length,
                leave: teacherAttendance.filter((a) => a.status === "leave").length,
            };
            summary.percentage = summary.total > 0
                ? ((summary.present + summary.late + summary.halfDay * 0.5) / summary.total * 100).toFixed(2)
                : 0;

            report.teachers = { records: teacherAttendance, summary };
        }

        res.status(200).json({
            success: true,
            data: report,
        });
    } catch (error) {
        console.error("Error getting date range report:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get date range report",
            error: error.message,
        });
    }
};

/**
 * Get class-wise attendance summary
 * GET /api/school/:schoolId/attendance/reports/classwise
 */
const getClassWiseReport = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { date, mode, classId, sectionId } = req.query;

        const schoolDb = await getSchoolDb(schoolId);
        const attendanceDate = getDateOnly(date || new Date());

        let AttendanceModel;
        if (mode === "period_wise") {
            AttendanceModel = schoolDb.model("AttendancePeriod", attendancePeriodSchema);
        } else if (mode === "check_in_out") {
            AttendanceModel = schoolDb.model("AttendanceCheckin", attendanceCheckinSchema);
        } else {
            AttendanceModel = schoolDb.model("AttendanceSimple", attendanceSimpleSchema);
        }

        const query = { date: { $gte: attendanceDate, $lte: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000 - 1) } };
        if (classId) query.classId = classId;
        if (sectionId) query.sectionId = sectionId;
        if (mode === "check_in_out") query.userType = "student";

        const attendance = await AttendanceModel.find(query).lean();
        const populatedAttendance = await populateNames(schoolDb, attendance);

        // Group by class and section
        const byClass = {};
        populatedAttendance.forEach((a) => {
            const key = `${a.classId}|${a.sectionId || "all"}`;
            if (!byClass[key]) {
                byClass[key] = {
                    classId: a.classId,
                    sectionId: a.sectionId,
                    className: a.className,
                    sectionName: a.sectionName,
                    present: 0,
                    absent: 0,
                    late: 0,
                    halfDay: 0,
                    leave: 0,
                    total: 0,
                };
            }
            byClass[key][a.status] = (byClass[key][a.status] || 0) + 1;
            byClass[key].total++;
        });

        Object.values(byClass).forEach((c) => {
            c.percentage = c.total > 0
                ? (((c.present || 0) + (c.late || 0) + (c.halfDay || 0) * 0.5) / c.total * 100).toFixed(2)
                : 0;
        });

        res.status(200).json({
            success: true,
            data: {
                date: attendanceDate,
                classes: Object.values(byClass),
            },
        });
    } catch (error) {
        console.error("Error getting class-wise report:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get class-wise report",
            error: error.message,
        });
    }
};

module.exports = {
    getDailyReport,
    getMonthlyReport,
    getDateRangeReport,
    getClassWiseReport,
};
