import { useState, useMemo, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
  Backdrop,
  FormHelperText,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  TableChart as TableIcon,
  List as ListIcon,
  PictureAsPdf as PdfIcon,
  Warning as WarningIcon,
  SwapHoriz as SwapIcon,
  Download as DownloadIcon,
  FileUpload as UploadIcon,
  AutoAwesome as MagicIcon,
} from "@mui/icons-material";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  useGetActiveConfig,
  useGetClassTimetable,
  useCreateEntry,
  useUpdateEntry,
  useDeleteEntry,
  useGetTeachersOnLeave,
  useGetFreeTeachers,
  useGetSubstitutesForDate,
  useGetActiveClasses,
  useCopyClassTimetable,
  useDeleteClassTimetable,
  useBulkCreateEntries,
} from "../../../queries/Timetable";
import { useGetClasses } from "../../../queries/Class";
import { useGetTeachers } from "../../../queries/Teacher";
import { useGetSubjects } from "../../../queries/Subject";
import type {
  TimetableEntry,
  CreateTimetableEntryRequest,
} from "../../../types/timetable.types";
import TokenService from "../../../queries/token/tokenService";
import { useNotificationStore } from "../../../stores/notificationStore";
import ConfirmationDialog from "../../../components/Dialogs/ConfirmationDialog";
import { AppButton } from "../../../components/shared/AppButton";
import { generateTimetableTemplate, parseTimetableTemplate } from "../../../utils/timetableExcelUtils";
import AITimetableGenerateDialog from "../../../components/Dialogs/AITimetableGenerateDialog";

type ViewMode = "table" | "list";

interface EntryDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateTimetableEntryRequest) => void;
  editData?: TimetableEntry | null;
  dayOfWeek: string;
  periodNumber: number;
  classId: string;
  sectionId: string;
  teachers: any[];
  subjects: any[];
  isLoading: boolean;
  teachersOnLeave?: string[];
  schoolId: string;
}

