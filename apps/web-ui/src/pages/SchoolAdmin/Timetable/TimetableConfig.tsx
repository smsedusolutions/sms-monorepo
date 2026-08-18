import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Grid,
    Checkbox,
    FormControlLabel,
    FormGroup,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Tooltip,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TableContainer,
    Chip,
    CircularProgress,
    Alert,
    Divider,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { AppDatePicker } from '../../../components/shared/AppDatePicker';
import { AppInput } from '../../../components/shared/AppInput';
import { AppSelect } from '../../../components/shared/AppSelect';
import { AppButton } from '../../../components/shared/AppButton';
import { AppTimePicker } from '../../../components/shared/AppTimePicker';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { parse, format, addMinutes, differenceInMinutes } from 'date-fns';
import {
    useGetActiveConfig,
    useCreateConfig,
    useUpdateConfig,
    useUpsertPeriod,
    useRemovePeriod,
    // useRemoveShift,
    useToggleTimetableDisable,
} from '../../../queries/Timetable';
import type { Period, Shift } from '../../../types/timetable.types';
import TokenService from '../../../queries/token/tokenService';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { useAcademicYear } from '../../../hooks/useAcademicYear';
import MobileCardList from '../../../components/mobile/data/MobileCardList';
import MobileCardItem from '../../../components/mobile/data/MobileCardItem';

const DAYS_OF_WEEK = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' },
];

const PERIOD_TYPES = [
    { value: 'regular', label: 'Regular Period' },
    { value: 'break', label: 'Break' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'assembly', label: 'Assembly' },
    { value: 'pt', label: 'PT/Sports' },
    { value: 'lab', label: 'Lab (Double Period)' },
    { value: 'free', label: 'Free/Study' },
];



interface PeriodDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (period: Period) => void;
    editData?: Period | null;
    shifts: Shift[];
    nextPeriodNumber?: number;
}

