const express = require("express");
const router = express.Router({ mergeParams: true });

const {
  createTeacher,
  getTeacherById,
  getAllTeachers,
  updateTeacherById,
  deleteTeacherById,
} = require("../controllers/teacher.controller");
const { Authenticated, authorizeRoles } = require("@sms/shared/middlewares");
const { getMenus } = require("../controllers/dashboard.controller");

// All routes require authentication and appropriate role
// POST /api/school/:schoolId/teachers - Create a new teacher
router.post("/", Authenticated, authorizeRoles("sch_admin"), createTeacher);

// GET /api/school/:schoolId/teachers - Get all teachers
router.get("/", Authenticated, authorizeRoles("super_admin", "sch_admin", "teacher", "parent"), getAllTeachers);

// GET /api/school/:schoolId/teachers/:id - Get teacher by ID
router.get(
  "/:id",
  Authenticated,
  authorizeRoles("super_admin", "sch_admin", "teacher", "parent"),
  getTeacherById
);

// PUT /api/school/:schoolId/teachers/:id - Update teacher
router.put(
  "/:id",
  Authenticated,
  authorizeRoles("sch_admin"),
  updateTeacherById
);

// DELETE /api/school/:schoolId/teachers/:id - Delete teacher (soft delete)
router.delete(
  "/:id",
  Authenticated,
  authorizeRoles("sch_admin"),
  deleteTeacherById
);




module.exports = router;
