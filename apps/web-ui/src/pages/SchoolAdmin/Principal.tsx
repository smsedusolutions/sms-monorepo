import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Avatar,
    Chip,
    Button,
    Tooltip,
    Alert,
    CircularProgress,
    Divider,
    Card,
    CardContent,
    Grid,
    Switch,
} from '@mui/material';
import {
    Edit as EditIcon,
    Add as AddIcon,
    AdminPanelSettings as PrincipalIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Badge as BadgeIcon,
    School as SchoolIcon,
    CheckCircle as ActiveIcon,
    Cancel as InactiveIcon,
} from '@mui/icons-material';
import PrincipalDialog from '../../components/Dialogs/PrincipalDialog';
import { useGetPrincipal, useUpdatePrincipal, type Principal } from '../../queries/Principal';
import TokenService from '../../queries/token/tokenService';
import { useNotification } from '../../hooks/useNotification';

const PrincipalManagement: React.FC = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const notification = useNotification();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editData, setEditData] = useState<Principal | null>(null);

    const { data, isLoading, error } = useGetPrincipal(schoolId);
    const updateMutation = useUpdatePrincipal(schoolId);

    // The API may return a single object or an array — handle both
    const rawData = data?.data;
    const principal: Principal | null = Array.isArray(rawData)
        ? (rawData[0] as Principal) ?? null
        : (rawData as Principal) ?? null;

    const handleAdd = () => {
        setEditData(null);
        setDialogOpen(true);
    };

    const handleEdit = (p: Principal) => {
        setEditData(p);
        setDialogOpen(true);
    };

    const handleToggleStatus = async (p: Principal) => {
        const newStatus = p.status === 'active' ? 'inactive' : 'active';
        try {
            await updateMutation.mutateAsync({
                principalId: p.principalId,
                data: { status: newStatus },
            });
            notification.success(`Principal account ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
        } catch {
            notification.error('Failed to update principal status');
        }
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
        setEditData(null);
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {/* ── Page Header ── */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 3,
                    gap: 2,
                    flexWrap: 'wrap',
                }}
            >
                <Box>
                    <Typography variant="h5" fontWeight={700} gutterBottom>
                        Principal Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage your school's principal account. Only one principal can be active per school.
                    </Typography>
                </Box>
            </Box>

            {/* ── Loading ── */}
            {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
            )}

            {/* ── Error ── */}
            {error && !isLoading && !principal && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {(error as any)?.message || 'Failed to load principal data.'}
                </Alert>
            )}

            {/* ── No Principal Registered ── */}
            {!isLoading && !principal && !error && (
                <Paper
                    sx={{
                        p: 6,
                        textAlign: 'center',
                        borderRadius: 4,
                        border: '2px dashed #e2e8f0',
                        background: 'linear-gradient(135deg, #f8f9ff, #f0f4ff)',
                    }}
                >
                    <Box
                        sx={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #6a11cb33, #2575fc33)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 'auto',
                            mb: 2,
                        }}
                    >
                        <PrincipalIcon sx={{ fontSize: 40, color: '#6a11cb' }} />
                    </Box>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                        No Principal Registered Yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 420, mx: 'auto' }}>
                        Register your school's principal to give them access to approve leaves, review timetables, and manage school-wide operations.
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAdd}
                        sx={{
                            background: 'linear-gradient(135deg, #6a11cb, #2575fc)',
                            borderRadius: 2,
                            fontWeight: 600,
                            px: 4,
                        }}
                    >
                        Register Principal
                    </Button>
                </Paper>
            )}

            {/* ── Principal Profile Card ── */}
            {principal && (
                <Grid container spacing={3}>
                    {/* Main Profile Card */}
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Card
                            sx={{
                                borderRadius: 4,
                                border: '1px solid #e2e8f0',
                                overflow: 'visible',
                                background: 'linear-gradient(135deg, #ffffff, #f8f9ff)',
                            }}
                        >
                            <CardContent sx={{ p: 3 }}>
                                {/* Avatar + Name */}
                                <Box sx={{ textAlign: 'center', mb: 3 }}>
                                    <Avatar
                                        src={principal.profileImage}
                                        sx={{
                                            width: 100,
                                            height: 100,
                                            mx: 'auto',
                                            mb: 2,
                                            fontSize: 36,
                                            fontWeight: 700,
                                            background: 'linear-gradient(135deg, #6a11cb, #2575fc)',
                                            border: '4px solid white',
                                            boxShadow: '0 8px 24px rgba(106,17,203,0.25)',
                                        }}
                                    >
                                        {(principal.firstName?.[0] || '') + (principal.lastName?.[0] || '')}
                                    </Avatar>

                                    <Typography variant="h5" fontWeight={700}>
                                        {principal.firstName} {principal.lastName}
                                    </Typography>

                                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 1 }}>
                                        <Chip
                                            label="Principal"
                                            size="small"
                                            sx={{
                                                background: 'linear-gradient(135deg, #6a11cb, #2575fc)',
                                                color: 'white',
                                                fontWeight: 600,
                                            }}
                                            icon={<PrincipalIcon sx={{ color: 'white !important', fontSize: '14px !important' }} />}
                                        />
                                        <Chip
                                            label={principal.status === 'active' ? 'Active' : 'Inactive'}
                                            size="small"
                                            color={principal.status === 'active' ? 'success' : 'error'}
                                            variant="outlined"
                                            icon={
                                                principal.status === 'active'
                                                    ? <ActiveIcon sx={{ fontSize: '14px !important' }} />
                                                    : <InactiveIcon sx={{ fontSize: '14px !important' }} />
                                            }
                                        />
                                    </Box>
                                </Box>

                                <Divider sx={{ mb: 2 }} />

                                {/* Contact Info */}
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {[
                                        { icon: <EmailIcon sx={{ fontSize: 18, color: '#6a11cb' }} />, label: 'Email', value: principal.email },
                                        { icon: <PhoneIcon sx={{ fontSize: 18, color: '#6a11cb' }} />, label: 'Phone', value: principal.phone || '—' },
                                        { icon: <BadgeIcon sx={{ fontSize: 18, color: '#6a11cb' }} />, label: 'ID', value: principal.principalId },
                                        { icon: <SchoolIcon sx={{ fontSize: 18, color: '#6a11cb' }} />, label: 'Joined', value: formatDate(principal.createdAt) },
                                    ].map((item) => (
                                        <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            {item.icon}
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    {item.label}
                                                </Typography>
                                                <Typography variant="body2" fontWeight={500}>
                                                    {item.value}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>

                                <Divider sx={{ my: 2 }} />

                                {/* Actions */}
                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                    <Tooltip title="Edit principal details">
                                        <Button
                                            variant="outlined"
                                            startIcon={<EditIcon />}
                                            onClick={() => handleEdit(principal!)}
                                            size="small"
                                            sx={{ borderRadius: 2, flex: 1 }}
                                        >
                                            Edit Profile
                                        </Button>
                                    </Tooltip>
                                    <Tooltip title={principal.status === 'active' ? 'Deactivate account' : 'Activate account'}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                {principal.status === 'active' ? 'Active' : 'Inactive'}
                                            </Typography>
                                            <Switch
                                                checked={principal.status === 'active'}
                                                onChange={() => handleToggleStatus(principal!)}
                                                disabled={updateMutation.isPending}
                                                color="success"
                                                size="small"
                                            />
                                        </Box>
                                    </Tooltip>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Info Panel */}
                    <Grid size={{ xs: 12, md: 7 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            {/* Capabilities info */}
                            <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0' }}>
                                <Typography variant="h6" fontWeight={700} gutterBottom>
                                    Principal Access & Permissions
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    The principal has oversight access to the following school functions:
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {[
                                        { label: 'Teacher Leave Approvals', desc: 'Review and approve/reject teacher leave requests', color: '#f59e0b' },
                                        { label: 'Timetable Review', desc: 'Review draft timetables before they go live', color: '#3b82f6' },
                                        { label: 'Exam Schedule Approvals', desc: 'Approve exam schedules and publish results', color: '#8b5cf6' },
                                        { label: 'Student & Teacher Directory', desc: 'Read-only view of all school members', color: '#10b981' },
                                        { label: 'Attendance Oversight', desc: 'Monitor school-wide attendance reports', color: '#ef4444' },
                                        { label: 'School Announcements', desc: 'Create and manage school-wide announcements', color: '#6366f1' },
                                    ].map((item) => (
                                        <Box
                                            key={item.label}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: 1.5,
                                                p: 1.5,
                                                borderRadius: 2,
                                                bgcolor: '#f8fafc',
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: '50%',
                                                    bgcolor: item.color,
                                                    mt: 0.7,
                                                    flexShrink: 0,
                                                }}
                                            />
                                            <Box>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {item.label}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {item.desc}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            </Paper>

                            {/* One-per-school note */}
                            <Alert
                                severity="info"
                                sx={{ borderRadius: 3 }}
                                icon={<PrincipalIcon />}
                            >
                                <Typography variant="body2" fontWeight={600} gutterBottom>
                                    Single Principal Policy
                                </Typography>
                                <Typography variant="body2">
                                    Each school can have only one active principal account. To register a new principal,
                                    first deactivate the current one, or edit this profile to change the credentials.
                                </Typography>
                            </Alert>
                        </Box>
                    </Grid>
                </Grid>
            )}

            {/* ── Dialog ── */}
            <PrincipalDialog
                open={dialogOpen}
                onClose={handleDialogClose}
                schoolId={schoolId}
                editData={editData}
            />
        </Box>
    );
};

export default PrincipalManagement;
