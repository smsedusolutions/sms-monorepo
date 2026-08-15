import { useState } from "react";
import {
    Box,
    Button,
    Checkbox,
    FormControlLabel,
    FormGroup,
    TextField,
    Typography,
    CircularProgress,
    Alert,
    Paper,
    Stack,
} from "@mui/material";
import TokenService from "../../../queries/token/tokenService";
import { useArchiveYear } from "../../../queries/Promotion";
import { useNotificationStore } from "../../../stores/notificationStore";
import { useIsMobile } from "../../../hooks/useIsMobile";

const ArchiveYear = () => {
    const isMobile = useIsMobile();
    const schoolId = TokenService.getSchoolId() || "";
    const { showNotification } = useNotificationStore();

    const [newAcademicYear, setNewAcademicYear] = useState("");
    const [notes, setNotes] = useState("");

    // Checklist States
    const [checklist, setChecklist] = useState({
        promoted: false,
        repeating: false,
        graduated: false,
        exams: false,
        fees: false,
    });

    const archiveMutation = useArchiveYear(schoolId);

    const handleChecklistChange = (key: keyof typeof checklist) => {
        setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const isChecklistComplete = Object.values(checklist).every((val) => val === true);

    const handleArchive = async () => {
        if (!newAcademicYear) {
            showNotification("Please specify the New Academic Year", "warning");
            return;
        }

        try {
            await archiveMutation.mutateAsync({
                newAcademicYear,
                notes,
            });
            showNotification("Academic year archived and updated successfully!", "success");
            setNewAcademicYear("");
            setNotes("");
            setChecklist({
                promoted: false,
                repeating: false,
                graduated: false,
                exams: false,
                fees: false,
            });
        } catch (error: any) {
            showNotification(error.message || "Failed to archive academic year", "error");
        }
    };

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
            {!isMobile && (
                <Typography variant="h6" fontWeight={700} color="#0f172a" sx={{ mb: 2 }}>
                    Archive Academic Year
                </Typography>
            )}

            <Alert severity="warning" sx={{ mb: 2.5, borderRadius: 2 }}>
                This is a critical year-end task. Archiving the academic year updates the school's active status configuration to start a new calendar cycle. Please complete the checklist below before performing this operation.
            </Alert>

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
                <Typography variant="subtitle1" fontWeight={700} color="#0f172a" sx={{ mb: 1.5 }}>
                    Pre-Archive Checklist
                </Typography>
                <FormGroup sx={{ gap: 0.5 }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                size="small"
                                checked={checklist.promoted}
                                onChange={() => handleChecklistChange("promoted")}
                            />
                        }
                        label={<Typography variant="body2">I have promoted all passing students from the active classes.</Typography>}
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                size="small"
                                checked={checklist.repeating}
                                onChange={() => handleChecklistChange("repeating")}
                            />
                        }
                        label={<Typography variant="body2">I have confirmed and marked all repeating (detained) students.</Typography>}
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                size="small"
                                checked={checklist.graduated}
                                onChange={() => handleChecklistChange("graduated")}
                            />
                        }
                        label={<Typography variant="body2">I have marked the outgoing batches as Graduated.</Typography>}
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                size="small"
                                checked={checklist.exams}
                                onChange={() => handleChecklistChange("exams")}
                            />
                        }
                        label={<Typography variant="body2">All final-term exam results have been published.</Typography>}
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                size="small"
                                checked={checklist.fees}
                                onChange={() => handleChecklistChange("fees")}
                            />
                        }
                        label={<Typography variant="body2">I have audited pending school fees balance logs.</Typography>}
                    />
                </FormGroup>
            </Paper>

            <Paper
                variant="outlined"
                sx={{
                    p: { xs: 2, sm: 2.5 },
                    borderRadius: 2,
                    borderColor: '#e2e8f0',
                    bgcolor: '#ffffff',
                }}
            >
                <Typography variant="subtitle1" fontWeight={700} color="#0f172a" sx={{ mb: 2 }}>
                    Academic Transition Parameters
                </Typography>

                <Stack spacing={2}>
                    <TextField
                        label="Next Academic Year to Start"
                        required
                        placeholder="e.g., 2026-27"
                        value={newAcademicYear}
                        onChange={(e) => setNewAcademicYear(e.target.value)}
                        disabled={!isChecklistComplete}
                        size="small"
                    />

                    <TextField
                        label="Archive Description / Log Notes"
                        multiline
                        rows={2}
                        placeholder="Provide any description about archiving this year"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        disabled={!isChecklistComplete}
                        size="small"
                    />

                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleArchive}
                        disabled={!isChecklistComplete || !newAcademicYear || archiveMutation.isPending}
                        sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600, py: 1 }}
                    >
                        {archiveMutation.isPending ? (
                            <CircularProgress size={20} color="inherit" />
                        ) : (
                            "Close & Archive Academic Year"
                        )}
                    </Button>
                </Stack>
            </Paper>
        </Box>
    );
};

export default ArchiveYear;
