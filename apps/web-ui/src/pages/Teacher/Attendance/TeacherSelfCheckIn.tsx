import { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Alert,
    CircularProgress,
    Card,
    CardContent,
    Chip,
    Snackbar,
} from '@mui/material';
import {
    Login as CheckInIcon,
    Logout as CheckOutIcon,
    LocationOn as LocationIcon,
    LocationOff as LocationOffIcon,
    Refresh as RefreshIcon,
    AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { useGetTeacherStatus, useTeacherCheckIn, useTeacherCheckOut } from '../../../queries/Attendance';
import { useGetSchoolById } from '../../../queries/School';
import TokenService from '../../../queries/token/tokenService';
import type { TeacherAttendance } from '../../../types';
import AppNoticeDialog, { AppNoticeDialogProps } from '../../../components/shared/AppNoticeDialog';
import { checkIsWithinWorkingHours } from '../../../utils/timeUtils';

interface LocationState {
    latitude: number | null;
    longitude: number | null;
    error: string | null;
    loading: boolean;
}

const TeacherSelfCheckIn = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const [location, setLocation] = useState<LocationState>({
        latitude: null,
        longitude: null,
        error: null,
        loading: true,
    });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    // Fetch school data for location settings
    const { data: schoolData } = useGetSchoolById(schoolId);
    const school = schoolData?.data;
    const schoolHasLocation = !!(school?.location?.latitude && school?.location?.longitude);

    // Fetch teacher's current attendance status
    const { data: statusData, isLoading: statusLoading, refetch: refetchStatus } = useGetTeacherStatus(schoolId);
    const attendanceStatus = statusData?.data as TeacherAttendance | { checkedIn: boolean } | undefined;
    
    const isPresent = attendanceStatus && 'status' in attendanceStatus && (attendanceStatus.status === 'present' || attendanceStatus.status === 'late' || attendanceStatus.status === 'half_day');
    const isAbsOrLeave = attendanceStatus && 'status' in attendanceStatus && (attendanceStatus.status === 'absent' || attendanceStatus.status === 'leave');
    const isCheckedIn = attendanceStatus && (('checkInTime' in attendanceStatus && !!attendanceStatus.checkInTime) || isPresent);
    const isCheckedOut = attendanceStatus && 'checkOutTime' in attendanceStatus && !!attendanceStatus.checkOutTime;
    const isMarkedByAdmin = attendanceStatus && 'markedByRole' in attendanceStatus && attendanceStatus.markedByRole === 'sch_admin';

    const checkInMutation = useTeacherCheckIn(schoolId);
    const checkOutMutation = useTeacherCheckOut(schoolId);

    // Retry counter for fallback to lower accuracy
    const [retryCount, setRetryCount] = useState(0);

    // Get current location
    const getCurrentLocation = useCallback(() => {
        setLocation(prev => ({ ...prev, loading: true, error: null }));

        if (!navigator.geolocation) {
            setLocation({
                latitude: null,
                longitude: null,
                error: 'Geolocation is not supported by your browser',
                loading: false,
            });
            return;
        }

        // Use lower accuracy after first timeout failure
        const useHighAccuracy = retryCount < 1;

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    error: null,
                    loading: false,
                });
                setRetryCount(0); // Reset on success
            },
            (error) => {
                let errorMessage = 'Could not get your location';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information is unavailable. Please try again.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out. Click Retry or check if GPS is enabled.';
                        break;
                }
                setLocation({
                    latitude: null,
                    longitude: null,
                    error: errorMessage,
                    loading: false,
                });
            },
            {
                enableHighAccuracy: useHighAccuracy,
                timeout: 30000, // Increased to 30 seconds
                maximumAge: 60000, // Allow cached position up to 1 minute old
            }
        );
    }, [retryCount]);

    // Retry handler that increments counter
    const handleRetry = useCallback(() => {
        setRetryCount(prev => prev + 1);
        getCurrentLocation();
    }, [getCurrentLocation]);

    // Get location on mount
    useEffect(() => {
        if (schoolHasLocation) {
            getCurrentLocation();
        } else {
            setLocation({ latitude: null, longitude: null, error: null, loading: false });
        }
    }, [schoolHasLocation, getCurrentLocation]);

    const [checkInError, setCheckInError] = useState<string | null>(null);

    const [noticeState, setNoticeState] = useState<AppNoticeDialogProps>({
        open: false,
        onClose: () => setNoticeState(prev => ({ ...prev, open: false })),
        title: '',
        message: '',
    });

    const validateWorkingHours = (): boolean => {
        const start = school?.attendanceSettings?.workingHours?.start || '08:00';
        const end = school?.attendanceSettings?.workingHours?.end || '16:00';
        const { isWithin, formattedRange } = checkIsWithinWorkingHours(start, end);

        if (!isWithin) {
            setNoticeState({
                open: true,
                onClose: () => setNoticeState(prev => ({ ...prev, open: false })),
                type: 'warning',
                title: 'Outside School Working Hours',
                message: 'Teacher check-in is only allowed during school working hours.',
                badgeText: `Working Hours: ${formattedRange}`,
                primaryActionLabel: 'Understood',
                onPrimaryAction: () => setNoticeState(prev => ({ ...prev, open: false })),
            });
            return false;
        }
        return true;
    };

    const handleCheckIn = async () => {
        if (!validateWorkingHours()) return;
        setCheckInError(null);
        try {
            await checkInMutation.mutateAsync({
                latitude: location.latitude || undefined,
                longitude: location.longitude || undefined,
            });
            refetchStatus();
            setSnackbar({ open: true, message: 'Checked in successfully!', severity: 'success' });
        } catch (error: unknown) {
            // Extract message from axios error response
            let message = 'Failed to check in';
            const err = error as {
                response?: { data?: { message?: string; data?: { distance?: number; allowedRadius?: number } } };
                message?: string;
            };
            if (err?.response?.data?.message) {
                message = err.response.data.message;
            } else if (err?.message) {
                message = err.message;
            }
            setCheckInError(message);
            setSnackbar({ open: true, message, severity: 'error' });
        }
    };

    const handleCheckOut = async () => {
        if (!validateWorkingHours()) return;
        try {
            await checkOutMutation.mutateAsync();
            refetchStatus();
            setSnackbar({ open: true, message: 'Checked out successfully!', severity: 'success' });
        } catch {
            setSnackbar({ open: true, message: 'Failed to check out', severity: 'error' });
        }
    };

    const formatTime = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (statusLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 600, mx: 'auto' }}>
            <Typography variant="h5" fontWeight={600} gutterBottom>
                My Attendance
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
                Mark your daily attendance by checking in and out.
            </Typography>

            {/* Admin Update Message */}
            {isMarkedByAdmin && (
                <Alert severity="warning" icon={<AdminIcon />} sx={{ mb: 3 }}>
                    <Typography variant="body2" fontWeight={600}>
                        Admin updated your attendance
                    </Typography>
                    <Typography variant="caption">
                        Your attendance for today was marked by the school administrator.
                    </Typography>
                </Alert>
            )}

            {/* Location Status */}
            {schoolHasLocation && !isCheckedIn && (
                <Paper sx={{ p: 2, mb: 3, bgcolor: location.error ? 'error.50' : 'success.50' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {location.loading ? (
                            <>
                                <CircularProgress size={20} />
                                <Typography variant="body2">Getting your location...</Typography>
                            </>
                        ) : location.error ? (
                            <>
                                <LocationOffIcon color="error" />
                                <Typography variant="body2" color="error.main" sx={{ flex: 1 }}>
                                    {location.error}
                                </Typography>
                                <Button size="small" startIcon={<RefreshIcon />} onClick={handleRetry}>
                                    Retry
                                </Button>
                            </>
                        ) : (
                            <>
                                <LocationIcon color="success" />
                                <Typography variant="body2" color="success.main">
                                    Location available - Ready to check in
                                </Typography>
                            </>
                        )}
                    </Box>
                </Paper>
            )}

            {!schoolHasLocation && !isCheckedIn && (
                <Alert severity="info" sx={{ mb: 3 }}>
                    Location verification is not configured for your school. You can check in without location.
                </Alert>
            )}

            {/* Today's Status Card */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Today's Status
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        {formatDate(new Date().toISOString())}
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body1">Check-In Time:</Typography>
                            {isCheckedIn ? (
                                <Chip
                                    label={formatTime((attendanceStatus as TeacherAttendance)?.checkInTime || (attendanceStatus as TeacherAttendance)?.updatedAt)}
                                    color="success"
                                    size="small"
                                />
                            ) : (
                                <Chip label="Not Checked In" color="default" size="small" />
                            )}
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body1">Check-Out Time:</Typography>
                            {isCheckedOut ? (
                                <Chip
                                    label={formatTime((attendanceStatus as TeacherAttendance)?.checkOutTime)}
                                    color="primary"
                                    size="small"
                                />
                            ) : (
                                <Chip label="Not Checked Out" color="default" size="small" />
                            )}
                        </Box>

                        {(isCheckedIn || isAbsOrLeave) && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body1">Status:</Typography>
                                <Chip
                                    label={(attendanceStatus as TeacherAttendance)?.status?.toUpperCase() || 'PRESENT'}
                                    color={isAbsOrLeave ? 'error' : (isCheckedOut ? 'success' : 'info')}
                                    size="small"
                                />
                            </Box>
                        )}
                    </Box>
                </CardContent>
            </Card>

            {/* Check-in Error */}
            {checkInError && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setCheckInError(null)}>
                    {checkInError}
                </Alert>
            )}

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {(!isCheckedIn && !isAbsOrLeave) ? (
                    <Button
                        variant="contained"
                        color="success"
                        size="large"
                        startIcon={checkInMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <CheckInIcon />}
                        onClick={handleCheckIn}
                        disabled={checkInMutation.isPending || (schoolHasLocation && (location.loading || !!location.error))}
                        fullWidth
                        sx={{ py: 2 }}
                    >
                        {checkInMutation.isPending ? 'Checking In...' : 'Check In'}
                    </Button>
                ) : (!isCheckedOut && isPresent && !isMarkedByAdmin) ? (
                    <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        startIcon={checkOutMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <CheckOutIcon />}
                        onClick={handleCheckOut}
                        disabled={checkOutMutation.isPending}
                        fullWidth
                        sx={{ py: 2 }}
                    >
                        {checkOutMutation.isPending ? 'Checking Out...' : 'Check Out'}
                    </Button>
                ) : (
                    <Alert severity={isAbsOrLeave ? 'info' : 'success'} icon={false} sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h6">
                            {isAbsOrLeave ? '✓ Attendance Marked' : '✓ Attendance Complete for Today'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {isMarkedByAdmin 
                                ? `Your status was set to ${((attendanceStatus as TeacherAttendance)?.status || 'present').toUpperCase()} by admin.`
                                : (isCheckedOut 
                                    ? 'You have checked in and checked out successfully.'
                                    : `You are currently marked as ${((attendanceStatus as TeacherAttendance)?.status || 'present').toUpperCase()}.`
                                )
                            }
                        </Typography>
                    </Alert>
                )}
            </Box>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity} variant="filled">
                    {snackbar.message}
                </Alert>
            </Snackbar>

            <AppNoticeDialog {...noticeState} />
        </Box>
    );
};

export default TeacherSelfCheckIn;
