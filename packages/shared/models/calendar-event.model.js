const mongoose = require('mongoose');

const CalendarEventSchema = new mongoose.Schema({
    schoolId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: null },
    eventType: {
        type: String,
        enum: [
            'holiday',
            'exam',
            'event',
            'sports',
            'annual_day',
            'parent_meeting',
            'staff_meeting',
            'ptm',
            'other'
        ],
        default: 'event',
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    targetAudience: {
        type: [String],
        enum: ['all', 'teacher', 'student', 'parent', 'staff', 'admin'],
        default: ['all'],
    },
    venue: { type: String, default: null },
    createdBy: { type: String, default: null },
}, {
    timestamps: true,
});

CalendarEventSchema.index({ schoolId: 1, startDate: 1, endDate: 1 });

module.exports = CalendarEventSchema;
