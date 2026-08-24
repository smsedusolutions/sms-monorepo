import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Button,
  Grid,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Skeleton,
  Pagination,
  alpha,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Menu,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  History as HistoryIcon,
  Search as SearchIcon,
  DeleteOutline as DeleteIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Person as PersonIcon,
  Info as InfoIcon,
  Today as TodayIcon,
  TrendingUp as TrendingUpIcon,
  MoreVert as MoreIcon,
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon,
  FilterList as FilterListIcon,
} from "@mui/icons-material";
import { useGetActivityLogs, useGetLogStats, useClearLogs } from "../../../queries/ActivityLog";
import TokenService from "../../../queries/token/tokenService";
import { useUrlTab } from "../../../hooks/useUrlTab";
import { useIsMobile } from "../../../hooks/useIsMobile";
import MobileSegmentedTabs from "../../../components/mobile/navigation/MobileSegmentedTabs";
import MobileCardList from "../../../components/mobile/data/MobileCardList";
import MobileCardItem from "../../../components/mobile/data/MobileCardItem";
import ConfirmationDialog from "../../../components/Dialogs/ConfirmationDialog";
import { exportToExcel } from "../../../components/ExcelExport";
import type { ActivityLog, ActivityLogFilters } from "../../../types";
import NotificationsTab from "./NotificationsTab"; // We'll create this to wrap the notification logic

