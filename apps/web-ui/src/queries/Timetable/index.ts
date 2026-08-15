import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useApi from "../useApi";
import type {
    TimetableConfig,
    TimetableEntry,
    TimetableSchedule,
    SubstituteAssignment,
    Room,
    PeriodSwap,
    ClassTimetableResponse,
    TeacherTimetableResponse,
    TeacherFreePeriods,
    FreeTeacher,
    ConflictReport,
    TeacherWorkloadReport,
    SubjectDistribution,
    TimetableSummary,
    ExportTimetableData,
    CreateTimetableConfigRequest,
    UpdateTimetableConfigRequest,
    CreateTimetableScheduleRequest,
    UpdateTimetableScheduleRequest,
    ActiveScheduleResponse,
    CreateTimetableEntryRequest,
    UpdateTimetableEntryRequest,
    BulkCreateEntriesRequest,
    CreateSubstituteRequest,
    CreateRoomRequest,
    CreateSwapRequest,
    Period,
    Shift,
} from "../../types/timetable.types";

// API Response types
interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data: T;
}

// ==========================================
// TIMETABLE CONFIGURATION HOOKS
// ==========================================

export const useGetActiveConfig = (schoolId: string) => {
    return useQuery({
        queryKey: ["timetable-config", "active", schoolId],
        queryFn: () =>
            useApi<ApiResponse<TimetableConfig>>(
                "GET",
                `/api/academics/school/${schoolId}/config/active`
            ),
        enabled: !!schoolId,
    });
};

export const useGetAllConfigs = (schoolId: string) => {
    return useQuery({
        queryKey: ["timetable-configs", schoolId],
        queryFn: () =>
            useApi<ApiResponse<TimetableConfig[]>>(
                "GET",
                `/api/academics/school/${schoolId}/config`
            ),
        enabled: !!schoolId,
    });
};

export const useGetConfigById = (schoolId: string, configId: string) => {
    return useQuery({
        queryKey: ["timetable-config", schoolId, configId],
        queryFn: () =>
            useApi<ApiResponse<TimetableConfig>>(
                "GET",
                `/api/academics/school/${schoolId}/config/${configId}`
            ),
        enabled: !!schoolId && !!configId,
    });
};

export const useCreateConfig = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateTimetableConfigRequest) =>
            useApi<ApiResponse<TimetableConfig>>(
                "POST",
                `/api/academics/school/${schoolId}/config`,
                data
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["timetable-config", "active", schoolId] });
            queryClient.invalidateQueries({ queryKey: ["timetable-config", schoolId] });
            queryClient.invalidateQueries({ queryKey: ["timetable-configs", schoolId] });
        },
    });
};

export const useUpdateConfig = (schoolId: string, configId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: UpdateTimetableConfigRequest) =>
            useApi<ApiResponse<TimetableConfig>>(
                "PUT",
                `/api/academics/school/${schoolId}/config/${configId}`,
                data
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["timetable-config", "active", schoolId] });
            queryClient.invalidateQueries({ queryKey: ["timetable-config", schoolId] });
            queryClient.invalidateQueries({ queryKey: ["timetable-configs", schoolId] });
        },
    });
};

export const useSetActiveConfig = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (configId: string) =>
            useApi<ApiResponse<TimetableConfig>>(
                "PATCH" as any,
                `/api/academics/school/${schoolId}/config/${configId}/activate`
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["timetable-config", "active", schoolId] });
            queryClient.invalidateQueries({ queryKey: ["timetable-config", schoolId] });
            queryClient.invalidateQueries({ queryKey: ["timetable-configs", schoolId] });
        },
    });
};

// Toggle temporary disable for timetable
export const useToggleTimetableDisable = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { disabled?: boolean; disabledFrom?: string; disabledTo?: string; disabledReason?: string }) =>
            useApi<ApiResponse<TimetableConfig>>(
                "PATCH" as any,
                `/api/academics/school/${schoolId}/config/toggle-disable`,
                data
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["timetable-config", "active", schoolId] });
            queryClient.invalidateQueries({ queryKey: ["timetable-configs", schoolId] });
        },
    });
};

