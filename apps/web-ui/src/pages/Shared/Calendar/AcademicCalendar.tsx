import React, { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    IconButton,
    Skeleton,
    CircularProgress,
    TextField,
    InputAdornment,
    ToggleButtonGroup,
    ToggleButton,
    Divider,
} from '@mui/material';
import {
    ChevronLeft,
    ChevronRight,
    Add as AddIcon,
    Event as EventIcon,
    SportsFootball as SportsIcon,
    FestivalOutlined as HolidayIcon,
    Assignment as ExamIcon,
    Groups as ParentMeetingIcon,
    Badge as StaffIcon,
    Close as CloseIcon,
    DeleteOutline as DeleteIcon,
    EditOutlined as EditIcon,
    Search as SearchIcon,
    CalendarViewMonth as MonthViewIcon,
    ViewAgendaOutlined as AgendaViewIcon,
    Today as TodayIcon,
    LocationOnOutlined as LocationIcon,
    AccessTime as TimeIcon,
    VisibilityOutlined as VisibilityIcon,
    Celebration as CelebrationIcon,
} from '@mui/icons-material';
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    getDay,
    isSameDay,
    addMonths,
    subMonths,
    isToday,
    differenceInCalendarDays,
    parseISO,
    isValid,
} from 'date-fns';
import TokenService from '../../../queries/token/tokenService';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { AppInput } from '../../../components/shared/AppInput';
import { AppSelect } from '../../../components/shared/AppSelect';
import { AppDatePicker } from '../../../components/shared/AppDatePicker';
import { AppButton } from '../../../components/shared/AppButton';
import {
    useGetCalendarEvents,
    useCreateCalendarEvent,
    useUpdateCalendarEvent,
    useDeleteCalendarEvent,
} from '../../../queries/Calendar';
import type {
    CalendarEvent,
    CalendarEventType,
    CalendarTargetAudience,
    CreateCalendarEventPayload,
} from '../../../types';

export interface EventTypeConfig {
    value: CalendarEventType;
    label: string;
    color: string;
    bg: string;
    borderColor: string;
    icon: React.ReactElement;
    description: string;
}

export const CALENDAR_EVENT_TYPES: EventTypeConfig[] = [
    {
        value: 'holiday',
        label: 'Holiday',
        color: '#10b981',
        bg: '#ecfdf5',
        borderColor: '#a7f3d0',
        icon: <HolidayIcon fontSize="small" />,
        description: 'School holidays & vacation days',
    },
    {
        value: 'exam',
        label: 'Exam',
        color: '#ef4444',
        bg: '#fef2f2',
        borderColor: '#fecaca',
        icon: <ExamIcon fontSize="small" />,
        description: 'Examinations, assessments & tests',
    },
    {
        value: 'event',
        label: 'General Event',
        color: '#3b82f6',
        bg: '#eff6ff',
        borderColor: '#bfdbfe',
        icon: <EventIcon fontSize="small" />,
        description: 'School functions, celebrations & workshops',
    },
    {
        value: 'sports',
        label: 'Sports Day',
        color: '#f59e0b',
        bg: '#fffbeb',
        borderColor: '#fde68a',
        icon: <SportsIcon fontSize="small" />,
        description: 'Sports meets, athletic tournaments & games',
    },
    {
        value: 'annual_day',
        label: 'Annual Day',
        color: '#8b5cf6',
        bg: '#f5f3ff',
        borderColor: '#ddd6fe',
        icon: <CelebrationIcon fontSize="small" />,
        description: 'Annual cultural day, award ceremonies & fest',
    },
    {
        value: 'parent_meeting',
        label: 'Parent Meeting',
        color: '#0d9488',
        bg: '#f0fdfa',
        borderColor: '#99f6e4',
        icon: <ParentMeetingIcon fontSize="small" />,
        description: 'Parent-Teacher meetings & parent orientation',
    },
    {
        value: 'staff_meeting',
        label: 'Staff Meeting',
        color: '#64748b',
        bg: '#f8fafc',
        borderColor: '#cbd5e1',
        icon: <StaffIcon fontSize="small" />,
        description: 'Faculty, staff & academic review meetings',
    },
];

export const AUDIENCE_OPTIONS: { value: CalendarTargetAudience; label: string; color: string }[] = [
    { value: 'all', label: 'All (School-wide)', color: '#3b82f6' },
    { value: 'teacher', label: 'Teachers', color: '#8b5cf6' },
    { value: 'student', label: 'Students', color: '#10b981' },
    { value: 'parent', label: 'Parents', color: '#f59e0b' },
    { value: 'staff', label: 'Staff Only', color: '#64748b' },
];

