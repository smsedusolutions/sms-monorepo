import React, { useMemo, useState } from 'react';
import {
    Box, Typography, Grid, Avatar, Chip, Skeleton, Alert, Stack, Paper, Button, Divider
} from '@mui/material';
import {
    Person as PersonIcon,
    School as SchoolIcon,
    Assignment as AssignmentIcon,
    Announcement as AnnouncementIcon,
    AccessTime as AccessTimeIcon,
    ArrowForward as ArrowForwardIcon,
    CheckCircle as PresentIcon,
    Cancel as AbsentIcon,
    Schedule as LateIcon,
    EventNote as LeaveIcon,
    ReceiptLong as FeeIcon,
    People as TeachersIcon,
    Schedule as TimetableIcon,
    Chat as ChatIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Chart } from 'react-google-charts';
import TokenService from '../../queries/token/tokenService';
import { useGetParentDashboard, useGetChildAttendance } from '../../queries/ParentPortal';
import { useGetAnnouncements } from '../../queries/Announcement';
import { useGetUpcomingHomework } from '../../queries/Homework';
import { useGetParentLeaves } from '../../queries/Leave';
import { useChildSelector } from '../../context/ChildSelectorContext';
import type { ChildStats, Announcement, Homework, Student } from '../../types';
import { AppCard } from '../../components/shared/AppCard';
import { AppButton } from '../../components/shared/AppButton';
import { AppSection } from '../../components/shared/AppSection';
import RequestChangeDialog from '../../components/Dialogs/RequestChangeDialog';