export const useDeleteConfig = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (configId: string) =>
            useApi<ApiResponse<void>>(
                "DELETE",
                `/api/academics/school/${schoolId}/config/${configId}`
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["timetable-config", "active", schoolId] });
            queryClient.invalidateQueries({ queryKey: ["timetable-configs", schoolId] });
        },
    });
};

export const useUpsertPeriod = (schoolId: string, configId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (periodData: Period) =>
            useApi<ApiResponse<TimetableConfig>>(
                "POST",
                `/api/academics/school/${schoolId}/config/${configId}/period`,
                periodData
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["timetable-config", "active", schoolId] });
            queryClient.invalidateQueries({ queryKey: ["timetable-config", schoolId] });
        },
    });
};

export const useRemovePeriod = (schoolId: string, configId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (periodNumber: number) =>
            useApi<ApiResponse<TimetableConfig>>(
                "DELETE",
                `/api/academics/school/${schoolId}/config/${configId}/period/${periodNumber}`
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["timetable-config", "active", schoolId] });
            queryClient.invalidateQueries({ queryKey: ["timetable-config", schoolId] });
        },
    });
};

export const useUpsertShift = (schoolId: string, configId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (shiftData: Shift) =>
            useApi<ApiResponse<TimetableConfig>>(
                "POST",
                `/api/academics/school/${schoolId}/config/${configId}/shift`,
                shiftData
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["timetable-config", "active", schoolId] });
            queryClient.invalidateQueries({ queryKey: ["timetable-config", schoolId] });
        },
    });
};

export const useRemoveShift = (schoolId: string, configId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (shiftId: string) =>
            useApi<ApiResponse<TimetableConfig>>(
                "DELETE",
                `/api/academics/school/${schoolId}/config/${configId}/shift/${shiftId}`
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["timetable-config", schoolId] });
        },
    });
};

// ==========================================
// TIMETABLE SCHEDULE HOOKS (Validity Periods)
// ==========================================

export const useGetTimetableSchedules = (schoolId: string, status?: string, scheduleType?: string, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ["timetable-schedules", schoolId, status, scheduleType],
        queryFn: () =>
            useApi<ApiResponse<TimetableSchedule[]>>(
                "GET",
                `/api/academics/school/${schoolId}/schedules`,
                undefined,
                { ...(status && { status }), ...(scheduleType && { scheduleType }) }
            ),
        enabled: !!schoolId && (options?.enabled ?? true),
    });
};

export const useGetActiveSchedule = (schoolId: string, date?: string, scheduleType?: string, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ["active-schedule", schoolId, date, scheduleType],
        queryFn: () =>
            useApi<ActiveScheduleResponse>(
                "GET",
                `/api/academics/school/${schoolId}/schedules/active`,
                undefined,
                { ...(date && { date }), ...(scheduleType && { scheduleType }) }
            ),
        enabled: !!schoolId && (options?.enabled ?? true),
    });
};

export const useCreateTimetableSchedule = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateTimetableScheduleRequest) =>
            useApi<ApiResponse<TimetableSchedule>>(
                "POST",
                `/api/academics/school/${schoolId}/schedules`,
                data
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["timetable-schedules", schoolId] });
            queryClient.invalidateQueries({ queryKey: ["active-schedule", schoolId] });
        },
    });
};

export const useUpdateTimetableSchedule = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ scheduleId, data }: { scheduleId: string; data: UpdateTimetableScheduleRequest }) =>
            useApi<ApiResponse<TimetableSchedule>>(
                "PUT",
                `/api/academics/school/${schoolId}/schedules/${scheduleId}`,
                data
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["timetable-schedules", schoolId] });
            queryClient.invalidateQueries({ queryKey: ["active-schedule", schoolId] });
        },
    });
};

