import { useEffect, useState, useMemo } from 'react';
import {
    Box,
    Typography,
    Paper,
    CircularProgress,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tabs,
    Tab,
    Chip,
    IconButton,
} from '@mui/material';
import {
    Add as AddIcon,
    Cancel as CancelIcon,
    History as HistoryIcon,
    Today as TodayIcon,
    SwapHoriz as SwapIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import {
    useGetSubstitutesForDate,
    useGetSubstituteHistory,
    useCreateSubstitute,
    useCancelSubstitute,
    useGetActiveConfig,
} from '../../../queries/Timetable';
import { useGetTeachers } from '../../../queries/Teacher';
import { useGetClasses } from '../../../queries/Class';
import { sortClassesNumerically } from '../../../utils/classSort';
import TokenService from '../../../queries/token/tokenService';
import { AppInput } from '../../../components/shared/AppInput';
import { AppSelect } from '../../../components/shared/AppSelect';
import { AppButton } from '../../../components/shared/AppButton';
import { AppDatePicker } from '../../../components/shared/AppDatePicker';
import { format } from 'date-fns';
import { useUrlTab } from '../../../hooks/useUrlTab';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { useNotificationStore } from '../../../stores/notificationStore';
import { AppNoticeDialog, type AppNoticeDialogProps } from '../../../components/shared/AppNoticeDialog';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} {...other}>
            {value === index && <Box sx={{ pt: 1.5 }}>{children}</Box>}
        </div>
    );
}

