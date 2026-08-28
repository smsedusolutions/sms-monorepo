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
    classTeacherSectionId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Create index for email uniqueness per school
teacherSchema.index({ email: 1, schoolId: 1 }, { unique: true });

// Export schema definition for use with school-specific databases
module.exports = teacherSchema;
