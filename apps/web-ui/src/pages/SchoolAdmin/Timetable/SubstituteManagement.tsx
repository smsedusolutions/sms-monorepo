import { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    CircularProgress,
    Alert,
    Card,
    CardContent,
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
} from '@mui/material';
import {
    Add as AddIcon,
    Cancel as CancelIcon,
    History as HistoryIcon,
    Today as TodayIcon,
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
import TokenService from '../../../queries/token/tokenService';
import { AppInput } from '../../../components/shared/AppInput';
import { AppSelect } from '../../../components/shared/AppSelect';
import { AppButton } from '../../../components/shared/AppButton';
import { AppDatePicker } from '../../../components/shared/AppDatePicker';
import { format } from 'date-fns';
import { useUrlTab } from '../../../hooks/useUrlTab';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} {...other}>
            {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
        </div>
    );
}

const SubstituteManagement = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const [tabValue, setTabValue] = useUrlTab(0, ['assignments', 'history']);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);

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
    const classes = classesData?.data || [];

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
        } catch (err) {
            console.error('Failed to create substitute:', err);
        }
    };

    const handleCancelSubstitute = async (substituteId: string) => {
        try {
            await cancelSubstitute.mutateAsync(substituteId);
        } catch (err) {
            console.error('Failed to cancel substitute:', err);
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

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h5" fontWeight={600}>Substitute Management</Typography>
                <AppButton
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setCreateDialogOpen(true)}
                    size="small"
                >
                    Assign Substitute
                </AppButton>
            </Box>

            {/* Summary Card */}
            <Card sx={{ mb: 3, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <TodayIcon sx={{ color: 'inherit' }} />
                        <Typography variant="h6" color="inherit">Today's Substitutes</Typography>
                    </Box>
                    <Typography variant="h3" fontWeight={600} color="inherit">
                        {substitutes.filter((s: any) => s.date === new Date().toISOString().split('T')[0]).length}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, color: 'inherit' }}>Active substitute assignments for today</Typography>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Paper sx={{ mb: 2 }}>
                <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
                    <Tab icon={<TodayIcon />} label="By Date" iconPosition="start" />
                    <Tab icon={<HistoryIcon />} label="History" iconPosition="start" />
                </Tabs>
            </Paper>

            {/* Tab Panels */}
            <TabPanel value={tabValue} index={0}>
                {/* Date Selector */}
                <Paper sx={{ p: 2, mb: 2 }}>
                    <AppDatePicker
                        label="Select Date"
                        value={selectedDate ? new Date(selectedDate) : null}
                        onChange={(date) => setSelectedDate(date ? format(date, 'yyyy-MM-dd') : '')}
                    />
                </Paper>

                {/* Substitutes Table */}
                <Paper sx={{ p: 2 }}>
                    {substitutesLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : substitutes.length === 0 ? (
                        <Alert severity="info">No substitute assignments for this date.</Alert>
                    ) : (
                        <TableContainer>
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
                </Paper>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
                {/* History Table */}
                <Paper sx={{ p: 2 }}>
                    {historyLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : history.length === 0 ? (
                        <Alert severity="info">No substitute history found.</Alert>
                    ) : (
                        <TableContainer>
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
                </Paper>
            </TabPanel>

            {/* Create Substitute Dialog */}
            <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Assign Substitute Teacher</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
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
                <DialogActions sx={{ px: 3, pb: 2 }}>
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
        </Box>
    );
};

export default SubstituteManagement;
