import React, { useState, useEffect } from 'react';
import {
    Badge,
    IconButton,
    Popover,
    Box,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Button,
    Divider,
    Skeleton,
    Alert,
    CircularProgress,
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
    AccessTime as AccessTimeIcon,
    NotificationsActive as NotificationsActiveIcon,
    DirectionsBus as DirectionsBusIcon,
    Chat as ChatIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
    useGetUnreadCount,
    useGetMyNotifications,
    useMarkAsRead,
    useMarkAllAsRead,
    notificationKeys,
} from '../../queries/Notification';
import TokenService from '../../queries/token/tokenService';
import { notificationSocket } from '../../services/notificationSocket';
import { usePushNotification } from '../../hooks/usePushNotification';
import type { Notification, NotificationType } from '../../types';

const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
        case 'absence_alert':
            return <WarningIcon color="error" />;
        case 'leave_status':
            return <CheckCircleIcon color="success" />;
        case 'announcement':
            return <AnnouncementIcon color="primary" />;
        case 'homework_assigned':
        case 'homework_due':
            return <AssignmentIcon color="warning" />;
        case 'exam_scheduled':
            return <EventNoteIcon color="info" />;
        case 'result_published':
            return <SchoolIcon color="success" />;
        case 'chat_invite':
        case 'chat_accepted':
            return <ChatIcon color="primary" />;
        case 'bus_departed':
        case 'child_picked':
        case 'child_dropped':
        case 'bus_reached_school':
        case 'bus_delayed':
        case 'transport_update':
            return <DirectionsBusIcon color="secondary" />;
        default:
            return <NotificationsIcon color="action" />;
    }
};

