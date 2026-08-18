const mongoose = require("mongoose");
const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");
const {
    ParentSchema: parentSchema,
    StudentSchema: studentSchema,
    LeaveRequestSchema: leaveRequestSchema,
} = require("@sms/shared");
const { logActivity } = require("@sms/shared/utils");

// Helper to get the model for a specific school
const getLeaveModel = async (schoolId) => {
    const schoolDbName = await getSchoolDbName(schoolId);
    const schoolDb = getSchoolDbConnection(schoolDbName);

    try {
        return schoolDb.model("LeaveRequest");
    } catch (e) {
        return schoolDb.model("LeaveRequest", leaveRequestSchema);
    }
};

// Generate unique leave ID
const generateLeaveId = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    return `LV${timestamp}${random}`.toUpperCase();
};

/**
 * Apply for leave (Student/Teacher/Parent)
 * POST /api/school/:schoolId/leave/apply
 */
const applyLeave = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const {
            leaveType,
            startDate,
            endDate,
            reason,
            classId,
            sectionId,
            studentIds,
            studentId,
        } = req.body;

        const userRole = req.user?.role || "student";
        const applicantId = req.user?.studentId || req.user?.teacherId || req.user?.parentId || req.user?.userId || req.user?._id;
        const applicantType = ["teacher", "principal", "driver", "staff"].includes(userRole) ? "teacher" : "student";
        const applicantName = req.user?.name || (req.user?.firstName ? `${req.user.firstName} ${req.user.lastName || ''}`.trim() : req.user?.email || "Unknown");

        if (!leaveType || !startDate || !endDate || !reason) {
            return res.status(400).json({
                success: false,
                message: "leaveType, startDate, endDate, and reason are required",
            });
        }

        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end < start) {
            return res.status(400).json({
                success: false,
                message: "End date cannot be before start date",
            });
        }

        const schoolDbName = await getSchoolDbName(schoolId);
        const schoolDb = getSchoolDbConnection(schoolDbName);
        const LeaveModel = await getLeaveModel(schoolId);

        // Parent applying for children
        const targetStudentIds = (Array.isArray(studentIds) && studentIds.length > 0)
            ? studentIds
            : (studentId ? [studentId] : []);

        if (userRole === "parent" && targetStudentIds.length > 0) {
            let Student;
            try {
                Student = schoolDb.model("Student");
            } catch (e) {
                Student = schoolDb.model("Student", studentSchema);
            }

            const students = await Student.find({ studentId: { $in: targetStudentIds } }).lean();
            const studentMap = {};
            students.forEach((s) => {
                studentMap[s.studentId] = s;
            });

            const createdLeaves = [];
            for (const sId of targetStudentIds) {
                const sObj = studentMap[sId];
                const sName = sObj ? `${sObj.firstName} ${sObj.lastName}` : sId;
                const sClass = sObj?.class || classId;
                const sSection = sObj?.section || sectionId;

                const newLeave = new LeaveModel({
                    leaveId: generateLeaveId(),
                    schoolId,
                    applicantId: sId,
                    applicantType: "student",
                    applicantName: `${sName} (applied by parent: ${applicantName})`,
                    classId: sClass,
                    sectionId: sSection,
                    leaveType,
                    startDate: start,
                    endDate: end,
                    reason,
                    status: "pending",
                });
                await newLeave.save();
                createdLeaves.push(newLeave);

                // Activity logging
                logActivity({
                    schoolDb,
                    schoolId,
                    actor: req.user,
                    action: "CREATE",
                    entity: "Leave",
                    entityId: newLeave.leaveId,
                    entityLabel: `Leave for ${sName}`,
                    description: `Parent ${applicantName} applied for ${leaveType} leave for ${sName} from ${start.toDateString()} to ${end.toDateString()}`,
                    metadata: { leaveId: newLeave.leaveId, leaveType, startDate: start, endDate: end, studentId: sId }
                });
            }

            return res.status(201).json({
                success: true,
                message: `Leave application submitted successfully for ${createdLeaves.length} student(s)`,
                data: createdLeaves.length === 1 ? createdLeaves[0] : createdLeaves,
            });
        }

        // Single leave (Student or Teacher self-apply)
        const resolvedClassId = classId || req.user?.class || req.user?.classId;
        const resolvedSectionId = sectionId || req.user?.section || req.user?.sectionId;

        const newLeave = new LeaveModel({
            leaveId: generateLeaveId(),
            schoolId,
            applicantId,
            applicantType,
            applicantName,
            classId: resolvedClassId,
            sectionId: resolvedSectionId,
            leaveType,
            startDate: start,
            endDate: end,
            reason,
            status: "pending",
        });

        await newLeave.save();

        // Activity logging
        logActivity({
            schoolDb,
            schoolId,
            actor: req.user,
            action: "CREATE",
            entity: "Leave",
            entityId: newLeave.leaveId,
            entityLabel: `Leave for ${applicantName}`,
            description: `${applicantName} applied for ${leaveType} leave from ${start.toDateString()} to ${end.toDateString()}`,
            metadata: { leaveId: newLeave.leaveId, leaveType, startDate: start, endDate: end }
        });

        return res.status(201).json({
            success: true,
            message: "Leave application submitted successfully",
            data: newLeave,
        });
    } catch (error) {
        console.error("Error applying leave:", error);
        res.status(500).json({
            success: false,
            message: "Failed to submit leave application",
            error: error.message,
        });
    }
};

