import { useState } from 'react';
import {
    Box,
    IconButton,
    Tooltip,
    Chip,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { 
    Check as CheckIcon, 
    Close as CloseIcon, 
    Reply as ReplyIcon,
} from '@mui/icons-material';
import DataTable from '../../components/Table/DataTable';
import type { Column } from '../../components/Table/DataTable';
import { useGetAllRequests, useUpdateRequestStatus } from '../../queries/Request';
import type { Request } from '../../types';
import TokenService from '../../queries/token/tokenService';
import { useIsMobile } from '../../hooks/useIsMobile';
import MobileSegmentedTabs from '../../components/mobile/navigation/MobileSegmentedTabs';

const RequestsPage = () => {
    const isMobile = useIsMobile();
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [replyDialogOpen, setReplyDialogOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
    const [adminReply, setAdminReply] = useState("");
    const [newStatus, setNewStatus] = useState<"approved" | "rejected">("approved");

    const schoolId = TokenService.getSchoolId() || '';
    const { data, isLoading, error } = useGetAllRequests(
        schoolId,
        statusFilter ? { status: statusFilter as "pending" | "approved" | "rejected" } : undefined
    );
    const updateMutation = useUpdateRequestStatus(schoolId);

    const requests = data?.data || [];

    const handleQuickUpdateStatus = async (request: Request, status: "approved" | "rejected") => {
        try {
            await updateMutation.mutateAsync({
                requestId: request.requestId,
                data: { status },
            });
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    const openReplyDialog = (request: Request) => {
        setSelectedRequest(request);
        setAdminReply(request.adminReply || "");
        setNewStatus("approved");
        setReplyDialogOpen(true);
    };

    const handleSubmitReply = async () => {
        if (!selectedRequest) return;
        try {
            await updateMutation.mutateAsync({
                requestId: selectedRequest.requestId,
                data: { status: newStatus, adminReply },
            });
            setReplyDialogOpen(false);
            setSelectedRequest(null);
            setAdminReply("");
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    const getRequestTypeLabel = (type: string) => {
        switch (type) {
            case 'email_change': return 'Email Change';
            case 'phone_change': return 'Phone Change';
            default: return 'General';
        }
    };

    const columns: Column<Request>[] = [
        { id: 'requestId', label: 'ID', minWidth: 100 },
        { id: 'userName', label: 'User', minWidth: 120 },
        {
            id: 'userType',
            label: 'Type',
            minWidth: 100,
            format: (value) => <Chip label={(value as string)?.replace('_', ' ')} size="small" />,
        },
        {
            id: 'requestType',
            label: 'Request',
            minWidth: 120,
            format: (value) => getRequestTypeLabel(value as string),
        },
        { id: 'message', label: 'Message', minWidth: 200 },
        {
            id: 'newValue',
            label: 'Requested Value',
            minWidth: 140,
            format: (value) => value ? <Chip label={value as string} size="small" variant="outlined" color="primary" /> : '-',
        },
        {
            id: 'status',
            label: 'Status',
            minWidth: 100,
            format: (value) => {
                const color = value === 'approved' ? 'success' : value === 'rejected' ? 'error' : 'warning';
                return <Chip label={value as string} color={color} size="small" />;
            },
        },
        {
            id: 'actions',
            label: 'Actions',
            minWidth: 130,
            align: 'center',
            format: (_, row) => (
                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                    <Tooltip title="Reply / View">
                        <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); openReplyDialog(row); }}>
                            <ReplyIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    {row.status === 'pending' && (
                        <>
                            <Tooltip title="Quick Approve">
                                <IconButton
                                    size="small"
                                    color="success"
                                    onClick={(e) => { e.stopPropagation(); handleQuickUpdateStatus(row, 'approved'); }}
                                    disabled={updateMutation.isPending}
                                >
                                    <CheckIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Quick Reject">
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={(e) => { e.stopPropagation(); handleQuickUpdateStatus(row, 'rejected'); }}
                                    disabled={updateMutation.isPending}
                                >
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </>
                    )}
                </Box>
            ),
        },
    ];

    return (
        <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
            {isMobile ? (
                <Box sx={{ mb: 2 }}>
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
                </Box>
            ) : (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="h4" fontWeight={700} color="#1e293b" sx={{ fontSize: { xs: '1.25rem', sm: '1.75rem' } }}>
                        User Requests
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel>Status Filter</InputLabel>
                        <Select
                            value={statusFilter}
                            label="Status Filter"
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <MenuItem value="">All Statuses</MenuItem>
                            <MenuItem value="pending">Pending</MenuItem>
                            <MenuItem value="approved">Approved</MenuItem>
                            <MenuItem value="rejected">Rejected</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            )}

            <DataTable<Request>
                title=""
                columns={columns}
                data={requests}
                isLoading={isLoading}
                error={error ? (error as { message?: string })?.message || 'Failed to load requests' : null}
                emptyMessage="No requests found."
                getRowKey={(row) => row.requestId}
            />

            {/* Reply Dialog */}
            <Dialog 
                open={replyDialogOpen} 
                onClose={() => setReplyDialogOpen(false)} 
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
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>Reply to Request</Typography>
                    <IconButton onClick={() => setReplyDialogOpen(false)} size="small" edge="end">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, p: { xs: 2, sm: 3 } }}>
                    {selectedRequest && (
                        <>
                            <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Request from {selectedRequest.userName}</Typography>
                                <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>{selectedRequest.message}</Typography>
                                {selectedRequest.newValue && (
                                    <Typography variant="body2" color="primary" sx={{ mt: 1, fontWeight: 700 }}>
                                        Requested Value: {selectedRequest.newValue}
                                    </Typography>
                                )}
                            </Box>
                            <FormControl fullWidth>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={newStatus}
                                    label="Status"
                                    onChange={(e) => setNewStatus(e.target.value as "approved" | "rejected")}
                                >
                                    <MenuItem value="approved">Approve</MenuItem>
                                    <MenuItem value="rejected">Reject</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField
                                label="Admin Reply"
                                value={adminReply}
                                onChange={(e) => setAdminReply(e.target.value)}
                                multiline
                                rows={3}
                                fullWidth
                                placeholder="Enter your reply to the user..."
                            />
                        </>
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
                    <Button onClick={() => setReplyDialogOpen(false)} color="inherit">Cancel</Button>
                    <Button
                        onClick={handleSubmitReply}
                        variant="contained"
                        disabled={updateMutation.isPending}
                    >
                        {updateMutation.isPending ? 'Submitting...' : 'Submit Reply'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default RequestsPage;
