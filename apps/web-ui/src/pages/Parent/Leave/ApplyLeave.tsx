import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    Button,
    Alert,
    Grid,
    Autocomplete,
    Checkbox,
    Chip,
} from '@mui/material';
import {
    Send as SendIcon,
    ArrowBack as ArrowBackIcon,
    CheckBoxOutlineBlank,
    CheckBox as CheckBoxIcon,
} from '@mui/icons-material';
import type { LeaveType, Student } from '../../../types';
import { AppInput } from '../../../components/shared/AppInput';
import { AppSelect } from '../../../components/shared/AppSelect';
import { AppDatePicker } from '../../../components/shared/AppDatePicker';
import { AppButton } from '../../../components/shared/AppButton';
import { AppCard } from '../../../components/shared/AppCard';
import { AppSection } from '../../../components/shared/AppSection';
import { useNavigate } from 'react-router-dom';
import TokenService from '../../../queries/token/tokenService';
import { useChildSelector } from '../../../context/ChildSelectorContext';
import { useApplyLeave } from '../../../queries/Leave';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, isValid } from 'date-fns';

type ChildOption = Student & { className?: string; sectionName?: string };

const ParentApplyLeave: React.FC = () => {
    const navigate = useNavigate();
    const schoolId = TokenService.getSchoolId() || '';
    const { children, isLoading: loadingChildren } = useChildSelector();

    const isMultiSelect = children.length > 1;

    const [selectedStudents, setSelectedStudents] = useState<ChildOption[]>([]);
    const [formData, setFormData] = useState({
        leaveType: '' as LeaveType | '',
        reason: '',
    });
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [success, setSuccess] = useState(false);
    const [hasBeenSubmitted, setHasBeenSubmitted] = useState(false);

    const applyLeave = useApplyLeave(schoolId);

    const autocompleteOptions = useMemo<ChildOption[]>(() => {
        if (!isMultiSelect) return children;
        const selectAllItem: ChildOption = {
            studentId: '__SELECT_ALL__',
            schoolId,
            firstName: 'Select All',
            lastName: `(${children.length} Children)`,
            class: '',
            section: '',
            gender: 'other',
            status: 'active',
        };
        return [selectAllItem, ...children];
    }, [isMultiSelect, children, schoolId]);

    useEffect(() => {
        // Pre-select only when there is exactly one child. If multiple, leave empty for parent to choose.
        if (children.length === 1) {
            setSelectedStudents([children[0]]);
        }
    }, [children]);

    useEffect(() => {
        if (hasBeenSubmitted) {
            validate();
        }
    }, [formData, startDate, endDate, selectedStudents, hasBeenSubmitted]);

    const handleChange = (field: string) => (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        setFormData(prev => ({ ...prev, [field]: event.target.value }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (selectedStudents.length === 0) newErrors.students = 'Please select at least one child';
        if (!formData.leaveType) newErrors.leaveType = 'Please select leave type';
        if (!startDate || !isValid(startDate)) newErrors.startDate = 'Please enter a valid start date';
        if (!endDate || !isValid(endDate)) newErrors.endDate = 'Please enter a valid end date';
        if (startDate && isValid(startDate) && endDate && isValid(endDate) && endDate < startDate) {
            newErrors.endDate = 'End date cannot be before start date';
        }
        if (!formData.reason.trim()) newErrors.reason = 'Please provide a reason';
        if (formData.reason.trim().length < 10) newErrors.reason = 'Reason must be at least 10 characters';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setHasBeenSubmitted(true);

        if (!validate()) return;

        try {
            await applyLeave.mutateAsync({
                leaveType: formData.leaveType as LeaveType,
                reason: formData.reason,
                startDate: startDate!.toISOString(),
                endDate: endDate!.toISOString(),
                studentIds: selectedStudents.map(s => s.studentId),
            });
            setSuccess(true);
            setTimeout(() => {
                navigate('/parent/leave/history');
            }, 1500);
        } catch (err: unknown) {
            setErrors({ submit: (err as Error)?.message || 'Failed to apply for leave' });
        }
    };

    const getChildLabel = (child: ChildOption) =>
        `${child.firstName} ${child.lastName} - ${child.className || child.class}`;

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/parent/dashboard')}
                    sx={{ mb: 3, textTransform: 'none', borderRadius: 2 }}
                >
                    Back to Dashboard
                </Button>

                {success && (
                    <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                        Leave request submitted successfully! Redirecting...
                    </Alert>
                )}

                {errors.submit && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                        {errors.submit}
                    </Alert>
                )}

                <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 8 }}>
                        <AppSection title="Apply for Leave">
                            <form onSubmit={handleSubmit}>
                                <Grid container spacing={3}>
                                    <Grid size={{ xs: 12 }}>
                                        {isMultiSelect ? (
                                            <Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.8125rem' }}>
                                                        Select Children
                                                    </Typography>
                                                    <Button
                                                        size="small"
                                                        variant="text"
                                                        onClick={() => {
                                                            if (selectedStudents.length === children.length) {
                                                                setSelectedStudents([]);
                                                            } else {
                                                                setSelectedStudents([...children]);
                                                            }
                                                        }}
                                                        sx={{ textTransform: 'none', fontSize: '0.75rem', py: 0, px: 0.75, fontWeight: 600 }}
                                                    >
                                                        {selectedStudents.length === children.length ? 'Deselect All' : `Select All (${children.length})`}
                                                    </Button>
                                                </Box>
                                                <Autocomplete
                                                    multiple
                                                    id="select-children"
                                                    options={autocompleteOptions}
                                                    value={selectedStudents}
                                                    onChange={(_event, newValue) => {
                                                        const hasSelectAll = newValue.some(v => v.studentId === '__SELECT_ALL__');
                                                        if (hasSelectAll) {
                                                            if (selectedStudents.length === children.length) {
                                                                setSelectedStudents([]);
                                                            } else {
                                                                setSelectedStudents([...children]);
                                                            }
                                                        } else {
                                                            setSelectedStudents(newValue.filter(v => v.studentId !== '__SELECT_ALL__') as any);
                                                        }
                                                    }}
                                                    disableCloseOnSelect
                                                    getOptionLabel={getChildLabel}
                                                    isOptionEqualToValue={(option, value) =>
                                                        option.studentId === value.studentId
                                                    }
                                                    renderOption={(props, option) => {
                                                        const { key, ...restProps } = props;
                                                        if (option.studentId === '__SELECT_ALL__') {
                                                            const isAllSelected = children.length > 0 && selectedStudents.length === children.length;
                                                            const isIndeterminate = selectedStudents.length > 0 && selectedStudents.length < children.length;
                                                            return (
                                                                <li
                                                                    key={key}
                                                                    {...restProps}
                                                                    style={{
                                                                        borderBottom: '1px solid rgba(0,0,0,0.08)',
                                                                        fontWeight: 600,
                                                                        backgroundColor: isAllSelected ? 'rgba(79, 70, 229, 0.04)' : undefined,
                                                                    }}
                                                                >
                                                                    <Checkbox
                                                                        icon={<CheckBoxOutlineBlank fontSize="small" />}
                                                                        checkedIcon={<CheckBoxIcon fontSize="small" />}
                                                                        indeterminate={isIndeterminate}
                                                                        style={{ marginRight: 8 }}
                                                                        checked={isAllSelected}
                                                                    />
                                                                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                                                        Select All Children ({children.length})
                                                                    </Typography>
                                                                </li>
                                                            );
                                                        }
                                                        const isSelected = selectedStudents.some(s => s.studentId === option.studentId);
                                                        return (
                                                            <li key={key} {...restProps}>
                                                                <Checkbox
                                                                    icon={<CheckBoxOutlineBlank fontSize="small" />}
                                                                    checkedIcon={<CheckBoxIcon fontSize="small" />}
                                                                    style={{ marginRight: 8 }}
                                                                    checked={isSelected}
                                                                />
                                                                {getChildLabel(option)}
                                                            </li>
                                                        );
                                                    }}
                                                    renderTags={(value, getTagProps) =>
                                                        value
                                                            .filter(opt => opt.studentId !== '__SELECT_ALL__')
                                                            .map((option, index) => {
                                                                const { key, ...chipProps } = getTagProps({ index });
                                                                return (
                                                                    <Chip
                                                                        key={key}
                                                                        label={`${option.firstName} ${option.lastName}`}
                                                                        size="small"
                                                                        color="primary"
                                                                        variant="outlined"
                                                                        {...chipProps}
                                                                    />
                                                                );
                                                            })
                                                    }
                                                    renderInput={(params) => (
                                                        <AppInput
                                                            {...params}
                                                            placeholder={selectedStudents.length === 0 ? 'Select one or more children' : ''}
                                                            error={!!errors.students}
                                                            helperText={errors.students}
                                                        />
                                                    )}
                                                    loading={loadingChildren}
                                                />
                                            </Box>
                                        ) : (
                                            <AppInput
                                                fullWidth
                                                label="Selected Child"
                                                value={selectedStudents.length > 0 ? getChildLabel(selectedStudents[0]) : ''}
                                                disabled
                                            />
                                        )}
                                    </Grid>

                                    <Grid size={{ xs: 12 }}>
                                        <AppSelect
                                            label="Leave Type"
                                            value={formData.leaveType}
                                            onChange={(e) => setFormData(prev => ({ ...prev, leaveType: e.target.value as LeaveType }))}
                                            options={[
                                                { value: 'sick', label: 'Sick Leave' },
                                                { value: 'casual', label: 'Casual Leave' },
                                                { value: 'emergency', label: 'Emergency Leave' },
                                                { value: 'personal', label: 'Personal Leave' },
                                                { value: 'other', label: 'Other' },
                                            ]}
                                            error={!!errors.leaveType}
                                            helperText={errors.leaveType}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <AppDatePicker
                                            label="Start Date"
                                            value={startDate}
                                            onChange={(date: Date | null) => setStartDate(date)}
                                            minDate={new Date()}
                                            error={!!errors.startDate}
                                            helperText={errors.startDate}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <AppDatePicker
                                            label="End Date"
                                            value={endDate}
                                            onChange={(date: Date | null) => setEndDate(date)}
                                            minDate={startDate || new Date()}
                                            error={!!errors.endDate}
                                            helperText={errors.endDate}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12 }}>
                                        <AppInput
                                            fullWidth
                                            multiline
                                            rows={4}
                                            label="Detailed Explanation"
                                            value={formData.reason}
                                            onChange={handleChange('reason')}
                                            placeholder="Please provide details about your leave request..."
                                            error={!!errors.reason}
                                            helperText={errors.reason}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12 }}>
                                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                                            <AppButton
                                                variant="text"
                                                color="inherit"
                                                onClick={() => navigate('/parent/dashboard')}
                                                sx={{ textTransform: 'none' }}
                                            >
                                                Discard
                                            </AppButton>
                                            <AppButton
                                                type="submit"
                                                variant="contained"
                                                startIcon={<SendIcon />}
                                                loading={applyLeave.isPending}
                                                sx={{
                                                    py: 1.5,
                                                    px: 4,
                                                    borderRadius: 2,
                                                    textTransform: 'none',
                                                    fontWeight: 600,
                                                    boxShadow: '0 4px 14px 0 rgba(0, 118, 255, 0.39)',
                                                }}
                                            >
                                                Submit Application
                                            </AppButton>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </form>
                        </AppSection>
                    </Grid>

                    {/* Summary Card */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                            Application Preview
                        </Typography>
                        <AppCard sx={{ p: 1 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Typography color="text.secondary">For:</Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 0.5, maxWidth: '70%' }}>
                                        {selectedStudents.length > 0 ? selectedStudents.map(s => (
                                            <Chip key={s.studentId} label={`${s.firstName} ${s.lastName}`} size="small" sx={{ borderRadius: 1 }} />
                                        )) : <Typography variant="body2" color="text.disabled">None</Typography>}
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography color="text.secondary">Type:</Typography>
                                    <Chip
                                        label={formData.leaveType || 'Not selected'}
                                        size="small"
                                        color={formData.leaveType ? 'primary' : 'default'}
                                        sx={{ borderRadius: 1.5, fontWeight: 500, textTransform: 'capitalize' }}
                                    />
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography color="text.secondary">Duration:</Typography>
                                    <Typography variant="body1" fontWeight={700} color="primary.main">
                                        {startDate && endDate && isValid(startDate) && isValid(endDate) ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1 : 0} day(s)
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography color="text.secondary">From:</Typography>
                                    <Typography variant="body2" fontWeight={500}>{startDate && isValid(startDate) ? format(startDate, 'MMM dd, yyyy') : '-'}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography color="text.secondary">To:</Typography>
                                    <Typography variant="body2" fontWeight={500}>{endDate && isValid(endDate) ? format(endDate, 'MMM dd, yyyy') : '-'}</Typography>
                                </Box>
                            </Box>
                        </AppCard>
                    </Grid>
                </Grid>
            </Box>
        </LocalizationProvider>
    );
};

export default ParentApplyLeave;
