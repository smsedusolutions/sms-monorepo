import React, { useState } from 'react';
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
    Alert,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Tooltip,
    Grid,
    Card,
    CardContent,
    Divider,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import {
    Visibility as ViewIcon,
    CheckCircle as ApproveIcon,
    Cancel as RejectIcon,
    Assignment as AssignmentIcon,
} from '@mui/icons-material';
import {
    useGetExams,
    useUpdateExam,
    useGetExamTerms,
} from '../../../queries/Exam';
import TokenService from '../../../queries/token/tokenService';
import type { Exam } from '../../../types/exam.types';

const ExamApproval: React.FC = () => {
    const schoolId = TokenService.getSchoolId() || '';

    const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
    const [rejectDialog, setRejectDialog] = useState<Exam | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [yearFilter, setYearFilter] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const { data: examsData, isLoading, error } = useGetExams(schoolId, yearFilter || undefined);
    const { data: termsData } = useGetExamTerms(schoolId);
    const updateExam = useUpdateExam(schoolId);

    const allExams: Exam[] = examsData?.data || [];
    // Show exams in draft/pending status — principal reviews those
    const pendingExams = allExams.filter(
        (e) => e.status === 'draft'
    );
    const approvedExams = allExams.filter((e) => e.status === 'published');
    const terms = termsData?.data || [];

    const handleApprove = async (exam: Exam) => {
        try {
            await updateExam.mutateAsync({
                examId: exam.examId,
                data: { status: 'published' } as any,
            });
            setSuccessMsg(`Exam "${exam.name}" has been approved and published.`);
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch {
            // handled by mutation
        }
    };

    const handleReject = async () => {
        if (!rejectDialog) return;
        try {
            await updateExam.mutateAsync({
                examId: rejectDialog.examId,
                data: { status: 'draft', remarks: rejectionReason } as any,
            });
            setRejectDialog(null);
            setRejectionReason('');
            setSuccessMsg(`Exam "${rejectDialog.name}" has been sent back for revision.`);
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch {
            // handled by mutation
        }
    };

    const formatDate = (d?: string) =>
        d
            ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : '—';

    const getStatusChip = (exam: Exam) => {
        const status = exam.status || 'draft';
        const map: Record<string, { label: string; color: 'warning' | 'success' | 'default' | 'error' }> = {
            draft: { label: 'Pending Review', color: 'warning' },
            scheduled: { label: 'Scheduled', color: 'default' },
            ongoing: { label: 'Ongoing', color: 'default' },
            completed: { label: 'Completed', color: 'default' },
            results_processing: { label: 'Processing', color: 'default' },
            published: { label: 'Approved', color: 'success' },
        };
        const cfg = map[status] || { label: status, color: 'default' as const };
        return <Chip label={cfg.label} color={cfg.color} size="small" />;
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h5" fontWeight={600} gutterBottom>
                Exam Schedule Approvals
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Review and approve exam schedules. Approved exams will be visible to teachers, students, and parents.
            </Typography>

            {successMsg && (
                <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMsg('')}>
                    {successMsg}
                </Alert>
            )}

            {/* Summary */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <Card sx={{ border: '1px solid #fde68a', bgcolor: '#fffbeb' }}>
                        <CardContent sx={{ py: 2, textAlign: 'center' }}>
                            <Typography variant="h4" fontWeight={700} color="warning.main">
                                {pendingExams.length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">Pending Review</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <Card sx={{ border: '1px solid #bbf7d0', bgcolor: '#f0fdf4' }}>
                        <CardContent sx={{ py: 2, textAlign: 'center' }}>
                            <Typography variant="h4" fontWeight={700} color="success.main">
                                {approvedExams.length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">Approved</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <Card sx={{ border: '1px solid #e2e8f0' }}>
                        <CardContent sx={{ py: 2, textAlign: 'center' }}>
                            <Typography variant="h4" fontWeight={700} color="primary.main">
                                {allExams.length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">Total Exams</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Filter */}
            <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Academic Year</InputLabel>
                    <Select
                        value={yearFilter}
                        label="Academic Year"
                        onChange={(e) => setYearFilter(e.target.value)}
                    >
                        <MenuItem value="">All Years</MenuItem>
                        {terms
                            .map((t) => t.academicYear)
                            .filter((v, i, a) => a.indexOf(v) === i)
                            .map((year) => (
                                <MenuItem key={year} value={year}>{year}</MenuItem>
                            ))}
                    </Select>
                </FormControl>
            </Paper>

            {/* Table */}
            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error">Failed to load exam schedules. Please try again.</Alert>
            ) : allExams.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <AssignmentIcon sx={{ fontSize: 56, color: '#cbd5e1', mb: 2 }} />
                    <Typography color="text.secondary" variant="h6">No exam schedules found</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        When the School Admin creates an exam schedule, it will appear here.
                    </Typography>
                </Box>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                <TableCell sx={{ fontWeight: 700 }}>Exam Name</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Term</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Academic Year</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Start Date</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>End Date</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {allExams.map((exam) => {
                                const isPending = exam.status === 'draft' || (exam.status as string) === 'pending' || !exam.status;
                                return (
                                    <TableRow key={exam.examId} hover>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <AssignmentIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
                                                <Typography variant="body2" fontWeight={600}>
                                                    {exam.name}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {typeof exam.termId === 'object' ? (exam.termId as any)?.name : exam.termId || '—'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{exam.academicYear || '—'}</TableCell>
                                        <TableCell>{formatDate(exam.startDate)}</TableCell>
                                        <TableCell>{formatDate(exam.endDate)}</TableCell>
                                        <TableCell align="center">{getStatusChip(exam)}</TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                                <Tooltip title="View Details">
                                                    <IconButton size="small" onClick={() => setSelectedExam(exam)}>
                                                        <ViewIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                {isPending && (
                                                    <>
                                                        <Tooltip title="Approve">
                                                            <IconButton
                                                                size="small"
                                                                color="success"
                                                                onClick={() => handleApprove(exam)}
                                                                disabled={updateExam.isPending}
                                                            >
                                                                <ApproveIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Reject / Send Back">
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => setRejectDialog(exam)}
                                                            >
                                                                <RejectIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </>
                                                )}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* View Details Dialog */}
            <Dialog open={!!selectedExam} onClose={() => setSelectedExam(null)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ borderBottom: '1px solid #e2e8f0' }}>
                    Exam Details
                </DialogTitle>
                <DialogContent>
                    {selectedExam && (
                        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {[                                
                                { label: 'Exam Name', value: selectedExam.name },
                                { label: 'Term', value: typeof selectedExam.termId === 'object' ? (selectedExam.termId as any)?.name : selectedExam.termId || '—' },
                                { label: 'Academic Year', value: selectedExam.academicYear || '—' },
                                { label: 'Start Date', value: formatDate(selectedExam.startDate) },
                                { label: 'End Date', value: formatDate(selectedExam.endDate) },
                            ].map((item) => (
                                <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                                        {item.label}:
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600} sx={{ textAlign: 'right' }}>
                                        {item.value}
                                    </Typography>
                                </Box>
                            ))}
                            <Divider />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" color="text.secondary">Status:</Typography>
                                {getStatusChip(selectedExam)}
                            </Box>
                            {(selectedExam.status === 'draft' || !selectedExam.status) && (
                                <Alert severity="info" variant="outlined">
                                    Approving will publish this exam schedule — teachers, students, and parents will be able to see it.
                                </Alert>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                            {(selectedExam?.status === 'draft') && (
                        <>
                            <Button
                                color="success"
                                variant="outlined"
                                onClick={() => {
                                    if (selectedExam) handleApprove(selectedExam);
                                    setSelectedExam(null);
                                }}
                                disabled={updateExam.isPending}
                            >
                                Approve & Publish
                            </Button>
                            <Button
                                color="error"
                                variant="outlined"
                                onClick={() => {
                                    if (selectedExam) setRejectDialog(selectedExam);
                                    setSelectedExam(null);
                                }}
                            >
                                Reject
                            </Button>
                        </>
                    )}
                    <Button onClick={() => setSelectedExam(null)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog
                open={!!rejectDialog}
                onClose={() => { setRejectDialog(null); setRejectionReason(''); }}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ color: 'error.main', borderBottom: '1px solid #e2e8f0' }}>
                    ❌ Reject Exam Schedule
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Alert severity="warning" variant="outlined">
                                    Rejecting <strong>"{rejectDialog?.name}"</strong> will send it back to the School Admin for revision.
                        </Alert>
                        <TextField
                            label="Rejection Reason"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            multiline
                            rows={3}
                            fullWidth
                            placeholder="What needs to be changed or corrected?"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setRejectDialog(null); setRejectionReason(''); }}>Cancel</Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleReject}
                        disabled={updateExam.isPending || !rejectionReason.trim()}
                    >
                        {updateExam.isPending ? 'Processing...' : 'Confirm Reject'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ExamApproval;
