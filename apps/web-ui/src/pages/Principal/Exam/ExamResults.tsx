import React, { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Card,
    CardContent,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Tooltip,
    Stack,
    Tabs,
    Tab,
    Alert,
    Snackbar,
    TextField
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    Publish as PublishIcon,
    Restore as RollbackIcon,
    Visibility as ViewIcon,
    CheckCircle as CheckCircleIcon,
    Schedule as ScheduleIcon,
    Close as CloseIcon,
    NotificationsActive as RemindIcon,
    Download as DownloadIcon,
} from '@mui/icons-material';
import {
    useGetExams,
    useGetExamPublishStatus,
    useFinalPublishExam,
    useRollbackSubjectPublish,
    useGetSubjectResults,
    useRemindTeacherMarks
} from '../../../queries/Exam';
import TokenService from '../../../queries/token/tokenService';
import type { Exam, ExamPublishSubjectItem } from '../../../types/exam.types';
import { compareClassesNumerically } from '../../../utils/classSort';
import { exportReportCardPDF } from '../../../utils/reportCardPdfExport';
import { useAcademicYear } from '../../../hooks/useAcademicYear';

// ─── View Marks Modal Component ──────────────────────────────────────────────
interface ViewMarksDialogProps {
    open: boolean;
    onClose: () => void;
    schoolId: string;
    examId: string;
    subject: ExamPublishSubjectItem | null;
}

