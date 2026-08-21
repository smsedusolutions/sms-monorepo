/**
 * Consent Record Schema — DPDP Act 2023 Compliance
 *
 * Stores an immutable audit record each time a user grants or updates consent.
 * Records are append-only (never updated in-place) to preserve audit integrity.
 *
 * Fields:
 *   userId        — platform user ID (studentId, teacherId, parentId, etc.)
 *   schoolId      — school the user belongs to (null for super_admin)
 *   role          — user role at time of consent
 *   email         — user email (for cross-referencing rights requests)
 *   consentVersion — Privacy Policy version string; bump on material changes
 *   purposes      — array of purposes consented to (per DPDP Act §6)
 *   timestamp     — ISO timestamp of consent action
 *   ipAddress     — IP address of request (for audit; handled server-side)
 *   userAgent     — browser UA string (for audit)
 *   withdrawn     — true if this record represents a consent withdrawal
 *
 * [LEGAL REVIEW REQUIRED] — Retention period for consent records: recommended
 * duration of account + 3 years, but must be confirmed with a lawyer.
 */

const mongoose = require('mongoose');

const consentRecordSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        schoolId: {
            type: String,
            default: null,
        },
        role: {
            type: String,
            required: true,
            enum: ['student', 'parent', 'teacher', 'driver', 'principal', 'sch_admin', 'super_admin'],
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        // Privacy Policy version at time of consent (bump on material changes)
        consentVersion: {
            type: String,
            required: true,
            default: 'v1.0-2026-08-21',
        },
        // Granular per-purpose consent — DPDP Act §6 requires per-purpose consent
        purposes: {
            accountManagement: {
                type: Boolean,
                default: true,  // Essential — required for platform access
            },
            platformServices: {
                type: Boolean,
                default: true,  // Essential — required for core functionality
            },
            communication: {
                type: Boolean,
                default: false,
            },
            analytics: {
                type: Boolean,
                default: false,  // Non-essential — requires explicit opt-in
            },
        },
        // Audit fields
        ipAddress: {
            type: String,
            default: null,
        },
        userAgent: {
            type: String,
            default: null,
        },
        // Consent withdrawal flag
        withdrawn: {
            type: Boolean,
            default: false,
        },
        // Source of consent record
        source: {
            type: String,
            enum: ['login', 'profile', 'data-rights-request', 'admin-revocation'],
            default: 'login',
        },
    },
    {
        // Use createdAt as the immutable consent timestamp
        timestamps: { createdAt: 'timestamp', updatedAt: false },
        // Prevent in-place updates (append-only)
        strict: true,
    }
);

// Compound index for efficient lookup by user + version
consentRecordSchema.index({ userId: 1, consentVersion: 1 });
consentRecordSchema.index({ email: 1 });
consentRecordSchema.index({ timestamp: -1 });

// Make records immutable after creation (append-only audit log)
consentRecordSchema.pre('findOneAndUpdate', function () {
    throw new Error('Consent records are immutable. Create a new record instead.');
});
consentRecordSchema.pre('updateOne', function () {
    throw new Error('Consent records are immutable. Create a new record instead.');
});
consentRecordSchema.pre('updateMany', function () {
    throw new Error('Consent records are immutable. Create a new record instead.');
});

module.exports = consentRecordSchema;
