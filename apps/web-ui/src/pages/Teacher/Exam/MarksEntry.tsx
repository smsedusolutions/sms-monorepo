import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    Typography,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    Chip,
    Box,
    Grid,
    Snackbar,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Tooltip,
    Stack,
    useTheme,
    useMediaQuery,
    CircularProgress,
} from '@mui/material';
import {
    Save as SaveIcon,
    Warning as WarningIcon,
    Assignment as MarksIcon,
    Lock as LockIcon,
    Publish as PublishIcon,
    CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { AppNoticeDialog } from '../../../components/shared/AppNoticeDialog';
import { useAuth } from '../../../context/AuthContext';
import {
    useGetExams,
    useGetExamSchedule,
    useGetSubjectResults,
    useSubmitMarks,
    useTeacherPublishSubject,
} from '../../../queries/Exam';
import { useGetStudents } from '../../../queries/Student';
import { useGetTeacherById } from '../../../queries/Teacher';
import { useGetSubjects } from '../../../queries/Subject';
import { useGetClasses } from '../../../queries/Class';
import { compareClassesNumerically } from '../../../utils/classSort';

import type { SubmitMarksRequest } from '../../../types/exam.types';

// ─── Toast Helper ──────────────────────────────────────────────────────────────
type ToastSeverity = 'success' | 'error' | 'warning' | 'info';
interface ToastState { open: boolean; message: string; severity: ToastSeverity; }

// ─── Numeric Input Helper ──────────────────────────────────────────────────────
const toNumericString = (value: string): string => value.replace(/[^0-9.]/g, '');

const MarksEntry = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { user } = useAuth();
    const schoolId = user?.schoolId || '';
    const teacherId = user?.userId || '';

    // ── Selection States ──────────────────────────────────────────────────────
    const [selectedExamId, setSelectedExamId] = useState('');
    const [selectedScheduleId, setSelectedScheduleId] = useState('');

    // Ref to track when submit is driven by "Save & Switch"
    const pendingSwitchRef = useRef<{ examId: string | null; scheduleId: string | null } | null>(null);

    // ── Pending selection (used while confirming unsaved changes) ─────────────
    const [pendingExamId, setPendingExamId] = useState<string | null>(null);
    const [pendingScheduleId, setPendingScheduleId] = useState<string | null>(null);
    const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);

    // ── Apply a pending switch ────────────────────────────────────────────────
    const applyPendingSwitch = useCallback((pendingExam: string | null, pendingSchedule: string | null) => {
        if (pendingExam !== null) {
            setSelectedExamId(pendingExam);
            setSelectedScheduleId(pendingSchedule ?? '');
        } else if (pendingSchedule !== null) {
            setSelectedScheduleId(pendingSchedule);
        }
        setPendingExamId(null);
        setPendingScheduleId(null);
        setHasChanges(false);
        setErrors({});
    }, []);

    // ── Toast State ───────────────────────────────────────────────────────────
    const [toast, setToast] = useState<ToastState>({ open: false, message: '', severity: 'success' });
    const showToast = useCallback((message: string, severity: ToastSeverity = 'success') => {
        setToast({ open: true, message, severity });
    }, []);

    // ── Data Fetching ─────────────────────────────────────────────────────────
    const { data: exams } = useGetExams(schoolId);
    const { data: scheduleData } = useGetExamSchedule(schoolId, selectedExamId);
    const { data: teacherData } = useGetTeacherById(schoolId, teacherId);
    const { data: subjectsData } = useGetSubjects(schoolId);
    const { data: classesData } = useGetClasses(schoolId);
    const { data: resultsData, isLoading: resultsLoading, isFetching: resultsFetching } = useGetSubjectResults(schoolId, selectedExamId, selectedScheduleId);

    // ── Teacher's assigned subjects ───────────────────────────────────────────
    const teacherSubjects = teacherData?.data?.subjects || [];

    // ── Filter schedules ──────────────────────────────────────────────────────
    const allSubjects = subjectsData?.data || [];
    const filteredSchedules = scheduleData?.data?.filter((s: any) => {
        if (teacherSubjects.includes(s.subjectId)) return true;
        const subjectByMongoId = allSubjects.find((sub: any) => sub._id === s.subjectId);
        if (subjectByMongoId && teacherSubjects.includes(subjectByMongoId.subjectId)) return true;
        return false;
    }) || [];

    // ── Class Mapping ─────────────────────────────────────────────────────────
    const classMap = useMemo(() => {
        const map = new Map<string, string>();
        classesData?.data?.forEach((c: any) => {
            if (c.classId) map.set(c.classId, c.name);
            if (c._id) map.set(c._id, c.name);
            if (c.sections && Array.isArray(c.sections)) {
                c.sections.forEach((sec: any) => {
                    const secId = sec.sectionId || sec._id || sec.name;
                    const secName = sec.name || '';
                    if (c.classId) {
                        map.set(`${c.classId}#${secId}`, `${c.name || ''} - ${secName}`);
                        map.set(`${c.classId}_${secId}`, `${c.name || ''} - ${secName}`);
                    }
                    if (c._id) {
                        map.set(`${c._id}#${secId}`, `${c.name || ''} - ${secName}`);
                        map.set(`${c._id}_${secId}`, `${c.name || ''} - ${secName}`);
                    }
                });
            }
        });
        return map;
    }, [classesData]);

    const getClassName = useCallback((id: string): string => {
        if (!id) return '—';
        if (classMap.has(id)) return classMap.get(id)!;
        if (id.includes('#')) {
            const [rawClassId, rawSecId] = id.split('#');
            const cName = classMap.get(rawClassId) || rawClassId;
            return `${cName} (${rawSecId})`;
        }
        return classMap.get(id) || id;
    }, [classMap]);

    // ── Subject Name Helper ───────────────────────────────────────────────────
    const getSubjectName = useCallback((subjectId: string): string => {
        const subject = subjectsData?.data?.find((s: any) => s._id === subjectId || s.subjectId === subjectId);
        return subject?.name || subjectId;
    }, [subjectsData]);

    // ── Sort Schedules Numerically by Class Name ──────────────────────────────
    const sortedFilteredSchedules = useMemo(() => {
        return [...filteredSchedules].sort((a: any, b: any) => {
            const classComp = compareClassesNumerically(getClassName(a.classId), getClassName(b.classId));
            if (classComp !== 0) return classComp;

            const subA = getSubjectName(a.subjectId);
            const subB = getSubjectName(b.subjectId);
            const subComp = subA.localeCompare(subB);
            if (subComp !== 0) return subComp;

            return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
    }, [filteredSchedules, getClassName, getSubjectName]);

    // ── Auto-select if only one subject available ─────────────────────────────
    useEffect(() => {
        if (sortedFilteredSchedules.length === 1 && !selectedScheduleId) {
            setSelectedScheduleId(sortedFilteredSchedules[0]._id);
        }
    }, [sortedFilteredSchedules, selectedScheduleId]);

    // ── Derived Data ──────────────────────────────────────────────────────────
    const selectedSchedule = sortedFilteredSchedules.find((s: any) => s._id === selectedScheduleId);

    // ── Students for selected class (fetch all students in class) ────────────
    const { data: studentsData, isLoading: studentsLoading, isFetching: studentsFetching } = useGetStudents(schoolId, {
        class: selectedSchedule?.classId,
        limit: 1000,
    });

    const isDataLoading = studentsLoading || resultsLoading || studentsFetching || resultsFetching;

    const submitMarks = useSubmitMarks(schoolId);
    const teacherPublish = useTeacherPublishSubject(schoolId);

    // ── Marks Grid State ──────────────────────────────────────────────────────
    const [marksGrid, setMarksGrid] = useState<any[]>([]);
    const [hasChanges, setHasChanges] = useState(false);
    const [errors, setErrors] = useState<Record<number, Record<string, string>>>({});
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [noticeDialogOpen, setNoticeDialogOpen] = useState(false);
    const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);

    // ── Publication Lifecycle Status ──────────────────────────────────────────
    const currentPublishStatus = (resultsData as any)?.schedule?.publishStatus || selectedSchedule?.publishStatus || 'draft';
    const isTeacherPublished = currentPublishStatus === 'teacher_published';
    const isFinalPublished = currentPublishStatus === 'final_published';
    const isPublished = isTeacherPublished || isFinalPublished;

    // ── Check if Exam Timing allows Marks Entry (1 hour after exam end time) ───
    const unlockStatus = useMemo(() => {
        if (!selectedSchedule?.date) {
            return { isUnlocked: true, unlockTime: null, formattedUnlockTime: '', isFuture: false };
        }

        let endHours = 23;
        let endMinutes = 59;
        if (selectedSchedule.endTime && typeof selectedSchedule.endTime === 'string') {
            const parts = selectedSchedule.endTime.trim().split(':');
            if (parts.length >= 2) {
                const h = parseInt(parts[0], 10);
                const m = parseInt(parts[1], 10);
                if (!isNaN(h) && !isNaN(m)) {
                    endHours = h + 1; // 1 hour after exam end time
                    endMinutes = m;
                }
            }
        }

        let scheduleDate: Date;
        if (typeof selectedSchedule.date === 'string' && selectedSchedule.date.includes('T')) {
            const [dateStr] = selectedSchedule.date.split('T');
            const [y, m, d] = dateStr.split('-').map(Number);
            scheduleDate = new Date(y, m - 1, d, endHours, endMinutes, 0, 0);
        } else {
            const temp = new Date(selectedSchedule.date);
            scheduleDate = new Date(temp.getFullYear(), temp.getMonth(), temp.getDate(), endHours, endMinutes, 0, 0);
        }

        const now = new Date();
        const isUnlocked = now.getTime() >= scheduleDate.getTime();

        const formattedDate = scheduleDate.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        const formattedTime = scheduleDate.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        return {
            isUnlocked,
            unlockTime: scheduleDate,
            formattedUnlockTime: `${formattedDate} at ${formattedTime}`,
            isFuture: !isUnlocked
        };
    }, [selectedSchedule]);

    // ── Auto-show warning popup if teacher selects a locked/future schedule ───
    useEffect(() => {
        if (selectedSchedule && !unlockStatus.isUnlocked) {
            setNoticeDialogOpen(true);
        }
    }, [selectedScheduleId, unlockStatus.isUnlocked]);

    // ── Initialize Grid when Data Changes (Sorted by Roll Number Ascending) ───
    useEffect(() => {
        if (studentsData?.data && selectedSchedule && !isDataLoading) {
            const sortedStudents = [...studentsData.data].sort((a: any, b: any) => {
                const rollA = parseInt(a.rollNumber, 10);
                const rollB = parseInt(b.rollNumber, 10);
                if (!isNaN(rollA) && !isNaN(rollB)) return rollA - rollB;
                const rA = String(a.rollNumber || '');
                const rB = String(b.rollNumber || '');
                const comp = rA.localeCompare(rB, undefined, { numeric: true, sensitivity: 'base' });
                if (comp !== 0) return comp;
                return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
            });

            const grid = sortedStudents.map((student: any) => {
                const result = resultsData?.data?.find((r: any) => r.studentId === student.studentId);
                return {
                    studentId: student.studentId,
                    name: `${student.firstName} ${student.lastName}`,
                    rollNumber: student.rollNumber || 'N/A',
                    theory: result?.marksObtainedTheory !== undefined && result?.marksObtainedTheory !== null ? String(result.marksObtainedTheory) : '',
                    practical: result?.marksObtainedPractical !== undefined && result?.marksObtainedPractical !== null ? String(result.marksObtainedPractical) : '',
                    remarks: result?.remarks || '',
                    attendanceStatus: result?.attendanceStatus || 'present',
                    maxTheory: selectedSchedule.maxMarksTheory || 0,
                    maxPractical: selectedSchedule.maxMarksPractical || 0,
                };
            });
            setMarksGrid(grid);
            setHasChanges(false);
            setErrors({});
            setSubmitAttempted(false);
        }
    }, [studentsData, resultsData, selectedSchedule, isDataLoading]);

    // ── Handle changing exam with unsaved-changes guard ───────────────────────
    const handleExamChange = (newExamId: string) => {
        if (hasChanges) {
            setPendingExamId(newExamId);
            setPendingScheduleId('');
            setUnsavedDialogOpen(true);
        } else {
            setMarksGrid([]);
            setSelectedExamId(newExamId);
            setSelectedScheduleId('');
            setSubmitAttempted(false);
            setErrors({});
        }
    };

    // ── Handle changing subject/schedule with unsaved-changes guard ───────────
    const handleScheduleChange = (newScheduleId: string) => {
        if (hasChanges) {
            setPendingScheduleId(newScheduleId);
            setPendingExamId(null);
            setUnsavedDialogOpen(true);
        } else {
            setMarksGrid([]);
            setSelectedScheduleId(newScheduleId);
            setSubmitAttempted(false);
            setErrors({});
        }
    };

    // ── Confirm discard unsaved changes ───────────────────────────────────────
    const confirmDiscard = () => {
        setUnsavedDialogOpen(false);
        applyPendingSwitch(pendingExamId, pendingScheduleId);
    };

    // ── Handle marks input ───────────────────────────────────────────────────
    const handleMarkChange = (index: number, field: string, rawValue: string) => {
        if (!unlockStatus.isUnlocked) {
            setNoticeDialogOpen(true);
            return;
        }
        if (isPublished) {
            showToast('Marks are published and locked for editing.', 'warning');
            return;
        }

        const newGrid = [...marksGrid];

        if (field === 'theory' || field === 'practical') {
            const numericValue = toNumericString(rawValue);
            newGrid[index][field] = numericValue;

            const numVal = parseFloat(numericValue);
            const max = field === 'theory' ? newGrid[index].maxTheory : newGrid[index].maxPractical;
            const newErrors = { ...errors };
            if (!newErrors[index]) newErrors[index] = {};

            if (numericValue !== '' && isNaN(numVal)) {
                newErrors[index][field] = 'Must be a number';
            } else if (numericValue !== '' && numVal < 0) {
                newErrors[index][field] = 'Cannot be negative';
            } else if (numericValue !== '' && max > 0 && numVal > max) {
                newErrors[index][field] = `Max is ${max}`;
            } else if (submitAttempted && (numericValue === '' || isNaN(numVal))) {
                newErrors[index][field] = 'Required';
            } else {
                delete newErrors[index][field];
                if (Object.keys(newErrors[index]).length === 0) {
                    delete newErrors[index];
                }
            }
            setErrors(newErrors);
        } else if (field === 'attendanceStatus') {
            newGrid[index].attendanceStatus = rawValue;
            if (rawValue !== 'present') {
                const newErrors = { ...errors };
                delete newErrors[index];
                setErrors(newErrors);
            }
        } else {
            newGrid[index][field] = rawValue;
        }

        setMarksGrid(newGrid);
        setHasChanges(true);
    };

    // ── Validate before submit ────────────────────────────────────────────────
    const validateAll = (): boolean => {
        const newErrors: Record<number, Record<string, string>> = {};
        let valid = true;
        marksGrid.forEach((row, index) => {
            if (row.attendanceStatus !== 'present') return;
            if (row.theory === '' || row.theory === null || row.theory === undefined) {
                if (!newErrors[index]) newErrors[index] = {};
                newErrors[index]['theory'] = 'Required';
                valid = false;
            } else {
                const t = parseFloat(row.theory);
                if (isNaN(t) || t < 0) {
                    if (!newErrors[index]) newErrors[index] = {};
                    newErrors[index]['theory'] = 'Invalid';
                    valid = false;
                } else if (row.maxTheory > 0 && t > row.maxTheory) {
                    if (!newErrors[index]) newErrors[index] = {};
                    newErrors[index]['theory'] = `Max ${row.maxTheory}`;
                    valid = false;
                }
            }
            if (row.maxPractical > 0) {
                const p = parseFloat(row.practical);
                if (row.practical === '' || row.practical === null || row.practical === undefined) {
                    if (!newErrors[index]) newErrors[index] = {};
                    newErrors[index]['practical'] = 'Required';
                    valid = false;
                } else if (isNaN(p) || p < 0 || p > row.maxPractical) {
                    if (!newErrors[index]) newErrors[index] = {};
                    newErrors[index]['practical'] = `Max ${row.maxPractical}`;
                    valid = false;
                }
            }
        });
        setErrors(newErrors);
        return valid;
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = () => {
        if (!selectedSchedule) return;
        if (!unlockStatus.isUnlocked) {
            setNoticeDialogOpen(true);
            return;
        }
        if (isPublished) {
            showToast('Marks for this subject have already been published and cannot be modified.', 'warning');
            return;
        }
        setSubmitAttempted(true);
        if (!validateAll()) {
            showToast('Please enter marks for all present students (highlighted in red).', 'error');
            return;
        }

        const payload: SubmitMarksRequest = {
            examId: selectedExamId,
            scheduleId: selectedScheduleId,
            marks: marksGrid.map(row => ({
                studentId: row.studentId,
                theory: row.attendanceStatus === 'present' ? (parseFloat(row.theory) || 0) : 0,
                practical: row.attendanceStatus === 'present' ? (parseFloat(row.practical) || 0) : 0,
                remarks: row.remarks,
                attendanceStatus: row.attendanceStatus
            }))
        };

        const switchTarget = pendingSwitchRef.current;
        pendingSwitchRef.current = null;

        submitMarks.mutate(payload, {
            onSuccess: (data: any) => {
                if (data.errors && data.errors.length > 0) {
                    showToast(`Saved with internal issues: ${data.errors.slice(0, 2).join(', ')}${data.errors.length > 2 ? '...' : ''}`, 'warning');
                } else {
                    showToast('Marks submitted successfully!', 'success');
                }
                setHasChanges(false);
                setSubmitAttempted(false);
                setErrors({});
                if (switchTarget) {
                    applyPendingSwitch(switchTarget.examId, switchTarget.scheduleId);
                }
            },
            onError: (err: any) => {
                showToast(`Failed to submit marks: ${err?.message || 'Unknown error'}`, 'error');
            }
        });
    };

    const getFieldError = (index: number, field: string) => errors[index]?.[field];

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: 'auto', pb: { xs: 24, sm: 4 } }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, gap: 1 }}>
                <Box>
                    <Typography variant={isMobile ? "h6" : "h5"} fontWeight={700} color="text.primary">
                        Marks Entry
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Enter theory and practical marks for students in your assigned subjects
                    </Typography>
                </Box>
                {hasChanges && (
                    <Chip
                        icon={<WarningIcon sx={{ fontSize: 16 }} />}
                        label={isMobile ? "Unsaved" : "Unsaved changes"}
                        color="warning"
                        size="small"
                        sx={{ fontWeight: 700, borderRadius: 2 }}
                    />
                )}
            </Box>

            {/* Exam / Subject Selection Paper */}
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2, sm: 2.5 },
                    mb: 2.5,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                }}
            >
                <Grid container spacing={2}>
                    {/* Exam Select */}
                    <Grid size={{ xs: 12, sm: teacherSubjects.length > 1 ? 6 : 12 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel id="select-exam-label">Select Exam</InputLabel>
                            <Select
                                labelId="select-exam-label"
                                id="select-exam"
                                value={selectedExamId}
                                label="Select Exam"
                                onChange={(e) => handleExamChange(e.target.value)}
                                sx={{
                                    borderRadius: 2,
                                    bgcolor: 'background.paper',
                                    '& .MuiSelect-select': { py: 1.25, fontSize: '0.875rem' },
                                }}
                            >
                                {exams?.data?.map((e: any) => (
                                    <MenuItem key={e._id || e.examId} value={e.examId}>
                                        {e.name} ({e.status})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Subject / Schedule Select */}
                    {teacherSubjects.length > 1 && (
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth size="small" disabled={!selectedExamId || sortedFilteredSchedules.length === 0}>
                                <InputLabel id="select-subject-label">Select Subject / Class</InputLabel>
                                <Select
                                    labelId="select-subject-label"
                                    id="select-subject"
                                    value={selectedScheduleId}
                                    label="Select Subject / Class"
                                    onChange={(e) => handleScheduleChange(e.target.value)}
                                    sx={{
                                        borderRadius: 2,
                                        bgcolor: 'background.paper',
                                        '& .MuiSelect-select': { py: 1.25, fontSize: '0.875rem' },
                                    }}
                                >
                                    {sortedFilteredSchedules.map((s: any) => (
                                        <MenuItem key={s._id} value={s._id}>
                                            {getSubjectName(s.subjectId)} — {getClassName(s.classId)} ({new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                                        </MenuItem>
                                    ))}
                                    {sortedFilteredSchedules.length === 0 && (
                                        <MenuItem disabled>No schedules for your subjects</MenuItem>
                                    )}
                                </Select>
                            </FormControl>
                        </Grid>
                    )}
                </Grid>

                {/* Single Subject Auto-Banner */}
                {teacherSubjects.length === 1 && filteredSchedules.length === 1 && selectedSchedule && (
                    <Box sx={{ mt: 1.5, p: 1.25, bgcolor: 'primary.50', borderRadius: 2, border: '1px solid', borderColor: '#bfdbfe' }}>
                        <Typography variant="body2" color="primary.dark">
                            <strong>Assigned Subject:</strong> {getSubjectName(selectedSchedule.subjectId)} • {getClassName(selectedSchedule.classId)}
                        </Typography>
                    </Box>
                )}

                {/* No Schedules Warning */}
                {selectedExamId && filteredSchedules.length === 0 && (
                    <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
                        No examination schedules found for your assigned subjects in this exam.
                    </Alert>
                )}
            </Paper>

            {/* Empty State when no schedule selected */}
            {!selectedScheduleId && (
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        textAlign: 'center',
                        borderRadius: 2,
                        border: '1px dashed',
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                    }}
                >
                    <MarksIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
                    <Typography variant="subtitle1" fontWeight={600} color="text.primary" gutterBottom>
                        Select an Exam &amp; Subject
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 380, mx: 'auto' }}>
                        Choose an exam and subject from the dropdown above to load the student list and enter marks.
                    </Typography>
                </Paper>
            )}

            {/* Marks Grid Section */}
            {selectedScheduleId && (
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 2, sm: 2.5 },
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                    }}
                >
                    {/* Header & Meta Chips */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
                        <Box>
                            <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                                {selectedSchedule ? `${getSubjectName(selectedSchedule.subjectId)} — ${getClassName(selectedSchedule.classId)}` : 'Student Marks List'}
                            </Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 0.5 }}>
                                {!unlockStatus.isUnlocked && (
                                    <Chip
                                        size="small"
                                        icon={<LockIcon sx={{ fontSize: '14px !important' }} />}
                                        label={`Locked (Opens ${unlockStatus.formattedUnlockTime})`}
                                        color="warning"
                                        variant="outlined"
                                        onClick={() => setNoticeDialogOpen(true)}
                                        sx={{ fontWeight: 600, fontSize: '0.75rem', height: 24, cursor: 'pointer' }}
                                    />
                                )}
                                {isTeacherPublished && (
                                    <Chip
                                        size="small"
                                        icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                                        label="Submitted to Admin"
                                        color="info"
                                        sx={{ fontWeight: 700, fontSize: '0.75rem', height: 24 }}
                                    />
                                )}
                                {isFinalPublished && (
                                    <Chip
                                        size="small"
                                        icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                                        label="Final Published"
                                        color="success"
                                        sx={{ fontWeight: 700, fontSize: '0.75rem', height: 24 }}
                                    />
                                )}
                                <Chip
                                    size="small"
                                    label={`Theory Max: ${selectedSchedule?.maxMarksTheory ?? 0}`}
                                    color="primary"
                                    variant="outlined"
                                    sx={{ fontWeight: 600, fontSize: '0.75rem', height: 24 }}
                                />
                                {(selectedSchedule?.maxMarksPractical ?? 0) > 0 && (
                                    <Chip
                                        size="small"
                                        label={`Practical Max: ${selectedSchedule?.maxMarksPractical ?? 0}`}
                                        color="secondary"
                                        variant="outlined"
                                        sx={{ fontWeight: 600, fontSize: '0.75rem', height: 24 }}
                                    />
                                )}
                                <Chip
                                    size="small"
                                    label={`Passing: ${selectedSchedule?.passingMarks ?? 0}`}
                                    color="success"
                                    variant="outlined"
                                    sx={{ fontWeight: 600, fontSize: '0.75rem', height: 24 }}
                                />
                                <Chip
                                    size="small"
                                    label={isDataLoading ? 'Loading...' : `${marksGrid.length} Students`}
                                    sx={{ fontWeight: 600, fontSize: '0.75rem', height: 24 }}
                                />
                            </Stack>
                        </Box>

                        {/* Desktop Action Buttons */}
                        {!isMobile && (
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                {!isPublished && !hasChanges && resultsData?.data && resultsData.data.length > 0 && (
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        startIcon={<PublishIcon />}
                                        onClick={() => setPublishConfirmOpen(true)}
                                        disabled={!unlockStatus.isUnlocked || teacherPublish.isPending || isDataLoading}
                                        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 2 }}
                                    >
                                        {teacherPublish.isPending ? 'Publishing...' : 'Publish to Admin'}
                                    </Button>
                                )}
                                {!isPublished && (
                                    <Button
                                        variant="contained"
                                        startIcon={<SaveIcon />}
                                        onClick={handleSubmit}
                                        disabled={!hasChanges || submitMarks.isPending || isDataLoading || !unlockStatus.isUnlocked}
                                        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 2.5 }}
                                    >
                                        {submitMarks.isPending ? 'Saving...' : 'Save Marks'}
                                    </Button>
                                )}
                            </Stack>
                        )}
                    </Box>

                    {/* Publication Status Banners */}
                    {isTeacherPublished && (
                        <Alert
                            severity="info"
                            icon={<CheckCircleIcon fontSize="inherit" />}
                            sx={{ mb: 2, borderRadius: 2, fontWeight: 500 }}
                        >
                            <strong>Submitted to Administration:</strong> Marks for this subject have been published and submitted to the School Admin &amp; Principal for final review. Marks editing is now locked.
                        </Alert>
                    )}

                    {isFinalPublished && (
                        <Alert
                            severity="success"
                            icon={<CheckCircleIcon fontSize="inherit" />}
                            sx={{ mb: 2, borderRadius: 2, fontWeight: 500 }}
                        >
                            <strong>Final Published:</strong> Marks for this subject have been finally published and are visible to students and parents.
                        </Alert>
                    )}

                    {/* Locked Exam Warning Banner */}
                    {!unlockStatus.isUnlocked && (
                        <Alert
                            severity="warning"
                            icon={<LockIcon fontSize="inherit" />}
                            action={
                                <Button color="inherit" size="small" onClick={() => setNoticeDialogOpen(true)} sx={{ fontWeight: 600 }}>
                                    Details
                                </Button>
                            }
                            sx={{ mb: 2, borderRadius: 2, fontWeight: 500 }}
                        >
                            Marks entry is locked until 1 hour after the exam ends ({unlockStatus.formattedUnlockTime}).
                        </Alert>
                    )}

                    {/* Validation Error Banner */}
                    {submitAttempted && Object.keys(errors).length > 0 && (
                        <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontWeight: 500 }}>
                            Please enter marks for all present students highlighted in red before saving.
                        </Alert>
                    )}

                    {/* Content */}
                    {isDataLoading ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6, gap: 1.5 }}>
                            <CircularProgress size={36} />
                            <Typography variant="caption" color="text.secondary">Loading students &amp; marks...</Typography>
                        </Box>
                    ) : marksGrid.length === 0 ? (
                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                            No enrolled students found for this class.
                        </Alert>
                    ) : isMobile ? (
                        /* Mobile Student Marks Cards */
                        <Stack spacing={1.5}>
                            {marksGrid.map((row, index) => {
                                const isAbsent = row.attendanceStatus !== 'present';
                                const theoryErr = getFieldError(index, 'theory');
                                const practicalErr = getFieldError(index, 'practical');

                                return (
                                    <Paper
                                        key={row.studentId}
                                        elevation={0}
                                        sx={{
                                            p: 1.75,
                                            borderRadius: 2,
                                            border: '1px solid',
                                            borderColor: (theoryErr || practicalErr) ? 'error.main' : 'divider',
                                            bgcolor: isAbsent ? '#f9fafb' : 'background.paper',
                                            opacity: isAbsent ? 0.75 : 1,
                                        }}
                                    >
                                        {/* Top Row: Roll No + Student Name + Attendance Select */}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, gap: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Chip
                                                    label={`#${row.rollNumber}`}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                    sx={{ fontWeight: 700, fontSize: '0.75rem', height: 22 }}
                                                />
                                                <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                                                    {row.name}
                                                </Typography>
                                            </Box>
                                            <Select
                                                size="small"
                                                value={row.attendanceStatus}
                                                onChange={(e) => handleMarkChange(index, 'attendanceStatus', e.target.value)}
                                                disabled={!unlockStatus.isUnlocked || isPublished}
                                                sx={{
                                                    height: 28,
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    borderRadius: 1.5,
                                                    bgcolor: isAbsent ? '#fee2e2' : '#f0fdf4',
                                                    color: isAbsent ? '#991b1b' : '#166534',
                                                    '& .MuiSelect-select': { py: 0.25, px: 1 },
                                                }}
                                            >
                                                <MenuItem value="present">Present</MenuItem>
                                                <MenuItem value="absent">Absent</MenuItem>
                                                <MenuItem value="medical_leave">Medical</MenuItem>
                                            </Select>
                                        </Box>

                                        {/* Marks Inputs Row */}
                                        <Grid container spacing={1.5} sx={{ mb: 1 }}>
                                            {/* Theory Marks */}
                                            <Grid size={{ xs: row.maxPractical > 0 ? 6 : 12 }}>
                                                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                                    Theory (Max: {row.maxTheory})
                                                </Typography>
                                                <TextField
                                                    type="text"
                                                    inputMode="decimal"
                                                    size="small"
                                                    fullWidth
                                                    value={isAbsent ? '—' : row.theory}
                                                    onChange={(e) => handleMarkChange(index, 'theory', e.target.value)}
                                                    disabled={isAbsent || !unlockStatus.isUnlocked || isPublished}
                                                    error={!!theoryErr}
                                                    helperText={theoryErr || ''}
                                                    placeholder={`0–${row.maxTheory}`}
                                                    inputProps={{
                                                        inputMode: 'decimal',
                                                        style: { textAlign: 'center', fontWeight: 600 },
                                                    }}
                                                />
                                            </Grid>

                                            {/* Practical Marks */}
                                            {row.maxPractical > 0 && (
                                                <Grid size={{ xs: 6 }}>
                                                    <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                                        Practical (Max: {row.maxPractical})
                                                    </Typography>
                                                    <TextField
                                                        type="text"
                                                        inputMode="decimal"
                                                        size="small"
                                                        fullWidth
                                                        value={isAbsent ? '—' : row.practical}
                                                        onChange={(e) => handleMarkChange(index, 'practical', e.target.value)}
                                                        disabled={isAbsent || !unlockStatus.isUnlocked || isPublished}
                                                        error={!!practicalErr}
                                                        helperText={practicalErr || ''}
                                                        placeholder={`0–${row.maxPractical}`}
                                                        inputProps={{
                                                            inputMode: 'decimal',
                                                            style: { textAlign: 'center', fontWeight: 600 },
                                                        }}
                                                    />
                                                </Grid>
                                            )}
                                        </Grid>

                                        {/* Remarks */}
                                        <TextField
                                            size="small"
                                            fullWidth
                                            value={row.remarks}
                                            onChange={(e) => handleMarkChange(index, 'remarks', e.target.value)}
                                            placeholder="Remarks (optional)"
                                            disabled={isAbsent || !unlockStatus.isUnlocked || isPublished}
                                            sx={{ mt: 0.5, '& .MuiInputBase-input': { fontSize: '0.8125rem', py: 0.75 } }}
                                        />
                                    </Paper>
                                );
                            })}
                        </Stack>
                    ) : (
                        /* Desktop Table */
                        <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
                            <Table size="small">
                                <TableHead sx={{ bgcolor: 'grey.50' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700, width: 80 }}>Roll No</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Student Name</TableCell>
                                        <TableCell sx={{ fontWeight: 700, width: 120 }}>Attendance</TableCell>
                                        <TableCell sx={{ fontWeight: 700, width: 120, textAlign: 'center' }}>
                                            Theory ({selectedSchedule?.maxMarksTheory ?? 0})
                                        </TableCell>
                                        {(selectedSchedule?.maxMarksPractical ?? 0) > 0 && (
                                            <TableCell sx={{ fontWeight: 700, width: 120, textAlign: 'center' }}>
                                                Practical ({selectedSchedule?.maxMarksPractical ?? 0})
                                            </TableCell>
                                        )}
                                        <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {marksGrid.map((row, index) => {
                                        const isAbsent = row.attendanceStatus !== 'present';
                                        return (
                                            <TableRow key={row.studentId} hover sx={{ opacity: isAbsent ? 0.6 : 1 }}>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={600}>{row.rollNumber}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={500}>{row.name}</Typography>
                                                </TableCell>

                                                {/* Attendance */}
                                                <TableCell>
                                                    <Select
                                                        size="small"
                                                        value={row.attendanceStatus}
                                                        onChange={(e) => handleMarkChange(index, 'attendanceStatus', e.target.value)}
                                                        disabled={!unlockStatus.isUnlocked || isPublished}
                                                        variant="outlined"
                                                        sx={{ minWidth: 100, height: 32, fontSize: '0.8125rem' }}
                                                    >
                                                        <MenuItem value="present">Present</MenuItem>
                                                        <MenuItem value="absent">Absent</MenuItem>
                                                        <MenuItem value="medical_leave">Medical</MenuItem>
                                                    </Select>
                                                </TableCell>

                                                {/* Theory */}
                                                <TableCell align="center">
                                                    <Tooltip
                                                        title={getFieldError(index, 'theory') || ''}
                                                        arrow
                                                        disableHoverListener={!getFieldError(index, 'theory')}
                                                    >
                                                        <TextField
                                                            type="text"
                                                            inputMode="decimal"
                                                            size="small"
                                                            value={isAbsent ? '—' : row.theory}
                                                            onChange={(e) => handleMarkChange(index, 'theory', e.target.value)}
                                                            disabled={isAbsent || !unlockStatus.isUnlocked || isPublished}
                                                            error={!!getFieldError(index, 'theory')}
                                                            placeholder={`0–${row.maxTheory}`}
                                                            sx={{
                                                                width: 85,
                                                                '& .MuiOutlinedInput-root': {
                                                                    ...(!!getFieldError(index, 'theory') && {
                                                                        bgcolor: '#fff1f2',
                                                                    }),
                                                                },
                                                            }}
                                                            inputProps={{
                                                                inputMode: 'decimal',
                                                                style: { textAlign: 'center', fontWeight: 600 }
                                                            }}
                                                        />
                                                    </Tooltip>
                                                </TableCell>

                                                {/* Practical */}
                                                {(selectedSchedule?.maxMarksPractical ?? 0) > 0 && (
                                                    <TableCell align="center">
                                                        <Tooltip
                                                            title={getFieldError(index, 'practical') || ''}
                                                            arrow
                                                            disableHoverListener={!getFieldError(index, 'practical')}
                                                        >
                                                            <TextField
                                                                type="text"
                                                                inputMode="decimal"
                                                                size="small"
                                                                value={isAbsent ? '—' : row.practical}
                                                                onChange={(e) => handleMarkChange(index, 'practical', e.target.value)}
                                                                disabled={isAbsent || !unlockStatus.isUnlocked || isPublished}
                                                                error={!!getFieldError(index, 'practical')}
                                                                placeholder={`0–${row.maxPractical}`}
                                                                sx={{
                                                                    width: 85,
                                                                    '& .MuiOutlinedInput-root': {
                                                                        ...(!!getFieldError(index, 'practical') && {
                                                                            bgcolor: '#fff1f2',
                                                                        }),
                                                                    },
                                                                }}
                                                                inputProps={{
                                                                    inputMode: 'decimal',
                                                                    style: { textAlign: 'center', fontWeight: 600 }
                                                                }}
                                                            />
                                                        </Tooltip>
                                                    </TableCell>
                                                )}

                                                {/* Remarks */}
                                                <TableCell>
                                                    <TextField
                                                        size="small"
                                                        value={row.remarks}
                                                        onChange={(e) => handleMarkChange(index, 'remarks', e.target.value)}
                                                        placeholder="Optional"
                                                        disabled={isAbsent || !unlockStatus.isUnlocked || isPublished}
                                                        fullWidth
                                                        sx={{ '& .MuiInputBase-input': { fontSize: '0.8125rem' } }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Paper>
            )}

            {/* Mobile Sticky Save Bar */}
            {isMobile && selectedScheduleId && (
                <Paper
                    elevation={4}
                    sx={{
                        position: 'fixed',
                        bottom: 'calc(var(--mobile-bottom-nav-height, 60px) + var(--safe-area-bottom, 0px))',
                        left: 0,
                        right: 0,
                        p: 1.5,
                        bgcolor: 'background.paper',
                        borderTop: '1px solid',
                        borderColor: 'divider',
                        zIndex: 38,
                        display: 'flex',
                        gap: 1.5,
                        alignItems: 'center',
                        boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.08)',
                    }}
                >
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" fontWeight={600} color={isTeacherPublished ? 'info.main' : isFinalPublished ? 'success.main' : hasChanges ? 'warning.main' : 'text.secondary'}>
                            {isTeacherPublished
                                ? 'Submitted to Admin'
                                : isFinalPublished
                                ? 'Final Published'
                                : hasChanges
                                ? 'Unsaved marks'
                                : 'All marks saved'}
                        </Typography>
                    </Box>
                    {!isPublished && (
                        <>
                            {!hasChanges && resultsData?.data && resultsData.data.length > 0 && (
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    startIcon={<PublishIcon />}
                                    onClick={() => setPublishConfirmOpen(true)}
                                    disabled={!unlockStatus.isUnlocked || teacherPublish.isPending}
                                    sx={{
                                        borderRadius: 2,
                                        fontWeight: 700,
                                        textTransform: 'none',
                                        px: 2,
                                        py: 1,
                                    }}
                                >
                                    Publish
                                </Button>
                            )}
                            <Button
                                variant="contained"
                                startIcon={<SaveIcon />}
                                onClick={handleSubmit}
                                disabled={!hasChanges || submitMarks.isPending || !unlockStatus.isUnlocked}
                                sx={{
                                    borderRadius: 2,
                                    fontWeight: 700,
                                    textTransform: 'none',
                                    px: 2.5,
                                    py: 1,
                                }}
                            >
                                {submitMarks.isPending ? 'Saving...' : 'Save Marks'}
                            </Button>
                        </>
                    )}
                </Paper>
            )}

            {/* Teacher Publish Confirmation Dialog */}
            <Dialog open={publishConfirmOpen} onClose={() => setPublishConfirmOpen(false)} maxWidth="xs" PaperProps={{ sx: { borderRadius: 2 } }}>
                <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PublishIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle1" fontWeight={700}>Publish Marks to Administration</Typography>
                </DialogTitle>
                <DialogContent sx={{ pt: 0 }}>
                    <DialogContentText variant="body2" sx={{ lineHeight: 1.6 }}>
                        Are you sure you want to publish marks for <strong>{selectedSchedule ? getSubjectName(selectedSchedule.subjectId) : 'this subject'}</strong> ({selectedSchedule ? getClassName(selectedSchedule.classId) : ''})?
                        <br /><br />
                        Once published, these marks will be submitted to the School Admin and Principal for final review, and you will no longer be able to edit them.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
                    <Button size="small" onClick={() => setPublishConfirmOpen(false)} sx={{ textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button
                        size="small"
                        variant="contained"
                        startIcon={<PublishIcon />}
                        disabled={teacherPublish.isPending}
                        onClick={() => {
                            teacherPublish.mutate(
                                { examId: selectedExamId, scheduleId: selectedScheduleId },
                                {
                                    onSuccess: () => {
                                        setPublishConfirmOpen(false);
                                        showToast('Marks published to administration successfully!', 'success');
                                    },
                                    onError: (err: any) => {
                                        showToast(err?.message || 'Failed to publish marks', 'error');
                                    }
                                }
                            );
                        }}
                        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                    >
                        {teacherPublish.isPending ? 'Publishing...' : 'Yes, Publish'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Unsaved Changes Confirmation Dialog */}
            <Dialog open={unsavedDialogOpen} onClose={() => setUnsavedDialogOpen(false)} maxWidth="xs" PaperProps={{ sx: { borderRadius: 2 } }}>
                <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon color="warning" fontSize="small" />
                    <Typography variant="subtitle1" fontWeight={700}>Unsaved Changes</Typography>
                </DialogTitle>
                <DialogContent sx={{ pt: 0 }}>
                    <DialogContentText variant="body2">
                        You have unsaved marks. Switching now will lose your modifications.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
                    <Button size="small" onClick={() => setUnsavedDialogOpen(false)} sx={{ textTransform: 'none' }}>
                        Stay
                    </Button>
                    <Button size="small" color="error" onClick={confirmDiscard} sx={{ textTransform: 'none' }}>
                        Discard
                    </Button>
                    <Button
                        size="small"
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={() => {
                            pendingSwitchRef.current = {
                                examId: pendingExamId,
                                scheduleId: pendingScheduleId
                            };
                            setUnsavedDialogOpen(false);
                            handleSubmit();
                        }}
                        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                    >
                        Save &amp; Switch
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Exam Not Conducted / Locked Notice Dialog */}
            <AppNoticeDialog
                open={noticeDialogOpen}
                onClose={() => setNoticeDialogOpen(false)}
                type="warning"
                title="Marks Entry Not Available Yet"
                message={`This exam is scheduled for ${selectedSchedule?.date ? new Date(selectedSchedule.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''} (${selectedSchedule?.startTime || ''} – ${selectedSchedule?.endTime || ''}). Marks entry will open on ${unlockStatus.formattedUnlockTime} (1 hour after exam completion).`}
                badgeText="Locked / Exam in Future"
                primaryActionLabel="Understood"
            />

            {/* Toast Notification */}
            <Snackbar
                open={toast.open}
                autoHideDuration={4000}
                onClose={() => setToast(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setToast(prev => ({ ...prev, open: false }))}
                    severity={toast.severity}
                    variant="filled"
                    sx={{ width: '100%', borderRadius: 2, fontWeight: 600 }}
                >
                    {toast.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default MarksEntry;
