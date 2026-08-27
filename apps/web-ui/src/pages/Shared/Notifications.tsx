import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
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
    DeleteOutline as DeleteIcon,
    MarkEmailReadOutlined as MarkReadIcon,
    Chat as ChatIcon,
    BugReport as BugReportIcon,
    Campaign as CampaignIcon,
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
                icon: <WarningIcon sx={{ fontSize: 20, color: '#dc2626' }} />,
                bg: '#fef2f2',
                label: 'Absence Alert',
                chipColor: '#dc2626',
            };
        case 'system_alert':
            return {
                icon: <CampaignIcon sx={{ fontSize: 20, color: '#9333ea' }} />,
                bg: '#faf5ff',
                label: 'School Alert',
                chipColor: '#9333ea',
            };
        case 'announcement':
            return {
                icon: <AnnouncementIcon sx={{ fontSize: 20, color: '#2563eb' }} />,
                bg: '#eff6ff',
                label: 'Announcement',
                chipColor: '#2563eb',
            };
        case 'leave_status':
            return {
                icon: <CheckCircleIcon sx={{ fontSize: 20, color: '#16a34a' }} />,
                bg: '#f0fdf4',
                label: 'Leave Update',
                chipColor: '#16a34a',
            };
        case 'homework_assigned':
        case 'homework_due':
            return {
                icon: <AssignmentIcon sx={{ fontSize: 20, color: '#d97706' }} />,
                bg: '#fffbeb',
                label: 'Homework',
                chipColor: '#d97706',
            };
        case 'exam_scheduled':
            return {
                icon: <EventNoteIcon sx={{ fontSize: 20, color: '#4f46e5' }} />,
                bg: '#eef2ff',
                label: 'Exam',
                chipColor: '#4f46e5',
            };
        case 'result_published':
            return {
                icon: <SchoolIcon sx={{ fontSize: 20, color: '#0d9488' }} />,
                bg: '#f0fdfa',
                label: 'Result',
                chipColor: '#0d9488',
            };
        case 'chat_invite':
        case 'chat_accepted':
            return {
                icon: <ChatIcon sx={{ fontSize: 20, color: '#7c3aed' }} />,
                bg: '#faf5ff',
                label: 'Chat',
                chipColor: '#7c3aed',
            };
        case 'bus_departed':
        case 'child_picked':
        case 'child_dropped':
        case 'bus_reached_school':
        case 'bus_delayed':
        case 'transport_update':
            return {
                icon: <TransportIcon sx={{ fontSize: 20, color: '#ea580c' }} />,
                bg: '#fff7ed',
                label: 'Transport',
                chipColor: '#ea580c',
            };
        default:
            return {
                icon: <NotificationsIcon sx={{ fontSize: 20, color: '#64748b' }} />,
                bg: '#f8fafc',
                label: (type || 'Notice').replace(/_/g, ' '),
                chipColor: '#64748b',
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
        <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 900, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between', 
                alignItems: { xs: 'stretch', sm: 'center' }, 
                mb: 2.5,
                gap: 2
            }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <NotificationsIcon color="primary" sx={{ fontSize: 24 }} />
                        <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: '1.3rem', sm: '1.6rem' }, color: '#0f172a' }}>
                            Notifications
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                        Stay updated with school activities and alerts
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                    {(role === 'super_admin' || role === 'sch_admin') && (
                        <Button
                            variant="outlined"
                            color="secondary"
                            startIcon={<BugReportIcon />}
                            onClick={() => setDiagOpen(true)}
                            size="small"
                            sx={{ 
                                borderRadius: 2,
                                height: 36,
                                px: 1.5,
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                whiteSpace: 'nowrap',
                                textTransform: 'none',
                                flex: { xs: 1, sm: 'none' }
                            }}
                        >
                            Push Diagnostics
                        </Button>
                    )}
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<MarkReadIcon />}
                        onClick={() => markAllAsRead.mutate()}
                        disabled={markAllAsRead.isPending || notifications.length === 0}
                        size="small"
                        sx={{ 
                            borderRadius: 2,
                            height: 36,
                            px: 2,
                            fontWeight: 600,
                            fontSize: '0.825rem',
                            whiteSpace: 'nowrap',
                            textTransform: 'none',
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
                <Box sx={{ mb: 2 }}>
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
                        mb: 2,
                        minHeight: 40,
                        '& .MuiTab-root': { fontWeight: 600, textTransform: 'none', minWidth: 80, fontSize: '0.875rem', minHeight: 40, py: 0.5 }
                    }}
                >
                    <Tab label="All" />
                    <Tab label="Read" />
                    <Tab label="Unread" />
                </Tabs>
            )}

            {/* Notification Cards List */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {isLoading ? (
                    [1, 2, 3, 4, 5].map((i) => (
                        <Paper key={i} elevation={0} sx={{ p: 1.75, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                <Skeleton variant="rounded" width={36} height={36} sx={{ borderRadius: 1.5 }} />
                                <Box sx={{ flex: 1 }}>
                                    <Skeleton variant="text" width="40%" height={20} />
                                    <Skeleton variant="text" width="80%" height={18} />
                                    <Skeleton variant="text" width="20%" height={14} />
                                </Box>
                            </Box>
                        </Paper>
                    ))
                ) : notifications.length === 0 ? (
                    <Paper elevation={0} sx={{ textAlign: 'center', py: 6, px: 2, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                        <NotificationsIcon sx={{ fontSize: 36, color: '#94a3b8', mb: 1 }} />
                        <Typography variant="subtitle1" fontWeight={600} color="#1e293b">
                            No notifications found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            You're all caught up!
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
                                    p: { xs: 1.5, sm: 1.75 },
                                    borderRadius: 2,
                                    cursor: 'pointer',
                                    bgcolor: isUnread ? '#f8faff' : '#ffffff',
                                    border: '1px solid',
                                    borderColor: isUnread ? '#bfdbfe' : '#e2e8f0',
                                    transition: 'background-color 0.15s ease, border-color 0.15s ease',
                                    '&:hover': {
                                        bgcolor: isUnread ? '#f1f5f9' : '#f8fafc',
                                        borderColor: '#cbd5e1',
                                    },
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                    {/* Icon */}
                                    <Box
                                        sx={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: 1.5,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                            bgcolor: visual.bg,
                                        }}
                                    >
                                        {visual.icon}
                                    </Box>

                                    {/* Content Body */}
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        {/* Header Row: Title & Category */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 0.25 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0, flex: 1 }}>
                                                {isUnread && (
                                                    <Box
                                                        sx={{
                                                            width: 6,
                                                            height: 6,
                                                            borderRadius: '50%',
                                                            bgcolor: '#2563eb',
                                                            flexShrink: 0,
                                                        }}
                                                    />
                                                )}
                                                <Typography
                                                    noWrap
                                                    sx={{
                                                        fontWeight: isUnread ? 700 : 500,
                                                        fontSize: { xs: '0.88rem', sm: '0.94rem' },
                                                        color: isUnread ? '#0f172a' : '#475569',
                                                    }}
                                                >
                                                    {notification.title}
                                                </Typography>
                                            </Box>

                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    fontSize: '0.7rem',
                                                    fontWeight: 600,
                                                    color: visual.chipColor,
                                                    bgcolor: visual.bg,
                                                    px: 0.85,
                                                    py: 0.2,
                                                    borderRadius: 1,
                                                    whiteSpace: 'nowrap',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {visual.label}
                                            </Typography>
                                        </Box>

                                        {/* Message Description */}
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: isUnread ? '#334155' : '#64748b',
                                                fontSize: '0.825rem',
                                                lineHeight: 1.4,
                                                mb: 0.75,
                                                wordBreak: 'break-word',
                                            }}
                                        >
                                            {notification.message}
                                        </Typography>

                                        {/* Footer Row: Timestamp & Actions */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                            <Typography variant="caption" sx={{ fontSize: '0.725rem', color: '#94a3b8' }}>
                                                {formatTime(notification.createdAt)}
                                            </Typography>

                                            {/* Action Buttons */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                                                {isUnread && (
                                                    <Tooltip title="Mark as read">
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleMarkRead(notification.notificationId);
                                                            }}
                                                            disabled={markAsRead.isPending}
                                                            sx={{ color: '#64748b', p: 0.5, '&:hover': { color: '#2563eb' } }}
                                                        >
                                                            <MarkReadIcon sx={{ fontSize: 17 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}

                                                <Tooltip title="Delete">
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(notification.notificationId);
                                                        }}
                                                        disabled={deleteNotification.isPending}
                                                        sx={{ color: '#94a3b8', p: 0.5, '&:hover': { color: '#ef4444' } }}
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
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', mt: 3, mb: 1, pb: { xs: 8, sm: 2 }, gap: 0.5 }}>
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
                                minWidth: 28,
                                height: 28,
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                margin: '0 2px',
                                borderRadius: '6px',
                            },
                        }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                        Page {page} of {pagination.pages} ({pagination.total || 0} total)
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default NotificationsPage;
