const mongoose = require('mongoose');
const { Schema } = mongoose;

const ExamResultSchema = new Schema({
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
    subjectId: {
        type: String,
        required: true
    },
    scheduleId: {
        type: Schema.Types.ObjectId,
        ref: 'ExamSchedule',
        required: true
    },
    marksObtainedTheory: {
        type: Number,
        default: 0
    },
    marksObtainedPractical: {
        type: Number,
        default: 0
    },
    totalMarks: {
        type: Number,
        default: 0
    },
    grade: {
        type: String
    },
    gradePoints: {
        type: Number
    },
    attendanceStatus: {
        type: String,
        enum: ['present', 'absent', 'medical_leave', 'exempted'],
        default: 'present'
    },
    remarks: {
        type: String
    },
    evaluatedBy: {
        type: String, // Teacher ID
        required: true
    },
    evaluatedAt: {
        type: Date,
        default: Date.now
    },
    publishStatus: {
        type: String,
        enum: ['draft', 'teacher_published', 'final_published'],
        default: 'draft'
    },
    teacherPublishedAt: {
        type: Date
    },
    teacherPublishedBy: {
        type: String
    },
    finalPublishedAt: {
        type: Date
    },
    finalPublishedBy: {
        type: String
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    isEncrypted: {
        type: Boolean,
        default: false
    },
    encryptedMarks: {
        type: String
    },
    encryptionIv: {
        type: String
    },
    encryptionAuthTag: {
        type: String
    }
}, { timestamps: true });

// Ensure unique result entry per student per exam per subject
ExamResultSchema.index({ schoolId: 1, examId: 1, studentId: 1, subjectId: 1 }, { unique: true });

// Compound indexes for high-frequency queries
ExamResultSchema.index({ schoolId: 1, examId: 1, scheduleId: 1 });
ExamResultSchema.index({ schoolId: 1, studentId: 1, isPublished: 1, publishStatus: 1 });
ExamResultSchema.index({ schoolId: 1, examId: 1, publishStatus: 1 });
ExamResultSchema.index({ schoolId: 1, examId: 1, studentId: 1 });

module.exports = ExamResultSchema;
