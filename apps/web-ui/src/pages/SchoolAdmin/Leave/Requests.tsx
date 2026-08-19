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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import {
    CheckCircle as ApproveIcon,
    Cancel as RejectIcon,
    Visibility as ViewIcon,
    Pending as PendingIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import { useGetAllLeaves, useProcessLeave } from '../../../queries/Leave';
import TokenService from '../../../queries/token/tokenService';
import type { LeaveRequest, LeaveStatus } from '../../../types';
import { useIsMobile } from '../../../hooks/useIsMobile';
import MobileSegmentedTabs from '../../../components/mobile/navigation/MobileSegmentedTabs';
import MobileCardList from '../../../components/mobile/data/MobileCardList';
import MobileCardItem from '../../../components/mobile/data/MobileCardItem';

const statusConfig: Record<LeaveStatus, { color: 'warning' | 'success' | 'error'; icon: React.ReactNode }> = {
    pending: { color: 'warning', icon: <PendingIcon fontSize="small" /> },
    approved: { color: 'success', icon: <ApproveIcon fontSize="small" /> },
    rejected: { color: 'error', icon: <RejectIcon fontSize="small" /> },
};

const LeaveRequests: React.FC = () => {
    const isMobile = useIsMobile();
    const schoolId = TokenService.getSchoolId() || '';

    const [statusFilter, setStatusFilter] = useState<string>('pending');
    const [applicantTypeFilter, setApplicantTypeFilter] = useState<string>('');
    const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
    const [processDialog, setProcessDialog] = useState<{ leave: LeaveRequest; action: 'approve' | 'reject' } | null>(null);
    const [remarks, setRemarks] = useState('');

    const { data, isLoading, error } = useGetAllLeaves(schoolId, {
        status: statusFilter || undefined,
        applicantType: applicantTypeFilter || undefined,
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

    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();

    return (
        <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
            {!isMobile && (
                <>
                    <Typography variant="h5" fontWeight={700} gutterBottom color="#0f172a">
                        Leave Requests
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Review and process leave applications from students and teachers.
                    </Typography>
                </>
            )}

            {/* Summary Cards */}
            {summary && (
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                    gap: 1.5,
                    mb: 2.5
                }}>
                    <Card variant="outlined" sx={{ borderRadius: 2.5, bgcolor: 'background.paper', textAlign: 'center' }}>
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Typography variant="h5" fontWeight={800} color="#0f172a">{summary.total}</Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>Total Requests</Typography>
                        </CardContent>
                    </Card>
                    <Card variant="outlined" sx={{ borderRadius: 2.5, bgcolor: 'warning.50', borderColor: 'warning.200', textAlign: 'center' }}>
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Typography variant="h5" fontWeight={800} color="warning.dark">{summary.pending}</Typography>
                            <Typography variant="caption" color="warning.dark" fontWeight={700}>Pending</Typography>
                        </CardContent>
                    </Card>
                    <Card variant="outlined" sx={{ borderRadius: 2.5, bgcolor: 'success.50', borderColor: 'success.200', textAlign: 'center' }}>
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Typography variant="h5" fontWeight={800} color="success.dark">{summary.approved}</Typography>
                            <Typography variant="caption" color="success.dark" fontWeight={700}>Approved</Typography>
                        </CardContent>
                    </Card>
                    <Card variant="outlined" sx={{ borderRadius: 2.5, bgcolor: 'error.50', borderColor: 'error.200', textAlign: 'center' }}>
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Typography variant="h5" fontWeight={800} color="error.dark">{summary.rejected}</Typography>
                            <Typography variant="caption" color="error.dark" fontWeight={700}>Rejected</Typography>
                        </CardContent>
                    </Card>
                </Box>
            )}

            {/* Filters */}
            <Box sx={{ mb: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {isMobile ? (
                    <MobileSegmentedTabs
                        options={[
                            { id: '', label: 'All' },
                            { id: 'pending', label: 'Pending' },
                            { id: 'approved', label: 'Approved' },
                            { id: 'rejected', label: 'Rejected' },
                        ]}
                        activeId={statusFilter}
                        onChange={(tab) => setStatusFilter(tab)}
                    />
                ) : (
                    <Paper sx={{ p: 2, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
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

                        <FormControl size="small" sx={{ minWidth: 160 }}>
                            <InputLabel>Applicant Type</InputLabel>
                            <Select
                                value={applicantTypeFilter}
                                label="Applicant Type"
                                onChange={(e) => setApplicantTypeFilter(e.target.value)}
                            >
                                <MenuItem value="">All Applicants</MenuItem>
                                <MenuItem value="student">Students</MenuItem>
                                <MenuItem value="teacher">Teachers</MenuItem>
                            </Select>
                        </FormControl>
                    </Paper>
                )}

                {isMobile && (
                    <FormControl size="small" fullWidth>
                        <InputLabel>Applicant Filter</InputLabel>
                        <Select
                            value={applicantTypeFilter}
                            label="Applicant Filter"
                            onChange={(e) => setApplicantTypeFilter(e.target.value)}
                            sx={{ borderRadius: 2 }}
                        >
                            <MenuItem value="">All Applicants (Students & Teachers)</MenuItem>
                            <MenuItem value="student">Students Only</MenuItem>
                            <MenuItem value="teacher">Teachers Only</MenuItem>
                        </Select>
                    </FormControl>
                )}
            </Box>

            {/* List / Table */}
            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
            ) : error ? (
                <Alert severity="error" sx={{ borderRadius: 2 }}>Failed to load leave requests</Alert>
            ) : isMobile ? (
                <MobileCardList
                    emptyTitle="No Leave Requests"
                    emptyMessage="No leave applications found matching your filters."
                    totalCount={leaves.length}
                    itemCount={leaves.length}
                >
                    {leaves.map((leave) => {
                        const config = statusConfig[leave.status] || { color: 'warning' };
                        return (
                            <MobileCardItem
                                key={leave.leaveId}
                                title={leave.applicantName || leave.applicantId}
                                subtitle={`${leave.leaveType.toUpperCase()} • ${leave.numberOfDays} day(s)`}
                                badge={{
                                    label: leave.status.toUpperCase(),
                                    color: config.color as any,
                                }}
                                metaItems={[
                                    { label: 'Applicant', value: leave.applicantType === 'student' ? 'Student' : 'Teacher' },
                                    { label: 'Dates', value: `${formatDate(leave.startDate)} - ${formatDate(leave.endDate)}` },
                                ]}
                                onClick={() => setSelectedLeave(leave)}
                                rightAction={
                                    leave.status === 'pending' ? (
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            <IconButton
                                                size="small"
                                                color="success"
                                                onClick={(e) => { e.stopPropagation(); setProcessDialog({ leave, action: 'approve' }); }}
                                                title="Approve"
                                                sx={{ bgcolor: 'rgba(34, 197, 94, 0.1)' }}
                                            >
                                                <ApproveIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={(e) => { e.stopPropagation(); setProcessDialog({ leave, action: 'reject' }); }}
                                                title="Reject"
                                                sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)' }}
                                            >
                                                <RejectIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    ) : (
                                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setSelectedLeave(leave); }}>
                                            <ViewIcon fontSize="small" />
                                        </IconButton>
                                    )
                                }
                            />
                        );
                    })}
                </MobileCardList>
            ) : leaves.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>No leave requests found matching your filters.</Alert>
            ) : (
                <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }} elevation={0}>
                    <Table>
                        <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>Leave ID</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Applicant</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Duration</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Days</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {leaves.map((leave) => (
                                <TableRow key={leave.leaveId} hover>
                                    <TableCell sx={{ fontFamily: 'monospace' }}>{leave.leaveId}</TableCell>
                                    <TableCell>
                                        <Box>
                                            <Typography variant="body2" fontWeight={600}>{leave.applicantName || leave.applicantId}</Typography>
                                            <Chip label={leave.applicantType} size="small" variant="outlined" sx={{ textTransform: 'capitalize', mt: 0.3 }} />
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ textTransform: 'capitalize', fontWeight: 600 }}>{leave.leaveType}</TableCell>
                                    <TableCell>{formatDate(leave.startDate)} - {formatDate(leave.endDate)}</TableCell>
                                    <TableCell>{leave.numberOfDays}</TableCell>
                                    <TableCell>
                                        <Chip
                                            icon={statusConfig[leave.status].icon as React.ReactElement}
                                            label={leave.status.toUpperCase()}
                                            color={statusConfig[leave.status].color}
                                            size="small"
                                            sx={{ fontWeight: 700 }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton size="small" onClick={() => setSelectedLeave(leave)} title="View">
                                            <ViewIcon fontSize="small" />
                                        </IconButton>
                                        {leave.status === 'pending' && (
                                            <>
                                                <IconButton
                                                    size="small"
                                                    color="success"
                                                    onClick={() => setProcessDialog({ leave, action: 'approve' })}
                                                    title="Approve"
                                                >
                                                    <ApproveIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => setProcessDialog({ leave, action: 'reject' })}
                                                    title="Reject"
                                                >
                                                    <RejectIcon fontSize="small" />
                                                </IconButton>
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
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
                fullScreen={isMobile}
                PaperProps={{
                    sx: {
                        borderRadius: isMobile ? 0 : 3,
                    }
                }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider', py: { xs: 1.5, sm: 2 } }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Leave Details</Typography>
                    <IconButton onClick={() => setSelectedLeave(null)} size="small" edge="end">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
                    {selectedLeave && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography color="text.secondary">Leave ID:</Typography>
                                <Typography fontWeight={700} sx={{ fontFamily: 'monospace' }}>{selectedLeave.leaveId}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography color="text.secondary">Applicant:</Typography>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography fontWeight={700}>{selectedLeave.applicantName || selectedLeave.applicantId}</Typography>
                                    <Chip label={selectedLeave.applicantType} size="small" sx={{ textTransform: 'capitalize', mt: 0.3 }} />
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography color="text.secondary">Leave Type:</Typography>
                                <Chip label={selectedLeave.leaveType} size="small" sx={{ textTransform: 'capitalize', fontWeight: 600 }} />
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography color="text.secondary">Duration:</Typography>
                                <Typography fontWeight={600}>{formatDate(selectedLeave.startDate)} - {formatDate(selectedLeave.endDate)} ({selectedLeave.numberOfDays} days)</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography color="text.secondary">Status:</Typography>
                                <Chip label={selectedLeave.status.toUpperCase()} color={statusConfig[selectedLeave.status].color} size="small" sx={{ fontWeight: 700 }} />
                            </Box>
                            <Box>
                                <Typography color="text.secondary" gutterBottom fontWeight={600}>Reason:</Typography>
                                <Paper sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }} elevation={0}>
                                    <Typography variant="body2">{selectedLeave.reason}</Typography>
                                </Paper>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography color="text.secondary">Applied On:</Typography>
                                <Typography variant="body2">{new Date(selectedLeave.createdAt).toLocaleString()}</Typography>
                            </Box>
                            {selectedLeave.processedAt && (
                                <>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography color="text.secondary">Processed By:</Typography>
                                        <Typography variant="body2">{selectedLeave.processedByName}</Typography>
                                    </Box>
                                    {selectedLeave.approvalRemarks && (
                                        <Box>
                                            <Typography color="text.secondary" gutterBottom fontWeight={600}>Remarks:</Typography>
                                            <Paper sx={{ p: 2, bgcolor: selectedLeave.status === 'approved' ? 'success.50' : 'error.50', borderRadius: 2 }} elevation={0}>
                                                <Typography variant="body2">{selectedLeave.approvalRemarks}</Typography>
                                            </Paper>
                                        </Box>
                                    )}
                                </>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{
                    px: { xs: 2, sm: 3 },
                    py: 2,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    flexDirection: { xs: 'column-reverse', sm: 'row' },
                    gap: 1,
                    '& > button': {
                        width: { xs: '100%', sm: 'auto' },
                        height: 44,
                    }
                }}>
                    <Button onClick={() => setSelectedLeave(null)} color="inherit">Close</Button>
                    {selectedLeave?.status === 'pending' && (
                        <>
                            <Button color="error" variant="outlined" onClick={() => { setSelectedLeave(null); setProcessDialog({ leave: selectedLeave, action: 'reject' }); }}>
                                Reject Leave
                            </Button>
                            <Button color="success" variant="contained" onClick={() => { setSelectedLeave(null); setProcessDialog({ leave: selectedLeave, action: 'approve' }); }}>
                                Approve Leave
                            </Button>
                        </>
                    )}
                </DialogActions>
            </Dialog>

            {/* Process Dialog */}
            <Dialog
                open={!!processDialog}
                onClose={() => { setProcessDialog(null); setRemarks(''); }}
                maxWidth="sm"
                fullWidth
                fullScreen={isMobile}
                PaperProps={{
                    sx: {
                        borderRadius: isMobile ? 0 : 3,
                    }
                }}
            >
                <DialogTitle sx={{
                    color: processDialog?.action === 'approve' ? 'success.main' : 'error.main',
                    fontWeight: 700,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    py: { xs: 1.5, sm: 2 },
                    px: { xs: 2, sm: 3 }
                }}>
                    {processDialog?.action === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
                </DialogTitle>
                <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
                    {processDialog && (
                        <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Typography variant="body2">
                                <strong>Applicant:</strong> {processDialog.leave.applicantName || processDialog.leave.applicantId} ({processDialog.leave.applicantType})
                            </Typography>
                            <Typography variant="body2">
                                <strong>Duration:</strong> {formatDate(processDialog.leave.startDate)} - {formatDate(processDialog.leave.endDate)} ({processDialog.leave.numberOfDays} days)
                            </Typography>
                            <TextField
                                label={processDialog.action === 'approve' ? 'Approval Remarks (Optional)' : 'Rejection Reason'}
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                multiline
                                rows={3}
                                fullWidth
                                placeholder={processDialog.action === 'reject' ? 'Please provide a reason for rejection...' : ''}
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{
                    px: { xs: 2, sm: 3 },
                    py: 2,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    flexDirection: { xs: 'column-reverse', sm: 'row' },
                    gap: 1,
                    '& > button': {
                        width: { xs: '100%', sm: 'auto' },
                        height: 44,
                    }
                }}>
                    <Button onClick={() => { setProcessDialog(null); setRemarks(''); }} color="inherit">Cancel</Button>
                    <Button
                        variant="contained"
                        color={processDialog?.action === 'approve' ? 'success' : 'error'}
                        onClick={handleProcess}
                        disabled={processMutation.isPending}
                    >
                        {processMutation.isPending ? 'Processing...' : processDialog?.action === 'approve' ? 'Approve' : 'Reject'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default LeaveRequests;
