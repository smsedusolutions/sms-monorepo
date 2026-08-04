const express = require("express");
const router = express.Router({ mergeParams: true });

// Controllers
const configController = require("../controllers/timetable-config.controller");
const entryController = require("../controllers/timetable-entry.controller");
const substituteController = require("../controllers/substitute.controller");
const roomController = require("../controllers/room.controller");
const periodSwapController = require("../controllers/period-swap.controller");
const reportsController = require("../controllers/reports.controller");
const aiController = require("../controllers/timetable-ai.controller");

// Middleware
const { Authenticated, authorizeRoles } = require("@sms/shared/middlewares");

// ==========================================
// TIMETABLE CONFIGURATION ROUTES
// ==========================================

// Create new config
router.post(
    "/config",
    Authenticated,
    authorizeRoles("sch_admin"),
    configController.createConfig
);

// Get active config
router.get(
    "/config/active",
    Authenticated,
    authorizeRoles("sch_admin", "teacher", "student", "parent"),
    configController.getActiveConfig
);

// Get all configs
router.get(
    "/config",
    Authenticated,
    authorizeRoles("sch_admin"),
    configController.getAllConfigs
);

// Get config by ID
router.get(
    "/config/:configId",
    Authenticated,
    authorizeRoles("sch_admin"),
    configController.getConfigById
);

// Update config
router.put(
    "/config/:configId",
    Authenticated,
    authorizeRoles("sch_admin"),
    configController.updateConfig
);

// Set config as active
router.patch(
    "/config/:configId/activate",
    Authenticated,
    authorizeRoles("sch_admin"),
    configController.setActiveConfig
);

// Delete config
router.delete(
    "/config/:configId",
    Authenticated,
    authorizeRoles("sch_admin"),
    configController.deleteConfig
);

// Upsert period in config
router.post(
    "/config/:configId/period",
    Authenticated,
    authorizeRoles("sch_admin"),
    configController.upsertPeriod
);

// Remove period from config
router.delete(
    "/config/:configId/period/:periodNumber",
    Authenticated,
    authorizeRoles("sch_admin"),
    configController.removePeriod
);

// Upsert shift in config
router.post(
    "/config/:configId/shift",
    Authenticated,
    authorizeRoles("sch_admin"),
    configController.upsertShift
);

// Remove shift from config
router.delete(
    "/config/:configId/shift/:shiftId",
    Authenticated,
    authorizeRoles("sch_admin"),
    configController.removeShift
);

// Toggle timetable temporary disable
router.patch(
    "/config/toggle-disable",
    Authenticated,
    authorizeRoles("sch_admin"),
    configController.toggleTimetableDisable
);

// ==========================================
// TIMETABLE AI ROUTES
// ==========================================

// Validate AI Rules
router.post(
    "/ai/validate",
    Authenticated,
    authorizeRoles("sch_admin"),
    aiController.validateAITimetable
);

// Suggest AI Rules (priority-based auto-suggest)
router.post(
    "/ai/suggest-rules",
    Authenticated,
    authorizeRoles("sch_admin"),
    aiController.suggestRules
);

// Generate AI Timetable
router.post(
    "/ai/generate",
    Authenticated,
    authorizeRoles("sch_admin"),
    aiController.generateAITimetable
);

// Get AI Draft
router.get(
    "/ai/draft",
    Authenticated,
    authorizeRoles("sch_admin"),
    aiController.getAIDraft
);

// Get AI Draft Versions
router.get(
    "/ai/draft/versions",
    Authenticated,
    authorizeRoles("sch_admin"),
    aiController.getAIDraftVersions
);

// Delete AI Draft Version
router.delete(
    "/ai/draft/:version",
    Authenticated,
    authorizeRoles("sch_admin"),
    aiController.deleteAIDraftVersion
);

// Publish AI Draft
router.post(
    "/ai/draft/publish",
    Authenticated,
    authorizeRoles("sch_admin"),
    aiController.publishAIDraft
);

// Update/Add AI Draft Entry
router.post(
    "/ai/draft/entry",
    Authenticated,
    authorizeRoles("sch_admin"),
    aiController.updateAIDraftEntry
);

// Delete AI Draft Entry
router.delete(
    "/ai/draft/entry/:classId/:sectionId/:dayOfWeek/:periodNumber",
    Authenticated,
    authorizeRoles("sch_admin"),
    aiController.deleteAIDraftEntry
);

// ==========================================
// TIMETABLE ENTRY ROUTES
// ==========================================

// Create single entry
router.post(
    "/entry",
    Authenticated,
    authorizeRoles("sch_admin"),
    entryController.createEntry
);

// Bulk create entries
router.post(
    "/entries/bulk",
    Authenticated,
    authorizeRoles("sch_admin"),
    entryController.bulkCreateEntries
);

// Get class timetable
router.get(
    "/class/:classId/:sectionId",
    Authenticated,
    authorizeRoles("sch_admin", "teacher", "student", "parent"),
    entryController.getClassTimetable
);

// Delete all entries for a class/section
router.delete(
    "/class/:classId/:sectionId",
    Authenticated,
    authorizeRoles("sch_admin"),
    entryController.deleteClassTimetable
);

// Get list of class sections that have an active timetable
router.get(
    "/active-classes",
    Authenticated,
    authorizeRoles("sch_admin"),
    entryController.getClassesWithTimetables
);

