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
    DirectionsBus as BusIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Edit as EditIcon,
    School as SchoolIcon,
    VerifiedUser as VerifiedIcon,
    Badge as LicenseIcon,
    Speed as VehicleIcon,
    ArrowForward as ArrowForwardIcon,
    Notifications as AlertsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import RequestChangeDialog from '../../components/Dialogs/RequestChangeDialog';
import { useUserStore } from '../../stores/userStore';
import TokenService from '../../queries/token/tokenService';

const DriverProfile: React.FC = () => {
    const navigate = useNavigate();
    const [requestDialogOpen, setRequestDialogOpen] = useState(false);
    const [requestFieldType, setRequestFieldType] = useState<"email_change" | "phone_change" | "general">("general");
    const [currentFieldValue, setCurrentFieldValue] = useState("");

    const { user: driver, school, isLoading: driverLoading, error: driverError } = useUserStore();

    const schoolId = school?.schoolId || TokenService.getSchoolId() || '';
    const driverId = driver?.userId || driver?.driverId || TokenService.getUserId() || '';
    const schoolName = driver?.schoolName || school?.schoolName || schoolId;

    const userName = driver?.firstName
        ? `${driver.firstName} ${driver.lastName || ''}`.trim()
        : driver?.email?.split('@')[0] || 'Fleet Driver';

    const userEmail = driver?.email || '';
    const userPhone = driver?.phone || '';
    const licenseNumber = driver?.licenseNumber || 'Verified Commercial DL';
    const currentVehicle = driver?.currentVehicleNumber || driver?.currentVehicleId || 'Assigned Fleet Bus';
    const currentRoute = driver?.currentRouteName || driver?.currentRouteId || 'Main Campus Morning/Evening Route';
    const userStatus = driver?.status || 'active';

    const openRequestDialog = (type: "email_change" | "phone_change" | "general", currentValue: string = "") => {
        setRequestFieldType(type);
        setCurrentFieldValue(currentValue);
        setRequestDialogOpen(true);
    };

    const getInitials = () => {
        if (driver?.firstName && driver?.lastName) {
            return `${driver.firstName[0]}${driver.lastName[0]}`.toUpperCase();
        }
        return driver?.firstName ? driver.firstName[0].toUpperCase() : 'D';
    };

    if (driverLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (driverError) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Failed to load driver profile. Please refresh the page.</Alert>
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
                        background: 'linear-gradient(135deg, #065f46 0%, #047857 50%, #0d9488 100%)',
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
                            src={driver?.profileImage}
                            sx={{
                                width: { xs: 76, sm: 92 },
                                height: { xs: 76, sm: 92 },
                                fontSize: { xs: '1.75rem', sm: '2.2rem' },
                                fontWeight: 800,
                                bgcolor: '#059669',
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
                                    label="Licensed Transport Driver"
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
                                Driver ID: <strong style={{ color: '#ffffff' }}>{driverId}</strong> • {schoolName}
                            </Typography>

                            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                                <Chip
                                    label={userStatus === 'active' ? 'Active On-Duty' : 'Inactive'}
                                    size="small"
                                    sx={{
                                        bgcolor: userStatus === 'active' ? '#34d399' : '#ef4444',
                                        color: '#064e3b',
                                        fontWeight: 700,
                                        fontSize: '0.725rem',
                                    }}
                                />
                                <Chip
                                    label="School Fleet Staff"
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
                                color: '#065f46',
                                fontWeight: 700,
                                borderRadius: 2,
                                textTransform: 'none',
                                px: 2.5,
                                py: 1,
                                fontSize: '0.85rem',
                                boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                                '&:hover': { bgcolor: '#f0fdf4' },
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
                        <Typography variant="h6" fontWeight={800} sx={{ mt: 0.25, color: '#059669' }}>Fleet Driver</Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }} sx={{ p: 2, textAlign: 'center', borderRight: { sm: '1px solid #e2e8f0' }, borderBottom: { xs: '1px solid #e2e8f0', sm: 'none' } }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>ASSIGNED FLEET</Typography>
                        <Typography variant="h6" fontWeight={800} sx={{ mt: 0.25, color: '#1e293b', fontSize: '0.95rem' }} noWrap>{currentVehicle}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }} sx={{ p: 2, textAlign: 'center', borderRight: { xs: '1px solid #e2e8f0', sm: '1px solid #e2e8f0' } }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>SCHOOL CODE</Typography>
                        <Typography variant="h6" fontWeight={800} sx={{ mt: 0.25, color: '#1e293b' }}>{schoolId}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }} sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>STATUS</Typography>
                        <Typography variant="h6" fontWeight={800} sx={{ mt: 0.25, color: userStatus === 'active' ? '#10b981' : '#ef4444' }}>
                            {userStatus.toUpperCase()}
                        </Typography>
                    </Grid>
                </Grid>
            </Card>

            <Grid container spacing={3}>
                {/* Left Column: Driver Personal Details */}
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
                            Driver & Contact Details
                        </Typography>

                        <Stack spacing={2}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                <Avatar sx={{ width: 36, height: 36, bgcolor: '#ecfdf5', color: '#059669' }}>
                                    <EmailIcon sx={{ fontSize: 18 }} />
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Email Address</Typography>
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
                                <Avatar sx={{ width: 36, height: 36, bgcolor: '#eff6ff', color: '#2563eb' }}>
                                    <PhoneIcon sx={{ fontSize: 18 }} />
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Contact Phone</Typography>
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
                                <Avatar sx={{ width: 36, height: 36, bgcolor: '#fffbeb', color: '#d97706' }}>
                                    <LicenseIcon sx={{ fontSize: 18 }} />
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Commercial Driver License</Typography>
                                    <Typography variant="body2" fontWeight={600}>{licenseNumber}</Typography>
                                </Box>
                            </Box>

                            <Divider />

                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                <Avatar sx={{ width: 36, height: 36, bgcolor: '#f5f3ff', color: '#8b5cf6' }}>
                                    <SchoolIcon sx={{ fontSize: 18 }} />
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Registered School Campus</Typography>
                                    <Typography variant="body2" fontWeight={600}>{schoolName}</Typography>
                                    <Typography variant="caption" color="text.secondary">School ID: {schoolId}</Typography>
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

                {/* Right Column: Transport Route & Fleet Gateways */}
                <Grid size={{ xs: 12, md: 7 }}>
                    <Stack spacing={3}>
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
                                <Box sx={{ p: 0.75, borderRadius: 2, bgcolor: '#ecfdf5', color: '#059669' }}>
                                    <BusIcon sx={{ fontSize: 22 }} />
                                </Box>
                                <Box>
                                    <Typography variant="subtitle1" fontWeight={700} color="#1e293b">
                                        Transport Fleet & Route Assignment
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Current operational vehicle and active transit route
                                    </Typography>
                                </Box>
                            </Box>

                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>ASSIGNED VEHICLE</Typography>
                                        <Typography variant="subtitle1" fontWeight={700} color="#065f46" sx={{ mt: 0.5 }}>
                                            {currentVehicle}
                                        </Typography>
                                    </Paper>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>ACTIVE ROUTE</Typography>
                                        <Typography variant="subtitle1" fontWeight={700} color="#1e293b" sx={{ mt: 0.5 }}>
                                            {currentRoute}
                                        </Typography>
                                    </Paper>
                                </Grid>
                            </Grid>
                        </Paper>

                        {/* Driver Gateways */}
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
                                Fleet Operations Gateways
                            </Typography>

                            <Grid container spacing={1.5}>
                                {[
                                    { label: 'Driver Dashboard', desc: 'Active trip & passenger list', icon: <VehicleIcon />, path: '/driver/dashboard', color: '#059669' },
                                    { label: 'Transit Notifications', desc: 'Broadcasts & emergency alerts', icon: <AlertsIcon />, path: '/driver/notifications', color: '#3b82f6' },
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
                    </Stack>
                </Grid>
            </Grid>

            {/* Request Change Dialog */}
            <RequestChangeDialog
                open={requestDialogOpen}
                onClose={() => setRequestDialogOpen(false)}
                schoolId={schoolId}
                userId={driverId}
                userName={userName}
                userType="teacher" // uses existing request handler
                fieldType={requestFieldType}
                currentValue={currentFieldValue}
            />
        </Box>
    );
};

export default DriverProfile;