/**
 * Get my leave requests (Student/Teacher/Parent)
 * GET /api/school/:schoolId/leave/my
 */
const getMyLeaves = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { status, startDate, endDate } = req.query;

        const userRole = req.user?.role || "student";
        const candidateIds = [
            req.user?.studentId,
            req.user?.teacherId,
            req.user?.parentId,
            req.user?.userId,
            req.user?._id,
            req.user?.id,
        ].filter(Boolean);

        const schoolDbName = await getSchoolDbName(schoolId);
        const schoolDb = getSchoolDbConnection(schoolDbName);

        // If parent is accessing "my" leaves, also include all their children's studentIds
        if (userRole === "parent") {
            let Parent;
            try {
                Parent = schoolDb.model("Parent");
            } catch (e) {
                Parent = schoolDb.model("Parent", parentSchema);
            }

            let Student;
            try {
                Student = schoolDb.model("Student");
            } catch (e) {
                Student = schoolDb.model("Student", studentSchema);
            }

            const parentDoc = await Parent.findOne({
                $or: [
                    { parentId: { $in: candidateIds } },
                    { email: req.user?.email },
                    { userId: { $in: candidateIds } },
                ]
            }).lean();

            const childIds = parentDoc?.studentIds || [];
            const studentDocs = await Student.find({
                $or: [
                    { studentId: { $in: childIds } },
                    { parentId: { $in: candidateIds } },
                    ...(req.user?.email ? [{ parentEmail: req.user.email }] : [])
                ]
            }).lean();

            studentDocs.forEach((s) => {
                if (s.studentId && !candidateIds.includes(s.studentId)) {
                    candidateIds.push(s.studentId);
                }
            });
        }

        const LeaveModel = await getLeaveModel(schoolId);

        const baseQuery = {
            applicantId: candidateIds.length === 1 ? candidateIds[0] : { $in: candidateIds },
        };

        // Fetch all leaves for this user to calculate total summary accurately
        const allUserLeaves = await LeaveModel.find(baseQuery)
            .sort({ createdAt: -1 })
            .lean();

        // Calculate summary across ALL requests for this user
        const summary = {
            total: allUserLeaves.length,
            pending: allUserLeaves.filter((l) => l.status === "pending").length,
            approved: allUserLeaves.filter((l) => l.status === "approved").length,
            rejected: allUserLeaves.filter((l) => l.status === "rejected").length,
        };

        // Apply filters for the list
        let leaves = allUserLeaves;
        if (status) {
            leaves = leaves.filter((l) => l.status === status);
        }
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            leaves = leaves.filter((l) => new Date(l.startDate) >= start && new Date(l.endDate) <= end);
        }

        res.status(200).json({
            success: true,
            data: { leaves, summary },
        });
    } catch (error) {
        console.error("Error getting my leaves:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get leave requests",
            error: error.message,
        });
    }
};

