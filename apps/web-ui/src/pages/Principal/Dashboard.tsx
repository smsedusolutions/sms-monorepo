import { Box, Typography, Grid, Skeleton, Alert, Chip, Card, CardContent, Button, Stack } from '@mui/material';
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
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DashboardCard from '../../components/Dashboard/DashboardCard';
import { useGetSchoolDashboardStats } from '../../queries/SchoolDashboard';
import { useGetLeaveStats } from '../../queries/Leave';
import { useGetTimetableSchedules } from '../../queries/Timetable';
import { useGetExams } from '../../queries/Exam';
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
    const { user } = useUserStore();
    const schoolId = TokenService.getSchoolId() || user?.schoolId || TokenService.getUser()?.schoolId || '';

    const { data, isLoading, error } = useGetSchoolDashboardStats(schoolId);
    const { data: leaveData } = useGetLeaveStats(schoolId);
    const { data: pendingTimetablesData } = useGetTimetableSchedules(schoolId, 'pending_approval');
    const { data: examsData } = useGetExams(schoolId);
    const navigate = useNavigate();

    const isStatsLoading = Boolean(isLoading && schoolId && !data);

    const stats = data?.data;
    const leaveStats = leaveData?.data;
    const pendingTimetables = pendingTimetablesData?.data || [];
    const pendingExams = examsData?.data?.filter((e: any) => e.status === 'scheduled' || e.status === 'draft') || [];

    const pendingTimetableCount = pendingTimetables.length;
    const pendingTeacherLeaveCount = leaveStats?.teacherPending || 0;
    const totalPendingApprovals = pendingTimetableCount + pendingTeacherLeaveCount;

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
        <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
            {/* Welcome Header */}
            <Box
                sx={{
                    mb: { xs: 2, sm: 3 },
                    p: { xs: 2, sm: 2.5 },
                    borderRadius: 2.5,
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
                        width: 160,
                        height: 160,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.05)',
                        pointerEvents: 'none',
                    }}
                />
                <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: '1.35rem', sm: '1.75rem' }, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                    Welcome back, {userName} 👋
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.85, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    Here's what needs your attention today.
                </Typography>
                {(leaveStats?.teacherPending || 0) > 0 && (
                    <Chip
                        label={`${leaveStats?.teacherPending} leave request${(leaveStats?.teacherPending || 0) > 1 ? 's' : ''} pending`}
                        size="small"
                        sx={{
                            mt: 1.25,
                            bgcolor: 'rgba(251,191,36,0.25)',
                            color: '#fde68a',
                            border: '1px solid rgba(251,191,36,0.4)',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            height: 24
                        }}
                        icon={<EventNoteIcon sx={{ color: '#fde68a !important', fontSize: '14px !important' }} />}
                        onClick={() => navigate('/principal/leave/teacher-requests')}
                    />
                )}
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2.5 }}>
                    Failed to load dashboard stats. Please try again.
                </Alert>
            )}

            {/* Stats Cards - 2x2 on mobile, 4 on desktop */}
            <Box sx={{ mb: { xs: 2.5, sm: 3.5 } }}>
                <Typography variant="subtitle1" fontWeight={700} color="#1e293b" sx={{ mb: 1.25, fontSize: { xs: '0.95rem', sm: '1.05rem' } }}>
                    School Overview
                </Typography>
                <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                    {isStatsLoading ? (
                        [1, 2, 3, 4].map((i) => (
                            <Grid size={{ xs: 6, sm: 6, md: 3 }} key={i}>
                                <Skeleton variant="rectangular" height={90} sx={{ borderRadius: 2.5 }} />
                            </Grid>
                        ))
                    ) : (
                        <>
                            <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                                <DashboardCard
                                    title="Teachers"
                                    value={stats?.totalTeachers || 0}
                                    subtitle={`${stats?.activeTeachers || 0} active`}
                                    icon={<PeopleIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />}
                                    color="#3b82f6"
                                    bgColor="#eff6ff"
                                    to="/principal/teachers"
                                />
                            </Grid>
                            <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                                <DashboardCard
                                    title="Students"
                                    value={stats?.totalStudents || 0}
                                    subtitle={`${stats?.activeStudents || 0} active`}
                                    icon={<SchoolIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />}
                                    color="#10b981"
                                    bgColor="#ecfdf5"
                                    to="/principal/students"
                                />
                            </Grid>
                            <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                                <DashboardCard
                                    title="Leave Requests"
                                    value={leaveStats?.totalPending || 0}
                                    subtitle={`${leaveStats?.teacherPending || 0} teachers`}
                                    icon={<EventNoteIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />}
                                    color="#f59e0b"
                                    bgColor="#fffbeb"
                                    to="/principal/leave/teacher-requests"
                                />
                            </Grid>
                            <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                                <DashboardCard
                                    title="Parents"
                                    value={stats?.totalParents || 0}
                                    subtitle={`${stats?.activeParents || 0} active`}
                                    icon={<HowToRegIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />}
                                    color="#8b5cf6"
                                    bgColor="#f5f3ff"
                                    to="/principal/students"
                                />
                            </Grid>
                        </>
                    )}
                </Grid>
            </Box>

            {/* Pending Approvals Section */}
            <Box sx={{ mb: { xs: 2.5, sm: 3.5 } }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5, flexWrap: 'wrap' }}>
                    <PendingActionsIcon sx={{ color: totalPendingApprovals > 0 ? '#d97706' : '#10b981', fontSize: 22 }} />
                    <Typography variant="subtitle1" fontWeight={700} color="#1e293b" sx={{ fontSize: { xs: '0.95rem', sm: '1.05rem' } }}>
                        Pending Approvals & Actions
                    </Typography>
                    {totalPendingApprovals > 0 ? (
                        <Chip
                            label={`${totalPendingApprovals} pending`}
                            size="small"
                            sx={{ bgcolor: '#fef3c7', color: '#b45309', fontWeight: 700, borderRadius: '6px', height: 20, fontSize: '0.68rem' }}
                        />
                    ) : (
                        <Chip
                            icon={<CheckCircleOutlineIcon sx={{ fontSize: '12px !important', color: '#047857 !important' }} />}
                            label="Up To Date"
                            size="small"
                            sx={{ bgcolor: '#d1fae5', color: '#047857', fontWeight: 700, borderRadius: '6px', height: 20, fontSize: '0.68rem' }}
                        />
                    )}
                </Stack>

                <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                    {/* Timetable Approvals Small Card */}
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Card
                            elevation={0}
                            sx={{
                                border: pendingTimetableCount > 0 ? '1.5px solid #fde68a' : '1px solid #e2e8f0',
                                borderRadius: 2.5,
                                background: pendingTimetableCount > 0 ? 'linear-gradient(135deg, #fffdf5 0%, #fffbebe6 100%)' : '#fff',
                                boxShadow: pendingTimetableCount > 0 ? '0 2px 10px rgba(245, 158, 11, 0.08)' : '0 2px 8px rgba(0,0,0,0.02)',
                                transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 18px rgba(0,0,0,0.06)' }
                            }}
                        >
                            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography variant="caption" fontWeight={700} sx={{ color: '#92400e', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>
                                            Timetable Review
                                        </Typography>
                                        <Typography variant="h6" fontWeight={800} color={pendingTimetableCount > 0 ? '#b45309' : '#334155'} sx={{ mt: 0.25, fontSize: '1.1rem' }}>
                                            {pendingTimetableCount} {pendingTimetableCount === 1 ? 'Timetable' : 'Timetables'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, fontSize: '0.72rem', display: 'block' }} noWrap>
                                            {pendingTimetableCount > 0
                                                ? `${pendingTimetables[0]?.name || 'Manual schedule'} submitted`
                                                : 'No timetables waiting for approval'}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ p: 0.75, borderRadius: 2, bgcolor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <ScheduleIcon sx={{ fontSize: 20 }} />
                                    </Box>
                                </Stack>
                                <Button
                                    fullWidth
                                    size="small"
                                    variant={pendingTimetableCount > 0 ? "contained" : "outlined"}
                                    color="warning"
                                    endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                                    onClick={() => navigate('/principal/timetable/review')}
                                    sx={{ mt: 1.5, borderRadius: 2, fontWeight: 700, textTransform: 'none', py: 0.4, fontSize: '0.75rem' }}
                                >
                                    {pendingTimetableCount > 0 ? 'Review & Approve' : 'View Timetables'}
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Teacher Leave Requests Small Card */}
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Card
                            elevation={0}
                            sx={{
                                border: pendingTeacherLeaveCount > 0 ? '1.5px solid #fecdd3' : '1px solid #e2e8f0',
                                borderRadius: 2.5,
                                background: pendingTeacherLeaveCount > 0 ? 'linear-gradient(135deg, #fff5f5 0%, #fff1f2e6 100%)' : '#fff',
                                boxShadow: pendingTeacherLeaveCount > 0 ? '0 2px 10px rgba(239, 68, 68, 0.08)' : '0 2px 8px rgba(0,0,0,0.02)',
                                transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 18px rgba(0,0,0,0.06)' }
                            }}
                        >
                            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography variant="caption" fontWeight={700} sx={{ color: '#9f1239', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>
                                            Teacher Leaves
                                        </Typography>
                                        <Typography variant="h6" fontWeight={800} color={pendingTeacherLeaveCount > 0 ? '#be123c' : '#334155'} sx={{ mt: 0.25, fontSize: '1.1rem' }}>
                                            {pendingTeacherLeaveCount} {pendingTeacherLeaveCount === 1 ? 'Request' : 'Requests'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, fontSize: '0.72rem', display: 'block' }} noWrap>
                                            {pendingTeacherLeaveCount > 0
                                                ? 'Teacher leaves pending review'
                                                : 'No teacher leaves pending'}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ p: 0.75, borderRadius: 2, bgcolor: '#ffe4e6', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <EventNoteIcon sx={{ fontSize: 20 }} />
                                    </Box>
                                </Stack>
                                <Button
                                    fullWidth
                                    size="small"
                                    variant={pendingTeacherLeaveCount > 0 ? "contained" : "outlined"}
                                    color="error"
                                    endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                                    onClick={() => navigate('/principal/leave/teacher-requests')}
                                    sx={{ mt: 1.5, borderRadius: 2, fontWeight: 700, textTransform: 'none', py: 0.4, fontSize: '0.75rem' }}
                                >
                                    {pendingTeacherLeaveCount > 0 ? 'Review Requests' : 'View Leave History'}
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Exam Approvals / Management Small Card */}
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Card
                            elevation={0}
                            sx={{
                                border: '1px solid #e2e8f0',
                                borderRadius: 2.5,
                                background: '#fff',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                                transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 18px rgba(0,0,0,0.06)' }
                            }}
                        >
                            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography variant="caption" fontWeight={700} sx={{ color: '#4338ca', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>
                                            Exam Approvals
                                        </Typography>
                                        <Typography variant="h6" fontWeight={800} color="#334155" sx={{ mt: 0.25, fontSize: '1.1rem' }}>
                                            {pendingExams.length} {pendingExams.length === 1 ? 'Exam' : 'Exams'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, fontSize: '0.72rem', display: 'block' }} noWrap>
                                            {pendingExams.length > 0 ? 'Active & upcoming exam schedules' : 'No pending exam approvals'}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ p: 0.75, borderRadius: 2, bgcolor: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <AssignmentIcon sx={{ fontSize: 20 }} />
                                    </Box>
                                </Stack>
                                <Button
                                    fullWidth
                                    size="small"
                                    variant="outlined"
                                    color="primary"
                                    endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                                    onClick={() => navigate('/principal/exam/approval')}
                                    sx={{ mt: 1.5, borderRadius: 2, fontWeight: 700, textTransform: 'none', py: 0.4, fontSize: '0.75rem' }}
                                >
                                    Manage Exams
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>

            {/* Quick Actions Section */}
            <Box sx={{ mb: 2 }}>
                <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    color="#1e293b"
                    sx={{ mb: 0.25, fontSize: { xs: '0.95rem', sm: '1.15rem' } }}
                >
                    Quick Navigation
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block', fontSize: '0.75rem' }}>
                    Jump to any section of your principal dashboard
                </Typography>

                <Grid container spacing={{ xs: 1, sm: 1.5, md: 2 }}>
                    {quickActions.map((action) => (
                        <Grid size={{ xs: 4, sm: 4, md: 3, lg: 2 }} key={action.label}>
                            <Box
                                onClick={() => navigate(action.path)}
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 0.75,
                                    p: { xs: 1.25, sm: 1.75 },
                                    borderRadius: 2.5,
                                    background: 'white',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                                    minHeight: { xs: 88, sm: 110 },
                                    position: 'relative',
                                    overflow: 'hidden',
                                    '&:hover': {
                                        transform: 'translateY(-3px)',
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                                        borderColor: '#cbd5e1',
                                        '& .action-icon-box': {
                                            transform: 'scale(1.08)',
                                        },
                                        '& .action-label': {
                                            color: action.iconColor,
                                        },
                                    },
                                    '&:active': {
                                        transform: 'translateY(-1px)',
                                    },
                                }}
                            >
                                {/* Background glow */}
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: -20,
                                        right: -20,
                                        width: 60,
                                        height: 60,
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
                                            top: 6,
                                            right: 6,
                                            minWidth: 18,
                                            height: 18,
                                            borderRadius: '9px',
                                            bgcolor: '#ef4444',
                                            color: 'white',
                                            fontSize: '0.6rem',
                                            fontWeight: 700,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            px: 0.4,
                                        }}
                                    >
                                        {action.badge}
                                    </Box>
                                )}
                                <Box
                                    className="action-icon-box"
                                    sx={{
                                        width: { xs: 36, sm: 44 },
                                        height: { xs: 36, sm: 44 },
                                        borderRadius: '10px',
                                        background: action.gradient,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        boxShadow: `0 3px 10px ${action.iconColor}35`,
                                        transition: 'transform 0.2s ease',
                                        flexShrink: 0,
                                        '& .MuiSvgIcon-root': {
                                            fontSize: { xs: 18, sm: 22 }
                                        }
                                    }}
                                >
                                    {action.icon}
                                </Box>
                                <Box sx={{ width: '100%' }}>
                                    <Typography
                                        className="action-label"
                                        variant="caption"
                                        sx={{
                                            fontWeight: 700,
                                            color: '#1e293b',
                                            fontSize: { xs: '0.72rem', sm: '0.78rem' },
                                            transition: 'color 0.2s ease',
                                            lineHeight: 1.15,
                                            display: 'block',
                                        }}
                                        noWrap
                                    >
                                        {action.label}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: '#94a3b8',
                                            fontSize: { xs: '0.62rem', sm: '0.68rem' },
                                            display: { xs: 'none', md: 'block' },
                                            mt: 0.2,
                                            lineHeight: 1.2,
                                        }}
                                        noWrap
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
