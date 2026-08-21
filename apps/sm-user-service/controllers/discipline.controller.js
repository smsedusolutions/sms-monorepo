const { getSchoolDbConnection } = require('../configs/db');
const { getSchoolDbName } = require('../utils/schoolDbHelper');
const { DisciplineSchema } = require('@sms/shared/models');

const getModels = (schoolDbName) => {
    const conn = getSchoolDbConnection(schoolDbName);
    return {
        Discipline: conn.models.Discipline || conn.model('Discipline', DisciplineSchema),
    };
};

// ==========================================
// 1. GET ALL DISCIPLINE INCIDENTS (with filter/search)
// GET /api/school/:schoolId/discipline
// ==========================================
const getDisciplineRecords = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { classId, search } = req.query;

        const dbName = await getSchoolDbName(schoolId);
        const { Discipline } = getModels(dbName);

        const filter = { schoolId };
        if (classId) filter.classId = classId;
        if (search) {
            filter.$or = [
                { studentName: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        const incidents = await Discipline.find(filter).sort({ incidentDate: -1 }).lean();
        res.status(200).json({ success: true, data: incidents });
    } catch (error) {
        console.error('Get Discipline Records Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// 2. LOG A NEW DISCIPLINE INCIDENT
// POST /api/school/:schoolId/discipline
// ==========================================
const logDisciplineIncident = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { studentId, studentName, classId, className, incidentDate, category, description, severity, actionTaken, actionDescription, parentNotified, students } = req.body;

        const dbName = await getSchoolDbName(schoolId);
        const { Discipline } = getModels(dbName);

        // Support multiple students in one incident
        if (Array.isArray(students) && students.length > 0) {
            const created = [];
            for (const st of students) {
                const inc = new Discipline({
                    schoolId,
                    studentId: st.studentId || null,
                    studentName: st.studentName || `${st.firstName || ''} ${st.lastName || ''}`.trim(),
                    classId: st.classId || classId || null,
                    className: st.className || className || null,
                    incidentDate: incidentDate ? new Date(incidentDate) : new Date(),
                    category,
                    description,
                    severity: severity || 'low',
                    actionTaken: actionTaken || null,
                    actionDescription: actionDescription || null,
                    parentNotified: parentNotified === true || parentNotified === 'yes',
                    reportedBy: req.user?.userId || req.user?.adminId || null,
                });
                await inc.save();
                created.push(inc);
            }
            return res.status(201).json({ success: true, message: `Discipline incident logged for ${created.length} students`, data: created });
        }

        const incident = new Discipline({
            schoolId,
            studentId: studentId || null,
            studentName,
            classId: classId || null,
            className: className || null,
            incidentDate: incidentDate ? new Date(incidentDate) : new Date(),
            category,
            description,
            severity: severity || 'low',
            actionTaken: actionTaken || null,
            actionDescription: actionDescription || null,
            parentNotified: parentNotified === true || parentNotified === 'yes',
            reportedBy: req.user?.userId || req.user?.adminId || null,
        });

        await incident.save();
        res.status(201).json({ success: true, message: 'Discipline incident logged successfully', data: incident });
    } catch (error) {
        console.error('Log Discipline Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getDisciplineRecords,
    logDisciplineIncident,
};
