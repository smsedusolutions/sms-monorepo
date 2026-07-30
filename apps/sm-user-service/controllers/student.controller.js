const { getSchoolDbConnection } = require("../configs/db");
const {
  SchoolModel: School,
  EmailRegistryModel: EmailRegistry,
  StudentSchema: studentSchema,
  ParentSchema: parentSchema,
  ClassSchema: classSchema,
} = require("@sms/shared");
const {
  getPaginationParams,
  formatPaginationResponse,
} = require("../utils/pagination");
const {
  createBackup,
  getBackups,
  restoreBackup,
} = require("../utils/backupHelper");
const { logActivity } = require("@sms/shared/utils");

/**
 * Get Student model for a specific school database
 */
const getStudentModel = (schoolDbName) => {
  const schoolDb = getSchoolDbConnection(schoolDbName);
  return schoolDb.model("Student", studentSchema);
};

/**
 * Get Parent model for a specific school database
 */
const getParentModel = (schoolDbName) => {
  const schoolDb = getSchoolDbConnection(schoolDbName);
  return schoolDb.model("Parent", parentSchema);
};

/**
 * Get Class model for a specific school database
 */
const getClassModel = (schoolDbName) => {
  const schoolDb = getSchoolDbConnection(schoolDbName);
  return schoolDb.model("Class", classSchema);
};

/**
 * Helper function to generate studentId
 * Format: STU + 5 digit number (STU00001, STU00002, ...)
 */
const generateStudentId = async (Student) => {
  const lastStudent = await Student.findOne().sort({ studentId: -1 });

  if (!lastStudent || !lastStudent.studentId) {
    return "STU00001";
  }

  const lastIdNumber = parseInt(lastStudent.studentId.replace("STU", ""), 10);
  const newIdNumber = lastIdNumber + 1;

  return `STU${String(newIdNumber).padStart(5, "0")}`;
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

// Create a new student
const createStudent = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      class: studentClass,
      section,
      rollNumber,
      parentId,
      dateOfBirth,
      gender,
      address,
      status,
      profileImage,
      ...rest
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !password || !studentClass) {
      return res.status(400).json({
        success: false,
        message: "firstName, lastName, password, and class are required",
      });
    }

    // Check if email already exists in EmailRegistry (global check)
    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      const existingEmail = await EmailRegistry.findOne({
        email: normalizedEmail,
      });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "Email already exists in the system",
        });
      }
    }

    // Get school database name
    const schoolDbName = await getSchoolDbName(schoolId);
    if (!schoolDbName) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }

    const Student = getStudentModel(schoolDbName);

    // Generate studentId
    const studentId = await generateStudentId(Student);

    const normalizedEmail = email ? email.toLowerCase().trim() : undefined;

    const newStudent = new Student({
      studentId,
      schoolId,
      firstName,
      lastName,
      email: normalizedEmail,
      password, // Plain text for now
      phone,
      class: studentClass,
      section,
      rollNumber,
      parentId,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender,
      address,
      status: status || "active",
      profileImage,
      ...rest,
    });

    const savedStudent = await newStudent.save();

    // Register in EmailRegistry for unified login (only if email provided)
    if (normalizedEmail) {
      await EmailRegistry.create({
        email: normalizedEmail,
        role: "student",
        schoolId: schoolId,
        userId: savedStudent.studentId,
        status: savedStudent.status || "active",
      });
    }

    // If parentId is provided, update parent's studentIds array (bidirectional)
    if (parentId) {
      try {
        const Parent = getParentModel(schoolDbName);
        await Parent.findOneAndUpdate(
          { parentId },
          { $addToSet: { studentIds: studentId } },
        );
      } catch (parentError) {
        console.warn(
          "Could not update parent's studentIds:",
          parentError.message,
        );
      }
    }

    // Integrated Logging
    logActivity({
      schoolDb: getSchoolDbConnection(schoolDbName),
      schoolId,
      actor: req.user,
      action: "CREATE",
      entity: "Student",
      entityId: savedStudent.studentId,
      entityLabel: `${savedStudent.firstName} ${savedStudent.lastName}`,
      description: `Created new student: ${savedStudent.firstName} ${savedStudent.lastName} (${savedStudent.studentId})`
    });

    return res.status(201).json({
      success: true,
      message: "Student created successfully",
      data: {
        studentId: savedStudent.studentId,
        schoolId: savedStudent.schoolId,
        firstName: savedStudent.firstName,
        lastName: savedStudent.lastName,
        email: savedStudent.email,
        class: savedStudent.class,
        section: savedStudent.section,
        rollNumber: savedStudent.rollNumber,
        parentId: savedStudent.parentId,
        status: savedStudent.status,
      },
    });
  } catch (error) {
    console.error("Error creating student:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating student",
      error: error.message,
    });
  }
};

