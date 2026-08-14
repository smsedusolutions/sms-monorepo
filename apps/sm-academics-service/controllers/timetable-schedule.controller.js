const mongoose = require("mongoose");
const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");
const {
  TimetableScheduleSchema: timetableScheduleSchema,
  TimetableAIDraftSchema: timetableAIDraftSchema,
  TimetableEntrySchema: timetableEntrySchema,
} = require("@sms/shared");

const getModels = (schoolDbName) => {
  const schoolDb = getSchoolDbConnection(schoolDbName);
  return {
    TimetableSchedule:
      schoolDb.models.TimetableSchedule ||
      schoolDb.model("TimetableSchedule", timetableScheduleSchema),
    TimetableAIDraft:
      schoolDb.models.TimetableAIDraft ||
      schoolDb.model("TimetableAIDraft", timetableAIDraftSchema),
    TimetableEntry:
      schoolDb.models.TimetableEntry ||
      schoolDb.model("TimetableEntry", timetableEntrySchema),
  };
};

// Helper to deduplicate entries by classId, sectionId, dayOfWeek, periodNumber
const deduplicateEntries = (entries = []) => {
  const map = new Map();
  for (const e of entries) {
    if (!e || !e.classId || !e.sectionId || !e.dayOfWeek || e.periodNumber == null) continue;
    const key = `${e.classId}_${e.sectionId}_${String(e.dayOfWeek).toLowerCase()}_${e.periodNumber}`;
    map.set(key, {
      classId: e.classId,
      sectionId: e.sectionId,
      subjectId: e.subjectId,
      teacherId: e.teacherId,
      dayOfWeek: String(e.dayOfWeek).toLowerCase(),
      periodNumber: Number(e.periodNumber),
    });
  }
  return Array.from(map.values());
};

/**
 * GET /api/academics/school/:schoolId/schedules
 * Supports status query: pending_approval, active, rejected, replaced, disabled, draft, all
 */
