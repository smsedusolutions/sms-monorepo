const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema(
    {
        sectionId: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        classTeacherId: {
            type: String,
            default: null,
        },
    },
    { _id: false }
);

const classSchema = new mongoose.Schema(
    {
        classId: {
            type: String,
            required: true,
            unique: true,
        },
        schoolId: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        sections: {
            type: [sectionSchema],
            default: [],
        },
        subjects: {
            type: [String],
            default: [],
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

// Create compound index for class name uniqueness per school
classSchema.index({ name: 1, schoolId: 1 }, { unique: true });

// Export schema definition for use with school-specific databases
module.exports = classSchema;
