import { Box, Typography, Grid, Skeleton, Alert } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import EventNoteIcon from '@mui/icons-material/EventNote';
import ClassIcon from '@mui/icons-material/Class';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import DashboardCard from '../../components/Dashboard/DashboardCard';
import { useGetSchoolDashboardStats } from '../../queries/SchoolDashboard';
import { useGetLeaveStats } from '../../queries/Leave';
import TokenService from '../../queries/token/tokenService';
import { useNavigate } from 'react-router-dom';

interface QuickActionCard {
    label: string;
    description: string;
    icon: React.ReactNode;
    path: string;
    gradient: string;
    iconColor: string;
}

const quickActions: QuickActionCard[] = [
    {
        label: 'Profile',
        description: 'Manage your account settings',
        icon: <AccountCircleIcon sx={{ fontSize: 28 }} />,
        path: '/school-admin/profile',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        iconColor: '#667eea',
    },
    {
        label: 'Classes',
        description: 'View and manage all classes',
        icon: <ClassIcon sx={{ fontSize: 28 }} />,
        path: '/school-admin/classes',
        gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        iconColor: '#11998e',
    },
    {
        label: 'Timetable',
        description: 'Configure class timetables',
        icon: <ScheduleIcon sx={{ fontSize: 28 }} />,
        path: '/school-admin/timetable/master',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        iconColor: '#f093fb',
    },
    {
        label: 'Subjects',
        description: 'Manage school subjects',
        icon: <MenuBookIcon sx={{ fontSize: 28 }} />,
        path: '/school-admin/subjects',
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        iconColor: '#4facfe',
    },
    {
        label: 'Attendance',
        description: 'Track student attendance',
        icon: <HowToRegIcon sx={{ fontSize: 28 }} />,
        path: '/school-admin/attendance',
        gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        iconColor: '#43e97b',
    },
    {
        label: 'Announcements',
        description: 'Broadcast to school community',
        icon: <AnnouncementIcon sx={{ fontSize: 28 }} />,
        path: '/school-admin/announcements',
        gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        iconColor: '#fa709a',
    },
    {
        label: 'Fee Management',
        description: 'Track fees and payments',
        icon: <AttachMoneyIcon sx={{ fontSize: 28 }} />,
        path: '/school-admin/fees/dashboard',
        gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
        iconColor: '#30cfd0',
    },
    {
        label: 'Transport',
        description: 'Manage routes and vehicles',
        icon: <DirectionsBusIcon sx={{ fontSize: 28 }} />,
        path: '/school-admin/transport',
        gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
        iconColor: '#a18cd1',
    },
    {
        label: 'Exam Management',
        description: 'Schedule and manage exams',
        icon: <AssignmentIcon sx={{ fontSize: 28 }} />,
        path: '/school-admin/exam/config',
        gradient: 'linear-gradient(135deg, #fd7043 0%, #ffcc02 100%)',
        iconColor: '#fd7043',
    },
    {
        label: 'Leave Requests',
        description: 'Review pending leaves',
        icon: <EventNoteIcon sx={{ fontSize: 28 }} />,
        path: '/school-admin/leaverequest',
        gradient: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)',
        iconColor: '#f5af19',
    },
    {
        label: 'Notifications',
        description: 'Stay updated with alerts',
        icon: <NotificationsIcon sx={{ fontSize: 28 }} />,
        path: '/school-admin/notifications',
        gradient: 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)',
        iconColor: '#56ab2f',
    },
    {
        label: 'School Location',
        description: 'Update school map details',
        icon: <LocationOnIcon sx={{ fontSize: 28 }} />,
        path: '/school-admin/location',
        gradient: 'linear-gradient(135deg, #e96c4b 0%, #f7ce68 100%)',
        iconColor: '#e96c4b',
    },
    {
        label: 'Promotion',
        description: 'Promote students to next grade',
        icon: <TrendingUpIcon sx={{ fontSize: 28 }} />,
        path: '/school-admin/promotion',
        gradient: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
        iconColor: '#6a11cb',
    },
    {
        label: 'School Info',
        description: 'Update school details',
        icon: <SchoolIcon sx={{ fontSize: 28 }} />,
        path: '/school-admin/school',
        gradient: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        iconColor: '#2a5298',
    },
];

const SchoolAdminDashboard = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const { data, isLoading, error } = useGetSchoolDashboardStats(schoolId);
    const { data: leaveData } = useGetLeaveStats(schoolId);
    const navigate = useNavigate();

    const stats = data?.data;
    const leaveStats = leaveData?.data;

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography
                variant="h4"
                gutterBottom
                fontWeight={600}
                color="#1e293b"
                sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}
            >
                School Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Welcome to your School Dashboard. Manage teachers, students, and parents.
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    Failed to load dashboard stats. Please try again.
                </Alert>
            )}

            {/* Stats Cards */}
            <Grid container spacing={{ xs: 2, sm: 3 }}>
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
                            to="/school-admin/teachers"
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
                            to="/school-admin/students"
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <DashboardCard
                            title="Parents"
                            value={stats?.totalParents || 0}
                            subtitle={`${stats?.activeParents || 0} active`}
                            icon={<FamilyRestroomIcon sx={{ fontSize: 28 }} />}
                            color="#8b5cf6"
                            bgColor="#f5f3ff"
                            to="/school-admin/parents"
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <DashboardCard
                            title="Leave Requests"
                            value={leaveStats?.totalPending || 0}
                            subtitle={`${leaveStats?.todayPending || 0} today`}
                            icon={<EventNoteIcon sx={{ fontSize: 28 }} />}
                            color="#f59e0b"
                            bgColor="#fffbeb"
                            to="/school-admin/leaverequest"
                        />
                        </Grid>
                    </>
                )}
            </Grid>

            {/* Quick Actions Section */}
            <Box sx={{ mt: 5, mb: 2 }}>
                <Typography
                    variant="h5"
                    fontWeight={700}
                    color="#1e293b"
                    sx={{ mb: 0.5, fontSize: { xs: '1.1rem', sm: '1.3rem' } }}
                >
                    Quick Navigation
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Jump to any section of your school management system
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
                                {/* Subtle background gradient glow */}
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

export default SchoolAdminDashboard;
