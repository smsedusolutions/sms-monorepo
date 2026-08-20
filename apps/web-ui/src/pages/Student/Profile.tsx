import { useState } from 'react';
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
    CardContent,
    CircularProgress,
    Alert,
} from '@mui/material';
import {
    Person as PersonIcon,
    School as SchoolIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Badge as BadgeIcon,
    Class as ClassIcon,
    Edit as EditIcon,
} from '@mui/icons-material';
import RequestChangeDialog from '../../components/Dialogs/RequestChangeDialog';
import { useUserStore } from '../../stores/userStore';

const StudentProfile = () => {
    const [requestDialogOpen, setRequestDialogOpen] = useState(false);
    const [requestFieldType, setRequestFieldType] = useState<"email_change" | "phone_change" | "general">("general");
    const [currentFieldValue, setCurrentFieldValue] = useState("");

    // Get user and school data from Zustand store
    const { user: student, school, isLoading: studentLoading, error: studentError } = useUserStore();

    // Derivations for legacy compatibility and clear naming
    const schoolId = school?.schoolId || '';
    const studentId = student?.userId || '';

    // Use aggregated data directly from store (already populated by fetchProfile)
    const schoolName = student?.schoolName || school?.schoolName || schoolId;

    // Use className and sectionName directly from student data in store
    const className = student?.className || student?.class || '';
    const sectionName = student?.sectionName || student?.section || '';

    const displayClass = className && sectionName
        ? `${className} - ${sectionName}`
        : className || '-';

    // User details from store
    const userName = student?.firstName
        ? `${student.firstName} ${student.lastName || ''}`.trim()
        : student?.email?.split('@')[0] || 'User';
    const userEmail = student?.email || '';
    const userPhone = student?.phone || '';

    const openRequestDialog = (type: "email_change" | "phone_change" | "general", currentValue: string = "") => {
        setRequestFieldType(type);
        setCurrentFieldValue(currentValue);
        setRequestDialogOpen(true);
    };

    // Get initials for avatar
    const getInitials = () => {
        if (student?.firstName && student?.lastName) {
            return `${student.firstName[0]}${student.lastName[0]}`.toUpperCase();
        }
        return student?.firstName ? student.firstName[0].toUpperCase() : 'S';
    };

    if (studentLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (studentError) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Failed to load profile. Please try again later.</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: 'auto' }}>
            {/* Header Card with Avatar */}
            <Paper
                sx={{
                    p: 4,
                    mb: 3,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
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
                        src={student?.profileImage || undefined}
                        sx={{
                            width: 100,
                            height: 100,
                            fontSize: '2.5rem',
                            bgcolor: 'rgba(255,255,255,0.2)',
                            border: '3px solid rgba(255,255,255,0.5)'
                        }}
                    >
                        {!student?.profileImage && getInitials()}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
                            {userName}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                            <Chip
                                label="Student"
                                size="small"
                                sx={{
                                    bgcolor: 'rgba(255,255,255,0.2)',
                                    color: 'white',
                                    fontWeight: 600
                                }}
                            />
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                ID: {student?.studentId || studentId}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Paper>

            <Grid container spacing={3}>
                {/* Academic Information Card */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{ height: '100%', borderRadius: 2 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                <SchoolIcon color="primary" />
                                <Typography variant="h6" fontWeight={600}>Academic Information</Typography>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 2,
                                        bgcolor: 'primary.50',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <BadgeIcon color="primary" fontSize="small" />
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Student ID</Typography>
                                        <Typography variant="body1" fontWeight={500}>{student?.studentId || studentId}</Typography>
                                    </Box>
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 2,
                                        bgcolor: 'success.50',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <ClassIcon color="success" fontSize="small" />
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Class & Section</Typography>
                                        <Typography variant="body1" fontWeight={500}>{displayClass}</Typography>
                                    </Box>
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 2,
                                        bgcolor: 'info.50',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <SchoolIcon color="info" fontSize="small" />
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">School</Typography>
                                        <Typography variant="body1" fontWeight={500}>{schoolName}</Typography>
                                    </Box>
                                </Box>

                                {student?.rollNumber && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 2,
                                            bgcolor: 'warning.50',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <BadgeIcon color="warning" fontSize="small" />
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">Roll Number</Typography>
                                            <Typography variant="body1" fontWeight={500}>{student.rollNumber}</Typography>
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Contact Information Card */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{ height: '100%', borderRadius: 2 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                <PersonIcon color="primary" />
                                <Typography variant="h6" fontWeight={600}>Contact Information</Typography>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 2,
                                            bgcolor: 'warning.50',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <EmailIcon color="warning" fontSize="small" />
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">Email</Typography>
                                            <Typography variant="body1" fontWeight={500}>{userEmail || '-'}</Typography>
                                        </Box>
                                    </Box>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<EditIcon />}
                                        onClick={() => openRequestDialog("email_change", userEmail)}
                                    >
                                        Change
                                    </Button>
                                </Box>

                                <Divider />

                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 2,
                                            bgcolor: 'error.50',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <PhoneIcon color="error" fontSize="small" />
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">Phone</Typography>
                                            <Typography variant="body1" fontWeight={500}>{userPhone || 'Not provided'}</Typography>
                                        </Box>
                                    </Box>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<EditIcon />}
                                        onClick={() => openRequestDialog("phone_change", userPhone)}
                                    >
                                        {userPhone ? 'Change' : 'Add'}
                                    </Button>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Quick Actions Card */}
                <Grid size={{ xs: 12 }}>
                    <Card sx={{ borderRadius: 2 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Quick Actions</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Need to update your information? Submit a request to the school administration.
                            </Typography>
                            <Button
                                variant="contained"
                                onClick={() => openRequestDialog("general")}
                            >
                                Submit General Query
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <RequestChangeDialog
                open={requestDialogOpen}
                onClose={() => setRequestDialogOpen(false)}
                schoolId={schoolId}
                userId={studentId}
                userName={userName}
                userType="student"
                fieldType={requestFieldType}
                currentValue={currentFieldValue}
            />
        </Box>
    );
};

export default StudentProfile;