export const useSubmitTimetableForApproval = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ scheduleId, payload }: { scheduleId: string; payload?: { source?: 'ai' | 'manual'; aiVersion?: number; name?: string } }) =>
            useApi<ApiResponse<TimetableSchedule>>(
                "POST",
                `/api/academics/school/${schoolId}/schedules/${scheduleId}/submit-approval`,
                payload
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["timetable-schedules", schoolId] });
            queryClient.invalidateQueries({ queryKey: ["active-schedule", schoolId] });
        },
    });
};

export const useToggleTimetableSchedule = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            scheduleId,
            status,
            rejectionComment,
            force,
        }: {
            scheduleId: string;
            status?: 'active' | 'disabled' | 'draft' | 'pending_approval' | 'rejected';
            rejectionComment?: string;
            force?: boolean;
        }) =>
            useApi<ApiResponse<TimetableSchedule>>(
                "PATCH" as any,
                `/api/academics/school/${schoolId}/schedules/${scheduleId}/toggle`,
                { status, rejectionComment, force }
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["timetable-schedules", schoolId] });
            queryClient.invalidateQueries({ queryKey: ["active-schedule", schoolId] });
        },
    });
};

// Fetch all schedules across all statuses (for admin history / rejected view)
export const useGetAllTimetableSchedules = (schoolId: string) => {
    return useQuery({
        queryKey: ["timetable-schedules-all", schoolId],
        queryFn: () =>
            useApi<ApiResponse<TimetableSchedule[]>>(
                "GET",
                `/api/academics/school/${schoolId}/schedules`,
                undefined,
                { status: "all" }
            ),
        enabled: !!schoolId,
    });
};

export const useDeleteTimetableSchedule = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (scheduleId: string) =>
            useApi<ApiResponse<void>>(
                "DELETE",
                `/api/academics/school/${schoolId}/schedules/${scheduleId}`
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["timetable-schedules", schoolId] });
            queryClient.invalidateQueries({ queryKey: ["active-schedule", schoolId] });
        },
    });
};

// ==========================================
// TIMETABLE ENTRY HOOKS
// ==========================================

export interface ActiveClass {
    classId: string;
    className: string;
    sectionId: string;
    sectionName: string;
}

export const useGetActiveClasses = (schoolId: string) => {
    return useQuery({
        queryKey: ["active-classes", schoolId],
        queryFn: () =>
            useApi<ApiResponse<ActiveClass[]>>(
                "GET",
                `/api/academics/school/${schoolId}/active-classes`
            ),
        enabled: !!schoolId,
    });
};

export const useCopyClassTimetable = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { targetClassId: string, targetSectionId: string, sourceClassId: string, sourceSectionId: string }) =>
            useApi<ApiResponse<TimetableEntry[]>>(
                "POST",
                `/api/academics/school/${schoolId}/copy`,
                data
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["class-timetable", schoolId] });
            queryClient.invalidateQueries({ queryKey: ["teacher-timetable", schoolId] });
            queryClient.invalidateQueries({ queryKey: ["timetable-entries-day", schoolId] });
            queryClient.invalidateQueries({ queryKey: ["active-classes", schoolId] });
        },
    });
};

export const useGetClassTimetable = (schoolId: string, classId: string, sectionId: string) => {
    return useQuery({
        queryKey: ["class-timetable", schoolId, classId, sectionId],
        queryFn: () =>
            useApi<ApiResponse<ClassTimetableResponse>>(
                "GET",
                `/api/academics/school/${schoolId}/class/${classId}/${sectionId}`
            ),
        enabled: !!schoolId && !!classId && !!sectionId,
    });
};

export const useGetTeacherTimetable = (schoolId: string, teacherId: string) => {
    return useQuery({
        queryKey: ["teacher-timetable", schoolId, teacherId],
        queryFn: () =>
            useApi<ApiResponse<TeacherTimetableResponse>>(
                "GET",
                `/api/academics/school/${schoolId}/teacher/${teacherId}`
            ),
        enabled: !!schoolId && !!teacherId,
    });
};

