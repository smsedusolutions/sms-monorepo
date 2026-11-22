import React, { useState, useMemo } from 'react';
import { Box, Typography, Grid, Skeleton, Alert, Button } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
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
import CampaignIcon from '@mui/icons-material/Campaign';
import DashboardCard from '../../components/Dashboard/DashboardCard';
import ExamPerformanceChart from '../../components/Dashboard/ExamPerformanceChart';
import UpcomingEventsWidget from '../../components/Dashboard/UpcomingEventsWidget';
import { useGetSchoolDashboardStats } from '../../queries/SchoolDashboard';
import { useGetLeaveStats } from '../../queries/Leave';
import { useGetExams, useGetExamPublishStatus } from '../../queries/Exam';
import DashboardErrorState from '../../components/shared/DashboardErrorState';
import DashboardRefreshButton from '../../components/shared/DashboardRefreshButton';
import BroadcastNotificationDialog from '../../components/Dialogs/BroadcastNotificationDialog';
import TokenService from '../../queries/token/tokenService';
import { useNavigate } from 'react-router-dom';
import { getEffectiveExamStatus } from '../../utils/examUtils';

interface QuickActionCard {
    label: string;
    description: string;
    icon: React.ReactNode;
    path: string;
    gradient: string;
    iconColor: string;
}

