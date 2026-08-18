import { useState, useMemo, useEffect } from "react";
import {
    Box,
    Button,
    Checkbox,
    FormControl,
    Grid,
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
    Alert,
    Chip,
} from "@mui/material";
import TokenService from "../../../queries/token/tokenService";
import { useGetClasses } from "../../../queries/Class";
import { useGetPromotionPreview, usePromoteClass } from "../../../queries/Promotion";
import { useNotificationStore } from "../../../stores/notificationStore";
import { useIsMobile } from "../../../hooks/useIsMobile";
import { useAcademicYear } from "../../../hooks/useAcademicYear";
import { AppSelect } from "../../../components/shared/AppSelect";
import { useNavigate } from "react-router-dom";

const ClassPromotion = () => {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const schoolId = TokenService.getSchoolId() || "";
    const { showNotification } = useNotificationStore();
    const { upcomingAcademicYearOptions, nextAcademicYear } = useAcademicYear();

    // Form states
    const [sourceClassId, setSourceClassId] = useState("");
    const [sourceSectionId, setSourceSectionId] = useState("");
    const [targetClassId, setTargetClassId] = useState("");
    const [targetSectionId, setTargetSectionId] = useState("");
    const [newAcademicYear, setNewAcademicYear] = useState("");

    useEffect(() => {
        if (!newAcademicYear && nextAcademicYear) {
            setNewAcademicYear(nextAcademicYear);
        }
    }, [nextAcademicYear, newAcademicYear]);

    const [notes, setNotes] = useState("");

    // Student list modifiers
    const [repeaters, setRepeaters] = useState<string[]>([]);
    const [graduates, setGraduates] = useState<string[]>([]);

    // API Hooks
    const { data: classesData, isLoading: classesLoading } = useGetClasses(schoolId);
    const { data: previewData, isLoading: previewLoading } = useGetPromotionPreview(schoolId);
    const promoteMutation = usePromoteClass(schoolId);

    const classes = classesData?.data || [];
    const students = previewData?.data?.students || [];

    // Filter sections for selected classes
    const sourceSections = useMemo(() => {
        const cls = classes.find((c: any) => c.classId === sourceClassId);
        return cls?.sections || [];
    }, [sourceClassId, classes]);

    const targetSections = useMemo(() => {
        const cls = classes.find((c: any) => c.classId === targetClassId);
        return cls?.sections || [];
    }, [targetClassId, classes]);

    // Filter students belonging to selected class/section
    const filteredStudents = useMemo(() => {
        if (!sourceClassId) return [];
        return students.filter((student) => {
            const matchesClass = student.class === sourceClassId;
            const matchesSection = !sourceSectionId || student.section === sourceSectionId;
            return matchesClass && matchesSection;
        });
    }, [sourceClassId, sourceSectionId, students]);

    const handleRepeaterToggle = (studentId: string) => {
        setRepeaters((prev) =>
            prev.includes(studentId)
                ? prev.filter((id) => id !== studentId)
                : [...prev.filter((id) => !graduates.includes(id)), studentId] // disable graduation if repeating
        );
        // remove from graduates if checked as repeater
        setGraduates((prev) => prev.filter((id) => id !== studentId));
    };

    const handleGraduateToggle = (studentId: string) => {
        setGraduates((prev) =>
            prev.includes(studentId)
                ? prev.filter((id) => id !== studentId)
                : [...prev.filter((id) => !repeaters.includes(id)), studentId] // disable repeat if graduating
        );
        // remove from repeaters if checked as graduate
        setRepeaters((prev) => prev.filter((id) => id !== studentId));
    };

    const handlePromote = async () => {
        if (!sourceClassId || !targetClassId || !newAcademicYear) {
            showNotification("Please fill in all required fields", "warning");
            return;
        }

        try {
            await promoteMutation.mutateAsync({
                classId: sourceClassId,
                sectionId: sourceSectionId || undefined,
                targetClassId,
                targetSectionId: targetSectionId || undefined,
                newAcademicYear,
                repeaters,
                graduates,
                notes,
            });
            showNotification("Class promoted successfully!", "success");
            // Clear selections
            setSourceClassId("");
            setSourceSectionId("");
            setTargetClassId("");
            setTargetSectionId("");
            setNewAcademicYear("");
            setNotes("");
            setRepeaters([]);
            setGraduates([]);
        } catch (error: any) {
            showNotification(error.message || "Failed to promote class", "error");
        }
    };

    if (classesLoading || previewLoading) {
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
                    Promote Single Class
                </Typography>
            )}

            <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, md: 4 }}>
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
                            Promotion Parameters
                        </Typography>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <FormControl fullWidth size="small" required>
                                <InputLabel>Source Class</InputLabel>
                                <Select
                                    value={sourceClassId}
                                    label="Source Class"
                                    onChange={(e) => {
                                        setSourceClassId(e.target.value);
                                        setSourceSectionId("");
                                    }}
                                >
                                    {classes.map((cls: any) => (
                                        <MenuItem key={cls.classId} value={cls.classId}>
                                            {cls.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth size="small">
                                <InputLabel>Source Section (Optional)</InputLabel>
                                <Select
                                    value={sourceSectionId}
                                    label="Source Section (Optional)"
                                    onChange={(e) => setSourceSectionId(e.target.value)}
                                    disabled={!sourceClassId}
                                >
                                    <MenuItem value="">All Sections</MenuItem>
                                    {sourceSections.map((sec: any) => (
                                        <MenuItem key={sec.sectionId} value={sec.sectionId}>
                                            {sec.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth size="small" required>
                                <InputLabel>Target Class</InputLabel>
                                <Select
                                    value={targetClassId}
                                    label="Target Class"
                                    onChange={(e) => {
                                        setTargetClassId(e.target.value);
                                        setTargetSectionId("");
                                    }}
                                >
                                    {classes.map((cls: any) => (
                                        <MenuItem key={cls.classId} value={cls.classId}>
                                            {cls.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth size="small">
                                <InputLabel>Target Section (Optional)</InputLabel>
                                <Select
                                    value={targetSectionId}
                                    label="Target Section (Optional)"
                                    onChange={(e) => setTargetSectionId(e.target.value)}
                                    disabled={!targetClassId}
                                >
                                    <MenuItem value="">Maintain Current Sections</MenuItem>
                                    {targetSections.map((sec: any) => (
                                        <MenuItem key={sec.sectionId} value={sec.sectionId}>
                                            {sec.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <AppSelect
                                label="New Academic Year"
                                required
                                value={newAcademicYear || nextAcademicYear}
                                options={upcomingAcademicYearOptions}
                                onChange={(e) => {
                                    const val = e.target.value as string;
                                    if (val === '__create_new__') {
                                        navigate('/school-admin/exam/config?tab=years', { state: { openAddAcademicYear: true } });
                                    } else {
                                        setNewAcademicYear(val);
                                    }
                                }}
                            />

                            <TextField
                                label="Notes / Remarks"
                                multiline
                                rows={2}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                size="small"
                                placeholder="Optional promotion notes"
                            />

                            <Button
                                variant="contained"
                                color="primary"
                                fullWidth
                                onClick={handlePromote}
                                disabled={!sourceClassId || !targetClassId || !newAcademicYear || promoteMutation.isPending}
                                sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600, py: 1 }}
                            >
                                {promoteMutation.isPending ? <CircularProgress size={20} color="inherit" /> : "Execute Promotion"}
                            </Button>
                        </Box>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 8 }}>
                    {sourceClassId ? (
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                                <Typography variant="subtitle1" fontWeight={700} color="#0f172a">
                                    Student List
                                </Typography>
                                <Chip
                                    label={`${filteredStudents.length} Students`}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    sx={{ fontWeight: 600, height: 22, fontSize: '0.75rem' }}
                                />
                            </Box>

                            {filteredStudents.length === 0 ? (
                                <Alert severity="info" sx={{ borderRadius: 2 }}>No active students found in this class/section.</Alert>
                            ) : isMobile ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {filteredStudents.map((student) => {
                                        const isRepeating = repeaters.includes(student.studentId);
                                        const isGraduating = graduates.includes(student.studentId);

                                        return (
                                            <Paper
                                                key={student.studentId}
                                                variant="outlined"
                                                sx={{
                                                    p: 1.5,
                                                    borderRadius: 2,
                                                    borderColor: '#e2e8f0',
                                                    bgcolor: isRepeating ? '#fffbeb' : isGraduating ? '#f0fdf4' : '#ffffff',
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={700} color="#0f172a">
                                                            {student.firstName} {student.lastName}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Roll: {student.rollNumber || "—"} • ID: {student.studentId}
                                                        </Typography>
                                                    </Box>
                                                    {isRepeating && <Chip label="Repeating" size="small" color="warning" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }} />}
                                                    {isGraduating && <Chip label="Graduating" size="small" color="success" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }} />}
                                                </Box>

                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: '1px solid #f1f5f9' }}>
                                                    <Button
                                                        size="small"
                                                        variant={isRepeating ? "contained" : "outlined"}
                                                        color="warning"
                                                        onClick={() => handleRepeaterToggle(student.studentId)}
                                                        sx={{ textTransform: 'none', fontSize: '0.75rem', py: 0.25, borderRadius: 1 }}
                                                    >
                                                        {isRepeating ? "✓ Repeat" : "Mark Repeat"}
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        variant={isGraduating ? "contained" : "outlined"}
                                                        color="success"
                                                        onClick={() => handleGraduateToggle(student.studentId)}
                                                        sx={{ textTransform: 'none', fontSize: '0.75rem', py: 0.25, borderRadius: 1 }}
                                                    >
                                                        {isGraduating ? "✓ Graduate" : "Graduate"}
                                                    </Button>
                                                </Box>
                                            </Paper>
                                        );
                                    })}
                                </Box>
                            ) : (
                                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, maxHeight: 500 }}>
                                    <Table stickyHeader size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 700 }}>Roll No</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Student ID</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 700 }}>Repeat (Stay in Class)</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 700 }}>Graduate (Archive)</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filteredStudents.map((student) => (
                                                <TableRow key={student.studentId}>
                                                    <TableCell>{student.rollNumber || "-"}</TableCell>
                                                    <TableCell sx={{ fontWeight: 600 }}>
                                                        {student.firstName} {student.lastName}
                                                    </TableCell>
                                                    <TableCell color="text.secondary">{student.studentId}</TableCell>
                                                    <TableCell align="center">
                                                        <Checkbox
                                                            size="small"
                                                            checked={repeaters.includes(student.studentId)}
                                                            onChange={() => handleRepeaterToggle(student.studentId)}
                                                            color="warning"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Checkbox
                                                            size="small"
                                                            checked={graduates.includes(student.studentId)}
                                                            onChange={() => handleGraduateToggle(student.studentId)}
                                                            color="success"
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Box>
                    ) : (
                        <Paper
                            variant="outlined"
                            sx={{
                                borderStyle: "dashed",
                                borderColor: "#cbd5e1",
                                borderRadius: 2,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                minHeight: { xs: 160, sm: 280 },
                                p: 3,
                                bgcolor: "#f8fafc",
                            }}
                        >
                            <Typography variant="body2" color="text.secondary" textAlign="center">
                                Select a Source Class to preview and customize student promotions
                            </Typography>
                        </Paper>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
};

export default ClassPromotion;