export const useGetEntriesByDay = (schoolId: string, dayOfWeek: string) => {
    return useQuery({
        queryKey: ["timetable-entries-day", schoolId, dayOfWeek],
        queryFn: () =>
            useApi<ApiResponse<TimetableEntry[]>>(
                "GET",
                `/api/academics/school/${schoolId}/day/${dayOfWeek}`
            ),
        enabled: !!schoolId && !!dayOfWeek,
    });
};

export const useCreateEntry = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateTimetableEntryRequest) =>
            useApi<ApiResponse<TimetableEntry>>(
                "POST",
                `/api/academics/school/${schoolId}/entry`,
                data
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["class-timetable", schoolId] });
            queryClient.invalidateQueries({ queryKey: ["teacher-timetable", schoolId] });
            queryClient.invalidateQueries({ queryKey: ["timetable-entries-day", schoolId] });
        },
    });
};

export const useBulkCreateEntries = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: BulkCreateEntriesRequest) =>
            useApi<ApiResponse<{ created: TimetableEntry[]; failed: any[] }>>(
                "POST",
                `/api/academics/school/${schoolId}/entries/bulk`,
                data
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["class-timetable", schoolId] });
            queryClient.invalidateQueries({ queryKey: ["teacher-timetable", schoolId] });
        },
    });
};

export const useUpdateEntry = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ entryId, data }: { entryId: string; data: UpdateTimetableEntryRequest }) =>
            useApi<ApiResponse<TimetableEntry>>(
                "PUT",
                `/api/academics/school/${schoolId}/entry/${entryId}`,
                data
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["class-timetable", schoolId] });
            queryClient.invalidateQueries({ queryKey: ["teacher-timetable", schoolId] });
        },
    });
};

export const useDeleteEntry = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (entryId: string) =>
            useApi<ApiResponse<void>>(
                "DELETE",
                `/api/academics/school/${schoolId}/entry/${entryId}`
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["class-timetable", schoolId] });
            queryClient.invalidateQueries({ queryKey: ["teacher-timetable", schoolId] });
        },
    });
};

export const useDeleteClassTimetable = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ classId, sectionId }: { classId: string; sectionId: string }) =>
            useApi<ApiResponse<void>>(
                "DELETE",
                `/api/academics/school/${schoolId}/class/${classId}/${sectionId}`
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["class-timetable", schoolId] });
            queryClient.invalidateQueries({ queryKey: ["active-classes", schoolId] });
        },
    });
};

export const useGetTeacherFreePeriods = (schoolId: string, teacherId: string, dayOfWeek?: string) => {
    return useQuery({
        queryKey: ["teacher-free-periods", schoolId, teacherId, dayOfWeek],
        queryFn: () =>
            useApi<ApiResponse<TeacherFreePeriods>>(
                "GET",
                `/api/academics/school/${schoolId}/teacher/${teacherId}/free-periods`,
                undefined,
                dayOfWeek ? { dayOfWeek } : undefined
            ),
        enabled: !!schoolId && !!teacherId,
    });
};

export const useGetFreeTeachers = (schoolId: string, dayOfWeek: string, periodNumber: number) => {
    return useQuery({
        queryKey: ["free-teachers", schoolId, dayOfWeek, periodNumber],
        queryFn: () =>
            useApi<ApiResponse<FreeTeacher[]>>(
                "GET",
                `/api/academics/school/${schoolId}/free-teachers`,
                undefined,
                { dayOfWeek, periodNumber }
            ),
        enabled: !!schoolId && !!dayOfWeek && periodNumber !== undefined,
    });
};

export const useGetConflictReport = (schoolId: string) => {
    return useQuery({
        queryKey: ["conflict-report", schoolId],
        queryFn: () =>
            useApi<ApiResponse<ConflictReport>>(
                "GET",
                `/api/academics/school/${schoolId}/conflicts`
            ),
        enabled: !!schoolId,
    });
};

// ==========================================
// AI TIMETABLE HOOKS
// ==========================================

