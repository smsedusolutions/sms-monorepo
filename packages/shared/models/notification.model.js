const mongoose = require('mongoose');
const { Schema } = mongoose;

const NotificationSchema = new Schema({
    notificationId: {
        type: String,
        required: true,
        unique: true
    },
    schoolId: {
        type: String,
        required: true,
        index: true
    },
    userId: {
        type: String,
        required: true,
        index: true
    },
    userRole: {
        type: String,
        enum: ['student', 'teacher', 'parent', 'sch_admin'],
        required: true
    },
    type: {
        type: String,
        enum: [
            'absence_alert',       // Student marked absent
            'leave_status',        // Leave approved/rejected
            'announcement',        // New announcement
            'homework_assigned',   // New homework
            'homework_due',        // Homework due reminder
            'exam_scheduled',      // New exam scheduled
            'result_published',    // Results published
            'bus_departed',       // Bus left school
            'child_picked',       // Child boarded bus
            'child_dropped',      // Child alighted at stop
            'bus_reached_school', // Bus arrived at school
            'bus_delayed',        // Bus delay alert
            'transport_update',   // General transport update
            'chat_invite',        // Chat invitation alert
            'chat_accepted',      // Chat invitation accepted alert
        ],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    referenceId: {
        type: String
    },
    referenceType: {
        type: String,
        enum: ['announcement', 'homework', 'leave', 'attendance', 'exam', 'result', 'transport', 'chat', null]
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    },
    metadata: {
        type: Schema.Types.Mixed
    }
}, { timestamps: true });

// Compound indexes for efficient queries
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ schoolId: 1, userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, type: 1, createdAt: -1 });

module.exports = NotificationSchema;
