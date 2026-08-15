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
import { useUrlTab } from '../../../hooks/useUrlTab';
import { useIsMobile } from '../../../hooks/useIsMobile';
import MobileSegmentedTabs from '../../../components/mobile/navigation/MobileSegmentedTabs';
import MobileCardList from '../../../components/mobile/data/MobileCardList';
import MobileCardItem from '../../../components/mobile/data/MobileCardItem';

const AttendanceReports = () => {
    const isMobile = useIsMobile();
    const schoolId = TokenService.getSchoolId() || '';
    const [tab, setTab] = useUrlTab(0, ['daily', 'classwise', 'monthly']);
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
        <Box sx={{ p: { xs: 1, sm: 3 } }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2.5, color: '#0f172a', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                Attendance Reports
            </Typography>

            {isMobile ? (
                <Box sx={{ mb: 2.5 }}>
                    <MobileSegmentedTabs
                        options={[
                            { id: 'daily', label: 'Daily Analytics' },
                            { id: 'classwise', label: 'Class-wise' },
                            { id: 'monthly', label: 'Monthly' },
                        ]}
                        activeId={tab === 0 ? 'daily' : tab === 1 ? 'classwise' : 'monthly'}
                        onChange={(id) => setTab(id === 'daily' ? 0 : id === 'classwise' ? 1 : 2)}
                    />
                </Box>
            ) : (
                <Paper sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }}>
                    <Tabs
                        value={tab}
                        onChange={(_, v) => setTab(v)}
                        sx={{
                            borderBottom: 1,
                            borderColor: 'divider',
                            '& .MuiTab-root': { fontWeight: 600, px: 3 }
                        }}
                    >
                        <Tab label="Daily Analytics" />
                        <Tab label="Class-wise Status" />
                        <Tab label="Monthly Trends" />
                    </Tabs>
                </Paper>
            )}

            {/* Filter Section */}
            <Paper sx={{ p: { xs: 2, sm: 2.5 }, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
                <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: { xs: '1fr', sm: tab === 2 ? 'repeat(auto-fit, minmax(140px, 1fr))' : 'repeat(auto-fit, minmax(180px, 1fr))' }, 
                    gap: 2, 
                    alignItems: 'center' 
                }}>
                    {tab === 2 ? (
                        <>
                            <AppSelect
                                label="Month"
                                value={selectedMonth}
                                fullWidth
                                options={[
                                    { value: 1, label: 'January' }, { value: 2, label: 'February' },
                                    { value: 3, label: 'March' }, { value: 4, label: 'April' },
                                    { value: 5, label: 'May' }, { value: 6, label: 'June' },
                                    { value: 7, label: 'July' }, { value: 8, label: 'August' },
                                    { value: 9, label: 'September' }, { value: 10, label: 'October' },
                                    { value: 11, label: 'November' }, { value: 12, label: 'December' },
                                ]}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                sx={{ mb: 0 }}
                            />
                            <AppSelect
                                label="Year"
                                value={selectedYear}
                                fullWidth
                                options={[2024, 2025, 2026].map(y => ({ value: y, label: y.toString() }))}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                sx={{ mb: 0 }}
                            />
                        </>
                    ) : (
                        <AppDatePicker
                            label="Report Date"
                            value={selectedDate ? new Date(selectedDate) : null}
                            maxDate={new Date()}
                            fullWidth
                            onChange={(date) => setSelectedDate(date ? format(date, 'yyyy-MM-dd') : '')}
                            sx={{ mb: 0 }}
                        />
                    )}

                    <AppSelect
                        label="Class"
                        value={selectedClass}
                        fullWidth
                        options={[
                            { value: '', label: 'All Classes' },
                            ...classes.map((c: Class) => ({ value: c.classId, label: c.name }))
                        ]}
                        onChange={(e) => {
                            setSelectedClass(e.target.value as string);
                            setSelectedSection('');
                        }}
                        sx={{ mb: 0 }}
                    />

                    {selectedClass && (
                        <AppSelect
                            label="Section"
                            value={selectedSection}
                            fullWidth
                            options={[
                                { value: '', label: 'All Sections' },
                                ...sections.map((s) => ({ value: s.sectionId, label: s.name }))
                            ]}
                            onChange={(e) => setSelectedSection(e.target.value as string)}
                            sx={{ mb: 0 }}
                        />
                    )}

                    <AppButton
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={tab === 0 ? handleExportDaily : tab === 1 ? handleExportClassWise : handleExportMonthly}
                        sx={{ height: 42, width: { xs: '100%', sm: 'auto' }, fontWeight: 700, borderRadius: 2.5 }}
                    >
                        Export to Excel
                    </AppButton>
                </Box>
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                        label={`System Mode: ${mode.replace('_', ' ').toUpperCase()}`}
                        size="small"
                        variant="outlined"
                        color="primary"
                        sx={{ fontWeight: 600, borderRadius: '6px' }}
                    />
                </Box>
            </Paper>

            {/* Daily Analytics View */}
            {tab === 0 && (
                <>
                    {dailyLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
                    ) : dailyReport ? (
                        <Grid container spacing={2.5}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2.5, color: 'primary.main', fontSize: '1.05rem' }}>
                                            Student Attendance
                                        </Typography>
                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 4 }}>
                                                <Typography variant="h4" sx={{ fontWeight: 800, color: 'success.main', fontSize: { xs: '1.6rem', sm: '2rem' } }}>
                                                    {dailyReport.students?.summary?.present || 0}
                                                </Typography>
                                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 0.5 }}>PRESENT</Typography>
                                            </Grid>
                                            <Grid size={{ xs: 4 }}>
                                                <Typography variant="h4" sx={{ fontWeight: 800, color: 'error.main', fontSize: { xs: '1.6rem', sm: '2rem' } }}>
                                                    {dailyReport.students?.summary?.absent || 0}
                                                </Typography>
                                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 0.5 }}>ABSENT</Typography>
                                            </Grid>
                                            <Grid size={{ xs: 4 }}>
                                                <Typography variant="h4" sx={{ fontWeight: 800, color: 'warning.main', fontSize: { xs: '1.6rem', sm: '2rem' } }}>
                                                    {dailyReport.students?.summary?.late || 0}
                                                </Typography>
                                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 0.5 }}>LATE</Typography>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2.5, color: 'secondary.main', fontSize: '1.05rem' }}>
                                            Teacher Attendance
                                        </Typography>
                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 4 }}>
                                                <Typography variant="h4" sx={{ fontWeight: 800, color: 'success.main', fontSize: { xs: '1.6rem', sm: '2rem' } }}>
                                                    {dailyReport.teachers?.summary?.present || 0}
                                                </Typography>
                                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 0.5 }}>PRESENT</Typography>
                                            </Grid>
                                            <Grid size={{ xs: 4 }}>
                                                <Typography variant="h4" sx={{ fontWeight: 800, color: 'error.main', fontSize: { xs: '1.6rem', sm: '2rem' } }}>
                                                    {dailyReport.teachers?.summary?.absent || 0}
                                                </Typography>
                                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 0.5 }}>ABSENT</Typography>
                                            </Grid>
                                            <Grid size={{ xs: 4 }}>
                                                <Typography variant="h4" sx={{ fontWeight: 800, color: 'info.main', fontSize: { xs: '1.6rem', sm: '2rem' } }}>
                                                    {dailyReport.teachers?.summary?.leave || 0}
                                                </Typography>
                                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 0.5 }}>ON LEAVE</Typography>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    ) : (
                        <Alert severity="info" sx={{ borderRadius: 2 }}>No attendance data available for this date</Alert>
                    )}
                </>
            )}

            {/* Class-wise View */}
            {tab === 1 && (
                <>
                    {isMobile ? (
                        <MobileCardList
                            isLoading={classWiseLoading}
                            emptyTitle="No Class Attendance Found"
                            emptyMessage="No class records found for the selected filter."
                            totalCount={classWiseReport.length}
                            itemCount={classWiseReport.length}
                        >
                            {classWiseReport.map((row: any, i: number) => (
                                <MobileCardItem
                                    key={i}
                                    title={`${row.className} (${row.sectionName || 'All Sections'})`}
                                    subtitle={`Total Students: ${row.total}`}
                                    badge={{
                                        label: `${row.percentage}%`,
                                        color: getPercentageColor(row.percentage) as any,
                                    }}
                                    metaItems={[
                                        { label: 'Present', value: row.present },
                                        { label: 'Absent', value: row.absent },
                                        { label: 'Late', value: row.late },
                                    ]}
                                />
                            ))}
                        </MobileCardList>
                    ) : (
                        <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
                            <Table>
                                <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>Class Name</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Section Name</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700 }}>Present</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700 }}>Absent</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700 }}>Late</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700 }}>Total</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>%</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {classWiseLoading ? (
                                        <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
                                    ) : classWiseReport.length > 0 ? classWiseReport.map((row: any, i: number) => (
                                        <TableRow key={i} hover>
                                            <TableCell sx={{ fontWeight: 600 }}>{row.className}</TableCell>
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
                                                    sx={{ fontWeight: 700 }}
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
                </>
            )}

            {/* Monthly Trends View */}
            {tab === 2 && (
                <>
                    {monthlyReport?.students && (
                        <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap' }}>
                            <Chip 
                                label={`Working Days: ${monthlyReport.students.workingDays || 0}`} 
                                variant="outlined" 
                                sx={{ fontWeight: 600, borderRadius: '8px' }}
                            />
                            <Chip 
                                label={`Records: ${monthlyReport.students.totalRecords || 0}`} 
                                variant="outlined" 
                                sx={{ fontWeight: 600, borderRadius: '8px' }}
                            />
                        </Box>
                    )}
                    {isMobile ? (
                        <MobileCardList
                            isLoading={monthlyLoading}
                            emptyTitle="No Monthly Trends"
                            emptyMessage="No monthly attendance records found."
                            totalCount={monthlyReport?.students?.byStudent?.length || 0}
                            itemCount={monthlyReport?.students?.byStudent?.length || 0}
                        >
                            {(monthlyReport?.students?.byStudent || []).map((row: any, i: number) => (
                                <MobileCardItem
                                    key={i}
                                    title={row.studentName || row.studentId}
                                    subtitle={`${row.className} - ${row.sectionName || 'All'}`}
                                    badge={{
                                        label: `${row.percentage}%`,
                                        color: getPercentageColor(row.percentage) as any,
                                    }}
                                    metaItems={[
                                        { label: 'Roll No', value: (row as any).rollNumber || '-' },
                                        { label: 'Present', value: row.present },
                                        { label: 'Absent', value: row.absent },
                                        { label: 'Late/Leave', value: `${row.late} / ${row.leave}` },
                                    ]}
                                />
                            ))}
                        </MobileCardList>
                    ) : (
                        <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
                            <Table>
                                <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>Roll No</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Student ID</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Student Name</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Class/Section</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700 }}>Present</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700 }}>Absent</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700 }}>Late</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700 }}>Leave</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>Attendance %</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {monthlyLoading ? (
                                        <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
                                    ) : (monthlyReport?.students?.byStudent?.length || 0) > 0 ? monthlyReport!.students!.byStudent.map((row: any, i: number) => (
                                        <TableRow key={i} hover>
                                            <TableCell>{(row as any).rollNumber || '-'}</TableCell>
                                            <TableCell>{row.studentId}</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>{row.studentName || '-'}</TableCell>
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
                                                    sx={{ fontWeight: 700 }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={9} align="center" sx={{ py: 4 }}>No trends found</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </>
            )}
        </Box>
    );
};

export default AttendanceReports;
