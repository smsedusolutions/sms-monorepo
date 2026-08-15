import { Box, Typography, Grid, Skeleton, Alert, Chip } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import EventNoteIcon from '@mui/icons-material/EventNote';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DashboardCard from '../../components/Dashboard/DashboardCard';
import { useGetSchoolDashboardStats } from '../../queries/SchoolDashboard';
import { useGetLeaveStats } from '../../queries/Leave';
import TokenService from '../../queries/token/tokenService';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../stores/userStore';

interface QuickActionCard {
    label: string;
    description: string;
    icon: React.ReactNode;
    path: string;
    gradient: string;
    iconColor: string;
    badge?: number;
}

const PrincipalDashboard = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const { data, isLoading, error } = useGetSchoolDashboardStats(schoolId);
    const { data: leaveData } = useGetLeaveStats(schoolId);
    const navigate = useNavigate();
    const { user } = useUserStore();

    const stats = data?.data;
    const leaveStats = leaveData?.data;

    const userName = user?.firstName
        ? `${user.firstName} ${user.lastName || ''}`.trim()
        : 'Principal';

    const quickActions: QuickActionCard[] = [
        {
            label: 'Leave Approvals',
            description: 'Review teacher leave requests',
            icon: <EventNoteIcon sx={{ fontSize: 28 }} />,
            path: '/principal/leave/teacher-requests',
            gradient: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)',
            iconColor: '#f5af19',
            badge: leaveStats?.teacherPending || 0,
        },
        {
            label: 'Timetable Review',
            description: 'Approve draft timetables',
            icon: <ScheduleIcon sx={{ fontSize: 28 }} />,
            path: '/principal/timetable/review',
            gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            iconColor: '#f093fb',
        },
        {
            label: 'Exam Approvals',
            description: 'Approve exam schedules',
            icon: <AssignmentIcon sx={{ fontSize: 28 }} />,
            path: '/principal/exam/approval',
            gradient: 'linear-gradient(135deg, #fd7043 0%, #ffcc02 100%)',
            iconColor: '#fd7043',
        },
        {
            label: 'Attendance',
            description: 'School-wide attendance overview',
            icon: <HowToRegIcon sx={{ fontSize: 28 }} />,
            path: '/principal/attendance',
            gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            iconColor: '#43e97b',
        },
        {
            label: 'Teachers',
            description: 'View teacher directory',
            icon: <PeopleIcon sx={{ fontSize: 28 }} />,
            path: '/principal/teachers',
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            iconColor: '#4facfe',
        },
        {
            label: 'Students',
            description: 'Browse student directory',
            icon: <SchoolIcon sx={{ fontSize: 28 }} />,
            path: '/principal/students',
            gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            iconColor: '#11998e',
        },
        {
            label: 'Exam Results',
            description: 'View school-wide results',
            icon: <CheckCircleIcon sx={{ fontSize: 28 }} />,
            path: '/principal/exam/results',
            gradient: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
            iconColor: '#6a11cb',
        },
        {
            label: 'Announcements',
            description: 'Publish school announcements',
            icon: <AnnouncementIcon sx={{ fontSize: 28 }} />,
            path: '/principal/announcements',
            gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            iconColor: '#fa709a',
        },
        {
            label: 'Notifications',
            description: 'Stay updated with alerts',
            icon: <NotificationsIcon sx={{ fontSize: 28 }} />,
            path: '/principal/notifications',
            gradient: 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)',
            iconColor: '#56ab2f',
        },
        {
            label: 'Profile',
            description: 'Manage your account',
            icon: <AccountCircleIcon sx={{ fontSize: 28 }} />,
            path: '/principal/profile',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            iconColor: '#667eea',
        },
    ];

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {/* Welcome Header */}
            <Box
                sx={{
                    mb: 4,
                    p: 3,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #1e3a5f 0%, #2d1b69 100%)',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <Box
                    sx={{
                        position: 'absolute',
                        top: -40,
                        right: -40,
                        width: 200,
                        height: 200,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.05)',
                        pointerEvents: 'none',
                    }}
                />
                <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                    Welcome back, {userName} 👋
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.5, opacity: 0.8 }}>
                    Here's what needs your attention today.
                </Typography>
                {(leaveStats?.teacherPending || 0) > 0 && (
                    <Chip
                        label={`${leaveStats?.teacherPending} leave request${(leaveStats?.teacherPending || 0) > 1 ? 's' : ''} pending`}
                        sx={{
                            mt: 1.5,
                            bgcolor: 'rgba(251,191,36,0.25)',
                            color: '#fde68a',
                            border: '1px solid rgba(251,191,36,0.4)',
                            fontWeight: 600,
                        }}
                        icon={<EventNoteIcon sx={{ color: '#fde68a !important', fontSize: 16 }} />}
                        onClick={() => navigate('/principal/leave/teacher-requests')}
                    />
                )}
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    Failed to load dashboard stats. Please try again.
                </Alert>
            )}

            {/* Stats Cards */}
            <Typography variant="h6" fontWeight={700} color="#1e293b" sx={{ mb: 2 }}>
                School Overview
            </Typography>
            <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 5 }}>
                {isLoading ? (
                    [1, 2, 3, 4].map((i) => (
                        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                            <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 4 }} />
                        </Grid>
                    ))
                ) : (
                    <>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <DashboardCard
                                title="Teachers"
                                value={stats?.totalTeachers || 0}
                                subtitle={`${stats?.activeTeachers || 0} active`}
                                icon={<PeopleIcon sx={{ fontSize: 28 }} />}
                                color="#3b82f6"
                                bgColor="#eff6ff"
                                to="/principal/teachers"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <DashboardCard
                                title="Students"
                                value={stats?.totalStudents || 0}
                                subtitle={`${stats?.activeStudents || 0} active`}
                                icon={<SchoolIcon sx={{ fontSize: 28 }} />}
                                color="#10b981"
                                bgColor="#ecfdf5"
                                to="/principal/students"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <DashboardCard
                                title="Leave Requests"
                                value={leaveStats?.totalPending || 0}
                                subtitle={`${leaveStats?.teacherPending || 0} from teachers`}
                                icon={<EventNoteIcon sx={{ fontSize: 28 }} />}
                                color="#f59e0b"
                                bgColor="#fffbeb"
                                to="/principal/leave/teacher-requests"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <DashboardCard
                                title="Parents"
                                value={stats?.totalParents || 0}
                                subtitle={`${stats?.activeParents || 0} active`}
                                icon={<HowToRegIcon sx={{ fontSize: 28 }} />}
                                color="#8b5cf6"
                                bgColor="#f5f3ff"
                                to="/principal/students"
                            />
                        </Grid>
                    </>
                )}
            </Grid>

            {/* Quick Actions Section */}
            <Box sx={{ mb: 2 }}>
                <Typography
                    variant="h5"
                    fontWeight={700}
                    color="#1e293b"
                    sx={{ mb: 0.5, fontSize: { xs: '1.1rem', sm: '1.3rem' } }}
                >
                    Quick Navigation
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Jump to any section of your principal dashboard
                </Typography>

                <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                    {quickActions.map((action) => (
                        <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2 }} key={action.label}>
                            <Box
                                onClick={() => navigate(action.path)}
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 1.2,
                                    p: { xs: 2, sm: 2.5 },
                                    borderRadius: 3,
                                    background: 'white',
                                    border: '1px solid #e2e8f0',
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                    minHeight: { xs: 110, sm: 130 },
                                    position: 'relative',
                                    overflow: 'hidden',
                                    '&:hover': {
                                        transform: 'translateY(-5px)',
                                        boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
                                        borderColor: 'transparent',
                                        '& .action-icon-box': {
                                            transform: 'scale(1.12)',
                                        },
                                        '& .action-label': {
                                            color: action.iconColor,
                                        },
                                    },
                                    '&:active': {
                                        transform: 'translateY(-2px)',
                                    },
                                }}
                            >
                                {/* Background glow */}
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: -30,
                                        right: -30,
                                        width: 80,
                                        height: 80,
                                        borderRadius: '50%',
                                        background: action.gradient,
                                        opacity: 0.07,
                                        pointerEvents: 'none',
                                    }}
                                />
                                {/* Badge indicator */}
                                {(action.badge || 0) > 0 && (
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: 10,
                                            right: 10,
                                            minWidth: 20,
                                            height: 20,
                                            borderRadius: '10px',
                                            bgcolor: '#ef4444',
                                            color: 'white',
                                            fontSize: '0.65rem',
                                            fontWeight: 700,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            px: 0.5,
                                        }}
                                    >
                                        {action.badge}
                                    </Box>
                                )}
                                <Box
                                    className="action-icon-box"
                                    sx={{
                                        width: { xs: 48, sm: 56 },
                                        height: { xs: 48, sm: 56 },
                                        borderRadius: '14px',
                                        background: action.gradient,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        boxShadow: `0 4px 14px ${action.iconColor}40`,
                                        transition: 'transform 0.25s ease',
                                        flexShrink: 0,
                                    }}
                                >
                                    {action.icon}
                                </Box>
                                <Box>
                                    <Typography
                                        className="action-label"
                                        variant="body2"
                                        sx={{
                                            fontWeight: 700,
                                            color: '#1e293b',
                                            fontSize: { xs: '0.78rem', sm: '0.85rem' },
                                            transition: 'color 0.2s ease',
                                            lineHeight: 1.2,
                                        }}
                                    >
                                        {action.label}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: '#94a3b8',
                                            fontSize: { xs: '0.65rem', sm: '0.7rem' },
                                            display: { xs: 'none', sm: 'block' },
                                            mt: 0.3,
                                            lineHeight: 1.3,
                                        }}
                                    >
                                        {action.description}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        </Box>
    );
};

export default PrincipalDashboard;
