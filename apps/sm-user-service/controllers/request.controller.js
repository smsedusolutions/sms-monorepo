const { getSchoolDbConnection } = require("../configs/db");
const { SchoolModel: School, RequestSchema: requestSchema } = require("@sms/shared");

/**
 * Get Request model for a specific school database
 */
const getRequestModel = (schoolDbName) => {
    const schoolDb = getSchoolDbConnection(schoolDbName);
    return schoolDb.model("Request", requestSchema);
};

const { generateNextId } = require("@sms/shared/utils");

/**
 * Generate request ID
 */
const generateRequestId = async (Request) => {
    return generateNextId(Request, "requestId", "REQ", 5);
};

/**
 * Get school database name by schoolId
 */
const getSchoolDbName = async (schoolId) => {
    const school = await School.findOne({ schoolId });
    if (!school) return null;
    return school.schoolDbName;
};

// Create a new request
const createRequest = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { userType, userId, userName, requestType, oldValue, newValue, message } = req.body;

        if (!userType || !userId || !userName || !requestType || !message) {
            return res.status(400).json({
                success: false,
                message: "userType, userId, userName, requestType, and message are required",
            });
        }

        const schoolDbName = await getSchoolDbName(schoolId);
        if (!schoolDbName) {
            return res.status(404).json({
                success: false,
                message: "School not found",
            });
        }

        const Request = getRequestModel(schoolDbName);
        const requestId = await generateRequestId(Request);

        const newRequest = new Request({
            requestId,
            userType,
            userId,
            userName,
            requestType,
            oldValue: oldValue || "",
            newValue: newValue || "",
            message,
            status: "pending",
        });

        await newRequest.save();

        return res.status(201).json({
            success: true,
            message: "Request submitted successfully",
            data: newRequest,
        });
    } catch (error) {
        console.error("Error creating request:", error);
        return res.status(500).json({
            success: false,
            message: "Error creating request",
            error: error.message,
        });
    }
};

// Get my requests (for a specific user)
const getMyRequests = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { userId, userType } = req.query;

        if (!userId || !userType) {
            return res.status(400).json({
                success: false,
                message: "userId and userType are required",
            });
        }

        const schoolDbName = await getSchoolDbName(schoolId);
        if (!schoolDbName) {
            return res.status(404).json({
                success: false,
                message: "School not found",
            });
        }

        const Request = getRequestModel(schoolDbName);
        const requests = await Request.find({ userId, userType }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: requests,
            count: requests.length,
        });
    } catch (error) {
        console.error("Error fetching requests:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching requests",
            error: error.message,
        });
    }
};

// Get all requests (admin only)
const getAllRequests = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { status, userType } = req.query;

        const schoolDbName = await getSchoolDbName(schoolId);
        if (!schoolDbName) {
            return res.status(404).json({
                success: false,
                message: "School not found",
            });
        }

        const Request = getRequestModel(schoolDbName);

        const filter = {};
        if (status) filter.status = status;
        if (userType) filter.userType = userType;

        const requests = await Request.find(filter).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: requests,
            count: requests.length,
        });
    } catch (error) {
        console.error("Error fetching all requests:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching requests",
            error: error.message,
        });
    }
};

// Update request status (admin only)
const updateRequestStatus = async (req, res) => {
    try {
        const { schoolId, requestId } = req.params;
        const { status, adminReply } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: "status is required",
            });
        }

        if (!["pending", "approved", "rejected"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status. Must be pending, approved, or rejected",
            });
        }

        const schoolDbName = await getSchoolDbName(schoolId);
        if (!schoolDbName) {
            return res.status(404).json({
                success: false,
                message: "School not found",
            });
        }

        const Request = getRequestModel(schoolDbName);
        const updatedRequest = await Request.findOneAndUpdate(
            { requestId },
            { status, adminReply: adminReply || "" },
            { new: true }
        );

        if (!updatedRequest) {
            return res.status(404).json({
                success: false,
                message: "Request not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Request updated successfully",
            data: updatedRequest,
        });
    } catch (error) {
        console.error("Error updating request:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating request",
            error: error.message,
        });
    }
};

module.exports = {
    createRequest,
    getMyRequests,
    getAllRequests,
    updateRequestStatus,
};
