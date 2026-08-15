const express = require("express");
const router = express.Router();

const {
    createSchool,
    getSchoolById,
    getAllSchools,
    updateSchoolById,
    getSchoolBySubdomain,
} = require("../controllers/school.controller");

const { Authenticated, authorizeRoles } = require("@sms/shared/middlewares");

// =============================================
// PUBLIC routes (no auth required)
// Used by the login page for school branding
// =============================================
router.get("/public/by-subdomain/:subdomain", getSchoolBySubdomain);

// Apply authentication and authorization to all routes below
router.use(Authenticated);


// Create a new school
router.post("/create-school", authorizeRoles("super_admin"), createSchool);

// Get all schools
router.get("/get-all-schools", authorizeRoles("super_admin"), getAllSchools);

// Get school by schoolId
router.get("/get-school/:schoolId", authorizeRoles(["super_admin", "sch_admin", "teacher", "student", "parent", "driver", "principal"]), getSchoolById);

// Update school by schoolId
router.put("/update-school/:schoolId", authorizeRoles("super_admin", "sch_admin"), updateSchoolById);

module.exports = router;