const SubstituteManagement = () => {
    const isMobile = useIsMobile();
    const { showNotification } = useNotificationStore();
    const schoolId = TokenService.getSchoolId() || '';
    const [tabValue, setTabValue] = useUrlTab(0, ['assignments', 'history']);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    const [noticeState, setNoticeState] = useState<AppNoticeDialogProps>({
        open: false,
        onClose: () => setNoticeState(prev => ({ ...prev, open: false })),
        title: '',
        message: '',
        type: 'error',
    });

    // Track visited tabs to fetch data lazily on tab visit
    const [visitedTabs, setVisitedTabs] = useState<Set<number>>(() => new Set([tabValue]));

    useEffect(() => {
        setVisitedTabs(prev => {
            if (prev.has(tabValue)) return prev;
            const updated = new Set(prev);
            updated.add(tabValue);
            return updated;
        });
    }, [tabValue]);

    // Form state for creating substitute
    const [formData, setFormData] = useState({
        originalTeacherId: '',
        substituteTeacherId: '',
        classId: '',
        sectionId: '',
        dayOfWeek: '',
        periodNumber: 0,
        reason: '',
    });

    // Data fetching
    const { data: configData } = useGetActiveConfig(schoolId);
    const { data: substitutesData, isLoading: substitutesLoading } = useGetSubstitutesForDate(schoolId, selectedDate, { enabled: visitedTabs.has(0) });
    const { data: historyData, isLoading: historyLoading } = useGetSubstituteHistory(schoolId, { limit: 50 }, { enabled: visitedTabs.has(1) });
    const { data: teachersData } = useGetTeachers(schoolId);
    const { data: classesData } = useGetClasses(schoolId);

    const createSubstitute = useCreateSubstitute(schoolId);
    const cancelSubstitute = useCancelSubstitute(schoolId);

    const config = configData?.data;
    const substitutes = substitutesData?.data || [];
    const history = historyData?.data || [];
    const teachers = teachersData?.data || [];
    const classes = useMemo(() => sortClassesNumerically(classesData?.data || []), [classesData]);

    // Get sections for selected class
    const selectedClassObj = classes.find((c: any) => c.classId === formData.classId);
    const sections = selectedClassObj?.sections || [];

    // Regular periods
    const regularPeriods = config?.periods?.filter((p: any) => p.type === 'regular') || [];

    const handleCreateSubstitute = async () => {
        try {
            // Send all form data - backend will find entry based on class/section/day/period
            await createSubstitute.mutateAsync({
                originalEntryId: '', // Backend will find entry based on other fields
                substituteTeacherId: formData.substituteTeacherId,
                date: selectedDate,
                reason: formData.reason,
                // Alternative fields to find the timetable entry
                classId: formData.classId,
                sectionId: formData.sectionId,
                dayOfWeek: formData.dayOfWeek,
                periodNumber: formData.periodNumber,
            } as any);
            showNotification('Substitute assigned successfully', 'success');
            setCreateDialogOpen(false);
            setFormData({
                originalTeacherId: '',
                substituteTeacherId: '',
                classId: '',
                sectionId: '',
                dayOfWeek: '',
                periodNumber: 0,
                reason: '',
            });
        } catch (err: any) {
            console.error('Failed to create substitute:', err);
            const errorMessage = err?.message || err?.error || 'Failed to assign substitute teacher';
            showNotification(errorMessage, 'error');
            setNoticeState({
                open: true,
                type: 'error',
                title: 'Cannot Assign Substitute',
                message: errorMessage,
                badgeText: 'Teacher Unavailable',
                primaryActionLabel: 'Understood',
                onClose: () => setNoticeState(prev => ({ ...prev, open: false })),
            });
        }
    };

    const handleCancelSubstitute = async (substituteId: string) => {
        try {
            await cancelSubstitute.mutateAsync(substituteId);
            showNotification('Substitute assignment cancelled', 'success');
        } catch (err: any) {
            console.error('Failed to cancel substitute:', err);
            const errorMessage = err?.message || err?.error || 'Failed to cancel substitute assignment';
            showNotification(errorMessage, 'error');
            setNoticeState({
                open: true,
                type: 'error',
                title: 'Cancellation Failed',
                message: errorMessage,
                primaryActionLabel: 'Understood',
                onClose: () => setNoticeState(prev => ({ ...prev, open: false })),
            });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'warning';
            case 'confirmed': return 'success';
            case 'completed': return 'info';
            case 'cancelled': return 'error';
            default: return 'default';
        }
    };

    const todayCount = substitutes.filter((s: any) => s.date === new Date().toISOString().split('T')[0]).length;

    return (
        <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
            {/* Header */}
            {!isMobile && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                    <Typography variant="h5" fontWeight={700} color="#0f172a">Substitute Management</Typography>
                    <AppButton
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setCreateDialogOpen(true)}
                        size="small"
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                        Assign Substitute
                    </AppButton>
                </Box>
            )}

            {/* Clean Summary Row & Mobile Action */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#f8fafc', px: 1.5, py: 1, borderRadius: 1.5, border: '1px solid #e2e8f0', flex: { xs: 1, sm: 'none' } }}>
                    <TodayIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                    <Box>
                        <Typography variant="body2" fontWeight={600} color="text.primary">
                            Today's Substitutes: <strong style={{ color: '#2563eb' }}>{todayCount}</strong>
                        </Typography>
                    </Box>
                </Box>

                {isMobile && (
                    <AppButton
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setCreateDialogOpen(true)}
                        size="small"
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                        Assign Substitute
                    </AppButton>
                )}
            </Box>

            {/* Clean Flat Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
                <Tabs
                    value={tabValue}
                    onChange={(_, v) => setTabValue(v)}
                    textColor="primary"
                    indicatorColor="primary"
                    sx={{ minHeight: 40 }}
                >
                    <Tab icon={<TodayIcon sx={{ fontSize: 18 }} />} label="By Date" iconPosition="start" sx={{ textTransform: 'none', fontWeight: 600, minHeight: 40, py: 1 }} />
                    <Tab icon={<HistoryIcon sx={{ fontSize: 18 }} />} label="History" iconPosition="start" sx={{ textTransform: 'none', fontWeight: 600, minHeight: 40, py: 1 }} />
                </Tabs>
            </Box>

            {/* Tab 0: By Date */}
            <TabPanel value={tabValue} index={0}>
                {/* Date Selector */}
                <Box sx={{ mb: 2, maxWidth: 300 }}>
                    <AppDatePicker
                        label="Select Date"
                        value={selectedDate ? new Date(selectedDate) : null}
                        onChange={(date) => setSelectedDate(date ? format(date, 'yyyy-MM-dd') : '')}
                    />
                </Box>

                {/* Substitutes List / Table */}
                {substitutesLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress size={32} />
                    </Box>
                ) : substitutes.length === 0 ? (
                    <Alert severity="info" variant="outlined" sx={{ borderRadius: 1.5 }}>
                        No substitute assignments for this date.
                    </Alert>
                ) : isMobile ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {substitutes.map((sub: any) => (
                            <Paper
                                key={sub.substituteId}
                                variant="outlined"
                                sx={{ p: 1.5, borderRadius: 2, borderColor: '#e2e8f0' }}
                            >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Chip
                                        label={`${sub.entry?.dayOfWeek?.charAt(0).toUpperCase()}${sub.entry?.dayOfWeek?.slice(1) || ''} • Period ${sub.entry?.periodNumber || '?'}`}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                        sx={{ fontWeight: 600, height: 22, fontSize: '0.75rem' }}
                                    />
                                    <Chip
                                        label={sub.status?.charAt(0).toUpperCase() + sub.status?.slice(1)}
                                        size="small"
                                        color={getStatusColor(sub.status)}
                                        sx={{ fontWeight: 600, height: 22, fontSize: '0.75rem' }}
                                    />
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 0.75 }}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" color="text.secondary">Original</Typography>
                                        <Typography variant="body2" fontWeight={600} color="text.primary">
                                            {sub.originalTeacher?.name || sub.originalTeacherId}
                                        </Typography>
                                    </Box>
                                    <SwapIcon sx={{ color: 'action.active', fontSize: 20 }} />
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" color="text.secondary">Substitute</Typography>
                                        <Typography variant="body2" fontWeight={600} color="primary.main">
                                            {sub.substituteTeacher?.name || sub.substituteTeacherId}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 0.5, borderTop: '1px solid #f1f5f9' }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Class: <strong>{sub.entry?.classId || '-'} {sub.entry?.sectionId || ''}</strong>
                                        {sub.reason && ` • ${sub.reason}`}
                                    </Typography>

                                    {sub.status === 'pending' && (
                                        <AppButton
                                            size="small"
                                            variant="text"
                                            color="error"
                                            startIcon={<CancelIcon sx={{ fontSize: 16 }} />}
                                            onClick={() => handleCancelSubstitute(sub.substituteId)}
                                            loading={cancelSubstitute.isPending}
                                            sx={{ p: 0, minWidth: 'auto', textTransform: 'none', fontSize: '0.8rem' }}
                                        >
                                            Cancel
                                        </AppButton>
                                    )}
                                </Box>
                            </Paper>
                        ))}
                    </Box>
                ) : (
                    <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 1.5 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'grey.100' }}>
                                    <TableCell><strong>Original Teacher</strong></TableCell>
                                    <TableCell><strong>Substitute</strong></TableCell>
                                    <TableCell><strong>Class</strong></TableCell>
                                    <TableCell><strong>Period</strong></TableCell>
                                    <TableCell><strong>Reason</strong></TableCell>
                                    <TableCell><strong>Status</strong></TableCell>
                                    <TableCell><strong>Actions</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {substitutes.map((sub: any) => (
                                    <TableRow key={sub.substituteId} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                        <TableCell>{sub.originalTeacher?.name || sub.originalTeacherId}</TableCell>
                                        <TableCell>{sub.substituteTeacher?.name || sub.substituteTeacherId}</TableCell>
                                        <TableCell>
                                            {sub.entry?.classId || '-'} {sub.entry?.sectionId || ''}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={`${sub.entry?.dayOfWeek?.charAt(0).toUpperCase()}${sub.entry?.dayOfWeek?.slice(1) || ''} - Period ${sub.entry?.periodNumber || '?'}`}
                                                size="small"
                                                color="primary"
                                            />
                                        </TableCell>
                                        <TableCell>{sub.reason || '-'}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={sub.status?.charAt(0).toUpperCase() + sub.status?.slice(1)}
                                                size="small"
                                                color={getStatusColor(sub.status)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {sub.status === 'pending' && (
                                                <AppButton
                                                    size="small"
                                                    variant="text"
                                                    color="error"
                                                    startIcon={<CancelIcon />}
                                                    onClick={() => handleCancelSubstitute(sub.substituteId)}
                                                    loading={cancelSubstitute.isPending}
                                                >
                                                    Cancel
                                                </AppButton>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </TabPanel>

            {/* Tab 1: History */}
            <TabPanel value={tabValue} index={1}>
                {historyLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress size={32} />
                    </Box>
                ) : history.length === 0 ? (
                    <Alert severity="info" variant="outlined" sx={{ borderRadius: 1.5 }}>
                        No substitute history found.
                    </Alert>
                ) : isMobile ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {history.map((sub: any) => (
                            <Paper
                                key={sub.substituteId}
                                variant="outlined"
                                sx={{ p: 1.5, borderRadius: 2, borderColor: '#e2e8f0' }}
                            >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                        {new Date(sub.date).toLocaleDateString()} • Period {sub.periodNumber}
                                    </Typography>
                                    <Chip
                                        label={sub.status?.charAt(0).toUpperCase() + sub.status?.slice(1)}
                                        size="small"
                                        color={getStatusColor(sub.status)}
                                        sx={{ fontWeight: 600, height: 22, fontSize: '0.75rem' }}
                                    />
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 0.75 }}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" color="text.secondary">Original</Typography>
                                        <Typography variant="body2" fontWeight={600} color="text.primary">
                                            {sub.originalTeacher?.name || sub.originalTeacherId}
                                        </Typography>
                                    </Box>
                                    <SwapIcon sx={{ color: 'action.active', fontSize: 20 }} />
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" color="text.secondary">Substitute</Typography>
                                        <Typography variant="body2" fontWeight={600} color="primary.main">
                                            {sub.substituteTeacher?.name || sub.substituteTeacherId}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', pt: 0.5, borderTop: '1px solid #f1f5f9' }}>
                                    Class: <strong>{sub.class?.name || sub.classId} {sub.section?.name || ''}</strong>
                                </Typography>
                            </Paper>
                        ))}
                    </Box>
                ) : (
                    <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 1.5 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'grey.100' }}>
                                    <TableCell><strong>Date</strong></TableCell>
                                    <TableCell><strong>Original Teacher</strong></TableCell>
                                    <TableCell><strong>Substitute</strong></TableCell>
                                    <TableCell><strong>Class</strong></TableCell>
                                    <TableCell><strong>Period</strong></TableCell>
                                    <TableCell><strong>Status</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {history.map((sub: any) => (
                                    <TableRow key={sub.substituteId} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                        <TableCell>{new Date(sub.date).toLocaleDateString()}</TableCell>
                                        <TableCell>{sub.originalTeacher?.name || sub.originalTeacherId}</TableCell>
                                        <TableCell>{sub.substituteTeacher?.name || sub.substituteTeacherId}</TableCell>
                                        <TableCell>{sub.class?.name || sub.classId} {sub.section?.name || ''}</TableCell>
                                        <TableCell>
                                            <Chip label={`Period ${sub.periodNumber}`} size="small" color="primary" />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={sub.status?.charAt(0).toUpperCase() + sub.status?.slice(1)}
                                                size="small"
                                                color={getStatusColor(sub.status)}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </TabPanel>

            {/* Create Substitute Dialog */}
            <Dialog
                open={createDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                fullScreen={isMobile}
                PaperProps={{
                    sx: {
                        borderRadius: isMobile ? 0 : 3,
                        maxHeight: isMobile ? '100dvh' : '90vh',
                    }
                }}
            >
                <DialogTitle
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        py: { xs: 1.5, sm: 2 },
                        px: { xs: 2, sm: 3 },
                    }}
                >
                    <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                        Assign Substitute Teacher
                    </Typography>
                    <IconButton onClick={() => setCreateDialogOpen(false)} size="small" edge="end">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: { xs: 2, sm: 3 }, overflowY: 'auto' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <AppSelect
                            label="Original Teacher (Absent)"
                            value={formData.originalTeacherId}
                            options={teachers.map((t: any) => ({ value: t.teacherId, label: `${t.firstName} ${t.lastName}` }))}
                            onChange={(e) => setFormData({ ...formData, originalTeacherId: e.target.value as string })}
                        />

                        <AppSelect
                            label="Substitute Teacher"
                            value={formData.substituteTeacherId}
                            options={teachers
                                .filter((t: any) => t.teacherId !== formData.originalTeacherId)
                                .map((t: any) => ({ value: t.teacherId, label: `${t.firstName} ${t.lastName}` }))}
                            onChange={(e) => setFormData({ ...formData, substituteTeacherId: e.target.value as string })}
                        />

                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                            <AppSelect
                                label="Class"
                                value={formData.classId}
                                options={classes.map((c: any) => ({ value: c.classId, label: c.name }))}
                                onChange={(e) => setFormData({ ...formData, classId: e.target.value as string, sectionId: '' })}
                            />

                            <AppSelect
                                label="Section"
                                value={formData.sectionId}
                                disabled={!formData.classId}
                                options={sections.map((s: any) => ({ value: s.sectionId, label: s.name }))}
                                onChange={(e) => setFormData({ ...formData, sectionId: e.target.value as string })}
                            />
                        </Box>

                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                            <AppSelect
                                label="Day"
                                value={formData.dayOfWeek}
                                options={config?.workingDays?.map((day: string) => ({
                                    value: day,
                                    label: day.charAt(0).toUpperCase() + day.slice(1)
                                })) || []}
                                onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value as string })}
                            />

                            <AppSelect
                                label="Period"
                                value={formData.periodNumber}
                                options={regularPeriods.map((p: any) => ({
                                    value: p.periodNumber,
                                    label: `${p.name} (${p.startTime} - ${p.endTime})`
                                }))}
                                onChange={(e) => setFormData({ ...formData, periodNumber: Number(e.target.value) })}
                            />
                        </Box>

                        <AppInput
                            label="Reason for Substitution"
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            multiline
                            rows={2}
                            fullWidth
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: { xs: 2, sm: 2.5 }, borderTop: '1px solid', borderColor: 'divider', justifyContent: 'flex-end', gap: 1 }}>
                    <AppButton onClick={() => setCreateDialogOpen(false)} color="inherit">Cancel</AppButton>
                    <AppButton
                        onClick={handleCreateSubstitute}
                        variant="contained"
                        loading={createSubstitute.isPending}
                        disabled={
                            !formData.originalTeacherId ||
                            !formData.substituteTeacherId ||
                            !formData.classId ||
                            !formData.sectionId ||
                            !formData.dayOfWeek ||
                            !formData.periodNumber
                        }
                    >
                        Assign
                    </AppButton>
                </DialogActions>
            </Dialog>

            {/* Error / Warning Notice Dialog */}
            <AppNoticeDialog {...noticeState} />
        </Box>
    );
};

export default SubstituteManagement;
