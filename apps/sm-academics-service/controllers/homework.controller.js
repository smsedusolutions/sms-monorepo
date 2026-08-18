const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");
const {
    HomeworkSchema: homeworkSchema,
    StudentSchema: studentSchema,
    ClassSchema: classSchema,
    SubjectSchema: subjectSchema,
    TeacherSchema: teacherSchema,
    ParentSchema: parentSchema,
    NotificationSchema: notificationSchema,
} = require("@sms/shared");
const { logActivity } = require("@sms/shared/utils");

// Get models for a specific school database
const getModels = (schoolDbName) => {
    const schoolDb = getSchoolDbConnection(schoolDbName);
    return {
        Homework: schoolDb.model('Homework', homeworkSchema),
        Student: schoolDb.model('Student', studentSchema),
        Class: schoolDb.model('Class', classSchema),
        Subject: schoolDb.model('Subject', subjectSchema),
        Teacher: schoolDb.model('Teacher', teacherSchema),
        Parent: schoolDb.model('Parent', parentSchema),
        Notification: schoolDb.model('Notification', notificationSchema),
    };
};

const { generateNextId } = require("@sms/shared/utils");

// Generate unique homework ID
const generateHomeworkId = async (HomeworkModel) => {
    return generateNextId(HomeworkModel, 'homeworkId', 'HW', 5);
};

// ==========================================
// CREATE HOMEWORK
// POST /api/academics/school/:schoolId/homework
// ==========================================
const createHomework = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { classId, sectionId, subjectId, title, description, attachmentUrl, referenceLinks, attachments, dueDate } = req.body;
        const { userId, teacherId } = req.user;

        // Validate required fields
        if (!classId || !subjectId || !title || !description || !dueDate) {
            return res.status(400).json({
                success: false,
                message: "classId, subjectId, title, description, and dueDate are required"
            });
        }

        const schoolDbName = await getSchoolDbName(schoolId);
        const { Homework, Student, Parent, Notification, Class, Subject, Teacher } = getModels(schoolDbName);

        const homeworkId = await generateHomeworkId(Homework);

        // Get class and subject names for notification
        const [classData, subjectData, teacherData] = await Promise.all([
            Class.findOne({ classId }),
            Subject.findOne({ subjectId }),
            Teacher.findOne({ teacherId: teacherId || userId })
        ]);

        const newHomework = new Homework({
            homeworkId,
            schoolId,
            classId,
            sectionId,
            subjectId,
            teacherId: teacherId || userId,
            title,
            description,
            attachmentUrl,
            referenceLinks,
            attachments,
            assignedDate: new Date(),
            dueDate: new Date(dueDate),
            status: 'active'
        });

        await newHomework.save();

        // Create notifications for students and parents
        await createHomeworkNotifications(
            Notification, Student, Parent,
            schoolId, newHomework,
            classData?.name || classId,
            subjectData?.name || subjectId,
            teacherData ? `${teacherData.firstName} ${teacherData.lastName}` : 'Teacher'
        );

        const response = res.status(201).json({
            success: true,
            message: "Homework created successfully",
            data: newHomework
        });

        // Integrated Logging
        logActivity({
            schoolDb: getSchoolDbConnection(schoolDbName),
            schoolId,
            actor: req.user,
            action: "CREATE",
            entity: "Homework",
            entityId: newHomework.homeworkId,
            entityLabel: newHomework.title,
            description: `Assigned new homework: ${newHomework.title} for ${classData?.name || classId}`,
            metadata: { homeworkId: newHomework.homeworkId, title: newHomework.title }
        });

        return response;
    } catch (error) {
        console.error("Create Homework Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create homework",
            error: error.message
        });
    }
};

