const mongoose = require("mongoose");
const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");
const {
    TimetableEntrySchema: timetableEntrySchema,
    TimetableConfigSchema: timetableConfigSchema,
    TeacherSchema: teacherSchema,
    ClassSchema: classSchema,
    SubjectSchema: subjectSchema,
    RoomSchema: roomSchema,
} = require("@sms/shared");
const { logActivity } = require("@sms/shared/utils");

// Get models for a specific school database
const getModels = (schoolDbName) => {
    const schoolDb = getSchoolDbConnection(schoolDbName);
    return {
        TimetableEntry: schoolDb.model("TimetableEntry", timetableEntrySchema),
        TimetableConfig: schoolDb.model("TimetableConfig", timetableConfigSchema),
        Teacher: schoolDb.model("Teacher", teacherSchema),
        Class: schoolDb.model("Class", classSchema),
        Subject: schoolDb.model("Subject", subjectSchema),
        Room: schoolDb.model("Room", roomSchema),
    };
};

// Helper function to generate entryId
const generateEntryId = async (TimetableEntryModel) => {
    const lastEntry = await TimetableEntryModel.findOne()
        .sort({ createdAt: -1 })
        .select("entryId");

    let nextNumber = 1;
    if (lastEntry && lastEntry.entryId) {
        const numPart = parseInt(lastEntry.entryId.replace("TTE", ""), 10);
        if (!isNaN(numPart)) {
            nextNumber = numPart + 1;
        }
    }

    return `TTE${String(nextNumber).padStart(5, "0")}`;
};

/**
 * Helper to generate a mapping from absolute period number to instructional display number
 */
const getDisplayPeriodMap = (config) => {
    if (!config || !config.periods) return new Map();

    const instructionalPeriods = config.periods
        .filter(p => !["break", "lunch", "assembly"].includes(p.type))
        .sort((a, b) => a.periodNumber - b.periodNumber);

    const periodMap = new Map();
    instructionalPeriods.forEach((p, index) => {
        periodMap.set(p.periodNumber, index + 1);
    });

    return periodMap;
};

// ==========================================
// CONFLICT DETECTION FUNCTIONS
// ==========================================

/**
 * Check if a teacher is already assigned at the given day/period
 */
const checkTeacherConflict = async (TimetableEntry, schoolId, teacherId, dayOfWeek, periodNumber, excludeEntryId = null) => {
    const query = {
        schoolId,
        teacherId,
        dayOfWeek,
        periodNumber,
        isActive: true,
    };

    if (excludeEntryId) {
        query.entryId = { $ne: excludeEntryId };
    }

    const conflict = await TimetableEntry.findOne(query);
    return conflict;
};

/**
 * Check if a room is already booked at the given day/period
 */
const checkRoomConflict = async (TimetableEntry, schoolId, roomId, dayOfWeek, periodNumber, excludeEntryId = null) => {
    if (!roomId) return null; // No room specified, no conflict

    const query = {
        schoolId,
        roomId,
        dayOfWeek,
        periodNumber,
        isActive: true,
    };

    if (excludeEntryId) {
        query.entryId = { $ne: excludeEntryId };
    }

    const conflict = await TimetableEntry.findOne(query);
    return conflict;
};

/**
 * Check if a class/section already has a subject at the given day/period
 */
const checkClassConflict = async (TimetableEntry, schoolId, classId, sectionId, dayOfWeek, periodNumber, excludeEntryId = null) => {
    const query = {
        schoolId,
        classId,
        sectionId,
        dayOfWeek,
        periodNumber,
        isActive: true,
    };

    if (excludeEntryId) {
        query.entryId = { $ne: excludeEntryId };
    }

    const conflict = await TimetableEntry.findOne(query);
    return conflict;
};

/**
 * Validate entry for all types of conflicts
 */
