const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");
const {
    StudentExamRegistrationSchema: studentExamRegistrationSchema,
    ExamSchema: examSchema,
    // We might need Student schema too from shared if we check eligibility based on student data
} = require("@sms/shared");

const getModels = (schoolDbName) => {
    const schoolDb = getSchoolDbConnection(schoolDbName);
    return {
        StudentExamRegistration: schoolDb.model("StudentExamRegistration", studentExamRegistrationSchema),
        Exam: schoolDb.model("Exam", examSchema),
    };
};

// Generate/Register Admit Card for a student
const generateAdmitCard = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { examId, studentId, classId, sectionId, rollNumber } = req.body;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { StudentExamRegistration, Exam } = getModels(schoolDbName);

        // check if exam exists and is not draft
        const exam = await Exam.findOne({ schoolId, examId });
        if (!exam || exam.status === 'draft') {
            return res.status(400).json({ success: false, message: "Exam not found or not ready for registration" });
        }

        // Check/Create registration
        let registration = await StudentExamRegistration.findOne({ schoolId, examId, studentId });

        if (registration) {
            if (registration.admitCardGenerated) {
                return res.status(200).json({ success: true, data: registration, message: "Admit card already generated" });
            }
            // Update if exists but not generated (re-generate)
            registration.admitCardGenerated = true;
            await registration.save();
        } else {
            registration = new StudentExamRegistration({
                schoolId,
                examId,
                studentId,
                classId,
                sectionId,
                rollNumber,
                admitCardGenerated: true
            });
            await registration.save();
        }

        res.status(201).json({ success: true, data: registration, message: "Admit card generated successfully" });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAdmitCard = async (req, res) => {
    try {
        const { schoolId, examId, studentId } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { StudentExamRegistration } = getModels(schoolDbName);

        const registration = await StudentExamRegistration.findOne({ schoolId, examId, studentId });

        if (!registration) {
            return res.status(404).json({ success: false, message: "Admit card not found" });
        }

        res.status(200).json({ success: true, data: registration });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Bulk generation for a class
const bulkGenerateAdmitCards = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { examId, students: providedStudents } = req.body;

        const schoolDbName = await getSchoolDbName(schoolId);
        const schoolDb = getSchoolDbConnection(schoolDbName);
        const { StudentExamRegistration, Exam } = getModels(schoolDbName);

        // Get the exam to find participating classes
        const exam = await Exam.findOne({ schoolId, examId });
        if (!exam) {
            return res.status(404).json({ success: false, message: "Exam not found" });
        }

        let students = providedStudents;

        // If no students provided, fetch all students from exam's classes
        if (!students || students.length === 0) {
            // Get Student model from school connection
            const { StudentSchema } = require("@sms/shared");
            const Student = schoolDb.model("Student", StudentSchema);

            // Fetch all students from the participating classes
            const fetchedStudents = await Student.find({
                schoolId,
                class: { $in: exam.classes }
            }).select('studentId class section rollNumber').lean();

            if (!fetchedStudents || fetchedStudents.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "No students found in participating classes"
                });
            }

            students = fetchedStudents.map(s => ({
                studentId: s.studentId,
                classId: s.class,
                sectionId: s.section || s.sectionId,
                rollNumber: s.rollNumber || 'N/A'
            }));
        }

        const operations = students.map(student => ({
            updateOne: {
                filter: { schoolId, examId, studentId: student.studentId },
                update: {
                    $set: {
                        classId: student.classId,
                        sectionId: student.sectionId,
                        rollNumber: student.rollNumber,
                        admitCardGenerated: true,
                        isEligible: true
                    }
                },
                upsert: true
            }
        }));

        const result = await StudentExamRegistration.bulkWrite(operations);

        res.status(200).json({
            success: true,
            message: `Generated admit cards for ${result.upsertedCount + result.modifiedCount} students`,
            data: {
                totalProcessed: students.length,
                upserted: result.upsertedCount,
                modified: result.modifiedCount
            }
        });

    } catch (error) {
        console.error("Bulk generate admit cards error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all admit card registrations for an exam
const getExamRegistrations = async (req, res) => {
    try {
        const { schoolId, examId } = req.params;
        const { classId, search, page, limit } = req.query;

        const schoolDbName = await getSchoolDbName(schoolId);
        const schoolDb = getSchoolDbConnection(schoolDbName);
        const { StudentExamRegistration } = getModels(schoolDbName);

        // Get Student and Parent models
        const { StudentSchema, ParentSchema } = require("@sms/shared");
        const Student = schoolDb.model("Student", StudentSchema);
        const Parent = schoolDb.model("Parent", ParentSchema);

        const query = { schoolId, examId };
        if (classId) query.classId = classId;

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const isPaginated = pageNum > 0 && limitNum > 0;

        let total = await StudentExamRegistration.countDocuments(query);
        let registrationsQuery = StudentExamRegistration.find(query).lean();

        if (isPaginated && (!search || !search.trim())) {
            registrationsQuery = registrationsQuery.skip((pageNum - 1) * limitNum).limit(limitNum);
        }

        let registrations = await registrationsQuery;
        let studentIds = registrations.map(r => r.studentId);

        // If search query provided, filter students by name or ID
        let studentQuery = { studentId: { $in: studentIds } };
        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            const searchStudentQuery = {
                schoolId,
                $or: [
                    { studentId: searchRegex },
                    { firstName: searchRegex },
                    { lastName: searchRegex },
                    { email: searchRegex },
                    { rollNumber: searchRegex }
                ]
            };

            const matchingStudents = await Student.find(searchStudentQuery).select('studentId').lean();
            const matchingStudentIds = matchingStudents.map(s => s.studentId);

            query.studentId = { $in: matchingStudentIds };
            total = await StudentExamRegistration.countDocuments(query);

            let searchRegQuery = StudentExamRegistration.find(query).lean();
            if (isPaginated) {
                searchRegQuery = searchRegQuery.skip((pageNum - 1) * limitNum).limit(limitNum);
            }
            registrations = await searchRegQuery;
            studentIds = registrations.map(r => r.studentId);
            studentQuery = { studentId: { $in: studentIds } };
        }

        // Enrich only the paginated batch of students
        const students = await Student.find(studentQuery)
            .select('studentId firstName lastName email class section rollNumber profileImage dateOfBirth signature parentId')
            .lean();

        // Get parent IDs ONLY for this batch of students
        const parentIds = [...new Set(students.filter(s => s.parentId).map(s => s.parentId))];
        const allParents = (parentIds.length > 0 || studentIds.length > 0) ? await Parent.find({
            $or: [
                { parentId: { $in: parentIds } },
                { studentIds: { $in: studentIds } }
            ]
        }).select('parentId firstName lastName relationship studentIds').lean() : [];

        // Build parent map by parentId and by studentId
        const parentByIdMap = {};
        const parentsByStudentId = {};

        allParents.forEach(p => {
            parentByIdMap[p.parentId] = p;
            (p.studentIds || []).forEach(sid => {
                if (!parentsByStudentId[sid]) {
                    parentsByStudentId[sid] = [];
                }
                parentsByStudentId[sid].push(p);
            });
        });

        // Enrich students with fatherName and fatherNameLabel
        const studentMap = {};
        students.forEach(s => {
            const studentParents = parentsByStudentId[s.studentId] || [];
            const primaryParent = s.parentId ? parentByIdMap[s.parentId] : null;

            const father = studentParents.find(p => p.relationship === 'father');
            const mother = studentParents.find(p => p.relationship === 'mother');
            const guardian = studentParents.find(p => p.relationship === 'guardian');

            let fatherName = null;
            let fatherNameLabel = "Father's Name";

            if (father) {
                fatherName = `${father.firstName} ${father.lastName}`;
            } else if (mother) {
                fatherName = `${mother.firstName} ${mother.lastName}`;
                fatherNameLabel = "Mother's Name";
            } else if (guardian) {
                fatherName = `${guardian.firstName} ${guardian.lastName}`;
                fatherNameLabel = "Guardian's Name";
            } else if (primaryParent) {
                fatherName = `${primaryParent.firstName} ${primaryParent.lastName}`;
                if (primaryParent.relationship === 'mother') {
                    fatherNameLabel = "Mother's Name";
                } else if (primaryParent.relationship === 'guardian') {
                    fatherNameLabel = "Guardian's Name";
                }
            }

            studentMap[s.studentId] = {
                ...s,
                fatherName,
                fatherNameLabel,
                parentName: primaryParent ? `${primaryParent.firstName} ${primaryParent.lastName}` : null
            };
        });

        const enrichedRegistrations = registrations.map(r => ({
            ...r,
            student: studentMap[r.studentId] || null
        }));

        res.status(200).json({
            success: true,
            data: enrichedRegistrations,
            total,
            page: pageNum || 1,
            limit: limitNum || total
        });
    } catch (error) {
        console.error("Get exam registrations error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    generateAdmitCard,
    getAdmitCard,
    bulkGenerateAdmitCards,
    getExamRegistrations
};
