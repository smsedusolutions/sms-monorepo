import React, { useMemo } from 'react';
import { Box, Typography, Grid, Skeleton, Alert, Avatar, Paper, Button, Stack, Chip } from '@mui/material';
import {
    School as ClassIcon,
    Assessment as ResultsIcon,
    EventNote as LeaveIcon,
    CheckCircle as AttendanceIcon,
    Schedule as TimetableIcon,
    Help as RequestIcon,
    ArrowForward as ArrowForwardIcon,
    CheckCircle as PresentIcon,
    Cancel as AbsentIcon,
    Schedule as LateIcon,
    TrendingUp as TrendIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Chart } from 'react-google-charts';
import { AppCard } from '../../components/shared/AppCard';
import TokenService from '../../queries/token/tokenService';
import { useGetSimpleStudentAttendance } from '../../queries/Attendance';

const StudentDashboard: React.FC = () => {
    const navigate = useNavigate();
    const user = TokenService.getUser();
    const userName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Student';
    const schoolId = TokenService.getSchoolId() || '';
    const studentId = TokenService.getStudentId() || '';

    // Get last 30 days of attendance
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data: attendanceData, isLoading, error } = useGetSimpleStudentAttendance(
        schoolId,
        studentId,
        startDate,
        endDate
    );

    const summary = attendanceData?.data?.summary;
    const totalDays = summary?.total || 0;
    const presentDays = (summary?.present || 0) + (summary?.late || 0);
    const percentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(0) : '0';
    const pctNumber = parseFloat(percentage);
    const percentageColor = pctNumber >= 90 ? '#10b981' : pctNumber >= 75 ? '#f59e0b' : '#ef4444';

    const donutData = useMemo(() => {
        return [
            ['Status', 'Days'],
            ['Present', summary?.present || 0],
            ['Absent', summary?.absent || 0],
            ['Late', summary?.late || 0],
            ['Leave', summary?.leave || 0],
        ];
    }, [summary]);

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1300, mx: 'auto' }}>
            {/* Welcome Header */}
            <Box sx={{ mb: { xs: 3, md: 5 }, mt: 1 }}>
                {isLoading ? (
                    <>
                        <Skeleton variant="text" width="60%" height={70} sx={{ borderRadius: 2 }} />
                        <Skeleton variant="text" width="40%" height={28} sx={{ mt: 1 }} />
                    </>
                ) : (
                    <>
                        <Typography
                            variant="h3"
                            fontWeight={800}
                            sx={{
                                mb: 0.5,
                                background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                fontSize: { xs: '2rem', md: '2.75rem' }
                            }}
                        >
                            Welcome back, {userName}!
                        </Typography>
                        <Typography variant="h6" color="text.secondary" fontWeight={400} sx={{ opacity: 0.85 }}>
                            Here is your academic & attendance status for today.
                        </Typography>
                    </>
                )}
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
                    Failed to load dashboard data. Please try again later.
                </Alert>
            )}

            {/* Attendance Short Report Widget */}
            <Paper
                elevation={0}
                onClick={() => navigate('/student/attendance')}
                sx={{
                    p: 3,
                    mb: 4,
                    borderRadius: 4,
                    border: '1px solid #e2e8f0',
                    bgcolor: '#ffffff',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 28px rgba(0, 0, 0, 0.08)',
                    }
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#eff6ff' }}>
                            <AttendanceIcon sx={{ color: '#2563eb', fontSize: 24 }} />
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight={700} color="#1e293b">
                                My Attendance Summary
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Last 30 Days records & statistics
                            </Typography>
                        </Box>
                    </Box>
                    <Button
                        variant="contained"
                        size="small"
                        endIcon={<ArrowForwardIcon />}
                        onClick={() => navigate('/student/attendance')}
                        sx={{
                            bgcolor: '#2563eb',
                            '&:hover': { bgcolor: '#1d4ed8' },
                            borderRadius: 2.5,
                            fontWeight: 700,
                            px: 2.5,
                            py: 0.8,
                            textTransform: 'none',
                        }}
                    >
                        View Full Attendance
                    </Button>
                </Box>

                {isLoading ? (
                    <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 3 }} />
                ) : (
                    <Grid container spacing={3} alignItems="center">
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                                <Chart
                                    chartType="PieChart"
                                    data={donutData}
                                    options={{
                                        pieHole: 0.65,
                                        colors: ['#10b981', '#ef4444', '#f59e0b', '#8b5cf6'],
                                        legend: 'none',
                                        chartArea: { width: '90%', height: '90%' },
                                        backgroundColor: 'transparent',
                                        pieSliceBorderColor: 'transparent',
                                    }}
                                    width="160px"
                                    height="160px"
                                />
                                <Box sx={{
                                    position: 'absolute', display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center', textAlign: 'center', pointerEvents: 'none'
                                }}>
                                    <Typography variant="h4" fontWeight={800} sx={{ color: percentageColor, lineHeight: 1 }}>
                                        {percentage}%
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mt: 0.5 }}>
                                        Rate
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 8 }}>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 6, sm: 3 }}>
                                    <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: '#ecfdf5', border: '1px solid #a7f3d0', textAlign: 'center' }}>
                                        <PresentIcon sx={{ color: '#10b981', fontSize: 24, mb: 0.5 }} />
                                        <Typography variant="h5" fontWeight={800} color="#10b981">{summary?.present || 0}</Typography>
                                        <Typography variant="caption" fontWeight={600} color="#065f46">Present</Typography>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 6, sm: 3 }}>
                                    <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: '#fef2f2', border: '1px solid #fecaca', textAlign: 'center' }}>
                                        <AbsentIcon sx={{ color: '#ef4444', fontSize: 24, mb: 0.5 }} />
                                        <Typography variant="h5" fontWeight={800} color="#ef4444">{summary?.absent || 0}</Typography>
                                        <Typography variant="caption" fontWeight={600} color="#991b1b">Absent</Typography>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 6, sm: 3 }}>
                                    <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: '#fffbeb', border: '1px solid #fde68a', textAlign: 'center' }}>
                                        <LateIcon sx={{ color: '#f59e0b', fontSize: 24, mb: 0.5 }} />
                                        <Typography variant="h5" fontWeight={800} color="#f59e0b">{summary?.late || 0}</Typography>
                                        <Typography variant="caption" fontWeight={600} color="#92400e">Late</Typography>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 6, sm: 3 }}>
                                    <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: '#f5f3ff', border: '1px solid #ddd6fe', textAlign: 'center' }}>
                                        <LeaveIcon sx={{ color: '#8b5cf6', fontSize: 24, mb: 0.5 }} />
                                        <Typography variant="h5" fontWeight={800} color="#8b5cf6">{summary?.leave || 0}</Typography>
                                        <Typography variant="caption" fontWeight={600} color="#5b21b6">Leave</Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                )}
            </Paper>

            {/* Academic Navigation Grid */}
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Quick Access & Modules</Typography>
            <Grid container spacing={3}>
                {isLoading ? (
                    [1, 2, 3, 4, 5, 6].map((i) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                            <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 4 }} />
                        </Grid>
                    ))
                ) : (
                    [
                        { title: 'Attendance Analytics', value: `${percentage}%`, subtitle: 'Attendance report & charts', icon: <AttendanceIcon />, color: '#10b981', to: '/student/attendance' },
                        { title: 'My Timetable', value: 'Schedule', subtitle: 'Daily class schedule', icon: <TimetableIcon />, color: '#3b82f6', to: '/student/timetable' },
                        { title: 'My Exams', value: 'Exams', subtitle: 'Schedules & hall tickets', icon: <ResultsIcon />, color: '#8b5cf6', to: '/student/exam/my-exams' },
                        { title: 'Leave Application', value: 'Leave', subtitle: 'Apply & view status', icon: <LeaveIcon />, color: '#f59e0b', to: '/student/leave/apply' },
                        { title: 'My Requests', value: 'Requests', subtitle: 'Track service requests', icon: <RequestIcon />, color: '#ec4899', to: '/student/my-requests' },
                        { title: 'My Profile', value: 'Profile', subtitle: 'Personal details & ID', icon: <ClassIcon />, color: '#06b6d4', to: '/student/profile' },
                    ].map((item) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.title}>
                            <AppCard
                                onClick={() => navigate(item.to)}
                                sx={{
                                    p: 3,
                                    height: '100%',
                                    borderRadius: 4,
                                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                                    border: '1px solid rgba(226, 232, 240, 0.8)',
                                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
                                    transition: 'all 0.2s ease',
                                    '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                                    <Avatar sx={{ bgcolor: `${item.color}15`, color: item.color, width: 46, height: 46, borderRadius: 2.5 }}>
                                        {React.cloneElement(item.icon as any, { sx: { fontSize: 24 } })}
                                    </Avatar>
                                    <ArrowForwardIcon sx={{ color: '#cbd5e1', fontSize: 20 }} />
                                </Box>
                                <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>{item.title}</Typography>
                                <Typography variant="caption" color="text.secondary" fontWeight={500}>{item.subtitle}</Typography>
                            </AppCard>
                        </Grid>
                    ))
                )}
            </Grid>
        </Box>
    );
};

export default StudentDashboard;