// Get student by studentId (with aggregated details)
const getStudentById = async (req, res) => {
  try {
    const { schoolId, id: studentId } = req.params;

    const schoolDbName = await getSchoolDbName(schoolId);
    if (!schoolDbName) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }

    const Student = getStudentModel(schoolDbName);
    const student = await Student.findOne({ studentId }).select("-password");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Convert to object to add additional fields
    const studentObj = student.toObject();

    // Fetch school details for schoolName, schoolAddress, schoolLogo
    const school = await School.findOne({ schoolId });
    if (school) {
      studentObj.schoolName = school.schoolName;
      studentObj.schoolAddress = school.schoolAddress || "";
      studentObj.schoolLogo = school.schoolLogo || "";
    }

    // Fetch class details for className and sectionName
    if (student.class) {
      const Class = getClassModel(schoolDbName);
      const classData = await Class.findOne({ classId: student.class });
      if (classData) {
        studentObj.className = classData.name;
        // Find section name from sections array
        if (student.section && classData.sections) {
          const section = classData.sections.find(
            (s) =>
              s.sectionId === student.section ||
              s._id?.toString() === student.section,
          );
          if (section) {
            studentObj.sectionName = section.name;
          }
        }
      }
    }

    // Fetch parent details for parentName and fatherName
    if (student.parentId) {
      const Parent = getParentModel(schoolDbName);
      const parent = await Parent.findOne({ parentId: student.parentId });
      if (parent) {
        studentObj.parentName = `${parent.firstName} ${parent.lastName}`;
        studentObj.parentRelationship = parent.relationship;

        // For fatherName, prioritize father > mother > guardian
        if (parent.relationship === "father") {
          studentObj.fatherName = `${parent.firstName} ${parent.lastName}`;
        } else {
          // Try to find father from all parents linked to this student
          const allParents = await Parent.find({
            studentIds: student.studentId,
          });
          const father = allParents.find((p) => p.relationship === "father");
          const mother = allParents.find((p) => p.relationship === "mother");
          const guardian = allParents.find(
            (p) => p.relationship === "guardian",
          );

          if (father) {
            studentObj.fatherName = `${father.firstName} ${father.lastName}`;
          } else if (mother) {
            studentObj.fatherName = `${mother.firstName} ${mother.lastName}`;
            studentObj.fatherNameLabel = "Mother's Name";
          } else if (guardian) {
            studentObj.fatherName = `${guardian.firstName} ${guardian.lastName}`;
            studentObj.fatherNameLabel = "Guardian's Name";
          } else {
            studentObj.fatherName = `${parent.firstName} ${parent.lastName}`;
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Student fetched successfully",
      data: studentObj,
    });
  } catch (error) {
    console.error("Error fetching student:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching student",
      error: error.message,
    });
  }
};

