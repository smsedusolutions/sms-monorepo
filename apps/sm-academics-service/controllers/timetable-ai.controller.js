const mongoose = require("mongoose");
const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");
const { TimetableConfigSchema: timetableConfigSchema, TeacherSchema: teacherSchema, ClassSchema: classSchema, SubjectSchema: subjectSchema, TimetableAIDraftSchema: timetableAIDraftSchema, TimetableEntrySchema: timetableEntrySchema } = require("@sms/shared");
const TimetableAIService = require("../services/timetable-ai.service");

// Get models for a specific school database
const getModels = (schoolDbName) => {
    const schoolDb = getSchoolDbConnection(schoolDbName);
    return {
        TimetableConfig: schoolDb.models.TimetableConfig || schoolDb.model("TimetableConfig", timetableConfigSchema),
        Teacher: schoolDb.models.Teacher || schoolDb.model("Teacher", teacherSchema),
        Class: schoolDb.models.Class || schoolDb.model("Class", classSchema),
        Subject: schoolDb.models.Subject || schoolDb.model("Subject", subjectSchema),
        TimetableAIDraft: schoolDb.models.TimetableAIDraft || schoolDb.model("TimetableAIDraft", timetableAIDraftSchema),
        TimetableEntry: schoolDb.models.TimetableEntry || schoolDb.model("TimetableEntry", timetableEntrySchema),
    };
};

/**
 * Validates the generation rules against school resources (teachers & periods)
 */
const validateAITimetable = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { rules, options } = req.body;

        if (!rules || !Array.isArray(rules)) {
            return res.status(400).json({ success: false, message: "Rules array is required" });
        }

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { TimetableConfig, Teacher, Class, Subject } = models;

        const config = await TimetableConfig.findOne({ schoolId, isActive: true });
        if (!config) {
            return res.status(400).json({ success: false, message: "No active timetable configuration found." });
        }

        const teachers = await Teacher.find({ schoolId, status: "active" });
        const classes = await Class.find({ schoolId, status: "active" });
        const subjects = await Subject.find({ schoolId, status: "active" });

        const validation = TimetableAIService.validateConstraints(config, classes, teachers, rules, subjects, options);

        return res.status(200).json({
            success: true,
            data: validation
        });
    } catch (error) {
        console.error("Error validating AI timetable:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to validate AI timetable constraints"
        });
    }
};

/**
 * Generates an automated draft timetable
 */
const generateAITimetable = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { rules, options } = req.body;

        if (!rules || !Array.isArray(rules)) {
            return res.status(400).json({ success: false, message: "Rules array is required" });
        }

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { TimetableConfig, Teacher, Class, Subject, TimetableAIDraft } = models;

        const config = await TimetableConfig.findOne({ schoolId, isActive: true });
        if (!config) {
            return res.status(400).json({ success: false, message: "No active timetable configuration found." });
        }

        const teachers = await Teacher.find({ schoolId, status: "active" });
        const classes = await Class.find({ schoolId, status: "active" });
        const subjects = await Subject.find({ schoolId, status: "active" });

        // Run pre-validation
        const validation = TimetableAIService.validateConstraints(config, classes, teachers, rules, subjects, options);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: "Cannot generate timetable due to constraint violations.",
                errors: validation.errors
            });
        }

        // Generate the draft schedule array
        const schedule = TimetableAIService.generateTimetable(config, classes, teachers, subjects, rules, options);

        // Save to TimetableAIDraft collection with versioning
        const lastDraft = await TimetableAIDraft.findOne({ schoolId }).sort({ version: -1 });
        const newVersion = lastDraft && lastDraft.version ? lastDraft.version + 1 : 1;

        // Archive existing drafts
        await TimetableAIDraft.updateMany({ schoolId, status: "draft" }, { $set: { status: "archived" } });

        // Drop the old unique index on schoolId if it exists to allow migration to compound index
        try {
            await TimetableAIDraft.collection.dropIndex('schoolId_1');
        } catch (error) {
            // Ignore if index doesn't exist
        }

        const draft = await TimetableAIDraft.create({
            schoolId,
            status: "draft",
            version: newVersion,
            rules,
            entries: schedule
        });

        return res.status(200).json({
            success: true,
            data: draft,
            message: `Successfully generated and saved ${schedule.length} timetable draft entries.`
        });
    } catch (error) {
        console.error("Error generating AI timetable:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to generate AI timetable"
        });
    }
};

