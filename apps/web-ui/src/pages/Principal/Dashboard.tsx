import { useMemo } from 'react';
import { Box, Typography, Grid, Skeleton, Alert, Chip, Card, CardContent, Button, Stack } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
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
import UpcomingEventsWidget from '../../components/Dashboard/UpcomingEventsWidget';
import DashboardRefreshButton from '../../components/shared/DashboardRefreshButton';
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
    const theme = useTheme();
    const { user } = useUserStore();
    const schoolId = TokenService.getSchoolId() || user?.schoolId || TokenService.getUser()?.schoolId || '';

    const { data, isLoading, error, refetch: refetchStats } = useGetSchoolDashboardStats(schoolId);
    const { data: leaveData, refetch: refetchLeaves } = useGetLeaveStats(schoolId);
    const { data: pendingTimetablesData, refetch: refetchTimetables } = useGetTimetableSchedules(schoolId, 'pending_approval');
    const { data: examsData, refetch: refetchExams } = useGetExams(schoolId);
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

    const quickActions: QuickActionCard[] = useMemo(() => [
        {
            label: 'Leave Approvals',
            description: 'Review teacher leave requests',
            icon: <EventNoteIcon sx={{ fontSize: 28 }} />,
            path: '/principal/leave/teacher-requests',
            gradient: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
            iconColor: theme.palette.warning.main,
            badge: leaveStats?.teacherPending || 0,
        },
        {
            label: 'Timetable Review',
            description: 'Approve draft timetables',
            icon: <ScheduleIcon sx={{ fontSize: 28 }} />,
            path: '/principal/timetable/review',
            gradient: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            iconColor: theme.palette.primary.main,
        },
        {
            label: 'Exam Approvals',
            description: 'Approve exam schedules',
            icon: <AssignmentIcon sx={{ fontSize: 28 }} />,
            path: '/principal/exam/approval',
            gradient: `linear-gradient(135deg, ${theme.palette.warning.light} 0%, ${theme.palette.warning.main} 100%)`,
            iconColor: theme.palette.warning.main,
        },
        {
            label: 'Attendance',
            description: 'School-wide attendance overview',
            icon: <HowToRegIcon sx={{ fontSize: 28 }} />,
            path: '/principal/attendance',
            gradient: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
            iconColor: theme.palette.primary.main,
        },
        {
            label: 'Teachers',
            description: 'View teacher directory',
            icon: <PeopleIcon sx={{ fontSize: 28 }} />,
            path: '/principal/teachers',
            gradient: `linear-gradient(135deg, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.main} 100%)`,
            iconColor: theme.palette.secondary.main,
        },
        {
            label: 'Students',
            description: 'Browse student directory',
            icon: <SchoolIcon sx={{ fontSize: 28 }} />,
            path: '/principal/students',
            gradient: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
            iconColor: theme.palette.primary.dark,
        },
        {
            label: 'Exam Results',
            description: 'View school-wide results',
            icon: <CheckCircleIcon sx={{ fontSize: 28 }} />,
            path: '/principal/exam/results',
            gradient: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            iconColor: theme.palette.primary.main,
        },
        {
            label: 'Announcements',
            description: 'Publish school announcements',
            icon: <AnnouncementIcon sx={{ fontSize: 28 }} />,
            path: '/principal/announcements',
            gradient: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
            iconColor: theme.palette.warning.dark,
        },
        {
            label: 'Notifications',
            description: 'Stay updated with alerts',
            icon: <NotificationsIcon sx={{ fontSize: 28 }} />,
            path: '/principal/notifications',
            gradient: `linear-gradient(135deg, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.main} 100%)`,
            iconColor: theme.palette.secondary.main,
        },
        {
            label: 'Profile',
            description: 'Manage your account',
            icon: <AccountCircleIcon sx={{ fontSize: 28 }} />,
            path: '/principal/profile',
            gradient: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
            iconColor: theme.palette.secondary.main,
        },
    ], [theme, leaveStats?.teacherPending]);

    return (
        <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
            {/* Welcome Header */}
            <Box
                sx={{
                    mb: { xs: 2, sm: 3 },
                    p: { xs: 2, sm: 2.5 },
                    borderRadius: 2.5,
                    background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
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
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, position: 'relative', zIndex: 1 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: '1.35rem', sm: '1.75rem' }, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                            Welcome back, {userName}
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
                                    bgcolor: alpha(theme.palette.warning.main, 0.25),
                                    color: theme.palette.warning.light,
                                    border: `1px solid ${alpha(theme.palette.warning.main, 0.4)}`,
                                    fontWeight: 700,
                                    fontSize: '0.72rem',
                                    height: 24
                                }}
                                icon={<EventNoteIcon sx={{ color: `${theme.palette.warning.light} !important`, fontSize: '14px !important' }} />}
                                onClick={() => navigate('/principal/leave/teacher-requests')}
                            />
                        )}
                    </Box>

                    <DashboardRefreshButton
                        onRefresh={async () => {
                            await Promise.all([
                                refetchStats(),
                                refetchLeaves(),
                                refetchTimetables(),
                                refetchExams(),
                            ]);
                        }}
                    />
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2.5 }}>
                    Failed to load dashboard stats. Please try again.
                </Alert>
            )}

            {/* Upcoming Events Gadget */}
            <UpcomingEventsWidget calendarPath="/principal/calendar" />

            {/* Stats Cards - 2x2 on mobile, 4 on desktop */}
            <Box sx={{ mb: { xs: 2.5, sm: 3.5 } }}>
                <Typography variant="subtitle1" fontWeight={700} color="text.primary" sx={{ mb: 1.25, fontSize: { xs: '0.95rem', sm: '1.05rem' } }}>
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
                                    color={theme.palette.primary.main}
                                    bgColor={alpha(theme.palette.primary.main, 0.08)}
                                    to="/principal/teachers"
                                />
                            </Grid>
                            <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                                <DashboardCard
                                    title="Students"
                                    value={stats?.totalStudents || 0}
                                    subtitle={`${stats?.activeStudents || 0} active`}
                                    icon={<SchoolIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />}
                                    color={theme.palette.primary.dark}
                                    bgColor={alpha(theme.palette.primary.dark, 0.08)}
                                    to="/principal/students"
                                />
                            </Grid>
                            <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                                <DashboardCard
                                    title="Leave Requests"
                                    value={leaveStats?.totalPending || 0}
                                    subtitle={`${leaveStats?.teacherPending || 0} teachers`}
                                    icon={<EventNoteIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />}
                                    color={theme.palette.warning.main}
                                    bgColor={alpha(theme.palette.warning.main, 0.08)}
                                    to="/principal/leave/teacher-requests"
                                />
                            </Grid>
                            <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                                <DashboardCard
                                    title="Parents"
                                    value={stats?.totalParents || 0}
                                    subtitle={`${stats?.activeParents || 0} active`}
                                    icon={<HowToRegIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />}
                                    color={theme.palette.secondary.main}
                                    bgColor={alpha(theme.palette.secondary.main, 0.08)}
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
                    <PendingActionsIcon sx={{ color: totalPendingApprovals > 0 ? theme.palette.warning.main : theme.palette.success.main, fontSize: 22 }} />
                    <Typography variant="subtitle1" fontWeight={700} color="text.primary" sx={{ fontSize: { xs: '0.95rem', sm: '1.05rem' } }}>
                        Pending Approvals & Actions
                    </Typography>
                    {totalPendingApprovals > 0 ? (
                        <Chip
                            label={`${totalPendingApprovals} pending`}
                            size="small"
                            sx={{ bgcolor: alpha(theme.palette.warning.main, 0.12), color: theme.palette.warning.dark, fontWeight: 700, borderRadius: '6px', height: 20, fontSize: '0.68rem' }}
                        />
                    ) : (
                        <Chip
                            icon={<CheckCircleOutlineIcon sx={{ fontSize: '12px !important', color: `${theme.palette.success.main} !important` }} />}
                            label="Up To Date"
                            size="small"
                            sx={{ bgcolor: alpha(theme.palette.success.main, 0.12), color: theme.palette.success.main, fontWeight: 700, borderRadius: '6px', height: 20, fontSize: '0.68rem' }}
                        />
                    )}
                </Stack>

                <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                    {/* Timetable Approvals Small Card */}
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Card
                            elevation={0}
                            sx={{
                                border: pendingTimetableCount > 0 ? `1.5px solid ${alpha(theme.palette.warning.main, 0.4)}` : `1px solid ${theme.palette.divider}`,
                                borderRadius: 2.5,
                                background: pendingTimetableCount > 0 ? alpha(theme.palette.warning.main, 0.04) : theme.palette.background.paper,
                                boxShadow: pendingTimetableCount > 0 ? `0 2px 10px ${alpha(theme.palette.warning.main, 0.1)}` : '0 2px 8px rgba(0,0,0,0.02)',
                                transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 18px rgba(0,0,0,0.06)' }
                            }}
                        >
                            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography variant="caption" fontWeight={700} sx={{ color: theme.palette.warning.dark, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>
                                             Timetable Review
                                        </Typography>
                                        <Typography variant="h6" fontWeight={800} color={pendingTimetableCount > 0 ? theme.palette.warning.dark : 'text.primary'} sx={{ mt: 0.25, fontSize: '1.1rem' }}>
                                            {pendingTimetableCount} {pendingTimetableCount === 1 ? 'Timetable' : 'Timetables'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, fontSize: '0.72rem', display: 'block' }} noWrap>
                                            {pendingTimetableCount > 0
                                                ? `${pendingTimetables[0]?.name || 'Manual schedule'} submitted`
                                                : 'No timetables waiting for approval'}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ p: 0.75, borderRadius: 2, bgcolor: alpha(theme.palette.warning.main, 0.12), color: theme.palette.warning.dark, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                                border: pendingTeacherLeaveCount > 0 ? `1.5px solid ${alpha(theme.palette.error.main, 0.4)}` : `1px solid ${theme.palette.divider}`,
                                borderRadius: 2.5,
                                background: pendingTeacherLeaveCount > 0 ? alpha(theme.palette.error.main, 0.04) : theme.palette.background.paper,
                                boxShadow: pendingTeacherLeaveCount > 0 ? `0 2px 10px ${alpha(theme.palette.error.main, 0.1)}` : '0 2px 8px rgba(0,0,0,0.02)',
                                transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 18px rgba(0,0,0,0.06)' }
                            }}
                        >
                            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography variant="caption" fontWeight={700} sx={{ color: theme.palette.error.main, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>
                                            Teacher Leaves
                                        </Typography>
                                        <Typography variant="h6" fontWeight={800} color={pendingTeacherLeaveCount > 0 ? theme.palette.error.main : 'text.primary'} sx={{ mt: 0.25, fontSize: '1.1rem' }}>
                                            {pendingTeacherLeaveCount} {pendingTeacherLeaveCount === 1 ? 'Request' : 'Requests'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, fontSize: '0.72rem', display: 'block' }} noWrap>
                                            {pendingTeacherLeaveCount > 0
                                                ? 'Teacher leaves pending review'
                                                : 'No teacher leaves pending'}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ p: 0.75, borderRadius: 2, bgcolor: alpha(theme.palette.error.main, 0.12), color: theme.palette.error.main, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: 2.5,
                                background: theme.palette.background.paper,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                                transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 18px rgba(0,0,0,0.06)' }
                            }}
                        >
                            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography variant="caption" fontWeight={700} sx={{ color: theme.palette.primary.main, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>
                                            Exam Approvals
                                        </Typography>
                                        <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ mt: 0.25, fontSize: '1.1rem' }}>
                                            {pendingExams.length} {pendingExams.length === 1 ? 'Exam' : 'Exams'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, fontSize: '0.72rem', display: 'block' }} noWrap>
                                            {pendingExams.length > 0 ? 'Active & upcoming exam schedules' : 'No pending exam approvals'}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ p: 0.75, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.12), color: theme.palette.primary.main, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                    color="text.primary"
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
                                    background: theme.palette.background.paper,
                                    border: `1px solid ${theme.palette.divider}`,
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
                                        borderColor: theme.palette.divider,
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
                                            bgcolor: theme.palette.error.main,
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
                                        boxShadow: `0 3px 10px ${alpha(action.iconColor, 0.35)}`,
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
                                            color: theme.palette.text.primary,
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
                                            color: theme.palette.text.secondary,
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