// Get all students in a school
const getAllStudents = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const {
      class: studentClass,
      section,
      status,
      parentId,
      classes,
    } = req.query;
    const userRole = req.user?.role;
    const userClasses = req.user?.classes; // Teacher's assigned classes from token

    const schoolDbName = await getSchoolDbName(schoolId);
    if (!schoolDbName) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }

    const Student = getStudentModel(schoolDbName);
    const Parent = getParentModel(schoolDbName);

    const query = {};

    // If teacher role, filter by their assigned classes only
    if (userRole === "teacher" && userClasses && userClasses.length > 0) {
      const allowedCombinations = userClasses.map(uc => {
        const [cls, sec] = uc.split('#');
        return sec ? { class: cls, section: sec } : { class: cls };
      });
      query.$or = allowedCombinations;
    }

    const sectionIdFilter = section || req.query.sectionId;
    const classIdFilter = studentClass || req.query.classId || classes;

    if (classIdFilter) {
      if (typeof classIdFilter === 'string' && classIdFilter.includes(',')) {
        const classArray = classIdFilter.split(",").map((c) => c.trim());
        query.class = { $in: classArray };
      } else {
        query.class = classIdFilter;
      }
    }

    if (sectionIdFilter) {
      if (query.class && typeof query.class === 'string') {
        const ClassModel = getClassModel(schoolDbName);
        const classDoc = await ClassModel.findOne({ classId: query.class }).lean();
        if (classDoc && classDoc.sections) {
          const target = classDoc.sections.find(s => 
            s.sectionId === sectionIdFilter || 
            s.name.toLowerCase() === sectionIdFilter.toLowerCase()
          );
          if (target) {
            query.section = { $in: [target.sectionId, target.name] };
          } else {
            query.section = sectionIdFilter;
          }
        } else {
          query.section = sectionIdFilter;
        }
      } else {
        query.section = sectionIdFilter;
      }
    }
    
    if (status) query.status = status;
    if (parentId) query.parentId = parentId;

    // Search filter (firstName, lastName, studentId, email, or parentName)
    if (req.query.search) {
      const search = req.query.search.trim();
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const searchRegex = new RegExp(escapedSearch, "i");

      // Find parent IDs matching the search term
      const matchingParents = await Parent.find({
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
        ],
      }).select("parentId");
      const matchingParentIds = matchingParents.map((p) => p.parentId).filter(Boolean);

      const searchConditions = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { studentId: searchRegex },
        { email: searchRegex },
      ];

      if (matchingParentIds.length > 0) {
        searchConditions.push({ parentId: { $in: matchingParentIds } });
      }

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

    const [students, total] = await Promise.all([
      Student.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Student.countDocuments(query),
    ]);

    // Get unique parent IDs to fetch parent details
    const parentIds = [
      ...new Set(students.filter((s) => s.parentId).map((s) => s.parentId)),
    ];

    // Fetch parent details
    const parents = await Parent.find({ parentId: { $in: parentIds } }).select(
      "parentId firstName lastName",
    );

    // Create a map for quick lookup
    const parentMap = {};
    parents.forEach((p) => {
      parentMap[p.parentId] = `${p.firstName} ${p.lastName}`;
    });

    // Get unique class IDs to fetch class details
    const classIds = [
      ...new Set(students.filter((s) => s.class).map((s) => s.class)),
    ];

    // Fetch class details with sections
    const Class = getClassModel(schoolDbName);
    const classData = await Class.find({ classId: { $in: classIds } }).select(
      "classId name sections",
    );

    // Create maps for class names and sections
    const classMap = {};
    const sectionMap = {}; // Use compound key: classId_sectionId
    classData.forEach((c) => {
      classMap[c.classId] = c.name;
      if (c.sections) {
        c.sections.forEach((s) => {
          sectionMap[`${c.classId}_${s.sectionId}`] = s.name;
        });
      }
    });

    // Add parentName, className, and sectionName to each student
    const studentsWithDetails = students.map((student) => {
      const studentObj = student.toObject();
      // Add parent name
      if (studentObj.parentId && parentMap[studentObj.parentId]) {
        studentObj.parentName = parentMap[studentObj.parentId];
      }
      // Add class name
      if (studentObj.class && classMap[studentObj.class]) {
        studentObj.className = classMap[studentObj.class];
      }
      // Add section name
      const sectionKey = `${studentObj.class}_${studentObj.section}`;
      if (sectionKey && sectionMap[sectionKey]) {
        studentObj.sectionName = sectionMap[sectionKey];
      }
      return studentObj;
    });

    const response = formatPaginationResponse(
      studentsWithDetails,
      total,
      page,
      limit,
    );

    return res.status(200).json({
      success: true,
      message: "Students fetched successfully",
      ...response,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching students",
      error: error.message,
    });
  }
};