/**
 * Get all leave requests (Admin/Principal)
 * GET /api/school/:schoolId/leave/all
 */
const getAllLeaves = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { status, applicantType, startDate, endDate } = req.query;

        const LeaveModel = await getLeaveModel(schoolId);

        // Fetch all school leaves to calculate overall summary accurately
        const allLeaves = await LeaveModel.find({})
            .sort({ createdAt: -1 })
            .lean();

        const summary = {
            total: allLeaves.length,
            pending: allLeaves.filter((l) => l.status === "pending").length,
            approved: allLeaves.filter((l) => l.status === "approved").length,
            rejected: allLeaves.filter((l) => l.status === "rejected").length,
            students: allLeaves.filter((l) => l.applicantType === "student").length,
            teachers: allLeaves.filter((l) => l.applicantType === "teacher").length,
        };

        // Apply query filters for the list
        const query = {};
        if (status) query.status = status;
        if (applicantType) query.applicantType = applicantType;
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        const leaves = await LeaveModel.find(query)
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            data: { leaves, summary },
        });
    } catch (error) {
        console.error("Error getting all leaves:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get leave requests",
            error: error.message,
        });
    }
};

/**
 * Process leave request (Admin/Principal/Teacher approve/reject)
 * PUT /api/school/:schoolId/leave/:leaveId/process
 */
const processLeave = async (req, res) => {
    try {
        const { schoolId, leaveId } = req.params;
        const { action, remarks } = req.body; // action = 'approve' | 'reject'

        if (!action || !["approve", "reject"].includes(action)) {
            return res.status(400).json({
                success: false,
                message: "Invalid action. Must be 'approve' or 'reject'",
            });
        }

        const LeaveModel = await getLeaveModel(schoolId);
        const leave = await LeaveModel.findOne({ leaveId });

        if (!leave) {
            return res.status(404).json({
                success: false,
                message: "Leave request not found",
            });
        }

        if (leave.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: `Leave request already ${leave.status}`,
            });
        }

        leave.status = action === "approve" ? "approved" : "rejected";
        leave.processedBy = req.user?.userId || req.user?.adminId || req.user?.teacherId;
        leave.processedByName = req.user?.name || (req.user?.firstName ? `${req.user.firstName} ${req.user.lastName || ''}`.trim() : "Admin");
        leave.processedAt = new Date();
        leave.approvalRemarks = remarks;

        await leave.save();

        const schoolDbName = await getSchoolDbName(schoolId);
        const schoolDb = getSchoolDbConnection(schoolDbName);

        // Integrated Activity Logging
        logActivity({
            schoolDb,
            schoolId,
            actor: req.user,
            action: "UPDATE",
            entity: "Leave",
            entityId: leaveId,
            entityLabel: `Leave for ${leave.applicantName}`,
            description: `${action === "approve" ? "Approved" : "Rejected"} leave request for ${leave.applicantName} (${leaveId})`,
            metadata: { leaveId, action, remarks }
        });

        return res.status(200).json({
            success: true,
            message: `Leave request ${leave.status}`,
            data: leave,
        });
    } catch (error) {
        console.error("Error processing leave:", error);
        res.status(500).json({
            success: false,
            message: "Failed to process leave request",
            error: error.message,
        });
    }
};

/**
 * Get single leave details
 * GET /api/school/:schoolId/leave/:leaveId
 */
