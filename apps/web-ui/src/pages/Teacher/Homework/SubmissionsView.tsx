import React, { useState, useMemo } from 'react';
import {
    Box, Typography, Chip, Avatar, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Grid, CircularProgress,
    Alert, LinearProgress, Stack, IconButton, Tooltip, Paper,
    Tabs, Tab, InputAdornment,
} from '@mui/material';
import {
    CheckCircle as CheckIcon,
    HourglassEmpty as PendingIcon,
    Warning as LateIcon,
    RateReview as ReviewIcon,
    Download as DownloadIcon,
    Close as CloseIcon,
    Assignment as HwIcon,
    ThumbUpAlt as AcceptIcon,
    EditNote as ChangesIcon,
    Cancel as RejectIcon,
    Search as SearchIcon,
} from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useApi from '../../../queries/useApi';
import TokenService from '../../../queries/token/tokenService';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { MobileCardItem, MobileCardList } from '../../../components/mobile';

interface SubmissionsViewProps {
    homeworkId: string;
    homeworkTitle: string;
    onClose?: () => void;
}

const statusConfig: Record<string, { label: string; color: 'success' | 'warning' | 'error' | 'default' | 'info' | 'primary'; icon: React.ReactNode; bg: string }> = {
    submitted: { label: 'Submitted', color: 'info', icon: <CheckIcon sx={{ fontSize: 16 }} />, bg: '#eff6ff' },
    late: { label: 'Late', color: 'warning', icon: <LateIcon sx={{ fontSize: 16 }} />, bg: '#fffbeb' },
    accepted: { label: 'Accepted', color: 'success', icon: <CheckIcon sx={{ fontSize: 16 }} />, bg: '#f0fdf4' },
    changes_requested: { label: 'Changes Requested', color: 'warning', icon: <ChangesIcon sx={{ fontSize: 16 }} />, bg: '#fff7ed' },
    rejected: { label: 'Rejected', color: 'error', icon: <RejectIcon sx={{ fontSize: 16 }} />, bg: '#fef2f2' },
    reviewed: { label: 'Reviewed', color: 'primary', icon: <ReviewIcon sx={{ fontSize: 16 }} />, bg: '#faf5ff' },
    not_submitted: { label: 'Not Submitted', color: 'default', icon: <PendingIcon sx={{ fontSize: 16 }} />, bg: '#f8fafc' },
};

