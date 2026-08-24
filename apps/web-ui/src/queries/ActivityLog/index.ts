import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import useApi from "../useApi";
import type { ActivityLog, LogStatistics, ApiResponse, ActivityLogFilters } from "../../types";

export const useGetActivityLogs = (schoolId: string, filters: ActivityLogFilters) => {
  return useQuery({
    queryKey: ["activity-logs", schoolId, filters],
    queryFn: () =>
      useApi<ApiResponse<ActivityLog[]>>("GET", `/api/school/${schoolId}/logs`, undefined, filters as any),
    enabled: !!schoolId,
    placeholderData: keepPreviousData,
  });
};

export const useGetLogStats = (schoolId: string) => {
  return useQuery({
    queryKey: ["activity-log-stats", schoolId],
    queryFn: () =>
      useApi<ApiResponse<LogStatistics>>("GET", `/api/school/${schoolId}/logs/stats`),
    enabled: !!schoolId,
  });
};

export const useClearLogs = (schoolId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      useApi<ApiResponse<any>>("DELETE", `/api/school/${schoolId}/logs/clear`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity-logs", schoolId] });
      queryClient.invalidateQueries({ queryKey: ["activity-log-stats", schoolId] });
    },
  });
};
