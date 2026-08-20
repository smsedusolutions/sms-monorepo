const mongoose = require('mongoose');

const DisciplineSchema = new mongoose.Schema({
    schoolId: { type: String, required: true, index: true },
    studentId: { type: String, default: null, index: true },
    studentName: { type: String, required: true },
    classId: { type: String, default: null },
    className: { type: String, default: null },
    incidentDate: { type: Date, default: Date.now },
    category: {
        type: String,
        required: true,
        enum: ['Behavioral', 'Academic Dishonesty', 'Attendance', 'Bullying', 'Property Damage', 'Tardiness', 'Dress Code', 'Other'],
    },
    description: { type: String, required: true },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'low',
    },
    actionTaken: { type: String, default: null },
    actionDescription: { type: String, default: null },
    parentNotified: { type: Boolean, default: false },
    reportedBy: { type: String, default: null },
}, {
    timestamps: true,
});

DisciplineSchema.index({ schoolId: 1, studentId: 1, incidentDate: -1 });

module.exports = DisciplineSchema;