/**
 * Gets a specific AI draft for the school (either the active 'draft' or a specific version)
 */
const getAIDraft = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { version } = req.query;
        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { TimetableAIDraft, Teacher, Subject } = models;

        let query = { schoolId };
        if (version) {
            query.version = parseInt(version, 10);
        } else {
            query.status = "draft";
        }

        const draft = await TimetableAIDraft.findOne(query);
        if (!draft) {
            return res.status(200).json({ success: true, data: null });
        }

        const draftObj = draft.toObject();

        if (draftObj.entries && Array.isArray(draftObj.entries) && draftObj.entries.length > 0) {
            const teachers = await Teacher.find({ schoolId });
            const subjects = await Subject.find({ schoolId });

            const teacherMap = new Map();
            teachers.forEach(t => {
                const fullName = `${t.firstName || ''} ${t.lastName || ''}`.trim();
                const name = fullName || t.name || t.teacherId || t._id.toString();
                const tObj = {
                    teacherId: t.teacherId || t._id.toString(),
                    name,
                    firstName: t.firstName || '',
                    lastName: t.lastName || ''
                };

                if (t.teacherId) {
                    teacherMap.set(String(t.teacherId).trim(), tObj);
                    teacherMap.set(String(t.teacherId).trim().toLowerCase(), tObj);
                }
                if (t._id) {
                    teacherMap.set(String(t._id).trim(), tObj);
                    teacherMap.set(String(t._id).trim().toLowerCase(), tObj);
                }
                if (t.userId) {
                    teacherMap.set(String(t.userId).trim(), tObj);
                    teacherMap.set(String(t.userId).trim().toLowerCase(), tObj);
                }
            });

            const subjectMap = new Map();
            subjects.forEach(s => {
                const info = { subjectId: s.subjectId || s._id.toString(), name: s.name, code: s.code };
                if (s.subjectId) {
                    subjectMap.set(String(s.subjectId).trim(), info);
                    subjectMap.set(String(s.subjectId).trim().toLowerCase(), info);
                }
                if (s._id) {
                    subjectMap.set(String(s._id).trim(), info);
                    subjectMap.set(String(s._id).trim().toLowerCase(), info);
                }
            });

            draftObj.entries = draftObj.entries.map(e => {
                const rawTId = String(e.teacherId || "").trim();
                let tInfo = teacherMap.get(rawTId) || teacherMap.get(rawTId.toLowerCase());

                if (!tInfo && rawTId) {
                    const found = teachers.find(t => {
                        const ids = [t.teacherId, t._id, t.id, t.userId, t.employeeId, t.staffId, t.code]
                            .filter(Boolean)
                            .map(id => String(id).trim().toLowerCase());
                        return ids.includes(rawTId.toLowerCase());
                    });
                    if (found) {
                        const fn = `${found.firstName || ''} ${found.lastName || ''}`.trim();
                        tInfo = {
                            teacherId: found.teacherId || found._id.toString(),
                            name: fn || found.name || rawTId,
                            firstName: found.firstName || '',
                            lastName: found.lastName || ''
                        };
                    } else {
                        tInfo = { teacherId: rawTId, name: rawTId, firstName: '', lastName: '' };
                    }
                }

                const rawSId = String(e.subjectId || "").trim();
                let sInfo = subjectMap.get(rawSId) || subjectMap.get(rawSId.toLowerCase());
                if (!sInfo && rawSId) {
                    const foundS = subjects.find(s => {
                        const ids = [s.subjectId, s._id, s.id, s.code]
                            .filter(Boolean)
                            .map(id => String(id).trim().toLowerCase());
                        return ids.includes(rawSId.toLowerCase());
                    });
                    if (foundS) {
                        sInfo = { subjectId: foundS.subjectId || foundS._id.toString(), name: foundS.name, code: foundS.code };
                    } else {
                        sInfo = { subjectId: rawSId, name: rawSId, code: '' };
                    }
                }

                return {
                    ...e,
                    teacher: tInfo,
                    subject: sInfo
                };
            });
        }

        return res.status(200).json({
            success: true,
            data: draftObj
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Lists all available AI draft versions for the school
 */
const getAIDraftVersions = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { TimetableAIDraft } = models;

        const versions = await TimetableAIDraft.find({ schoolId })
            .select("version status createdAt")
            .sort({ version: -1 });

        return res.status(200).json({
            success: true,
            data: versions
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Deletes a specific draft version
 */
const deleteAIDraftVersion = async (req, res) => {
    try {
        const { schoolId, version } = req.params;
        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { TimetableAIDraft } = models;

        await TimetableAIDraft.deleteOne({ schoolId, version: parseInt(version, 10) });

        return res.status(200).json({
            success: true,
            message: `Draft version ${version} deleted successfully.`
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Publishes the AI draft to the live timetable
 */
const publishAIDraft = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { TimetableAIDraft, TimetableEntry } = models;

        const draft = await TimetableAIDraft.findOne({ schoolId, status: "draft" });
        if (!draft || !draft.entries || draft.entries.length === 0) {
            return res.status(400).json({ success: false, message: "No active draft found to publish." });
        }

        // Clear existing entries for the classes being published
        const classSections = [...new Set(draft.entries.map(e => `${e.classId}-${e.sectionId}`))];
        const deleteConditions = classSections.map(cs => {
            const [classId, sectionId] = cs.split('-');
            return { schoolId, classId, sectionId };
        });
        if (deleteConditions.length > 0) {
            await TimetableEntry.deleteMany({ $or: deleteConditions });
        }

        const inserted = await TimetableEntry.insertMany(
            draft.entries.map(e => ({
                schoolId,
                classId: e.classId,
                sectionId: e.sectionId,
                subjectId: e.subjectId,
                teacherId: e.teacherId,
                dayOfWeek: e.dayOfWeek,
                periodNumber: e.periodNumber,
                entryId: `AI_GEN_${new Date().getTime()}_${Math.random().toString(36).substring(7)}`,
                type: 'regular'
            }))
        );

        // Mark draft as published
        draft.status = "published";
        await draft.save();

        return res.status(200).json({
            success: true,
            message: `Successfully published ${inserted.length} entries to live timetable.`
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Updates or adds a single entry in the draft
 */
const updateAIDraftEntry = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { classId, sectionId, dayOfWeek, periodNumber, subjectId, teacherId } = req.body;

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { TimetableAIDraft } = models;

        const draft = await TimetableAIDraft.findOne({ schoolId, status: "draft" });
        if (!draft) return res.status(404).json({ success: false, message: "Draft not found" });

        // Find existing index
        const index = draft.entries.findIndex(e =>
            e.classId === classId &&
            e.sectionId === sectionId &&
            e.dayOfWeek === dayOfWeek &&
            e.periodNumber === periodNumber
        );

        if (index > -1) {
            draft.entries[index].subjectId = subjectId;
            draft.entries[index].teacherId = teacherId;
        } else {
            draft.entries.push({ classId, sectionId, dayOfWeek, periodNumber, subjectId, teacherId });
        }

        await draft.save();
        return res.status(200).json({ success: true, message: "Draft entry updated" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Deletes a single entry from the draft
 */
const deleteAIDraftEntry = async (req, res) => {
    try {
        const { schoolId, classId, sectionId, dayOfWeek, periodNumber } = req.params;
        const periodNum = parseInt(periodNumber, 10);

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { TimetableAIDraft } = models;

        const draft = await TimetableAIDraft.findOne({ schoolId, status: "draft" });
        if (!draft) return res.status(404).json({ success: false, message: "Draft not found" });

        draft.entries = draft.entries.filter(e =>
            !(e.classId === classId && e.sectionId === sectionId && e.dayOfWeek === dayOfWeek && e.periodNumber === periodNum)
        );

        await draft.save();
        return res.status(200).json({ success: true, message: "Draft entry deleted" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    validateAITimetable,
    generateAITimetable,
    getAIDraft,
    publishAIDraft,
    updateAIDraftEntry,
    deleteAIDraftEntry,
    getAIDraftVersions,
    deleteAIDraftVersion,
    suggestRules,
};

/**
 * Suggests periodsPerWeek, maxPeriodsPerDay, and morningPriority for each subject
 * based on a priority-ordered list of subjectIds and the active timetable config.
 *
 * 4-Tier formula:
 *   Tier 1 (Core)     — top 15%:  high periods, morningPriority=true
 *   Tier 2 (Major)    — 15–35%:   medium-high, morningPriority=true
 *   Tier 3 (Standard) — 35–65%:   medium, morningPriority=false
 *   Tier 4 (Minor)    — 65–100%:  low=2, morningPriority=false
 */
async function suggestRules(req, res) {
    try {
        const { schoolId } = req.params;
        const { subjectIds } = req.body;

        if (!subjectIds || !Array.isArray(subjectIds) || subjectIds.length === 0) {
            return res.status(400).json({ success: false, message: "subjectIds array is required" });
        }

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { TimetableConfig } = models;

        const config = await TimetableConfig.findOne({ schoolId, isActive: true });
        if (!config) {
            return res.status(400).json({ success: false, message: "No active timetable configuration found." });
        }

        // Derive working days count and average regular periods per day from config
        const workingDaysCount = config.workingDays ? config.workingDays.length : 5;

        const regularPeriods = config.periods
            ? config.periods.filter(p => p.type === 'regular' || !p.type)
            : [];
        const regularPeriodsPerDay = regularPeriods.length > 0 ? regularPeriods.length : 6;

        // Total regular weekly slots available per section
        const totalWeeklySlots = workingDaysCount * regularPeriodsPerDay;

        const n = subjectIds.length;

        // Tier boundaries (indices into the priority-ordered array)
        const tier1End = Math.max(1, Math.ceil(n * 0.15));      // Core
        const tier2End = Math.max(tier1End + 1, Math.ceil(n * 0.35)); // Major
        const tier3End = Math.max(tier2End + 1, Math.ceil(n * 0.65)); // Standard
        // Rest = Tier 4 (Minor)

        // Per-tier slot budget (percentage of total weekly slots)
        const tier1Budget = Math.floor(totalWeeklySlots * 0.22);
        const tier2Budget = Math.floor(totalWeeklySlots * 0.18);
        const tier3Budget = Math.floor(totalWeeklySlots * 0.13);

        const tier1Count = tier1End;
        const tier2Count = tier2End - tier1End;
        const tier3Count = tier3End - tier2End;

        // Periods per subject in each tier (minimum 1)
        const tier1PpW = Math.max(1, Math.min(workingDaysCount, Math.round(tier1Budget / tier1Count)));
        const tier2PpW = Math.max(1, Math.min(workingDaysCount, Math.round(tier2Budget / tier2Count)));
        const tier3PpW = Math.max(1, Math.min(workingDaysCount - 1, Math.round(tier3Budget / Math.max(1, tier3Count))));
        const tier4PpW = 2;

        const suggestions = {};

        subjectIds.forEach((subjectId, index) => {
            let periodsPerWeek, morningPriority;

            if (index < tier1End) {
                // Core
                periodsPerWeek = tier1PpW;
                morningPriority = true;
            } else if (index < tier2End) {
                // Major
                periodsPerWeek = tier2PpW;
                morningPriority = true;
            } else if (index < tier3End) {
                // Standard
                periodsPerWeek = tier3PpW;
                morningPriority = false;
            } else {
                // Minor
                periodsPerWeek = tier4PpW;
                morningPriority = false;
            }

            // maxPeriodsPerDay = distribute periods as evenly as possible across working days
            const maxPeriodsPerDay = Math.max(1, Math.ceil(periodsPerWeek / workingDaysCount));

            suggestions[subjectId] = {
                periodsPerWeek,
                maxPeriodsPerDay,
                morningPriority,
                tier: index < tier1End ? 1 : index < tier2End ? 2 : index < tier3End ? 3 : 4,
                tierLabel: index < tier1End ? 'Core' : index < tier2End ? 'Major' : index < tier3End ? 'Standard' : 'Minor',
            };
        });

        return res.status(200).json({
            success: true,
            data: {
                suggestions,
                meta: {
                    workingDaysCount,
                    regularPeriodsPerDay,
                    totalWeeklySlots,
                    tiers: {
                        core: { range: [0, tier1End - 1], periodsPerWeek: tier1PpW },
                        major: { range: [tier1End, tier2End - 1], periodsPerWeek: tier2PpW },
                        standard: { range: [tier2End, tier3End - 1], periodsPerWeek: tier3PpW },
                        minor: { range: [tier3End, n - 1], periodsPerWeek: tier4PpW },
                    }
                }
            }
        });
    } catch (error) {
        console.error("Error generating rule suggestions:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to generate rule suggestions"
        });
    }
}
