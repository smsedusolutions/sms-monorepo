const express = require("express");
const router = express.Router({ mergeParams: true });

const {
    createStudent,
    getStudentById,
    getAllStudents,
    updateStudentById,
    deleteStudentById,
    searchStudents,
    bulkCreateStudents,
    getStudentBackups,
    restoreStudentBackup,
} = require("../controllers/student.controller");
const { Authenticated, authorizeRoles } = require("@sms/shared/middlewares");

// All routes require authentication and appropriate role
// GET /api/school/:schoolId/students/search?query=xxx - Search students
router.get(
    "/search",
    Authenticated,
    authorizeRoles("super_admin", "sch_admin", "principal"),
    searchStudents
);

// GET /api/school/:schoolId/students/backups - Get student backups
router.get(
    "/backups",
    Authenticated,
    authorizeRoles("super_admin", "sch_admin"),
    getStudentBackups
);

// POST /api/school/:schoolId/students/restore - Restore student backup
router.post(
    "/restore",
    Authenticated,
    authorizeRoles("super_admin", "sch_admin"),
    restoreStudentBackup
);

// POST /api/school/:schoolId/students/bulk-upload - Bulk create students
router.post(
    "/bulk-upload",
    Authenticated,
    authorizeRoles("super_admin", "sch_admin"),
    bulkCreateStudents
);

// POST /api/school/:schoolId/students - Create a new student
router.post(
    "/",
    Authenticated,
    authorizeRoles("super_admin", "sch_admin", "teacher"),
    createStudent
);

// GET /api/school/:schoolId/students - Get all students
router.get(
    "/",
    Authenticated,
    authorizeRoles("super_admin", "sch_admin", "teacher", "principal"),
    getAllStudents
);

// GET /api/school/:schoolId/students/:id - Get student by ID
router.get(
    "/:id",
    Authenticated,
    authorizeRoles("super_admin", "sch_admin", "teacher", "parent", "student", "principal"),
    getStudentById
);

// PUT /api/school/:schoolId/students/:id - Update student
router.put(
    "/:id",
    Authenticated,
    authorizeRoles("super_admin", "sch_admin", "teacher"),
    updateStudentById
);

// DELETE /api/school/:schoolId/students/:id - Delete student (soft delete)
router.delete(
    "/:id",
    Authenticated,
    authorizeRoles("super_admin", "sch_admin"),
    deleteStudentById
);

module.exports = router;
