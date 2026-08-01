import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useApi from "../useApi";
import type { ApiResponse, Menu, CreateMenuPayload } from "../../types";

// Get menus based on role
export const useGetSuperAdminMenus = (role: string) => {
  return useQuery({
    queryKey: ["menus", "superadmin", role],
    queryFn: () =>
      useApi<ApiResponse<Menu[]>>("GET", `/api/admin/dashboard/menus/${role}`),
    enabled: !!role,
    staleTime: 30 * 60 * 1000,
  });
};

// Get menus for school admin/staff based on schoolId and role
export const useGetSchoolAdminMenus = (schoolId: string, role: string) => {
  return useQuery({
    queryKey: ["menus", schoolId, role],
    queryFn: () =>
      useApi<ApiResponse<Menu[]>>(
        "GET",
        `/api/auth/${schoolId}/dashboard/menus/${role}`,
      ),
    enabled: !!schoolId && !!role,
    staleTime: 30 * 60 * 1000,
  });
};

// Get menus for student/teacher/parent based on schoolId and role
export const useGetUserMenus = (schoolId: string, role: string) => {
  return useQuery({
    queryKey: ["menus", "user", schoolId, role],
    queryFn: () =>
      useApi<ApiResponse<Menu[]>>(
        "GET",
        `/api/school/${schoolId}/dashboard/menus/${role}`,
      ),
    enabled: !!schoolId && !!role,
    staleTime: 30 * 60 * 1000,
  });
};

// Get all menus (for management)
export const useGetMenus = (
  page: number = 1,
  limit: number = 10,
  search?: string,
  schoolId?: string,
) => {
  return useQuery({
    queryKey: ["menus", "all", page, limit, search, schoolId],
    queryFn: () => {
      let url = `/api/admin/dashboard/menus/all?page=${page}&limit=${limit}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (schoolId) url += `&schoolId=${schoolId}`;
      return useApi<ApiResponse<Menu[]>>("GET", url);
    },
  });
};

// Create Menu
export const useCreateMenu = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMenuPayload) =>
      useApi<ApiResponse<Menu>>("POST", "/api/admin/dashboard/menus", data), // Assumed endpoint
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
    },
  });
};

// Update Menu
export const useUpdateMenu = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      menuId,
      data,
    }: {
      menuId: string;
      data: Partial<CreateMenuPayload>;
    }) =>
      useApi<ApiResponse<Menu>>(
        "PUT",
        `/api/admin/dashboard/menus/${menuId}`,
        data,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
    },
  });
};

// Delete Menu
export const useDeleteMenu = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (menuId: string) =>
      useApi<ApiResponse<void>>(
        "DELETE",
        `/api/admin/dashboard/menus/${menuId}`,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
    },
  });
};

// Get all menus without pagination (for Excel export)
export const useGetAllMenusForExport = () => {
  return useQuery({
    queryKey: ["menus", "export"],
    queryFn: () =>
      useApi<ApiResponse<Menu[]>>("GET", "/api/admin/dashboard/menus/export"),
    enabled: false, // Only fetch on demand via refetch()
  });
};

// Bulk update menus (from Excel upload)
export const useBulkUpdateMenus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (menus: Partial<Menu>[]) =>
      useApi<ApiResponse<{ matched: number; modified: number; errorCount: number }>>(
        "POST",
        "/api/admin/dashboard/menus/bulk-update",
        { menus },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
    },
  });
};

// Restore menus from backup
export const useRestoreMenuBackup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (batchId: string) =>
      useApi<ApiResponse<void>>("POST", "/api/admin/dashboard/menus/restore", {
        batchId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
    },
  });
};

