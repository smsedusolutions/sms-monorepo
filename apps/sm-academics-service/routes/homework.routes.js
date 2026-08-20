const express = require('express');
const router = express.Router({ mergeParams: true });
const { Authenticated, authorizeRoles } = require('@sms/shared/middlewares');
const {
    createHomework,
    getHomeworkByClass,
    getHomeworkByStudent,
    getUpcomingHomework,
    getTeacherHomework,
    getHomeworkById,
    updateHomework,
    deleteHomework,
    submitHomework,
    getHomeworkSubmissions,
    reviewSubmission,
} = require('../controllers/homework.controller');

// Create homework (Teacher only)
router.post(
    '/',
    Authenticated,
    authorizeRoles('teacher', 'sch_admin'),
    createHomework
);

// Get homework by class
router.get(
    '/class/:classId',
    Authenticated,
    authorizeRoles('teacher', 'sch_admin'),
    getHomeworkByClass
);

// Get homework by student (for student and parent views)
router.get(
    '/student/:studentId',
    Authenticated,
    getHomeworkByStudent
);

// Get upcoming homework for student
router.get(
    '/upcoming/:studentId',
    Authenticated,
    getUpcomingHomework
);

// Get teacher's own homework
router.get(
    '/teacher/:teacherId',
    Authenticated,
    authorizeRoles('teacher', 'sch_admin'),
    getTeacherHomework
);

// ==========================================
// SUBMISSION ROUTES
// ==========================================

// Student submits homework
router.post(
    '/:homeworkId/submit',
    Authenticated,
    authorizeRoles('student'),
    submitHomework
);

// Teacher views all submissions for a homework
router.get(
    '/:homeworkId/submissions',
    Authenticated,
    authorizeRoles('teacher', 'sch_admin', 'principal'),
    getHomeworkSubmissions
);

// Teacher reviews/marks a specific submission
router.patch(
    '/:homeworkId/submissions/:studentId/review',
    Authenticated,
    authorizeRoles('teacher', 'sch_admin'),
    reviewSubmission
);

// Get single homework by ID
router.get(
    '/:homeworkId',
    Authenticated,
    getHomeworkById
);

// Update homework
router.put(
    '/:homeworkId',
    Authenticated,
    authorizeRoles('teacher', 'sch_admin'),
    updateHomework
);

// Delete (cancel) homework
router.delete(
    '/:homeworkId',
    Authenticated,
    authorizeRoles('teacher', 'sch_admin'),
    deleteHomework
);

module.exports = router;
