import React, { useState } from "react";
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
  Skeleton,
  Tabs,
  Tab,
  Button,
  Divider,
  IconButton,
  Pagination,
  alpha,
  useTheme,
} from "@mui/material";
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
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import {
  useGetMyNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification
} from "../../../queries/Notification";
import TokenService from "../../../queries/token/tokenService";
import { useUrlTab } from "../../../hooks/useUrlTab";
import { useIsMobile } from "../../../hooks/useIsMobile";
import MobileSegmentedTabs from "../../../components/mobile/navigation/MobileSegmentedTabs";
import ConfirmationDialog from "../../../components/Dialogs/ConfirmationDialog";
import type { Notification, NotificationType } from "../../../types";

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case "absence_alert":
      return <WarningIcon color="error" />;
    case "leave_status":
      return <CheckCircleIcon color="success" />;
    case "announcement":
      return <AnnouncementIcon color="primary" />;
    case "homework_assigned":
    case "homework_due":
      return <AssignmentIcon color="warning" />;
    case "exam_scheduled":
      return <EventNoteIcon color="info" />;
    case "result_published":
      return <SchoolIcon color="success" />;
    default:
      return <NotificationsIcon color="action" />;
  }
};

const NotificationsTab: React.FC = () => {
  const theme = useTheme();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const schoolId = TokenService.getSchoolId() || "";

  const [tabValue, setTabValue] = useUrlTab(0, ['all', 'read', 'unread'], 'filter');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const limit = 10;

  const isReadFilter = tabValue === 1 ? true : tabValue === 2 ? false : undefined;

  const { data, isLoading, refetch } = useGetMyNotifications(schoolId, {
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

  const confirmDelete = async () => {
    if (deleteId) {
      await deleteNotification.mutateAsync(deleteId);
      setDeleteId(null);
      refetch();
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead.mutate(notification.notificationId);
    }

    let path = "";
    const prefix = "/school-admin";

    switch (notification.type) {
      case "announcement":
        path = `${prefix}/announcements`;
        break;
      case "leave_status":
        path = `${prefix}/leaverequest`;
        break;
      default:
        return;
    }

    if (path) navigate(path);
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Box>
      <Box sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        justifyContent: "space-between",
        alignItems: { xs: "stretch", sm: "center" },
        mb: 3,
        gap: 2
      }}>
        {isMobile ? (
          <MobileSegmentedTabs
            options={[
              { id: 'all', label: 'All Alerts' },
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
        ) : (
          <Tabs
            value={tabValue}
            onChange={(_, v) => { setTabValue(v); setPage(1); }}
            sx={{
              "& .MuiTab-root": {
                fontWeight: 600,
                textTransform: "none",
                minWidth: 100,
              }
            }}
          >
            <Tab label="All Alerts" />
            <Tab label="Read" />
            <Tab label="Unread" />
          </Tabs>
        )}

        <Button
          variant="contained"
          color="primary"
          startIcon={<MarkReadIcon />}
          onClick={() => markAllAsRead.mutate()}
          disabled={markAllAsRead.isPending || notifications.length === 0}
          sx={{
            borderRadius: 2.5,
            height: 42,
            px: 2.5,
            fontWeight: 700,
            whiteSpace: "nowrap",
            alignSelf: { xs: "stretch", sm: "auto" }
          }}
        >
          Mark All Read
        </Button>
      </Box>

      <Card sx={{ borderRadius: 2, boxShadow: theme.shadows[1], overflow: "hidden" }}>
        {isLoading ? (
          <CardContent>
            {[1, 2, 3, 4, 5].map((i) => (
              <Box key={i} sx={{ display: "flex", gap: 2, mb: 3 }}>
                <Skeleton variant="circular" width={44} height={44} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="40%" height={24} />
                  <Skeleton variant="text" width="70%" />
                </Box>
              </Box>
            ))}
          </CardContent>
        ) : notifications.length === 0 ? (
          <CardContent sx={{ textAlign: "center", py: 10 }}>
            <Box sx={{
              width: 80, height: 80, borderRadius: "50%",
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto", mb: 2
            }}>
              <NotificationsIcon sx={{ fontSize: 40, color: "text.disabled" }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary" }}>
              All Caught Up!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No system notifications to display at this time.
            </Typography>
          </CardContent>
        ) : (
          <List disablePadding>
            {notifications.map((notification: Notification, index: number) => (
              <React.Fragment key={notification.notificationId}>
                <ListItem
                  sx={{
                    px: 3, py: 2.5,
                    bgcolor: notification.isRead ? "transparent" : alpha(theme.palette.primary.main, 0.02),
                    cursor: "pointer",
                    transition: "all 0.2s",
                    "&:hover": { bgcolor: alpha(theme.palette.action.hover, 0.4) },
                    borderLeft: notification.isRead ? "4px solid transparent" : `4px solid ${theme.palette.primary.main}`,
                  }}
                  onClick={() => handleNotificationClick(notification)}
                  secondaryAction={
                    <Box sx={{ display: "flex", gap: 1 }}>
                      {!notification.isRead && (
                        <IconButton
                          size="small"
                          color="primary"
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
                          setDeleteId(notification.notificationId);
                        }}
                        disabled={deleteNotification.isPending}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemIcon sx={{ minWidth: 56 }}>
                    <Box sx={{
                      width: 44, height: 44, borderRadius: "12px",
                      bgcolor: alpha(theme.palette.background.default, 0.8),
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                    }}>
                      {getNotificationIcon(notification.type)}
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
                        <Typography sx={{ fontWeight: notification.isRead ? 600 : 700, fontSize: "1rem" }}>
                          {notification.title}
                        </Typography>
                        <Chip
                          size="small"
                          label={notification.type.replace("_", " ")}
                          variant="outlined"
                          sx={{
                            height: 20, fontSize: "0.65rem", fontWeight: 800,
                            textTransform: "uppercase",
                            borderColor: alpha(theme.palette.divider, 0.1),
                            bgcolor: alpha(theme.palette.background.paper, 0.5)
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" sx={{ color: "text.secondary", mb: 0.5, lineHeight: 1.5 }}>
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 500 }}>
                          {formatTime(notification.createdAt)}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {index < notifications.length - 1 && <Divider sx={{ mx: 3, opacity: 0.5 }} />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Card>

      {pagination && ((pagination.pages || (pagination as any).totalPages || 1) > 1) && (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", mt: 3, mb: 1, pb: { xs: 8, sm: 2 }, gap: 0.75 }}>
          <Pagination
            count={pagination.pages || (pagination as any).totalPages || 1}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
            shape="rounded"
            size="small"
            siblingCount={0}
            boundaryCount={1}
            sx={{
              "& .MuiPagination-ul": {
                flexWrap: "nowrap",
                justifyContent: "center",
              },
              "& .MuiPaginationItem-root": {
                minWidth: 30,
                height: 30,
                fontSize: "0.78rem",
                fontWeight: 600,
                margin: "0 2px",
                borderRadius: "8px",
              }
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem", fontWeight: 500 }}>
            Page {page} of {pagination.pages || (pagination as any).totalPages || 1} ({pagination.total || 0} total)
          </Typography>
        </Box>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Notification"
        description="Are you sure you want to permanently delete this notification? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteNotification.isPending}
      />
    </Box>
  );
};

export default NotificationsTab;
