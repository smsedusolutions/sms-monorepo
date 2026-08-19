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
    Check as CheckIcon,
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
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
                <Alert severity="error">Failed to load dashboard data. Please try again later.</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
            {/* Welcome Header */}
            <Box sx={{ mb: { xs: 2, sm: 3 }, mt: 0.5 }}>
                {loadingDashboard ? (
                    <>
                        <Skeleton variant="text" width="55%" height={48} sx={{ borderRadius: 2 }} />
                        <Skeleton variant="text" width="35%" height={22} sx={{ mt: 0.5 }} />
                    </>
                ) : (
                    <>
                        <Typography
                            variant="h4"
                            fontWeight={800}
                            sx={{
                                mb: 0.25,
                                background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                fontSize: { xs: '1.45rem', sm: '1.85rem', md: '2.25rem' },
                                letterSpacing: '-0.02em',
                                lineHeight: 1.2
                            }}
                        >
                            Welcome, {dashboard?.parentName || `${user?.firstName || 'Parent'} ${user?.lastName || ''}`}!
                        </Typography>
                        <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ opacity: 0.85, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                            Here is today's overview for your {childrenCount === 1 ? 'child' : 'children'}.
                        </Typography>
                    </>
                )}
            </Box>

            <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
                {/* Main Content Area (8 Cols) */}
                <Grid size={{ xs: 12, lg: 8 }}>
                    {/* My Children Overview */}
                    <AppSection
                        title="My Children"
                        action={
                            <AppButton size="small" variant="text" onClick={() => navigate('/parent/children')} sx={{ fontSize: '0.775rem', py: 0.25, px: 1 }}>
                                View All ({childrenCount})
                            </AppButton>
                        }
                    >
                        <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                            {loadingDashboard ? (
                                [1, 2].map((i) => (
                                    <Grid size={childGridSize} key={i}>
                                        <Skeleton variant="rectangular" height={88} sx={{ borderRadius: 2 }} />
                                    </Grid>
                                ))
                            ) : (
                                dashboard?.children?.map((child: ChildStats) => {
                                    const isSelected = selectedChild?.studentId === child.studentId;
                                    return (
                                        <Grid size={childGridSize} key={child.studentId}>
                                            <Paper
                                                elevation={0}
                                                onClick={() => handleChildSelect(child)}
                                                sx={{
                                                    p: { xs: 1.5, sm: 1.75 },
                                                    borderRadius: 2,
                                                    bgcolor: isSelected ? '#f8faff' : '#ffffff',
                                                    border: '1.5px solid',
                                                    borderColor: isSelected ? '#4f46e5' : '#e2e8f0',
                                                    boxShadow: isSelected ? '0 4px 16px rgba(79, 70, 229, 0.12)' : '0 2px 8px rgba(0, 0, 0, 0.02)',
                                                    transition: 'all 0.18s ease-in-out',
                                                    cursor: 'pointer',
                                                    position: 'relative',
                                                    '&:hover': {
                                                        borderColor: isSelected ? '#4338ca' : '#cbd5e1',
                                                        transform: 'translateY(-1.5px)',
                                                        boxShadow: '0 6px 18px rgba(0, 0, 0, 0.05)',
                                                    }
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                                    <Avatar
                                                        src={child.profileImage}
                                                        alt={child.name}
                                                        sx={{
                                                            width: { xs: 44, sm: 48 },
                                                            height: { xs: 44, sm: 48 },
                                                            bgcolor: isSelected ? '#4f46e5' : '#e2e8f0',
                                                            color: isSelected ? '#ffffff' : '#475569',
                                                            fontWeight: 700,
                                                            fontSize: { xs: '1rem', sm: '1.1rem' },
                                                            border: isSelected ? '2px solid #4f46e5' : '1px solid #cbd5e1',
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        {child.firstName?.[0]}
                                                    </Avatar>
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.25 }}>
                                                            <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ fontSize: { xs: '0.9rem', sm: '0.95rem' } }}>
                                                                {child.name}
                                                            </Typography>
                                                            {isSelected ? (
                                                                <Chip
                                                                    size="small"
                                                                    icon={<CheckIcon sx={{ fontSize: '13px !important', color: '#fff !important' }} />}
                                                                    label="Active"
                                                                    sx={{
                                                                        height: 20,
                                                                        fontSize: '0.675rem',
                                                                        fontWeight: 700,
                                                                        bgcolor: '#4f46e5',
                                                                        color: '#ffffff',
                                                                        px: 0.25,
                                                                        borderRadius: 1.5,
                                                                    }}
                                                                />
                                                            ) : (
                                                                <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'primary.main', fontWeight: 600 }}>
                                                                    Tap to switch
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75, fontWeight: 500, fontSize: '0.75rem' }}>
                                                            Grade {child.className}-{child.sectionName} • Roll: {child.rollNumber}
                                                        </Typography>

                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                                                            <Chip
                                                                size="small"
                                                                label={`${child.attendancePercentage}% Attendance`}
                                                                sx={{
                                                                    height: 22,
                                                                    fontSize: '0.7rem',
                                                                    borderRadius: 1.5,
                                                                    fontWeight: 700,
                                                                    bgcolor: `${getAttendanceColor(child.attendancePercentage)}15`,
                                                                    color: getAttendanceColor(child.attendancePercentage),
                                                                    border: `1px solid ${getAttendanceColor(child.attendancePercentage)}35`
                                                                }}
                                                            />
                                                            {child.pendingLeaves > 0 && (
                                                                <Chip
                                                                    size="small"
                                                                    label={`${child.pendingLeaves} Leave Pending`}
                                                                    sx={{
                                                                        height: 22,
                                                                        fontSize: '0.7rem',
                                                                        borderRadius: 1.5,
                                                                        fontWeight: 700,
                                                                        bgcolor: '#fffbeb',
                                                                        color: '#b45309',
                                                                        border: '1px solid #fde68a'
                                                                    }}
                                                                />
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            </Paper>
                                        </Grid>
                                    );
                                })
                            )}
                        </Grid>
                    </AppSection>

                    {/* Attendance Short Report Card Widget */}
                    <Box sx={{ my: { xs: 2, sm: 2.5 } }}>
                        <Paper
                            elevation={0}
                            onClick={() => navigate('/parent/attendance')}
                            sx={{
                                p: { xs: 2, sm: 2.5 },
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
                                        <AccessTimeIcon sx={{ color: '#2563eb', fontSize: 20 }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight={700} color="#1e293b" sx={{ fontSize: { xs: '0.95rem', sm: '1.05rem' }, lineHeight: 1.2 }}>
                                            {selectedChild ? `${selectedChild.firstName}'s Attendance` : 'Attendance Summary'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                            Current month overview
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Multiple Children Switcher Chips */}
                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                    {childrenCount > 1 && (
                                        <Box sx={{ display: 'flex', gap: 0.5, mr: 0.5 }} onClick={(e) => e.stopPropagation()}>
                                            {dashboard?.children?.map((c: ChildStats) => {
                                                const active = selectedChild?.studentId === c.studentId;
                                                return (
                                                    <Chip
                                                        key={c.studentId}
                                                        label={c.firstName}
                                                        size="small"
                                                        onClick={() => handleChildSelect(c)}
                                                        sx={{
                                                            height: 24,
                                                            fontSize: '0.725rem',
                                                            fontWeight: 700,
                                                            cursor: 'pointer',
                                                            bgcolor: active ? '#4f46e5' : '#f1f5f9',
                                                            color: active ? '#fff' : '#64748b',
                                                            '&:hover': { opacity: 0.9 }
                                                        }}
                                                    />
                                                );
                                            })}
                                        </Box>
                                    )}
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                                        onClick={(e) => { e.stopPropagation(); navigate('/parent/attendance'); }}
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
                                </Stack>
                            </Box>

                            <Divider sx={{ mb: 2 }} />

                            {loadingAttendance ? (
                                <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2.5 }} />
                            ) : (
                                <Grid container spacing={2} alignItems="center">
                                    {/* Donut Chart Visual */}
                                    <Grid size={{ xs: 12, sm: 4.5 }}>
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
                                                    {attendancePercentage}%
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mt: 0.25, fontSize: '0.68rem' }}>
                                                    Attendance
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>

                                    {/* Stat Counters & Badges */}
                                    <Grid size={{ xs: 12, sm: 7.5 }}>
                                        <Grid container spacing={1}>
                                            <Grid size={{ xs: 6 }}>
                                                <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
                                                        <PresentIcon sx={{ color: '#10b981', fontSize: 16 }} />
                                                        <Typography variant="caption" fontWeight={700} color="#065f46" sx={{ fontSize: '0.725rem' }}>Present</Typography>
                                                    </Box>
                                                    <Typography variant="h6" fontWeight={800} color="#10b981" sx={{ fontSize: '1.15rem' }}>
                                                        {summary?.present || 0} <Typography component="span" variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>days</Typography>
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            <Grid size={{ xs: 6 }}>
                                                <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: '#fef2f2', border: '1px solid #fecaca' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
                                                        <AbsentIcon sx={{ color: '#ef4444', fontSize: 16 }} />
                                                        <Typography variant="caption" fontWeight={700} color="#991b1b" sx={{ fontSize: '0.725rem' }}>Absent</Typography>
                                                    </Box>
                                                    <Typography variant="h6" fontWeight={800} color="#ef4444" sx={{ fontSize: '1.15rem' }}>
                                                        {summary?.absent || 0} <Typography component="span" variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>days</Typography>
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            <Grid size={{ xs: 6 }}>
                                                <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: '#fffbeb', border: '1px solid #fde68a' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
                                                        <LateIcon sx={{ color: '#f59e0b', fontSize: 16 }} />
                                                        <Typography variant="caption" fontWeight={700} color="#92400e" sx={{ fontSize: '0.725rem' }}>Late</Typography>
                                                    </Box>
                                                    <Typography variant="h6" fontWeight={800} color="#f59e0b" sx={{ fontSize: '1.15rem' }}>
                                                        {summary?.late || 0} <Typography component="span" variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>days</Typography>
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            <Grid size={{ xs: 6 }}>
                                                <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: '#f5f3ff', border: '1px solid #ddd6fe' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
                                                        <LeaveIcon sx={{ color: '#8b5cf6', fontSize: 16 }} />
                                                        <Typography variant="caption" fontWeight={700} color="#5b21b6" sx={{ fontSize: '0.725rem' }}>Leave</Typography>
                                                    </Box>
                                                    <Typography variant="h6" fontWeight={800} color="#8b5cf6" sx={{ fontSize: '1.15rem' }}>
                                                        {summary?.leave || 0} <Typography component="span" variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>days</Typography>
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
                    <Grid container spacing={{ xs: 2, sm: 2.5 }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <AppSection title="Upcoming Homework">
                                {loadingHomework ? (
                                    <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2.5 }} />
                                ) : upcomingHomework.length === 0 ? (
                                    <Box sx={{ py: 2.5, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
                                        <AssignmentIcon sx={{ fontSize: 32, color: 'text.disabled', opacity: 0.5, mb: 0.5 }} />
                                        <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ fontSize: '0.8rem' }}>No pending homework</Typography>
                                    </Box>
                                ) : (
                                    <Stack spacing={1}>
                                        {upcomingHomework.slice(0, 3).map((hw: Homework) => (
                                            <Box key={hw.homeworkId} sx={{ p: 1.25, borderRadius: 2, bgcolor: '#ffffff', border: '1px solid #e2e8f0', '&:hover': { bgcolor: '#f8fafc' } }}>
                                                <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: '0.85rem' }}>{hw.title}</Typography>
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
                                    <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2.5 }} />
                                ) : announcements.length === 0 ? (
                                    <Box sx={{ py: 2.5, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
                                        <AnnouncementIcon sx={{ fontSize: 32, color: 'text.disabled', opacity: 0.5, mb: 0.5 }} />
                                        <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ fontSize: '0.8rem' }}>No new announcements</Typography>
                                    </Box>
                                ) : (
                                    <Stack spacing={1}>
                                        {announcements.slice(0, 3).map((ann: Announcement) => (
                                            <Box key={ann.announcementId} sx={{
                                                p: 1.25,
                                                borderRadius: 2,
                                                bgcolor: ann.priority === 'urgent' ? '#fef2f2' : '#ffffff',
                                                border: '1px solid',
                                                borderColor: ann.priority === 'urgent' ? '#fecaca' : '#e2e8f0',
                                                borderLeft: 3.5,
                                                borderLeftColor: ann.priority === 'urgent' ? '#ef4444' : '#3b82f6'
                                            }}>
                                                <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: '0.85rem' }}>{ann.title}</Typography>
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
                        <Box sx={{ mt: { xs: 2, sm: 2.5 } }}>
                            <Paper elevation={0} sx={{ p: { xs: 1.75, sm: 2 }, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                    <Typography variant="subtitle2" fontWeight={700} color="#1e293b">Recent Leave Applications</Typography>
                                    <Button size="small" onClick={() => navigate('/parent/leave/apply')} sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', p: 0.5 }}>
                                        Apply Leave →
                                    </Button>
                                </Box>
                                <Stack spacing={1}>
                                    {childLeaves.slice(0, 2).map((leave: any) => (
                                        <Box key={leave.leaveId} sx={{ p: 1.25, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: '0.825rem' }}>{leave.reason || leave.leaveType || 'Leave Request'}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {new Date(leave.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} – {new Date(leave.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                                </Typography>
                                            </Box>
                                            <Chip
                                                size="small"
                                                label={leave.status?.toUpperCase() || 'PENDING'}
                                                sx={{
                                                    height: 22,
                                                    fontSize: '0.675rem',
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
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5, fontSize: { xs: '0.95rem', sm: '1.05rem' } }}>Quick Actions</Typography>
                    <Grid container spacing={1.25}>
                        {[
                            { label: 'Apply Leave', icon: <LeaveIcon />, path: '/parent/leave/apply', color: '#f59e0b' },
                            { label: 'Exam Results', icon: <SchoolIcon />, path: '/parent/exam/results', color: '#10b981' },
                            { label: 'Timetable', icon: <TimetableIcon />, path: '/parent/timetable', color: '#3b82f6' },
                            { label: 'Teachers', icon: <TeachersIcon />, path: '/parent/teachers', color: '#8b5cf6' },
                            { label: 'Homework', icon: <AssignmentIcon />, path: '/parent/homework', color: '#ec4899' },
                            { label: 'Announcements', icon: <AnnouncementIcon />, path: '/parent/announcements', color: '#06b6d4' },
                            { label: 'Chat Teachers', icon: <ChatIcon />, path: '/parent/chat', color: '#4f46e5' },
                        ].map((action) => (
                            <Grid size={{ xs: 4, sm: 4, lg: 6 }} key={action.label}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        py: { xs: 1.25, sm: 1.75 },
                                        px: 1,
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        height: '100%',
                                        borderRadius: 2.5,
                                        bgcolor: '#ffffff',
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                                        transition: 'all 0.18s ease-in-out',
                                        '&:hover': { transform: 'translateY(-2px)', borderColor: '#cbd5e1', boxShadow: '0 4px 14px rgba(0,0,0,0.06)' }
                                    }}
                                    onClick={() => navigate(action.path)}
                                >
                                    <Avatar sx={{ bgcolor: `${action.color}15`, color: action.color, mb: 1, mx: 'auto', width: { xs: 36, sm: 42 }, height: { xs: 36, sm: 42 }, border: '1px solid', borderColor: `${action.color}30` }}>
                                        {React.cloneElement(action.icon as any, { sx: { fontSize: { xs: 19, sm: 22 } } })}
                                    </Avatar>
                                    <Typography variant="caption" fontWeight={700} color="text.primary" sx={{ display: 'block', fontSize: { xs: '0.72rem', sm: '0.775rem' }, lineHeight: 1.2 }} noWrap>{action.label}</Typography>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Fees Quick Card */}
                    <Paper
                        elevation={0}
                        onClick={() => navigate('/parent/fees')}
                        sx={{
                            mt: 2,
                            p: { xs: 1.75, sm: 2 },
                            borderRadius: 2,
                            border: '1px solid #e0e7ff',
                            bgcolor: '#f5f3ff',
                            cursor: 'pointer',
                            transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                            '&:hover': { transform: 'translateY(-1.5px)', boxShadow: '0 6px 18px rgba(139, 92, 246, 0.12)' }
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 0.75 }}>
                            <Box sx={{ p: 0.75, borderRadius: 1.5, bgcolor: '#8b5cf6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FeeIcon sx={{ fontSize: 18 }} />
                            </Box>
                            <Typography variant="subtitle2" fontWeight={700} color="#4c1d95" sx={{ fontSize: '0.875rem' }}>Fees & Online Payments</Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, fontSize: '0.75rem' }}>
                            Check fee balances, download receipt history, and pay online securely.
                        </Typography>
                        <Button
                            variant="contained"
                            fullWidth
                            size="small"
                            onClick={(e) => { e.stopPropagation(); navigate('/parent/fees'); }}
                            sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' }, borderRadius: 2, fontWeight: 700, textTransform: 'none', py: 0.6, fontSize: '0.8rem' }}
                        >
                            Manage & Pay Fees
                        </Button>
                    </Paper>

                    {/* Chat with Teachers CTA Card */}
                    <Paper
                        elevation={0}
                        onClick={() => navigate('/parent/chat')}
                        sx={{
                            mt: 2,
                            p: { xs: 1.75, sm: 2 },
                            borderRadius: 2,
                            border: '1px solid #c7d2fe',
                            bgcolor: '#eef2ff',
                            cursor: 'pointer',
                            transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                            '&:hover': { transform: 'translateY(-1.5px)', boxShadow: '0 6px 18px rgba(79, 70, 229, 0.12)' }
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 0.75 }}>
                            <Box sx={{ p: 0.75, borderRadius: 1.5, bgcolor: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ChatIcon sx={{ fontSize: 18 }} />
                            </Box>
                            <Typography variant="subtitle2" fontWeight={700} color="#312e81" sx={{ fontSize: '0.875rem' }}>Chat with Teachers</Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, fontSize: '0.75rem' }}>
                            Send secure messages to your child's teachers for real-time updates.
                        </Typography>
                        <Button
                            variant="contained"
                            fullWidth
                            size="small"
                            onClick={(e) => { e.stopPropagation(); navigate('/parent/chat'); }}
                            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2, fontWeight: 700, textTransform: 'none', py: 0.6, fontSize: '0.8rem' }}
                            startIcon={<ChatIcon sx={{ fontSize: 16 }} />}
                        >
                            Open Secure Chat
                        </Button>
                    </Paper>

                    {/* Need Assistance Card */}
                    <Paper sx={{ mt: 2, p: { xs: 1.75, sm: 2 }, bgcolor: '#1e40af', color: '#ffffff', borderRadius: 2 }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5, fontSize: '0.875rem' }}>Need assistance?</Typography>
                        <Typography variant="caption" sx={{ mb: 1.5, opacity: 0.9, display: 'block', fontSize: '0.75rem' }}>
                            Our school administration is available for any questions or support.
                        </Typography>
                        <Button
                            variant="contained"
                            size="small"
                            sx={{ bgcolor: '#ffffff', color: '#1e40af', fontWeight: 700, '&:hover': { bgcolor: '#f8fafc' }, borderRadius: 2, textTransform: 'none', py: 0.6, fontSize: '0.8rem' }}
                            fullWidth
                            startIcon={<PersonIcon sx={{ fontSize: 16 }} />}
                            onClick={() => setSupportDialogOpen(true)}
                        >
                            Contact Helpline
                        </Button>
                    </Paper>
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

