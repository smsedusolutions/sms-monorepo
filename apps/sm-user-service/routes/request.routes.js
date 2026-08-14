const express = require("express");
const router = express.Router({ mergeParams: true });

const {
    createRequest,
    getMyRequests,
    getAllRequests,
    updateRequestStatus,
} = require("../controllers/request.controller");
const { Authenticated, authorizeRoles } = require("@sms/shared/middlewares");

// POST /api/school/:schoolId/requests - Create a new request
router.post(
    "/",
    Authenticated,
    authorizeRoles("sch_admin", "teacher", "student", "parent", "principal"),
    createRequest
);

// GET /api/school/:schoolId/requests/my - Get my requests
router.get(
    "/my",
    Authenticated,
    authorizeRoles("sch_admin", "teacher", "student", "parent", "principal"),
    getMyRequests
);

// GET /api/school/:schoolId/requests - Get all requests (admin and principal)
router.get(
    "/",
    Authenticated,
    authorizeRoles("super_admin", "sch_admin", "principal"),
    getAllRequests
);

// PUT /api/school/:schoolId/requests/:requestId - Update request status (admin and principal)
router.put(
    "/:requestId",
    Authenticated,
    authorizeRoles("super_admin", "sch_admin", "principal"),
    updateRequestStatus
);

module.exports = router;
