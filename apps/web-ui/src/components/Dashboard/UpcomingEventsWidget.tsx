/**
 * UpcomingEventsWidget — Dashboard Event Gadget
 *
 * Automatically displays upcoming academic events, exams, holidays,
 * sports days, annual days, and meetings scheduled within the next 7 days.
 *
 * Role-aware, responsive on desktop and mobile, with direct calendar navigation.
 */

import React, { useMemo } from 'react';
import {
    Box,
    Typography,
    Paper,
    Chip,
    Skeleton,
} from '@mui/material';
import {
    CalendarMonth as CalendarIcon,
    ArrowForward as ArrowForwardIcon,
    LocationOnOutlined as LocationIcon,
    FestivalOutlined as HolidayIcon,
    AssignmentOutlined as ExamIcon,
    EventOutlined as EventIcon,
    SportsFootballOutlined as SportsIcon,
    CelebrationOutlined as CelebrationIcon,
    GroupsOutlined as ParentMeetingIcon,
    BadgeOutlined as StaffIcon,
} from '@mui/icons-material';
import {
    format,
    addDays,
    differenceInCalendarDays,
    parseISO,
    startOfToday,
} from 'date-fns';
import { useNavigate } from 'react-router-dom';
import TokenService from '../../queries/token/tokenService';
import { useGetCalendarEvents } from '../../queries/Calendar';
import type { CalendarEvent, CalendarEventType } from '../../types';

interface UpcomingEventsWidgetProps {
    /** Optional custom title */
    title?: string;
    /** Whether to hide the widget entirely when there are no events in next 7 days */
    hideWhenEmpty?: boolean;
    /** Custom calendar route override */
    calendarPath?: string;
}

const getCategoryConfig = (type: CalendarEventType | string) => {
    switch (type) {
        case 'holiday':
            return {
                label: 'Holiday',
                color: '#10b981',
                bg: '#ecfdf5',
                borderColor: '#a7f3d0',
                icon: <HolidayIcon sx={{ fontSize: 14 }} />,
            };
        case 'exam':
            return {
                label: 'Exam',
                color: '#ef4444',
                bg: '#fef2f2',
                borderColor: '#fecaca',
                icon: <ExamIcon sx={{ fontSize: 14 }} />,
            };
        case 'sports':
            return {
                label: 'Sports Day',
                color: '#f59e0b',
                bg: '#fffbeb',
                borderColor: '#fde68a',
                icon: <SportsIcon sx={{ fontSize: 14 }} />,
            };
        case 'annual_day':
            return {
                label: 'Annual Day',
                color: '#8b5cf6',
                bg: '#f5f3ff',
                borderColor: '#ddd6fe',
                icon: <CelebrationIcon sx={{ fontSize: 14 }} />,
            };
        case 'parent_meeting':
        case 'ptm':
            return {
                label: 'Parent Meeting',
                color: '#0d9488',
                bg: '#f0fdfa',
                borderColor: '#99f6e4',
                icon: <ParentMeetingIcon sx={{ fontSize: 14 }} />,
            };
        case 'staff_meeting':
            return {
                label: 'Staff Meeting',
                color: '#64748b',
                bg: '#f8fafc',
                borderColor: '#cbd5e1',
                icon: <StaffIcon sx={{ fontSize: 14 }} />,
            };
        default:
            return {
                label: 'Event',
                color: '#3b82f6',
                bg: '#eff6ff',
                borderColor: '#bfdbfe',
                icon: <EventIcon sx={{ fontSize: 14 }} />,
            };
    }
};

const getRelativeCountdown = (dateStr: string) => {
    const eventDate = parseISO(dateStr.slice(0, 10));
    const today = startOfToday();
    const diff = differenceInCalendarDays(eventDate, today);

    if (diff === 0) return { text: 'Today', color: '#ef4444', bg: '#fee2e2' };
    if (diff === 1) return { text: 'Tomorrow', color: '#f59e0b', bg: '#fef3c7' };
    if (diff > 1) return { text: `In ${diff} days`, color: '#3b82f6', bg: '#dbeafe' };
    return { text: 'Ongoing', color: '#10b981', bg: '#ecfdf5' };
};

