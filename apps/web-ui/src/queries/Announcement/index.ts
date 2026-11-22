import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useApi from "../useApi";
import type { Announcement, CreateAnnouncementPayload, UpdateAnnouncementPayload } from "../../types";

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

// Query Keys
export const announcementKeys = {
    all: ['announcements'] as const,
    lists: () => [...announcementKeys.all, 'list'] as const,
    list: (schoolId: string, filters?: AnnouncementFilters | Record<string, unknown>) => [...announcementKeys.lists(), schoolId, filters] as const,
    my: (schoolId: string) => [...announcementKeys.all, 'my', schoolId] as const,
    details: () => [...announcementKeys.all, 'detail'] as const,
    detail: (schoolId: string, id: string) => [...announcementKeys.details(), schoolId, id] as const,
};

export interface AnnouncementFilters extends Record<string, unknown> {
    category?: string;
    priority?: string;
    targetAudience?: string;
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
}

// Get all announcements (filtered by role)
export const useGetAnnouncements = (
    schoolId: string,
    filters?: AnnouncementFilters
) => {
    return useQuery({
        queryKey: announcementKeys.list(schoolId, filters as Record<string, unknown> | undefined),
        queryFn: () => useApi<ApiResponse<Announcement[]>>(
            "GET",
            `/api/school/${schoolId}/announcements`,
            undefined,
            filters as Record<string, unknown> | undefined
        ),
        enabled: !!schoolId,
    });
};

// Get single announcement by ID
export const useGetAnnouncementById = (schoolId: string, announcementId: string) => {
    return useQuery({
        queryKey: announcementKeys.detail(schoolId, announcementId),
        queryFn: () => useApi<ApiResponse<Announcement>>(
            "GET",
            `/api/school/${schoolId}/announcements/${announcementId}`
        ),
        enabled: !!schoolId && !!announcementId,
    });
};

// Get my announcements (for teachers)
export const useGetMyAnnouncements = (schoolId: string) => {
    return useQuery({
        queryKey: announcementKeys.my(schoolId),
        queryFn: () => useApi<ApiResponse<Announcement[]>>(
            "GET",
            `/api/school/${schoolId}/announcements/my`
        ),
        enabled: !!schoolId,
    });
};

// Create announcement
export const useCreateAnnouncement = (schoolId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateAnnouncementPayload) => useApi(
            "POST",
            `/api/school/${schoolId}/announcements`,
            payload
        ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
            queryClient.invalidateQueries({ queryKey: announcementKeys.my(schoolId) });
        },
    });
};

// Update announcement
export const useUpdateAnnouncement = (schoolId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ announcementId, ...payload }: UpdateAnnouncementPayload & { announcementId: string }) => useApi(
            "PUT",
            `/api/school/${schoolId}/announcements/${announcementId}`,
            payload
        ),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
            queryClient.invalidateQueries({ queryKey: announcementKeys.detail(schoolId, variables.announcementId) });
            queryClient.invalidateQueries({ queryKey: announcementKeys.my(schoolId) });
        },
    });
};

// Delete (archive) announcement
export const useDeleteAnnouncement = (schoolId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (announcementId: string) => useApi(
            "DELETE",
            `/api/school/${schoolId}/announcements/${announcementId}`
        ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
            queryClient.invalidateQueries({ queryKey: announcementKeys.my(schoolId) });
        },
    });
};

// Mark announcement as seen
export const useMarkAnnouncementSeen = (schoolId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (announcementId: string) => useApi(
            "POST",
            `/api/school/${schoolId}/announcements/${announcementId}/seen`
        ),
        onSuccess: (_, announcementId) => {
            // Update the specific announcement in the list
            queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
            queryClient.invalidateQueries({ queryKey: announcementKeys.detail(schoolId, announcementId) });
        },
    });
};

// Get announcement seen status (for admin/teacher)
export const useGetAnnouncementSeenStatus = (schoolId: string, announcementId: string) => {
    return useQuery({
        queryKey: [...announcementKeys.detail(schoolId, announcementId), 'seenStatus'],
        queryFn: () => useApi<ApiResponse<{
            seenBy: { userId: string; userRole: string; seenAt: string }[];
            seenCount: number;
            targetAudience: string;
            targetClasses?: string[];
        }>>(
            "GET",
            `/api/school/${schoolId}/announcements/${announcementId}/seen-status`
        ),
        enabled: !!schoolId && !!announcementId,
    });
};