exports.getSchedules = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { status, scheduleType } = req.query;

    const schoolDbName = await getSchoolDbName(schoolId);
    const models = getModels(schoolDbName);
    const { TimetableSchedule } = models;

    const query = { schoolId };

    if (status && status !== "all") {
      if (status === "draft") {
        // Legacy: "draft" query fetches pending_approval for principal review
        query.status = { $in: ["draft", "pending_approval"] };
      } else if (status === "pending_approval") {
        query.status = "pending_approval";
      } else {
        query.status = status;
      }
    }

    if (scheduleType) {
      query.scheduleType = scheduleType;
    }

    const schedules = await TimetableSchedule.find(query).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: schedules });
  } catch (error) {
    console.error("Error fetching timetable schedules:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/academics/school/:schoolId/schedules/active
 */
exports.getActiveSchedule = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const schoolDbName = await getSchoolDbName(schoolId);
    const models = getModels(schoolDbName);
    const { TimetableSchedule } = models;

    const activeSchedule = await TimetableSchedule.findOne({
      schoolId,
      status: "active",
    });

    res.status(200).json({ success: true, data: activeSchedule });
  } catch (error) {
    console.error("Error fetching active schedule:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/academics/school/:schoolId/schedules
 */
exports.createSchedule = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { name, scheduleType, validFrom, validTo, status } = req.body;

    const schoolDbName = await getSchoolDbName(schoolId);
    const models = getModels(schoolDbName);
    const { TimetableSchedule } = models;

    const scheduleId = `SCH_${Date.now()}`;
    const newSchedule = new TimetableSchedule({
      scheduleId,
      schoolId,
      name: name || "New School Timetable",
      scheduleType: scheduleType || "regular",
      status: status || "pending_approval",
      validFrom: validFrom || new Date(),
      validTo: validTo || null,
      createdBy: req.user?.userId || "sch_admin",
    });

    const saved = await newSchedule.save();
    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    console.error("Error creating schedule:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/academics/school/:schoolId/schedules/:scheduleId/submit-approval
 */
exports.submitForApproval = async (req, res) => {
  try {
    const { schoolId, scheduleId } = req.params;
    const { source, aiVersion, version, name } = req.body || {};

    const schoolDbName = await getSchoolDbName(schoolId);
    const models = getModels(schoolDbName);
    const { TimetableSchedule, TimetableAIDraft, TimetableEntry } = models;

    let entries = [];
    let scheduleName = name;

    if (source === "ai" || scheduleId.startsWith("AI_DRAFT")) {
      const targetVersion = aiVersion || parseInt(scheduleId.replace("AI_DRAFT_v", ""), 10) || 1;
      const aiDraft = await TimetableAIDraft.findOne({ schoolId, version: targetVersion });
      if (aiDraft && aiDraft.entries) {
        entries = aiDraft.entries;
      }
      if (!scheduleName) scheduleName = `AI Generated Timetable (v${targetVersion})`;
    } else {
      // Manual schedule submission
      const currentEntries = await TimetableEntry.find({ schoolId });
      entries = currentEntries.map(e => ({
        classId: e.classId,
        sectionId: e.sectionId,
        subjectId: e.subjectId,
        teacherId: e.teacherId,
        dayOfWeek: e.dayOfWeek,
        periodNumber: e.periodNumber,
      }));
      if (!scheduleName) scheduleName = "Manual Timetable Schedule";
    }

    const cleanEntries = deduplicateEntries(entries);
    const uniqueScheduleId = `SCH_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const schedule = await TimetableSchedule.create({
      scheduleId: uniqueScheduleId,
      schoolId,
      name: scheduleName,
      source: source || (scheduleId.startsWith("AI_DRAFT") ? "ai" : "manual"),
      version: version || 1,
      aiDraftVersion: aiVersion || null,
      status: "pending_approval",
      entries: cleanEntries,
      validFrom: new Date(),
      createdBy: req.user?.userId || "sch_admin",
    });

    res.status(200).json({
      success: true,
      message: "Timetable schedule version sent for Principal approval!",
      data: schedule,
    });
  } catch (error) {
    console.error("Error submitting timetable for approval:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/academics/school/:schoolId/schedules/:scheduleId
 */
exports.updateSchedule = async (req, res) => {
  try {
    const { schoolId, scheduleId } = req.params;
    const updateData = req.body;

    const schoolDbName = await getSchoolDbName(schoolId);
    const models = getModels(schoolDbName);
    const { TimetableSchedule } = models;

    const updated = await TimetableSchedule.findOneAndUpdate(
      { schoolId, scheduleId },
      { $set: updateData },
      { new: true }
    );

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating schedule:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/academics/school/:schoolId/schedules/:scheduleId/toggle
 */
exports.toggleScheduleStatus = async (req, res) => {
  try {
    const { schoolId, scheduleId } = req.params;
    const { status, rejectionComment, force } = req.body;

    const schoolDbName = await getSchoolDbName(schoolId);
    const models = getModels(schoolDbName);
    const { TimetableSchedule, TimetableEntry } = models;

    const schedule = await TimetableSchedule.findOne({ scheduleId });
    if (!schedule) {
      return res.status(404).json({ success: false, message: "Schedule not found" });
    }

    // ── APPROVE / PUBLISH (set active) ────────────────────────────────────────
    if (status === "active") {
      // Check for an existing live timetable
      const existingActive = await TimetableSchedule.findOne({
        schoolId,
        status: "active",
        scheduleId: { $ne: scheduleId },
      });

      if (existingActive && !force) {
        // Return 409 so frontend shows the override confirmation dialog
        return res.status(409).json({
          success: false,
          code: "TIMETABLE_ACTIVE_EXISTS",
          message: "A timetable is already live. Confirm to override it.",
          existingSchedule: {
            scheduleId: existingActive.scheduleId,
            name: existingActive.name,
            approvedAt: existingActive.approvedAt,
            source: existingActive.source,
            version: existingActive.version,
          },
        });
      }

      // If force === true (or no conflict), handle override
      if (existingActive) {
        await TimetableSchedule.findOneAndUpdate(
          { scheduleId: existingActive.scheduleId },
          {
            $set: {
              status: "replaced",
              replacedByScheduleId: scheduleId,
              replacedAt: new Date(),
            },
          }
        );
      }

      // Set audit fields on the newly approved schedule
      schedule.status = "active";
      schedule.approvedAt = new Date();
      schedule.approvedBy = req.user?.userId || null;
      schedule.replacedVersion = existingActive ? existingActive.scheduleId : null;
      await schedule.save();

      // Sync live TimetableEntry records
      const cleanEntries = deduplicateEntries(schedule.entries || []);

      // 1. Wipe existing live entries for this school to avoid any stale/duplicate index collisions
      await TimetableEntry.deleteMany({ schoolId });

      // 2. Insert clean deduplicated live entries
      if (cleanEntries.length > 0) {
        await TimetableEntry.insertMany(
          cleanEntries.map((e) => ({
            schoolId,
            classId: e.classId,
            sectionId: e.sectionId,
            subjectId: e.subjectId,
            teacherId: e.teacherId,
            dayOfWeek: e.dayOfWeek,
            periodNumber: e.periodNumber,
            entryId: `LIVE_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            type: "regular",
            isActive: true,
            status: "active",
          }))
        );
      }

      return res.status(200).json({ success: true, data: schedule });
    }

    // ── REJECT ────────────────────────────────────────────────────────────────
    if (status === "rejected") {
      if (!rejectionComment || !rejectionComment.trim()) {
        return res.status(400).json({
          success: false,
          message: "A rejection comment is required when rejecting a timetable.",
        });
      }
      schedule.status = "rejected";
      schedule.rejectionComment = rejectionComment.trim();
      schedule.rejectedAt = new Date();
      schedule.rejectedBy = req.user?.userId || null;
      await schedule.save();
      return res.status(200).json({ success: true, data: schedule });
    }

    // ── OTHER STATUS CHANGES (disabled, draft, pending_approval) ─────────────
    if (status) schedule.status = status;
    await schedule.save();

    res.status(200).json({ success: true, data: schedule });
  } catch (error) {
    console.error("Error toggling schedule status:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/academics/school/:schoolId/schedules/:scheduleId
 */
exports.deleteSchedule = async (req, res) => {
  try {
    const { schoolId, scheduleId } = req.params;
    const schoolDbName = await getSchoolDbName(schoolId);
    const models = getModels(schoolDbName);
    const { TimetableSchedule } = models;

    await TimetableSchedule.deleteOne({ schoolId, scheduleId });
    res.status(200).json({ success: true, message: "Schedule deleted successfully" });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