export const SubmissionsView: React.FC<SubmissionsViewProps> = ({ homeworkId, homeworkTitle, onClose }) => {
    const schoolId = TokenService.getSchoolId() || '';
    const isMobile = useIsMobile();
    const queryClient = useQueryClient();
    const [reviewTarget, setReviewTarget] = useState<any>(null);
    const [selectedStatus, setSelectedStatus] = useState<'accepted' | 'changes_requested' | 'rejected' | 'reviewed'>('accepted');
    const [remarks, setRemarks] = useState('');
    const [marks, setMarks] = useState('');
    const [maxMarks, setMaxMarks] = useState('');
    const [tabFilter, setTabFilter] = useState<number>(0);
    const [searchQuery, setSearchQuery] = useState('');

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
    const summary = data?.data?.summary || {
        total: 0,
        submitted: 0,
        late: 0,
        reviewed: 0,
        accepted: 0,
        changes_requested: 0,
        rejected: 0,
        notSubmitted: 0
    };

    const handleOpenReview = (item: any, defaultStatus: 'accepted' | 'changes_requested' | 'rejected' | 'reviewed' = 'accepted') => {
        setReviewTarget(item);
        setSelectedStatus(defaultStatus);
        setRemarks(item.submission?.teacherRemarks || '');
        setMarks(item.submission?.marksAwarded !== undefined ? String(item.submission.marksAwarded) : '');
        setMaxMarks(item.submission?.maxMarks !== undefined ? String(item.submission.maxMarks) : '100');
    };

    const handleSaveReview = (statusToSave?: 'accepted' | 'changes_requested' | 'rejected' | 'reviewed') => {
        if (!reviewTarget) return;
        const status = statusToSave || selectedStatus;
        reviewMutation.mutate({
            studentId: reviewTarget.studentId,
            body: {
                status,
                teacherRemarks: remarks,
                marksAwarded: marks !== '' ? Number(marks) : undefined,
                maxMarks: maxMarks !== '' ? Number(maxMarks) : undefined,
            },
        });
    };

    // Filter & Sort submissions (who submitted first is on top)
    const filteredSubmissions = useMemo(() => {
        return submissions
            .filter((item) => {
                const matchesSearch =
                    item.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase());

                if (!matchesSearch) return false;

                switch (tabFilter) {
                    case 1: // Submitted & Late (Pending Review)
                        return item.submissionStatus === 'submitted' || item.submissionStatus === 'late';
                    case 2: // Accepted
                        return item.submissionStatus === 'accepted';
                    case 3: // Changes Requested
                        return item.submissionStatus === 'changes_requested';
                    case 4: // Rejected
                        return item.submissionStatus === 'rejected';
                    case 5: // Not Submitted
                        return item.submissionStatus === 'not_submitted';
                    default: // All
                        return true;
                }
            })
            .sort((a, b) => {
                const timeA = a.submission?.submittedAt ? new Date(a.submission.submittedAt).getTime() : null;
                const timeB = b.submission?.submittedAt ? new Date(b.submission.submittedAt).getTime() : null;

                if (timeA !== null && timeB !== null) {
                    return timeA - timeB; // Earliest submitted first (first submitter on top)
                }
                if (timeA !== null) return -1;
                if (timeB !== null) return 1;

                const rollA = a.rollNumber || '';
                const rollB = b.rollNumber || '';
                if (rollA && rollB) {
                    return rollA.localeCompare(rollB, undefined, { numeric: true });
                }
                return (a.studentName || '').localeCompare(b.studentName || '');
            });
    }, [submissions, searchQuery, tabFilter]);

    const summaryCards = [
        { label: 'Total Students', value: summary.total || 0, color: '#475569' },
        { label: 'Submitted', value: (summary.submitted || 0) + (summary.late || 0), color: '#3b82f6' },
        { label: 'Accepted', value: summary.accepted || 0, color: '#16a34a' },
        { label: 'Changes Req.', value: summary.changes_requested || 0, color: '#f59e0b' },
        { label: 'Rejected', value: summary.rejected || 0, color: '#ef4444' },
        { label: 'Pending', value: summary.notSubmitted || 0, color: '#94a3b8' },
    ];

    const submittedTotal = (summary.submitted || 0) + (summary.late || 0) + (summary.accepted || 0) + (summary.changes_requested || 0) + (summary.rejected || 0) + (summary.reviewed || 0);
    const completionPct = summary.total > 0 ? Math.round((submittedTotal / summary.total) * 100) : 0;

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box sx={{
                p: { xs: 2, sm: 2.5 },
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1
            }}>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <HwIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                    <Box>
                        <Typography fontWeight={700} sx={{ fontSize: { xs: '1rem', sm: '1.15rem' }, color: '#0f172a' }}>
                            Submissions & Grading
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: { xs: 240, sm: 500 } }}>
                            {homeworkTitle}
                        </Typography>
                    </Box>
                </Box>
                {onClose && (
                    <IconButton onClick={onClose} size="small" sx={{ color: '#64748b' }}>
                        <CloseIcon />
                    </IconButton>
                )}
            </Box>

            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
            ) : error ? (
                <Alert severity="error" sx={{ m: 2 }}>Failed to load submissions.</Alert>
            ) : (
                <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 2, sm: 2.5 } }}>
                    {/* Summary Metrics */}
                    <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                        {summaryCards.map(s => (
                            <Grid size={{ xs: 4, sm: 2 }} key={s.label}>
                                <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid #e2e8f0', textAlign: 'center', bgcolor: '#ffffff' }}>
                                    <Typography fontWeight={800} sx={{ fontSize: { xs: '1.2rem', sm: '1.4rem' }, color: s.color }}>
                                        {s.value}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', fontWeight: 600 }}>
                                        {s.label}
                                    </Typography>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Progress Bar */}
                    <Box sx={{ mb: 3, p: 2, borderRadius: 2, bgcolor: '#ffffff', border: '1px solid #e2e8f0' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                            <Typography variant="body2" fontWeight={600} color="#1e293b">
                                Class Submission Progress
                            </Typography>
                            <Typography variant="body2" fontWeight={700} color="primary.main">
                                {submittedTotal} / {summary.total} ({completionPct}%)
                            </Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={completionPct} sx={{ height: 8, borderRadius: 4, bgcolor: '#f1f5f9' }} />
                    </Box>

                    {/* Search & Filter Bar */}
                    <Box sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        justifyContent: 'space-between',
                        alignItems: { xs: 'stretch', md: 'center' },
                        gap: 1.5,
                        mb: 2
                    }}>
                        <Tabs
                            value={tabFilter}
                            onChange={(_, v) => setTabFilter(v)}
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{
                                minHeight: 38,
                                '& .MuiTab-root': {
                                    fontWeight: 600,
                                    fontSize: '0.82rem',
                                    textTransform: 'none',
                                    minHeight: 38,
                                    py: 0.5,
                                    px: 1.5
                                }
                            }}
                        >
                            <Tab label={`All (${submissions.length})`} />
                            <Tab label={`Pending (${(summary.submitted || 0) + (summary.late || 0)})`} />
                            <Tab label={`Accepted (${summary.accepted || 0})`} />
                            <Tab label={`Changes Req. (${summary.changes_requested || 0})`} />
                            <Tab label={`Rejected (${summary.rejected || 0})`} />
                            <Tab label={`Not Submitted (${summary.notSubmitted || 0})`} />
                        </Tabs>

                        <TextField
                            size="small"
                            placeholder="Search student or roll..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ fontSize: 18, color: '#94a3b8' }} />
                                        </InputAdornment>
                                    ),
                                }
                            }}
                            sx={{ minWidth: { xs: '100%', md: 240 } }}
                        />
                    </Box>

                    {/* Submissions List / Table */}
                    {filteredSubmissions.length === 0 ? (
                        <Paper elevation={0} sx={{ textAlign: 'center', py: 6, px: 2, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                            <Typography variant="subtitle1" fontWeight={600} color="#1e293b">
                                No submissions match the filter
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Try changing the status tab or search keyword.
                            </Typography>
                        </Paper>
                    ) : isMobile ? (
                        <MobileCardList isLoading={false} totalCount={filteredSubmissions.length} itemCount={filteredSubmissions.length} emptyTitle="No Students" emptyMessage="No students found">
                            {filteredSubmissions.map((item: any) => {
                                const cfg = statusConfig[item.submissionStatus] || statusConfig.not_submitted;
                                return (
                                    <MobileCardItem
                                        key={item.studentId}
                                        title={item.studentName}
                                        subtitle={`Roll: ${item.rollNumber || '—'}`}
                                        badge={<Chip label={cfg.label} color={cfg.color as any} size="small" icon={cfg.icon as any} />}
                                        metaItems={item.submission ? [
                                            { label: 'Submitted', value: new Date(item.submission.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) },
                                            ...(item.submission.marksAwarded !== undefined ? [{ label: 'Marks', value: `${item.submission.marksAwarded}${item.submission.maxMarks ? `/${item.submission.maxMarks}` : ''}` }] : []),
                                            ...(item.submission.teacherRemarks ? [{ label: 'Feedback', value: item.submission.teacherRemarks }] : []),
                                        ] : []}
                                        rightAction={item.submission ? (
                                            <Button size="small" variant="outlined" onClick={() => handleOpenReview(item)}>
                                                Review
                                            </Button>
                                        ) : undefined}
                                    />
                                );
                            })}
                        </MobileCardList>
                    ) : (
                        <Stack spacing={1.25}>
                            {filteredSubmissions.map((item: any) => {
                                const cfg = statusConfig[item.submissionStatus] || statusConfig.not_submitted;
                                const hasSub = !!item.submission;

                                return (
                                    <Paper
                                        key={item.studentId}
                                        elevation={0}
                                        sx={{
                                            p: 2,
                                            borderRadius: 2,
                                            border: '1px solid #e2e8f0',
                                            bgcolor: '#ffffff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: 2,
                                            flexWrap: 'wrap',
                                            transition: 'border-color 0.15s ease',
                                            '&:hover': { borderColor: '#cbd5e1' }
                                        }}
                                    >
                                        {/* Student Info */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 200, flex: 1.2 }}>
                                            <Avatar sx={{ bgcolor: '#4f46e5', width: 38, height: 38, fontSize: '0.88rem', fontWeight: 700 }}>
                                                {item.studentName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                            </Avatar>
                                            <Box>
                                                <Typography fontWeight={700} sx={{ fontSize: '0.92rem', color: '#0f172a' }}>
                                                    {item.studentName}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Roll No: <strong>{item.rollNumber || '—'}</strong>
                                                </Typography>
                                            </Box>
                                        </Box>

                                        {/* Status Badge */}
                                        <Box sx={{ minWidth: 130 }}>
                                            <Chip
                                                label={cfg.label}
                                                color={cfg.color as any}
                                                size="small"
                                                icon={cfg.icon as any}
                                                sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                                            />
                                        </Box>

                                        {/* Submission Details */}
                                        <Box sx={{ minWidth: 160, flex: 1 }}>
                                            {hasSub ? (
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                        Submitted: {new Date(item.submission.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                    </Typography>
                                                    {item.submission.marksAwarded !== undefined && (
                                                        <Typography variant="caption" sx={{ color: '#0284c7', fontWeight: 700, display: 'block' }}>
                                                            Marks: {item.submission.marksAwarded}{item.submission.maxMarks ? `/${item.submission.maxMarks}` : ''}
                                                        </Typography>
                                                    )}
                                                    {item.submission.teacherRemarks && (
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                            Note: {item.submission.teacherRemarks}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            ) : (
                                                <Typography variant="caption" color="text.disabled">
                                                    No submission yet
                                                </Typography>
                                            )}
                                        </Box>

                                        {/* Attachment */}
                                        <Box sx={{ minWidth: 40, display: 'flex', alignItems: 'center' }}>
                                            {item.submission?.attachmentUrl ? (
                                                <Tooltip title={`View/Download ${item.submission.attachmentFileName || 'Attachment'}`}>
                                                    <IconButton size="small" component="a" href={item.submission.attachmentUrl} target="_blank" sx={{ color: '#4f46e5', bgcolor: '#eef2ff' }}>
                                                        <DownloadIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            ) : null}
                                        </Box>

                                        {/* Review / Decision Actions */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 200, justifyContent: 'flex-end' }}>
                                            {hasSub ? (
                                                <>
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        color="success"
                                                        startIcon={<AcceptIcon sx={{ fontSize: 16 }} />}
                                                        onClick={() => handleOpenReview(item, 'accepted')}
                                                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, py: 0.4, px: 1.25, fontSize: '0.78rem' }}
                                                    >
                                                        Accept
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        color="warning"
                                                        startIcon={<ChangesIcon sx={{ fontSize: 16 }} />}
                                                        onClick={() => handleOpenReview(item, 'changes_requested')}
                                                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, py: 0.4, px: 1.25, fontSize: '0.78rem' }}
                                                    >
                                                        Changes
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        color="error"
                                                        startIcon={<RejectIcon sx={{ fontSize: 16 }} />}
                                                        onClick={() => handleOpenReview(item, 'rejected')}
                                                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, py: 0.4, px: 1, fontSize: '0.78rem' }}
                                                    >
                                                        Reject
                                                    </Button>
                                                </>
                                            ) : (
                                                <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                                                    Awaiting submission
                                                </Typography>
                                            )}
                                        </Box>
                                    </Paper>
                                );
                            })}
                        </Stack>
                    )}
                </Box>
            )}

            {/* Review & Grading Dialog */}
            <Dialog open={!!reviewTarget} onClose={() => setReviewTarget(null)} fullWidth maxWidth="sm" fullScreen={isMobile}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                    <Box>
                        <Typography fontWeight={700} sx={{ fontSize: '1.1rem', color: '#0f172a' }}>Review & Grade Submission</Typography>
                        <Typography variant="caption" color="text.secondary">Student: <strong>{reviewTarget?.studentName}</strong> (Roll: {reviewTarget?.rollNumber || '—'})</Typography>
                    </Box>
                    <IconButton onClick={() => setReviewTarget(null)} size="small"><CloseIcon /></IconButton>
                </DialogTitle>

                <DialogContent sx={{ pt: 1 }}>
                    {/* Student Answer preview */}
                    {reviewTarget?.submission?.content && (
                        <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, mb: 2.5, border: '1px solid #e2e8f0' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Student Submitted Answer
                            </Typography>
                            <Typography sx={{ mt: 0.75, whiteSpace: 'pre-wrap', fontSize: '0.88rem', color: '#334155' }}>
                                {reviewTarget.submission.content}
                            </Typography>
                        </Box>
                    )}

                    {/* Attachment Link */}
                    {reviewTarget?.submission?.attachmentUrl && (
                        <Button
                            startIcon={<DownloadIcon />}
                            component="a"
                            href={reviewTarget.submission.attachmentUrl}
                            target="_blank"
                            variant="outlined"
                            sx={{ mb: 2.5, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                        >
                            Open Attached File ({reviewTarget.submission.attachmentFileName || 'Attachment'})
                        </Button>
                    )}

                    {/* Review Decision Selector */}
                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', display: 'block', mb: 1 }}>
                        Review Decision
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2.5, flexWrap: 'wrap' }}>
                        <Button
                            variant={selectedStatus === 'accepted' ? 'contained' : 'outlined'}
                            color="success"
                            startIcon={<AcceptIcon />}
                            onClick={() => setSelectedStatus('accepted')}
                            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, flex: 1 }}
                        >
                            Accept
                        </Button>
                        <Button
                            variant={selectedStatus === 'changes_requested' ? 'contained' : 'outlined'}
                            color="warning"
                            startIcon={<ChangesIcon />}
                            onClick={() => setSelectedStatus('changes_requested')}
                            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, flex: 1 }}
                        >
                            Request Changes
                        </Button>
                        <Button
                            variant={selectedStatus === 'rejected' ? 'contained' : 'outlined'}
                            color="error"
                            startIcon={<RejectIcon />}
                            onClick={() => setSelectedStatus('rejected')}
                            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, flex: 1 }}
                        >
                            Reject
                        </Button>
                    </Box>

                    {/* Marks & Remarks */}
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 6 }}>
                            <TextField
                                label="Marks Awarded"
                                type="number"
                                value={marks}
                                onChange={e => setMarks(e.target.value)}
                                fullWidth
                                size="small"
                                placeholder="e.g. 85"
                            />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <TextField
                                label="Maximum Marks"
                                type="number"
                                value={maxMarks}
                                onChange={e => setMaxMarks(e.target.value)}
                                fullWidth
                                size="small"
                                placeholder="e.g. 100"
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                label="Teacher Remarks & Feedback"
                                multiline
                                rows={3}
                                value={remarks}
                                onChange={e => setRemarks(e.target.value)}
                                fullWidth
                                placeholder={
                                    selectedStatus === 'changes_requested'
                                        ? "Explain what needs to be improved or corrected..."
                                        : selectedStatus === 'rejected'
                                        ? "Reason for rejection..."
                                        : "Provide positive feedback or comments for the student..."
                                }
                            />
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ p: 2, gap: 1, borderTop: '1px solid #f1f5f9' }}>
                    <Button onClick={() => setReviewTarget(null)} color="inherit" sx={{ fontWeight: 600 }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color={selectedStatus === 'accepted' ? 'success' : selectedStatus === 'changes_requested' ? 'warning' : 'error'}
                        onClick={() => handleSaveReview()}
                        disabled={reviewMutation.isPending}
                        startIcon={reviewMutation.isPending ? <CircularProgress size={14} /> : <CheckIcon />}
                        sx={{ fontWeight: 700, px: 2.5, borderRadius: 2 }}
                    >
                        {reviewMutation.isPending ? 'Saving...' : `Save as ${selectedStatus.replace('_', ' ').toUpperCase()}`}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SubmissionsView;