const ParentDashboard = () => {
    const navigate = useNavigate();
    const [supportDialogOpen, setSupportDialogOpen] = useState(false);
    const user = TokenService.getUser();
    const schoolId = TokenService.getSchoolId() || '';
    const { selectedChild, setSelectedChild, children: contextChildren } = useChildSelector();

    const { data: dashboardData, isLoading: loadingDashboard, error } = useGetParentDashboard(schoolId);
    const { data: announcementsData, isLoading: loadingAnnouncements } = useGetAnnouncements(schoolId, { limit: 3 });
    const { data: homeworkData, isLoading: loadingHomework } = useGetUpcomingHomework(
        schoolId,
        selectedChild?.studentId || '',
        5
    );

    // Get attendance for selected child
    const { data: attendanceData, isLoading: loadingAttendance } = useGetChildAttendance(
        schoolId,
        selectedChild?.studentId || ''
    );

    // Get parent's children leave status
    const { data: parentLeavesData } = useGetParentLeaves(schoolId);

    const dashboard = dashboardData?.data;
    const announcements = announcementsData?.data || [];
    const upcomingHomework = homeworkData?.data || [];
    const childLeaves = parentLeavesData?.data?.leaves || [];

    const childAttendance = attendanceData?.data;
    const summary = childAttendance?.summary;
    const attendancePercentage = summary?.percentage !== undefined ? parseFloat(String(summary.percentage)) : ((selectedChild as any)?.attendancePercentage || 0);

    const getAttendanceColor = (percentage: number) => {
        if (percentage >= 90) return '#10b981';
        if (percentage >= 75) return '#f59e0b';
        return '#ef4444';
    };

    const percentageColor = getAttendanceColor(attendancePercentage);

    // Google Donut Chart Data
    const donutData = useMemo(() => {
        return [
            ['Status', 'Days'],
            ['Present', summary?.present || 0],
            ['Absent', summary?.absent || 0],
            ['Late', summary?.late || 0],
            ['Leave', summary?.leave || 0],
        ];
    }, [summary]);

    const handleChildSelect = (child: ChildStats) => {
        const foundContextChild = contextChildren.find(c => c.studentId === child.studentId);
        if (foundContextChild) {
            setSelectedChild(foundContextChild);
        } else {
            setSelectedChild(child as unknown as Student);
        }
    };

    const childrenCount = dashboard?.children?.length || 0;
    const childGridSize = childrenCount === 1 ? { xs: 12 } : { xs: 12, sm: 6 };

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Failed to load dashboard data. Please try again later.</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1400, mx: 'auto' }}>
            {/* Welcome Header */}
            <Box sx={{ mb: { xs: 3, md: 5 }, mt: 1 }}>
                {loadingDashboard ? (
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
                                background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                fontSize: { xs: '2rem', md: '2.75rem' }
                            }}
                        >
                            Welcome, {dashboard?.parentName || `${user?.firstName} ${user?.lastName}`}!
                        </Typography>
                        <Typography variant="h6" color="text.secondary" fontWeight={400} sx={{ opacity: 0.85 }}>
                            Here is today's overview for your {childrenCount === 1 ? 'child' : 'children'}.
                        </Typography>
                    </>
                )}
            </Box>

            <Grid container spacing={3.5}>
                {/* Main Content Area (8 Cols) */}
                <Grid size={{ xs: 12, lg: 8 }}>
                    {/* My Children Overview */}
                    <AppSection
                        title="My Children"
                        action={
                            <AppButton size="small" variant="text" onClick={() => navigate('/parent/children')}>
                                View All ({childrenCount})
                            </AppButton>
                        }
                    >
                        <Grid container spacing={2.5}>
                            {loadingDashboard ? (
                                [1, 2].map((i) => (
                                    <Grid size={childGridSize} key={i}>
                                        <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 4 }} />
                                    </Grid>
                                ))
                            ) : (
                                dashboard?.children?.map((child: ChildStats) => {
                                    const isSelected = selectedChild?.studentId === child.studentId;
                                    return (
                                        <Grid size={childGridSize} key={child.studentId}>
                                            <AppCard
                                                onClick={() => handleChildSelect(child)}
                                                sx={{
                                                    p: 2.5,
                                                    borderRadius: 4,
                                                    bgcolor: isSelected ? '#f0f9ff' : 'rgba(255, 255, 255, 0.9)',
                                                    border: '2px solid',
                                                    borderColor: isSelected ? '#3b82f6' : 'rgba(226, 232, 240, 0.8)',
                                                    boxShadow: isSelected ? '0 8px 24px rgba(59, 130, 246, 0.15)' : '0 8px 24px 0 rgba(31, 38, 135, 0.06)',
                                                    transition: 'all 0.2s ease',
                                                    cursor: 'pointer',
                                                    '&:hover': { transform: 'translateY(-2px)' }
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                                    <Avatar
                                                        src={child.profileImage}
                                                        alt={child.name}
                                                        sx={{
                                                            width: 64,
                                                            height: 64,
                                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                            border: isSelected ? '3px solid #3b82f6' : '2px solid #fff'
                                                        }}
                                                    >
                                                        {child.firstName?.[0]}
                                                    </Avatar>
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.2 }}>
                                                            <Typography variant="h6" fontWeight={700} noWrap>
                                                                {child.name}
                                                            </Typography>
                                                            {isSelected && (
                                                                <Chip size="small" label="Active" color="primary" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
                                                            )}
                                                        </Box>
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 500 }}>
                                                            Grade {child.className}-{child.sectionName} • Roll: {child.rollNumber}
                                                        </Typography>

                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                                                            <Chip
                                                                size="small"
                                                                label={`${child.attendancePercentage}% Attendance`}
                                                                sx={{
                                                                    borderRadius: 1.5,
                                                                    fontWeight: 700,
                                                                    bgcolor: `${getAttendanceColor(child.attendancePercentage)}18`,
                                                                    color: getAttendanceColor(child.attendancePercentage),
                                                                    border: `1px solid ${getAttendanceColor(child.attendancePercentage)}40`
                                                                }}
                                                            />
                                                            {child.pendingLeaves > 0 && (
                                                                <Chip
                                                                    size="small"
                                                                    label={`${child.pendingLeaves} Leave Pending`}
                                                                    sx={{ borderRadius: 1.5, fontWeight: 700, bgcolor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}
                                                                />
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            </AppCard>
                                        </Grid>
                                    );
                                })
                            )}
                        </Grid>
                    </AppSection>

                    {/* Attendance Short Report Card Widget */}
                    <Box sx={{ my: 3 }}>
                        <Paper
                            elevation={0}
                            onClick={() => navigate('/parent/attendance')}
                            sx={{
                                p: 3,
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
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#eff6ff' }}>
                                        <AccessTimeIcon sx={{ color: '#2563eb', fontSize: 24 }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="h6" fontWeight={700} color="#1e293b">
                                            {selectedChild ? `${selectedChild.firstName}'s Attendance Summary` : 'Attendance Summary'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Current month overview & statistics
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Multiple Children Switcher Chips */}
                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                    {childrenCount > 1 && (
                                        <Box sx={{ display: 'flex', gap: 0.75, mr: 1 }} onClick={(e) => e.stopPropagation()}>
                                            {dashboard?.children?.map((c: ChildStats) => {
                                                const active = selectedChild?.studentId === c.studentId;
                                                return (
                                                    <Chip
                                                        key={c.studentId}
                                                        label={c.firstName}
                                                        size="small"
                                                        onClick={() => handleChildSelect(c)}
                                                        sx={{
                                                            fontWeight: 700,
                                                            cursor: 'pointer',
                                                            bgcolor: active ? '#2563eb' : '#f1f5f9',
                                                            color: active ? '#fff' : '#64748b',
                                                            '&:hover': { opacity: 0.9 }
                                                        }}
                                                    />
                                                );
                                            })}
                                        </Box>
                                    )}
                                    <Button
                                        variant="contained"
                                        size="small"
                                        endIcon={<ArrowForwardIcon />}
                                        onClick={(e) => { e.stopPropagation(); navigate('/parent/attendance'); }}
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
                                        View Full Report
                                    </Button>
                                </Stack>
                            </Box>

                            <Divider sx={{ mb: 2.5 }} />

                            {loadingAttendance ? (
                                <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 3 }} />
                            ) : (
                                <Grid container spacing={2.5} alignItems="center">
                                    {/* Donut Chart Visual */}
                                    <Grid size={{ xs: 12, sm: 5 }}>
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
                                                width="170px"
                                                height="170px"
                                            />
                                            <Box sx={{
                                                position: 'absolute', display: 'flex', flexDirection: 'column',
                                                alignItems: 'center', justifyContent: 'center', textAlign: 'center', pointerEvents: 'none'
                                            }}>
                                                <Typography variant="h4" fontWeight={800} sx={{ color: percentageColor, lineHeight: 1 }}>
                                                    {attendancePercentage}%
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mt: 0.5 }}>
                                                    Attendance
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>

                                    {/* Stat Counters & Badges */}
                                    <Grid size={{ xs: 12, sm: 7 }}>
                                        <Grid container spacing={1.5}>
                                            <Grid size={{ xs: 6 }}>
                                                <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                        <PresentIcon sx={{ color: '#10b981', fontSize: 18 }} />
                                                        <Typography variant="caption" fontWeight={700} color="#065f46">Present</Typography>
                                                    </Box>
                                                    <Typography variant="h5" fontWeight={800} color="#10b981">
                                                        {summary?.present || 0} <Typography component="span" variant="caption" color="text.secondary">days</Typography>
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            <Grid size={{ xs: 6 }}>
                                                <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: '#fef2f2', border: '1px solid #fecaca' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                        <AbsentIcon sx={{ color: '#ef4444', fontSize: 18 }} />
                                                        <Typography variant="caption" fontWeight={700} color="#991b1b">Absent</Typography>
                                                    </Box>
                                                    <Typography variant="h5" fontWeight={800} color="#ef4444">
                                                        {summary?.absent || 0} <Typography component="span" variant="caption" color="text.secondary">days</Typography>
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            <Grid size={{ xs: 6 }}>
                                                <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: '#fffbeb', border: '1px solid #fde68a' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                        <LateIcon sx={{ color: '#f59e0b', fontSize: 18 }} />
                                                        <Typography variant="caption" fontWeight={700} color="#92400e">Late</Typography>
                                                    </Box>
                                                    <Typography variant="h5" fontWeight={800} color="#f59e0b">
                                                        {summary?.late || 0} <Typography component="span" variant="caption" color="text.secondary">days</Typography>
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            <Grid size={{ xs: 6 }}>
                                                <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: '#f5f3ff', border: '1px solid #ddd6fe' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                        <LeaveIcon sx={{ color: '#8b5cf6', fontSize: 18 }} />
                                                        <Typography variant="caption" fontWeight={700} color="#5b21b6">Leave</Typography>
                                                    </Box>
                                                    <Typography variant="h5" fontWeight={800} color="#8b5cf6">
                                                        {summary?.leave || 0} <Typography component="span" variant="caption" color="text.secondary">days</Typography>
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            )}
                        </Paper>
                    </Box>

                    {/* Schedule and Notices */}
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <AppSection title="Upcoming Homework">
                                {loadingHomework ? (
                                    <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 3 }} />
                                ) : upcomingHomework.length === 0 ? (
                                    <Box sx={{ py: 4, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid #e2e8f0' }}>
                                        <AssignmentIcon sx={{ fontSize: 40, color: 'text.disabled', opacity: 0.5, mb: 1 }} />
                                        <Typography color="text.secondary" fontWeight={500}>No pending homework today</Typography>
                                    </Box>
                                ) : (
                                    <Stack spacing={1.5}>
                                        {upcomingHomework.slice(0, 3).map((hw: Homework) => (
                                            <Box key={hw.homeworkId} sx={{ p: 2, borderRadius: 2.5, bgcolor: '#ffffff', border: '1px solid #e2e8f0', '&:hover': { bgcolor: '#f8fafc' } }}>
                                                <Typography variant="subtitle2" fontWeight={700}>{hw.title}</Typography>
                                                <Typography variant="caption" color="text.secondary">{hw.subjectName} • Due {new Date(hw.dueDate).toLocaleDateString()}</Typography>
                                            </Box>
                                        ))}
                                    </Stack>
                                )}
                            </AppSection>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <AppSection title="Announcements">
                                {loadingAnnouncements ? (
                                    <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 3 }} />
                                ) : announcements.length === 0 ? (
                                    <Box sx={{ py: 4, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid #e2e8f0' }}>
                                        <AnnouncementIcon sx={{ fontSize: 40, color: 'text.disabled', opacity: 0.5, mb: 1 }} />
                                        <Typography color="text.secondary" fontWeight={500}>No new announcements</Typography>
                                    </Box>
                                ) : (
                                    <Stack spacing={1.5}>
                                        {announcements.slice(0, 3).map((ann: Announcement) => (
                                            <Box key={ann.announcementId} sx={{
                                                p: 2,
                                                borderRadius: 2.5,
                                                bgcolor: ann.priority === 'urgent' ? '#fef2f2' : '#ffffff',
                                                border: '1px solid',
                                                borderColor: ann.priority === 'urgent' ? '#fecaca' : '#e2e8f0',
                                                borderLeft: 4,
                                                borderLeftColor: ann.priority === 'urgent' ? '#ef4444' : '#3b82f6'
                                            }}>
                                                <Typography variant="subtitle2" fontWeight={700}>{ann.title}</Typography>
                                                <Typography variant="caption" display="block" color="text.secondary">{ann.category} • {new Date(ann.publishDate).toLocaleDateString()}</Typography>
                                            </Box>
                                        ))}
                                    </Stack>
                                )}
                            </AppSection>
                        </Grid>
                    </Grid>

                    {/* Recent Leave Applications Card */}
                    {childLeaves.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="subtitle1" fontWeight={700} color="#1e293b">Recent Leave Applications</Typography>
                                    <Button size="small" onClick={() => navigate('/parent/leave/apply')} sx={{ textTransform: 'none', fontWeight: 600 }}>
                                        Apply New Leave →
                                    </Button>
                                </Box>
                                <Stack spacing={1.5}>
                                    {childLeaves.slice(0, 2).map((leave: any) => (
                                        <Box key={leave.leaveId} sx={{ p: 2, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight={700}>{leave.reason || leave.leaveType || 'Leave Request'}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {new Date(leave.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} – {new Date(leave.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                                </Typography>
                                            </Box>
                                            <Chip
                                                size="small"
                                                label={leave.status?.toUpperCase() || 'PENDING'}
                                                sx={{
                                                    fontWeight: 700,
                                                    bgcolor: leave.status === 'approved' ? '#ecfdf5' : leave.status === 'rejected' ? '#fef2f2' : '#fffbeb',
                                                    color: leave.status === 'approved' ? '#10b981' : leave.status === 'rejected' ? '#ef4444' : '#f59e0b',
                                                    border: '1px solid',
                                                    borderColor: leave.status === 'approved' ? '#a7f3d0' : leave.status === 'rejected' ? '#fecaca' : '#fde68a',
                                                }}
                                            />
                                        </Box>
                                    ))}
                                </Stack>
                            </Paper>
                        </Box>
                    )}
                </Grid>

                {/* Quick Actions Sidebar (4 Cols) */}
                <Grid size={{ xs: 12, lg: 4 }}>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Quick Actions</Typography>
                    <Grid container spacing={2}>
                        {[
                            { label: 'Apply Leave', icon: <LeaveIcon />, path: '/parent/leave/apply', color: '#f59e0b' },
                            { label: 'Exam Results', icon: <SchoolIcon />, path: '/parent/exam/results', color: '#10b981' },
                            { label: 'Class Timetable', icon: <TimetableIcon />, path: '/parent/timetable', color: '#3b82f6' },
                            { label: 'Teachers', icon: <TeachersIcon />, path: '/parent/teachers', color: '#8b5cf6' },
                            { label: 'Homework', icon: <AssignmentIcon />, path: '/parent/homework', color: '#ec4899' },
                            { label: 'Announcements', icon: <AnnouncementIcon />, path: '/parent/announcements', color: '#06b6d4' },
                            { label: 'Chat Teachers', icon: <ChatIcon />, path: '/parent/chat', color: '#4f46e5' },
                        ].map((action) => (
                            <Grid size={{ xs: 6 }} key={action.label}>
                                <AppCard
                                    sx={{
                                        py: 2.5,
                                        px: 1.5,
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        height: '100%',
                                        borderRadius: 3.5,
                                        bgcolor: 'rgba(255,255,255,0.9)',
                                        border: '1px solid rgba(226,232,240,0.8)',
                                        boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                                        transition: 'all 0.2s ease',
                                        '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }
                                    }}
                                    onClick={() => navigate(action.path)}
                                >
                                    <Avatar sx={{ bgcolor: `${action.color}15`, color: action.color, mb: 1.5, mx: 'auto', width: 50, height: 50, border: '1px solid', borderColor: `${action.color}30` }}>
                                        {React.cloneElement(action.icon as any, { sx: { fontSize: 26 } })}
                                    </Avatar>
                                    <Typography variant="subtitle2" fontWeight={700} color="text.primary">{action.label}</Typography>
                                </AppCard>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Fees Quick Card */}
                    <Paper
                        elevation={0}
                        onClick={() => navigate('/parent/fees')}
                        sx={{
                            mt: 3,
                            p: 2.5,
                            borderRadius: 3.5,
                            border: '1px solid #e0e7ff',
                            bgcolor: '#f5f3ff',
                            cursor: 'pointer',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(139, 92, 246, 0.15)' }
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                            <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#8b5cf6', color: '#fff' }}>
                                <FeeIcon fontSize="small" />
                            </Box>
                            <Typography variant="subtitle2" fontWeight={700} color="#4c1d95">Fees & Online Payments</Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                            Check pending fee balances, receipt history, and pay online securely.
                        </Typography>
                        <Button
                            variant="contained"
                            fullWidth
                            onClick={(e) => { e.stopPropagation(); navigate('/parent/fees'); }}
                            sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' }, borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
                        >
                            Manage & Pay Fees
                        </Button>
                    </Paper>

                    {/* Chat with Teachers CTA Card */}
                    <Paper
                        elevation={0}
                        onClick={() => navigate('/parent/chat')}
                        sx={{
                            mt: 3,
                            p: 2.5,
                            borderRadius: 3.5,
                            border: '1px solid #c7d2fe',
                            bgcolor: '#eef2ff',
                            cursor: 'pointer',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(79, 70, 229, 0.15)' }
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                            <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#4f46e5', color: '#fff' }}>
                                <ChatIcon fontSize="small" />
                            </Box>
                            <Typography variant="subtitle2" fontWeight={700} color="#312e81">Chat with Teachers</Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                            Send secure messages to your child's teachers — get updates on progress, homework, and behaviour.
                        </Typography>
                        <Button
                            variant="contained"
                            fullWidth
                            onClick={(e) => { e.stopPropagation(); navigate('/parent/chat'); }}
                            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
                            startIcon={<ChatIcon />}
                        >
                            Open Secure Chat
                        </Button>
                    </Paper>

                    <AppCard sx={{ mt: 3, p: 3, bgcolor: '#1e40af', color: '#ffffff', borderRadius: 4 }}>
                        <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>Need assistance?</Typography>
                        <Typography variant="body2" sx={{ mb: 2.5, opacity: 0.9 }}>
                            Our school administration department is available for any questions or support.
                        </Typography>
                        <AppButton
                            variant="contained"
                            sx={{ bgcolor: '#ffffff', color: '#1e40af', fontWeight: 700, '&:hover': { bgcolor: '#f8fafc' } }}
                            fullWidth
                            startIcon={<PersonIcon />}
                            onClick={() => setSupportDialogOpen(true)}
                        >
                            Contact Helpline
                        </AppButton>
                    </AppCard>
                </Grid>
            </Grid>

            <RequestChangeDialog
                open={supportDialogOpen}
                onClose={() => setSupportDialogOpen(false)}
                schoolId={schoolId}
                userId={user?.userId || selectedChild?.parentId || ''}
                userName={`${user?.firstName || 'Parent'} ${user?.lastName || ''}`.trim()}
                userType="parent"
                fieldType="general"
            />
        </Box>
    );
};

export default ParentDashboard;
