import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useApi from "../useApi";
import type { Homework, CreateHomeworkPayload, UpdateHomeworkPayload } from "../../types";

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    count?: number;
}

// Query Keys
export const homeworkKeys = {
    all: ['homework'] as const,
    lists: () => [...homeworkKeys.all, 'list'] as const,
    byClass: (schoolId: string, classId: string, filters?: Record<string, unknown>) => [...homeworkKeys.lists(), 'class', schoolId, classId, filters] as const,
    byStudent: (schoolId: string, studentId: string, filters?: Record<string, unknown>) => [...homeworkKeys.lists(), 'student', schoolId, studentId, filters] as const,
    upcoming: (schoolId: string, studentId: string, limit?: number) => [...homeworkKeys.lists(), 'upcoming', schoolId, studentId, limit] as const,
    byTeacher: (schoolId: string, teacherId: string, filters?: Record<string, unknown>) => [...homeworkKeys.lists(), 'teacher', schoolId, teacherId, filters] as const,
    details: () => [...homeworkKeys.all, 'detail'] as const,
    detail: (schoolId: string, id: string) => [...homeworkKeys.details(), schoolId, id] as const,
};

// Get homework by class
export const useGetHomeworkByClass = (
    schoolId: string,
    classId: string,
    filters?: { sectionId?: string; status?: string; subjectId?: string }
) => {
    return useQuery({
        queryKey: homeworkKeys.byClass(schoolId, classId, filters as Record<string, unknown>),
        queryFn: () => useApi<ApiResponse<Homework[]>>(
            "GET",
            `/api/academics/school/${schoolId}/homework/class/${classId}`,
            undefined,
            filters as Record<string, unknown>
        ),
        enabled: !!schoolId && !!classId,
    });
};

// Get homework by student
export const useGetHomeworkByStudent = (
    schoolId: string,
    studentId: string,
    filters?: { status?: string; subjectId?: string }
) => {
    return useQuery({
        queryKey: homeworkKeys.byStudent(schoolId, studentId, filters as Record<string, unknown>),
        queryFn: () => useApi<ApiResponse<Homework[]>>(
            "GET",
            `/api/academics/school/${schoolId}/homework/student/${studentId}`,
            undefined,
            filters as Record<string, unknown>
        ),
        enabled: !!schoolId && !!studentId,
    });
};

// Get upcoming homework for student
export const useGetUpcomingHomework = (
    schoolId: string,
    studentId: string,
    limit?: number
) => {
    return useQuery({
        queryKey: homeworkKeys.upcoming(schoolId, studentId, limit),
        queryFn: () => useApi<ApiResponse<Homework[]>>(
            "GET",
            `/api/academics/school/${schoolId}/homework/upcoming/${studentId}`,
            undefined,
            limit ? { limit } : undefined
        ),
        enabled: !!schoolId && !!studentId,
    });
};

// Get teacher's homework
export const useGetTeacherHomework = (
    schoolId: string,
    teacherId: string,
    filters?: { status?: string; classId?: string }
) => {
    return useQuery({
        queryKey: homeworkKeys.byTeacher(schoolId, teacherId, filters as Record<string, unknown>),
        queryFn: () => useApi<ApiResponse<Homework[]>>(
            "GET",
            `/api/academics/school/${schoolId}/homework/teacher/${teacherId}`,
            undefined,
            filters as Record<string, unknown>
        ),
        enabled: !!schoolId && !!teacherId,
    });
};

// Get homework by ID
export const useGetHomeworkById = (schoolId: string, homeworkId: string) => {
    return useQuery({
        queryKey: homeworkKeys.detail(schoolId, homeworkId),
        queryFn: () => useApi<ApiResponse<Homework>>(
            "GET",
            `/api/academics/school/${schoolId}/homework/${homeworkId}`
        ),
        enabled: !!schoolId && !!homeworkId,
    });
};

// Create homework
export const useCreateHomework = (schoolId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateHomeworkPayload) => useApi(
            "POST",
            `/api/academics/school/${schoolId}/homework`,
            payload
        ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: homeworkKeys.lists() });
        },
    });
};

// Update homework
export const useUpdateHomework = (schoolId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ homeworkId, ...payload }: UpdateHomeworkPayload & { homeworkId: string }) => useApi(
            "PUT",
            `/api/academics/school/${schoolId}/homework/${homeworkId}`,
            payload
        ),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: homeworkKeys.lists() });
            queryClient.invalidateQueries({ queryKey: homeworkKeys.detail(schoolId, variables.homeworkId) });
        },
    });
};

// Delete homework
export const useDeleteHomework = (schoolId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (homeworkId: string) => useApi(
            "DELETE",
            `/api/academics/school/${schoolId}/homework/${homeworkId}`
        ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: homeworkKeys.lists() });
        },
    });
};

// Toggle Homework Status (active <-> completed)
export const useToggleHomeworkStatus = (schoolId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ homeworkId, status }: { homeworkId: string; status: 'active' | 'completed' | 'cancelled' }) => useApi(
            "PUT",
            `/api/academics/school/${schoolId}/homework/${homeworkId}`,
            { status }
        ),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: homeworkKeys.lists() });
            queryClient.invalidateQueries({ queryKey: homeworkKeys.detail(schoolId, variables.homeworkId) });
        },
    });
};

// Get Submissions for a Homework (Teacher)
export const useGetHomeworkSubmissions = (schoolId: string, homeworkId: string) => {
    return useQuery({
        queryKey: ['homework-submissions', schoolId, homeworkId],
        queryFn: () => useApi<ApiResponse<{
            homework: Homework;
            submissions: any[];
            summary: {
                total: number;
                submitted: number;
                late: number;
                reviewed: number;
                accepted: number;
                changes_requested: number;
                rejected: number;
                notSubmitted: number;
            };
        }>>(
            "GET",
            `/api/academics/school/${schoolId}/homework/${homeworkId}/submissions`
        ),
        enabled: !!schoolId && !!homeworkId,
    });
};

// Submit Homework (Student or Parent)
export const useSubmitHomework = (schoolId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            homeworkId,
            content,
            attachmentUrl,
            attachmentFileName,
            studentId,
        }: {
            homeworkId: string;
            content?: string;
            attachmentUrl?: string;
            attachmentFileName?: string;
            studentId?: string;
        }) => useApi(
            "POST",
            `/api/academics/school/${schoolId}/homework/${homeworkId}/submit`,
            { content, attachmentUrl, attachmentFileName, studentId }
        ),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: homeworkKeys.lists() });
            queryClient.invalidateQueries({ queryKey: ['homework-submissions', schoolId, variables.homeworkId] });
        },
    });
};

// Review Submission (Teacher)
export const useReviewSubmission = (schoolId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            homeworkId,
            studentId,
            status,
            teacherRemarks,
            marksAwarded,
            maxMarks,
        }: {
            homeworkId: string;
            studentId: string;
            status?: 'accepted' | 'changes_requested' | 'rejected' | 'reviewed';
            teacherRemarks?: string;
            marksAwarded?: number;
            maxMarks?: number;
        }) => useApi(
            "PATCH",
            `/api/academics/school/${schoolId}/homework/${homeworkId}/submissions/${studentId}/review`,
            { status, teacherRemarks, marksAwarded, maxMarks }
        ),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['homework-submissions', schoolId, variables.homeworkId] });
            queryClient.invalidateQueries({ queryKey: homeworkKeys.lists() });
        },
    });
};
