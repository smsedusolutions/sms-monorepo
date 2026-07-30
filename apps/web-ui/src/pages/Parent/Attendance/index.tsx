import React, { useState, useMemo } from 'react';
import {
    Box, Typography, Card, CardContent, Grid, Chip, Alert, Skeleton,
    LinearProgress, ToggleButton, ToggleButtonGroup, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Button, ButtonGroup,
    FormControl, InputLabel, Select, MenuItem, Divider, Paper, Stack,
    Tooltip,
} from '@mui/material';
import {
    CalendarMonth as CalendarIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    AccessTime as AccessTimeIcon,
    PictureAsPdf as PdfIcon,
    TableChart as ExcelIcon,
    LocalFireDepartment as StreakIcon,
    TrendingUp as TrendIcon,
    Download as DownloadIcon,
    FilterList as FilterIcon,
} from '@mui/icons-material';
import { Chart } from 'react-google-charts';
import { useChildSelector } from '../../../context/ChildSelectorContext';
import { useGetChildAttendance } from '../../../queries/ParentPortal';
import TokenService from '../../../queries/token/tokenService';
import { exportAttendancePDF, exportAttendanceExcel } from '../../../utils/attendanceExport';
import type { AttendanceRecord, AttendanceSummaryData } from '../../../utils/attendanceExport';

type FilterMode = 'monthly' | 'range';
type StatusFilter = 'all' | 'present' | 'absent' | 'late' | 'half_day' | 'leave';

const MONTHS = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' },
];

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

