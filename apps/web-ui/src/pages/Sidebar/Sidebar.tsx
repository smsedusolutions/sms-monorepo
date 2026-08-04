import "./sidebar.scss";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { transformMenuData, DynamicIcon } from "./SidebarUtils";
import {
  useGetSuperAdminMenus,
  useGetSchoolAdminMenus,
  useGetUserMenus,
} from "../../queries/Menus";
import {
  Toolbar,
  Typography,
  Divider,
  CircularProgress,
  Box,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import type { SideBarMenuItemType } from "./SidebarUtils";
import TokenService from "../../queries/token/tokenService";
import { useUserStore } from "../../stores/userStore";
import { useRoleStore } from "../../stores/roleStore";
import LogoutConfirmDialog from "./LogoutConfirmDialog";
import { preloadRoute } from "../../utils/routePreloader";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  role: string | null;
  onLogout?: () => void;
}

const Sidebar = ({ isOpen, onClose, role, onLogout }: SidebarProps) => {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [closingItem, setClosingItem] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [hoveredSubItem, setHoveredSubItem] = useState<string | null>(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Get user and school data from Zustand store
  const { user, fetchProfile } = useUserStore();
  const { fetchRoles } = useRoleStore();

  // Fetch profile and roles on component mount
  useEffect(() => {
    if (!user) {
      fetchProfile();
    }
    fetchRoles();
  }, []);

  useEffect(() => {
    if (closingItem) {
      const timer = setTimeout(() => {
        setClosingItem(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [closingItem]);

  const handleToggle = (itemName: string) => {
    if (expandedItem && expandedItem !== itemName) {
      setClosingItem(expandedItem);
    }
    setExpandedItem((prev) => (prev === itemName ? null : itemName));
  };

  const handleSelect = () => {
    if (window.innerWidth <= 900) {
      onClose();
    }
  };

  // Check if menu item is selected based on current URL
  const isMenuItemSelected = (item: SideBarMenuItemType): boolean => {
    if (item.path && location.pathname === item.path) {
      return true;
    }
    if (item.subItems) {
      return item.subItems.some(
        (subItem) => location.pathname === subItem.path,
      );
    }
    return false;
  };

  // Get schoolId from token
  const schoolId = TokenService.getSchoolId();

  // Get dynamic menus for super admin
  const { data: superAdminMenus, isLoading: isLoadingSuperAdmin } =
    useGetSuperAdminMenus(role === "super_admin" ? role : "");

  // Get dynamic menus for school admin
  const { data: schoolAdminMenus, isLoading: isLoadingSchoolAdmin } =
    useGetSchoolAdminMenus(
      role === "sch_admin" ? schoolId || "" : "",
      role === "sch_admin" ? role : "",
    );

  // Get dynamic menus for school-specific roles (teacher, student, parent, driver, etc.)
  const { data: userMenus, isLoading: isLoadingUserMenus } = useGetUserMenus(
    role !== "super_admin" && role !== "sch_admin" ? schoolId || "" : "",
    role !== "super_admin" && role !== "sch_admin" ? role || "" : "",
  );

  const isLoading =
    isLoadingSuperAdmin || isLoadingSchoolAdmin || isLoadingUserMenus;

  // Updated menu items logic based on role
  const getMenuItems = () => {
    let items: SideBarMenuItemType[] = [];
    switch (role) {
      case "super_admin":
        items = transformMenuData(superAdminMenus?.data || [], role || undefined);
        break;
      case "sch_admin":
        items = transformMenuData(schoolAdminMenus?.data || [], role || undefined);
        if (items.length > 0 && !items.some(item => item.name.toLowerCase() === "promotion")) {
          items.push({
            name: "Promotion",
            icon: <DynamicIcon icon="material-symbols:school-outline" />,
            path: `/school-admin/promotion`,
            isExpandable: false
          });
        }
        break;
      default:
        // Handle all other school-specific roles
        items = transformMenuData(userMenus?.data || [], role || undefined);
        break;
    }
    return items;
  };

  const menuItems = getMenuItems();

  // Eagerly preload all route chunks for current user's menu items
  useEffect(() => {
    if (menuItems && menuItems.length > 0) {
      menuItems.forEach((item) => {
        if (item.path) preloadRoute(item.path);
        item.subItems?.forEach((sub) => {
          if (sub.path) preloadRoute(sub.path);
        });
      });
    }
  }, [menuItems.length, role]);



  return (
    <>
      <motion.div
        className={`sidebar ${isOpen ? "open" : "closed"}`}
        initial={false}
        animate={{
          width: isOpen ? 250 : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1],
          opacity: { duration: 0.25 },
        }}
        style={{
          zIndex: 1200,
          background: "#1e293b",
          boxShadow: isOpen ? "4px 0 20px rgba(30, 41, 59, 0.3)" : "none",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        {/* Fixed width inner container to prevent content wrapping during animation */}
        <motion.div
          style={{
            width: 250,
            minWidth: 250,
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
          initial={false}
          animate={{
            opacity: isOpen ? 1 : 0,
            x: isOpen ? 0 : -20,
          }}
          transition={{
            duration: 0.25,
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          <Toolbar className="navbar-toolbar" />

          {/* Menu Items */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              padding: "16px",
              paddingBottom: "80px",
            }}
          >
            {isLoading ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  py: 4,
                  gap: 2,
                }}
              >
                <CircularProgress size={24} sx={{ color: "#3b82f6" }} />
                <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                  Loading menus...
                </Typography>
              </Box>
            ) : menuItems.length === 0 ? (
              <Box sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                  No menus assigned.
                </Typography>
              </Box>
            ) : (
              menuItems.map((item: SideBarMenuItemType) => {
                const isHovered = hoveredItem === item.name;
                const isSelected = isMenuItemSelected(item);
                const backgroundColor = isSelected
                  ? "#3b82f6"
                  : isHovered
                    ? "rgba(59, 130, 246, 0.2)"
                    : "transparent";

                return (
                  <div key={item.name}>
                    <div
                      onClick={() => {
                        if (item.isExpandable) {
                          handleToggle(item.name);
                        } else {
                          navigate(item.path!);
                          handleSelect();
                        }
                      }}
                      onMouseEnter={() => {
                        setHoveredItem(item.name);
                        if (item.path) preloadRoute(item.path);
                      }}
                      onMouseLeave={() => setHoveredItem(null)}
                      className={`menu-item ${isSelected ? "selected" : ""}`}
                      style={{
                        background: backgroundColor,
                        borderRadius: "8px",
                        marginBottom: "4px",
                        border: isSelected
                          ? "1px solid rgba(59, 130, 246, 0.3)"
                          : "1px solid transparent",
                        transition: "all 0.2s ease",
                        padding: "12px 16px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "flex-start",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "12px",
                          color: isSelected ? "white" : "#cbd5e1",
                          fontWeight: isSelected ? "600" : "500",
                          flex: 1,
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", paddingTop: "2px", flexShrink: 0 }}>{item.icon}</span>
                        <span style={{ flex: 1, wordBreak: "break-word" }}>{item.name}</span>
                      </span>
                      {item.isExpandable && (
                        <span
                          style={{
                            marginLeft: "auto",
                            color: "#94a3b8",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggle(item.name);
                          }}
                        >
                          {expandedItem === item.name ? (
                            <ExpandLess />
                          ) : (
                            <ExpandMore />
                          )}
                        </span>
                      )}
                    </div>
                    {item.isExpandable && (
                      <motion.div
                        className="sub-items"
                        initial={false}
                        animate={{
                          height:
                            expandedItem === item.name ||
                              closingItem === item.name
                              ? "auto"
                              : 0,
                          opacity: expandedItem === item.name ? 1 : 0,
                        }}
                        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                        style={{
                          background: "rgba(30, 41, 59, 0.5)",
                          borderRadius: "8px",
                          margin: "4px 0 4px 16px",
                          overflow: "hidden",
                          border: "1px solid #334155",
                        }}
                      >
                        {(expandedItem === item.name ||
                          closingItem === item.name) &&
                          item.subItems?.map((subItem) => {
                            const isSubItemActive =
                              location.pathname === subItem.path;
                            const isSubItemHovered =
                              hoveredSubItem === `${item.name}-${subItem.name}`;

                            const subItemBackground = isSubItemActive
                              ? "linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(96, 165, 250, 0.3) 100%)"
                              : isSubItemHovered
                                ? "rgba(59, 130, 246, 0.15)"
                                : "transparent";

                            return (
                              <div
                                key={subItem.name}
                                className={`sub-item ${isSubItemActive ? "selected" : ""
                                  }`}
                                onClick={() => {
                                  if (subItem.path) {
                                    navigate(subItem.path);
                                  }
                                  handleSelect();
                                }}
                                onMouseEnter={() => {
                                  setHoveredSubItem(`${item.name}-${subItem.name}`);
                                  if (subItem.path) preloadRoute(subItem.path);
                                }}
                                onMouseLeave={() => setHoveredSubItem(null)}
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: "12px",
                                  padding: "10px 16px",
                                  color: isSubItemActive ? "white" : "#94a3b8",
                                  background: subItemBackground,
                                  borderRadius: "6px",
                                  margin: "2px 8px",
                                  textDecoration: "none",
                                  transition: "all 0.2s ease",
                                  cursor: "pointer",
                                }}
                              >
                                <span
                                  className="sub-item-icon"
                                  style={{
                                    color: isSubItemActive
                                      ? "white"
                                      : "#94a3b8",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "20px",
                                    flexShrink: 0,
                                    paddingTop: "2px",
                                  }}
                                >
                                  {subItem.icon}
                                </span>
                                <span
                                  className="sub-item-name"
                                  style={{
                                    fontWeight: isSubItemActive ? "600" : "500",
                                    fontSize: "0.875rem",
                                    flex: 1,
                                    wordBreak: "break-word",
                                  }}
                                >
                                  {subItem.name}
                                </span>
                              </div>
                            );
                          })}
                      </motion.div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Logout Button at Bottom */}
          {onLogout && (
            <div style={{ padding: "20px" }}>
              <Divider sx={{ borderColor: "rgba(182, 160, 255, 0.1)", mb: 2 }} />
              <div
                onClick={() => setShowLogoutDialog(true)}
                className="menu-item logout-button"
                style={{
                  background: "rgba(239, 68, 68, 0.05)",
                  borderRadius: "12px",
                  padding: "12px 18px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  color: "#ff6e84",
                  transition: "all 0.3s ease",
                  whiteSpace: "nowrap",
                  border: '1px solid rgba(239, 68, 68, 0.1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                  e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.05)";
                  e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.1)";
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    flex: 1,
                    fontFamily: 'Lexend, sans-serif',
                    fontWeight: 500,
                  }}
                >
                  <LogoutIcon sx={{ fontSize: '1.2rem' }} />
                  <span>Sign Out</span>
                </span>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
      <LogoutConfirmDialog
        open={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={() => {
          setShowLogoutDialog(false);
          if (onLogout) onLogout();
        }}
      />
    </>
  );
};

export default Sidebar;
