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
import { useGetPromotionPreview, useMarkRepeat } from "../../../queries/Promotion";
import { useNotificationStore } from "../../../stores/notificationStore";
import { useIsMobile } from "../../../hooks/useIsMobile";
import { useAcademicYear } from "../../../hooks/useAcademicYear";
import { AppSelect } from "../../../components/shared/AppSelect";
import { useNavigate } from "react-router-dom";

const RepeatStudents = () => {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const schoolId = TokenService.getSchoolId() || "";
    const { showNotification } = useNotificationStore();
    const { upcomingAcademicYearOptions, nextAcademicYear } = useAcademicYear();

    // Filters & Payload States
    const [selectedClassId, setSelectedClassId] = useState("");
    const [selectedSectionId, setSelectedSectionId] = useState("");
    const [newAcademicYear, setNewAcademicYear] = useState("");

    useEffect(() => {
        if (!newAcademicYear && nextAcademicYear) {
            setNewAcademicYear(nextAcademicYear);
        }
    }, [nextAcademicYear, newAcademicYear]);

    const [notes, setNotes] = useState("");
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

    // API Hooks
    const { data: classesData, isLoading: classesLoading } = useGetClasses(schoolId);
    const { data: previewData, isLoading: previewLoading } = useGetPromotionPreview(schoolId);
    const markRepeatMutation = useMarkRepeat(schoolId);

    const classes = classesData?.data || [];
    const students = previewData?.data?.students || [];

    // Filter sections for the selected class
    const sections = useMemo(() => {
        const cls = classes.find((c: any) => c.classId === selectedClassId);
        return cls?.sections || [];
    }, [selectedClassId, classes]);

    // Filter students by class and section
    const filteredStudents = useMemo(() => {
        if (!selectedClassId) return [];
        return students.filter((student) => {
            const matchesClass = student.class === selectedClassId;
            const matchesSection = !selectedSectionId || student.section === selectedSectionId;
            return matchesClass && matchesSection;
        });
    }, [selectedClassId, selectedSectionId, students]);

    const handleSelectStudent = (studentId: string) => {
        setSelectedStudentIds((prev) =>
            prev.includes(studentId)
                ? prev.filter((id) => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedStudentIds(filteredStudents.map((s) => s.studentId));
        } else {
            setSelectedStudentIds([]);
        }
    };

    const handleMarkRepeat = async () => {
        if (selectedStudentIds.length === 0) {
            showNotification("Please select at least one student", "warning");
            return;
        }
        if (!newAcademicYear) {
            showNotification("Please specify the New Academic Year", "warning");
            return;
        }

        try {
            await markRepeatMutation.mutateAsync({
                studentIds: selectedStudentIds,
                newAcademicYear,
                notes,
            });
            showNotification("Students successfully marked as repeating!", "success");
            setSelectedStudentIds([]);
            setNewAcademicYear("");
            setNotes("");
        } catch (error: any) {
            showNotification(error.message || "Failed to mark repeaters", "error");
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
                    Mark Students to Repeat
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
                            Select Class & Parameters
                        </Typography>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <FormControl fullWidth size="small" required>
                                <InputLabel>Class</InputLabel>
                                <Select
                                    value={selectedClassId}
                                    label="Class"
                                    onChange={(e) => {
                                        setSelectedClassId(e.target.value);
                                        setSelectedSectionId("");
                                        setSelectedStudentIds([]);
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
                                <InputLabel>Section (Optional)</InputLabel>
                                <Select
                                    value={selectedSectionId}
                                    label="Section (Optional)"
                                    onChange={(e) => {
                                        setSelectedSectionId(e.target.value);
                                        setSelectedStudentIds([]);
                                    }}
                                    disabled={!selectedClassId}
                                >
                                    <MenuItem value="">All Sections</MenuItem>
                                    {sections.map((sec: any) => (
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
                                label="Notes / Reason"
                                multiline
                                rows={2}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                size="small"
                                placeholder="Reason for repeating"
                            />

                            <Button
                                variant="contained"
                                color="warning"
                                fullWidth
                                onClick={handleMarkRepeat}
                                disabled={selectedStudentIds.length === 0 || !newAcademicYear || markRepeatMutation.isPending}
                                sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600, py: 1 }}
                            >
                                {markRepeatMutation.isPending ? <CircularProgress size={20} color="inherit" /> : `Mark ${selectedStudentIds.length} Selected as Repeaters`}
                            </Button>
                        </Box>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 8 }}>
                    {selectedClassId ? (
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                                <Typography variant="subtitle1" fontWeight={700} color="#0f172a">
                                    Student List
                                </Typography>
                                <Chip
                                    label={`${selectedStudentIds.length} of ${filteredStudents.length} Selected`}
                                    size="small"
                                    color={selectedStudentIds.length > 0 ? "warning" : "default"}
                                    variant="outlined"
                                    sx={{ fontWeight: 600, height: 22, fontSize: '0.75rem' }}
                                />
                            </Box>

                            {filteredStudents.length === 0 ? (
                                <Alert severity="info" sx={{ borderRadius: 2 }}>No active students found in this class/section.</Alert>
                            ) : isMobile ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 1.25,
                                            borderRadius: 2,
                                            borderColor: '#e2e8f0',
                                            bgcolor: '#f8fafc',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                        }}
                                    >
                                        <Typography variant="body2" fontWeight={600} color="#0f172a">
                                            Select All Students
                                        </Typography>
                                        <Checkbox
                                            size="small"
                                            indeterminate={
                                                selectedStudentIds.length > 0 &&
                                                selectedStudentIds.length < filteredStudents.length
                                            }
                                            checked={
                                                filteredStudents.length > 0 &&
                                                selectedStudentIds.length === filteredStudents.length
                                            }
                                            onChange={(e) => handleSelectAll(e.target.checked)}
                                        />
                                    </Paper>

                                    {filteredStudents.map((student) => {
                                        const isChecked = selectedStudentIds.includes(student.studentId);
                                        return (
                                            <Paper
                                                key={student.studentId}
                                                variant="outlined"
                                                onClick={() => handleSelectStudent(student.studentId)}
                                                sx={{
                                                    p: 1.5,
                                                    borderRadius: 2,
                                                    borderColor: isChecked ? 'warning.main' : '#e2e8f0',
                                                    bgcolor: isChecked ? '#fffbeb' : '#ffffff',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                <Box>
                                                    <Typography variant="body2" fontWeight={700} color="#0f172a">
                                                        {student.firstName} {student.lastName}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Roll: {student.rollNumber || "—"} • ID: {student.studentId}
                                                    </Typography>
                                                </Box>
                                                <Checkbox
                                                    size="small"
                                                    color="warning"
                                                    checked={isChecked}
                                                    onChange={() => handleSelectStudent(student.studentId)}
                                                />
                                            </Paper>
                                        );
                                    })}
                                </Box>
                            ) : (
                                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, maxHeight: 500 }}>
                                    <Table stickyHeader size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        size="small"
                                                        indeterminate={
                                                            selectedStudentIds.length > 0 &&
                                                            selectedStudentIds.length < filteredStudents.length
                                                        }
                                                        checked={
                                                            filteredStudents.length > 0 &&
                                                            selectedStudentIds.length === filteredStudents.length
                                                        }
                                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Roll No</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Student ID</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Current Academic Year</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filteredStudents.map((student) => (
                                                <TableRow key={student.studentId} hover onClick={() => handleSelectStudent(student.studentId)} sx={{ cursor: 'pointer' }}>
                                                    <TableCell padding="checkbox">
                                                        <Checkbox
                                                            size="small"
                                                            checked={selectedStudentIds.includes(student.studentId)}
                                                            onChange={() => handleSelectStudent(student.studentId)}
                                                        />
                                                    </TableCell>
                                                    <TableCell>{student.rollNumber || "-"}</TableCell>
                                                    <TableCell sx={{ fontWeight: 600 }}>
                                                        {student.firstName} {student.lastName}
                                                    </TableCell>
                                                    <TableCell color="text.secondary">{student.studentId}</TableCell>
                                                    <TableCell>{student.academicYear || "-"}</TableCell>
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
                                Select a Class to load students and mark repeaters
                            </Typography>
                        </Paper>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
};

export default RepeatStudents;
