import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useApi from "../useApi";
import type {
    AcademicYear,
    CreateAcademicYearRequest,
    UpdateAcademicYearRequest
} from "../../types/academicYear.types";
import type { ApiResponse } from "../../types/exam.types";

export const ACADEMIC_YEAR_KEYS = {
    ALL: "academicYears",
    CURRENT: "currentAcademicYear"
};

// 1. Get All Academic Years for a School
export const useGetAcademicYears = (schoolId: string) => {
    return useQuery({
        queryKey: [ACADEMIC_YEAR_KEYS.ALL, schoolId],
        queryFn: () => useApi<ApiResponse<AcademicYear[]>>("GET", `/api/academics/school/${schoolId}/academic-years`),
        enabled: !!schoolId,
        staleTime: 5 * 60 * 1000 // 5 minutes
    });
};

// 2. Get Current Active Academic Year for a School
export const useGetCurrentAcademicYear = (schoolId: string) => {
    return useQuery({
        queryKey: [ACADEMIC_YEAR_KEYS.CURRENT, schoolId],
        queryFn: () => useApi<ApiResponse<AcademicYear>>("GET", `/api/academics/school/${schoolId}/academic-years/current`),
        enabled: !!schoolId,
        staleTime: 5 * 60 * 1000
    });
};

// 3. Create a New Academic Year
export const useCreateAcademicYear = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateAcademicYearRequest) =>
            useApi<ApiResponse<AcademicYear>>("POST", `/api/academics/school/${schoolId}/academic-years`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [ACADEMIC_YEAR_KEYS.ALL, schoolId] });
            queryClient.invalidateQueries({ queryKey: [ACADEMIC_YEAR_KEYS.CURRENT, schoolId] });
        }
    });
};

// 4. Update an Academic Year
export const useUpdateAcademicYear = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateAcademicYearRequest }) =>
            useApi<ApiResponse<AcademicYear>>("PUT", `/api/academics/school/${schoolId}/academic-years/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [ACADEMIC_YEAR_KEYS.ALL, schoolId] });
            queryClient.invalidateQueries({ queryKey: [ACADEMIC_YEAR_KEYS.CURRENT, schoolId] });
        }
    });
};

// 5. Set an Academic Year as Current Active
export const useSetCurrentAcademicYear = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) =>
            useApi<ApiResponse<AcademicYear>>("PATCH", `/api/academics/school/${schoolId}/academic-years/${id}/set-current`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [ACADEMIC_YEAR_KEYS.ALL, schoolId] });
            queryClient.invalidateQueries({ queryKey: [ACADEMIC_YEAR_KEYS.CURRENT, schoolId] });
        }
    });
};

// 6. Delete an Academic Year
export const useDeleteAcademicYear = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) =>
            useApi<ApiResponse<void>>("DELETE", `/api/academics/school/${schoolId}/academic-years/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [ACADEMIC_YEAR_KEYS.ALL, schoolId] });
            queryClient.invalidateQueries({ queryKey: [ACADEMIC_YEAR_KEYS.CURRENT, schoolId] });
        }
    });
};
