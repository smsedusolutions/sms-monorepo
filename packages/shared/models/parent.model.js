const mongoose = require("mongoose");

const parentSchema = new mongoose.Schema(
    {
        parentId: {
            type: String,
            required: true,
            unique: true,
        },
        schoolId: {
            type: String,
            required: true,
        },
        firstName: {
            type: String,
            required: true,
        },
        lastName: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            default: "parent",
            immutable: true,
        },
        studentIds: {
            type: [String],
            default: [],
        },
        relationship: {
            type: String,
            enum: ["father", "mother", "guardian"],
            required: true,
        },
        occupation: {
            type: String,
        },
        address: {
            type: String,
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },
        profileImage: {
            type: String,
        },
        signature: {
            type: String,
        },
        dateOfBirth: {
            type: Date,
        },
        gender: {
            type: String,
            enum: ["male", "female", "other"],
        },
    },
    {
        timestamps: true,
    }
);

// Create index for email uniqueness per school
parentSchema.index({ email: 1, schoolId: 1 }, { unique: true });

// Export schema definition for use with school-specific databases
module.exports = parentSchema;
