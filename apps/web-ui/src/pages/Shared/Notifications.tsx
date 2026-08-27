import React, { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Chip,
    Alert,
    Skeleton,
    Tabs,
    Tab,
    Button,
    Divider,
    IconButton,
    Pagination,
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
            return <ChatIcon sx={{ color: '#6366f1' }} />;
        default:
            return <NotificationsIcon color="action" />;
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
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between', 
                alignItems: { xs: 'stretch', sm: 'center' }, 
                mb: 3,
                gap: 2
            }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <NotificationsIcon color="primary" />
                        <Typography variant="h4" fontWeight={600} sx={{ fontSize: { xs: '1.4rem', sm: '2.125rem' } }}>
                            Notifications
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        Stay updated with school activities
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={<BugReportIcon />}
                        onClick={() => setDiagOpen(true)}
                        sx={{ 
                            borderRadius: 2.5,
                            height: 42,
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
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<MarkReadIcon />}
                        onClick={() => markAllAsRead.mutate()}
                        disabled={markAllAsRead.isPending}
                        sx={{ 
                            borderRadius: 2.5,
                            height: 42,
                            px: 2.5,
                            fontWeight: 700,
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

            {/* Push Diagnostics and Test Dialog */}
            <PushDiagnosticsDialog open={diagOpen} onClose={() => setDiagOpen(false)} />

            {isMobile ? (
                <Box sx={{ mb: 3 }}>
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
                <Tabs value={tabValue} onChange={(_, v) => { setTabValue(v); setPage(1); }} sx={{ mb: 3 }}>
                    <Tab label="All" />
                    <Tab label="Read" />
                    <Tab label="Unread" />
                </Tabs>
            )}

            <Card>
                {isLoading ? (
                    <CardContent>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Box key={i} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                <Skeleton variant="circular" width={40} height={40} />
                                <Box sx={{ flex: 1 }}>
                                    <Skeleton variant="text" width="60%" />
                                    <Skeleton variant="text" width="80%" />
                                </Box>
                            </Box>
                        ))}
                    </CardContent>
                ) : notifications.length === 0 ? (
                    <CardContent sx={{ textAlign: 'center', py: 6 }}>
                        <NotificationsIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                            No notifications
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            You're all caught up!
                        </Typography>
                    </CardContent>
                ) : (
                    <List disablePadding>
                        {notifications.map((notification: Notification, index: number) => (
                            <React.Fragment key={notification.notificationId}>
                                <ListItem
                                    sx={{
                                        bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                                        cursor: 'pointer',
                                        '&:hover': { bgcolor: 'action.selected' },
                                    }}
                                    onClick={() => handleNotificationClick(notification)}
                                    secondaryAction={
                                        <Box>
                                            {!notification.isRead && (
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleMarkRead(notification.notificationId);
                                                    }}
                                                    disabled={markAsRead.isPending}
                                                >
                                                    <MarkReadIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(notification.notificationId);
                                                }}
                                                disabled={deleteNotification.isPending}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    }
                                >
                                    <ListItemIcon>
                                        {getNotificationIcon(notification.type)}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography fontWeight={notification.isRead ? 400 : 600}>
                                                    {notification.title}
                                                </Typography>
                                                <Chip
                                                    size="small"
                                                    label={notification.type.replace('_', ' ')}
                                                    variant="outlined"
                                                    sx={{ height: 20 }}
                                                />
                                            </Box>
                                        }
                                        secondary={
                                            <Box>
                                                <Typography variant="body2" color="text.secondary">
                                                    {notification.message}
                                                </Typography>
                                                <Typography variant="caption" color="text.disabled">
                                                    {formatTime(notification.createdAt)}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                </ListItem>
                                {index < notifications.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </Card>

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
