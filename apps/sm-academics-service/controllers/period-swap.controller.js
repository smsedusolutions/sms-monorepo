const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");
const {
    PeriodSwapSchema: periodSwapSchema,
    TimetableEntrySchema: timetableEntrySchema,
    TeacherSchema: teacherSchema,
    NotificationSchema: notificationSchema,
} = require("@sms/shared");
const { dispatchRealtimePush } = require("../utils/pushHelper");

// Get models for a specific school database
const getModels = (schoolDbName) => {
    const schoolDb = getSchoolDbConnection(schoolDbName);
    return {
        PeriodSwap: schoolDb.models.PeriodSwap || schoolDb.model("PeriodSwap", periodSwapSchema),
        TimetableEntry: schoolDb.models.TimetableEntry || schoolDb.model("TimetableEntry", timetableEntrySchema),
        Teacher: schoolDb.models.Teacher || schoolDb.model("Teacher", teacherSchema),
        Notification: schoolDb.models.Notification || schoolDb.model("Notification", notificationSchema),
    };
};

// Helper function to generate swapId
const generateSwapId = async (PeriodSwapModel) => {
    const lastSwap = await PeriodSwapModel.findOne()
        .sort({ createdAt: -1 })
        .select("swapId");

    let nextNumber = 1;
    if (lastSwap && lastSwap.swapId) {
        const numPart = parseInt(lastSwap.swapId.replace("SWP", ""), 10);
        if (!isNaN(numPart)) {
            nextNumber = numPart + 1;
        }
    }

    return `SWP${String(nextNumber).padStart(5, "0")}`;
};

// Request period swap
const requestSwap = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { entryId1, entryId2, date, reason } = req.body;
        const requestedBy = req.user?.teacherId || req.body.requestedBy;

        if (!entryId1 || !entryId2 || !date) {
            return res.status(400).json({
                success: false,
                message: "Both entry IDs and date are required",
            });
        }

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { PeriodSwap, TimetableEntry } = models;

        // Verify both entries exist
        const entry1 = await TimetableEntry.findOne({ schoolId, entryId: entryId1 });
        const entry2 = await TimetableEntry.findOne({ schoolId, entryId: entryId2 });

        if (!entry1 || !entry2) {
            return res.status(404).json({
                success: false,
                message: "One or both timetable entries not found",
            });
        }

        // Check for existing pending swap request
        const existingSwap = await PeriodSwap.findOne({
            schoolId,
            entryId1,
            entryId2,
            date: new Date(date),
            status: "pending",
        });

        if (existingSwap) {
            return res.status(409).json({
                success: false,
                message: "A swap request already exists for these periods",
            });
        }

        const swapId = await generateSwapId(PeriodSwap);

        const newSwap = new PeriodSwap({
            swapId,
            schoolId,
            requestedBy,
            entryId1,
            entryId2,
            date: new Date(date),
            reason: reason || "",
            status: "pending",
        });

        await newSwap.save();

        res.status(201).json({
            success: true,
            message: "Period swap request submitted successfully",
            data: newSwap,
        });
    } catch (error) {
        console.error("Error creating swap request:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to create swap request",
        });
    }
};

// Get pending swap requests
const getSwapRequests = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { status, teacherId } = req.query;

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { PeriodSwap, TimetableEntry, Teacher } = models;

        const query = { schoolId };
        if (status) query.status = status;
        if (teacherId) query.requestedBy = teacherId;

        const swaps = await PeriodSwap.find(query).sort({ createdAt: -1 });

        // Populate details
        const populatedSwaps = await Promise.all(
            swaps.map(async (swap) => {
                const entry1 = await TimetableEntry.findOne({ entryId: swap.entryId1 });
                const entry2 = await TimetableEntry.findOne({ entryId: swap.entryId2 });
                const requester = await Teacher.findOne({ teacherId: swap.requestedBy });

                return {
                    ...swap.toObject(),
                    entry1,
                    entry2,
                    requester: requester ? {
                        teacherId: requester.teacherId,
                        name: `${requester.firstName} ${requester.lastName}`,
                    } : null,
                };
            })
        );

        res.status(200).json({
            success: true,
            data: populatedSwaps,
        });
    } catch (error) {
        console.error("Error fetching swap requests:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch swap requests",
        });
    }
};

