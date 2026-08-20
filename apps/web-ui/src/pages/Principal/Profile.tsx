
import {
    Box,
    Typography,
    Paper,
    Grid,
    Button,
    Avatar,
    Card,
    CardContent,
    Divider,
    CircularProgress,
    Alert,
    Chip,
} from '@mui/material';
import {
    Person as PersonIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Badge as BadgeIcon,
    AdminPanelSettings as AdminIcon,
    School as SchoolIcon,
    Edit as EditIcon,
} from '@mui/icons-material';
import { useUserStore } from '../../stores/userStore';
import TokenService from '../../queries/token/tokenService';

const PrincipalProfile = () => {

    const {
        user: principal,
        school,
        isLoading,
        error,
    } = useUserStore();

    const userId = principal?.userId || principal?.principalId || TokenService.getUserId() || '';
    const schoolId = school?.schoolId || TokenService.getSchoolId() || '';

    const schoolName = principal?.schoolName || school?.schoolName || schoolId;

    const userName = principal?.firstName
        ? `${principal.firstName} ${principal.lastName || ''}`.trim()
        : principal?.email?.split('@')[0] || 'Principal';

    const userEmail = principal?.email || '';
    const userPhone = principal?.phone || '';

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
                <Alert severity="error">Failed to load profile. Please refresh the page.</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h5" fontWeight={600} gutterBottom>
                My Profile
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Your account information and school details.
            </Typography>

            <Grid container spacing={3}>
                {/* Profile Card */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
                        {/* Gradient Header */}
                        <Box
                            sx={{
                                background: 'linear-gradient(135deg, #1e3a5f 0%, #2d1b69 100%)',
                                p: 4,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 2,
                            }}
                        >
                            <Avatar
                                src={principal?.profileImage}
                                sx={{
                                    width: 96,
                                    height: 96,
                                    fontSize: '2rem',
                                    fontWeight: 700,
                                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                    border: '4px solid rgba(255,255,255,0.2)',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                                }}
                            >
                                {getInitials()}
                            </Avatar>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '1.1rem' }}>
                                    {userName}
                                </Typography>
                                <Chip
                                    label="Principal"
                                    size="small"
                                    sx={{
                                        mt: 0.8,
                                        bgcolor: 'rgba(59,130,246,0.25)',
                                        color: '#93c5fd',
                                        border: '1px solid rgba(59,130,246,0.4)',
                                        fontWeight: 600,
                                        fontSize: '0.75rem',
                                    }}
                                />
                            </Box>
                        </Box>

                        <CardContent>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {[
                                    { icon: <BadgeIcon sx={{ fontSize: 18, color: '#3b82f6' }} />, label: 'ID', value: userId || '—' },
                                    { icon: <EmailIcon sx={{ fontSize: 18, color: '#3b82f6' }} />, label: 'Email', value: userEmail || '—' },
                                    { icon: <PhoneIcon sx={{ fontSize: 18, color: '#3b82f6' }} />, label: 'Phone', value: userPhone || '—' },
                                    { icon: <SchoolIcon sx={{ fontSize: 18, color: '#3b82f6' }} />, label: 'School', value: schoolName || '—' },
                                    { icon: <AdminIcon sx={{ fontSize: 18, color: '#3b82f6' }} />, label: 'Role', value: 'Principal' },
                                ].map((item) => (
                                    <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Box
                                            sx={{
                                                width: 34,
                                                height: 34,
                                                borderRadius: '10px',
                                                bgcolor: '#eff6ff',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}
                                        >
                                            {item.icon}
                                        </Box>
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                {item.label}
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                fontWeight={600}
                                                noWrap
                                                title={item.value}
                                            >
                                                {item.value}
                                            </Typography>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Details Panel */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h6" fontWeight={700}>
                                Account Information
                            </Typography>
                            <Button
                                variant="outlined"
                                startIcon={<EditIcon />}
                                size="small"
                                disabled
                                title="Contact School Admin to update your profile"
                            >
                                Edit Profile
                            </Button>
                        </Box>

                        <Divider sx={{ mb: 3 }} />

                        <Grid container spacing={3}>
                            {[
                                { label: 'First Name', value: principal?.firstName || '—', icon: <PersonIcon /> },
                                { label: 'Last Name', value: principal?.lastName || '—', icon: <PersonIcon /> },
                                { label: 'Email Address', value: userEmail || '—', icon: <EmailIcon /> },
                                { label: 'Phone Number', value: userPhone || '—', icon: <PhoneIcon /> },
                                { label: 'Principal ID', value: userId || '—', icon: <BadgeIcon /> },
                                { label: 'School ID', value: schoolId || '—', icon: <SchoolIcon /> },
                            ].map((item) => (
                                <Grid size={{ xs: 12, sm: 6 }} key={item.label}>
                                    <Box>
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            fontWeight={600}
                                            textTransform="uppercase"
                                            letterSpacing={0.5}
                                        >
                                            {item.label}
                                        </Typography>
                                        <Typography
                                            variant="body1"
                                            fontWeight={500}
                                            sx={{ mt: 0.5, wordBreak: 'break-word' }}
                                        >
                                            {item.value}
                                        </Typography>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>

                        <Divider sx={{ my: 3 }} />

                        {/* School Info */}
                        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                            School Information
                        </Typography>
                        <Grid container spacing={3}>
                            {[
                                { label: 'School Name', value: school?.schoolName || '—' },
                                { label: 'School ID', value: schoolId || '—' },
                                { label: 'School Address', value: school?.schoolAddress || '—' },
                            ].map((item) => (
                                <Grid size={{ xs: 12, sm: 6 }} key={item.label}>
                                    <Box>
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            fontWeight={600}
                                            textTransform="uppercase"
                                            letterSpacing={0.5}
                                        >
                                            {item.label}
                                        </Typography>
                                        <Typography variant="body1" fontWeight={500} sx={{ mt: 0.5 }}>
                                            {item.value}
                                        </Typography>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>

                        <Alert severity="info" sx={{ mt: 3 }} variant="outlined">
                            To update your profile information (name, email, phone), please contact the School Admin.
                        </Alert>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default PrincipalProfile;
