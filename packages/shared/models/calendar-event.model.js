const mongoose = require('mongoose');

const CalendarEventSchema = new mongoose.Schema({
    schoolId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: null },
    eventType: {
        type: String,
        enum: ['holiday', 'exam', 'event', 'ptm', 'sports', 'other'],
        default: 'event',
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    targetAudience: {
        type: [String],
        enum: ['all', 'teacher', 'student', 'parent', 'staff'],
        default: ['all'],
    },
    createdBy: { type: String, default: null },
}, {
    timestamps: true,
});

CalendarEventSchema.index({ schoolId: 1, startDate: 1, endDate: 1 });

module.exports = CalendarEventSchema;
