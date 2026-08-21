import React, { useMemo, useState } from 'react';
import { Box, Typography, Grid, Skeleton, Alert, Avatar, Paper, Button, Stack, Chip, Divider } from '@mui/material';
import {
    School as ClassIcon,
    Assessment as ResultsIcon,
    EventNote as LeaveIcon,
    CheckCircle as AttendanceIcon,
    Schedule as TimetableIcon,
    ArrowForward as ArrowForwardIcon,
    CheckCircle as PresentIcon,
    Cancel as AbsentIcon,
    Schedule as LateIcon,
    Campaign as AnnouncementIcon,
    MenuBook as HomeworkIcon,
    CalendarMonth as CalendarIcon,
    Assignment as AssignmentIcon,
    Warning as OverdueIcon,
    HeadsetMic as SupportIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Chart } from 'react-google-charts';
import RequestChangeDialog from '../../components/Dialogs/RequestChangeDialog';
import TokenService from '../../queries/token/tokenService';
import { useGetSimpleStudentAttendance } from '../../queries/Attendance';
import { useGetClassTimetable, useGetActiveConfig } from '../../queries/Timetable';
import { useGetAnnouncements } from '../../queries/Announcement';
import { useGetHomeworkByStudent } from '../../queries/Homework';
import { useGetSubjects } from '../../queries/Subject';
import { useGetTeachers } from '../../queries/Teacher';
import UpcomingEventsWidget from '../../components/Dashboard/UpcomingEventsWidget';

const StudentDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [supportDialogOpen, setSupportDialogOpen] = useState(false);
    const user = TokenService.getUser();
    const userName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Student';
    const schoolId = TokenService.getSchoolId() || '';
    const studentId = TokenService.getStudentId() || '';
    const userClass = user?.class || '';
    const userSection = user?.section || '';

    // Attendance dates
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Queries
    const { data: attendanceData, isLoading: attendanceLoading, error: attendanceError } = useGetSimpleStudentAttendance(
        schoolId, studentId, startDate, endDate
    );
    const { data: configData } = useGetActiveConfig(schoolId);
    const { data: timetableData, isLoading: timetableLoading } = useGetClassTimetable(schoolId, userClass, userSection);
    const { data: announcementData, isLoading: announcementsLoading } = useGetAnnouncements(schoolId);
    const { data: homeworkData, isLoading: homeworkLoading } = useGetHomeworkByStudent(schoolId, studentId, { status: 'active' });
    const { data: subjectsData } = useGetSubjects(schoolId);
    const { data: teachersData } = useGetTeachers(schoolId);

    // Helpers to resolve subject name and teacher name
    const getSubjectName = (item: any): string => {
        if (!item) return 'Subject';
        if (typeof item === 'string') {
            const found = subjectsData?.data?.find((s: any) => s.subjectId === item || s._id === item);
            return found?.name || item;
        }
        if (item.subjectName) return item.subjectName;
        if (item.subject?.name) return item.subject.name;
        const sId = item.subjectId || item.subject;
        const found = subjectsData?.data?.find((s: any) => s.subjectId === sId || s._id === sId);
        return found?.name || sId || 'Subject';
    };

    const getTeacherName = (period: any): string => {
        if (!period) return '';
        if (period.teacherName) return period.teacherName;
        if (period.teacher?.name) return period.teacher.name;
        if (period.teacher?.firstName) return `${period.teacher.firstName} ${period.teacher.lastName || ''}`.trim();
        const tId = period.teacherId || period.teacher;
        if (!tId) return '';
        const found = teachersData?.data?.find((t: any) => t.teacherId === tId || t._id === tId);
        if (found) return `${found.firstName} ${found.lastName}`.trim();
        return '';
    };

    // ── Attendance Summary ──
    const summary = attendanceData?.data?.summary;
    const totalDays = summary?.total || 0;
    const presentDays = (summary?.present || 0) + (summary?.late || 0);
    const percentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(0) : '0';
    const pctNumber = parseFloat(percentage);
    const percentageColor = pctNumber >= 90 ? '#10b981' : pctNumber >= 75 ? '#f59e0b' : '#ef4444';

    const donutData = useMemo(() => [
        ['Status', 'Days'],
        ['Present', summary?.present || 0],
        ['Absent', summary?.absent || 0],
        ['Late', summary?.late || 0],
        ['Leave', summary?.leave || 0],
    ], [summary]);

    // ── Today's Timetable ──
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayDayName = daysOfWeek[new Date().getDay()];
    const todayFormattedDate = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });

    const config = configData?.data;
    const allEntries = timetableData?.data?.entries || [];

    const todayPeriods = useMemo(() => {
        const filtered = allEntries.filter((e: any) => e.dayOfWeek?.toLowerCase() === todayDayName);
        filtered.sort((a: any, b: any) => a.periodNumber - b.periodNumber);

        if (!config?.periods) return filtered;
        return filtered.map((e: any) => {
            const periodInfo = config.periods.find((p: any) => p.periodNumber === e.periodNumber);
            return {
                ...e,
                startTime: periodInfo?.startTime || '',
                endTime: periodInfo?.endTime || '',
                periodName: periodInfo?.name || `Period ${e.periodNumber}`,
            };
        });
    }, [allEntries, todayDayName, config]);

    // ── Recent Announcements ──
    const recentAnnouncements = useMemo(() => {
        return (announcementData?.data || []).slice(0, 3);
    }, [announcementData]);

    // ── Pending Homework ──
    const recentHomework = useMemo(() => {
        return (homeworkData?.data || []).slice(0, 3);
    }, [homeworkData]);

    const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();

    return (
        <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 1300, mx: 'auto' }}>
            {/* Welcome Header */}
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
                    Welcome back, {userName}!
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    Here is your daily schedule, homework, and announcements for today.
                </Typography>
            </Box>

            {attendanceError && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2.5 }}>
                    Failed to load dashboard data. Please try again later.
                </Alert>
            )}

            {/* Attendance Summary Card */}
            <Paper
                elevation={0}
                onClick={() => navigate('/student/attendance')}
                sx={{
                    p: { xs: 2, sm: 2.5 },
                    mb: { xs: 2, sm: 3 },
                    borderRadius: 2,
                    border: '1px solid #e2e8f0',
                    bgcolor: '#ffffff',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
                    cursor: 'pointer',
                    transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                    '&:hover': {
                        transform: 'translateY(-1.5px)',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)',
                    }
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.75, flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Box sx={{ p: 0.75, borderRadius: 2, bgcolor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <AttendanceIcon sx={{ color: '#2563eb', fontSize: 20 }} />
                        </Box>
                        <Box>
                            <Typography variant="subtitle1" fontWeight={700} color="#1e293b" sx={{ fontSize: { xs: '0.95rem', sm: '1.05rem' }, lineHeight: 1.2 }}>
                                My Attendance Summary
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                Last 30 Days records & statistics
                            </Typography>
                        </Box>
                    </Box>
                    <Button
                        variant="outlined"
                        size="small"
                        endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                        onClick={() => navigate('/student/attendance')}
                        sx={{
                            borderColor: '#cbd5e1',
                            color: '#334155',
                            borderRadius: 2,
                            fontWeight: 600,
                            px: 1.5,
                            py: 0.35,
                            fontSize: '0.75rem',
                            textTransform: 'none',
                            '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' }
                        }}
                    >
                        Details
                    </Button>
                </Box>

                {attendanceLoading ? (
                    <Skeleton variant="rectangular" height={130} sx={{ borderRadius: 2.5 }} />
                ) : (
                    <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                                <Chart
                                    chartType="PieChart"
                                    data={donutData}
                                    options={{
                                        pieHole: 0.65,
                                        colors: ['#10b981', '#ef4444', '#f59e0b', '#8b5cf6'],
                                        legend: 'none',
                                        chartArea: { width: '92%', height: '92%' },
                                        backgroundColor: 'transparent',
                                        pieSliceBorderColor: 'transparent',
                                    }}
                                    width="135px"
                                    height="135px"
                                />
                                <Box sx={{
                                    position: 'absolute', display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center', textAlign: 'center', pointerEvents: 'none'
                                }}>
                                    <Typography variant="h5" fontWeight={800} sx={{ color: percentageColor, lineHeight: 1, fontSize: '1.35rem' }}>
                                        {percentage}%
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mt: 0.25, fontSize: '0.68rem' }}>
                                        Rate
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 8 }}>
                            <Grid container spacing={1}>
                                <Grid size={{ xs: 6, sm: 3 }}>
                                    <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: '#ecfdf5', border: '1px solid #a7f3d0', textAlign: 'center' }}>
                                        <PresentIcon sx={{ color: '#10b981', fontSize: 18, mb: 0.25 }} />
                                        <Typography variant="h6" fontWeight={800} color="#10b981" sx={{ fontSize: '1.1rem' }}>{summary?.present || 0}</Typography>
                                        <Typography variant="caption" fontWeight={600} color="#065f46" sx={{ fontSize: '0.7rem' }}>Present</Typography>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 6, sm: 3 }}>
                                    <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: '#fef2f2', border: '1px solid #fecaca', textAlign: 'center' }}>
                                        <AbsentIcon sx={{ color: '#ef4444', fontSize: 18, mb: 0.25 }} />
                                        <Typography variant="h6" fontWeight={800} color="#ef4444" sx={{ fontSize: '1.1rem' }}>{summary?.absent || 0}</Typography>
                                        <Typography variant="caption" fontWeight={600} color="#991b1b" sx={{ fontSize: '0.7rem' }}>Absent</Typography>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 6, sm: 3 }}>
                                    <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: '#fffbeb', border: '1px solid #fde68a', textAlign: 'center' }}>
                                        <LateIcon sx={{ color: '#f59e0b', fontSize: 18, mb: 0.25 }} />
                                        <Typography variant="h6" fontWeight={800} color="#f59e0b" sx={{ fontSize: '1.1rem' }}>{summary?.late || 0}</Typography>
                                        <Typography variant="caption" fontWeight={600} color="#92400e" sx={{ fontSize: '0.7rem' }}>Late</Typography>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 6, sm: 3 }}>
                                    <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: '#f5f3ff', border: '1px solid #ddd6fe', textAlign: 'center' }}>
                                        <LeaveIcon sx={{ color: '#8b5cf6', fontSize: 18, mb: 0.25 }} />
                                        <Typography variant="h6" fontWeight={800} color="#8b5cf6" sx={{ fontSize: '1.1rem' }}>{summary?.leave || 0}</Typography>
                                        <Typography variant="caption" fontWeight={600} color="#5b21b6" sx={{ fontSize: '0.7rem' }}>Leave</Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                )}
            </Paper>

            {/* ── Upcoming Events & Exams Gadget ── */}
            <UpcomingEventsWidget calendarPath="/student/calendar" />

            {/* ── 3 Main Dashboard Cards: Timetable, Homework, Announcements ── */}
            <Grid container spacing={{ xs: 2, sm: 2.5 }} sx={{ mb: { xs: 2, sm: 3 } }}>

                {/* 1. Today's Classes & Timetable */}
                <Grid size={{ xs: 12, lg: 4 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 2, sm: 2.5 },
                            height: '100%',
                            borderRadius: 2,
                            border: '1px solid #e2e8f0',
                            bgcolor: '#ffffff',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                            <Stack direction="row" spacing={1.25} alignItems="center">
                                <Avatar sx={{ bgcolor: '#eff6ff', color: '#2563eb', width: 36, height: 36 }}>
                                    <TimetableIcon sx={{ fontSize: 18 }} />
                                </Avatar>
                                <Box>
                                    <Typography variant="subtitle2" fontWeight={700} color="#1e293b" sx={{ fontSize: '0.9rem' }}>
                                        Today's Classes
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                                        {todayFormattedDate}
                                    </Typography>
                                </Box>
                            </Stack>
                            <Chip label={`${todayPeriods.length} periods`} size="small" color="primary" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />
                        </Box>

                        <Divider sx={{ mb: 1.5 }} />

                        {timetableLoading ? (
                            <Stack spacing={1}>
                                {[1, 2, 3].map(i => <Skeleton key={i} variant="rectangular" height={44} sx={{ borderRadius: 2 }} />)}
                            </Stack>
                        ) : todayPeriods.length === 0 ? (
                            <Box sx={{ py: 3, textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                <CalendarIcon sx={{ fontSize: 32, color: '#cbd5e1', mb: 0.5 }} />
                                <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ fontSize: '0.8rem' }}>
                                    No classes scheduled for today ({todayDayName}).
                                </Typography>
                            </Box>
                        ) : (
                            <Stack spacing={1} sx={{ flex: 1 }}>
                                {todayPeriods.map((period: any) => (
                                    <Box
                                        key={period._id || `${period.periodNumber}-${period.subjectName}`}
                                        sx={{
                                            p: 1.25,
                                            borderRadius: 2,
                                            bgcolor: '#f8fafc',
                                            border: '1px solid #f1f5f9',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: 1,
                                            transition: 'background-color 0.18s',
                                            '&:hover': { bgcolor: '#f1f5f9' }
                                        }}
                                    >
                                        <Box sx={{ minWidth: 60 }}>
                                            <Typography variant="caption" fontWeight={700} color="primary.main" sx={{ display: 'block', fontSize: '0.75rem' }}>
                                                P{period.periodNumber}
                                            </Typography>
                                            {period.startTime && (
                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                                                    {period.startTime}
                                                </Typography>
                                            )}
                                        </Box>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography variant="body2" fontWeight={700} noWrap color="#1e293b" sx={{ fontSize: '0.825rem' }}>
                                                {getSubjectName(period)}
                                            </Typography>
                                            {getTeacherName(period) && (
                                                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', fontSize: '0.7rem' }}>
                                                    {getTeacherName(period)}
                                                </Typography>
                                            )}
                                        </Box>
                                        {period.roomName && (
                                            <Chip label={period.roomName} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                                        )}
                                    </Box>
                                ))}
                            </Stack>
                        )}

                        <Button
                            fullWidth
                            variant="outlined"
                            size="small"
                            onClick={() => navigate('/student/timetable')}
                            sx={{ mt: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.775rem', py: 0.5 }}
                        >
                            View Full Weekly Timetable
                        </Button>
                    </Paper>
                </Grid>

                {/* 2. Pending Homework */}
                <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 2, sm: 2.5 },
                            height: '100%',
                            borderRadius: 2,
                            border: '1px solid #e2e8f0',
                            bgcolor: '#ffffff',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                            <Stack direction="row" spacing={1.25} alignItems="center">
                                <Avatar sx={{ bgcolor: '#fff7ed', color: '#ea580c', width: 36, height: 36 }}>
                                    <HomeworkIcon sx={{ fontSize: 18 }} />
                                </Avatar>
                                <Box>
                                    <Typography variant="subtitle2" fontWeight={700} color="#1e293b" sx={{ fontSize: '0.9rem' }}>
                                        Pending Homework
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                                        Active assignments
                                    </Typography>
                                </Box>
                            </Stack>
                            <Chip label={`${recentHomework.length} active`} size="small" color="warning" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />
                        </Box>

                        <Divider sx={{ mb: 1.5 }} />

                        {homeworkLoading ? (
                            <Stack spacing={1}>
                                {[1, 2, 3].map(i => <Skeleton key={i} variant="rectangular" height={44} sx={{ borderRadius: 2 }} />)}
                            </Stack>
                        ) : recentHomework.length === 0 ? (
                            <Box sx={{ py: 3, textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                <AssignmentIcon sx={{ fontSize: 32, color: '#cbd5e1', mb: 0.5 }} />
                                <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ fontSize: '0.8rem' }}>
                                    No pending homework! All caught up. 🎉
                                </Typography>
                            </Box>
                        ) : (
                            <Stack spacing={1} sx={{ flex: 1 }}>
                                {recentHomework.map((hw: any) => {
                                    const overdue = isOverdue(hw.dueDate);
                                    return (
                                        <Box
                                            key={hw._id || hw.homeworkId}
                                            onClick={() => navigate('/student/homework')}
                                            sx={{
                                                p: 1.25,
                                                borderRadius: 2,
                                                bgcolor: overdue ? '#fef2f2' : '#f8fafc',
                                                border: '1px solid',
                                                borderColor: overdue ? '#fecaca' : '#f1f5f9',
                                                cursor: 'pointer',
                                                transition: 'background-color 0.18s',
                                                '&:hover': { bgcolor: overdue ? '#fee2e2' : '#f1f5f9' }
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.25 }}>
                                                <Chip
                                                    label={getSubjectName(hw)}
                                                    size="small"
                                                    color={overdue ? 'error' : 'warning'}
                                                    sx={{ height: 18, fontSize: '0.625rem', fontWeight: 700 }}
                                                />
                                                {overdue && (
                                                    <Chip
                                                        label="Overdue"
                                                        size="small"
                                                        color="error"
                                                        icon={<OverdueIcon sx={{ fontSize: '12px !important' }} />}
                                                        sx={{ height: 18, fontSize: '0.625rem' }}
                                                    />
                                                )}
                                            </Box>
                                            <Typography variant="body2" fontWeight={700} noWrap color="#1e293b" sx={{ fontSize: '0.825rem' }}>
                                                {hw.title}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, fontSize: '0.7rem' }}>
                                                Due: {new Date(hw.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </Typography>
                                        </Box>
                                    );
                                })}
                            </Stack>
                        )}

                        <Button
                            fullWidth
                            variant="outlined"
                            size="small"
                            color="warning"
                            onClick={() => navigate('/student/homework')}
                            sx={{ mt: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.775rem', py: 0.5 }}
                        >
                            View All Homework
                        </Button>
                    </Paper>
                </Grid>

                {/* 3. Recent Announcements */}
                <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 2, sm: 2.5 },
                            height: '100%',
                            borderRadius: 2,
                            border: '1px solid #e2e8f0',
                            bgcolor: '#ffffff',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                            <Stack direction="row" spacing={1.25} alignItems="center">
                                <Avatar sx={{ bgcolor: '#f3e8ff', color: '#9333ea', width: 36, height: 36 }}>
                                    <AnnouncementIcon sx={{ fontSize: 18 }} />
                                </Avatar>
                                <Box>
                                    <Typography variant="subtitle2" fontWeight={700} color="#1e293b" sx={{ fontSize: '0.9rem' }}>
                                        Announcements
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                                        School circulars
                                    </Typography>
                                </Box>
                            </Stack>
                            <Chip label={`${recentAnnouncements.length} new`} size="small" color="secondary" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />
                        </Box>

                        <Divider sx={{ mb: 1.5 }} />

                        {announcementsLoading ? (
                            <Stack spacing={1}>
                                {[1, 2, 3].map(i => <Skeleton key={i} variant="rectangular" height={44} sx={{ borderRadius: 2 }} />)}
                            </Stack>
                        ) : recentAnnouncements.length === 0 ? (
                            <Box sx={{ py: 3, textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                <AnnouncementIcon sx={{ fontSize: 32, color: '#cbd5e1', mb: 0.5 }} />
                                <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ fontSize: '0.8rem' }}>
                                    No announcements at the moment.
                                </Typography>
                            </Box>
                        ) : (
                            <Stack spacing={1} sx={{ flex: 1 }}>
                                {recentAnnouncements.map((ann: any) => (
                                    <Box
                                        key={ann._id || ann.announcementId}
                                        onClick={() => navigate('/student/announcements')}
                                        sx={{
                                            p: 1.25,
                                            borderRadius: 2,
                                            bgcolor: '#f8fafc',
                                            border: '1px solid #f1f5f9',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.18s',
                                            '&:hover': { bgcolor: '#f1f5f9' }
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.25 }}>
                                            <Chip
                                                label={ann.category || 'General'}
                                                size="small"
                                                color="secondary"
                                                variant="outlined"
                                                sx={{ height: 18, fontSize: '0.625rem', textTransform: 'capitalize', fontWeight: 700 }}
                                            />
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                                                {new Date(ann.createdAt || ann.publishDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </Typography>
                                        </Box>
                                        <Typography variant="body2" fontWeight={700} noWrap color="#1e293b" sx={{ fontSize: '0.825rem' }}>
                                            {ann.title}
                                        </Typography>
                                        {ann.content && (
                                            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', mt: 0.25, fontSize: '0.7rem' }}>
                                                {ann.content}
                                            </Typography>
                                        )}
                                    </Box>
                                ))}
                            </Stack>
                        )}

                        <Button
                            fullWidth
                            variant="outlined"
                            size="small"
                            color="secondary"
                            onClick={() => navigate('/student/announcements')}
                            sx={{ mt: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.775rem', py: 0.5 }}
                        >
                            View All Announcements
                        </Button>
                    </Paper>
                </Grid>

            </Grid>

            {/* Academic Navigation Grid */}
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5, fontSize: { xs: '0.95rem', sm: '1.05rem' } }}>Quick Access & Modules</Typography>
            <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                {attendanceLoading ? (
                    [1, 2, 3, 4, 5, 6].map((i) => (
                        <Grid size={{ xs: 6, sm: 6, md: 4 }} key={i}>
                            <Skeleton variant="rectangular" height={90} sx={{ borderRadius: 2.5 }} />
                        </Grid>
                    ))
                ) : (
                    [
                        { title: 'Attendance', value: `${percentage}%`, subtitle: 'Report & charts', icon: <AttendanceIcon />, color: '#10b981', onClick: () => navigate('/student/attendance') },
                        { title: 'My Timetable', value: 'Schedule', subtitle: 'Daily class schedule', icon: <TimetableIcon />, color: '#3b82f6', onClick: () => navigate('/student/timetable') },
                        { title: 'My Exams', value: 'Exams', subtitle: 'Schedules & hall tickets', icon: <ResultsIcon />, color: '#8b5cf6', onClick: () => navigate('/student/exam/my-exams') },
                        { title: 'Leave Application', value: 'Leave', subtitle: 'Apply & view status', icon: <LeaveIcon />, color: '#f59e0b', onClick: () => navigate('/student/leave/apply') },
                        { title: 'Support Ticket', value: 'Support', subtitle: 'Submit query', icon: <SupportIcon />, color: '#6366f1', onClick: () => setSupportDialogOpen(true) },
                        { title: 'My Profile', value: 'Profile', subtitle: 'Personal details & ID', icon: <ClassIcon />, color: '#06b6d4', onClick: () => navigate('/student/profile') },
                    ].map((item) => (
                        <Grid size={{ xs: 6, sm: 6, md: 4 }} key={item.title}>
                            <Paper
                                elevation={0}
                                onClick={item.onClick}
                                sx={{
                                    p: { xs: 1.5, sm: 2 },
                                    height: '100%',
                                    borderRadius: 2.5,
                                    bgcolor: '#ffffff',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                                    transition: 'all 0.18s ease-in-out',
                                    cursor: 'pointer',
                                    '&:hover': { transform: 'translateY(-2px)', borderColor: '#cbd5e1', boxShadow: '0 4px 14px rgba(0,0,0,0.06)' }
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                    <Avatar sx={{ bgcolor: `${item.color}15`, color: item.color, width: { xs: 36, sm: 40 }, height: { xs: 36, sm: 40 }, borderRadius: 2 }}>
                                        {React.cloneElement(item.icon as any, { sx: { fontSize: { xs: 18, sm: 22 } } })}
                                    </Avatar>
                                    <ArrowForwardIcon sx={{ color: '#cbd5e1', fontSize: 16 }} />
                                </Box>
                                <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: { xs: '0.825rem', sm: '0.9rem' }, mb: 0.25 }} noWrap>{item.title}</Typography>
                                <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ fontSize: '0.7rem' }} noWrap>{item.subtitle}</Typography>
                            </Paper>
                        </Grid>
                    ))
                )}
            </Grid>

            <RequestChangeDialog
                open={supportDialogOpen}
                onClose={() => setSupportDialogOpen(false)}
                schoolId={schoolId}
                userId={studentId || user?.userId || ''}
                userName={userName}
                userType="student"
                fieldType="general"
            />
        </Box>
    );
};

export default StudentDashboard;