const validateEntry = async (models, entryData, excludeEntryId = null) => {
    const { TimetableEntry, Teacher, Class, Subject } = models;
    const { schoolId, teacherId, classId, sectionId, subjectId, dayOfWeek, periodNumber, roomId } = entryData;
    const conflicts = [];

    // Check teacher conflict
    const teacherConflict = await checkTeacherConflict(
        TimetableEntry, schoolId, teacherId, dayOfWeek, periodNumber, excludeEntryId
    );
    if (teacherConflict) {
        const teacher = await Teacher.findOne({ teacherId });
        const conflictClass = await Class.findOne({ classId: teacherConflict.classId });
        const conflictSubject = await Subject.findOne({ subjectId: teacherConflict.subjectId });
        conflicts.push({
            type: "teacher",
            message: `Teacher "${teacher?.firstName || teacherId}" is already assigned to ${conflictClass?.name || "another class"} (${conflictSubject?.name || "subject"}) at this time`,
            conflictingEntry: teacherConflict,
        });
    }

    // Check room conflict
    const roomConflict = await checkRoomConflict(
        TimetableEntry, schoolId, roomId, dayOfWeek, periodNumber, excludeEntryId
    );
    if (roomConflict) {
        const conflictClass = await Class.findOne({ classId: roomConflict.classId });
        conflicts.push({
            type: "room",
            message: `Room is already booked by ${conflictClass?.name || "another class"} at this time`,
            conflictingEntry: roomConflict,
        });
    }

    // Check class/section conflict
    const classConflict = await checkClassConflict(
        TimetableEntry, schoolId, classId, sectionId, dayOfWeek, periodNumber, excludeEntryId
    );
    if (classConflict) {
        const conflictSubject = await Subject.findOne({ subjectId: classConflict.subjectId });
        conflicts.push({
            type: "class",
            message: `This class/section already has ${conflictSubject?.name || "another subject"} at this time`,
            conflictingEntry: classConflict,
        });
    }

    return conflicts;
};

// ==========================================
// CRUD OPERATIONS
// ==========================================

// Create a new timetable entry
const createEntry = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const {
            classId, sectionId, subjectId, teacherId,
            dayOfWeek, periodNumber, shiftId, roomId,
            periodType, effectiveFrom, effectiveTo, notes
        } = req.body;

        // Validate required fields
        if (!classId || !sectionId || !subjectId || !teacherId || !dayOfWeek || periodNumber === undefined) {
            return res.status(400).json({
                success: false,
                message: "Class, section, subject, teacher, day, and period are required",
            });
        }

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { TimetableEntry } = models;

        // Check for conflicts
        const conflicts = await validateEntry(models, {
            schoolId, teacherId, classId, sectionId, subjectId, dayOfWeek, periodNumber, roomId
        });

        if (conflicts.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Schedule conflicts detected",
                conflicts,
            });
        }

        const entryId = await generateEntryId(TimetableEntry);

        const newEntry = new TimetableEntry({
            entryId,
            schoolId,
            classId,
            sectionId,
            subjectId,
            teacherId,
            dayOfWeek,
            periodNumber,
            shiftId: shiftId || null,
            roomId: roomId || null,
            periodType: periodType || "regular",
            effectiveFrom: effectiveFrom || null,
            effectiveTo: effectiveTo || null,
            notes: notes || "",
            isActive: true,
            status: "active",
        });

        await newEntry.save();

        const response = res.status(201).json({
            success: true,
            message: "Timetable entry created successfully",
            data: newEntry,
        });

        // Integrated Logging
        logActivity({
            schoolDb: getSchoolDbConnection(schoolDbName),
            schoolId,
            actor: req.user,
            action: "CREATE",
            entity: "TimetableEntry",
            entityId: newEntry.entryId,
            entityLabel: `${newEntry.dayOfWeek} - P${newEntry.periodNumber}`,
            description: `Scheduled ${subjectData?.name || subjectId} for ${classData?.name || classId} on ${newEntry.dayOfWeek} Period ${newEntry.periodNumber}`,
            metadata: { entryId: newEntry.entryId, classId, subjectId }
        });

        return response;
    } catch (error) {
        console.error("Error creating timetable entry:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to create timetable entry",
        });
    }
};

