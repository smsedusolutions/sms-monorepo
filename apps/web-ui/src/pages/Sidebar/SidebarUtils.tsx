import React from "react";
import { MuiIcons, DynamicIcon, getIconifyUrl } from "../../utils/Icons";
import { useRoleStore } from "../../stores/roleStore";

export { DynamicIcon, getIconifyUrl };

export interface SideBarMenuItemType {
  name: string;
  icon: React.ReactNode;
  path?: string;
  isExpandable?: boolean;
  subItems?: SideBarMenuItemType[];
}

// Helper to transform API menu data to Sidebar format
export const transformMenuData = (
  menus: any[],
  role?: string,
): SideBarMenuItemType[] => {
  if (!menus || !Array.isArray(menus)) return [];

  // Filter out menus that should not appear in the sidebar
  const sidebarMenus = menus.filter((m) => m.showInSidebar !== false);

  const getBasePath = (userRole?: string) => {
    if (!userRole) return "";
    return useRoleStore.getState().getBasePath(userRole);
  };

  const basePath = getBasePath(role);

  // Group menus: Main menus are those with type "main" OR no parentMenuId OR parentMenuId of "0"
  const mainMenus = sidebarMenus.filter(
    (m) =>
      (m.menuType && m.menuType.trim() === "main") ||
      !m.parentMenuId ||
      m.parentMenuId === "0" ||
      m.parentMenuId === "",
  );

  // Sub menus are everything else (those with a parentMenuId)
  const subMenus = sidebarMenus.filter(
    (m) =>
      m.menuType &&
      m.menuType.trim() === "sub" &&
      m.parentMenuId &&
      m.parentMenuId !== "0" &&
      m.parentMenuId !== "",
  );

  // Helper to sort menu orders alphanumerically (e.g. SA1, SA2, SA10)
  const sortMenuOrder = (a: any, b: any) => {
    // Determine the relevant order string for the current role
    const prefix = role ? useRoleStore.getState().getPrefix(role) : "M";

    const getOrder = (item: any) => {
      const orders = Array.isArray(item.menuOrder)
        ? item.menuOrder
        : [item.menuOrder];
      // Find order starting with prefix followed by a digit (to avoid S matching SA)
      const regex = new RegExp(`^${prefix}\\d`);
      return orders.find((o: any) => regex.test(String(o))) || "";
    };

    const orderA = getOrder(a);
    const orderB = getOrder(b);

    // Natural sort order (handles SA1 vs SA10 correctly)
    return orderA.localeCompare(orderB, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  };

  return mainMenus.sort(sortMenuOrder).map((menu: any) => {
    // Find children where parentMenuId matches this menu's menuId OR internal mongo _id
    const children = subMenus
      .filter(
        (sub) =>
          sub.parentMenuId === menu.menuId ||
          (menu._id && sub.parentMenuId === menu._id.toString()),
      )
      .sort(sortMenuOrder);

    const hasChildren = children.length > 0;

    return {
      name: menu.menuName,
      icon: menu.menuIcon ? (
        <DynamicIcon icon={menu.menuIcon} />
      ) : (
        <MuiIcons.Dashboard />
      ),
      // If it has children, it shouldn't have a direct path so it can expand
      path: hasChildren
        ? undefined
        : `${basePath}${menu.menuUrl.startsWith("/") ? "" : "/"}${menu.menuUrl}`,
      isExpandable: hasChildren,
      subItems: hasChildren
        ? children.map((sub: any) => ({
          name: sub.menuName,
          icon: sub.menuIcon ? (
            <DynamicIcon icon={sub.menuIcon} />
          ) : (
            <MuiIcons.Circle sx={{ fontSize: "6px", color: "white" }} />
          ),
          path: `${basePath}${sub.menuUrl.startsWith("/") ? "" : "/"}${sub.menuUrl
            }`,
        }))
        : undefined,
    };
  });
};

// Super Admin Menu Items (Fallback)
export const SuperAdminMenuItems: SideBarMenuItemType[] = [];

// School Admin Menu Items (Fallback)
export const SchoolAdminMenuItems: SideBarMenuItemType[] = [];

// Teachers Menu Items (Fallback)
export const TeachersMenuItems: SideBarMenuItemType[] = [];

// Students Menu Items (Fallback)
export const StudentsMenuItems: SideBarMenuItemType[] = [];

// Parent Menu Items (Fallback)
export const ParentMenuItems: SideBarMenuItemType[] = [];
