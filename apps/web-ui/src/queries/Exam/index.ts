import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useApi from "../useApi";
import type {
    CreateExamRequest,
    CreateExamTermRequest,
    CreateExamTypeRequest,
    CreateGradingSystemRequest,
    CreateScheduleRequest,
    SubmitMarksRequest,
    TeacherPublishRequest,
    FinalPublishRequest,
    RollbackPublishRequest,
    ExamPublishStatusData,
    ApiResponse,
    ExamTerm,
    ExamType,
    GradingSystem,
    Exam,
    ExamSchedule,
    ExamResult,
    StudentReportCard,
    AdmitCardData
} from "../../types/exam.types";

const EXAM_KEYS = {
    TERMS: "examTerms",
    TYPES: "examTypes",
    GRADING: "gradingSystems",
    EXAMS: "exams",
    SCHEDULE: "examSchedule",
    RESULTS: "examResults",
    ADMIT_CARD: "admitCard",
    PUBLISH_STATUS: "examPublishStatus"
};

// ==========================================
// CONFIG HOOKS
// ==========================================

export const useCreateExamTerm = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateExamTermRequest) => useApi("POST", `/api/academics/school/${schoolId}/exam-config/terms`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [EXAM_KEYS.TERMS, schoolId] });
        }
    });
};

export const useGetExamTerms = (schoolId: string, academicYear?: string) => {
    return useQuery({
        queryKey: [EXAM_KEYS.TERMS, schoolId, academicYear],
        queryFn: () => useApi<ApiResponse<ExamTerm[]>>("GET", `/api/academics/school/${schoolId}/exam-config/terms`, undefined, { academicYear }),
        enabled: !!schoolId,
        staleTime: 30 * 60 * 1000,
    });
};

export const useUpdateExamTerm = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ termId, data }: { termId: string; data: Partial<CreateExamTermRequest> }) =>
            useApi("PUT", `/api/academics/school/${schoolId}/exam-config/terms/${termId}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [EXAM_KEYS.TERMS, schoolId] });
        }
    });
};

export const useDeleteExamTerm = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (termId: string) =>
            useApi("DELETE", `/api/academics/school/${schoolId}/exam-config/terms/${termId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [EXAM_KEYS.TERMS, schoolId] });
        }
    });
};

export const useCreateExamType = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateExamTypeRequest) => useApi("POST", `/api/academics/school/${schoolId}/exam-config/types`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [EXAM_KEYS.TYPES, schoolId] });
        }
    });
};

export const useGetExamTypes = (schoolId: string) => {
    return useQuery({
        queryKey: [EXAM_KEYS.TYPES, schoolId],
        queryFn: () => useApi<ApiResponse<ExamType[]>>("GET", `/api/academics/school/${schoolId}/exam-config/types`),
        enabled: !!schoolId,
        staleTime: 30 * 60 * 1000,
    });
};

export const useDeleteExamType = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (typeId: string) =>
            useApi("DELETE", `/api/academics/school/${schoolId}/exam-config/types/${typeId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [EXAM_KEYS.TYPES, schoolId] });
        }
    });
};

export const useCreateGradingSystem = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateGradingSystemRequest) => useApi("POST", `/api/academics/school/${schoolId}/exam-config/grading`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [EXAM_KEYS.GRADING, schoolId] });
        }
    });
};

export const useGetGradingSystems = (schoolId: string) => {
    return useQuery({
        queryKey: [EXAM_KEYS.GRADING, schoolId],
        queryFn: () => useApi<ApiResponse<GradingSystem[]>>("GET", `/api/academics/school/${schoolId}/exam-config/grading`),
        enabled: !!schoolId,
        staleTime: 30 * 60 * 1000,
    });
};

export const useUpdateGradingSystem = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ systemId, data }: { systemId: string; data: Partial<CreateGradingSystemRequest> }) =>
            useApi("PUT", `/api/academics/school/${schoolId}/exam-config/grading/${systemId}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [EXAM_KEYS.GRADING, schoolId] });
        }
    });
};

export const useDeleteGradingSystem = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (systemId: string) =>
            useApi("DELETE", `/api/academics/school/${schoolId}/exam-config/grading/${systemId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [EXAM_KEYS.GRADING, schoolId] });
        }
    });
};

// ==========================================
// EXAM HOOKS
// ==========================================

export const useCreateExam = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateExamRequest) => useApi("POST", `/api/academics/school/${schoolId}/exams`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [EXAM_KEYS.EXAMS, schoolId] });
        }
    });
};

export const useGetExams = (schoolId: string, academicYear?: string) => {
    return useQuery({
        queryKey: [EXAM_KEYS.EXAMS, schoolId, academicYear],
        queryFn: () => useApi<ApiResponse<Exam[]>>("GET", `/api/academics/school/${schoolId}/exams`, undefined, { academicYear }),
        enabled: !!schoolId,
        staleTime: 5 * 60 * 1000,
    });
};

export const useUpdateExam = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ examId, data }: { examId: string; data: Partial<CreateExamRequest> }) =>
            useApi("PUT", `/api/academics/school/${schoolId}/exams/${examId}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [EXAM_KEYS.EXAMS, schoolId] });
        }
    });
};

