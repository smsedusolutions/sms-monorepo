const crypto = require("crypto");
const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");
const { encryptMarks, decryptMarks } = require("../utils/marks-crypto");
const {
    ExamResultSchema: examResultSchema,
    ExamSchema: examSchema,
    ExamScheduleSchema: examScheduleSchema,
    GradingSystemSchema: gradingSystemSchema,
    StudentExamRegistrationSchema: studentExamRegistrationSchema,
    StudentSchema: studentSchema,
    ParentSchema: parentSchema,
    TeacherSchema: teacherSchema,
    ClassSchema: classSchema,
    SubjectSchema: subjectSchema,
    NotificationSchema: notificationSchema
} = require("@sms/shared");

const getModels = (schoolDbName) => {
    const schoolDb = getSchoolDbConnection(schoolDbName);
    return {
        ExamResult: schoolDb.model("ExamResult", examResultSchema),
        Exam: schoolDb.model("Exam", examSchema),
        ExamSchedule: schoolDb.model("ExamSchedule", examScheduleSchema),
        GradingSystem: schoolDb.model("GradingSystem", gradingSystemSchema),
        StudentExamRegistration: schoolDb.model("StudentExamRegistration", studentExamRegistrationSchema),
        Student: schoolDb.model("Student", studentSchema),
        Parent: schoolDb.model("Parent", parentSchema),
        Teacher: schoolDb.model("Teacher", teacherSchema),
        Class: schoolDb.model("Class", classSchema),
        Subject: schoolDb.model("Subject", subjectSchema),
        Notification: schoolDb.model("Notification", notificationSchema)
    };
};

const generateNotificationId = () => 'NOTIF-' + crypto.randomBytes(4).toString('hex').toUpperCase();

// Helper: Send result published notifications to students and parents
const sendResultPublishedNotifications = async (models, schoolId, exam, schedule, studentIds) => {
    try {
        if (!studentIds || studentIds.length === 0) return;
        const { Notification, Student, Subject } = models;
        const subjectDoc = await Subject.findOne({ $or: [{ _id: schedule.subjectId }, { subjectId: schedule.subjectId }] }).lean();
        const subjectName = subjectDoc ? subjectDoc.name : 'Subject';

        // Fetch students
        const students = await Student.find({ schoolId, studentId: { $in: studentIds } }, 'studentId parentId firstName lastName').lean();
        const notifDocs = [];

        for (const student of students) {
            // Notify Student
            notifDocs.push({
                notificationId: generateNotificationId(),
                schoolId,
                userId: student.studentId,
                userRole: 'student',
                type: 'result_published',
                title: 'Exam Result Published',
                message: `Your result for ${subjectName} in ${exam.name} has been published.`,
                referenceId: exam.examId,
                referenceType: 'result',
                isRead: false
            });

            // Notify Parent
            if (student.parentId) {
                notifDocs.push({
                    notificationId: generateNotificationId(),
                    schoolId,
                    userId: student.parentId,
                    userRole: 'parent',
                    type: 'result_published',
                    title: 'Exam Result Published',
                    message: `Exam result for ${student.firstName} ${student.lastName} in ${subjectName} (${exam.name}) is now available.`,
                    referenceId: exam.examId,
                    referenceType: 'result',
                    isRead: false
                });
            }
        }

        if (notifDocs.length > 0) {
            await Notification.insertMany(notifDocs);
        }
    } catch (err) {
        console.error("Error sending result published notifications:", err);
    }
};

// Helper: Calculate Grade
const calculateGrade = (percentage, gradingSystem) => {
    if (!gradingSystem || !gradingSystem.grades) return { grade: null, points: null };

    // Sort grades by minPercentage descending to match correctly
    const sortedGrades = [...gradingSystem.grades].sort((a, b) => b.minPercentage - a.minPercentage);

    for (const g of sortedGrades) {
        if (percentage >= g.minPercentage) {
            return { grade: g.name, points: g.points };
        }
    }
    return { grade: 'F', points: 0 }; // Fallback
};

// ==========================================
// Marks Entry Controllers
// ==========================================

