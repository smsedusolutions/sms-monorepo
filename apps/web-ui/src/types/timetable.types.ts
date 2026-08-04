// Timetable Management Types

// ==========================================
// TIMETABLE CONFIGURATION
// ==========================================

export interface Period {
  periodNumber: number;
  displayPeriodNumber?: number;
  name: string;
  startTime: string;
  endTime: string;
  duration: number;
  type: "regular" | "break" | "assembly" | "pt" | "lab" | "free" | "lunch";
  shiftId?: string;
  isDoublePeriod?: boolean;
}

export interface Shift {
  shiftId: string;
  name: string;
  startTime: string;
  endTime: string;
}

export interface TimetableConfig {
  configId: string;
  schoolId: string;
  academicYear: string;
  workingDays: string[];
  shifts: Shift[];
  periods: Period[];
  isActive: boolean;
  status: "active" | "inactive";
  // Temporary disable fields
  temporarilyDisabled?: boolean;
  disabledFrom?: string;
  disabledTo?: string;
  disabledReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTimetableConfigRequest {
  academicYear: string;
  workingDays?: string[];
  shifts?: Shift[];
  periods?: Period[];
}

export interface UpdateTimetableConfigRequest {
  academicYear?: string;
  workingDays?: string[];
  shifts?: Shift[];
  periods?: Period[];
  isActive?: boolean;
}

// ==========================================
// TIMETABLE SCHEDULE (Validity Periods)
// ==========================================

export type TimetableScheduleStatus = "active" | "disabled" | "draft";
export type TimetableScheduleType =
  | "regular"
  | "exam_phase"
  | "sports_week"
  | "vacation"
  | "special";

export interface TimetableSchedule {
  scheduleId: string;
  schoolId: string;
  name: string;
  description?: string;
  validFrom: string;
  validTo: string;
  status: TimetableScheduleStatus;
  scheduleType: TimetableScheduleType;
  allowSpecialClasses: boolean;
  createdBy?: string;
  disabledBy?: string;
  disabledAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTimetableScheduleRequest {
  name: string;
  description?: string;
  validFrom: string;
  validTo: string;
  scheduleType?: TimetableScheduleType;
  allowSpecialClasses?: boolean;
  notes?: string;
}

export interface UpdateTimetableScheduleRequest {
  name?: string;
  description?: string;
  validFrom?: string;
  validTo?: string;
  status?: TimetableScheduleStatus;
  scheduleType?: TimetableScheduleType;
  allowSpecialClasses?: boolean;
  notes?: string;
}

export interface ActiveScheduleResponse {
  isActive: boolean;
  data: TimetableSchedule | null;
}

// ==========================================
// TIMETABLE ENTRY
// ==========================================

export interface TimetableEntry {
  entryId: string;
  schoolId: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: string;
  periodNumber: number;
  shiftId?: string;
  roomId?: string;
  periodType: "regular" | "lab" | "pt" | "free" | "assembly";
  isActive: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
  notes?: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
  displayPeriodNumber: any;
  // Populated fields
  teacher?: {
    teacherId: string;
    name?: string;
    firstName?: string;
    lastName?: string;
  };
  subject?: {
    subjectId: string;
    name: string;
    code: string;
  };
  class?: {
    classId: string;
    name: string;
    section?: string;
  };
}

export interface CreateTimetableEntryRequest {
  classId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: string;
  periodNumber: number;
  shiftId?: string;
  roomId?: string;
  periodType?: "regular" | "lab" | "pt" | "free" | "assembly";
  effectiveFrom?: string;
  effectiveTo?: string;
  notes?: string;
}

export interface UpdateTimetableEntryRequest {
  classId?: string;
  sectionId?: string;
  subjectId?: string;
  teacherId?: string;
  dayOfWeek?: string;
  periodNumber?: number;
  shiftId?: string;
  roomId?: string;
  periodType?: string;
  notes?: string;
}

export interface BulkCreateEntriesRequest {
  entries: CreateTimetableEntryRequest[];
}

export interface Conflict {
  type: "teacher" | "room" | "class";
  message: string;
  conflictingEntry?: TimetableEntry;
}

// ==========================================
// CLASS TIMETABLE RESPONSE
// ==========================================

export interface ClassTimetableResponse {
  config: TimetableConfig | null;
  entries: TimetableEntry[];
}

export interface TeacherTimetableResponse {
  config: TimetableConfig | null;
  entries: TimetableEntry[];
}

// ==========================================
// SUBSTITUTE ASSIGNMENT
// ==========================================

export interface SubstituteAssignment {
  substituteId: string;
  schoolId: string;
  originalEntryId: string;
  originalTeacherId: string;
  substituteTeacherId: string;
  date: string;
  reason?: string;
  createdBy: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
  // Populated fields
  entry?: TimetableEntry;
  originalTeacher?: {
    teacherId: string;
    name: string;
  };
  substituteTeacher?: {
    teacherId: string;
    name: string;
  };
}

export interface CreateSubstituteRequest {
  originalEntryId: string;
  substituteTeacherId: string;
  date: string;
  reason?: string;
}

// ==========================================
// ROOM
// ==========================================

export interface Room {
  roomId: string;
  schoolId: string;
  name: string;
  code: string;
  type:
  | "classroom"
  | "lab"
  | "hall"
  | "playground"
  | "library"
  | "auditorium"
  | "other";
  capacity: number;
  floor?: string;
  building?: string;
  equipment?: string[];
  isAvailable: boolean;
  status: "active" | "inactive" | "maintenance";
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoomRequest {
  name: string;
  code: string;
  type?: string;
  capacity?: number;
  floor?: string;
  building?: string;
  equipment?: string[];
}

export interface RoomAvailability {
  room: Room;
  dayOfWeek: string;
  bookedPeriods: {
    periodNumber: number;
    classId: string;
    sectionId: string;
    subjectId: string;
  }[];
}

// ==========================================
// PERIOD SWAP
// ==========================================

export interface PeriodSwap {
  swapId: string;
  schoolId: string;
  requestedBy: string;
  entryId1: string;
  entryId2: string;
  date: string;
  reason?: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  // Populated fields
  entry1?: TimetableEntry;
  entry2?: TimetableEntry;
  requester?: {
    teacherId: string;
    name: string;
  };
}

export interface CreateSwapRequest {
  entryId1: string;
  entryId2: string;
  date: string;
  reason?: string;
}

// ==========================================
// REPORTS
// ==========================================

export interface TeacherWorkload {
  teacherId: string;
  name: string;
  email: string;
  totalPeriodsPerWeek: number;
  maxPeriodsPerWeek: number;
  workloadPercentage: number;
  dayWiseLoad: Record<string, number>;
  subjectsTaught: { subjectId: string; name: string }[];
  classesCount: number;
}

export interface TeacherWorkloadReport {
  summary: {
    totalTeachers: number;
    avgWorkloadPercentage: number;
    maxPeriodsPerWeek: number;
  };
  teachers: TeacherWorkload[];
}

export interface SubjectDistribution {
  subjectId: string;
  name: string;
  code: string;
  totalPeriodsPerWeek: number;
  classesCount: number;
}

export interface TimetableSummary {
  hasActiveConfig: boolean;
  academicYear: string | null;
  stats: {
    totalEntries: number;
    totalTeachers: number;
    totalClasses: number;
    totalSubjects: number;
    fillRate: number;
  };
  workingDays: string[];
  periodsPerDay: number;
}

export interface ExportTimetableData {
  type: "class" | "teacher";
  entityName: string;
  academicYear: string;
  workingDays: string[];
  periods: Period[];
  breaks: Period[];
  grid: Record<
    string,
    Record<
      number,
      {
        subject: string;
        subjectCode: string;
        teacher: string;
        class: string;
        section: string;
        room: string;
      } | null
    >
  >;
}

// ==========================================
// FREE PERIODS
// ==========================================

export interface FreePeriod {
  periodNumber: number;
  displayPeriodNumber?: number;
  name: string;
  startTime: string;
  endTime: string;
}

export interface TeacherFreePeriods {
  teacherId: string;
  freePeriods: Record<string, FreePeriod[]>;
}

export interface FreeTeacher {
  teacherId: string;
  name: string;
  email: string;
}

// ==========================================
// CONFLICT REPORT
// ==========================================

export interface EnrichedTimetableEntry {
  entryId: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  subjectId: string;
  subjectName: string;
}

export interface ConflictItem {
  type: "teacher" | "room";
  description: string;
  entries: EnrichedTimetableEntry[];
  dayOfWeek: string;
  periodNumber: number;
}

export interface ConflictReport {
  totalConflicts: number;
  conflicts: ConflictItem[];
}
