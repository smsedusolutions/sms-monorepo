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

    const [filterTab, setFilterTab] = useState<'all' | 'upcoming' | 'completed'>('all');

    const isSessionPast = (s: any): boolean => {
        if (s.status === 'completed') return true;
        if (!s.date) return false;
        const now = new Date();
        const d = new Date(s.date);
        if (s.endTime && typeof s.endTime === 'string' && s.endTime.includes(':')) {
            const [eh, em] = s.endTime.split(':').map(Number);
            d.setHours(eh || 0, em || 0, 0, 0);
            if (s.startTime && typeof s.startTime === 'string' && s.startTime.includes(':')) {
                const [sh, sm] = s.startTime.split(':').map(Number);
                const startD = new Date(s.date);
                startD.setHours(sh || 0, sm || 0, 0, 0);
                if (d < startD) d.setDate(d.getDate() + 1);
            }
        } else {
            d.setHours(23, 59, 59, 999);
        }
        return now > d;
    };

    const getSessionBadge = (s: any, isBooked: boolean) => {
        const isPast = isSessionPast(s);
        if (s.status === 'cancelled') {
            return <Chip label="Cancelled" color="error" size="small" sx={{ fontWeight: 600 }} />;
        }
        if (isPast) {
            return (
                <Chip
                    label="Completed"
                    size="small"
                    sx={{
                        fontWeight: 600,
                        bgcolor: isBooked ? '#e2e8f0' : '#f1f5f9',
                        color: isBooked ? '#334155' : '#64748b',
                        border: isBooked ? '1px solid #cbd5e1' : undefined,
                    }}
                />
            );
        }
        if (s.status === 'ongoing') {
            return (
                <Chip
                    label={isBooked ? 'Ongoing (Booked)' : 'Ongoing'}
                    color="warning"
                    size="small"
                    sx={{ fontWeight: 600 }}
                />
            );
        }
        // Upcoming
        if (isBooked) {
            return <Chip label="Booked ✓" color="success" size="small" sx={{ fontWeight: 600 }} />;
        }
        return <Chip label="Scheduled" color="info" size="small" sx={{ fontWeight: 600 }} />;
    };

    const sessions: any[] = data?.data || [];
    const slots: any[] = slotsData?.data || [];

    const myBookings: string[] = (data?.myBookings || []);

    const upcomingCount = sessions.filter(s => !isSessionPast(s) && s.status !== 'cancelled').length;
    const completedCount = sessions.filter(s => isSessionPast(s) || s.status === 'completed').length;

    const displayedSessions = sessions.filter(s => {
        const isPast = isSessionPast(s);
        if (filterTab === 'upcoming') return !isPast && s.status !== 'cancelled';
        if (filterTab === 'completed') return isPast || s.status === 'completed';
        return true;
    });

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
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                            <Typography fontWeight={700}>Meeting Sessions</Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                    size="small"
                                    variant={filterTab === 'all' ? 'contained' : 'outlined'}
                                    onClick={() => setFilterTab('all')}
                                    sx={{ borderRadius: 2, textTransform: 'none', px: 1.5, py: 0.5 }}
                                >
                                    All ({sessions.length})
                                </Button>
                                <Button
                                    size="small"
                                    variant={filterTab === 'upcoming' ? 'contained' : 'outlined'}
                                    onClick={() => {
                                        setFilterTab('upcoming');
                                        if (selectedSession && isSessionPast(selectedSession)) setSelectedSession(null);
                                    }}
                                    sx={{ borderRadius: 2, textTransform: 'none', px: 1.5, py: 0.5 }}
                                >
                                    Upcoming ({upcomingCount})
                                </Button>
                                <Button
                                    size="small"
                                    variant={filterTab === 'completed' ? 'contained' : 'outlined'}
                                    onClick={() => {
                                        setFilterTab('completed');
                                        setSelectedSession(null);
                                    }}
                                    sx={{ borderRadius: 2, textTransform: 'none', px: 1.5, py: 0.5 }}
                                >
                                    Completed ({completedCount})
                                </Button>
                            </Box>
                        </Box>
                        {displayedSessions.length === 0 ? (
                            <Paper elevation={0} sx={{ p: 4, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
                                <Typography color="text.secondary">No {filterTab} meeting sessions found.</Typography>
                            </Paper>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {displayedSessions.map((s: any) => {
                                    const isBooked = myBookings.includes(s._id);
                                    const isPast = isSessionPast(s);
                                    const isSelected = selectedSession?._id === s._id;
                                    const myBooking = (s.bookings || []).find((b: any) => b.parentId === parentId);
                                    return (
                                        <Paper
                                            key={s._id}
                                            elevation={0}
                                            onClick={() => !isBooked && !isPast && setSelectedSession(isSelected ? null : s)}
                                            sx={{
                                                p: 2.5,
                                                borderRadius: 2,
                                                border: '2px solid',
                                                borderColor: isBooked && !isPast ? 'success.light' : isSelected ? 'primary.main' : 'divider',
                                                cursor: isBooked || isPast ? 'default' : 'pointer',
                                                bgcolor: isBooked && !isPast ? '#f0fdf4' : isSelected ? 'primary.50' : isPast ? '#f8fafc' : 'background.paper',
                                                opacity: isPast && !isBooked ? 0.75 : 1,
                                                transition: 'all 0.2s',
                                                '&:hover': !isBooked && !isPast ? { borderColor: 'primary.main', bgcolor: 'primary.50' } : {},
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <Typography fontWeight={700} sx={{ color: isPast && !isBooked ? 'text.secondary' : 'text.primary' }}>
                                                    {s.title}
                                                </Typography>
                                                {getSessionBadge(s, isBooked)}
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
                                            {isBooked && (
                                                <Typography variant="caption" sx={{ color: isPast ? '#64748b' : '#15803d', mt: 0.5, display: 'block', fontWeight: 600 }}>
                                                    ✓ {myBooking?.slotTime ? `Your Booked Slot: ${myBooking.slotTime}${myBooking.studentName ? ` (Student: ${myBooking.studentName})` : ''}` : 'Slot Booked'}
                                                </Typography>
                                            )}
                                            {isPast && !isBooked && (
                                                <Typography variant="caption" sx={{ color: '#94a3b8', mt: 0.5, display: 'block', fontStyle: 'italic' }}>
                                                    Session completed
                                                </Typography>
                                            )}
                                        </Paper>
                                    );
                                })}
                            </Box>
                        )}
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
