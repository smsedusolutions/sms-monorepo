const { getSchoolDbConnection } = require("../configs/db");
const {
  SchoolModel: School,
  EmailRegistryModel: EmailRegistry,
  ParentSchema: parentSchema,
  StudentSchema: studentSchema,
  ClassSchema: classSchema,
} = require("@sms/shared");
const {
  getPaginationParams,
  formatPaginationResponse,
} = require("../utils/pagination");
const { logActivity } = require("@sms/shared/utils");

/**
 * Get Parent model for a specific school database
 */
const getParentModel = (schoolDbName) => {
  const schoolDb = getSchoolDbConnection(schoolDbName);
  return schoolDb.model("Parent", parentSchema);
};

/**
 * Get Student model for a specific school database
 */
const getStudentModel = (schoolDbName) => {
  const schoolDb = getSchoolDbConnection(schoolDbName);
  return schoolDb.model("Student", studentSchema);
};

/**
 * Helper function to generate parentId
 * Format: PRT + 5 digit number (PRT00001, PRT00002, ...)
 */
const generateParentId = async (Parent) => {
  const lastParent = await Parent.findOne().sort({ parentId: -1 });

  if (!lastParent || !lastParent.parentId) {
    return "PRT00001";
  }

  const lastIdNumber = parseInt(lastParent.parentId.replace("PRT", ""), 10);
  const newIdNumber = lastIdNumber + 1;

  return `PRT${String(newIdNumber).padStart(5, "0")}`;
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

// Create a new parent
const createParent = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      studentIds,
      relationship,
      occupation,
      address,
      status,
      ...rest
    } = req.body;

    // Validate required fields
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !phone ||
      !relationship
    ) {
      return res.status(400).json({
        success: false,
        message:
          "firstName, lastName, email, password, phone, and relationship are required",
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

    const Parent = getParentModel(schoolDbName);

    // Validate if students are already linked to another parent
    if (studentIds && studentIds.length > 0) {
      const Student = getStudentModel(schoolDbName);
      const alreadyLinked = await Student.findOne({
        studentId: { $in: studentIds },
        parentId: { $exists: true, $ne: null, $ne: "" },
      });
      if (alreadyLinked) {
        return res.status(400).json({
          success: false,
          message: `Student ${alreadyLinked.firstName} ${alreadyLinked.lastName} (${alreadyLinked.studentId}) is already linked to another parent.`,
        });
      }
    }

    // Generate parentId
    const parentId = await generateParentId(Parent);

    const newParent = new Parent({
      parentId,
      schoolId,
      firstName,
      lastName,
      email: normalizedEmail,
      password, // Plain text for now
      phone,
      studentIds: studentIds || [],
      relationship,
      occupation,
      address,
      status: status || "active",
      ...rest,
    });

    const savedParent = await newParent.save();

    // Register in EmailRegistry for unified login
    await EmailRegistry.create({
      email: normalizedEmail,
      role: "parent",
      schoolId: schoolId,
      userId: savedParent.parentId,
      status: savedParent.status || "active",
    });

    // Update students' parentId (bidirectional)
    if (studentIds && studentIds.length > 0) {
      try {
        const Student = getStudentModel(schoolDbName);
        await Student.updateMany(
          { studentId: { $in: studentIds } },
          { parentId: parentId },
        );
      } catch (studentError) {
        console.warn(
          "Could not update students' parentId:",
          studentError.message,
        );
      }
    }

    const response = res.status(201).json({
      success: true,
      message: "Parent created successfully",
      data: {
        parentId: savedParent.parentId,
        schoolId: savedParent.schoolId,
        firstName: savedParent.firstName,
        lastName: savedParent.lastName,
        email: savedParent.email,
        phone: savedParent.phone,
        studentIds: savedParent.studentIds,
        relationship: savedParent.relationship,
        status: savedParent.status,
      },
    });

    // Integrated Logging
    logActivity({
      schoolDb: getSchoolDbConnection(schoolDbName),
      schoolId,
      actor: req.user,
      action: "CREATE",
      entity: "Parent",
      entityId: savedParent.parentId,
      entityLabel: `${savedParent.firstName} ${savedParent.lastName}`,
      description: `Created new parent: ${savedParent.firstName} ${savedParent.lastName} (${savedParent.parentId})`
    });

    return response;
  } catch (error) {
    console.error("Error creating parent:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating parent",
      error: error.message,
    });
  }
};

