import React, { useState, useMemo } from 'react';
import {
    Box, Typography, Paper, Grid, Card, CardContent, Button, ButtonGroup,
    Chip, LinearProgress, Skeleton, Alert, Stack, Tooltip, Divider,
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
    ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Chart } from 'react-google-charts';
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

    // Last 7 days attendance
    const last7Days = useMemo(() => {
        return [...rawAttendance]
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(-7);
    }, [rawAttendance]);

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

    // Google Chart data for Donut
    const donutData = useMemo(() => {
        return [
            ['Status', 'Days'],
            ['Present', summary?.present || 0],
            ['Absent', summary?.absent || 0],
            ['Late', summary?.late || 0],
            ['Half Day', summary?.halfDay || 0],
            ['Leave', summary?.leave || 0],
        ];
    }, [summary]);

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
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1300, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: '#eff6ff' }}>
                        <CalendarIcon sx={{ color: '#2563eb', fontSize: 28 }} />
                    </Box>
                    <Box>
                        <Typography
                            variant="h4"
                            fontWeight={800}
                            color="#1e293b"
                            sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}
                        >
                            My Attendance
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Track your attendance records, streaks, and analytics
                        </Typography>
                    </Box>
                </Box>
                <Stack direction="row" spacing={1.5} flexWrap="wrap">
                    <ButtonGroup variant="contained" size="small" disableElevation>
                        <Button
                            startIcon={<PdfIcon />}
                            onClick={handleExportPDF}
                            disabled={!rawAttendance.length || exporting === 'pdf'}
                            sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' }, borderRadius: '8px 0 0 8px', fontWeight: 600 }}
                        >
                            {exporting === 'pdf' ? 'Generating…' : 'PDF'}
                        </Button>
                        <Button
                            startIcon={<ExcelIcon />}
                            onClick={handleExportExcel}
                            disabled={!rawAttendance.length || exporting === 'excel'}
                            sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' }, borderRadius: '0 8px 8px 0', fontWeight: 600 }}
                        >
                            {exporting === 'excel' ? 'Generating…' : 'Excel'}
                        </Button>
                    </ButtonGroup>
                    <Button
                        variant="contained"
                        startIcon={<HistoryIcon />}
                        onClick={() => navigate('/student/attendance/history')}
                        sx={{
                            bgcolor: '#3b82f6',
                            '&:hover': { bgcolor: '#2563eb' },
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 700,
                            px: 2.5,
                        }}
                    >
                        View Full History
                    </Button>
                </Stack>
            </Box>

            {isLoading && (
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Skeleton variant="rounded" height={340} sx={{ borderRadius: 3 }} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Skeleton variant="rounded" height={340} sx={{ borderRadius: 3 }} />
                    </Grid>
                </Grid>
            )}

            {error && (
                <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 3 }}>
                    <Typography color="error" fontWeight={600}>Failed to load attendance data. Please try again later.</Typography>
                </Paper>
            )}

            {!isLoading && !error && (
                <Grid container spacing={3}>
                    {/* Main Attendance Rate Card */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: 4,
                                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                                color: 'white',
                                height: '100%',
                                minHeight: 340,
                                position: 'relative',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                boxShadow: '0 12px 30px -10px rgba(99, 102, 241, 0.4)',
                            }}
                        >
                            <Box sx={{
                                position: 'absolute', top: -40, right: -40, width: 140, height: 140,
                                borderRadius: '50%', background: 'rgba(255,255,255,0.12)'
                            }} />

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <TrendingUpIcon />
                                <Typography variant="h6" fontWeight={700}>Attendance Rate</Typography>
                            </Box>
                            <Typography variant="caption" sx={{ opacity: 0.85, mb: 2 }}>Based on last 30 days</Typography>

                            {/* Chart / Circular Gauge */}
                            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', py: 1 }}>
                                <Chart
                                    chartType="PieChart"
                                    data={donutData}
                                    options={{
                                        pieHole: 0.7,
                                        colors: ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'],
                                        legend: 'none',
                                        chartArea: { width: '90%', height: '90%' },
                                        backgroundColor: 'transparent',
                                        pieSliceBorderColor: 'transparent',
                                        tooltip: { trigger: 'focus' },
                                    }}
                                    width="190px"
                                    height="190px"
                                />
                                <Box sx={{
                                    position: 'absolute', display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center', textAlign: 'center', pointerEvents: 'none'
                                }}>
                                    <Typography variant="h3" fontWeight={800} sx={{ lineHeight: 1 }}>
                                        {percentage}%
                                    </Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: 600, mt: 0.5 }}>
                                        Overall Rate
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Stats Summary Chips */}
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                                <Chip
                                    icon={<PresentIcon sx={{ color: '#10b981 !important', fontSize: 16 }} />}
                                    label={`${presentDays} Present`}
                                    size="small"
                                    sx={{ bgcolor: 'rgba(255,255,255,0.9)', color: '#065f46', fontWeight: 700 }}
                                />
                                <Chip
                                    icon={<AbsentIcon sx={{ color: '#ef4444 !important', fontSize: 16 }} />}
                                    label={`${summary?.absent || 0} Absent`}
                                    size="small"
                                    sx={{ bgcolor: 'rgba(255,255,255,0.9)', color: '#991b1b', fontWeight: 700 }}
                                />
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Right Side Content */}
                    <Grid size={{ xs: 12, md: 8 }}>
                        {/* Stat Cards Row */}
                        <Grid container spacing={2} sx={{ mb: 2.5 }}>
                            {[
                                { label: 'Present', value: summary?.present || 0, color: '#10b981', bg: '#ecfdf5', icon: <PresentIcon /> },
                                { label: 'Absent', value: summary?.absent || 0, color: '#ef4444', bg: '#fef2f2', icon: <AbsentIcon /> },
                                { label: 'Late', value: summary?.late || 0, color: '#f59e0b', bg: '#fffbeb', icon: <LateIcon /> },
                                { label: 'Leave', value: summary?.leave || 0, color: '#8b5cf6', bg: '#f5f3ff', icon: <CalendarIcon /> },
                            ].map((stat) => (
                                <Grid size={{ xs: 6, sm: 3 }} key={stat.label}>
                                    <Card elevation={0} sx={{ borderRadius: 3, bgcolor: stat.bg, border: `1px solid ${stat.color}30`, height: '100%' }}>
                                        <CardContent sx={{ textAlign: 'center', p: 2, '&:last-child': { pb: 2 } }}>
                                            <Box sx={{ color: stat.color, display: 'flex', justifyContent: 'center', mb: 0.5 }}>
                                                {React.cloneElement(stat.icon, { sx: { fontSize: 30 } })}
                                            </Box>
                                            <Typography variant="h4" fontWeight={800} sx={{ color: stat.color }}>
                                                {stat.value}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>{stat.label}</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>

                        {/* Streaks Banner */}
                        <Grid container spacing={2} sx={{ mb: 2.5 }}>
                            <Grid size={{ xs: 6 }}>
                                <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #fde68a', bgcolor: '#fffbeb', p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: '#fef3c7', color: '#d97706' }}>
                                        <StreakIcon sx={{ fontSize: 30 }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="h5" fontWeight={800} color="#92400e">{currentStreak} Days</Typography>
                                        <Typography variant="caption" fontWeight={700} color="#b45309">Current Attendance Streak</Typography>
                                    </Box>
                                </Card>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                                <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #bbf7d0', bgcolor: '#f0fdf4', p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: '#dcfce7', color: '#16a34a' }}>
                                        <TrendingUpIcon sx={{ fontSize: 30 }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="h5" fontWeight={800} color="#065f46">{longestStreak} Days</Typography>
                                        <Typography variant="caption" fontWeight={700} color="#047857">Best Streak in 30 Days</Typography>
                                    </Box>
                                </Card>
                            </Grid>
                        </Grid>

                        {/* Last 7 Days Activity */}
                        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', mb: 2.5 }}>
                            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="subtitle1" fontWeight={700} color="#1e293b">
                                        Last 7 Days Record
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                        Recent activity log
                                    </Typography>
                                </Box>
                                <Box sx={{
                                    display: 'grid',
                                    gridTemplateColumns: { xs: 'repeat(4, 1fr)', sm: 'repeat(7, 1fr)' },
                                    gap: 1.5
                                }}>
                                    {last7Days.length > 0 ? last7Days.map((day: AttendanceRecord, idx: number) => {
                                        const color = getStatusColor(day.status);
                                        const bg = STATUS_BG[day.status] || '#f8fafc';
                                        const d = new Date(day.date);
                                        return (
                                            <Tooltip key={idx} title={`${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}: ${STATUS_LABELS[day.status] || day.status}`}>
                                                <Box
                                                    sx={{
                                                        textAlign: 'center',
                                                        p: 1.5,
                                                        borderRadius: 2.5,
                                                        bgcolor: bg,
                                                        border: `2px solid ${color}40`,
                                                        transition: 'transform 0.2s',
                                                        '&:hover': { transform: 'translateY(-2px)' }
                                                    }}
                                                >
                                                    <Typography variant="caption" color="text.secondary" display="block" fontWeight={600} noWrap>
                                                        {d.toLocaleDateString('en-US', { weekday: 'short' })}
                                                    </Typography>
                                                    <Typography
                                                        variant="h5"
                                                        fontWeight={800}
                                                        sx={{ color, my: 0.5, lineHeight: 1 }}
                                                    >
                                                        {getStatusLabel(day.status)}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                        {d.getDate()}
                                                    </Typography>
                                                </Box>
                                            </Tooltip>
                                        );
                                    }) : (
                                        Array.from({ length: 7 }).map((_, idx) => (
                                            <Box key={idx} sx={{ textAlign: 'center', p: 1.5, borderRadius: 2.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                                <Typography variant="caption" color="text.secondary">-</Typography>
                                                <Typography variant="h5" fontWeight={700} color="text.disabled" sx={{ my: 0.5 }}>-</Typography>
                                                <Typography variant="caption" color="text.secondary">-</Typography>
                                            </Box>
                                        ))
                                    )}
                                </Box>
                            </CardContent>
                        </Card>

                        {/* Attendance Progress Bar */}
                        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
                            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2" color="text.secondary" fontWeight={600}>
                                        Overall Attendance Progress
                                    </Typography>
                                    <Typography variant="body2" fontWeight={700} color="#1e293b">
                                        {presentDays} / {totalDays} days ({percentage}%)
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={Math.min(pctNumber, 100)}
                                    sx={{
                                        height: 12,
                                        borderRadius: 6,
                                        bgcolor: '#f1f5f9',
                                        '& .MuiLinearProgress-bar': {
                                            borderRadius: 6,
                                            bgcolor: percentageColor,
                                        },
                                    }}
                                />
                                {pctNumber < 75 && pctNumber > 0 && (
                                    <Typography variant="caption" color="error.main" fontWeight={600} sx={{ mt: 1, display: 'block' }}>
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
