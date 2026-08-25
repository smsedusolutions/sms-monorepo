import React, { useState, useMemo } from 'react';
import {
    Box, Typography, Paper, Card, CardContent, Chip, CircularProgress, Alert,
    ToggleButton, ToggleButtonGroup, Grid, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Button, ButtonGroup, Stack,
    FormControl, InputLabel, Select, MenuItem, Divider, LinearProgress, Tooltip,
} from '@mui/material';
import {
    CalendarMonth as CalendarIcon,
    ViewList as ListIcon,
    CheckCircle as PresentIcon,
    Cancel as AbsentIcon,
    Schedule as LateIcon,
    PictureAsPdf as PdfIcon,
    TableChart as ExcelIcon,
    LocalFireDepartment as StreakIcon,
    TrendingUp as TrendIcon,
    FilterList as FilterIcon,
} from '@mui/icons-material';
import DonutChart from '../../../components/Charts/DonutChart';
import SVGBarChart from '../../../components/Charts/SVGBarChart';
import SVGAreaChart from '../../../components/Charts/SVGAreaChart';
import { useGetSimpleStudentAttendance } from '../../../queries/Attendance';
import TokenService from '../../../queries/token/tokenService';
import { AppDatePicker } from '../../../components/shared/AppDatePicker';
import { format, isValid } from 'date-fns';
import { exportAttendancePDF, exportAttendanceExcel } from '../../../utils/attendanceExport';
import type { AttendanceRecord as ExportRecord, AttendanceSummaryData } from '../../../utils/attendanceExport';

type ViewMode = 'calendar' | 'list';
type FilterMode = 'monthly' | 'range';
type StatusFilter = 'all' | 'present' | 'absent' | 'late' | 'half_day' | 'leave';

const STATUS_COLORS: Record<string, string> = {
    present: '#10b981', absent: '#ef4444', late: '#f59e0b',
    half_day: '#3b82f6', leave: '#8b5cf6',
};
const STATUS_BG: Record<string, string> = {
    present: '#ecfdf5', absent: '#fef2f2', late: '#fffbeb',
    half_day: '#eff6ff', leave: '#f5f3ff',
};
const STATUS_LABELS: Record<string, string> = {
    present: 'Present', absent: 'Absent', late: 'Late', half_day: 'Half Day', leave: 'Leave',
};
const MONTHS = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' },
];