const NotificationBell: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const schoolId = TokenService.getSchoolId() || '';
    const role = TokenService.getRole();

    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

    const { data: unreadData } = useGetUnreadCount(schoolId);
    const { data: notificationsData, isLoading: loadingNotifications } = useGetMyNotifications(schoolId, { limit: 5 });
    const markAsRead = useMarkAsRead(schoolId);
    const markAllAsRead = useMarkAllAsRead(schoolId);

    const { isSupported, permission, isSubscribed, isLoading: pushLoading, subscribe } = usePushNotification();

    const unreadCount = unreadData?.data?.unreadCount || 0;
    const notifications = notificationsData?.data || [];

    // Listen to real-time notification events from sm-notification-service
    useEffect(() => {
        const unsubscribeWs = notificationSocket.on('new_notification', () => {
            // Invalidate queries to refresh unread count and notification list immediately
            queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
            queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount(schoolId) });
        });

        return () => {
            unsubscribeWs();
        };
    }, [queryClient, schoolId]);

    const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleNotificationClick = (notification: Notification) => {
        // Mark as read
        if (!notification.isRead) {
            markAsRead.mutate(notification.notificationId);
        }

        // Navigate based on type
        let path = '';
        const prefix = role === 'parent' ? '/parent' : role === 'student' ? '/student' : role === 'teacher' ? '/teacher' : '/school-admin';

        switch (notification.type) {
            case 'announcement':
                path = `${prefix}/announcements`;
                break;
            case 'homework_assigned':
            case 'homework_due':
                path = `${prefix}/homework`;
                break;
            case 'absence_alert':
                path = role === 'parent' ? '/parent/attendance' : '/student/attendance';
                break;
            case 'leave_status':
                path = role === 'parent' ? '/parent/leave/history' : `${prefix}/leave/my`;
                break;
            case 'exam_scheduled':
                path = role === 'parent' ? '/parent/exam/schedule' : '/student/exam/schedule';
                break;
            case 'result_published':
                path = role === 'parent' ? '/parent/exam/results' : '/student/exam/results';
                break;
            case 'chat_invite':
            case 'chat_accepted':
                path = '/chat';
                break;
            case 'bus_departed':
            case 'child_picked':
            case 'child_dropped':
            case 'bus_reached_school':
            case 'bus_delayed':
            case 'transport_update':
                path = role === 'parent' ? '/parent/transport' : `${prefix}/transport`;
                break;
            default:
                path = `${prefix}/notifications`;
        }

        handleClose();
        navigate(path);
    };

    const handleMarkAllRead = () => {
        markAllAsRead.mutate();
    };

    const handleViewAll = () => {
        const prefix = role === 'parent' ? '/parent' : role === 'student' ? '/student' : role === 'teacher' ? '/teacher' : '/school-admin';
        handleClose();
        navigate(`${prefix}/notifications`);
    };

    const formatTime = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    const open = Boolean(anchorEl);

    return (
        <>
            <Tooltip title="Notifications">
                <IconButton
                    color="inherit"
                    onClick={handleOpen}
                    sx={{ ml: 1 }}
                    aria-label="notifications"
                >
                    <Badge badgeContent={unreadCount} color="error" max={99}>
                        <NotificationsIcon />
                    </Badge>
                </IconButton>
            </Tooltip>

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                PaperProps={{
                    sx: {
                        width: 360,
                        maxHeight: 520,
                        borderRadius: 2,
                        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                    },
                }}
            >
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight={600}>
                        Notifications
                    </Typography>
                    {unreadCount > 0 && (
                        <Button
                            size="small"
                            onClick={handleMarkAllRead}
                            disabled={markAllAsRead.isPending}
                        >
                            Mark all read
                        </Button>
                    )}
                </Box>

                {/* Push Notification Opt-in Prompt Banner */}
                {isSupported && (!isSubscribed || permission !== 'granted') && permission !== 'denied' && (
                    <Box sx={{ px: 2, pb: 1.5 }}>
                        <Alert
                            severity="info"
                            icon={<NotificationsActiveIcon fontSize="small" />}
                            sx={{
                                py: 0.5,
                                px: 1.5,
                                fontSize: '0.8125rem',
                                '& .MuiAlert-message': { width: '100%' },
                            }}
                            action={
                                <Button
                                    size="small"
                                    variant="contained"
                                    color="primary"
                                    disabled={pushLoading}
                                    onClick={subscribe}
                                    sx={{ textTransform: 'none', py: 0.25, px: 1, minWidth: 'auto', fontSize: '0.75rem' }}
                                >
                                    {pushLoading ? <CircularProgress size={14} color="inherit" /> : 'Enable'}
                                </Button>
                            }
                        >
                            Enable push notifications for instant alerts
                        </Alert>
                    </Box>
                )}

                <Divider />

                {loadingNotifications ? (
                    <Box sx={{ p: 2 }}>
                        {[1, 2, 3].map((i) => (
                            <Box key={i} sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                <Skeleton variant="circular" width={40} height={40} />
                                <Box sx={{ flex: 1 }}>
                                    <Skeleton variant="text" width="80%" />
                                    <Skeleton variant="text" width="60%" />
                                </Box>
                            </Box>
                        ))}
                    </Box>
                ) : notifications.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <NotificationsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                        <Typography color="text.secondary">
                            No notifications yet
                        </Typography>
                    </Box>
                ) : (
                    <List sx={{ p: 0, maxHeight: 320, overflowY: 'auto' }}>
                        {notifications.map((notification: Notification) => (
                            <ListItem
                                key={notification.notificationId}
                                onClick={() => handleNotificationClick(notification)}
                                sx={{
                                    cursor: 'pointer',
                                    bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                                    '&:hover': {
                                        bgcolor: 'action.selected',
                                    },
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    {getNotificationIcon(notification.type)}
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Typography
                                            variant="body2"
                                            fontWeight={notification.isRead ? 400 : 600}
                                            noWrap
                                        >
                                            {notification.title}
                                        </Typography>
                                    }
                                    secondary={
                                        <Box>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                {notification.message}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                                <AccessTimeIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                                                <Typography variant="caption" color="text.disabled">
                                                    {formatTime(notification.createdAt)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                )}

                <Divider />

                <Box sx={{ p: 1.5, textAlign: 'center' }}>
                    <Button
                        fullWidth
                        variant="text"
                        onClick={handleViewAll}
                    >
                        View All Notifications
                    </Button>
                </Box>
            </Popover>
        </>
    );
};

export default NotificationBell;