export const useValidateAITimetable = (schoolId: string) => {
    return useMutation({
        mutationFn: (data: { rules: any[], options?: any }) =>
            useApi<ApiResponse<any>>(
                "POST",
                `/api/academics/school/${schoolId}/ai/validate`,
                data
            ),
    });
};

export const useSuggestAIRules = (schoolId: string) => {
    return useMutation({
        mutationFn: (data: { subjectIds: string[] }) =>
            useApi<ApiResponse<{
                suggestions: Record<string, {
                    periodsPerWeek: number;
                    maxPeriodsPerDay: number;
                    morningPriority: boolean;
                    tier: number;
                    tierLabel: string;
                }>;
                meta: {
                    workingDaysCount: number;
                    regularPeriodsPerDay: number;
                    totalWeeklySlots: number;
                };
            }>>(
                "POST",
                `/api/academics/school/${schoolId}/ai/suggest-rules`,
                data
            ),
    });
};

export const useGenerateAITimetable = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { rules: any[], classId?: string, sectionId?: string, options?: any }) =>
            useApi<ApiResponse<any>>(
                "POST",
                `/api/academics/school/${schoolId}/ai/generate`,
                data
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ai-draft", schoolId] });
            queryClient.invalidateQueries({ queryKey: ["ai-draft-versions", schoolId] });
        },
    });
};

export const useGetAIDraft = (schoolId: string, version?: number, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ["ai-draft", schoolId, version],
        queryFn: () =>
            useApi<ApiResponse<any>>(
                "GET",
                `/api/academics/school/${schoolId}/ai/draft${version ? `?version=${version}` : ""}`
            ),
        enabled: !!schoolId && (options?.enabled ?? true),
    });
};

export const useGetAIDraftVersions = (schoolId: string, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ["ai-draft-versions", schoolId],
        queryFn: () =>
            useApi<ApiResponse<any[]>>(
                "GET",
                `/api/academics/school/${schoolId}/ai/draft/versions`
            ),
        enabled: !!schoolId && (options?.enabled ?? true),
    });
};

export const useDeleteAIDraftVersion = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (version: number) =>
            useApi<ApiResponse<any>>(
                "DELETE",
                `/api/academics/school/${schoolId}/ai/draft/${version}`
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ai-draft-versions", schoolId] });
            queryClient.invalidateQueries({ queryKey: ["ai-draft", schoolId] });
        },
    });
};

export const usePublishAIDraft = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () =>
            useApi<ApiResponse<any>>(
                "POST",
                `/api/academics/school/${schoolId}/ai/draft/publish`
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["class-timetable", schoolId] });
            queryClient.invalidateQueries({ queryKey: ["teacher-timetable", schoolId] });
            queryClient.invalidateQueries({ queryKey: ["conflict-report", schoolId] });
            queryClient.invalidateQueries({ queryKey: ["ai-draft", schoolId] });
        },
    });
};

export const useUpdateAIDraftEntry = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { classId: string, sectionId: string, dayOfWeek: string, periodNumber: number, subjectId: string, teacherId: string }) =>
            useApi<ApiResponse<any>>(
                "POST",
                `/api/academics/school/${schoolId}/ai/draft/entry`,
                data
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ai-draft", schoolId] });
        },
    });
};

export const useDeleteAIDraftEntry = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { classId: string, sectionId: string, dayOfWeek: string, periodNumber: number }) =>
            useApi<ApiResponse<any>>(
                "DELETE",
                `/api/academics/school/${schoolId}/ai/draft/entry/${data.classId}/${data.sectionId}/${data.dayOfWeek}/${data.periodNumber}`
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ai-draft", schoolId] });
        },
    });
};

// ==========================================
// SUBSTITUTE HOOKS
// ==========================================

export const useCreateSubstitute = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateSubstituteRequest) =>
            useApi<ApiResponse<SubstituteAssignment>>(
                "POST",
                `/api/academics/school/${schoolId}/substitute`,
                data
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["substitutes", schoolId] });
        },
    });
};

