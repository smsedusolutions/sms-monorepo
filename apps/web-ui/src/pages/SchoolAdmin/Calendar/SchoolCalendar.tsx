import React, { useState } from 'react';
import {
    Box, Typography, Paper, Grid, Dialog, DialogTitle, DialogContent,
    DialogActions, Chip, IconButton, Skeleton, CircularProgress,
} from '@mui/material';
import {
    ChevronLeft, ChevronRight, Add as AddIcon, Event as EventIcon,
    SportsFootball as SportsIcon,
    FestivalOutlined as HolidayIcon, Assignment as ExamIcon,
    People as PTMIcon, Close as CloseIcon, Delete as DeleteIcon,
} from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import useApi from '../../../queries/useApi';
import TokenService from '../../../queries/token/tokenService';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { AppInput } from '../../../components/shared/AppInput';
import { AppSelect } from '../../../components/shared/AppSelect';
import { AppDatePicker } from '../../../components/shared/AppDatePicker';
import { AppButton } from '../../../components/shared/AppButton';

const EVENT_TYPES = [
    { value: 'event', label: 'Event', color: '#3b82f6', icon: <EventIcon fontSize="small" /> },
    { value: 'holiday', label: 'Holiday', color: '#22c55e', icon: <HolidayIcon fontSize="small" /> },
    { value: 'exam', label: 'Exam', color: '#ef4444', icon: <ExamIcon fontSize="small" /> },
    { value: 'ptm', label: 'PTM', color: '#a855f7', icon: <PTMIcon fontSize="small" /> },
    { value: 'sports', label: 'Sports', color: '#f59e0b', icon: <SportsIcon fontSize="small" /> },
];

