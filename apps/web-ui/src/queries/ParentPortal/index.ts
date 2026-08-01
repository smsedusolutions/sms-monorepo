import { useQuery } from "@tanstack/react-query";
import useApi from "../useApi";
import type {
    ParentDashboardStats,
    Student,
    ChildTeacherInfo,
    ChildAttendanceData,
    AbsentRecord
} from "../../types";

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
export const parentPortalKeys = {
    all: ['parent-portal'] as const,
    dashboard: (schoolId: string) => [...parentPortalKeys.all, 'dashboard', schoolId] as const,
    children: (schoolId: string) => [...parentPortalKeys.all, 'children', schoolId] as const,
    childProfile: (schoolId: string, studentId: string) => [...parentPortalKeys.all, 'child-profile', schoolId, studentId] as const,
    classTeacher: (schoolId: string, studentId: string) => [...parentPortalKeys.all, 'class-teacher', schoolId, studentId] as const,
    teachers: (schoolId: string, studentId: string) => [...parentPortalKeys.all, 'teachers', schoolId, studentId] as const,
    attendance: (schoolId: string, studentId: string, filters?: Record<string, unknown>) =>
        [...parentPortalKeys.all, 'attendance', schoolId, studentId, filters] as const,
    absentHistory: (schoolId: string, studentId: string) => [...parentPortalKeys.all, 'absent-history', schoolId, studentId] as const,
};

// Get parent dashboard stats
export const useGetParentDashboard = (schoolId: string) => {
    return useQuery({
        queryKey: parentPortalKeys.dashboard(schoolId),
        queryFn: () => useApi<ApiResponse<ParentDashboardStats>>(
            "GET",
            `/api/school/${schoolId}/parent-portal/dashboard`
        ),
        enabled: !!schoolId,
        staleTime: 5 * 60 * 1000,
    });
};

// Get all children
export const useGetMyChildren = (schoolId: string) => {
    return useQuery({
        queryKey: parentPortalKeys.children(schoolId),
        queryFn: () => useApi<ApiResponse<(Student & { className?: string; sectionName?: string })[]>>(
            "GET",
            `/api/school/${schoolId}/parent-portal/children`
        ),
        enabled: !!schoolId,
        staleTime: 10 * 60 * 1000,
    });
};

// Get specific child's profile
export const useGetChildProfile = (schoolId: string, studentId: string) => {
    return useQuery({
        queryKey: parentPortalKeys.childProfile(schoolId, studentId),
        queryFn: () => useApi<ApiResponse<Student & { className?: string; sectionName?: string }>>(
            "GET",
            `/api/school/${schoolId}/parent-portal/children/${studentId}`
        ),
        enabled: !!schoolId && !!studentId,
        staleTime: 10 * 60 * 1000,
    });
};

// Get child's class teacher
export const useGetChildClassTeacher = (schoolId: string, studentId: string) => {
    return useQuery({
        queryKey: parentPortalKeys.classTeacher(schoolId, studentId),
        queryFn: () => useApi<ApiResponse<ChildTeacherInfo>>(
            "GET",
            `/api/school/${schoolId}/parent-portal/children/${studentId}/class-teacher`
        ),
        enabled: !!schoolId && !!studentId,
        staleTime: 10 * 60 * 1000,
    });
};

// Get child's teachers (subject-wise)
export const useGetChildTeachers = (schoolId: string, studentId: string) => {
    return useQuery({
        queryKey: parentPortalKeys.teachers(schoolId, studentId),
        queryFn: () => useApi<ApiResponse<ChildTeacherInfo[]>>(
            "GET",
            `/api/school/${schoolId}/parent-portal/children/${studentId}/teachers`
        ),
        enabled: !!schoolId && !!studentId,
        staleTime: 10 * 60 * 1000,
    });
};

// Get child's attendance
export const useGetChildAttendance = (
    schoolId: string,
    studentId: string,
    filters?: { month?: number; year?: number; startDate?: string; endDate?: string }
) => {
    return useQuery({
        queryKey: parentPortalKeys.attendance(schoolId, studentId, filters),
        queryFn: () => useApi<ApiResponse<ChildAttendanceData>>(
            "GET",
            `/api/school/${schoolId}/parent-portal/children/${studentId}/attendance`,
            undefined,
            filters as Record<string, unknown>
        ),
        enabled: !!schoolId && !!studentId,
    });
};

// Get child's absent history
export const useGetChildAbsentHistory = (
    schoolId: string,
    studentId: string,
    page?: number,
    limit?: number
) => {
    return useQuery({
        queryKey: parentPortalKeys.absentHistory(schoolId, studentId),
        queryFn: () => useApi<ApiResponse<AbsentRecord[]>>(
            "GET",
            `/api/school/${schoolId}/parent-portal/children/${studentId}/absent-history`,
            undefined,
            { page, limit }
        ),
        enabled: !!schoolId && !!studentId,
    });
};