const getEventTypeConfig = (type: string): EventTypeConfig => {
    if (type === 'ptm') {
        return CALENDAR_EVENT_TYPES.find(t => t.value === 'parent_meeting') || CALENDAR_EVENT_TYPES[0];
    }
    return CALENDAR_EVENT_TYPES.find(t => t.value === type) || CALENDAR_EVENT_TYPES[2];
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const AcademicCalendar: React.FC = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const role = TokenService.getRole() || '';
    const isMobile = useIsMobile();
    const isAdmin = ['sch_admin', 'principal', 'super_admin'].includes(role);
    const isTeacher = role === 'teacher';
    const isStudent = role === 'student';
    const isParent = role === 'parent';

    // State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Create / Edit modal state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
    const [form, setForm] = useState<{
        title: string;
        description: string;
        eventType: CalendarEventType;
        startDate: Date;
        endDate: Date;
        targetAudience: CalendarTargetAudience[];
        venue: string;
    }>({
        title: '',
        description: '',
        eventType: 'event',
        startDate: new Date(),
        endDate: new Date(),
        targetAudience: ['all'],
        venue: '',
    });

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const from = format(monthStart, 'yyyy-MM-dd');
    const to = format(monthEnd, 'yyyy-MM-dd');

    // Query calendar events
    const { data, isLoading } = useGetCalendarEvents(schoolId, {
        from: viewMode === 'month' ? from : undefined,
        to: viewMode === 'month' ? to : undefined,
        eventType: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: searchQuery || undefined,
    });

    const events: CalendarEvent[] = data?.data || [];

    // Mutations
    const createEventMutation = useCreateCalendarEvent(schoolId);
    const updateEventMutation = useUpdateCalendarEvent(schoolId);
    const deleteEventMutation = useDeleteCalendarEvent(schoolId);

    // Helpers
    const getEventsForDay = (day: Date): CalendarEvent[] => {
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

    // Filter available event types based on role (students and parents don't need staff meeting filter)
    const visibleEventTypes = useMemo(() => {
        if (isStudent || isParent) {
            return CALENDAR_EVENT_TYPES.filter(t => t.value !== 'staff_meeting');
        }
        return CALENDAR_EVENT_TYPES;
    }, [isStudent, isParent]);

    // Counts for stats pills
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = { all: events.length };
        visibleEventTypes.forEach(t => {
            counts[t.value] = events.filter(e => {
                if (t.value === 'parent_meeting') {
                    return e.eventType === 'parent_meeting' || e.eventType === 'ptm';
                }
                return e.eventType === t.value;
            }).length;
        });
        return counts;
    }, [events, visibleEventTypes]);

    // Handlers
    const handleOpenCreate = (day?: Date) => {
        const targetDay = day || selectedDay || new Date();
        setEditingEvent(null);
        setForm({
            title: '',
            description: '',
            eventType: 'event',
            startDate: targetDay,
            endDate: targetDay,
            targetAudience: ['all'],
            venue: '',
        });
        setDialogOpen(true);
    };

    const handleOpenEdit = (event: CalendarEvent) => {
        setEditingEvent(event);
        const sDate = event.startDate ? new Date(event.startDate) : new Date();
        const eDate = event.endDate ? new Date(event.endDate) : sDate;
        setForm({
            title: event.title,
            description: event.description || '',
            eventType: event.eventType,
            startDate: isValid(sDate) ? sDate : new Date(),
            endDate: isValid(eDate) ? eDate : sDate,
            targetAudience: Array.isArray(event.targetAudience) ? event.targetAudience : ['all'],
            venue: event.venue || '',
        });
        setDialogOpen(true);
    };

    const handleSaveEvent = async () => {
        if (!form.title.trim() || !form.startDate) return;

        const payload: CreateCalendarEventPayload = {
            title: form.title.trim(),
            description: form.description.trim() || undefined,
            eventType: form.eventType,
            startDate: format(form.startDate, 'yyyy-MM-dd'),
            endDate: form.endDate ? format(form.endDate, 'yyyy-MM-dd') : format(form.startDate, 'yyyy-MM-dd'),
            targetAudience: form.targetAudience.length > 0 ? form.targetAudience : ['all'],
            venue: form.venue.trim() || undefined,
        };

        if (editingEvent) {
            await updateEventMutation.mutateAsync({
                eventId: editingEvent._id,
                payload,
            });
        } else {
            await createEventMutation.mutateAsync(payload);
        }

        setDialogOpen(false);
    };

    const handleDeleteEvent = async (eventId: string) => {
        if (window.confirm('Are you sure you want to delete this event from the academic calendar?')) {
            await deleteEventMutation.mutateAsync(eventId);
        }
    };

    const toggleAudienceSelection = (aud: CalendarTargetAudience) => {
        if (aud === 'all') {
            setForm(f => ({ ...f, targetAudience: ['all'] }));
            return;
        }
        setForm(f => {
            const exists = f.targetAudience.includes(aud);
            let next = exists
                ? f.targetAudience.filter(a => a !== aud && a !== 'all')
                : [...f.targetAudience.filter(a => a !== 'all'), aud];
            if (next.length === 0) next = ['all'];
            return { ...f, targetAudience: next };
        });
    };

    const formatEventDateRange = (startDate: string | Date, endDate?: string | Date | null) => {
        const s = typeof startDate === 'string' ? parseISO(startDate) : startDate;
        const e = endDate ? (typeof endDate === 'string' ? parseISO(endDate) : endDate) : null;
        if (!e || isSameDay(s, e)) {
            return format(s, 'EEE, MMMM d, yyyy');
        }
        return `${format(s, 'MMM d')} – ${format(e, 'MMM d, yyyy')}`;
    };

    const getRelativeBadge = (startDate: string | Date) => {
        const s = typeof startDate === 'string' ? parseISO(startDate) : startDate;
        const today = new Date();
        const diff = differenceInCalendarDays(s, today);
        if (diff === 0) return { label: 'Today', color: '#ef4444', bg: '#fee2e2' };
        if (diff === 1) return { label: 'Tomorrow', color: '#f59e0b', bg: '#fef3c7' };
        if (diff > 1 && diff <= 7) return { label: `In ${diff} days`, color: '#3b82f6', bg: '#dbeafe' };
        if (diff > 7) return { label: `In ${Math.ceil(diff / 7)}w`, color: '#6b7280', bg: '#f3f4f6' };
        return { label: 'Completed', color: '#9ca3af', bg: '#f3f4f6' };
    };

    return (
        <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 1300, mx: 'auto' }}>
            {/* Header section */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    justifyContent: 'space-between',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 2,
                    mb: 3,
                    p: { xs: 2, sm: 2.5 },
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                    color: 'white',
                    boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)',
                }}
            >
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography
                            variant="h5"
                            fontWeight={800}
                            sx={{ fontSize: { xs: '1.25rem', sm: '1.6rem' }, letterSpacing: '-0.02em' }}
                        >
                            📅 Academic Calendar
                        </Typography>
                        <Chip
                            label={
                                isAdmin
                                    ? 'Admin View'
                                    : isTeacher
                                    ? 'Faculty View'
                                    : isParent
                                    ? 'Parent View'
                                    : 'Student View'
                            }
                            size="small"
                            sx={{
                                bgcolor: 'rgba(255, 255, 255, 0.15)',
                                color: 'white',
                                fontWeight: 700,
                                fontSize: '0.72rem',
                                backdropFilter: 'blur(4px)',
                            }}
                        />
                    </Box>
                    <Typography variant="body2" sx={{ color: '#cbd5e1', mt: 0.5, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                        {isAdmin
                            ? 'Manage all school events, holidays, examinations, sports day, annual day and meetings'
                            : 'Stay updated with scheduled exams, holidays, school events, sports day and meetings'}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
                    {/* View Switcher */}
                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={(_, next) => next && setViewMode(next)}
                        size="small"
                        sx={{
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: 2,
                            p: 0.3,
                            '& .MuiToggleButton-root': {
                                color: '#cbd5e1',
                                border: 'none',
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 1.5,
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                textTransform: 'none',
                                '&.Mui-selected': {
                                    bgcolor: 'primary.main',
                                    color: 'white',
                                    '&:hover': { bgcolor: 'primary.dark' },
                                },
                            },
                        }}
                    >
                        <ToggleButton value="month">
                            <MonthViewIcon fontSize="small" sx={{ mr: 0.5, fontSize: 16 }} /> Month
                        </ToggleButton>
                        <ToggleButton value="agenda">
                            <AgendaViewIcon fontSize="small" sx={{ mr: 0.5, fontSize: 16 }} /> Agenda
                        </ToggleButton>
                    </ToggleButtonGroup>

                    {/* Admin Add Event Button */}
                    {isAdmin && (
                        <AppButton
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenCreate(selectedDay || new Date())}
                            sx={{
                                bgcolor: '#3b82f6',
                                '&:hover': { bgcolor: '#2563eb' },
                                px: 2,
                                py: 0.8,
                                fontWeight: 700,
                                borderRadius: 2,
                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                            }}
                        >
                            Add Event
                        </AppButton>
                    )}
                </Box>
            </Box>

            {/* Category Filter Chips & Search Bar */}
            <Box sx={{ mb: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap' }}>
                    {/* Category pills */}
                    <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Chip
                            label={`All (${categoryCounts.all || 0})`}
                            onClick={() => setSelectedCategory('all')}
                            variant={selectedCategory === 'all' ? 'filled' : 'outlined'}
                            color={selectedCategory === 'all' ? 'primary' : 'default'}
                            sx={{
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                        />
                        {visibleEventTypes.map(t => {
                            const isSelected = selectedCategory === t.value;
                            const count = categoryCounts[t.value] || 0;
                            return (
                                <Chip
                                    key={t.value}
                                    icon={t.icon as any}
                                    label={`${t.label} (${count})`}
                                    onClick={() => setSelectedCategory(isSelected ? 'all' : t.value)}
                                    sx={{
                                        fontWeight: isSelected ? 700 : 500,
                                        fontSize: '0.75rem',
                                        cursor: 'pointer',
                                        bgcolor: isSelected ? t.color : t.bg,
                                        color: isSelected ? 'white' : t.color,
                                        border: `1px solid ${t.borderColor}`,
                                        '& .MuiChip-icon': {
                                            color: isSelected ? 'white' : t.color,
                                        },
                                        '&:hover': {
                                            bgcolor: isSelected ? t.color : t.borderColor,
                                        },
                                        transition: 'all 0.2s',
                                    }}
                                />
                            );
                        })}
                    </Box>

                    {/* Search Field */}
                    <Box sx={{ width: { xs: '100%', sm: 260 } }}>
                        <TextField
                            size="small"
                            placeholder="Search events, venue..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            fullWidth
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                    </InputAdornment>
                                ),
                                endAdornment: searchQuery ? (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={() => setSearchQuery('')}>
                                            <CloseIcon fontSize="small" />
                                        </IconButton>
                                    </InputAdornment>
                                ) : null,
                                sx: {
                                    borderRadius: 2,
                                    bgcolor: 'background.paper',
                                    fontSize: '0.85rem',
                                },
                            }}
                        />
                    </Box>
                </Box>
            </Box>

            {/* Main Content Area */}
            {viewMode === 'month' ? (
                <>
                    {/* Month Navigator */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            mb: 2,
                            p: 1,
                            bgcolor: 'background.paper',
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton
                                onClick={() => setCurrentDate(d => subMonths(d, 1))}
                                size={isMobile ? 'small' : 'medium'}
                                sx={{ border: '1px solid', borderColor: 'divider' }}
                            >
                                <ChevronLeft />
                            </IconButton>
                            <Typography
                                fontWeight={800}
                                sx={{
                                    fontSize: { xs: '1.05rem', sm: '1.25rem' },
                                    minWidth: { xs: 150, sm: 200 },
                                    textAlign: 'center',
                                }}
                            >
                                {format(currentDate, 'MMMM yyyy')}
                            </Typography>
                            <IconButton
                                onClick={() => setCurrentDate(d => addMonths(d, 1))}
                                size={isMobile ? 'small' : 'medium'}
                                sx={{ border: '1px solid', borderColor: 'divider' }}
                            >
                                <ChevronRight />
                            </IconButton>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <AppButton
                                variant="outlined"
                                size="small"
                                startIcon={<TodayIcon fontSize="small" />}
                                onClick={() => setCurrentDate(new Date())}
                                sx={{ fontWeight: 600, borderRadius: 2 }}
                            >
                                Today
                            </AppButton>
                        </Box>
                    </Box>

                    <Grid container spacing={2.5}>
                        {/* Calendar Month Grid */}
                        <Grid size={{ xs: 12, md: selectedDay ? 8 : 12 }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    borderRadius: 3,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    overflow: 'hidden',
                                    bgcolor: 'background.paper',
                                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                                }}
                            >
                                {/* Weekday headers */}
                                <Box
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                                        bgcolor: '#f8fafc',
                                        borderBottom: '1px solid',
                                        borderColor: 'divider',
                                    }}
                                >
                                    {DAYS.map((d, index) => (
                                        <Box
                                            key={d}
                                            sx={{
                                                py: 1.2,
                                                textAlign: 'center',
                                                borderRight: index < 6 ? '1px solid' : 'none',
                                                borderColor: 'divider',
                                            }}
                                        >
                                            <Typography
                                                variant="caption"
                                                fontWeight={800}
                                                sx={{
                                                    color: index === 0 ? '#ef4444' : index === 6 ? '#3b82f6' : 'text.secondary',
                                                    fontSize: { xs: '0.68rem', sm: '0.78rem' },
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                }}
                                            >
                                                {isMobile ? d[0] : d}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>

                                {/* Date Grid Cells */}
                                {isLoading ? (
                                    <Box sx={{ p: 3 }}>
                                        <Skeleton variant="rectangular" height={360} sx={{ borderRadius: 2 }} />
                                    </Box>
                                ) : (
                                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
                                        {/* Blank offset days */}
                                        {blanks.map((_, i) => (
                                            <Box
                                                key={`blank-${i}`}
                                                sx={{
                                                    minHeight: { xs: 58, sm: 94 },
                                                    borderRight: '1px solid',
                                                    borderBottom: '1px solid',
                                                    borderColor: 'divider',
                                                    bgcolor: '#fcfcfd',
                                                }}
                                            />
                                        ))}

                                        {/* Days in Month */}
                                        {daysInMonth.map((day, idx) => {
                                            const dayEvents = getEventsForDay(day);
                                            const isSelected = selectedDay && isSameDay(day, selectedDay);
                                            const today = isToday(day);
                                            const dayOfWeek = getDay(day);
                                            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                                            return (
                                                <Box
                                                    key={idx}
                                                    onClick={() => setSelectedDay(selectedDay && isSameDay(day, selectedDay) ? null : day)}
                                                    sx={{
                                                        minHeight: { xs: 58, sm: 94 },
                                                        p: { xs: 0.5, sm: 0.8 },
                                                        borderRight: '1px solid',
                                                        borderBottom: '1px solid',
                                                        borderColor: 'divider',
                                                        cursor: 'pointer',
                                                        bgcolor: isSelected
                                                            ? '#eff6ff'
                                                            : today
                                                            ? '#fffbeb'
                                                            : isWeekend
                                                            ? '#fafbfc'
                                                            : 'transparent',
                                                        '&:hover': {
                                                            bgcolor: isSelected ? '#eff6ff' : '#f1f5f9',
                                                        },
                                                        transition: 'all 0.15s ease',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        overflow: 'hidden',
                                                        position: 'relative',
                                                    }}
                                                >
                                                    {/* Day number header */}
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Typography
                                                            sx={{
                                                                fontSize: { xs: '0.75rem', sm: '0.85rem' },
                                                                fontWeight: today ? 900 : isSelected ? 800 : 600,
                                                                width: { xs: 22, sm: 26 },
                                                                height: { xs: 22, sm: 26 },
                                                                borderRadius: '50%',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                bgcolor: today ? '#f59e0b' : isSelected ? '#3b82f6' : 'transparent',
                                                                color: today || isSelected ? 'white' : isWeekend ? '#64748b' : 'text.primary',
                                                                boxShadow: today ? '0 2px 6px rgba(245, 158, 11, 0.4)' : 'none',
                                                            }}
                                                        >
                                                            {format(day, 'd')}
                                                        </Typography>

                                                        {/* Quick count indicator if multiple */}
                                                        {dayEvents.length > 0 && !isMobile && (
                                                            <Typography
                                                                variant="caption"
                                                                sx={{
                                                                    fontSize: '0.62rem',
                                                                    fontWeight: 700,
                                                                    color: 'text.secondary',
                                                                    bgcolor: 'rgba(0, 0, 0, 0.04)',
                                                                    px: 0.6,
                                                                    py: 0.1,
                                                                    borderRadius: 1,
                                                                }}
                                                            >
                                                                {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
                                                            </Typography>
                                                        )}
                                                    </Box>

                                                    {/* Desktop Event Pills */}
                                                    {!isMobile && dayEvents.length > 0 && (
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4, mt: 0.5, overflow: 'hidden' }}>
                                                            {dayEvents.slice(0, 2).map((ev, evIdx) => {
                                                                const tc = getEventTypeConfig(ev.eventType);
                                                                return (
                                                                    <Box
                                                                        key={evIdx}
                                                                        sx={{
                                                                            bgcolor: tc.bg,
                                                                            borderLeft: `3px solid ${tc.color}`,
                                                                            borderRadius: '4px',
                                                                            px: 0.6,
                                                                            py: 0.25,
                                                                            width: '100%',
                                                                            boxSizing: 'border-box',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: 0.5,
                                                                        }}
                                                                    >
                                                                        <Typography
                                                                            sx={{
                                                                                fontSize: '0.67rem',
                                                                                fontWeight: 700,
                                                                                color: tc.color,
                                                                                whiteSpace: 'nowrap',
                                                                                overflow: 'hidden',
                                                                                textOverflow: 'ellipsis',
                                                                                lineHeight: 1.2,
                                                                            }}
                                                                        >
                                                                            {ev.title}
                                                                        </Typography>
                                                                    </Box>
                                                                );
                                                            })}

                                                            {dayEvents.length > 2 && (
                                                                <Typography
                                                                    sx={{
                                                                        fontSize: '0.62rem',
                                                                        fontWeight: 800,
                                                                        color: '#6366f1',
                                                                        pl: 0.5,
                                                                    }}
                                                                >
                                                                    +{dayEvents.length - 2} more
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    )}

                                                    {/* Mobile dots */}
                                                    {isMobile && dayEvents.length > 0 && (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mt: 0.6, flexWrap: 'wrap' }}>
                                                            {dayEvents.slice(0, 3).map((ev, evIdx) => {
                                                                const tc = getEventTypeConfig(ev.eventType);
                                                                return (
                                                                    <Box
                                                                        key={evIdx}
                                                                        sx={{
                                                                            width: 6,
                                                                            height: 6,
                                                                            borderRadius: '50%',
                                                                            bgcolor: tc.color,
                                                                        }}
                                                                    />
                                                                );
                                                            })}
                                                            {dayEvents.length > 3 && (
                                                                <Typography sx={{ fontSize: '0.55rem', fontWeight: 800, color: 'text.secondary' }}>
                                                                    +{dayEvents.length - 3}
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

                        {/* Selected Day Details Panel */}
                        {selectedDay && (
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2.5,
                                        borderRadius: 3,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        bgcolor: 'background.paper',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                    }}
                                >
                                    {/* Selected day header */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Box>
                                            <Typography variant="h6" fontWeight={800} sx={{ fontSize: '1.05rem' }}>
                                                {format(selectedDay, 'EEEE')}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                {format(selectedDay, 'MMMM d, yyyy')}
                                            </Typography>
                                        </Box>
                                        <IconButton size="small" onClick={() => setSelectedDay(null)}>
                                            <CloseIcon fontSize="small" />
                                        </IconButton>
                                    </Box>

                                    <Divider sx={{ mb: 2 }} />

                                    {/* Events on this day */}
                                    {selectedDayEvents.length === 0 ? (
                                        <Box sx={{ textAlign: 'center', py: 4 }}>
                                            <EventIcon sx={{ fontSize: 44, color: 'text.disabled', mb: 1 }} />
                                            <Typography color="text.secondary" variant="body2" fontWeight={600}>
                                                No events scheduled for this day
                                            </Typography>
                                            {isAdmin && (
                                                <AppButton
                                                    size="small"
                                                    variant="outlined"
                                                    startIcon={<AddIcon />}
                                                    onClick={() => handleOpenCreate(selectedDay)}
                                                    sx={{ mt: 2, borderRadius: 2 }}
                                                >
                                                    Add Event for this Day
                                                </AppButton>
                                            )}
                                        </Box>
                                    ) : (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                            {selectedDayEvents.map((ev, i) => {
                                                const tc = getEventTypeConfig(ev.eventType);
                                                return (
                                                    <Box
                                                        key={i}
                                                        sx={{
                                                            p: 2,
                                                            borderRadius: 2.5,
                                                            bgcolor: tc.bg,
                                                            border: `1px solid ${tc.borderColor}`,
                                                            transition: 'transform 0.15s ease',
                                                            '&:hover': { transform: 'translateY(-2px)' },
                                                        }}
                                                    >
                                                        {/* Top row: Category Chip + Admin Actions */}
                                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                                            <Chip
                                                                icon={tc.icon as any}
                                                                label={tc.label}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: tc.color + '20',
                                                                    color: tc.color,
                                                                    fontWeight: 700,
                                                                    fontSize: '0.7rem',
                                                                    '& .MuiChip-icon': { color: tc.color },
                                                                }}
                                                            />
                                                            {isAdmin && !ev.isAutoGenerated && (
                                                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => handleOpenEdit(ev)}
                                                                        sx={{ color: '#3b82f6', p: 0.4 }}
                                                                    >
                                                                        <EditIcon fontSize="small" />
                                                                    </IconButton>
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => handleDeleteEvent(ev._id)}
                                                                        sx={{ color: '#ef4444', p: 0.4 }}
                                                                    >
                                                                        <DeleteIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Box>
                                                            )}
                                                        </Box>

                                                        {/* Event Title */}
                                                        <Typography fontWeight={800} sx={{ fontSize: '0.95rem', color: '#1e293b', mb: 0.5 }}>
                                                            {ev.title}
                                                        </Typography>

                                                        {/* Event Description */}
                                                        {ev.description && (
                                                            <Typography
                                                                variant="body2"
                                                                color="text.secondary"
                                                                sx={{ mb: 1, fontSize: '0.8rem', lineHeight: 1.4 }}
                                                            >
                                                                {ev.description}
                                                            </Typography>
                                                        )}

                                                        {/* Venue */}
                                                        {ev.venue && (
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                                                                <LocationIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                                    {ev.venue}
                                                                </Typography>
                                                            </Box>
                                                        )}

                                                        {/* Date Range & Target Audience */}
                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, alignItems: 'center', mt: 1 }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                <TimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                                <Typography variant="caption" fontWeight={600} color="text.secondary">
                                                                    {formatEventDateRange(ev.startDate, ev.endDate)}
                                                                </Typography>
                                                            </Box>

                                                            {/* Target audience tag */}
                                                            {ev.targetAudience && ev.targetAudience.length > 0 && (
                                                                <Chip
                                                                    icon={<VisibilityIcon sx={{ fontSize: '12px !important' }} />}
                                                                    label={`Visible to: ${
                                                                        ev.targetAudience.includes('all')
                                                                            ? 'Everyone'
                                                                            : ev.targetAudience.map(a => a.charAt(0).toUpperCase() + a.slice(1)).join(', ')
                                                                    }`}
                                                                    size="small"
                                                                    variant="outlined"
                                                                    sx={{
                                                                        fontSize: '0.65rem',
                                                                        height: 22,
                                                                        fontWeight: 600,
                                                                        borderColor: 'divider',
                                                                    }}
                                                                />
                                                            )}

                                                            {ev.isAutoGenerated && (
                                                                <Chip
                                                                    label="Auto-Synced"
                                                                    size="small"
                                                                    sx={{
                                                                        fontSize: '0.62rem',
                                                                        height: 20,
                                                                        bgcolor: 'rgba(0, 0, 0, 0.05)',
                                                                        fontWeight: 600,
                                                                    }}
                                                                />
                                                            )}
                                                        </Box>
                                                    </Box>
                                                );
                                            })}

                                            {isAdmin && (
                                                <AppButton
                                                    size="small"
                                                    variant="outlined"
                                                    startIcon={<AddIcon />}
                                                    onClick={() => handleOpenCreate(selectedDay)}
                                                    sx={{ mt: 1, borderRadius: 2 }}
                                                >
                                                    Add Another Event
                                                </AppButton>
                                            )}
                                        </Box>
                                    )}
                                </Paper>
                            </Grid>
                        )}
                    </Grid>
                </>
            ) : (
                /* Agenda / Timeline View */
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 2, sm: 3 },
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                    }}
                >
                    <Typography variant="h6" fontWeight={800} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AgendaViewIcon color="primary" /> Upcoming Agenda & Schedule
                    </Typography>

                    {isLoading ? (
                        <Box sx={{ p: 2 }}>
                            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
                        </Box>
                    ) : events.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 6 }}>
                            <EventIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1.5 }} />
                            <Typography variant="h6" color="text.secondary" fontWeight={700}>
                                No events found
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                There are no events matching your active filter criteria.
                            </Typography>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {events.map((ev, idx) => {
                                const tc = getEventTypeConfig(ev.eventType);
                                const relBadge = getRelativeBadge(ev.startDate);
                                return (
                                    <Box
                                        key={idx}
                                        sx={{
                                            p: 2,
                                            borderRadius: 2.5,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            bgcolor: '#ffffff',
                                            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
                                            display: 'flex',
                                            flexDirection: { xs: 'column', sm: 'row' },
                                            alignItems: { xs: 'flex-start', sm: 'center' },
                                            justifyContent: 'space-between',
                                            gap: 2,
                                            borderLeft: `4px solid ${tc.color}`,
                                            transition: 'transform 0.15s ease',
                                            '&:hover': { transform: 'translateX(4px)' },
                                        }}
                                    >
                                        {/* Left info */}
                                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                            <Box
                                                sx={{
                                                    p: 1.5,
                                                    borderRadius: 2,
                                                    bgcolor: tc.bg,
                                                    color: tc.color,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    minWidth: 44,
                                                    height: 44,
                                                }}
                                            >
                                                {tc.icon}
                                            </Box>
                                            <Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                                                    <Typography fontWeight={800} sx={{ fontSize: '0.98rem' }}>
                                                        {ev.title}
                                                    </Typography>
                                                    <Chip
                                                        label={tc.label}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: tc.bg,
                                                            color: tc.color,
                                                            fontWeight: 700,
                                                            fontSize: '0.68rem',
                                                        }}
                                                    />
                                                    <Chip
                                                        label={relBadge.label}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: relBadge.bg,
                                                            color: relBadge.color,
                                                            fontWeight: 700,
                                                            fontSize: '0.65rem',
                                                        }}
                                                    />
                                                </Box>

                                                {ev.description && (
                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.82rem' }}>
                                                        {ev.description}
                                                    </Typography>
                                                )}

                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <TimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                        <Typography variant="caption" fontWeight={600} color="text.secondary">
                                                            {formatEventDateRange(ev.startDate, ev.endDate)}
                                                        </Typography>
                                                    </Box>
                                                    {ev.venue && (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <LocationIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                            <Typography variant="caption" fontWeight={600} color="text.secondary">
                                                                {ev.venue}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                    {ev.targetAudience && (
                                                        <Chip
                                                            icon={<VisibilityIcon sx={{ fontSize: '12px !important' }} />}
                                                            label={`Visible to: ${
                                                                ev.targetAudience.includes('all')
                                                                    ? 'Everyone'
                                                                    : ev.targetAudience.map(a => a.charAt(0).toUpperCase() + a.slice(1)).join(', ')
                                                            }`}
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{ fontSize: '0.62rem', height: 20, fontWeight: 600 }}
                                                        />
                                                    )}
                                                </Box>
                                            </Box>
                                        </Box>

                                        {/* Right actions (Admin) */}
                                        {isAdmin && !ev.isAutoGenerated && (
                                            <Box sx={{ display: 'flex', gap: 1, alignSelf: { xs: 'flex-end', sm: 'center' } }}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleOpenEdit(ev)}
                                                    sx={{ color: '#3b82f6', border: '1px solid', borderColor: 'divider' }}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDeleteEvent(ev._id)}
                                                    sx={{ color: '#ef4444', border: '1px solid', borderColor: 'divider' }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        )}
                                    </Box>
                                );
                            })}
                        </Box>
                    )}
                </Paper>
            )}

            {/* Create / Edit Event Dialog (Admin & Principal Only) */}
            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                fullWidth
                maxWidth="sm"
                fullScreen={isMobile}
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        pb: 1,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography fontWeight={800} variant="h6">
                            {editingEvent ? 'Edit Academic Event' : 'Add Academic Event'}
                        </Typography>
                    </Box>
                    <IconButton onClick={() => setDialogOpen(false)} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ pt: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Event Title */}
                    <AppInput
                        label="Event Title"
                        required
                        placeholder="e.g. Annual Sports Meet 2026, Diwali Holiday, Term 1 Final Exams"
                        value={form.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    />

                    {/* Event Category / Type */}
                    <AppSelect
                        label="Event Category"
                        value={form.eventType}
                        onChange={e => setForm(f => ({ ...f, eventType: e.target.value as CalendarEventType }))}
                        options={CALENDAR_EVENT_TYPES.map(t => ({
                            value: t.value,
                            label: t.label,
                        }))}
                    />

                    {/* Date Pickers */}
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

                    {/* Venue / Location */}
                    <AppInput
                        label="Venue / Location (Optional)"
                        placeholder="e.g. Main Auditorium, Sports Ground, Room 102, Online"
                        value={form.venue}
                        onChange={e => setForm(f => ({ ...f, venue: e.target.value }))}
                    />

                    {/* Target Audience Visibility Selector */}
                    <Box sx={{ mt: 0.5 }}>
                        <Typography variant="body2" fontWeight={700} sx={{ mb: 1, color: 'text.secondary' }}>
                            Visible To (Target Audience) *
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                            {AUDIENCE_OPTIONS.map(aud => {
                                const isSelected =
                                    form.targetAudience.includes(aud.value) ||
                                    (aud.value === 'all' && form.targetAudience.includes('all'));
                                return (
                                    <Chip
                                        key={aud.value}
                                        label={aud.label}
                                        clickable
                                        onClick={() => toggleAudienceSelection(aud.value)}
                                        variant={isSelected ? 'filled' : 'outlined'}
                                        color={isSelected ? 'primary' : 'default'}
                                        sx={{
                                            fontWeight: isSelected ? 700 : 500,
                                            fontSize: '0.78rem',
                                            borderRadius: 2,
                                        }}
                                    />
                                );
                            })}
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.8 }}>
                            Selected roles will be able to view this event on their respective Academic Calendar dashboards.
                        </Typography>
                    </Box>

                    {/* Description / Instructions */}
                    <AppInput
                        label="Description & Instructions"
                        placeholder="Provide event schedule details, guidelines, dress code, or agenda..."
                        multiline
                        rows={3}
                        value={form.description}
                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    />
                </DialogContent>

                <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider', gap: 1 }}>
                    <AppButton onClick={() => setDialogOpen(false)} variant="outlined" color="inherit">
                        Cancel
                    </AppButton>
                    <AppButton
                        variant="contained"
                        onClick={handleSaveEvent}
                        disabled={
                            createEventMutation.isPending ||
                            updateEventMutation.isPending ||
                            !form.title.trim() ||
                            !form.startDate
                        }
                        startIcon={
                            createEventMutation.isPending || updateEventMutation.isPending ? (
                                <CircularProgress size={14} color="inherit" />
                            ) : (
                                <AddIcon />
                            )
                        }
                        sx={{ px: 3, fontWeight: 700 }}
                    >
                        {createEventMutation.isPending || updateEventMutation.isPending
                            ? 'Saving...'
                            : editingEvent
                            ? 'Update Event'
                            : 'Add Event'}
                    </AppButton>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AcademicCalendar;