export const useDeleteExam = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (examId: string) =>
            useApi("DELETE", `/api/academics/school/${schoolId}/exams/${examId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [EXAM_KEYS.EXAMS, schoolId] });
        }
    });
};

export const useScheduleExam = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateScheduleRequest) => useApi("POST", `/api/academics/school/${schoolId}/exams/schedule`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [EXAM_KEYS.SCHEDULE, schoolId] });
        }
    });
};

export const useGetExamSchedule = (schoolId: string, examId: string) => {
    return useQuery({
        queryKey: [EXAM_KEYS.SCHEDULE, schoolId, examId],
        queryFn: () => useApi<ApiResponse<ExamSchedule[]>>("GET", `/api/academics/school/${schoolId}/exams/${examId}/schedule`),
        enabled: !!schoolId && !!examId,
        staleTime: 5 * 60 * 1000,
    });
};

// ==========================================
// RESULT HOOKS
// ==========================================

export const useSubmitMarks = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: SubmitMarksRequest) => useApi("POST", `/api/academics/school/${schoolId}/results/submit`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [EXAM_KEYS.RESULTS] });
            queryClient.invalidateQueries({ queryKey: [EXAM_KEYS.SCHEDULE] });
            queryClient.invalidateQueries({ queryKey: [EXAM_KEYS.PUBLISH_STATUS] });
        }
    });
};

export const useTeacherPublishSubject = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: TeacherPublishRequest) => useApi("POST", `/api/academics/school/${schoolId}/results/teacher-publish`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [EXAM_KEYS.RESULTS] });
            queryClient.invalidateQueries({ queryKey: [EXAM_KEYS.SCHEDULE] });
            queryClient.invalidateQueries({ queryKey: [EXAM_KEYS.PUBLISH_STATUS] });
        }
    });
};

export const useFinalPublishExam = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: FinalPublishRequest) => useApi("POST", `/api/academics/school/${schoolId}/results/publish`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [EXAM_KEYS.RESULTS] });
            queryClient.invalidateQueries({ queryKey: [EXAM_KEYS.SCHEDULE] });
            queryClient.invalidateQueries({ queryKey: [EXAM_KEYS.EXAMS] });
            queryClient.invalidateQueries({ queryKey: [EXAM_KEYS.PUBLISH_STATUS] });
        }
    });
};

export const useRollbackSubjectPublish = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: RollbackPublishRequest) => useApi("POST", `/api/academics/school/${schoolId}/results/rollback`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [EXAM_KEYS.RESULTS] });
            queryClient.invalidateQueries({ queryKey: [EXAM_KEYS.SCHEDULE] });
            queryClient.invalidateQueries({ queryKey: [EXAM_KEYS.EXAMS] });
            queryClient.invalidateQueries({ queryKey: [EXAM_KEYS.PUBLISH_STATUS] });
        }
    });
};

export const useRemindTeacherMarks = (schoolId: string) => {
    return useMutation({
        mutationFn: (data: { examId: string; scheduleId: string }) =>
            useApi("POST", `/api/academics/school/${schoolId}/results/remind-teacher`, data)
    });
};

export const useGetExamPublishStatus = (schoolId: string, examId: string) => {
    return useQuery({
        queryKey: [EXAM_KEYS.PUBLISH_STATUS, schoolId, examId],
        queryFn: () => useApi<ApiResponse<ExamPublishStatusData>>("GET", `/api/academics/school/${schoolId}/results/publish-status/${examId}`),
        enabled: !!schoolId && !!examId
    });
};

export const useGetSubjectResults = (schoolId: string, examId: string, scheduleId: string) => {
    return useQuery({
        queryKey: [EXAM_KEYS.RESULTS, schoolId, examId, scheduleId],
        queryFn: () => useApi<ApiResponse<ExamResult[]> & { schedule?: { publishStatus: string; teacherPublishedAt?: string; teacherPublishedBy?: string; finalPublishedAt?: string; finalPublishedBy?: string } }>("GET", `/api/academics/school/${schoolId}/results/subject/${examId}/${scheduleId}`),
        enabled: !!schoolId && !!examId && !!scheduleId
    });
};

// ==========================================
// REGISTRATION HOOKS
// ==========================================

export const useGetStudentReportCard = (schoolId: string, studentId: string) => {
    return useQuery({
        queryKey: [EXAM_KEYS.RESULTS, "report", schoolId, studentId],
        queryFn: () => useApi<ApiResponse<StudentReportCard>>("GET", `/api/academics/school/${schoolId}/results/report-card/${studentId}`),
        enabled: !!schoolId && !!studentId
    });
};

export const useBulkGenerateAdmitCards = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { examId: string, classId?: string }) => useApi("POST", `/api/academics/school/${schoolId}/registration/bulk-admit-card`, data),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: [EXAM_KEYS.ADMIT_CARD, schoolId, variables.examId] });
        }
    });
};

export const useGetAdmitCard = (schoolId: string, examId: string, studentId: string) => {
    return useQuery({
        queryKey: [EXAM_KEYS.ADMIT_CARD, schoolId, examId, studentId],
        queryFn: () => useApi<ApiResponse<AdmitCardData>>("GET", `/api/academics/school/${schoolId}/registration/${examId}/student/${studentId}`),
        enabled: !!schoolId && !!examId && !!studentId
    });
};

export const useGetExamRegistrations = (schoolId: string, examId: string, classId?: string, search?: string, page?: number, limit?: number) => {
    return useQuery({
        queryKey: [EXAM_KEYS.ADMIT_CARD, schoolId, examId, "list", classId, search, page, limit],
        queryFn: () => useApi<ApiResponse<any[]> & { total?: number }>("GET", `/api/academics/school/${schoolId}/registration/${examId}/list`, undefined, { classId, search, page, limit }),
        enabled: !!schoolId && !!examId
    });
};
