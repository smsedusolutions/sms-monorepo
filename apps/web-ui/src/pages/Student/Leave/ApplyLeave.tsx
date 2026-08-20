import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Alert,
    Card,
    Chip,
    Grid,
} from '@mui/material';
import {
    Send as SendIcon,
    CheckCircle as SuccessIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useApplyLeave } from '../../../queries/Leave';
import TokenService from '../../../queries/token/tokenService';
import type { LeaveType } from '../../../types';
import { AppInput } from '../../../components/shared/AppInput';
import { AppSelect } from '../../../components/shared/AppSelect';
import { AppButton } from '../../../components/shared/AppButton';
import { AppDatePicker } from '../../../components/shared/AppDatePicker';
import { AppCard } from '../../../components/shared/AppCard';
import { AppSection } from '../../../components/shared/AppSection';
import { format, isValid, parse, startOfDay } from 'date-fns';

const leaveTypes: { value: LeaveType; label: string; description: string }[] = [
    { value: 'casual', label: 'Casual Leave', description: 'For personal matters' },
    { value: 'sick', label: 'Sick Leave', description: 'For health issues' },
    { value: 'emergency', label: 'Emergency Leave', description: 'For urgent situations' },
    { value: 'personal', label: 'Personal Leave', description: 'For personal reasons' },
    { value: 'other', label: 'Other', description: 'Any other reason' },
];

