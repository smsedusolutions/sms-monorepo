import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useApi from "../useApi";
import type {
    ApiResponse,
    LeaveRequest,
    ApplyLeavePayload,
    ProcessLeavePayload,
    LeaveSummary,
} from "../../types";

// ==========================================
// QUERY KEYS
// ==========================================
export const leaveKeys = {
    myLeaves: (schoolId: string) =>
        ["leave", "my", schoolId] as const,
    allLeaves: (schoolId: string) =>
        ["leave", "all", schoolId] as const,
    leaveById: (schoolId: string, leaveId: string) =>
        ["leave", schoolId, leaveId] as const,
};

// ==========================================
// HOOKS
// ==========================================

/**
 * Apply for leave (Student/Teacher)
 */
export const useApplyLeave = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: ApplyLeavePayload) =>
            useApi<ApiResponse<LeaveRequest>>(
                "POST",
                `/api/school/${schoolId}/leave/apply`,
                data
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leave"] });
        },
    });
};

/**
 * Get leave requests for parent's children
 */
export const useGetParentLeaves = (
    schoolId: string,
    options?: { status?: string }
) => {
    return useQuery({
        queryKey: ["leave", "parent", schoolId, options],
        queryFn: () =>
            useApi<ApiResponse<{ leaves: (LeaveRequest & { childName?: string })[]; summary: LeaveSummary }>>(
                "GET",
                `/api/school/${schoolId}/leave/parent`,
                undefined,
                options
            ),
        enabled: !!schoolId,
    });
};

/**
 * Get my leave requests (Student/Teacher)
 */
export const useGetMyLeaves = (
    schoolId: string,
    options?: { status?: string; startDate?: string; endDate?: string }
) => {
    return useQuery({
        queryKey: [...leaveKeys.myLeaves(schoolId), options],
        queryFn: () =>
            useApi<ApiResponse<{ leaves: LeaveRequest[]; summary: LeaveSummary }>>(
                "GET",
                `/api/school/${schoolId}/leave/my`,
                undefined,
                options
            ),
        enabled: !!schoolId,
    });
};

/**
 * Get all leave requests (Admin)
 */
export const useGetAllLeaves = (
    schoolId: string,
    options?: { status?: string; applicantType?: string; startDate?: string; endDate?: string }
) => {
    return useQuery({
        queryKey: [...leaveKeys.allLeaves(schoolId), options],
        queryFn: () =>
            useApi<ApiResponse<{ leaves: LeaveRequest[]; summary: LeaveSummary }>>(
                "GET",
                `/api/school/${schoolId}/leave/all`,
                undefined,
                options
            ),
        enabled: !!schoolId,
    });
};

/**
 * Process leave (Admin approve/reject)
 */
export const useProcessLeave = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ leaveId, ...data }: ProcessLeavePayload & { leaveId: string }) =>
            useApi<ApiResponse<LeaveRequest>>(
                "PUT",
                `/api/school/${schoolId}/leave/${leaveId}/process`,
                data
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leave"] });
        },
    });
};

/**
 * Get single leave by ID
 */
export const useGetLeaveById = (schoolId: string, leaveId: string) => {
    return useQuery({
        queryKey: leaveKeys.leaveById(schoolId, leaveId),
        queryFn: () =>
            useApi<ApiResponse<LeaveRequest>>(
                "GET",
                `/api/school/${schoolId}/leave/${leaveId}`
            ),
        enabled: !!schoolId && !!leaveId,
    });
};

/**
 * Cancel pending leave request
 */
export const useCancelLeave = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (leaveId: string) =>
            useApi<ApiResponse<null>>(
                "DELETE",
                `/api/school/${schoolId}/leave/${leaveId}`
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leave"] });
        },
    });
};

/**
 * Get leave statistics for dashboard (Admin)
 */
export interface LeaveStats {
    todayPending: number;
    todayTotal: number;
    totalPending: number;
    teacherPending: number;
    studentPending: number;
}

export const useGetLeaveStats = (schoolId: string) => {
    return useQuery({
        queryKey: ["leave", "stats", schoolId],
        queryFn: () =>
            useApi<ApiResponse<LeaveStats>>(
                "GET",
                `/api/school/${schoolId}/leave/stats`
            ),
        enabled: !!schoolId,
    });
};

/**
 * Get student leave requests for class teacher
 */
export const useGetStudentLeavesForTeacher = (
    schoolId: string,
    options?: { status?: string; classId?: string }
) => {
    return useQuery({
        queryKey: ["leave", "class-leaves", schoolId, options],
        queryFn: () =>
            useApi<ApiResponse<{ leaves: LeaveRequest[]; summary: LeaveSummary }>>(
                "GET",
                `/api/school/${schoolId}/leave/class-leaves`,
                undefined,
                options
            ),
        enabled: !!schoolId,
    });
};
