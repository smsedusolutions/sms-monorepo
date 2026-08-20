const mongoose = require('mongoose');
const { Schema } = mongoose;

const HomeworkSchema = new Schema({
    homeworkId: {
        type: String,
        required: true,
        unique: true
    },
    schoolId: {
        type: String,
        required: true,
        index: true
    },
    classId: {
        type: String,
        required: true,
        index: true
    },
    sectionId: {
        type: String
    },
    subjectId: {
        type: String,
        required: true
    },
    teacherId: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    attachmentUrl: {
        type: String
    },
    referenceLinks: {
        type: [String],
        default: []
    },
    attachments: [{
        url: { type: String, required: true },
        fileName: { type: String, required: true },
        fileType: { type: String }
    }],
    assignedDate: {
        type: Date,
        default: Date.now
    },
    dueDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'cancelled'],
        default: 'active'
    },
    // Student submission tracking
    submissions: [{
        studentId: { type: String, required: true },
        submittedAt: { type: Date, default: Date.now },
        content: { type: String },
        attachmentUrl: { type: String },
        attachmentFileName: { type: String },
        status: {
            type: String,
            enum: ['submitted', 'late', 'reviewed'],
            default: 'submitted'
        },
        teacherRemarks: { type: String },
        marksAwarded: { type: Number },
        maxMarks: { type: Number },
        reviewedAt: { type: Date },
        reviewedBy: { type: String }
    }]
}, { timestamps: true });

// Compound indexes for efficient queries
HomeworkSchema.index({ schoolId: 1, classId: 1, dueDate: -1 });
HomeworkSchema.index({ schoolId: 1, teacherId: 1, status: 1 });
HomeworkSchema.index({ schoolId: 1, classId: 1, sectionId: 1, status: 1 });
HomeworkSchema.index({ 'submissions.studentId': 1 });

module.exports = HomeworkSchema;