const SchoolAdminNotifications: React.FC = () => {
  const theme = useTheme();
  const isMobile = useIsMobile();
  const schoolId = TokenService.getSchoolId() || "";
  const [activeTab, setActiveTab] = useUrlTab(0, ['notifications', 'audit-logs']);
  const [isPurgeDialogOpen, setIsPurgeDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activeLog, setActiveLog] = useState<ActivityLog | null>(null);

  // Filters State
  const [filters, setFilters] = useState<ActivityLogFilters>({
    page: 1,
    limit: 10,
    search: "",
    action: "",
    entity: "",
    actorRole: "",
  });

  // Queries
  const {
    data: logsData,
    isLoading: logsLoading,
    refetch: refetchLogs
  } = useGetActivityLogs(schoolId, filters);

  const {
    data: statsData,
    isLoading: statsLoading
  } = useGetLogStats(schoolId);

  const clearLogsMutation = useClearLogs(schoolId);

  const handleTabChange = (_: any, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleFilterChange = (field: keyof ActivityLogFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
      ...(field !== "page" ? { page: 1 } : {}),
    }));
  };

  const handlePurgeLogs = () => {
    clearLogsMutation.mutate(undefined, {
      onSuccess: () => {
        setIsPurgeDialogOpen(false);
        refetchLogs();
      }
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleExportExcel = async () => {
    if (!logsData?.data || (logsData.data as ActivityLog[]).length === 0) return;

    const columns = [
      { header: "Date", key: "date" as any },
      { header: "Time", key: "time" as any },
      { header: "Actor", key: "actorName" as any },
      { header: "Role", key: "actorRole" as any },
      { header: "Action", key: "action" as any, statusField: true },
      { header: "Entity", key: "entity" as any },
      { header: "Record", key: "entityLabel" as any },
      { header: "Description", key: "description" as any }
    ];

    const exportData = (logsData.data as ActivityLog[]).map(log => ({
      ...log,
      date: formatDate(log.createdAt).split(",")[0],
      time: formatDate(log.createdAt).split(",")[1].trim(),
      actorRole: log.actorRole.replace("sch_", "").toUpperCase()
    }));

    await exportToExcel(
      exportData,
      columns,
      `Activity Logs Report - ${new Date().toLocaleDateString()}`,
      `Activity_Logs_${new Date().toISOString().split("T")[0]}`
    );
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, log: ActivityLog) => {
    setAnchorEl(event.currentTarget);
    setActiveLog(log);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setActiveLog(null);
  };

  const handleCopyId = () => {
    if (activeLog) {
      navigator.clipboard.writeText(activeLog.logId);
      handleMenuClose();
    }
  };

  const handleFilterByEntity = () => {
    if (activeLog) {
      handleFilterChange("entity", activeLog.entity);
      handleMenuClose();
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATE": return "success";
      case "UPDATE": return "info";
      case "DELETE": return "error";
      case "LOGIN": return "secondary";
      default: return "default";
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, width: "100%" }}>
      {/* Header Section */}
      <Box sx={{
        mb: 3,
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        justifyContent: "space-between",
        alignItems: { xs: "stretch", sm: "flex-start" },
        gap: 2
      }}>
        <Box>
          <Typography variant="h4" sx={{
            fontWeight: 700,
            mb: 0.5,
            color: theme.palette.text.primary,
            fontSize: { xs: "1.35rem", sm: "1.85rem", md: "2.125rem" }
          }}>
            Admin Control Center
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            Manage system notifications and monitor administrative audit trails
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5, flexShrink: 0, alignSelf: { xs: "flex-start", sm: "center" } }}>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={() => refetchLogs()}
            sx={{
              borderRadius: 2.5,
              px: 2.5,
              py: 1,
              fontWeight: 700,
              backgroundColor: theme.palette.primary.main,
              boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.39)}`,
              "&:hover": {
                backgroundColor: theme.palette.primary.dark,
              }
            }}
          >
            Refresh Data
          </Button>
        </Box>
      </Box>

      {/* Navigation Tabs */}
      {isMobile ? (
        <Box sx={{ mb: 3 }}>
          <MobileSegmentedTabs
            options={[
              { id: 'notifications', label: 'Notifications', icon: <NotificationsIcon sx={{ fontSize: 18 }} /> },
              { id: 'audit-logs', label: 'Activity Logs', icon: <HistoryIcon sx={{ fontSize: 18 }} /> },
            ]}
            activeId={activeTab === 0 ? 'notifications' : 'audit-logs'}
            onChange={(id) => setActiveTab(id === 'notifications' ? 0 : 1)}
          />
        </Box>
      ) : (
        <Card sx={{
          mb: 4,
          borderRadius: 2,
          boxShadow: theme.shadows[2],
          background: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: "blur(8px)",
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              px: 2,
              "& .MuiTab-root": {
                py: 2,
                fontWeight: 600,
                fontSize: "1rem",
                minWidth: 160,
                transition: "all 0.2s",
              },
              "& .Mui-selected": {
                color: theme.palette.primary.main,
              },
              "& .MuiTabs-indicator": {
                height: 3,
                borderRadius: "3px 3px 0 0",
              },
            }}
          >
            <Tab
              icon={<NotificationsIcon sx={{ mr: 1 }} />}
              iconPosition="start"
              label="System Notifications"
            />
            <Tab
              icon={<HistoryIcon sx={{ mr: 1 }} />}
              iconPosition="start"
              label="Activity Logs"
            />
          </Tabs>
        </Card>
      )}

      {/* Tab Content */}
      <Box>
        {activeTab === 0 ? (
          <NotificationsTab />
        ) : (
          <Grid container spacing={3}>
            {/* Stats Cards */}
            <Grid size={{ xs: 12, md: 3 }}>
              <Card sx={{ borderRadius: 2, height: "100%", position: "relative", overflow: "hidden", border: `1px solid ${alpha(theme.palette.divider, 0.08)}` }}>
                <Box sx={{
                  position: "absolute", top: -20, right: -20, opacity: 0.1,
                  transform: "rotate(-15deg)", pointerEvents: "none"
                }}>
                  <TodayIcon sx={{ fontSize: 120 }} />
                </Box>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="overline" sx={{ fontWeight: 700, color: "text.secondary", letterSpacing: 1 }}>
                    Today's Activity
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, mt: 1 }}>
                    {statsLoading ? <Skeleton width="40%" /> : statsData?.data?.totalToday || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "success.main", fontWeight: 600, mt: 1, display: "flex", alignItems: "center" }}>
                    <TrendingUpIcon fontSize="small" sx={{ mr: 0.5 }} />
                    Live Audit Trail
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <Card sx={{ borderRadius: 2, height: "100%", border: `1px solid ${alpha(theme.palette.divider, 0.08)}` }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="overline" sx={{ fontWeight: 700, color: "text.secondary", letterSpacing: 1 }}>
                    Most Active Performer
                  </Typography>
                  <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 2 }}>
                    <Box sx={{
                      width: 56, height: 56, borderRadius: "16px",
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      <PersonIcon color="primary" sx={{ fontSize: 32 }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {statsLoading ? <Skeleton width={120} /> : statsData?.data?.mostActiveUser?.name || "N/A"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {statsLoading ? <Skeleton width={80} /> : `${statsData?.data?.mostActiveUser?.count || 0} actions recorded today`}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ borderRadius: 2, height: "100%", bgcolor: alpha(theme.palette.warning.main, 0.05), border: `1px dashed ${alpha(theme.palette.warning.main, 0.3)}` }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="overline" sx={{ fontWeight: 700, color: "warning.dark", letterSpacing: 1 }}>
                    Retention Policy
                  </Typography>
                  <Box sx={{ mt: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: "warning.dark" }}>
                        {statsLoading ? <Skeleton width={40} /> : statsData?.data?.expiringIn7DaysCount || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        Logs expiring in next 7 days
                      </Typography>
                    </Box>
                    <Tooltip title="View Policy Details">
                      <IconButton size="small" color="warning" onClick={(e) => { e.stopPropagation(); }}>
                        <InfoIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Filters & Actions Bar */}
            <Grid size={{ xs: 12 }}>
              <Card sx={{ borderRadius: 2, px: 3, py: 2, border: `1px solid ${alpha(theme.palette.divider, 0.08)}`, width: "100%" }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Search by actor, action or description..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange("search", e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon sx={{ color: "text.disabled" }} />
                          </InputAdornment>
                        ),
                        sx: { borderRadius: 2 }
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, md: 2 }}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Entity"
                      value={filters.entity}
                      onChange={(e) => handleFilterChange("entity", e.target.value)}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                    >
                      <MenuItem value="">All Entities</MenuItem>
                      <MenuItem value="Student">Student</MenuItem>
                      <MenuItem value="Teacher">Teacher</MenuItem>
                      <MenuItem value="Parent">Parent</MenuItem>
                      <MenuItem value="Exam">Exam</MenuItem>
                      <MenuItem value="Subject">Subject</MenuItem>
                      <MenuItem value="Class">Class</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 6, md: 2 }}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Action"
                      value={filters.action}
                      onChange={(e) => handleFilterChange("action", e.target.value)}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                    >
                      <MenuItem value="">All Actions</MenuItem>
                      <MenuItem value="CREATE">Create</MenuItem>
                      <MenuItem value="UPDATE">Update</MenuItem>
                      <MenuItem value="DELETE">Delete</MenuItem>
                      <MenuItem value="LOGIN">Auth</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }} sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => setIsPurgeDialogOpen(true)}
                      disabled={clearLogsMutation.isPending}
                      sx={{ borderRadius: 2 }}
                    >
                      Purge Logs
                    </Button>
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<DownloadIcon />}
                      onClick={handleExportExcel}
                      sx={{ borderRadius: 2 }}
                    >
                      Export Excel
                    </Button>
                  </Grid>
                </Grid>
              </Card>
            </Grid>

            {/* Activity Table / Mobile List */}
            <Grid size={{ xs: 12 }}>
              {isMobile ? (
                <MobileCardList
                  isLoading={logsLoading}
                  emptyTitle="No Activity Logs Found"
                  emptyMessage="Try adjusting your filters or search terms"
                  totalCount={logsData?.pagination?.total || logsData?.pagination?.totalRecords || (logsData?.data as any[])?.length || 0}
                  itemCount={(logsData?.data as any[])?.length || 0}
                >
                  {(logsData?.data as ActivityLog[])?.map((log: ActivityLog) => {
                    const actionCol = getActionColor(log.action);
                    return (
                      <MobileCardItem
                        key={log.logId}
                        title={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a" }}>
                              {log.actorName}
                            </Typography>
                            <Chip
                              label={log.actorRole.replace("sch_", "").toUpperCase()}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: "0.6rem",
                                fontWeight: 700,
                                bgcolor: alpha(theme.palette.primary.main, 0.08),
                                color: theme.palette.primary.main,
                              }}
                            />
                          </Box>
                        }
                        subtitle={`${log.entity}${log.entityLabel ? ` • ${log.entityLabel}` : ''}`}
                        badge={{
                          label: log.action,
                          color: actionCol === 'success' ? 'success' : actionCol === 'error' ? 'error' : actionCol === 'info' ? 'info' : 'default',
                        }}
                        metaItems={[
                          { label: 'Date/Time', value: formatDate(log.createdAt) },
                          { label: 'Details', value: log.description },
                        ]}
                        rightAction={
                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            <IconButton
                              size="small"
                              sx={{ color: "primary.main" }}
                              onClick={() => {
                                setSelectedLog(log);
                                setIsDetailsOpen(true);
                              }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, log)}
                            >
                              <MoreIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        }
                      />
                    );
                  })}
                </MobileCardList>
              ) : (
                <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: theme.shadows[1] }}>
                  <Table sx={{ minWidth: 650 }}>
                    <TableHead sx={{ bgcolor: alpha(theme.palette.common.black, 0.02) }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Timestamp</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Actor</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Entity</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {logsLoading ? (
                        [...Array(5)].map((_, i) => (
                          <TableRow key={i}>
                            {[...Array(6)].map((_, j) => (
                              <TableCell key={j}><Skeleton variant="text" /></TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : logsData?.data?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                            <HistoryIcon sx={{ fontSize: 60, color: "text.disabled", mb: 2 }} />
                            <Typography variant="h6" color="text.secondary">No activity logs found</Typography>
                            <Typography variant="body2" color="text.disabled">Try adjusting your filters or search terms</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        (logsData?.data as ActivityLog[])?.map((log: ActivityLog) => (
                          <TableRow key={log.logId} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                            <TableCell sx={{ whiteSpace: "nowrap" }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDate(log.createdAt).split(",")[0]}</Typography>
                              <Typography variant="caption" color="text.secondary">{formatDate(log.createdAt).split(",")[1]}</Typography>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Box sx={{
                                  width: 32, height: 32, borderRadius: "10px",
                                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                                  display: "flex", alignItems: "center", justifyContent: "center"
                                }}>
                                  <PersonIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                                </Box>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{log.actorName}</Typography>
                                  <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                                    {log.actorRole.replace("sch_", "")}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={log.action}
                                size="small"
                                color={getActionColor(log.action) as any}
                                variant="outlined"
                                sx={{
                                  fontWeight: 800,
                                  fontSize: "0.65rem",
                                  height: 24,
                                  borderRadius: "6px",
                                  bgcolor: alpha(theme.palette[getActionColor(log.action) as "success" | "info" | "error" | "secondary"]?.main || theme.palette.grey[500], 0.1)
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{log.entity}</Typography>
                              {log.entityLabel && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                  {log.entityLabel}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell sx={{ maxWidth: 300 }}>
                              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                {log.description}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
                                <Tooltip title="View Details">
                                  <IconButton
                                    size="small"
                                    sx={{ color: "primary.main" }}
                                    onClick={() => {
                                      setSelectedLog(log);
                                      setIsDetailsOpen(true);
                                    }}
                                  >
                                    <ViewIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <IconButton
                                  size="small"
                                  onClick={(e) => handleMenuOpen(e, log)}
                                >
                                  <MoreIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Pagination */}
              <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
                <Pagination
                  count={logsData?.pagination?.totalPages || 1}
                  page={filters.page || 1}
                  onChange={(_, value) => handleFilterChange("page", value)}
                  color="primary"
                  sx={{
                    "& .MuiPaginationItem-root": {
                      borderRadius: 2,
                      fontWeight: 600
                    }
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        )}
      </Box>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        open={isPurgeDialogOpen}
        onClose={() => setIsPurgeDialogOpen(false)}
        onConfirm={handlePurgeLogs}
        title="Purge Activity Logs"
        description="Are you sure you want to clear ALL activity logs? This action cannot be undone and will permanently remove all audit trails from the system database."
        confirmLabel="Purge All Logs"
        variant="danger"
        isLoading={clearLogsMutation.isPending}
      />

      {/* Activity Log Details Dialog */}
      <Dialog
        open={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2, boxShadow: theme.shadows[10] }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{
            p: 1, borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            display: "flex"
          }}>
            <HistoryIcon color="primary" />
          </Box>
          Audit Log Details
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 3 }}>
          {selectedLog && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="overline" color="text.secondary" fontWeight={700}>Timestamp</Typography>
                <Typography variant="body1" fontWeight={600}>{formatDate(selectedLog.createdAt)}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="overline" color="text.secondary" fontWeight={700}>Actor</Typography>
                <Typography variant="body1" fontWeight={600}>{selectedLog.actorName} ({selectedLog.actorRole.replace("sch_", "")})</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="overline" color="text.secondary" fontWeight={700}>Action Type</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={selectedLog.action}
                    size="small"
                    color={getActionColor(selectedLog.action) as any}
                    sx={{ fontWeight: 800, borderRadius: 1.5 }}
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="overline" color="text.secondary" fontWeight={700}>Entity Impacted</Typography>
                <Typography variant="body1" fontWeight={600}>{selectedLog.entity} {selectedLog.entityLabel ? `(${selectedLog.entityLabel})` : ""}</Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="overline" color="text.secondary" fontWeight={700}>Description</Typography>
                <Typography variant="body1" sx={{ mt: 0.5, p: 2, bgcolor: alpha(theme.palette.grey[500], 0.05), borderRadius: 2, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                  {selectedLog.description}
                </Typography>
              </Grid>            </Grid>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => setIsDetailsOpen(false)}
            variant="contained"
            sx={{ borderRadius: 2, px: 4 }}
          >
            Close Details
          </Button>
        </DialogActions>
      </Dialog>

      {/* 3-Dot Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            minWidth: 180,
            borderRadius: 2,
            boxShadow: theme.shadows[4],
            mt: 0.5,
            "& .MuiMenuItem-root": {
              px: 2,
              py: 1,
              borderRadius: 1,
              mx: 1,
              fontSize: "0.875rem",
              fontWeight: 500
            }
          }
        }}
      >
        <MenuItem onClick={handleCopyId}>
          <ListItemIcon>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copy Log ID</ListItemText>
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={handleFilterByEntity}>
          <ListItemIcon>
            <FilterListIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Filter by {activeLog?.entity || "Entity"}</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default SchoolAdminNotifications;