const SchoolAdminDashboard = () => {
    const theme = useTheme();
    const schoolId = TokenService.getSchoolId() || '';
    const { data, isLoading, error, isError, refetch: refetchStats } = useGetSchoolDashboardStats(schoolId);
    const { data: leaveData, refetch: refetchLeaves } = useGetLeaveStats(schoolId);
    const { data: examsData, isLoading: isExamsLoading, refetch: refetchExams } = useGetExams(schoolId);
    const [broadcastDialogOpen, setBroadcastDialogOpen] = useState(false);
    const navigate = useNavigate();

    const quickActions: QuickActionCard[] = useMemo(() => [
        {
            label: 'Profile',
            description: 'Manage your account settings',
            icon: <AccountCircleIcon sx={{ fontSize: 28 }} />,
            path: '/school-admin/profile',
            gradient: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            iconColor: theme.palette.primary.main,
        },
        {
            label: 'Classes',
            description: 'View and manage all classes',
            icon: <ClassIcon sx={{ fontSize: 28 }} />,
            path: '/school-admin/classes',
            gradient: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
            iconColor: theme.palette.primary.main,
        },
        {
            label: 'Timetable',
            description: 'Configure class timetables',
            icon: <ScheduleIcon sx={{ fontSize: 28 }} />,
            path: '/school-admin/timetable/master',
            gradient: `linear-gradient(135deg, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.main} 100%)`,
            iconColor: theme.palette.secondary.main,
        },
        {
            label: 'Subjects',
            description: 'Manage school subjects',
            icon: <MenuBookIcon sx={{ fontSize: 28 }} />,
            path: '/school-admin/subjects',
            gradient: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
            iconColor: theme.palette.primary.dark,
        },
        {
            label: 'Attendance',
            description: 'Track student attendance',
            icon: <HowToRegIcon sx={{ fontSize: 28 }} />,
            path: '/school-admin/attendance',
            gradient: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.dark} 100%)`,
            iconColor: theme.palette.primary.main,
        },
        {
            label: 'Announcements',
            description: 'Broadcast to school community',
            icon: <AnnouncementIcon sx={{ fontSize: 28 }} />,
            path: '/school-admin/announcements',
            gradient: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
            iconColor: theme.palette.warning.dark,
        },
        {
            label: 'Fee Management',
            description: 'Track fees and payments',
            icon: <AttachMoneyIcon sx={{ fontSize: 28 }} />,
            path: '/school-admin/fees/dashboard',
            gradient: `linear-gradient(135deg, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.main} 100%)`,
            iconColor: theme.palette.secondary.main,
        },
        {
            label: 'Transport',
            description: 'Manage routes and vehicles',
            icon: <DirectionsBusIcon sx={{ fontSize: 28 }} />,
            path: '/school-admin/transport',
            gradient: `linear-gradient(135deg, ${theme.palette.warning.light} 0%, ${theme.palette.warning.dark} 100%)`,
            iconColor: theme.palette.warning.dark,
        },
        {
            label: 'Exam Management',
            description: 'Schedule and manage exams',
            icon: <AssignmentIcon sx={{ fontSize: 28 }} />,
            path: '/school-admin/exam/config',
            gradient: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            iconColor: theme.palette.primary.main,
        },
        {
            label: 'Leave Requests',
            description: 'Review pending leaves',
            icon: <EventNoteIcon sx={{ fontSize: 28 }} />,
            path: '/school-admin/leaverequest',
            gradient: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
            iconColor: theme.palette.warning.main,
        },
        {
            label: 'Notifications',
            description: 'Stay updated with alerts',
            icon: <NotificationsIcon sx={{ fontSize: 28 }} />,
            path: '/school-admin/notifications',
            gradient: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
            iconColor: theme.palette.warning.main,
        },
        {
            label: 'School Location',
            description: 'Update school map details',
            icon: <LocationOnIcon sx={{ fontSize: 28 }} />,
            path: '/school-admin/location',
            gradient: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.dark} 100%)`,
            iconColor: theme.palette.primary.main,
        },
        {
            label: 'Promotion',
            description: 'Promote students to next grade',
            icon: <TrendingUpIcon sx={{ fontSize: 28 }} />,
            path: '/school-admin/promotion',
            gradient: `linear-gradient(135deg, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.main} 100%)`,
            iconColor: theme.palette.secondary.main,
        },
        {
            label: 'School Info',
            description: 'Update school details',
            icon: <SchoolIcon sx={{ fontSize: 28 }} />,
            path: '/school-admin/school',
            gradient: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            iconColor: theme.palette.primary.main,
        },
    ], [theme]);

    if (isError && !data) {
        return (
            <DashboardErrorState
                title="School Admin Dashboard Unavailable"
                message="Unable to connect to the platform and school user services. Please check your network or server status."
                error={error}
                onRetry={() => {
                    refetchStats();
                    refetchLeaves();
                    refetchExams();
                }}
            />
        );
    }

    const stats = data?.data;
    const leaveStats = leaveData?.data;
    const exams = examsData?.data || [];

    // Find the latest active or published exam
    const activeExam = exams.find((e: any) => {
        const s = getEffectiveExamStatus(e);
        return s === 'published' || s === 'completed';
    }) || exams[0];

    const { data: publishStatusData, isLoading: isStatusLoading } = useGetExamPublishStatus(
        schoolId,
        activeExam?.examId || ''
    );
    const publishData = publishStatusData?.data;

    const examName = publishData?.exam?.name || activeExam?.name;
    const rawStatus = publishData?.exam?.status || activeExam?.status;
    const examStatus = publishData?.exam ? getEffectiveExamStatus(publishData.exam) : activeExam ? getEffectiveExamStatus(activeExam) : rawStatus;

    let totalPassed = 0;
    let totalFailed = 0;
    let totalAbsent = 0;

    if (publishData?.subjects && publishData.subjects.length > 0) {
        publishData.subjects.forEach((subj: any) => {
            if (subj.publishStatus === 'final_published') {
                totalPassed += subj.passedCount || 0;
                totalFailed += subj.failedCount || 0;
                totalAbsent += subj.absentCount || 0;
            }
        });
    }

    const totalResults = totalPassed + totalFailed + totalAbsent;
    const hasPublishedResults = publishData?.summary?.finalPublishedCount && publishData.summary.finalPublishedCount > 0;

    const statusMessage = !activeExam
        ? 'No examinations created or scheduled yet'
        : examStatus === 'draft' || examStatus === 'scheduled' || !hasPublishedResults
        ? `${examName || 'Examination'} is scheduled • Results pending marks evaluation`
        : totalResults === 0
        ? 'Evaluation and result publishing in progress'
        : undefined;

    return (
        <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
            {/* Header & Refresh Action */}
            <Box sx={{ mb: { xs: 2, sm: 3 }, mt: 0.5, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                        variant="h4"
                        fontWeight={800}
                        sx={{
                            mb: 0.25,
                            background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.text.secondary} 100%)`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontSize: { xs: '1.45rem', sm: '1.85rem', md: '2.25rem' },
                            letterSpacing: '-0.02em',
                            lineHeight: 1.2
                        }}
                    >
                        School Dashboard
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                        Welcome to your School Dashboard. Manage teachers, students, and parents.
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<CampaignIcon />}
                        onClick={() => setBroadcastDialogOpen(true)}
                        sx={{
                            borderRadius: 2.5,
                            height: { xs: 36, sm: 40 },
                            px: { xs: 1.5, sm: 2 },
                            fontWeight: 800,
                            fontSize: { xs: '0.78rem', sm: '0.85rem' },
                            textTransform: 'none',
                            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        Broadcast Alert
                    </Button>
                    <DashboardRefreshButton
                        onRefresh={async () => {
                            await Promise.all([
                                refetchStats(),
                                refetchLeaves(),
                                refetchExams(),
                            ]);
                        }}
                    />
                </Box>
            </Box>

            {/* Broadcast Notification Dialog */}
            <BroadcastNotificationDialog
                open={broadcastDialogOpen}
                onClose={() => setBroadcastDialogOpen(false)}
            />

            {error && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2.5 }}>
                    Failed to load dashboard stats. Please try again.
                </Alert>
            )}

            {/* Upcoming Events & Exams Gadget (Next 7 days) */}
            <UpcomingEventsWidget calendarPath="/school-admin/calendar" />

            {/* Stats Cards - 2x2 on mobile, 4 in a row on desktop */}
            <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                {isLoading ? (
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
                                to="/school-admin/teachers"
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
                                to="/school-admin/students"
                            />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                            <DashboardCard
                                title="Parents"
                                value={stats?.totalParents || 0}
                                subtitle={`${stats?.activeParents || 0} active`}
                                icon={<FamilyRestroomIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />}
                                color={theme.palette.secondary.main}
                                bgColor={alpha(theme.palette.secondary.main, 0.08)}
                                to="/school-admin/parents"
                            />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                            <DashboardCard
                                title="Leave Requests"
                                value={leaveStats?.totalPending || 0}
                                subtitle={`${leaveStats?.todayPending || 0} today`}
                                icon={<EventNoteIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />}
                                color={theme.palette.warning.main}
                                bgColor={alpha(theme.palette.warning.main, 0.08)}
                                to="/school-admin/leaverequest"
                            />
                        </Grid>
                    </>
                )}
            </Grid>

            {/* Exam Performance Section */}
            <Box sx={{ mt: { xs: 2.5, sm: 3 } }}>
                <ExamPerformanceChart
                    title="School-Wide Exam Performance"
                    examName={examName}
                    examStatus={examStatus}
                    isLoading={isExamsLoading || isStatusLoading}
                    passed={totalPassed}
                    failed={totalFailed}
                    absent={totalAbsent}
                    statusMessage={statusMessage}
                />
            </Box>

            {/* Quick Actions Section */}
            <Box sx={{ mt: { xs: 3, sm: 4 }, mb: 2 }}>
                <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    color="text.primary"
                    sx={{ mb: 0.25, fontSize: { xs: '0.95rem', sm: '1.15rem' } }}
                >
                    Quick Navigation
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block', fontSize: '0.75rem' }}>
                    Jump to any section of your school management system
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
                                {/* Subtle background gradient glow */}
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

export default SchoolAdminDashboard;
