import { useState, useEffect, useRef } from 'react';
import { Box, AppBar, Toolbar, IconButton, Typography, Avatar, Divider } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Sidebar from '../../pages/Sidebar/Sidebar';
import NotificationBell from '../NotificationBell/NotificationBell';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../stores/userStore';
import { useRoleStore } from '../../stores/roleStore';
import LogoutConfirmDialog from '../../pages/Sidebar/LogoutConfirmDialog';
import AppBreadcrumbs from '../shared/AppBreadcrumbs';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

// Role to profile path mapping
const roleProfilePaths: Record<string, string> = {
    sch_admin: '/school-admin/profile',
    teacher: '/teacher/profile',
    student: '/student/profile',
    parent: '/parent/profile',
    driver: '/driver/profile',
};

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 900);
    const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 900);
    const [profilePopupOpen, setProfilePopupOpen] = useState(false);
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const profileAnchorRef = useRef<HTMLDivElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);

    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const { user: userProfile, school, fetchProfile, clearStore } = useUserStore();
    const { fetchRoles, getRoleByCode } = useRoleStore();

    useEffect(() => {
        if (user) {
            fetchProfile();
            fetchRoles();
        }
    }, [user, fetchProfile, fetchRoles]);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 900;
            setIsMobile(mobile);
            if (mobile && sidebarOpen) {
                setSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [sidebarOpen]);

    // Close popup when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                popupRef.current &&
                !popupRef.current.contains(event.target as Node) &&
                profileAnchorRef.current &&
                !profileAnchorRef.current.contains(event.target as Node)
            ) {
                setProfilePopupOpen(false);
            }
        };
        if (profilePopupOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [profilePopupOpen]);

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    const handleLogout = () => {
        clearStore();
        logout();
        navigate('/login');
    };

    const userName = userProfile
        ? `${userProfile.firstName} ${userProfile.lastName}`.trim()
        : user?.email || 'User';

    const profileImage = userProfile?.profileImage || '';
    const userRole = user?.role || '';
    const roleName = userRole ? getRoleByCode(userRole)?.roleName || userRole.replace('_', ' ') : 'User';
    const profilePath = roleProfilePaths[userRole] || null;

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            {/* Mobile backdrop — tapping outside closes sidebar */}
            {isMobile && sidebarOpen && (
                <Box
                    onClick={() => setSidebarOpen(false)}
                    sx={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 1199,
                        backgroundColor: 'rgba(0, 0, 0, 0.45)',
                        backdropFilter: 'blur(2px)',
                        animation: 'fadeIn 0.2s ease',
                        '@keyframes fadeIn': {
                            from: { opacity: 0 },
                            to: { opacity: 1 },
                        },
                    }}
                />
            )}

            {/* App Bar */}
            <AppBar
                position="fixed"
                sx={{
                    zIndex: 1201,
                    backgroundColor: '#1e293b',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
            >
                <Toolbar sx={{ gap: 0 }}>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={toggleSidebar}
                        sx={{ mr: { xs: 1, sm: 2 }, flexShrink: 0 }}
                    >
                        <MenuIcon />
                    </IconButton>

                    {/* School branding — grows but never overflows into icons */}
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        flexGrow: 1,
                        minWidth: 0,          // allow shrinking below content size
                        overflow: 'hidden',
                        gap: { xs: 1, sm: 2 },
                    }}>
                        {user?.role !== 'super_admin' && school?.schoolLogo && (
                            <Avatar
                                src={school.schoolLogo}
                                variant="square"
                                sx={{
                                    width: { xs: 32, sm: 48 },
                                    height: { xs: 32, sm: 48 },
                                    bgcolor: 'transparent',
                                    flexShrink: 0,
                                    p: 0,
                                    '& img': {
                                        objectFit: 'cover',
                                        width: '100%',
                                        height: '100%'
                                    }
                                }}
                            />
                        )}
                        <Typography
                            noWrap
                            component="div"
                            sx={{
                                fontWeight: 700,
                                letterSpacing: '0.5px',
                                fontSize: { xs: '0.9rem', sm: '1.25rem' },
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                minWidth: 0,
                            }}
                        >
                            {user?.role === 'super_admin' ? 'SMS EDU SOLUTION' : (school?.schoolName || 'SMS EDU SOLUTION')}
                        </Typography>
                    </Box>

                    {/* Right-side icons — never shrink */}
                    <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, gap: 0.5 }}>
                        {user && <NotificationBell />}

                    {/* Profile Avatar Button */}
                    <Box
                        ref={profileAnchorRef}
                        sx={{ position: 'relative', flexShrink: 0 }}
                    >
                        <Box
                            onClick={() => setProfilePopupOpen((prev) => !prev)}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                cursor: 'pointer',
                                borderRadius: '28px',
                                px: 1,
                                py: 0.5,
                                transition: 'background 0.2s',
                                '&:hover': {
                                    background: 'rgba(255,255,255,0.1)',
                                },
                            }}
                        >
                            <Avatar
                                alt={userName}
                                src={profileImage}
                                sx={{
                                    width: 36,
                                    height: 36,
                                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                    fontSize: '0.95rem',
                                    fontWeight: 700,
                                    border: profilePopupOpen ? '2px solid rgba(255,255,255,0.6)' : '2px solid rgba(255,255,255,0.2)',
                                    transition: 'border 0.2s',
                                }}
                            >
                                {userName?.charAt(0).toUpperCase()}
                            </Avatar>
                            {!isMobile && (
                                <Box sx={{ lineHeight: 1.2, textAlign: 'left' }}>
                                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: 'white', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                                        {userName.length > 16 ? userName.substring(0, 16) + '…' : userName}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'capitalize', lineHeight: 1.2 }}>
                                        {roleName}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Box> {/* end right-side icons */}

                        {/* Profile Popup Card */}
                        {profilePopupOpen && (
                            <Box
                                ref={popupRef}
                                sx={{
                                    position: 'absolute',
                                    top: 'calc(100% + 12px)',
                                    right: 0,
                                    width: 260,
                                    background: '#1e293b',
                                    borderRadius: '16px',
                                    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    overflow: 'hidden',
                                    zIndex: 9999,
                                    animation: 'popupIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    '@keyframes popupIn': {
                                        from: { opacity: 0, transform: 'translateY(-8px) scale(0.96)' },
                                        to: { opacity: 1, transform: 'translateY(0) scale(1)' },
                                    },
                                }}
                            >
                                {/* Profile Header */}
                                <Box
                                    sx={{
                                        background: 'linear-gradient(135deg, #1e3a5f 0%, #2d1b69 100%)',
                                        px: 2.5,
                                        pt: 2.5,
                                        pb: 2,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        textAlign: 'center',
                                        gap: 1.2,
                                    }}
                                >
                                    <Box sx={{ position: 'relative' }}>
                                        <Avatar
                                            alt={userName}
                                            src={profileImage}
                                            sx={{
                                                width: 64,
                                                height: 64,
                                                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                                fontSize: '1.6rem',
                                                fontWeight: 700,
                                                border: '3px solid rgba(255,255,255,0.15)',
                                                boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
                                            }}
                                        >
                                            {userName?.charAt(0).toUpperCase()}
                                        </Avatar>
                                        {/* Online indicator */}
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                bottom: 3,
                                                right: 3,
                                                width: 12,
                                                height: 12,
                                                borderRadius: '50%',
                                                background: '#22c55e',
                                                border: '2px solid #1e293b',
                                            }}
                                        />
                                    </Box>
                                    <Box>
                                        <Typography sx={{ fontWeight: 700, color: 'white', fontSize: '0.95rem', lineHeight: 1.2 }}>
                                            {userName}
                                        </Typography>
                                        <Box
                                            sx={{
                                                display: 'inline-block',
                                                mt: 0.6,
                                                px: 1.2,
                                                py: 0.2,
                                                borderRadius: '20px',
                                                background: 'rgba(59, 130, 246, 0.25)',
                                                border: '1px solid rgba(59, 130, 246, 0.4)',
                                            }}
                                        >
                                            <Typography sx={{ fontSize: '0.7rem', color: '#93c5fd', fontWeight: 600, textTransform: 'capitalize' }}>
                                                {roleName}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)' }} />

                                {/* Actions */}
                                <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                    {profilePath && (
                                        <Box
                                            onClick={() => { navigate(profilePath); setProfilePopupOpen(false); }}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1.5,
                                                px: 1.5,
                                                py: 1.2,
                                                borderRadius: '10px',
                                                cursor: 'pointer',
                                                color: '#cbd5e1',
                                                transition: 'all 0.18s ease',
                                                '&:hover': {
                                                    background: 'rgba(59, 130, 246, 0.15)',
                                                    color: '#93c5fd',
                                                },
                                            }}
                                        >
                                            <AccountCircleIcon sx={{ fontSize: 20 }} />
                                            <Typography sx={{ fontSize: '0.88rem', fontWeight: 500, flex: 1 }}>
                                                View Profile
                                            </Typography>
                                            <OpenInNewIcon sx={{ fontSize: 14, opacity: 0.6 }} />
                                        </Box>
                                    )}

                                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)', my: 0.5 }} />

                                    {/* Logout */}
                                    <Box
                                        onClick={() => { setProfilePopupOpen(false); setShowLogoutDialog(true); }}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1.5,
                                            px: 1.5,
                                            py: 1.2,
                                            borderRadius: '10px',
                                            cursor: 'pointer',
                                            color: '#f87171',
                                            transition: 'all 0.18s ease',
                                            '&:hover': {
                                                background: 'rgba(239, 68, 68, 0.12)',
                                                color: '#fca5a5',
                                            },
                                        }}
                                    >
                                        <LogoutIcon sx={{ fontSize: 20 }} />
                                        <Typography sx={{ fontSize: '0.88rem', fontWeight: 500 }}>
                                            Sign Out
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Sidebar */}
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                role={user?.role || null}
                onLogout={handleLogout}
            />

            {/* Main Content */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    marginLeft: !isMobile && sidebarOpen ? '250px' : 0,
                    marginTop: '64px',
                    transition: 'margin-left 0.3s ease-in-out',
                    backgroundColor: '#f8fafc',
                    minHeight: 'calc(100vh - 64px)',
                    width: '100%',
                    overflowX: 'hidden',
                }}
            >
                <AppBreadcrumbs />
                {children}
            </Box>

            {/* Logout Confirm Dialog */}
            <LogoutConfirmDialog
                open={showLogoutDialog}
                onClose={() => setShowLogoutDialog(false)}
                onConfirm={() => {
                    setShowLogoutDialog(false);
                    handleLogout();
                }}
            />
        </Box>
    );
};

export default DashboardLayout;
