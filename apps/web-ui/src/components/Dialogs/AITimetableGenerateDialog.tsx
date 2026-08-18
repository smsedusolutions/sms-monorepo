import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  TextField,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  alpha,
  Chip,
  Tooltip,
  Collapse,
  Paper,
} from "@mui/material";
import {
  AutoAwesome as MagicIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Close as CloseIcon,
  HelpOutline as HelpIcon,
  ExpandMore as ExpandMoreIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Lightbulb as SuggestIcon,
  DragIndicator as DragIcon,
} from "@mui/icons-material";
import { useNotificationStore } from "../../stores/notificationStore";
import { useValidateAITimetable, useGenerateAITimetable, useGetAIDraft, useSuggestAIRules } from "../../queries/Timetable";
import { useIsMobile } from "../../hooks/useIsMobile";
import type { Subject } from "../../types";
import { AppButton } from "../shared/AppButton";
import { AppReorderableList } from "../shared/AppReorderableList";

interface AITimetableGenerateDialogProps {
  open: boolean;
  onClose: () => void;
  schoolId: string;
  subjects: Subject[];
  currentClassId?: string;
  currentSectionId?: string;
}

const steps = ["Configure Subject Quotas", "Validation", "Generate"];

/**
 * Determines which subjects to show in the AI configuration list.
 * 
 * Rule: If a main subject (e.g., "Science") has sub-subjects (e.g., Biology, Chemistry, Physics),
 * hide the main subject and only show the sub-subjects labeled as "Biology (Science)".
 * Main subjects without any sub-subjects appear normally.
 */
function getSchedulableSubjects(subjects: Subject[]): { subject: Subject; displayName: string; parentName?: string; groupKey: string }[] {
  // Build a map: parentSubjectId -> parent subject name
  const parentIdToName: Record<string, string> = {};
  // Track which parent IDs actually have children
  const parentIdsWithChildren = new Set<string>();

  subjects.forEach(s => {
    if (s.isSubSubject && s.parentSubjectId) {
      parentIdsWithChildren.add(s.parentSubjectId);
    }
  });

  // Build parentId -> name lookup
  subjects.forEach(s => {
    if (parentIdsWithChildren.has(s.subjectId)) {
      parentIdToName[s.subjectId] = s.name;
    }
  });

  const result: { subject: Subject; displayName: string; parentName?: string; groupKey: string }[] = [];

  subjects.forEach(s => {
    if (s.isSubSubject && s.parentSubjectId) {
      // This is a sub-subject → show it with parent label
      const parentName = parentIdToName[s.parentSubjectId] || "";
      result.push({
        subject: s,
        displayName: parentName ? `${s.name} (${parentName})` : s.name,
        parentName,
        groupKey: s.parentSubjectId,
      });
    } else if (!parentIdsWithChildren.has(s.subjectId)) {
      // This is a main subject WITHOUT children → show it normally
      result.push({
        subject: s,
        displayName: s.name,
        groupKey: s.subjectId,
      });
    }
    // If this is a main subject WITH children → skip it (hidden)
  });

  // Sort: group by parent, then alphabetical within group
  result.sort((a, b) => {
    if (a.groupKey !== b.groupKey) {
      const aGroupName = a.parentName || a.subject.name;
      const bGroupName = b.parentName || b.subject.name;
      return aGroupName.localeCompare(bGroupName);
    }
    return a.subject.name.localeCompare(b.subject.name);
  });

  return result;
}

