const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");
const {
    SubstituteAssignmentSchema: substituteAssignmentSchema,
    TimetableEntrySchema: timetableEntrySchema,
    TeacherSchema: teacherSchema,
    NotificationSchema: notificationSchema,
    SubjectSchema: subjectSchema,
} = require("@sms/shared");
const { logActivity } = require("@sms/shared/utils");
const { dispatchRealtimePush } = require("../utils/pushHelper");

// Get models for a specific school database
const getModels = (schoolDbName) => {
    const schoolDb = getSchoolDbConnection(schoolDbName);
    return {
        SubstituteAssignment: schoolDb.models.SubstituteAssignment || schoolDb.model("SubstituteAssignment", substituteAssignmentSchema),
        TimetableEntry: schoolDb.models.TimetableEntry || schoolDb.model("TimetableEntry", timetableEntrySchema),
        Teacher: schoolDb.models.Teacher || schoolDb.model("Teacher", teacherSchema),
        Notification: schoolDb.models.Notification || schoolDb.model("Notification", notificationSchema),
        Subject: schoolDb.models.Subject || schoolDb.model("Subject", subjectSchema),
    };
};

// Helper function to generate substituteId
const generateSubstituteId = async (SubstituteAssignmentModel) => {
    const lastSub = await SubstituteAssignmentModel.findOne()
        .sort({ createdAt: -1 })
        .select("substituteId");

    let nextNumber = 1;
    if (lastSub && lastSub.substituteId) {
        const numPart = parseInt(lastSub.substituteId.replace("SBA", ""), 10);
        if (!isNaN(numPart)) {
            nextNumber = numPart + 1;
        }
    }

    return `SBA${String(nextNumber).padStart(5, "0")}`;
};

