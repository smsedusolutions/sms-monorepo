import React from 'react';
import {
    Box,
    Typography,
    Paper,
    Chip,
    Alert,
    CircularProgress,
    Button,
    Grid,
    Stack,
    Divider,
    ToggleButton,
    ToggleButtonGroup,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import {
    Add as AddIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    PendingActions as PendingIcon,
    CalendarToday as CalendarIcon,
    EventNote as ReasonIcon,
    Face as ChildIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useChildSelector } from '../../../context/ChildSelectorContext';
import { useGetParentLeaves } from '../../../queries/Leave';
import TokenService from '../../../queries/token/tokenService';
import { useUrlTab } from '../../../hooks/useUrlTab';

interface LeaveRequest {
    leaveId: string;
    startDate: string;
    endDate: string;
    leaveType: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    applicantName?: string;
    childName?: string;
    numberOfDays?: number;
    createdAt: string;
}

const statusConfig: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
    pending: { label: 'Pending', bg: '#fffbeb', text: '#b45309', icon: <PendingIcon sx={{ fontSize: 15 }} /> },
    approved: { label: 'Approved', bg: '#f0fdf4', text: '#15803d', icon: <CheckCircleIcon sx={{ fontSize: 15 }} /> },
    rejected: { label: 'Rejected', bg: '#fef2f2', text: '#b91c1c', icon: <CancelIcon sx={{ fontSize: 15 }} /> },
    cancelled: { label: 'Cancelled', bg: '#f3f4f6', text: '#6b7280', icon: <CancelIcon sx={{ fontSize: 15 }} /> },
};

const ParentLeaveHistory: React.FC = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const schoolId = TokenService.getSchoolId() || '';
    const { children, isLoading: loadingChildren } = useChildSelector();

    const [tabValue, setTabValue] = useUrlTab(0, ['all', 'pending', 'approved', 'rejected']);
    const statusFilter = tabValue === 1 ? 'pending' : tabValue === 2 ? 'approved' : tabValue === 3 ? 'rejected' : undefined;

    const { data, isLoading, error } = useGetParentLeaves(schoolId, {
        status: statusFilter,
    });

    const responseData = data?.data;
    const leaves: LeaveRequest[] = Array.isArray(responseData) ? responseData : (responseData?.leaves || []);
    const summary = responseData?.summary;

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    if (error) {
        return (
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                    Failed to load leave history. Please try again later.
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, gap: 1.5 }}>
                <Box>
                    <Typography variant={isMobile ? "h6" : "h5"} fontWeight={700} color="text.primary">
                        Child Leave History
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {children.length > 1
                            ? 'Leave requests for all your children'
                            : children.length === 1
                                ? `${children[0].firstName}'s leave requests`
                                : 'Track child leaves and approvals'}
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/parent/leave/apply')}
                    size={isMobile ? "small" : "medium"}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: 2,
                        px: { xs: 1.5, sm: 2.5 },
                        whiteSpace: 'nowrap',
                    }}
                >
                    Apply Leave
                </Button>
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

            {/* Filter Toggle Group */}
            <Box sx={{ mb: 2.5 }}>
                <ToggleButtonGroup
                    value={tabValue}
                    exclusive
                    onChange={(_, val) => val !== null && setTabValue(val)}
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
                    <ToggleButton value={0}>All ({summary?.total ?? leaves.length})</ToggleButton>
                    <ToggleButton value={1}>Pending ({summary?.pending ?? 0})</ToggleButton>
                    <ToggleButton value={2}>Approved ({summary?.approved ?? 0})</ToggleButton>
                    <ToggleButton value={3}>Rejected ({summary?.rejected ?? 0})</ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* Content Area */}
            {isLoading || loadingChildren ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress size={36} />
                </Box>
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
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, maxWidth: 360, mx: 'auto' }}>
                        {statusFilter
                            ? `No ${statusFilter} leave requests for your children.`
                            : "You haven't submitted any leave requests for your children yet."}
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/parent/leave/apply')}
                        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                    >
                        Apply for Leave
                    </Button>
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
                                {/* Top Row: Child Badge / Type + Status */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.25 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {leave.childName ? (
                                            <Chip
                                                icon={<ChildIcon sx={{ fontSize: 16 }} />}
                                                label={leave.childName}
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                                sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                                            />
                                        ) : (
                                            <Typography variant="subtitle2" fontWeight={700} sx={{ textTransform: 'capitalize' }}>
                                                {leave.leaveType.replace('_', ' ')} Leave
                                            </Typography>
                                        )}
                                        {leave.childName && (
                                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize', fontWeight: 600 }}>
                                                • {leave.leaveType.replace('_', ' ')}
                                            </Typography>
                                        )}
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

                                {/* Date & Duration Bar */}
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
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, mb: 1.25 }}>
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
                                        {leave.reason || 'No reason provided'}
                                    </Typography>
                                </Box>

                                <Divider sx={{ mb: 1 }} />

                                {/* Card Footer: Applied Date */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="caption" color="text.disabled">
                                        Applied: {formatDate(leave.createdAt)}
                                    </Typography>
                                    <Typography variant="caption" color="text.disabled">
                                        ID: {leave.leaveId}
                                    </Typography>
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
                                {children.length > 1 && (
                                    <TableCell sx={{ fontWeight: 700 }}>Child</TableCell>
                                )}
                                <TableCell sx={{ fontWeight: 700 }}>Dates</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Applied On</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {leaves.map((leave: LeaveRequest) => {
                                const statusMeta = statusConfig[leave.status] || statusConfig.pending;
                                return (
                                    <TableRow key={leave.leaveId} hover>
                                        {children.length > 1 && (
                                            <TableCell>
                                                <Chip
                                                    size="small"
                                                    label={leave.childName || leave.applicantName || '-'}
                                                    color="primary"
                                                    variant="outlined"
                                                    sx={{ fontWeight: 600 }}
                                                />
                                            </TableCell>
                                        )}
                                        <TableCell sx={{ fontWeight: 500 }}>
                                            {formatDate(leave.startDate)} — {formatDate(leave.endDate)}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                label={leave.leaveType.replace('_', ' ')}
                                                variant="outlined"
                                                sx={{ textTransform: 'capitalize', fontWeight: 500 }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    maxWidth: 240,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {leave.reason}
                                            </Typography>
                                        </TableCell>
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
                                        <TableCell>{formatDate(leave.createdAt)}</TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
};

export default ParentLeaveHistory;
