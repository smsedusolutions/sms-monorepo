const express = require("express");
const router = express.Router({ mergeParams: true });

const {
    createClass,
    getAllClasses,
    getClassById,
    updateClassById,
    deleteClassById,
    addSection,
    removeSection,
    assignClassTeacher,
} = require("../controllers/class.controller");
const { Authenticated, authorizeRoles } = require("@sms/shared/middlewares");

// All routes require authentication and sch_admin role

// POST /api/school/:schoolId/classes - Create a new class
router.post("/", Authenticated, authorizeRoles("sch_admin"), createClass);

// GET /api/school/:schoolId/classes - Get all classes
router.get("/", Authenticated, authorizeRoles("sch_admin", "teacher", "student", "parent", "principal"), getAllClasses);

// GET /api/school/:schoolId/classes/:id - Get class by ID
router.get("/:id", Authenticated, authorizeRoles("sch_admin", "teacher", "student", "principal"), getClassById);

// PUT /api/school/:schoolId/classes/:id - Update class
router.put("/:id", Authenticated, authorizeRoles("sch_admin"), updateClassById);

// DELETE /api/school/:schoolId/classes/:id - Delete class (soft delete)
router.delete("/:id", Authenticated, authorizeRoles("sch_admin"), deleteClassById);

// POST /api/school/:schoolId/classes/:id/sections - Add section to class
router.post("/:id/sections", Authenticated, authorizeRoles("sch_admin"), addSection);

// DELETE /api/school/:schoolId/classes/:id/sections/:sectionId - Remove section
router.delete(
    "/:id/sections/:sectionId",
    Authenticated,
    authorizeRoles("sch_admin"),
    removeSection
);

// PUT /api/school/:schoolId/classes/:id/sections/:sectionId/teacher - Assign class teacher
router.put(
    "/:id/sections/:sectionId/teacher",
    Authenticated,
    authorizeRoles("sch_admin"),
    assignClassTeacher
);

module.exports = router;
