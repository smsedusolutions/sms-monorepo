const mongoose = require("mongoose");

const timetableEntrySchema = new mongoose.Schema(
    {
        entryId: {
            type: String,
            required: true,
            unique: true,
        },
        schoolId: {
            type: String,
            required: true,
        },
        classId: {
            type: String,
            required: true,
        },
        sectionId: {
            type: String,
            required: true,
        },
        subjectId: {
            type: String,
            required: true,
        },
        teacherId: {
            type: String,
            required: true,
        },
        dayOfWeek: {
            type: String,
            enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
            required: true,
        },
        periodNumber: {
            type: Number,
            required: true,
        },
        shiftId: {
            type: String,
            default: null,
        },
        roomId: {
            type: String,
            default: null,
        },
        periodType: {
            type: String,
            enum: ["regular", "lab", "pt", "free", "assembly"],
            default: "regular",
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        effectiveFrom: {
            type: Date,
            default: null,
        },
        effectiveTo: {
            type: Date,
            default: null,
        },
        notes: {
            type: String,
            default: "",
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },
    },
    {
        timestamps: true,
    }
);

// Index for teacher schedule lookup (conflict detection)
timetableEntrySchema.index({ schoolId: 1, teacherId: 1, dayOfWeek: 1, periodNumber: 1 });
// Index for class schedule lookup
timetableEntrySchema.index({ schoolId: 1, classId: 1, sectionId: 1, dayOfWeek: 1 });
// Index for room conflict detection
timetableEntrySchema.index({ schoolId: 1, roomId: 1, dayOfWeek: 1, periodNumber: 1 });
// Compound index for unique entry per class/section/day/period
timetableEntrySchema.index(
    { schoolId: 1, classId: 1, sectionId: 1, dayOfWeek: 1, periodNumber: 1, isActive: 1 },
    { unique: true, partialFilterExpression: { isActive: true } }
);
// Query optimization indexes
timetableEntrySchema.index({ schoolId: 1, teacherId: 1, isActive: 1 });
timetableEntrySchema.index({ schoolId: 1, dayOfWeek: 1, isActive: 1 });

module.exports = timetableEntrySchema;