// Helper: Create notifications for homework
const createHomeworkNotifications = async (Notification, Student, Parent, schoolId, homework, className, subjectName, teacherName) => {
    try {
        const notifications = [];
        const dueDateFormatted = new Date(homework.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

        // Get students in this class/section
        const studentQuery = { schoolId, status: 'active', class: homework.classId };
        if (homework.sectionId) {
            studentQuery.section = homework.sectionId;
        }
        const students = await Student.find(studentQuery, 'studentId firstName lastName parentId');

        // Notify students
        for (const student of students) {
            notifications.push({
                notificationId: `NOTIF${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
                schoolId,
                userId: student.studentId,
                userRole: 'student',
                type: 'homework_assigned',
                title: `New Homework: ${homework.title}`,
                message: `${subjectName} homework assigned by ${teacherName}. Due: ${dueDateFormatted}`,
                referenceId: homework.homeworkId,
                referenceType: 'homework',
                isRead: false,
                metadata: { classId: homework.classId, subjectId: homework.subjectId, dueDate: homework.dueDate }
            });

            // Notify parent if exists
            if (student.parentId) {
                notifications.push({
                    notificationId: `NOTIF${Date.now()}${Math.random().toString(36).substr(2, 6)}`,
                    schoolId,
                    userId: student.parentId,
                    userRole: 'parent',
                    type: 'homework_assigned',
                    title: `Homework for ${student.firstName}`,
                    message: `${subjectName}: ${homework.title}. Due: ${dueDateFormatted}`,
                    referenceId: homework.homeworkId,
                    referenceType: 'homework',
                    isRead: false,
                    metadata: { studentId: student.studentId, classId: homework.classId, subjectId: homework.subjectId, dueDate: homework.dueDate }
                });
            }
        }

        // Also get parents linked via studentIds array
        const studentIds = students.map(s => s.studentId);
        const parents = await Parent.find({ schoolId, status: 'active', studentIds: { $in: studentIds } }, 'parentId studentIds');
        for (const parent of parents) {
            // Avoid duplicate notifications
            const alreadyNotified = notifications.some(n => n.userId === parent.parentId && n.referenceId === homework.homeworkId);
            if (!alreadyNotified) {
                notifications.push({
                    notificationId: `NOTIF${Date.now()}${Math.random().toString(36).substr(2, 7)}`,
                    schoolId,
                    userId: parent.parentId,
                    userRole: 'parent',
                    type: 'homework_assigned',
                    title: `New Homework: ${homework.title}`,
                    message: `${subjectName} homework for ${className}. Due: ${dueDateFormatted}`,
                    referenceId: homework.homeworkId,
                    referenceType: 'homework',
                    isRead: false,
                    metadata: { classId: homework.classId, subjectId: homework.subjectId, dueDate: homework.dueDate }
                });
            }
        }

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }
    } catch (error) {
        console.error("Error creating homework notifications:", error);
    }
};

// ==========================================
// GET HOMEWORK BY CLASS
// GET /api/academics/school/:schoolId/homework/class/:classId
// ==========================================
const getHomeworkByClass = async (req, res) => {
    try {
        const { schoolId, classId } = req.params;
        const { sectionId, status, subjectId, startDate, endDate } = req.query;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { Homework, Subject, Teacher } = getModels(schoolDbName);

        let query = { schoolId, classId };

        if (sectionId) query.sectionId = sectionId;
        if (status) query.status = status;
        if (subjectId) query.subjectId = subjectId;

        if (startDate || endDate) {
            query.dueDate = {};
            if (startDate) query.dueDate.$gte = new Date(startDate);
            if (endDate) query.dueDate.$lte = new Date(endDate);
        }

        const homework = await Homework.find(query).sort({ dueDate: -1 });

        // Enrich with subject and teacher names
        const subjectIds = [...new Set(homework.map(h => h.subjectId))];
        const teacherIds = [...new Set(homework.map(h => h.teacherId))];

        const [subjects, teachers] = await Promise.all([
            Subject.find({ subjectId: { $in: subjectIds } }, 'subjectId name'),
            Teacher.find({ teacherId: { $in: teacherIds } }, 'teacherId firstName lastName')
        ]);

        const subjectMap = Object.fromEntries(subjects.map(s => [s.subjectId, s.name]));
        const teacherMap = Object.fromEntries(teachers.map(t => [t.teacherId, `${t.firstName} ${t.lastName}`]));

        const enrichedHomework = homework.map(h => ({
            ...h.toObject(),
            subjectName: subjectMap[h.subjectId] || h.subjectId,
            teacherName: teacherMap[h.teacherId] || 'Teacher'
        }));

        res.status(200).json({
            success: true,
            message: "Homework fetched successfully",
            data: enrichedHomework,
            count: enrichedHomework.length
        });
    } catch (error) {
        console.error("Get Homework By Class Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch homework",
            error: error.message
        });
    }
};

// ==========================================
// GET HOMEWORK BY STUDENT
// GET /api/academics/school/:schoolId/homework/student/:studentId
// ==========================================
const getHomeworkByStudent = async (req, res) => {
    try {
        const { schoolId, studentId } = req.params;
        const { status, subjectId } = req.query;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { Homework, Student, Subject, Teacher } = getModels(schoolDbName);

        // Get student's class and section
        const student = await Student.findOne({ studentId });
        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        let query = {
            schoolId,
            classId: student.class,
            $or: [
                { sectionId: null },
                { sectionId: '' },
                { sectionId: student.section }
            ]
        };

        if (status) query.status = status;
        if (subjectId) query.subjectId = subjectId;

        const homework = await Homework.find(query).sort({ dueDate: -1 });

        // Enrich with subject and teacher names
        const subjectIds = [...new Set(homework.map(h => h.subjectId))];
        const teacherIds = [...new Set(homework.map(h => h.teacherId))];

        const [subjects, teachers] = await Promise.all([
            Subject.find({ subjectId: { $in: subjectIds } }, 'subjectId name'),
            Teacher.find({ teacherId: { $in: teacherIds } }, 'teacherId firstName lastName')
        ]);

        const subjectMap = Object.fromEntries(subjects.map(s => [s.subjectId, s.name]));
        const teacherMap = Object.fromEntries(teachers.map(t => [t.teacherId, `${t.firstName} ${t.lastName}`]));

        const enrichedHomework = homework.map(h => ({
            ...h.toObject(),
            subjectName: subjectMap[h.subjectId] || h.subjectId,
            teacherName: teacherMap[h.teacherId] || 'Teacher'
        }));

        res.status(200).json({
            success: true,
            message: "Homework fetched successfully",
            data: enrichedHomework,
            count: enrichedHomework.length
        });
    } catch (error) {
        console.error("Get Homework By Student Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch homework",
            error: error.message
        });
    }
};

// ==========================================
// GET UPCOMING HOMEWORK
// GET /api/academics/school/:schoolId/homework/upcoming/:studentId
// ==========================================
const getUpcomingHomework = async (req, res) => {
    try {
        const { schoolId, studentId } = req.params;
        const { limit = 10 } = req.query;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { Homework, Student, Subject, Teacher } = getModels(schoolDbName);

        // Get student's class and section
        const student = await Student.findOne({ studentId });
        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const homework = await Homework.find({
            schoolId,
            classId: student.class,
            $or: [
                { sectionId: null },
                { sectionId: '' },
                { sectionId: student.section }
            ],
            status: 'active',
            dueDate: { $gte: today }
        })
            .sort({ dueDate: 1 })
            .limit(parseInt(limit));

        // Enrich with subject and teacher names
        const subjectIds = [...new Set(homework.map(h => h.subjectId))];
        const teacherIds = [...new Set(homework.map(h => h.teacherId))];

        const [subjects, teachers] = await Promise.all([
            Subject.find({ subjectId: { $in: subjectIds } }, 'subjectId name'),
            Teacher.find({ teacherId: { $in: teacherIds } }, 'teacherId firstName lastName')
        ]);

        const subjectMap = Object.fromEntries(subjects.map(s => [s.subjectId, s.name]));
        const teacherMap = Object.fromEntries(teachers.map(t => [t.teacherId, `${t.firstName} ${t.lastName}`]));

        const enrichedHomework = homework.map(h => ({
            ...h.toObject(),
            subjectName: subjectMap[h.subjectId] || h.subjectId,
            teacherName: teacherMap[h.teacherId] || 'Teacher',
            isOverdue: new Date(h.dueDate) < new Date()
        }));

        res.status(200).json({
            success: true,
            message: "Upcoming homework fetched successfully",
            data: enrichedHomework
        });
    } catch (error) {
        console.error("Get Upcoming Homework Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch upcoming homework",
            error: error.message
        });
    }
};

// ==========================================
// GET TEACHER'S HOMEWORK
// GET /api/academics/school/:schoolId/homework/teacher/:teacherId
// ==========================================
const getTeacherHomework = async (req, res) => {
    try {
        const { schoolId, teacherId } = req.params;
        const { status, classId } = req.query;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { Homework, Subject, Class } = getModels(schoolDbName);

        let query = { schoolId, teacherId };
        if (status) query.status = status;
        if (classId) query.classId = classId;

        const homework = await Homework.find(query).sort({ createdAt: -1 });

        // Enrich with subject and class names
        const subjectIds = [...new Set(homework.map(h => h.subjectId))];
        const classIds = [...new Set(homework.map(h => h.classId))];

        const [subjects, classes] = await Promise.all([
            Subject.find({ subjectId: { $in: subjectIds } }, 'subjectId name'),
            Class.find({ classId: { $in: classIds } }, 'classId name')
        ]);

        const subjectMap = Object.fromEntries(subjects.map(s => [s.subjectId, s.name]));
        const classMap = Object.fromEntries(classes.map(c => [c.classId, c.name]));

        const enrichedHomework = homework.map(h => ({
            ...h.toObject(),
            subjectName: subjectMap[h.subjectId] || h.subjectId,
            className: classMap[h.classId] || h.classId
        }));

        res.status(200).json({
            success: true,
            message: "Teacher homework fetched successfully",
            data: enrichedHomework,
            count: enrichedHomework.length
        });
    } catch (error) {
        console.error("Get Teacher Homework Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch teacher homework",
            error: error.message
        });
    }
};

// ==========================================
// GET HOMEWORK BY ID
// GET /api/academics/school/:schoolId/homework/:homeworkId
// ==========================================
const getHomeworkById = async (req, res) => {
    try {
        const { schoolId, homeworkId } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { Homework, Subject, Teacher, Class } = getModels(schoolDbName);

        const homework = await Homework.findOne({ schoolId, homeworkId });

        if (!homework) {
            return res.status(404).json({
                success: false,
                message: "Homework not found"
            });
        }

        // Enrich with names
        const [subject, teacher, classData] = await Promise.all([
            Subject.findOne({ subjectId: homework.subjectId }, 'name'),
            Teacher.findOne({ teacherId: homework.teacherId }, 'firstName lastName'),
            Class.findOne({ classId: homework.classId }, 'name')
        ]);

        const enrichedHomework = {
            ...homework.toObject(),
            subjectName: subject?.name || homework.subjectId,
            teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Teacher',
            className: classData?.name || homework.classId
        };

        res.status(200).json({
            success: true,
            data: enrichedHomework
        });
    } catch (error) {
        console.error("Get Homework By ID Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch homework",
            error: error.message
        });
    }
};

// ==========================================
// UPDATE HOMEWORK
// PUT /api/academics/school/:schoolId/homework/:homeworkId
// ==========================================
const updateHomework = async (req, res) => {
    try {
        const { schoolId, homeworkId } = req.params;
        const { userId, teacherId, role } = req.user;
        const updates = req.body;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { Homework } = getModels(schoolDbName);

        const homework = await Homework.findOne({ schoolId, homeworkId });

        if (!homework) {
            return res.status(404).json({
                success: false,
                message: "Homework not found"
            });
        }

        // Only creator or admin can update
        const actualTeacherId = teacherId || userId;
        if (role !== 'sch_admin' && homework.teacherId !== actualTeacherId) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to update this homework"
            });
        }

        // Update allowed fields
        const allowedUpdates = ['title', 'description', 'attachmentUrl', 'referenceLinks', 'attachments', 'dueDate', 'status'];
        allowedUpdates.forEach(field => {
            if (updates[field] !== undefined) {
                if (field === 'dueDate') {
                    homework[field] = new Date(updates[field]);
                } else {
                    homework[field] = updates[field];
                }
            }
        });

        await homework.save();

        const response = res.status(200).json({
            success: true,
            message: "Homework updated successfully",
            data: homework
        });

        // Integrated Logging
        logActivity({
            schoolDb: getSchoolDbConnection(schoolDbName),
            schoolId,
            actor: req.user,
            action: "UPDATE",
            entity: "Homework",
            entityId: homeworkId,
            entityLabel: homework.title,
            description: `Updated homework: ${homework.title}`,
            metadata: { updates }
        });

        return response;
    } catch (error) {
        console.error("Update Homework Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update homework",
            error: error.message
        });
    }
};

// ==========================================
// DELETE HOMEWORK
// DELETE /api/academics/school/:schoolId/homework/:homeworkId
// ==========================================
const deleteHomework = async (req, res) => {
    try {
        const { schoolId, homeworkId } = req.params;
        const { userId, teacherId, role } = req.user;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { Homework } = getModels(schoolDbName);

        const homework = await Homework.findOne({ schoolId, homeworkId });

        if (!homework) {
            return res.status(404).json({
                success: false,
                message: "Homework not found"
            });
        }

        // Only creator or admin can delete
        const actualTeacherId = teacherId || userId;
        if (role !== 'sch_admin' && homework.teacherId !== actualTeacherId) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to delete this homework"
            });
        }

        homework.status = 'cancelled';
        await homework.save();

        const response = res.status(200).json({
            success: true,
            message: "Homework deleted successfully"
        });

        // Integrated Logging
        logActivity({
            schoolDb: getSchoolDbConnection(schoolDbName),
            schoolId,
            actor: req.user,
            action: "DELETE",
            entity: "Homework",
            entityId: homeworkId,
            entityLabel: homework.title,
            description: `Cancelled homework: ${homework.title}`
        });

        return response;
    } catch (error) {
        console.error("Delete Homework Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete homework",
            error: error.message
        });
    }
};

module.exports = {
    createHomework,
    getHomeworkByClass,
    getHomeworkByStudent,
    getUpcomingHomework,
    getTeacherHomework,
    getHomeworkById,
    updateHomework,
    deleteHomework,
};
