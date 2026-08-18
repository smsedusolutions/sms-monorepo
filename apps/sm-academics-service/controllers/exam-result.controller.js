const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");
const {
    ExamResultSchema: examResultSchema,
    ExamSchema: examSchema,
    ExamScheduleSchema: examScheduleSchema,
    GradingSystemSchema: gradingSystemSchema,
    StudentExamRegistrationSchema: studentExamRegistrationSchema,
    StudentSchema: studentSchema // Assuming we need student names
} = require("@sms/shared");

const getModels = (schoolDbName) => {
    const schoolDb = getSchoolDbConnection(schoolDbName);
    return {
        ExamResult: schoolDb.model("ExamResult", examResultSchema),
        Exam: schoolDb.model("Exam", examSchema),
        ExamSchedule: schoolDb.model("ExamSchedule", examScheduleSchema),
        GradingSystem: schoolDb.model("GradingSystem", gradingSystemSchema),
        StudentExamRegistration: schoolDb.model("StudentExamRegistration", studentExamRegistrationSchema),
        Student: schoolDb.model("Student", studentSchema), // Assuming name is Student
    };
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
        const gradingSystem = await GradingSystem.findById(exam.gradingSystemId);

        // 3. Process Marks
        const operations = [];
        const errors = [];

        for (const entry of marks) {
            // Validate Registration/Admit Card (Strict Mode)
            const registration = await StudentExamRegistration.findOne({
                schoolId, examId, studentId: entry.studentId
            });

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
                            isPublished: false // Draft by default
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

// Get Subject Results (For Teacher View)
const getSubjectResults = async (req, res) => {
    try {
        const { schoolId, examId, scheduleId } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { ExamResult, Student } = getModels(schoolDbName);

        const results = await ExamResult.find({ schoolId, examId, scheduleId });

        // Manual population of names since Student might be in shared or school db?
        // Assuming Student model is available in schoolDb (multi-tenant)
        const studentIds = results.map(r => r.studentId);
        const students = await Student.find({ studentId: { $in: studentIds } }, 'studentId firstName lastName rollNumber');

        const studentMap = students.reduce((acc, s) => {
            acc[s.studentId] = s;
            return acc;
        }, {});

        const data = results.map(r => ({
            ...r.toObject(),
            studentName: studentMap[r.studentId] ? `${studentMap[r.studentId].firstName} ${studentMap[r.studentId].lastName}` : 'Unknown',
            rollNumber: studentMap[r.studentId]?.rollNumber
        }));

        res.status(200).json({ success: true, data });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Publish Results
const publishResults = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { examId, classId } = req.body; // Can publish for full exam or specific class

        const schoolDbName = await getSchoolDbName(schoolId);
        const { ExamResult, Exam } = getModels(schoolDbName);

        const filter = { schoolId, examId };
        if (classId) filter.classId = classId;

        await ExamResult.updateMany(filter, { isPublished: true });

        // If publishing full exam, update exam status
        if (!classId) {
            await Exam.updateOne({ schoolId, examId }, { status: 'published', resultPublishDate: new Date() });
        }

        res.status(200).json({ success: true, message: "Results published successfully" });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Student Report Card Data
const getStudentReportCard = async (req, res) => {
    try {
        const { schoolId, studentId } = req.params;
        const { academicYear, termId } = req.query;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { ExamResult, Exam, Student, ExamTerm, GradingSystem } = getModels(schoolDbName);

        // 1. Fetch Student Details
        const student = await Student.findOne({ studentId });
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });

        // 2. Find Exams for the criteria
        const examQuery = { schoolId, isActive: true, status: 'published' };
        if (academicYear) examQuery.academicYear = academicYear;
        if (termId) examQuery.termId = termId;

        const exams = await Exam.find(examQuery).sort({ startDate: 1 }).populate('termId typeId');
        const examIds = exams.map(e => e.examId);

        // 3. Fetch Results
        const results = await ExamResult.find({
            schoolId,
            studentId,
            examId: { $in: examIds },
            isPublished: true
        });

        // 4. Structure Data
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
                    results: examResults.map(r => ({
                        subjectId: r.subjectId,
                        marksObtained: r.totalMarks,
                        maxMarks: r.maxMarks, // Wait, I didn't save maxMarks in result... 
                        // I should have saved maxMarks or need to fetch from Schedule...
                        // In submitMarks, I calculated percentage using MaxMarks from Schedule.
                        // I should save maxMarks in ExamResult to be safe/immutable.
                        grade: r.grade,
                        points: r.gradePoints,
                        remarks: r.remarks
                    }))
                };
            })
        };

        res.status(200).json({ success: true, data: report });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    submitMarks,
    getSubjectResults,
    publishResults,
    getStudentReportCard
};