// Update student by studentId
const updateStudentById = async (req, res) => {
  try {
    const { schoolId, id: studentId } = req.params;
    const updateData = req.body;

    // Prevent updating studentId, schoolId, and role
    delete updateData.studentId;
    delete updateData.schoolId;
    delete updateData.role;

    const schoolDbName = await getSchoolDbName(schoolId);
    if (!schoolDbName) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }

    const Student = getStudentModel(schoolDbName);

    // Get current student for parentId change handling
    const currentStudent = await Student.findOne({ studentId });
    if (!currentStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // If email is being updated, update EmailRegistry too
    if (updateData.email && updateData.email !== currentStudent.email) {
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
      if (currentStudent.email) {
        await EmailRegistry.findOneAndUpdate(
          { email: currentStudent.email.toLowerCase() },
          { email: normalizedEmail },
        );
      } else {
        // Create new entry if student didn't have email before
        await EmailRegistry.create({
          email: normalizedEmail,
          role: "student",
          schoolId: schoolId,
          userId: studentId,
          status: currentStudent.status || "active",
        });
      }

      updateData.email = normalizedEmail;
    }

    // If status is being updated, update EmailRegistry too
    if (updateData.status && currentStudent.email) {
      await EmailRegistry.findOneAndUpdate(
        { email: currentStudent.email.toLowerCase() },
        { status: updateData.status },
      );
    }

    const oldParentId = currentStudent.parentId;
    const newParentId = updateData.parentId;

    const updatedStudent = await Student.findOneAndUpdate(
      { studentId },
      updateData,
      {
        new: true,
        runValidators: true,
      },
    ).select("-password");

    // Handle bidirectional parent-student relationship update
    if (newParentId !== undefined && oldParentId !== newParentId) {
      const Parent = getParentModel(schoolDbName);

      // Remove from old parent's studentIds
      if (oldParentId) {
        await Parent.findOneAndUpdate(
          { parentId: oldParentId },
          { $pull: { studentIds: studentId } },
        );
      }

      // Add to new parent's studentIds
      if (newParentId) {
        await Parent.findOneAndUpdate(
          { parentId: newParentId },
          { $addToSet: { studentIds: studentId } },
        );
      }
    }

    // Integrated Logging
    logActivity({
      schoolDb: getSchoolDbConnection(schoolDbName),
      schoolId,
      actor: req.user,
      action: "UPDATE",
      entity: "Student",
      entityId: studentId,
      entityLabel: `${updatedStudent.firstName} ${updatedStudent.lastName}`,
      description: `Updated student record: ${updatedStudent.firstName} ${updatedStudent.lastName} (${studentId})`,
      metadata: { updateData }
    });

    return res.status(200).json({
      success: true,
      message: "Student updated successfully",
      data: updatedStudent,
    });
  } catch (error) {
    console.error("Error updating student:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating student",
      error: error.message,
    });
  }
};

// Delete student by studentId (soft delete - set status to inactive)
const deleteStudentById = async (req, res) => {
  try {
    const { schoolId, id: studentId } = req.params;

    const schoolDbName = await getSchoolDbName(schoolId);
    if (!schoolDbName) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }

    const Student = getStudentModel(schoolDbName);

    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const deletedStudent = await Student.findOneAndUpdate(
      { studentId },
      { status: "inactive" },
      { new: true },
    ).select("-password");

    // Update EmailRegistry status if student has email
    if (student.email) {
      await EmailRegistry.findOneAndUpdate(
        { email: student.email.toLowerCase() },
        { status: "inactive" },
      );
    }

    // Integrated Logging
    logActivity({
      schoolDb: getSchoolDbConnection(schoolDbName),
      schoolId,
      actor: req.user,
      action: "DELETE",
      entity: "Student",
      entityId: studentId,
      entityLabel: `${deletedStudent.firstName} ${deletedStudent.lastName}`,
      description: `Soft deleted student: ${deletedStudent.firstName} ${deletedStudent.lastName} (${studentId})`
    });

    return res.status(200).json({
      success: true,
      message: "Student deleted successfully (soft delete)",
      data: deletedStudent,
    });
  } catch (error) {
    console.error("Error deleting student:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting student",
      error: error.message,
    });
  }
};

