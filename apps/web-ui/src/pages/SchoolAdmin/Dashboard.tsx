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
import ExamPerformanceChart from '../../components/Dashboard/ExamPerformanceChart';
import UpcomingEventsWidget from '../../components/Dashboard/UpcomingEventsWidget';
import { useGetSchoolDashboardStats } from '../../queries/SchoolDashboard';
import { useGetLeaveStats } from '../../queries/Leave';
import { useGetExams, useGetExamPublishStatus } from '../../queries/Exam';
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
    const { data: examsData, isLoading: isExamsLoading } = useGetExams(schoolId);
    const navigate = useNavigate();

    const stats = data?.data;
    const leaveStats = leaveData?.data;
    const exams = examsData?.data || [];

    // Find the latest active or published exam
    const activeExam = exams.find((e: any) => e.status === 'published' || e.status === 'completed') || exams[0];

    const { data: publishStatusData, isLoading: isStatusLoading } = useGetExamPublishStatus(
        schoolId,
        activeExam?.examId || ''
    );
    const publishData = publishStatusData?.data;

    const examName = publishData?.exam?.name || activeExam?.name;
    const examStatus = publishData?.exam?.status || activeExam?.status;

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
            <Box sx={{ mb: { xs: 2, sm: 3 }, mt: 0.5 }}>
                <Typography
                    variant="h4"
                    fontWeight={800}
                    sx={{
                        mb: 0.25,
                        background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
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
                                color="#3b82f6"
                                bgColor="#eff6ff"
                                to="/school-admin/teachers"
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
                                to="/school-admin/students"
                            />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                            <DashboardCard
                                title="Parents"
                                value={stats?.totalParents || 0}
                                subtitle={`${stats?.activeParents || 0} active`}
                                icon={<FamilyRestroomIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />}
                                color="#8b5cf6"
                                bgColor="#f5f3ff"
                                to="/school-admin/parents"
                            />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                            <DashboardCard
                                title="Leave Requests"
                                value={leaveStats?.totalPending || 0}
                                subtitle={`${leaveStats?.todayPending || 0} today`}
                                icon={<EventNoteIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />}
                                color="#f59e0b"
                                bgColor="#fffbeb"
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
                    color="#1e293b"
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

export default SchoolAdminDashboard;
