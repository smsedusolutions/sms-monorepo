import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  Box,
  Typography,
  Avatar,
  IconButton,
  Divider,
  Button,
  Chip,
  Collapse,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import { useUserStore } from '../../../stores/userStore';
import { useRoleStore } from '../../../stores/roleStore';
import { useAuth } from '../../../context/AuthContext';
import TokenService from '../../../queries/token/tokenService';
import {
  useGetSuperAdminMenus,
  useGetSchoolAdminMenus,
  useGetUserMenus,
} from '../../../queries/Menus';
import { transformMenuData } from '../../../pages/Sidebar/SidebarUtils';
import LogoutConfirmDialog from '../../../pages/Sidebar/LogoutConfirmDialog';

interface MobileMoreDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const MobileMoreDrawer: React.FC<MobileMoreDrawerProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, school } = useUserStore();
  const { getBasePath, getRoleByCode } = useRoleStore();
  const { logout } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  const activeItemRef = useRef<HTMLDivElement | null>(null);

  const userRole = TokenService.getRole() || user?.role || '';
  const schoolId = TokenService.getSchoolId();
  const basePath = getBasePath(userRole);
  const currentRole = getRoleByCode(userRole);

  // Fetch dynamic menus
  const { data: superAdminMenus } = useGetSuperAdminMenus(userRole === 'super_admin' ? userRole : '');
  const { data: schoolAdminMenus } = useGetSchoolAdminMenus(
    userRole === 'sch_admin' ? schoolId || '' : '',
    userRole === 'sch_admin' ? userRole : ''
  );
  const { data: userMenus } = useGetUserMenus(
    userRole !== 'super_admin' && userRole !== 'sch_admin' ? schoolId || '' : '',
    userRole !== 'super_admin' && userRole !== 'sch_admin' ? userRole || '' : ''
  );

  const rawMenus =
    userRole === 'super_admin'
      ? superAdminMenus?.data
      : userRole === 'sch_admin'
        ? schoolAdminMenus?.data
        : userMenus?.data || [];

  const menuItems = transformMenuData(rawMenus || [], userRole);

  const isPathActive = useCallback(
    (targetPath?: string): boolean => {
      if (!targetPath) return false;
      if (location.pathname === targetPath) return true;
      if (
        targetPath !== '/' &&
        (location.pathname.startsWith(`${targetPath}/`) || location.pathname.startsWith(targetPath))
      ) {
        return true;
      }
      return false;
    },
    [location.pathname]
  );

  // Auto-expand parent menu if any child subitem is currently active
  useEffect(() => {
    if (!menuItems || menuItems.length === 0) return;

    setExpandedMenus((prev) => {
      let changed = false;
      const next = { ...prev };
      menuItems.forEach((item) => {
        const hasActiveSub = Boolean(item.subItems?.some((sub) => isPathActive(sub.path)));
        if (hasActiveSub && !next[item.name]) {
          next[item.name] = true;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [open, location.pathname, menuItems, isPathActive]);

  const scrollToActive = useCallback(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }
  }, []);

  // Auto scroll to active item only once when drawer opens
  useEffect(() => {
    if (open) {
      const timer1 = setTimeout(scrollToActive, 100);
      const timer2 = setTimeout(scrollToActive, 320);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [open, scrollToActive]);

  const handleNavigate = (path?: string) => {
    if (path) {
      navigate(path);
      onClose();
    }
  };

  const handleToggleMenu = (menuName: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  const handleMainMenuClick = (item: any) => {
    const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);
    if (hasSubItems) {
      handleToggleMenu(item.name);
    } else {
      handleNavigate(item.path);
    }
  };

  const handleLogout = () => {
    onClose();
    logout();
    navigate('/login');
  };

  const userName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : 'User';

  const roleProfilePaths: Record<string, string> = {
    sch_admin: '/school-admin/profile',
    teacher: '/teacher/profile',
    student: '/student/profile',
    parent: '/parent/profile',
    driver: '/driver/profile',
    principal: '/principal/profile',
  };
  const profilePath = roleProfilePaths[userRole] || `${basePath}/profile`;

  return (
    <>
      <Drawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        SlideProps={{
          onEntered: scrollToActive,
        }}
        PaperProps={{
          sx: {
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            maxHeight: '92dvh',
            bgcolor: '#f8fafc',
            pb: 'calc(var(--safe-area-bottom) + 24px)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* Drag Handle & Header */}
        <Box sx={{ pt: 1.5, pb: 1, px: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box
            sx={{
              width: 44,
              height: 5,
              borderRadius: 2,
              bgcolor: '#cbd5e1',
              mb: 1.5,
            }}
          />

          <Box sx={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '1.2rem',
                fontFamily: '"Outfit", sans-serif',
                color: '#0f172a',
              }}
            >
              All Features & Settings
            </Typography>
            <IconButton onClick={onClose} size="small" sx={{ color: '#64748b' }}>
              <CloseRoundedIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Scrollable Content with Smooth Scrolling */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            px: 2,
            pb: 2,
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
            overscrollBehaviorY: 'contain',
          }}
        >
          {/* User Profile Card */}
          <Box
            onClick={() => handleNavigate(profilePath)}
            className="touch-card-active"
            sx={{
              bgcolor: '#ffffff',
              borderRadius: '16px',
              p: 2,
              mb: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e2e8f0',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease, border-color 0.15s ease',
              '&:hover': {
                bgcolor: '#fafafa',
                borderColor: '#cbd5e1',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar
                src={user?.profileImage || ''}
                alt={userName}
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: '#4f46e5',
                  fontSize: 18,
                  fontWeight: 700,
                  boxShadow: '0 4px 10px rgba(79, 70, 229, 0.25)',
                }}
              >
                {userName.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '0.98rem', color: '#0f172a', lineHeight: 1.2 }}>
                  {userName}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.4 }}>
                  <Chip
                    label={currentRole?.roleName || userRole}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      bgcolor: 'rgba(99, 102, 241, 0.1)',
                      color: '#4f46e5',
                    }}
                  />
                  {school?.schoolName && (
                    <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }} noWrap>
                      {school.schoolName}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
            <ChevronRightRoundedIcon sx={{ color: '#94a3b8' }} />
          </Box>

          {/* Menus List */}
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '0.78rem',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              mb: 1.2,
              px: 0.5,
            }}
          >
            Navigation & Modules
          </Typography>

          <Box
            sx={{
              bgcolor: '#ffffff',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e2e8f0',
              mb: 2.5,
            }}
          >
            {menuItems.map((item, index) => {
              const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);
              const isExpanded = Boolean(expandedMenus[item.name]);
              const hasActiveChild = Boolean(item.subItems?.some((sub) => isPathActive(sub.path)));
              const isDirectActive = isPathActive(item.path);
              const isParentOfActive = hasActiveChild;

              return (
                <React.Fragment key={item.name + index}>
                  <Box
                    ref={!hasActiveChild && isDirectActive ? activeItemRef : undefined}
                    onClick={() => handleMainMenuClick(item)}
                    className="touch-active"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      px: 2,
                      py: 1.5,
                      bgcolor: isDirectActive
                        ? 'rgba(99, 102, 241, 0.08)'
                        : isParentOfActive
                          ? 'rgba(99, 102, 241, 0.04)'
                          : isExpanded
                            ? 'rgba(248, 250, 252, 0.9)'
                            : 'transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                      '&:hover': {
                        bgcolor: isDirectActive
                          ? 'rgba(99, 102, 241, 0.12)'
                          : 'rgba(99, 102, 241, 0.04)',
                      },
                      '&:active': { bgcolor: '#f1f5f9' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: (isDirectActive || isParentOfActive) ? '#4f46e5' : 'rgba(241, 245, 249, 1)',
                          color: (isDirectActive || isParentOfActive) ? '#ffffff' : '#475569',
                          transition: 'background-color 0.2s ease, color 0.2s ease',
                        }}
                      >
                        {item.icon}
                      </Box>
                      <Typography
                        sx={{
                          fontWeight: (isDirectActive || isParentOfActive) ? 700 : 600,
                          fontSize: '0.92rem',
                          color: isDirectActive ? '#4f46e5' : '#1e293b',
                          transition: 'color 0.2s ease',
                        }}
                      >
                        {item.name}
                      </Typography>
                    </Box>

                    {/* Right-side Action / Submenu Indicator */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {hasSubItems && (
                        <Box
                          sx={{
                            px: 0.8,
                            py: 0.15,
                            borderRadius: '6px',
                            bgcolor: isExpanded || isParentOfActive ? 'rgba(99, 102, 241, 0.1)' : '#f1f5f9',
                            color: isExpanded || isParentOfActive ? '#4f46e5' : '#64748b',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            lineHeight: 1.2,
                            letterSpacing: '0.02em',
                          }}
                        >
                          {item.subItems?.length}
                        </Box>
                      )}

                      {hasSubItems ? (
                        <KeyboardArrowDownRoundedIcon
                          sx={{
                            color: isExpanded || isParentOfActive ? '#4f46e5' : '#94a3b8',
                            fontSize: 22,
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), color 0.2s ease',
                          }}
                        />
                      ) : (
                        <ChevronRightRoundedIcon
                          sx={{
                            color: isDirectActive ? '#4f46e5' : '#cbd5e1',
                            fontSize: 20,
                          }}
                        />
                      )}
                    </Box>
                  </Box>

                  {/* Collapsible SubItems with Visual Tree Hierarchy */}
                  {hasSubItems && (
                    <Collapse in={isExpanded} timeout={250} unmountOnExit={false}>
                      <Box
                        sx={{
                          bgcolor: '#f8fafc',
                          pt: 0.75,
                          pb: 1.25,
                          pr: 2,
                          pl: 2.5,
                          borderTop: '1px solid #f1f5f9',
                        }}
                      >
                        <Box
                          sx={{
                            borderLeft: '2px solid #e2e8f0',
                            ml: 2.25,
                            pl: 1.5,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0.25,
                          }}
                        >
                          {item.subItems?.map((subItem) => {
                            const isSubSelected = isPathActive(subItem.path);
                            return (
                              <Box
                                key={subItem.name}
                                ref={isSubSelected ? activeItemRef : undefined}
                                onClick={() => handleNavigate(subItem.path)}
                                className="touch-active"
                                sx={{
                                  py: 1,
                                  px: 1.25,
                                  borderRadius: '8px',
                                  bgcolor: isSubSelected ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  cursor: 'pointer',
                                  transition: 'background-color 0.15s ease',
                                  '&:hover': {
                                    bgcolor: isSubSelected
                                      ? 'rgba(99, 102, 241, 0.14)'
                                      : 'rgba(99, 102, 241, 0.04)',
                                  },
                                  '&:active': { bgcolor: 'rgba(99, 102, 241, 0.18)' },
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                  <Box
                                    sx={{
                                      width: 6,
                                      height: 6,
                                      borderRadius: '50%',
                                      bgcolor: isSubSelected ? '#4f46e5' : '#94a3b8',
                                      transition: 'background-color 0.15s ease',
                                    }}
                                  />
                                  <Typography
                                    sx={{
                                      fontSize: '0.86rem',
                                      fontWeight: isSubSelected ? 700 : 500,
                                      color: isSubSelected ? '#4f46e5' : '#475569',
                                      transition: 'color 0.15s ease',
                                    }}
                                  >
                                    {subItem.name}
                                  </Typography>
                                </Box>
                                <ChevronRightRoundedIcon
                                  sx={{
                                    color: isSubSelected ? '#4f46e5' : '#cbd5e1',
                                    fontSize: 16,
                                    transition: 'color 0.15s ease',
                                  }}
                                />
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    </Collapse>
                  )}

                  {index < menuItems.length - 1 && <Divider sx={{ borderColor: '#f1f5f9' }} />}
                </React.Fragment>
              );
            })}
          </Box>

          {/* Logout Button */}
          <Button
            fullWidth
            onClick={() => setShowLogoutDialog(true)}
            variant="outlined"
            color="error"
            startIcon={<LogoutRoundedIcon />}
            sx={{
              borderRadius: '14px',
              py: 1.4,
              fontSize: '0.9rem',
              fontWeight: 700,
              textTransform: 'none',
              borderColor: '#fecdd3',
              bgcolor: '#fff1f2',
              color: '#e11d48',
              transition: 'all 0.15s ease',
              '&:hover': { bgcolor: '#ffe4e6', borderColor: '#fda4af' },
            }}
          >
            Sign Out of Account
          </Button>
        </Box>
      </Drawer>

      <LogoutConfirmDialog
        open={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={handleLogout}
      />
    </>
  );
};

export default MobileMoreDrawer;
