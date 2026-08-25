import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useApi from "../useApi";
import type {
    ApiResponse,
    AttendanceSimple,
    AttendancePeriod,
    AttendanceCheckin,
    TeacherAttendance,
    MarkSimpleAttendancePayload,
    MarkPeriodAttendancePayload,
    CheckInPayload,
    MarkTeacherAttendancePayload,
    DailyReport,
    MonthlyReport,
    ClassWiseReport,
    AttendanceSummary,
} from "../../types";

// ==========================================
// QUERY KEYS
// ==========================================
export const attendanceKeys = {
    // Simple
    simpleClass: (schoolId: string, classId: string, date: string) =>
        ["attendance", "simple", schoolId, classId, date] as const,
    simpleStudent: (schoolId: string, studentId: string, startDate?: string, endDate?: string) =>
        ["attendance", "simple", "student", schoolId, studentId, startDate, endDate] as const,
    simpleSummary: (schoolId: string) =>
        ["attendance", "simple", "summary", schoolId] as const,
    // Period
    periodClass: (schoolId: string, classId: string, date: string, period?: number, sectionId?: string) =>
        ["attendance", "period", schoolId, classId, date, period, sectionId] as const,
    periodStudent: (schoolId: string, studentId: string, startDate?: string, endDate?: string, subjectId?: string) =>
        ["attendance", "period", "student", schoolId, studentId, startDate, endDate, subjectId] as const,
    // Checkin
    checkinDaily: (schoolId: string, date: string) =>
        ["attendance", "checkin", schoolId, date] as const,
    checkinStatus: (schoolId: string, userId: string) =>
        ["attendance", "checkin", "status", schoolId, userId] as const,
    // Teacher
    teacherStatus: (schoolId: string) =>
        ["attendance", "teacher", "status", schoolId] as const,
    teacherDaily: (schoolId: string, date: string) =>
        ["attendance", "teacher", "daily", schoolId, date] as const,
    teacherHistory: (schoolId: string, teacherId: string) =>
        ["attendance", "teacher", "history", schoolId, teacherId] as const,
    // Reports
    dailyReport: (schoolId: string, date: string) =>
        ["attendance", "reports", "daily", schoolId, date] as const,
    monthlyReport: (schoolId: string, year: number, month: number) =>
        ["attendance", "reports", "monthly", schoolId, year, month] as const,
    rangeReport: (schoolId: string, startDate: string, endDate: string) =>
        ["attendance", "reports", "range", schoolId, startDate, endDate] as const,
    classWiseReport: (schoolId: string, date: string) =>
        ["attendance", "reports", "classwise", schoolId, date] as const,
};

// ==========================================
// SIMPLE DAILY ATTENDANCE HOOKS
// ==========================================

export const useMarkSimpleAttendance = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: MarkSimpleAttendancePayload) =>
            useApi<ApiResponse<{ results: unknown[]; errors: unknown[] }>>(
                "POST",
                `/api/school/${schoolId}/attendance/simple/mark`,
                data
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["attendance"] });
            queryClient.invalidateQueries({ queryKey: ["parent-portal"] });
        },
    });
};

export const useGetSimpleClassAttendance = (
    schoolId: string,
    classId: string,
    date: string,
    sectionId?: string
) => {
    return useQuery({
        queryKey: attendanceKeys.simpleClass(schoolId, classId, date),
        queryFn: () =>
            useApi<ApiResponse<AttendanceSimple[]>>(
                "GET",
                `/api/school/${schoolId}/attendance/simple/class/${classId}/${date}`,
                undefined,
                sectionId ? { sectionId } : undefined
            ),
        enabled: !!schoolId && !!classId && !!date,
    });
};

export const useGetSimpleStudentAttendance = (
    schoolId: string,
    studentId: string,
    startDate?: string,
    endDate?: string
) => {
    return useQuery({
        queryKey: attendanceKeys.simpleStudent(schoolId, studentId, startDate, endDate),
        queryFn: () =>
            useApi<ApiResponse<{ attendance: AttendanceSimple[]; summary: AttendanceSummary }>>(
                "GET",
                `/api/school/${schoolId}/attendance/simple/student/${studentId}`,
                undefined,
                startDate && endDate ? { startDate, endDate } : undefined
            ),
        enabled: !!schoolId && !!studentId,
    });
};

