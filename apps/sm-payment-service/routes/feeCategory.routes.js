const express = require('express');
const router = express.Router({ mergeParams: true });
const { Authenticated, authorizeRoles } = require('@sms/shared/middlewares');
const { paginate } = require('../utils/pagination');

const {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    toggleCategoryStatus,
    deleteCategory
} = require('../controllers/feeCategory.controller');

// Apply auth and admin-only rules globally to this router
router.use(Authenticated);
router.use(authorizeRoles('sch_admin', 'principal'));

// Create Category
router.post(
    '/',
    createCategory
);

// List Categories
router.get(
    '/',
    paginate,
    getCategories
);

// Get single category details
router.get(
    '/:categoryId',
    getCategoryById
);

// Update Category
router.put(
    '/:categoryId',
    updateCategory
);

// Toggle Category status (Active/Inactive)
router.patch(
    '/:categoryId/toggle',
    toggleCategoryStatus
);

// Soft Delete Category
router.delete(
    '/:categoryId',
    deleteCategory
);

module.exports = router;
