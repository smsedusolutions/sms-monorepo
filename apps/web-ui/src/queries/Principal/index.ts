import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useApi from '../useApi';
import type { ApiResponse } from '../../types';

// ─── Principal type ────────────────────────────────────────────────────────
export interface Principal {
    principalId: string;
    userId?: string;
    schoolId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    gender?: 'male' | 'female' | 'other';
    dateOfBirth?: string;
    profileImage?: string;
    status: 'active' | 'inactive';
    createdAt?: string;
    updatedAt?: string;
    [key: string]: any;
}

export interface CreatePrincipalPayload {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    gender?: 'male' | 'female' | 'other';
    dateOfBirth?: string;
    profileImage?: string;
    status?: 'active' | 'inactive';
}

export interface UpdatePrincipalPayload {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    phone?: string;
    gender?: 'male' | 'female' | 'other';
    dateOfBirth?: string;
    profileImage?: string;
    status?: 'active' | 'inactive';
}

// ─── Query keys ────────────────────────────────────────────────────────────
export const principalKeys = {
    all: (schoolId: string) => ['principal', schoolId] as const,
    detail: (schoolId: string, principalId: string) =>
        ['principal', schoolId, principalId] as const,
};

// ─── Get the school's principal ────────────────────────────────────────────
export const useGetPrincipal = (schoolId: string) => {
    return useQuery({
        queryKey: principalKeys.all(schoolId),
        queryFn: () =>
            useApi<ApiResponse<Principal>>(
                'GET',
                `/api/school/${schoolId}/principals`
            ),
        enabled: !!schoolId,
    });
};

// ─── Get principal by ID ───────────────────────────────────────────────────
export const useGetPrincipalById = (schoolId: string, principalId: string) => {
    return useQuery({
        queryKey: principalKeys.detail(schoolId, principalId),
        queryFn: () =>
            useApi<ApiResponse<Principal>>(
                'GET',
                `/api/school/${schoolId}/principals/${principalId}`
            ),
        enabled: !!schoolId && !!principalId,
    });
};

// ─── Create principal ──────────────────────────────────────────────────────
export const useCreatePrincipal = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreatePrincipalPayload) =>
            useApi<ApiResponse<Principal>>(
                'POST',
                `/api/school/${schoolId}/principals`,
                data
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: principalKeys.all(schoolId) });
        },
    });
};

// ─── Update principal ──────────────────────────────────────────────────────
export const useUpdatePrincipal = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            principalId,
            data,
        }: {
            principalId: string;
            data: UpdatePrincipalPayload;
        }) =>
            useApi<ApiResponse<Principal>>(
                'PUT',
                `/api/school/${schoolId}/principals/${principalId}`,
                data
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: principalKeys.all(schoolId) });
        },
    });
};

// ─── Delete / deactivate principal ────────────────────────────────────────
export const useDeletePrincipal = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (principalId: string) =>
            useApi<ApiResponse<void>>(
                'DELETE',
                `/api/school/${schoolId}/principals/${principalId}`
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: principalKeys.all(schoolId) });
        },
    });
};
