const express = require("express");
const router = express.Router({ mergeParams: true });

// Controllers
const simpleController = require("../controllers/attendance-simple.controller");
const periodController = require("../controllers/attendance-period.controller");
const checkinController = require("../controllers/attendance-checkin.controller");
const teacherController = require("../controllers/teacher-attendance.controller");
const reportsController = require("../controllers/attendance-reports.controller");

// Middleware
const { Authenticated, authorizeRoles } = require("@sms/shared/middlewares");

// ==========================================
// SIMPLE DAILY ATTENDANCE ROUTES
// ==========================================

// Mark class attendance (bulk)
router.post(
    "/simple/mark",
    Authenticated,
    authorizeRoles("teacher", "sch_admin"),
    simpleController.markClassAttendance
);

// Get class attendance for a date
router.get(
    "/simple/class/:classId/:date",
    Authenticated,
    authorizeRoles("teacher", "sch_admin", "principal"),
    simpleController.getClassAttendance
);

// Get student attendance history
router.get(
    "/simple/student/:studentId",
    Authenticated,
    authorizeRoles("teacher", "sch_admin", "student", "parent", "principal"),
    simpleController.getStudentAttendance
);

// Update single attendance record
router.put(
    "/simple/:attendanceId",
    Authenticated,
    authorizeRoles("sch_admin"),
    simpleController.updateAttendance
);

// Get attendance summary
router.get(
    "/simple/summary",
    Authenticated,
    authorizeRoles("sch_admin", "principal"),
    simpleController.getAttendanceSummary
);

// ==========================================
// PERIOD-WISE ATTENDANCE ROUTES
// ==========================================

// Mark period attendance (bulk)
router.post(
    "/period/mark",
    Authenticated,
    authorizeRoles("teacher", "sch_admin"),
    periodController.markPeriodAttendance
);

// Get class attendance for a specific period
router.get(
    "/period/class/:classId/:date/:period",
    Authenticated,
    authorizeRoles("teacher", "sch_admin", "principal"),
    periodController.getPeriodAttendance
);

// Get all periods attendance for a class on a date
router.get(
    "/period/class/:classId/:date",
    Authenticated,
    authorizeRoles("teacher", "sch_admin", "principal"),
    periodController.getDayAttendance
);

// Get student period-wise attendance history
router.get(
    "/period/student/:studentId",
    Authenticated,
    authorizeRoles("teacher", "sch_admin", "student", "parent", "principal"),
    periodController.getStudentPeriodAttendance
);

// Get subject-wise attendance summary
router.get(
    "/period/subject/:subjectId/summary",
    Authenticated,
    authorizeRoles("teacher", "sch_admin", "principal"),
    periodController.getSubjectAttendanceSummary
);

// ==========================================
// CHECK-IN/CHECK-OUT ATTENDANCE ROUTES
// ==========================================

// Check in
router.post(
    "/checkin/in",
    Authenticated,
    authorizeRoles("teacher", "sch_admin", "student"),
    checkinController.checkIn
);

// Check out
router.post(
    "/checkin/out",
    Authenticated,
    authorizeRoles("teacher", "sch_admin", "student"),
    checkinController.checkOut
);

// Get check-in status for a user
router.get(
    "/checkin/status/:userId",
    Authenticated,
    authorizeRoles("teacher", "sch_admin", "student"),
    checkinController.getCheckInStatus
);

// Get daily check-ins
router.get(
    "/checkin/daily/:date",
    Authenticated,
    authorizeRoles("sch_admin"),
    checkinController.getDailyCheckins
);

// Manual mark attendance (admin)
router.post(
    "/checkin/manual",
    Authenticated,
    authorizeRoles("sch_admin"),
    checkinController.manualMarkAttendance
);

// ==========================================
// TEACHER ATTENDANCE ROUTES
// ==========================================

// Teacher self check-in
router.post(
    "/teacher/check-in",
    Authenticated,
    authorizeRoles("teacher"),
    teacherController.teacherCheckIn
);

// Teacher self check-out
router.post(
    "/teacher/check-out",
    Authenticated,
    authorizeRoles("teacher"),
    teacherController.teacherCheckOut
);

// Get teacher's own status
router.get(
    "/teacher/status",
    Authenticated,
    authorizeRoles("teacher"),
    teacherController.getTeacherStatus
);

// Admin marks teacher attendance (bulk)
router.post(
    "/teacher/mark",
    Authenticated,
    authorizeRoles("sch_admin"),
    teacherController.markTeacherAttendance
);

// Get all teachers' attendance for a date
router.get(
    "/teacher/daily/:date",
    Authenticated,
    authorizeRoles("sch_admin", "principal"),
    teacherController.getTeachersAttendance
);

// Get single teacher's attendance history
router.get(
    "/teacher/:teacherId/history",
    Authenticated,
    authorizeRoles("teacher", "sch_admin", "principal"),
    teacherController.getTeacherHistory
);

// ==========================================
// ATTENDANCE REPORTS ROUTES
// ==========================================

// Daily report
router.get(
    "/reports/daily",
    Authenticated,
    authorizeRoles("sch_admin", "principal"),
    reportsController.getDailyReport
);

// Monthly report
router.get(
    "/reports/monthly",
    Authenticated,
    authorizeRoles("sch_admin", "principal"),
    reportsController.getMonthlyReport
);

// Date range report
router.get(
    "/reports/range",
    Authenticated,
    authorizeRoles("sch_admin", "principal"),
    reportsController.getDateRangeReport
);

// Class-wise report
router.get(
    "/reports/classwise",
    Authenticated,
    authorizeRoles("sch_admin", "principal"),
    reportsController.getClassWiseReport
);

module.exports = router;
