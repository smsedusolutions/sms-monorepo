const express = require('express');
const router = express.Router({ mergeParams: true });
const {
    Authenticated,
    authorizeRoles
} = require('@sms/shared/middlewares');

const {
    createTerm, getTerms, updateTerm, deleteTerm,
    createExamType, getExamTypes, deleteExamType,
    createGradingSystem, getGradingSystems, updateGradingSystem, deleteGradingSystem
} = require('../controllers/exam-config.controller');

const {
    createExam, getExams, updateExam, deleteExam, scheduleExamSubject, getExamSchedule
} = require('../controllers/exam.controller');

const {
    generateAdmitCard, getAdmitCard, bulkGenerateAdmitCards, getExamRegistrations
} = require('../controllers/exam-registration.controller');

const {
    submitMarks, getSubjectResults, publishResults, getStudentReportCard
} = require('../controllers/exam-result.controller');

// ==========================================
// Exam Configuration Routes (Admin)
// ==========================================

// Terms
router.post(
    '/exam-config/terms',
    Authenticated,
    authorizeRoles('sch_admin'),
    createTerm
);
router.get(
    '/exam-config/terms',
    Authenticated,
    getTerms
);
router.put(
    '/exam-config/terms/:termId',
    Authenticated,
    authorizeRoles('sch_admin'),
    updateTerm
);
router.delete(
    '/exam-config/terms/:termId',
    Authenticated,
    authorizeRoles('sch_admin'),
    deleteTerm
);

// Exam Types
router.post(
    '/exam-config/types',
    Authenticated,
    authorizeRoles('sch_admin'),
    createExamType
);
router.get(
    '/exam-config/types',
    Authenticated,
    getExamTypes
);
router.delete(
    '/exam-config/types/:typeId',
    Authenticated,
    authorizeRoles('sch_admin'),
    deleteExamType
);

// Grading Systems
router.post(
    '/exam-config/grading',
    Authenticated,
    authorizeRoles('sch_admin'),
    createGradingSystem
);
router.get(
    '/exam-config/grading',
    Authenticated,
    getGradingSystems
);
router.put(
    '/exam-config/grading/:systemId',
    Authenticated,
    authorizeRoles('sch_admin'),
    updateGradingSystem
);
router.delete(
    '/exam-config/grading/:systemId',
    Authenticated,
    authorizeRoles('sch_admin'),
    deleteGradingSystem
);

// ==========================================
// Exam Event Routes
// ==========================================

router.post(
    '/exams',
    Authenticated,
    authorizeRoles('sch_admin'),
    createExam
);
router.get(
    '/exams',
    Authenticated,
    getExams
);
router.put(
    '/exams/:examId',
    Authenticated,
    authorizeRoles('sch_admin'),
    updateExam
);
router.delete(
    '/exams/:examId',
    Authenticated,
    authorizeRoles('sch_admin'),
    deleteExam
);

// ==========================================
// Exam Scheduling Routes
// ==========================================

router.post(
    '/exams/schedule',
    Authenticated,
    authorizeRoles('sch_admin'),
    scheduleExamSubject
);
router.get(
    '/exams/:examId/schedule',
    Authenticated,
    getExamSchedule
);

// ==========================================
// Exam Registration / Admit Card Routes
// ==========================================

router.post(
    '/registration/admit-card',
    Authenticated,
    authorizeRoles('sch_admin'),
    generateAdmitCard
);
router.post(
    '/registration/bulk-admit-card',
    Authenticated,
    authorizeRoles('sch_admin'),
    bulkGenerateAdmitCards
);
router.get(
    '/registration/:examId/student/:studentId',
    Authenticated,
    getAdmitCard
);
router.get(
    '/registration/:examId/list',
    Authenticated,
    authorizeRoles('sch_admin', 'teacher', 'principal'),
    getExamRegistrations
);

// ==========================================
// Exam Result Routes
// ==========================================

router.post(
    '/results/submit',
    Authenticated,
    authorizeRoles('sch_admin', 'teacher', 'principal'),
    submitMarks
);
router.get(
    '/results/subject/:examId/:scheduleId',
    Authenticated,
    authorizeRoles('sch_admin', 'teacher', 'principal'),
    getSubjectResults
);
router.post(
    '/results/publish',
    Authenticated,
    authorizeRoles('sch_admin', 'principal'),
    publishResults
);
router.get(
    '/results/report-card/:studentId',
    Authenticated,
    getStudentReportCard
);

module.exports = router;