export const useUpdateSimpleAttendance = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ attendanceId, status, remarks }: { attendanceId: string; status: string; remarks?: string }) =>
            useApi<ApiResponse<AttendanceSimple>>(
                "PUT",
                `/api/school/${schoolId}/attendance/simple/${attendanceId}`,
                { status, remarks }
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["attendance"] });
            queryClient.invalidateQueries({ queryKey: ["parent-portal"] });
        },
    });
};

// ==========================================
// PERIOD-WISE ATTENDANCE HOOKS
// ==========================================

export const useMarkPeriodAttendance = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: MarkPeriodAttendancePayload) =>
            useApi<ApiResponse<{ results: unknown[]; errors: unknown[] }>>(
                "POST",
                `/api/school/${schoolId}/attendance/period/mark`,
                data
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["attendance"] });
            queryClient.invalidateQueries({ queryKey: ["parent-portal"] });
        },
    });
};

export const useGetPeriodClassAttendance = (
    schoolId: string,
    classId: string,
    date: string,
    period?: number,
    sectionId?: string
) => {
    const url = period !== undefined
        ? `/api/school/${schoolId}/attendance/period/class/${classId}/${date}/${period}`
        : `/api/school/${schoolId}/attendance/period/class/${classId}/${date}`;

    return useQuery({
        queryKey: attendanceKeys.periodClass(schoolId, classId, date, period, sectionId),
        queryFn: () =>
            useApi<ApiResponse<AttendancePeriod[]>>(
                "GET",
                url,
                undefined,
                sectionId ? { sectionId } : undefined
            ),
        enabled: !!schoolId && !!classId && !!date,
    });
};

export const useGetPeriodStudentAttendance = (
    schoolId: string,
    studentId: string,
    startDate?: string,
    endDate?: string,
    subjectId?: string
) => {
    return useQuery({
        queryKey: attendanceKeys.periodStudent(schoolId, studentId, startDate, endDate, subjectId),
        queryFn: () =>
            useApi<ApiResponse<{ attendance: AttendancePeriod[]; overall: AttendanceSummary }>>(
                "GET",
                `/api/school/${schoolId}/attendance/period/student/${studentId}`,
                undefined,
                { startDate, endDate, subjectId }
            ),
        enabled: !!schoolId && !!studentId,
    });
};

// ==========================================
// CHECK-IN/CHECK-OUT HOOKS
// ==========================================

export const useCheckIn = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CheckInPayload) =>
            useApi<ApiResponse<AttendanceCheckin>>(
                "POST",
                `/api/school/${schoolId}/attendance/checkin/in`,
                data
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["attendance", "checkin", schoolId] });
        },
    });
};

export const useCheckOut = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { userId: string; method?: string }) =>
            useApi<ApiResponse<AttendanceCheckin>>(
                "POST",
                `/api/school/${schoolId}/attendance/checkin/out`,
                data
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["attendance", "checkin", schoolId] });
        },
    });
};

export const useGetCheckInStatus = (schoolId: string, userId: string) => {
    return useQuery({
        queryKey: attendanceKeys.checkinStatus(schoolId, userId),
        queryFn: () =>
            useApi<ApiResponse<AttendanceCheckin | { checked: boolean }>>(
                "GET",
                `/api/school/${schoolId}/attendance/checkin/status/${userId}`
            ),
        enabled: !!schoolId && !!userId,
    });
};

export const useGetDailyCheckins = (schoolId: string, date: string, options?: { userType?: string; classId?: string }) => {
    return useQuery({
        queryKey: attendanceKeys.checkinDaily(schoolId, date),
        queryFn: () =>
            useApi<ApiResponse<{ attendance: AttendanceCheckin[]; summary: AttendanceSummary }>>(
                "GET",
                `/api/school/${schoolId}/attendance/checkin/daily/${date}`,
                undefined,
                options as Record<string, unknown>
            ),
        enabled: !!schoolId && !!date,
    });
};

// ==========================================
// TEACHER ATTENDANCE HOOKS
// ==========================================

export const useTeacherCheckIn = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { latitude?: number; longitude?: number }) =>
            useApi<ApiResponse<TeacherAttendance>>(
                "POST",
                `/api/school/${schoolId}/attendance/teacher/check-in`,
                data
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: attendanceKeys.teacherStatus(schoolId) });
        },
    });
};

