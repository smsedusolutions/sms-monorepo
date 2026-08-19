const express = require('express');
const router = express.Router({ mergeParams: true });
const { Authenticated, authorizeRoles } = require('@sms/shared/middlewares');
const {
    getSyllabusOverview,
    getSyllabusForTeacher,
    updateChapterStatus,
} = require('../controllers/syllabus.controller');

// Get syllabus overview (Admin / Principal)
router.get(
    '/',
    Authenticated,
    getSyllabusOverview
);

// Get syllabus for teacher
router.get(
    '/teacher/:teacherId',
    Authenticated,
    authorizeRoles('teacher', 'sch_admin', 'principal'),
    getSyllabusForTeacher
);

// Update chapter status (Teacher / Admin)
router.patch(
    '/chapters/:chapterId',
    Authenticated,
    authorizeRoles('teacher', 'sch_admin'),
    updateChapterStatus
);

module.exports = router;
