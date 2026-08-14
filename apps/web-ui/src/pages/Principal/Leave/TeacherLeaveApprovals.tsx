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
    Button,
    CircularProgress,
    Alert,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Card,
    CardContent,
    Grid,
    Avatar,
    Tooltip,
} from '@mui/material';
import {
    CheckCircle as ApproveIcon,
    Cancel as RejectIcon,
    Visibility as ViewIcon,
    Pending as PendingIcon,
    Person as PersonIcon,
} from '@mui/icons-material';
import { useGetAllLeaves, useProcessLeave } from '../../../queries/Leave';
import TokenService from '../../../queries/token/tokenService';
import type { LeaveRequest, LeaveStatus } from '../../../types';

const statusConfig: Record<LeaveStatus, { color: 'warning' | 'success' | 'error'; icon: React.ReactNode }> = {
    pending: { color: 'warning', icon: <PendingIcon /> },
    approved: { color: 'success', icon: <ApproveIcon /> },
    rejected: { color: 'error', icon: <RejectIcon /> },
};

const TeacherLeaveApprovals: React.FC = () => {
    const schoolId = TokenService.getSchoolId() || '';

    const [statusFilter, setStatusFilter] = useState<string>('pending');
    const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
    const [processDialog, setProcessDialog] = useState<{ leave: LeaveRequest; action: 'approve' | 'reject' } | null>(null);
    const [remarks, setRemarks] = useState('');

    // Principal only sees teacher leave requests
    const { data, isLoading, error } = useGetAllLeaves(schoolId, {
        status: statusFilter || undefined,
        applicantType: 'teacher',
    });
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

    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

    const getInitials = (name: string) => {
        const parts = name.split(' ');
        return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name[0]?.toUpperCase() || 'T';
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h5" fontWeight={600} gutterBottom>
                Teacher Leave Approvals
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Review and approve or reject leave applications submitted by teachers.
            </Typography>

            {/* Summary Cards */}
            {summary && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    {[
                        { label: 'Total', value: summary.total, color: 'text.primary', bg: 'white' },
                        { label: 'Pending', value: summary.pending, color: 'warning.main', bg: '#fffbeb' },
                        { label: 'Approved', value: summary.approved, color: 'success.main', bg: '#f0fdf4' },
                        { label: 'Rejected', value: summary.rejected, color: 'error.main', bg: '#fef2f2' },
                    ].map((item) => (
                        <Grid size={{ xs: 6, sm: 3 }} key={item.label}>
                            <Card sx={{ textAlign: 'center', bgcolor: item.bg, border: '1px solid #e2e8f0' }}>
                                <CardContent sx={{ py: 2 }}>
                                    <Typography variant="h4" fontWeight={700} color={item.color}>
                                        {item.value}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {item.label}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Status Filter */}
            <Paper sx={{ p: 2, mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                <Typography variant="body2" fontWeight={600} color="text.secondary">
                    Filter by Status:
                </Typography>
                <ToggleButtonGroup
                    value={statusFilter}
                    exclusive
                    onChange={(_, val) => setStatusFilter(val || '')}
                    size="small"
                >
                    <ToggleButton value="">All</ToggleButton>
                    <ToggleButton value="pending">Pending</ToggleButton>
                    <ToggleButton value="approved">Approved</ToggleButton>
                    <ToggleButton value="rejected">Rejected</ToggleButton>
                </ToggleButtonGroup>
            </Paper>

            {/* Table */}
            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error">Failed to load leave requests. Please try again.</Alert>
            ) : leaves.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <PersonIcon sx={{ fontSize: 56, color: '#cbd5e1', mb: 2 }} />
                    <Typography color="text.secondary">No teacher leave requests found for the selected filter.</Typography>
                </Box>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                <TableCell sx={{ fontWeight: 700 }}>Teacher</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Leave Type</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Duration</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="center">Days</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {leaves.map((leave) => {
                                const teacherName = leave.applicantName || leave.applicantId;
                                return (
                                    <TableRow key={leave.leaveId} hover>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Avatar
                                                    sx={{
                                                        width: 36,
                                                        height: 36,
                                                        fontSize: '0.8rem',
                                                        fontWeight: 700,
                                                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                                    }}
                                                >
                                                    {getInitials(teacherName)}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={600}>{teacherName}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{leave.leaveId}</Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={leave.leaveType}
                                                size="small"
                                                variant="outlined"
                                                sx={{ textTransform: 'capitalize' }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{formatDate(leave.startDate)}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                to {formatDate(leave.endDate)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={`${leave.numberOfDays}d`}
                                                size="small"
                                                color="default"
                                                sx={{ fontWeight: 700 }}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                icon={statusConfig[leave.status].icon as React.ReactElement}
                                                label={leave.status}
                                                color={statusConfig[leave.status].color}
                                                size="small"
                                                sx={{ textTransform: 'capitalize' }}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                                <Tooltip title="View Details">
                                                    <IconButton size="small" onClick={() => setSelectedLeave(leave)}>
                                                        <ViewIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                {leave.status === 'pending' && (
                                                    <>
                                                        <Tooltip title="Approve">
                                                            <IconButton
                                                                size="small"
                                                                color="success"
                                                                onClick={() => setProcessDialog({ leave, action: 'approve' })}
                                                            >
                                                                <ApproveIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Reject">
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => setProcessDialog({ leave, action: 'reject' })}
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
            <Dialog open={!!selectedLeave} onClose={() => setSelectedLeave(null)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ borderBottom: '1px solid #e2e8f0' }}>
                    Leave Request Details
                </DialogTitle>
                <DialogContent>
                    {selectedLeave && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                            {[
                                { label: 'Leave ID', value: selectedLeave.leaveId },
                                { label: 'Teacher', value: selectedLeave.applicantName || selectedLeave.applicantId },
                                { label: 'Leave Type', value: selectedLeave.leaveType },
                                {
                                    label: 'Duration',
                                    value: `${formatDate(selectedLeave.startDate)} → ${formatDate(selectedLeave.endDate)} (${selectedLeave.numberOfDays} days)`,
                                },
                                { label: 'Applied On', value: new Date(selectedLeave.createdAt).toLocaleString() },
                            ].map((item) => (
                                <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>{item.label}:</Typography>
                                    <Typography variant="body2" fontWeight={600} sx={{ textAlign: 'right', textTransform: 'capitalize' }}>{item.value}</Typography>
                                </Box>
                            ))}
                            <Box>
                                <Typography variant="body2" color="text.secondary" gutterBottom>Status:</Typography>
                                <Chip
                                    label={selectedLeave.status}
                                    color={statusConfig[selectedLeave.status].color}
                                    size="small"
                                    sx={{ textTransform: 'capitalize' }}
                                />
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary" gutterBottom>Reason:</Typography>
                                <Paper sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                                    <Typography variant="body2">{selectedLeave.reason}</Typography>
                                </Paper>
                            </Box>
                            {selectedLeave.approvalRemarks && (
                                <Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>Remarks:</Typography>
                                    <Paper
                                        sx={{
                                            p: 2,
                                            bgcolor: selectedLeave.status === 'approved' ? '#f0fdf4' : '#fef2f2',
                                            borderRadius: 2,
                                        }}
                                    >
                                        <Typography variant="body2">{selectedLeave.approvalRemarks}</Typography>
                                    </Paper>
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    {selectedLeave?.status === 'pending' && (
                        <>
                            <Button
                                color="success"
                                variant="outlined"
                                onClick={() => {
                                    setSelectedLeave(null);
                                    setProcessDialog({ leave: selectedLeave, action: 'approve' });
                                }}
                            >
                                Approve
                            </Button>
                            <Button
                                color="error"
                                variant="outlined"
                                onClick={() => {
                                    setSelectedLeave(null);
                                    setProcessDialog({ leave: selectedLeave, action: 'reject' });
                                }}
                            >
                                Reject
                            </Button>
                        </>
                    )}
                    <Button onClick={() => setSelectedLeave(null)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Process (Approve/Reject) Dialog */}
            <Dialog
                open={!!processDialog}
                onClose={() => { setProcessDialog(null); setRemarks(''); }}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle
                    sx={{
                        color: processDialog?.action === 'approve' ? 'success.main' : 'error.main',
                        borderBottom: '1px solid #e2e8f0',
                    }}
                >
                    {processDialog?.action === 'approve' ? '✅ Approve Leave Request' : '❌ Reject Leave Request'}
                </DialogTitle>
                <DialogContent>
                    {processDialog && (
                        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Alert severity={processDialog.action === 'approve' ? 'success' : 'warning'} variant="outlined">
                                <strong>{processDialog.leave.applicantName || processDialog.leave.applicantId}</strong> —{' '}
                                {formatDate(processDialog.leave.startDate)} to {formatDate(processDialog.leave.endDate)}{' '}
                                ({processDialog.leave.numberOfDays} day{processDialog.leave.numberOfDays !== 1 ? 's' : ''})
                            </Alert>
                            <TextField
                                label={processDialog.action === 'approve' ? 'Remarks (Optional)' : 'Rejection Reason (Required)'}
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                multiline
                                rows={3}
                                fullWidth
                                placeholder={
                                    processDialog.action === 'reject'
                                        ? 'Please provide a reason for rejection...'
                                        : 'Approval remarks (optional)...'
                                }
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setProcessDialog(null); setRemarks(''); }}>Cancel</Button>
                    <Button
                        variant="contained"
                        color={processDialog?.action === 'approve' ? 'success' : 'error'}
                        onClick={handleProcess}
                        disabled={
                            processMutation.isPending ||
                            (processDialog?.action === 'reject' && !remarks.trim())
                        }
                    >
                        {processMutation.isPending
                            ? 'Processing...'
                            : processDialog?.action === 'approve'
                            ? 'Confirm Approve'
                            : 'Confirm Reject'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TeacherLeaveApprovals;