const PeriodDialog = ({ open, onClose, onSave, editData, shifts, nextPeriodNumber = 1 }: PeriodDialogProps) => {
    const isMobile = useIsMobile();
    const [formData, setFormData] = useState<Partial<Period>>({
        periodNumber: 1,
        name: '',
        startTime: '08:00',
        endTime: '08:45',
        duration: 45,
        type: 'regular',
        shiftId: '',
        isDoublePeriod: false,
    });

    const [startTimeDate, setStartTimeDate] = useState<Date | null>(null);
    const [endTimeDate, setEndTimeDate] = useState<Date | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Helper to convert time string to Date
    const parseTimeString = (timeStr: string): Date => {
        return parse(timeStr, 'HH:mm', new Date());
    };

    // Helper to convert Date to time string
    const formatTimeToString = (date: Date | null): string => {
        if (!date) return '';
        return format(date, 'HH:mm');
    };

    // Sync formData with editData or reset for new period
    useEffect(() => {
        if (open) {
            if (editData) {
                setFormData({
                    periodNumber: editData.periodNumber,
                    name: editData.name || '',
                    startTime: editData.startTime || '08:00',
                    endTime: editData.endTime || '08:45',
                    duration: editData.duration || 45,
                    type: editData.type || 'regular',
                    shiftId: editData.shiftId || '',
                    isDoublePeriod: editData.isDoublePeriod || false,
                });
                setStartTimeDate(parseTimeString(editData.startTime || '08:00'));
                setEndTimeDate(parseTimeString(editData.endTime || '08:45'));
            } else {
                // New period - auto-increment period number
                setFormData({
                    periodNumber: nextPeriodNumber,
                    name: '',
                    startTime: '08:00',
                    endTime: '08:45',
                    duration: 45,
                    type: 'regular',
                    shiftId: '',
                    isDoublePeriod: false,
                });
                setStartTimeDate(parseTimeString('08:00'));
                setEndTimeDate(parseTimeString('08:45'));
            }
            setErrors({});
        }
    }, [open, editData, nextPeriodNumber]);

    const handleChange = (field: keyof Period, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        // Clear error when field is edited
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    const handleStartTimeChange = (date: Date | null) => {
        setStartTimeDate(date);
        if (date) {
            const timeStr = formatTimeToString(date);
            setFormData((prev) => {
                const updated = { ...prev, startTime: timeStr };
                // If we have a duration, auto-calculate end time
                if (prev.duration && prev.duration > 0) {
                    const newEndTime = addMinutes(date, prev.duration);
                    setEndTimeDate(newEndTime);
                    updated.endTime = formatTimeToString(newEndTime);
                }
                return updated;
            });
        }
        // Clear error when field is edited
        if (errors.startTime) {
            setErrors((prev) => ({ ...prev, startTime: '' }));
        }
    };

    const handleEndTimeChange = (date: Date | null) => {
        setEndTimeDate(date);
        if (date) {
            const timeStr = formatTimeToString(date);
            setFormData((prev) => {
                const updated = { ...prev, endTime: timeStr };
                // If we have start time, calculate duration
                if (startTimeDate) {
                    const durationMinutes = differenceInMinutes(date, startTimeDate);
                    if (durationMinutes > 0) {
                        updated.duration = durationMinutes;
                    }
                }
                return updated;
            });
        }
        // Clear error when field is edited
        if (errors.endTime) {
            setErrors((prev) => ({ ...prev, endTime: '' }));
        }
    };

    const handleDurationChange = (minutes: number) => {
        setFormData((prev) => {
            const updated = { ...prev, duration: minutes };
            // If we have start time, auto-calculate end time
            if (startTimeDate && minutes > 0) {
                const newEndTime = addMinutes(startTimeDate, minutes);
                setEndTimeDate(newEndTime);
                updated.endTime = formatTimeToString(newEndTime);
            }
            return updated;
        });
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.periodNumber || formData.periodNumber < 1) {
            newErrors.periodNumber = 'Period number is required';
        }
        if (!formData.name?.trim()) {
            newErrors.name = 'Period name is required';
        }
        if (!formData.startTime) {
            newErrors.startTime = 'Start time is required';
        }
        if (!formData.endTime) {
            newErrors.endTime = 'End time is required';
        }
        if (!formData.type) {
            newErrors.type = 'Period type is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        onSave(formData as Period);
        onClose();
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="md" 
            fullWidth
            fullScreen={isMobile}
            PaperProps={{
                sx: {
                    borderRadius: isMobile ? 0 : 3,
                }
            }}
        >
            <DialogTitle sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                borderBottom: '1px solid',
                borderColor: 'divider',
                py: { xs: 1.5, sm: 2 },
                px: { xs: 2, sm: 3 }
            }}>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                    {editData ? 'Edit Period Definition' : 'Define New Period'}
                </Typography>
                <IconButton onClick={onClose} size="small" edge="end">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
                    <Typography variant="overline" color="primary" sx={{ fontWeight: 800, letterSpacing: 1.2 }}>
                        Temporal Definition
                    </Typography>

                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 2fr' }, gap: 2 }}>
                        <AppInput
                            label="Period Rank"
                            type="number"
                            fullWidth
                            value={formData.periodNumber}
                            onChange={(e) => handleChange('periodNumber', parseInt(e.target.value))}
                            error={!!errors.periodNumber}
                            helperText={errors.periodNumber}
                        />
                        <AppInput
                            label="Period Label"
                            fullWidth
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="e.g., Morning Session"
                            error={!!errors.name}
                            helperText={errors.name}
                        />
                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 120px' }, gap: 2, alignItems: 'start' }}>
                        <AppTimePicker
                            label="Start Time"
                            value={startTimeDate}
                            onChange={handleStartTimeChange}
                        />
                        <AppTimePicker
                            label="End Time"
                            value={endTimeDate}
                            onChange={handleEndTimeChange}
                        />
                        <AppInput
                            label="Duration"
                            type="number"
                            value={formData.duration}
                            onChange={(e) => handleDurationChange(parseInt(e.target.value) || 0)}
                            InputProps={{
                                endAdornment: <Typography variant="caption" sx={{ ml: 0.5, color: 'text.secondary', fontWeight: 600 }}>min</Typography>
                            }}
                        />
                    </Box>

                    <Divider sx={{ my: 0.5 }} />

                    <Typography variant="overline" color="primary" sx={{ fontWeight: 800, letterSpacing: 1.2 }}>
                        Categorization & Scope
                    </Typography>

                    <AppSelect
                        label="Period Classification"
                        value={formData.type || ''}
                        options={PERIOD_TYPES}
                        onChange={(e) => handleChange('type', e.target.value)}
                        error={!!errors.type}
                        helperText={errors.type}
                    />

                    {shifts.length > 0 && (
                        <AppSelect
                            label="Assigned Shift"
                            value={formData.shiftId || ''}
                            options={[
                                { value: '', label: 'General / All Shifts' },
                                ...shifts.map(s => ({ value: s.shiftId, label: s.name }))
                            ]}
                            onChange={(e) => handleChange('shiftId', e.target.value)}
                        />
                    )}

                    {formData.type === 'lab' && (
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={formData.isDoublePeriod}
                                    onChange={(e) => handleChange('isDoublePeriod', e.target.checked)}
                                    sx={{ borderRadius: '4px' }}
                                />
                            }
                            label={<Typography variant="body2">This is a double-length block</Typography>}
                            sx={{ mt: -1 }}
                        />
                    )}
                </Box>
            </DialogContent>
            <DialogActions sx={{ 
                px: { xs: 2, sm: 3 }, 
                py: 2, 
                borderTop: '1px solid', 
                borderColor: 'divider',
                flexDirection: { xs: 'column-reverse', sm: 'row' },
                gap: 1,
                '& > button': {
                    width: { xs: '100%', sm: 'auto' },
                    height: 44,
                }
            }}>
                <AppButton onClick={onClose} variant="text" color="inherit">Cancel</AppButton>
                <AppButton onClick={handleSubmit} variant="contained">
                    {editData ? 'Update Period' : 'Append Period'}
                </AppButton>
            </DialogActions>
        </Dialog>
    );
};