export const useGetSubstitutesForDate = (schoolId: string, date: string, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ["substitutes", schoolId, date],
        queryFn: () =>
            useApi<ApiResponse<SubstituteAssignment[]>>(
                "GET",
                `/api/academics/school/${schoolId}/substitute/date/${date}`
            ),
        enabled: !!schoolId && !!date && (options?.enabled ?? true),
    });
};

export const useGetSubstituteHistory = (
    schoolId: string,
    params?: { teacherId?: string; startDate?: string; endDate?: string; limit?: number },
    options?: { enabled?: boolean }
) => {
    return useQuery({
        queryKey: ["substitute-history", schoolId, params],
        queryFn: () =>
            useApi<ApiResponse<SubstituteAssignment[]>>(
                "GET",
                `/api/academics/school/${schoolId}/substitute/history`,
                undefined,
                params
            ),
        enabled: !!schoolId && (options?.enabled ?? true),
    });
};

export const useCancelSubstitute = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (substituteId: string) =>
            useApi<ApiResponse<SubstituteAssignment>>(
                "PATCH" as any,
                `/api/academics/school/${schoolId}/substitute/${substituteId}/cancel`
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["substitutes", schoolId] });
        },
    });
};

// ==========================================
// ROOM HOOKS
// ==========================================

export const useGetAllRooms = (schoolId: string, type?: string) => {
    return useQuery({
        queryKey: ["rooms", schoolId, type],
        queryFn: () =>
            useApi<ApiResponse<Room[]>>(
                "GET",
                `/api/academics/school/${schoolId}/rooms`,
                undefined,
                type ? { type } : undefined
            ),
        enabled: !!schoolId,
    });
};

export const useGetRoomById = (schoolId: string, roomId: string) => {
    return useQuery({
        queryKey: ["room", schoolId, roomId],
        queryFn: () =>
            useApi<ApiResponse<Room>>(
                "GET",
                `/api/academics/school/${schoolId}/room/${roomId}`
            ),
        enabled: !!schoolId && !!roomId,
    });
};

export const useCreateRoom = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateRoomRequest) =>
            useApi<ApiResponse<Room>>(
                "POST",
                `/api/academics/school/${schoolId}/room`,
                data
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["rooms", schoolId] });
        },
    });
};

export const useUpdateRoom = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ roomId, data }: { roomId: string; data: Partial<CreateRoomRequest> }) =>
            useApi<ApiResponse<Room>>(
                "PUT",
                `/api/academics/school/${schoolId}/room/${roomId}`,
                data
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["rooms", schoolId] });
        },
    });
};

export const useDeleteRoom = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (roomId: string) =>
            useApi<ApiResponse<void>>(
                "DELETE",
                `/api/academics/school/${schoolId}/room/${roomId}`
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["rooms", schoolId] });
        },
    });
};

export const useGetRoomAvailability = (schoolId: string, roomId: string, dayOfWeek: string) => {
    return useQuery({
        queryKey: ["room-availability", schoolId, roomId, dayOfWeek],
        queryFn: () =>
            useApi<ApiResponse<any>>(
                "GET",
                `/api/academics/school/${schoolId}/room/${roomId}/availability`,
                undefined,
                { dayOfWeek }
            ),
        enabled: !!schoolId && !!roomId && !!dayOfWeek,
    });
};

export const useGetAvailableRooms = (schoolId: string, dayOfWeek: string, periodNumber: number, type?: string) => {
    return useQuery({
        queryKey: ["available-rooms", schoolId, dayOfWeek, periodNumber, type],
        queryFn: () =>
            useApi<ApiResponse<Room[]>>(
                "GET",
                `/api/academics/school/${schoolId}/rooms/available`,
                undefined,
                { dayOfWeek, periodNumber, ...(type && { type }) }
            ),
        enabled: !!schoolId && !!dayOfWeek && periodNumber !== undefined,
    });
};

// ==========================================
// PERIOD SWAP HOOKS
// ==========================================

