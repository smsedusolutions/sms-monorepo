const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("./schoolDbHelper");
const {
  NotificationSchema: notificationSchema,
  StudentSchema: studentSchema,
  ParentSchema: parentSchema,
} = require("@sms/shared");
const { dispatchRealtimePush } = require("../controllers/notification.controller");

const generateNotificationId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `NOTIF${timestamp}${random}`.toUpperCase();
};

/**
 * Dispatch absence alert notifications to parents and students in real-time
 * @param {string} schoolId - The school identifier
 * @param {Array<{studentId: string, status: string, remarks?: string}>} absentRecords - List of absent student records
 * @param {string} [classId] - Optional class identifier
 * @param {Date} [date] - Attendance date
 * @param {string} [context] - "daily" | "period"
 */
const sendAbsenceAlerts = async (schoolId, absentRecords, classId, date, context = "daily") => {
  try {
    if (!absentRecords || absentRecords.length === 0) return;

    const studentIds = absentRecords.map((r) => r.studentId).filter(Boolean);
    if (studentIds.length === 0) return;

    const schoolDbName = await getSchoolDbName(schoolId);
    const schoolDb = getSchoolDbConnection(schoolDbName);

    const Notification = schoolDb.models.Notification || schoolDb.model("Notification", notificationSchema);
    const Student = schoolDb.models.Student || schoolDb.model("Student", studentSchema);
    const Parent = schoolDb.models.Parent || schoolDb.model("Parent", parentSchema);

    // Fetch students
    const students = await Student.find(
      { schoolId, studentId: { $in: studentIds } },
      "studentId firstName lastName parentId class section email"
    ).lean();

    if (students.length === 0) return;

    // Fetch parents of these students
    const directParentIds = students.map((s) => s.parentId).filter(Boolean);
    const parents = await Parent.find(
      {
        schoolId,
        $or: [
          { parentId: { $in: directParentIds } },
          { studentIds: { $in: studentIds } },
        ],
      },
      "parentId firstName lastName studentIds email phone"
    ).lean();

    const parentMapByStudentId = new Map();
    parents.forEach((p) => {
      if (Array.isArray(p.studentIds)) {
        p.studentIds.forEach((sId) => parentMapByStudentId.set(sId, p));
      }
      if (p.parentId) {
        // Also map by direct parentId
        students.forEach((s) => {
          if (s.parentId === p.parentId) {
            parentMapByStudentId.set(s.studentId, p);
          }
        });
      }
    });

    const formattedDate = date
      ? new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
      : "today";

    const notificationsToInsert = [];

    students.forEach((student) => {
      const studentName = `${student.firstName} ${student.lastName || ""}`.trim();
      const parent = parentMapByStudentId.get(student.studentId);

      const title = `Absence Alert: ${studentName}`;
      const message =
        context === "period"
          ? `${studentName} was marked absent for period attendance on ${formattedDate}.`
          : `${studentName} was marked absent for daily attendance on ${formattedDate}.`;

      // 1. Notification for Parent
      if (parent && parent.parentId) {
        notificationsToInsert.push({
          notificationId: generateNotificationId(),
          schoolId,
          userId: parent.parentId,
          userRole: "parent",
          type: "absence_alert",
          title,
          message,
          referenceId: student.studentId,
          referenceType: "attendance",
          isRead: false,
          metadata: {
            studentId: student.studentId,
            studentName,
            date: date || new Date(),
            context,
          },
        });
      }

      // 2. Notification for Student
      notificationsToInsert.push({
        notificationId: generateNotificationId(),
        schoolId,
        userId: student.studentId,
        userRole: "student",
        type: "absence_alert",
        title: "Attendance Notice",
        message: `You were marked absent on ${formattedDate}. Please contact your class teacher if this was an error.`,
        referenceId: student.studentId,
        referenceType: "attendance",
        isRead: false,
        metadata: {
          studentId: student.studentId,
          date: date || new Date(),
          context,
        },
      });
    });

    if (notificationsToInsert.length > 0) {
      await Notification.insertMany(notificationsToInsert);
      console.log(
        `📢 [AbsenceAlert] Created ${notificationsToInsert.length} absence notifications for ${students.length} student(s)`
      );
      // Dispatch in real-time to WebSocket clients and background Web Push
      dispatchRealtimePush(notificationsToInsert);
    }
  } catch (error) {
    console.error("❌ [AbsenceAlert] Error dispatching absence notifications:", error);
  }
};

module.exports = {
  sendAbsenceAlerts,
};
