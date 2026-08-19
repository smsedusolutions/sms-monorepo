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
import { useIsMobile } from "../../../hooks/useIsMobile";
import MobileCardList from "../../../components/mobile/data/MobileCardList";
import MobileCardItem from "../../../components/mobile/data/MobileCardItem";
import { MobileStickyActionBar } from "../../../components/mobile/navigation/MobileStickyActionBar";

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
  const isMobile = useIsMobile();
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

  const markAttendance = useMarkTeacherAttendance(schoolId);

  // Sync existing attendance data into local state whenever it changes
  useEffect(() => {
    if (existingAttendance.length > 0) {
      const existingMap: Record<string, AttendanceRecord> = {};
      existingAttendance.forEach((item: TeacherAttType) => {
        existingMap[item.teacherId] = {
          teacherId: item.teacherId,
          status: item.status,
          leaveType: item.leaveType,
          remarks: item.remarks,
          checkInTime: item.checkInTime,
          checkOutTime: item.checkOutTime,
          markedByRole: item.markedByRole,
        };
      });
      setAttendance(existingMap);
    } else {
      setAttendance({});
    }
  }, [existingData, dataUpdatedAt]);

  const handleStatusChange = (
    teacherId: string,
    status: AttendanceStatus,
  ) => {
    setAttendance((prev) => ({
      ...prev,
      [teacherId]: {
        ...prev[teacherId],
        teacherId,
        status,
      },
    }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const updated: Record<string, AttendanceRecord> = {};
    teachers.forEach((t: Teacher) => {
      updated[t.teacherId] = {
        ...attendance[t.teacherId],
        teacherId: t.teacherId,
        status,
      };
    });
    setAttendance(updated);
  };

  const handleSave = async () => {
    const records = Object.values(attendance).map((item) => ({
      teacherId: item.teacherId,
      status: item.status,
      leaveType: item.leaveType,
      remarks: item.remarks,
      markedByRole: item.markedByRole || "sch_admin",
    }));

    if (records.length === 0) {
      notify.warning("No attendance records to save");
      return;
    }

    try {
      await markAttendance.mutateAsync({
        date: selectedDate,
        attendanceRecords: records,
      });
      notify.success("Teacher attendance saved successfully");
    } catch {
      notify.error("Failed to save teacher attendance");
    }
  };

  // Calculate summary stats
  const summary = teachers.reduce(
    (acc, t: Teacher) => {
      const att =
        attendance[t.teacherId] ||
        existingAttendance.find((a: TeacherAttType) => a.teacherId === t.teacherId);
      if (att?.status) {
        acc[att.status] = (acc[att.status] || 0) + 1;
      }
      return acc;
    },
    { present: 0, absent: 0, late: 0, leave: 0, total: teachers.length } as Record<string, number>,
  );

  const getTeacherAttendance = (teacherId: string) => {
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
    <Box sx={{ p: { xs: 1, sm: 3 }, pb: isMobile ? 10 : 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#0f172a', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
        Teacher Attendance
      </Typography>

      {/* Date Picker and Quick Actions */}
      <Paper sx={{ p: { xs: 2, sm: 2.5 }, mb: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }} elevation={0}>
        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <AppDatePicker
            label="Attendance Date"
            value={selectedDate ? new Date(selectedDate) : null}
            maxDate={new Date()}
            onChange={(date) => setSelectedDate(date ? format(date, "yyyy-MM-dd") : "")}
            sx={{ mb: 0, minWidth: { xs: '100%', sm: 220 } }}
          />
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
            <AppButton
              size="small"
              variant="outlined"
              color="success"
              onClick={() => handleMarkAll("present")}
              sx={{ flex: { xs: 1, sm: 'none' }, fontWeight: 700 }}
            >
              Mark All Present
            </AppButton>
            <AppButton
              size="small"
              variant="outlined"
              color="error"
              onClick={() => handleMarkAll("absent")}
              sx={{ flex: { xs: 1, sm: 'none' }, fontWeight: 700 }}
            >
              Mark All Absent
            </AppButton>
            <AppButton
              size="small"
              variant="outlined"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={() => refetchAttendance()}
              sx={{ fontWeight: 700 }}
            >
              Refresh
            </AppButton>
          </Box>
        </Box>
      </Paper>

      {/* Summary Chips */}
      {summary && (
        <Box sx={{ display: "flex", gap: 1, mb: 2.5, flexWrap: "wrap" }}>
          <Chip label={`Total: ${summary.total}`} variant="outlined" sx={{ fontWeight: 700, borderRadius: '8px' }} />
          <Chip label={`Present: ${summary.present}`} color="success" sx={{ fontWeight: 700, borderRadius: '8px' }} />
          <Chip label={`Absent: ${summary.absent}`} color="error" sx={{ fontWeight: 700, borderRadius: '8px' }} />
          <Chip label={`Late: ${summary.late}`} color="warning" sx={{ fontWeight: 700, borderRadius: '8px' }} />
          <Chip label={`Leave: ${summary.leave}`} color="info" sx={{ fontWeight: 700, borderRadius: '8px' }} />
        </Box>
      )}

      {/* Teacher Roster Display */}
      {teachersLoading || attendanceLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : teachers.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>No teachers found</Alert>
      ) : isMobile ? (
        <MobileCardList
          emptyTitle="No Teachers Found"
          emptyMessage="No teacher profiles registered in the school."
          totalCount={teachers.length}
          itemCount={teachers.length}
        >
          {teachers.map((teacher: Teacher) => {
            const att = getTeacherAttendance(teacher.teacherId);
            const status = att?.status;
            return (
              <MobileCardItem
                key={teacher.teacherId}
                title={`${teacher.firstName} ${teacher.lastName}`}
                subtitle={`ID: ${teacher.teacherId}${teacher.phone ? ` • ${teacher.phone}` : ''}`}
                badge={
                  status
                    ? {
                      label: status.toUpperCase(),
                      color: status === 'present' ? 'success' : status === 'absent' ? 'error' : status === 'late' ? 'warning' : 'info',
                    }
                    : { label: 'UNMARKED', color: 'default' }
                }
                metaItems={[
                  { label: 'Check-In', value: formatTime(att?.checkInTime) },
                  { label: 'Check-Out', value: formatTime(att?.checkOutTime) },
                ]}
                rightAction={
                  <ToggleButtonGroup
                    size="small"
                    value={status || null}
                    exclusive
                    onChange={(_, value) =>
                      value && handleStatusChange(teacher.teacherId, value)
                    }
                    sx={{
                      '& .MuiToggleButton-root': {
                        px: 1.2,
                        py: 0.5,
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        borderRadius: '8px',
                      }
                    }}
                  >
                    <ToggleButton value="present" color="success">P</ToggleButton>
                    <ToggleButton value="absent" color="error">A</ToggleButton>
                    <ToggleButton value="late" color="warning">L</ToggleButton>
                    <ToggleButton value="leave" color="info">LV</ToggleButton>
                  </ToggleButtonGroup>
                }
              />
            );
          })}
        </MobileCardList>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }} elevation={0}>
          <Table>
            <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Teacher ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Check-In</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Check-Out</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
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
                      <Typography variant="body2" fontWeight={600}>
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
                        <Chip label={formatTime(att.checkInTime)} size="small" color="success" variant="outlined" sx={{ fontWeight: 600 }} />
                      ) : "-"}
                    </TableCell>
                    <TableCell align="center">
                      {att?.checkOutTime ? (
                        <Chip label={formatTime(att.checkOutTime)} size="small" color="primary" variant="outlined" sx={{ fontWeight: 600 }} />
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
                        <ToggleButton value="present" color="success">P</ToggleButton>
                        <ToggleButton value="absent" color="error">A</ToggleButton>
                        <ToggleButton value="late" color="warning">L</ToggleButton>
                        <ToggleButton value="leave" color="info">LV</ToggleButton>
                      </ToggleButtonGroup>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Save Button / Sticky Action Bar */}
      {teachers.length > 0 && (
        isMobile ? (
          <MobileStickyActionBar
            primaryLabel="Save Teacher Attendance"
            primaryIcon={<SaveIcon />}
            onPrimaryClick={handleSave}
            primaryLoading={markAttendance.isPending}
          />
        ) : (
          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
            <AppButton
              variant="contained"
              size="large"
              loading={markAttendance.isPending}
              startIcon={!markAttendance.isPending && <SaveIcon />}
              onClick={handleSave}
              sx={{ px: 4, py: 1.2, fontWeight: 700, borderRadius: 2.5 }}
            >
              Save Teacher Attendance
            </AppButton>
          </Box>
        )
      )}
    </Box>
  );
};

export default TeacherAttendancePage;
