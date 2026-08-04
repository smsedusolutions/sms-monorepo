import { useState, useMemo, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Alert,
  Chip,
  FormHelperText,
} from "@mui/material";
import {
  Publish as PublishIcon,
  ArrowBack as BackIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import {
  useGetActiveConfig,
  useGetAIDraft,
  usePublishAIDraft,
  useUpdateAIDraftEntry,
  useDeleteAIDraftEntry,
  useGetAIDraftVersions,
  useDeleteAIDraftVersion,
} from "../../../queries/Timetable";
import { useGetClasses } from "../../../queries/Class";
import { useGetTeachers } from "../../../queries/Teacher";
import { useGetSubjects } from "../../../queries/Subject";
import TokenService from "../../../queries/token/tokenService";
import { useNotificationStore } from "../../../stores/notificationStore";
import { AppButton } from "../../../components/shared/AppButton";
import ConfirmationDialog from "../../../components/Dialogs/ConfirmationDialog";

const TimetableDraftPreview = () => {
  const navigate = useNavigate();
  const schoolId = TokenService.getSchoolId() || "";
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState<{ dayOfWeek: string; periodNumber: number; subjectId: string; teacherId: string } | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<number | undefined>(undefined);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [versionToDelete, setVersionToDelete] = useState<number | null>(null);

  const location = useLocation();

  // Auto-select class and section from router state if available
  useEffect(() => {
    if (location.state && (location.state as any).classId) {
      setSelectedClass((location.state as any).classId);
    }
    if (location.state && (location.state as any).sectionId) {
      setSelectedSection((location.state as any).sectionId);
    }
  }, [location.state]);

  const { showNotification } = useNotificationStore();

  const { data: configData, isLoading: configLoading } = useGetActiveConfig(schoolId);
  const { data: classesData } = useGetClasses(schoolId);
  const { data: teachersData } = useGetTeachers(schoolId);
  const { data: subjectsData } = useGetSubjects(schoolId);
  const { data: draftData, isLoading: draftLoading } = useGetAIDraft(schoolId, selectedVersion);
  const { data: versionsData } = useGetAIDraftVersions(schoolId);
  const publishDraft = usePublishAIDraft(schoolId);
  const updateDraftEntry = useUpdateAIDraftEntry(schoolId);
  const deleteDraftEntry = useDeleteAIDraftEntry(schoolId);
  const deleteVersion = useDeleteAIDraftVersion(schoolId);

  const config = configData?.data;
  const classes = classesData?.data || [];
  const teachers = teachersData?.data || [];
  const subjects = subjectsData?.data || [];
  const draft = draftData?.data;
  const draftEntries = draft?.entries || [];
  const versions = versionsData?.data || [];

  // Set initial version if not set
  useEffect(() => {
    if (selectedVersion === undefined && versions.length > 0) {
      const activeDraft = versions.find((v: any) => v.status === 'draft');
      if (activeDraft) {
        setSelectedVersion(activeDraft.version);
      } else {
        setSelectedVersion(versions[0].version);
      }
    }
  }, [versions, selectedVersion]);

  const selectedClassObj = classes.find((c: any) => c.classId === selectedClass);
  const sections = selectedClassObj?.sections || [];

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

  const entryMap = useMemo(() => {
    const map: Record<string, any> = {};
    if (!selectedClass || !selectedSection) return map;

    draftEntries.forEach((entry: any) => {
      if (entry.classId === selectedClass && entry.sectionId === selectedSection) {
        map[`${entry.dayOfWeek}-${entry.periodNumber}`] = entry;
      }
    });
    return map;
  }, [draftEntries, selectedClass, selectedSection]);

  const handlePublish = async () => {
    try {
      await publishDraft.mutateAsync();
      showNotification("Draft published to live timetable successfully!", "success");
      navigate("/school-admin/timetable/master");
    } catch (err: any) {
      showNotification(err?.message || "Failed to publish draft", "error");
    }
  };

  const handleDelete = async (dayOfWeek: string, periodNumber: number) => {
    try {
      await deleteDraftEntry.mutateAsync({
        classId: selectedClass,
        sectionId: selectedSection,
        dayOfWeek,
        periodNumber
      });
      showNotification("Entry removed from draft", "success");
    } catch (err: any) {
      showNotification(err?.message || "Failed to remove entry", "error");
    }
  };

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

  // Filter teachers who can teach the selected subject in draft edit modal
  const draftSubjectTeachers = useMemo(() => {
    if (!editData?.subjectId) return teachers;
    const qualified = teachers.filter((t: any) =>
      isTeacherQualifiedForSubject(t, editData.subjectId)
    );
    return qualified.length > 0 ? qualified : teachers;
  }, [editData?.subjectId, teachers, subjects]);

  const handleSubjectChange = (newSubjectId: string) => {
    const eligibleTeachers = teachers.filter((t: any) =>
      isTeacherQualifiedForSubject(t, newSubjectId)
    );
    const validTeachers = eligibleTeachers.length > 0 ? eligibleTeachers : teachers;
    const currentTeacherObj = findMatchingTeacher(editData?.teacherId || "");
    const isCurrentValid = currentTeacherObj
      ? validTeachers.some((t: any) => getTeacherCanonicalId(t) === getTeacherCanonicalId(currentTeacherObj))
      : false;

    setEditData({
      ...editData!,
      subjectId: newSubjectId,
      teacherId: isCurrentValid && editData?.teacherId
        ? editData.teacherId
        : getTeacherCanonicalId(validTeachers[0]),
    });
  };

  const handleOpenEdit = (dayOfWeek: string, periodNumber: number, existingEntry: any) => {
    const rawSubId = existingEntry?.subjectId || (subjects[0] ? getSubjectCanonicalId(subjects[0]) : "");
    const matchedSub = findMatchingSubject(rawSubId);
    const canonicalSubId = matchedSub ? getSubjectCanonicalId(matchedSub) : rawSubId;

    const rawTId = existingEntry?.teacherId || "";
    const matchedT = findMatchingTeacher(rawTId);
    const canonicalTId = matchedT
      ? getTeacherCanonicalId(matchedT)
      : rawTId;

    // Verify qualified teachers for this subject
    const qualified = teachers.filter((t: any) => isTeacherQualifiedForSubject(t, canonicalSubId));
    const validTeachers = qualified.length > 0 ? qualified : teachers;
    const finalTId = canonicalTId || (validTeachers[0] ? getTeacherCanonicalId(validTeachers[0]) : "");

    setEditData({
      dayOfWeek,
      periodNumber,
      subjectId: canonicalSubId,
      teacherId: finalTId,
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editData || !editData.subjectId || !editData.teacherId) {
      showNotification("Please select both subject and teacher", "warning");
      return;
    }
    try {
      await updateDraftEntry.mutateAsync({
        classId: selectedClass,
        sectionId: selectedSection,
        dayOfWeek: editData.dayOfWeek,
        periodNumber: editData.periodNumber,
        subjectId: editData.subjectId,
        teacherId: editData.teacherId,
      });
      showNotification("Draft entry updated", "success");
      setEditDialogOpen(false);
    } catch (err: any) {
      showNotification(err?.message || "Failed to update entry", "error");
    }
  };

  const handleDeleteVersion = async () => {
    if (versionToDelete === null) return;
    try {
      await deleteVersion.mutateAsync(versionToDelete);
      showNotification(`Version ${versionToDelete} deleted successfully`, "success");
      if (selectedVersion === versionToDelete) {
        setSelectedVersion(undefined); // Will trigger re-selection in useEffect
      }
      setDeleteConfirmOpen(false);
      setVersionToDelete(null);
    } catch (err: any) {
      showNotification(err?.message || "Failed to delete version", "error");
    }
  };
  if (configLoading || draftLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!draft && !draftLoading && versions.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          No active timetable draft found. Please generate one from the Timetable Master page.
        </Alert>
        <AppButton sx={{ mt: 2 }} onClick={() => navigate("/school-admin/timetable/master")} startIcon={<BackIcon />}>
          Back to Timetable Master
        </AppButton>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h5" color="secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <span role="img" aria-label="magic">🪄</span> AI Timetable Draft Mode
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review the AI generated timetable. Changes are not live until you publish.
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Draft Version</InputLabel>
            <Select
              value={selectedVersion || ""}
              label="Draft Version"
              onChange={(e) => setSelectedVersion(Number(e.target.value))}
            >
              {versions.map((v: any) => (
                <MenuItem key={v.version} value={v.version} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">v{v.version}</Typography>
                    <Chip size="small" label={v.status} color={v.status === 'draft' ? 'primary' : 'default'} variant="outlined" sx={{ height: 20 }} />
                  </Box>
                  <IconButton
                    size="small"
                    color="error"
                    sx={{ ml: 2 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setVersionToDelete(v.version);
                      setDeleteConfirmOpen(true);
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <AppButton
            variant="outlined"
            onClick={() => navigate("/school-admin/timetable/master")}
            disabled={publishDraft.isPending}
          >
            Leave Draft Mode
          </AppButton>
          <AppButton
            variant="contained"
            color="success"
            startIcon={<PublishIcon />}
            onClick={handlePublish}
            loading={publishDraft.isPending}
            disabled={!draft || draft.status !== 'draft'}
          >
            Publish to Live
          </AppButton>
        </Box>
      </Box>

      {/* Warning for historical versions */}
      {draft && draft.status !== 'draft' && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You are viewing an archived version (v{draft.version}). Only the "draft" status version can be published.
        </Alert>
      )}

      {/* Class/Section Selector */}
      <Paper sx={{ p: 2, mb: 3, borderLeft: '4px solid #9c27b0' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
          <Box>
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
          </Box>
          <Box>
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
          </Box>
        </Box>
      </Paper>

      {/* Timetable Grid */}
      {selectedClass && selectedSection && (
        <Paper sx={{ p: 2, overflow: "auto" }}>
          {config?.workingDays && config.workingDays.length > 0 ? (
            <Box sx={{ minWidth: 800 }}>
              {/* Header Row */}
              <Box sx={{ display: "flex", borderBottom: 2, borderColor: "divider" }}>
                <Box
                  sx={{ width: 120, p: 2, fontWeight: "bold", bgcolor: "background.paper", borderRight: 1, borderColor: "divider" }}
                >
                  Period
                </Box>
                {config.workingDays.map((day: string) => (
                  <Box
                    key={day}
                    sx={{ flex: 1, p: 2, fontWeight: "bold", textAlign: "center", textTransform: "capitalize", borderRight: 1, borderColor: "divider" }}
                  >
                    {day}
                  </Box>
                ))}
              </Box>

              {/* Body Rows */}
              {allPeriods.map((period) => (
                <Box key={period.periodNumber} sx={{ display: "flex", borderBottom: 1, borderColor: "divider" }}>
                  {/* Period Column */}
                  <Box
                    sx={{ width: 120, p: 2, bgcolor: period.type !== "regular" ? "action.hover" : "background.paper", borderRight: 1, borderColor: "divider", display: "flex", flexDirection: "column", justifyContent: "center" }}
                  >
                    <Typography variant="subtitle2">
                      {period.type === "regular" ? `Period ${period.periodNumber}` : period.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {period.startTime} - {period.endTime}
                    </Typography>
                  </Box>

                  {/* Day Columns */}
                  {config.workingDays.map((day: string) => {
                    const entry = entryMap[`${day}-${period.periodNumber}`];
                    // If not regular period, merge appearance
                    if (period.type !== "regular") {
                      return (
                        <Box
                          key={`${day}-${period.periodNumber}`}
                          sx={{ flex: 1, p: 2, bgcolor: "action.hover", borderRight: 1, borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            {period.type.toUpperCase()}
                          </Typography>
                        </Box>
                      );
                    }

                    return (
                      <Box
                        key={`${day}-${period.periodNumber}`}
                        sx={{ flex: 1, p: 1, borderRight: 1, borderColor: "divider", display: "flex", flexDirection: "column", gap: 1, minHeight: 100, transition: "background-color 0.2s" }}
                      >
                        {entry ? (
                          <Paper
                            elevation={0}
                            sx={{ p: 1, height: "100%", bgcolor: "#f3e5f5", border: "1px solid #ce93d8", borderRadius: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", position: 'relative', "&:hover .action-btns": { opacity: 1 } }}
                          >
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#6a1b9a" }}>
                                {subjects.find((s: any) => s.subjectId === entry.subjectId)?.name || "Unknown Subject"}
                              </Typography>
                              <Typography variant="caption" sx={{ color: "#4a148c" }}>
                                {(() => {
                                  const rawTId = String(entry.teacherId || "").trim();
                                  if (entry.teacher?.name && entry.teacher.name !== rawTId && !entry.teacher.name.startsWith("TCH-") && !entry.teacher.name.startsWith("TEA_")) {
                                    return entry.teacher.name;
                                  }
                                  if (entry.teacher?.firstName || entry.teacher?.lastName) {
                                    const fn = `${entry.teacher.firstName || ''} ${entry.teacher.lastName || ''}`.trim();
                                    if (fn) return fn;
                                  }
                                  if (!rawTId) return "";
                                  const t = teachers.find((t: any) => {
                                    if (!t) return false;
                                    const ids = [t.teacherId, t._id, t.id, t.userId, t.employeeId, t.staffId, t.code]
                                      .filter(Boolean)
                                      .map((id: any) => String(id).trim().toLowerCase());
                                    return ids.includes(rawTId.toLowerCase());
                                  });
                                  if (t) {
                                    const fn = `${t.firstName || ''} ${t.lastName || ''}`.trim();
                                    if (fn) return fn;
                                    if (t.name && !t.name.startsWith("TCH-")) return t.name;
                                  }
                                  return rawTId;
                                })()}
                              </Typography>
                            </Box>
                            <Box className="action-btns" sx={{ opacity: 0, transition: 'opacity 0.2s', position: 'absolute', top: 2, right: 2, display: 'flex', gap: 0.5, bgcolor: 'rgba(255,255,255,0.8)', borderRadius: 1 }}>
                              <IconButton size="small" onClick={() => handleOpenEdit(day, period.periodNumber, entry)}>
                                <EditIcon fontSize="small" color="primary" />
                              </IconButton>
                              <IconButton size="small" onClick={() => handleDelete(day, period.periodNumber)} disabled={deleteDraftEntry.isPending}>
                                <DeleteIcon fontSize="small" color="error" />
                              </IconButton>
                            </Box>
                          </Paper>
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.disabled', position: 'relative', "&:hover .add-btn": { opacity: 1 } }}>
                            <Typography variant="caption">-</Typography>
                            <IconButton className="add-btn" sx={{ opacity: 0, transition: 'opacity 0.2s', position: 'absolute' }} onClick={() => handleOpenEdit(day, period.periodNumber, null)}>
                              <AddIcon color="primary" />
                            </IconButton>
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              ))}
            </Box>
          ) : (
            <Alert severity="info">No working days configured.</Alert>
          )}
        </Paper>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Draft Entry</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {editData && (
            <>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                {editData.dayOfWeek} - Period {editData.periodNumber}
              </Typography>
              <FormControl fullWidth size="small">
                <InputLabel>Subject</InputLabel>
                <Select
                  value={editData.subjectId}
                  label="Subject"
                  onChange={(e) => handleSubjectChange(e.target.value as string)}
                >
                  {subjects.map((s: any) => {
                    const sId = getSubjectCanonicalId(s);
                    return (
                      <MenuItem key={sId || s.name} value={sId}>{s.name}</MenuItem>
                    );
                  })}
                </Select>
              </FormControl>

              {editData.subjectId && draftSubjectTeachers.length === 0 && (
                <Alert severity="warning" sx={{ fontSize: '0.8rem' }}>
                  No teachers are assigned to teach this subject. Please assign a teacher to this subject in Subject configuration.
                </Alert>
              )}

              <FormControl fullWidth size="small" disabled={!editData.subjectId || draftSubjectTeachers.length === 0}>
                <InputLabel>Teacher</InputLabel>
                <Select
                  value={editData.teacherId}
                  label="Teacher"
                  onChange={(e) => setEditData({ ...editData, teacherId: e.target.value as string })}
                >
                  {draftSubjectTeachers.map((t: any) => {
                    const tId = getTeacherCanonicalId(t);
                    const tName = `${t.firstName || ''} ${t.lastName || ''}`.trim() || t.name || tId;
                    return (
                      <MenuItem key={tId} value={tId}>{tName}</MenuItem>
                    );
                  })}
                </Select>
                {!editData.subjectId && (
                  <FormHelperText>Select a subject first to view assigned teachers</FormHelperText>
                )}
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEdit} disabled={updateDraftEntry.isPending}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Version Confirmation */}
      <ConfirmationDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteVersion}
        title="Delete Draft Version"
        description={`Are you sure you want to delete version ${versionToDelete}? This action cannot be undone.`}
        confirmLabel="Delete Version"
        variant="danger"
        isLoading={deleteVersion.isPending}
      />
    </Box>
  );
};

export default TimetableDraftPreview;
