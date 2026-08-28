const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema(
    {
        teacherId: {
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
        },
        role: {
            type: String,
            default: "teacher",
            immutable: true,
        },
        department: {
            type: String,
        },
        subjects: {
            type: [String],
            default: [],
        },
        classes: {
            type: [String],
            default: [],
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },
        profileImage: {
            type: String,
        },
        gender: {
            type: String,
            enum: ["male", "female", "other"],
        },
        dateOfBirth: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

teacherSchema.index({ email: 1, schoolId: 1 }, { unique: true });

module.exports = teacherSchema;
