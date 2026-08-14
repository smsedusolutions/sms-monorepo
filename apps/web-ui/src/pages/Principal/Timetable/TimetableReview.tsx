import React, { useState, useMemo, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Button,
    CircularProgress,
    Alert,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Tooltip,
    Grid,
    Card,
    CardContent,
    Tab,
    Tabs,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import {
    Visibility as ViewIcon,
    CheckCircle as ApproveIcon,
    Cancel as RejectIcon,
    Schedule as ScheduleIcon,
    CalendarMonth as CalendarIcon,
    AutoAwesome as AIIcon,
    Build as ManualIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    HourglassTop as PendingIcon,
    TaskAlt as ApprovedIcon,
    Block as RejectedIcon,
    LiveTv as LiveIcon,
    History as ReplacedIcon,
} from '@mui/icons-material';
import {
    useGetTimetableSchedules,
    useGetActiveClasses,
    useToggleTimetableSchedule,
    useGetActiveConfig,
} from '../../../queries/Timetable';
import { useGetClasses } from '../../../queries/Class';
import { useGetTeachers } from '../../../queries/Teacher';
import { useGetSubjects } from '../../../queries/Subject';
import TokenService from '../../../queries/token/tokenService';
import ConfirmationDialog from '../../../components/Dialogs/ConfirmationDialog';
import type { TimetableSchedule } from '../../../types/timetable.types';
import { useTimeSettingsStore, type TimeFormat } from '../../../stores/timeSettingsStore';
import { formatSingleTime } from '../../../utils/timeUtils';
import { useUrlTab } from '../../../hooks/useUrlTab';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (d?: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateTime = (d?: string | null, timeFormat: TimeFormat = '12h') => {
    if (!d) return '—';
    const dateObj = new Date(d);
    const dateStr = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    const timeStr = formatSingleTime(`${hours}:${minutes < 10 ? '0' + minutes : minutes}`, timeFormat);
    return `${dateStr}, ${timeStr}`;
};

const StatusChip: React.FC<{ status: TimetableSchedule['status'] }> = ({ status }) => {
    const map: Record<string, { label: string; color: 'warning' | 'success' | 'error' | 'default' | 'info' }> = {
        pending_approval: { label: 'Pending Review', color: 'warning' },
        draft: { label: 'Draft', color: 'default' },
        active: { label: '● LIVE', color: 'success' },
        rejected: { label: 'Rejected', color: 'error' },
        replaced: { label: 'Replaced', color: 'default' },
        disabled: { label: 'Disabled', color: 'default' },
    };
    const cfg = map[status] || { label: status, color: 'default' };
    return <Chip label={cfg.label} color={cfg.color} size="small" variant="filled" />;
};

const SourceBadge: React.FC<{ source?: 'ai' | 'manual'; version?: number; aiDraftVersion?: number }> = ({ source, version, aiDraftVersion }) => {
    if (source === 'ai') {
        const v = aiDraftVersion || version;
        return (
            <Chip
                icon={<AIIcon sx={{ fontSize: '14px !important' }} />}
                label={`AI${v ? ` v${v}` : ''}`}
                size="small"
                sx={{ bgcolor: '#ede9fe', color: '#7c3aed', fontWeight: 600, fontSize: 11 }}
            />
        );
    }
    return (
        <Chip
            icon={<ManualIcon sx={{ fontSize: '14px !important' }} />}
            label="Manual"
            size="small"
            sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 600, fontSize: 11 }}
        />
    );
};

