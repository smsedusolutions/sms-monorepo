import { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    CircularProgress,
    Alert,
    Snackbar,
    Card,
    CardContent,
} from '@mui/material';
import {
    Login as CheckInIcon,
    Logout as CheckOutIcon,
} from '@mui/icons-material';
import { useGetClasses } from '../../../queries/Class';
import { useGetStudents } from '../../../queries/Student';
import { useGetDailyCheckins, useCheckIn, useCheckOut } from '../../../queries/Attendance';
import type { Student, Class, AttendanceCheckin } from '../../../types';
import TokenService from '../../../queries/token/tokenService';
import { AppSelect } from '../../../components/shared/AppSelect';
import { AppButton } from '../../../components/shared/AppButton';
import { format } from 'date-fns';

const CheckInAttendance = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    // Fetch data
    const { data: classesData } = useGetClasses(schoolId);
    const classes = classesData?.data || [];
    const selectedClassData = classes.find((c: Class) => c.classId === selectedClass);
    const sections = selectedClassData?.sections || [];

    const { data: studentsData, isLoading: studentsLoading } = useGetStudents(schoolId, {
        class: selectedClass,
        section: selectedSection || undefined,
        limit: 500,
    });
    const students = studentsData?.data || [];

    const { data: checkinsData, isLoading: checkinsLoading, refetch } = useGetDailyCheckins(
        schoolId,
        selectedDate,
        { classId: selectedClass || undefined }
    );
    const checkins = checkinsData?.data?.attendance || [];
    const summary = checkinsData?.data?.summary as { checkedIn?: number; checkedOut?: number; late?: number } | undefined;

    const checkInMutation = useCheckIn(schoolId);
    const checkOutMutation = useCheckOut(schoolId);

    const getStudentCheckin = (studentId: string): AttendanceCheckin | undefined => {
        return checkins.find((c: AttendanceCheckin) => c.userId === studentId);
    };

    const handleCheckIn = async (student: Student) => {
        try {
            await checkInMutation.mutateAsync({
                userId: student.studentId,
                userType: 'student',
                classId: student.class,
                sectionId: student.section,
                method: 'manual',
            });
            refetch();
            setSnackbar({ open: true, message: `${student.firstName} checked in`, severity: 'success' });
        } catch {
            setSnackbar({ open: true, message: 'Check-in failed', severity: 'error' });
        }
    };

    const handleCheckOut = async (student: Student) => {
        try {
            await checkOutMutation.mutateAsync({
                userId: student.studentId,
                method: 'manual',
            });
            refetch();
            setSnackbar({ open: true, message: `${student.firstName} checked out`, severity: 'success' });
        } catch {
            setSnackbar({ open: true, message: 'Check-out failed', severity: 'error' });
        }
    };

    const formatTime = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusChip = (checkin: AttendanceCheckin | undefined) => {
        if (!checkin) return <Chip label="Not Marked" size="small" color="default" />;
        if (checkin.status === 'pending') return <Chip label="In School" size="small" color="info" />;
        if (checkin.status === 'present') return <Chip label="Present" size="small" color="success" />;
        if (checkin.status === 'late') return <Chip label="Late" size="small" color="warning" />;
        if (checkin.status === 'half_day') return <Chip label="Half Day" size="small" color="info" />;
        return <Chip label={checkin.status} size="small" />;
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h5" fontWeight={600} gutterBottom>
                Check-In/Out Attendance
            </Typography>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                Check-In Date
                            </Typography>
                            <Chip
                                label={`Today: ${format(new Date(), 'dd-MM-yyyy')}`}
                                color="primary"
                                variant="filled"
                                sx={{ fontWeight: 600, borderRadius: 1.5, py: 2 }}
                            />
                        </Box>
                        <AppSelect
                            label="Class"
                            value={selectedClass}
                            options={[
                                { value: '', label: 'All Classes' },
                                ...classes.map((c: Class) => ({ value: c.classId, label: c.name }))
                            ]}
                            onChange={(e) => {
                                setSelectedClass(e.target.value as string);
                                setSelectedSection('');
                            }}
                            sx={{ minWidth: 200 }}
                        />
                        {sections.length > 0 && (
                            <AppSelect
                                label="Section"
                                value={selectedSection}
                                options={[
                                    { value: '', label: 'All' },
                                    ...sections.map(s => ({ value: s.sectionId, label: s.name }))
                                ]}
                                onChange={(e) => setSelectedSection(e.target.value as string)}
                                sx={{ minWidth: 150 }}
                            />
                        )}
                    </Box>
                </Box>
            </Paper>

            {/* Summary Cards */}
            {summary && (
                <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                    <Card sx={{ minWidth: 100 }}>
                        <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                            <Typography variant="h4" color="primary">{summary.checkedIn || 0}</Typography>
                            <Typography variant="caption">Checked In</Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ minWidth: 100 }}>
                        <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                            <Typography variant="h4" color="success.main">{summary.checkedOut || 0}</Typography>
                            <Typography variant="caption">Checked Out</Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ minWidth: 100 }}>
                        <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                            <Typography variant="h4" color="warning.main">{summary.late || 0}</Typography>
                            <Typography variant="caption">Late</Typography>
                        </CardContent>
                    </Card>
                </Box>
            )}

            {/* Students Table */}
            {studentsLoading || checkinsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
            ) : !selectedClass ? (
                <Alert severity="info">Select a class to manage check-ins</Alert>
            ) : students.length === 0 ? (
                <Alert severity="warning">No students found</Alert>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>#</TableCell>
                                <TableCell>Student ID</TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell>Check In</TableCell>
                                <TableCell>Check Out</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {students.map((student: Student, index: number) => {
                                const checkin = getStudentCheckin(student.studentId);
                                return (
                                    <TableRow key={student.studentId} hover>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{student.studentId}</TableCell>
                                        <TableCell>{student.firstName} {student.lastName}</TableCell>
                                        <TableCell>{formatTime(checkin?.checkInTime)}</TableCell>
                                        <TableCell>{formatTime(checkin?.checkOutTime)}</TableCell>
                                        <TableCell>{getStatusChip(checkin)}</TableCell>
                                        <TableCell align="center">
                                            {!checkin?.checkInTime ? (
                                                <AppButton
                                                    size="small"
                                                    variant="contained"
                                                    color="success"
                                                    startIcon={<CheckInIcon />}
                                                    onClick={() => handleCheckIn(student)}
                                                    loading={checkInMutation.isPending}
                                                >
                                                    Check In
                                                </AppButton>
                                            ) : !checkin?.checkOutTime ? (
                                                <AppButton
                                                    size="small"
                                                    variant="contained"
                                                    color="primary"
                                                    startIcon={<CheckOutIcon />}
                                                    onClick={() => handleCheckOut(student)}
                                                    loading={checkOutMutation.isPending}
                                                >
                                                    Check Out
                                                </AppButton>
                                            ) : (
                                                <Chip label="Complete" color="success" size="small" />
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default CheckInAttendance;