// Get parent by parentId
const getParentById = async (req, res) => {
  try {
    const { schoolId, id: parentId } = req.params;

    const schoolDbName = await getSchoolDbName(schoolId);
    if (!schoolDbName) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }

    const Parent = getParentModel(schoolDbName);
    const query = {
      $or: [
        { parentId },
        { userId: parentId },
      ],
    };
    if (require("mongoose").isValidObjectId(parentId)) {
      query.$or.push({ _id: parentId });
    }
    const parent = await Parent.findOne(query).select("-password");

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent not found",
      });
    }

    const parentObj = parent.toObject();

    if (parent.studentIds && parent.studentIds.length > 0) {
      const Student = getStudentModel(schoolDbName);
      const students = await Student.find({ studentId: { $in: parent.studentIds } }).select(
        "studentId firstName lastName class section profileImage"
      );

      parentObj.childrenNames = students.map((s) => `${s.firstName} ${s.lastName}`);
      parentObj.childrenDetails = students.map((s) => ({
        studentId: s.studentId,
        name: `${s.firstName} ${s.lastName}`,
        classSection: `${s.class || ""}${s.section ? ` (${s.section})` : ""}`,
        profileImage: s.profileImage || "",
      }));
    } else {
      parentObj.childrenNames = [];
      parentObj.childrenDetails = [];
    }

    return res.status(200).json({
      success: true,
      message: "Parent fetched successfully",
      data: parentObj,
    });
  } catch (error) {
    console.error("Error fetching parent:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching parent",
      error: error.message,
    });
  }
};

