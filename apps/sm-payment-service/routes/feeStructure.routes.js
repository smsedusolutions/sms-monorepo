const express = require('express');
const router = express.Router({ mergeParams: true });
const { Authenticated, authorizeRoles } = require('@sms/shared/middlewares');
const { paginate } = require('../utils/pagination');

const {
    createStructure,
    getStructures,
    getStructureById,
    updateStructure,
    publishStructure,
    archiveStructure,
    cloneStructure,
    deleteStructure
} = require('../controllers/feeStructure.controller');

// Apply auth globally
router.use(Authenticated);
router.use(authorizeRoles('sch_admin', 'principal'));

// Create Structure
router.post('/', createStructure);

// List Structures
router.get('/', paginate, getStructures);

// Get single structure
router.get('/:structureId', getStructureById);

// Update structure
router.put('/:structureId', updateStructure);

// Publish structure
router.patch('/:structureId/publish', publishStructure);

// Archive structure
router.patch('/:structureId/archive', archiveStructure);

// Clone structure
router.post('/:structureId/clone', cloneStructure);

// Delete structure (soft delete draft)
router.delete('/:structureId', deleteStructure);

module.exports = router;
