import { useState, useEffect } from "react";
import {
    Box,
    Button,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogContentText,
    Stack,
} from "@mui/material";
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import TokenService from "../../../queries/token/tokenService";
import { useGetClasses } from "../../../queries/Class";
import { useBulkPromote } from "../../../queries/Promotion";
import { useNotificationStore } from "../../../stores/notificationStore";
import { useIsMobile } from "../../../hooks/useIsMobile";

interface ClassMapping {
    classId: string;
    name: string;
    targetClassId: string;
}

const BulkPromotion = () => {
    const isMobile = useIsMobile();
    const schoolId = TokenService.getSchoolId() || "";
    const { showNotification } = useNotificationStore();

    const [newAcademicYear, setNewAcademicYear] = useState("");
    const [notes, setNotes] = useState("");
    const [mappings, setMappings] = useState<ClassMapping[]>([]);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

    // Queries & Mutations
    const { data: classesData, isLoading: classesLoading } = useGetClasses(schoolId);
    const bulkPromoteMutation = useBulkPromote(schoolId);

    const classes = classesData?.data || [];

    // Pre-populate mappings with guessed target classes
    useEffect(() => {
        if (classes.length > 0) {
            const initialMappings = classes.map((cls: any) => {
                const numMatch = cls.name.match(/\d+/);
                let guessedClassId = "";

                if (numMatch) {
                    const currentNum = parseInt(numMatch[0], 10);
                    const nextNum = currentNum + 1;
                    const guessedName = cls.name.replace(numMatch[0], String(nextNum));
                    const foundClass = classes.find(
                        (c: any) => c.name.toLowerCase() === guessedName.toLowerCase()
                    );
                    if (foundClass) {
                        guessedClassId = foundClass.classId;
                    }
                }

                return {
                    classId: cls.classId,
                    name: cls.name,
                    targetClassId: guessedClassId,
                };
            });
            setMappings(initialMappings);
        }
    }, [classesData]);

    const handleMappingChange = (classId: string, targetClassId: string) => {
        setMappings((prev) =>
            prev.map((m) => (m.classId === classId ? { ...m, targetClassId } : m))
        );
    };

    const handleExecuteBulk = async () => {
        const activePromotions = mappings.filter((m) => m.targetClassId !== "");
        if (activePromotions.length === 0) {
            showNotification("Please configure at least one class promotion mapping", "warning");
            return;
        }

        if (!newAcademicYear) {
            showNotification("Please specify the New Academic Year", "warning");
            return;
        }

        try {
            await bulkPromoteMutation.mutateAsync({
                promotions: activePromotions.map((m) => ({
                    classId: m.classId,
                    targetClassId: m.targetClassId,
                })),
                newAcademicYear,
                notes,
            });
            showNotification("Bulk promotion executed successfully!", "success");
            setConfirmDialogOpen(false);
            setNewAcademicYear("");
            setNotes("");
        } catch (error: any) {
            showNotification(error.message || "Failed to execute bulk promotion", "error");
        }
    };

    if (classesLoading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                <CircularProgress size={32} />
            </Box>
        );
    }

    return (
        <Box>
            {!isMobile && (
                <Typography variant="h6" fontWeight={700} color="#0f172a" sx={{ mb: 2 }}>
                    Bulk Class Promotion Mapping
                </Typography>
            )}

            <Paper
                variant="outlined"
                sx={{
                    p: { xs: 2, sm: 2.5 },
                    borderRadius: 2,
                    borderColor: '#e2e8f0',
                    bgcolor: '#ffffff',
                    mb: 2.5,
                }}
            >
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
                    <TextField
                        label="New Academic Year"
                        required
                        placeholder="e.g., 2026-27"
                        value={newAcademicYear}
                        onChange={(e) => setNewAcademicYear(e.target.value)}
                        size="small"
                        sx={{ minWidth: { xs: '100%', sm: 200 } }}
                    />
                    <TextField
                        label="Notes / Remarks"
                        placeholder="Describe this year-end process"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        size="small"
                        fullWidth
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        disabled={!newAcademicYear || bulkPromoteMutation.isPending}
                        onClick={() => setConfirmDialogOpen(true)}
                        sx={{
                            borderRadius: 1.5,
                            textTransform: 'none',
                            fontWeight: 600,
                            py: 1,
                            px: 3,
                            whiteSpace: 'nowrap',
                            minWidth: { xs: '100%', sm: 'auto' },
                        }}
                    >
                        Promote All
                    </Button>
                </Stack>
            </Paper>

            {isMobile ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {mappings.map((mapping) => (
                        <Paper
                            key={mapping.classId}
                            variant="outlined"
                            sx={{
                                p: 1.75,
                                borderRadius: 2,
                                borderColor: '#e2e8f0',
                                bgcolor: '#ffffff',
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                                <Typography variant="subtitle2" fontWeight={700} color="#0f172a">
                                    {mapping.name}
                                </Typography>
                                <ArrowForwardRoundedIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                            </Box>
                            <FormControl fullWidth size="small">
                                <InputLabel>Target Class</InputLabel>
                                <Select
                                    value={mapping.targetClassId}
                                    label="Target Class"
                                    onChange={(e) => handleMappingChange(mapping.classId, e.target.value)}
                                >
                                    <MenuItem value="">
                                        <em>Do Not Promote (Stays / Graduates)</em>
                                    </MenuItem>
                                    {classes
                                        .filter((c: any) => c.classId !== mapping.classId)
                                        .map((cls: any) => (
                                            <MenuItem key={cls.classId} value={cls.classId}>
                                                {cls.name}
                                            </MenuItem>
                                        ))}
                                </Select>
                            </FormControl>
                        </Paper>
                    ))}
                </Box>
            ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>Source Class</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Promotion Action</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Target Class</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {mappings.map((mapping) => (
                                <TableRow key={mapping.classId}>
                                    <TableCell sx={{ fontWeight: 600 }}>{mapping.name}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary">
                                            Promotes to
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <FormControl size="small" sx={{ minWidth: 240 }}>
                                            <InputLabel>Select Target Class</InputLabel>
                                            <Select
                                                value={mapping.targetClassId}
                                                label="Select Target Class"
                                                onChange={(e) =>
                                                    handleMappingChange(mapping.classId, e.target.value)
                                                }
                                            >
                                                <MenuItem value="">
                                                    <em>Do Not Promote (Stays / Graduates)</em>
                                                </MenuItem>
                                                {classes
                                                    .filter((c: any) => c.classId !== mapping.classId)
                                                    .map((cls: any) => (
                                                        <MenuItem key={cls.classId} value={cls.classId}>
                                                            {cls.name}
                                                        </MenuItem>
                                                    ))}
                                            </Select>
                                        </FormControl>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Confirm Dialog */}
            <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Confirm Year-End Bulk Promotion</DialogTitle>
                <DialogContent>
                    <DialogContentText variant="body2">
                        You are about to promote all active students in the selected source classes to their designated target classes for the academic year <strong>{newAcademicYear}</strong>.
                        <br />
                        <br />
                        This action will update all matching student records. Are you sure you want to proceed?
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 2.5, pb: 2 }}>
                    <Button onClick={() => setConfirmDialogOpen(false)} color="inherit" sx={{ textTransform: 'none', fontWeight: 600 }}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleExecuteBulk}
                        variant="contained"
                        color="primary"
                        disabled={bulkPromoteMutation.isPending}
                        sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
                    >
                        {bulkPromoteMutation.isPending ? "Executing..." : "Confirm & Execute"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default BulkPromotion;
