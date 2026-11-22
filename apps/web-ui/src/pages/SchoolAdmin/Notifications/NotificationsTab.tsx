import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Skeleton,
  Tabs,
  Tab,
  Button,
  IconButton,
  Pagination,
  Tooltip,
  TextField,
  MenuItem,
  InputAdornment,
  Chip,
  useTheme,
  alpha,
} from "@mui/material";
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
  Campaign as CampaignIcon,
  DirectionsBus as TransportIcon,
  BugReport as BugReportIcon,
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
  Close as CloseIcon,
  RestartAlt as ResetIcon,
  FilterList as FilterIcon,
} from "@mui/icons-material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { useNavigate } from "react-router-dom";
import {
  useGetMyNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from "../../../queries/Notification";
import TokenService from "../../../queries/token/tokenService";
import { useUrlTab } from "../../../hooks/useUrlTab";
import { useIsMobile } from "../../../hooks/useIsMobile";
import MobileSegmentedTabs from "../../../components/mobile/navigation/MobileSegmentedTabs";
import ConfirmationDialog from "../../../components/Dialogs/ConfirmationDialog";
import PushNotificationBanner from "../../../components/Notification/PushNotificationBanner";
import PushDiagnosticsDialog from "../../../components/Notification/PushDiagnosticsDialog";
import type { Notification, NotificationType, NotificationFilters } from "../../../types";

type DatePreset = "all" | "today" | "this_week" | "this_month" | "custom";

const getNotificationVisuals = (type: NotificationType | string) => {
  switch (type) {
    case "absence_alert":
      return {
        icon: <WarningIcon sx={{ fontSize: 20, color: "#dc2626" }} />,
        bg: "#fef2f2",
        label: "Absence Alert",
        chipColor: "#dc2626",
      };
    case "system_alert":
      return {
        icon: <CampaignIcon sx={{ fontSize: 20, color: "#9333ea" }} />,
        bg: "#faf5ff",
        label: "School Alert",
        chipColor: "#9333ea",
      };
    case "announcement":
      return {
        icon: <AnnouncementIcon sx={{ fontSize: 20, color: "#059669" }} />,
        bg: "#ecfdf5",
        label: "Announcement",
        chipColor: "#059669",
      };
    case "leave_status":
      return {
        icon: <CheckCircleIcon sx={{ fontSize: 20, color: "#16a34a" }} />,
        bg: "#f0fdf4",
        label: "Leave Update",
        chipColor: "#16a34a",
      };
    case "homework_assigned":
    case "homework_due":
      return {
        icon: <AssignmentIcon sx={{ fontSize: 20, color: "#d97706" }} />,
        bg: "#fffbeb",
        label: "Homework",
        chipColor: "#d97706",
      };
    case "exam_scheduled":
      return {
        icon: <EventNoteIcon sx={{ fontSize: 20, color: "#4f46e5" }} />,
        bg: "#eef2ff",
        label: "Exam",
        chipColor: "#4f46e5",
      };
    case "result_published":
      return {
        icon: <SchoolIcon sx={{ fontSize: 20, color: "#0d9488" }} />,
        bg: "#f0fdfa",
        label: "Result",
        chipColor: "#0d9488",
      };
    case "chat_invite":
    case "chat_accepted":
      return {
        icon: <ChatIcon sx={{ fontSize: 20, color: "#7c3aed" }} />,
        bg: "#faf5ff",
        label: "Chat",
        chipColor: "#7c3aed",
      };
    case "bus_departed":
    case "child_picked":
    case "child_dropped":
    case "bus_reached_school":
    case "bus_delayed":
    case "transport_update":
      return {
        icon: <TransportIcon sx={{ fontSize: 20, color: "#ea580c" }} />,
        bg: "#fff7ed",
        label: "Transport",
        chipColor: "#ea580c",
      };
    default:
      return {
        icon: <NotificationsIcon sx={{ fontSize: 20, color: "#64748b" }} />,
        bg: "#f8fafc",
        label: (type || "Notice").replace(/_/g, " "),
        chipColor: "#64748b",
      };
  }
};

const NotificationsTab: React.FC = () => {
  const theme = useTheme();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const schoolId = TokenService.getSchoolId() || "";

  const [tabValue, setTabValue] = useUrlTab(0, ["all", "read", "unread"], "filter");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [diagOpen, setDiagOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const limit = 20;

  const isReadFilter = tabValue === 1 ? true : tabValue === 2 ? false : undefined;

  // Compute active date boundaries
  const dateRangeValues = useMemo(() => {
    const now = new Date();
    if (datePreset === "today") {
      const todayStr = now.toISOString().split("T")[0];
      return { start: todayStr, end: todayStr };
    }
    if (datePreset === "this_week") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diff));
      return {
        start: monday.toISOString().split("T")[0],
        end: new Date().toISOString().split("T")[0],
      };
    }
    if (datePreset === "this_month") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        start: firstDay.toISOString().split("T")[0],
        end: new Date().toISOString().split("T")[0],
      };
    }
    if (datePreset === "custom") {
      return {
        start: startDate ? startDate.toISOString().split("T")[0] : undefined,
        end: endDate ? endDate.toISOString().split("T")[0] : undefined,
      };
    }
    return { start: undefined, end: undefined };
  }, [datePreset, startDate, endDate]);

  const queryFilters: NotificationFilters = useMemo(
    () => ({
      isRead: isReadFilter,
      type: typeFilter !== "all" ? typeFilter : undefined,
      search: searchQuery.trim() || undefined,
      startDate: dateRangeValues.start,
      endDate: dateRangeValues.end,
      page,
      limit,
    }),
    [isReadFilter, typeFilter, searchQuery, dateRangeValues, page, limit]
  );

  const { data, isLoading, refetch } = useGetMyNotifications(schoolId, queryFilters);

  const handleResetFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
    setDatePreset("all");
    setStartDate(null);
    setEndDate(null);
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
      typeFilter !== "all" ||
      datePreset !== "all" ||
      startDate ||
      endDate
  );

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

    const prefix = "/school-admin";

    switch (notification.type) {
      case "absence_alert":
        navigate(`${prefix}/attendance`);
        break;
      case "announcement":
        navigate(`${prefix}/announcements`);
        break;
      case "leave_status":
        navigate(`${prefix}/leaverequest`);
        break;
      case "chat_invite":
      case "chat_accepted":
        navigate(`${prefix}/chat`);
        break;
      default:
        break;
    }
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
      {/* Push Notification Opt-in / Status Card */}
      <PushNotificationBanner />

      {/* Push Diagnostics and Test Dialog */}
      <PushDiagnosticsDialog open={diagOpen} onClose={() => setDiagOpen(false)} />

      {/* Filter Tabs & Header Actions */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "center" },
          mb: 2.5,
          gap: 2,
        }}
      >
        {isMobile ? (
          <Box sx={{ width: "100%" }}>
            <MobileSegmentedTabs
              options={[
                { id: "all", label: "All" },
                { id: "read", label: "Read" },
                { id: "unread", label: "Unread" },
              ]}
              activeId={tabValue === 0 ? "all" : tabValue === 1 ? "read" : "unread"}
              onChange={(id) => {
                const idx = id === "all" ? 0 : id === "read" ? 1 : 2;
                setTabValue(idx);
                setPage(1);
              }}
            />
          </Box>
        ) : (
          <Tabs
            value={tabValue}
            onChange={(_, v) => {
              setTabValue(v);
              setPage(1);
            }}
            sx={{
              minHeight: 40,
              "& .MuiTab-root": {
                fontWeight: 600,
                textTransform: "none",
                minWidth: 80,
                fontSize: "0.875rem",
                minHeight: 40,
                py: 0.5,
              },
            }}
          >
            <Tab label="All" />
            <Tab label="Read" />
            <Tab label="Unread" />
          </Tabs>
        )}

        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
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
              fontSize: "0.8rem",
              whiteSpace: "nowrap",
              textTransform: "none",
              flex: { xs: 1, sm: "none" },
            }}
          >
            Push Diagnostics
          </Button>
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
              fontSize: "0.825rem",
              whiteSpace: "nowrap",
              textTransform: "none",
              flex: { xs: 1, sm: "none" },
            }}
          >
            Mark All Read
          </Button>
        </Box>
      </Box>

      {/* Comprehensive Notification Filter Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2.5,
          borderRadius: 2.5,
          border: "1px solid",
          borderColor: theme.palette.divider,
          bgcolor: theme.palette.background.paper,
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "2fr 1fr 1fr",
            },
            gap: 1.5,
            alignItems: "center",
          }}
        >
          {/* Search Field */}
          <TextField
            size="small"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: theme.palette.text.secondary, fontSize: 18 }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSearchQuery("");
                      setPage(1);
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                bgcolor: theme.palette.background.default,
              },
            }}
          />

          {/* Notification Type Filter */}
          <TextField
            select
            size="small"
            label="Type"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FilterIcon sx={{ color: theme.palette.text.secondary, fontSize: 18 }} />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                bgcolor: theme.palette.background.default,
              },
            }}
          >
            <MenuItem value="all">All Types</MenuItem>
            <MenuItem value="absence_alert">Absence Alert</MenuItem>
            <MenuItem value="system_alert">School Alert</MenuItem>
            <MenuItem value="announcement">Announcement</MenuItem>
            <MenuItem value="leave_status">Leave Update</MenuItem>
            <MenuItem value="homework_assigned">Homework</MenuItem>
            <MenuItem value="exam_scheduled">Exam</MenuItem>
            <MenuItem value="result_published">Result</MenuItem>
            <MenuItem value="transport_update">Transport</MenuItem>
            <MenuItem value="chat_invite">Chat</MenuItem>
          </TextField>

          {/* Date Range Preset */}
          <TextField
            select
            size="small"
            label="Date Range"
            value={datePreset}
            onChange={(e) => {
              setDatePreset(e.target.value as DatePreset);
              setPage(1);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarIcon sx={{ color: theme.palette.text.secondary, fontSize: 18 }} />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                bgcolor: theme.palette.background.default,
              },
            }}
          >
            <MenuItem value="all">All Time</MenuItem>
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="this_week">This Week</MenuItem>
            <MenuItem value="this_month">This Month</MenuItem>
            <MenuItem value="custom">Custom Date Range</MenuItem>
          </TextField>
        </Box>

        {/* Custom Date Pickers */}
        {datePreset === "custom" && (
          <Box
            sx={{
              mt: 2,
              pt: 2,
              borderTop: "1px dashed",
              borderColor: theme.palette.divider,
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>
              Custom Period:
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="From Date"
                value={startDate}
                maxDate={endDate || undefined}
                onChange={(val) => {
                  setStartDate(val);
                  if (val && endDate && val > endDate) {
                    setEndDate(null);
                  }
                  setPage(1);
                }}
                slotProps={{
                  textField: {
                    size: "small",
                    sx: {
                      minWidth: 160,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        bgcolor: theme.palette.background.default,
                      },
                    },
                  },
                }}
              />
              <DatePicker
                label="To Date"
                value={endDate}
                minDate={startDate || undefined}
                referenceDate={startDate || undefined}
                onChange={(val) => {
                  setEndDate(val);
                  if (val && startDate && val < startDate) {
                    setStartDate(null);
                  }
                  setPage(1);
                }}
                slotProps={{
                  textField: {
                    size: "small",
                    sx: {
                      minWidth: 160,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        bgcolor: theme.palette.background.default,
                      },
                    },
                  },
                }}
              />
            </LocalizationProvider>
          </Box>
        )}

        {/* Active Filter Chips & Reset */}
        {hasActiveFilters && (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 1,
              mt: 2,
              pt: 1.5,
              borderTop: "1px solid",
              borderColor: alpha(theme.palette.divider, 0.6),
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.text.secondary, mr: 0.5 }}>
              Active Filters:
            </Typography>

            {searchQuery && (
              <Chip
                size="small"
                label={`Search: "${searchQuery}"`}
                onDelete={() => {
                  setSearchQuery("");
                  setPage(1);
                }}
                sx={{ borderRadius: 1.5 }}
              />
            )}

            {typeFilter !== "all" && (
              <Chip
                size="small"
                label={`Type: ${typeFilter.replace(/_/g, " ")}`}
                onDelete={() => {
                  setTypeFilter("all");
                  setPage(1);
                }}
                sx={{ borderRadius: 1.5, textTransform: "capitalize" }}
              />
            )}

            {datePreset !== "all" && (
              <Chip
                size="small"
                label={`Date: ${
                  datePreset === "custom"
                    ? `${startDate ? startDate.toLocaleDateString() : "Start"} – ${endDate ? endDate.toLocaleDateString() : "End"}`
                    : datePreset.replace("_", " ")
                }`}
                onDelete={() => {
                  setDatePreset("all");
                  setStartDate(null);
                  setEndDate(null);
                  setPage(1);
                }}
                sx={{ borderRadius: 1.5 }}
              />
            )}

            <Button
              size="small"
              variant="text"
              color="inherit"
              startIcon={<ResetIcon sx={{ fontSize: 16 }} />}
              onClick={handleResetFilters}
              sx={{
                textTransform: "none",
                fontSize: "0.75rem",
                fontWeight: 700,
                ml: "auto",
                color: theme.palette.text.secondary,
                "&:hover": { color: theme.palette.error.main },
              }}
            >
              Reset Filters
            </Button>
          </Box>
        )}
      </Paper>

      {/* Notification Cards List */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {isLoading ? (
          [1, 2, 3, 4, 5].map((i) => (
            <Paper
              key={i}
              elevation={0}
              sx={{ p: 1.75, borderRadius: 2, border: "1px solid", borderColor: theme.palette.divider, bgcolor: theme.palette.background.paper }}
            >
              <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                <Skeleton
                  variant="rounded"
                  width={36}
                  height={36}
                  sx={{ borderRadius: 1.5 }}
                />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="40%" height={20} />
                  <Skeleton variant="text" width="80%" height={18} />
                  <Skeleton variant="text" width="20%" height={14} />
                </Box>
              </Box>
            </Paper>
          ))
        ) : notifications.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              textAlign: "center",
              py: 6,
              px: 2,
              borderRadius: 2,
              border: "1px solid",
              borderColor: theme.palette.divider,
              bgcolor: theme.palette.background.paper,
            }}
          >
            <NotificationsIcon sx={{ fontSize: 36, color: theme.palette.text.disabled, mb: 1 }} />
            <Typography variant="subtitle1" fontWeight={600} color="text.primary">
              No notifications found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {hasActiveFilters ? "No notifications match your active filter criteria." : "You're all caught up!"}
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
                  cursor: "pointer",
                  bgcolor: isUnread ? "#f8faff" : "#ffffff",
                  border: "1px solid",
                  borderColor: isUnread ? "#bfdbfe" : "#e2e8f0",
                  transition:
                    "background-color 0.15s ease, border-color 0.15s ease",
                  "&:hover": {
                    bgcolor: isUnread ? "#f1f5f9" : "#f8fafc",
                    borderColor: "#cbd5e1",
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                  {/* Icon */}
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 1.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      bgcolor: visual.bg,
                    }}
                  >
                    {visual.icon}
                  </Box>

                  {/* Content Body */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {/* Header Row: Title & Category */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1,
                        mb: 0.25,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.75,
                          minWidth: 0,
                          flex: 1,
                        }}
                      >
                        {isUnread && (
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              bgcolor: "#059669",
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <Typography
                          noWrap
                          sx={{
                            fontWeight: isUnread ? 700 : 500,
                            fontSize: { xs: "0.88rem", sm: "0.94rem" },
                            color: isUnread ? "#0f172a" : "#475569",
                          }}
                        >
                          {notification.title}
                        </Typography>
                      </Box>

                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          color: visual.chipColor,
                          bgcolor: visual.bg,
                          px: 0.85,
                          py: 0.2,
                          borderRadius: 1,
                          whiteSpace: "nowrap",
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
                        color: isUnread ? "#334155" : "#64748b",
                        fontSize: "0.825rem",
                        lineHeight: 1.4,
                        mb: 0.75,
                        wordBreak: "break-word",
                      }}
                    >
                      {notification.message}
                    </Typography>

                    {/* Footer Row: Timestamp & Actions */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ fontSize: "0.725rem", color: "#94a3b8" }}
                      >
                        {formatTime(notification.createdAt)}
                      </Typography>

                      {/* Action Buttons */}
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.25 }}
                      >
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
                                color: "#64748b",
                                p: 0.5,
                                "&:hover": { color: "#2563eb" },
                              }}
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
                              setDeleteId(notification.notificationId);
                            }}
                            disabled={deleteNotification.isPending}
                            sx={{
                              color: "#94a3b8",
                              p: 0.5,
                              "&:hover": { color: "#ef4444" },
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
      {pagination && ((pagination.pages || (pagination as any).totalPages || 1) > 1) && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            mt: 3,
            mb: 1,
            pb: { xs: 8, sm: 2 },
            gap: 0.5,
          }}
        >
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
                minWidth: 28,
                height: 28,
                fontSize: "0.75rem",
                fontWeight: 600,
                margin: "0 2px",
                borderRadius: "6px",
              },
            }}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontSize: "0.72rem" }}
          >
            Page {page} of {pagination.pages || (pagination as any).totalPages || 1} (
            {pagination.total || 0} total)
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
