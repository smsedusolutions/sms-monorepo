const { getSchoolDbConnection } = require('../configs/db');
const { getSchoolDbName } = require('../utils/schoolDbHelper');
const { SyllabusSchema } = require('@sms/shared/models');

const getModels = (schoolDbName) => {
    const conn = getSchoolDbConnection(schoolDbName);
    return {
        Syllabus: conn.models.Syllabus || conn.model('Syllabus', SyllabusSchema),
    };
};

// ==========================================
// 1. GET SYLLABUS OVERVIEW (Admin / Class-Subject Filter)
// GET /api/academics/school/:schoolId/syllabus
// ==========================================
const getSyllabusOverview = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { classId, subjectId } = req.query;

        const dbName = await getSchoolDbName(schoolId);
        const { Syllabus } = getModels(dbName);

        const filter = { schoolId };
        if (classId) filter.classId = classId;
        if (subjectId) filter.subjectId = subjectId;

        const syllabi = await Syllabus.find(filter).lean();
        const allChapters = [];
        syllabi.forEach(s => {
            (s.chapters || []).forEach(ch => {
                allChapters.push({
                    id: ch._id.toString(),
                    title: ch.title,
                    description: ch.description,
                    estimatedHours: ch.estimatedHours,
                    status: ch.status,
                    completedAt: ch.completedAt,
                    subjectName: s.subjectName,
                    className: s.className,
                    classId: s.classId,
                    subjectId: s.subjectId,
                });
            });
        });

        res.status(200).json({ success: true, data: { syllabi, chapters: allChapters } });
    } catch (error) {
        console.error('Get Syllabus Overview Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// 2. GET SYLLABUS FOR TEACHER
// GET /api/academics/school/:schoolId/syllabus/teacher/:teacherId
// ==========================================
const getSyllabusForTeacher = async (req, res) => {
    try {
        const { schoolId, teacherId } = req.params;
        const dbName = await getSchoolDbName(schoolId);
        const { Syllabus } = getModels(dbName);

        const syllabi = await Syllabus.find({
            schoolId,
            $or: [{ teacherId }, { teacherId: null }],
        }).lean();

        const allChapters = [];
        syllabi.forEach(s => {
            (s.chapters || []).forEach(ch => {
                allChapters.push({
                    id: ch._id.toString(),
                    title: ch.title,
                    description: ch.description,
                    status: ch.status,
                    completedAt: ch.completedAt,
                    subjectName: s.subjectName,
                    className: s.className,
                    classId: s.classId,
                    subjectId: s.subjectId,
                });
            });
        });

        res.status(200).json({ success: true, data: { chapters: allChapters, syllabi } });
    } catch (error) {
        console.error('Get Teacher Syllabus Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// 3. UPDATE CHAPTER COMPLETION STATUS
// PATCH /api/academics/school/:schoolId/syllabus/chapters/:chapterId
// ==========================================
const updateChapterStatus = async (req, res) => {
    try {
        const { schoolId, chapterId } = req.params;
        const { status } = req.body;
        const teacherId = req.user?.teacherId || req.user?.userId;

        const dbName = await getSchoolDbName(schoolId);
        const { Syllabus } = getModels(dbName);

        const syllabus = await Syllabus.findOne({
            schoolId,
            'chapters._id': chapterId,
        });

        if (!syllabus) return res.status(404).json({ success: false, message: 'Chapter not found' });

        const chapter = syllabus.chapters.id(chapterId);
        chapter.status = status;
        chapter.completedAt = status === 'completed' ? new Date() : null;
        chapter.completedByTeacherId = status === 'completed' ? teacherId : null;

        await syllabus.save();
        res.status(200).json({ success: true, message: 'Chapter status updated', data: chapter });
    } catch (error) {
        console.error('Update Chapter Status Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getSyllabusOverview,
    getSyllabusForTeacher,
    updateChapterStatus,
};
