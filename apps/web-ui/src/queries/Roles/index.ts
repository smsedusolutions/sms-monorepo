import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useApi from "../useApi";
import { useRoleStore } from "../../stores/roleStore";

export interface Role {
  _id: string;
  roleCode: string;
  roleName: string;
  prefix: string;
  basePath: string;
  colorTheme: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning";
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface RolesResponse {
  success: boolean;
  count: number;
  data: Role[];
}

interface SingleRoleResponse {
  success: boolean;
  data: Role;
}

// Fetch all roles
export const useGetRoles = (activeOnly = false) => {
  return useQuery({
    queryKey: ["roles", activeOnly],
    queryFn: () => useApi<RolesResponse>("GET", "/api/roles", undefined, { activeOnly: String(activeOnly) }),
  });
};

// Create a role
export const useCreateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Role>) => useApi<SingleRoleResponse>("POST", "/api/roles", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      useRoleStore.getState().fetchRoles(true);
    },
  });
};

// Update a role
export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Role> }) =>
      useApi<SingleRoleResponse>("PUT", `/api/roles/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      useRoleStore.getState().fetchRoles(true);
    },
  });
};

// Delete/Deactivate a role
export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, permanent = false }: { id: string; permanent?: boolean }) =>
      useApi<{ success: boolean; message: string }>("DELETE", `/api/roles/${id}`, undefined, { permanent: String(permanent) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      useRoleStore.getState().fetchRoles(true);
    },
  });
};