const ViewMarksDialog: React.FC<ViewMarksDialogProps> = ({ open, onClose, schoolId, examId, subject }) => {
    const scheduleId = subject?._id || '';
    const { data: resultsData, isLoading } = useGetSubjectResults(schoolId, examId, scheduleId);
    const marks = resultsData?.data || [];

    // Calculate Analytics
    const evaluatedMarks = marks.filter((m: any) => m.attendanceStatus === 'present' && typeof m.totalMarks === 'number');
    const totalCount = marks.length;
    const evaluatedCount = evaluatedMarks.length;
    const scores = evaluatedMarks.map((m: any) => m.totalMarks as number);
    const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '0.0';
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;
    const passCount = evaluatedMarks.filter((m: any) => (m.grade || '').toUpperCase() !== 'F').length;
    const passRate = evaluatedCount > 0 ? ((passCount / evaluatedCount) * 100).toFixed(0) : '0';

    const handleExportAllPDF = () => {
        marks.forEach((st: any) => {
            exportReportCardPDF({
                schoolName: 'Demo International School',
                studentName: st.studentName || st.studentId,
                rollNumber: st.rollNumber,
                className: subject?.className || 'Class',
                examName: 'Final Examination',
                results: [{
                    subjectName: subject?.subjectName || 'Subject',
                    totalMarks: st.totalMarks ?? 0,
                    marksObtainedTheory: st.marksObtainedTheory,
                    marksObtainedPractical: st.marksObtainedPractical,
                    grade: st.grade,
                    gradePoints: st.gradePoints,
                    remarks: st.remarks
                }]
            });
        });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                <Box>
                    <Typography variant="h6" fontWeight={700}>
                        {subject?.subjectName} — {subject?.className}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {subject?.date ? new Date(subject.date).toLocaleDateString() : ''} ({subject?.startTime} - {subject?.endTime})
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {marks.length > 0 && (
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            onClick={handleExportAllPDF}
                            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}
                        >
                            Export PDF Reports
                        </Button>
                    )}
                    <IconButton size="small" onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
                {/* Subject Analytics Summary Banner */}
                {marks.length > 0 && (
                    <Box sx={{ p: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 6, sm: 3 }}>
                                <Box sx={{ p: 1.2, textAlign: 'center', bgcolor: '#ffffff', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Evaluated</Typography>
                                    <Typography variant="subtitle1" fontWeight={800} color="primary.main">{evaluatedCount}/{totalCount}</Typography>
                                </Box>
                            </Grid>
                            <Grid size={{ xs: 6, sm: 3 }}>
                                <Box sx={{ p: 1.2, textAlign: 'center', bgcolor: '#ffffff', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Class Average</Typography>
                                    <Typography variant="subtitle1" fontWeight={800} color="info.dark">{avgScore}</Typography>
                                </Box>
                            </Grid>
                            <Grid size={{ xs: 6, sm: 3 }}>
                                <Box sx={{ p: 1.2, textAlign: 'center', bgcolor: '#ffffff', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Highest / Lowest</Typography>
                                    <Typography variant="subtitle1" fontWeight={800} color="success.dark">{highestScore} / {lowestScore}</Typography>
                                </Box>
                            </Grid>
                            <Grid size={{ xs: 6, sm: 3 }}>
                                <Box sx={{ p: 1.2, textAlign: 'center', bgcolor: '#ffffff', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Pass Rate</Typography>
                                    <Typography variant="subtitle1" fontWeight={800} color="success.main">{passRate}%</Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>
                )}

                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                        <CircularProgress size={32} />
                    </Box>
                ) : marks.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography color="text.secondary">No student marks submitted for this subject yet.</Typography>
                    </Box>
                ) : (
                    <TableContainer sx={{ maxHeight: 420 }}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700 }}>Roll No</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Student Name</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }} align="center">Attendance</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }} align="center">Theory</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }} align="center">Practical</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }} align="center">Total</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }} align="center">Grade</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {marks.map((row: any, idx: number) => {
                                    const isAbsent = row.attendanceStatus !== 'present';
                                    return (
                                        <TableRow key={row.studentId || idx} hover>
                                            <TableCell sx={{ fontWeight: 600 }}>{row.rollNumber || '—'}</TableCell>
                                            <TableCell>{row.studentName || row.studentId}</TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={row.attendanceStatus || 'present'}
                                                    size="small"
                                                    color={isAbsent ? 'error' : 'success'}
                                                    variant="outlined"
                                                    sx={{ textTransform: 'capitalize', fontWeight: 600, fontSize: '0.72rem' }}
                                                />
                                            </TableCell>
                                            <TableCell align="center">{isAbsent ? '—' : row.marksObtainedTheory ?? '—'}</TableCell>
                                            <TableCell align="center">{isAbsent ? '—' : row.marksObtainedPractical ?? '—'}</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 700 }}>
                                                {isAbsent ? '—' : row.totalMarks ?? '—'}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={row.grade || '—'}
                                                    size="small"
                                                    color={row.grade === 'F' || row.grade === 'E' ? 'error' : 'primary'}
                                                    sx={{ fontWeight: 700, minWidth: 32 }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none' }}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const ExamResults: React.FC = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const { academicYears } = useAcademicYear();

    const [activeTab, setActiveTab] = useState(0);
    const [selectedExamId, setSelectedExamId] = useState('');
    const [yearFilter, setYearFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'teacher_published' | 'final_published'>('all');

    // Dialog states
    const [viewSubject, setViewSubject] = useState<ExamPublishSubjectItem | null>(null);
    const [publishOneConfirm, setPublishOneConfirm] = useState<ExamPublishSubjectItem | null>(null);
    const [publishAllConfirm, setPublishAllConfirm] = useState(false);
    const [rollbackConfirm, setRollbackConfirm] = useState<ExamPublishSubjectItem | null>(null);
    const [rollbackReason, setRollbackReason] = useState('');

    // Toast state
    const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({
        open: false,
        message: '',
        severity: 'success'
    });

    const showToast = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'success') => {
        setToast({ open: true, message, severity });
    };

    // Queries & Mutations
    const { data: examsData, isLoading: examsLoading } = useGetExams(schoolId, yearFilter || undefined);

    const exams: Exam[] = examsData?.data || [];

    // Auto-select first exam if none selected
    React.useEffect(() => {
        if (!selectedExamId && exams.length > 0) {
            setSelectedExamId(exams[0].examId);
        }
    }, [exams, selectedExamId]);

    const { data: publishStatusData, isLoading: statusLoading } = useGetExamPublishStatus(schoolId, selectedExamId);

    const finalPublishMutation = useFinalPublishExam(schoolId);
    const rollbackMutation = useRollbackSubjectPublish(schoolId);
    const remindTeacherMutation = useRemindTeacherMarks(schoolId);

    const publishSummary = publishStatusData?.data?.summary;
    const allSubjects = useMemo(() => {
        const raw = publishStatusData?.data?.subjects || [];
        return [...raw].sort((a, b) => compareClassesNumerically(a.className, b.className));
    }, [publishStatusData?.data?.subjects]);

    const filteredSubjects = useMemo(() => {
        if (statusFilter === 'all') return allSubjects;
        return allSubjects.filter(s => s.publishStatus === statusFilter);
    }, [allSubjects, statusFilter]);

    const selectedExam = exams.find(e => e.examId === selectedExamId);
    const publishedExams = exams.filter(e => e.status === 'published');

    // Handlers
    const handlePublishAll = () => {
        if (!selectedExamId) return;
        finalPublishMutation.mutate(
            { examId: selectedExamId },
            {
                onSuccess: (data: any) => {
                    setPublishAllConfirm(false);
                    showToast(data?.message || 'All marks published successfully and notifications sent!', 'success');
                },
                onError: (err: any) => {
                    showToast(err?.message || 'Failed to publish all results', 'error');
                }
            }
        );
    };

    const handlePublishSingle = (scheduleId: string) => {
        if (!selectedExamId || !scheduleId) return;
        finalPublishMutation.mutate(
            { examId: selectedExamId, scheduleId },
            {
                onSuccess: (data: any) => {
                    setPublishOneConfirm(null);
                    showToast(data?.message || 'Subject marks published successfully!', 'success');
                },
                onError: (err: any) => {
                    showToast(err?.message || 'Failed to publish subject results', 'error');
                }
            }
        );
    };

    const handleRollback = (scheduleId: string) => {
        if (!selectedExamId || !scheduleId) return;
        rollbackMutation.mutate(
            { examId: selectedExamId, scheduleId, reason: rollbackReason },
            {
                onSuccess: (data: any) => {
                    setRollbackConfirm(null);
                    setRollbackReason('');
                    showToast(data?.message || 'Subject marks rolled back to draft successfully.', 'info');
                },
                onError: (err: any) => {
                    showToast(err?.message || 'Failed to rollback subject results', 'error');
                }
            }
        );
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1300, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ mb: 2.5 }}>
                <Typography variant="h5" fontWeight={700} color="text.primary">
                    Exam Marks &amp; Results Management
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Review teacher submissions, release final published results to students &amp; parents, or rollback for revisions.
                </Typography>
            </Box>

            {/* Navigation Tabs */}
            <Paper elevation={0} variant="outlined" sx={{ borderRadius: 2, mb: 2.5, bgcolor: 'background.paper' }}>
                <Tabs
                    value={activeTab}
                    onChange={(_, val) => setActiveTab(val)}
                    textColor="primary"
                    indicatorColor="primary"
                    sx={{ px: 2 }}
                >
                    <Tab label="Marks Review &amp; Publishing" sx={{ textTransform: 'none', fontWeight: 600 }} />
                    <Tab label="Published Results &amp; Analytics" sx={{ textTransform: 'none', fontWeight: 600 }} />
                </Tabs>
            </Paper>

            {/* TAB 0: Marks Review & Publishing */}
            {activeTab === 0 && (
                <>
                    {/* Filter Bar */}
                    <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'background.paper' }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                                <FormControl size="small" fullWidth>
                                    <InputLabel>Academic Year</InputLabel>
                                    <Select
                                        value={yearFilter}
                                        label="Academic Year"
                                        onChange={(e) => { setYearFilter(e.target.value); }}
                                    >
                                        <MenuItem value="">All Academic Years</MenuItem>
                                        {academicYears.map((ay) => (
                                            <MenuItem key={ay._id || ay.code} value={ay.code}>
                                                {ay.name} {ay.isCurrent ? '(Current)' : ''}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 8, md: 5 }}>
                                <FormControl size="small" fullWidth>
                                    <InputLabel>Select Exam</InputLabel>
                                    <Select
                                        value={selectedExamId}
                                        label="Select Exam"
                                        onChange={(e) => setSelectedExamId(e.target.value)}
                                        disabled={examsLoading || exams.length === 0}
                                    >
                                        {exams.map((exam) => (
                                            <MenuItem key={exam.examId} value={exam.examId}>
                                                {exam.name} ({exam.academicYear || 'Academic'}) — {exam.status.toUpperCase()}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 1 }}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<PublishIcon />}
                                    disabled={!publishSummary || publishSummary.teacherPublishedCount === 0 || finalPublishMutation.isPending}
                                    onClick={() => setPublishAllConfirm(true)}
                                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 2.5 }}
                                >
                                    Publish All Subjects ({publishSummary?.teacherPublishedCount || 0})
                                </Button>
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* Summary KPI Cards */}
                    {publishSummary && (
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid size={{ xs: 6, sm: 3 }}>
                                <Paper elevation={0} variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center' }}>
                                    <Typography variant="caption" fontWeight={600} color="text.secondary">Total Subjects</Typography>
                                    <Typography variant="h5" fontWeight={700} color="text.primary" sx={{ mt: 0.5 }}>
                                        {publishSummary.totalSubjects}
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid size={{ xs: 6, sm: 3 }}>
                                <Paper elevation={0} variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center', borderColor: '#bfdbfe' }}>
                                    <Typography variant="caption" fontWeight={600} color="info.main">Ready to Publish (Teacher)</Typography>
                                    <Typography variant="h5" fontWeight={700} color="info.main" sx={{ mt: 0.5 }}>
                                        {publishSummary.teacherPublishedCount}
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid size={{ xs: 6, sm: 3 }}>
                                <Paper elevation={0} variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center', borderColor: '#bbf7d0' }}>
                                    <Typography variant="caption" fontWeight={600} color="success.main">Final Published</Typography>
                                    <Typography variant="h5" fontWeight={700} color="success.main" sx={{ mt: 0.5 }}>
                                        {publishSummary.finalPublishedCount}
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid size={{ xs: 6, sm: 3 }}>
                                <Paper elevation={0} variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center', borderColor: '#fed7aa' }}>
                                    <Typography variant="caption" fontWeight={600} color="warning.main">Pending Teacher (Draft)</Typography>
                                    <Typography variant="h5" fontWeight={700} color="warning.main" sx={{ mt: 0.5 }}>
                                        {publishSummary.draftCount}
                                    </Typography>
                                </Paper>
                            </Grid>
                        </Grid>
                    )}

                    {/* Subject Schedules Table */}
                    <Paper elevation={0} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                        {/* Table Header & Filter Chips */}
                        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="subtitle1" fontWeight={700}>
                                Subject Marks Submission &amp; Publication Status
                            </Typography>
                            <Stack direction="row" spacing={1}>
                                <Chip
                                    label="All"
                                    size="small"
                                    variant={statusFilter === 'all' ? 'filled' : 'outlined'}
                                    color={statusFilter === 'all' ? 'primary' : 'default'}
                                    onClick={() => setStatusFilter('all')}
                                    sx={{ fontWeight: 600, cursor: 'pointer' }}
                                />
                                <Chip
                                    label="Ready to Publish"
                                    size="small"
                                    variant={statusFilter === 'teacher_published' ? 'filled' : 'outlined'}
                                    color={statusFilter === 'teacher_published' ? 'info' : 'default'}
                                    onClick={() => setStatusFilter('teacher_published')}
                                    sx={{ fontWeight: 600, cursor: 'pointer' }}
                                />
                                <Chip
                                    label="Final Published"
                                    size="small"
                                    variant={statusFilter === 'final_published' ? 'filled' : 'outlined'}
                                    color={statusFilter === 'final_published' ? 'success' : 'default'}
                                    onClick={() => setStatusFilter('final_published')}
                                    sx={{ fontWeight: 600, cursor: 'pointer' }}
                                />
                                <Chip
                                    label="Draft"
                                    size="small"
                                    variant={statusFilter === 'draft' ? 'filled' : 'outlined'}
                                    color={statusFilter === 'draft' ? 'warning' : 'default'}
                                    onClick={() => setStatusFilter('draft')}
                                    sx={{ fontWeight: 600, cursor: 'pointer' }}
                                />
                            </Stack>
                        </Box>

                        {statusLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                                <CircularProgress size={36} />
                            </Box>
                        ) : filteredSubjects.length === 0 ? (
                            <Box sx={{ p: 6, textAlign: 'center' }}>
                                <Typography color="text.secondary">No subject schedules found for this exam.</Typography>
                            </Box>
                        ) : (
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: 'grey.50' }}>
                                            <TableCell sx={{ fontWeight: 700 }}>Class &amp; Section</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Exam Timing</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }} align="center">Evaluated</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredSubjects.map((sub) => {
                                            const isTeacherPub = sub.publishStatus === 'teacher_published';
                                            const isFinalPub = sub.publishStatus === 'final_published';

                                            return (
                                                <TableRow key={sub._id} hover>
                                                    <TableCell sx={{ fontWeight: 600 }}>{sub.className}</TableCell>
                                                    <TableCell>{sub.subjectName}</TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                                                            {sub.date ? new Date(sub.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {sub.startTime} – {sub.endTime}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Typography variant="body2" fontWeight={600} color={sub.evaluatedStudents > 0 ? 'text.primary' : 'text.disabled'}>
                                                            {sub.evaluatedStudents} / {sub.totalStudents || '—'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        {isFinalPub ? (
                                                            <Chip
                                                                size="small"
                                                                icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                                                                label="Final Published"
                                                                color="success"
                                                                sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                                                            />
                                                        ) : isTeacherPub ? (
                                                            <Chip
                                                                size="small"
                                                                icon={<PublishIcon sx={{ fontSize: '14px !important' }} />}
                                                                label="Submitted by Teacher"
                                                                color="info"
                                                                sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                                                            />
                                                        ) : (
                                                            <Chip
                                                                size="small"
                                                                icon={<ScheduleIcon sx={{ fontSize: '14px !important' }} />}
                                                                label="Draft / Pending"
                                                                color="warning"
                                                                variant="outlined"
                                                                sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                                                            />
                                                        )}
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Stack direction="row" spacing={1} justifyContent="center">
                                                            {/* View Marks */}
                                                            <Tooltip title="View Marks List" arrow>
                                                                <span>
                                                                    <IconButton
                                                                        size="small"
                                                                        color="primary"
                                                                        onClick={() => setViewSubject(sub)}
                                                                        disabled={sub.evaluatedStudents === 0}
                                                                        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
                                                                    >
                                                                        <ViewIcon fontSize="small" />
                                                                    </IconButton>
                                                                </span>
                                                            </Tooltip>

                                                            {/* Remind Teacher (For Draft state) */}
                                                            {!isTeacherPub && !isFinalPub && (
                                                                <Tooltip title="Send in-app reminder to subject teacher" arrow>
                                                                    <Button
                                                                        size="small"
                                                                        variant="outlined"
                                                                        color="info"
                                                                        startIcon={<RemindIcon />}
                                                                        onClick={() => {
                                                                            remindTeacherMutation.mutate(
                                                                                { examId: selectedExamId, scheduleId: sub._id },
                                                                                {
                                                                                    onSuccess: (data: any) => {
                                                                                        showToast(data?.message || 'Reminder sent to teacher successfully!', 'success');
                                                                                    },
                                                                                    onError: (err: any) => {
                                                                                        showToast(err?.message || 'Failed to send reminder', 'error');
                                                                                    }
                                                                                }
                                                                            );
                                                                        }}
                                                                        disabled={remindTeacherMutation.isPending}
                                                                        sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', borderRadius: 1.5, py: 0.25 }}
                                                                    >
                                                                        Remind
                                                                    </Button>
                                                                </Tooltip>
                                                            )}

                                                            {/* Publish One by One */}
                                                            {!isFinalPub && (
                                                                <Button
                                                                    size="small"
                                                                    variant="contained"
                                                                    color="primary"
                                                                    startIcon={<PublishIcon />}
                                                                    onClick={() => setPublishOneConfirm(sub)}
                                                                    disabled={sub.evaluatedStudents === 0 || finalPublishMutation.isPending}
                                                                    sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', borderRadius: 1.5, py: 0.25 }}
                                                                >
                                                                    Publish
                                                                </Button>
                                                            )}

                                                            {/* Rollback to Draft */}
                                                            {(isTeacherPub || isFinalPub) && (
                                                                <Tooltip title="Rollback to Draft (Allow teacher to edit)" arrow>
                                                                    <Button
                                                                        size="small"
                                                                        variant="outlined"
                                                                        color="warning"
                                                                        startIcon={<RollbackIcon />}
                                                                        onClick={() => setRollbackConfirm(sub)}
                                                                        disabled={rollbackMutation.isPending}
                                                                        sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', borderRadius: 1.5, py: 0.25 }}
                                                                    >
                                                                        Rollback
                                                                    </Button>
                                                                </Tooltip>
                                                            )}
                                                        </Stack>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Paper>
                </>
            )}

            {/* TAB 1: Published Results & Analytics */}
            {activeTab === 1 && (
                <>
                    {publishedExams.length === 0 ? (
                        <Paper elevation={0} variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
                            <TrendingUpIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
                            <Typography variant="h6" color="text.secondary">No Published Exams Yet</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Once you publish subjects or full exams in the "Marks Review &amp; Publishing" tab, analytics will appear here.
                            </Typography>
                        </Paper>
                    ) : (
                        <Grid container spacing={2}>
                            {publishedExams.map((exam) => (
                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={exam.examId}>
                                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                                        <CardContent>
                                            <Typography variant="subtitle1" fontWeight={700}>{exam.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {exam.academicYear} • Published: {exam.resultPublishDate ? new Date(exam.resultPublishDate).toLocaleDateString() : 'Active'}
                                            </Typography>
                                            <Box sx={{ mt: 2 }}>
                                                <Chip label="Final Published" color="success" size="small" sx={{ fontWeight: 700 }} />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </>
            )}

            {/* View Marks Dialog */}
            {viewSubject && (
                <ViewMarksDialog
                    open={Boolean(viewSubject)}
                    onClose={() => setViewSubject(null)}
                    schoolId={schoolId}
                    examId={selectedExamId}
                    subject={viewSubject}
                />
            )}

            {/* Final Publish Single Subject Dialog */}
            <Dialog open={Boolean(publishOneConfirm)} onClose={() => setPublishOneConfirm(null)} maxWidth="xs" PaperProps={{ sx: { borderRadius: 2 } }}>
                <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PublishIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle1" fontWeight={700}>Final Publish Subject Marks</Typography>
                </DialogTitle>
                <DialogContent sx={{ pt: 0 }}>
                    <DialogContentText variant="body2" sx={{ lineHeight: 1.6 }}>
                        Are you sure you want to final-publish marks for <strong>{publishOneConfirm?.subjectName}</strong> ({publishOneConfirm?.className})?
                        <br /><br />
                        Once published:
                        • Students and parents will immediately receive in-app notifications.
                        • Marks will be visible in their student portal and report cards.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
                    <Button size="small" onClick={() => setPublishOneConfirm(null)} sx={{ textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button
                        size="small"
                        variant="contained"
                        startIcon={<PublishIcon />}
                        disabled={finalPublishMutation.isPending}
                        onClick={() => publishOneConfirm && handlePublishSingle(publishOneConfirm._id)}
                        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                    >
                        {finalPublishMutation.isPending ? 'Publishing...' : 'Yes, Final Publish'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Final Publish All Dialog */}
            <Dialog open={publishAllConfirm} onClose={() => setPublishAllConfirm(false)} maxWidth="xs" PaperProps={{ sx: { borderRadius: 2 } }}>
                <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PublishIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle1" fontWeight={700}>Publish All Subjects</Typography>
                </DialogTitle>
                <DialogContent sx={{ pt: 0 }}>
                    <DialogContentText variant="body2" sx={{ lineHeight: 1.6 }}>
                        Are you sure you want to final-publish marks for all <strong>{publishSummary?.teacherPublishedCount || 0}</strong> submitted subjects in <strong>{selectedExam?.name}</strong>?
                        <br /><br />
                        All participating students and parents will be notified and can view their results.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
                    <Button size="small" onClick={() => setPublishAllConfirm(false)} sx={{ textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button
                        size="small"
                        variant="contained"
                        startIcon={<PublishIcon />}
                        disabled={finalPublishMutation.isPending}
                        onClick={handlePublishAll}
                        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                    >
                        {finalPublishMutation.isPending ? 'Publishing...' : 'Yes, Publish All'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Rollback to Draft Dialog */}
            <Dialog open={Boolean(rollbackConfirm)} onClose={() => setRollbackConfirm(null)} maxWidth="xs" PaperProps={{ sx: { borderRadius: 2 } }}>
                <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <RollbackIcon color="warning" fontSize="small" />
                    <Typography variant="subtitle1" fontWeight={700}>Rollback Marks to Draft</Typography>
                </DialogTitle>
                <DialogContent sx={{ pt: 0 }}>
                    <DialogContentText variant="body2" sx={{ lineHeight: 1.6, mb: 2 }}>
                        Rollback marks for <strong>{rollbackConfirm?.subjectName}</strong> ({rollbackConfirm?.className}) back to Draft status?
                        <br />
                        This will unlock the marks entry for the subject teacher to edit or fix errors.
                    </DialogContentText>
                    <TextField
                        label="Reason for Rollback (Optional)"
                        size="small"
                        fullWidth
                        value={rollbackReason}
                        onChange={(e) => setRollbackReason(e.target.value)}
                        placeholder="e.g. Teacher requested correction for roll 12"
                    />
                </DialogContent>
                <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
                    <Button size="small" onClick={() => setRollbackConfirm(null)} sx={{ textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button
                        size="small"
                        variant="contained"
                        color="warning"
                        startIcon={<RollbackIcon />}
                        disabled={rollbackMutation.isPending}
                        onClick={() => rollbackConfirm && handleRollback(rollbackConfirm._id)}
                        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                    >
                        {rollbackMutation.isPending ? 'Rolling back...' : 'Confirm Rollback'}
                    </Button>
                </DialogActions>
            </Dialog>

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

export default ExamResults;
