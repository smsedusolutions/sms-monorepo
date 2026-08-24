const { getSchoolDbConnection } = require("../configs/db");
const {
  SchoolModel: School,
  EmailRegistryModel: EmailRegistry,
  TeacherSchema: teacherSchema,
} = require("@sms/shared");
const {
  getPaginationParams,
  formatPaginationResponse,
} = require("../utils/pagination");
const { logActivity, hashPassword, escapeRegex } = require("@sms/shared/utils"); // SECURITY: GAP-001 bcrypt, ReDoS

/**
 * Get Teacher model for a specific school database
 */
const getTeacherModel = (schoolDbName) => {
  const schoolDb = getSchoolDbConnection(schoolDbName);
  return schoolDb.model("Teacher", teacherSchema);
};

const { generateNextId } = require("@sms/shared/utils");

/**
 * Helper function to generate teacherId
 * Format: TCH + 5 digit number (TCH00001, TCH00002, ...)
 */
const generateTeacherId = async (Teacher) => {
  return generateNextId(Teacher, "teacherId", "TCH", 5);
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

// Create a new teacher
const createTeacher = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      subjects,
      classes,
      status,
      profileImage,
      signature,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "firstName, lastName, email, and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists in EmailRegistry (global check)
    const existingEmail = await EmailRegistry.findOne({
      email: normalizedEmail,
    });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already exists in the system",
      });
    }

    // Get school database name
    const schoolDbName = await getSchoolDbName(schoolId);
    if (!schoolDbName) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }

    const Teacher = getTeacherModel(schoolDbName);

    // Generate teacherId
    const teacherId = await generateTeacherId(Teacher);

    // SECURITY (GAP-001): Hash password before storage
    const hashedPassword = await hashPassword(password);

    const newTeacher = new Teacher({
      teacherId,
      schoolId,
      firstName,
      lastName,
      email: normalizedEmail,
      password: hashedPassword,
      phone,
      subjects: subjects || [],
      classes: classes || [],   // stores classId#sectionId pairs
      status: status || "active",
      profileImage,
      signature,
    });

    const savedTeacher = await newTeacher.save();

    // Register in EmailRegistry for unified login
    await EmailRegistry.create({
      email: normalizedEmail,
      role: "teacher",
      schoolId: schoolId,
      userId: savedTeacher.teacherId,
      status: savedTeacher.status || "active",
    });

    // Stamp classTeacherId on every assigned section in the Class documents
    if (classes && classes.length > 0) {
      const schoolDb = getSchoolDbConnection(schoolDbName);
      const { ClassSchema: classSchema } = require("@sms/shared");
      const Class = schoolDb.model("Class", classSchema);

      await Teacher.updateMany(
        { teacherId: { $ne: savedTeacher.teacherId }, classes: { $in: classes } },
        { $pull: { classes: { $in: classes } } }
      );

      await Promise.all(
        classes
          .filter((pair) => pair.includes("#"))
          .map((pair) => {
            const [cId, sId] = pair.split("#");
            return Class.findOneAndUpdate(
              { classId: cId, "sections.sectionId": sId },
              { $set: { "sections.$.classTeacherId": savedTeacher.teacherId } },
            );
          })
      );
    }

    // Integrated Logging
    logActivity({
      schoolDb: getSchoolDbConnection(schoolDbName),
      schoolId,
      actor: req.user,
      action: "CREATE",
      entity: "Teacher",
      entityId: savedTeacher.teacherId,
      entityLabel: `${savedTeacher.firstName} ${savedTeacher.lastName}`,
      description: `Created new teacher: ${savedTeacher.firstName} ${savedTeacher.lastName} (${savedTeacher.teacherId})`
    });

    return res.status(201).json({
      success: true,
      message: "Teacher created successfully",
      data: savedTeacher,
    });
  } catch (error) {
    console.error("Error creating teacher:", error);
    return res.status(500).json({
      success: false,
      message: "Server error creating teacher",
      error: error.message,
    });
  }
};

