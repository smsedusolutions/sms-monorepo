import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Chip,
    Divider,
    Button,
    Avatar,
    Card,
    CircularProgress,
    Alert,
    Stack,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    School as SchoolIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    AdminPanelSettings as AdminIcon,
    Edit as EditIcon,
    FactCheck as ApprovalIcon,
    CalendarMonth as TimetableIcon,
    EventNote as AttendanceIcon,
    Assessment as ResultsIcon,
    VerifiedUser as VerifiedIcon,
    ArrowForward as ArrowForwardIcon,
    AccountBalance as CampusIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import RequestChangeDialog from '../../components/Dialogs/RequestChangeDialog';
import { useUserStore } from '../../stores/userStore';
import TokenService from '../../queries/token/tokenService';

const PrincipalProfile: React.FC = () => {
    const navigate = useNavigate();
    const [requestDialogOpen, setRequestDialogOpen] = useState(false);
    const [requestFieldType, setRequestFieldType] = useState<"email_change" | "phone_change" | "general">("general");
    const [currentFieldValue, setCurrentFieldValue] = useState("");

    const { user: principal, school, isLoading, error } = useUserStore();

    const userId = principal?.userId || principal?.principalId || TokenService.getUserId() || '';
    const schoolId = school?.schoolId || TokenService.getSchoolId() || '';
    const schoolName = principal?.schoolName || school?.schoolName || schoolId;

    const userName = principal?.firstName
        ? `${principal.firstName} ${principal.lastName || ''}`.trim()
        : principal?.email?.split('@')[0] || 'Principal';

    const userEmail = principal?.email || '';
    const userPhone = principal?.phone || '';
    const userStatus = principal?.status || 'active';

    const openRequestDialog = (type: "email_change" | "phone_change" | "general", currentValue: string = "") => {
        setRequestFieldType(type);
        setCurrentFieldValue(currentValue);
        setRequestDialogOpen(true);
    };

    const getInitials = () => {
        if (principal?.firstName && principal?.lastName) {
            return `${principal.firstName[0]}${principal.lastName[0]}`.toUpperCase();
        }
        return principal?.firstName ? principal.firstName[0].toUpperCase() : 'P';
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Failed to load principal profile. Please refresh the page.</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
            {/* Hero Profile Banner */}
            <Card
                sx={{
                    mb: 3,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                    overflow: 'hidden',
                }}
            >
                <Box
                    sx={{
                        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #3b82f6 100%)',
                        px: { xs: 2.5, sm: 4 },
                        py: { xs: 3, sm: 3.5 },
                        color: '#ffffff',
                        position: 'relative',
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: { xs: 'flex-start', sm: 'center' },
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: 3,
                        }}
                    >
                        <Avatar
                            src={principal?.profileImage}
                            sx={{
                                width: { xs: 76, sm: 92 },
                                height: { xs: 76, sm: 92 },
                                fontSize: { xs: '1.75rem', sm: '2.2rem' },
                                fontWeight: 800,
                                bgcolor: '#1d4ed8',
                                color: '#ffffff',
                                border: '3px solid rgba(255, 255, 255, 0.9)',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                            }}
                        >
                            {getInitials()}
                        </Avatar>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                                <Typography variant="h5" fontWeight={800} sx={{ color: '#ffffff', fontSize: { xs: '1.3rem', sm: '1.65rem' } }}>
                                    {userName}
                                </Typography>
                                <Chip
                                    icon={<VerifiedIcon sx={{ fontSize: '14px !important', color: '#fff !important' }} />}
                                    label="School Head & Principal"
                                    size="small"
                                    sx={{
                                        bgcolor: 'rgba(255, 255, 255, 0.15)',
                                        color: '#ffffff',
                                        fontWeight: 700,
                                        fontSize: '0.7rem',
                                        backdropFilter: 'blur(4px)',
                                    }}
                                />
                            </Box>

                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)', mb: 1.5, fontSize: { xs: '0.825rem', sm: '0.9rem' } }}>
                                Principal ID: <strong style={{ color: '#ffffff' }}>{userId}</strong> • {schoolName}
                            </Typography>

                            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                                <Chip
                                    label={userStatus === 'active' ? 'Active Leadership' : 'Inactive'}
                                    size="small"
                                    sx={{
                                        bgcolor: userStatus === 'active' ? '#60a5fa' : '#ef4444',
                                        color: '#1e3a8a',
                                        fontWeight: 700,
                                        fontSize: '0.725rem',
                                    }}
                                />
                                <Chip
                                    label="Executive Administrator"
                                    size="small"
                                    sx={{
                                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                                        color: '#ffffff',
                                        fontWeight: 700,
                                        fontSize: '0.725rem',
                                    }}
                                />
                            </Stack>
                        </Box>

                        <Button
                            variant="contained"
                            startIcon={<EditIcon />}
                            onClick={() => openRequestDialog("general", "")}
                            sx={{
                                bgcolor: '#ffffff',
                                color: '#1e3a8a',
                                fontWeight: 700,
                                borderRadius: 2,
                                textTransform: 'none',
                                px: 2.5,
                                py: 1,
                                fontSize: '0.85rem',
                                boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                                '&:hover': { bgcolor: '#eff6ff' },
                                alignSelf: { xs: 'flex-start', sm: 'center' },
                            }}
                        >
                            Request Update
                        </Button>
                    </Box>
                </Box>

                {/* KPI Metrics Strip */}
                <Grid container sx={{ bgcolor: '#f8fafc', borderTop: '1px solid', borderColor: 'divider' }}>
                    <Grid size={{ xs: 6, sm: 3 }} sx={{ p: 2, textAlign: 'center', borderRight: { xs: '1px solid #e2e8f0', sm: '1px solid #e2e8f0' }, borderBottom: { xs: '1px solid #e2e8f0', sm: 'none' } }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>ROLE</Typography>
                        <Typography variant="h6" fontWeight={800} sx={{ mt: 0.25, color: '#1e40af' }}>Principal</Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }} sx={{ p: 2, textAlign: 'center', borderRight: { sm: '1px solid #e2e8f0' }, borderBottom: { xs: '1px solid #e2e8f0', sm: 'none' } }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>INSTITUTION</Typography>
                        <Typography variant="h6" fontWeight={800} sx={{ mt: 0.25, color: '#1e293b', fontSize: '0.95rem' }} noWrap>{schoolName}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }} sx={{ p: 2, textAlign: 'center', borderRight: { xs: '1px solid #e2e8f0', sm: '1px solid #e2e8f0' } }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>SCHOOL CODE</Typography>
                        <Typography variant="h6" fontWeight={800} sx={{ mt: 0.25, color: '#1e293b' }}>{schoolId}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }} sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>ACCOUNT STATUS</Typography>
                        <Typography variant="h6" fontWeight={800} sx={{ mt: 0.25, color: userStatus === 'active' ? '#10b981' : '#ef4444' }}>
                            {userStatus.toUpperCase()}
                        </Typography>
                    </Grid>
                </Grid>
            </Card>

            <Grid container spacing={3}>
                {/* Left Column: Official Contact Details */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 2, sm: 2.5 },
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: '#ffffff',
                        }}
                    >
                        <Typography variant="subtitle1" fontWeight={700} color="#1e293b" sx={{ mb: 2 }}>
                            Official Contact & Office Details
                        </Typography>

                        <Stack spacing={2}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                <Avatar sx={{ width: 36, height: 36, bgcolor: '#eff6ff', color: '#2563eb' }}>
                                    <EmailIcon sx={{ fontSize: 18 }} />
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Official Email</Typography>
                                    <Typography variant="body2" fontWeight={600} noWrap>{userEmail || 'Not Provided'}</Typography>
                                </Box>
                                <Tooltip title="Request email change">
                                    <IconButton size="small" onClick={() => openRequestDialog("email_change", userEmail)}>
                                        <EditIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: 16 }} />
                                    </IconButton>
                                </Tooltip>
                            </Box>

                            <Divider />

                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                <Avatar sx={{ width: 36, height: 36, bgcolor: '#ecfdf5', color: '#10b981' }}>
                                    <PhoneIcon sx={{ fontSize: 18 }} />
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Direct Contact Phone</Typography>
                                    <Typography variant="body2" fontWeight={600}>{userPhone || 'Not Provided'}</Typography>
                                </Box>
                                <Tooltip title="Request phone change">
                                    <IconButton size="small" onClick={() => openRequestDialog("phone_change", userPhone)}>
                                        <EditIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: 16 }} />
                                    </IconButton>
                                </Tooltip>
                            </Box>

                            <Divider />

                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                <Avatar sx={{ width: 36, height: 36, bgcolor: '#eef2ff', color: '#4f46e5' }}>
                                    <CampusIcon sx={{ fontSize: 18 }} />
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>School Campus</Typography>
                                    <Typography variant="body2" fontWeight={600}>{schoolName}</Typography>
                                    <Typography variant="caption" color="text.secondary">Campus Code: {schoolId}</Typography>
                                </Box>
                            </Box>

                            <Divider />

                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                <Avatar sx={{ width: 36, height: 36, bgcolor: '#f1f5f9', color: '#475569' }}>
                                    <AdminIcon sx={{ fontSize: 18 }} />
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Administrative Clearance</Typography>
                                    <Typography variant="body2" fontWeight={600}>Academic & Faculty Executive</Typography>
                                </Box>
                            </Box>
                        </Stack>

                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={() => openRequestDialog("general", "")}
                            sx={{ mt: 3, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                        >
                            Request Information Change
                        </Button>
                    </Paper>
                </Grid>

                {/* Right Column: Executive Governance Gateways */}
                <Grid size={{ xs: 12, md: 7 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 2, sm: 2.5 },
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: '#ffffff',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2 }}>
                            <Box sx={{ p: 0.75, borderRadius: 2, bgcolor: '#eff6ff', color: '#2563eb' }}>
                                <SchoolIcon sx={{ fontSize: 22 }} />
                            </Box>
                            <Box>
                                <Typography variant="subtitle1" fontWeight={700} color="#1e293b">
                                    Executive Governance & Review Hub
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Direct access to school approvals, attendance, and exam oversight
                                </Typography>
                            </Box>
                        </Box>

                        <Grid container spacing={1.5}>
                            {[
                                { label: 'Teacher Leave Approvals', desc: 'Review & approve staff leaves', icon: <ApprovalIcon />, path: '/principal/leave/teacher-requests', color: '#2563eb' },
                                { label: 'Master Timetable Review', desc: 'Inspect schedules & conflict status', icon: <TimetableIcon />, path: '/principal/timetable/review', color: '#7c3aed' },
                                { label: 'Exam Term Approvals', desc: 'Approve exam dates & papers', icon: <ResultsIcon />, path: '/principal/exam/approval', color: '#059669' },
                                { label: 'School Attendance Live', desc: 'Real-time student & staff records', icon: <AttendanceIcon />, path: '/principal/attendance', color: '#d97706' },
                            ].map((item) => (
                                <Grid size={{ xs: 12, sm: 6 }} key={item.label}>
                                    <Paper
                                        elevation={0}
                                        onClick={() => navigate(item.path)}
                                        sx={{
                                            p: 2,
                                            borderRadius: 2.5,
                                            border: '1px solid #e2e8f0',
                                            bgcolor: '#f8fafc',
                                            cursor: 'pointer',
                                            transition: 'all 0.18s ease-in-out',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            '&:hover': {
                                                borderColor: item.color,
                                                boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
                                                bgcolor: '#ffffff',
                                                transform: 'translateY(-1.5px)',
                                            },
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Avatar sx={{ bgcolor: `${item.color}15`, color: item.color, width: 42, height: 42, borderRadius: 2 }}>
                                                {React.cloneElement(item.icon as any, { sx: { fontSize: 22 } })}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: '0.875rem' }}>{item.label}</Typography>
                                                <Typography variant="caption" color="text.secondary">{item.desc}</Typography>
                                            </Box>
                                        </Box>
                                        <ArrowForwardIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>

            {/* Request Change Dialog */}
            <RequestChangeDialog
                open={requestDialogOpen}
                onClose={() => setRequestDialogOpen(false)}
                schoolId={schoolId}
                userId={userId}
                userName={userName}
                userType="sch_admin"
                fieldType={requestFieldType}
                currentValue={currentFieldValue}
            />
        </Box>
    );
};

export default PrincipalProfile;