// Copy timetable from another class
router.post(
    "/copy",
    Authenticated,
    authorizeRoles("sch_admin"),
    entryController.copyClassTimetable
);

// Get teacher timetable
router.get(
    "/teacher/:teacherId",
    Authenticated,
    authorizeRoles("sch_admin", "teacher"),
    entryController.getTeacherTimetable
);

// Get entries by day
router.get(
    "/day/:dayOfWeek",
    Authenticated,
    authorizeRoles("sch_admin"),
    entryController.getEntriesByDay
);

// Update entry
router.put(
    "/entry/:entryId",
    Authenticated,
    authorizeRoles("sch_admin"),
    entryController.updateEntry
);

// Delete entry
router.delete(
    "/entry/:entryId",
    Authenticated,
    authorizeRoles("sch_admin"),
    entryController.deleteEntry
);

// Get teacher free periods
router.get(
    "/teacher/:teacherId/free-periods",
    Authenticated,
    authorizeRoles("sch_admin", "teacher"),
    entryController.getTeacherFreePeriods
);

// Get free teachers for a period
router.get(
    "/free-teachers",
    Authenticated,
    authorizeRoles("sch_admin"),
    entryController.getFreeTeachersForPeriod
);

// Get conflict report
router.get(
    "/conflicts",
    Authenticated,
    authorizeRoles("sch_admin"),
    entryController.getConflictReport
);

// ==========================================
// SUBSTITUTE ROUTES
// ==========================================

// Create substitute
router.post(
    "/substitute",
    Authenticated,
    authorizeRoles("sch_admin"),
    substituteController.createSubstitute
);

// Get substitutes for date
router.get(
    "/substitute/date/:date",
    Authenticated,
    authorizeRoles("sch_admin", "teacher", "parent", "student"),
    substituteController.getSubstitutesForDate
);

// Get substitute history
router.get(
    "/substitute/history",
    Authenticated,
    authorizeRoles("sch_admin"),
    substituteController.getSubstituteHistory
);

// Cancel substitute
router.patch(
    "/substitute/:substituteId/cancel",
    Authenticated,
    authorizeRoles("sch_admin"),
    substituteController.cancelSubstitute
);

// Update substitute status
router.patch(
    "/substitute/:substituteId/status",
    Authenticated,
    authorizeRoles("sch_admin"),
    substituteController.updateSubstituteStatus
);

// ==========================================
// ROOM ROUTES
// ==========================================

// Create room
router.post(
    "/room",
    Authenticated,
    authorizeRoles("sch_admin"),
    roomController.createRoom
);

// Get all rooms
router.get(
    "/rooms",
    Authenticated,
    authorizeRoles("sch_admin", "teacher"),
    roomController.getAllRooms
);

// Get room by ID
router.get(
    "/room/:roomId",
    Authenticated,
    authorizeRoles("sch_admin", "teacher"),
    roomController.getRoomById
);

// Update room
router.put(
    "/room/:roomId",
    Authenticated,
    authorizeRoles("sch_admin"),
    roomController.updateRoom
);

// Delete room
router.delete(
    "/room/:roomId",
    Authenticated,
    authorizeRoles("sch_admin"),
    roomController.deleteRoom
);

// Get room availability
router.get(
    "/room/:roomId/availability",
    Authenticated,
    authorizeRoles("sch_admin", "teacher"),
    roomController.getRoomAvailability
);

// Get available rooms for a period
router.get(
    "/rooms/available",
    Authenticated,
    authorizeRoles("sch_admin"),
    roomController.getAvailableRooms
);

// ==========================================
// PERIOD SWAP ROUTES
// ==========================================

// Request swap
router.post(
    "/swap",
    Authenticated,
    authorizeRoles("teacher", "sch_admin"),
    periodSwapController.requestSwap
);

// Get swap requests
router.get(
    "/swaps",
    Authenticated,
    authorizeRoles("sch_admin", "teacher"),
    periodSwapController.getSwapRequests
);

// Approve swap
router.patch(
    "/swap/:swapId/approve",
    Authenticated,
    authorizeRoles("sch_admin"),
    periodSwapController.approveSwap
);

// Reject swap
router.patch(
    "/swap/:swapId/reject",
    Authenticated,
    authorizeRoles("sch_admin"),
    periodSwapController.rejectSwap
);

// Cancel swap
router.patch(
    "/swap/:swapId/cancel",
    Authenticated,
    authorizeRoles("teacher", "sch_admin"),
    periodSwapController.cancelSwap
);

// ==========================================
// REPORT ROUTES
// ==========================================

// Get teacher workload
router.get(
    "/reports/teacher-workload",
    Authenticated,
    authorizeRoles("sch_admin"),
    reportsController.getTeacherWorkload
);

// Get subject distribution
router.get(
    "/reports/subject-distribution",
    Authenticated,
    authorizeRoles("sch_admin"),
    reportsController.getSubjectDistribution
);

// Get timetable summary
router.get(
    "/reports/summary",
    Authenticated,
    authorizeRoles("sch_admin"),
    reportsController.getTimetableSummary
);

// Export timetable data
router.get(
    "/export",
    Authenticated,
    authorizeRoles("sch_admin", "teacher", "student"),
    reportsController.exportTimetableData
);

module.exports = router;
