const mongoose = require('mongoose');
const { Schema } = mongoose;

const StudentExamRegistrationSchema = new Schema({
    schoolId: {
        type: String,
        required: true,
        index: true
    },
    examId: {
        type: String,
        required: true,
        index: true
    },
    studentId: {
        type: String,
        required: true,
        index: true
    },
    classId: {
        type: String,
        required: true
    },
    sectionId: {
        type: String,
        required: true
    },
    rollNumber: {
        type: String,
        required: true
    },
    admitCardGenerated: {
        type: Boolean,
        default: false
    },
    admitCardUrl: {
        type: String // URL to generated PDF if stored, or just a flag
    },
    isEligible: {
        type: Boolean,
        default: true
    },
    ineligibilityReason: {
        type: String // e.g., "Low Attendance", "Fees Pending"
    }
}, { timestamps: true });

// Ensure unique registration per student per exam
StudentExamRegistrationSchema.index({ schoolId: 1, examId: 1, studentId: 1 }, { unique: true });
// Query optimization indexes
StudentExamRegistrationSchema.index({ schoolId: 1, examId: 1, classId: 1, sectionId: 1 });

module.exports = StudentExamRegistrationSchema;
