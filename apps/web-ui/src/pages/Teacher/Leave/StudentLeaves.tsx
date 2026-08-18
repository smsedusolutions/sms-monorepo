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
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Grid,
    Stack,
    Divider,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import {
    Visibility as ViewIcon,
    CheckCircle as ApproveIcon,
    Cancel as RejectIcon,
    PendingActions as PendingIcon,
    CalendarToday as CalendarIcon,
    EventNote as ReasonIcon,
    Person as PersonIcon,
} from '@mui/icons-material';
import { useGetStudentLeavesForTeacher, useProcessLeave } from '../../../queries/Leave';
import TokenService from '../../../queries/token/tokenService';
import type { LeaveRequest, LeaveStatus } from '../../../types';

const statusConfig: Record<LeaveStatus, { color: 'warning' | 'success' | 'error'; icon: React.ReactNode; label: string; bg: string; text: string }> = {
    pending: { color: 'warning', icon: <PendingIcon sx={{ fontSize: 16 }} />, label: 'Pending', bg: '#fffbeb', text: '#b45309' },
    approved: { color: 'success', icon: <ApproveIcon sx={{ fontSize: 16 }} />, label: 'Approved', bg: '#f0fdf4', text: '#15803d' },
    rejected: { color: 'error', icon: <RejectIcon sx={{ fontSize: 16 }} />, label: 'Rejected', bg: '#fef2f2', text: '#b91c1c' },
};