const TimetableConfigPage = () => {
    const isMobile = useIsMobile();
    const schoolId = TokenService.getSchoolId() || '';
    const { academicYearOptions, currentAcademicYear } = useAcademicYear();
    const { data: configData, isLoading, error } = useGetActiveConfig(schoolId);
    const createConfig = useCreateConfig(schoolId);
    const [periodDialogOpen, setPeriodDialogOpen] = useState(false);
    const [editPeriod, setEditPeriod] = useState<Period | null>(null);
    const [newAcademicYear, setNewAcademicYear] = useState('');

    React.useEffect(() => {
        if (!newAcademicYear && currentAcademicYear) {
            setNewAcademicYear(currentAcademicYear);
        }
    }, [currentAcademicYear, newAcademicYear]);

    const [workingDays, setWorkingDays] = useState<string[]>(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);

    const config = configData?.data;
    const upsertPeriod = useUpsertPeriod(schoolId, config?.configId || '');
    const removePeriod = useRemovePeriod(schoolId, config?.configId || '');
    // const removeShift = useRemoveShift(schoolId, config?.configId || '');
    const updateConfig = useUpdateConfig(schoolId, config?.configId || '');
    const toggleDisable = useToggleTimetableDisable(schoolId);

    // Temporary disable state
    const [disableDialogOpen, setDisableDialogOpen] = useState(false);
    const [disableFrom, setDisableFrom] = useState('');
    const [disableTo, setDisableTo] = useState('');
    const [disableReason, setDisableReason] = useState('');

    const handleCreateConfig = async () => {
        if (!newAcademicYear) return;
        try {
            await createConfig.mutateAsync({
                academicYear: newAcademicYear,
                workingDays,
                periods: [],
                shifts: [],
            });
            setNewAcademicYear('');
        } catch (err) {
            console.error('Failed to create config:', err);
        }
    };

    const handleDayToggle = async (day: string) => {
        if (!config) return;
        const newDays = config.workingDays.includes(day)
            ? config.workingDays.filter((d) => d !== day)
            : [...config.workingDays, day];
        try {
            await updateConfig.mutateAsync({ workingDays: newDays });
        } catch (err) {
            console.error('Failed to update working days:', err);
        }
    };

    const handleAddPeriod = () => {
        setEditPeriod(null);
        setPeriodDialogOpen(true);
    };

    const handleEditPeriod = (period: Period) => {
        setEditPeriod(period);
        setPeriodDialogOpen(true);
    };

    const handleSavePeriod = async (period: Period) => {
        try {
            await upsertPeriod.mutateAsync(period);
        } catch (err) {
            console.error('Failed to save period:', err);
        }
    };

    const handleDeletePeriod = async (periodNumber: number) => {
        try {
            await removePeriod.mutateAsync(periodNumber);
        } catch (err) {
            console.error('Failed to delete period:', err);
        }
    };

    const getTypeChipColor = (type: string) => {
        switch (type) {
            case 'regular': return 'primary';
            case 'break': return 'warning';
            case 'lunch': return 'warning';
            case 'assembly': return 'info';
            case 'pt': return 'success';
            case 'lab': return 'secondary';
            case 'free': return 'default';
            default: return 'default';
        }
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    // Only show error for non-404 errors (404 means no config exists, which is valid)
    const isNotFoundError = error?.message?.includes('No active timetable configuration') ||
        error?.message?.includes('404') ||
        (error as any)?.response?.status === 404;
    if (error && !isNotFoundError) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Failed to load timetable configuration</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScheduleIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                    <Typography variant="h5" fontWeight={600}>Timetable Configuration</Typography>
                </Box>
            </Box>

            {/* No Config - Create New */}
            {!config && (
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        No active timetable configuration found. Create one to get started.
                    </Alert>
                    <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, md: 4 }}>
                            <AppSelect
                                label="Academic Year"
                                value={newAcademicYear || currentAcademicYear}
                                options={academicYearOptions}
                                onChange={(e) => setNewAcademicYear(e.target.value as string)}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormGroup row>
                                {DAYS_OF_WEEK.slice(0, 6).map((day) => (
                                    <FormControlLabel
                                        key={day.value}
                                        control={
                                            <Checkbox
                                                checked={workingDays.includes(day.value)}
                                                onChange={() => {
                                                    setWorkingDays(
                                                        workingDays.includes(day.value)
                                                            ? workingDays.filter((d) => d !== day.value)
                                                            : [...workingDays, day.value]
                                                    );
                                                }}
                                                sx={{ borderRadius: '4px' }}
                                            />
                                        }
                                        label={<Typography variant="body2">{day.label.slice(0, 3)}</Typography>}
                                    />
                                ))}
                            </FormGroup>
                        </Grid>
                        <Grid size={{ xs: 12, md: 2 }}>
                            <AppButton
                                variant="contained"
                                fullWidth
                                onClick={handleCreateConfig}
                                disabled={!newAcademicYear}
                                loading={createConfig.isPending}
                            >
                                Create
                            </AppButton>
                        </Grid>
                    </Grid>
                </Paper>
            )}

            {/* Existing Config */}
            {config && (
                <>
                    {/* Config Info */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Typography variant="subtitle2" color="text.secondary">Academic Year</Typography>
                                <Typography variant="h6">{config.academicYear}</Typography>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Typography variant="subtitle2" color="text.secondary">Config ID</Typography>
                                <Typography variant="body1">{config.configId}</Typography>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                                <Chip
                                    label={config.isActive ? 'Active' : 'Inactive'}
                                    color={config.isActive ? 'success' : 'default'}
                                    size="small"
                                />
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* Temporary Disable Section */}
                    <Paper sx={{
                        p: 3,
                        mb: 3,
                        bgcolor: config.temporarilyDisabled ? 'warning.50' : 'transparent',
                        border: config.temporarilyDisabled ? '2px solid' : 'none',
                        borderColor: 'warning.main'
                    }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box>
                                <Typography variant="h6">
                                    {config.temporarilyDisabled ? '⚠️ Timetable Temporarily Disabled' : 'Temporary Disable'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {config.temporarilyDisabled
                                        ? 'Exam scheduling will NOT check for class conflicts during this period.'
                                        : 'Disable timetable temporarily during exams or special events.'}
                                </Typography>
                            </Box>
                            {config.temporarilyDisabled ? (
                                <Button
                                    variant="contained"
                                    color="success"
                                    onClick={() => toggleDisable.mutate({ disabled: false })}
                                    disabled={toggleDisable.isPending}
                                >
                                    {toggleDisable.isPending ? <CircularProgress size={20} /> : 'Enable Timetable'}
                                </Button>
                            ) : (
                                <Button
                                    variant="outlined"
                                    color="warning"
                                    onClick={() => setDisableDialogOpen(true)}
                                >
                                    Disable Temporarily
                                </Button>
                            )}
                        </Box>
                        {config.temporarilyDisabled && (
                            <Alert severity="warning" sx={{ mt: 2 }}>
                                <Typography variant="body2">
                                    {config.disabledFrom && config.disabledTo
                                        ? `Disabled from ${new Date(config.disabledFrom).toLocaleDateString()} to ${new Date(config.disabledTo).toLocaleDateString()}`
                                        : 'Disabled indefinitely (no date range specified)'}
                                    {config.disabledReason && ` — Reason: ${config.disabledReason}`}
                                </Typography>
                            </Alert>
                        )}
                    </Paper>

                    {/* Working Days */}
                    <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 3 }} elevation={0} variant="outlined">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Typography variant="h6" fontWeight={700}>Working Days</Typography>
                            {updateConfig.isPending && <CircularProgress size={20} />}
                        </Box>
                        <FormGroup sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 1 }}>
                            {DAYS_OF_WEEK.map((day) => (
                                <FormControlLabel
                                    key={day.value}
                                    control={
                                        <Checkbox
                                            checked={config.workingDays.includes(day.value)}
                                            onChange={() => handleDayToggle(day.value)}
                                            disabled={updateConfig.isPending}
                                        />
                                    }
                                    label={day.label}
                                />
                            ))}
                        </FormGroup>
                    </Paper>

                    {/* Periods */}
                    <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 3 }} elevation={0} variant="outlined">
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                            <Typography variant="h6" fontWeight={700}>Period Structure</Typography>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={handleAddPeriod}
                                size={isMobile ? "small" : "medium"}
                            >
                                Add Period
                            </Button>
                        </Box>
                        {isMobile ? (
                            <MobileCardList
                                emptyTitle="No Periods Configured"
                                emptyMessage="Click 'Add Period' to set up your school schedule."
                                totalCount={config.periods.length}
                                itemCount={config.periods.length}
                            >
                                {config.periods.map((period) => (
                                    <MobileCardItem
                                        key={period.periodNumber}
                                        title={period.name}
                                        subtitle={`Period #${period.periodNumber} • ${period.duration} mins`}
                                        badge={{
                                            label: PERIOD_TYPES.find((t) => t.value === period.type)?.label || period.type,
                                            color: (getTypeChipColor(period.type) || 'default') as any,
                                        }}
                                        metaItems={[
                                            { label: 'Timing', value: `${period.startTime} - ${period.endTime}` }
                                        ]}
                                        rightAction={
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEditPeriod(period); }}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={(e) => { e.stopPropagation(); handleDeletePeriod(period.periodNumber); }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        }
                                    />
                                ))}
                            </MobileCardList>
                        ) : (
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>#</TableCell>
                                            <TableCell>Name</TableCell>
                                            <TableCell>Start Time</TableCell>
                                            <TableCell>End Time</TableCell>
                                            <TableCell>Duration</TableCell>
                                            <TableCell>Type</TableCell>
                                            <TableCell align="center">Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {config.periods.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} align="center">
                                                    <Typography color="text.secondary">
                                                        No periods configured. Click 'Add Period' to start.
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            config.periods.map((period) => (
                                                <TableRow key={period.periodNumber} hover>
                                                    <TableCell>{period.periodNumber}</TableCell>
                                                    <TableCell>{period.name}</TableCell>
                                                    <TableCell>{period.startTime}</TableCell>
                                                    <TableCell>{period.endTime}</TableCell>
                                                    <TableCell>{period.duration} min</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={PERIOD_TYPES.find((t) => t.value === period.type)?.label || period.type}
                                                            size="small"
                                                            color={getTypeChipColor(period.type) as any}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Tooltip title="Edit">
                                                            <IconButton size="small" onClick={() => handleEditPeriod(period)}>
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Delete">
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => handleDeletePeriod(period.periodNumber)}
                                                            >
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Paper>

                    {/* Shifts (Optional) */}
                    {/* <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>Shifts (Optional)</Typography>
                        {config.shifts.length === 0 ? (
                            <Typography color="text.secondary">
                                No shifts configured. Add shifts if your school has multiple timing shifts (e.g., Morning/Afternoon).
                            </Typography>
                        ) : (
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {config.shifts.map((shift) => (
                                    <Chip
                                        key={shift.shiftId}
                                        label={`${shift.name} (${shift.startTime} - ${shift.endTime})`}
                                        onDelete={() => removeShift.mutateAsync(shift.shiftId)}
                                        color="primary"
                                        variant="outlined"
                                    />
                                ))}
                            </Box>
                        )}
                    </Paper> */}
                </>
            )}

            {/* Period Dialog */}
            <PeriodDialog
                open={periodDialogOpen}
                onClose={() => setPeriodDialogOpen(false)}
                onSave={handleSavePeriod}
                editData={editPeriod}
                shifts={config?.shifts || []}
                nextPeriodNumber={(config?.periods?.length || 0) + 1}
            />

            {/* Disable Timetable Dialog */}
            <Dialog open={disableDialogOpen} onClose={() => setDisableDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Temporary Suspension</Typography>
                    <IconButton onClick={() => setDisableDialogOpen(false)} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 3 }}>
                        Suspending the timetable bypasses conflict detection during exam scheduling.
                    </Alert>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
                            Suspension Window
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <AppDatePicker
                                label="Start Date"
                                value={disableFrom ? new Date(disableFrom) : null}
                                onChange={(date) => setDisableFrom(date ? format(date, 'yyyy-MM-dd') : '')}
                            />
                            <AppDatePicker
                                label="End Date"
                                value={disableTo ? new Date(disableTo) : null}
                                onChange={(date) => setDisableTo(date ? format(date, 'yyyy-MM-dd') : '')}
                            />
                        </Box>

                        <Divider sx={{ my: 0.5 }} />

                        <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
                            Context / Reason
                        </Typography>

                        <AppInput
                            label="Reason for Suspension"
                            fullWidth
                            multiline
                            rows={3}
                            value={disableReason}
                            onChange={(e) => setDisableReason(e.target.value)}
                            placeholder="e.g., Annual Examination Week, Sports Meet..."
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <AppButton onClick={() => setDisableDialogOpen(false)} variant="text" color="inherit">Cancel</AppButton>
                    <AppButton
                        onClick={async () => {
                            try {
                                await toggleDisable.mutateAsync({
                                    disabled: true,
                                    disabledFrom: disableFrom || undefined,
                                    disabledTo: disableTo || undefined,
                                    disabledReason: disableReason || undefined
                                });
                                setDisableDialogOpen(false);
                                setDisableFrom('');
                                setDisableTo('');
                                setDisableReason('');
                            } catch (err) {
                                console.error('Failed to suspend timetable:', err);
                            }
                        }}
                        variant="contained"
                        color="warning"
                        loading={toggleDisable.isPending}
                    >
                        Suspend Timetable
                    </AppButton>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TimetableConfigPage;
