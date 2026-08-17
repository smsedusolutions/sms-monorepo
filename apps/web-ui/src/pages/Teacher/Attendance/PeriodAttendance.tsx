import { useState, useEffect } from 'react';
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
    ToggleButton,
    ToggleButtonGroup,
    Snackbar,
    Grid,
} from '@mui/material';
import {
    CheckCircle as PresentIcon,
    Cancel as AbsentIcon,
    AccessTime as LateIcon,
    Save as SaveIcon,
} from '@mui/icons-material';
import { useGetClasses } from '../../../queries/Class';
import { useGetSubjects } from '../../../queries/Subject';
import { useGetStudents } from '../../../queries/Student';
import { useGetPeriodClassAttendance, useMarkPeriodAttendance } from '../../../queries/Attendance';
import type { Student, Class, Subject } from '../../../types';
import TokenService from '../../../queries/token/tokenService';
import { AppSelect } from '../../../components/shared/AppSelect';
import { AppButton } from '../../../components/shared/AppButton';
import { format } from 'date-fns';
import useTeacherAttendanceGuard from '../../../hooks/useTeacherAttendanceGuard';
import AppNoticeDialog from '../../../components/shared/AppNoticeDialog';

type PeriodStatus = "present" | "absent" | "late";

interface AttendanceRecord {
    studentId: string;
    status: PeriodStatus;
    remarks?: string;
}

interface PeriodAttendanceProps {
    onGoToCheckIn?: () => void;
}

