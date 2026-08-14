const mongoose = require("mongoose");

const timetableScheduleSchema = new mongoose.Schema(
    {
        scheduleId: {
            type: String,
            required: true,
            unique: true,
        },
        schoolId: {
            type: String,
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        source: {
            type: String,
            enum: ["ai", "manual"],
            default: "manual",
        },
        version: {
            type: Number,
            default: 1,
        },
        aiDraftVersion: {
            type: Number,
            default: null,
        },
        academicYear: {
            type: String,
            default: "2025-2026",
        },
        scheduleType: {
            type: String,
            enum: ["regular", "exam", "temporary", "event"],
            default: "regular",
        },
        status: {
            type: String,
            enum: ["draft", "pending_approval", "active", "disabled", "rejected", "replaced"],
            default: "draft",
            index: true,
        },
        entries: [
            {
                classId: String,
                sectionId: String,
                subjectId: String,
                teacherId: String,
                dayOfWeek: String,
                periodNumber: Number,
            },
        ],
        validFrom: {
            type: Date,
            default: Date.now,
        },
        validTo: {
            type: Date,
            default: null,
        },
        createdBy: {
            type: String,
            default: "sch_admin",
        },
        // Rejection audit fields
        rejectionComment: {
            type: String,
            default: "",
        },
        rejectedAt: {
            type: Date,
            default: null,
        },
        rejectedBy: {
            type: String,
            default: null,
        },
        // Approval audit fields
        approvedAt: {
            type: Date,
            default: null,
        },
        approvedBy: {
            type: String,
            default: null,
        },
        // Override / replacement tracking
        replacedVersion: {
            type: String,
            default: null,  // scheduleId of the timetable this one replaced
        },
        replacedAt: {
            type: Date,
            default: null,
        },
        replacedByScheduleId: {
            type: String,
            default: null,  // scheduleId of the timetable that replaced this one
        },
    },
    {
        timestamps: true,
    }
);

timetableScheduleSchema.index({ schoolId: 1, status: 1 });

module.exports = timetableScheduleSchema;