export const UpcomingEventsWidget: React.FC<UpcomingEventsWidgetProps> = ({
    title = 'Upcoming Events This Week',
    hideWhenEmpty = true,
    calendarPath,
}) => {
    const schoolId = TokenService.getSchoolId() || '';
    const role = TokenService.getRole() || '';
    const navigate = useNavigate();

    // Default calendar path by role
    const resolvedCalendarPath = useMemo(() => {
        if (calendarPath) return calendarPath;
        if (role === 'teacher') return '/teacher/calendar';
        if (role === 'student') return '/student/calendar';
        if (role === 'parent') return '/parent/calendar';
        if (role === 'principal') return '/principal/calendar';
        return '/school-admin/calendar';
    }, [calendarPath, role]);

    const today = startOfToday();
    const next7Days = addDays(today, 7);
    const from = format(today, 'yyyy-MM-dd');
    const to = format(next7Days, 'yyyy-MM-dd');

    const { data, isLoading } = useGetCalendarEvents(schoolId, { from, to });
    const events: CalendarEvent[] = data?.data || [];

    // Filter events happening between today and next 7 days
    const upcomingEvents = useMemo(() => {
        const todayStr = format(today, 'yyyy-MM-dd');
        const endStr = format(next7Days, 'yyyy-MM-dd');

        return events.filter(e => {
            if (!e.startDate) return false;
            const startStr = typeof e.startDate === 'string' && e.startDate.length >= 10
                ? e.startDate.slice(0, 10)
                : format(new Date(e.startDate), 'yyyy-MM-dd');
            const eStr = e.endDate
                ? (typeof e.endDate === 'string' && e.endDate.length >= 10 ? e.endDate.slice(0, 10) : format(new Date(e.endDate), 'yyyy-MM-dd'))
                : startStr;

            return (startStr >= todayStr && startStr <= endStr) || (startStr <= todayStr && eStr >= todayStr);
        }).slice(0, 6);
    }, [events, today, next7Days]);

    if (isLoading) {
        return (
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 1.5, sm: 2 },
                    borderRadius: 2.5,
                    border: '1px solid #e2e8f0',
                    bgcolor: '#ffffff',
                    mb: { xs: 2, sm: 2.5 },
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <Skeleton variant="circular" width={28} height={28} />
                    <Skeleton variant="text" width={180} height={24} />
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 1.5 }}>
                    <Skeleton variant="rectangular" height={70} sx={{ borderRadius: 2 }} />
                    <Skeleton variant="rectangular" height={70} sx={{ borderRadius: 2 }} />
                </Box>
            </Paper>
        );
    }

    if (upcomingEvents.length === 0) {
        if (hideWhenEmpty) return null;

        return (
            <Paper
                elevation={0}
                sx={{
                    p: 2,
                    borderRadius: 2.5,
                    border: '1px solid #e2e8f0',
                    bgcolor: '#ffffff',
                    mb: { xs: 2, sm: 2.5 },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ p: 0.75, borderRadius: 2, bgcolor: '#f1f5f9', color: '#64748b' }}>
                        <CalendarIcon sx={{ fontSize: 20 }} />
                    </Box>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                        No school events or exams scheduled for the next 7 days.
                    </Typography>
                </Box>
                <Typography
                    component="button"
                    onClick={() => navigate(resolvedCalendarPath)}
                    sx={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: '#2563eb',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        '&:hover': { textDecoration: 'underline' },
                    }}
                >
                    View Calendar <ArrowForwardIcon sx={{ fontSize: 14 }} />
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper
            elevation={0}
            sx={{
                p: { xs: 1.75, sm: 2 },
                borderRadius: 2.5,
                border: '1px solid #e2e8f0',
                bgcolor: '#ffffff',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
                mb: { xs: 2, sm: 2.5 },
                transition: 'border-color 0.2s',
                '&:hover': { borderColor: '#cbd5e1' },
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 1.5,
                    flexWrap: 'wrap',
                    gap: 1,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <Box
                        sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '8px',
                            bgcolor: '#eff6ff',
                            color: '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <CalendarIcon sx={{ fontSize: 18 }} />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                            variant="subtitle2"
                            fontWeight={800}
                            sx={{ color: '#0f172a', fontSize: { xs: '0.9rem', sm: '0.95rem' } }}
                        >
                            {title}
                        </Typography>
                        <Chip
                            label={`${upcomingEvents.length} upcoming`}
                            size="small"
                            sx={{
                                height: 20,
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                bgcolor: '#f1f5f9',
                                color: '#475569',
                            }}
                        />
                    </Box>
                </Box>

                <Box
                    component="button"
                    onClick={() => navigate(resolvedCalendarPath)}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        background: 'none',
                        border: 'none',
                        color: '#2563eb',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        p: 0.5,
                        borderRadius: 1,
                        transition: 'gap 0.15s',
                        '&:hover': {
                            color: '#1d4ed8',
                            gap: 0.8,
                        },
                    }}
                >
                    View Full Calendar <ArrowForwardIcon sx={{ fontSize: 14 }} />
                </Box>
            </Box>

            {/* Grid of Events */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        sm: upcomingEvents.length === 1 ? '1fr' : 'repeat(2, 1fr)',
                        md: upcomingEvents.length <= 2 ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(280px, 1fr))',
                    },
                    gap: 1.25,
                }}
            >
                {upcomingEvents.map((ev, i) => {
                    const cat = getCategoryConfig(ev.eventType);
                    const countdown = getRelativeCountdown(ev.startDate);
                    const dateObj = typeof ev.startDate === 'string' ? parseISO(ev.startDate) : new Date(ev.startDate);
                    const monthText = format(dateObj, 'MMM').toUpperCase();
                    const dayNum = format(dateObj, 'd');
                    const dayName = format(dateObj, 'EEE');

                    return (
                        <Box
                            key={i}
                            onClick={() => navigate(resolvedCalendarPath)}
                            sx={{
                                p: 1.25,
                                borderRadius: 2,
                                bgcolor: '#f8fafc',
                                border: '1px solid #f1f5f9',
                                borderLeft: `3px solid ${cat.color}`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                '&:hover': {
                                    bgcolor: '#ffffff',
                                    borderColor: '#e2e8f0',
                                    borderLeftColor: cat.color,
                                    transform: 'translateY(-1px)',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
                                },
                            }}
                        >
                            {/* Date Badge */}
                            <Box
                                sx={{
                                    minWidth: 44,
                                    height: 48,
                                    borderRadius: '8px',
                                    bgcolor: '#ffffff',
                                    border: '1px solid #e2e8f0',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontSize: '0.6rem',
                                        fontWeight: 800,
                                        color: cat.color,
                                        lineHeight: 1,
                                        letterSpacing: '0.04em',
                                    }}
                                >
                                    {monthText}
                                </Typography>
                                <Typography
                                    sx={{
                                        fontSize: '1rem',
                                        fontWeight: 900,
                                        color: '#0f172a',
                                        lineHeight: 1.1,
                                    }}
                                >
                                    {dayNum}
                                </Typography>
                            </Box>

                            {/* Info */}
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                                {/* Category & Countdown Tags */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, flexWrap: 'wrap', mb: 0.3 }}>
                                    <Chip
                                        icon={cat.icon as any}
                                        label={cat.label}
                                        size="small"
                                        sx={{
                                            height: 18,
                                            fontSize: '0.62rem',
                                            fontWeight: 700,
                                            bgcolor: cat.bg,
                                            color: cat.color,
                                            border: `1px solid ${cat.borderColor}`,
                                            '& .MuiChip-icon': { color: cat.color, ml: 0.3 },
                                        }}
                                    />
                                    <Chip
                                        label={countdown.text}
                                        size="small"
                                        sx={{
                                            height: 18,
                                            fontSize: '0.62rem',
                                            fontWeight: 700,
                                            bgcolor: countdown.bg,
                                            color: countdown.color,
                                        }}
                                    />
                                </Box>

                                {/* Event Title */}
                                <Typography
                                    fontWeight={700}
                                    sx={{
                                        fontSize: '0.84rem',
                                        color: '#0f172a',
                                        lineHeight: 1.25,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {ev.title}
                                </Typography>

                                {/* Subtitle / Venue / Day */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.2 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ fontSize: '0.72rem' }}>
                                        {dayName}
                                    </Typography>
                                    {ev.venue && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                            <LocationIcon sx={{ fontSize: 11, color: 'text.secondary' }} />
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                fontWeight={500}
                                                sx={{
                                                    fontSize: '0.7rem',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    maxWidth: 130,
                                                }}
                                            >
                                                {ev.venue}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        </Paper>
    );
};

export default UpcomingEventsWidget;
