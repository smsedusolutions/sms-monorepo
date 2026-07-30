import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Snackbar,
} from '@mui/material';
import {
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  AccessTime as LateIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useGetClasses } from '../../../queries/Class';
import { useGetStudents } from '../../../queries/Student';
import { useGetSimpleClassAttendance, useMarkSimpleAttendance } from '../../../queries/Attendance';
import { useGetTeacherById } from '../../../queries/Teacher';
import type { Student, AttendanceStatus } from '../../../types';
import TokenService from '../../../queries/token/tokenService';
import { AppSelect } from '../../../components/shared/AppSelect';
import { AppButton } from '../../../components/shared/AppButton';
import { format } from 'date-fns';

interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  remarks?: string;
}

const SimpleAttendance = () => {
  const schoolId = TokenService.getSchoolId() || "";
  const teacherId = TokenService.getTeacherId() || "";
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [attendance, setAttendance] = useState<
    Record<string, AttendanceRecord>
  >({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  // Fetch teacher profile to get assigned classes/sections
  const { data: teacherData } = useGetTeacherById(schoolId, teacherId);
  const teacher = teacherData?.data;
  const teacherClassSections = teacher?.classes || [];

  // Derivations for filtering
  const assignedClassIds = teacherClassSections.map((cs) => cs.split("#")[0]);
  const assignedSectionIds = teacherClassSections
    .filter((cs) => cs.includes("#"))
    .map((cs) => cs.split("#")[1]);

  // Fetch all classes
  const { data: classesData, isLoading: classesLoading } =
    useGetClasses(schoolId);
  const allClasses = classesData?.data || [];

  // Filter classes to only show teacher's assigned classes
  const classes =
    teacherClassSections.length > 0
      ? allClasses.filter((c) => assignedClassIds.includes(c.classId))
      : allClasses;

  // Get sections for selected class
  const selectedClassData = classes.find((c) => c.classId === selectedClass);
  const sections = selectedClassData?.sections || [];

  // Filter sections to teacher's assigned sections (if any)
  const filteredSections =
    teacherClassSections.length > 0
      ? sections.filter((s) => assignedSectionIds.includes(s.sectionId))
      : sections;

  // Fetch students for selected class
  const { data: studentsData, isLoading: studentsLoading } = useGetStudents(
    schoolId,
    {
      class: selectedClass,
      section: selectedSection || undefined,
      limit: 500,
    },
  );
  const students = studentsData?.data || [];

  // Fetch existing attendance
  const { data: existingAttendance, isLoading: attendanceLoading } =
    useGetSimpleClassAttendance(
      schoolId,
      selectedClass,
      selectedDate,
      selectedSection || undefined,
    );

  // Mark attendance mutation
  const markAttendance = useMarkSimpleAttendance(schoolId);

  // Auto-select class if teacher has only one assigned class
  useEffect(() => {
    if (classes.length === 1 && !selectedClass) {
      setSelectedClass(classes[0].classId);
    }
  }, [classes, selectedClass]);

  // Auto-select section if there's only one available section
  useEffect(() => {
    if (filteredSections.length === 1 && !selectedSection) {
      setSelectedSection(filteredSections[0].sectionId);
    } else if (filteredSections.length === 0 && selectedSection) {
      setSelectedSection("");
    }
  }, [filteredSections, selectedSection]);

  // Initialize attendance from existing data only
  useEffect(() => {
    if (existingAttendance?.data && existingAttendance.data.length > 0) {
      const existing: Record<string, AttendanceRecord> = {};
      existingAttendance.data.forEach((a) => {
        existing[a.studentId] = {
          studentId: a.studentId,
          status: a.status,
          remarks: a.remarks,
        };
      });
      setAttendance(existing);
    } else {
      // Clear attendance when no data exists (date/class changed)
      setAttendance({});
    }
  }, [existingAttendance]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        studentId,
        status,
      },
    }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const updated: Record<string, AttendanceRecord> = {};
    students.forEach((s: Student) => {
      updated[s.studentId] = {
        studentId: s.studentId,
        status,
        remarks: attendance[s.studentId]?.remarks,
      };
    });
    setAttendance(updated);
  };

  const handleSave = async () => {
    if (!selectedClass) {
      setSnackbar({
        open: true,
        message: "Please select a class",
        severity: "error",
      });
      return;
    }

    try {
      await markAttendance.mutateAsync({
        classId: selectedClass,
        sectionId: selectedSection || undefined,
        date: selectedDate,
        attendanceRecords: Object.values(attendance),
      });
      setSnackbar({
        open: true,
        message: "Attendance saved successfully!",
        severity: "success",
      });
    } catch {
      setSnackbar({
        open: true,
        message: "Failed to save attendance",
        severity: "error",
      });
    }
  };

  const getSummary = () => {
    const values = Object.values(attendance);
    return {
      total: values.length,
      present: values.filter((a) => a.status === "present").length,
      absent: values.filter((a) => a.status === "absent").length,
      late: values.filter((a) => a.status === "late").length,
    };
  };

  const summary = getSummary();

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Daily Attendance
      </Typography>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              Attendance Date
            </Typography>
            <Chip
              label={`Today: ${format(new Date(), 'dd-MM-yyyy')}`}
              color="primary"
              variant="filled"
              sx={{ fontWeight: 600, borderRadius: 1.5, py: 2 }}
            />
          </Box>
          <AppSelect
            label="Class"
            value={selectedClass}
            disabled={classes.length === 1}
            options={classes.map(c => ({ value: c.classId, label: c.name }))}
            onChange={(e) => {
              setSelectedClass(e.target.value as string);
              setSelectedSection('');
              setAttendance({});
            }}
            sx={{ minWidth: 200 }}
          />
          {filteredSections.length > 0 && (
            <AppSelect
              label="Section"
              value={selectedSection}
              disabled={filteredSections.length === 1}
              options={[
                ...(filteredSections.length > 1 ? [{ value: '', label: 'All Sections' }] : []),
                ...filteredSections.map(s => ({ value: s.sectionId, label: s.name }))
              ]}
              onChange={(e) => {
                setSelectedSection(e.target.value as string);
                setAttendance({});
              }}
              sx={{ minWidth: 150 }}
            />
          )}
        </Box>
      </Paper>

      {/* Summary Cards */}
      {students.length > 0 && (
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          <Chip
            label={`Total: ${summary.total}`}
            color="default"
            variant="outlined"
          />
          <Chip
            label={`Present: ${summary.present}`}
            color="success"
            variant="filled"
          />
          <Chip
            label={`Absent: ${summary.absent}`}
            color="error"
            variant="filled"
          />
          <Chip
            label={`Late: ${summary.late}`}
            color="warning"
            variant="filled"
          />
        </Box>
      )}

      {/* Quick Actions */}
      {students.length > 0 && (
        <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <AppButton size="small" variant="outlined" color="success" onClick={() => handleMarkAll('present')}>
            Mark All Present
          </AppButton>
          <AppButton size="small" variant="outlined" color="error" onClick={() => handleMarkAll('absent')}>
            Mark All Absent
          </AppButton>
        </Box>
      )}

      {/* Students Table */}
      {classesLoading || studentsLoading || attendanceLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : !selectedClass ? (
        <Alert severity="info">Please select a class to mark attendance</Alert>
      ) : students.length === 0 ? (
        <Alert severity="warning">No students found in this class</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Student ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Roll No</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">
                  Status
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((student: Student, index: number) => (
                <TableRow key={student.studentId} hover>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{student.studentId}</TableCell>
                  <TableCell>
                    {student.firstName} {student.lastName}
                  </TableCell>
                  <TableCell>{student.rollNumber || "-"}</TableCell>
                  <TableCell align="center">
                    <ToggleButtonGroup
                      size="small"
                      value={attendance[student.studentId]?.status || null}
                      exclusive
                      onChange={(_, value) =>
                        value && handleStatusChange(student.studentId, value)
                      }
                    >
                      <ToggleButton value="present" color="success">
                        <PresentIcon fontSize="small" />
                      </ToggleButton>
                      <ToggleButton value="absent" color="error">
                        <AbsentIcon fontSize="small" />
                      </ToggleButton>
                      <ToggleButton value="late" color="warning">
                        <LateIcon fontSize="small" />
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Save Button */}
      {students.length > 0 && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <AppButton
            variant="contained"
            size="large"
            loading={markAttendance.isPending}
            startIcon={!markAttendance.isPending && <SaveIcon />}
            onClick={handleSave}
          >
            Save Attendance
          </AppButton>
        </Box>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SimpleAttendance;
