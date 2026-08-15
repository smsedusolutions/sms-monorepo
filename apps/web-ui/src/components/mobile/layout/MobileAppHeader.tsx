import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, IconButton, Avatar, Badge } from '@mui/material';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import { useUserStore } from '../../../stores/userStore';
import { useRoleStore } from '../../../stores/roleStore';
import { useBreadcrumbs } from '../../../hooks/useBreadcrumbs';
import TokenService from '../../../queries/token/tokenService';

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
  const { items: breadcrumbs } = useBreadcrumbs();

  const userRole = TokenService.getRole() || user?.role || '';
  const basePath = getBasePath(userRole);
  const dashboardPath = `${basePath}/dashboard`;
  const isAtDashboard = location.pathname === dashboardPath || location.pathname === basePath || location.pathname === '/';

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

  return (
    <header className="mobile-glass-header sticky top-0 z-40 w-full pt-safe transition-all">
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '56px',
          px: 1.5,
        }}
      >
        {/* Left: Back button OR School/User avatar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: '40px' }}>
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
              <ArrowBackIosNewRoundedIcon sx={{ fontSize: 18, ml: -0.2 }} />
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
            px: 1,
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

        {/* Right: Actions / Notifications / Profile */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: '40px', justifyContent: 'flex-end' }}>
          {rightAction ? (
            rightAction
          ) : (
            <>
              <IconButton
                onClick={handleNotifications}
                size="small"
                sx={{
                  width: 36,
                  height: 36,
                  color: '#475569',
                  borderRadius: '10px',
                  '&:active': { transform: 'scale(0.92)' },
                }}
                aria-label="Notifications"
              >
                <Badge color="error" variant="dot">
                  <NotificationsRoundedIcon sx={{ fontSize: 22 }} />
                </Badge>
              </IconButton>

              <IconButton
                onClick={onOpenMore}
                size="small"
                sx={{
                  p: 0,
                  ml: 0.5,
                  '&:active': { transform: 'scale(0.92)' },
                }}
                aria-label="Profile and menu"
              >
                <Avatar
                  src={user?.profileImage || ''}
                  alt={user?.firstName || 'User'}
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: '#6366f1',
                    fontSize: 13,
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
  );
};

export default MobileAppHeader;
