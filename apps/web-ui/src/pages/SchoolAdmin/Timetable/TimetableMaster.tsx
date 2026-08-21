import { useState, useMemo, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
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
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  TableChart as TableIcon,
  List as ListIcon,
  PictureAsPdf as PdfIcon,
  Warning as WarningIcon,
  Download as DownloadIcon,
  FileUpload as UploadIcon,
  AutoAwesome as MagicIcon,
  Send as SendIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
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
  useSubmitTimetableForApproval,
  useGetAIDraft,
  useGetAIDraftVersions,
  useDeleteAIDraftVersion,
  useGetActiveSchedule,
  useGetTimetableSchedules,
  useSubmitTimetableForApproval as useResubmitTimetable,
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
import { useTimeSettingsStore } from "../../../stores/timeSettingsStore";
import { formatSingleTime } from "../../../utils/timeUtils";
import { sortClassesNumerically } from "../../../utils/classSort";
import { useUrlTab } from "../../../hooks/useUrlTab";
import ConfirmationDialog from "../../../components/Dialogs/ConfirmationDialog";
import { AppButton } from "../../../components/shared/AppButton";
import { generateTimetableTemplate, parseTimetableTemplate } from "../../../utils/timetableExcelUtils";
import AITimetableGenerateDialog from "../../../components/Dialogs/AITimetableGenerateDialog";
import { useIsMobile } from "../../../hooks/useIsMobile";

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
  const isMobile = useIsMobile();
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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
        }
      }}
    >
      <DialogTitle sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid",
        borderColor: "divider",
        py: { xs: 1.5, sm: 2 },
        px: { xs: 2, sm: 3 }
      }}>
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
  const isMobile = useIsMobile();
  const schoolId = TokenService.getSchoolId() || "";
  const { timeFormat } = useTimeSettingsStore();
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
  const [selectedDayTab, setSelectedDayTab] = useState<string>(() =>
    new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
  );

  // Variable to control AI Generative Tab visibility (Under Development)
  // Set enableAITabRef.current = false to hide the AI tab, or true to enable it on localhost
  const enableAITabRef = useRef<boolean>(false);
  const [showAiTab] = useState<boolean>(enableAITabRef.current);

  // Available tabs depending on whether AI tab is enabled
  const availableTabKeys = useMemo(() => {
    return showAiTab
      ? ['manual', 'ai', 'published', 'rejected']
      : ['manual', 'published', 'rejected'];
  }, [showAiTab]);

  const [tabIndex, setTabIndex] = useUrlTab(0, availableTabKeys);
  const activeTabKey = availableTabKeys[tabIndex] || 'manual';

  const isManualTab = activeTabKey === 'manual';
  const isAiTab = activeTabKey === 'ai';
  const isPublishedTab = activeTabKey === 'published';
  const isRejectedTab = activeTabKey === 'rejected';

  const [selectedAiVersion, setSelectedAiVersion] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (isMobile) {
      setViewMode("list");
    }
  }, [isMobile]);

  // Track visited tabs to fetch data lazily on tab visit
  const [visitedTabKeys, setVisitedTabKeys] = useState<Set<string>>(() => new Set([activeTabKey]));

  useEffect(() => {
    setVisitedTabKeys(prev => {
      if (prev.has(activeTabKey)) return prev;
      const updated = new Set(prev);
      updated.add(activeTabKey);
      return updated;
    });
  }, [activeTabKey]);

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

  // AI & Schedule data fetching (lazy loaded on tab visit)
  const { data: aiDraftData, isLoading: aiDraftLoading } = useGetAIDraft(schoolId, selectedAiVersion, { enabled: showAiTab && visitedTabKeys.has('ai') });
  const { data: aiVersionsData } = useGetAIDraftVersions(schoolId, { enabled: showAiTab && visitedTabKeys.has('ai') });
  const { data: activeScheduleData } = useGetActiveSchedule(schoolId, undefined, undefined, { enabled: visitedTabKeys.has('published') });
  const deleteAiVersion = useDeleteAIDraftVersion(schoolId);
  // Rejected timetable submissions (lazy loaded on tab visit)
  const { data: rejectedSchedulesData, isLoading: rejectedLoading } = useGetTimetableSchedules(schoolId, 'rejected', undefined, { enabled: visitedTabKeys.has('rejected') });
  const resubmitSchedule = useResubmitTimetable(schoolId);

  const createEntry = useCreateEntry(schoolId);
  const updateEntry = useUpdateEntry(schoolId);
  const deleteEntry = useDeleteEntry(schoolId);
  const copyClassTimetable = useCopyClassTimetable(schoolId);
  const deleteClassTimetable = useDeleteClassTimetable(schoolId);
  const bulkCreateEntries = useBulkCreateEntries(schoolId);
  const submitForApproval = useSubmitTimetableForApproval(schoolId);

  const aiDraft = aiDraftData?.data;
  const aiDraftEntries = aiDraft?.entries || [];
  const aiVersions = aiVersionsData?.data || [];
  const activeSchedule = activeScheduleData?.data;
  const rejectedSchedules = rejectedSchedulesData?.data || [];

  // Auto-set initial AI version
  useEffect(() => {
    if (selectedAiVersion === undefined && aiVersions.length > 0) {
      const activeVersion = aiVersions.find((v: any) => v.status === 'draft') || aiVersions[0];
      if (activeVersion) setSelectedAiVersion(activeVersion.version);
    }
  }, [aiVersions, selectedAiVersion]);

  const handleSubmitForApproval = async () => {
    try {
      await submitForApproval.mutateAsync({
        scheduleId: "MAIN_TIMETABLE",
        payload: {
          source: "manual",
          name: "Manual Master Timetable",
        },
      });
      showNotification("Manual timetable schedule sent to Principal for approval successfully!", "success");
    } catch (err: any) {
      showNotification(err?.message || "Failed to send timetable for approval", "error");
    }
  };

  const handleSendAiDraftForApproval = async () => {
    const v = selectedAiVersion || (aiVersions.length > 0 ? aiVersions[0].version : 1);
    try {
      await submitForApproval.mutateAsync({
        scheduleId: `AI_DRAFT_v${v}`,
        payload: {
          source: "ai",
          aiVersion: v,
          name: `AI Timetable Draft (v${v})`,
        },
      });
      showNotification(`AI Timetable Draft v${v} sent to Principal for approval!`, "success");
    } catch (err: any) {
      showNotification(err?.message || "Failed to send AI draft for approval", "error");
    }
  };

  const handleDeleteAiVersion = async () => {
    if (!selectedAiVersion) return;
    try {
      await deleteAiVersion.mutateAsync(selectedAiVersion);
      showNotification(`AI Draft Version ${selectedAiVersion} deleted successfully`, "success");
      setSelectedAiVersion(undefined);
    } catch (err: any) {
      showNotification(err?.message || "Failed to delete AI draft version", "error");
    }
  };

  const config = configData?.data;
  const classes = useMemo(() => {
    return sortClassesNumerically(classesData?.data || []);
  }, [classesData]);

  const teachers = teachersData?.data || [];
  const subjects = subjectsData?.data || [];
  const entries = timetableData?.data?.entries || [];
  const teachersOnLeave = teachersOnLeaveData?.data?.teacherIds || [];
  const substitutes = substitutesData?.data || [];
  const activeClasses = useMemo(() => {
    return sortClassesNumerically(activeClassesData?.data || []);
  }, [activeClassesData]);

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

  // Create AI entry lookup map
  const aiEntryMap = useMemo(() => {
    const map: Record<string, any> = {};
    if (!selectedClass || !selectedSection) return map;
    aiDraftEntries.forEach((entry: any) => {
      if (entry.classId === selectedClass && entry.sectionId === selectedSection) {
        map[`${entry.dayOfWeek}-${entry.periodNumber}`] = entry;
      }
    });
    return map;
  }, [aiDraftEntries, selectedClass, selectedSection]);

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
    <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
      {/* Title & Master Tabs */}
      {!isMobile && (
        <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }} color="#0f172a">
          Master Timetable Studio
        </Typography>
      )}

      {/* Clean Flat Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs
          value={tabIndex}
          onChange={(_e, val) => setTabIndex(val)}
          textColor="primary"
          indicatorColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ minHeight: 40 }}
        >
          <Tab label={isMobile ? "Manual" : "1. Manual Timetable"} sx={{ textTransform: 'none', fontWeight: 600, minHeight: 40, py: 1, fontSize: { xs: '0.85rem', sm: '0.9rem' } }} />
          {showAiTab && (
            <Tab label={isMobile ? "AI Drafts" : "2. AI Generator & Drafts"} sx={{ textTransform: 'none', fontWeight: 600, minHeight: 40, py: 1, fontSize: { xs: '0.85rem', sm: '0.9rem' } }} />
          )}
          <Tab label={isMobile ? "Live" : `${showAiTab ? '3' : '2'}. Published Live`} sx={{ textTransform: 'none', fontWeight: 600, minHeight: 40, py: 1, fontSize: { xs: '0.85rem', sm: '0.9rem' } }} />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {isMobile ? "Rejected" : `${showAiTab ? '4' : '3'}. Rejected Submissions`}
                {rejectedSchedules.length > 0 && (
                  <Chip label={rejectedSchedules.length} size="small" color="error" sx={{ height: 16, fontSize: 10, fontWeight: 700 }} />
                )}
              </Box>
            }
            sx={{ textTransform: 'none', fontWeight: 600, minHeight: 40, py: 1, fontSize: { xs: '0.85rem', sm: '0.9rem' } }}
          />
        </Tabs>
      </Box>

      {/* Class & Section Selectors + Actions */}
      <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {/* Class & Section Row */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Class</InputLabel>
            <Select
              value={selectedClass}
              label="Class"
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
          <FormControl fullWidth size="small" disabled={!selectedClass}>
            <InputLabel>Section</InputLabel>
            <Select
              value={selectedSection}
              label="Section"
              onChange={(e) => setSelectedSection(e.target.value)}
            >
              {sections.map((s: any) => (
                <MenuItem key={s.sectionId} value={s.sectionId}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Tab 0: Manual Actions */}
        {isManualTab && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <AppButton
                variant="contained"
                color="primary"
                startIcon={<SendIcon />}
                onClick={handleSubmitForApproval}
                loading={submitForApproval.isPending}
                size="small"
                sx={{ flex: { xs: 1, sm: 'none' }, fontWeight: 600, textTransform: 'none' }}
              >
                Send for Approval
              </AppButton>

              {teachersOnLeave.length > 0 && (
                <Chip
                  icon={<WarningIcon sx={{ fontSize: 14 }} />}
                  label={`${teachersOnLeave.length} on leave`}
                  color="warning"
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              )}
            </Box>

            {selectedClass && selectedSection && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  <Button variant="outlined" size="small" startIcon={<PdfIcon />} onClick={handleExportPdf} sx={{ textTransform: 'none', px: 1, minWidth: 'auto' }}>
                    PDF
                  </Button>
                  <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={handleDownloadExcelTemplate} sx={{ textTransform: 'none', px: 1, minWidth: 'auto' }}>
                    Template
                  </Button>
                  <Button variant="outlined" size="small" component="label" startIcon={<UploadIcon />} sx={{ textTransform: 'none', px: 1, minWidth: 'auto' }} disabled={bulkCreateEntries.isPending}>
                    Upload
                    <input type="file" hidden accept=".xlsx, .xls" onChange={handleUploadExcel} />
                  </Button>
                  {entries.length > 0 && (
                    <Button variant="outlined" color="error" size="small" onClick={() => setIsDeleteDialogOpen(true)} sx={{ textTransform: 'none', px: 1, minWidth: 'auto' }}>
                      Delete
                    </Button>
                  )}
                </Box>

                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={(_, v) => v && setViewMode(v)}
                  size="small"
                >
                  <ToggleButton value="list" sx={{ px: 1, py: 0.25, textTransform: 'none', fontSize: '0.8rem' }}>
                    <ListIcon fontSize="small" sx={{ mr: 0.5 }} /> Day
                  </ToggleButton>
                  <ToggleButton value="table" sx={{ px: 1, py: 0.25, textTransform: 'none', fontSize: '0.8rem' }}>
                    <TableIcon fontSize="small" sx={{ mr: 0.5 }} /> Week
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            )}
          </Box>
        )}

        {/* Tab 1: AI Actions (Only on localhost) */}
        {isAiTab && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              {aiVersions.length > 0 && (
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Draft</InputLabel>
                  <Select
                    value={selectedAiVersion || ""}
                    label="Draft"
                    onChange={(e) => setSelectedAiVersion(Number(e.target.value))}
                  >
                    {aiVersions.map((v: any) => (
                      <MenuItem key={v.version} value={v.version}>
                        v{v.version} ({v.status})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              <Button variant="contained" size="small" startIcon={<MagicIcon />} onClick={() => setAiGenerateDialogOpen(true)} sx={{ textTransform: 'none' }}>
                Generate AI
              </Button>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                startIcon={<SendIcon />}
                onClick={handleSendAiDraftForApproval}
                disabled={aiVersions.length === 0}
                sx={{ textTransform: 'none' }}
              >
                Send for Approval
              </Button>
              {aiVersions.length > 0 && selectedAiVersion && (
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={handleDeleteAiVersion}
                  disabled={deleteAiVersion.isPending}
                  sx={{ textTransform: 'none' }}
                >
                  Delete Version
                </Button>
              )}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, v) => v && setViewMode(v)}
                size="small"
              >
                <ToggleButton value="list" sx={{ px: 1, py: 0.25, textTransform: 'none', fontSize: '0.8rem' }}>
                  <ListIcon fontSize="small" sx={{ mr: 0.5 }} /> Day
                </ToggleButton>
                <ToggleButton value="table" sx={{ px: 1, py: 0.25, textTransform: 'none', fontSize: '0.8rem' }}>
                  <TableIcon fontSize="small" sx={{ mr: 0.5 }} /> Week
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>
        )}

        {/* Tab 2: Live Actions */}
        {isPublishedTab && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Chip label="LIVE" color="success" size="small" sx={{ fontWeight: 700, height: 22 }} />
              {activeSchedule && (
                <Typography variant="caption" color="text.secondary">
                  {activeSchedule.name}
                </Typography>
              )}
              {selectedClass && selectedSection && (
                <Button variant="outlined" size="small" startIcon={<PdfIcon />} onClick={handleExportPdf} sx={{ textTransform: 'none' }}>
                  Export PDF
                </Button>
              )}
            </Box>

            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, v) => v && setViewMode(v)}
              size="small"
            >
              <ToggleButton value="list" sx={{ px: 1, py: 0.25, textTransform: 'none', fontSize: '0.8rem' }}>
                <ListIcon fontSize="small" sx={{ mr: 0.5 }} /> Day
              </ToggleButton>
              <ToggleButton value="table" sx={{ px: 1, py: 0.25, textTransform: 'none', fontSize: '0.8rem' }}>
                <TableIcon fontSize="small" sx={{ mr: 0.5 }} /> Week
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}
      </Box>

      {/* Timetable Grid & Day View */}
      {selectedClass && selectedSection && (
        <Box sx={{ mb: 3 }}>
          {entries.length === 0 &&
            !timetableLoading &&
            activeClasses.length > 0 && (
              <Box
                sx={{
                  p: 2,
                  mb: 2,
                  bgcolor: "#f8fafc",
                  borderRadius: 1.5,
                  border: "1px dashed #cbd5e1",
                }}
              >
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  No timetable exists for this class/section. You can copy from an existing one:
                </Typography>
                <Box
                  sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1, alignItems: { xs: "stretch", sm: "center" }, mt: 1 }}
                >
                  <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 220 } }}>
                    <InputLabel>Source Class/Section</InputLabel>
                    <Select
                      value={selectedCopySource}
                      label="Source Class/Section"
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
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={!selectedCopySource || copyClassTimetable.isPending}
                    onClick={async () => {
                      const [sourceClassId, sourceSectionId] = selectedCopySource.split("-");
                      try {
                        await copyClassTimetable.mutateAsync({
                          targetClassId: selectedClass,
                          targetSectionId: selectedSection,
                          sourceClassId,
                          sourceSectionId,
                        });
                        showNotification("Timetable copied successfully", "success");
                        setSelectedCopySource("");
                      } catch (error: any) {
                        console.error(error);
                        showNotification(`Failed to copy timetable: ${error?.message || "Unknown error"}`, "error");
                      }
                    }}
                    sx={{ textTransform: 'none' }}
                  >
                    Copy
                  </Button>
                </Box>
              </Box>
            )}

          {timetableLoading || (isAiTab && aiDraftLoading) ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : viewMode === "table" ? (
            /* Table View */
            <Box sx={{ overflowX: "auto", WebkitOverflowScrolling: "touch", borderRadius: 1.5, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
              <Box
                component="table"
                sx={{
                  width: "100%",
                  borderCollapse: "collapse",
                  "& th, & td": {
                    border: "1px solid",
                    borderColor: "divider",
                    p: { xs: 1, sm: 1.5 },
                    textAlign: "center",
                    minWidth: { xs: 145, sm: 130 },
                  },
                  "& th": {
                    bgcolor: "primary.main",
                    color: "white",
                    fontWeight: 700,
                    fontSize: { xs: "0.8rem", sm: "0.875rem" },
                  },
                }}
              >
                <thead>
                  <tr>
                    <th style={{ minWidth: 100 }}>Period</th>
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
                              ? "#f8fafc"
                              : "#f8fafc",
                          }}
                        >
                          <Typography variant="body2" fontWeight={700}>
                            {period.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            {formatSingleTime(period.startTime, timeFormat)} - {formatSingleTime(period.endTime, timeFormat)}
                          </Typography>
                        </td>
                        {isNonRegular ? (
                          <td
                            colSpan={config.workingDays.length}
                            style={{
                              backgroundColor: "#f1f5f9",
                              textAlign: "center",
                              fontWeight: "bold",
                              letterSpacing: "1px",
                              color: "#64748b",
                              textTransform: "uppercase",
                              fontSize: "0.75rem",
                            }}
                          >
                            {period.type}
                          </td>
                        ) : (
                          config.workingDays.map((day) => {
                            const entry = isAiTab
                              ? aiEntryMap[`${day}-${period.periodNumber}`]
                              : entryMap[`${day}-${period.periodNumber}`];
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
                                  cursor: isManualTab ? "pointer" : "default",
                                  position: "relative",
                                  border: hasSubstitute
                                    ? "2px solid #ff9800"
                                    : isOnLeave && day === todayDayName
                                      ? "2px solid #f44336"
                                      : undefined,
                                }}
                                onClick={() => {
                                  if (isManualTab) {
                                    handleSlotClick(day, period.periodNumber);
                                  }
                                }}
                              >
                                {entry ? (
                                  <Box sx={{ position: "relative", pr: isManualTab ? 3 : 0, minHeight: 44, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start", textAlign: "left" }}>
                                    <Typography
                                      variant="body2"
                                      fontWeight={600}
                                      sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" }, wordBreak: "break-word" }}
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
                                      <Typography
                                        variant="caption"
                                        color="success.main"
                                        fontWeight={600}
                                        sx={{ fontSize: '0.65rem' }}
                                      >
                                        Sub: {substitute.substituteTeacher?.name || substitute.substituteTeacherId}
                                      </Typography>
                                    )}

                                    {isOnLeave && day === todayDayName && !hasSubstitute && (
                                      <Chip
                                        label="Absent"
                                        size="small"
                                        color="error"
                                        sx={{
                                          mt: 0.5,
                                          fontSize: "0.6rem",
                                          height: 16,
                                        }}
                                      />
                                    )}

                                    {isManualTab && (
                                      <IconButton
                                        size="small"
                                        sx={{
                                          position: "absolute",
                                          top: -2,
                                          right: -6,
                                          p: 0.5,
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteEntry(entry.entryId);
                                        }}
                                      >
                                        <DeleteIcon sx={{ fontSize: 15 }} />
                                      </IconButton>
                                    )}
                                  </Box>
                                ) : (
                                  <Tooltip title="Click to add">
                                    <AddIcon
                                      sx={{ color: "action.disabled", fontSize: 18 }}
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
          ) : isMobile ? (
            /* Mobile Day Timeline View */
            <Box>
              {/* Day Selector Pills */}
              <Box sx={{ display: 'flex', gap: 0.75, overflowX: 'auto', pb: 1.5, '::-webkit-scrollbar': { display: 'none' } }}>
                {config.workingDays.map((day) => {
                  const activeDay = selectedDayTab && config.workingDays.includes(selectedDayTab) ? selectedDayTab : config.workingDays[0];
                  const isSelected = activeDay === day;
                  const isToday = day === todayDayName;

                  return (
                    <Button
                      key={day}
                      onClick={() => setSelectedDayTab(day)}
                      size="small"
                      sx={{
                        borderRadius: 1.5,
                        textTransform: 'capitalize',
                        px: 1.25,
                        py: 0.5,
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        minWidth: 'auto',
                        bgcolor: isSelected ? 'primary.main' : '#f1f5f9',
                        color: isSelected ? '#ffffff' : '#475569',
                        border: 'none',
                        boxShadow: 'none',
                        '&:hover': {
                          bgcolor: isSelected ? 'primary.dark' : '#e2e8f0',
                        },
                      }}
                    >
                      {day.slice(0, 3)} {isToday && '• Today'}
                    </Button>
                  );
                })}
              </Box>

              {/* Day Periods Vertical List */}
              {(() => {
                const currentDay = selectedDayTab && config.workingDays.includes(selectedDayTab) ? selectedDayTab : config.workingDays[0];
                return (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {allPeriods.map((period) => {
                      const isNonRegular = period.type !== "regular";
                      const entry = isAiTab
                        ? aiEntryMap[`${currentDay}-${period.periodNumber}`]
                        : entryMap[`${currentDay}-${period.periodNumber}`];
                      const substitute = substituteMap[`${currentDay}-${period.periodNumber}`];
                      const isOnLeave = entry && teachersOnLeave.includes(entry.teacherId);
                      const hasSubstitute = !!substitute && currentDay === todayDayName;

                      if (isNonRegular) {
                        return (
                          <Box
                            key={period.periodNumber}
                            sx={{
                              py: 0.75,
                              px: 1.25,
                              borderRadius: 1.5,
                              bgcolor: '#f8fafc',
                              border: '1px dashed #cbd5e1',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                              ☕ {period.name || period.type}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatSingleTime(period.startTime, timeFormat)} - {formatSingleTime(period.endTime, timeFormat)} ({period.duration}m)
                            </Typography>
                          </Box>
                        );
                      }

                      return (
                        <Paper
                          key={period.periodNumber}
                          variant="outlined"
                          sx={{
                            p: 1.25,
                            borderRadius: 1.5,
                            borderColor: '#e2e8f0',
                            bgcolor: hasSubstitute ? '#fffbeb' : 'background.paper',
                            cursor: isManualTab ? 'pointer' : 'default',
                            transition: 'background-color 0.15s ease',
                            '&:hover': { bgcolor: '#f8fafc' },
                          }}
                          onClick={() => {
                            if (isManualTab) {
                              handleSlotClick(currentDay, period.periodNumber);
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                              Period {period.periodNumber} • {formatSingleTime(period.startTime, timeFormat)} - {formatSingleTime(period.endTime, timeFormat)} ({period.duration}m)
                            </Typography>

                            {entry && isManualTab && (
                              <Box sx={{ display: 'flex', gap: 0.25 }}>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSlotClick(currentDay, period.periodNumber);
                                  }}
                                >
                                  <EditIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteEntry(entry.entryId);
                                  }}
                                >
                                  <DeleteIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Box>
                            )}
                          </Box>

                          {entry ? (
                            <Box>
                              <Typography variant="body1" fontWeight={600} color="#0f172a">
                                {subjects.find(s => s.subjectId === entry.subjectId)?.name || entry.subject?.name || entry.subjectId}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  textDecoration: (hasSubstitute || (isOnLeave && currentDay === todayDayName)) ? 'line-through' : 'none'
                                }}
                              >
                                Teacher: {getTeacherDisplayName(entry)}
                              </Typography>

                              {hasSubstitute && (
                                <Typography variant="caption" color="success.main" fontWeight={600} display="block" sx={{ mt: 0.25 }}>
                                  Substitute: {substitute.substituteTeacher?.name || substitute.substituteTeacherId}
                                </Typography>
                              )}

                              {isOnLeave && currentDay === todayDayName && !hasSubstitute && (
                                <Chip label="Teacher on leave" size="small" color="error" sx={{ mt: 0.5, height: 18, fontSize: 10 }} />
                              )}
                            </Box>
                          ) : (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.25 }}>
                              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                No class scheduled
                              </Typography>
                              {isManualTab && (
                                <Typography variant="caption" color="primary" fontWeight={600}>
                                  + Assign
                                </Typography>
                              )}
                            </Box>
                          )}
                        </Paper>
                      );
                    })}
                  </Box>
                );
              })()}
            </Box>
          ) : (
            /* Desktop List View *//* Desktop List View */
            <Box>
              {config.workingDays.map((day) => (
                <Box key={day} sx={{ mb: 3 }}>
                  <Typography
                    variant="h6"
                    sx={{ mb: 1, textTransform: "capitalize", fontWeight: 700 }}
                  >
                    {day} {day === todayDayName && "(Today)"}
                  </Typography>
                  {allPeriods.map((period) => {
                    const isNonRegular = period.type !== "regular";
                    const entry = isAiTab
                      ? aiEntryMap[`${day}-${period.periodNumber}`]
                      : entryMap[`${day}-${period.periodNumber}`];
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
                            bgcolor: "#eeeeee",
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
                          cursor: isManualTab ? "pointer" : "default",
                          border:
                            isOnLeave && day === todayDayName
                              ? "2px solid #f44336"
                              : "none",
                          transition: "transform 0.2s",
                          "&:hover": { transform: "scale(1.01)" },
                        }}
                        onClick={() =>
                          isManualTab && handleSlotClick(day, period.periodNumber)
                        }
                      >
                        <Box sx={{ minWidth: 100 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {period.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatSingleTime(period.startTime, timeFormat)} - {formatSingleTime(period.endTime, timeFormat)}
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
                              {isManualTab && (
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
                              )}
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
        </Box>
      )}

      {!selectedClass && !isRejectedTab && (
        <Alert severity="info">
          Please select a class and section to view or edit the timetable.
        </Alert>
      )}

      {/* Rejected Submissions */}
      {isRejectedTab && (
        <Paper sx={{ p: 0, mt: 0, borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ p: 2, bgcolor: '#fff5f5', borderLeft: '4px solid #ef4444', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} color="error.main">
                ❌ Rejected Timetable Submissions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Timetables rejected by the Principal are listed here with feedback. Fix the issues and re-submit for approval.
              </Typography>
            </Box>
          </Box>
          <Divider />
          {rejectedLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : rejectedSchedules.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CheckCircleIcon sx={{ fontSize: 56, color: '#86efac', mb: 2 }} />
              <Typography color="text.secondary" variant="h6">No rejected submissions</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                All your timetable submissions have been approved or are pending review.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#fef2f2' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Timetable Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Source</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Slots</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Submitted</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Rejected On</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Principal's Feedback</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rejectedSchedules.map((schedule: any) => (
                    <TableRow key={schedule.scheduleId} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{schedule.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={schedule.source === 'ai' ? `AI v${schedule.aiDraftVersion || schedule.version || 1}` : 'Manual'}
                          size="small"
                          sx={{
                            bgcolor: schedule.source === 'ai' ? '#ede9fe' : '#e0f2fe',
                            color: schedule.source === 'ai' ? '#7c3aed' : '#0369a1',
                            fontWeight: 600,
                            fontSize: 11,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip label={`${schedule.entries?.length || 0} slots`} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: 12 }}>
                          {schedule.createdAt ? new Date(schedule.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: 12, color: 'error.main' }}>
                          {schedule.rejectedAt ? new Date(schedule.rejectedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 280 }}>
                        {schedule.rejectionComment ? (
                          <Box
                            sx={{
                              bgcolor: '#fef9c3',
                              border: '1px solid #fde047',
                              borderRadius: 1,
                              p: 1,
                            }}
                          >
                            <Typography variant="body2" sx={{ fontSize: 12, color: '#854d0e', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                              {schedule.rejectionComment}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.disabled" sx={{ fontSize: 12 }}>No comment provided</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Re-submit for Approval">
                          <span>
                            <IconButton
                              size="small"
                              color="primary"
                              disabled={resubmitSchedule.isPending}
                              onClick={async () => {
                                try {
                                  await resubmitSchedule.mutateAsync({
                                    scheduleId: schedule.scheduleId,
                                    payload: {
                                      source: schedule.source,
                                      aiVersion: schedule.aiDraftVersion || schedule.version,
                                      name: schedule.name,
                                    },
                                  });
                                  showNotification('Timetable re-submitted for Principal approval!', 'success');
                                } catch (err: any) {
                                  showNotification(err?.message || 'Failed to re-submit', 'error');
                                }
                              }}
                            >
                              <RefreshIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
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
