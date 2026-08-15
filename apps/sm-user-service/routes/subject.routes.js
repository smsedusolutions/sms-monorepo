const express = require("express");
const router = express.Router({ mergeParams: true });

const {
    createSubject,
    getAllSubjects,
    getSubjectById,
    updateSubjectById,
    deleteSubjectById,
} = require("../controllers/subject.controller");
const { Authenticated, authorizeRoles } = require("@sms/shared/middlewares");

// All routes require authentication

// POST /api/school/:schoolId/subjects - Create a new subject
router.post("/", Authenticated, authorizeRoles("sch_admin"), createSubject);

// GET /api/school/:schoolId/subjects - Get all subjects
router.get("/", Authenticated, authorizeRoles("sch_admin", "teacher", "parent", "student", "principal"), getAllSubjects);

// GET /api/school/:schoolId/subjects/:id - Get subject by ID
router.get("/:id", Authenticated, authorizeRoles("sch_admin", "teacher", "principal"), getSubjectById);

// PUT /api/school/:schoolId/subjects/:id - Update subject
router.put("/:id", Authenticated, authorizeRoles("sch_admin"), updateSubjectById);

// DELETE /api/school/:schoolId/subjects/:id - Delete subject (soft delete)
router.delete("/:id", Authenticated, authorizeRoles("sch_admin"), deleteSubjectById);

module.exports = router;