// Get teacher by teacherId (with aggregated details)
const getTeacherById = async (req, res) => {
  try {
    const { schoolId, id: teacherId } = req.params;

    const schoolDbName = await getSchoolDbName(schoolId);
    if (!schoolDbName) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }

    const Teacher = getTeacherModel(schoolDbName);
    // SECURITY (ReDoS): escape path param before using in $regex to prevent catastrophic backtracking
    const safeTeacherId = escapeRegex(teacherId);
    const query = {
      $or: [
        { teacherId: { $regex: new RegExp(`^${safeTeacherId}$`, "i") } },
        { userId: { $regex: new RegExp(`^${safeTeacherId}$`, "i") } },
      ],
    };
    if (require("mongoose").isValidObjectId(teacherId)) {
      query.$or.push({ _id: teacherId });
    }
    const teacher = await Teacher.findOne(query).select("-password");

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    // Convert to object to add additional fields
    const teacherObj = teacher.toObject();

    // Fetch school details for schoolName
    const school = await School.findOne({ schoolId });
    if (school) {
      teacherObj.schoolName = school.schoolName;
    }

    // Fetch subject details for subjectNames
    if (teacher.subjects && teacher.subjects.length > 0) {
      const schoolDb = getSchoolDbConnection(schoolDbName);
      const { SubjectSchema: subjectSchema } = require("@sms/shared");
      const Subject = schoolDb.model("Subject", subjectSchema);

      const subjects = await Subject.find({
        subjectId: { $in: teacher.subjects },
      }).select("subjectId name");

      teacherObj.subjectNames = subjects.map((s) => s.name);
    }

    // Fetch class details for classNames
    if (teacher.classes && teacher.classes.length > 0) {
      const schoolDb = getSchoolDbConnection(schoolDbName);
      const { ClassSchema: classSchema } = require("@sms/shared");
      const Class = schoolDb.model("Class", classSchema);

      const uniqueClassIds = [
        ...new Set(teacher.classes.map((c) => c.split("#")[0])),
      ];
      const classesDocs = await Class.find({
        classId: { $in: uniqueClassIds },
      }).select("classId name sections");

      teacherObj.classNames = teacher.classes.map((c) => {
        if (c.includes("#")) {
          const [cId, sId] = c.split("#");
          const classDoc = classesDocs.find((cls) => cls.classId === cId);
          if (classDoc) {
            const section = classDoc.sections.find((s) => s.sectionId === sId);
            return section
              ? `${classDoc.name} - ${section.name}`
              : classDoc.name;
          }
        }
        return c;
      });
    }

    // Fetch class teacher label if applicable
    if (
      teacher.classTeacherSectionId &&
      teacher.classTeacherSectionId.includes("#")
    ) {
      const [assignedClassId, assignedSectionId] =
        teacher.classTeacherSectionId.split("#");
      const schoolDb = getSchoolDbConnection(schoolDbName);
      const { ClassSchema: classSchema } = require("@sms/shared");
      const Class = schoolDb.model("Class", classSchema);

      const classDoc = await Class.findOne({
        classId: assignedClassId,
        "sections.sectionId": assignedSectionId,
      }).select("name sections");

      if (classDoc) {
        const section = classDoc.sections.find(
          (s) => s.sectionId === assignedSectionId,
        );
        if (section) {
          teacherObj.classTeacherLabel = `${classDoc.name} - ${section.name}`;
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Teacher fetched successfully",
      data: teacherObj,
    });
  } catch (error) {
    console.error("Error fetching teacher:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching teacher",
      error: error.message,
    });
  }
};