const searchStudents = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { query: searchTerm } = req.query;

    if (!searchTerm || searchTerm.length < 2) {
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

    const Student = getStudentModel(schoolDbName);
    const { unlinkedOnly, currentParentId } = req.query;

    const mongoQuery = { status: "active" };
    const andConditions = [];

    // Apply filtering for already linked students if requested
    if (unlinkedOnly === "true") {
      const unlinkedConditions = [
        { parentId: { $exists: false } },
        { parentId: "" },
        { parentId: null },
      ];
      if (currentParentId) {
        unlinkedConditions.push({ parentId: currentParentId });
      }
      andConditions.push({ $or: unlinkedConditions });
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.trim();
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const searchRegex = new RegExp(escapedSearch, "i");

      const searchConditions = [
        { studentId: searchRegex },
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
      andConditions.push({ $or: searchConditions });
    }

    if (andConditions.length > 0) {
      mongoQuery.$and = andConditions;
    }

    const students = await Student.find(mongoQuery)
      .select("studentId firstName lastName email class section rollNumber")
      .limit(10);

    // Get unique class IDs to fetch class details
    const classIds = [
      ...new Set(students.filter((s) => s.class).map((s) => s.class)),
    ];

    // Fetch class details with sections
    const Class = getClassModel(schoolDbName);
    const classData = await Class.find({ classId: { $in: classIds } }).select(
      "classId name sections",
    );

    // Create maps for class names and sections
    const classMap = {};
    const sectionMap = {}; // Use compound key: classId_sectionId
    classData.forEach((c) => {
      classMap[c.classId] = c.name;
      if (c.sections) {
        c.sections.forEach((s) => {
          sectionMap[`${c.classId}_${s.sectionId}`] = s.name;
        });
      }
    });

    const studentsWithDetails = students.map((student) => {
      const studentObj = student.toObject();
      // Add class name
      if (studentObj.class && classMap[studentObj.class]) {
        studentObj.className = classMap[studentObj.class];
      }
      // Add section name
      const sectionKey = `${studentObj.class}_${studentObj.section}`;
      if (sectionKey && sectionMap[sectionKey]) {
        studentObj.sectionName = sectionMap[sectionKey];
      }
      return studentObj;
    });

    return res.status(200).json({
      success: true,
      data: studentsWithDetails,
      count: students.length,
    });
  } catch (error) {
    console.error("Error searching students:", error);
    return res.status(500).json({
      success: false,
      message: "Error searching students",
      error: error.message,
    });
  }
};

// Bulk create students from Excel upload
const bulkCreateStudents = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { students } = req.body;

    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: "students array is required and must not be empty",
      });
    }

    const schoolDbName = await getSchoolDbName(schoolId);
    if (!schoolDbName) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }

    const Student = getStudentModel(schoolDbName);
    const Parent = getParentModel(schoolDbName);
    const Class = getClassModel(schoolDbName);

    // Fetch all classes and parents for caching to avoid N+1 queries
    const [allClasses, allParents] = await Promise.all([
      Class.find().lean(),
      Parent.find().select("parentId firstName lastName email phone").lean(),
    ]);

    // Lookup helpers
    const findClass = (val) => {
      if (!val) return null;
      const search = String(val).trim().toLowerCase();
      return allClasses.find(
        (c) =>
          c.classId.toLowerCase() === search || c.name.toLowerCase() === search
      );
    };

    const findSection = (cls, val) => {
      if (!cls || !cls.sections || !val) return null;
      const search = String(val).trim().toLowerCase();
      return cls.sections.find(
        (s) =>
          s.sectionId.toLowerCase() === search || s.name.toLowerCase() === search
      );
    };

    const findParent = (val) => {
      if (!val) return null;
      const search = String(val).trim().toLowerCase();
      return allParents.find(
        (p) =>
          p.parentId.toLowerCase() === search ||
          (p.phone && String(p.phone).toLowerCase() === search) ||
          (p.email && p.email.toLowerCase() === search)
      );
    };

    // Create backup snapshot before bulk operation
    try {
      const currentStudents = await Student.find().lean();
      await createBackup(schoolDbName, "students", currentStudents, {
        performedBy: req.user?.userId || "system",
        performedByRole: req.user?.role || "",
        operationType: "bulk_insert",
        description: `Before bulk student upload of ${students.length} records`,
      });
    } catch (backupErr) {
      console.warn("Bulk upload: Backup creation failed, but proceeding:", backupErr.message);
    }

    let inserted = 0;
    let failed = 0;
    const errors = [];

    for (let i = 0; i < students.length; i++) {
      const row = students[i];
      const rowNum = i + 2; // Excel row number (1-indexed header + 1)

      try {
        // Validate required fields
        if (!row.firstName || !row.lastName || !row.password || !row.class) {
          errors.push({
            row: rowNum,
            message: "Missing required fields: firstName, lastName, password, class",
          });
          failed++;
          continue;
        }

        // --- Smart Lookups ---
        const targetClass = findClass(row.class);
        if (!targetClass) {
          errors.push({
            row: rowNum,
            message: `Class "${row.class}" not found. Please provide a valid Class Name or ID.`,
          });
          failed++;
          continue;
        }

        let sectionId = undefined;
        if (row.section) {
          const targetSection = findSection(targetClass, row.section);
          if (!targetSection) {
            errors.push({
              row: rowNum,
              message: `Section "${row.section}" not found in class "${targetClass.name}".`,
            });
            failed++;
            continue;
          }
          sectionId = targetSection.sectionId;
        }

        let parentId = undefined;
        if (row.parentId) {
          const targetParent = findParent(row.parentId);
          if (!targetParent) {
            errors.push({
              row: rowNum,
              message: `Parent "${row.parentId}" not found. Provide a valid Parent ID, Phone, or Email.`,
            });
            failed++;
            continue;
          }
          parentId = targetParent.parentId;
        }
        // ---------------------

        // Check email uniqueness globally
        let emailVal = row.email;
        if (typeof emailVal === "object" && emailVal !== null && emailVal.text) {
          emailVal = emailVal.text;
        }

        const normalizedEmail = emailVal
          ? String(emailVal).toLowerCase().trim()
          : undefined;

        if (normalizedEmail) {
          const existingEmail = await EmailRegistry.findOne({
            email: normalizedEmail,
          });
          if (existingEmail) {
            errors.push({
              row: rowNum,
              message: `Email "${normalizedEmail}" already exists in the system`,
            });
            failed++;
            continue;
          }
        }

        // Generate studentId
        const studentId = await generateStudentId(Student);

        const newStudent = new Student({
          studentId,
          schoolId,
          firstName: String(row.firstName).trim(),
          lastName: String(row.lastName).trim(),
          email: normalizedEmail,
          password: String(row.password), // Plain text (matches existing createStudent behavior)
          phone: row.phone ? String(row.phone).trim() : undefined,
          class: targetClass.classId, // Store ID
          section: sectionId, // Store ID
          rollNumber: row.rollNumber ? String(row.rollNumber).trim() : undefined,
          parentId: parentId, // Store ID
          dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : undefined,
          gender: row.gender ? String(row.gender).trim().toLowerCase() : undefined,
          address: row.address ? String(row.address).trim() : undefined,
          status: row.status ? String(row.status).trim().toLowerCase() : "active",
        });

        const savedStudent = await newStudent.save();

        // Register in EmailRegistry
        if (normalizedEmail) {
          await EmailRegistry.create({
            email: normalizedEmail,
            role: "student",
            schoolId,
            userId: savedStudent.studentId,
            status: savedStudent.status || "active",
          });
        }

        // Link parent if provided
        if (parentId) {
          try {
            await Parent.findOneAndUpdate(
              { parentId: parentId },
              { $addToSet: { studentIds: studentId } }
            );
          } catch (parentErr) {
            // Non-blocking - student is still created
            console.warn(
              `Row ${rowNum}: Could not link parent ${parentId}:`,
              parentErr.message
            );
          }
        }

        inserted++;
      } catch (rowError) {
        errors.push({
          row: rowNum,
          message: rowError.message || "Unknown error",
        });
        failed++;
      }
    }

    return res.status(200).json({
      success: true,
      message: `Bulk upload completed: ${inserted} inserted, ${failed} failed`,
      data: { inserted, failed, total: students.length, errors },
    });
  } catch (error) {
    console.error("Error bulk creating students:", error);
    return res.status(500).json({
      success: false,
      message: "Error bulk creating students",
      error: error.message,
    });
  }
};

