import React, { useState } from 'react';
import {
    Box, Typography, Paper, Grid, Button, Chip, Alert, Skeleton,
    CircularProgress, Snackbar, Divider,
} from '@mui/material';
import {
    People as PTMIcon,
    AccessTime as ClockIcon,
    CheckCircle as DoneIcon,
    LocationOn as VenueIcon,
    CalendarToday as CalIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useApi from '../../../queries/useApi';
import TokenService from '../../../queries/token/tokenService';

const PTMBooking: React.FC = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const parentId = TokenService.getUserId() || '';
    const queryClient = useQueryClient();
    const [selectedSession, setSelectedSession] = useState<any>(null);
    const [selectedSlot, setSelectedSlot] = useState('');
    const [toast, setToast] = useState('');

    const { data, isLoading, error } = useQuery<any>({
        queryKey: ['ptm-parent', schoolId, parentId],
        queryFn: () => useApi<any>('GET', `/api/academics/school/${schoolId}/ptm/parent/${parentId}`),
        enabled: !!schoolId && !!parentId,
    });

    const { data: slotsData, isLoading: loadingSlots } = useQuery<any>({
        queryKey: ['ptm-slots', schoolId, selectedSession?._id],
        queryFn: () => useApi<any>('GET', `/api/academics/school/${schoolId}/ptm/${selectedSession._id}/slots`),
        enabled: !!selectedSession,
    });

    const bookSlot = useMutation({
        mutationFn: () => useApi<any>('POST', `/api/academics/school/${schoolId}/ptm/${selectedSession._id}/book`, { parentId, slotTime: selectedSlot }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ptm-parent'] });
            queryClient.invalidateQueries({ queryKey: ['ptm-slots'] });
            setToast('Your PTM slot is confirmed!');
            setSelectedSlot('');
        },
    });

    const sessions: any[] = data?.data || [];
    const slots: any[] = slotsData?.data || [];

    const myBookings: string[] = (data?.myBookings || []);

    return (
        <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 900, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <PTMIcon sx={{ color: 'primary.main', fontSize: 32 }} />
                <Box>
                    <Typography variant="h5" fontWeight={800} sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>Parent-Teacher Meeting</Typography>
                    <Typography variant="body2" color="text.secondary">Book your slot to meet the teacher</Typography>
                </Box>
            </Box>

            {error ? (
                <Alert severity="error">Failed to load PTM sessions. Please try again.</Alert>
            ) : isLoading ? (
                <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
            ) : sessions.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <PTMIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.4 }} />
                    <Typography color="text.secondary">No PTM sessions available at the moment.</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Check back later for upcoming sessions.</Typography>
                </Box>
            ) : (
                <Grid container spacing={2.5}>
                    {/* Session List */}
                    <Grid size={{ xs: 12, md: selectedSession ? 5 : 12 }}>
                        <Typography fontWeight={700} sx={{ mb: 2 }}>Available Sessions</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {sessions.map((s: any) => {
                                const isBooked = myBookings.includes(s._id);
                                const isSelected = selectedSession?._id === s._id;
                                return (
                                    <Paper
                                        key={s._id}
                                        elevation={0}
                                        onClick={() => !isBooked && setSelectedSession(isSelected ? null : s)}
                                        sx={{
                                            p: 2.5,
                                            borderRadius: 2,
                                            border: '2px solid',
                                            borderColor: isBooked ? 'success.light' : isSelected ? 'primary.main' : 'divider',
                                            cursor: isBooked ? 'default' : 'pointer',
                                            bgcolor: isBooked ? '#f0fdf4' : isSelected ? 'primary.50' : 'background.paper',
                                            transition: 'all 0.2s',
                                            '&:hover': !isBooked ? { borderColor: 'primary.main', bgcolor: 'primary.50' } : {},
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <Typography fontWeight={700}>{s.title}</Typography>
                                            {isBooked ? (
                                                <Chip label="Booked ✓" color="success" size="small" />
                                            ) : (
                                                <Chip label={s.status || 'Open'} color="info" size="small" />
                                            )}
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 2, mt: 1.5, flexWrap: 'wrap' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <CalIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    {new Date(s.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <ClockIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                                                <Typography variant="body2" color="text.secondary">{s.startTime} – {s.endTime}</Typography>
                                            </Box>
                                            {s.venue && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <VenueIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                                                    <Typography variant="body2" color="text.secondary">{s.venue}</Typography>
                                                </Box>
                                            )}
                                        </Box>
                                        {s.teacherName && (
                                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                                Teacher: {s.teacherName}
                                            </Typography>
                                        )}
                                    </Paper>
                                );
                            })}
                        </Box>
                    </Grid>

                    {/* Slot Picker */}
                    {selectedSession && (
                        <Grid size={{ xs: 12, md: 7 }}>
                            <Typography fontWeight={700} sx={{ mb: 2 }}>
                                Available Slots — {new Date(selectedSession.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </Typography>
                            {loadingSlots ? (
                                <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
                            ) : slots.length === 0 ? (
                                <Alert severity="info">No slots available for this session.</Alert>
                            ) : (
                                <>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                                        {slots.map((slot: any) => {
                                            const isTaken = slot.isBooked;
                                            const isMe = slot.bookedByParentId === parentId;
                                            const isSelected = selectedSlot === slot.time;
                                            return (
                                                <Button
                                                    key={slot.time}
                                                    variant={isSelected ? 'contained' : 'outlined'}
                                                    size="small"
                                                    disabled={isTaken && !isMe}
                                                    color={isMe ? 'success' : isSelected ? 'primary' : 'inherit'}
                                                    onClick={() => !isTaken && setSelectedSlot(isSelected ? '' : slot.time)}
                                                    sx={{
                                                        borderRadius: 2,
                                                        minWidth: 80,
                                                        fontWeight: 600,
                                                        opacity: isTaken && !isMe ? 0.4 : 1,
                                                    }}
                                                >
                                                    {slot.time}
                                                    {isMe && ' ✓'}
                                                </Button>
                                            );
                                        })}
                                    </Box>
                                    <Divider sx={{ mb: 2 }} />
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                                        {selectedSlot && (
                                            <Typography variant="body2" color="text.secondary">
                                                Selected: <strong>{selectedSlot}</strong>
                                            </Typography>
                                        )}
                                        <Button
                                            variant="contained"
                                            disabled={!selectedSlot || bookSlot.isPending}
                                            onClick={() => bookSlot.mutate()}
                                            startIcon={bookSlot.isPending ? <CircularProgress size={14} /> : <DoneIcon />}
                                        >
                                            {bookSlot.isPending ? 'Booking...' : 'Confirm Booking'}
                                        </Button>
                                    </Box>
                                </>
                            )}
                        </Grid>
                    )}
                </Grid>
            )}

            <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast('')} message={toast} />
        </Box>
    );
};

export default PTMBooking;
