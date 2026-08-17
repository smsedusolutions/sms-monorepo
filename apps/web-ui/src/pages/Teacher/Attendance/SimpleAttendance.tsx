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
  Avatar,
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
import { useIsMobile } from '../../../hooks/useIsMobile';
import MobileStickyActionBar from '../../../components/mobile/navigation/MobileStickyActionBar';
import useTeacherAttendanceGuard from '../../../hooks/useTeacherAttendanceGuard';
import AppNoticeDialog from '../../../components/shared/AppNoticeDialog';

interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  remarks?: string;
}

interface SimpleAttendanceProps {
  onGoToCheckIn?: () => void;
}

const SimpleAttendance: React.FC<SimpleAttendanceProps> = ({ onGoToCheckIn }) => {
  const isMobile = useIsMobile();
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

  // Set default selections once data is loaded
  useEffect(() => {
    if (classes.length === 1 && !selectedClass) {
      setSelectedClass(classes[0].classId);
    }
  }, [classes, selectedClass]);

  useEffect(() => {
    if (filteredSections.length === 1 && !selectedSection) {
      setSelectedSection(filteredSections[0].sectionId);
    }
  }, [filteredSections, selectedSection]);

  // Fetch existing attendance for the selected date and class
  const { data: existingAttendanceData, isLoading: attendanceLoading } =
    useGetSimpleClassAttendance(
      schoolId,
      selectedClass,
      selectedDate,
      selectedSection || undefined,
    );

  // Initialize attendance state from existing data or default to empty
  useEffect(() => {
    if (students.length > 0) {
      const initialAttendance: Record<string, AttendanceRecord> = {};

      if (
        existingAttendanceData?.data &&
        existingAttendanceData.data.length > 0
      ) {
        existingAttendanceData.data.forEach((record: any) => {
          initialAttendance[record.studentId] = {
            studentId: record.studentId,
            status: record.status,
            remarks: record.remarks,
          };
        });
      }

      students.forEach((student: Student) => {
        if (!initialAttendance[student.studentId]) {
          initialAttendance[student.studentId] = {
            studentId: student.studentId,
            status: "present",
          };
        }
      });

      setAttendance(initialAttendance);
    }
  }, [students, existingAttendanceData]);

  // Teacher attendance validation guard (working hours + check-in)
  const { validateAction, noticeState } = useTeacherAttendanceGuard(schoolId, onGoToCheckIn);

  // Mutation for saving attendance
  const markAttendance = useMarkSimpleAttendance(schoolId);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    if (!validateAction()) return;
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
    if (!validateAction()) return;
    const updated: Record<string, AttendanceRecord> = {};
    students.forEach((student: Student) => {
      updated[student.studentId] = {
        studentId: student.studentId,
        status,
      };
    });
    setAttendance(updated);
  };

  const handleSave = async () => {
    if (!validateAction()) return;
    if (!selectedClass) {
      setSnackbar({
        open: true,
        message: "Please select a class",
        severity: "error",
      });
      return;
    }

    const attendanceRecords = Object.values(attendance);
    if (attendanceRecords.length === 0) {
      setSnackbar({
        open: true,
        message: "No attendance records to save",
        severity: "error",
      });
      return;
    }

    try {
      await markAttendance.mutateAsync({
        classId: selectedClass,
        sectionId: selectedSection || undefined,
        date: selectedDate,
        attendanceRecords: attendanceRecords.map((r) => ({
          studentId: r.studentId,
          status: r.status,
          remarks: r.remarks,
        })),
      });

      setSnackbar({
        open: true,
        message: "Attendance saved successfully",
        severity: "success",
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to save attendance",
        severity: "error",
      });
    }
  };

  const getSummary = () => {
    const values = Object.values(attendance);
    return {
      total: students.length,
      present: values.filter((a) => a.status === "present").length,
      absent: values.filter((a) => a.status === "absent").length,
      late: values.filter((a) => a.status === "late").length,
    };
  };

  const summary = getSummary();

  return (
    <Box sx={{ p: { xs: 1, sm: 3 }, pb: isMobile ? 10 : 3 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom sx={{ fontFamily: '"Outfit", sans-serif' }}>
        Daily Attendance
      </Typography>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2.5, borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
          <Chip
            label={`Date: ${format(new Date(), 'dd-MM-yyyy')}`}
            color="primary"
            variant="filled"
            sx={{ fontWeight: 700, borderRadius: '10px', height: 36, px: 0.5 }}
          />
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
            sx={{ minWidth: isMobile ? '100%' : 200 }}
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
              sx={{ minWidth: isMobile ? '100%' : 150 }}
            />
          )}
        </Box>
      </Paper>

      {/* Summary Badges */}
      {students.length > 0 && (
        <Box sx={{ display: "grid", gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, mb: 2 }}>
          <Box sx={{ bgcolor: '#ffffff', p: 1, borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>Total</Typography>
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{summary.total}</Typography>
          </Box>
          <Box sx={{ bgcolor: '#ecfdf5', p: 1, borderRadius: '12px', border: '1px solid #a7f3d0', textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.68rem', color: '#059669', fontWeight: 600 }}>Present</Typography>
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: '#059669' }}>{summary.present}</Typography>
          </Box>
          <Box sx={{ bgcolor: '#fef2f2', p: 1, borderRadius: '12px', border: '1px solid #fecaca', textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.68rem', color: '#dc2626', fontWeight: 600 }}>Absent</Typography>
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: '#dc2626' }}>{summary.absent}</Typography>
          </Box>
          <Box sx={{ bgcolor: '#fffbeb', p: 1, borderRadius: '12px', border: '1px solid #fde68a', textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.68rem', color: '#d97706', fontWeight: 600 }}>Late</Typography>
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: '#d97706' }}>{summary.late}</Typography>
          </Box>
        </Box>
      )}

      {/* Quick Mark All Actions */}
      {students.length > 0 && (
        <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
          <button
            onClick={() => handleMarkAll('present')}
            className="touch-active flex-1 py-2 px-3 rounded-xl font-semibold text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 outline-none cursor-pointer"
          >
            Mark All Present
          </button>
          <button
            onClick={() => handleMarkAll('absent')}
            className="touch-active flex-1 py-2 px-3 rounded-xl font-semibold text-xs text-rose-700 bg-rose-50 border border-rose-200 outline-none cursor-pointer"
          >
            Mark All Absent
          </button>
        </Box>
      )}

      {/* Students View: Mobile Card List vs Desktop Table */}
      {classesLoading || studentsLoading || attendanceLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : !selectedClass ? (
        <Alert severity="info" sx={{ borderRadius: '14px' }}>Please select a class to mark attendance</Alert>
      ) : students.length === 0 ? (
        <Alert severity="warning" sx={{ borderRadius: '14px' }}>No students found in this class</Alert>
      ) : isMobile ? (
        /* Mobile Card Roster */
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
          {students.map((student: Student, index: number) => {
            const currentStatus = attendance[student.studentId]?.status || 'present';
            return (
              <Box
                key={student.studentId}
                className="touch-card-active"
                sx={{
                  bgcolor: '#ffffff',
                  p: 1.5,
                  borderRadius: '16px',
                  border: '1px solid',
                  borderColor:
                    currentStatus === 'present'
                      ? '#a7f3d0'
                      : currentStatus === 'absent'
                      ? '#fecaca'
                      : '#fde68a',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, minWidth: 0, flex: 1 }}>
                  <Avatar
                    sx={{
                      width: 38,
                      height: 38,
                      bgcolor:
                        currentStatus === 'present'
                          ? '#10b981'
                          : currentStatus === 'absent'
                          ? '#ef4444'
                          : '#f59e0b',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                    }}
                  >
                    {student.firstName?.[0] || 'S'}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }} noWrap>
                      {student.firstName} {student.lastName}
                    </Typography>
                    <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Roll: {student.rollNumber || '-'} • #{index + 1}
                    </Typography>
                  </Box>
                </Box>

                {/* Touch Toggle Buttons */}
                <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                  <button
                    onClick={() => handleStatusChange(student.studentId, 'present')}
                    className="touch-active"
                    style={{
                      padding: '6px 10px',
                      borderRadius: '10px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: currentStatus === 'present' ? '#10b981' : '#f1f5f9',
                      color: currentStatus === 'present' ? '#ffffff' : '#64748b',
                    }}
                  >
                    P
                  </button>
                  <button
                    onClick={() => handleStatusChange(student.studentId, 'absent')}
                    className="touch-active"
                    style={{
                      padding: '6px 10px',
                      borderRadius: '10px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: currentStatus === 'absent' ? '#ef4444' : '#f1f5f9',
                      color: currentStatus === 'absent' ? '#ffffff' : '#64748b',
                    }}
                  >
                    A
                  </button>
                  <button
                    onClick={() => handleStatusChange(student.studentId, 'late')}
                    className="touch-active"
                    style={{
                      padding: '6px 10px',
                      borderRadius: '10px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: currentStatus === 'late' ? '#f59e0b' : '#f1f5f9',
                      color: currentStatus === 'late' ? '#ffffff' : '#64748b',
                    }}
                  >
                    L
                  </button>
                </Box>
              </Box>
            );
          })}
        </Box>
      ) : (
        /* Desktop Table */
        <TableContainer component={Paper} sx={{ borderRadius: '16px' }}>
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

      {/* Desktop Save Button */}
      {!isMobile && students.length > 0 && (
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

      {/* Mobile Sticky Save Action Bar */}
      {isMobile && students.length > 0 && (
        <MobileStickyActionBar
          primaryLabel="Save Attendance"
          primaryIcon={<SaveIcon />}
          primaryLoading={markAttendance.isPending}
          onPrimaryClick={handleSave}
        />
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

      <AppNoticeDialog {...noticeState} />
    </Box>
  );
};

export default SimpleAttendance;