export const useTeacherCheckOut = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () =>
            useApi<ApiResponse<TeacherAttendance>>(
                "POST",
                `/api/school/${schoolId}/attendance/teacher/check-out`,
                {}
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: attendanceKeys.teacherStatus(schoolId) });
        },
    });
};

export const useGetTeacherStatus = (schoolId: string) => {
    return useQuery({
        queryKey: attendanceKeys.teacherStatus(schoolId),
        queryFn: () =>
            useApi<ApiResponse<TeacherAttendance | { checkedIn: boolean }>>(
                "GET",
                `/api/school/${schoolId}/attendance/teacher/status`
            ),
        enabled: !!schoolId,
    });
};

export const useMarkTeacherAttendance = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: MarkTeacherAttendancePayload) =>
            useApi<ApiResponse<{ results: unknown[]; errors: unknown[] }>>(
                "POST",
                `/api/school/${schoolId}/attendance/teacher/mark`,
                data
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["attendance", "teacher", schoolId] });
        },
    });
};

export const useGetTeachersAttendance = (schoolId: string, date: string) => {
    return useQuery({
        queryKey: attendanceKeys.teacherDaily(schoolId, date),
        queryFn: () =>
            useApi<ApiResponse<{ attendance: TeacherAttendance[]; summary: AttendanceSummary }>>(
                "GET",
                `/api/school/${schoolId}/attendance/teacher/daily/${date}`
            ),
        enabled: !!schoolId && !!date,
    });
};

export const useGetTeacherHistory = (schoolId: string, teacherId: string, startDate?: string, endDate?: string) => {
    return useQuery({
        queryKey: attendanceKeys.teacherHistory(schoolId, teacherId),
        queryFn: () =>
            useApi<ApiResponse<{ attendance: TeacherAttendance[]; summary: AttendanceSummary }>>(
                "GET",
                `/api/school/${schoolId}/attendance/teacher/${teacherId}/history`,
                undefined,
                startDate && endDate ? { startDate, endDate } : undefined
            ),
        enabled: !!schoolId && !!teacherId,
    });
};

// ==========================================
// REPORTS HOOKS
// ==========================================

export const useGetDailyReport = (schoolId: string, date: string, options?: { mode?: string; classId?: string; sectionId?: string }) => {
    return useQuery({
        queryKey: attendanceKeys.dailyReport(schoolId, date),
        queryFn: () =>
            useApi<ApiResponse<DailyReport>>(
                "GET",
                `/api/school/${schoolId}/attendance/reports/daily`,
                undefined,
                { date, ...options } as Record<string, unknown>
            ),
        enabled: !!schoolId,
    });
};

export const useGetMonthlyReport = (schoolId: string, year: number, month: number, options?: { mode?: string; classId?: string; sectionId?: string; type?: string }) => {
    return useQuery({
        queryKey: attendanceKeys.monthlyReport(schoolId, year, month),
        queryFn: () =>
            useApi<ApiResponse<MonthlyReport>>(
                "GET",
                `/api/school/${schoolId}/attendance/reports/monthly`,
                undefined,
                { year, month, ...options } as Record<string, unknown>
            ),
        enabled: !!schoolId,
    });
};

export const useGetDateRangeReport = (
    schoolId: string,
    startDate: string,
    endDate: string,
    options?: { mode?: string; classId?: string; studentId?: string; teacherId?: string; type?: string }
) => {
    return useQuery({
        queryKey: attendanceKeys.rangeReport(schoolId, startDate, endDate),
        queryFn: () =>
            useApi<ApiResponse<{ students?: unknown; teachers?: unknown }>>(
                "GET",
                `/api/school/${schoolId}/attendance/reports/range`,
                undefined,
                { startDate, endDate, ...options } as Record<string, unknown>
            ),
        enabled: !!schoolId && !!startDate && !!endDate,
    });
};

export const useGetClassWiseReport = (schoolId: string, date: string, mode?: string, options?: { classId?: string; sectionId?: string }) => {
    return useQuery({
        queryKey: [...attendanceKeys.classWiseReport(schoolId, date), options],
        queryFn: () =>
            useApi<ApiResponse<{ date: string; classes: ClassWiseReport[] }>>(
                "GET",
                `/api/school/${schoolId}/attendance/reports/classwise`,
                undefined,
                { date, mode, ...options } as Record<string, unknown>
            ),
        enabled: !!schoolId,
    });
};