export const useRequestSwap = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateSwapRequest) =>
            useApi<ApiResponse<PeriodSwap>>(
                "POST",
                `/api/academics/school/${schoolId}/swap`,
                data
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["swaps", schoolId] });
        },
    });
};

export const useGetSwapRequests = (schoolId: string, status?: string, teacherId?: string) => {
    return useQuery({
        queryKey: ["swaps", schoolId, status, teacherId],
        queryFn: () =>
            useApi<ApiResponse<PeriodSwap[]>>(
                "GET",
                `/api/academics/school/${schoolId}/swaps`,
                undefined,
                { ...(status && { status }), ...(teacherId && { teacherId }) }
            ),
        enabled: !!schoolId,
    });
};

export const useApproveSwap = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (swapId: string) =>
            useApi<ApiResponse<PeriodSwap>>(
                "PATCH" as any,
                `/api/academics/school/${schoolId}/swap/${swapId}/approve`
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["swaps", schoolId] });
        },
    });
};

export const useRejectSwap = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ swapId, rejectionReason }: { swapId: string; rejectionReason?: string }) =>
            useApi<ApiResponse<PeriodSwap>>(
                "PATCH" as any,
                `/api/academics/school/${schoolId}/swap/${swapId}/reject`,
                { rejectionReason }
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["swaps", schoolId] });
        },
    });
};

export const useCancelSwap = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (swapId: string) =>
            useApi<ApiResponse<PeriodSwap>>(
                "PATCH" as any,
                `/api/academics/school/${schoolId}/swap/${swapId}/cancel`
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["swaps", schoolId] });
        },
    });
};

// ==========================================
// REPORT HOOKS
// ==========================================

export const useGetTeacherWorkload = (schoolId: string, teacherId?: string) => {
    return useQuery({
        queryKey: ["teacher-workload", schoolId, teacherId],
        queryFn: () =>
            useApi<ApiResponse<TeacherWorkloadReport>>(
                "GET",
                `/api/academics/school/${schoolId}/reports/teacher-workload`,
                undefined,
                teacherId ? { teacherId } : undefined
            ),
        enabled: !!schoolId,
    });
};

export const useGetSubjectDistribution = (schoolId: string, classId?: string) => {
    return useQuery({
        queryKey: ["subject-distribution", schoolId, classId],
        queryFn: () =>
            useApi<ApiResponse<SubjectDistribution[]>>(
                "GET",
                `/api/academics/school/${schoolId}/reports/subject-distribution`,
                undefined,
                classId ? { classId } : undefined
            ),
        enabled: !!schoolId,
    });
};

export const useGetTimetableSummary = (schoolId: string) => {
    return useQuery({
        queryKey: ["timetable-summary", schoolId],
        queryFn: () =>
            useApi<ApiResponse<TimetableSummary>>(
                "GET",
                `/api/academics/school/${schoolId}/reports/summary`
            ),
        enabled: !!schoolId,
    });
};

export const useExportTimetable = (schoolId: string, type: 'class' | 'teacher', id: string) => {
    return useQuery({
        queryKey: ["export-timetable", schoolId, type, id],
        queryFn: () =>
            useApi<ApiResponse<ExportTimetableData>>(
                "GET",
                `/api/academics/school/${schoolId}/export`,
                undefined,
                { type, id }
            ),
        enabled: !!schoolId && !!type && !!id,
    });
};

// ==========================================
// LEAVE INTEGRATION HOOKS
// ==========================================

interface TeachersOnLeaveResponse {
    date: string;
    teacherIds: string[];
    leaves: {
        teacherId: string;
        teacherName: string;
        leaveType: string;
        reason: string;
    }[];
}

export const useGetTeachersOnLeave = (schoolId: string, date: string) => {
    return useQuery({
        queryKey: ["teachers-on-leave", schoolId, date],
        queryFn: () =>
            useApi<ApiResponse<TeachersOnLeaveResponse>>(
                "GET",
                `/api/school/${schoolId}/leave/teachers-on-leave`,
                undefined,
                { date }
            ),
        enabled: !!schoolId && !!date,
    });
};
