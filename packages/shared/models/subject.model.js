const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    subjectId: {
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
    code: {
      type: String,
      required: true,
    },
    classId: {
      type: String,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    isSubSubject: {
      type: Boolean,
      default: false,
    },
    parentSubjectId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Create compound index for subject name and code uniqueness per school
subjectSchema.index({ name: 1, schoolId: 1 }, { unique: true });
subjectSchema.index({ code: 1, schoolId: 1 }, { unique: true });

// Export schema definition for use with school-specific databases
module.exports = subjectSchema;
