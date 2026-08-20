import React, { useState } from 'react';
import {
    Box, Typography, Chip, Avatar, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Grid, CircularProgress,
    Alert, Divider, LinearProgress, Stack, IconButton, Tooltip, Paper,
} from '@mui/material';
import {
    CheckCircle as CheckIcon,
    HourglassEmpty as PendingIcon,
    Warning as LateIcon,
    RateReview as ReviewIcon,
    Download as DownloadIcon,
    Close as CloseIcon,
    Assignment as HwIcon,
} from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useApi from '../../../queries/useApi';
import TokenService from '../../../queries/token/tokenService';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { MobileCardItem, MobileCardList } from '../../../components/mobile';

interface SubmissionsViewProps {
    homeworkId: string;
    homeworkTitle: string;
    onClose: () => void;
}

const statusConfig: Record<string, { label: string; color: 'success' | 'warning' | 'error' | 'default' | 'info'; icon: React.ReactNode }> = {
    submitted: { label: 'Submitted', color: 'success', icon: <CheckIcon fontSize="small" /> },
    late: { label: 'Late', color: 'warning', icon: <LateIcon fontSize="small" /> },
    reviewed: { label: 'Reviewed', color: 'info', icon: <ReviewIcon fontSize="small" /> },
    not_submitted: { label: 'Not Submitted', color: 'error', icon: <PendingIcon fontSize="small" /> },
};

