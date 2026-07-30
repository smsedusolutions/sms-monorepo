import { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Chip,
    Tabs,
    Tab,
    Alert,
} from '@mui/material';
import { FileDownload as DownloadIcon } from '@mui/icons-material';
import { useGetDailyReport, useGetClassWiseReport, useGetMonthlyReport } from '../../../queries/Attendance';
import { useGetClasses } from '../../../queries/Class';
import { AppSelect } from '../../../components/shared/AppSelect';
import { AppDatePicker } from '../../../components/shared/AppDatePicker';
import { AppButton } from '../../../components/shared/AppButton';
import { format } from 'date-fns';
import { useGetSchoolById } from '../../../queries/School';
import type { Class } from '../../../types';
import TokenService from '../../../queries/token/tokenService';
import { exportDailyAttendance, exportMonthlyAttendance, exportClassWiseAttendance } from '../../../components/ExcelExport';

const AttendanceReports = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const [tab, setTab] = useState(0);
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');

    const { data: schoolData } = useGetSchoolById(schoolId);
    const mode = schoolData?.data?.attendanceSettings?.mode || 'simple';

    const { data: classesData } = useGetClasses(schoolId);
    const classes = classesData?.data || [];

    // Daily Report
    const { data: dailyData, isLoading: dailyLoading } = useGetDailyReport(schoolId, selectedDate, { mode, classId: selectedClass || undefined, sectionId: selectedSection || undefined });
    const dailyReport = dailyData?.data;

    // Class-wise Report
    const { data: classWiseData, isLoading: classWiseLoading } = useGetClassWiseReport(schoolId, selectedDate, mode, { classId: selectedClass || undefined, sectionId: selectedSection || undefined });
    const classWiseReport = classWiseData?.data?.classes || [];

    // Monthly Report
    const { data: monthlyData, isLoading: monthlyLoading } = useGetMonthlyReport(schoolId, selectedYear, selectedMonth, { mode, classId: selectedClass || undefined, sectionId: selectedSection || undefined, type: 'student' });
    const monthlyReport = monthlyData?.data;

    const sections = classes.find((c: Class) => c.classId === selectedClass)?.sections || [];

    const getPercentageColor = (pct: string | number) => {
        const val = typeof pct === 'string' ? parseFloat(pct) : pct;
        if (val >= 90) return 'success';
        if (val >= 75) return 'primary';
        if (val >= 50) return 'warning';
        return 'error';
    };

    const handleExportDaily = async () => {
        if (!dailyReport?.students?.attendance) return;
        await exportDailyAttendance(
            dailyReport.students.attendance as any,
            selectedDate,
            `daily_attendance_${selectedDate}.xlsx`
        );
    };

    const handleExportClassWise = async () => {
        if (!classWiseReport || classWiseReport.length === 0) return;
        await exportClassWiseAttendance(
            classWiseReport,
            selectedDate,
            `classwise_attendance_${selectedDate}.xlsx`
        );
    };

    const handleExportMonthly = async () => {
        if (!monthlyReport) return;
        await exportMonthlyAttendance(
            monthlyReport,
            `monthly_attendance_${selectedMonth}_${selectedYear}.xlsx`
        );
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: '#1e293b' }}>
                Attendance Reports
            </Typography>

            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={tab}
                    onChange={(_, v) => setTab(v)}
                    sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        '& .MuiTab-root': { fontWeight: 500 }
                    }}
                >
                    <Tab label="Daily Analytics" />
                    <Tab label="Class-wise Status" />
                    <Tab label="Monthly Trends" />
                </Tabs>
            </Paper>

            {/* Filter Section */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    {tab === 2 ? (
                        <>
                            <AppSelect
                                label="Month"
                                value={selectedMonth}
                                fullWidth={false}
                                options={[
                                    { value: 1, label: 'January' }, { value: 2, label: 'February' },
                                    { value: 3, label: 'March' }, { value: 4, label: 'April' },
                                    { value: 5, label: 'May' }, { value: 6, label: 'June' },
                                    { value: 7, label: 'July' }, { value: 8, label: 'August' },
                                    { value: 9, label: 'September' }, { value: 10, label: 'October' },
                                    { value: 11, label: 'November' }, { value: 12, label: 'December' },
                                ]}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                sx={{ minWidth: 150, mb: 0 }}
                            />
                            <AppSelect
                                label="Year"
                                value={selectedYear}
                                fullWidth={false}
                                options={[2024, 2025, 2026].map(y => ({ value: y, label: y.toString() }))}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                sx={{ minWidth: 100, mb: 0 }}
                            />
                        </>
                    ) : (
                        <AppDatePicker
                            label="Report Date"
                            value={selectedDate ? new Date(selectedDate) : null}
                            maxDate={new Date()}
                            fullWidth={false}
                            onChange={(date) => setSelectedDate(date ? format(date, 'yyyy-MM-dd') : '')}
                            sx={{ mb: 0 }}
                        />
                    )}

                    <AppSelect
                        label="Class"
                        value={selectedClass}
                        fullWidth={false}
                        options={[
                            { value: '', label: 'All Classes' },
                            ...classes.map((c: Class) => ({ value: c.classId, label: c.name }))
                        ]}
                        onChange={(e) => {
                            setSelectedClass(e.target.value as string);
                            setSelectedSection('');
                        }}
                        sx={{ minWidth: 150, mb: 0 }}
                    />

                    {selectedClass && (
                        <AppSelect
                            label="Section"
                            value={selectedSection}
                            fullWidth={false}
                            options={[
                                { value: '', label: 'All Sections' },
                                ...sections.map((s) => ({ value: s.sectionId, label: s.name }))
                            ]}
                            onChange={(e) => setSelectedSection(e.target.value as string)}
                            sx={{ minWidth: 120, mb: 0 }}
                        />
                    )}

                    <Box sx={{ flexGrow: 1 }} />

                    <AppButton
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={tab === 0 ? handleExportDaily : tab === 1 ? handleExportClassWise : handleExportMonthly}
                        sx={{ mt: 2 }} // Added some top margin to align better with the inputs' labels
                    >
                        Export to Excel
                    </AppButton>
                </Box>
                <Box sx={{ mt: 1 }}>
                    <Chip
                        label={`System Mode: ${mode.replace('_', ' ').toUpperCase()}`}
                        size="small"
                        variant="outlined"
                        color="primary"
                        sx={{ fontWeight: 500 }}
                    />
                </Box>
            </Paper>

            {/* Daily Analytics View */}
            {tab === 0 && (
                <>
                    {dailyLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
                    ) : dailyReport ? (
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'primary.main' }}>
                                            Student Attendance
                                        </Typography>
                                        <Grid container spacing={4}>
                                            <Grid size={{ xs: 4 }}>
                                                <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                                                    {dailyReport.students?.summary?.present || 0}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">PRESENT</Typography>
                                            </Grid>
                                            <Grid size={{ xs: 4 }}>
                                                <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
                                                    {dailyReport.students?.summary?.absent || 0}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">ABSENT</Typography>
                                            </Grid>
                                            <Grid size={{ xs: 4 }}>
                                                <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                                                    {dailyReport.students?.summary?.late || 0}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">LATE</Typography>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'secondary.main' }}>
                                            Teacher Attendance
                                        </Typography>
                                        <Grid container spacing={4}>
                                            <Grid size={{ xs: 4 }}>
                                                <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                                                    {dailyReport.teachers?.summary?.present || 0}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">PRESENT</Typography>
                                            </Grid>
                                            <Grid size={{ xs: 4 }}>
                                                <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
                                                    {dailyReport.teachers?.summary?.absent || 0}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">ABSENT</Typography>
                                            </Grid>
                                            <Grid size={{ xs: 4 }}>
                                                <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                                                    {dailyReport.teachers?.summary?.leave || 0}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">ON LEAVE</Typography>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    ) : (
                        <Alert severity="info">No attendance data available for this date</Alert>
                    )}
                </>
            )}

            {/* Class-wise View */}
            {tab === 1 && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Class Name</TableCell>
                                <TableCell>Section Name</TableCell>
                                <TableCell align="center">Present</TableCell>
                                <TableCell align="center">Absent</TableCell>
                                <TableCell align="center">Late</TableCell>
                                <TableCell align="center">Total</TableCell>
                                <TableCell align="right">%</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {classWiseLoading ? (
                                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
                            ) : classWiseReport.length > 0 ? classWiseReport.map((row: any, i: number) => (
                                <TableRow key={i} hover>
                                    <TableCell>{row.className}</TableCell>
                                    <TableCell>{row.sectionName || 'All'}</TableCell>
                                    <TableCell align="center">{row.present}</TableCell>
                                    <TableCell align="center">{row.absent}</TableCell>
                                    <TableCell align="center">{row.late}</TableCell>
                                    <TableCell align="center">{row.total}</TableCell>
                                    <TableCell align="right">
                                        <Chip
                                            label={`${row.percentage}%`}
                                            size="small"
                                            color={getPercentageColor(row.percentage)}
                                            variant="outlined"
                                            sx={{ fontWeight: 600 }}
                                        />
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>No data found</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Monthly Trends View */}
            {tab === 2 && (
                <>
                    {monthlyReport?.students && (
                        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                            <Chip label={`Working Days: ${monthlyReport.students.workingDays || 0}`} variant="outlined" />
                            <Chip label={`Records: ${monthlyReport.students.totalRecords || 0}`} variant="outlined" />
                        </Box>
                    )}
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Roll No</TableCell>
                                    <TableCell>Student ID</TableCell>
                                    <TableCell>Student Name</TableCell>
                                    <TableCell>Class/Section</TableCell>
                                    <TableCell align="center">Present</TableCell>
                                    <TableCell align="center">Absent</TableCell>
                                    <TableCell align="center">Late</TableCell>
                                    <TableCell align="center">Leave</TableCell>
                                    <TableCell align="right">Attendance %</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {monthlyLoading ? (
                                    <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
                                ) : (monthlyReport?.students?.byStudent?.length || 0) > 0 ? monthlyReport!.students!.byStudent.map((row: any, i: number) => (
                                    <TableRow key={i} hover>
                                        <TableCell>{(row as any).rollNumber || '-'}</TableCell>
                                        <TableCell>{row.studentId}</TableCell>
                                        <TableCell>{row.studentName || '-'}</TableCell>
                                        <TableCell>{row.className} - {row.sectionName || 'All'}</TableCell>
                                        <TableCell align="center">{row.present}</TableCell>
                                        <TableCell align="center">{row.absent}</TableCell>
                                        <TableCell align="center">{row.late}</TableCell>
                                        <TableCell align="center">{row.leave}</TableCell>
                                        <TableCell align="right">
                                            <Chip
                                                label={`${row.percentage}%`}
                                                size="small"
                                                color={getPercentageColor(row.percentage)}
                                                variant="outlined"
                                                sx={{ fontWeight: 600 }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>No trends found</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            )}
        </Box>
    );
};

export default AttendanceReports;
