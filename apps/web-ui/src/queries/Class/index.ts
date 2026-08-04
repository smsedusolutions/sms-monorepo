import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useApi from "../useApi";
import type {
    ApiResponse,
    Class,
    CreateClassPayload,
    UpdateClassPayload,
    AddSectionPayload,
    AssignClassTeacherPayload,
    ClassFilters,
} from "../../types";

// Query Keys
export const classKeys = {
    all: (schoolId: string) => ["classes", schoolId] as const,
    detail: (schoolId: string, classId: string) =>
        ["classes", schoolId, classId] as const,
    filtered: (schoolId: string, filters: ClassFilters) =>
        ["classes", schoolId, filters] as const,
};

// Get all classes in a school
export const useGetClasses = (schoolId: string, filters?: ClassFilters) => {
    return useQuery({
        queryKey: filters
            ? classKeys.filtered(schoolId, filters)
            : classKeys.all(schoolId),
        queryFn: () =>
            useApi<ApiResponse<Class[]>>(
                "GET",
                `/api/school/${schoolId}/classes`,
                undefined,
                filters as Record<string, unknown>
            ),
        enabled: !!schoolId,
        staleTime: 5 * 60 * 1000,
    });
};

// Get class by ID
export const useGetClassById = (schoolId: string, classId: string) => {
    return useQuery({
        queryKey: classKeys.detail(schoolId, classId),
        queryFn: () =>
            useApi<ApiResponse<Class>>(
                "GET",
                `/api/school/${schoolId}/classes/${classId}`
            ),
        enabled: !!schoolId && !!classId,
    });
};

// Create class
export const useCreateClass = (schoolId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateClassPayload) =>
            useApi<ApiResponse<Class>>(
                "POST",
                `/api/school/${schoolId}/classes`,
                data
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["classes", schoolId], exact: false });
        },
    });
};

// Update class
export const useUpdateClass = (schoolId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            classId,
            data,
        }: {
            classId: string;
            data: UpdateClassPayload;
        }) =>
            useApi<ApiResponse<Class>>(
                "PUT",
                `/api/school/${schoolId}/classes/${classId}`,
                data
            ),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["classes", schoolId], exact: false });
            queryClient.invalidateQueries({
                queryKey: classKeys.detail(schoolId, variables.classId),
            });
        },
    });
};

// Delete class (soft delete)
export const useDeleteClass = (schoolId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (classId: string) =>
            useApi<ApiResponse<Class>>(
                "DELETE",
                `/api/school/${schoolId}/classes/${classId}`
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["classes", schoolId], exact: false });
        },
    });
};

// Add section to class
export const useAddSection = (schoolId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            classId,
            data,
        }: {
            classId: string;
            data: AddSectionPayload;
        }) =>
            useApi<ApiResponse<Class>>(
                "POST",
                `/api/school/${schoolId}/classes/${classId}/sections`,
                data
            ),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["classes", schoolId], exact: false });
            queryClient.invalidateQueries({
                queryKey: classKeys.detail(schoolId, variables.classId),
            });
        },
    });
};

// Remove section from class
export const useRemoveSection = (schoolId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            classId,
            sectionId,
        }: {
            classId: string;
            sectionId: string;
        }) =>
            useApi<ApiResponse<Class>>(
                "DELETE",
                `/api/school/${schoolId}/classes/${classId}/sections/${sectionId}`
            ),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["classes", schoolId], exact: false });
            queryClient.invalidateQueries({ queryKey: ["teachers", schoolId], exact: false });
            queryClient.invalidateQueries({
                queryKey: classKeys.detail(schoolId, variables.classId),
            });
        },
    });
};

// Assign class teacher to section
export const useAssignClassTeacher = (schoolId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            classId,
            sectionId,
            data,
        }: {
            classId: string;
            sectionId: string;
            data: AssignClassTeacherPayload;
        }) =>
            useApi<ApiResponse<Class>>(
                "PUT",
                `/api/school/${schoolId}/classes/${classId}/sections/${sectionId}/teacher`,
                data
            ),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["classes", schoolId], exact: false });
            queryClient.invalidateQueries({ queryKey: ["teachers", schoolId], exact: false });
            queryClient.invalidateQueries({
                queryKey: classKeys.detail(schoolId, variables.classId),
            });
        },
    });
};