const typeConfig = (type: string) => EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[0];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const SchoolCalendar: React.FC = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const role = TokenService.getRole() || '';
    const isMobile = useIsMobile();
    const queryClient = useQueryClient();
    const isAdmin = ['sch_admin', 'principal'].includes(role);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [form, setForm] = useState({
        title: '',
        description: '',
        eventType: 'event',
        startDate: new Date(),
        endDate: new Date(),
    });

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const from = format(monthStart, 'yyyy-MM-dd');
    const to = format(monthEnd, 'yyyy-MM-dd');

    const { data, isLoading } = useQuery({
        queryKey: ['school-calendar', schoolId, from, to],
        queryFn: () => useApi<any>('GET', `/api/academics/school/${schoolId}/calendar`, undefined, { from, to }),
        enabled: !!schoolId,
    });

    const createEvent = useMutation({
        mutationFn: (body: any) => useApi<any>('POST', `/api/academics/school/${schoolId}/calendar`, {
            ...body,
            startDate: format(body.startDate, 'yyyy-MM-dd'),
            endDate: format(body.endDate, 'yyyy-MM-dd'),
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['school-calendar'] });
            setCreateOpen(false);
            setForm({ title: '', description: '', eventType: 'event', startDate: new Date(), endDate: new Date() });
        },
    });

    const deleteEvent = useMutation({
        mutationFn: (eventId: string) => useApi<any>('DELETE', `/api/academics/school/${schoolId}/calendar/${eventId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['school-calendar'] });
        },
    });

    const events: any[] = data?.data || [];

    const getEventsForDay = (day: Date) => {
        const dayStr = format(day, 'yyyy-MM-dd');
        return events.filter(e => {
            if (!e.startDate) return false;
            const startStr = typeof e.startDate === 'string' && e.startDate.length >= 10
                ? e.startDate.slice(0, 10)
                : format(new Date(e.startDate), 'yyyy-MM-dd');
            const endStr = e.endDate
                ? (typeof e.endDate === 'string' && e.endDate.length >= 10
                    ? e.endDate.slice(0, 10)
                    : format(new Date(e.endDate), 'yyyy-MM-dd'))
                : startStr;
            return dayStr >= startStr && dayStr <= endStr;
        });
    };

    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDayOfWeek = getDay(monthStart);
    const blanks = Array(startDayOfWeek).fill(null);

    const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : [];

    const openAddEventForDay = (day: Date) => {
        setForm({
            title: '',
            description: '',
            eventType: 'event',
            startDate: day,
            endDate: day,
        });
        setCreateOpen(true);
    };

    return (
        <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
                <Box>
                    <Typography variant="h5" fontWeight={800} sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
                        📅 School Calendar
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Events, holidays, exams and parent-teacher meetings</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                    {EVENT_TYPES.map(t => (
                        <Chip
                            key={t.value}
                            label={t.label}
                            size="small"
                            icon={t.icon as any}
                            sx={{ bgcolor: t.color + '18', color: t.color, fontWeight: 600, '& .MuiChip-icon': { color: t.color } }}
                        />
                    ))}
                    {isAdmin && (
                        <AppButton
                            variant="contained"
                            startIcon={<AddIcon />}
                            size="small"
                            onClick={() => openAddEventForDay(selectedDay || new Date())}
                            sx={{ ml: 1 }}
                        >
                            Add Event
                        </AppButton>
                    )}
                </Box>
            </Box>

            {/* Month Navigation */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <IconButton onClick={() => setCurrentDate(d => subMonths(d, 1))} size={isMobile ? 'small' : 'medium'}>
                    <ChevronLeft />
                </IconButton>
                <Typography fontWeight={700} sx={{ flex: 1, textAlign: 'center', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    {format(currentDate, 'MMMM yyyy')}
                </Typography>
                <IconButton onClick={() => setCurrentDate(d => addMonths(d, 1))} size={isMobile ? 'small' : 'medium'}>
                    <ChevronRight />
                </IconButton>
                <AppButton variant="outlined" size="small" onClick={() => setCurrentDate(new Date())}>
                    Today
                </AppButton>
            </Box>

            <Grid container spacing={2.5}>
                {/* Calendar Grid */}
                <Grid size={{ xs: 12, md: selectedDay ? 8 : 12 }}>
                    <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                        {/* Day headers */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', bgcolor: 'grey.50' }}>
                            {DAYS.map(d => (
                                <Box key={d} sx={{ py: 1, textAlign: 'center', borderRight: '1px solid', borderBottom: '1px solid', borderColor: 'divider' }}>
                                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                                        {isMobile ? d[0] : d}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>

                        {/* Date cells */}
                        {isLoading ? (
                            <Box sx={{ p: 2 }}><Skeleton variant="rectangular" height={300} /></Box>
                        ) : (
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
                                {blanks.map((_, i) => (
                                    <Box
                                        key={`blank-${i}`}
                                        sx={{
                                            minHeight: { xs: 52, sm: 84 },
                                            borderRight: '1px solid',
                                            borderBottom: '1px solid',
                                            borderColor: 'divider',
                                            bgcolor: 'grey.50',
                                        }}
                                    />
                                ))}
                                {daysInMonth.map((day, idx) => {
                                    const dayEvents = getEventsForDay(day);
                                    const isSelected = selectedDay && isSameDay(day, selectedDay);
                                    const _isToday = isToday(day);
                                    return (
                                        <Box
                                            key={idx}
                                            onClick={() => setSelectedDay(selectedDay && isSameDay(day, selectedDay) ? null : day)}
                                            sx={{
                                                minHeight: { xs: 52, sm: 84 },
                                                p: { xs: 0.5, sm: 0.75 },
                                                borderRight: '1px solid',
                                                borderBottom: '1px solid',
                                                borderColor: 'divider',
                                                cursor: 'pointer',
                                                bgcolor: isSelected ? 'primary.50' : _isToday ? '#fef9c3' : 'transparent',
                                                '&:hover': { bgcolor: isSelected ? 'primary.50' : 'action.hover' },
                                                transition: 'background 0.15s',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                overflow: 'hidden',
                                                minWidth: 0,
                                                maxWidth: '100%',
                                                boxSizing: 'border-box',
                                            }}
                                        >
                                            <Typography
                                                sx={{
                                                    fontSize: { xs: '0.75rem', sm: '0.85rem' },
                                                    fontWeight: _isToday ? 800 : 500,
                                                    width: { xs: 20, sm: 24 },
                                                    height: { xs: 20, sm: 24 },
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    bgcolor: _isToday ? 'primary.main' : 'transparent',
                                                    color: _isToday ? 'white' : isSelected ? 'primary.main' : 'text.primary',
                                                }}
                                            >
                                                {format(day, 'd')}
                                            </Typography>
                                            {!isMobile && dayEvents.length > 0 && (
                                                <>
                                                    {/* First event pill */}
                                                    {(() => {
                                                        const firstEv = dayEvents[0];
                                                        const tc = typeConfig(firstEv.eventType);
                                                        return (
                                                            <Box
                                                                sx={{
                                                                    bgcolor: tc.color + '18',
                                                                    borderLeft: `3px solid ${tc.color}`,
                                                                    borderRadius: '4px',
                                                                    px: 0.6,
                                                                    py: 0.2,
                                                                    mt: 0.4,
                                                                    overflow: 'hidden',
                                                                    width: '100%',
                                                                    maxWidth: '100%',
                                                                    boxSizing: 'border-box',
                                                                }}
                                                            >
                                                                <Typography
                                                                    sx={{
                                                                        fontSize: '0.66rem',
                                                                        fontWeight: 600,
                                                                        color: tc.color,
                                                                        whiteSpace: 'nowrap',
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                        display: 'block',
                                                                        maxWidth: '100%',
                                                                        lineHeight: 1.2,
                                                                    }}
                                                                >
                                                                    {firstEv.title}
                                                                </Typography>
                                                            </Box>
                                                        );
                                                    })()}

                                                    {/* Remaining count button */}
                                                    {dayEvents.length > 1 && (
                                                        <Box
                                                            sx={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                bgcolor: 'action.hover',
                                                                borderRadius: '4px',
                                                                px: 0.5,
                                                                py: 0.15,
                                                                mt: 0.4,
                                                                alignSelf: 'flex-start',
                                                                border: '1px solid',
                                                                borderColor: 'divider',
                                                                maxWidth: '100%',
                                                                boxSizing: 'border-box',
                                                                '&:hover': {
                                                                    bgcolor: 'primary.50',
                                                                    borderColor: 'primary.light',
                                                                },
                                                            }}
                                                        >
                                                            <Typography
                                                                sx={{
                                                                    fontSize: '0.62rem',
                                                                    fontWeight: 700,
                                                                    color: 'text.secondary',
                                                                    whiteSpace: 'nowrap',
                                                                }}
                                                            >
                                                                +{dayEvents.length - 1} more
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </>
                                            )}
                                            {isMobile && dayEvents.length > 0 && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: typeConfig(dayEvents[0].eventType).color }} />
                                                    {dayEvents.length > 1 && (
                                                        <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, color: 'text.secondary' }}>
                                                            +{dayEvents.length - 1}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            )}
                                        </Box>
                                    );
                                })}
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* Selected Day Panel */}
                {selectedDay && (
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography fontWeight={700}>{format(selectedDay, 'MMMM d, yyyy')}</Typography>
                                <IconButton size="small" onClick={() => setSelectedDay(null)}><CloseIcon /></IconButton>
                            </Box>
                            {selectedDayEvents.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 3 }}>
                                    <Typography color="text.secondary" variant="body2">No events scheduled for this day</Typography>
                                    {isAdmin && (
                                        <AppButton
                                            size="small"
                                            variant="outlined"
                                            startIcon={<AddIcon />}
                                            onClick={() => openAddEventForDay(selectedDay)}
                                            sx={{ mt: 1.5 }}
                                        >
                                            Add Event
                                        </AppButton>
                                    )}
                                </Box>
                            ) : (
                                selectedDayEvents.map((ev, i) => {
                                    const tc = typeConfig(ev.eventType);
                                    return (
                                        <Box key={i} sx={{ p: 1.5, borderRadius: 2, bgcolor: tc.color + '12', border: `1px solid ${tc.color}35`, mb: 1.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                    <Box sx={{ color: tc.color }}>{tc.icon}</Box>
                                                    <Typography fontWeight={700} sx={{ fontSize: '0.9rem', color: tc.color }}>{ev.title}</Typography>
                                                </Box>
                                                {!ev.isAutoGenerated && isAdmin && (
                                                    <IconButton size="small" onClick={() => deleteEvent.mutate(ev._id)} sx={{ color: 'error.main', p: 0.25 }}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                )}
                                            </Box>
                                            {ev.description && <Typography variant="body2" color="text.secondary">{ev.description}</Typography>}
                                            <Box sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'center' }}>
                                                <Chip label={tc.label} size="small" sx={{ bgcolor: tc.color + '20', color: tc.color, fontWeight: 600 }} />
                                                {ev.isAutoGenerated && (
                                                    <Chip label="Auto-Synced" size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                                                )}
                                            </Box>
                                        </Box>
                                    );
                                })
                            )}
                        </Paper>
                    </Grid>
                )}
            </Grid>

            {/* Create Event Dialog using AppInput, AppSelect, AppDatePicker, AppButton */}
            <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm" fullScreen={isMobile} PaperProps={{ sx: { borderRadius: 2 } }}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                    <Typography fontWeight={700} variant="h6">Add School Event</Typography>
                    <IconButton onClick={() => setCreateOpen(false)} size="small"><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <AppInput
                        label="Event Title"
                        required
                        placeholder="e.g. Annual Sports Day or Winter Vacation"
                        value={form.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    />
                    <AppSelect
                        label="Event Type"
                        value={form.eventType}
                        onChange={e => setForm(f => ({ ...f, eventType: e.target.value as string }))}
                        options={EVENT_TYPES.map(t => ({ value: t.value, label: t.label }))}
                    />
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <AppDatePicker
                                label="Start Date"
                                required
                                value={form.startDate}
                                onChange={val => val && setForm(f => ({ ...f, startDate: val }))}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <AppDatePicker
                                label="End Date"
                                value={form.endDate}
                                onChange={val => val && setForm(f => ({ ...f, endDate: val }))}
                            />
                        </Grid>
                    </Grid>
                    <AppInput
                        label="Description"
                        placeholder="Optional details or instructions for this event..."
                        multiline
                        rows={3}
                        value={form.description}
                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2.5, gap: 1 }}>
                    <AppButton onClick={() => setCreateOpen(false)} variant="outlined" color="inherit">
                        Cancel
                    </AppButton>
                    <AppButton
                        variant="contained"
                        onClick={() => createEvent.mutate(form)}
                        disabled={createEvent.isPending || !form.title || !form.startDate}
                        startIcon={createEvent.isPending ? <CircularProgress size={14} color="inherit" /> : <AddIcon />}
                    >
                        {createEvent.isPending ? 'Adding...' : 'Add Event'}
                    </AppButton>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SchoolCalendar;