const AttendanceHistory: React.FC = () => {
    const [viewMode, setViewMode] = useState<ViewMode>('calendar');
    const [filterMode, setFilterMode] = useState<FilterMode>('monthly');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);

    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [startDate, setStartDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(now.toISOString().split('T')[0]);

    const schoolId = TokenService.getSchoolId() || '';
    const studentId = TokenService.getStudentId() || '';
    const user = TokenService.getUser();

    const queryStartDate = filterMode === 'monthly'
        ? new Date(selectedYear, selectedMonth - 1, 1).toISOString().split('T')[0]
        : startDate;
    const queryEndDate = filterMode === 'monthly'
        ? new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0]
        : endDate;

    const { data, isLoading, error } = useGetSimpleStudentAttendance(
        schoolId, studentId, queryStartDate, queryEndDate
    );

    const rawAttendance = (data?.data?.attendance || []) as ExportRecord[];
    const summary = data?.data?.summary;

    const attendance = useMemo(() => {
        if (statusFilter === 'all') return rawAttendance;
        return rawAttendance.filter(r => r.status === statusFilter);
    }, [rawAttendance, statusFilter]);

    // Calendar data
    const year = filterMode === 'monthly' ? selectedYear : new Date(queryStartDate).getFullYear();
    const month = filterMode === 'monthly' ? selectedMonth : new Date(queryStartDate).getMonth() + 1;

    const attendanceMap = useMemo(() => {
        const map: Record<string, string> = {};
        rawAttendance.forEach(a => {
            const dateStr = new Date(a.date).toISOString().split('T')[0];
            map[dateStr] = a.status;
        });
        return map;
    }, [rawAttendance]);

    const calendarDays = useMemo(() => {
        const daysInMonth = new Date(year, month, 0).getDate();
        const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
        const days: { date: number | null; dateStr: string; status?: string }[] = [];
        for (let i = 0; i < firstDayOfWeek; i++) days.push({ date: null, dateStr: '' });
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            days.push({ date: d, dateStr, status: attendanceMap[dateStr] });
        }
        return days;
    }, [year, month, attendanceMap]);

    // Streak
    const { currentStreak, longestStreak } = useMemo(() => {
        const sorted = [...rawAttendance].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        let cur = 0, longest = 0, streak = 0;
        sorted.forEach(r => {
            if (r.status === 'present' || r.status === 'late') { streak++; if (streak > longest) longest = streak; }
            else streak = 0;
        });
        for (let i = sorted.length - 1; i >= 0; i--) {
            if (sorted[i].status === 'present' || sorted[i].status === 'late') cur++;
            else break;
        }
        return { currentStreak: cur, longestStreak: longest };
    }, [rawAttendance]);

    // Week-by-week
    const weeklyData = useMemo(() => {
        const sorted = [...rawAttendance].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const weeks: { label: string; present: number; absent: number; late: number }[] = [];
        let weekIdx = 0, weekStart: Date | null = null;
        sorted.forEach(r => {
            const d = new Date(r.date);
            if (!weekStart || (d.getTime() - weekStart.getTime()) >= 7 * 86400000) {
                weekStart = d; weekIdx++;
                weeks.push({ label: `W${weekIdx}`, present: 0, absent: 0, late: 0 });
            }
            const w = weeks[weeks.length - 1];
            if (r.status === 'present') w.present++;
            else if (r.status === 'absent') w.absent++;
            else if (r.status === 'late') w.late++;
        });
        return weeks;
    }, [rawAttendance]);

    // Day-of-week heatmap
    const dayOfWeekData = useMemo(() => {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        const counts: Record<string, { present: number; total: number }> = {};
        days.forEach(d => { counts[d] = { present: 0, total: 0 }; });
        rawAttendance.forEach(r => {
            const d = new Date(r.date);
            const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
            if (counts[day]) { counts[day].total++; if (r.status === 'present' || r.status === 'late') counts[day].present++; }
        });
        return days.map(d => ({ day: d, rate: counts[d].total > 0 ? Math.round((counts[d].present / counts[d].total) * 100) : 0, total: counts[d].total }));
    }, [rawAttendance]);

    const pct = summary?.total ? (((summary.present || 0) + (summary.late || 0)) / summary.total * 100) : 0;
    const pctStr = pct.toFixed(1);
    const percentageColor = pct >= 90 ? '#10b981' : pct >= 75 ? '#f59e0b' : '#ef4444';

    const dateRangeLabel = filterMode === 'monthly'
        ? `${MONTHS.find(m => m.value === selectedMonth)?.label} ${selectedYear}`
        : `${new Date(queryStartDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} – ${new Date(queryEndDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;

    const handleExportPDF = () => {
        setExporting('pdf');
        try {
            exportAttendancePDF(rawAttendance, {
                total: summary?.total || 0, present: summary?.present || 0, absent: summary?.absent || 0,
                late: summary?.late || 0, percentage: pctStr,
            } as AttendanceSummaryData, {
                studentName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Student',
                className: user?.className, sectionName: user?.sectionName, rollNumber: user?.rollNumber,
                dateRangeLabel,
            });
        } finally { setExporting(null); }
    };

    const handleExportExcel = async () => {
        setExporting('excel');
        try {
            await exportAttendanceExcel(rawAttendance, {
                total: summary?.total || 0, present: summary?.present || 0, absent: summary?.absent || 0,
                late: summary?.late || 0, percentage: pctStr,
            } as AttendanceSummaryData, {
                studentName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Student',
                className: user?.className, sectionName: user?.sectionName, rollNumber: user?.rollNumber,
                dateRangeLabel,
            });
        } finally { setExporting(null); }
    };

    const barData = [
        ['Week', 'Present', 'Absent', 'Late'],
        ...weeklyData.map(w => [w.label, w.present, w.absent, w.late]),
    ];
    const lineData = useMemo(() => {
        const sorted = [...rawAttendance].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const rows: (string | number)[][] = [['Date', 'Attendance']];
        sorted.forEach(r => {
            const d = new Date(r.date);
            rows.push([d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), r.status === 'present' ? 1 : r.status === 'late' ? 0.5 : 0]);
        });
        return rows;
    }, [rawAttendance]);

    const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

    return (
        <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, mb: { xs: 2, sm: 2.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CalendarIcon sx={{ color: '#2563eb', fontSize: { xs: 22, sm: 26 } }} />
                    </Box>
                    <Box>
                        <Typography variant="h4" fontWeight={800} color="#1e293b" sx={{ fontSize: { xs: '1.35rem', sm: '1.75rem' }, letterSpacing: '-0.02em', lineHeight: 1.2 }}>Attendance History</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.825rem' } }}>{dateRangeLabel}</Typography>
                    </Box>
                </Box>
                <ButtonGroup variant="contained" size="small" disableElevation sx={{ width: { xs: '100%', sm: 'auto' } }}>
                    <Button startIcon={<PdfIcon sx={{ fontSize: 15 }} />} onClick={handleExportPDF}
                        disabled={!rawAttendance.length || exporting === 'pdf'}
                        sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' }, borderRadius: '6px 0 0 6px', fontWeight: 600, fontSize: '0.72rem', py: 0.4, flex: 1 }}>
                        {exporting === 'pdf' ? '...' : 'Export PDF'}
                    </Button>
                    <Button startIcon={<ExcelIcon sx={{ fontSize: 15 }} />} onClick={handleExportExcel}
                        disabled={!rawAttendance.length || exporting === 'excel'}
                        sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' }, borderRadius: '0 6px 6px 0', fontWeight: 600, fontSize: '0.72rem', py: 0.4, flex: 1 }}>
                        {exporting === 'excel' ? '...' : 'Export Excel'}
                    </Button>
                </ButtonGroup>
            </Box>

            {/* Filter Bar */}
            <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, mb: { xs: 2, sm: 2.5 }, borderRadius: 2.5, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.25 }}>
                    <FilterIcon sx={{ color: '#64748b', fontSize: 16 }} />
                    <Typography variant="caption" fontWeight={700} color="#475569" sx={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Filters</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25, alignItems: 'center' }}>
                    <ToggleButtonGroup value={filterMode} exclusive onChange={(_, v) => v && setFilterMode(v)} size="small"
                        sx={{ bgcolor: '#fff', border: '1px solid #e2e8f0', borderRadius: 2, height: 32 }}>
                        <ToggleButton value="monthly" sx={{ px: 1.5, fontWeight: 600, fontSize: '0.72rem' }}>Monthly</ToggleButton>
                        <ToggleButton value="range" sx={{ px: 1.5, fontWeight: 600, fontSize: '0.72rem' }}>Date Range</ToggleButton>
                    </ToggleButtonGroup>

                    {filterMode === 'monthly' ? (
                        <>
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                                <InputLabel sx={{ fontSize: '0.8rem' }}>Month</InputLabel>
                                <Select value={selectedMonth} label="Month" onChange={e => setSelectedMonth(Number(e.target.value))} sx={{ height: 32, fontSize: '0.8rem' }}>
                                    {MONTHS.map(m => <MenuItem key={m.value} value={m.value} sx={{ fontSize: '0.8rem' }}>{m.label}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <FormControl size="small" sx={{ minWidth: 85 }}>
                                <InputLabel sx={{ fontSize: '0.8rem' }}>Year</InputLabel>
                                <Select value={selectedYear} label="Year" onChange={e => setSelectedYear(Number(e.target.value))} sx={{ height: 32, fontSize: '0.8rem' }}>
                                    {years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </>
                    ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: '0.72rem' }}>From</Typography>
                                <AppDatePicker
                                    value={startDate ? new Date(startDate) : null}
                                    onChange={(date: Date | null) => setStartDate(date && isValid(date) ? format(date, 'yyyy-MM-dd') : '')}
                                    maxDate={endDate ? new Date(endDate) : undefined}
                                    disableMargin
                                    fullWidth={false}
                                    inputSx={{
                                        '& .MuiInputBase-input': {
                                            py: 0.5,
                                            px: 1,
                                            fontSize: '0.8rem',
                                            height: 20,
                                        },
                                        height: 32,
                                        width: 145,
                                    }}
                                />
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: '0.72rem' }}>To</Typography>
                                <AppDatePicker
                                    value={endDate ? new Date(endDate) : null}
                                    onChange={(date: Date | null) => setEndDate(date && isValid(date) ? format(date, 'yyyy-MM-dd') : '')}
                                    minDate={startDate ? new Date(startDate) : undefined}
                                    maxDate={now}
                                    disableMargin
                                    fullWidth={false}
                                    inputSx={{
                                        '& .MuiInputBase-input': {
                                            py: 0.5,
                                            px: 1,
                                            fontSize: '0.8rem',
                                            height: 20,
                                        },
                                        height: 32,
                                        width: 145,
                                    }}
                                />
                            </Box>
                        </Box>
                    )}

                    <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
                        {(['all', 'present', 'absent', 'late', 'half_day', 'leave'] as StatusFilter[]).map(s => (
                            <Chip key={s} label={s === 'all' ? 'All' : STATUS_LABELS[s]} size="small"
                                onClick={() => setStatusFilter(s)}
                                sx={{
                                    fontWeight: 600, fontSize: '0.68rem', height: 24, cursor: 'pointer',
                                    bgcolor: statusFilter === s ? (s === 'all' ? '#2563eb' : STATUS_COLORS[s]) : 'white',
                                    color: statusFilter === s ? '#fff' : '#64748b',
                                    border: '1px solid', borderColor: statusFilter === s ? (s === 'all' ? '#2563eb' : STATUS_COLORS[s]) : '#e2e8f0',
                                    '&:hover': { opacity: 0.85 },
                                }} />
                        ))}
                    </Box>

                    <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

                    <ToggleButtonGroup value={viewMode} exclusive onChange={(_, val) => val && setViewMode(val)} size="small"
                        sx={{ bgcolor: '#fff', border: '1px solid #e2e8f0', borderRadius: 2, height: 32 }}>
                        <ToggleButton value="calendar" sx={{ px: 1.5, fontWeight: 600, fontSize: '0.72rem' }}>
                            <CalendarIcon sx={{ mr: 0.5, fontSize: 15 }} /> Calendar
                        </ToggleButton>
                        <ToggleButton value="list" sx={{ px: 1.5, fontWeight: 600, fontSize: '0.72rem' }}>
                            <ListIcon sx={{ mr: 0.5, fontSize: 15 }} /> List
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            </Paper>

            {/* Summary Stat Cards - 2x2 on mobile */}
            <Grid container spacing={{ xs: 1, sm: 1.5 }} sx={{ mb: { xs: 2, sm: 2.5 } }}>
                {[
                    { label: 'Present', value: summary?.present || 0, color: '#10b981', bg: '#ecfdf5', icon: <PresentIcon /> },
                    { label: 'Absent', value: summary?.absent || 0, color: '#ef4444', bg: '#fef2f2', icon: <AbsentIcon /> },
                    { label: 'Late', value: summary?.late || 0, color: '#f59e0b', bg: '#fffbeb', icon: <LateIcon /> },
                    { label: 'Attendance', value: `${pctStr}%`, color: percentageColor, bg: pct >= 90 ? '#ecfdf5' : pct >= 75 ? '#fffbeb' : '#fef2f2', icon: <TrendIcon /> },
                ].map(stat => (
                    <Grid size={{ xs: 6, sm: 3 }} key={stat.label}>
                        <Card elevation={0} sx={{ borderRadius: 2.5, border: `1px solid ${stat.color}25`, bgcolor: stat.bg, height: '100%' }}>
                            <CardContent sx={{ p: { xs: 1.25, sm: 1.5 }, '&:last-child': { pb: { xs: 1.25, sm: 1.5 } } }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>{stat.label}</Typography>
                                    <Box sx={{ color: stat.color, display: 'flex' }}>{React.cloneElement(stat.icon, { sx: { fontSize: 18 } })}</Box>
                                </Box>
                                <Typography variant="h5" fontWeight={800} sx={{ color: stat.color, lineHeight: 1, fontSize: { xs: '1.25rem', sm: '1.6rem' } }}>{stat.value}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Attendance % bar + Streaks */}
            <Grid container spacing={{ xs: 1, sm: 1.5 }} sx={{ mb: { xs: 2, sm: 2.5 } }}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', p: { xs: 1.5, sm: 2 }, bgcolor: '#ffffff' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>Attendance Rate</Typography>
                            <Box sx={{ px: 1.5, py: 0.25, borderRadius: 20, bgcolor: percentageColor + '18', color: percentageColor }}>
                                <Typography variant="subtitle1" fontWeight={800} sx={{ fontSize: '0.9rem' }}>{pctStr}%</Typography>
                            </Box>
                        </Box>
                        <LinearProgress variant="determinate" value={Math.min(pct, 100)}
                            sx={{ height: 8, borderRadius: 4, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { bgcolor: percentageColor, borderRadius: 4 } }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>0%</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Target: 90%</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>100%</Typography>
                        </Box>
                        {pct < 75 && pct > 0 && (
                            <Alert severity="warning" sx={{ mt: 1, py: 0.25, borderRadius: 1.5, fontSize: '0.72rem' }}>
                                Attendance is below 75%. Please ensure regular attendance.
                            </Alert>
                        )}
                    </Card>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                    <Card elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #fde68a', bgcolor: '#fffbeb', p: { xs: 1.25, sm: 1.75 }, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                        <StreakIcon sx={{ color: '#f59e0b', fontSize: 24, mb: 0.5 }} />
                        <Typography variant="h6" fontWeight={800} color="#92400e" sx={{ fontSize: { xs: '1.1rem', sm: '1.35rem' }, lineHeight: 1 }}>{currentStreak}</Typography>
                        <Typography variant="caption" fontWeight={700} color="#a16207" sx={{ fontSize: '0.68rem', mt: 0.25 }}>Current Streak</Typography>
                    </Card>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                    <Card elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #bbf7d0', bgcolor: '#f0fdf4', p: { xs: 1.25, sm: 1.75 }, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                        <TrendIcon sx={{ color: '#10b981', fontSize: 24, mb: 0.5 }} />
                        <Typography variant="h6" fontWeight={800} color="#065f46" sx={{ fontSize: { xs: '1.1rem', sm: '1.35rem' }, lineHeight: 1 }}>{longestStreak}</Typography>
                        <Typography variant="caption" fontWeight={700} color="#047857" sx={{ fontSize: '0.68rem', mt: 0.25 }}>Best Streak</Typography>
                    </Card>
                </Grid>
            </Grid>

            {/* Charts */}
            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
            ) : error ? (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>Failed to load attendance data</Alert>
            ) : (
                <>
                    <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 2, sm: 2.5 } }}>
                        <Grid size={{ xs: 12, md: 5 }}>
                            <Card elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', p: { xs: 1.5, sm: 2 }, bgcolor: '#ffffff' }}>
                                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, fontSize: '0.85rem' }}>Attendance Breakdown</Typography>
                                {rawAttendance.length === 0 ? (
                                    <Box sx={{ textAlign: 'center', py: 4 }}><Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>No data available</Typography></Box>
                                ) : (
                                    <DonutChart
                                        segments={[
                                            { label: 'Present',  value: summary?.present  || 0, color: '#10b981' },
                                            { label: 'Absent',   value: summary?.absent   || 0, color: '#ef4444' },
                                            { label: 'Late',     value: summary?.late     || 0, color: '#f59e0b' },
                                            { label: 'Half Day', value: summary?.halfDay  || 0, color: '#3b82f6' },
                                            { label: 'Leave',    value: summary?.leave    || 0, color: '#8b5cf6' },
                                        ]}
                                        size={160}
                                        holeRatio={0.55}
                                        showLegend
                                    />
                                )}
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 12, md: 7 }}>
                            <Card elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', p: { xs: 1.5, sm: 2 }, bgcolor: '#ffffff' }}>
                                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, fontSize: '0.85rem' }}>Week-by-Week Breakdown</Typography>
                                {weeklyData.length === 0 ? (
                                    <Box sx={{ textAlign: 'center', py: 4 }}><Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>No data available</Typography></Box>
                                ) : (
                                    <SVGBarChart
                                        data={barData}
                                        colors={['#10b981', '#ef4444', '#f59e0b']}
                                        height={180}
                                    />
                                )}
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 12, md: 5 }}>
                            <Card elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', p: { xs: 1.5, sm: 2 }, bgcolor: '#ffffff' }}>
                                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, fontSize: '0.85rem' }}>Day-of-Week Attendance Rate</Typography>
                                <Stack spacing={1}>
                                    {dayOfWeekData.map(d => (
                                        <Box key={d.day} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Typography variant="caption" fontWeight={600} sx={{ width: 32, color: '#475569', fontSize: '0.75rem' }}>{d.day}</Typography>
                                            <Box sx={{ flex: 1, position: 'relative', height: 16, borderRadius: 8, bgcolor: '#f1f5f9', overflow: 'hidden' }}>
                                                <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${d.rate}%`, borderRadius: 8, bgcolor: d.rate >= 90 ? '#10b981' : d.rate >= 75 ? '#f59e0b' : '#ef4444', transition: 'width 0.6s ease' }} />
                                            </Box>
                                            <Typography variant="caption" fontWeight={700} sx={{ width: 36, textAlign: 'right', fontSize: '0.75rem', color: d.rate >= 90 ? '#10b981' : d.rate >= 75 ? '#f59e0b' : '#ef4444' }}>
                                                {d.total > 0 ? `${d.rate}%` : '—'}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 12, md: 7 }}>
                            <Card elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', p: { xs: 1.5, sm: 2 }, bgcolor: '#ffffff' }}>
                                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, fontSize: '0.85rem' }}>Daily Attendance Trend</Typography>
                                {rawAttendance.length < 2 ? (
                                    <Box sx={{ textAlign: 'center', py: 4 }}><Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>Not enough data</Typography></Box>
                                ) : (
                                    <SVGAreaChart
                                        data={lineData}
                                        colors={['#6366f1']}
                                        height={180}
                                        filled
                                        yMin={0}
                                        yMax={1}
                                    />
                                )}
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Main Content: Calendar or List */}
                    {viewMode === 'calendar' ? (
                        <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2.5 }, borderRadius: 2.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                            <Typography variant="subtitle1" sx={{ mb: 1.5, textAlign: 'center', fontWeight: 700, fontSize: { xs: '0.9rem', sm: '1.05rem' } }}>
                                {MONTHS.find(m => m.value === month)?.label} {year}
                            </Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 0.75 }}>
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                    <Box key={day} sx={{ textAlign: 'center', fontWeight: 700, color: '#64748b', py: 0.5, fontSize: { xs: 11, sm: 13 } }}>{day}</Box>
                                ))}
                            </Box>
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
                                {calendarDays.map((day, idx) => {
                                    const color = day.status ? STATUS_COLORS[day.status] : 'transparent';
                                    const bg = day.status ? STATUS_BG[day.status] : 'transparent';
                                    return (
                                        <Tooltip key={idx} title={day.status ? `${day.dateStr}: ${STATUS_LABELS[day.status] || day.status}` : ''}>
                                            <Box sx={{
                                                aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                borderRadius: 1.5, bgcolor: bg, border: day.date ? '1px solid' : 'none',
                                                borderColor: day.status ? color + '50' : '#e2e8f0',
                                                fontWeight: day.status ? 700 : 400, color: day.status ? color : '#1e293b',
                                                fontSize: { xs: 10, sm: 12 }, cursor: day.status ? 'pointer' : 'default',
                                                transition: 'transform 0.1s', '&:hover': day.status ? { transform: 'scale(1.08)' } : {},
                                            }}>
                                                {day.date}
                                            </Box>
                                        </Tooltip>
                                    );
                                })}
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 1, sm: 2 }, mt: 2, flexWrap: 'wrap' }}>
                                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                                    <Box key={k} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: STATUS_COLORS[k] }} />
                                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: '0.68rem' }}>{v}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Paper>
                    ) : (
                        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff', overflowX: 'auto' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                        <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 1 }}>Date</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 1 }}>Day</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 1 }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 1 }}>Remarks</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {attendance.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center" sx={{ py: 4, color: '#94a3b8', fontSize: '0.8rem' }}>
                                                No records for this period
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        [...attendance].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((record, i) => {
                                            const date = new Date(record.date);
                                            const color = STATUS_COLORS[record.status] || '#64748b';
                                            const bg = STATUS_BG[record.status] || '#f8fafc';
                                            return (
                                                <TableRow key={i} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                                                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 0.75 }}>{date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</TableCell>
                                                    <TableCell sx={{ color: '#64748b', fontSize: '0.75rem', py: 0.75 }}>{date.toLocaleDateString('en-IN', { weekday: 'short' })}</TableCell>
                                                    <TableCell sx={{ py: 0.75 }}>
                                                        <Chip size="small" label={STATUS_LABELS[record.status] || record.status}
                                                            sx={{ bgcolor: bg, color, fontWeight: 700, border: `1px solid ${color}30`, minWidth: 65, height: 22, fontSize: '0.68rem' }} />
                                                    </TableCell>
                                                    <TableCell sx={{ color: '#64748b', fontStyle: record.remarks ? 'normal' : 'italic', fontSize: '0.75rem', py: 0.75 }}>
                                                        {record.remarks || '—'}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}

                    {/* Export bottom bar */}
                    {rawAttendance.length > 0 && (
                        <Box sx={{ mt: 2.5, p: 2, borderRadius: 2.5, bgcolor: '#f0f9ff', border: '1px solid #bae6fd', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
                            <Box>
                                <Typography variant="subtitle2" fontWeight={700} color="#0c4a6e" sx={{ fontSize: '0.85rem' }}>Export Attendance Report</Typography>
                                <Typography variant="caption" color="#0369a1" sx={{ fontSize: '0.72rem' }}>Download as PDF or Excel format</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button variant="contained" size="small" startIcon={<PdfIcon sx={{ fontSize: 15 }} />} onClick={handleExportPDF}
                                    disabled={exporting === 'pdf'}
                                    sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' }, borderRadius: 2, fontWeight: 700, fontSize: '0.72rem', py: 0.4 }}>
                                    {exporting === 'pdf' ? '...' : 'PDF Report'}
                                </Button>
                                <Button variant="contained" size="small" startIcon={<ExcelIcon sx={{ fontSize: 15 }} />} onClick={handleExportExcel}
                                    disabled={exporting === 'excel'}
                                    sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' }, borderRadius: 2, fontWeight: 700, fontSize: '0.72rem', py: 0.4 }}>
                                    {exporting === 'excel' ? '...' : 'Excel Report'}
                                </Button>
                            </Box>
                        </Box>
                    )}
                </>
            )}
        </Box>
    );
};

export default AttendanceHistory;
