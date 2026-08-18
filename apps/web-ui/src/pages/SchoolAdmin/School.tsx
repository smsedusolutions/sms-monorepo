import {
    Box,
    Typography,
    Paper,
    Grid,
    CircularProgress,
    Alert,
    Chip,
    Avatar,
    Card,
    CardContent,
    Divider
} from '@mui/material';
import {
    School as SchoolIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Language as WebsiteIcon,
    LocationOn as LocationIcon,
    Settings as SettingsIcon,
    AccessTime as TimeIcon
} from '@mui/icons-material';
import { useUserStore } from '../../stores/userStore';
import { formatWorkingHoursRange } from '../../utils/timeUtils';

const SchoolPage = () => {
    // Get user and school data from Zustand store
    const { school, isLoading, error } = useUserStore();

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
                <Alert severity="error">Failed to load school details.</Alert>
            </Box>
        );
    }

    if (!school) {
        return (
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
                <Alert severity="info">No school information found.</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: 'auto' }}>
            {/* Header Card with School Logo */}
            <Paper
                sx={{
                    p: 4,
                    mb: 4,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Background decorative circles */}
                <Box sx={{
                    position: 'absolute',
                    top: -50,
                    right: -50,
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)'
                }} />
                <Box sx={{
                    position: 'absolute',
                    bottom: -30,
                    left: -30,
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.05)'
                }} />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
                    <Avatar
                        src={school.schoolLogo || undefined}
                        variant="circular"
                        sx={{
                            width: 100,
                            height: 100,
                            bgcolor: 'transparent',
                            border: '3px solid rgba(255,255,255,0.3)',
                            '& img': {
                                objectFit: 'cover'
                            }
                        }}
                    >
                        {!school.schoolLogo && <SchoolIcon sx={{ fontSize: 50, color: '#4f46e5' }} />}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
                            {school.schoolName}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                            <Chip
                                label={school.status === 'active' ? 'Active' : 'Inactive'}
                                size="small"
                                sx={{
                                    bgcolor: 'rgba(255,255,255,0.2)',
                                    color: 'white',
                                    fontWeight: 600
                                }}
                            />
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                ID: {school.schoolId}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Paper>

            <Grid container spacing={3}>
                {/* General Information */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{ height: '100%', borderRadius: 2 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                <SchoolIcon color="primary" />
                                <Typography variant="h6" fontWeight={600}>General Information</Typography>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                <InfoRow
                                    icon={<EmailIcon fontSize="small" color="primary" />}
                                    bgColor="primary.50"
                                    label="Official Email"
                                    value={school.schoolEmail}
                                />
                                <InfoRow
                                    icon={<PhoneIcon fontSize="small" color="success" />}
                                    bgColor="success.50"
                                    label="Contact Number"
                                    value={school.schoolContact}
                                />
                                <InfoRow
                                    icon={<WebsiteIcon fontSize="small" color="info" />}
                                    bgColor="info.50"
                                    label="Official Website"
                                    value={school.schoolWebsite}
                                />
                                <InfoRow
                                    icon={<LocationIcon fontSize="small" color="error" />}
                                    bgColor="error.50"
                                    label="Address"
                                    value={school.schoolAddress}
                                />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Attendance Settings */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{ height: '100%', borderRadius: 2 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                <SettingsIcon color="primary" />
                                <Typography variant="h6" fontWeight={600}>Attendance Setup</Typography>
                            </Box>

                            {school.attendanceSettings ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <Box sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 2,
                                            bgcolor: 'warning.50',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            <TimeIcon color="warning" fontSize="small" />
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">Working Hours</Typography>
                                            <Typography variant="body1" fontWeight={500}>
                                                {formatWorkingHoursRange(school.attendanceSettings.workingHours?.start, school.attendanceSettings.workingHours?.end)}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Divider />

                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 6 }}>
                                            <Typography variant="caption" color="text.secondary">Attendance Mode</Typography>
                                            <Typography variant="body1" fontWeight={500} sx={{ textTransform: 'capitalize' }}>
                                                {school.attendanceSettings.mode || 'N/A'}
                                            </Typography>
                                        </Grid>
                                        <Grid size={{ xs: 6 }}>
                                            <Typography variant="caption" color="text.secondary">Periods Per Day</Typography>
                                            <Typography variant="body1" fontWeight={500}>
                                                {school.attendanceSettings.periodsPerDay || 'N/A'}
                                            </Typography>
                                        </Grid>
                                        <Grid size={{ xs: 6 }}>
                                            <Typography variant="caption" color="text.secondary">Late Threshold</Typography>
                                            <Typography variant="body1" fontWeight={500}>
                                                {school.attendanceSettings.lateThresholdMinutes ? `${school.attendanceSettings.lateThresholdMinutes} mins` : 'N/A'}
                                            </Typography>
                                        </Grid>
                                        <Grid size={{ xs: 6 }}>
                                            <Typography variant="caption" color="text.secondary">Half Day Threshold</Typography>
                                            <Typography variant="body1" fontWeight={500}>
                                                {school.attendanceSettings.halfDayThresholdMinutes ? `${school.attendanceSettings.halfDayThresholdMinutes} mins` : 'N/A'}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Box>
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <Typography color="text.secondary">Attendance settings not configured.</Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Location Map Placeholder / Info */}
                {school.location && (
                    <Grid size={{ xs: 12 }}>
                        <Card sx={{ borderRadius: 2 }}>
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                    <LocationIcon color="primary" />
                                    <Typography variant="h6" fontWeight={600}>Campus Location</Typography>
                                </Box>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <Typography variant="caption" color="text.secondary">Latitude</Typography>
                                        <Typography variant="body1" fontWeight={500}>{school.location.latitude}</Typography>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <Typography variant="caption" color="text.secondary">Longitude</Typography>
                                        <Typography variant="body1" fontWeight={500}>{school.location.longitude}</Typography>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <Typography variant="caption" color="text.secondary">Geofence Radius</Typography>
                                        <Typography variant="body1" fontWeight={500}>{school.location.radiusMeters} Meters</Typography>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};

interface InfoRowProps {
    icon: React.ReactNode;
    bgColor: string;
    label: string;
    value: string | undefined;
}

const InfoRow = ({ icon, bgColor, label, value }: InfoRowProps) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
        }}>
            {icon}
        </Box>
        <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
            <Typography variant="body1" fontWeight={500} noWrap sx={{ textOverflow: 'ellipsis' }}>
                {value || '-'}
            </Typography>
        </Box>
    </Box>
);

export default SchoolPage;
