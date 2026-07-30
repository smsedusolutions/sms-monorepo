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
  ToggleButton,
  ToggleButtonGroup,
  Alert,
} from "@mui/material";
import { Save as SaveIcon, Refresh as RefreshIcon } from "@mui/icons-material";
import { useGetTeachers } from "../../../queries/Teacher";
import { AppButton } from "../../../components/shared/AppButton";
import { AppDatePicker } from "../../../components/shared/AppDatePicker";
import { format } from "date-fns";
import {
  useGetTeachersAttendance,
  useMarkTeacherAttendance,
} from "../../../queries/Attendance";
import type {
  Teacher,
  AttendanceStatus,
  TeacherAttendance as TeacherAttType,
} from "../../../types";
import TokenService from "../../../queries/token/tokenService";
import { useNotification } from "../../../hooks/useNotification";

interface AttendanceRecord {
  teacherId: string;
  status: AttendanceStatus;
  leaveType?: "casual" | "sick" | "earned" | "unpaid" | "other";
  remarks?: string;
  checkInTime?: string;
  checkOutTime?: string;
  markedByRole?: string;
}

const TeacherAttendancePage = () => {
  const schoolId = TokenService.getSchoolId() || "";
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [attendance, setAttendance] = useState<
    Record<string, AttendanceRecord>
  >({});
  const notify = useNotification();

  const { data: teachersData, isLoading: teachersLoading } =
    useGetTeachers(schoolId);
  const teachers = teachersData?.data || [];

  const { data: existingData, isLoading: attendanceLoading, refetch: refetchAttendance, dataUpdatedAt } =
    useGetTeachersAttendance(schoolId, selectedDate);
  const existingAttendance = existingData?.data?.attendance || [];
  console.log("[DEBUG Admin UI] selectedDate:", selectedDate, "existingAttendance:", existingAttendance.length, "dataUpdatedAt:", dataUpdatedAt);
  const summary = existingData?.data?.summary;

  const markAttendance = useMarkTeacherAttendance(schoolId);

  // Initialize attendance from existing
  useEffect(() => {
    if (existingAttendance.length > 0) {
      const existing: Record<string, AttendanceRecord> = {};
      existingAttendance.forEach((a: TeacherAttType) => {
        existing[a.teacherId] = {
          teacherId: a.teacherId,
          status: a.status,
          leaveType: a.leaveType,
          checkInTime: a.checkInTime,
          checkOutTime: a.checkOutTime,
          markedByRole: a.markedByRole,
        };
      });
      setAttendance(existing);
    } else {
      // Clear attendance when no data exists (date changed)
      setAttendance({});
    }
  }, [existingAttendance]);

  const handleStatusChange = (teacherId: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({
      ...prev,
      [teacherId]: { ...prev[teacherId], teacherId, status },
    }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const updated: Record<string, AttendanceRecord> = {};
    teachers.forEach((t: Teacher) => {
      updated[t.teacherId] = { teacherId: t.teacherId, status };
    });
    setAttendance(updated);
  };

  const handleSave = async () => {
    try {
      const res = await markAttendance.mutateAsync({
        date: selectedDate,
        attendanceRecords: Object.values(attendance),
      });
      notify.success(res.message);
      refetchAttendance(); // Refetch to get updated metadata
    } catch (err: any) {
      notify.error(err.message || "Failed to save attendance");
    }
  };

  const getTeacherAttendance = (
    teacherId: string,
  ): AttendanceRecord | undefined => {
    return (
      attendance[teacherId] ||
      existingAttendance.find((a: TeacherAttType) => a.teacherId === teacherId)
    );
  };

  const formatTime = (time?: string) => {
    if (!time) return "-";
    return new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Teacher Attendance
      </Typography>

      {/* Date Picker */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <AppDatePicker
            label="Attendance Date"
            value={selectedDate ? new Date(selectedDate) : null}
            maxDate={new Date()}
            onChange={(date) => setSelectedDate(date ? format(date, "yyyy-MM-dd") : "")}
          />
          <AppButton
            size="small"
            variant="outlined"
            color="success"
            onClick={() => handleMarkAll("present")}
          >
            Mark All Present
          </AppButton>
          <AppButton
            size="small"
            variant="outlined"
            color="error"
            onClick={() => handleMarkAll("absent")}
          >
            Mark All Absent
          </AppButton>
          <AppButton
            size="small"
            variant="outlined"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={() => refetchAttendance()}
          >
            Refresh
          </AppButton>
        </Box>
      </Paper>

      {/* Summary */}
      {summary && (
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          <Chip label={`Total: ${summary.total}`} variant="outlined" />
          <Chip label={`Present: ${summary.present}`} color="success" />
          <Chip label={`Absent: ${summary.absent}`} color="error" />
          <Chip label={`Late: ${summary.late}`} color="warning" />
          <Chip label={`Leave: ${summary.leave}`} color="info" />
        </Box>
      )}

      {/* Table */}
      {teachersLoading || attendanceLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : teachers.length === 0 ? (
        <Alert severity="info">No teachers found</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Teacher ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell align="center">Check-In</TableCell>
                <TableCell align="center">Check-Out</TableCell>
                <TableCell align="center">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {teachers.map((teacher: Teacher, index: number) => {
                const att = getTeacherAttendance(teacher.teacherId);
                return (
                  <TableRow key={teacher.teacherId} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{teacher.teacherId}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {teacher.firstName} {teacher.lastName}
                      </Typography>
                      {att?.markedByRole && (
                        <Typography variant="caption" color="text.secondary">
                          Marked by {att.markedByRole === 'sch_admin' ? 'Admin' : 'Self'}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {att?.checkInTime ? (
                        <Chip label={formatTime(att.checkInTime)} size="small" color="success" variant="outlined" />
                      ) : "-"}
                    </TableCell>
                    <TableCell align="center">
                      {att?.checkOutTime ? (
                        <Chip label={formatTime(att.checkOutTime)} size="small" color="primary" variant="outlined" />
                      ) : "-"}
                    </TableCell>
                    <TableCell align="center">
                      <ToggleButtonGroup
                        size="small"
                        value={att?.status || null}
                        exclusive
                        onChange={(_, value) =>
                          value && handleStatusChange(teacher.teacherId, value)
                        }
                      >
                        <ToggleButton value="present" color="success">
                          P
                        </ToggleButton>
                        <ToggleButton value="absent" color="error">
                          A
                        </ToggleButton>
                        <ToggleButton value="late" color="warning">
                          L
                        </ToggleButton>
                        <ToggleButton value="leave" color="info">
                          LV
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}


      {/* Save */}
      {teachers.length > 0 && (
        <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
          <AppButton
            variant="contained"
            size="large"
            loading={markAttendance.isPending}
            startIcon={!markAttendance.isPending && <SaveIcon />}
            onClick={handleSave}
          >
            Save Teacher Attendance
          </AppButton>
        </Box>
      )}
    </Box>
  );
};

export default TeacherAttendancePage;