// Get all parents in a school
const getAllParents = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { status, relationship } = req.query;
    const userRole = req.user?.role;
    const userClasses = req.user?.classes; // Teacher's assigned classes from token

    const schoolDbName = await getSchoolDbName(schoolId);
    if (!schoolDbName) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }

    const Parent = getParentModel(schoolDbName);
    const Student = getStudentModel(schoolDbName);

    // Build query filters
    const query = {};
    if (status) query.status = status;
    if (relationship) query.relationship = relationship;

    // Search filter (firstName, lastName, email, phone, or parentId)
    if (req.query.search) {
      const search = req.query.search.trim();
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const searchRegex = new RegExp(escapedSearch, "i");

      const searchConditions = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { parentId: searchRegex },
      ];

      // Handle full names if search contains space
      if (search.includes(" ")) {
        const parts = search.split(/\s+/);
        if (parts.length >= 2) {
          searchConditions.push({
            $and: [
              { firstName: new RegExp(parts[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
              { lastName: new RegExp(parts[parts.length - 1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
            ],
          });
        }
      }
      query.$or = searchConditions;
    }

    const { page, limit, skip } = getPaginationParams(req.query);

    const classFilter = req.query.class || req.query.classId;
    if (classFilter) {
      const studentQuery = { class: classFilter };
      if (userRole === "teacher" && userClasses && userClasses.length > 0) {
        const allowedCombinations = userClasses.map((uc) => {
          const [cls, sec] = uc.split('#');
          return sec ? { class: cls, section: sec } : { class: cls };
        });
        studentQuery.$or = allowedCombinations;
      }
      const matchingStudents = await Student.find(studentQuery).select("studentId");
      query.studentIds = { $in: matchingStudents.map((s) => s.studentId) };
    } else if (userRole === "teacher" && userClasses && userClasses.length > 0) {
      const allowedCombinations = userClasses.map((uc) => {
        const [cls, sec] = uc.split('#');
        return sec ? { class: cls, section: sec } : { class: cls };
      });
      const studentsInClasses = await Student.find({ $or: allowedCombinations }).select("studentId");
      const studentIds = studentsInClasses.map((s) => s.studentId);
      query.studentIds = { $in: studentIds };
    }

    const [parents, total] = await Promise.all([
      Parent.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Parent.countDocuments(query),
    ]);

    // Populate student names and class details for each parent
    const allStudentIds = [...new Set(parents.flatMap((p) => p.studentIds || []))];
    const studentInfoMap = {};

    if (allStudentIds.length > 0) {
      const students = await Student.find({ studentId: { $in: allStudentIds } }).select(
        "studentId firstName lastName class section profileImage"
      );

      const classIds = [...new Set(students.map((s) => s.class).filter(Boolean))];
      let classMap = {};
      try {
        const schoolDb = getSchoolDbConnection(schoolDbName);
        const ClassModel = schoolDb.model("Class", classSchema);
        const classDocs = await ClassModel.find({ classId: { $in: classIds } }).lean();
        classDocs.forEach((c) => {
          classMap[c.classId] = c;
        });
      } catch (e) {
        console.warn("Class schema query warning:", e.message);
      }

      students.forEach((s) => {
        const clsObj = classMap[s.class];
        const className = clsObj ? clsObj.name : s.class || "";
        let sectionName = "";
        if (clsObj && clsObj.sections && Array.isArray(clsObj.sections)) {
          const sec = clsObj.sections.find((sec) => sec.sectionId === s.section);
          if (sec) sectionName = sec.name;
        }
        if (!sectionName && s.section && !s.section.startsWith("SEC-")) {
          sectionName = s.section;
        }

        const classSectionStr = className ? `${className}${sectionName ? ` (${sectionName})` : ""}` : "";

        studentInfoMap[s.studentId] = {
          name: `${s.firstName} ${s.lastName}`,
          classSection: classSectionStr,
          profileImage: s.profileImage || "",
        };
      });
    }

    const parentsWithStudents = parents.map((p) => {
      const parentObj = p.toObject();
      parentObj.childrenNames = (p.studentIds || []).map((id) => studentInfoMap[id]?.name || id);
      parentObj.childrenDetails = (p.studentIds || []).map((id) => ({
        studentId: id,
        name: studentInfoMap[id]?.name || id,
        classSection: studentInfoMap[id]?.classSection || "",
        profileImage: studentInfoMap[id]?.profileImage || "",
      }));
      return parentObj;
    });

    const response = formatPaginationResponse(parentsWithStudents, total, page, limit);


    return res.status(200).json({
      success: true,
      message: "Parents fetched successfully",
      ...response,
    });
  } catch (error) {
    console.error("Error fetching parents:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching parents",
      error: error.message,
    });
  }
};

// Update parent by parentId
const updateParentById = async (req, res) => {
  try {
    const { schoolId, id: parentId } = req.params;
    const updateData = req.body;

    // Prevent updating parentId, schoolId, and role
    delete updateData.parentId;
    delete updateData.schoolId;
    delete updateData.role;

    const schoolDbName = await getSchoolDbName(schoolId);
    if (!schoolDbName) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }

    const Parent = getParentModel(schoolDbName);

    // Get current parent for studentIds change handling
    const currentParent = await Parent.findOne({ parentId });
    if (!currentParent) {
      return res.status(404).json({
        success: false,
        message: "Parent not found",
      });
    }

    // If email is being updated, update EmailRegistry too
    if (updateData.email && updateData.email !== currentParent.email) {
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
        { email: currentParent.email.toLowerCase() },
        { email: normalizedEmail },
      );

      updateData.email = normalizedEmail;
    }

    // If status is being updated, update EmailRegistry too
    if (updateData.status) {
      await EmailRegistry.findOneAndUpdate(
        { email: currentParent.email.toLowerCase() },
        { status: updateData.status },
      );
    }

    const oldStudentIds = currentParent.studentIds || [];
    const newStudentIds = updateData.studentIds;

    // Validate if newly added students are already linked to another parent
    if (newStudentIds !== undefined) {
      const addedStudents = newStudentIds.filter(id => !oldStudentIds.includes(id));
      if (addedStudents.length > 0) {
        const Student = getStudentModel(schoolDbName);
        const alreadyLinked = await Student.findOne({
          studentId: { $in: addedStudents },
          parentId: { $exists: true, $ne: null, $ne: "", $ne: parentId }
        });
        if (alreadyLinked) {
          return res.status(400).json({
            success: false,
            message: `Student ${alreadyLinked.firstName} ${alreadyLinked.lastName} (${alreadyLinked.studentId}) is already linked to another parent.`
          });
        }
      }
    }

    const updatedParent = await Parent.findOneAndUpdate(
      { parentId },
      updateData,
      {
        new: true,
        runValidators: true,
      },
    ).select("-password");

    // Handle bidirectional parent-student relationship update
    if (newStudentIds !== undefined) {
      const Student = getStudentModel(schoolDbName);

      // Find removed students and clear their parentId
      const removedStudents = oldStudentIds.filter(
        (id) => !newStudentIds.includes(id),
      );
      if (removedStudents.length > 0) {
        await Student.updateMany(
          { studentId: { $in: removedStudents } },
          { $unset: { parentId: "" } },
        );
      }

      // Find added students and set their parentId
      const addedStudents = newStudentIds.filter(
        (id) => !oldStudentIds.includes(id),
      );
      if (addedStudents.length > 0) {
        await Student.updateMany(
          { studentId: { $in: addedStudents } },
          { parentId: parentId },
        );
      }
    }

    const response = res.status(200).json({
      success: true,
      message: "Parent updated successfully",
      data: updatedParent,
    });

    // Integrated Logging
    logActivity({
      schoolDb: getSchoolDbConnection(schoolDbName),
      schoolId,
      actor: req.user,
      action: "UPDATE",
      entity: "Parent",
      entityId: parentId,
      entityLabel: `${updatedParent.firstName} ${updatedParent.lastName}`,
      description: `Updated parent record: ${updatedParent.firstName} ${updatedParent.lastName} (${parentId})`,
      metadata: { updateData }
    });

    return response;
  } catch (error) {
    console.error("Error updating parent:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating parent",
      error: error.message,
    });
  }
};

