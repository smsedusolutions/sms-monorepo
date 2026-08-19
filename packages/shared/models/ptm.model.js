const mongoose = require('mongoose');

const PtmBookingSchema = new mongoose.Schema({
    parentId: { type: String, required: true },
    parentName: { type: String },
    studentId: { type: String },
    studentName: { type: String },
    slotTime: { type: String, required: true }, // e.g. "09:00 - 09:15"
    bookedAt: { type: Date, default: Date.now },
    notes: { type: String },
    status: { type: String, enum: ['confirmed', 'completed', 'cancelled'], default: 'confirmed' },
}, { _id: true });

const PTMSchema = new mongoose.Schema({
    schoolId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true }, // e.g. "09:00"
    endTime: { type: String, required: true },   // e.g. "13:00"
    slotDurationMinutes: { type: Number, default: 10 },
    classId: { type: String, default: null },
    className: { type: String, default: null },
    sectionId: { type: String, default: null },
    sectionName: { type: String, default: null },
    breakStartTime: { type: String, default: null },
    breakEndTime: { type: String, default: null },
    teacherId: { type: String, default: null },
    teacherName: { type: String, default: null },
    venue: { type: String, default: null },
    notes: { type: String, default: null },
    status: { type: String, enum: ['scheduled', 'ongoing', 'completed', 'cancelled'], default: 'scheduled' },
    bookings: [PtmBookingSchema],
}, {
    timestamps: true,
});

PTMSchema.index({ schoolId: 1, date: 1 });

module.exports = PTMSchema;
