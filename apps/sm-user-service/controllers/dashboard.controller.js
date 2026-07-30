const { getSchoolDbConnection } = require("../configs/db");
const {
  SchoolModel: School,
  TeacherSchema: teacherSchema,
  StudentSchema: studentSchema,
  ParentSchema: parentSchema,
  MenuModel: menuModel,
} = require("@sms/shared");

// Get school database name by schoolId
const getSchoolDbName = async (schoolId) => {
  const school = await School.findOne({ schoolId });
  if (!school) {
    throw new Error("School not found");
  }
  return school.schoolDbName;
};

// Get model for a specific school database
const getModel = async (schoolDbName, modelName, schema) => {
  const schoolDb = await getSchoolDbConnection(schoolDbName);
  return schoolDb.model(modelName, schema);
};

// Get dashboard stats for a school
const getSchoolDashboardStats = async (req, res) => {
  try {
    const { schoolId } = req.params;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required",
      });
    }

    const schoolDbName = await getSchoolDbName(schoolId);

    const Teacher = await getModel(schoolDbName, "Teacher", teacherSchema);
    const Student = await getModel(schoolDbName, "Student", studentSchema);
    const Parent = await getModel(schoolDbName, "Parent", parentSchema);

    // Get counts
    const totalTeachers = await Teacher.countDocuments();
    const activeTeachers = await Teacher.countDocuments({ status: "active" });

    const totalStudents = await Student.countDocuments();
    const activeStudents = await Student.countDocuments({ status: "active" });

    const totalParents = await Parent.countDocuments();
    const activeParents = await Parent.countDocuments({ status: "active" });

    res.status(200).json({
      success: true,
      data: {
        totalTeachers,
        activeTeachers,
        totalStudents,
        activeStudents,
        totalParents,
        activeParents,
      },
    });
  } catch (error) {
    console.error("Error getting school dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get dashboard stats",
      error: error.message,
    });
  }
};

const getMenus = async (req, res) => {
  try {
    const { role, schoolId } = req.params;
    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required",
      });
    }

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role is required to fetch menus",
      });
    }

    const menus = await menuModel.find(
      {
        menuAccessRoles: { $in: [role] },
        schoolId: { $in: [schoolId] },
        status: "active",
        deactivatedRoles: { $nin: [role] },
        deactivatedSchools: { $nin: [schoolId] },
      },
      { menuAccessRoles: 0 },
    );

    // Sort in memory because we need to find the specific order code in the array relevant to the role
    // Determine prefix for this role
    let prefix = "M";
    const r = role.toLowerCase();
    if (r === "super_admin") prefix = "SA";
    else if (r === "school_admin" || r === "sch_admin") prefix = "A";
    else if (r === "teacher") prefix = "T";
    else if (r === "parent") prefix = "P";
    else if (r === "student") prefix = "S";

    // Helper to extract numeric value from order string specific to this role
    // e.g. "SA1.2" -> 1.2 -> value calculation for sorting
    // Or simply localeCompare if structure is consistent.
    const getRoleOrder = (menu) => {
      const orders = Array.isArray(menu.menuOrder)
        ? menu.menuOrder
        : [menu.menuOrder];
      // Find code starting with prefix followed by a digit (to avoid S matching SA)
      const regex = new RegExp(`^${prefix}\\d`);
      const code = orders.find((o) => regex.test(String(o)));
      return code || "Z99999"; // Fallback to end if no code found
    };

    const sortedMenus = menus.sort((a, b) => {
      const orderA = getRoleOrder(a);
      const orderB = getRoleOrder(b);
      return orderA.localeCompare(orderB, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });

    return res.status(200).json({
      success: true,
      message: "Menus fetched successfully",
      data: sortedMenus,
      count: sortedMenus.length,
    });
  } catch (error) {
    console.error("Error fetching menus:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch menus",
      error: error.message,
    });
  }
};