// Create substitute assignment
const createSubstitute = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const {
            originalEntryId,
            substituteTeacherId,
            date,
            reason,
            // Alternative fields to find entry
            classId,
            sectionId,
            dayOfWeek,
            periodNumber
        } = req.body;
        const createdBy = req.user?.userId || req.user?.teacherId || "admin";

        if (!substituteTeacherId || !date) {
            return res.status(400).json({
                success: false,
                message: "Substitute teacher ID and date are required",
            });
        }

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { SubstituteAssignment, TimetableEntry, Teacher } = models;

        let originalEntry;

        // If originalEntryId provided, use it directly
        if (originalEntryId) {
            originalEntry = await TimetableEntry.findOne({ schoolId, entryId: originalEntryId });
        }
        // Otherwise, find entry by class/section/day/period
        else if (classId && sectionId && dayOfWeek && periodNumber !== undefined) {
            originalEntry = await TimetableEntry.findOne({
                schoolId,
                classId,
                sectionId,
                dayOfWeek,
                periodNumber: parseInt(periodNumber, 10),
                isActive: true
            });
        }

        if (!originalEntry) {
            return res.status(404).json({
                success: false,
                message: "Original timetable entry not found. Please provide either originalEntryId or classId, sectionId, dayOfWeek, periodNumber",
            });
        }

        // Check if substitute teacher is free at this time
        const substituteConflict = await TimetableEntry.findOne({
            schoolId,
            teacherId: substituteTeacherId,
            dayOfWeek: originalEntry.dayOfWeek,
            periodNumber: originalEntry.periodNumber,
            isActive: true,
        });

        if (substituteConflict) {
            return res.status(409).json({
                success: false,
                message: "Substitute teacher is not free at this time",
            });
        }

        // Check if substitute already exists for this entry on this date
        const existingSubstitute = await SubstituteAssignment.findOne({
            schoolId,
            originalEntryId: originalEntry.entryId,
            date: new Date(date),
            status: { $in: ["pending", "confirmed"] },
        });

        if (existingSubstitute) {
            return res.status(409).json({
                success: false,
                message: "A substitute assignment already exists for this period on this date",
            });
        }

        const substituteId = await generateSubstituteId(SubstituteAssignment);

        const newSubstitute = new SubstituteAssignment({
            substituteId,
            schoolId,
            originalEntryId: originalEntry.entryId,
            originalTeacherId: originalEntry.teacherId,
            substituteTeacherId,
            date: new Date(date),
            reason: reason || "",
            createdBy,
            status: "confirmed",
        });

        await newSubstitute.save();

        // Get teacher details for response & notifications
        const originalTeacher = await Teacher.findOne({ teacherId: originalEntry.teacherId }).lean();
        const substituteTeacher = await Teacher.findOne({ teacherId: substituteTeacherId }).lean();

        const origTeacherName = originalTeacher ? `${originalTeacher.firstName} ${originalTeacher.lastName}`.trim() : originalEntry.teacherId;
        const subTeacherName = substituteTeacher ? `${substituteTeacher.firstName} ${substituteTeacher.lastName}`.trim() : substituteTeacherId;

        // Try fetching Subject name
        let subjectName = "";
        if (originalEntry.subjectId) {
            try {
                const subj = await models.Subject.findOne({ subjectId: originalEntry.subjectId }).lean();
                subjectName = subj?.name || originalEntry.subjectId;
            } catch (_e) {}
        }

        const dateFormatted = new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const classLabel = `${originalEntry.classId || ''} ${originalEntry.sectionId || ''}`.trim() || 'Class';
        const periodLabel = `Period ${originalEntry.periodNumber}${subjectName ? ` (${subjectName})` : ''}`;

        // Create notifications for BOTH teachers
        const notifications = [
            // 1. Notification to the Substitute Teacher
            {
                notificationId: `NOTIF${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
                schoolId,
                userId: substituteTeacherId,
                userRole: "teacher",
                type: "system_alert",
                title: `Substitute Assignment: ${classLabel}`,
                message: `You have been assigned to substitute for ${origTeacherName} on ${dateFormatted} for ${classLabel} (${periodLabel}).`,
                referenceId: newSubstitute.substituteId,
                referenceType: "timetable",
                url: "/teacher/timetable/my",
                isRead: false,
                metadata: {
                    substituteId: newSubstitute.substituteId,
                    originalTeacherId: originalEntry.teacherId,
                    originalTeacherName: origTeacherName,
                    date,
                    periodNumber: originalEntry.periodNumber,
                    classId: originalEntry.classId,
                    sectionId: originalEntry.sectionId,
                },
            },
            // 2. Notification to the Original Teacher
            {
                notificationId: `NOTIF${Date.now()}${Math.random().toString(36).substr(2, 6)}`,
                schoolId,
                userId: originalEntry.teacherId,
                userRole: "teacher",
                type: "system_alert",
                title: `Substitute Assigned: ${classLabel}`,
                message: `${subTeacherName} will cover your class on ${dateFormatted} for ${classLabel} (${periodLabel}).`,
                referenceId: newSubstitute.substituteId,
                referenceType: "timetable",
                url: "/teacher/timetable/my",
                isRead: false,
                metadata: {
                    substituteId: newSubstitute.substituteId,
                    substituteTeacherId,
                    substituteTeacherName: subTeacherName,
                    date,
                    periodNumber: originalEntry.periodNumber,
                    classId: originalEntry.classId,
                    sectionId: originalEntry.sectionId,
                },
            },
        ];

        try {
            await models.Notification.insertMany(notifications);
            dispatchRealtimePush(notifications);
            console.log(`🔔 [SubstituteNotification] Dispatched timetable substitution alerts to both teachers: ${substituteTeacherId} and ${originalEntry.teacherId}`);
        } catch (notifErr) {
            console.error("❌ [SubstituteNotification] Failed to dispatch notifications:", notifErr.message);
        }

        const response = res.status(201).json({
            success: true,
            message: "Substitute assignment created successfully",
            data: {
                ...newSubstitute.toObject(),
                originalTeacher: origTeacherName,
                substituteTeacher: subTeacherName,
            },
        });

        // Integrated Logging
        logActivity({
            schoolDb: getSchoolDbConnection(schoolDbName),
            schoolId,
            actor: req.user,
            action: "CREATE",
            entity: "Substitute",
            entityId: newSubstitute.substituteId,
            entityLabel: subTeacherName,
            description: `Assigned ${subTeacherName} as substitute for ${origTeacherName} on ${date}`,
            metadata: { substituteId: newSubstitute.substituteId, date }
        });

        return response;
    } catch (error) {
        console.error("Error creating substitute:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to create substitute assignment",
        });
    }
};

// Get substitutes for a date
const getSubstitutesForDate = async (req, res) => {
    try {
        const { schoolId, date } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { SubstituteAssignment, TimetableEntry, Teacher } = models;

        const queryDate = new Date(date);
        queryDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(queryDate);
        nextDay.setDate(nextDay.getDate() + 1);

        const substitutes = await SubstituteAssignment.find({
            schoolId,
            date: { $gte: queryDate, $lt: nextDay },
        });

        // Populate details
        const populatedSubstitutes = await Promise.all(
            substitutes.map(async (sub) => {
                const originalEntry = await TimetableEntry.findOne({ entryId: sub.originalEntryId });
                const originalTeacher = await Teacher.findOne({ teacherId: sub.originalTeacherId });
                const substituteTeacher = await Teacher.findOne({ teacherId: sub.substituteTeacherId });

                return {
                    ...sub.toObject(),
                    entry: originalEntry,
                    originalTeacher: originalTeacher ? {
                        teacherId: originalTeacher.teacherId,
                        name: `${originalTeacher.firstName} ${originalTeacher.lastName}`,
                    } : null,
                    substituteTeacher: substituteTeacher ? {
                        teacherId: substituteTeacher.teacherId,
                        name: `${substituteTeacher.firstName} ${substituteTeacher.lastName}`,
                    } : null,
                };
            })
        );

        res.status(200).json({
            success: true,
            data: populatedSubstitutes,
        });
    } catch (error) {
        console.error("Error fetching substitutes:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch substitutes",
        });
    }
};

// Get substitute history
const getSubstituteHistory = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { teacherId, startDate, endDate, limit = 50 } = req.query;

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { SubstituteAssignment, Teacher } = models;

        const query = { schoolId };

        if (teacherId) {
            query.$or = [
                { originalTeacherId: teacherId },
                { substituteTeacherId: teacherId },
            ];
        }

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const substitutes = await SubstituteAssignment.find(query)
            .sort({ date: -1 })
            .limit(parseInt(limit, 10));

        // Populate teacher names
        const populatedSubstitutes = await Promise.all(
            substitutes.map(async (sub) => {
                const originalTeacher = await Teacher.findOne({ teacherId: sub.originalTeacherId });
                const substituteTeacher = await Teacher.findOne({ teacherId: sub.substituteTeacherId });

                return {
                    ...sub.toObject(),
                    originalTeacherName: originalTeacher ? `${originalTeacher.firstName} ${originalTeacher.lastName}` : null,
                    substituteTeacherName: substituteTeacher ? `${substituteTeacher.firstName} ${substituteTeacher.lastName}` : null,
                };
            })
        );

        res.status(200).json({
            success: true,
            data: populatedSubstitutes,
        });
    } catch (error) {
        console.error("Error fetching substitute history:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch substitute history",
        });
    }
};

// Cancel substitute assignment
const cancelSubstitute = async (req, res) => {
    try {
        const { schoolId, substituteId } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { SubstituteAssignment } = models;

        const substitute = await SubstituteAssignment.findOneAndUpdate(
            { schoolId, substituteId },
            { status: "cancelled" },
            { new: true }
        );

        if (!substitute) {
            return res.status(404).json({
                success: false,
                message: "Substitute assignment not found",
            });
        }

        const response = res.status(200).json({
            success: true,
            message: "Substitute assignment cancelled successfully",
            data: substitute,
        });

        // Integrated Logging
        logActivity({
            schoolDb: getSchoolDbConnection(schoolDbName),
            schoolId,
            actor: req.user,
            action: "DELETE",
            entity: "Substitute",
            entityId: substituteId,
            description: `Cancelled substitute assignment ${substituteId}`
        });

        return response;
    } catch (error) {
        console.error("Error cancelling substitute:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to cancel substitute assignment",
        });
    }
};

// Update substitute status
const updateSubstituteStatus = async (req, res) => {
    try {
        const { schoolId, substituteId } = req.params;
        const { status } = req.body;

        if (!status || !["pending", "confirmed", "completed", "cancelled"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Valid status is required",
            });
        }

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { SubstituteAssignment } = models;

        const substitute = await SubstituteAssignment.findOneAndUpdate(
            { schoolId, substituteId },
            { status },
            { new: true }
        );

        if (!substitute) {
            return res.status(404).json({
                success: false,
                message: "Substitute assignment not found",
            });
        }

        const response = res.status(200).json({
            success: true,
            message: "Substitute status updated successfully",
            data: substitute,
        });

        // Integrated Logging
        logActivity({
            schoolDb: getSchoolDbConnection(schoolDbName),
            schoolId,
            actor: req.user,
            action: "UPDATE",
            entity: "Substitute",
            entityId: substituteId,
            description: `Updated substitute ${substituteId} status to ${status}`
        });

        return response;
    } catch (error) {
        console.error("Error updating substitute status:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update substitute status",
        });
    }
};

module.exports = {
    createSubstitute,
    getSubstitutesForDate,
    getSubstituteHistory,
    cancelSubstitute,
    updateSubstituteStatus,
};
