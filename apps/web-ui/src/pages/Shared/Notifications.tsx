import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Chip,
    Alert,
    Skeleton,
    Tabs,
    Tab,
    Button,
    IconButton,
    Pagination,
    Tooltip,
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    Assignment as AssignmentIcon,
    EventNote as EventNoteIcon,
    Announcement as AnnouncementIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
    School as SchoolIcon,
    Delete as DeleteIcon,
    MarkEmailRead as MarkReadIcon,
    Chat as ChatIcon,
    BugReport as BugReportIcon,
    Campaign as CampaignIcon,
    AccessTime as AccessTimeIcon,
    DirectionsBus as TransportIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useGetMyNotifications, useMarkAsRead, useMarkAllAsRead, useDeleteNotification } from '../../queries/Notification';
import TokenService from '../../queries/token/tokenService';
import { useUrlTab } from '../../hooks/useUrlTab';
import { useIsMobile } from '../../hooks/useIsMobile';
import MobileSegmentedTabs from '../../components/mobile/navigation/MobileSegmentedTabs';
import PushNotificationBanner from '../../components/Notification/PushNotificationBanner';
import PushDiagnosticsDialog from '../../components/Notification/PushDiagnosticsDialog';
import type { Notification, NotificationType } from '../../types';

const getNotificationVisuals = (type: NotificationType | string) => {
    switch (type) {
        case 'absence_alert':
            return {
                icon: <WarningIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />,
                bg: '#fef2f2',
                color: '#dc2626',
                border: '#fca5a5',
                shadow: 'rgba(239, 68, 68, 0.25)',
                label: 'Absence Alert',
                chipBg: '#fee2e2',
                chipColor: '#b91c1c',
                chipBorder: '#f87171',
            };
        case 'system_alert':
            return {
                icon: <CampaignIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />,
                bg: '#faf5ff',
                color: '#9333ea',
                border: '#d8b4fe',
                shadow: 'rgba(147, 51, 234, 0.25)',
                label: 'School Alert',
                chipBg: '#f3e8ff',
                chipColor: '#7e22ce',
                chipBorder: '#c084fc',
            };
        case 'announcement':
            return {
                icon: <AnnouncementIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />,
                bg: '#eff6ff',
                color: '#2563eb',
                border: '#bfdbfe',
                shadow: 'rgba(37, 99, 235, 0.25)',
                label: 'Announcement',
                chipBg: '#dbeafe',
                chipColor: '#1d4ed8',
                chipBorder: '#93c5fd',
            };
        case 'leave_status':
            return {
                icon: <CheckCircleIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />,
                bg: '#f0fdf4',
                color: '#16a34a',
                border: '#bbf7d0',
                shadow: 'rgba(22, 163, 74, 0.25)',
                label: 'Leave Update',
                chipBg: '#dcfce7',
                chipColor: '#15803d',
                chipBorder: '#86efac',
            };
        case 'homework_assigned':
        case 'homework_due':
            return {
                icon: <AssignmentIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />,
                bg: '#fffbeb',
                color: '#d97706',
                border: '#fde68a',
                shadow: 'rgba(217, 119, 6, 0.25)',
                label: 'Homework',
                chipBg: '#fef3c7',
                chipColor: '#b45309',
                chipBorder: '#fcd34d',
            };
        case 'exam_scheduled':
            return {
                icon: <EventNoteIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />,
                bg: '#eef2ff',
                color: '#4f46e5',
                border: '#c7d2fe',
                shadow: 'rgba(79, 70, 229, 0.25)',
                label: 'Exam',
                chipBg: '#e0e7ff',
                chipColor: '#4338ca',
                chipBorder: '#a5b4fc',
            };
        case 'result_published':
            return {
                icon: <SchoolIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />,
                bg: '#f0fdfa',
                color: '#0d9488',
                border: '#99f6e4',
                shadow: 'rgba(13, 148, 136, 0.25)',
                label: 'Result',
                chipBg: '#ccfbf1',
                chipColor: '#0f766e',
                chipBorder: '#5eead4',
            };
        case 'chat_invite':
        case 'chat_accepted':
            return {
                icon: <ChatIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />,
                bg: '#faf5ff',
                color: '#7c3aed',
                border: '#ddd6fe',
                shadow: 'rgba(124, 58, 237, 0.25)',
                label: 'Chat',
                chipBg: '#ede9fe',
                chipColor: '#6d28d9',
                chipBorder: '#c4b5fd',
            };
        case 'bus_departed':
        case 'child_picked':
        case 'child_dropped':
        case 'bus_reached_school':
        case 'bus_delayed':
        case 'transport_update':
            return {
                icon: <TransportIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />,
                bg: '#fff7ed',
                color: '#ea580c',
                border: '#fed7aa',
                shadow: 'rgba(234, 88, 12, 0.25)',
                label: 'Transport',
                chipBg: '#ffedd5',
                chipColor: '#c2410c',
                chipBorder: '#fdba74',
            };
        default:
            return {
                icon: <NotificationsIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />,
                bg: '#f8fafc',
                color: '#475569',
                border: '#cbd5e1',
                shadow: 'rgba(71, 85, 105, 0.25)',
                label: (type || 'Notice').replace(/_/g, ' '),
                chipBg: '#f1f5f9',
                chipColor: '#334155',
                chipBorder: '#cbd5e1',
            };
    }
};