// Submit Marks (Bulk or Single)
const submitMarks = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { examId, scheduleId, marks } = req.body;
        // marks: Array of { studentId, theory, practical, remarks, attendanceStatus }

        const evaluatedBy = req.user?.userId || req.user?.teacherId || "admin";

        const schoolDbName = await getSchoolDbName(schoolId);
        const { ExamResult, Exam, ExamSchedule, GradingSystem, StudentExamRegistration } = getModels(schoolDbName);

        // 1. Validate Exam & Schedule
        const exam = await Exam.findOne({ schoolId, examId, isActive: true });
        if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });

        const schedule = await ExamSchedule.findOne({ schoolId, _id: scheduleId, examId });
        if (!schedule) return res.status(404).json({ success: false, message: "Exam schedule not found" });

        // 1a. Enforce Publish Status Lock
        if (schedule.publishStatus === 'teacher_published' || schedule.publishStatus === 'final_published') {
            return res.status(403).json({
                success: false,
                message: "Marks for this subject have already been published and cannot be modified. Contact admin for rollback."
            });
        }

        // 1b. Enforce Exam Completion Timing (Unlocked only 1 hour after exam completion)
        if (schedule.date) {
            let endHours = 23;
            let endMinutes = 59;
            if (schedule.endTime && typeof schedule.endTime === 'string') {
                const parts = schedule.endTime.trim().split(':');
                if (parts.length >= 2) {
                    const h = parseInt(parts[0], 10);
                    const m = parseInt(parts[1], 10);
                    if (!isNaN(h) && !isNaN(m)) {
                        endHours = h + 1; // 1 hour after exam end
                        endMinutes = m;
                    }
                }
            }

            let scheduleDate;
            if (typeof schedule.date === 'string' && schedule.date.includes('T')) {
                const [dateStr] = schedule.date.split('T');
                const [y, m, d] = dateStr.split('-').map(Number);
                scheduleDate = new Date(y, m - 1, d, endHours, endMinutes, 0, 0);
            } else {
                const dt = new Date(schedule.date);
                scheduleDate = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), endHours, endMinutes, 0, 0);
            }

            const now = new Date();
            if (now < scheduleDate) {
                const formattedDate = scheduleDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                });
                const formattedTime = scheduleDate.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
                return res.status(403).json({
                    success: false,
                    message: `Marks entry is locked until 1 hour after the exam ends (${formattedDate} at ${formattedTime}).`
                });
            }
        }

        // 2. Fetch Grading System
        const gradingSystem = await GradingSystem.findById(exam.gradingSystemId).lean();

        // 3. Process Marks
        const operations = [];
        const errors = [];

        // Batch fetch all registrations in one query
        const studentIds = marks.map(entry => entry.studentId).filter(Boolean);
        const registrations = await StudentExamRegistration.find({
            schoolId,
            examId,
            studentId: { $in: studentIds }
        }).lean();

        const regMap = new Map();
        registrations.forEach(r => {
            regMap.set(r.studentId, r);
        });

        for (const entry of marks) {
            // Validate Registration/Admit Card (Strict Mode)
            const registration = regMap.get(entry.studentId);

            if (!registration || !registration.admitCardGenerated) {
                errors.push(`Student ${entry.studentId} does not have a generated admit card.`);
                continue; // Skip this student
            }

            const theory = parseFloat(entry.theory || 0);
            const practical = parseFloat(entry.practical || 0);
            const total = theory + practical;
            const maxMarks = (schedule.maxMarksTheory || 0) + (schedule.maxMarksPractical || 0);

            // Calculate Percentage & Grade
            let percentage = 0;
            if (maxMarks > 0) {
                percentage = (total / maxMarks) * 100;
            }

            const { grade, points } = calculateGrade(percentage, gradingSystem);

            // Phase 3: Encrypt all sensitive evaluation data (theory, practical, total, grade, gradePoints, remarks)
            const encryptedPayload = encryptMarks({
                theory,
                practical,
                total,
                grade,
                gradePoints: points,
                remarks: entry.remarks || ''
            });

            operations.push({
                updateOne: {
                    filter: { schoolId, examId, studentId: entry.studentId, subjectId: schedule.subjectId },
                    update: {
                        $set: {
                            classId: schedule.classId,
                            sectionId: registration.sectionId,
                            scheduleId: schedule._id,
                            marksObtainedTheory: theory,
                            marksObtainedPractical: practical,
                            totalMarks: total,
                            grade: grade,
                            gradePoints: points,
                            attendanceStatus: entry.attendanceStatus || 'present',
                            remarks: entry.remarks,
                            evaluatedBy,
                            evaluatedAt: new Date(),
                            publishStatus: 'draft',
                            isPublished: false, // Draft by default
                            isEncrypted: !!encryptedPayload,
                            encryptedMarks: encryptedPayload?.encryptedData,
                            encryptionIv: encryptedPayload?.iv,
                            encryptionAuthTag: encryptedPayload?.authTag
                        }
                    },
                    upsert: true
                }
            });
        }

        if (operations.length > 0) {
            await ExamResult.bulkWrite(operations);
        }

        res.status(200).json({
            success: true,
            message: `Processed ${operations.length} results.`,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Teacher Publishes Subject Marks
const teacherPublishSubject = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { examId, scheduleId } = req.body;
        const evaluatedBy = req.user?.userId || req.user?.teacherId || "admin";

        const schoolDbName = await getSchoolDbName(schoolId);
        const { ExamResult, Exam, ExamSchedule } = getModels(schoolDbName);

        const exam = await Exam.findOne({ schoolId, examId, isActive: true });
        if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });

        const schedule = await ExamSchedule.findOne({ schoolId, _id: scheduleId, examId });
        if (!schedule) return res.status(404).json({ success: false, message: "Exam schedule not found" });

        if (schedule.publishStatus === 'teacher_published') {
            return res.status(400).json({ success: false, message: "Marks for this subject are already published by the teacher." });
        }
        if (schedule.publishStatus === 'final_published') {
            return res.status(400).json({ success: false, message: "Marks for this subject have already been finally published." });
        }

        // Check that results exist
        const resultCount = await ExamResult.countDocuments({ schoolId, examId, scheduleId });
        if (resultCount === 0) {
            return res.status(400).json({ success: false, message: "No marks have been entered for this subject yet. Please save marks before publishing." });
        }

        const now = new Date();
        await ExamSchedule.updateOne(
            { _id: scheduleId },
            {
                $set: {
                    publishStatus: 'teacher_published',
                    teacherPublishedAt: now,
                    teacherPublishedBy: evaluatedBy
                }
            }
        );

        await ExamResult.updateMany(
            { schoolId, examId, scheduleId },
            {
                $set: {
                    publishStatus: 'teacher_published',
                    teacherPublishedAt: now,
                    teacherPublishedBy: evaluatedBy
                }
            }
        );

        res.status(200).json({
            success: true,
            message: "Subject marks published successfully. They are now pending admin final review and publication."
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Subject Results (With Role-Based Access Gating & Dynamic Decryption)
const getSubjectResults = async (req, res) => {
    try {
        const { schoolId, examId, scheduleId } = req.params;
        const userRole = req.user?.role;
        const currentUserId = req.user?.userId || req.user?.studentId || req.user?.teacherId;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { ExamResult, Student, ExamSchedule, Parent } = getModels(schoolDbName);

        const schedule = await ExamSchedule.findOne({ schoolId, _id: scheduleId, examId }).lean();
        if (!schedule) {
            return res.status(404).json({ success: false, message: "Exam schedule not found" });
        }

        const filter = { schoolId, examId, scheduleId };

        // Phase 3 Role-Based Access Gating:
        // 1. Students can ONLY view their own marks, and ONLY when final_published
        if (userRole === 'student') {
            if (schedule.publishStatus !== 'final_published') {
                return res.status(200).json({
                    success: true,
                    data: [],
                    schedule: { publishStatus: schedule.publishStatus || 'draft' }
                });
            }
            filter.studentId = currentUserId;
            filter.isPublished = true;
        }
        // 2. Parents can ONLY view their children's marks, and ONLY when final_published
        else if (userRole === 'parent') {
            if (schedule.publishStatus !== 'final_published') {
                return res.status(200).json({
                    success: true,
                    data: [],
                    schedule: { publishStatus: schedule.publishStatus || 'draft' }
                });
            }
            const parentDoc = await Parent.findOne({ $or: [{ parentId: currentUserId }, { userId: currentUserId }] }).lean();
            const childIds = parentDoc?.students || [];
            filter.studentId = { $in: childIds };
            filter.isPublished = true;
        }

        const results = await ExamResult.find(filter).lean();

        const studentIds = results.map(r => r.studentId);
        const students = await Student.find({ schoolId, studentId: { $in: studentIds } }, 'studentId firstName lastName rollNumber').lean();

        const studentMap = students.reduce((acc, s) => {
            acc[s.studentId] = s;
            return acc;
        }, {});

        const data = results.map(r => {
            const obj = { ...r };

            // Dynamic Decryption if encrypted
            if (obj.isEncrypted && obj.encryptedMarks && obj.encryptionIv && obj.encryptionAuthTag) {
                const decrypted = decryptMarks(obj.encryptedMarks, obj.encryptionIv, obj.encryptionAuthTag);
                if (decrypted) {
                    obj.marksObtainedTheory = decrypted.theory ?? obj.marksObtainedTheory;
                    obj.marksObtainedPractical = decrypted.practical ?? obj.marksObtainedPractical;
                    obj.totalMarks = decrypted.total ?? obj.totalMarks;
                    obj.grade = decrypted.grade ?? obj.grade;
                    obj.gradePoints = decrypted.gradePoints ?? obj.gradePoints;
                    obj.remarks = decrypted.remarks ?? obj.remarks;
                }
            }

            return {
                ...obj,
                studentName: studentMap[r.studentId] ? `${studentMap[r.studentId].firstName} ${studentMap[r.studentId].lastName}` : 'Unknown',
                rollNumber: studentMap[r.studentId]?.rollNumber
            };
        });

        res.status(200).json({
            success: true,
            data,
            schedule: {
                publishStatus: schedule.publishStatus || 'draft',
                teacherPublishedAt: schedule.teacherPublishedAt,
                teacherPublishedBy: schedule.teacherPublishedBy,
                finalPublishedAt: schedule.finalPublishedAt,
                finalPublishedBy: schedule.finalPublishedBy
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Admin / Principal Final Publish (Supports one-by-one or all)
const publishResults = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { examId, scheduleId, classId } = req.body;
        const evaluatedBy = req.user?.userId || "admin";

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { ExamResult, Exam, ExamSchedule } = models;

        const exam = await Exam.findOne({ schoolId, examId, isActive: true });
        if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });

        const now = new Date();

        if (scheduleId) {
            // Publish one by one
            const schedule = await ExamSchedule.findOne({ schoolId, _id: scheduleId, examId });
            if (!schedule) return res.status(404).json({ success: false, message: "Exam schedule not found" });

            await ExamSchedule.updateOne(
                { _id: scheduleId },
                {
                    $set: {
                        publishStatus: 'final_published',
                        finalPublishedAt: now,
                        finalPublishedBy: evaluatedBy
                    }
                }
            );

            await ExamResult.updateMany(
                { schoolId, examId, scheduleId },
                {
                    $set: {
                        publishStatus: 'final_published',
                        isPublished: true,
                        finalPublishedAt: now,
                        finalPublishedBy: evaluatedBy
                    }
                }
            );

            // Send notifications
            const results = await ExamResult.find({ schoolId, examId, scheduleId }, 'studentId');
            const studentIds = results.map(r => r.studentId);
            await sendResultPublishedNotifications(models, schoolId, exam, schedule, studentIds);

            // Check if all schedules for this exam are now published
            const remainingUnpublished = await ExamSchedule.countDocuments({
                schoolId,
                examId,
                publishStatus: { $ne: 'final_published' }
            });

            if (remainingUnpublished === 0) {
                await Exam.updateOne(
                    { schoolId, examId },
                    { $set: { status: 'published', resultPublishDate: now } }
                );
            }

            return res.status(200).json({
                success: true,
                message: "Subject marks finally published successfully and notifications sent to students & parents."
            });
        } else {
            // Publish all
            const scheduleFilter = { schoolId, examId };
            const resultFilter = { schoolId, examId };
            if (classId) {
                scheduleFilter.classId = classId;
                resultFilter.classId = classId;
            }

            await ExamSchedule.updateMany(
                scheduleFilter,
                {
                    $set: {
                        publishStatus: 'final_published',
                        finalPublishedAt: now,
                        finalPublishedBy: evaluatedBy
                    }
                }
            );

            await ExamResult.updateMany(
                resultFilter,
                {
                    $set: {
                        publishStatus: 'final_published',
                        isPublished: true,
                        finalPublishedAt: now,
                        finalPublishedBy: evaluatedBy
                    }
                }
            );

            if (!classId) {
                await Exam.updateOne(
                    { schoolId, examId },
                    { $set: { status: 'published', resultPublishDate: now } }
                );
            }

            // Send notifications for all published schedules
            const schedules = await ExamSchedule.find(scheduleFilter).lean();
            await Promise.all(
                schedules.map(async (sch) => {
                    const results = await ExamResult.find({ schoolId, examId, scheduleId: sch._id }, 'studentId').lean();
                    const studentIds = results.map(r => r.studentId);
                    if (studentIds.length > 0) {
                        await sendResultPublishedNotifications(models, schoolId, exam, sch, studentIds);
                    }
                })
            );

            return res.status(200).json({
                success: true,
                message: "All exam marks finally published successfully and notifications sent."
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Admin / Principal Rollback Subject Publish
const rollbackSubjectPublish = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { examId, scheduleId } = req.body;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { ExamResult, Exam, ExamSchedule } = getModels(schoolDbName);

        const exam = await Exam.findOne({ schoolId, examId, isActive: true });
        if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });

        const schedule = await ExamSchedule.findOne({ schoolId, _id: scheduleId, examId });
        if (!schedule) return res.status(404).json({ success: false, message: "Exam schedule not found" });

        await ExamSchedule.updateOne(
            { _id: scheduleId },
            {
                $set: {
                    publishStatus: 'draft',
                    teacherPublishedAt: null,
                    teacherPublishedBy: null,
                    finalPublishedAt: null,
                    finalPublishedBy: null
                }
            }
        );

        await ExamResult.updateMany(
            { schoolId, examId, scheduleId },
            {
                $set: {
                    publishStatus: 'draft',
                    isPublished: false,
                    teacherPublishedAt: null,
                    teacherPublishedBy: null,
                    finalPublishedAt: null,
                    finalPublishedBy: null
                }
            }
        );

        // If exam was marked published, rollback to scheduled
        if (exam.status === 'published') {
            await Exam.updateOne(
                { schoolId, examId },
                { $set: { status: 'scheduled' } }
            );
        }

        res.status(200).json({
            success: true,
            message: "Subject marks rolled back to draft successfully. Teacher can now edit marks."
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Exam Publish Status Overview (For Admin / Principal Review Dashboard)
const getExamPublishStatus = async (req, res) => {
    try {
        const { schoolId, examId } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { Exam, ExamSchedule, ExamResult, Class, Subject, Student } = getModels(schoolDbName);

        const [exam, schedules, classes, subjects, resultCounts, studentsByClass] = await Promise.all([
            Exam.findOne({ schoolId, examId, isActive: true }).lean(),
            ExamSchedule.find({ schoolId, examId }).lean(),
            Class.find({ schoolId }).lean(),
            Subject.find({ schoolId }).lean(),
            ExamResult.aggregate([
                { $match: { schoolId, examId } },
                { $group: { _id: "$scheduleId", count: { $sum: 1 } } }
            ]),
            Student.aggregate([
                { $match: { schoolId, status: { $ne: "graduated" } } },
                {
                    $group: {
                        _id: { class: "$class", classId: "$classId" },
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);

        if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });

        const resultMap = new Map(resultCounts.map(r => [String(r._id), r.count]));

        // Build student count lookup map
        const studentCountMap = new Map();
        studentsByClass.forEach(item => {
            const cls = item._id?.class;
            const clsId = item._id?.classId;
            if (cls) studentCountMap.set(cls, (studentCountMap.get(cls) || 0) + item.count);
            if (clsId && clsId !== cls) studentCountMap.set(clsId, (studentCountMap.get(clsId) || 0) + item.count);
        });

        const classMap = classes.reduce((acc, c) => {
            if (c.classId) acc[c.classId] = c.name;
            if (c._id) acc[c._id.toString()] = c.name;
            if (c.sections && Array.isArray(c.sections)) {
                c.sections.forEach((sec) => {
                    const secId = sec.sectionId || sec._id || sec.name;
                    const secName = sec.name || '';
                    if (c.classId) {
                        acc[`${c.classId}#${secId}`] = `${c.name || ''} - ${secName}`;
                        acc[`${c.classId}_${secId}`] = `${c.name || ''} - ${secName}`;
                    }
                    if (c._id) {
                        acc[`${c._id.toString()}#${secId}`] = `${c.name || ''} - ${secName}`;
                        acc[`${c._id.toString()}_${secId}`] = `${c.name || ''} - ${secName}`;
                    }
                });
            }
            return acc;
        }, {});

        const subjectMap = subjects.reduce((acc, s) => {
            acc[s._id.toString()] = s.name;
            if (s.subjectId) acc[s.subjectId] = s.name;
            return acc;
        }, {});

        let draftCount = 0;
        let teacherPublishedCount = 0;
        let finalPublishedCount = 0;

        const scheduleList = [];

        for (const sch of schedules) {
            const status = sch.publishStatus || 'draft';
            if (status === 'final_published') finalPublishedCount++;
            else if (status === 'teacher_published') teacherPublishedCount++;
            else draftCount++;

            const resultCount = resultMap.get(String(sch._id)) || 0;

            // Count registered/enrolled students in this class
            const rawClass = sch.classId.includes('#') ? sch.classId.split('#')[0] : (sch.classId.includes('_') ? sch.classId.split('_')[0] : sch.classId);
            const totalStudents = studentCountMap.get(sch.classId) || studentCountMap.get(rawClass) || 0;

            scheduleList.push({
                _id: sch._id,
                classId: sch.classId,
                className: classMap[sch.classId] || sch.classId,
                subjectId: sch.subjectId,
                subjectName: subjectMap[sch.subjectId] || sch.subjectId,
                date: sch.date,
                startTime: sch.startTime,
                endTime: sch.endTime,
                publishStatus: status,
                teacherPublishedAt: sch.teacherPublishedAt,
                teacherPublishedBy: sch.teacherPublishedBy,
                finalPublishedAt: sch.finalPublishedAt,
                finalPublishedBy: sch.finalPublishedBy,
                evaluatedStudents: resultCount,
                totalStudents
            });
        }

        res.status(200).json({
            success: true,
            data: {
                exam: {
                    examId: exam.examId,
                    name: exam.name,
                    status: exam.status,
                    startDate: exam.startDate,
                    endDate: exam.endDate,
                    resultPublishDate: exam.resultPublishDate
                },
                summary: {
                    totalSubjects: schedules.length,
                    draftCount,
                    teacherPublishedCount,
                    finalPublishedCount,
                    isAllTeacherPublished: schedules.length > 0 && (teacherPublishedCount + finalPublishedCount === schedules.length),
                    isAllFinalPublished: schedules.length > 0 && (finalPublishedCount === schedules.length)
                },
                subjects: scheduleList
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Student Report Card Data (Strict Final Published Gating)
const getStudentReportCard = async (req, res) => {
    try {
        const { schoolId, studentId } = req.params;
        const { academicYear, termId } = req.query;
        const userRole = req.user?.role;
        const currentUserId = req.user?.userId || req.user?.studentId;

        // Security: Students can only request their own report card
        if (userRole === 'student' && currentUserId && currentUserId !== studentId) {
            return res.status(403).json({ success: false, message: "Unauthorized access to student report card." });
        }

        const schoolDbName = await getSchoolDbName(schoolId);
        const { ExamResult, Exam, Student } = getModels(schoolDbName);

        // 1. Fetch Student Details
        const student = await Student.findOne({ studentId }).lean();
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });

        // 2. Find Exams for the criteria
        const examQuery = { schoolId, isActive: true, status: 'published' };
        if (academicYear) examQuery.academicYear = academicYear;
        if (termId) examQuery.termId = termId;

        const exams = await Exam.find(examQuery).sort({ startDate: 1 }).populate('termId typeId').lean();
        const examIds = exams.map(e => e.examId);

        // 3. Fetch Results - Strict Final Published Only
        const results = await ExamResult.find({
            schoolId,
            studentId,
            examId: { $in: examIds },
            isPublished: true,
            publishStatus: 'final_published'
        }).lean();

        // 4. Structure Data with Dynamic Decryption
        const report = {
            student: {
                name: `${student.firstName} ${student.lastName}`,
                rollNumber: student.rollNumber,
                classId: student.class,
                sectionId: student.section,
                admissionNumber: student.admissionNumber
            },
            academicYear,
            exams: exams.map(exam => {
                const examResults = results.filter(r => r.examId === exam.examId);
                return {
                    examId: exam.examId,
                    name: exam.name,
                    term: exam.termId?.name,
                    type: exam.typeId?.name,
                    results: examResults.map(r => {
                        let total = r.totalMarks;
                        let grade = r.grade;
                        let points = r.gradePoints;
                        let remarks = r.remarks;

                        if (r.isEncrypted && r.encryptedMarks && r.encryptionIv && r.encryptionAuthTag) {
                            const decrypted = decryptMarks(r.encryptedMarks, r.encryptionIv, r.encryptionAuthTag);
                            if (decrypted) {
                                total = decrypted.total ?? total;
                                grade = decrypted.grade ?? grade;
                                points = decrypted.gradePoints ?? points;
                                remarks = decrypted.remarks ?? remarks;
                            }
                        }
                        return {
                            subjectId: r.subjectId,
                            marksObtained: total,
                            grade,
                            points,
                            remarks
                        };
                    })
                };
            })
        };

        res.status(200).json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Send Reminder to Teacher for Pending Marks Entry
const remindTeacherForMarksEntry = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { examId, scheduleId } = req.body;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { Exam, ExamSchedule, Subject, Class, Teacher, Notification } = getModels(schoolDbName);

        const exam = await Exam.findOne({ schoolId, examId }).lean();
        if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });

        const schedule = await ExamSchedule.findOne({ schoolId, _id: scheduleId, examId }).lean();
        if (!schedule) return res.status(404).json({ success: false, message: "Schedule not found" });

        const subject = await Subject.findOne({ $or: [{ _id: schedule.subjectId }, { subjectId: schedule.subjectId }] }).lean();
        const subjectName = subject ? subject.name : 'Subject';

        const classDoc = await Class.findOne({ $or: [{ _id: schedule.classId }, { classId: schedule.classId }] }).lean();
        const className = classDoc ? classDoc.name : 'Class';

        // Find teachers assigned to this subject or invigilators
        let targetTeacherIds = [];
        if (subject && subject.assignedTeacherIds && subject.assignedTeacherIds.length > 0) {
            targetTeacherIds = targetTeacherIds.concat(subject.assignedTeacherIds);
        } else if (subject && subject.assignedTeacherId) {
            targetTeacherIds.push(subject.assignedTeacherId);
        }

        if (schedule.invigilators && schedule.invigilators.length > 0) {
            schedule.invigilators.forEach(inv => {
                const tid = typeof inv === 'object' ? (inv.teacherId || inv.userId) : inv;
                if (tid) targetTeacherIds.push(tid);
            });
        }

        targetTeacherIds = [...new Set(targetTeacherIds.filter(Boolean))];

        if (targetTeacherIds.length === 0) {
            // Fallback: Notify all active teachers of this school
            const allTeachers = await Teacher.find({ schoolId, status: 'active' }, 'teacherId').lean();
            targetTeacherIds = allTeachers.map(t => t.teacherId);
        }

        const notifs = targetTeacherIds.map(tid => ({
            notificationId: generateNotificationId(),
            schoolId,
            userId: tid,
            userRole: 'teacher',
            type: 'marks_submission_reminder',
            title: 'Marks Submission Reminder',
            message: `Please complete and submit the marks for ${subjectName} (${className}) in ${exam.name}.`,
            referenceId: exam.examId,
            referenceType: 'exam',
            isRead: false
        }));

        if (notifs.length > 0) {
            await Notification.insertMany(notifs);
        }

        res.status(200).json({
            success: true,
            message: `Reminder notification sent to ${targetTeacherIds.length} teacher(s) successfully.`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    submitMarks,
    teacherPublishSubject,
    getSubjectResults,
    publishResults,
    rollbackSubjectPublish,
    getExamPublishStatus,
    getStudentReportCard,
    remindTeacherForMarksEntry
};