// ─── Component ────────────────────────────────────────────────────────────────
const TimetableReview: React.FC = () => {
    const schoolId = TokenService.getSchoolId() || '';

    const { timeFormat } = useTimeSettingsStore();
    const [activeTab, setActiveTab] = useUrlTab(0, ['pending', 'approved', 'rejected']);
    const [selectedSchedule, setSelectedSchedule] = useState<TimetableSchedule | null>(null);
    const [selectedClassSectionKey, setSelectedClassSectionKey] = useState<string>('');
    const [rejectDialog, setRejectDialog] = useState<TimetableSchedule | null>(null);
    const [rejectionComment, setRejectionComment] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [expandedRejection, setExpandedRejection] = useState<string | null>(null);

    // Override confirmation state
    const [overrideConfirmOpen, setOverrideConfirmOpen] = useState(false);
    const [overridePending, setOverridePending] = useState<{ schedule: TimetableSchedule; existing: { scheduleId: string; name: string; approvedAt?: string } } | null>(null);

    // Fetch data for all tabs & resolution lookup
    const { data: pendingData, isLoading: pendingLoading } = useGetTimetableSchedules(schoolId, 'pending_approval');
    const { data: activeData, isLoading: activeLoading } = useGetTimetableSchedules(schoolId, 'active');
    const { data: replacedData } = useGetTimetableSchedules(schoolId, 'replaced');
    const { data: rejectedData, isLoading: rejectedLoading } = useGetTimetableSchedules(schoolId, 'rejected');
    const { data: classesData } = useGetActiveClasses(schoolId);

    // Context queries for timetable preview resolution
    const { data: fullClassesData } = useGetClasses(schoolId);
    const { data: teachersData } = useGetTeachers(schoolId, { limit: 1000 } as any);
    const { data: subjectsData } = useGetSubjects(schoolId);
    const { data: configData } = useGetActiveConfig(schoolId);

    const toggleSchedule = useToggleTimetableSchedule(schoolId);

    const pendingSchedules: TimetableSchedule[] = pendingData?.data || [];
    const activeSchedules: TimetableSchedule[] = activeData?.data || [];
    const replacedSchedules: TimetableSchedule[] = replacedData?.data || [];
    const rejectedSchedules: TimetableSchedule[] = rejectedData?.data || [];
    const approvedSchedules = [...activeSchedules, ...replacedSchedules].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    const activeClasses = classesData?.data || [];

    const allClasses = fullClassesData?.data || [];
    const allTeachers = teachersData?.data || [];
    const allSubjects = subjectsData?.data || [];
    const config = configData?.data;

    const showSuccess = (msg: string) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(''), 4000);
    };
    const showError = (msg: string) => {
        setErrorMsg(msg);
        setTimeout(() => setErrorMsg(''), 5000);
    };

    // ── Lookup Helpers ─────────────────────────────────────────────────────────
    const getClassName = (classId: string) => {
        const c = allClasses.find((item: any) => item.classId === classId || item._id === classId);
        return c?.name || classId;
    };

    const getSectionName = (classId: string, sectionId: string) => {
        const c = allClasses.find((item: any) => item.classId === classId || item._id === classId);
        const s = c?.sections?.find((sec: any) => sec.sectionId === sectionId || sec._id === sectionId);
        return s?.name || sectionId;
    };

    const getSubjectName = (subjectId: string) => {
        if (!subjectId) return '';
        const s = allSubjects.find((item: any) => item.subjectId === subjectId || item._id === subjectId || item.id === subjectId);
        return s?.name || subjectId;
    };

    const getTeacherName = (rawTeacherId: string, entry?: any) => {
        if (entry?.teacher) {
            if (typeof entry.teacher === 'object') {
                const fn = `${entry.teacher.firstName || ''} ${entry.teacher.lastName || ''}`.trim();
                if (fn) return fn;
                if (entry.teacher.name && !entry.teacher.name.startsWith('TCH-') && !entry.teacher.name.startsWith('TEA_')) {
                    return entry.teacher.name;
                }
            } else if (typeof entry.teacher === 'string' && !entry.teacher.startsWith('TCH-') && !entry.teacher.startsWith('TEA_')) {
                return entry.teacher;
            }
        }

        const rawTId = String(rawTeacherId || '').trim();
        if (!rawTId) return '';

        const teacher = allTeachers.find((t: any) => {
            if (!t) return false;
            const ids = [t.teacherId, t._id, t.id, t.userId, t.employeeId, t.staffId, t.code]
                .filter(Boolean)
                .map((id: any) => String(id).trim().toLowerCase());
            return ids.includes(rawTId.toLowerCase());
        });

        if (teacher) {
            const fn = `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim();
            if (fn) return fn;
            if (teacher.name && !teacher.name.startsWith('TCH-') && !teacher.name.startsWith('TEA_')) {
                return teacher.name;
            }
            if ((teacher as any).user?.firstName || (teacher as any).user?.lastName) {
                const uFn = `${(teacher as any).user.firstName || ''} ${(teacher as any).user.lastName || ''}`.trim();
                if (uFn) return uFn;
            }
            if (teacher.email) {
                return teacher.email.split('@')[0];
            }
        }
        return rawTId;
    };

    // Extract class-section options present in selected schedule entries
    const availableClassSections = useMemo(() => {
        if (!selectedSchedule?.entries) return [];
        const map = new Map<string, { classId: string; sectionId: string; label: string }>();
        for (const e of selectedSchedule.entries) {
            const key = `${e.classId}_${e.sectionId}`;
            if (!map.has(key)) {
                const cName = getClassName(e.classId);
                const sName = getSectionName(e.classId, e.sectionId);
                map.set(key, { classId: e.classId, sectionId: e.sectionId, label: `${cName} - ${sName}` });
            }
        }
        return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
    }, [selectedSchedule, allClasses]);

    // Auto-select initial class/section option when schedule opens
    useEffect(() => {
        if (availableClassSections.length > 0) {
            setSelectedClassSectionKey(`${availableClassSections[0].classId}_${availableClassSections[0].sectionId}`);
        } else {
            setSelectedClassSectionKey('');
        }
    }, [availableClassSections]);

    // Compute timetable entries matrix for preview
    const workingDays = config?.workingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const maxPeriod = useMemo(() => {
        if (!selectedSchedule?.entries) return 8;
        const periodsInEntries = selectedSchedule.entries.map(e => Number(e.periodNumber));
        return Math.max(8, ...periodsInEntries);
    }, [selectedSchedule]);
    const periods = Array.from({ length: maxPeriod }, (_, i) => i + 1);

    // ── Approve handler ────────────────────────────────────────────────────────
    const handleApprove = async (schedule: TimetableSchedule, force = false) => {
        try {
            await toggleSchedule.mutateAsync({ scheduleId: schedule.scheduleId, status: 'active', force });
            showSuccess(`✅ Timetable "${schedule.name}" is now LIVE.`);
        } catch (err: any) {
            if (err?.code === 'TIMETABLE_ACTIVE_EXISTS') {
                setOverridePending({ schedule, existing: err.existingSchedule });
                setOverrideConfirmOpen(true);
            } else {
                showError(err?.message || 'Failed to approve timetable.');
            }
        }
    };

    const handleOverrideConfirm = async () => {
        if (!overridePending) return;
        setOverrideConfirmOpen(false);
        await handleApprove(overridePending.schedule, true);
        setOverridePending(null);
    };

    // ── Reject handler ─────────────────────────────────────────────────────────
    const handleReject = async () => {
        if (!rejectDialog) return;
        if (!rejectionComment.trim()) return;
        try {
            await toggleSchedule.mutateAsync({
                scheduleId: rejectDialog.scheduleId,
                status: 'rejected',
                rejectionComment: rejectionComment.trim(),
            });
            setRejectDialog(null);
            setRejectionComment('');
            showSuccess(`Timetable "${rejectDialog.name}" has been rejected.`);
        } catch (err: any) {
            showError(err?.message || 'Failed to reject timetable.');
        }
    };

    // ── Shared approve/reject actions column ──────────────────────────────────
    const renderPendingActions = (schedule: TimetableSchedule) => (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
            <Tooltip title="View & Preview Timetable Grid">
                <IconButton size="small" color="primary" onClick={() => setSelectedSchedule(schedule)}>
                    <ViewIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            <Tooltip title="Approve & Publish">
                <IconButton
                    size="small"
                    color="success"
                    onClick={() => handleApprove(schedule)}
                    disabled={toggleSchedule.isPending}
                >
                    <ApproveIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            <Tooltip title="Reject with Comment">
                <IconButton
                    size="small"
                    color="error"
                    onClick={() => setRejectDialog(schedule)}
                    disabled={toggleSchedule.isPending}
                >
                    <RejectIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        </Box>
    );

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h5" fontWeight={700} gutterBottom>
                Timetable Review
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Review submitted timetables, preview full grids, approve or reject them, and monitor what's live.
            </Typography>

            {/* Global alerts */}
            {successMsg && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMsg('')}>
                    {successMsg}
                </Alert>
            )}
            {errorMsg && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMsg('')}>
                    {errorMsg}
                </Alert>
            )}

            {/* Summary stat cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: 'Pending Review', value: pendingSchedules.length, color: 'warning.main', icon: <PendingIcon /> },
                    { label: 'Live Timetable', value: activeSchedules.length, color: 'success.main', icon: <LiveIcon /> },
                    { label: 'Rejected', value: rejectedSchedules.length, color: 'error.main', icon: <RejectedIcon /> },
                    { label: 'Active Classes', value: activeClasses.length, color: 'primary.main', icon: <CalendarIcon /> },
                ].map(({ label, value, color, icon }) => (
                    <Grid key={label} size={{ xs: 6, sm: 3 }}>
                        <Card sx={{ border: '1px solid #e2e8f0' }}>
                            <CardContent sx={{ py: 2, textAlign: 'center' }}>
                                <Box sx={{ color, mb: 0.5 }}>{icon}</Box>
                                <Typography variant="h4" fontWeight={700} color={color}>
                                    {value}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">{label}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Tabs */}
            <Paper sx={{ mb: 0 }}>
                <Tabs
                    value={activeTab}
                    onChange={(_, v) => setActiveTab(v)}
                    sx={{ borderBottom: '1px solid #e2e8f0', px: 2 }}
                >
                    <Tab
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                <PendingIcon sx={{ fontSize: 18 }} /> Pending
                                {pendingSchedules.length > 0 && (
                                    <Chip label={pendingSchedules.length} size="small" color="warning" sx={{ height: 18, fontSize: 11 }} />
                                )}
                            </Box>
                        }
                    />
                    <Tab
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                <ApprovedIcon sx={{ fontSize: 18 }} /> Approved / Live
                                {activeSchedules.length > 0 && (
                                    <Chip label="LIVE" size="small" color="success" sx={{ height: 18, fontSize: 11 }} />
                                )}
                            </Box>
                        }
                    />
                    <Tab
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                <RejectedIcon sx={{ fontSize: 18 }} /> Rejected
                                {rejectedSchedules.length > 0 && (
                                    <Chip label={rejectedSchedules.length} size="small" color="error" sx={{ height: 18, fontSize: 11 }} />
                                )}
                            </Box>
                        }
                    />
                </Tabs>

                {/* ── TAB 0: Pending ──────────────────────────────────────────────────── */}
                {activeTab === 0 && (
                    <Box sx={{ p: 0 }}>
                        {pendingLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                                <CircularProgress />
                            </Box>
                        ) : pendingSchedules.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 8 }}>
                                <CalendarIcon sx={{ fontSize: 56, color: '#cbd5e1', mb: 2 }} />
                                <Typography color="text.secondary" variant="h6">No timetables pending review</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    When the School Admin submits a timetable for approval, it will appear here.
                                </Typography>
                            </Box>
                        ) : (
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                            <TableCell sx={{ fontWeight: 700 }}>Timetable Name</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Source</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Slots</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Valid From</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Submitted</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {pendingSchedules.map((s) => (
                                            <TableRow key={s.scheduleId} hover>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <ScheduleIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
                                                        <Typography variant="body2" fontWeight={600}>{s.name}</Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <SourceBadge source={s.source} version={s.version} aiDraftVersion={s.aiDraftVersion} />
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={`${s.entries?.length || 0} slots`}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ fontSize: 11 }}
                                                    />
                                                </TableCell>
                                                <TableCell>{formatDate(s.validFrom)}</TableCell>
                                                <TableCell>{formatDateTime(s.createdAt, timeFormat)}</TableCell>
                                                <TableCell align="center">{renderPendingActions(s)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Box>
                )}

                {/* ── TAB 1: Approved / Live ──────────────────────────────────────────── */}
                {activeTab === 1 && (
                    <Box>
                        {activeLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                                <CircularProgress />
                            </Box>
                        ) : approvedSchedules.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 8 }}>
                                <ApprovedIcon sx={{ fontSize: 56, color: '#cbd5e1', mb: 2 }} />
                                <Typography color="text.secondary" variant="h6">No approved timetables yet</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    Approved timetables will appear here.
                                </Typography>
                            </Box>
                        ) : (
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                            <TableCell sx={{ fontWeight: 700 }}>Timetable Name</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Source</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Published On</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Replaced By</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Slots</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }} align="center">Action</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {approvedSchedules.map((s) => (
                                            <TableRow key={s.scheduleId} hover>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        {s.status === 'active' ? (
                                                            <LiveIcon sx={{ color: '#16a34a', fontSize: 18 }} />
                                                        ) : (
                                                            <ReplacedIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
                                                        )}
                                                        <Typography variant="body2" fontWeight={600}>{s.name}</Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <SourceBadge source={s.source} version={s.version} aiDraftVersion={s.aiDraftVersion} />
                                                </TableCell>
                                                <TableCell>
                                                    <StatusChip status={s.status} />
                                                </TableCell>
                                                <TableCell>{formatDateTime(s.approvedAt || s.updatedAt, timeFormat)}</TableCell>
                                                <TableCell>
                                                    {s.replacedByScheduleId ? (
                                                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
                                                            {s.replacedByScheduleId}
                                                        </Typography>
                                                    ) : (
                                                        <Chip label="Current Live" size="small" color="success" variant="outlined" sx={{ fontSize: 11 }} />
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={`${s.entries?.length || 0} slots`} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Tooltip title="Preview Timetable Grid">
                                                        <IconButton size="small" color="primary" onClick={() => setSelectedSchedule(s)}>
                                                            <ViewIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Box>
                )}

                {/* ── TAB 2: Rejected ─────────────────────────────────────────────────── */}
                {activeTab === 2 && (
                    <Box>
                        {rejectedLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                                <CircularProgress />
                            </Box>
                        ) : rejectedSchedules.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 8 }}>
                                <RejectedIcon sx={{ fontSize: 56, color: '#cbd5e1', mb: 2 }} />
                                <Typography color="text.secondary" variant="h6">No rejected timetables</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    Timetables you reject will appear here with their rejection reasons.
                                </Typography>
                            </Box>
                        ) : (
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                            <TableCell sx={{ fontWeight: 700 }}>Timetable Name</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Source</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Submitted</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Rejected On</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Rejection Comment</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }} align="center">Action</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {rejectedSchedules.map((s) => (
                                            <React.Fragment key={s.scheduleId}>
                                                <TableRow hover>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <RejectIcon sx={{ color: '#ef4444', fontSize: 18 }} />
                                                            <Typography variant="body2" fontWeight={600}>{s.name}</Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <SourceBadge source={s.source} version={s.version} aiDraftVersion={s.aiDraftVersion} />
                                                    </TableCell>
                                                    <TableCell>{formatDateTime(s.createdAt, timeFormat)}</TableCell>
                                                    <TableCell>{formatDateTime(s.rejectedAt, timeFormat)}</TableCell>
                                                    <TableCell>
                                                        {s.rejectionComment ? (
                                                            <Box>
                                                                <Typography
                                                                    variant="body2"
                                                                    sx={{
                                                                        display: '-webkit-box',
                                                                        WebkitBoxOrient: 'vertical',
                                                                        WebkitLineClamp: expandedRejection === s.scheduleId ? 'none' : 2,
                                                                        overflow: 'hidden',
                                                                        color: '#b45309',
                                                                        fontSize: 12,
                                                                    }}
                                                                >
                                                                    {s.rejectionComment}
                                                                </Typography>
                                                                <Button
                                                                    size="small"
                                                                    sx={{ p: 0, minWidth: 0, fontSize: 11, mt: 0.3 }}
                                                                    onClick={() =>
                                                                        setExpandedRejection(
                                                                            expandedRejection === s.scheduleId ? null : s.scheduleId
                                                                        )
                                                                    }
                                                                    endIcon={expandedRejection === s.scheduleId ? <ExpandLessIcon sx={{ fontSize: '14px !important' }} /> : <ExpandMoreIcon sx={{ fontSize: '14px !important' }} />}
                                                                >
                                                                    {expandedRejection === s.scheduleId ? 'Less' : 'More'}
                                                                </Button>
                                                            </Box>
                                                        ) : (
                                                            <Typography variant="body2" color="text.disabled" sx={{ fontSize: 12 }}>No comment</Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Tooltip title="View Details">
                                                            <IconButton size="small" onClick={() => setSelectedSchedule(s)}>
                                                                <ViewIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            </React.Fragment>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Box>
                )}
            </Paper>

            {/* ── Override Confirmation Dialog ─────────────────────────────────────── */}
            <ConfirmationDialog
                open={overrideConfirmOpen}
                onClose={() => { setOverrideConfirmOpen(false); setOverridePending(null); }}
                onConfirm={handleOverrideConfirm}
                title="⚠️ Override Active Timetable?"
                description={
                    overridePending
                        ? `This will replace "${overridePending.existing.name}"${overridePending.existing.approvedAt ? ` (published ${formatDate(overridePending.existing.approvedAt)})` : ''}.\n\nThe current live timetable will be marked as "Replaced". This action cannot be undone.`
                        : ''
                }
                confirmLabel="Yes, Override & Publish"
                cancelLabel="Cancel"
                variant="warning"
                isLoading={toggleSchedule.isPending}
            />

            {/* ── View & Preview Timetable Dialog ────────────────────────────────────── */}
            <Dialog open={!!selectedSchedule} onClose={() => setSelectedSchedule(null)} maxWidth="lg" fullWidth>
                <DialogTitle sx={{ borderBottom: '1px solid #e2e8f0', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <ScheduleIcon color="primary" />
                        <Typography variant="h6" fontWeight={700}>
                            Preview Timetable — {selectedSchedule?.name}
                        </Typography>
                    </Box>
                    {selectedSchedule && <StatusChip status={selectedSchedule.status} />}
                </DialogTitle>
                <DialogContent>
                    {selectedSchedule && (
                        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            {/* Metadata Header Chips */}
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Source</Typography>
                                    <Box sx={{ mt: 0.3 }}><SourceBadge source={selectedSchedule.source} version={selectedSchedule.version} aiDraftVersion={selectedSchedule.aiDraftVersion} /></Box>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Valid From</Typography>
                                    <Typography variant="body2" fontWeight={600}>{formatDate(selectedSchedule.validFrom)}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Valid Until</Typography>
                                    <Typography variant="body2" fontWeight={600}>{selectedSchedule.validTo ? formatDate(selectedSchedule.validTo) : 'Ongoing'}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Total Schedule Slots</Typography>
                                    <Typography variant="body2" fontWeight={600}>{selectedSchedule.entries?.length || 0} periods</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Submitted</Typography>
                                    <Typography variant="body2" fontWeight={600}>{formatDateTime(selectedSchedule.createdAt, timeFormat)}</Typography>
                                </Box>
                            </Box>

                            {/* Class & Section Selection Filter */}
                            {availableClassSections.length > 0 ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                    <FormControl size="small" sx={{ minWidth: 240 }}>
                                        <InputLabel>Select Class & Section to View</InputLabel>
                                        <Select
                                            value={selectedClassSectionKey}
                                            label="Select Class & Section to View"
                                            onChange={(e) => setSelectedClassSectionKey(e.target.value)}
                                        >
                                            {availableClassSections.map((item) => (
                                                <MenuItem key={`${item.classId}_${item.sectionId}`} value={`${item.classId}_${item.sectionId}`}>
                                                    🏫 {item.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <Chip
                                        label={`${availableClassSections.length} Classes covered in this timetable`}
                                        variant="outlined"
                                        color="primary"
                                        size="small"
                                    />
                                </Box>
                            ) : (
                                <Alert severity="info">
                                    No class entries snapshot attached to this schedule submission.
                                </Alert>
                            )}

                            {/* Weekly Timetable Grid Preview Table */}
                            {selectedClassSectionKey && (
                                <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                                                <TableCell sx={{ fontWeight: 700, width: 120 }}>Period</TableCell>
                                                {workingDays.map((day) => (
                                                    <TableCell key={day} sx={{ fontWeight: 700, textTransform: 'capitalize', textAlign: 'center' }}>
                                                        {day}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {periods.map((pNum) => {
                                                const pConfig = config?.periods?.find((p: any) => p.periodNumber === pNum);
                                                const periodLabel = pConfig
                                                    ? `${pConfig.name} (${formatSingleTime(pConfig.startTime, timeFormat)} - ${formatSingleTime(pConfig.endTime, timeFormat)})`
                                                    : `Period ${pNum}`;

                                                const [curClassId, curSectionId] = selectedClassSectionKey.split('_');

                                                return (
                                                    <TableRow key={pNum} hover>
                                                        <TableCell sx={{ fontWeight: 600, bgcolor: '#fafafa', fontSize: 12 }}>
                                                            {periodLabel}
                                                        </TableCell>
                                                        {workingDays.map((day) => {
                                                            const entry = selectedSchedule.entries?.find(
                                                                (e) =>
                                                                    e.classId === curClassId &&
                                                                    e.sectionId === curSectionId &&
                                                                    e.dayOfWeek?.toLowerCase() === day.toLowerCase() &&
                                                                    Number(e.periodNumber) === pNum
                                                            );

                                                            return (
                                                                <TableCell key={day} align="center" sx={{ p: 1, minWidth: 120 }}>
                                                                    {entry ? (
                                                                        <Box sx={{ p: 1, bgcolor: '#f0f9ff', borderRadius: 1, border: '1px solid #bae6fd' }}>
                                                                            <Typography variant="body2" fontWeight={700} color="#0369a1" sx={{ fontSize: 12 }}>
                                                                                {getSubjectName(entry.subjectId)}
                                                                            </Typography>
                                                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.3, fontSize: 11 }}>
                                                                                👨‍🏫 {getTeacherName(entry.teacherId, entry)}
                                                                            </Typography>
                                                                        </Box>
                                                                    ) : (
                                                                        <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                                                                            —
                                                                        </Typography>
                                                                    )}
                                                                </TableCell>
                                                            );
                                                        })}
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}

                            {selectedSchedule.rejectionComment && (
                                <Alert severity="warning" variant="outlined">
                                    <strong>Rejection Reason:</strong> {selectedSchedule.rejectionComment}
                                </Alert>
                            )}

                            {selectedSchedule.status === 'pending_approval' && (
                                <Alert severity="info" variant="outlined">
                                    Review the class timetables above. Click <strong>Approve & Publish</strong> to make this schedule live school-wide.
                                </Alert>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    {selectedSchedule?.status === 'pending_approval' && (
                        <>
                            <Button
                                color="success"
                                variant="contained"
                                startIcon={<ApproveIcon />}
                                onClick={() => { if (selectedSchedule) handleApprove(selectedSchedule); setSelectedSchedule(null); }}
                                disabled={toggleSchedule.isPending}
                            >
                                Approve & Publish
                            </Button>
                            <Button
                                color="error"
                                variant="outlined"
                                startIcon={<RejectIcon />}
                                onClick={() => { if (selectedSchedule) setRejectDialog(selectedSchedule); setSelectedSchedule(null); }}
                            >
                                Reject
                            </Button>
                        </>
                    )}
                    <Button onClick={() => setSelectedSchedule(null)}>Close Preview</Button>
                </DialogActions>
            </Dialog>

            {/* ── Reject Dialog ────────────────────────────────────────────────────── */}
            <Dialog
                open={!!rejectDialog}
                onClose={() => { setRejectDialog(null); setRejectionComment(''); }}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ color: 'error.main', borderBottom: '1px solid #e2e8f0', fontWeight: 700 }}>
                    ❌ Reject Timetable
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Alert severity="warning" variant="outlined">
                            Rejecting <strong>"{rejectDialog?.name}"</strong> will send it back to the Admin for revision. A comment is required.
                        </Alert>
                        <TextField
                            label="Rejection Comment *"
                            value={rejectionComment}
                            onChange={(e) => setRejectionComment(e.target.value)}
                            multiline
                            rows={4}
                            fullWidth
                            placeholder="Explain what needs to be changed so the admin can revise the timetable..."
                            helperText={`${rejectionComment.trim().length} characters entered — This will be visible to the School Admin.`}
                            error={rejectionComment.trim().length === 0 && rejectionComment.length > 0}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setRejectDialog(null); setRejectionComment(''); }}>Cancel</Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleReject}
                        disabled={toggleSchedule.isPending || !rejectionComment.trim()}
                    >
                        {toggleSchedule.isPending ? 'Processing...' : 'Confirm Reject'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TimetableReview;