// Approve swap request
const approveSwap = async (req, res) => {
    try {
        const { schoolId, swapId } = req.params;
        const approvedBy = req.user?.userId || req.user?.adminId || "admin";

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { PeriodSwap, TimetableEntry, Teacher, Notification } = models;

        const swap = await PeriodSwap.findOneAndUpdate(
            { schoolId, swapId, status: "pending" },
            {
                status: "approved",
                approvedBy,
                approvedAt: new Date(),
            },
            { new: true }
        );

        if (!swap) {
            return res.status(404).json({
                success: false,
                message: "Swap request not found or already processed",
            });
        }

        // Notify both teachers involved in the swap
        try {
            const entry1 = await TimetableEntry.findOne({ entryId: swap.entryId1 }).lean();
            const entry2 = await TimetableEntry.findOne({ entryId: swap.entryId2 }).lean();

            if (entry1 && entry2) {
                const teacher1 = await Teacher.findOne({ teacherId: entry1.teacherId }).lean();
                const teacher2 = await Teacher.findOne({ teacherId: entry2.teacherId }).lean();

                const t1Name = teacher1 ? `${teacher1.firstName} ${teacher1.lastName}`.trim() : entry1.teacherId;
                const t2Name = teacher2 ? `${teacher2.firstName} ${teacher2.lastName}`.trim() : entry2.teacherId;
                const dateFormatted = new Date(swap.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

                const notifications = [
                    {
                        notificationId: `NOTIF${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
                        schoolId,
                        userId: entry1.teacherId,
                        userRole: "teacher",
                        type: "system_alert",
                        title: "Period Swap Approved",
                        message: `Your period swap with ${t2Name} for ${dateFormatted} (Period ${entry1.periodNumber} ⇄ Period ${entry2.periodNumber}) has been approved.`,
                        referenceId: swap.swapId,
                        referenceType: "timetable",
                        url: "/teacher/timetable/my",
                        isRead: false,
                        metadata: { swapId: swap.swapId, date: swap.date },
                    },
                    {
                        notificationId: `NOTIF${Date.now()}${Math.random().toString(36).substr(2, 6)}`,
                        schoolId,
                        userId: entry2.teacherId,
                        userRole: "teacher",
                        type: "system_alert",
                        title: "Period Swap Approved",
                        message: `Your period swap with ${t1Name} for ${dateFormatted} (Period ${entry2.periodNumber} ⇄ Period ${entry1.periodNumber}) has been approved.`,
                        referenceId: swap.swapId,
                        referenceType: "timetable",
                        url: "/teacher/timetable/my",
                        isRead: false,
                        metadata: { swapId: swap.swapId, date: swap.date },
                    },
                ];

                await Notification.insertMany(notifications);
                dispatchRealtimePush(notifications);
                console.log(`🔔 [PeriodSwap] Dispatched swap approval notifications to teachers ${entry1.teacherId} and ${entry2.teacherId}`);
            }
        } catch (notifErr) {
            console.error("❌ [PeriodSwap] Failed to dispatch swap notifications:", notifErr.message);
        }

        res.status(200).json({
            success: true,
            message: "Swap request approved successfully",
            data: swap,
        });
    } catch (error) {
        console.error("Error approving swap:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to approve swap request",
        });
    }
};

// Reject swap request
const rejectSwap = async (req, res) => {
    try {
        const { schoolId, swapId } = req.params;
        const { rejectionReason } = req.body;

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { PeriodSwap } = models;

        const swap = await PeriodSwap.findOneAndUpdate(
            { schoolId, swapId, status: "pending" },
            {
                status: "rejected",
                rejectionReason: rejectionReason || "",
            },
            { new: true }
        );

        if (!swap) {
            return res.status(404).json({
                success: false,
                message: "Swap request not found or already processed",
            });
        }

        res.status(200).json({
            success: true,
            message: "Swap request rejected",
            data: swap,
        });
    } catch (error) {
        console.error("Error rejecting swap:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to reject swap request",
        });
    }
};

// Cancel swap request (by requester)
const cancelSwap = async (req, res) => {
    try {
        const { schoolId, swapId } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { PeriodSwap } = models;

        const swap = await PeriodSwap.findOneAndUpdate(
            { schoolId, swapId, status: "pending" },
            { status: "cancelled" },
            { new: true }
        );

        if (!swap) {
            return res.status(404).json({
                success: false,
                message: "Swap request not found or already processed",
            });
        }

        res.status(200).json({
            success: true,
            message: "Swap request cancelled",
            data: swap,
        });
    } catch (error) {
        console.error("Error cancelling swap:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to cancel swap request",
        });
    }
};

module.exports = {
    requestSwap,
    getSwapRequests,
    approveSwap,
    rejectSwap,
    cancelSwap,
};