const PeriodAttendance: React.FC<PeriodAttendanceProps> = ({ onGoToCheckIn }) => {
    const schoolId = TokenService.getSchoolId() || '';
    const teacherId = TokenService.getTeacherId() || '';

    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedPeriod, setSelectedPeriod] = useState<number>(1);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [isSubstitute] = useState(false);
    const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    // Fetch data
    const { data: classesData, isLoading: classesLoading } = useGetClasses(schoolId);
    const { data: subjectsData, isLoading: subjectsLoading } = useGetSubjects(schoolId);
    const classes = classesData?.data || [];
    const subjects = subjectsData?.data || [];

    // Get sections
    const selectedClassData = classes.find((c: Class) => c.classId === selectedClass);
    const sections = selectedClassData?.sections || [];

    // Fetch students
    const { data: studentsData, isLoading: studentsLoading } = useGetStudents(schoolId, {
        class: selectedClass,
        section: selectedSection || undefined,
        limit: 500,
    });
    const students = studentsData?.data || [];

    // Fetch existing attendance for this period
    const { data: existingAttendance, isLoading: attendanceLoading } = useGetPeriodClassAttendance(
        schoolId,
        selectedClass,
        selectedDate,
        selectedPeriod,
        selectedSection || undefined
    );

    const markAttendance = useMarkPeriodAttendance(schoolId);

    // Initialize from existing data only
    useEffect(() => {
        if (existingAttendance?.data && existingAttendance.data.length > 0) {
            const existing: Record<string, AttendanceRecord> = {};
            existingAttendance.data.forEach(a => {
                existing[a.studentId] = {
                    studentId: a.studentId,
                    status: a.status,
                    remarks: a.remarks,
                };
            });
            setAttendance(existing);
        } else {
            // Clear attendance when no data exists (date/class/period changed)
            setAttendance({});
        }
    }, [existingAttendance]);

    // Teacher attendance validation guard (working hours + check-in)
    const { validateAction, noticeState } = useTeacherAttendanceGuard(schoolId, onGoToCheckIn);

    const handleStatusChange = (studentId: string, status: PeriodStatus) => {
        if (!validateAction()) return;
        setAttendance(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], studentId, status },
        }));
    };

    const handleMarkAll = (status: PeriodStatus) => {
        if (!validateAction()) return;
        const updated: Record<string, AttendanceRecord> = {};
        students.forEach((s: Student) => {
            updated[s.studentId] = { studentId: s.studentId, status };
        });
        setAttendance(updated);
    };

    const handleSave = async () => {
        if (!validateAction()) return;
        if (!selectedClass || !selectedSubject) {
            setSnackbar({ open: true, message: 'Please select class and subject', severity: 'error' });
            return;
        }

        try {
            await markAttendance.mutateAsync({
                classId: selectedClass,
                sectionId: selectedSection || undefined,
                date: selectedDate,
                period: selectedPeriod,
                subjectId: selectedSubject,
                teacherId,
                isSubstitute,
                attendanceRecords: Object.values(attendance),
            });
            setSnackbar({ open: true, message: 'Period attendance saved!', severity: 'success' });
        } catch {
            setSnackbar({ open: true, message: 'Failed to save attendance', severity: 'error' });
        }
    };

    const summary = {
        total: Object.keys(attendance).length,
        present: Object.values(attendance).filter(a => a.status === 'present').length,
        absent: Object.values(attendance).filter(a => a.status === 'absent').length,
        late: Object.values(attendance).filter(a => a.status === 'late').length,
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h5" fontWeight={600} gutterBottom>
                Period-wise Attendance
            </Typography>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                Attendance Date
                            </Typography>
                            <Chip
                                label={`Today: ${format(new Date(), 'dd-MM-yyyy')}`}
                                color="primary"
                                variant="filled"
                                sx={{ fontWeight: 600, borderRadius: 1.5, py: 2 }}
                            />
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                        <AppSelect
                            label="Period"
                            value={selectedPeriod}
                            options={[1, 2, 3, 4, 5, 6, 7, 8].map(p => ({ value: p, label: `Period ${p}` }))}
                            onChange={(e) => setSelectedPeriod(Number(e.target.value))}
                        />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3, md: 2.5 }}>
                        <AppSelect
                            label="Class"
                            value={selectedClass}
                            options={classes.map((c: Class) => ({ value: c.classId, label: c.name }))}
                            onChange={(e) => {
                                setSelectedClass(e.target.value as string);
                                setSelectedSection('');
                                setAttendance({});
                            }}
                        />
                    </Grid>
                    {sections.length > 0 && (
                        <Grid size={{ xs: 6, sm: 3, md: 1.5 }}>
                            <AppSelect
                                label="Section"
                                value={selectedSection}
                                options={[
                                    { value: '', label: 'All' },
                                    ...sections.map(s => ({ value: s.sectionId, label: s.name }))
                                ]}
                                onChange={(e) => setSelectedSection(e.target.value as string)}
                            />
                        </Grid>
                    )}
                    <Grid size={{ xs: 6, sm: 3, md: 2.5 }}>
                        <AppSelect
                            label="Subject"
                            value={selectedSubject}
                            options={subjects.map((s: Subject) => ({ value: s.subjectId, label: s.name }))}
                            onChange={(e) => setSelectedSubject(e.target.value as string)}
                        />
                    </Grid>
                </Grid>
            </Paper>

            {/* Summary */}
            {students.length > 0 && (
                <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Chip label={`Total: ${summary.total}`} variant="outlined" />
                    <Chip label={`Present: ${summary.present}`} color="success" />
                    <Chip label={`Absent: ${summary.absent}`} color="error" />
                    <Chip label={`Late: ${summary.late}`} color="warning" />
                    <Box sx={{ ml: 'auto' }}>
                        <AppButton size="small" variant="outlined" color="success" onClick={() => handleMarkAll('present')} sx={{ mr: 1 }}>
                            All Present
                        </AppButton>
                        <AppButton size="small" variant="outlined" color="error" onClick={() => handleMarkAll('absent')}>
                            All Absent
                        </AppButton>
                    </Box>
                </Box>
            )}

            {/* Table */}
            {classesLoading || subjectsLoading || studentsLoading || attendanceLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
            ) : !selectedClass || !selectedSubject ? (
                <Alert severity="info">Please select class and subject</Alert>
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
                                <TableCell>Roll No</TableCell>
                                <TableCell align="center">Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {students.map((student: Student, index: number) => (
                                <TableRow key={student.studentId} hover>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{student.studentId}</TableCell>
                                    <TableCell>{student.firstName} {student.lastName}</TableCell>
                                    <TableCell>{student.rollNumber || '-'}</TableCell>
                                    <TableCell align="center">
                                        <ToggleButtonGroup
                                            size="small"
                                            value={attendance[student.studentId]?.status || null}
                                            exclusive
                                            onChange={(_, value) => value && handleStatusChange(student.studentId, value)}
                                        >
                                            <ToggleButton value="present" color="success"><PresentIcon fontSize="small" /></ToggleButton>
                                            <ToggleButton value="absent" color="error"><AbsentIcon fontSize="small" /></ToggleButton>
                                            <ToggleButton value="late" color="warning"><LateIcon fontSize="small" /></ToggleButton>
                                        </ToggleButtonGroup>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Save */}
            {students.length > 0 && (
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <AppButton
                        variant="contained"
                        size="large"
                        loading={markAttendance.isPending}
                        startIcon={!markAttendance.isPending && <SaveIcon />}
                        onClick={handleSave}
                    >
                        Save Period Attendance
                    </AppButton>
                </Box>
            )}

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
            </Snackbar>

            <AppNoticeDialog {...noticeState} />
        </Box>
    );
};

export default PeriodAttendance;
