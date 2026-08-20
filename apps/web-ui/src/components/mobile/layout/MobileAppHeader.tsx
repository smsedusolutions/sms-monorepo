import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Typography, IconButton, Avatar, Badge,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  Tooltip,
} from '@mui/material';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { useUserStore } from '../../../stores/userStore';
import { useRoleStore } from '../../../stores/roleStore';
import { useAuth } from '../../../context/AuthContext';
import { useBreadcrumbs } from '../../../hooks/useBreadcrumbs';
import { useGetUnreadCount } from '../../../queries/Notification';
import TokenService from '../../../queries/token/tokenService';
import { AppButton } from '../../shared/AppButton';

interface MobileAppHeaderProps {
  onOpenMore?: () => void;
  onOpenNotifications?: () => void;
  titleOverride?: string;
  rightAction?: React.ReactNode;
}

export const MobileAppHeader: React.FC<MobileAppHeaderProps> = ({
  onOpenMore,
  onOpenNotifications,
  titleOverride,
  rightAction,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, school } = useUserStore();
  const { getBasePath } = useRoleStore();
  const { logout } = useAuth();
  const { items: breadcrumbs } = useBreadcrumbs();
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const userRole = TokenService.getRole() || user?.role || '';
  const schoolId = TokenService.getSchoolId() || school?.schoolId || user?.schoolId || '';
  const { data: unreadData } = useGetUnreadCount(schoolId);
  const unreadCount = unreadData?.data?.unreadCount ?? 0;

  const basePath = getBasePath(userRole);
  const dashboardPath = `${basePath}/dashboard`;
  const isAtDashboard = location.pathname === dashboardPath || location.pathname === basePath || location.pathname === '/';

  // Role Profile / Settings Paths
  const roleProfilePaths: Record<string, string> = {
    super_admin: '/super-admin/profile',
    sch_admin: '/school-admin/profile',
    teacher: '/teacher/profile',
    student: '/student/profile',
    parent: '/parent/profile',
    driver: '/driver/profile',
  };

  const profilePath = roleProfilePaths[userRole] || `${basePath}/profile`;

  // Compute title
  const activeTitle =
    titleOverride ||
    (breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].label : '') ||
    school?.schoolName ||
    'SMS Edu';

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(dashboardPath);
    }
  };

  const handleNotifications = () => {
    if (onOpenNotifications) {
      onOpenNotifications();
    } else {
      navigate(`${basePath}/notifications`);
    }
  };

  const handleSettings = () => {
    navigate(profilePath);
  };

  const handleLogout = () => {
    setLogoutConfirmOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="mobile-glass-header sticky top-0 z-40 w-full pt-safe transition-all">
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '56px',
            px: 1.25,
          }}
        >
          {/* Left: Back button OR School/User avatar */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: '36px' }}>
            {!isAtDashboard ? (
              <IconButton
                onClick={handleBack}
                size="small"
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '10px',
                  bgcolor: 'rgba(99, 102, 241, 0.08)',
                  color: '#4f46e5',
                  '&:active': { transform: 'scale(0.92)' },
                }}
                aria-label="Go Back"
              >
                <ArrowBackIosNewRoundedIcon sx={{ fontSize: 17, ml: -0.2 }} />
              </IconButton>
            ) : (
              <Avatar
                src={school?.logo || ''}
                alt={school?.schoolName || 'SMS'}
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: '#4f46e5',
                  fontSize: 14,
                  fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
                }}
              >
                {(school?.schoolName || 'S').charAt(0).toUpperCase()}
              </Avatar>
            )}
          </Box>

          {/* Center: Title */}
          <Box
            sx={{
              flex: 1,
              textAlign: 'center',
              px: 0.75,
              overflow: 'hidden',
            }}
          >
            <Typography
              noWrap
              sx={{
                fontWeight: 700,
                fontSize: '1.05rem',
                color: '#0f172a',
                letterSpacing: '-0.01em',
                fontFamily: '"Outfit", sans-serif',
              }}
            >
              {activeTitle}
            </Typography>
            {isAtDashboard && school?.schoolName && (
              <Typography
                noWrap
                sx={{
                  fontSize: '0.72rem',
                  color: '#64748b',
                  fontWeight: 500,
                  mt: -0.2,
                }}
              >
                {school.schoolName}
              </Typography>
            )}
          </Box>

          {/* Right: Actions / Notifications / Settings / Logout / Profile */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, justifyContent: 'flex-end' }}>
            {rightAction ? (
              rightAction
            ) : (
              <>
                {/* Notifications Icon */}
                <Tooltip title="Notifications">
                  <IconButton
                    onClick={handleNotifications}
                    size="small"
                    sx={{
                      width: 32,
                      height: 32,
                      color: '#475569',
                      borderRadius: '8px',
                      '&:active': { transform: 'scale(0.92)' },
                    }}
                    aria-label="Notifications"
                  >
                    <Badge color="error" variant="dot" invisible={unreadCount === 0}>
                      <NotificationsRoundedIcon sx={{ fontSize: 20 }} />
                    </Badge>
                  </IconButton>
                </Tooltip>

                {/* Settings / Profile Icon */}
                <Tooltip title="Settings">
                  <IconButton
                    onClick={handleSettings}
                    size="small"
                    sx={{
                      width: 32,
                      height: 32,
                      color: '#475569',
                      borderRadius: '8px',
                      '&:active': { transform: 'scale(0.92)' },
                    }}
                    aria-label="Settings"
                  >
                    <SettingsRoundedIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                </Tooltip>

                {/* Logout Icon */}
                <Tooltip title="Logout">
                  <IconButton
                    onClick={() => setLogoutConfirmOpen(true)}
                    size="small"
                    sx={{
                      width: 32,
                      height: 32,
                      color: '#ef4444',
                      borderRadius: '8px',
                      '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.08)' },
                      '&:active': { transform: 'scale(0.92)' },
                    }}
                    aria-label="Logout"
                  >
                    <LogoutRoundedIcon sx={{ fontSize: 19 }} />
                  </IconButton>
                </Tooltip>

                {/* User Profile Avatar */}
                <IconButton
                  onClick={onOpenMore || handleSettings}
                  size="small"
                  sx={{
                    p: 0,
                    ml: 0.25,
                    '&:active': { transform: 'scale(0.92)' },
                  }}
                  aria-label="Profile and menu"
                >
                  <Avatar
                    src={user?.profileImage || ''}
                    alt={user?.firstName || 'User'}
                    sx={{
                      width: 30,
                      height: 30,
                      bgcolor: '#6366f1',
                      fontSize: 12,
                      fontWeight: 600,
                      border: '2px solid #ffffff',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    {(user?.firstName || 'U').charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
              </>
            )}
          </Box>
        </Box>
      </header>

      {/* Logout Confirmation Dialog */}
      <Dialog
        open={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        PaperProps={{ sx: { borderRadius: 3, p: 1, maxWidth: 360 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Confirm Logout</DialogTitle>
        <DialogContent>
          <DialogContentText variant="body2" color="text.secondary">
            Are you sure you want to sign out of your account?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 1.5, gap: 1 }}>
          <AppButton variant="outlined" color="inherit" onClick={() => setLogoutConfirmOpen(false)}>
            Cancel
          </AppButton>
          <AppButton variant="contained" color="error" onClick={handleLogout}>
            Logout
          </AppButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MobileAppHeader;