const ApplyLeave: React.FC = () => {
    const navigate = useNavigate();
    const schoolId = TokenService.getSchoolId() || '';

    const [formData, setFormData] = useState({
        leaveType: '' as LeaveType | '',
        startDate: '',
        endDate: '',
        reason: '',
    });
    const [submitted, setSubmitted] = useState(false);
    const [hasBeenSubmitted, setHasBeenSubmitted] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const applyMutation = useApplyLeave(schoolId);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    useEffect(() => {
        if (hasBeenSubmitted) {
            validate();
        }
    }, [formData, hasBeenSubmitted]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.leaveType) newErrors.leaveType = 'Please select leave type';

        const start = formData.startDate ? parse(formData.startDate, 'yyyy-MM-dd', new Date()) : null;
        const end = formData.endDate ? parse(formData.endDate, 'yyyy-MM-dd', new Date()) : null;

        if (!start || !isValid(start)) newErrors.startDate = 'Please enter a valid start date';
        else if (start < startOfDay(new Date())) newErrors.startDate = 'Cannot be in the past';

        if (!end || !isValid(end)) newErrors.endDate = 'Please enter a valid end date';
        else if (end < startOfDay(new Date())) newErrors.endDate = 'Cannot be in the past';

        if (start && end && isValid(start) && isValid(end) && end < start) {
            newErrors.endDate = 'End date cannot be before start date';
        }

        if (!formData.reason.trim()) newErrors.reason = 'Please provide a reason';
        if (formData.reason.trim().length < 10) newErrors.reason = 'Reason must be at least 10 characters';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setHasBeenSubmitted(true);
        if (!validate()) return;

        try {
            await applyMutation.mutateAsync({
                leaveType: formData.leaveType as LeaveType,
                startDate: formData.startDate,
                endDate: formData.endDate,
                reason: formData.reason.trim(),
            });
            setSubmitted(true);
        } catch {
            // Error handled by mutation
        }
    };

    // Calculate number of days
    const calculateDays = () => {
        if (!formData.startDate || !formData.endDate) return 0;
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    };

    if (submitted) {
        return (
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
                <Card sx={{ maxWidth: 500, mx: 'auto', textAlign: 'center', p: 4 }}>
                    <SuccessIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                    <Typography variant="h5" gutterBottom fontWeight={600}>
                        Leave Application Submitted!
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 3 }}>
                        Your leave request has been sent for approval. You will be notified once it's processed.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                        <AppButton variant="outlined" onClick={() => navigate('/student/leave/my')}>
                            View My Leaves
                        </AppButton>
                        <AppButton variant="contained" onClick={() => { setSubmitted(false); setFormData({ leaveType: '', startDate: '', endDate: '', reason: '' }); }}>
                            Apply Another
                        </AppButton>
                    </Box>
                </Card>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Leave Summary
            </Typography>
            <Grid container spacing={4}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <AppSection title="Apply for Leave">
                        {applyMutation.isError && (
                            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                                {(applyMutation.error as { message?: string })?.message || 'Failed to submit leave request'}
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <AppSelect
                                    label="Leave Type"
                                    value={formData.leaveType}
                                    options={leaveTypes.map((type) => ({ value: type.value, label: type.label }))}
                                    onChange={(e) => handleChange('leaveType', e.target.value as string)}
                                    error={!!errors.leaveType}
                                    helperText={errors.leaveType}
                                />

                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <AppDatePicker
                                            label="Start Date"
                                            value={formData.startDate ? parse(formData.startDate, 'yyyy-MM-dd', new Date()) : null}
                                            onChange={(date) => handleChange('startDate', (date && isValid(date)) ? format(date, 'yyyy-MM-dd') : '')}
                                            maxDate={formData.endDate ? parse(formData.endDate, 'yyyy-MM-dd', new Date()) : undefined}
                                            disablePast
                                            error={!!errors.startDate}
                                            helperText={errors.startDate}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <AppDatePicker
                                            label="End Date"
                                            value={formData.endDate ? parse(formData.endDate, 'yyyy-MM-dd', new Date()) : null}
                                            onChange={(date) => handleChange('endDate', (date && isValid(date)) ? format(date, 'yyyy-MM-dd') : '')}
                                            minDate={formData.startDate ? parse(formData.startDate, 'yyyy-MM-dd', new Date()) : undefined}
                                            disablePast
                                            error={!!errors.endDate}
                                            helperText={errors.endDate}
                                        />
                                    </Grid>
                                </Grid>

                                <AppInput
                                    label="Reason for Leave"
                                    placeholder="Please describe why you need leave..."
                                    value={formData.reason}
                                    onChange={(e) => handleChange('reason', e.target.value)}
                                    multiline
                                    rows={4}
                                    error={!!errors.reason}
                                    helperText={errors.reason || `${formData.reason.length}/500 characters`}
                                    inputProps={{ maxLength: 500 }}
                                    fullWidth
                                />

                                <AppButton
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    loading={applyMutation.isPending}
                                    startIcon={!applyMutation.isPending && <SendIcon />}
                                    sx={{
                                        py: 1.5,
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        fontSize: '1rem',
                                        fontWeight: 600,
                                        boxShadow: '0 4px 14px 0 rgba(0, 118, 255, 0.39)',
                                    }}
                                >
                                    Submit Leave Request
                                </AppButton>
                            </Box>
                        </form>
                    </AppSection>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                        Leave Summary
                    </Typography>
                    <AppCard sx={{ p: 1 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography color="text.secondary">Type:</Typography>
                                <Chip
                                    label={formData.leaveType ? leaveTypes.find(t => t.value === formData.leaveType)?.label : 'Not selected'}
                                    size="small"
                                    color={formData.leaveType ? 'primary' : 'default'}
                                    sx={{ borderRadius: 1.5, fontWeight: 500 }}
                                />
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography color="text.secondary">Duration:</Typography>
                                <Typography variant="body1" fontWeight={700} color="primary.main">{calculateDays()} day(s)</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography color="text.secondary">From:</Typography>
                                <Typography variant="body2" fontWeight={500}>{formData.startDate ? format(new Date(formData.startDate), 'MMM dd, yyyy') : '-'}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography color="text.secondary">To:</Typography>
                                <Typography variant="body2" fontWeight={500}>{formData.endDate ? format(new Date(formData.endDate), 'MMM dd, yyyy') : '-'}</Typography>
                            </Box>
                        </Box>
                    </AppCard>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ApplyLeave;