// Get all teachers in a school
const getAllTeachers = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { department, status, search } = req.query;
    const { page, limit, skip } = getPaginationParams(req.query);

    const schoolDbName = await getSchoolDbName(schoolId);
    if (!schoolDbName) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }

    const Teacher = getTeacherModel(schoolDbName);

    // Build query filters
    const query = {};
    if (department) query.department = department;
    if (status) query.status = status;
    if (search) {
      // SECURITY (ReDoS): escape user-supplied search string before building RegExp
      const regex = new RegExp(escapeRegex(search), "i");
      query.$or = [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
      ];
    }

    const [teachers, total] = await Promise.all([
      Teacher.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Teacher.countDocuments(query),
    ]);


    // Collect all unique classIds from teachers' classes arrays (classId#sectionId format)
    const allClassIds = [
      ...new Set(
        teachers.flatMap((t) =>
          (t.classes || []).map((c) => (c.includes("#") ? c.split("#")[0] : c))
        )
      ),
    ];

    const allSubjectIds = [...new Set(teachers.flatMap((t) => t.subjects || []))];

    const subjectMap = {};
    const classDocMap = {};
    const schoolDb = getSchoolDbConnection(schoolDbName);

    if (allClassIds.length > 0 || allSubjectIds.length > 0) {
      const { ClassSchema: classSchema, SubjectSchema: subjectSchema } = require("@sms/shared");
      const Class = schoolDb.model("Class", classSchema);
      const Subject = schoolDb.model("Subject", subjectSchema);

      const [classesDocs, subjectsDocs] = await Promise.all([
        allClassIds.length > 0
          ? Class.find({ classId: { $in: allClassIds } }).select("classId name sections")
          : Promise.resolve([]),
        allSubjectIds.length > 0
          ? Subject.find({
              $or: [{ subjectId: { $in: allSubjectIds } }, { code: { $in: allSubjectIds } }],
            }).select("subjectId code name")
          : Promise.resolve([]),
      ]);

      classesDocs.forEach((c) => (classDocMap[c.classId] = c));
      subjectsDocs.forEach((s) => {
        if (s.subjectId) subjectMap[s.subjectId] = s.name;
        if (s.code) subjectMap[s.code] = s.name;
      });
    }

    const teachersWithPopulatedData = teachers.map((t) => {
      const obj = t.toObject();

      // Resolve human-readable classNames from classId#sectionId pairs
      obj.classNames = (t.classes || []).map((pair) => {
        if (pair.includes("#")) {
          const [cId, sId] = pair.split("#");
          const classDoc = classDocMap[cId];
          if (classDoc) {
            const section = classDoc.sections.find((s) => s.sectionId === sId);
            return section ? `${classDoc.name} - ${section.name}` : classDoc.name;
          }
        }
        return pair;
      }).filter(Boolean);

      obj.subjectNames = (t.subjects || []).map((id) => subjectMap[id] || id).filter(Boolean);
      return obj;
    });

    const response = formatPaginationResponse(
      teachersWithPopulatedData,
      total,
      page,
      limit,
    );

    return res.status(200).json({
      success: true,
      message: "Teachers fetched successfully",
      ...response,
    });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching teachers",
      error: error.message,
    });
  }
};

// Update teacher by teacherId
const updateTeacherById = async (req, res) => {
  try {
    const { schoolId, id: teacherId } = req.params;
    const updateData = req.body;

    // Prevent updating teacherId, schoolId, and role
    delete updateData.teacherId;
    delete updateData.schoolId;
    delete updateData.role;

    // SECURITY (GAP-001): If password is being updated, hash it before saving
    if (updateData.password) {
      updateData.password = await hashPassword(updateData.password);
    }

    const schoolDbName = await getSchoolDbName(schoolId);
    if (!schoolDbName) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }

    const Teacher = getTeacherModel(schoolDbName);

    // Get current teacher for email comparison
    const currentTeacher = await Teacher.findOne({ teacherId });
    if (!currentTeacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    // If email is being updated, update EmailRegistry too
    if (updateData.email && updateData.email !== currentTeacher.email) {
      const normalizedEmail = updateData.email.toLowerCase().trim();

      // Check if new email exists
      const existingEmail = await EmailRegistry.findOne({
        email: normalizedEmail,
      });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "Email already exists in the system",
        });
      }

      // Update EmailRegistry
      await EmailRegistry.findOneAndUpdate(
        { email: currentTeacher.email.toLowerCase() },
        { email: normalizedEmail },
      );

      updateData.email = normalizedEmail;
    }
    // If status is being updated, update EmailRegistry too
    if (updateData.status) {
      await EmailRegistry.findOneAndUpdate(
        { email: currentTeacher.email.toLowerCase() },
        { status: updateData.status },
      );

      // When deactivating a teacher, clear classTeacherId from all their assigned sections
      if (updateData.status === "inactive" && currentTeacher.classes && currentTeacher.classes.length > 0) {
        const schoolDb = getSchoolDbConnection(schoolDbName);
        const { ClassSchema: classSchema } = require("@sms/shared");
        const Class = schoolDb.model("Class", classSchema);

        await Promise.all(
          currentTeacher.classes
            .filter((pair) => pair.includes("#"))
            .map((pair) => {
              const [cId, sId] = pair.split("#");
              return Class.findOneAndUpdate(
                { classId: cId, "sections.sectionId": sId },
                { $set: { "sections.$.classTeacherId": null } },
              );
            })
        );

        // Also clear the teacher's classes array so they're fully unassigned
        if (updateData.classes === undefined) {
          updateData.classes = [];
        }
      }
    }


    // Sync classTeacherId on Class sections when the classes assignment changes
    if (updateData.classes !== undefined) {
      const oldClasses = currentTeacher.classes || [];
      const newClasses = updateData.classes || [];

      const removed = oldClasses.filter((c) => !newClasses.includes(c));
      const added   = newClasses.filter((c) => !oldClasses.includes(c));

      if (removed.length > 0 || added.length > 0) {
        const schoolDb = getSchoolDbConnection(schoolDbName);
        const { ClassSchema: classSchema } = require("@sms/shared");
        const Class = schoolDb.model("Class", classSchema);

        // Clear classTeacherId from sections no longer assigned
        await Promise.all(
          removed
            .filter((pair) => pair.includes("#"))
            .map((pair) => {
              const [cId, sId] = pair.split("#");
              return Class.findOneAndUpdate(
                { classId: cId, "sections.sectionId": sId },
                { $set: { "sections.$.classTeacherId": null } },
              );
            })
        );

        // Set classTeacherId on newly assigned sections & remove from any previous teachers
        if (added.length > 0) {
          await Teacher.updateMany(
            { teacherId: { $ne: teacherId }, classes: { $in: added } },
            { $pull: { classes: { $in: added } } }
          );

          await Promise.all(
            added
              .filter((pair) => pair.includes("#"))
              .map((pair) => {
                const [cId, sId] = pair.split("#");
                return Class.findOneAndUpdate(
                  { classId: cId, "sections.sectionId": sId },
                  { $set: { "sections.$.classTeacherId": teacherId } },
                );
              })
          );
        }
      }
    }

    const updatedTeacher = await Teacher.findOneAndUpdate(
      { teacherId },
      updateData,
      {
        new: true,
        runValidators: true,
      },
    ).select("-password");

    const response = res.status(200).json({
      success: true,
      message: "Teacher updated successfully",
      data: updatedTeacher,
    });

    // Integrated Logging
    logActivity({
      schoolDb: getSchoolDbConnection(schoolDbName),
      schoolId,
      actor: req.user,
      action: "UPDATE",
      entity: "Teacher",
      entityId: teacherId,
      entityLabel: `${updatedTeacher.firstName} ${updatedTeacher.lastName}`,
      description: `Updated teacher record: ${updatedTeacher.firstName} ${updatedTeacher.lastName} (${teacherId})`,
      metadata: { updateData }
    });

    return response;
  } catch (error) {
    console.error("Error updating teacher:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating teacher",
      error: error.message,
    });
  }
};

