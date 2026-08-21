import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useApi from "../useApi";
import type { ApiResponse, CalendarEvent, CreateCalendarEventPayload, UpdateCalendarEventPayload } from "../../types";

export interface GetCalendarEventsParams extends Record<string, unknown> {
  from?: string;
  to?: string;
  eventType?: string;
  audience?: string;
  search?: string;
}

// 1. Get calendar events (Role-filtered by backend)
export const useGetCalendarEvents = (
  schoolId: string,
  params?: GetCalendarEventsParams,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["school-calendar", schoolId, params],
    queryFn: () =>
      useApi<ApiResponse<CalendarEvent[]>>(
        "GET",
        `/api/academics/school/${schoolId}/calendar`,
        undefined,
        params
      ),
    enabled: !!schoolId && enabled,
    staleTime: 5 * 60 * 1000,
  });
};

// 2. Create calendar event (Admin & Principal)
export const useCreateCalendarEvent = (schoolId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCalendarEventPayload) =>
      useApi<ApiResponse<CalendarEvent>>(
        "POST",
        `/api/academics/school/${schoolId}/calendar`,
        payload
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-calendar"] });
    },
  });
};

// 3. Update calendar event (Admin & Principal)
export const useUpdateCalendarEvent = (schoolId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, payload }: { eventId: string; payload: UpdateCalendarEventPayload }) =>
      useApi<ApiResponse<CalendarEvent>>(
        "PUT",
        `/api/academics/school/${schoolId}/calendar/${eventId}`,
        payload
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-calendar"] });
    },
  });
};

// 4. Delete calendar event (Admin & Principal)
export const useDeleteCalendarEvent = (schoolId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) =>
      useApi<ApiResponse<void>>(
        "DELETE",
        `/api/academics/school/${schoolId}/calendar/${eventId}`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-calendar"] });
    },
  });
};