const ParentAttendance: React.FC = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const user = TokenService.getUser();
    const { selectedChild, isLoading: loadingChild } = useChildSelector();

    const now = new Date();
    const [filterMode, setFilterMode] = useState<FilterMode>('monthly');
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [startDate, setStartDate] = useState(
        new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    );
    const [endDate, setEndDate] = useState(now.toISOString().split('T')[0]);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);

    const queryFilters = useMemo(() => {
        if (filterMode === 'monthly') return { month: selectedMonth, year: selectedYear };
        return { startDate, endDate };
    }, [filterMode, selectedMonth, selectedYear, startDate, endDate]);

    const { data, isLoading, error } = useGetChildAttendance(
        schoolId,
        selectedChild?.studentId || '',
        queryFilters
    );

    const attendanceData = data?.data;
    const summary = attendanceData?.summary;
    const rawAttendance: AttendanceRecord[] = (attendanceData?.attendance || []) as AttendanceRecord[];

    // Apply status filter
    const attendance = useMemo(() => {
        if (statusFilter === 'all') return rawAttendance;
        return rawAttendance.filter(r => r.status === statusFilter);
    }, [rawAttendance, statusFilter]);

    // Streak calculation
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
        // current streak (from end)
        for (let i = sorted.length - 1; i >= 0; i--) {
            if (sorted[i].status === 'present' || sorted[i].status === 'late') cur++;
            else break;
        }
        return { currentStreak: cur, longestStreak: longest };
    }, [rawAttendance]);

    // Week-by-week breakdown for bar chart
    const weeklyData = useMemo(() => {
        const sorted = [...rawAttendance].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const weeks: { label: string; present: number; absent: number; late: number }[] = [];
        let weekIdx = 0;
        let weekStart: Date | null = null;

        sorted.forEach(r => {
            const d = new Date(r.date);
            if (!weekStart || (d.getTime() - weekStart.getTime()) >= 7 * 86400000) {
                weekStart = d;
                weekIdx++;
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
            if (counts[day]) {
                counts[day].total++;
                if (r.status === 'present' || r.status === 'late') counts[day].present++;
            }
        });
        return days.map(d => ({
            day: d,
            rate: counts[d].total > 0 ? Math.round((counts[d].present / counts[d].total) * 100) : 0,
            total: counts[d].total,
        }));
    }, [rawAttendance]);

    const pct = parseFloat(String(summary?.percentage || '0'));
    const percentageColor = pct >= 90 ? '#10b981' : pct >= 75 ? '#f59e0b' : '#ef4444';

    const dateRangeLabel = filterMode === 'monthly'
        ? `${MONTHS.find(m => m.value === selectedMonth)?.label} ${selectedYear}`
        : `${new Date(startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} – ${new Date(endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;

    const handleExportPDF = async () => {
        setExporting('pdf');
        try {
            exportAttendancePDF(rawAttendance, {
                total: summary?.total || 0,
                present: summary?.present || 0,
                absent: summary?.absent || 0,
                late: summary?.late || 0,
                halfDay: summary?.halfDay ?? 0,
                leave: summary?.leave ?? 0,
                percentage: summary?.percentage || 0,
            } as AttendanceSummaryData, {
                studentName: selectedChild ? `${selectedChild.firstName} ${selectedChild.lastName}` : 'Student',
                className: selectedChild?.className,
                sectionName: selectedChild?.sectionName,
                rollNumber: selectedChild?.rollNumber,
                schoolName: user?.schoolName,
                dateRangeLabel,
            });
        } finally { setExporting(null); }
    };

    const handleExportExcel = async () => {
        setExporting('excel');
        try {
            await exportAttendanceExcel(rawAttendance, {
                total: summary?.total || 0,
                present: summary?.present || 0,
                absent: summary?.absent || 0,
                late: summary?.late || 0,
                halfDay: summary?.halfDay ?? 0,
                leave: summary?.leave ?? 0,
                percentage: summary?.percentage || 0,
            } as AttendanceSummaryData, {
                studentName: selectedChild ? `${selectedChild.firstName} ${selectedChild.lastName}` : 'Student',
                className: selectedChild?.className,
                sectionName: selectedChild?.sectionName,
                rollNumber: selectedChild?.rollNumber,
                schoolName: user?.schoolName,
                dateRangeLabel,
            });
        } finally { setExporting(null); }
    };

    // Google Charts data
    const donutData = [
        ['Status', 'Days'],
        ['Present', summary?.present || 0],
        ['Absent', summary?.absent || 0],
        ['Late', summary?.late || 0],
        ['Half Day', summary?.halfDay || 0],
        ['Leave', summary?.leave || 0],
    ];

    const barData = [
        ['Week', 'Present', 'Absent', 'Late'],
        ...weeklyData.map(w => [w.label, w.present, w.absent, w.late]),
    ];

    const lineData = useMemo(() => {
        const sorted = [...rawAttendance].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const rows: (string | number)[][] = [['Date', 'Attendance (1=Present, 0=Absent)']];
        sorted.forEach(r => {
            const d = new Date(r.date);
            rows.push([d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), r.status === 'present' ? 1 : r.status === 'late' ? 0.5 : 0]);
        });
        return rows;
    }, [rawAttendance]);

    if (loadingChild) {
        return (
            <Box sx={{ p: 3 }}>
                <Skeleton variant="text" width="40%" height={40} sx={{ mb: 2 }} />
                <Skeleton variant="rectangular" width="100%" height={400} sx={{ borderRadius: 3 }} />
            </Box>
        );
    }

    if (!selectedChild) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="info">Please select a child to view their attendance.</Alert>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Failed to load attendance data. Please try again later.</Alert>
            </Box>
        );
    }

    const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1400, mx: 'auto' }}>
            {/* Page Header */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#eff6ff' }}>
                        <CalendarIcon sx={{ color: '#2563eb', fontSize: 28 }} />
                    </Box>
                    <Box>
                        <Typography variant="h4" fontWeight={800} color="#1e293b">Attendance</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {selectedChild.firstName}'s attendance report — {dateRangeLabel}
                        </Typography>
                    </Box>
                </Box>
                <ButtonGroup variant="contained" size="small" disableElevation>
                    <Button
                        startIcon={<PdfIcon />}
                        onClick={handleExportPDF}
                        disabled={!rawAttendance.length || exporting === 'pdf'}
                        sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' } }}
                    >
                        {exporting === 'pdf' ? 'Generating…' : 'Export PDF'}
                    </Button>
                    <Button
                        startIcon={<ExcelIcon />}
                        onClick={handleExportExcel}
                        disabled={!rawAttendance.length || exporting === 'excel'}
                        sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}
                    >
                        {exporting === 'excel' ? 'Generating…' : 'Export Excel'}
                    </Button>
                </ButtonGroup>
            </Box>

            {/* ── Filter Bar ── */}
            <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <FilterIcon sx={{ color: '#64748b', fontSize: 18 }} />
                    <Typography variant="subtitle2" fontWeight={700} color="#475569">Filters</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                    {/* Mode toggle */}
                    <ToggleButtonGroup
                        value={filterMode}
                        exclusive
                        onChange={(_, v) => v && setFilterMode(v)}
                        size="small"
                        sx={{ bgcolor: '#fff', border: '1px solid #e2e8f0', borderRadius: 2 }}
                    >
                        <ToggleButton value="monthly" sx={{ px: 2, fontWeight: 600 }}>Monthly</ToggleButton>
                        <ToggleButton value="range" sx={{ px: 2, fontWeight: 600 }}>Date Range</ToggleButton>
                    </ToggleButtonGroup>

                    {filterMode === 'monthly' ? (
                        <>
                            <FormControl size="small" sx={{ minWidth: 140 }}>
                                <InputLabel>Month</InputLabel>
                                <Select value={selectedMonth} label="Month" onChange={e => setSelectedMonth(Number(e.target.value))}>
                                    {MONTHS.map(m => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <FormControl size="small" sx={{ minWidth: 100 }}>
                                <InputLabel>Year</InputLabel>
                                <Select value={selectedYear} label="Year" onChange={e => setSelectedYear(Number(e.target.value))}>
                                    {years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </>
                    ) : (
                        <>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>From</Typography>
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                                    max={endDate}
                                    style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>To</Typography>
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                                    min={startDate} max={now.toISOString().split('T')[0]}
                                    style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
                            </Box>
                        </>
                    )}

                    <Divider orientation="vertical" flexItem />

                    {/* Status filter */}
                    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                        {(['all', 'present', 'absent', 'late', 'half_day', 'leave'] as StatusFilter[]).map(s => (
                            <Chip
                                key={s}
                                label={s === 'all' ? 'All' : STATUS_LABELS[s]}
                                size="small"
                                onClick={() => setStatusFilter(s)}
                                sx={{
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    bgcolor: statusFilter === s
                                        ? (s === 'all' ? '#2563eb' : STATUS_COLORS[s])
                                        : 'white',
                                    color: statusFilter === s ? '#fff' : '#64748b',
                                    border: '1px solid',
                                    borderColor: statusFilter === s
                                        ? (s === 'all' ? '#2563eb' : STATUS_COLORS[s])
                                        : '#e2e8f0',
                                    '&:hover': { opacity: 0.85 },
                                }}
                            />
                        ))}
                    </Box>
                </Box>
            </Paper>

            {isLoading ? (
                <Grid container spacing={3}>
                    {[1, 2, 3, 4].map(i => (
                        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                            <Skeleton variant="rectangular" height={110} sx={{ borderRadius: 3 }} />
                        </Grid>
                    ))}
                    <Grid size={{ xs: 12 }}>
                        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 3 }} />
                    </Grid>
                </Grid>
            ) : (
                <>
                    {/* ── Stat Cards ── */}
                    <Grid container spacing={2.5} sx={{ mb: 3 }}>
                        {[
                            { label: 'Present', value: summary?.present || 0, color: '#10b981', bg: '#ecfdf5', icon: <CheckCircleIcon /> },
                            { label: 'Absent', value: summary?.absent || 0, color: '#ef4444', bg: '#fef2f2', icon: <CancelIcon /> },
                            { label: 'Late', value: summary?.late || 0, color: '#f59e0b', bg: '#fffbeb', icon: <AccessTimeIcon /> },
                            { label: 'Total Days', value: summary?.total || 0, color: '#6366f1', bg: '#eef2ff', icon: <CalendarIcon /> },
                        ].map(stat => (
                            <Grid size={{ xs: 6, sm: 3 }} key={stat.label}>
                                <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: stat.bg, height: '100%' }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>{stat.label}</Typography>
                                            <Box sx={{ color: stat.color }}>{stat.icon}</Box>
                                        </Box>
                                        <Typography variant="h3" fontWeight={800} sx={{ color: stat.color, lineHeight: 1 }}>{stat.value}</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    {/* ── Attendance % + Streak Cards ── */}
                    <Grid container spacing={2.5} sx={{ mb: 3 }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', p: 2.5 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                    <Typography variant="subtitle1" fontWeight={700}>Attendance Rate</Typography>
                                    <Box sx={{ px: 2, py: 0.5, borderRadius: 20, bgcolor: percentageColor + '18', color: percentageColor }}>
                                        <Typography variant="h5" fontWeight={800}>{summary?.percentage || 0}%</Typography>
                                    </Box>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={Math.min(pct, 100)}
                                    sx={{ height: 12, borderRadius: 6, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { bgcolor: percentageColor, borderRadius: 6 } }}
                                />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                    <Typography variant="caption" color="text.secondary">0%</Typography>
                                    <Typography variant="caption" color="text.secondary">Target: 90%</Typography>
                                    <Typography variant="caption" color="text.secondary">100%</Typography>
                                </Box>
                                {pct < 75 && (
                                    <Alert severity="warning" sx={{ mt: 1.5, py: 0.5, borderRadius: 2 }}>
                                        Attendance is below 75%. Please ensure regular attendance.
                                    </Alert>
                                )}
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 6, md: 3 }}>
                            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #fde68a', bgcolor: '#fffbeb', p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                                <StreakIcon sx={{ color: '#f59e0b', fontSize: 36, mb: 1 }} />
                                <Typography variant="h4" fontWeight={800} color="#92400e">{currentStreak}</Typography>
                                <Typography variant="caption" fontWeight={600} color="#a16207">Current Streak</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>consecutive days</Typography>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 6, md: 3 }}>
                            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #bbf7d0', bgcolor: '#f0fdf4', p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                                <TrendIcon sx={{ color: '#10b981', fontSize: 36, mb: 1 }} />
                                <Typography variant="h4" fontWeight={800} color="#065f46">{longestStreak}</Typography>
                                <Typography variant="caption" fontWeight={600} color="#047857">Best Streak</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>in this period</Typography>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* ── Charts Row ── */}
                    <Grid container spacing={2.5} sx={{ mb: 3 }}>
                        {/* Donut Chart */}
                        <Grid size={{ xs: 12, md: 5 }}>
                            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', p: 2 }}>
                                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Attendance Breakdown</Typography>
                                {rawAttendance.length === 0 ? (
                                    <Box sx={{ textAlign: 'center', py: 6 }}>
                                        <Typography color="text.secondary">No data available</Typography>
                                    </Box>
                                ) : (
                                    <Chart
                                        chartType="PieChart"
                                        data={donutData}
                                        options={{
                                            pieHole: 0.55,
                                            colors: ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'],
                                            legend: { position: 'right', textStyle: { fontSize: 12 } },
                                            chartArea: { width: '80%', height: '80%' },
                                            pieSliceBorderColor: '#fff',
                                            backgroundColor: 'transparent',
                                            tooltip: { trigger: 'focus' },
                                        }}
                                        width="100%"
                                        height="240px"
                                    />
                                )}
                            </Card>
                        </Grid>

                        {/* Weekly Bar Chart */}
                        <Grid size={{ xs: 12, md: 7 }}>
                            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', p: 2 }}>
                                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Week-by-Week Breakdown</Typography>
                                {weeklyData.length === 0 ? (
                                    <Box sx={{ textAlign: 'center', py: 6 }}>
                                        <Typography color="text.secondary">No data available</Typography>
                                    </Box>
                                ) : (
                                    <Chart
                                        chartType="ColumnChart"
                                        data={barData}
                                        options={{
                                            colors: ['#10b981', '#ef4444', '#f59e0b'],
                                            legend: { position: 'top', textStyle: { fontSize: 11 } },
                                            chartArea: { width: '80%', height: '70%' },
                                            bar: { groupWidth: '70%' },
                                            backgroundColor: 'transparent',
                                            vAxis: { minValue: 0, format: '0', gridlines: { color: '#f1f5f9' } },
                                            hAxis: { textStyle: { fontSize: 11 } },
                                        }}
                                        width="100%"
                                        height="240px"
                                    />
                                )}
                            </Card>
                        </Grid>

                        {/* Day-of-week heatmap */}
                        <Grid size={{ xs: 12, md: 5 }}>
                            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', p: 2.5 }}>
                                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Day-of-Week Attendance Rate</Typography>
                                <Stack spacing={1.5}>
                                    {dayOfWeekData.map(d => (
                                        <Box key={d.day} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Typography variant="body2" fontWeight={600} sx={{ width: 36, color: '#475569' }}>{d.day}</Typography>
                                            <Box sx={{ flex: 1, position: 'relative', height: 20, borderRadius: 10, bgcolor: '#f1f5f9', overflow: 'hidden' }}>
                                                <Box sx={{
                                                    position: 'absolute', left: 0, top: 0, bottom: 0,
                                                    width: `${d.rate}%`,
                                                    borderRadius: 10,
                                                    bgcolor: d.rate >= 90 ? '#10b981' : d.rate >= 75 ? '#f59e0b' : '#ef4444',
                                                    transition: 'width 0.6s ease',
                                                }} />
                                            </Box>
                                            <Typography variant="body2" fontWeight={700} sx={{ width: 40, textAlign: 'right', color: d.rate >= 90 ? '#10b981' : d.rate >= 75 ? '#f59e0b' : '#ef4444' }}>
                                                {d.total > 0 ? `${d.rate}%` : '—'}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </Card>
                        </Grid>

                        {/* Trend line chart */}
                        <Grid size={{ xs: 12, md: 7 }}>
                            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', p: 2 }}>
                                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Daily Attendance Trend</Typography>
                                {rawAttendance.length < 2 ? (
                                    <Box sx={{ textAlign: 'center', py: 6 }}>
                                        <Typography color="text.secondary">Not enough data for trend chart</Typography>
                                    </Box>
                                ) : (
                                    <Chart
                                        chartType="AreaChart"
                                        data={lineData}
                                        options={{
                                            colors: ['#6366f1'],
                                            legend: { position: 'none' },
                                            chartArea: { width: '85%', height: '70%' },
                                            backgroundColor: 'transparent',
                                            areaOpacity: 0.2,
                                            vAxis: { minValue: 0, maxValue: 1, ticks: [0, 0.5, 1], format: '0.#', gridlines: { color: '#f1f5f9' } },
                                            hAxis: { textStyle: { fontSize: 9 }, slantedText: true, slantedTextAngle: 45 },
                                            curveType: 'function',
                                        }}
                                        width="100%"
                                        height="240px"
                                    />
                                )}
                            </Card>
                        </Grid>
                    </Grid>

                    {/* ── Daily Records Table ── */}
                    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                                <Typography variant="subtitle1" fontWeight={700}>
                                    Daily Records
                                    {statusFilter !== 'all' && (
                                        <Chip
                                            size="small"
                                            label={STATUS_LABELS[statusFilter]}
                                            onDelete={() => setStatusFilter('all')}
                                            sx={{ ml: 1, bgcolor: STATUS_BG[statusFilter], color: STATUS_COLORS[statusFilter], fontWeight: 600 }}
                                        />
                                    )}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {attendance.length} records
                                </Typography>
                            </Box>

                            {attendance.length === 0 ? (
                                <Box sx={{ py: 5, textAlign: 'center' }}>
                                    <CalendarIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1.5 }} />
                                    <Typography color="text.secondary">
                                        {rawAttendance.length === 0 ? 'No attendance records for this period' : 'No records match the selected filter'}
                                    </Typography>
                                </Box>
                            ) : (
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Date</TableCell>
                                                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Day</TableCell>
                                                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Status</TableCell>
                                                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Remarks</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {[...attendance]
                                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                                .map((record, index) => {
                                                    const date = new Date(record.date);
                                                    const color = STATUS_COLORS[record.status] || '#64748b';
                                                    const bg = STATUS_BG[record.status] || '#f8fafc';
                                                    return (
                                                        <TableRow key={index} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                                                            <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>
                                                                {date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                            </TableCell>
                                                            <TableCell sx={{ color: '#64748b' }}>
                                                                {date.toLocaleDateString('en-IN', { weekday: 'long' })}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Tooltip title={record.status.replace('_', ' ')}>
                                                                    <Chip
                                                                        size="small"
                                                                        label={STATUS_LABELS[record.status] || record.status}
                                                                        sx={{ bgcolor: bg, color, fontWeight: 700, border: `1px solid ${color}30`, minWidth: 80 }}
                                                                    />
                                                                </Tooltip>
                                                            </TableCell>
                                                            <TableCell sx={{ color: '#64748b', fontStyle: (record.remarks ? 'normal' : 'italic') }}>
                                                                {record.remarks || '—'}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </CardContent>
                    </Card>

                    {/* Export bottom bar */}
                    {rawAttendance.length > 0 && (
                        <Box sx={{ mt: 3, p: 2.5, borderRadius: 3, bgcolor: '#f0f9ff', border: '1px solid #bae6fd', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                            <Box>
                                <Typography variant="subtitle2" fontWeight={700} color="#0c4a6e">Export Attendance Report</Typography>
                                <Typography variant="caption" color="#0369a1">Download as PDF (single-page summary) or Excel (day-wise color-coded)</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1.5 }}>
                                <Button variant="contained" startIcon={<PdfIcon />} onClick={handleExportPDF}
                                    disabled={exporting === 'pdf'}
                                    sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' }, borderRadius: 2, fontWeight: 700 }}>
                                    {exporting === 'pdf' ? 'Generating…' : 'PDF Report'}
                                </Button>
                                <Button variant="contained" startIcon={<ExcelIcon />} onClick={handleExportExcel}
                                    disabled={exporting === 'excel'}
                                    sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' }, borderRadius: 2, fontWeight: 700 }}>
                                    {exporting === 'excel' ? 'Generating…' : 'Excel Report'}
                                </Button>
                            </Box>
                        </Box>
                    )}
                </>
            )}
        </Box>
    );
};

export default ParentAttendance;
