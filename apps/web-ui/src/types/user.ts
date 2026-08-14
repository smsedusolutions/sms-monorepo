// User Profile Interface
export interface UserProfile {
  userId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  profileImage?: string;
  role: "student" | "teacher" | "sch_admin" | "parent" | "super_admin" | "driver" | "principal";

  // Student specific
  studentId?: string;
  class?: string;
  section?: string;
  className?: string;
  sectionName?: string;
  rollNumber?: string;

  // Teacher specific
  teacherId?: string;
  department?: string;
  subjects?: string[];
  subjectNames?: string[];
  classes?: string[];
  classNames?: string[];
  classTeacherLabel?: string;
  classTeacherSectionId?: string;

  // Parent specific
  parentId?: string;
  studentIds?: string[];
  relationship?: string;

  // Admin specific
  adminId?: string;

  // Principal specific
  principalId?: string;

  // Allow for extra dynamic fields from aggregated API responses
  [key: string]: any;
}

// School Information Interface
export interface SchoolInfo {
  schoolId: string;
  schoolName: string;
  schoolLogo?: string;
  schoolAddress?: string;
  [key: string]: any;
}

// User Store State Interface
export interface UserStore {
  // State
  user: UserProfile | null;
  school: SchoolInfo | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: UserProfile | null) => void;
  setSchool: (school: SchoolInfo | null) => void;
  fetchProfile: (force?: boolean) => Promise<void>;
  clearStore: () => void;
}
