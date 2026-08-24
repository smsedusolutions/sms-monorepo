const { getSchoolDbConnection } = require("../configs/db");
const {
  SchoolModel: School,
  SubjectSchema: subjectSchema,
} = require("@sms/shared");
const { logActivity, escapeRegex } = require("@sms/shared/utils"); // SECURITY: ReDoS

/**
 * Get Subject model for a specific school database
 */
const getSubjectModel = (schoolDbName) => {
  const schoolDb = getSchoolDbConnection(schoolDbName);
  return schoolDb.model("Subject", subjectSchema);
};

const { generateNextId } = require("@sms/shared/utils");

/**
 * Helper function to generate subjectId
 * Format: SUB + 5 digit number (SUB00001, SUB00002, ...)
 */
const generateSubjectId = async (SubjectModel) => {
  return generateNextId(SubjectModel, "subjectId", "SUB", 5);
};

/**
 * Get school database name by schoolId
 */
const getSchoolDbName = async (schoolId) => {
  const school = await School.findOne({ schoolId });
  if (!school) {
    return null;
  }
  return school.schoolDbName;
};

// Create a new subject
const createSubject = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { name, code, description, classes, teacherIds, isSubSubject, parentSubjectId } = req.body;

    // Validate required fields
    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: "Subject name and code are required",
      });
    }

    const schoolDbName = await getSchoolDbName(schoolId);
    if (!schoolDbName) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }

    const schoolDb = getSchoolDbConnection(schoolDbName);
    const SubjectModel = getSubjectModel(schoolDbName);

    // Check if subject with same name or code exists
    const existingSubject = await SubjectModel.findOne({
      $or: [{ name }, { code }],
      schoolId,
    });
    if (existingSubject) {
      return res.status(400).json({
        success: false,
        message: "Subject with this name or code already exists",
      });
    }

    // Determine target classes list
    let targetClasses = Array.isArray(classes) ? classes : [];

    // If this is a sub-subject, inherit parent subject's assigned classes if available
    if (isSubSubject && parentSubjectId) {
      const parentSubject = await SubjectModel.findOne({
        $or: [{ subjectId: parentSubjectId }, { _id: parentSubjectId }],
      });
      if (parentSubject && Array.isArray(parentSubject.classes) && parentSubject.classes.length > 0) {
        if (targetClasses.length === 0) {
          targetClasses = [...parentSubject.classes];
        } else {
          targetClasses = Array.from(new Set([...targetClasses, ...parentSubject.classes]));
        }
      }
    }

    // Generate subjectId
    const subjectId = await generateSubjectId(SubjectModel);

    const newSubject = new SubjectModel({
      subjectId,
      schoolId,
      name,
      code: code.toUpperCase(),
      description,
      classes: targetClasses,
      isSubSubject: isSubSubject || false,
      parentSubjectId: parentSubjectId || null,
    });

    const savedSubject = await newSubject.save();

    // Bidirectional sync: Update teachers' subjects array
    if (teacherIds && Array.isArray(teacherIds) && teacherIds.length > 0) {
      const { TeacherSchema: teacherSchema } = require("@sms/shared");
      const TeacherModel = schoolDb.models.Teacher || schoolDb.model("Teacher", teacherSchema);
      
      await TeacherModel.updateMany(
        { teacherId: { $in: teacherIds } },
        { $addToSet: { subjects: savedSubject.subjectId } }
      );
    }

    // Bidirectional sync: Update classes' subjects array
    const { ClassSchema: classSchema } = require("@sms/shared");
    const ClassModel = schoolDb.models.Class || schoolDb.model("Class", classSchema);
    if (targetClasses.length > 0) {
      await ClassModel.updateMany(
        { classId: { $in: targetClasses } },
        { $addToSet: { subjects: savedSubject.subjectId } }
      );
    }

    const response = res.status(201).json({
      success: true,
      message: "Subject created successfully",
      data: savedSubject,
    });

    // Integrated Logging
    logActivity({
      schoolDb: getSchoolDbConnection(schoolDbName),
      schoolId,
      actor: req.user,
      action: "CREATE",
      entity: "Subject",
      entityId: savedSubject.subjectId,
      entityLabel: savedSubject.name,
      description: `Created new subject: ${savedSubject.name} (${savedSubject.code})`
    });

    return response;
  } catch (error) {
    console.error("Error creating subject:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating subject",
      error: error.message,
    });
  }
};

