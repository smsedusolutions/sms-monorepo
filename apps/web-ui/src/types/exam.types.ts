// Exam Configuration Types

export interface ExamTerm {
    _id: string;
    schoolId: string;
    name: string;
    academicYear: string;
    startDate: string; // ISO Date
    endDate: string; // ISO Date
    isActive: boolean;
    status: 'active' | 'inactive' | 'archived';
}

export interface CreateExamTermRequest {
    name: string;
    academicYear: string;
    startDate: string;
    endDate: string;
}

export interface ExamType {
    _id: string;
    schoolId: string;
    name: string;
    termId?: string | ExamTerm;
    weightage: number;
    description?: string;
    isActive: boolean;
}

export interface CreateExamTypeRequest {
    name: string;
    weightage: number;
    description?: string;
    termId?: string;
}

export interface GradeRange {
    name: string;
    minPercentage: number;
    maxPercentage: number;
    points: number;
    description?: string;
}

export interface GradingSystem {
    _id: string;
    schoolId: string;
    name: string;
    grades: GradeRange[];
    isDefault: boolean;
    isActive: boolean;
}

export interface CreateGradingSystemRequest {
    name: string;
    grades: GradeRange[];
    isDefault?: boolean;
}

// Exam Event Types

export interface Exam {
    _id: string;
    schoolId: string;
    examId: string;
    name: string;
    typeId: string | ExamType;
    termId: string | ExamTerm;
    academicYear: string;
    classes: string[]; // Class IDs
    startDate: string;
    endDate: string;
    resultPublishDate?: string;
    gradingSystemId: string | GradingSystem;
    status: 'draft' | 'scheduled' | 'ongoing' | 'completed' | 'results_processing' | 'published';
    isActive: boolean;
}

export interface CreateExamRequest {
    name: string;
    typeId: string;
    termId: string;
    academicYear: string;
    classes: string[];
    startDate: string;
    endDate: string;
    gradingSystemId: string;
}

// Schedule Types

export interface ExamSchedule {
    _id: string;
    schoolId: string;
    examId: string;
    classId: string;
    subjectId: string;
    date: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    roomId?: string; // Populated or ID
    invigilators: string[] | any[]; // Teacher IDs or Objects
    maxMarksTheory: number;
    maxMarksPractical: number;
    passingMarks: number;
    syllabus?: string;
    publishStatus?: 'draft' | 'teacher_published' | 'final_published';
    teacherPublishedAt?: string;
    teacherPublishedBy?: string;
    finalPublishedAt?: string;
    finalPublishedBy?: string;
}

export interface CreateScheduleRequest {
    _id?: string; // Present when editing an existing schedule
    examId: string;
    classId: string;
    subjectId: string;
    date: string;
    startTime: string;
    endTime: string;
    roomId?: string;
    invigilators?: string[];
    maxMarksTheory?: number;
    maxMarksPractical?: number;
    passingMarks: number;
    syllabus?: string;
}

// Result Types

export interface ExamResult {
    _id: string;
    schoolId: string;
    examId: string;
    studentId: string;
    classId: string;
    sectionId: string;
    subjectId: string;
    scheduleId: string;
    marksObtainedTheory: number;
    marksObtainedPractical: number;
    totalMarks: number;
    grade: string;
    gradePoints: number;
    attendanceStatus: 'present' | 'absent' | 'medical_leave' | 'exempted';
    remarks?: string;
    evaluatedBy: string;
    evaluatedAt: string;
    publishStatus?: 'draft' | 'teacher_published' | 'final_published';
    teacherPublishedAt?: string;
    teacherPublishedBy?: string;
    finalPublishedAt?: string;
    finalPublishedBy?: string;
    isPublished: boolean;

    // Virtuals/Populated
    studentName?: string;
    rollNumber?: string;
}

export interface SubmitMarksRequest {
    examId: string;
    scheduleId: string;
    marks: {
        studentId: string;
        theory?: number;
        practical?: number;
        remarks?: string;
        attendanceStatus?: string;
    }[];
}

export interface TeacherPublishRequest {
    examId: string;
    scheduleId: string;
}

export interface FinalPublishRequest {
    examId: string;
    scheduleId?: string;
    classId?: string;
}

export interface RollbackPublishRequest {
    examId: string;
    scheduleId: string;
    reason?: string;
}

export interface ExamPublishStatusSummary {
    totalSubjects: number;
    draftCount: number;
    teacherPublishedCount: number;
    finalPublishedCount: number;
    isAllTeacherPublished: boolean;
    isAllFinalPublished: boolean;
}

export interface ExamPublishSubjectItem {
    _id: string;
    classId: string;
    className: string;
    subjectId: string;
    subjectName: string;
    date: string;
    startTime: string;
    endTime: string;
    publishStatus: 'draft' | 'teacher_published' | 'final_published';
    teacherPublishedAt?: string;
    teacherPublishedBy?: string;
    finalPublishedAt?: string;
    finalPublishedBy?: string;
    evaluatedStudents: number;
    totalStudents: number;
}

export interface ExamPublishStatusData {
    exam: {
        examId: string;
        name: string;
        status: string;
        startDate: string;
        endDate: string;
        resultPublishDate?: string;
    };
    summary: ExamPublishStatusSummary;
    subjects: ExamPublishSubjectItem[];
}

export interface StudentExamRegistration {
    _id: string;
    schoolId: string;
    examId: string;
    studentId: string;
    rollNumber: string;
    admitCardGenerated: boolean;
    admitCardUrl?: string;
    isEligible: boolean;
    ineligibilityReason?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    errors?: string[];
}

export interface StudentReportCard {
    student: {
        name: string;
        rollNumber: string;
        classId: string;
        sectionId: string;
        admissionNumber: string;
    };
    academicYear: string;
    exams: {
        examId: string;
        name: string;
        term: string;
        type: string;
        results: {
            subjectId: string;
            marksObtained: number;
            maxMarks: number;
            grade: string;
            points: number;
            remarks: string;
        }[];
    }[];
}

export interface AdmitCardData {
    isEligible: boolean;
    admitCardGenerated: boolean;
    admitCardUrl?: string;
    ineligibilityReason?: string;
    rollNumber?: string;
    classId?: string;
    sectionId?: string;
    // Additional fields for admit card display
    studentName?: string;
    fatherName?: string;
    dob?: string;
    profileImage?: string;
    studentPhoto?: string;
    signature?: string;
    schoolName?: string;
    schoolAddress?: string;
    schoolLogo?: string;
}