export const SubmissionsView: React.FC<SubmissionsViewProps> = ({ homeworkId, homeworkTitle, onClose }) => {
    const schoolId = TokenService.getSchoolId() || '';
    const isMobile = useIsMobile();
    const queryClient = useQueryClient();
    const [reviewTarget, setReviewTarget] = useState<any>(null);
    const [remarks, setRemarks] = useState('');
    const [marks, setMarks] = useState('');
    const [maxMarks, setMaxMarks] = useState('');

    const { data, isLoading, error } = useQuery({
        queryKey: ['homework-submissions', schoolId, homeworkId],
        queryFn: () => useApi<any>('GET', `/api/academics/school/${schoolId}/homework/${homeworkId}/submissions`),
        enabled: !!schoolId && !!homeworkId,
    });

    const reviewMutation = useMutation({
        mutationFn: ({ studentId, body }: { studentId: string; body: any }) =>
            useApi<any>('PATCH', `/api/academics/school/${schoolId}/homework/${homeworkId}/submissions/${studentId}/review`, body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['homework-submissions', schoolId, homeworkId] });
            setReviewTarget(null);
        },
    });

    const submissions: any[] = data?.data?.submissions || [];
    const summary = data?.data?.summary || { total: 0, submitted: 0, late: 0, reviewed: 0, notSubmitted: 0 };

    const handleReview = () => {
        if (!reviewTarget) return;
        reviewMutation.mutate({
            studentId: reviewTarget.studentId,
            body: { teacherRemarks: remarks, marksAwarded: Number(marks) || undefined, maxMarks: Number(maxMarks) || undefined },
        });
    };

    const summaryCards = [
        { label: 'Submitted', value: summary.submitted || 0, color: '#22c55e' },
        { label: 'Late', value: summary.late || 0, color: '#f59e0b' },
        { label: 'Reviewed', value: summary.reviewed || 0, color: '#3b82f6' },
        { label: 'Pending', value: summary.notSubmitted || 0, color: '#ef4444' },
    ];

    const completionPct = summary.total > 0
        ? Math.round(((summary.submitted + summary.late + summary.reviewed) / summary.total) * 100)
        : 0;

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box sx={{ p: { xs: 2, sm: 3 }, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <HwIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                    <Box>
                        <Typography fontWeight={700} sx={{ fontSize: { xs: '1rem', sm: '1.15rem' } }}>Submission Tracker</Typography>
                        <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: { xs: 200, sm: 400 } }}>{homeworkTitle}</Typography>
                    </Box>
                </Box>
                <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
            </Box>

            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
            ) : error ? (
                <Alert severity="error" sx={{ m: 2 }}>Failed to load submissions.</Alert>
            ) : (
                <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 2, sm: 3 } }}>
                    {/* Summary Stats */}
                    <Grid container spacing={1.5} sx={{ mb: 3 }}>
                        {summaryCards.map(s => (
                            <Grid size={{ xs: 6, sm: 3 }} key={s.label}>
                                <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                                    <Typography fontWeight={800} sx={{ fontSize: '1.5rem', color: s.color }}>{s.value}</Typography>
                                    <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Completion Progress */}
                    <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2" fontWeight={600}>Completion Rate</Typography>
                            <Typography variant="body2" fontWeight={700} color="primary">{completionPct}%</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={completionPct} sx={{ height: 8, borderRadius: 4 }} />
                        <Typography variant="caption" color="text.secondary">{summary.submitted + summary.late + summary.reviewed} of {summary.total} students submitted</Typography>
                    </Box>

                    <Divider sx={{ mb: 3 }} />

                    {/* Student List */}
                    {isMobile ? (
                        <MobileCardList isLoading={false} totalCount={submissions.length} itemCount={submissions.length} emptyTitle="No Students" emptyMessage="No students found">
                            {submissions.map((item: any) => {
                                const cfg = statusConfig[item.submissionStatus] || statusConfig.not_submitted;
                                return (
                                    <MobileCardItem
                                        key={item.studentId}
                                        title={item.studentName}
                                        subtitle={`Roll: ${item.rollNumber || '—'}`}
                                        badge={<Chip label={cfg.label} color={cfg.color} size="small" icon={cfg.icon as any} />}
                                        metaItems={item.submission ? [
                                            { label: 'Submitted', value: new Date(item.submission.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) },
                                            ...(item.submission.marksAwarded !== undefined ? [{ label: 'Marks', value: `${item.submission.marksAwarded}${item.submission.maxMarks ? `/${item.submission.maxMarks}` : ''}` }] : []),
                                        ] : []}
                                        rightAction={item.submission && item.submissionStatus !== 'not_submitted' ? (
                                            <Button size="small" variant="outlined" onClick={() => { setReviewTarget(item); setRemarks(item.submission?.teacherRemarks || ''); setMarks(String(item.submission?.marksAwarded || '')); setMaxMarks(String(item.submission?.maxMarks || '')); }}>
                                                Review
                                            </Button>
                                        ) : undefined}
                                    />
                                );
                            })}
                        </MobileCardList>
                    ) : (
                        <Stack spacing={1}>
                            {submissions.map((item: any) => {
                                const cfg = statusConfig[item.submissionStatus] || statusConfig.not_submitted;
                                return (
                                    <Paper key={item.studentId} elevation={0} sx={{ p: 2, borderRadius: 2.5, border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                        <Avatar sx={{ bgcolor: 'primary.light', width: 36, height: 36, fontSize: '0.85rem' }}>
                                            {item.studentName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                        </Avatar>
                                        <Box sx={{ flex: 1, minWidth: 120 }}>
                                            <Typography fontWeight={600} sx={{ fontSize: '0.9rem' }}>{item.studentName}</Typography>
                                            <Typography variant="caption" color="text.secondary">Roll: {item.rollNumber || '—'}</Typography>
                                        </Box>
                                        <Chip label={cfg.label} color={cfg.color} size="small" icon={cfg.icon as any} />
                                        {item.submission?.submittedAt && (
                                            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 120 }}>
                                                {new Date(item.submission.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </Typography>
                                        )}
                                        {item.submission?.marksAwarded !== undefined && (
                                            <Chip label={`${item.submission.marksAwarded}${item.submission.maxMarks ? `/${item.submission.maxMarks}` : ''} marks`} size="small" color="info" variant="outlined" />
                                        )}
                                        {item.submission?.attachmentUrl && (
                                            <Tooltip title="Download Submission">
                                                <IconButton size="small" component="a" href={item.submission.attachmentUrl} target="_blank"><DownloadIcon fontSize="small" /></IconButton>
                                            </Tooltip>
                                        )}
                                        {item.submissionStatus !== 'not_submitted' && (
                                            <Button size="small" variant="outlined" startIcon={<ReviewIcon />}
                                                onClick={() => { setReviewTarget(item); setRemarks(item.submission?.teacherRemarks || ''); setMarks(String(item.submission?.marksAwarded || '')); setMaxMarks(String(item.submission?.maxMarks || '')); }}>
                                                Review
                                            </Button>
                                        )}
                                    </Paper>
                                );
                            })}
                        </Stack>
                    )}
                </Box>
            )}

            {/* Review Dialog */}
            <Dialog open={!!reviewTarget} onClose={() => setReviewTarget(null)} fullWidth maxWidth="sm" fullScreen={isMobile}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                        <Typography fontWeight={700}>Review Submission</Typography>
                        <Typography variant="caption" color="text.secondary">{reviewTarget?.studentName}</Typography>
                    </Box>
                    <IconButton onClick={() => setReviewTarget(null)}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent>
                    {reviewTarget?.submission?.content && (
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>STUDENT ANSWER</Typography>
                            <Typography sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>{reviewTarget.submission.content}</Typography>
                        </Box>
                    )}
                    {reviewTarget?.submission?.attachmentUrl && (
                        <Button startIcon={<DownloadIcon />} component="a" href={reviewTarget.submission.attachmentUrl} target="_blank" sx={{ mb: 2 }}>
                            View Attachment ({reviewTarget.submission.attachmentFileName || 'File'})
                        </Button>
                    )}
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 6 }}>
                            <TextField label="Marks Awarded" type="number" value={marks} onChange={e => setMarks(e.target.value)} fullWidth size="small" />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <TextField label="Max Marks" type="number" value={maxMarks} onChange={e => setMaxMarks(e.target.value)} fullWidth size="small" />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField label="Teacher Remarks" multiline rows={3} value={remarks} onChange={e => setRemarks(e.target.value)} fullWidth placeholder="Enter feedback for the student..." />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button onClick={() => setReviewTarget(null)} color="inherit">Cancel</Button>
                    <Button variant="contained" onClick={handleReview} disabled={reviewMutation.isPending} startIcon={reviewMutation.isPending ? <CircularProgress size={14} /> : <CheckIcon />}>
                        {reviewMutation.isPending ? 'Saving...' : 'Save Review'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SubmissionsView;
