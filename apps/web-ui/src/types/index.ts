export interface Pagination {
  total?: number;
  totalRecords?: number;
  page?: number;
  currentPage?: number;
  limit: number;
  totalPages?: number;
  pages?: number;
}

// Common API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  count?: number;
  pagination?: Pagination;
}

// School Types
export interface SchoolLoginTheme {
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  fontFamily?: string;
  customLoginHtml?: string;
}

export interface School {
  schoolId: string;
  schoolName: string;
  schoolLogo?: string;
  schoolDbName: string;
  status: "active" | "inactive";
  schoolAddress?: string;
  schoolEmail?: string;
  schoolContact?: string;
  schoolWebsite?: string;
  schoolTagline?: string;
  subdomain?: string;
  loginTheme?: SchoolLoginTheme;
  location?: {
    latitude: number;
    longitude: number;
    radiusMeters: number;
  };
  attendanceSettings?: {
    mode: "simple" | "period_wise" | "check_in_out";
    workingHours: {
      start: string;
      end: string;
    };
    lateThresholdMinutes: number;
    halfDayThresholdMinutes: number;
    periodsPerDay: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSchoolPayload {
  schoolName: string;
  schoolLogo?: string;
  dbName: string;
  schoolAddress?: string;
  schoolEmail?: string;
  schoolContact?: string;
  schoolWebsite?: string;
  schoolTagline?: string;
  subdomain?: string;
  loginTheme?: {
    primaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    fontFamily?: string;
    customLoginHtml?: string;
  };
  attendanceSettings?: {
    mode?: "simple" | "period_wise" | "check_in_out";
    workingHours?: {
      start?: string;
      end?: string;
    };
    lateThresholdMinutes?: number;
    halfDayThresholdMinutes?: number;
    periodsPerDay?: number;
  };
}

export interface UpdateSchoolPayload {
  schoolName?: string;
  schoolLogo?: string;
  status?: "active" | "inactive";
  schoolAddress?: string;
  schoolEmail?: string;
  schoolContact?: string;
  schoolWebsite?: string;
  schoolTagline?: string;
  subdomain?: string;
  loginTheme?: {
    primaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    fontFamily?: string;
    customLoginHtml?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    radiusMeters: number;
  };
  attendanceSettings?: {
    mode?: "simple" | "period_wise" | "check_in_out";
    workingHours?: {
      start?: string;
      end?: string;
    };
    lateThresholdMinutes?: number;
    halfDayThresholdMinutes?: number;
    periodsPerDay?: number;
  };
}

// Admin Types (Super Admin)
export interface Admin {
  adminId: string;
  username: string;
  email: string;
  role: "super_admin";
  status?: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAdminPayload {
  username: string;
  email: string;
  password: string;
}

// School Admin (sch_admin) Types
export interface SchoolAdmin {
  userId: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: "sch_admin";
  schoolId: string;
  schoolName?: string;
  phone?: string;
  phoneNumber?: string;
  contactNumber?: string;
  profileImage?: string;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSchoolAdminPayload {
  username: string;
  email: string;
  password: string;
  schoolId: string;
  contactNumber?: string;
}

export interface UpdateSchoolAdminPayload {
  username?: string;
  email?: string;
  password?: string;
  contactNumber?: string;
  profileImage?: string;
  status?: "active" | "inactive";
}

// Teacher Types
export interface Teacher {
  _id?: string;
  userId?: string;
  teacherId: string;
  schoolId: string;
  schoolName?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  phoneNumber?: string;
  subjects: string[];
  subjectNames?: string[];
  classes: string[];
  classNames?: string[];
  department?: string;
  status: "active" | "inactive";
  profileImage?: string;
  signature?: string;
  classTeacherSectionId?: string | null;
  classTeacherLabel?: string | null;
  sections: string[];
  sectionNames?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTeacherPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  subjects?: string[];
  classes?: string[];       // stores classId#sectionId pairs
  status?: "active" | "inactive";
  profileImage?: string;
  signature?: string;
}

export interface UpdateTeacherPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  phone?: string;
  subjects?: string[];
  classes?: string[];       // stores classId#sectionId pairs
  status?: "active" | "inactive";
  profileImage?: string;
  signature?: string;
}

// Student Types
export interface Student {
  studentId: string;
  schoolId: string;
  schoolName?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
  class: string;
  className?: string;
  section?: string;
  sectionName?: string;
  rollNumber?: string;
  parentId?: string;
  parentName?: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
  address?: string;
  status: "active" | "inactive";
  profileImage?: string;
  signature?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateStudentPayload {
  firstName: string;
  lastName: string;
  email?: string;
  password: string;
  phone?: string;
  class: string;
  section?: string;
  rollNumber?: string;
  parentId?: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
  address?: string;
  status?: "active" | "inactive";
  profileImage?: string;
  signature?: string;
}

export interface UpdateStudentPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  phone?: string;
  class?: string;
  section?: string;
  rollNumber?: string;
  parentId?: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
  address?: string;
  status?: "active" | "inactive";
  profileImage?: string;
  signature?: string;
}

export interface Parent {
  parentId: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  studentIds: string[];
  relationship: "father" | "mother" | "guardian" | "other";
  occupation?: string;
  address?: string;
  status: "active" | "inactive";
  profileImage?: string;
  signature?: string;
  childrenNames?: string[];
  childrenDetails?: {
    studentId: string;
    name: string;
    classSection?: string;
    profileImage?: string;
  }[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateParentPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  studentIds?: string[];
  relationship: "father" | "mother" | "guardian" | "other";
  occupation?: string;
  address?: string;
  status?: "active" | "inactive";
  profileImage?: string;
  signature?: string;
}

export interface UpdateParentPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  phone?: string;
  studentIds?: string[];
  relationship?: "father" | "mother" | "guardian" | "other";
  occupation?: string;
  address?: string;
  status?: "active" | "inactive";
  profileImage?: string;
  signature?: string;
}

// Query Filter Types
export interface TeacherFilters {
  status?: "active" | "inactive";
  department?: string;
  page?: number;
  limit?: number;
  search?: string;
}


export interface StudentFilters {
  class?: string;
  section?: string;
  status?: "active" | "inactive";
  parentId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ParentFilters {
  status?: "active" | "inactive";
  relationship?: "father" | "mother" | "guardian" | "other";
  search?: string;
  class?: string;
  page?: number;
  limit?: number;
}

// Request/Ticket Types
export interface Request {
  requestId: string;
  userType: "teacher" | "student" | "parent" | "sch_admin";
  userId: string;
  userName: string;
  requestType: "email_change" | "phone_change" | "signature_change" | "general";
  oldValue?: string;
  newValue?: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  adminReply?: string;
  attachmentUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRequestPayload {
  userType: "teacher" | "student" | "parent" | "sch_admin";
  userId: string;
  userName: string;
  requestType: "email_change" | "phone_change" | "signature_change" | "general";
  oldValue?: string;
  newValue?: string;
  message: string;
  attachmentUrl?: string;
}

export interface UpdateRequestPayload {
  status: "pending" | "approved" | "rejected";
  adminReply?: string;
}

export interface RequestFilters {
  status?: "pending" | "approved" | "rejected";
  userType?: "teacher" | "student" | "parent" | "sch_admin";
}

// Section Types (nested in Class)
export interface Section {
  sectionId: string;
  name: string;
  classTeacherId?: string;
}

// Class Types
export interface Class {
  classId: string;
  schoolId: string;
  name: string;
  description?: string;
  sections: Section[];
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateClassPayload {
  name: string;
  description?: string;
  sections?: { name: string; classTeacherId?: string }[];
}

export interface UpdateClassPayload {
  name?: string;
  description?: string;
  status?: "active" | "inactive";
}

export interface AddSectionPayload {
  name: string;
  classTeacherId?: string;
}

export interface AssignClassTeacherPayload {
  teacherId: string | null;
}

export interface ClassFilters {
  status?: "active" | "inactive";
}

export interface Subject {
  _id?: string;
  subjectId: string;
  schoolId: string;
  name: string;
  code: string;
  description?: string;
  status: "active" | "inactive";
  assignedTeacherName?: string;
  assignedTeacherId?: string;
  assignedTeacherIds?: string[];
  classId?: string;
  isSubSubject?: boolean;
  parentSubjectId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSubjectPayload {
  name: string;
  code: string;
  description?: string;
  classId?: string;
  isSubSubject?: boolean;
  parentSubjectId?: string | null;
}

export interface UpdateSubjectPayload {
  name?: string;
  code?: string;
  description?: string;
  status?: "active" | "inactive";
  classId?: string;
  isSubSubject?: boolean;
  parentSubjectId?: string | null;
}

export interface SubjectFilters {
  status?: "active" | "inactive";
  classId?: string;
  sectionId?: string;
  search?: string;
}


// ==========================================
// ATTENDANCE TYPES
// ==========================================

// Attendance Modes
export type AttendanceMode = "simple" | "period_wise" | "check_in_out";

// Attendance Status
export type AttendanceStatus =
  | "present"
  | "absent"
  | "late"
  | "half_day"
  | "leave"
  | "pending";

// School Attendance Settings
export interface AttendanceSettings {
  mode: AttendanceMode;
  workingHours: {
    start: string;
    end: string;
  };
  lateThresholdMinutes: number;
  halfDayThresholdMinutes: number;
  periodsPerDay: number;
}

// Simple Daily Attendance
export interface AttendanceSimple {
  attendanceId: string;
  schoolId: string;
  classId: string;
  sectionId?: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
  markedBy: string;
  markedByRole: "teacher" | "sch_admin";
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Period-wise Attendance
export interface AttendancePeriod {
  attendanceId: string;
  schoolId: string;
  classId: string;
  sectionId?: string;
  studentId: string;
  date: string;
  period: number;
  subjectId: string;
  teacherId: string;
  status: "present" | "absent" | "late";
  markedBy: string;
  isSubstitute: boolean;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Check-In/Check-Out Attendance
export interface AttendanceCheckin {
  logId: string;
  schoolId: string;
  userId: string;
  userType: "student" | "teacher";
  classId?: string;
  sectionId?: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  checkInMethod: "manual" | "biometric" | "rfid" | "app";
  checkOutMethod?: "manual" | "biometric" | "rfid" | "app";
  totalMinutes: number;
  status: AttendanceStatus;
  markedBy?: string;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Teacher Attendance
export interface TeacherAttendance {
  attendanceId: string;
  schoolId: string;
  teacherId: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: AttendanceStatus;
  leaveType?: "casual" | "sick" | "earned" | "unpaid" | "other";
  totalMinutes: number;
  markedBy: string;
  markedByRole: "teacher" | "sch_admin";
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Payloads for marking attendance
export interface MarkSimpleAttendancePayload {
  classId: string;
  sectionId?: string;
  date?: string;
  attendanceRecords: {
    studentId: string;
    status: AttendanceStatus;
    remarks?: string;
  }[];
}

export interface MarkPeriodAttendancePayload {
  classId: string;
  sectionId?: string;
  date?: string;
  period: number;
  subjectId: string;
  teacherId: string;
  isSubstitute?: boolean;
  attendanceRecords: {
    studentId: string;
    status: "present" | "absent" | "late";
    remarks?: string;
  }[];
}

export interface CheckInPayload {
  userId: string;
  userType: "student" | "teacher";
  classId?: string;
  sectionId?: string;
  method?: "manual" | "biometric" | "rfid" | "app";
}

export interface MarkTeacherAttendancePayload {
  date?: string;
  attendanceRecords: {
    teacherId: string;
    status: AttendanceStatus;
    leaveType?: "casual" | "sick" | "earned" | "unpaid" | "other";
    remarks?: string;
  }[];
}

// Attendance Summary
export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  leave: number;
  percentage?: string;
}

// Report Types
export interface DailyReport {
  date: string;
  mode: AttendanceMode;
  students: {
    attendance: AttendanceSimple[] | AttendancePeriod[] | AttendanceCheckin[];
    summary: AttendanceSummary;
  };
  teachers: {
    attendance: TeacherAttendance[];
    summary: AttendanceSummary;
  };
}

export interface MonthlyReportStudent {
  studentId: string;
  studentName?: string;
  rollNumber?: string;
  classId: string;
  className?: string;
  sectionId?: string;
  sectionName?: string;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  leave: number;
  total: number;
  percentage: string;
}

export interface MonthlyReportTeacher {
  teacherId: string;
  teacherName?: string;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  leave: number;
  total: number;
  percentage: string;
}

export interface MonthlyReport {
  year: number;
  month: number;
  startDate: string;
  endDate: string;
  students?: {
    byStudent: MonthlyReportStudent[];
    totalRecords: number;
    workingDays: number;
  };
  teachers?: {
    byTeacher: MonthlyReportTeacher[];
    totalRecords: number;
    workingDays: number;
  };
}

export interface ClassWiseReport {
  classId: string;
  className?: string;
  sectionId?: string;
  sectionName?: string;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  leave: number;
  total: number;
  percentage: string;
}

// ==========================================
// Leave Management Types
// ==========================================
export type LeaveType = "casual" | "sick" | "emergency" | "personal" | "other";
export type LeaveStatus = "pending" | "approved" | "rejected";
export type ApplicantType = "student" | "teacher";

export interface LeaveRequest {
  leaveId: string;
  schoolId: string;
  applicantId: string;
  applicantType: ApplicantType;
  applicantName?: string;
  classId?: string;
  sectionId?: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  processedBy?: string;
  processedByName?: string;
  processedAt?: string;
  approvalRemarks?: string;
  numberOfDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApplyLeavePayload {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  classId?: string;
  sectionId?: string;
  studentIds?: string[];
}

export interface ProcessLeavePayload {
  action: "approve" | "reject";
  remarks?: string;
}

export interface LeaveSummary {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  students?: number;
  teachers?: number;
}

// ==========================================
// Menu Types
// ==========================================
export interface Menu {
  _id?: string;
  menuId: string;
  schoolId?: string | string[];
  menuName: string;
  menuUrl: string;
  menuOrder: number | string | string[];
  menuIcon: string;
  menuAccessRoles: string | string[];
  deactivatedRoles?: string[];
  deactivatedSchools?: string[];
  defaultMenu?: boolean;
  showInSidebar?: boolean;
  menuType: "main" | "sub";
  hasSubmenu: boolean;
  parentMenuId?: string;
  submenus?: Menu[];
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMenuPayload {
  schoolId?: string | string[];
  menuName: string;
  menuUrl: string;
  menuIcon: string;
  menuAccessRoles: string | string[];
  menuType: string;
  hasSubmenu: boolean;
  parentMenuId?: string;
  menuOrder: string | number | string[];
  deactivatedRoles?: string[];
  deactivatedSchools?: string[];
  defaultMenu?: boolean;
  showInSidebar?: boolean;
  status: "active" | "inactive";
}

export interface UpdateMenuPayload {
  menuName?: string;
  menuUrl?: string;
  menuIcon?: string;
  menuAccessRoles?: string;
  menuType?: string;
  hasSubmenu?: boolean;
  parentMenuId?: string;
  deactivatedRoles?: string[];
  deactivatedSchools?: string[];
  defaultMenu?: boolean;
  showInSidebar?: boolean;
  schoolId?: string | string[];
}

// ==========================================
// ANNOUNCEMENT TYPES
// ==========================================
export type AnnouncementCategory =
  | "general"
  | "academic"
  | "exam"
  | "holiday"
  | "event"
  | "fee"
  | "emergency";
export type AnnouncementPriority = "low" | "normal" | "high" | "urgent";
export type AnnouncementTargetAudience =
  | "all"
  | "students"
  | "teachers"
  | "parents"
  | "specific_class";
export type AnnouncementStatus = "active" | "archived";

export interface AnnouncementAttachment {
  url: string;
  fileName: string;
  fileType: "image" | "pdf" | "document";
  uploadedAt?: string;
}

export interface Announcement {
  announcementId: string;
  schoolId: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  targetAudience: AnnouncementTargetAudience;
  targetClasses?: string[];
  attachments?: AnnouncementAttachment[];
  attachmentUrl?: string; // Backwards compatibility
  publishDate: string;
  expiryDate?: string;
  isPublished: boolean;
  createdBy: string;
  createdByRole: "sch_admin" | "teacher";
  createdByName?: string;
  status: AnnouncementStatus;
  seenBy?: { userId: string; userRole: string; seenAt: string }[];
  seenCount?: number;
  isSeen?: boolean; // Populated by API based on current user
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAnnouncementPayload {
  title: string;
  content: string;
  category?: AnnouncementCategory;
  priority?: AnnouncementPriority;
  targetAudience?: AnnouncementTargetAudience;
  targetClasses?: string[];
  attachments?: AnnouncementAttachment[];
  attachmentUrl?: string; // Backwards compatibility
  publishDate?: string;
  expiryDate?: string;
}

export interface UpdateAnnouncementPayload {
  title?: string;
  content?: string;
  category?: AnnouncementCategory;
  priority?: AnnouncementPriority;
  targetAudience?: AnnouncementTargetAudience;
  targetClasses?: string[];
  attachments?: AnnouncementAttachment[];
  attachmentUrl?: string;
  expiryDate?: string;
  isPublished?: boolean;
  status?: AnnouncementStatus;
}

// ==========================================
// HOMEWORK TYPES
// ==========================================
export type HomeworkStatus = "active" | "completed" | "cancelled";

export interface Homework {
  homeworkId: string;
  schoolId: string;
  classId: string;
  sectionId?: string;
  subjectId: string;
  teacherId: string;
  title: string;
  description: string;
  attachmentUrl?: string;
  referenceLinks?: string[];
  attachments?: AnnouncementAttachment[];
  assignedDate: string;
  dueDate: string;
  status: HomeworkStatus;
  // Enriched fields
  subjectName?: string;
  teacherName?: string;
  className?: string;
  isOverdue?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateHomeworkPayload {
  classId: string;
  sectionId?: string;
  subjectId: string;
  title: string;
  description: string;
  attachmentUrl?: string;
  referenceLinks?: string[];
  attachments?: AnnouncementAttachment[];
  dueDate: string;
}

export interface UpdateHomeworkPayload {
  title?: string;
  description?: string;
  attachmentUrl?: string;
  referenceLinks?: string[];
  attachments?: AnnouncementAttachment[];
  dueDate?: string;
  status?: HomeworkStatus;
}

// ==========================================
// NOTIFICATION TYPES
// ==========================================
export type NotificationType =
  | "absence_alert"
  | "leave_status"
  | "announcement"
  | "homework_assigned"
  | "homework_due"
  | "exam_scheduled"
  | "result_published"
  | "general";

export type NotificationReferenceType =
  | "announcement"
  | "homework"
  | "leave"
  | "attendance"
  | "exam"
  | "result"
  | null;

export interface Notification {
  notificationId: string;
  schoolId: string;
  userId: string;
  userRole: "student" | "teacher" | "parent" | "sch_admin";
  type: NotificationType;
  title: string;
  message: string;
  referenceId?: string;
  referenceType?: NotificationReferenceType;
  isRead: boolean;
  readAt?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationFilters {
  isRead?: boolean;
  type?: NotificationType;
  page?: number;
  limit?: number;
}

// ==========================================
// PARENT PORTAL TYPES
// ==========================================
export interface ChildStats {
  studentId: string;
  name: string;
  firstName: string;
  lastName: string;
  class: string;
  section?: string;
  sectionName?: string;
  className?: string;
  rollNumber?: string;
  profileImage?: string;
  attendancePercentage: number;
  pendingLeaves: number;
  totalDays: number;
  presentDays: number;
}

export interface RecentAbsence {
  studentId: string;
  studentName: string;
  date: string;
  status: string;
}

export interface ParentDashboardStats {
  childrenCount: number;
  children: ChildStats[];
  totalPendingLeaves: number;
  recentAbsences: RecentAbsence[];
  parentName: string;
}

export interface ChildTeacherInfo {
  teacherId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profileImage?: string;
  subjects?: string[];
  subjectNames?: string[];
  isClassTeacher: boolean;
}

export interface ChildAttendanceData {
  attendance: AttendanceSimple[];
  summary: {
    total: number;
    present: number;
    absent: number;
    late: number;
    halfDay: number;
    leave: number;
    percentage: string;
  };
}

export interface AbsentRecord {
  date: string;
  status: string;
  leaveApplied: boolean;
  leaveStatus?: LeaveStatus;
}

// ==========================================
// ACTIVITY LOG TYPES
// ==========================================
export * from "./activity";
export * from "./fee.types";
