const express = require("express");
const router = express.Router({ mergeParams: true });

const {
    createParent,
    getParentById,
    getAllParents,
    updateParentById,
    getParentsByStudentId,
    searchParents,
} = require("../controllers/parent.controller");
const { Authenticated, authorizeRoles } = require("@sms/shared/middlewares");

// All routes require authentication and appropriate role
// GET /api/school/:schoolId/parents/search?query=xxx - Search parents
router.get(
    "/search",
    Authenticated,
    authorizeRoles("super_admin", "sch_admin", "teacher"),
    searchParents
);

// POST /api/school/:schoolId/parents - Create a new parent
router.post(
    "/",
    Authenticated,
    authorizeRoles("super_admin", "sch_admin", "teacher"),
    createParent
);

// GET /api/school/:schoolId/parents - Get all parents
router.get(
    "/",
    Authenticated,
    authorizeRoles("super_admin", "sch_admin", "teacher", "parent"),
    getAllParents
);

// GET /api/school/:schoolId/parents/student/:studentId - Get parents by student ID
router.get(
    "/student/:studentId",
    Authenticated,
    authorizeRoles("super_admin", "sch_admin", "teacher", "parent"),
    getParentsByStudentId
);

// GET /api/school/:schoolId/parents/:id - Get parent by ID
router.get(
    "/:id",
    Authenticated,
    authorizeRoles("super_admin", "sch_admin", "teacher", "parent"),
    getParentById
);

// PUT /api/school/:schoolId/parents/:id - Update parent
router.put(
    "/:id",
    Authenticated,
    authorizeRoles("super_admin", "sch_admin"),
    updateParentById
);

module.exports = router;