const EntryDialog = ({
  open,
  onClose,
  onSave,
  editData,
  dayOfWeek,
  periodNumber,
  classId,
  sectionId,
  teachers,
  subjects,
  isLoading,
  teachersOnLeave = [],
  schoolId,
}: EntryDialogProps) => {
  // Helpers for robust teacher & subject resolution
  const getTeacherCanonicalId = (t: any): string => {
    if (!t) return "";
    return t.teacherId || t._id || t.id || t.userId || t.employeeId || "";
  };

  const getSubjectCanonicalId = (s: any): string => {
    if (!s) return "";
    return s.subjectId || s._id || s.id || s.code || "";
  };

  const findMatchingTeacher = (rawTeacherId: string): any => {
    if (!rawTeacherId) return null;
    const target = String(rawTeacherId).trim().toLowerCase();
    return teachers.find((t: any) => {
      if (!t) return false;
      const ids = [
        t.teacherId,
        t._id,
        t.id,
        t.userId,
        t.employeeId,
        t.staffId,
        t.code,
        `${t.firstName || ''} ${t.lastName || ''}`.trim(),
        t.name,
      ]
        .filter(Boolean)
        .map((id: any) => String(id).trim().toLowerCase());
      return ids.includes(target);
    });
  };

  const findMatchingSubject = (rawSubjectId: string): any => {
    if (!rawSubjectId) return null;
    const target = String(rawSubjectId).trim().toLowerCase();
    return subjects.find((s: any) => {
      if (!s) return false;
      const ids = [s.subjectId, s._id, s.id, s.code, s.name]
        .filter(Boolean)
        .map((id: any) => String(id).trim().toLowerCase());
      return ids.includes(target);
    });
  };

  const isTeacherQualifiedForSubject = (t: any, targetSubjectId: string): boolean => {
    if (!targetSubjectId) return true;
    if (!t.subjects || !Array.isArray(t.subjects) || t.subjects.length === 0) return true;

    const targetSub = findMatchingSubject(targetSubjectId);
    const validIds = new Set<string>();
    validIds.add(String(targetSubjectId).trim().toLowerCase());
    if (targetSub) {
      if (targetSub.subjectId) validIds.add(String(targetSub.subjectId).trim().toLowerCase());
      if (targetSub._id) validIds.add(String(targetSub._id).trim().toLowerCase());
      if (targetSub.id) validIds.add(String(targetSub.id).trim().toLowerCase());
      if (targetSub.code) validIds.add(String(targetSub.code).trim().toLowerCase());
      if (targetSub.name) validIds.add(String(targetSub.name).trim().toLowerCase());
    }

    return t.subjects.some((sub: any) => validIds.has(String(sub).trim().toLowerCase()));
  };

  const [teacherId, setTeacherId] = useState("");
  const [subjectId, setSubjectId] = useState("");

  // Reset state when editData changes
  useEffect(() => {
    const rawSubId = editData?.subjectId || (subjects[0] ? getSubjectCanonicalId(subjects[0]) : "");
    const matchedSub = findMatchingSubject(rawSubId);
    const canonicalSubId = matchedSub ? getSubjectCanonicalId(matchedSub) : rawSubId;

    const rawTId = editData?.teacherId || "";
    const matchedT = findMatchingTeacher(rawTId);
    const canonicalTId = matchedT ? getTeacherCanonicalId(matchedT) : rawTId;

    const qualified = teachers.filter((t: any) => isTeacherQualifiedForSubject(t, canonicalSubId));
    const validTeachers = qualified.length > 0 ? qualified : teachers;
    const finalTId = canonicalTId || (validTeachers[0] ? getTeacherCanonicalId(validTeachers[0]) : "");

    setSubjectId(canonicalSubId);
    setTeacherId(finalTId);
  }, [editData, open, teachers, subjects]);

  // Filter teachers who can teach the selected subject
  const subjectTeachers = useMemo(() => {
    if (!subjectId) return teachers;
    const qualified = teachers.filter((t: any) => isTeacherQualifiedForSubject(t, subjectId));
    return qualified.length > 0 ? qualified : teachers;
  }, [subjectId, teachers, subjects]);

  // Handle subject change
  const handleSubjectChange = (newSubjectId: string) => {
    setSubjectId(newSubjectId);
    const qualified = teachers.filter((t: any) => isTeacherQualifiedForSubject(t, newSubjectId));
    const validTeachers = qualified.length > 0 ? qualified : teachers;
    const currentTeacherObj = findMatchingTeacher(teacherId);
    const isCurrentValid = currentTeacherObj
      ? validTeachers.some((t: any) => getTeacherCanonicalId(t) === getTeacherCanonicalId(currentTeacherObj))
      : false;

    setTeacherId(
      isCurrentValid && teacherId
        ? teacherId
        : getTeacherCanonicalId(validTeachers[0])
    );
  };

  // Check if currently selected teacher is on leave
  const isTeacherOnLeave = useMemo(() => {
    const currentT = findMatchingTeacher(teacherId);
    const canonicalTId = currentT ? getTeacherCanonicalId(currentT) : teacherId;
    return teachersOnLeave.some((onLeaveId: string) => {
      const matchedOnLeave = findMatchingTeacher(onLeaveId);
      const canonicalOnLeave = matchedOnLeave ? getTeacherCanonicalId(matchedOnLeave) : onLeaveId;
      return canonicalOnLeave.toLowerCase() === canonicalTId.toLowerCase();
    });
  }, [teacherId, teachersOnLeave, teachers]);

  // Get free teachers for suggestions
  const { data: freeTeachersData } = useGetFreeTeachers(
    schoolId,
    dayOfWeek,
    periodNumber,
  );
  const freeTeachers = freeTeachersData?.data || [];

  // Filter suggested teachers - those who are free AND can teach the subject
  const suggestedSubstitutes = useMemo(() => {
    if (!subjectId || !isTeacherOnLeave) return [];
    return freeTeachers.filter((ft: any) => {
      const teacher = findMatchingTeacher(ft.teacherId);
      return teacher && isTeacherQualifiedForSubject(teacher, subjectId);
    });
  }, [freeTeachers, subjectId, isTeacherOnLeave, teachers, subjects]);

  const handleSubmit = () => {
    onSave({
      classId,
      sectionId,
      teacherId,
      subjectId,
      dayOfWeek,
      periodNumber,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editData ? "Edit Schedule" : "Add Schedule"}
        <Typography variant="body2" color="text.secondary">
          {dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1)} - Period{" "}
          {periodNumber}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>Subject</InputLabel>
            <Select
              value={subjectId}
              label="Subject"
              onChange={(e) => handleSubjectChange(e.target.value as string)}
            >
              {subjects.map((s: any) => {
                const sId = getSubjectCanonicalId(s);
                return (
                  <MenuItem key={sId || s.name} value={sId}>
                    {s.name} ({s.code || sId})
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          {subjectId && subjectTeachers.length === 0 && (
            <Alert severity="warning">
              No teachers are assigned to teach this subject. Please assign a teacher to this subject in Subject/Teacher configuration.
            </Alert>
          )}

          <FormControl fullWidth disabled={!subjectId || subjectTeachers.length === 0}>
            <InputLabel>Teacher</InputLabel>
            <Select
              value={teacherId}
              label="Teacher"
              onChange={(e) => setTeacherId(e.target.value)}
            >
              {subjectTeachers.map((t: any) => {
                const tId = getTeacherCanonicalId(t);
                const tName = `${t.firstName || ''} ${t.lastName || ''}`.trim() || t.name || tId;
                const onLeave = teachersOnLeave.some((onLeaveId: string) => {
                  const matchedOnLeave = findMatchingTeacher(onLeaveId);
                  const canonicalOnLeave = matchedOnLeave ? getTeacherCanonicalId(matchedOnLeave) : onLeaveId;
                  return canonicalOnLeave.toLowerCase() === tId.toLowerCase();
                });

                return (
                  <MenuItem
                    key={tId}
                    value={tId}
                    sx={
                      onLeave
                        ? { color: "error.main", bgcolor: "error.lighter" }
                        : {}
                    }
                  >
                    {tName}
                    {onLeave && (
                      <Chip
                        label="On Leave"
                        size="small"
                        color="error"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </MenuItem>
                );
              })}
            </Select>
            {!subjectId && (
              <FormHelperText>Select a subject first to view assigned teachers</FormHelperText>
            )}
          </FormControl>

          {/* Leave Warning */}
          {isTeacherOnLeave && (
            <Alert severity="warning" icon={<WarningIcon />}>
              This teacher is on leave today! Consider assigning a substitute.
            </Alert>
          )}

          {/* Substitute Suggestions */}
          {isTeacherOnLeave && suggestedSubstitutes.length > 0 && (
            <Box sx={{ p: 2, bgcolor: "info.lighter", borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Suggested Substitutes (Free & Can Teach Subject):
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {suggestedSubstitutes.map((sub: any) => (
                  <Chip
                    key={sub.teacherId}
                    label={sub.name}
                    onClick={() => setTeacherId(sub.teacherId)}
                    color="primary"
                    variant="outlined"
                    clickable
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <AppButton onClick={onClose} disabled={isLoading}>
          Cancel
        </AppButton>
        <AppButton
          onClick={handleSubmit}
          variant="contained"
          loading={isLoading}
          disabled={!teacherId || !subjectId}
        >
          {editData ? "Update" : "Add"}
        </AppButton>
      </DialogActions>
    </Dialog>
  );
};

const TimetableMaster = () => {
  const schoolId = TokenService.getSchoolId() || "";
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<TimetableEntry | null>(null);
  const [selectedSlot, setSelectedSlot] = useState({ day: "", period: 0 });
  const [selectedCopySource, setSelectedCopySource] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [aiGenerateDialogOpen, setAiGenerateDialogOpen] = useState(false);
  const { showNotification } = useNotificationStore();

  // Get today's date for leave checking
  const today = new Date().toISOString().split("T")[0];

  // Data fetching
  const { data: configData, isLoading: configLoading } =
    useGetActiveConfig(schoolId);
  const { data: classesData } = useGetClasses(schoolId);
  const { data: teachersData } = useGetTeachers(schoolId);
  const { data: subjectsData } = useGetSubjects(schoolId);
  const { data: timetableData, isLoading: timetableLoading } =
    useGetClassTimetable(schoolId, selectedClass, selectedSection);
  const { data: teachersOnLeaveData } = useGetTeachersOnLeave(schoolId, today);
  const { data: substitutesData } = useGetSubstitutesForDate(schoolId, today);
  const { data: activeClassesData } = useGetActiveClasses(schoolId);

  const createEntry = useCreateEntry(schoolId);
  const updateEntry = useUpdateEntry(schoolId);
  const deleteEntry = useDeleteEntry(schoolId);
  const copyClassTimetable = useCopyClassTimetable(schoolId);
  const deleteClassTimetable = useDeleteClassTimetable(schoolId);
  const bulkCreateEntries = useBulkCreateEntries(schoolId);

  const config = configData?.data;
  const classes = useMemo(() => {
    return (classesData?.data || []).sort((a: any, b: any) =>
      b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: 'base' })
    );
  }, [classesData]);

  const teachers = teachersData?.data || [];
  const subjects = subjectsData?.data || [];
  const entries = timetableData?.data?.entries || [];
  const teachersOnLeave = teachersOnLeaveData?.data?.teacherIds || [];
  const substitutes = substitutesData?.data || [];
  const activeClasses = activeClassesData?.data || [];

  const getTeacherDisplayName = (entry: TimetableEntry) => {
    if (!entry) return "";
    const rawTId = String(entry.teacherId || "").trim();
    if (entry.teacher?.name && entry.teacher.name !== rawTId && !entry.teacher.name.startsWith("TCH-") && !entry.teacher.name.startsWith("TEA_")) {
      return entry.teacher.name;
    }
    if (entry.teacher?.firstName || entry.teacher?.lastName) {
      const fn = `${entry.teacher.firstName || ''} ${entry.teacher.lastName || ''}`.trim();
      if (fn) return fn;
    }
    if (!rawTId) return "";

    const teacher = teachers.find((t: any) => {
      if (!t) return false;
      const ids = [t.teacherId, t._id, t.id, t.userId, t.employeeId, t.staffId, t.code]
        .filter(Boolean)
        .map((id: any) => String(id).trim().toLowerCase());
      return ids.includes(rawTId.toLowerCase());
    });

    if (teacher) {
      const fn = `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim();
      if (fn) return fn;
      if (teacher.name && !teacher.name.startsWith("TCH-")) return teacher.name;
    }
    return rawTId;
  };

  // Get sections for selected class
  const selectedClassObj = classes.find(
    (c: any) => c.classId === selectedClass,
  );
  const sections = useMemo(() => {
    return (selectedClassObj?.sections || []).sort((a: any, b: any) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );
  }, [selectedClassObj]);

  const className = selectedClassObj?.name || selectedClass;
  const sectionName =
    sections.find((s: any) => s.sectionId === selectedSection)?.name ||
    selectedSection;

  // Get all periods from config
  const allPeriods = useMemo(() => {
    return [...(config?.periods || [])].sort((a, b) => {
      const timeToMinutes = (time?: string) => {
        if (!time) return 0;
        const [hours, minutes] = time.split(":").map(Number);
        return hours * 60 + (minutes || 0);
      };
      return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
    });
  }, [config]);

  // Create entry lookup map
  const entryMap = useMemo(() => {
    const map: Record<string, TimetableEntry> = {};
    entries.forEach((entry: TimetableEntry) => {
      map[`${entry.dayOfWeek}-${entry.periodNumber}`] = entry;
    });
    return map;
  }, [entries]);

  // Create substitute lookup map by day-period for current class/section
  const substituteMap = useMemo(() => {
    const map: Record<string, any> = {};
    substitutes.forEach((sub: any) => {
      // Only include substitutes for the currently selected class/section
      if (
        sub.entry?.classId === selectedClass &&
        sub.entry?.sectionId === selectedSection
      ) {
        map[`${sub.entry?.dayOfWeek}-${sub.entry?.periodNumber}`] = sub;
      }
    });
    return map;
  }, [substitutes, selectedClass, selectedSection]);

  // Get today's day name for highlighting
  const todayDayName = new Date()
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();

  const handleSlotClick = (day: string, period: number) => {
    const existingEntry = entryMap[`${day}-${period}`];
    setEditEntry(existingEntry || null);
    setSelectedSlot({ day, period });
    setDialogOpen(true);
  };

  const handleSaveEntry = async (data: CreateTimetableEntryRequest) => {
    try {
      if (editEntry) {
        await updateEntry.mutateAsync({
          entryId: editEntry.entryId,
          data,
        });
      } else {
        await createEntry.mutateAsync(data);
      }
      showNotification(
        editEntry
          ? "Timetable entry updated successfully"
          : "Timetable entry created successfully",
        "success",
      );
      setDialogOpen(false);
      setEditEntry(null);
    } catch (err: any) {
      // Conflict error handling
      if (err?.conflicts) {
        console.error("Conflicts detected:", err.conflicts);
        showNotification(
          `Conflict detected: ${err.conflicts[0].message}`,
          "error",
        );
      } else {
        showNotification(
          `Failed to save entry: ${err?.message || "Unknown error"}`,
          "error",
        );
      }
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      await deleteEntry.mutateAsync(entryId);
      showNotification("Timetable entry deleted successfully", "success");
    } catch (err: any) {
      console.error("Failed to delete entry:", err);
      showNotification(
        `Failed to delete entry: ${err?.message || "Unknown error"}`,
        "error",
      );
    }
  };

  const handleDeleteWholeTimetable = async () => {
    if (!selectedClass || !selectedSection) return;
    try {
      await deleteClassTimetable.mutateAsync({
        classId: selectedClass,
        sectionId: selectedSection,
      });
      showNotification("Timetable deleted successfully", "success");
      setIsDeleteDialogOpen(false);
    } catch (err: any) {
      console.error("Failed to delete timetable:", err);
      showNotification(
        `Failed to delete timetable: ${err?.message || "Unknown error"}`,
        "error",
      );
    }
  };

  const handleDownloadExcelTemplate = async () => {
    if (!config || !selectedClass || !selectedSection) return;
    try {
      await generateTimetableTemplate(
        config,
        subjects,
        teachers,
        className,
        sectionName,
        entries
      );
      showNotification("Excel template generated successfully", "success");
    } catch (error: any) {
      console.error(error);
      showNotification(`Failed to generate template: ${error?.message}`, "error");
    }
  };

  const handleUploadExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !config || !selectedClass || !selectedSection) return;

    try {
      const parsedEntries = await parseTimetableTemplate(
        file,
        config,
        selectedClass,
        selectedSection,
        subjects
      );

      const filteredEntries = parsedEntries.filter(parsed => {
        const exists = entries.find(existing =>
          existing.dayOfWeek.toLowerCase() === parsed.dayOfWeek.toLowerCase() &&
          existing.periodNumber === parsed.periodNumber &&
          existing.subjectId === parsed.subjectId &&
          existing.teacherId === parsed.teacherId
        );
        return !exists;
      });

      if (filteredEntries.length === 0) {
        showNotification("No new or modified entries found in the file.", "info");
        event.target.value = "";
        return;
      }

      const response = await bulkCreateEntries.mutateAsync({ entries: filteredEntries });

      const createdCount = response.data?.created?.length || 0;
      const failedCount = response.data?.failed?.length || 0;

      if (failedCount > 0) {
        showNotification(
          `Import partially successful: ${createdCount} created, ${failedCount} failed due to conflicts.`,
          "warning"
        );
      } else {
        showNotification(`Successfully imported ${createdCount} entries`, "success");
      }

      // Reset file input
      event.target.value = "";
    } catch (error: any) {
      console.error(error);
      showNotification(`Import failed: ${error?.message || "Invalid file format"}`, "error");
    }
  };

  const getEntryColor = (entry: TimetableEntry) => {
    // Only show leave warning if the entry day matches today
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const todayIndex = new Date().getDay();
    const todayName = days[todayIndex];

    if (teachersOnLeave.includes(entry.teacherId) && entry.dayOfWeek.toLowerCase() === todayName) {
      return "#ffc107"; // Amber warning color for leave today
    }
    return `#BEF4C8`;
  };

  // Export to PDF functionality
  const handleExportPdf = () => {
    if (!config || !selectedClass || !selectedSection) return;

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // Title
    doc.setFontSize(18);
    doc.setTextColor(25, 118, 210); // Primary blue color
    doc.text(`Timetable - ${className} (${sectionName})`, 14, 20);

    // Date
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);

    // Prepare table data
    const headers = [
      "Period",
      ...config.workingDays.map(
        (day) => day.charAt(0).toUpperCase() + day.slice(1),
      ),
    ];

    const rows = allPeriods.map((period) => {
      const periodLabel = `${period.name}\n(${period.startTime} - ${period.endTime})`;
      if (period.type !== "regular") {
        return [
          {
            content: periodLabel,
            styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
          },
          {
            content: period.type.toUpperCase(),
            colSpan: config.workingDays.length,
            styles: { halign: "center", fillColor: [240, 240, 240] },
          },
        ];
      }
      const row = [periodLabel];
      config.workingDays.forEach((day) => {
        const entry = entryMap[`${day}-${period.periodNumber}`];
        if (entry) {
          row.push(
            `${subjects.find(s => s.subjectId === entry.subjectId)?.name || entry.subject?.name || entry.subjectId}\n${getTeacherDisplayName(entry)}`,
          );
        } else {
          row.push("-");
        }
      });
      return row;
    });

    // Generate table
    autoTable(doc, {
      head: [headers],
      body: rows as any[],
      startY: 35,
      theme: "grid",
      headStyles: {
        fillColor: [25, 118, 210],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },
      bodyStyles: {
        halign: "center",
        valign: "middle",
      },
      columnStyles: {
        0: { fontStyle: "bold", fillColor: [245, 245, 245] },
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" },
      );
    }

    // Save
    doc.save(`timetable-${className}-${sectionName}.pdf`);
  };

  if (configLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!config) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          No timetable configuration found. Please configure the timetable
          structure first.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          mb: 3,
          gap: 2,
        }}
      >
        <Typography variant="h5" fontWeight={600}>
          Master Timetable
        </Typography>
        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            alignItems: "center",
            flexWrap: "wrap",
            width: { xs: "100%", md: "auto" }
          }}
        >
          {teachersOnLeave.length > 0 && (
            <Chip
              icon={<WarningIcon />}
              label={`${teachersOnLeave.length} teacher(s) on leave today`}
              color="warning"
              size="small"
              sx={{ width: { xs: "100%", sm: "auto" } }}
            />
          )}
          <AppButton
            variant="contained"
            color="primary"
            startIcon={<MagicIcon />}
            onClick={() => setAiGenerateDialogOpen(true)}
            size="small"
          >
            AI Auto-Generate
          </AppButton>

          {selectedClass && selectedSection && (
            <>
              <AppButton
                variant="outlined"
                startIcon={<PdfIcon />}
                onClick={handleExportPdf}
                size="small"
              >
                Export PDF
              </AppButton>
              <AppButton
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadExcelTemplate}
                size="small"
              >
                Excel Template
              </AppButton>
              <AppButton
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
                size="small"
                loading={bulkCreateEntries.isPending}
              >
                Upload Excel
                <input
                  type="file"
                  hidden
                  accept=".xlsx, .xls"
                  onChange={handleUploadExcel}
                />
              </AppButton>
              {entries.length > 0 && (
                <AppButton
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setIsDeleteDialogOpen(true)}
                  size="small"
                >
                  Delete Table
                </AppButton>
              )}
            </>
          )}

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, v) => v && setViewMode(v)}
            size="small"
          >
            <ToggleButton value="table">
              <TableIcon />
            </ToggleButton>
            <ToggleButton value="list">
              <ListIcon />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* Class/Section Selector */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Select Class</InputLabel>
              <Select
                value={selectedClass}
                label="Select Class"
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setSelectedSection("");
                }}
              >
                {classes.map((c: any) => (
                  <MenuItem key={c.classId} value={c.classId}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth size="small" disabled={!selectedClass}>
              <InputLabel>Select Section</InputLabel>
              <Select
                value={selectedSection}
                label="Select Section"
                onChange={(e) => setSelectedSection(e.target.value)}
              >
                {sections.map((s: any) => (
                  <MenuItem key={s.sectionId} value={s.sectionId}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {entries.some(entry => {
            const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
            const todayName = days[new Date().getDay()];
            return teachersOnLeave.includes(entry.teacherId) && entry.dayOfWeek.toLowerCase() === todayName;
          }) && (
              <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', ml: { md: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 16, height: 16, bgcolor: '#ffc107', borderRadius: 0.5 }} />
                    <Typography variant="caption" color="text.secondary">Teacher on Leave</Typography>
                  </Box>
                </Box>
              </Grid>
            )}
        </Grid>
      </Paper>

      {/* Timetable Grid */}
      {selectedClass && selectedSection && (
        <Paper sx={{ p: 2, overflow: "auto" }}>
          {entries.length === 0 &&
            !timetableLoading &&
            activeClasses.length > 0 && (
              <Box
                sx={{
                  p: 2,
                  mb: 3,
                  bgcolor: "background.default",
                  borderRadius: 1,
                  border: "1px dashed text.disabled",
                }}
              >
                <Typography variant="subtitle2" gutterBottom>
                  No timetable exists for this class/section. You can copy from
                  an existing one:
                </Typography>
                <Box
                  sx={{ display: "flex", gap: 2, alignItems: "center", mt: 1 }}
                >
                  <FormControl size="small" sx={{ minWidth: 250 }}>
                    <InputLabel>Select Source Class/Section</InputLabel>
                    <Select
                      value={selectedCopySource}
                      label="Select Source Class/Section"
                      onChange={(e) => setSelectedCopySource(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {activeClasses
                        .filter(
                          (ac: any) =>
                            !(
                              ac.classId === selectedClass &&
                              ac.sectionId === selectedSection
                            ),
                        )
                        .map((ac: any) => (
                          <MenuItem
                            key={`${ac.classId}-${ac.sectionId}`}
                            value={`${ac.classId}-${ac.sectionId}`}
                          >
                            {ac.className} - {ac.sectionName}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                  <AppButton
                    variant="outlined"
                    disabled={
                      !selectedCopySource || copyClassTimetable.isPending
                    }
                    loading={copyClassTimetable.isPending}
                    onClick={async () => {
                      const [sourceClassId, sourceSectionId] =
                        selectedCopySource.split("-");
                      try {
                        await copyClassTimetable.mutateAsync({
                          targetClassId: selectedClass,
                          targetSectionId: selectedSection,
                          sourceClassId,
                          sourceSectionId,
                        });
                        showNotification(
                          "Timetable copied successfully",
                          "success",
                        );
                        setSelectedCopySource("");
                      } catch (error: any) {
                        console.error(error);
                        showNotification(
                          `Failed to copy timetable: ${error?.message || "Unknown error"}`,
                          "error",
                        );
                      }
                    }}
                  >
                    Copy Timetable
                  </AppButton>
                </Box>
              </Box>
            )}

          {timetableLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : viewMode === "table" ? (
            /* Table View */
            <Box sx={{ overflowX: "auto" }}>
              <Box
                component="table"
                sx={{
                  width: "100%",
                  borderCollapse: "collapse",
                  "& th, & td": {
                    border: "1px solid",
                    borderColor: "divider",
                    p: 1,
                    textAlign: "center",
                    minWidth: 120,
                  },
                  "& th": {
                    bgcolor: "primary.main",
                    color: "white",
                    fontWeight: 600,
                  },
                }}
              >
                <thead>
                  <tr>
                    <th>Period</th>
                    {config.workingDays.map((day) => (
                      <th
                        key={day}
                        style={
                          day === todayDayName
                            ? { backgroundColor: "#1565c0" }
                            : {}
                        }
                      >
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                        {day === todayDayName && " (Today)"}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allPeriods.map((period) => {
                    const isNonRegular = period.type !== "regular";

                    return (
                      <tr key={period.periodNumber}>
                        <td
                          style={{
                            fontWeight: 600,
                            backgroundColor: isNonRegular
                              ? "#f5f5f5"
                              : "#f5f5f5",
                          }}
                        >
                          <Typography variant="body2" fontWeight={600}>
                            {period.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {period.startTime} - {period.endTime}
                          </Typography>
                        </td>
                        {isNonRegular ? (
                          <td
                            colSpan={config.workingDays.length}
                            style={{
                              backgroundColor: "#eeeeee",
                              textAlign: "center",
                              fontWeight: "bold",
                              letterSpacing: "2px",
                              color: "#616161",
                              textTransform: "uppercase",
                              fontSize: "0.85rem",
                            }}
                          >
                            {period.type}
                          </td>
                        ) : (
                          config.workingDays.map((day) => {
                            const entry =
                              entryMap[`${day}-${period.periodNumber}`];
                            const substitute =
                              substituteMap[`${day}-${period.periodNumber}`];
                            const isOnLeave =
                              entry &&
                              teachersOnLeave.includes(entry.teacherId);
                            const hasSubstitute =
                              !!substitute && day === todayDayName;

                            return (
                              <td
                                key={`${day}-${period.periodNumber}`}
                                style={{
                                  backgroundColor: hasSubstitute
                                    ? "#fff3e0"
                                    : entry
                                      ? getEntryColor(entry)
                                      : "white",
                                  cursor: "pointer",
                                  position: "relative",
                                  border: hasSubstitute
                                    ? "3px solid #ff9800"
                                    : isOnLeave && day === todayDayName
                                      ? "3px solid #f44336"
                                      : undefined,
                                }}
                                onClick={() =>
                                  handleSlotClick(day, period.periodNumber)
                                }
                              >
                                {entry ? (
                                  <Box>
                                    <Typography
                                      variant="body2"
                                      fontWeight={600}
                                    >
                                      {subjects.find(s => s.subjectId === entry.subjectId)?.name || entry.subject?.name || entry.subjectId}
                                    </Typography>

                                    <Typography
                                      variant="caption"
                                      color={
                                        hasSubstitute || isOnLeave
                                          ? "error"
                                          : "text.secondary"
                                      }
                                      sx={
                                        hasSubstitute ||
                                          (isOnLeave && day === todayDayName)
                                          ? { textDecoration: "line-through" }
                                          : {}
                                      }
                                    >
                                      {getTeacherDisplayName(entry)}
                                    </Typography>

                                    {hasSubstitute && (
                                      <Tooltip
                                        title={`Substitute for: ${getTeacherDisplayName(entry)}`}
                                      >
                                        <Box
                                          sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 0.5,
                                            mt: 0.5,
                                          }}
                                        >
                                          <SwapIcon
                                            sx={{
                                              fontSize: 14,
                                              color: "success.main",
                                            }}
                                          />
                                          <Typography
                                            variant="caption"
                                            color="success.main"
                                            fontWeight={600}
                                          >
                                            {substitute.substituteTeacher
                                              ?.name ||
                                              substitute.substituteTeacherId}
                                          </Typography>
                                        </Box>
                                      </Tooltip>
                                    )}

                                    {isOnLeave &&
                                      day === todayDayName &&
                                      !hasSubstitute && (
                                        <Chip
                                          label="Absent"
                                          size="small"
                                          color="error"
                                          sx={{
                                            mt: 0.5,
                                            fontSize: "0.6rem",
                                            height: 18,
                                          }}
                                        />
                                      )}

                                    <IconButton
                                      size="small"
                                      sx={{
                                        position: "absolute",
                                        top: 2,
                                        right: 2,
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteEntry(entry.entryId);
                                      }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                ) : (
                                  <Tooltip title="Click to add">
                                    <AddIcon
                                      sx={{ color: "action.disabled" }}
                                    />
                                  </Tooltip>
                                )}
                              </td>
                            );
                          })
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </Box>
            </Box>
          ) : (
            /* List View */
            <Box>
              {config.workingDays.map((day) => (
                <Box key={day} sx={{ mb: 3 }}>
                  <Typography
                    variant="h6"
                    sx={{ mb: 1, textTransform: "capitalize" }}
                  >
                    {day} {day === todayDayName && "(Today)"}
                  </Typography>
                  {allPeriods.map((period) => {
                    const isNonRegular = period.type !== "regular";
                    const entry = entryMap[`${day}-${period.periodNumber}`];
                    const isOnLeave =
                      entry && teachersOnLeave.includes(entry.teacherId);

                    if (isNonRegular) {
                      return (
                        <Box
                          key={period.periodNumber}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            p: 1.5,
                            mb: 1,
                            borderRadius: 1,
                            bgcolor: "#eeeeee", // Gray for breaks
                            borderLeft: "4px solid #9e9e9e",
                          }}
                        >
                          <Box sx={{ minWidth: 100 }}>
                            <Typography variant="body2" fontWeight={600}>
                              {period.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {period.startTime} - {period.endTime}
                            </Typography>
                          </Box>
                          <Box sx={{ ml: 2, flex: 1, textAlign: "center" }}>
                            <Typography
                              variant="body2"
                              fontWeight="bold"
                              sx={{
                                textTransform: "uppercase",
                                letterSpacing: 1,
                                color: "text.secondary",
                              }}
                            >
                              {period.type}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    }

                    return (
                      <Box
                        key={period.periodNumber}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          p: 1.5,
                          mb: 1,
                          borderRadius: 1,
                          bgcolor: entry
                            ? getEntryColor(entry)
                            : "action.hover",
                          cursor: "pointer",
                          border:
                            isOnLeave && day === todayDayName
                              ? "2px solid #f44336"
                              : "none",
                          transition: "transform 0.2s",
                          "&:hover": { transform: "scale(1.01)" },
                        }}
                        onClick={() =>
                          handleSlotClick(day, period.periodNumber)
                        }
                      >
                        <Box sx={{ minWidth: 100 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {period.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {period.startTime} - {period.endTime}
                          </Typography>
                        </Box>
                        <Box sx={{ ml: 2, flex: 1 }}>
                          {entry ? (
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <Box>
                                <Typography variant="body2" fontWeight={600}>
                                  {entry.subject?.name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {getTeacherDisplayName(entry)}
                                </Typography>
                                {isOnLeave && day === todayDayName && (
                                  <Chip
                                    label="Absent"
                                    size="small"
                                    color="error"
                                    sx={{
                                      ml: 1,
                                      height: 18,
                                      fontSize: "0.65rem",
                                    }}
                                  />
                                )}
                              </Box>
                              <DeleteIcon
                                fontSize="small"
                                sx={{
                                  color: "error.light",
                                  opacity: 0.5,
                                  "&:hover": { opacity: 1 },
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteEntry(entry.entryId);
                                }}
                              />
                            </Box>
                          ) : (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              fontStyle="italic"
                            >
                              No class scheduled
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              ))}
            </Box>
          )}
        </Paper>
      )}

      {!selectedClass && (
        <Alert severity="info">
          Please select a class and section to view or edit the timetable.
        </Alert>
      )}

      {/* Entry Dialog */}
      <EntryDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveEntry}
        editData={editEntry}
        dayOfWeek={selectedSlot.day}
        periodNumber={selectedSlot.period}
        classId={selectedClass}
        sectionId={selectedSection}
        teachers={teachers}
        subjects={subjects}
        isLoading={createEntry.isPending || updateEntry.isPending}
        teachersOnLeave={teachersOnLeave}
        schoolId={schoolId}
      />

      {/* Backdrop for potentially long running async actions */}
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 999 }}
        open={
          copyClassTimetable.isPending ||
          deleteEntry.isPending ||
          createEntry.isPending ||
          updateEntry.isPending ||
          deleteClassTimetable.isPending
        }
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <CircularProgress />
        </Box>
      </Backdrop>

      {/* Whole Timetable Delete Confirmation */}
      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteWholeTimetable}
        title="Delete Timetable"
        description={`Are you sure you want to delete the entire timetable for ${className} - ${sectionName}? This action cannot be undone.`}
        confirmLabel="Delete Everything"
        variant="danger"
        isLoading={deleteClassTimetable.isPending}
      />

      {aiGenerateDialogOpen && (
        <AITimetableGenerateDialog
          open={aiGenerateDialogOpen}
          onClose={() => setAiGenerateDialogOpen(false)}
          schoolId={schoolId}
          subjects={subjects}
          currentClassId={selectedClass}
          currentSectionId={selectedSection}
        />
      )}
    </Box>
  );
};

export default TimetableMaster;
