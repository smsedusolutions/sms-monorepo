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
    Email as EmailIcon,
    Phone as PhoneIcon,
    School as SchoolIcon,
    Edit as EditIcon,
    FamilyRestroom as FamilyIcon,
    Home as HomeIcon,
    Work as WorkIcon,
    ArrowForward as ArrowForwardIcon,
    ReceiptLong as FeeIcon,
    AccessTime as AttendanceIcon,
    VerifiedUser as VerifiedIcon,
    Wc as GenderIcon,
    Cake as CakeIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import RequestChangeDialog from '../../components/Dialogs/RequestChangeDialog';
import { useUserStore } from '../../stores/userStore';
import { useChildSelector } from '../../context/ChildSelectorContext';
import TokenService from '../../queries/token/tokenService';

const ParentProfile: React.FC = () => {
    const navigate = useNavigate();
    const [requestDialogOpen, setRequestDialogOpen] = useState(false);
    const [requestFieldType, setRequestFieldType] = useState<"email_change" | "phone_change" | "general">("general");
    const [currentFieldValue, setCurrentFieldValue] = useState("");

    // Get parent & school data from Zustand store
    const { user: parent, school, isLoading: parentLoading, error: parentError } = useUserStore();
    const { children, setSelectedChild } = useChildSelector();

    const schoolId = school?.schoolId || TokenService.getSchoolId() || '';
    const parentId = parent?.userId || parent?.parentId || TokenService.getUserId() || '';
    const schoolName = parent?.schoolName || school?.schoolName || schoolId;

    const parentName = parent?.firstName
        ? `${parent.firstName} ${parent.lastName || ''}`.trim()
        : parent?.email?.split('@')[0] || 'Parent';

    const parentEmail = parent?.email || '';
    const parentPhone = parent?.phone || '';
    const parentGender = parent?.gender ? String(parent.gender).toUpperCase() : 'Not Specified';
    const parentDob = parent?.dateOfBirth ? new Date(parent.dateOfBirth).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not Specified';
    const parentRelationship = parent?.relationship || 'Parent';
    const parentOccupation = parent?.occupation || 'Not Specified';
    const parentAddress = parent?.address || 'Not Specified';
    const parentStatus = parent?.status || 'active';

    const openRequestDialog = (type: "email_change" | "phone_change" | "general", currentValue: string = "") => {
        setRequestFieldType(type);
        setCurrentFieldValue(currentValue);
        setRequestDialogOpen(true);
    };

    const getInitials = () => {
        if (parent?.firstName && parent?.lastName) {
            return `${parent.firstName[0]}${parent.lastName[0]}`.toUpperCase();
        }
        return parent?.firstName ? parent.firstName[0].toUpperCase() : 'P';
    };

    if (parentLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (parentError) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Failed to load parent profile. Please refresh the page.</Alert>
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
                        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
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
                            src={parent?.profileImage}
                            sx={{
                                width: { xs: 76, sm: 92 },
                                height: { xs: 76, sm: 92 },
                                fontSize: { xs: '1.75rem', sm: '2.2rem' },
                                fontWeight: 800,
                                bgcolor: '#6366f1',
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
                                    {parentName}
                                </Typography>
                                <Chip
                                    icon={<VerifiedIcon sx={{ fontSize: '14px !important', color: '#fff !important' }} />}
                                    label="Verified Guardian"
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

                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 1.5, fontSize: { xs: '0.825rem', sm: '0.9rem' } }}>
                                Parent ID: <strong style={{ color: '#ffffff' }}>{parentId}</strong> • {parentRelationship.toUpperCase()} • {schoolName}
                            </Typography>

                            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                                <Chip
                                    label={parentStatus === 'active' ? 'Active Account' : 'Inactive'}
                                    size="small"
                                    sx={{
                                        bgcolor: parentStatus === 'active' ? '#10b981' : '#ef4444',
                                        color: '#ffffff',
                                        fontWeight: 700,
                                        fontSize: '0.725rem',
                                    }}
                                />
                                <Chip
                                    label={`${children.length} Linked ${children.length === 1 ? 'Child' : 'Children'}`}
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
                                color: '#312e81',
                                fontWeight: 700,
                                borderRadius: 2,
                                textTransform: 'none',
                                px: 2.5,
                                py: 1,
                                fontSize: '0.85rem',
                                boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                                '&:hover': { bgcolor: '#f1f5f9' },
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
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>LINKED STUDENTS</Typography>
                        <Typography variant="h6" fontWeight={800} sx={{ mt: 0.25, color: '#1e293b' }}>{children.length}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }} sx={{ p: 2, textAlign: 'center', borderRight: { sm: '1px solid #e2e8f0' }, borderBottom: { xs: '1px solid #e2e8f0', sm: 'none' } }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>RELATIONSHIP</Typography>
                        <Typography variant="h6" fontWeight={800} sx={{ mt: 0.25, color: '#4f46e5', textTransform: 'capitalize' }}>{parentRelationship}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }} sx={{ p: 2, textAlign: 'center', borderRight: { xs: '1px solid #e2e8f0', sm: '1px solid #e2e8f0' } }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>OCCUPATION</Typography>
                        <Typography variant="h6" fontWeight={800} sx={{ mt: 0.25, color: '#1e293b', fontSize: '0.95rem' }} noWrap>{parentOccupation}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }} sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>ACCOUNT STATUS</Typography>
                        <Typography variant="h6" fontWeight={800} sx={{ mt: 0.25, color: parentStatus === 'active' ? '#10b981' : '#ef4444' }}>
                            {parentStatus.toUpperCase()}
                        </Typography>
                    </Grid>
                </Grid>
            </Card>

            <Grid container spacing={3}>
                {/* Left Column: Personal Contact Information */}
                <Grid size={{ xs: 12, md: 4.5 }}>
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
                            Contact & Personal Details
                        </Typography>

                        <Stack spacing={2}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                <Avatar sx={{ width: 36, height: 36, bgcolor: '#eef2ff', color: '#4f46e5' }}>
                                    <EmailIcon sx={{ fontSize: 18 }} />
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Email Address</Typography>
                                    <Typography variant="body2" fontWeight={600} noWrap>{parentEmail || 'Not Provided'}</Typography>
                                </Box>
                                <Tooltip title="Request email change">
                                    <IconButton size="small" onClick={() => openRequestDialog("email_change", parentEmail)}>
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
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Phone Number</Typography>
                                    <Typography variant="body2" fontWeight={600}>{parentPhone || 'Not Provided'}</Typography>
                                </Box>
                                <Tooltip title="Request phone change">
                                    <IconButton size="small" onClick={() => openRequestDialog("phone_change", parentPhone)}>
                                        <EditIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: 16 }} />
                                    </IconButton>
                                </Tooltip>
                            </Box>

                            <Divider />

                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                <Avatar sx={{ width: 36, height: 36, bgcolor: '#fdf2f8', color: '#db2777' }}>
                                    <GenderIcon sx={{ fontSize: 18 }} />
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Gender</Typography>
                                    <Typography variant="body2" fontWeight={600}>{parentGender}</Typography>
                                </Box>
                            </Box>

                            <Divider />

                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                <Avatar sx={{ width: 36, height: 36, bgcolor: '#fef3c7', color: '#d97706' }}>
                                    <CakeIcon sx={{ fontSize: 18 }} />
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Date of Birth</Typography>
                                    <Typography variant="body2" fontWeight={600}>{parentDob}</Typography>
                                </Box>
                            </Box>

                            <Divider />

                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                <Avatar sx={{ width: 36, height: 36, bgcolor: '#fffbeb', color: '#f59e0b' }}>
                                    <WorkIcon sx={{ fontSize: 18 }} />
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Occupation</Typography>
                                    <Typography variant="body2" fontWeight={600}>{parentOccupation}</Typography>
                                </Box>
                            </Box>

                            <Divider />

                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                <Avatar sx={{ width: 36, height: 36, bgcolor: '#f1f5f9', color: '#475569' }}>
                                    <HomeIcon sx={{ fontSize: 18 }} />
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Residential Address</Typography>
                                    <Typography variant="body2" fontWeight={600}>{parentAddress}</Typography>
                                </Box>
                            </Box>

                            <Divider />

                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                <Avatar sx={{ width: 36, height: 36, bgcolor: '#f5f3ff', color: '#8b5cf6' }}>
                                    <SchoolIcon sx={{ fontSize: 18 }} />
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Registered School</Typography>
                                    <Typography variant="body2" fontWeight={600}>{schoolName}</Typography>
                                    <Typography variant="caption" color="text.secondary">School ID: {schoolId}</Typography>
                                </Box>
                            </Box>
                        </Stack>
                    </Paper>
                </Grid>

                {/* Right Column: Linked Children Hub */}
                <Grid size={{ xs: 12, md: 7.5 }}>
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
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                <Box sx={{ p: 0.75, borderRadius: 2, bgcolor: '#eef2ff', color: '#4f46e5' }}>
                                    <FamilyIcon sx={{ fontSize: 22 }} />
                                </Box>
                                <Box>
                                    <Typography variant="subtitle1" fontWeight={700} color="#1e293b">
                                        Linked Students ({children.length})
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Children registered under your parental guardianship
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>

                        {children.length === 0 ? (
                            <Alert severity="info" sx={{ borderRadius: 2 }}>
                                No student profiles are linked to this parent account. Please contact school administration.
                            </Alert>
                        ) : (
                            <Stack spacing={2}>
                                {children.map((child) => (
                                    <Paper
                                        key={child.studentId}
                                        elevation={0}
                                        sx={{
                                            p: 2,
                                            borderRadius: 2.5,
                                            border: '1px solid #e2e8f0',
                                            bgcolor: '#f8fafc',
                                            transition: 'all 0.18s ease-in-out',
                                            '&:hover': {
                                                borderColor: '#cbd5e1',
                                                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                                                bgcolor: '#ffffff',
                                            },
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Avatar
                                                    src={child.profileImage}
                                                    sx={{
                                                        width: 50,
                                                        height: 50,
                                                        bgcolor: '#4f46e5',
                                                        fontWeight: 700,
                                                        fontSize: '1.15rem',
                                                    }}
                                                >
                                                    {child.firstName?.[0]}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: '0.95rem', color: '#1e293b' }}>
                                                        {child.firstName} {child.lastName}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                                                        ID: <strong>{child.studentId}</strong> • Class: {child.className || `Class ${child.class}`} {child.sectionName ? `(${child.sectionName})` : ''} {child.rollNumber ? `• Roll: ${child.rollNumber}` : ''}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            {/* Quick Action Navigation Buttons */}
                                            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 0.75 }}>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    startIcon={<AttendanceIcon sx={{ fontSize: 16 }} />}
                                                    onClick={() => {
                                                        setSelectedChild(child);
                                                        navigate('/parent/attendance');
                                                    }}
                                                    sx={{ textTransform: 'none', borderRadius: 2, fontSize: '0.75rem', fontWeight: 600 }}
                                                >
                                                    Attendance
                                                </Button>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    startIcon={<FeeIcon sx={{ fontSize: 16 }} />}
                                                    onClick={() => {
                                                        setSelectedChild(child);
                                                        navigate('/parent/fees/statement');
                                                    }}
                                                    sx={{ textTransform: 'none', borderRadius: 2, fontSize: '0.75rem', fontWeight: 600 }}
                                                >
                                                    Fees
                                                </Button>
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                                                    onClick={() => {
                                                        setSelectedChild(child);
                                                        navigate(`/parent/children/${child.studentId}`);
                                                    }}
                                                    sx={{ textTransform: 'none', borderRadius: 2, fontSize: '0.75rem', fontWeight: 600, bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
                                                >
                                                    Profile
                                                </Button>
                                            </Stack>
                                        </Box>
                                    </Paper>
                                ))}
                            </Stack>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* Request Change Dialog */}
            <RequestChangeDialog
                open={requestDialogOpen}
                onClose={() => setRequestDialogOpen(false)}
                schoolId={schoolId}
                userId={parentId}
                userName={parentName}
                userType="parent"
                fieldType={requestFieldType}
                currentValue={currentFieldValue}
            />
        </Box>
    );
};

export default ParentProfile;
