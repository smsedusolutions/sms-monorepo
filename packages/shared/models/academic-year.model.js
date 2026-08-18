const mongoose = require('mongoose');
const { Schema } = mongoose;

const AcademicYearSchema = new Schema({
    schoolId: {
        type: String,
        required: true,
        index: true
    },
    academicYearId: {
        type: String,
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String, // e.g. "2025-2026"
        required: true,
        trim: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    isCurrent: {
        type: Boolean,
        default: false,
        index: true
    },
    status: {
        type: String,
        enum: ['active', 'upcoming', 'completed', 'archived'],
        default: 'active'
    },
    description: {
        type: String,
        trim: true
    },
    createdBy: {
        type: String
    }
}, { timestamps: true });

// Ensure unique academic year code per school
AcademicYearSchema.index({ schoolId: 1, code: 1 }, { unique: true });

module.exports = AcademicYearSchema;