// Get all subjects in a school
const getAllSubjects = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { status, search, classId } = req.query;

    const schoolDbName = await getSchoolDbName(schoolId);
    if (!schoolDbName) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }

    const SubjectModel = getSubjectModel(schoolDbName);

    // Build query filters
    const query = {};
    if (status) query.status = status;

    if (classId) {
      if (classId === "general") {
        query.$or = [
          { classes: { $exists: false } },
          { classes: { $size: 0 } },
          { classId: { $exists: false } },
          { classId: null },
          { classId: "" },
        ];
      } else {
        query.$or = [
          { classes: classId },
          { classId: classId },
        ];
      }
    }
    
    if (search) {
      // SECURITY (ReDoS): escape user-supplied search string before building RegExp
      const searchRegex = new RegExp(escapeRegex(search), "i");
      const searchConditions = [{ name: searchRegex }, { code: searchRegex }];
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchConditions }];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }

    const subjects = await SubjectModel.find(query).sort({ name: 1 });

    const response = {
      success: true,
      message: "Subjects fetched successfully",
      data: subjects,
      count: subjects.length,
    };

    // Optionally attach assigned teacher names
    const { classId: filterClassId } = req.query;
    
    // We fetch teachers to populate assigned names. 
    // If filterClassId is provided, we only show teachers assigned to that class's sections.
    // Otherwise, we show all teachers assigned to the subject across the school.
    const schoolDb = getSchoolDbConnection(schoolDbName);
    const { TeacherSchema: teacherSchema } = require("@sms/shared");
    const TeacherModel = schoolDb.model("Teacher", teacherSchema);

    const teacherQuery = { status: "active" };
    if (filterClassId && filterClassId !== "general") {
      // Regex to match "classId#sectionId" for the filtered class
      // SECURITY (ReDoS): escape filterClassId before using in $regex
      teacherQuery.classes = { $regex: new RegExp(`^${escapeRegex(filterClassId)}#`) };
    }

    const allTeachers = await TeacherModel.find(teacherQuery)
      .select("teacherId firstName lastName subjects");

    // Fetch classes to populate className
    const { ClassSchema: classSchema } = require("@sms/shared");
    const ClassModel = schoolDb.models.Class || schoolDb.model("Class", classSchema);
    const allClasses = await ClassModel.find().select("classId name _id");
    const classMap = {};
    allClasses.forEach(c => {
      if (c.classId) classMap[c.classId] = c.name;
      if (c._id) classMap[c._id.toString()] = c.name;
    });

    // Build parent classes map for fallback inheritance
    const parentClassesMap = new Map();
    subjects.forEach((s) => {
      if (!s.isSubSubject) {
        if (s.subjectId) parentClassesMap.set(s.subjectId, s.classes || []);
        if (s._id) parentClassesMap.set(s._id.toString(), s.classes || []);
      }
    });

    const mappedSubjects = subjects.map((s) => {
      const subjectObj = s.toObject();
      
      let effectiveClasses = Array.isArray(subjectObj.classes) ? subjectObj.classes : [];
      // If sub-subject has no assigned classes, inherit parent's assigned classes
      if (subjectObj.isSubSubject && subjectObj.parentSubjectId && effectiveClasses.length === 0) {
        effectiveClasses = parentClassesMap.get(subjectObj.parentSubjectId) || [];
      }

      // Populate className and classNames array
      let assignedClassNames = [];
      if (effectiveClasses.length > 0) {
        assignedClassNames = effectiveClasses
          .map((cId) => classMap[cId])
          .filter(Boolean);
      } else if (subjectObj.classId && classMap[subjectObj.classId]) {
        assignedClassNames = [classMap[subjectObj.classId]];
      }

      subjectObj.classNames = assignedClassNames;
      subjectObj.className = assignedClassNames.length > 0
        ? assignedClassNames.join(", ")
        : "General";

      // Find all teachers who have this subjectId in their subjects array
      const assignedTeachers = allTeachers.filter((t) =>
        t.subjects.includes(subjectObj.subjectId),
      );

      if (assignedTeachers.length > 0) {
        subjectObj.assignedTeacherName = assignedTeachers
          .map(t => `${t.firstName} ${t.lastName}`)
          .join(", ");
        subjectObj.assignedTeacherIds = assignedTeachers.map(t => t.teacherId);
        subjectObj.assignedTeacherId = assignedTeachers[0].teacherId; // Keep primary ID for compatibility
      } else {
        subjectObj.assignedTeacherName = "";
        subjectObj.assignedTeacherIds = [];
      }

      return subjectObj;
    });

    // Organize hierarchically: main subjects sorted alphabetically, each followed immediately by its sub-subjects
    const mainSubjects = [];
    const subSubjectsMap = new Map();

    mappedSubjects.forEach((s) => {
      if (s.isSubSubject && s.parentSubjectId) {
        const pId = s.parentSubjectId;
        if (!subSubjectsMap.has(pId)) {
          subSubjectsMap.set(pId, []);
        }
        subSubjectsMap.get(pId).push(s);
      } else {
        mainSubjects.push(s);
      }
    });

    mainSubjects.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    const organizedSubjects = [];
    mainSubjects.forEach((main) => {
      organizedSubjects.push(main);
      const subBySubjectId = subSubjectsMap.get(main.subjectId) || [];
      const subByMongoId = main._id ? subSubjectsMap.get(main._id.toString()) || [] : [];
      const combinedSubs = Array.from(new Set([...subBySubjectId, ...subByMongoId]));

      combinedSubs.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      combinedSubs.forEach((sub) => {
        organizedSubjects.push(sub);
      });

      subSubjectsMap.delete(main.subjectId);
      if (main._id) subSubjectsMap.delete(main._id.toString());
    });

    subSubjectsMap.forEach((subs) => {
      subs.forEach((orphan) => {
        if (!organizedSubjects.includes(orphan)) {
          organizedSubjects.push(orphan);
        }
      });
    });

    response.data = organizedSubjects;

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching subjects",
      error: error.message,
    });
  }
};