// Bulk create entries
const bulkCreateEntries = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { entries } = req.body;

        if (!entries || !Array.isArray(entries) || entries.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Entries array is required",
            });
        }

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { TimetableEntry } = models;

        const results = {
            created: [],
            failed: [],
        };

        for (const entry of entries) {
            try {
                // Check for conflicts
                const conflicts = await validateEntry(models, {
                    schoolId,
                    ...entry
                });

                if (conflicts.length > 0) {
                    results.failed.push({
                        entry,
                        reason: "Conflicts detected",
                        conflicts,
                    });
                    continue;
                }

                const entryId = await generateEntryId(TimetableEntry);

                const newEntry = new TimetableEntry({
                    entryId,
                    schoolId,
                    ...entry,
                    isActive: true,
                    status: "active",
                });

                await newEntry.save();
                results.created.push(newEntry);
            } catch (err) {
                results.failed.push({
                    entry,
                    reason: err.message,
                });
            }
        }

        res.status(200).json({
            success: true,
            message: `Created ${results.created.length} entries, ${results.failed.length} failed`,
            data: results,
        });
    } catch (error) {
        console.error("Error bulk creating entries:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to bulk create entries",
        });
    }
};

// Get timetable for a class/section
const getClassTimetable = async (req, res) => {
    try {
        const { schoolId, classId, sectionId } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { TimetableEntry, TimetableConfig, Teacher, Subject } = models;

        // Get active config for period structure
        const config = await TimetableConfig.findOne({ schoolId, isActive: true }).lean();
        const periodMap = getDisplayPeriodMap(config);

        // Get all entries for this class/section
        const entries = await TimetableEntry.find({
            schoolId,
            classId,
            sectionId,
            isActive: true,
        }).lean();

        const [teachers, subjects] = await Promise.all([
            Teacher.find({ schoolId }).lean(),
            Subject.find({ schoolId }).lean()
        ]);

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

        const populatedEntries = entries.map((entry) => {
            const rawTId = String(entry.teacherId || "").trim();
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

            const rawSId = String(entry.subjectId || "").trim();
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
                ...entry,
                displayPeriodNumber: periodMap.get(entry.periodNumber) || entry.periodNumber,
                teacher: tInfo,
                subject: sInfo,
            };
        });

        let processedConfig = config ? { ...config } : null;
        if (processedConfig && processedConfig.periods) {
            processedConfig.periods = processedConfig.periods.map(p => ({
                ...p,
                displayPeriodNumber: periodMap.get(p.periodNumber) || p.periodNumber
            }));
        }

        res.status(200).json({
            success: true,
            data: {
                config: processedConfig,
                entries: populatedEntries,
            },
        });
    } catch (error) {
        console.error("Error fetching class timetable:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch timetable",
        });
    }
};

// Get timetable for a teacher
const getTeacherTimetable = async (req, res) => {
    try {
        const { schoolId, teacherId } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { TimetableEntry, TimetableConfig, Class, Subject } = models;

        // Get active config for period structure
        const config = await TimetableConfig.findOne({ schoolId, isActive: true }).lean();
        const periodMap = getDisplayPeriodMap(config);

        // Get all entries for this teacher
        const entries = await TimetableEntry.find({
            schoolId,
            teacherId,
            isActive: true,
        }).lean();

        // Batch fetch classes and subjects using $in
        const classIds = [...new Set(entries.map(e => e.classId).filter(Boolean))];
        const subjectIds = [...new Set(entries.map(e => e.subjectId).filter(Boolean))];

        const [classes, subjects] = await Promise.all([
            Class.find({ schoolId, $or: [{ classId: { $in: classIds } }, { _id: { $in: classIds.filter(id => mongoose.isValidObjectId(id)) } }] }).lean(),
            Subject.find({ schoolId, $or: [{ subjectId: { $in: subjectIds } }, { _id: { $in: subjectIds.filter(id => mongoose.isValidObjectId(id)) } }] }).lean()
        ]);

        const classMap = new Map();
        classes.forEach(c => {
            if (c.classId) classMap.set(c.classId, c);
            if (c._id) classMap.set(c._id.toString(), c);
        });

        const subjectMap = new Map();
        subjects.forEach(s => {
            if (s.subjectId) subjectMap.set(s.subjectId, s);
            if (s._id) subjectMap.set(s._id.toString(), s);
        });

        // Populate class and subject details synchronously in memory
        const populatedEntries = entries.map((entry) => {
            const classDoc = classMap.get(entry.classId);
            const section = classDoc?.sections?.find((s) => (s.sectionId === entry.sectionId || s._id?.toString() === entry.sectionId || s.name === entry.sectionId));
            const subject = subjectMap.get(entry.subjectId);
            return {
                ...entry,
                displayPeriodNumber: periodMap.get(entry.periodNumber) || entry.periodNumber,
                class: classDoc ? { classId: classDoc.classId || classDoc._id?.toString(), name: classDoc.name, section: section?.name || entry.sectionId } : null,
                subject: subject ? { subjectId: subject.subjectId || subject._id?.toString(), name: subject.name, code: subject.code } : null,
            };
        });

        let processedConfig = config ? { ...config } : null;
        if (processedConfig && processedConfig.periods) {
            processedConfig.periods = processedConfig.periods.map(p => ({
                ...p,
                displayPeriodNumber: periodMap.get(p.periodNumber) || p.periodNumber
            }));
        }

        res.status(200).json({
            success: true,
            data: {
                config: processedConfig,
                entries: populatedEntries,
            },
        });
    } catch (error) {
        console.error("Error fetching teacher timetable:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch timetable",
        });
    }
};