const NotificationsPage: React.FC = () => {
    const isMobile = useIsMobile();
    const navigate = useNavigate();
    const schoolId = TokenService.getSchoolId() || '';
    const role = TokenService.getRole();

    const [tabValue, setTabValue] = useUrlTab(0, ['all', 'read', 'unread']);
    const [page, setPage] = useState(1);
    const [diagOpen, setDiagOpen] = useState(false);
    const limit = 20;

    const isReadFilter = tabValue === 1 ? true : tabValue === 2 ? false : undefined;

    const { data, isLoading, error, refetch } = useGetMyNotifications(schoolId, {
        isRead: isReadFilter,
        page,
        limit,
    });

    const markAsRead = useMarkAsRead(schoolId);
    const markAllAsRead = useMarkAllAsRead(schoolId);
    const deleteNotification = useDeleteNotification(schoolId);

    const notifications = data?.data || [];
    const pagination = data?.pagination;

    const handleMarkRead = async (notificationId: string) => {
        await markAsRead.mutateAsync(notificationId);
        refetch();
    };

    const handleDelete = async (notificationId: string) => {
        await deleteNotification.mutateAsync(notificationId);
        refetch();
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) {
            markAsRead.mutate(notification.notificationId);
        }

        const rolePrefix = role ? `/${role.toLowerCase().replace(/_/g, '-')}` : '';

        switch (notification.type) {
            case 'absence_alert':
                navigate(`${rolePrefix}/attendance`);
                break;
            case 'homework_assigned':
            case 'homework_due':
                navigate(`${rolePrefix}/homework`);
                break;
            case 'announcement':
                navigate(`${rolePrefix}/announcements`);
                break;
            case 'leave_status':
                navigate(`${rolePrefix}/leave`);
                break;
            case 'chat_invite':
            case 'chat_accepted':
                navigate(`${rolePrefix}/chat`);
                break;
            default:
                break;
        }
    };

    const formatTime = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (error) {
        return (
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
                <Alert severity="error">Failed to load notifications. Please try again later.</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 1000, mx: 'auto' }}>
            {/* Header section */}
            <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between', 
                alignItems: { xs: 'stretch', sm: 'center' }, 
                mb: 2.5,
                gap: 2
            }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Box sx={{ p: 0.8, borderRadius: 2, bgcolor: '#eff6ff', color: '#2563eb', display: 'flex' }}>
                            <NotificationsIcon sx={{ fontSize: 24 }} />
                        </Box>
                        <Typography variant="h5" fontWeight={800} sx={{ fontSize: { xs: '1.35rem', sm: '1.75rem' }, letterSpacing: '-0.02em', color: '#0f172a' }}>
                            Notifications
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, fontWeight: 500 }}>
                        Stay updated with real-time school announcements and alerts
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                    {(role === 'super_admin' || role === 'sch_admin') && (
                        <Button
                            variant="outlined"
                            color="secondary"
                            startIcon={<BugReportIcon />}
                            onClick={() => setDiagOpen(true)}
                            sx={{ 
                                borderRadius: 2.5,
                                height: 40,
                                px: 2,
                                fontWeight: 700,
                                fontSize: '0.825rem',
                                whiteSpace: 'nowrap',
                                textTransform: 'none',
                                flex: { xs: 1, sm: 'none' }
                            }}
                        >
                            Push Status & Test
                        </Button>
                    )}
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<MarkReadIcon />}
                        onClick={() => markAllAsRead.mutate()}
                        disabled={markAllAsRead.isPending || notifications.length === 0}
                        sx={{ 
                            borderRadius: 2.5,
                            height: 40,
                            px: 2.5,
                            fontWeight: 800,
                            fontSize: '0.84rem',
                            whiteSpace: 'nowrap',
                            textTransform: 'none',
                            boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
                            flex: { xs: 1, sm: 'none' }
                        }}
                    >
                        Mark All Read
                    </Button>
                </Box>
            </Box>

            {/* Push Notification Opt-in / Status Card */}
            <PushNotificationBanner />

            {/* Push Diagnostics and Test Dialog (Admins Only) */}
            {(role === 'super_admin' || role === 'sch_admin') && (
                <PushDiagnosticsDialog open={diagOpen} onClose={() => setDiagOpen(false)} />
            )}

            {/* Filter Tabs */}
            {isMobile ? (
                <Box sx={{ mb: 2.5 }}>
                    <MobileSegmentedTabs
                        options={[
                            { id: 'all', label: 'All' },
                            { id: 'read', label: 'Read' },
                            { id: 'unread', label: 'Unread' },
                        ]}
                        activeId={tabValue === 0 ? 'all' : tabValue === 1 ? 'read' : 'unread'}
                        onChange={(id) => {
                            const idx = id === 'all' ? 0 : id === 'read' ? 1 : 2;
                            setTabValue(idx);
                            setPage(1);
                        }}
                    />
                </Box>
            ) : (
                <Tabs 
                    value={tabValue} 
                    onChange={(_, v) => { setTabValue(v); setPage(1); }} 
                    sx={{ 
                        mb: 2.5,
                        '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', minWidth: 90, fontSize: '0.9rem' }
                    }}
                >
                    <Tab label="All" />
                    <Tab label="Read" />
                    <Tab label="Unread" />
                </Tabs>
            )}

            {/* Notification Cards List */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {isLoading ? (
                    [1, 2, 3, 4, 5].map((i) => (
                        <Paper key={i} elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e2e8f0' }}>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                <Skeleton variant="rounded" width={42} height={42} sx={{ borderRadius: 2 }} />
                                <Box sx={{ flex: 1 }}>
                                    <Skeleton variant="text" width="40%" height={24} />
                                    <Skeleton variant="text" width="85%" height={20} />
                                    <Skeleton variant="text" width="25%" height={16} />
                                </Box>
                            </Box>
                        </Paper>
                    ))
                ) : notifications.length === 0 ? (
                    <Paper elevation={0} sx={{ textAlign: 'center', py: 8, px: 2, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                        <Box sx={{ p: 2, width: 72, height: 72, borderRadius: '50%', bgcolor: '#f1f5f9', color: '#94a3b8', mx: 'auto', mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <NotificationsIcon sx={{ fontSize: 36 }} />
                        </Box>
                        <Typography variant="h6" fontWeight={700} color="#1e293b" sx={{ mb: 0.5 }}>
                            No notifications found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            You're all caught up! There are no {tabValue === 2 ? 'unread ' : tabValue === 1 ? 'read ' : ''}notifications.
                        </Typography>
                    </Paper>
                ) : (
                    notifications.map((notification: Notification) => {
                        const visual = getNotificationVisuals(notification.type);
                        const isUnread = !notification.isRead;

                        return (
                            <Paper
                                key={notification.notificationId}
                                elevation={0}
                                onClick={() => handleNotificationClick(notification)}
                                sx={{
                                    p: { xs: 1.75, sm: 2 },
                                    borderRadius: 3,
                                    position: 'relative',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    // UNREAD: Bright, vibrant highlight with bold blue border & soft glowing tint
                                    // READ: Clean, neutral crisp white
                                    bgcolor: isUnread ? '#f0f7ff' : '#ffffff',
                                    border: isUnread ? '1.5px solid #93c5fd' : '1px solid #e2e8f0',
                                    borderLeft: isUnread ? '5px solid #2563eb' : '4.5px solid #cbd5e1',
                                    boxShadow: isUnread
                                        ? '0 4px 16px rgba(37,99,235,0.08), 0 1px 3px rgba(37,99,235,0.04)'
                                        : '0 1px 3px rgba(0,0,0,0.03)',
                                    '&:hover': {
                                        transform: 'translateY(-1px)',
                                        bgcolor: isUnread ? '#e6f2ff' : '#f8fafc',
                                        boxShadow: isUnread
                                            ? '0 6px 20px rgba(37,99,235,0.14)'
                                            : '0 4px 12px rgba(0,0,0,0.06)',
                                    },
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 1.5, sm: 2 } }}>
                                    {/* Type Icon */}
                                    <Box
                                        sx={{
                                            width: { xs: 40, sm: 44 },
                                            height: { xs: 40, sm: 44 },
                                            borderRadius: 2.5,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                            bgcolor: visual.bg,
                                            color: visual.color,
                                            border: `1px solid ${visual.border}`,
                                            boxShadow: isUnread ? `0 2px 8px ${visual.shadow}` : 'none',
                                        }}
                                    >
                                        {visual.icon}
                                    </Box>

                                    {/* Content Body */}
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        {/* Header Row: Title, NEW Badge, and Category Chip */}
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                                                <Typography
                                                    sx={{
                                                        fontWeight: isUnread ? 800 : 600,
                                                        fontSize: { xs: '0.94rem', sm: '1.02rem' },
                                                        color: isUnread ? '#0f172a' : '#334155',
                                                        lineHeight: 1.35,
                                                    }}
                                                >
                                                    {notification.title}
                                                </Typography>

                                                {isUnread && (
                                                    <Chip
                                                        label="NEW"
                                                        size="small"
                                                        sx={{
                                                            height: 18,
                                                            fontSize: '0.62rem',
                                                            fontWeight: 900,
                                                            letterSpacing: '0.04em',
                                                            bgcolor: '#2563eb',
                                                            color: '#ffffff',
                                                            borderRadius: '6px',
                                                            px: 0.25,
                                                        }}
                                                    />
                                                )}
                                            </Box>

                                            <Chip
                                                label={visual.label}
                                                size="small"
                                                sx={{
                                                    height: 22,
                                                    fontSize: '0.7rem',
                                                    fontWeight: 700,
                                                    bgcolor: visual.chipBg,
                                                    color: visual.chipColor,
                                                    border: `1px solid ${visual.chipBorder}`,
                                                    borderRadius: '8px',
                                                }}
                                            />
                                        </Box>

                                        {/* Message Description */}
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: isUnread ? '#1e293b' : '#64748b',
                                                fontSize: { xs: '0.85rem', sm: '0.88rem' },
                                                fontWeight: isUnread ? 500 : 400,
                                                mb: 1.25,
                                                lineHeight: 1.45,
                                                wordBreak: 'break-word',
                                            }}
                                        >
                                            {notification.message}
                                        </Typography>

                                        {/* Footer Row: Timestamp & Actions */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <AccessTimeIcon sx={{ fontSize: 13, color: isUnread ? '#3b82f6' : '#94a3b8' }} />
                                                <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: isUnread ? 600 : 500, color: isUnread ? '#3b82f6' : '#94a3b8' }}>
                                                    {formatTime(notification.createdAt)}
                                                </Typography>
                                            </Box>

                                            {/* Action Buttons */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                {isUnread && (
                                                    <Tooltip title="Mark as read">
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleMarkRead(notification.notificationId);
                                                            }}
                                                            disabled={markAsRead.isPending}
                                                            sx={{
                                                                bgcolor: '#ffffff',
                                                                border: '1px solid #bfdbfe',
                                                                color: '#2563eb',
                                                                p: 0.6,
                                                                borderRadius: 2,
                                                                boxShadow: '0 1px 3px rgba(37,99,235,0.1)',
                                                                '&:hover': { bgcolor: '#eff6ff', color: '#1d4ed8' },
                                                            }}
                                                        >
                                                            <MarkReadIcon sx={{ fontSize: 17 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}

                                                <Tooltip title="Delete notification">
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(notification.notificationId);
                                                        }}
                                                        disabled={deleteNotification.isPending}
                                                        sx={{
                                                            bgcolor: '#ffffff',
                                                            border: '1px solid #fee2e2',
                                                            color: '#ef4444',
                                                            p: 0.6,
                                                            borderRadius: 2,
                                                            boxShadow: '0 1px 3px rgba(239,68,68,0.1)',
                                                            '&:hover': { bgcolor: '#fef2f2', color: '#dc2626' },
                                                        }}
                                                    >
                                                        <DeleteIcon sx={{ fontSize: 17 }} />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                            </Paper>
                        );
                    })
                )}
            </Box>

            {/* Pagination Controls */}
            {pagination && pagination.pages > 1 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', mt: 3, mb: 1, pb: { xs: 8, sm: 2 }, gap: 0.75 }}>
                    <Pagination
                        count={pagination.pages}
                        page={page}
                        onChange={(_, value) => setPage(value)}
                        color="primary"
                        shape="rounded"
                        size="small"
                        siblingCount={0}
                        boundaryCount={1}
                        sx={{
                            '& .MuiPagination-ul': {
                                flexWrap: 'nowrap',
                                justifyContent: 'center',
                            },
                            '& .MuiPaginationItem-root': {
                                minWidth: 30,
                                height: 30,
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                margin: '0 2px',
                                borderRadius: '8px',
                            },
                        }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                        Page {page} of {pagination.pages} ({pagination.total || 0} total)
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default NotificationsPage;
