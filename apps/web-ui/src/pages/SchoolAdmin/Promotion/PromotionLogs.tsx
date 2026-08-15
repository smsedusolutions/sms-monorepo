import { useState } from "react";
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Stack,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import TokenService from "../../../queries/token/tokenService";
import { useGetPromotionLogs, useRollbackPromotion } from "../../../queries/Promotion";
import { useNotificationStore } from "../../../stores/notificationStore";
import DataTable from "../../../components/Table/DataTable";
import type { Column } from "../../../components/Table/DataTable";
import ConfirmationDialog from "../../../components/Dialogs/ConfirmationDialog";
import { useIsMobile } from "../../../hooks/useIsMobile";

const PromotionLogs = () => {
    const isMobile = useIsMobile();
    const schoolId = TokenService.getSchoolId() || "";
    const { showNotification } = useNotificationStore();

    const [selectedLog, setSelectedLog] = useState<any | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [rollbackDialogOpen, setRollbackDialogOpen] = useState(false);
    const [rollbackLogId, setRollbackLogId] = useState<string | null>(null);

    // Queries
    const { data: logsData, isLoading, error } = useGetPromotionLogs(schoolId);
    const rollbackMutation = useRollbackPromotion(schoolId);

    const logs = logsData?.data || [];

    const handleRollbackClick = (logId: string) => {
        setRollbackLogId(logId);
        setRollbackDialogOpen(true);
    };

    const handleExecuteRollback = async () => {
        if (!rollbackLogId) return;

        try {
            await rollbackMutation.mutateAsync(rollbackLogId);
            showNotification("Promotion rolled back successfully!", "success");
        } catch (error: any) {
            showNotification(error.message || "Failed to rollback promotion", "error");
        } finally {
            setRollbackDialogOpen(false);
            setRollbackLogId(null);
        }
    };

    const handleViewDetails = (log: any) => {
        setSelectedLog(log);
        setDetailsOpen(true);
    };

    // Columns for DataTable
    const columns: Column<any>[] = [
        {
            id: "createdAt",
            label: "Executed Date",
            format: (value: any) => new Date(value).toLocaleDateString(),
        },
        {
            id: "promotionType",
            label: "Type",
            format: (value: string) => {
                const labelMap: Record<string, string> = {
                    single_class: "Class Promotion",
                    bulk: "Bulk Promotion",
                    repeat: "Mark Repeating",
                    graduate: "Graduate Batch",
                    archive: "Archive Year",
                };
                return labelMap[value] || value;
            },
        },
        {
            id: "academicYear",
            label: "Academic Year",
        },
        {
            id: "students",
            label: "Students",
            format: (value: any[]) => value?.length || 0,
        },
        {
            id: "status",
            label: "Status",
            format: (value: string) => {
                const color =
                    value === "completed"
                        ? "success"
                        : value === "rolled_back"
                        ? "error"
                        : "warning";
                return (
                    <Chip
                        label={value.replace("_", " ")}
                        color={color}
                        size="small"
                        sx={{ textTransform: 'capitalize', fontWeight: 600, height: 22, fontSize: '0.75rem' }}
                    />
                );
            },
        },
        {
            id: "actions",
            label: "Actions",
            format: (_: any, row: any) => (
                <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleViewDetails(row)}
                        sx={{ textTransform: 'none', fontSize: '0.75rem', py: 0.25, borderRadius: 1 }}
                    >
                        Details
                    </Button>
                    {row.rollbackAvailable && row.status === "completed" && (
                        <Button
                            size="small"
                            variant="contained"
                            color="error"
                            disabled={rollbackMutation.isPending}
                            onClick={() => handleRollbackClick(row._id)}
                            sx={{ textTransform: 'none', fontSize: '0.75rem', py: 0.25, borderRadius: 1 }}
                        >
                            Rollback
                        </Button>
                    )}
                </Box>
            ),
        },
    ];

    return (
        <Box>
            {!isMobile && (
                <Typography variant="h6" fontWeight={700} color="#0f172a" sx={{ mb: 2 }}>
                    Promotion History & Logs
                </Typography>
            )}

            <DataTable
                title="Year-End Logs"
                columns={columns}
                data={logs}
                isLoading={isLoading}
                error={error ? "Failed to load logs" : null}
            />

            {/* Details Dialog */}
            <Dialog
                open={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                maxWidth="md"
                fullWidth
                fullScreen={isMobile}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700 }}>
                    Promotion Action Details
                    <IconButton size="small" onClick={() => setDetailsOpen(false)}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    {selectedLog && (
                        <Stack spacing={2}>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    <strong>Date:</strong> {new Date(selectedLog.createdAt).toLocaleString()}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    <strong>Academic Year:</strong> {selectedLog.academicYear}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    <strong>Notes:</strong> {selectedLog.notes || "None"}
                                </Typography>
                            </Box>

                            {selectedLog.students && selectedLog.students.length > 0 ? (
                                isMobile ? (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        {selectedLog.students.map((st: any, idx: number) => (
                                            <Paper key={idx} variant="outlined" sx={{ p: 1.25, borderRadius: 1.5 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                                    <Typography variant="caption" fontWeight={700}>
                                                        ID: {st.studentId}
                                                    </Typography>
                                                    <Chip
                                                        label={st.status}
                                                        size="small"
                                                        color={
                                                            st.status === "promoted"
                                                                ? "success"
                                                                : st.status === "repeated"
                                                                ? "warning"
                                                                : "default"
                                                        }
                                                        sx={{ textTransform: 'capitalize', height: 20, fontSize: '0.68rem', fontWeight: 600 }}
                                                    />
                                                </Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    {st.fromClass} {st.fromSection ? `(${st.fromSection})` : ''} → {st.toClass} {st.toSection ? `(${st.toSection})` : ''}
                                                </Typography>
                                            </Paper>
                                        ))}
                                    </Box>
                                ) : (
                                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5, maxHeight: 400 }}>
                                        <Table stickyHeader size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 700 }}>Student ID</TableCell>
                                                    <TableCell sx={{ fontWeight: 700 }}>From Class</TableCell>
                                                    <TableCell sx={{ fontWeight: 700 }}>From Section</TableCell>
                                                    <TableCell sx={{ fontWeight: 700 }}>To Class</TableCell>
                                                    <TableCell sx={{ fontWeight: 700 }}>To Section</TableCell>
                                                    <TableCell sx={{ fontWeight: 700 }}>Result</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {selectedLog.students.map((st: any, idx: number) => (
                                                    <TableRow key={idx}>
                                                        <TableCell>{st.studentId}</TableCell>
                                                        <TableCell>{st.fromClass}</TableCell>
                                                        <TableCell>{st.fromSection || "-"}</TableCell>
                                                        <TableCell>{st.toClass}</TableCell>
                                                        <TableCell>{st.toSection || "-"}</TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={st.status}
                                                                size="small"
                                                                color={
                                                                    st.status === "promoted"
                                                                        ? "success"
                                                                        : st.status === "repeated"
                                                                        ? "warning"
                                                                        : "default"
                                                                }
                                                                sx={{ textTransform: 'capitalize', height: 20, fontSize: '0.68rem', fontWeight: 600 }}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    No students affected directly by this log (e.g., Year Archive event).
                                </Typography>
                            )}
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDetailsOpen(false)} variant="contained" sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Rollback Confirmation Dialog */}
            <ConfirmationDialog
                open={rollbackDialogOpen}
                onClose={() => {
                    setRollbackDialogOpen(false);
                    setRollbackLogId(null);
                }}
                onConfirm={handleExecuteRollback}
                title="Confirm Rollback"
                description="Are you sure you want to rollback this promotion action? This will revert all associated student classes, sections, and historical status updates."
                confirmLabel="Rollback"
                cancelLabel="Cancel"
                variant="danger"
                isLoading={rollbackMutation.isPending}
            />
        </Box>
    );
};

export default PromotionLogs;
