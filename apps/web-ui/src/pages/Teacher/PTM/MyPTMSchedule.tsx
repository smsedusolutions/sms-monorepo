import React from 'react';
import {
    Box, Typography, Paper, Chip, Alert, Skeleton, Divider, Avatar, Stack,
} from '@mui/material';
import {
    People as PTMIcon,
    AccessTime as ClockIcon,
    LocationOn as VenueIcon,
    CalendarToday as CalIcon,
    Person as PersonIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import useApi from '../../../queries/useApi';
import TokenService from '../../../queries/token/tokenService';

export const MyPTMSchedule: React.FC = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const teacherId = TokenService.getUserId() || '';

    const { data, isLoading, error } = useQuery({
        queryKey: ['teacher-ptm', schoolId, teacherId],
        queryFn: () => useApi<any>('GET', `/api/academics/school/${schoolId}/ptm/teacher/${teacherId}`),
        enabled: !!schoolId && !!teacherId,
    });

    const sessions: any[] = data?.data || [];

    const upcoming = sessions.filter(s => new Date(s.date) >= new Date());
    const past = sessions.filter(s => new Date(s.date) < new Date());

    const SessionCard = ({ session }: { session: any }) => {
        const isPast = new Date(session.date) < new Date();
        const bookings: any[] = session.bookings || [];
        return (
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '2px solid', borderColor: isPast ? 'divider' : 'primary.light', mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Typography fontWeight={700}>{session.title}</Typography>
                    <Chip label={isPast ? 'Completed' : session.status || 'Scheduled'} color={isPast ? 'default' : 'info'} size="small" />
                </Box>
                <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                            {new Date(session.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <ClockIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">{session.startTime} – {session.endTime} ({session.slotDurationMinutes} min/slot)</Typography>
                    </Box>
                    {session.venue && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <VenueIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">{session.venue}</Typography>
                        </Box>
                    )}
                </Box>
                {bookings.length > 0 && (
                    <>
                        <Divider sx={{ mb: 1.5 }} />
                        <Typography variant="caption" fontWeight={700} color="text.secondary">PARENT BOOKINGS ({bookings.length})</Typography>
                        <Stack spacing={1} sx={{ mt: 1 }}>
                            {bookings.map((b: any, i: number) => (
                                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, bgcolor: 'grey.50', borderRadius: 2 }}>
                                    <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: 'primary.light' }}>
                                        <PersonIcon sx={{ fontSize: 16 }} />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="body2" fontWeight={600}>{b.parentName || 'Parent'}</Typography>
                                        <Typography variant="caption" color="text.secondary">For: {b.studentName} • Slot: {b.slotTime}</Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Stack>
                    </>
                )}
                {bookings.length === 0 && !isPast && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>No bookings yet</Typography>
                )}
            </Paper>
        );
    };

    return (
        <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 900, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <PTMIcon sx={{ color: 'primary.main', fontSize: 32 }} />
                <Box>
                    <Typography variant="h5" fontWeight={800} sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>My PTM Schedule</Typography>
                    <Typography variant="body2" color="text.secondary">Parent-Teacher Meeting sessions assigned to you</Typography>
                </Box>
            </Box>

            {error ? (
                <Alert severity="error">Failed to load your PTM schedule.</Alert>
            ) : isLoading ? (
                <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
            ) : sessions.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <PTMIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.4 }} />
                    <Typography color="text.secondary">No PTM sessions assigned to you yet.</Typography>
                </Box>
            ) : (
                <>
                    {upcoming.length > 0 && (
                        <>
                            <Typography fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                📅 Upcoming Sessions ({upcoming.length})
                            </Typography>
                            {upcoming.map((s: any) => <SessionCard key={s._id} session={s} />)}
                        </>
                    )}
                    {past.length > 0 && (
                        <>
                            <Typography fontWeight={700} color="text.secondary" sx={{ mb: 2, mt: upcoming.length ? 3 : 0, display: 'flex', alignItems: 'center', gap: 1 }}>
                                🕒 Past Sessions ({past.length})
                            </Typography>
                            {past.map((s: any) => <SessionCard key={s._id} session={s} />)}
                        </>
                    )}
                </>
            )}
        </Box>
    );
};

export default MyPTMSchedule;