// Get Teacher Dashboard Stats
const getTeacherDashboardStats = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { teacherId } = req.user;

    if (!schoolId || !teacherId) {
      return res.status(400).json({
        success: false,
        message: "School ID and Teacher ID are required",
      });
    }

    const schoolDbName = await getSchoolDbName(schoolId);
    const schoolDb = await getSchoolDbConnection(schoolDbName);

    // Models
    const Class = schoolDb.models.Class || schoolDb.model("Class", require("@sms/shared").ClassSchema);
    const Teacher = schoolDb.models.Teacher || schoolDb.model("Teacher", teacherSchema);
    const Student = schoolDb.models.Student || schoolDb.model("Student", studentSchema);
    const Subject = schoolDb.models.Subject || schoolDb.model("Subject", require("@sms/shared").SubjectSchema);
    const TimetableEntry = schoolDb.models.TimetableEntry || schoolDb.model("TimetableEntry", require("@sms/shared").TimetableEntrySchema);
    const Attendance = schoolDb.models.Attendance || schoolDb.model("Attendance", require("@sms/shared").AttendanceSimpleSchema);
    const Homework = schoolDb.models.Homework || schoolDb.model("Homework", require("@sms/shared").HomeworkSchema);
    const LeaveRequest = schoolDb.models.LeaveRequest || schoolDb.model("LeaveRequest", require("@sms/shared").LeaveRequestSchema);
    const Announcement = schoolDb.models.Announcement || schoolDb.model("Announcement", require("@sms/shared").AnnouncementSchema);

    // 1. Get Teacher Classes & Students
    const teacher = await Teacher.findOne({ teacherId }).select("classes sections classTeacherSectionId");
    const rawTeacherClasses = teacher?.classes || [];
    const rawTeacherSections = teacher?.sections || [];
    const classTeacherSectionId = teacher?.classTeacherSectionId || "";

    const classTeacherClasses = await Class.find({ "sections.classTeacherId": teacherId }).select("classId sections");
    const allTimetableEntries = await TimetableEntry.find({ schoolId, teacherId, status: "active" }).select("classId sectionId");

    // Collect assigned classes and their specific assigned sections (if any)
    const classAssignedMap = {}; // classId -> Set of sectionIds

    const addAssignment = (clsId, secId) => {
      if (!clsId) return;
      if (!classAssignedMap[clsId]) classAssignedMap[clsId] = new Set();
      if (secId && secId !== clsId) {
        classAssignedMap[clsId].add(secId);
      }
    };

    // Process teacher.classes
    rawTeacherClasses.forEach((item) => {
      const [clsId, secId] = item.split('#');
      addAssignment(clsId, secId);
    });

    // Process teacher.sections
    rawTeacherSections.forEach((item) => {
      const [clsId, secId] = item.split('#');
      addAssignment(clsId || item, secId || item);
    });

    // Process classTeacherSectionId
    if (classTeacherSectionId) {
      const [clsId, secId] = classTeacherSectionId.split('#');
      addAssignment(clsId, secId);
    }

    // Process classTeacherClasses
    classTeacherClasses.forEach((c) => {
      c.sections?.forEach((s) => {
        if (s.classTeacherId === teacherId) {
          addAssignment(c.classId, s.sectionId);
        }
      });
    });

    // Process timetableEntries (only if sectionId exists)
    allTimetableEntries.forEach((e) => {
      if (e.classId && e.sectionId) {
        addAssignment(e.classId, e.sectionId);
      }
    });

    const allClassIds = Object.keys(classAssignedMap);
    const totalClasses = allClassIds.length;

    // Build precise query for Student count matching teacher's assigned classes & sections
    const studentQueryConditions = [];
    allClassIds.forEach((clsId) => {
      const secSet = classAssignedMap[clsId];
      if (secSet && secSet.size > 0) {
        studentQueryConditions.push({ class: clsId, section: { $in: Array.from(secSet) } });
      } else {
        studentQueryConditions.push({ class: clsId });
      }
    });

    const totalStudents = studentQueryConditions.length > 0
      ? await Student.countDocuments({
          status: "active",
          $or: studentQueryConditions,
        })
      : 0;

    // 2. Today's Schedule (Timetable)
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const today = days[new Date().getDay()];
    
    // Fetch active timetable config to handle breaks and extract actual times
    const TimetableConfig = schoolDb.models.TimetableConfig || schoolDb.model("TimetableConfig", require("@sms/shared").TimetableConfigSchema);
    const timetableConfig = await TimetableConfig.findOne({ schoolId, status: "active" });
    
    // Create period mapping (Skip breaks, lunch, assembly)
    const periodMap = {};
    if (timetableConfig && timetableConfig.periods) {
      let instructionalCount = 0;
      // Sort periods by number just in case they aren't
      const sortedPeriods = [...timetableConfig.periods].sort((a, b) => a.periodNumber - b.periodNumber);
      
      sortedPeriods.forEach(p => {
        if (!["break", "lunch", "assembly"].includes(p.type)) {
          instructionalCount++;
          periodMap[p.periodNumber] = {
            displayNumber: instructionalCount,
            time: `${p.startTime} - ${p.endTime}`,
            name: p.name
          };
        }
      });
    }
    
    const timetableEntries = await TimetableEntry.find({
      schoolId,
      teacherId,
      dayOfWeek: today,
      status: "active"
    }).sort({ periodNumber: 1 });

    const scheduleWithDetails = await Promise.all(timetableEntries.map(async (entry) => {
      const subject = await Subject.findOne({ subjectId: entry.subjectId }).select("name");
      const classInfo = await Class.findOne({ classId: entry.classId }).select("name sections");
      const sectionName = classInfo?.sections?.find(s => s.sectionId === entry.sectionId)?.name || "";
      
      const periodInfo = periodMap[entry.periodNumber];
      
      return {
        time: periodInfo?.time || `${entry.periodNumber}:00`,
        subject: subject?.name || "Subject",
        class: `${classInfo?.name || "Class"}-${sectionName || "Section"}`,
        periodNumber: periodInfo?.displayNumber || entry.periodNumber,
        periodName: periodInfo?.name || "Period"
      };
    }));

    const periodsToday = scheduleWithDetails.length;

    // 3. Today's Attendance Stats
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    const attendanceQueryConditions = [];
    allClassIds.forEach((clsId) => {
      const secSet = classAssignedMap[clsId];
      if (secSet && secSet.size > 0) {
        attendanceQueryConditions.push({ classId: clsId, sectionId: { $in: Array.from(secSet) } });
      } else {
        attendanceQueryConditions.push({ classId: clsId });
      }
    });

    const attendanceRecords = attendanceQueryConditions.length > 0
      ? await Attendance.find({
          schoolId,
          date: todayDate,
          $or: attendanceQueryConditions,
        })
      : [];

    let attendancePercentage = "Not Marked";
    if (attendanceRecords.length > 0) {
      const presentCount = attendanceRecords.filter(r => ["present", "late", "half_day"].includes(r.status)).length;
      attendancePercentage = `${Math.round((presentCount / attendanceRecords.length) * 100)}%`;
    }

    // 4. Pending Leave Requests
    let pendingLeaveRequests = 0;
    try {
      pendingLeaveRequests = await LeaveRequest.countDocuments({
        status: "pending",
        approverType: "teacher",
        approverId: teacherId,
      });
    } catch (error) {
      console.log("Leave data not available");
    }

    // 5. Total Announcements
    let totalAnnouncements = 0;
    try {
      totalAnnouncements = await Announcement.countDocuments({ createdBy: teacherId });
    } catch (error) {
      console.log("Announcement data not available");
    }

    // 6. Pending Tasks (Homework + Unmarked Attendance)
    const pendingTasks = await Homework.find({
      teacherId,
      status: "active",
      dueDate: { $gte: new Date() }
    }).sort({ dueDate: 1 }).limit(5);

    const formattedPendingTasks = pendingTasks.map(t => ({
      task: `Homework: ${t.title}`,
      deadline: t.dueDate,
      priority: new Date(t.dueDate) - new Date() < 86400000 ? "high" : "medium" // Less than 24h = high
    }));

    if (attendanceRecords.length === 0 && allClassIds.length > 0) {
      formattedPendingTasks.unshift({
        task: "Mark Today's Student Attendance",
        deadline: new Date(),
        priority: "high"
      });
    }

    res.status(200).json({
      success: true,
      data: {
        totalClasses,
        totalStudents,
        periodsToday,
        pendingLeaveRequests,
        totalAnnouncements,
        attendancePercentage,
        todaySchedule: scheduleWithDetails,
        pendingTasks: formattedPendingTasks
      },
    });
  } catch (error) {
    console.error("Error getting teacher dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get teacher dashboard stats",
      error: error.message,
    });
  }
};

module.exports = {
  getMenus,
  getSchoolDashboardStats,
  getTeacherDashboardStats,
};