// Get student backups (Backend only for now)
const getStudentBackups = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const schoolDbName = await getSchoolDbName(schoolId);
    if (!schoolDbName) {
      return res.status(404).json({ success: false, message: "School not found" });
    }

    const backups = await getBackups(schoolDbName, "students");

    return res.status(200).json({
      success: true,
      message: "Student backups fetched successfully",
      data: backups,
    });
  } catch (error) {
    console.error("Error fetching student backups:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching student backups",
      error: error.message,
    });
  }
};

// Restore student backup (Backend only for now)
const restoreStudentBackup = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { batchId } = req.body;

    if (!batchId) {
      return res.status(400).json({ success: false, message: "batchId is required" });
    }

    const schoolDbName = await getSchoolDbName(schoolId);
    if (!schoolDbName) {
      return res.status(404).json({ success: false, message: "School not found" });
    }

    const Student = getStudentModel(schoolDbName);

    const result = await restoreBackup(schoolDbName, "students", batchId, Student, {
      performedBy: req.user?.userId || "system",
    });

    return res.status(200).json({
      success: true,
      message: `Successfully restored ${result.restoredCount} student records`,
      data: result,
    });
  } catch (error) {
    console.error("Error restoring student backup:", error);
    return res.status(500).json({
      success: false,
      message: "Error restoring student backup",
      error: error.message,
    });
  }
};

module.exports = {
  createStudent,
  getStudentById,
  getAllStudents,
  updateStudentById,
  deleteStudentById,
  searchStudents,
  bulkCreateStudents,
  getStudentBackups,
  restoreStudentBackup,
};