const TeacherStudentLeaves: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const schoolId = TokenService.getSchoolId() || '';

    const [statusFilter, setStatusFilter] = useState<string>('pending');
    const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
    const [processDialog, setProcessDialog] = useState<{ leave: LeaveRequest; action: 'approve' | 'reject' } | null>(null);
    const [remarks, setRemarks] = useState('');

    const { data, isLoading, error } = useGetStudentLeavesForTeacher(schoolId, { status: statusFilter || undefined });
    const processMutation = useProcessLeave(schoolId);

    const leaves = data?.data?.leaves || [];
    const summary = data?.data?.summary;

    const handleProcess = async () => {
        if (!processDialog) return;
        try {
            await processMutation.mutateAsync({
                leaveId: processDialog.leave.leaveId,
                action: processDialog.action,
                remarks: remarks.trim() || undefined,
            });
            setProcessDialog(null);
            setRemarks('');
        } catch {
            // handled by mutation
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ mb: 2.5 }}>
                <Typography variant={isMobile ? "h6" : "h5"} fontWeight={700} color="text.primary">
                    Student Leave Requests
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Review and approve or reject leave requests submitted by your class students
                </Typography>
            </Box>

            {/* Summary Stat Bar */}
            {summary && (
                <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                    <Grid size={{ xs: 3, sm: 3 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 1.25, sm: 2 },
                                textAlign: 'center',
                                bgcolor: 'grey.50',
                                borderRadius: 2.5,
                                border: '1px solid',
                                borderColor: 'divider',
                            }}
                        >
                            <Typography variant={isMobile ? "h6" : "h5"} fontWeight={700} color="text.primary">
                                {summary.total}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                Total
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 3, sm: 3 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 1.25, sm: 2 },
                                textAlign: 'center',
                                bgcolor: '#fffbeb',
                                borderRadius: 2.5,
                                border: '1px solid',
                                borderColor: '#fde68a',
                            }}
                        >
                            <Typography variant={isMobile ? "h6" : "h5"} fontWeight={700} color="#b45309">
                                {summary.pending}
                            </Typography>
                            <Typography variant="caption" color="#92400e" fontWeight={600}>
                                Pending
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 3, sm: 3 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 1.25, sm: 2 },
                                textAlign: 'center',
                                bgcolor: '#f0fdf4',
                                borderRadius: 2.5,
                                border: '1px solid',
                                borderColor: '#bbf7d0',
                            }}
                        >
                            <Typography variant={isMobile ? "h6" : "h5"} fontWeight={700} color="#15803d">
                                {summary.approved}
                            </Typography>
                            <Typography variant="caption" color="#166534" fontWeight={600}>
                                Approved
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 3, sm: 3 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 1.25, sm: 2 },
                                textAlign: 'center',
                                bgcolor: '#fef2f2',
                                borderRadius: 2.5,
                                border: '1px solid',
                                borderColor: '#fecaca',
                            }}
                        >
                            <Typography variant={isMobile ? "h6" : "h5"} fontWeight={700} color="#b91c1c">
                                {summary.rejected}
                            </Typography>
                            <Typography variant="caption" color="#991b1b" fontWeight={600}>
                                Rejected
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {/* Filter Buttons */}
            <Box sx={{ mb: 2.5 }}>
                <ToggleButtonGroup
                    value={statusFilter}
                    exclusive
                    onChange={(_, val) => val !== null && setStatusFilter(val)}
                    size="small"
                    fullWidth
                    sx={{
                        display: 'flex',
                        gap: 0.5,
                        '& .MuiToggleButton-root': {
                            flex: 1,
                            py: 0.75,
                            px: 1,
                            fontSize: { xs: '0.75rem', sm: '0.85rem' },
                            fontWeight: 600,
                            textTransform: 'capitalize',
                            borderRadius: '8px !important',
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.paper',
                            color: 'text.secondary',
                            '&.Mui-selected': {
                                bgcolor: 'primary.main',
                                color: '#ffffff',
                                borderColor: 'primary.main',
                                '&:hover': {
                                    bgcolor: 'primary.dark',
                                },
                            },
                        },
                    }}
                >
                    <ToggleButton value="">All ({summary?.total ?? leaves.length})</ToggleButton>
                    <ToggleButton value="pending">Pending ({summary?.pending ?? 0})</ToggleButton>
                    <ToggleButton value="approved">Approved ({summary?.approved ?? 0})</ToggleButton>
                    <ToggleButton value="rejected">Rejected ({summary?.rejected ?? 0})</ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* Content Area */}
            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress size={36} />
                </Box>
            ) : error ? (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                    Failed to load student leave requests.
                </Alert>
            ) : leaves.length === 0 ? (
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        textAlign: 'center',
                        borderRadius: 3,
                        border: '1px dashed',
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                    }}
                >
                    <CalendarIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
                    <Typography variant="subtitle1" fontWeight={600} color="text.primary" gutterBottom>
                        No leave requests found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {statusFilter
                            ? `There are no ${statusFilter} student leave requests.`
                            : 'No student leave applications have been submitted yet.'}
                    </Typography>
                </Paper>
            ) : isMobile ? (
                /* Mobile Card List View */
                <Stack spacing={1.5}>
                    {leaves.map((leave) => {
                        const statusMeta = statusConfig[leave.status] || statusConfig.pending;
                        return (
                            <Paper
                                key={leave.leaveId}
                                elevation={0}
                                sx={{
                                    p: 2,
                                    borderRadius: 2.5,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    bgcolor: 'background.paper',
                                }}
                            >
                                {/* Top Row: Student Name + Status */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.25 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <PersonIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                                        <Typography variant="subtitle2" fontWeight={700}>
                                            {leave.applicantName}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        icon={statusMeta.icon as React.ReactElement}
                                        label={statusMeta.label}
                                        size="small"
                                        sx={{
                                            bgcolor: statusMeta.bg,
                                            color: statusMeta.text,
                                            fontWeight: 700,
                                            fontSize: '0.75rem',
                                            borderRadius: 1.5,
                                        }}
                                    />
                                </Box>

                                {/* Date & Type Bar */}
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        p: 1,
                                        bgcolor: 'grey.50',
                                        borderRadius: 1.5,
                                        mb: 1.25,
                                    }}
                                >
                                    <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                    <Typography variant="body2" fontWeight={600} color="text.primary">
                                        {formatDate(leave.startDate)} — {formatDate(leave.endDate)}
                                    </Typography>
                                    <Chip
                                        label={`${leave.numberOfDays || 1} day${(leave.numberOfDays || 1) > 1 ? 's' : ''}`}
                                        size="small"
                                        sx={{
                                            ml: 'auto',
                                            height: 20,
                                            fontSize: '0.7rem',
                                            fontWeight: 600,
                                            bgcolor: 'primary.50',
                                            color: 'primary.main',
                                        }}
                                    />
                                </Box>

                                {/* Reason Snippet */}
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, mb: 1.5 }}>
                                    <ReasonIcon sx={{ fontSize: 15, color: 'text.disabled', mt: 0.25 }} />
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                        }}
                                    >
                                        <strong style={{ color: '#374151' }}>{leave.leaveType.toUpperCase()}: </strong>
                                        {leave.reason || 'No reason provided'}
                                    </Typography>
                                </Box>

                                <Divider sx={{ mb: 1.25 }} />

                                {/* Card Footer: Actions */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="caption" color="text.disabled">
                                        ID: {leave.leaveId}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => setSelectedLeave(leave)}
                                            sx={{ textTransform: 'none', borderRadius: 1.5, fontSize: '0.75rem', py: 0.25 }}
                                        >
                                            View
                                        </Button>
                                        {leave.status === 'pending' && (
                                            <>
                                                <Button
                                                    size="small"
                                                    color="success"
                                                    variant="contained"
                                                    startIcon={<ApproveIcon sx={{ fontSize: 16 }} />}
                                                    onClick={() => setProcessDialog({ leave, action: 'approve' })}
                                                    sx={{ textTransform: 'none', borderRadius: 1.5, fontSize: '0.75rem', py: 0.25 }}
                                                >
                                                    Approve
                                                </Button>
                                                <Button
                                                    size="small"
                                                    color="error"
                                                    variant="outlined"
                                                    startIcon={<RejectIcon sx={{ fontSize: 16 }} />}
                                                    onClick={() => setProcessDialog({ leave, action: 'reject' })}
                                                    sx={{ textTransform: 'none', borderRadius: 1.5, fontSize: '0.75rem', py: 0.25 }}
                                                >
                                                    Reject
                                                </Button>
                                            </>
                                        )}
                                    </Box>
                                </Box>
                            </Paper>
                        );
                    })}
                </Stack>
            ) : (
                /* Desktop Table View */
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
                    <Table>
                        <TableHead sx={{ bgcolor: 'grey.50' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>From</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>To</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Days</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {leaves.map((leave) => {
                                const statusMeta = statusConfig[leave.status] || statusConfig.pending;
                                return (
                                    <TableRow key={leave.leaveId} hover>
                                        <TableCell sx={{ fontWeight: 600 }}>{leave.applicantName}</TableCell>
                                        <TableCell sx={{ textTransform: 'capitalize', fontWeight: 500 }}>{leave.leaveType}</TableCell>
                                        <TableCell>{formatDate(leave.startDate)}</TableCell>
                                        <TableCell>{formatDate(leave.endDate)}</TableCell>
                                        <TableCell>{leave.numberOfDays || 1}</TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={statusMeta.icon as React.ReactElement}
                                                label={statusMeta.label}
                                                size="small"
                                                sx={{
                                                    bgcolor: statusMeta.bg,
                                                    color: statusMeta.text,
                                                    fontWeight: 700,
                                                    borderRadius: 1.5,
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <IconButton size="small" onClick={() => setSelectedLeave(leave)}>
                                                <ViewIcon fontSize="small" />
                                            </IconButton>
                                            {leave.status === 'pending' && (
                                                <>
                                                    <IconButton size="small" color="success" onClick={() => setProcessDialog({ leave, action: 'approve' })}>
                                                        <ApproveIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton size="small" color="error" onClick={() => setProcessDialog({ leave, action: 'reject' })}>
                                                        <RejectIcon fontSize="small" />
                                                    </IconButton>
                                                </>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* View Details Dialog */}
            <Dialog
                open={!!selectedLeave}
                onClose={() => setSelectedLeave(null)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Student Leave Details</DialogTitle>
                <DialogContent dividers>
                    {selectedLeave && (
                        <Stack spacing={2}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" color="text.secondary">Student</Typography>
                                <Typography variant="body2" fontWeight={700}>{selectedLeave.applicantName}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" color="text.secondary">Leave Type</Typography>
                                <Chip label={selectedLeave.leaveType} size="small" sx={{ textTransform: 'capitalize', fontWeight: 600 }} />
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" color="text.secondary">Duration</Typography>
                                <Typography variant="body2" fontWeight={600}>
                                    {formatDate(selectedLeave.startDate)} — {formatDate(selectedLeave.endDate)} ({selectedLeave.numberOfDays || 1} days)
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary" gutterBottom>Reason</Typography>
                                <Paper sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 2 }}>
                                    <Typography variant="body2">{selectedLeave.reason || 'No reason provided'}</Typography>
                                </Paper>
                            </Box>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setSelectedLeave(null)} sx={{ textTransform: 'none' }}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Process Dialog */}
            <Dialog
                open={!!processDialog}
                onClose={() => { setProcessDialog(null); setRemarks(''); }}
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>
                    {processDialog?.action === 'approve' ? 'Approve' : 'Reject'} Leave Request?
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        {processDialog?.action === 'approve'
                            ? `Approve leave request for ${processDialog.leave.applicantName}?`
                            : `Reject leave request for ${processDialog?.leave.applicantName}?`}
                    </Typography>
                    <TextField
                        label="Remarks (optional)"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        multiline
                        rows={3}
                        fullWidth
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => { setProcessDialog(null); setRemarks(''); }} sx={{ textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color={processDialog?.action === 'approve' ? 'success' : 'error'}
                        onClick={handleProcess}
                        disabled={processMutation.isPending}
                        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                    >
                        {processMutation.isPending ? 'Processing...' : processDialog?.action === 'approve' ? 'Approve' : 'Reject'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TeacherStudentLeaves;