// Get subject by subjectId
const getSubjectById = async (req, res) => {
  try {
    const { schoolId, id: subjectId } = req.params;

    const schoolDbName = await getSchoolDbName(schoolId);
    if (!schoolDbName) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }

    const SubjectModel = getSubjectModel(schoolDbName);
    const subject = await SubjectModel.findOne({ subjectId });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Subject fetched successfully",
      data: subject,
    });
  } catch (error) {
    console.error("Error fetching subject:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching subject",
      error: error.message,
    });
  }
};

// Update subject by subjectId
const updateSubjectById = async (req, res) => {
  try {
    const { schoolId, id: subjectId } = req.params;
    const updateData = req.body;
    const { teacherIds } = updateData;
    
    // Prevent updating subjectId and schoolId
    delete updateData.teacherIds;

    delete updateData.subjectId;
    delete updateData.schoolId;

    const schoolDbName = await getSchoolDbName(schoolId);
    if (!schoolDbName) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }

    const schoolDb = getSchoolDbConnection(schoolDbName);
    const SubjectModel = getSubjectModel(schoolDbName);

    // Check if subject exists
    const existingSubject = await SubjectModel.findOne({ subjectId });
    if (!existingSubject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    // If name or code is being updated, check for duplicates
    if (updateData.name || updateData.code) {
      const duplicateQuery = { schoolId, _id: { $ne: existingSubject._id } };
      const orConditions = [];

      if (updateData.name && updateData.name !== existingSubject.name) {
        orConditions.push({ name: updateData.name });
      }
      if (updateData.code && updateData.code !== existingSubject.code) {
        orConditions.push({ code: updateData.code.toUpperCase() });
      }

      if (orConditions.length > 0) {
        duplicateQuery.$or = orConditions;
        const duplicateSubject = await SubjectModel.findOne(duplicateQuery);
        if (duplicateSubject) {
          return res.status(400).json({
            success: false,
            message: "Subject with this name or code already exists",
          });
        }
      }
    }

    // Uppercase code if provided
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
    }

    const updatedSubject = await SubjectModel.findOneAndUpdate(
      { subjectId },
      updateData,
      { new: true, runValidators: true },
    );

    // Bidirectional sync: Update teachers' subjects array
    if (teacherIds && Array.isArray(teacherIds)) {
      const { TeacherSchema: teacherSchema } = require("@sms/shared");
      const TeacherModel = schoolDb.models.Teacher || schoolDb.model("Teacher", teacherSchema);
      
      // 1. Remove subjectId from all teachers who had it but are not in teacherIds
      await TeacherModel.updateMany(
        { subjects: subjectId, teacherId: { $nin: teacherIds } },
        { $pull: { subjects: subjectId } }
      );

      // 2. Add subjectId to all teachers in teacherIds
      await TeacherModel.updateMany(
        { teacherId: { $in: teacherIds } },
        { $addToSet: { subjects: subjectId } }
      );
    }

    // Bidirectional sync: Update classes' subjects array & child sub-subjects
    if (updateData.classes && Array.isArray(updateData.classes)) {
      const parentIdentifiers = [subjectId, existingSubject._id?.toString()].filter(Boolean);

      // Auto-sync updated classes to all child sub-subjects
      await SubjectModel.updateMany(
        { parentSubjectId: { $in: parentIdentifiers } },
        { $set: { classes: updateData.classes } }
      );

      // Find all child sub-subject IDs for ClassModel sync
      const childSubjects = await SubjectModel.find({
        parentSubjectId: { $in: parentIdentifiers }
      }).select("subjectId");
      const childSubjectIds = childSubjects.map(c => c.subjectId).filter(Boolean);
      const allSyncedSubjectIds = Array.from(new Set([subjectId, ...childSubjectIds]));

      const mongoose = require("mongoose");
      const validObjectIds = updateData.classes.filter((cId) => mongoose.Types.ObjectId.isValid(cId));

      const classInMatch = [{ classId: { $in: updateData.classes } }];
      const classNinMatch = [{ classId: { $nin: updateData.classes } }];

      if (validObjectIds.length > 0) {
        classInMatch.push({ _id: { $in: validObjectIds } });
        classNinMatch.push({ _id: { $nin: validObjectIds } });
      }

      const { ClassSchema: classSchema } = require("@sms/shared");
      const ClassModel = schoolDb.models.Class || schoolDb.model("Class", classSchema);

      // 1. Remove synced subject IDs from classes no longer in updateData.classes
      await ClassModel.updateMany(
        { subjects: { $in: allSyncedSubjectIds }, $and: classNinMatch },
        { $pull: { subjects: { $in: allSyncedSubjectIds } } }
      );

      // 2. Add synced subject IDs to classes in updateData.classes
      if (updateData.classes.length > 0) {
        await ClassModel.updateMany(
          { $or: classInMatch },
          { $addToSet: { subjects: { $each: allSyncedSubjectIds } } }
        );
      }
    }

    const response = res.status(200).json({
      success: true,
      message: "Subject updated successfully",
      data: updatedSubject,
    });

    // Integrated Logging
    logActivity({
      schoolDb: getSchoolDbConnection(schoolDbName),
      schoolId,
      actor: req.user,
      action: "UPDATE",
      entity: "Subject",
      entityId: subjectId,
      entityLabel: updatedSubject.name,
      description: `Updated subject details: ${updatedSubject.name} (${subjectId})`,
      metadata: { updateData }
    });

    return response;
  } catch (error) {
    console.error("Error updating subject:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating subject",
      error: error.message,
    });
  }
};

// Delete subject (soft delete)
const deleteSubjectById = async (req, res) => {
  try {
    const { schoolId, id: subjectId } = req.params;

    const schoolDbName = await getSchoolDbName(schoolId);
    if (!schoolDbName) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }

    const SubjectModel = getSubjectModel(schoolDbName);

    const subject = await SubjectModel.findOne({ subjectId });
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    const deletedSubject = await SubjectModel.findOneAndUpdate(
      { subjectId },
      { status: "inactive" },
      { new: true },
    );

    const response = res.status(200).json({
      success: true,
      message: "Subject deleted successfully (soft delete)",
      data: deletedSubject,
    });

    // Integrated Logging
    logActivity({
      schoolDb: getSchoolDbConnection(schoolDbName),
      schoolId,
      actor: req.user,
      action: "DELETE",
      entity: "Subject",
      entityId: subjectId,
      entityLabel: deletedSubject.name,
      description: `Soft deleted subject: ${deletedSubject.name} (${subjectId})`
    });

    return response;
  } catch (error) {
    console.error("Error deleting subject:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting subject",
      error: error.message,
    });
  }
};

module.exports = {
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubjectById,
  deleteSubjectById,
};