// Delete teacher by teacherId (soft delete - set status to inactive)
const deleteTeacherById = async (req, res) => {
  try {
    const { schoolId, id: teacherId } = req.params;

    const schoolDbName = await getSchoolDbName(schoolId);
    if (!schoolDbName) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }

    const Teacher = getTeacherModel(schoolDbName);

    const teacher = await Teacher.findOne({ teacherId });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    // Soft delete
    const deletedTeacher = await Teacher.findOneAndUpdate(
      { teacherId },
      { status: "inactive" },
      { new: true },
    ).select("-password");

    // Update EmailRegistry status
    await EmailRegistry.findOneAndUpdate(
      { email: teacher.email.toLowerCase() },
      { status: "inactive" },
    );

    // Clear classTeacherId from all sections this teacher was assigned to
    if (teacher.classes && teacher.classes.length > 0) {
      const schoolDb = getSchoolDbConnection(schoolDbName);
      const { ClassSchema: classSchema } = require("@sms/shared");
      const Class = schoolDb.model("Class", classSchema);

      await Promise.all(
        teacher.classes
          .filter((pair) => pair.includes("#"))
          .map((pair) => {
            const [cId, sId] = pair.split("#");
            return Class.findOneAndUpdate(
              { classId: cId, "sections.sectionId": sId },
              { $set: { "sections.$.classTeacherId": null } },
            );
          })
      );
    }

    const response = res.status(200).json({
      success: true,
      message: "Teacher deleted successfully (soft delete)",
      data: deletedTeacher,
    });

    // Integrated Logging
    logActivity({
      schoolDb: getSchoolDbConnection(schoolDbName),
      schoolId,
      actor: req.user,
      action: "DELETE",
      entity: "Teacher",
      entityId: teacherId,
      entityLabel: `${deletedTeacher.firstName} ${deletedTeacher.lastName}`,
      description: `Soft deleted teacher: ${deletedTeacher.firstName} ${deletedTeacher.lastName} (${teacherId})`
    });

    return response;
  } catch (error) {
    console.error("Error deleting teacher:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting teacher",
      error: error.message,
    });
  }
};

module.exports = {
  createTeacher,
  getTeacherById,
  getAllTeachers,
  updateTeacherById,
  deleteTeacherById,
};
