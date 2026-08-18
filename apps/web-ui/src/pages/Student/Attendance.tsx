import React, { useState, useMemo } from 'react';
import {
    Box, Typography, Paper, Grid, Card, CardContent, Button, ButtonGroup,
    Chip, LinearProgress, Skeleton, Stack, Tooltip, CircularProgress,
} from '@mui/material';
import {
    CheckCircle as PresentIcon,
    Cancel as AbsentIcon,
    Schedule as LateIcon,
    TrendingUp as TrendingUpIcon,
    History as HistoryIcon,
    CalendarMonth as CalendarIcon,
    PictureAsPdf as PdfIcon,
    TableChart as ExcelIcon,
    LocalFireDepartment as StreakIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useGetSimpleStudentAttendance } from '../../queries/Attendance';
import TokenService from '../../queries/token/tokenService';
import { exportAttendancePDF, exportAttendanceExcel } from '../../utils/attendanceExport';
import type { AttendanceRecord, AttendanceSummaryData } from '../../utils/attendanceExport';

const STATUS_COLORS: Record<string, string> = {
    present: '#10b981',
    absent: '#ef4444',
    late: '#f59e0b',
    half_day: '#3b82f6',
    leave: '#8b5cf6',
};

const STATUS_BG: Record<string, string> = {
    present: '#ecfdf5',
    absent: '#fef2f2',
    late: '#fffbeb',
    half_day: '#eff6ff',
    leave: '#f5f3ff',
};

const STATUS_LABELS: Record<string, string> = {
    present: 'Present',
    absent: 'Absent',
    late: 'Late',
    half_day: 'Half Day',
    leave: 'Leave',
};

