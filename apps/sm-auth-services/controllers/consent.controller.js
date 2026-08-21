/**
 * Consent Controller — DPDP Act 2023 Compliance
 *
 * Handles storing and retrieving consent records.
 *
 * Routes:
 *   POST /api/auth/consent         — record consent at login
 *   GET  /api/auth/consent/:userId — retrieve consent history (admin/grievance use)
 *
 * [LEGAL REVIEW REQUIRED] — Access control for GET endpoint needs review;
 * only the user themselves or the Grievance Officer should access records.
 */

const mongoose = require('mongoose');
const consentRecordSchema = require('../../../packages/shared/models/consentRecord.schema');

// Use or create the ConsentRecord model on the primary DB connection
const getConsentModel = () => {
    if (mongoose.models.ConsentRecord) {
        return mongoose.model('ConsentRecord');
    }
    return mongoose.model('ConsentRecord', consentRecordSchema);
};

/**
 * POST /api/auth/consent
 * Records a consent decision at login.
 * Called from the frontend after the user ticks the consent checkbox.
 *
 * Body:
 *   { userId, schoolId, role, email, consentVersion, purposes, analytics }
 */
const recordConsent = async (req, res) => {
    try {
        const {
            userId,
            schoolId,
            role,
            email,
            consentVersion,
            purposes,
            withdrawn,
            source,
        } = req.body;

        if (!userId || !role || !email) {
            return res.status(400).json({
                success: false,
                message: 'userId, role, and email are required',
            });
        }

        const ConsentRecord = getConsentModel();

        // Build consent record — immutable append
        const record = new ConsentRecord({
            userId,
            schoolId: schoolId || null,
            role,
            email: email.toLowerCase().trim(),
            consentVersion: consentVersion || 'v1.0-2026-08-21',
            purposes: {
                accountManagement: true,  // Always true — essential
                platformServices: true,   // Always true — essential
                communication: purposes?.communication ?? false,
                analytics: purposes?.analytics ?? false,
            },
            ipAddress: req.ip || req.headers['x-forwarded-for'] || null,
            userAgent: req.headers['user-agent'] || null,
            withdrawn: withdrawn ?? false,
            source: source || 'login',
        });

        await record.save();

        return res.status(201).json({
            success: true,
            message: 'Consent record saved',
            data: {
                consentId: record._id,
                timestamp: record.timestamp,
                consentVersion: record.consentVersion,
            },
        });

    } catch (error) {
        console.error('Error recording consent:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to record consent',
        });
    }
};

/**
 * GET /api/auth/consent/:userId
 * Returns consent history for a user.
 * [LEGAL REVIEW REQUIRED] — restrict to authenticated user or Grievance Officer.
 */
const getConsentHistory = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'userId is required' });
        }

        // Access Control (GAP-008): Only allow the user themselves or a super_admin / school admin
        if (req.user) {
            const requesterId = req.user.userId || req.user.adminId;
            const isSelf = requesterId === userId;
            const isSuperAdmin = req.user.role === 'super_admin';
            const isSchoolAdmin = req.user.role === 'sch_admin';

            if (!isSelf && !isSuperAdmin && !isSchoolAdmin) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden: You are not authorized to view consent records for another user',
                });
            }
        }

        const ConsentRecord = getConsentModel();

        const records = await ConsentRecord
            .find({ userId })
            .sort({ timestamp: -1 })
            .limit(50)
            .select('-ipAddress -userAgent')  // Don't expose IP/UA in response
            .lean();

        return res.status(200).json({
            success: true,
            data: {
                userId,
                totalRecords: records.length,
                records,
            },
        });

    } catch (error) {
        console.error('Error fetching consent history:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch consent history',
        });
    }
};

module.exports = {
    recordConsent,
    getConsentHistory,
};