// Delete parent by parentId (soft delete)
const deleteParentById = async (req, res) => {
  try {
    const { schoolId, id: parentId } = req.params;

    const schoolDbName = await getSchoolDbName(schoolId);
    if (!schoolDbName) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }

    const Parent = getParentModel(schoolDbName);

    const parent = await Parent.findOne({ parentId });
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent not found",
      });
    }

    // Soft delete
    const deletedParent = await Parent.findOneAndUpdate(
      { parentId },
      { status: "inactive" },
      { new: true },
    ).select("-password");

    // Update EmailRegistry status
    await EmailRegistry.findOneAndUpdate(
      { email: parent.email.toLowerCase() },
      { status: "inactive" },
    );

    const response = res.status(200).json({
      success: true,
      message: "Parent deleted successfully (soft delete)",
      data: deletedParent,
    });

    // Integrated Logging
    logActivity({
      schoolDb: getSchoolDbConnection(schoolDbName),
      schoolId,
      actor: req.user,
      action: "DELETE",
      entity: "Parent",
      entityId: parentId,
      entityLabel: `${deletedParent.firstName} ${deletedParent.lastName}`,
      description: `Soft deleted parent: ${deletedParent.firstName} ${deletedParent.lastName} (${parentId})`
    });

    return response;
  } catch (error) {
    console.error("Error deleting parent:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting parent",
      error: error.message,
    });
  }
};

// Get parents by studentId
const getParentsByStudentId = async (req, res) => {
  try {
    const { schoolId, studentId } = req.params;

    const schoolDbName = await getSchoolDbName(schoolId);
    if (!schoolDbName) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }

    const Parent = getParentModel(schoolDbName);

    // Find all parents that have this studentId in their studentIds array
    const parents = await Parent.find({
      studentIds: studentId,
    }).select("-password");

    return res.status(200).json({
      success: true,
      message: "Parents fetched successfully",
      data: parents,
      count: parents.length,
    });
  } catch (error) {
    console.error("Error fetching parents by student:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching parents by student",
      error: error.message,
    });
  }
};

// Search parents for autocomplete (partial matching)
const searchParents = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { query } = req.query;

    if (!query || query.length < 2) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "Query too short",
      });
    }

    const schoolDbName = await getSchoolDbName(schoolId);
    if (!schoolDbName) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }

    const Parent = getParentModel(schoolDbName);

    // Search by parentId, email, firstName, lastName, phone with partial matching
    const searchRegex = new RegExp(query, "i");

    const parents = await Parent.find({
      $or: [
        { parentId: searchRegex },
        { email: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex },
        { phone: searchRegex },
      ],
      status: "active",
    })
      .select("parentId firstName lastName email phone relationship")
      .limit(10);

    return res.status(200).json({
      success: true,
      data: parents,
      count: parents.length,
    });
  } catch (error) {
    console.error("Error searching parents:", error);
    return res.status(500).json({
      success: false,
      message: "Error searching parents",
      error: error.message,
    });
  }
};

module.exports = {
  createParent,
  getParentById,
  getAllParents,
  updateParentById,
  deleteParentById,
  getParentsByStudentId,
  searchParents,
};