const StudentAttendance: React.FC = () => {
    const navigate = useNavigate();
    const schoolId = TokenService.getSchoolId() || '';
    const studentId = TokenService.getStudentId() || '';
    const user = TokenService.getUser();

    const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);

    // Get last 30 days of attendance
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data, isLoading, error } = useGetSimpleStudentAttendance(
        schoolId,
        studentId,
        startDate,
        endDate
    );

    const summary = data?.data?.summary;
    const rawAttendance = (data?.data?.attendance || []) as AttendanceRecord[];

    // Calculate attendance statistics
    const totalDays = summary?.total || 0;
    const presentDays = (summary?.present || 0) + (summary?.late || 0);
    const percentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : '0';
    const pctNumber = parseFloat(percentage);

    // Streaks calculation
    const { currentStreak, longestStreak } = useMemo(() => {
        const sorted = [...rawAttendance].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        let cur = 0, longest = 0, streak = 0;
        sorted.forEach(r => {
            if (r.status === 'present' || r.status === 'late') {
                streak++;
                if (streak > longest) longest = streak;
            } else {
                streak = 0;
            }
        });
        for (let i = sorted.length - 1; i >= 0; i--) {
            if (sorted[i].status === 'present' || sorted[i].status === 'late') cur++;
            else break;
        }
        return { currentStreak: cur, longestStreak: longest };
    }, [rawAttendance]);

    // Export handlers
    const dateRangeLabel = 'Last 30 Days';

    const handleExportPDF = () => {
        setExporting('pdf');
        try {
            exportAttendancePDF(
                rawAttendance,
                {
                    total: totalDays,
                    present: summary?.present || 0,
                    absent: summary?.absent || 0,
                    late: summary?.late || 0,
                    percentage,
                } as AttendanceSummaryData,
                {
                    studentName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Student',
                    className: user?.className,
                    sectionName: user?.sectionName,
                    rollNumber: user?.rollNumber,
                    dateRangeLabel,
                }
            );
        } finally {
            setExporting(null);
        }
    };

    const handleExportExcel = async () => {
        setExporting('excel');
        try {
            await exportAttendanceExcel(
                rawAttendance,
                {
                    total: totalDays,
                    present: summary?.present || 0,
                    absent: summary?.absent || 0,
                    late: summary?.late || 0,
                    percentage,
                } as AttendanceSummaryData,
                {
                    studentName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Student',
                    className: user?.className,
                    sectionName: user?.sectionName,
                    rollNumber: user?.rollNumber,
                    dateRangeLabel,
                }
            );
        } finally {
            setExporting(null);
        }
    };

    const getStatusColor = (status: string) => STATUS_COLORS[status] || '#64748b';
    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'present': return 'P';
            case 'absent': return 'A';
            case 'late': return 'L';
            case 'half_day': return 'H';
            case 'leave': return 'LV';
            default: return '-';
        }
    };

    const percentageColor = pctNumber >= 90 ? '#10b981' : pctNumber >= 75 ? '#f59e0b' : '#ef4444';

    return (
        <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 1300, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, mb: { xs: 2, sm: 2.5 }, gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CalendarIcon sx={{ color: '#2563eb', fontSize: { xs: 22, sm: 26 } }} />
                    </Box>
                    <Box>
                        <Typography
                            variant="h4"
                            fontWeight={800}
                            color="#1e293b"
                            sx={{ fontSize: { xs: '1.35rem', sm: '1.75rem' }, letterSpacing: '-0.02em', lineHeight: 1.2 }}
                        >
                            My Attendance
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.825rem' } }}>
                            Track your attendance records, streaks, and analytics
                        </Typography>
                    </Box>
                </Box>
                <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', sm: 'auto' }, flexWrap: 'wrap' }}>
                    <ButtonGroup variant="contained" size="small" disableElevation sx={{ flex: { xs: 1, sm: 'none' } }}>
                        <Button
                            startIcon={<PdfIcon sx={{ fontSize: 15 }} />}
                            onClick={handleExportPDF}
                            disabled={!rawAttendance.length || exporting === 'pdf'}
                            sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' }, borderRadius: '6px 0 0 6px', fontWeight: 600, fontSize: '0.72rem', py: 0.4, flex: 1 }}
                        >
                            {exporting === 'pdf' ? '...' : 'PDF'}
                        </Button>
                        <Button
                            startIcon={<ExcelIcon sx={{ fontSize: 15 }} />}
                            onClick={handleExportExcel}
                            disabled={!rawAttendance.length || exporting === 'excel'}
                            sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' }, borderRadius: '0 6px 6px 0', fontWeight: 600, fontSize: '0.72rem', py: 0.4, flex: 1 }}
                        >
                            {exporting === 'excel' ? '...' : 'Excel'}
                        </Button>
                    </ButtonGroup>
                    <Button
                        variant="contained"
                        size="small"
                        startIcon={<HistoryIcon sx={{ fontSize: 16 }} />}
                        onClick={() => navigate('/student/attendance/history')}
                        sx={{
                            bgcolor: '#3b82f6',
                            '&:hover': { bgcolor: '#2563eb' },
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            py: 0.4,
                            px: 1.5,
                            flex: { xs: 2, sm: 'none' }
                        }}
                    >
                        View Full History
                    </Button>
                </Stack>
            </Box>

            {isLoading && (
                <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Skeleton variant="rounded" height={220} sx={{ borderRadius: 2.5 }} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Skeleton variant="rounded" height={220} sx={{ borderRadius: 2.5 }} />
                    </Grid>
                </Grid>
            )}

            {error && (
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 2.5, mb: 2 }}>
                    <Typography color="error" fontWeight={600} variant="body2">Failed to load attendance data. Please try again later.</Typography>
                </Paper>
            )}

            {!isLoading && !error && (
                <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                    {/* Main Attendance Rate Card */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 2, sm: 2.5 },
                                borderRadius: 3,
                                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                                color: 'white',
                                height: '100%',
                                minHeight: { xs: 240, md: 280 },
                                position: 'relative',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                boxShadow: '0 8px 24px -6px rgba(99, 102, 241, 0.35)',
                            }}
                        >
                            <Box sx={{
                                position: 'absolute', top: -30, right: -30, width: 110, height: 110,
                                borderRadius: '50%', background: 'rgba(255,255,255,0.08)'
                            }} />

                            {/* Top row */}
                            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                    <TrendingUpIcon sx={{ fontSize: 18 }} />
                                    <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>Attendance Rate</Typography>
                                </Box>
                                <Chip
                                    label="Last 30 days"
                                    size="small"
                                    sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: '#ffffff', fontWeight: 600, fontSize: '0.65rem', height: 20 }}
                                />
                            </Box>

                            {/* Circular Progress Gauge */}
                            <Box sx={{ position: 'relative', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', my: { xs: 1.5, sm: 2 } }}>
                                <CircularProgress
                                    variant="determinate"
                                    value={100}
                                    size={110}
                                    thickness={5.5}
                                    sx={{ color: 'rgba(255, 255, 255, 0.18)' }}
                                />
                                <CircularProgress
                                    variant="determinate"
                                    value={Math.min(pctNumber, 100)}
                                    size={110}
                                    thickness={5.5}
                                    sx={{
                                        color: '#ffffff',
                                        position: 'absolute',
                                        left: 0,
                                        strokeLinecap: 'round',
                                        filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.25))',
                                    }}
                                />
                                <Box sx={{
                                    position: 'absolute',
                                    top: 0, left: 0, right: 0, bottom: 0,
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center',
                                    textAlign: 'center', pointerEvents: 'none'
                                }}>
                                    <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1, fontSize: { xs: '1.45rem', sm: '1.65rem' }, color: '#ffffff' }}>
                                        {percentage}%
                                    </Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 600, fontSize: '0.65rem', mt: 0.25, color: '#ffffff' }}>
                                        Overall Rate
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Stats Summary Chips */}
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, width: '100%', flexWrap: 'wrap' }}>
                                <Chip
                                    icon={<PresentIcon sx={{ color: '#10b981 !important', fontSize: '14px !important' }} />}
                                    label={`${presentDays} Present`}
                                    size="small"
                                    sx={{ bgcolor: 'rgba(255,255,255,0.95)', color: '#065f46', fontWeight: 700, height: 24, fontSize: '0.7rem', px: 0.5 }}
                                />
                                <Chip
                                    icon={<AbsentIcon sx={{ color: '#ef4444 !important', fontSize: '14px !important' }} />}
                                    label={`${summary?.absent || 0} Absent`}
                                    size="small"
                                    sx={{ bgcolor: 'rgba(255,255,255,0.95)', color: '#991b1b', fontWeight: 700, height: 24, fontSize: '0.7rem', px: 0.5 }}
                                />
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Right Side Content */}
                    <Grid size={{ xs: 12, md: 8 }}>
                        {/* Stat Cards Row - 4 columns on desktop, 4/2 on mobile */}
                        <Grid container spacing={{ xs: 1, sm: 1.5 }} sx={{ mb: { xs: 1.5, sm: 2 } }}>
                            {[
                                { label: 'Present', value: summary?.present || 0, color: '#10b981', bg: '#ecfdf5', icon: <PresentIcon /> },
                                { label: 'Absent', value: summary?.absent || 0, color: '#ef4444', bg: '#fef2f2', icon: <AbsentIcon /> },
                                { label: 'Late', value: summary?.late || 0, color: '#f59e0b', bg: '#fffbeb', icon: <LateIcon /> },
                                { label: 'Leave', value: summary?.leave || 0, color: '#8b5cf6', bg: '#f5f3ff', icon: <CalendarIcon /> },
                            ].map((stat) => (
                                <Grid size={{ xs: 6, sm: 3 }} key={stat.label}>
                                    <Card elevation={0} sx={{ borderRadius: 2.5, bgcolor: stat.bg, border: `1px solid ${stat.color}25`, height: '100%' }}>
                                        <CardContent sx={{ textAlign: 'center', p: { xs: 1, sm: 1.25 }, '&:last-child': { pb: { xs: 1, sm: 1.25 } } }}>
                                            <Box sx={{ color: stat.color, display: 'flex', justifyContent: 'center', mb: 0.25 }}>
                                                {React.cloneElement(stat.icon, { sx: { fontSize: 18 } })}
                                            </Box>
                                            <Typography variant="h5" fontWeight={800} sx={{ color: stat.color, fontSize: { xs: '1.15rem', sm: '1.35rem' }, lineHeight: 1.1 }}>
                                                {stat.value}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: '0.68rem' }}>{stat.label}</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>

                        {/* Streaks Banner */}
                        <Grid container spacing={{ xs: 1, sm: 1.5 }} sx={{ mb: { xs: 1.5, sm: 2 } }}>
                            <Grid size={{ xs: 6 }}>
                                <Card elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #fde68a', bgcolor: '#fffbeb', p: { xs: 1, sm: 1.25 }, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ p: 0.6, borderRadius: 2, bgcolor: '#fef3c7', color: '#d97706', display: 'flex', flexShrink: 0 }}>
                                        <StreakIcon sx={{ fontSize: 18 }} />
                                    </Box>
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography variant="subtitle2" fontWeight={800} color="#92400e" sx={{ fontSize: { xs: '0.9rem', sm: '1.05rem' }, lineHeight: 1.1 }}>{currentStreak} Days</Typography>
                                        <Typography variant="caption" fontWeight={700} color="#b45309" sx={{ fontSize: '0.65rem', display: 'block' }} noWrap>Current Streak</Typography>
                                    </Box>
                                </Card>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                                <Card elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #bbf7d0', bgcolor: '#f0fdf4', p: { xs: 1, sm: 1.25 }, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ p: 0.6, borderRadius: 2, bgcolor: '#dcfce7', color: '#16a34a', display: 'flex', flexShrink: 0 }}>
                                        <TrendingUpIcon sx={{ fontSize: 18 }} />
                                    </Box>
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography variant="subtitle2" fontWeight={800} color="#065f46" sx={{ fontSize: { xs: '0.9rem', sm: '1.05rem' }, lineHeight: 1.1 }}>{longestStreak} Days</Typography>
                                        <Typography variant="caption" fontWeight={700} color="#047857" sx={{ fontSize: '0.65rem', display: 'block' }} noWrap>Best Streak</Typography>
                                    </Box>
                                </Card>
                            </Grid>
                        </Grid>

                        {/* Last 7 Days Activity */}
                        <Card elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff', mb: { xs: 1.5, sm: 2 } }}>
                            <CardContent sx={{ p: { xs: 1.25, sm: 1.75 }, '&:last-child': { pb: { xs: 1.25, sm: 1.75 } } }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="subtitle2" fontWeight={700} color="#1e293b" sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
                                        Last 7 Days Record
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: '0.68rem' }}>
                                        Recent activity
                                    </Typography>
                                </Box>
                                <Box sx={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(7, 1fr)',
                                    gap: { xs: 0.5, sm: 1 }
                                }}>
                                    {Array.from({ length: 7 }).map((_, idx) => {
                                        // Calculate past 7 days starting from 6 days ago up to today
                                        const targetDate = new Date();
                                        targetDate.setDate(targetDate.getDate() - (6 - idx));
                                        const dateKey = targetDate.toISOString().split('T')[0];

                                        const matchingRecord = rawAttendance.find(
                                            (r: AttendanceRecord) => new Date(r.date).toISOString().split('T')[0] === dateKey
                                        );

                                        const status = matchingRecord?.status;
                                        const color = status ? getStatusColor(status) : '#94a3b8';
                                        const bg = status ? (STATUS_BG[status] || '#f8fafc') : '#f8fafc';
                                        const label = status ? getStatusLabel(status) : '-';

                                        return (
                                            <Tooltip key={idx} title={`${targetDate.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}: ${status ? (STATUS_LABELS[status] || status) : 'No record'}`}>
                                                <Box
                                                    sx={{
                                                        textAlign: 'center',
                                                        py: { xs: 0.6, sm: 0.75 },
                                                        px: 0.25,
                                                        borderRadius: 2,
                                                        bgcolor: bg,
                                                        border: `1.5px solid ${status ? color + '40' : '#e2e8f0'}`,
                                                        transition: 'transform 0.18s',
                                                        '&:hover': { transform: 'translateY(-2px)' }
                                                    }}
                                                >
                                                    <Typography variant="caption" color="text.secondary" display="block" fontWeight={600} sx={{ fontSize: { xs: '0.62rem', sm: '0.7rem' } }}>
                                                        {targetDate.toLocaleDateString('en-US', { weekday: 'narrow' })}
                                                    </Typography>
                                                    <Typography
                                                        variant="subtitle2"
                                                        fontWeight={800}
                                                        sx={{ color, my: 0.2, lineHeight: 1, fontSize: { xs: '0.8rem', sm: '0.95rem' } }}
                                                    >
                                                        {label}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: { xs: '0.62rem', sm: '0.7rem' } }}>
                                                        {targetDate.getDate()}
                                                    </Typography>
                                                </Box>
                                            </Tooltip>
                                        );
                                    })}
                                </Box>
                            </CardContent>
                        </Card>

                        {/* Attendance Progress Bar */}
                        <Card elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                            <CardContent sx={{ p: { xs: 1.25, sm: 1.75 }, '&:last-child': { pb: { xs: 1.25, sm: 1.75 } } }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75, alignItems: 'center' }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ fontSize: '0.72rem' }}>
                                        Attendance Progress
                                    </Typography>
                                    <Typography variant="caption" fontWeight={700} color="#1e293b" sx={{ fontSize: '0.72rem' }}>
                                        {presentDays} / {totalDays} days ({percentage}%)
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={Math.min(pctNumber, 100)}
                                    sx={{
                                        height: 8,
                                        borderRadius: 4,
                                        bgcolor: '#f1f5f9',
                                        '& .MuiLinearProgress-bar': {
                                            borderRadius: 4,
                                            bgcolor: percentageColor,
                                        },
                                    }}
                                />
                                {pctNumber < 75 && pctNumber > 0 && (
                                    <Typography variant="caption" color="error.main" fontWeight={700} sx={{ mt: 0.75, display: 'block', fontSize: '0.68rem' }}>
                                        ⚠️ Attendance is below the required 75% threshold.
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};

export default StudentAttendance;
