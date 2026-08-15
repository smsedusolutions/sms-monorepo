import React from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Chip,
    Alert,
    Skeleton,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Grid,
} from '@mui/material';
import {
    History as HistoryIcon,
    Add as AddIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    AccessTime as AccessTimeIcon,
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

const ParentLeaveHistory: React.FC = () => {
    const navigate = useNavigate();
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

    const getStatusChip = (status: string) => {
        switch (status) {
            case 'approved':
                return <Chip size="small" icon={<CheckCircleIcon />} label="Approved" color="success" />;
            case 'rejected':
                return <Chip size="small" icon={<CancelIcon />} label="Rejected" color="error" />;
            case 'pending':
                return <Chip size="small" icon={<AccessTimeIcon />} label="Pending" color="warning" />;
            case 'cancelled':
                return <Chip size="small" label="Cancelled" color="default" />;
            default:
                return <Chip size="small" label={status} />;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Failed to load leave history. Please try again later.</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <HistoryIcon color="primary" />
                        <Typography variant="h4" fontWeight={600}>
                            Leave History
                        </Typography>
                    </Box>
                    <Typography variant="body1" color="text.secondary">
                        {children.length > 1
                            ? 'Leave requests for all your children'
                            : children.length === 1
                                ? `${children[0].firstName}'s leave requests`
                                : 'Loading...'}
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/parent/leave/apply')}
                >
                    Apply Leave
                </Button>
            </Box>

            {/* Summary Cards */}
            {summary && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Card sx={{ textAlign: 'center' }}>
                            <CardContent sx={{ py: 2 }}>
                                <Typography variant="h4" fontWeight={600}>{summary.total}</Typography>
                                <Typography variant="body2" color="text.secondary">Total</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Card sx={{ textAlign: 'center' }}>
                            <CardContent sx={{ py: 2 }}>
                                <Typography variant="h4" fontWeight={600} color="warning.main">{summary.pending}</Typography>
                                <Typography variant="body2" color="text.secondary">Pending</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Card sx={{ textAlign: 'center' }}>
                            <CardContent sx={{ py: 2 }}>
                                <Typography variant="h4" fontWeight={600} color="success.main">{summary.approved}</Typography>
                                <Typography variant="body2" color="text.secondary">Approved</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Card sx={{ textAlign: 'center' }}>
                            <CardContent sx={{ py: 2 }}>
                                <Typography variant="h4" fontWeight={600} color="error.main">{summary.rejected}</Typography>
                                <Typography variant="body2" color="text.secondary">Rejected</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 3 }}>
                <Tab label="All" />
                <Tab label="Pending" />
                <Tab label="Approved" />
                <Tab label="Rejected" />
            </Tabs>

            <Card>
                {isLoading || loadingChildren ? (
                    <CardContent>
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} variant="rectangular" height={50} sx={{ mb: 1, borderRadius: 1 }} />
                        ))}
                    </CardContent>
                ) : leaves.length === 0 ? (
                    <CardContent sx={{ textAlign: 'center', py: 6 }}>
                        <HistoryIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                            No leave requests found
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            sx={{ mt: 2 }}
                            onClick={() => navigate('/parent/leave/apply')}
                        >
                            Apply for Leave
                        </Button>
                    </CardContent>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    {children.length > 1 && (
                                        <TableCell sx={{ fontWeight: 600 }}>Child</TableCell>
                                    )}
                                    <TableCell sx={{ fontWeight: 600 }}>Dates</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Reason</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Applied On</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {leaves.map((leave: LeaveRequest) => (
                                    <TableRow key={leave.leaveId}>
                                        {children.length > 1 && (
                                            <TableCell>
                                                <Chip
                                                    size="small"
                                                    label={leave.childName || leave.applicantName || '-'}
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                        )}
                                        <TableCell>
                                            {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                label={leave.leaveType.replace('_', ' ')}
                                                variant="outlined"
                                                sx={{ textTransform: 'capitalize' }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    maxWidth: 200,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {leave.reason}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusChip(leave.status)}
                                        </TableCell>
                                        <TableCell>
                                            {formatDate(leave.createdAt)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Card>
        </Box>
    );
};

export default ParentLeaveHistory;