// Get all entries for a specific day
const getEntriesByDay = async (req, res) => {
    try {
        const { schoolId, dayOfWeek } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { TimetableEntry, Teacher, Class, Subject } = models;

        const entries = await TimetableEntry.find({
            schoolId,
            dayOfWeek,
            isActive: true,
        }).lean();

        // Batch fetch teachers, classes, and subjects using $in
        const teacherIds = [...new Set(entries.map(e => e.teacherId).filter(Boolean))];
        const classIds = [...new Set(entries.map(e => e.classId).filter(Boolean))];
        const subjectIds = [...new Set(entries.map(e => e.subjectId).filter(Boolean))];

        const [teachers, classes, subjects] = await Promise.all([
            Teacher.find({ schoolId, $or: [{ teacherId: { $in: teacherIds } }, { _id: { $in: teacherIds.filter(id => mongoose.isValidObjectId(id)) } }] }).lean(),
            Class.find({ schoolId, $or: [{ classId: { $in: classIds } }, { _id: { $in: classIds.filter(id => mongoose.isValidObjectId(id)) } }] }).lean(),
            Subject.find({ schoolId, $or: [{ subjectId: { $in: subjectIds } }, { _id: { $in: subjectIds.filter(id => mongoose.isValidObjectId(id)) } }] }).lean()
        ]);

        const teacherMap = new Map();
        teachers.forEach(t => {
            if (t.teacherId) teacherMap.set(t.teacherId, t);
            if (t._id) teacherMap.set(t._id.toString(), t);
        });

        const classMap = new Map();
        classes.forEach(c => {
            if (c.classId) classMap.set(c.classId, c);
            if (c._id) classMap.set(c._id.toString(), c);
        });

        const subjectMap = new Map();
        subjects.forEach(s => {
            if (s.subjectId) subjectMap.set(s.subjectId, s);
            if (s._id) subjectMap.set(s._id.toString(), s);
        });

        // Populate details synchronously in memory
        const populatedEntries = entries.map((entry) => {
            const teacher = teacherMap.get(entry.teacherId);
            const classDoc = classMap.get(entry.classId);
            const subject = subjectMap.get(entry.subjectId);
            return {
                ...entry,
                teacher: teacher ? { teacherId: teacher.teacherId || teacher._id?.toString(), name: `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() } : null,
                class: classDoc ? { classId: classDoc.classId || classDoc._id?.toString(), name: classDoc.name } : null,
                subject: subject ? { subjectId: subject.subjectId || subject._id?.toString(), name: subject.name } : null,
            };
        });

        res.status(200).json({
            success: true,
            data: populatedEntries,
        });
    } catch (error) {
        console.error("Error fetching entries by day:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch entries",
        });
    }
};

// Update timetable entry
const updateEntry = async (req, res) => {
    try {
        const { schoolId, entryId } = req.params;
        const updates = req.body;

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { TimetableEntry } = models;

        // Don't allow updating entryId or schoolId
        delete updates.entryId;
        delete updates.schoolId;

        // Get current entry
        const currentEntry = await TimetableEntry.findOne({ schoolId, entryId });
        if (!currentEntry) {
            return res.status(404).json({
                success: false,
                message: "Timetable entry not found",
            });
        }

        // Merge updates with current entry for conflict checking
        const mergedData = {
            schoolId,
            teacherId: updates.teacherId || currentEntry.teacherId,
            classId: updates.classId || currentEntry.classId,
            sectionId: updates.sectionId || currentEntry.sectionId,
            subjectId: updates.subjectId || currentEntry.subjectId,
            dayOfWeek: updates.dayOfWeek || currentEntry.dayOfWeek,
            periodNumber: updates.periodNumber !== undefined ? updates.periodNumber : currentEntry.periodNumber,
            roomId: updates.roomId !== undefined ? updates.roomId : currentEntry.roomId,
        };

        // Check for conflicts (excluding current entry)
        const conflicts = await validateEntry(models, mergedData, entryId);

        if (conflicts.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Schedule conflicts detected",
                conflicts,
            });
        }

        const entry = await TimetableEntry.findOneAndUpdate(
            { schoolId, entryId },
            updates,
            { new: true, runValidators: true }
        );

        const response = res.status(200).json({
            success: true,
            message: "Timetable entry updated successfully",
            data: entry,
        });

        // Integrated Logging
        logActivity({
            schoolDb: getSchoolDbConnection(schoolDbName),
            schoolId,
            actor: req.user,
            action: "UPDATE",
            entity: "TimetableEntry",
            entityId: entryId,
            entityLabel: `${entry.dayOfWeek} - P${entry.periodNumber}`,
            description: `Updated timetable entry: ${entry.dayOfWeek} Period ${entry.periodNumber}`,
            metadata: { updates }
        });

        return response;
    } catch (error) {
        console.error("Error updating timetable entry:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update timetable entry",
        });
    }
};

// Delete timetable entry (soft delete)
const deleteEntry = async (req, res) => {
    try {
        const { schoolId, entryId } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { TimetableEntry } = models;

        const entry = await TimetableEntry.findOneAndUpdate(
            { schoolId, entryId },
            { isActive: false, status: "inactive" },
            { new: true }
        );

        if (!entry) {
            return res.status(404).json({
                success: false,
                message: "Timetable entry not found",
            });
        }

        const response = res.status(200).json({
            success: true,
            message: "Timetable entry deleted successfully",
        });

        // Integrated Logging
        logActivity({
            schoolDb: getSchoolDbConnection(schoolDbName),
            schoolId,
            actor: req.user,
            action: "DELETE",
            entity: "TimetableEntry",
            entityId: entryId,
            entityLabel: `${entry.dayOfWeek} - P${entry.periodNumber}`,
            description: `Removed timetable entry for ${entry.dayOfWeek} Period ${entry.periodNumber}`
        });

        return response;
    } catch (error) {
        console.error("Error deleting timetable entry:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to delete timetable entry",
        });
    }
};

// Get teacher's free periods
const getTeacherFreePeriods = async (req, res) => {
    try {
        const { schoolId, teacherId } = req.params;
        const { dayOfWeek } = req.query;

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { TimetableEntry, TimetableConfig } = models;

        // Get active config
        const config = await TimetableConfig.findOne({ schoolId, isActive: true }).lean();
        if (!config) {
            return res.status(404).json({
                success: false,
                message: "No active timetable configuration found",
            });
        }

        const workingDays = dayOfWeek ? [dayOfWeek] : config.workingDays;
        const regularPeriods = config.periods.filter((p) => p.type === "regular");

        // Get all teacher's assigned periods
        const assignedEntries = await TimetableEntry.find({
            schoolId,
            teacherId,
            dayOfWeek: { $in: workingDays },
            isActive: true,
        }).lean();

        // Calculate free periods for each day
        const freePeriods = {};
        for (const day of workingDays) {
            const assignedOnDay = assignedEntries
                .filter((e) => e.dayOfWeek === day)
                .map((e) => e.periodNumber);

            freePeriods[day] = regularPeriods
                .filter((p) => !assignedOnDay.includes(p.periodNumber))
                .map((p) => ({
                    periodNumber: p.periodNumber,
                    name: p.name,
                    startTime: p.startTime,
                    endTime: p.endTime,
                }));
        }

        res.status(200).json({
            success: true,
            data: {
                teacherId,
                freePeriods,
            },
        });
    } catch (error) {
        console.error("Error fetching free periods:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch free periods",
        });
    }
};

// Get all free teachers for a specific period
const getFreeTeachersForPeriod = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { dayOfWeek, periodNumber } = req.query;

        if (!dayOfWeek || periodNumber === undefined) {
            return res.status(400).json({
                success: false,
                message: "Day and period number are required",
            });
        }

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { TimetableEntry, Teacher } = models;

        // Get all teachers and assigned entries in parallel
        const [allTeachers, assignedEntries] = await Promise.all([
            Teacher.find({ schoolId, status: "active" }).lean(),
            TimetableEntry.find({
                schoolId,
                dayOfWeek,
                periodNumber: parseInt(periodNumber, 10),
                isActive: true,
            }).lean()
        ]);

        const assignedTeacherIds = new Set(assignedEntries.map((e) => e.teacherId));

        // Filter free teachers
        const freeTeachers = allTeachers
            .filter((t) => !assignedTeacherIds.has(t.teacherId))
            .map((t) => ({
                teacherId: t.teacherId,
                name: `${t.firstName} ${t.lastName}`,
                email: t.email,
            }));

        res.status(200).json({
            success: true,
            data: freeTeachers,
        });
    } catch (error) {
        console.error("Error fetching free teachers:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch free teachers",
        });
    }
};

// Get conflict report for entire school
const getConflictReport = async (req, res) => {
    try {
        const { schoolId } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { TimetableEntry, Teacher, Class, Subject } = models;

        const conflicts = [];

        // Get all active entries
        const allEntries = await TimetableEntry.find({ schoolId, isActive: true });

        // Check for teacher conflicts
        const teacherSlots = {};
        for (const entry of allEntries) {
            const key = `${entry.teacherId}-${entry.dayOfWeek}-${entry.periodNumber}`;
            if (teacherSlots[key]) {
                teacherSlots[key].push(entry);
            } else {
                teacherSlots[key] = [entry];
            }
        }

        for (const [key, entries] of Object.entries(teacherSlots)) {
            if (entries.length > 1) {
                const teacher = await Teacher.findOne({ teacherId: entries[0].teacherId });

                // Enrich each entry with Class, Section and Subject info
                const enrichedEntries = await Promise.all(entries.map(async (e) => {
                    const classDoc = await Class.findOne({ classId: e.classId });
                    const section = classDoc?.sections?.find(s => s.sectionId === e.sectionId);
                    const subject = await Subject.findOne({ subjectId: e.subjectId });
                    return {
                        entryId: e.entryId,
                        teacherId: e.teacherId,
                        teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : e.teacherId,
                        classId: e.classId,
                        className: classDoc?.name || e.classId,
                        sectionId: e.sectionId,
                        sectionName: section?.name || e.sectionId,
                        subjectId: e.subjectId,
                        subjectName: subject?.name || e.subjectId,
                    };
                }));

                conflicts.push({
                    type: "teacher",
                    description: `Teacher "${teacher?.firstName} ${teacher?.lastName}" assigned to multiple classes`,
                    entries: enrichedEntries,
                    dayOfWeek: entries[0].dayOfWeek,
                    periodNumber: entries[0].periodNumber,
                });
            }
        }

        // Check for room conflicts
        const roomSlots = {};
        for (const entry of allEntries) {
            if (entry.roomId) {
                const key = `${entry.roomId}-${entry.dayOfWeek}-${entry.periodNumber}`;
                if (roomSlots[key]) {
                    roomSlots[key].push(entry);
                } else {
                    roomSlots[key] = [entry];
                }
            }
        }

        for (const [key, entries] of Object.entries(roomSlots)) {
            if (entries.length > 1) {
                // Enrich each entry with Class, Section and Subject info
                const enrichedEntries = await Promise.all(entries.map(async (e) => {
                    const classDoc = await Class.findOne({ classId: e.classId });
                    const section = classDoc?.sections?.find(s => s.sectionId === e.sectionId);
                    const subject = await Subject.findOne({ subjectId: e.subjectId });
                    const teacher = await Teacher.findOne({ teacherId: e.teacherId });
                    return {
                        entryId: e.entryId,
                        teacherId: e.teacherId,
                        teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : e.teacherId,
                        classId: e.classId,
                        className: classDoc?.name || e.classId,
                        sectionId: e.sectionId,
                        sectionName: section?.name || e.sectionId,
                        subjectId: e.subjectId,
                        subjectName: subject?.name || e.subjectId,
                    };
                }));

                conflicts.push({
                    type: "room",
                    description: `Room "${entries[0].roomId}" double-booked`,
                    entries: enrichedEntries,
                    dayOfWeek: entries[0].dayOfWeek,
                    periodNumber: entries[0].periodNumber,
                });
            }
        }

        res.status(200).json({
            success: true,
            data: {
                totalConflicts: conflicts.length,
                conflicts,
            },
        });
    } catch (error) {
        console.error("Error generating conflict report:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to generate conflict report",
        });
    }
};

// Get classes that have timetables
const getClassesWithTimetables = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { TimetableEntry, Class } = models;

        const activeEntries = await TimetableEntry.aggregate([
            { $match: { schoolId, isActive: true } },
            { $group: { _id: { classId: "$classId", sectionId: "$sectionId" } } }
        ]);

        const populatedClasses = [];
        for (const entry of activeEntries) {
            const classDoc = await Class.findOne({ classId: entry._id.classId });
            if (classDoc) {
                const section = classDoc.sections?.find((s) => s.sectionId === entry._id.sectionId);
                populatedClasses.push({
                    classId: entry._id.classId,
                    className: classDoc.name,
                    sectionId: entry._id.sectionId,
                    sectionName: section ? section.name : entry._id.sectionId,
                });
            }
        }

        res.status(200).json({
            success: true,
            data: populatedClasses,
        });
    } catch (error) {
        console.error("Error fetching classes with timetables:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch classes with timetables",
        });
    }
};

// Copy timetable from another class
const copyClassTimetable = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { targetClassId, targetSectionId, sourceClassId, sourceSectionId } = req.body;

        if (!targetClassId || !targetSectionId || !sourceClassId || !sourceSectionId) {
            return res.status(400).json({
                success: false,
                message: "Target and Source Class and Section IDs are required",
            });
        }

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { TimetableEntry } = models;

        // Check if target already has a timetable
        const existingTargetEntries = await TimetableEntry.find({
            schoolId, classId: targetClassId, sectionId: targetSectionId, isActive: true
        });

        if (existingTargetEntries.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Target class/section already has a timetable. Cannot copy.",
            });
        }

        // Get source timetable entries
        const sourceEntries = await TimetableEntry.find({
            schoolId, classId: sourceClassId, sectionId: sourceSectionId, isActive: true
        });

        if (sourceEntries.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Source class/section does not have an active timetable to copy.",
            });
        }

        const copiedEntries = [];

        for (const entry of sourceEntries) {
            const entryId = await generateEntryId(TimetableEntry);
            const newEntry = new TimetableEntry({
                entryId,
                schoolId,
                classId: targetClassId,
                sectionId: targetSectionId,
                subjectId: entry.subjectId,
                teacherId: entry.teacherId, // Copy same teacher, might cause conflict but user can resolve
                dayOfWeek: entry.dayOfWeek,
                periodNumber: entry.periodNumber,
                shiftId: entry.shiftId,
                roomId: entry.roomId,
                periodType: entry.periodType,
                effectiveFrom: entry.effectiveFrom,
                effectiveTo: entry.effectiveTo,
                notes: entry.notes,
                isActive: true,
                status: "active",
            });
            await newEntry.save();
            copiedEntries.push(newEntry);
        }

        res.status(200).json({
            success: true,
            message: `Successfully copied \${copiedEntries.length} entries.`,
            data: copiedEntries,
        });
    } catch (error) {
        console.error("Error copying timetable:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to copy timetable",
        });
    }
};

// Delete entire timetable for a class/section
const deleteClassTimetable = async (req, res) => {
    try {
        const { schoolId, classId, sectionId } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { TimetableEntry } = models;

        const result = await TimetableEntry.updateMany(
            { schoolId, classId, sectionId, isActive: true },
            { isActive: false, status: "inactive" }
        );

        res.status(200).json({
            success: true,
            message: `Successfully deleted \${result.modifiedCount} entries for this class timetable.`,
        });
    } catch (error) {
        console.error("Error deleting class timetable:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to delete class timetable",
        });
    }
};

module.exports = {
    createEntry,
    bulkCreateEntries,
    getClassTimetable,
    getTeacherTimetable,
    getEntriesByDay,
    updateEntry,
    deleteEntry,
    getTeacherFreePeriods,
    getFreeTeachersForPeriod,
    getConflictReport,
    getClassesWithTimetables,
    copyClassTimetable,
    deleteClassTimetable,
};