const getLeaveById = async (req, res) => {
    try {
        const { schoolId, leaveId } = req.params;
        const LeaveModel = await getLeaveModel(schoolId);
        const leave = await LeaveModel.findOne({ leaveId }).lean();

        if (!leave) {
            return res.status(404).json({
                success: false,
                message: "Leave request not found",
            });
        }

        res.status(200).json({
            success: true,
            data: leave,
        });
    } catch (error) {
        console.error("Error getting leave:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get leave request",
            error: error.message,
        });
    }
};

/**
 * Cancel leave request (Applicant can cancel pending requests)
 * DELETE /api/school/:schoolId/leave/:leaveId
 */
const cancelLeave = async (req, res) => {
    try {
        const { schoolId, leaveId } = req.params;
        const candidateIds = [
            req.user?.studentId,
            req.user?.teacherId,
            req.user?.parentId,
            req.user?.userId,
            req.user?._id,
            req.user?.id,
        ].filter(Boolean);

        const LeaveModel = await getLeaveModel(schoolId);
        const leave = await LeaveModel.findOne({ leaveId });

        if (!leave) {
            return res.status(404).json({
                success: false,
                message: "Leave request not found",
            });
        }

        // Allow cancellation if applicant matches or parent
        const isApplicant = candidateIds.includes(leave.applicantId) || ["sch_admin", "principal"].includes(req.user?.role);

        if (!isApplicant) {
            return res.status(403).json({
                success: false,
                message: "You can only cancel your own leave requests",
            });
        }

        if (leave.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: "Can only cancel pending leave requests",
            });
        }

        await LeaveModel.deleteOne({ leaveId });

        res.status(200).json({
            success: true,
            message: "Leave request cancelled successfully",
        });
    } catch (error) {
        console.error("Error cancelling leave:", error);
        res.status(500).json({
            success: false,
            message: "Failed to cancel leave request",
            error: error.message,
        });
    }
};

/**
 * Get leave statistics for dashboard (Admin/Principal)
 * GET /api/school/:schoolId/leave/stats
 */
const getLeaveStats = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const LeaveModel = await getLeaveModel(schoolId);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [todayPending, totalPending, todayTotal, teacherPending, studentPending] = await Promise.all([
            LeaveModel.countDocuments({ status: "pending", createdAt: { $gte: today, $lt: tomorrow } }),
            LeaveModel.countDocuments({ status: "pending" }),
            LeaveModel.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
            LeaveModel.countDocuments({ status: "pending", applicantType: "teacher" }),
            LeaveModel.countDocuments({ status: "pending", applicantType: "student" }),
        ]);

        res.status(200).json({
            success: true,
            data: {
                todayPending,
                todayTotal,
                totalPending,
                teacherPending,
                studentPending,
            },
        });
    } catch (error) {
        console.error("Error getting leave stats:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get leave statistics",
            error: error.message,
        });
    }
};

/**
 * Get student leave requests for class teacher
 * GET /api/school/:schoolId/leave/class-leaves
 */
const getStudentLeavesForTeacher = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { status, classId } = req.query;

        const LeaveModel = await getLeaveModel(schoolId);

        const query = { applicantType: "student" };
        if (status) query.status = status;
        if (classId) query.classId = classId;

        const leaves = await LeaveModel.find(query)
            .sort({ createdAt: -1 })
            .lean();

        const summary = {
            total: leaves.length,
            pending: leaves.filter((l) => l.status === "pending").length,
            approved: leaves.filter((l) => l.status === "approved").length,
            rejected: leaves.filter((l) => l.status === "rejected").length,
        };

        res.status(200).json({
            success: true,
            data: { leaves, summary },
        });
    } catch (error) {
        console.error("Error getting student leaves for teacher:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get student leave requests",
            error: error.message,
        });
    }
};

/**
 * Get teachers on leave for a specific date (for timetable integration)
 * GET /api/school/:schoolId/leave/teachers-on-leave
 */
