/**
 * Consent Routes — DPDP Act 2023 Compliance
 *
 * POST /api/auth/consent         — record user consent decision
 * GET  /api/auth/consent/:userId — retrieve consent audit history
 *
 * [LEGAL REVIEW REQUIRED] — The GET endpoint should be protected by
 * authentication middleware ensuring only the user themselves or an
 * authorised Grievance Officer can access consent records.
 */

const express = require('express');
const router = express.Router();
const { recordConsent, getConsentHistory } = require('../controllers/consent.controller');

// POST — record a consent decision (called at login after checkbox is ticked)
router.post('/', recordConsent);

// GET — retrieve consent history for a specific user
// [LEGAL REVIEW REQUIRED] Add auth middleware before production deployment:
// router.get('/:userId', requireAuth, requireSelfOrGrievanceOfficer, getConsentHistory);
router.get('/:userId', getConsentHistory);

module.exports = router;
