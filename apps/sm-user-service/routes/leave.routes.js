const express = require("express");
const router = express.Router({ mergeParams: true }); // To access :schoolId from parent router
const {
    applyLeave,
    getMyLeaves,
    getAllLeaves,
    processLeave,
    getLeaveById,
    cancelLeave,
    getLeaveStats,
    getStudentLeavesForTeacher,
    getTeachersOnLeaveForDate,
    getParentChildrenLeaves,
} = require("../controllers/leave.controller");
const { checkAuth, checkRole } = require("@sms/shared/middlewares");

// All routes require authentication
router.use(checkAuth);

// Admin routes (placed first to avoid conflict with :leaveId)
// Get leave statistics for dashboard
router.get("/stats", checkRole(["sch_admin", "principal"]), getLeaveStats);

// Get all leave requests
router.get("/all", checkRole(["sch_admin", "principal"]), getAllLeaves);

// Get teachers on leave for a specific date (for timetable integration)
router.get("/teachers-on-leave", checkRole(["sch_admin", "principal"]), getTeachersOnLeaveForDate);

// Teacher routes for class student leaves
router.get("/class-leaves", checkRole(["teacher", "principal"]), getStudentLeavesForTeacher);

// Student/Teacher routes
// Apply for leave
router.post("/apply", checkRole(["student", "teacher", "parent", "principal"]), applyLeave);

// Get my leave requests
router.get("/my", checkRole(["student", "teacher", "parent", "principal"]), getMyLeaves);

// Get leave requests for parent's children
router.get("/parent", checkRole(["parent"]), getParentChildrenLeaves);

// Get specific leave by ID
router.get("/:leaveId", checkRole(["student", "teacher", "sch_admin", "principal"]), getLeaveById);

// Cancel pending leave (own request only)
router.delete("/:leaveId", checkRole(["student", "teacher", "principal"]), cancelLeave);

// Process (approve/reject) leave - Admin, Principal, and Teachers can process
router.put("/:leaveId/process", checkRole(["sch_admin", "teacher", "principal"]), processLeave);

module.exports = router;