const getTeachersOnLeaveForDate = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { date } = req.query; // YYYY-MM-DD format

        if (!date) {
            return res.status(400).json({
                success: false,
                message: "date query parameter is required (YYYY-MM-DD)",
            });
        }

        const LeaveModel = await getLeaveModel(schoolId);

        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        const leaves = await LeaveModel.find({
            applicantType: "teacher",
            status: "approved",
            startDate: { $lte: targetDate },
            endDate: { $gte: targetDate },
        }).lean();

        const teacherIds = leaves.map((leave) => leave.applicantId);

        res.status(200).json({
            success: true,
            data: {
                date,
                teacherIds,
                leaves: leaves.map((l) => ({
                    teacherId: l.applicantId,
                    teacherName: l.applicantName,
                    leaveType: l.leaveType,
                    reason: l.reason,
                })),
            },
        });
    } catch (error) {
        console.error("Error getting teachers on leave:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get teachers on leave",
            error: error.message,
        });
    }
};

/**
 * Get leave requests for parent's children
 * GET /api/school/:schoolId/leave/parent
 */
const getParentChildrenLeaves = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { status } = req.query;
        const candidateIds = [
            req.user?.parentId,
            req.user?.userId,
            req.user?._id,
            req.user?.id,
        ].filter(Boolean);

        const schoolDbName = await getSchoolDbName(schoolId);
        const schoolDb = getSchoolDbConnection(schoolDbName);

        let Parent;
        try {
            Parent = schoolDb.model("Parent");
        } catch (e) {
            Parent = schoolDb.model("Parent", parentSchema);
        }

        let Student;
        try {
            Student = schoolDb.model("Student");
        } catch (e) {
            Student = schoolDb.model("Student", studentSchema);
        }

        const parent = await Parent.findOne({
            $or: [
                { parentId: { $in: candidateIds } },
                { email: req.user?.email },
                { userId: { $in: candidateIds } },
            ]
        }).lean();

        const childStudentIds = parent?.studentIds ? [...parent.studentIds] : [];

        // Also search students directly linked to this parent
        const studentDocs = await Student.find({
            $or: [
                { studentId: { $in: childStudentIds } },
                { parentId: { $in: candidateIds } },
                ...(req.user?.email ? [{ parentEmail: req.user.email }] : [])
            ]
        }).lean();

        studentDocs.forEach((s) => {
            if (s.studentId && !childStudentIds.includes(s.studentId)) {
                childStudentIds.push(s.studentId);
            }
        });

        // Also include parent candidateIds in case leave was stored with parent's ID
        const allApplicantIds = Array.from(new Set([...childStudentIds, ...candidateIds]));

        if (allApplicantIds.length === 0) {
            return res.status(200).json({
                success: true,
                data: { leaves: [], summary: { total: 0, pending: 0, approved: 0, rejected: 0 } },
            });
        }

        const LeaveModel = await getLeaveModel(schoolId);

        const allParentLeaves = await LeaveModel.find({ applicantId: { $in: allApplicantIds } })
            .sort({ createdAt: -1 })
            .lean();

        const childMap = {};
        studentDocs.forEach((c) => {
            childMap[c.studentId] = `${c.firstName} ${c.lastName}`;
        });

        const enrichedLeaves = allParentLeaves.map((leave) => ({
            ...leave,
            childName: childMap[leave.applicantId] || leave.applicantName,
        }));

        const summary = {
            total: enrichedLeaves.length,
            pending: enrichedLeaves.filter((l) => l.status === "pending").length,
            approved: enrichedLeaves.filter((l) => l.status === "approved").length,
            rejected: enrichedLeaves.filter((l) => l.status === "rejected").length,
        };

        let finalLeaves = enrichedLeaves;
        if (status) {
            finalLeaves = finalLeaves.filter((l) => l.status === status);
        }

        res.status(200).json({
            success: true,
            data: { leaves: finalLeaves, summary },
        });
    } catch (error) {
        console.error("Error getting parent children leaves:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get leave requests",
            error: error.message,
        });
    }
};

module.exports = {
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
};
