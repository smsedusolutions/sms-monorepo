import { Navigate, Outlet, useLocation } from "react-router-dom";
import TokenService from "../queries/token/tokenService";
import DashboardLayout from "../components/Dashboard/DashboardLayout";
import MobileAppLayout from "../components/mobile/layout/MobileAppLayout";
import { useIsMobile } from "../hooks/useIsMobile";
import {
  useGetSuperAdminMenus,
  useGetSchoolAdminMenus,
  useGetUserMenus,
} from "../queries/Menus";
import { useRoleStore } from "../stores/roleStore";
import { Box, CircularProgress } from "@mui/material";

interface ProtectedRouteProps {
  allowedRoles: string[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const isMobile = useIsMobile();
  const token = TokenService.getToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (TokenService.isTokenExpired()) {
    TokenService.removeToken();
    return <Navigate to="/login" replace />;
  }

  const userRole = TokenService.getRole();
  const location = useLocation();
  const schoolId = TokenService.getSchoolId();

  const isRoleAllowed = userRole && allowedRoles.some((r) => r.toLowerCase() === userRole.toLowerCase());
  if (!isRoleAllowed) {
    return <Navigate to="/unauthorized" replace />;
  }

  const { data: superAdminMenus, isLoading: isLoadingSuperAdmin } =
    useGetSuperAdminMenus(userRole === "super_admin" ? userRole : "");

  const { data: schoolAdminMenus, isLoading: isLoadingSchoolAdmin } =
    useGetSchoolAdminMenus(
      userRole === "sch_admin" ? schoolId || "" : "",
      userRole === "sch_admin" ? userRole : "",
    );

  const { data: userMenus, isLoading: isLoadingUserMenus } = useGetUserMenus(
    userRole !== "super_admin" && userRole !== "sch_admin"
      ? schoolId || ""
      : "",
    userRole !== "super_admin" && userRole !== "sch_admin"
      ? userRole || ""
      : "",
  );

  const isLoading =
    isLoadingSuperAdmin || isLoadingSchoolAdmin || isLoadingUserMenus;


  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "#f8fafc",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const menus =
    userRole === "super_admin"
      ? superAdminMenus?.data
      : userRole === "sch_admin"
        ? schoolAdminMenus?.data
        : userMenus?.data || [];


  // Build activePaths from RAW menus
  const buildPathsFromRawMenus = (rawMenus: any[], role: string): string[] => {
    const { getBasePath } = useRoleStore.getState();
    const basePath = getBasePath(role);
    const paths: string[] = [];
    (rawMenus || []).forEach((menu: any) => {
      if (menu.menuUrl) {
        const url = menu.menuUrl.startsWith("/")
          ? menu.menuUrl
          : `/${menu.menuUrl}`;
        const fullPath = url.startsWith(basePath) ? url : `${basePath}${url}`;
        paths.push(fullPath);
      }
    });
    return paths;
  };

  const activePaths = buildPathsFromRawMenus(menus || [], userRole || "");

  // Standard built-in feature routes for each role
  const standardBuiltInPaths: Record<string, string[]> = {
    sch_admin: [
      '/school-admin/dashboard',
      '/school-admin/teachers',
      '/school-admin/students',
      '/school-admin/classes',
      '/school-admin/subjects',
      '/school-admin/attendance',
      '/school-admin/calendar',
      '/school-admin/ptm',
      '/school-admin/students/discipline',
      '/school-admin/exam/gradebook',
      '/school-admin/fees',
      '/school-admin/announcements',
      '/school-admin/email-templates',
      '/school-admin/timetable',
      '/school-admin/exam',
      '/school-admin/transport',
      '/school-admin/promotion',
      '/school-admin/principal',
      '/school-admin/profile',
    ],
    teacher: [
      '/teacher/dashboard',
      '/teacher/classes',
      '/teacher/students',
      '/teacher/parents',
      '/teacher/attendance',
      '/teacher/my-requests',
      '/teacher/leave',
      '/teacher/timetable',
      '/teacher/calendar',
      '/teacher/exam',
      '/teacher/homework',
      '/teacher/ptm',
      '/teacher/announcements',
      '/teacher/notifications',
      '/teacher/chat',
      '/teacher/profile',
    ],
    student: [
      '/student/dashboard',
      '/student/classes',
      '/student/attendance',
      '/student/results',
      '/student/profile',
      '/student/my-requests',
      '/student/leave',
      '/student/homework',
      '/student/announcements',
      '/student/timetable',
      '/student/calendar',
      '/student/exam',
      '/student/fees',
    ],
    parent: [
      '/parent/dashboard',
      '/parent/children',
      '/parent/announcements',
      '/parent/homework',
      '/parent/attendance',
      '/parent/teachers',
      '/parent/timetable',
      '/parent/calendar',
      '/parent/leave',
      '/parent/exam',
      '/parent/transport',
      '/parent/ptm',
      '/parent/fees',
      '/parent/profile',
    ],
    principal: [
      '/principal/dashboard',
      '/principal/teachers',
      '/principal/students',
      '/principal/attendance',
      '/principal/timetable',
      '/principal/calendar',
      '/principal/exam',
      '/principal/leave',
      '/principal/announcements',
      '/principal/profile',
    ],
  };

  const currentPath = location.pathname;

  const isBuiltInAllowed = (standardBuiltInPaths[userRole || ''] || []).some(
    (prefix) => currentPath === prefix || currentPath.startsWith(prefix + '/')
  );

  const isAllowed = isBuiltInAllowed || activePaths.some((path) => {
    // Convert dynamic segments like :studentId to a regex wildcard
    if (path.includes(":")) {
      const pattern = path.replace(/:[^/]+/g, "[^/]+");
      const regex = new RegExp(`^${pattern}(/.*)?$`);
      return regex.test(currentPath);
    }
    return currentPath === path || currentPath.startsWith(path + "/");
  });

  const rolePrefixes = useRoleStore.getState().roles.map(r => r.basePath);
  const isRoleRoute = rolePrefixes.some(
    (prefix) => currentPath === prefix || currentPath.startsWith(prefix + "/"),
  );

  // If the API returned no menus (e.g. principal role not yet configured in backend),
  // skip the path validation — the role-level guard above is sufficient.
  const hasMenuData = (menus || []).length > 0;

  if (hasMenuData && isRoleRoute && !isAllowed) {
    return <Navigate to="/not-found" replace />;
  }

  if (isMobile) {
    return (
      <MobileAppLayout>
        <Outlet />
      </MobileAppLayout>
    );
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
};

export default ProtectedRoute;
