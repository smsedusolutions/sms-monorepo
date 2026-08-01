import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useApi from "../useApi";
import type {
    ApiResponse,
    Subject,
    CreateSubjectPayload,
    UpdateSubjectPayload,
    SubjectFilters,
} from "../../types";

// Query Keys
export const subjectKeys = {
    all: (schoolId: string) => ["subjects", schoolId] as const,
    detail: (schoolId: string, subjectId: string) =>
        ["subjects", schoolId, subjectId] as const,
    filtered: (schoolId: string, filters: SubjectFilters) =>
        ["subjects", schoolId, filters] as const,
};

// Get all subjects in a school
export const useGetSubjects = (schoolId: string, filters?: SubjectFilters) => {
    return useQuery({
        queryKey: filters
            ? subjectKeys.filtered(schoolId, filters)
            : subjectKeys.all(schoolId),
        queryFn: () =>
            useApi<ApiResponse<Subject[]>>(
                "GET",
                `/api/school/${schoolId}/subjects`,
                undefined,
                filters as Record<string, unknown>
            ),
        enabled: !!schoolId,
        staleTime: 10 * 60 * 1000,
    });
};

// Get subject by ID
export const useGetSubjectById = (schoolId: string, subjectId: string) => {
    return useQuery({
        queryKey: subjectKeys.detail(schoolId, subjectId),
        queryFn: () =>
            useApi<ApiResponse<Subject>>(
                "GET",
                `/api/school/${schoolId}/subjects/${subjectId}`
            ),
        enabled: !!schoolId && !!subjectId,
    });
};

// Create subject
export const useCreateSubject = (schoolId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateSubjectPayload) =>
            useApi<ApiResponse<Subject>>(
                "POST",
                `/api/school/${schoolId}/subjects`,
                data
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subjects", schoolId], exact: false });
            queryClient.invalidateQueries({ queryKey: ["teachers", schoolId], exact: false });
        },
    });
};

// Update subject
export const useUpdateSubject = (schoolId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            subjectId,
            data,
        }: {
            subjectId: string;
            data: UpdateSubjectPayload;
        }) =>
            useApi<ApiResponse<Subject>>(
                "PUT",
                `/api/school/${schoolId}/subjects/${subjectId}`,
                data
            ),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["subjects", schoolId], exact: false });
            queryClient.invalidateQueries({
                queryKey: subjectKeys.detail(schoolId, variables.subjectId),
            });
            queryClient.invalidateQueries({ queryKey: ["teachers", schoolId], exact: false });
        },
    });
};

// Delete subject (soft delete)
export const useDeleteSubject = (schoolId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (subjectId: string) =>
            useApi<ApiResponse<Subject>>(
                "DELETE",
                `/api/school/${schoolId}/subjects/${subjectId}`
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subjects", schoolId], exact: false });
            queryClient.invalidateQueries({ queryKey: ["teachers", schoolId], exact: false });
        },
    });
};