const AITimetableGenerateDialog = ({
  open,
  onClose,
  schoolId,
  subjects,
  currentClassId = "",
  currentSectionId = "",
}: AITimetableGenerateDialogProps) => {
  const isMobile = useIsMobile();
  const [activeStep, setActiveStep] = useState(0);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [priorityPanelOpen, setPriorityPanelOpen] = useState(true);

  // Compute schedulable subjects (filtered: no parent subjects that have children)
  const schedulableSubjects = useMemo(() => getSchedulableSubjects(subjects), [subjects]);

  // Priority order: array of subjectIds, ordered by priority (index 0 = highest priority)
  const [priorityOrder, setPriorityOrder] = useState<string[]>(() =>
    schedulableSubjects.map(item => item.subject.subjectId)
  );

  // Set of subjectIds that were auto-filled by the suggest button (cleared on manual edit)
  const [suggestedSubjectIds, setSuggestedSubjectIds] = useState<Set<string>>(new Set());

  // Tier labels from last suggestion (subjectId -> tierLabel)
  const [tierLabels, setTierLabels] = useState<Record<string, string>>({});

  // Map of subjectId to { periodsPerWeek: number, morningPriority: boolean, maxPeriodsPerDay: number }
  const [rules, setRules] = useState<Record<string, { periodsPerWeek: number, morningPriority: boolean, maxPeriodsPerDay: number }>>(() => {
    const initialRules: Record<string, { periodsPerWeek: number, morningPriority: boolean, maxPeriodsPerDay: number }> = {};
    schedulableSubjects.forEach((item) => {
      initialRules[item.subject.subjectId] = {
        periodsPerWeek: 1,
        morningPriority: false,
        maxPeriodsPerDay: 2
      };
    });
    return initialRules;
  });

  const [halfDaySaturday, setHalfDaySaturday] = useState(true);
  const [saturdayPeriods, setSaturdayPeriods] = useState(4);

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const { showNotification } = useNotificationStore();
  const validateMutation = useValidateAITimetable(schoolId);
  const generateMutation = useGenerateAITimetable(schoolId);
  const suggestMutation = useSuggestAIRules(schoolId);
  const { data: draftData, isLoading: draftLoading } = useGetAIDraft(schoolId);
  const navigate = useNavigate();

  const existingDraft = draftData?.data?.status === "draft" ? draftData.data : null;

  // If user clicks "Resume", navigate to draft with pre-selected class + section in router state
  const handleResumeDraft = () => {
    onClose();
    navigate("/school-admin/timetable/draft", {
      state: {
        classId: currentClassId,
        sectionId: currentSectionId,
      },
    });
  };

  // If user clicks "Generate New", clear the flag to show the stepper
  const [forceNew, setForceNew] = useState(false);

  const showDraftWarning = !forceNew && !!existingDraft && !draftLoading;

  const handleNext = async () => {
    if (activeStep === 0) {
      // Transition to validation
      setActiveStep(1);

      const payloadRules = Object.entries(rules).map(([subjectId, config]) => ({
        subjectId,
        periodsPerWeek: config.periodsPerWeek,
        morningPriority: config.morningPriority,
        maxPeriodsPerDay: config.maxPeriodsPerDay
      }));

      const options = {
        dayLimits: halfDaySaturday ? { saturday: saturdayPeriods } : {}
      };

      try {
        const res = await validateMutation.mutateAsync({ rules: payloadRules, options });
        if (res.data?.isValid) {
          setValidationErrors([]);
        } else {
          setValidationErrors(res.data?.errors || ["Unknown validation error"]);
        }
      } catch (err: any) {
        setValidationErrors([err?.message || "Failed to validate"]);
      }
    } else if (activeStep === 1) {
      if (validationErrors.length > 0) {
        showNotification("Please resolve validation errors first", "error");
        return;
      }
      setActiveStep(2);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleGenerate = async () => {
    const payloadRules = Object.entries(rules).map(([subjectId, config]) => ({
      subjectId,
      periodsPerWeek: config.periodsPerWeek,
      morningPriority: config.morningPriority,
      maxPeriodsPerDay: config.maxPeriodsPerDay
    }));

    const options = {
      dayLimits: halfDaySaturday ? { saturday: saturdayPeriods } : {}
    };

    try {
      await generateMutation.mutateAsync({ rules: payloadRules, options });
      showNotification("AI successfully generated timetable draft", "success");
      onClose();
      setActiveStep(0);
      setForceNew(false);
      navigate("/school-admin/timetable/draft", {
        state: { classId: currentClassId, sectionId: currentSectionId },
      });
    } catch (err: any) {
      showNotification(err?.message || "Generation failed", "error");
    }
  };

  const handleRuleChange = (subjectId: string, field: string, value: any) => {
    // Clear auto-suggestion highlight when user manually edits a row
    if (suggestedSubjectIds.has(subjectId)) {
      setSuggestedSubjectIds(prev => {
        const next = new Set(prev);
        next.delete(subjectId);
        return next;
      });
    }
    setRules(prev => ({
      ...prev,
      [subjectId]: {
        ...prev[subjectId],
        [field]: value
      }
    }));
  };

  // Move a subject up or down in the priority list
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setPriorityOrder(prev => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === priorityOrder.length - 1) return;
    setPriorityOrder(prev => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  // Format priority list items for AppReorderableList component
  const priorityItems = useMemo(() => {
    return priorityOrder.map((subjectId) => {
      const item = schedulableSubjects.find(s => s.subject.subjectId === subjectId);
      return {
        id: subjectId,
        subjectId,
        displayName: item?.displayName || subjectId,
        tier: tierLabels[subjectId],
      };
    });
  }, [priorityOrder, schedulableSubjects, tierLabels]);

  const handleReorderPriority = (newItems: typeof priorityItems) => {
    setPriorityOrder(newItems.map(item => item.id));
  };

  // Auto-suggest values based on current priority order
  const handleAutoSuggest = async () => {
    try {
      const res = await suggestMutation.mutateAsync({ subjectIds: priorityOrder });
      if (res.data?.suggestions) {
        const suggested = res.data.suggestions;
        const newSuggested = new Set<string>();
        const newTierLabels: Record<string, string> = {};

        setRules(prev => {
          const next = { ...prev };
          Object.entries(suggested).forEach(([subjectId, suggestion]) => {
            next[subjectId] = {
              periodsPerWeek: suggestion.periodsPerWeek,
              maxPeriodsPerDay: suggestion.maxPeriodsPerDay,
              morningPriority: suggestion.morningPriority,
            };
            newSuggested.add(subjectId);
            newTierLabels[subjectId] = suggestion.tierLabel;
          });
          return next;
        });

        setSuggestedSubjectIds(newSuggested);
        setTierLabels(newTierLabels);
        showNotification(`✨ Auto-suggested values for ${Object.keys(suggested).length} subjects`, 'success');
      }
    } catch (err: any) {
      showNotification(err?.message || 'Failed to generate suggestions', 'error');
    }
  };

  // Group the schedulable subjects by parent for section headers
  const groupedSubjects = useMemo(() => {
    const groups: { groupName: string | null; items: typeof schedulableSubjects }[] = [];
    let currentGroup: string | null = null;
    let currentItems: typeof schedulableSubjects = [];

    schedulableSubjects.forEach(item => {
      const group = item.parentName || null;
      if (group !== currentGroup) {
        if (currentItems.length > 0) {
          groups.push({ groupName: currentGroup, items: currentItems });
        }
        currentGroup = group;
        currentItems = [item];
      } else {
        currentItems.push(item);
      }
    });

    if (currentItems.length > 0) {
      groups.push({ groupName: currentGroup, items: currentItems });
    }

    return groups;
  }, [schedulableSubjects]);

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!generateMutation.isPending) {
          onClose();
          setForceNew(false);
        }
      }}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          maxHeight: isMobile ? '100dvh' : '90vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
          py: { xs: 1.5, sm: 2 },
          px: { xs: 2, sm: 3 },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <MagicIcon color="primary" sx={{ fontSize: { xs: 22, sm: 26 } }} />
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1.05rem', sm: '1.25rem' } }}>
            AI Timetable Generation
          </Typography>
        </Box>
        <IconButton
          aria-label="close"
          onClick={() => {
            if (!generateMutation.isPending) {
              onClose();
              setForceNew(false);
            }
          }}
          size="small"
          edge="end"
          sx={{ color: 'text.secondary' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* ---- Draft Exists Warning Screen ---- */}
      {showDraftWarning ? (
        <>
          <DialogContent sx={{ p: { xs: 2, sm: 3 }, overflowY: 'auto' }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                py: { xs: 3, sm: 5 },
                px: { xs: 1, sm: 3 },
                gap: { xs: 2.5, sm: 3 },
                maxWidth: 540,
                mx: 'auto',
              }}
            >
              <Box
                sx={{
                  width: { xs: 64, sm: 80 },
                  height: { xs: 64, sm: 80 },
                  borderRadius: '50%',
                  bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MagicIcon color="secondary" sx={{ fontSize: { xs: 36, sm: 48 } }} />
              </Box>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1.15rem', sm: '1.35rem' }, mb: 1 }}>
                  You have an existing draft (v{existingDraft?.version})
                </Typography>
                <Typography color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '0.95rem' }, lineHeight: 1.6 }}>
                  A school-wide timetable draft already exists. Would you like to resume reviewing it, or generate a brand new one for the entire school?
                </Typography>
              </Box>

              <Alert
                severity="warning"
                sx={{
                  width: '100%',
                  textAlign: 'left',
                  borderRadius: 2,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                }}
              >
                Generating a new draft will archive the current one (Version {existingDraft?.version} → archived). The new draft will be generated for ALL active classes in the school.
              </Alert>
            </Box>
          </DialogContent>
          <DialogActions
            sx={{
              p: { xs: 2, sm: 3 },
              borderTop: '1px solid',
              borderColor: 'divider',
              flexDirection: { xs: 'column-reverse', sm: 'row' },
              gap: { xs: 1.25, sm: 1.5 },
            }}
          >
            <Button
              fullWidth={isMobile}
              onClick={() => {
                onClose();
                setForceNew(false);
              }}
              sx={{ py: { xs: 1, sm: 0.75 } }}
            >
              Cancel
            </Button>
            {!isMobile && <Box sx={{ flex: '1 1 auto' }} />}
            <Button
              fullWidth={isMobile}
              variant="outlined"
              color="secondary"
              onClick={handleResumeDraft}
              sx={{ py: { xs: 1, sm: 0.75 }, fontWeight: 600 }}
            >
              Resume Existing Draft (v{existingDraft?.version})
            </Button>
            <AppButton
              fullWidth={isMobile}
              variant="contained"
              startIcon={<MagicIcon />}
              onClick={() => setForceNew(true)}
              sx={{ py: { xs: 1, sm: 0.75 } }}
            >
              Generate New Draft
            </AppButton>
          </DialogActions>
        </>
      ) : (
        <>
          <Box
            sx={{
              width: '100%',
              pt: { xs: 1.5, sm: 2.5 },
              pb: { xs: 0.5, sm: 1 },
              px: { xs: 1.5, sm: 3 },
              borderBottom: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.default',
            }}
          >
            <Stepper activeStep={activeStep} alternativeLabel={isMobile}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel
                    sx={{
                      '& .MuiStepLabel-label': {
                        fontSize: { xs: '0.72rem', sm: '0.875rem' },
                        fontWeight: 600,
                        mt: { xs: 0.5, sm: 0 },
                      },
                    }}
                  >
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          <DialogContent sx={{ p: { xs: 2, sm: 3 }, overflowY: 'auto', minHeight: { xs: 'auto', sm: '400px' } }}>
            {activeStep === 0 && (
              <Box sx={{ mt: 0.5 }}>
                {/* ===== INSTRUCTIONS TRIGGER BUTTON ===== */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'stretch', sm: 'center' },
                    justifyContent: 'space-between',
                    gap: { xs: 1.5, sm: 2 },
                    mb: 2.5,
                    p: { xs: 1.75, sm: 2 },
                    px: { xs: 2, sm: 2.5 },
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                    border: '1px solid',
                    borderColor: (theme) => alpha(theme.palette.primary.main, 0.18),
                    borderRadius: 2.5,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
                    <HelpIcon color="primary" sx={{ fontSize: { xs: 20, sm: 22 }, flexShrink: 0 }} />
                    <Typography variant="body2" color="text.primary" fontWeight={600} sx={{ fontSize: { xs: '0.82rem', sm: '0.875rem' } }}>
                      Configure weekly period quotas and daily limits for each subject.
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    startIcon={<HelpIcon />}
                    onClick={() => setInstructionsOpen(true)}
                    fullWidth={isMobile}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 2,
                      py: 0.75,
                      flexShrink: 0,
                      boxShadow: 'none',
                      '&:hover': {
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      },
                    }}
                  >
                    Guide & Instructions
                  </Button>
                </Box>

                {/* ===== PRIORITY PANEL ===== */}
                <Box
                  sx={{
                    mb: 2.5,
                    border: '1px solid',
                    borderColor: (theme) => alpha(theme.palette.warning.main, 0.3),
                    borderRadius: 2.5,
                    overflow: 'hidden',
                  }}
                >
                  {/* Panel header */}
                  <Box
                    onClick={() => setPriorityPanelOpen((p) => !p)}
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'stretch', sm: 'center' },
                      justifyContent: 'space-between',
                      gap: { xs: 1.5, sm: 2 },
                      p: { xs: 1.75, sm: 2 },
                      px: { xs: 2, sm: 2.5 },
                      bgcolor: (theme) => alpha(theme.palette.warning.main, 0.06),
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: { xs: '100%', sm: 'auto' }, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                        <SuggestIcon sx={{ color: 'warning.main', fontSize: 22, flexShrink: 0 }} />
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle2" fontWeight={700} color="warning.dark" sx={{ fontSize: { xs: '0.875rem', sm: '0.95rem' } }}>
                            🏆 Subject Priority Order
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>
                            Rank subjects by importance — top = Core, bottom = Minor
                          </Typography>
                        </Box>
                      </Box>
                      {isMobile && (
                        <IconButton size="small" sx={{ flexShrink: 0 }}>
                          <ExpandMoreIcon sx={{ transform: priorityPanelOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }} />
                        </IconButton>
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
                      <AppButton
                        variant="contained"
                        size="small"
                        fullWidth={isMobile}
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleAutoSuggest();
                        }}
                        loading={suggestMutation.isPending}
                        startIcon={<MagicIcon />}
                        sx={{
                          bgcolor: 'warning.main',
                          color: 'warning.contrastText',
                          textTransform: 'none',
                          fontWeight: 700,
                          borderRadius: 2,
                          boxShadow: 'none',
                          py: { xs: 0.75, sm: 0.5 },
                          '&:hover': { bgcolor: 'warning.dark', boxShadow: '0 2px 8px rgba(0,0,0,0.18)' },
                        }}
                      >
                        Auto-Suggest Values
                      </AppButton>
                      {!isMobile && (
                        <IconButton size="small">
                          <ExpandMoreIcon sx={{ transform: priorityPanelOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }} />
                        </IconButton>
                      )}
                    </Box>
                  </Box>

                  {/* Draggable priority list */}
                  <Collapse in={priorityPanelOpen}>
                    <Box sx={{ px: 1, py: 0.5 }}>
                      <AppReorderableList
                        items={priorityItems}
                        onReorder={handleReorderPriority}
                        maxHeight={250}
                        renderItem={(item, index, isDragging) => {
                          const tierColors: Record<string, 'error' | 'warning' | 'info' | 'default'> = {
                            Core: 'error',
                            Major: 'warning',
                            Standard: 'info',
                            Minor: 'default',
                          };
                          return (
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                py: 0.75,
                                px: { xs: 0.75, sm: 1 },
                                borderRadius: 1.5,
                                bgcolor: isDragging
                                  ? (theme) => alpha(theme.palette.warning.main, 0.15)
                                  : 'background.paper',
                                border: '1px solid',
                                borderColor: isDragging ? 'warning.main' : 'divider',
                                cursor: 'grab',
                                userSelect: 'none',
                                transition: 'border-color 0.15s ease, background-color 0.15s ease',
                                '&:active': { cursor: 'grabbing' },
                                '&:hover': {
                                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                                  borderColor: 'warning.light',
                                },
                              }}
                            >
                              <Tooltip title="Drag handle to reorder priority">
                                <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'grab' }}>
                                  <DragIcon sx={{ color: 'warning.main', fontSize: 20, flexShrink: 0 }} />
                                </Box>
                              </Tooltip>
                              <Typography
                                variant="caption"
                                sx={{ fontWeight: 700, color: 'text.secondary', width: 20, textAlign: 'center', flexShrink: 0 }}
                              >
                                {index + 1}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  flex: 1,
                                  fontWeight: 600,
                                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                  minWidth: 0,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {item.displayName}
                              </Typography>
                              {item.tier && (
                                <Chip
                                  label={item.tier}
                                  size="small"
                                  color={tierColors[item.tier] || 'default'}
                                  variant="outlined"
                                  sx={{ fontSize: '0.65rem', height: 20, px: 0.5, flexShrink: 0 }}
                                />
                              )}
                              <Box sx={{ display: 'flex', gap: 0.25, flexShrink: 0 }}>
                                <Tooltip title="Move up (higher priority)">
                                  <span>
                                    <IconButton
                                      size="small"
                                      disabled={index === 0}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMoveUp(index);
                                      }}
                                      sx={{ p: 0.25 }}
                                    >
                                      <ArrowUpIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                                <Tooltip title="Move down (lower priority)">
                                  <span>
                                    <IconButton
                                      size="small"
                                      disabled={index === priorityOrder.length - 1}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMoveDown(index);
                                      }}
                                      sx={{ p: 0.25 }}
                                    >
                                      <ArrowDownIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </Box>
                            </Box>
                          );
                        }}
                      />
                    </Box>
                    {suggestedSubjectIds.size > 0 && (
                      <Box sx={{ px: 2, pb: 1.5 }}>
                        <Alert severity="success" icon={<MagicIcon fontSize="small" />} sx={{ py: 0.5 }}>
                          <Typography variant="caption">
                            ✨ {suggestedSubjectIds.size} subjects have auto-suggested values. Manually editing a row removes the highlight.
                          </Typography>
                        </Alert>
                      </Box>
                    )}
                  </Collapse>
                </Box>

                {/* ===== HALF-DAY SATURDAY ===== */}
                <Box
                  sx={{
                    mb: 3,
                    p: { xs: 1.75, sm: 2 },
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                    border: '1px solid',
                    borderColor: (theme) => alpha(theme.palette.primary.main, 0.15),
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'stretch', sm: 'center' },
                    justifyContent: 'space-between',
                    gap: { xs: 1.5, sm: 2 },
                  }}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        checked={halfDaySaturday}
                        onChange={(e) => setHalfDaySaturday(e.target.checked)}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          Half-Day Saturday
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Cap maximum periods on Saturdays
                        </Typography>
                      </Box>
                    }
                  />
                  {halfDaySaturday && (
                    <TextField
                      label="Saturday Periods"
                      type="text"
                      size="small"
                      value={saturdayPeriods}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setSaturdayPeriods(val === "" ? 0 : parseInt(val, 10));
                      }}
                      inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                      sx={{
                        width: { xs: '100%', sm: '150px' },
                        bgcolor: 'background.paper',
                        borderRadius: 1,
                      }}
                    />
                  )}
                </Box>

                {/* ===== SUBJECT LIST ===== */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {groupedSubjects.map((group, groupIdx) => (
                    <Box key={group.groupName || `standalone-${groupIdx}`}>
                      {/* Section header for sub-subject groups */}
                      {group.groupName && (
                        <Box sx={{ px: 1, pt: groupIdx > 0 ? 2 : 0.5, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="overline"
                            color="primary.main"
                            sx={{ fontWeight: 800, letterSpacing: 1.2, fontSize: '0.75rem' }}
                          >
                            📂 {group.groupName}
                          </Typography>
                          <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
                        </Box>
                      )}

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                        {group.items.map((item) => {
                          const isSuggested = suggestedSubjectIds.has(item.subject.subjectId);
                          const tier = tierLabels[item.subject.subjectId];

                          return (
                            <Paper
                              key={item.subject.subjectId}
                              elevation={0}
                              sx={{
                                p: { xs: 1.75, sm: 2 },
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: isSuggested ? 'success.light' : 'divider',
                                bgcolor: isSuggested ? alpha('#4caf50', 0.03) : 'background.paper',
                                ml: item.parentName ? { xs: 1, sm: 2 } : 0,
                                borderLeft: item.parentName ? '3px solid' : undefined,
                                borderLeftColor: item.parentName ? 'primary.main' : undefined,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  borderColor: isSuggested ? 'success.main' : 'primary.light',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                },
                              }}
                            >
                              {/* Responsive Layout: Flex Column on mobile (xs), Flex Row on desktop (md+) */}
                              <Box
                                sx={{
                                  display: 'flex',
                                  flexDirection: { xs: 'column', md: 'row' },
                                  alignItems: { xs: 'stretch', md: 'center' },
                                  justifyContent: 'space-between',
                                  gap: { xs: 1.5, md: 2 },
                                }}
                              >
                                {/* Subject Info Header (Title, Code badge, Auto-suggest chip) */}
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, minWidth: 0, flex: 1 }}>
                                  <Box sx={{ minWidth: 0 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                      <Typography variant="body1" sx={{ fontWeight: 700, fontSize: { xs: '0.9rem', sm: '0.95rem' }, color: 'text.primary' }}>
                                        {item.displayName}
                                      </Typography>
                                      {item.subject.code && (
                                        <Chip
                                          label={item.subject.code}
                                          size="small"
                                          variant="outlined"
                                          sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600, color: 'text.secondary' }}
                                        />
                                      )}
                                    </Box>
                                  </Box>

                                  {isSuggested && (
                                    <Tooltip title={`Auto-suggested${tier ? ` (${tier} priority)` : ''} — modify to customize`}>
                                      <Chip
                                        icon={<MagicIcon sx={{ fontSize: '14px !important' }} />}
                                        label={tier ? `✨ ${tier}` : "✨ Auto"}
                                        size="small"
                                        color="success"
                                        variant="filled"
                                        sx={{ fontSize: '0.68rem', height: 22, fontWeight: 700, flexShrink: 0 }}
                                      />
                                    </Tooltip>
                                  )}
                                </Box>

                                {/* Controls Grid / Row */}
                                <Box
                                  sx={{
                                    display: 'grid',
                                    gridTemplateColumns: { xs: '1fr 1fr auto', sm: '110px 110px auto' },
                                    alignItems: 'center',
                                    gap: { xs: 1.25, sm: 1.5 },
                                  }}
                                >
                                  <TextField
                                    label="P/Week"
                                    type="text"
                                    size="small"
                                    value={rules[item.subject.subjectId]?.periodsPerWeek ?? 0}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                      const val = e.target.value.replace(/\D/g, "");
                                      handleRuleChange(item.subject.subjectId, 'periodsPerWeek', val === "" ? 0 : parseInt(val, 10));
                                    }}
                                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                                    sx={{
                                      '& .MuiOutlinedInput-root': isSuggested
                                        ? { borderColor: 'success.main' }
                                        : {},
                                    }}
                                  />
                                  <TextField
                                    label="Max / Day"
                                    type="text"
                                    size="small"
                                    title="Max periods of this subject in a single day"
                                    value={rules[item.subject.subjectId]?.maxPeriodsPerDay ?? 1}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                      const val = e.target.value.replace(/\D/g, "");
                                      handleRuleChange(item.subject.subjectId, 'maxPeriodsPerDay', val === "" ? 0 : parseInt(val, 10));
                                    }}
                                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                                  />
                                  <FormControlLabel
                                    control={
                                      <Switch
                                        size="small"
                                        checked={rules[item.subject.subjectId]?.morningPriority || false}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                          handleRuleChange(item.subject.subjectId, 'morningPriority', e.target.checked)
                                        }
                                      />
                                    }
                                    label={
                                      <Typography variant="caption" sx={{ fontSize: '0.72rem', fontWeight: 600, color: 'text.secondary', display: 'block', textAlign: 'center' }}>
                                        Morning
                                      </Typography>
                                    }
                                    labelPlacement="bottom"
                                    sx={{ m: 0, '& .MuiFormControlLabel-label': { mt: -0.25 } }}
                                  />
                                </Box>
                              </Box>
                            </Paper>
                          );
                        })}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {activeStep === 1 && (
              <Box sx={{ mt: { xs: 2, sm: 4 }, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', px: { xs: 1, sm: 3 } }}>
                {validateMutation.isPending ? (
                  <>
                    <CircularProgress sx={{ mb: 2 }} />
                    <Typography variant="body1" fontWeight={600}>Analyzing school resources & teachers...</Typography>
                  </>
                ) : validationErrors.length > 0 ? (
                  <Box sx={{ width: '100%' }}>
                    <ErrorIcon color="error" sx={{ fontSize: { xs: 48, sm: 60 }, mb: 1.5 }} />
                    <Typography variant="h6" color="error" gutterBottom sx={{ fontWeight: 700, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                      Validation Failed
                    </Typography>
                    <Alert severity="error" sx={{ textAlign: 'left', mb: 2, borderRadius: 2 }}>
                      The AI cannot mathematically fulfill your requirements based on current teacher assignments.
                    </Alert>
                    <List sx={{ width: '100%', bgcolor: 'error.lighter', borderRadius: 2, p: 1 }}>
                      {validationErrors.map((err, i) => (
                        <ListItem key={i} sx={{ py: 0.5 }}>
                          <ListItemText
                            primary={err}
                            primaryTypographyProps={{ fontSize: { xs: '0.8rem', sm: '0.875rem' }, color: 'error.dark' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                ) : (
                  <Box sx={{ py: { xs: 2, sm: 4 } }}>
                    <CheckIcon color="success" sx={{ fontSize: { xs: 48, sm: 60 }, mb: 1.5 }} />
                    <Typography variant="h6" color="success.main" gutterBottom sx={{ fontWeight: 700 }}>
                      Perfect!
                    </Typography>
                    <Typography color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, maxWidth: 460 }}>
                      You have enough teachers to fulfill all subject quotas. The AI is ready to generate the timetable.
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {activeStep === 2 && (
              <Box sx={{ mt: { xs: 2, sm: 4 }, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', px: { xs: 1, sm: 3 }, py: { xs: 2, sm: 4 } }}>
                {!generateMutation.isPending ? (
                  <>
                    <MagicIcon color="primary" sx={{ fontSize: { xs: 48, sm: 60 }, mb: 2 }} />
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, fontSize: { xs: '1.15rem', sm: '1.25rem' } }}>
                      Ready to Generate
                    </Typography>
                    <Typography color="text.secondary" sx={{ maxWidth: 480, fontSize: { xs: '0.875rem', sm: '0.95rem' }, lineHeight: 1.6 }}>
                      The AI will now build the complete timetable for all classes, ensuring no teacher clashes and respecting your morning priorities and daily limits.
                    </Typography>
                  </>
                ) : (
                  <>
                    <CircularProgress size={isMobile ? 48 : 60} sx={{ mb: 3 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Generating Schedule...</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 420 }}>
                      This may take a moment. The AI is solving constraints for all classes and sections.
                    </Typography>
                  </>
                )}
              </Box>
            )}
          </DialogContent>

          <DialogActions
            sx={{
              p: { xs: 2, sm: 3 },
              borderTop: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <Button
              disabled={activeStep === 0 || generateMutation.isPending}
              onClick={handleBack}
              sx={{ px: { xs: 2, sm: 3 } }}
            >
              Back
            </Button>
            {activeStep === steps.length - 1 ? (
              <AppButton
                variant="contained"
                onClick={handleGenerate}
                loading={generateMutation.isPending}
                startIcon={<MagicIcon />}
                sx={{ px: { xs: 2.5, sm: 3 } }}
              >
                Generate Now
              </AppButton>
            ) : (
              <AppButton
                variant="contained"
                onClick={handleNext}
                loading={validateMutation.isPending}
                disabled={activeStep === 1 && validationErrors.length > 0}
                sx={{ px: { xs: 2.5, sm: 3 } }}
              >
                {activeStep === 0 ? "Validate constraints" : "Next"}
              </AppButton>
            )}
          </DialogActions>
        </>
      )}

      {/* ===== INSTRUCTIONS DIALOG MODAL ===== */}
      <Dialog
        open={instructionsOpen}
        onClose={() => setInstructionsOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 3,
            maxHeight: isMobile ? '100dvh' : '90vh',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid',
            borderColor: 'divider',
            py: { xs: 1.5, sm: 2 },
            px: { xs: 2, sm: 3 },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HelpIcon color="info" />
            <Typography variant="h6" fontWeight={700} color="primary.main" sx={{ fontSize: { xs: '1rem', sm: '1.2rem' } }}>
              How to Fill This Form
            </Typography>
          </Box>
          <IconButton onClick={() => setInstructionsOpen(false)} size="small" edge="end">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 2, sm: 3 }, overflowY: 'auto' }}>
          <Typography variant="body2" sx={{ mb: 2.5, lineHeight: 1.7, color: 'text.primary' }}>
            Set up how many times each subject should appear in every class's weekly timetable. The AI will automatically build a timetable for <strong>all classes and sections</strong> without any clashes.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Accordion elevation={0} defaultExpanded sx={{ border: '1px solid #e0e0e0', '&:before': { display: 'none' }, borderRadius: '8px !important' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />}>
                <Typography variant="subtitle2" color="primary.main" fontWeight={600}>
                  📅 P/Week (Periods Per Week)
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Typography variant="body2" color="text.secondary">
                  How many periods of this subject should appear in <strong>each class's</strong> weekly timetable.
                  For example, if you set Mathematics to <strong>5</strong>, then every class (8-A, 8-B, 9-A, etc.) will get 5 Math periods spread across the week.
                  Set to <strong>0</strong> to skip a subject.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion elevation={0} defaultExpanded sx={{ border: '1px solid #e0e0e0', '&:before': { display: 'none' }, borderRadius: '8px !important' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />}>
                <Typography variant="subtitle2" color="primary.main" fontWeight={600}>
                  📊 Max/Day (Maximum Periods Per Day)
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Typography variant="body2" color="text.secondary">
                  The maximum number of periods of this subject allowed in a <strong>single day</strong> for any class.
                  For example, setting Max/Day to <strong>1</strong> means no class will have two Math periods on the same day.
                  Setting it to <strong>2</strong> allows up to 2 periods on the same day if needed.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion elevation={0} defaultExpanded sx={{ border: '1px solid #e0e0e0', '&:before': { display: 'none' }, borderRadius: '8px !important' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />}>
                <Typography variant="subtitle2" color="primary.main" fontWeight={600}>
                  🌅 Morning Priority
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Typography variant="body2" color="text.secondary">
                  When turned <strong>ON</strong>, the AI will try its best to schedule this subject in the <strong>first half</strong> of the day (morning periods).
                  This is useful for core subjects like Mathematics where students are more focused early in the day.
                  If it's not possible, the AI will still place it in an afternoon slot.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion elevation={0} defaultExpanded sx={{ border: '1px solid #e0e0e0', '&:before': { display: 'none' }, borderRadius: '8px !important' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />}>
                <Typography variant="subtitle2" color="primary.main" fontWeight={600}>
                  📌 Half-Day Saturday
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Typography variant="body2" color="text.secondary">
                  When turned <strong>ON</strong>, Saturday will only use the number of periods you specify (e.g., 4 periods instead of the full day).
                  The AI will respect this limit when distributing subjects.
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: { xs: 2, sm: 2.5 }, borderTop: '1px solid', borderColor: 'divider' }}>
          <AppButton fullWidth={isMobile} variant="contained" onClick={() => setInstructionsOpen(false)}>
            Got It
          </AppButton>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default AITimetableGenerateDialog;
