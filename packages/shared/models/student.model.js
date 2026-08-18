const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
    {
        studentId: {
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
        },
        password: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
        },
        role: {
            type: String,
            default: "student",
            immutable: true,
        },
        class: {
            type: String,
            required: true,
        },
        section: {
            type: String,
        },
        rollNumber: {
            type: String,
        },
        parentId: {
            type: String,
        },
        dateOfBirth: {
            type: Date,
        },
        gender: {
            type: String,
            enum: ["male", "female", "other"],
        },
        address: {
            type: String,
        },
        status: {
            type: String,
            enum: ["active", "inactive", "graduated"],
            default: "active",
        },
        profileImage: {
            type: String,
        },
        signature: {
            type: String,
        },
        academicYear: {
            type: String,
        },
        promotionHistory: [
            {
                fromClass: { type: String },
                fromSection: { type: String },
                toClass: { type: String },
                toSection: { type: String },
                academicYear: { type: String },
                promotedAt: { type: Date, default: Date.now },
                promotedBy: { type: String },
            }
        ],
    },
    {
        timestamps: true,
    }
);

// Create index for email uniqueness per school (email is optional for young students)
studentSchema.index(
    { email: 1, schoolId: 1 },
    { unique: true, sparse: true }
);

// High-frequency query indexes
studentSchema.index({ schoolId: 1, studentId: 1 });
studentSchema.index({ schoolId: 1, class: 1, section: 1, status: 1 });
studentSchema.index({ schoolId: 1, parentId: 1 });

// Export schema definition for use with school-specific databases
module.exports = studentSchema;
