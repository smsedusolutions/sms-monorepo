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
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
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

  const scrollToActive = useCallback(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }
  }, []);

  // Auto scroll to active item when drawer opens
  useEffect(() => {
    if (open) {
      const timer1 = setTimeout(scrollToActive, 120);
      const timer2 = setTimeout(scrollToActive, 320);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [open, location.pathname, menuItems, scrollToActive]);

  const isPathActive = (targetPath?: string): boolean => {
    if (!targetPath) return false;
    if (location.pathname === targetPath) return true;
    if (targetPath !== '/' && (location.pathname.startsWith(`${targetPath}/`) || location.pathname.startsWith(targetPath))) {
      return true;
    }
    return false;
  };

  const handleNavigate = (path?: string) => {
    if (path) {
      navigate(path);
      onClose();
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

        {/* Scrollable Content */}
        <Box sx={{ flex: 1, overflowY: 'auto', px: 2, pb: 2 }}>
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
              const hasActiveChild = Boolean(item.subItems?.some((sub) => isPathActive(sub.path)));
              const isDirectActive = isPathActive(item.path);
              const isParentOfActive = hasActiveChild;

              return (
                <React.Fragment key={item.name + index}>
                  <Box
                    ref={!hasActiveChild && isDirectActive ? activeItemRef : undefined}
                    onClick={() => handleNavigate(item.path)}
                    className="touch-active"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      px: 2,
                      py: 1.6,
                      bgcolor: isDirectActive
                        ? 'rgba(99, 102, 241, 0.08)'
                        : isParentOfActive
                          ? 'rgba(99, 102, 241, 0.03)'
                          : 'transparent',
                      cursor: 'pointer',
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
                        }}
                      >
                        {item.icon}
                      </Box>
                      <Typography
                        sx={{
                          fontWeight: (isDirectActive || isParentOfActive) ? 700 : 600,
                          fontSize: '0.92rem',
                          color: isDirectActive ? '#4f46e5' : '#1e293b',
                        }}
                      >
                        {item.name}
                      </Typography>
                    </Box>
                    <ChevronRightRoundedIcon sx={{ color: (isDirectActive || isParentOfActive) ? '#4f46e5' : '#cbd5e1', fontSize: 20 }} />
                  </Box>

                  {/* Render SubItems if any */}
                  {item.subItems && item.subItems.length > 0 && (
                    <Box sx={{ pl: 6, pr: 2, pb: 1, bgcolor: '#fafafa' }}>
                      {item.subItems.map((subItem) => {
                        const isSubSelected = isPathActive(subItem.path);
                        return (
                          <Box
                            key={subItem.name}
                            ref={isSubSelected ? activeItemRef : undefined}
                            onClick={() => handleNavigate(subItem.path)}
                            sx={{
                              py: 1.1,
                              px: 1,
                              my: 0.25,
                              borderRadius: '8px',
                              bgcolor: isSubSelected ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              cursor: 'pointer',
                              '&:active': { bgcolor: 'rgba(99, 102, 241, 0.14)' },
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: '0.86rem',
                                fontWeight: isSubSelected ? 700 : 500,
                                color: isSubSelected ? '#4f46e5' : '#475569',
                              }}
                            >
                              {subItem.name}
                            </Typography>
                            <ChevronRightRoundedIcon sx={{ color: isSubSelected ? '#4f46e5' : '#cbd5e1', fontSize: 16 }} />
                          </Box>
                        );
                      })}
                    </Box>
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
