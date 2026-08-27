import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import useApi from "../useApi";
import type { Notification, NotificationFilters } from "../../types";

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
export const notificationKeys = {
    all: ['notifications'] as const,
    lists: () => [...notificationKeys.all, 'list'] as const,
    list: (schoolId: string, filters?: NotificationFilters) => [...notificationKeys.lists(), schoolId, filters] as const,
    unreadCount: (schoolId: string) => [...notificationKeys.all, 'unread-count', schoolId] as const,
};

// Get my notifications
export const useGetMyNotifications = (
    schoolId: string,
    filters?: NotificationFilters
) => {
    return useQuery({
        queryKey: notificationKeys.list(schoolId, filters),
        queryFn: () => useApi<ApiResponse<Notification[]>>(
            "GET",
            `/api/school/${schoolId}/notifications`,
            undefined,
            filters as Record<string, unknown>
        ),
        enabled: !!schoolId,
        placeholderData: keepPreviousData,
    });
};

// Get unread count (for bell icon badge)
export const useGetUnreadCount = (schoolId: string) => {
    return useQuery({
        queryKey: notificationKeys.unreadCount(schoolId),
        queryFn: () => useApi<ApiResponse<{ unreadCount: number }>>(
            "GET",
            `/api/school/${schoolId}/notifications/unread-count`
        ),
        enabled: !!schoolId,
    });
};

// Mark notification as read
export const useMarkAsRead = (schoolId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (notificationId: string) => useApi(
            "PUT",
            `/api/school/${schoolId}/notifications/${notificationId}/read`
        ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
            queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount(schoolId) });
        },
    });
};

// Mark all as read
export const useMarkAllAsRead = (schoolId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => useApi(
            "PUT",
            `/api/school/${schoolId}/notifications/mark-all-read`
        ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
            queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount(schoolId) });
        },
    });
};

// Delete notification
export const useDeleteNotification = (schoolId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (notificationId: string) => useApi(
            "DELETE",
            `/api/school/${schoolId}/notifications/${notificationId}`
        ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
            queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount(schoolId) });
        },
    });
};

// Broadcast notification to all devices across school
export const useBroadcastNotification = (schoolId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: {
            title: string;
            message: string;
            targetAudience?: "all" | "parents" | "teachers" | "students";
            type?: string;
        }) => useApi(
            "POST",
            `/api/school/${schoolId}/notifications/broadcast`,
            payload
        ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
            queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount(schoolId) });
        },
    });
};
