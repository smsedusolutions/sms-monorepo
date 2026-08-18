import { create } from "zustand";
import { persist } from "zustand/middleware";
import useApi from "../queries/useApi";
import type { Role } from "../queries/Roles";

interface RolesResponse {
  success: boolean;
  count: number;
  data: Role[];
}

interface RoleState {
  roles: Role[];
  isLoading: boolean;
  error: string | null;
  fetchRoles: (force?: boolean) => Promise<void>;
  getRoleByCode: (code: string) => Role | undefined;
  getPrefix: (code: string) => string;
  getBasePath: (code: string) => string;
  getColorTheme: (code: string) => Role["colorTheme"];
}

export const useRoleStore = create<RoleState>()(
  persist(
    (set, get) => ({
      roles: [],
      isLoading: false,
      error: null,

      fetchRoles: async (force = false) => {
        if (!force && (get().roles.length > 0 || get().isLoading)) return;
        set({ isLoading: true, error: null });
        try {
          const response = await useApi<RolesResponse>("GET", "/api/roles", undefined, { activeOnly: "true" });
          if (response.success) {
            set({ roles: response.data, isLoading: false });
          } else {
            set({ error: "Failed to fetch roles", isLoading: false });
          }
        } catch (error: any) {
          set({ error: error.message || "An error occurred", isLoading: false });
        }
      },

      getRoleByCode: (code: string) => {
        if (!code) return undefined;
        return get().roles.find((r) => r.roleCode === code.toLowerCase());
      },

      getPrefix: (code: string) => {
        if (!code) return "M";
        const role = get().getRoleByCode(code);
        if (role?.prefix) return role.prefix;
        const defaultPrefixes: Record<string, string> = {
          super_admin: "SA",
          sch_admin: "A",
          teacher: "T",
          student: "S",
          parent: "P",
          driver: "D",
          principal: "PR",
        };
        return defaultPrefixes[code.toLowerCase()] || "M";
      },

      getBasePath: (code: string) => {
        if (!code) return "";
        const role = get().getRoleByCode(code);
        if (role?.basePath) return role.basePath;
        const defaultBasePaths: Record<string, string> = {
          super_admin: "/super-admin",
          sch_admin: "/school-admin",
          teacher: "/teacher",
          student: "/student",
          parent: "/parent",
          driver: "/driver",
          principal: "/principal",
        };
        return defaultBasePaths[code.toLowerCase()] || `/${code.toLowerCase()}`;
      },

      getColorTheme: (code: string) => {
        const role = get().getRoleByCode(code);
        return role?.colorTheme || "default";
      },
    }),
    {
      name: "role-storage",
    }
  )
);
