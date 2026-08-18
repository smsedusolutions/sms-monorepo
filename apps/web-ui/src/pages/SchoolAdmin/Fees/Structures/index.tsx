// apps/web-ui/src/pages/SchoolAdmin/Fees/Structures/index.tsx

import React, { useState, useCallback } from 'react';
import ConfirmationDialog from '../../../../components/Dialogs/ConfirmationDialog';
import {
    Box,
    Typography,
    Button,
    Grid,
    TextField,
    MenuItem,
    Chip,
    Stack,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider,
    Checkbox,
    FormControlLabel,
    Autocomplete,
    Snackbar,
    Alert,
    CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PublishIcon from '@mui/icons-material/Publish';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import TokenService from '../../../../queries/token/tokenService';
import {
    useGetFeeStructures,
    useGetFeeCategories,
    useCreateFeeStructure,
    useUpdateFeeStructure,
    useDeleteFeeStructure,
    usePublishFeeStructure,
    useAssignFeeStructure
} from '../../../../queries/Fee';
import { useGetClasses } from '../../../../queries/Class';
import { useAcademicYear } from '../../../../hooks/useAcademicYear';
import { AppTable } from '../../../../components/shared/AppTable';
import type { FeeStructure, FeeCategory } from '../../../../types/fee.types';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useIsMobile } from '../../../../hooks/useIsMobile';

// Dynamic class options will be mapped from useGetClasses

const FREQUENCY_OPTIONS = [
    { value: 'one_time', label: 'One Time' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'annually', label: 'Annually' }
];

const LATE_FEE_FREQUENCY_OPTIONS = [
    { value: 'one_time', label: 'One Time Charge' },
    { value: 'daily', label: 'Daily Accrual' },
    { value: 'weekly', label: 'Weekly Accrual' }
];

const FeeStructures: React.FC = () => {
    const isMobile = useIsMobile();
    const schoolId = TokenService.getSchoolId() || '';
    const { academicYears, currentAcademicYear } = useAcademicYear();
    const [searchTerm, setSearchTerm] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [editStructure, setEditStructure] = useState<FeeStructure | null>(null);
    const [viewStructure, setViewStructure] = useState<FeeStructure | null>(null);

    // Confirmation dialog state
    const [confirm, setConfirm] = useState<{
        open: boolean;
        title: string;
        description: string;
        variant: 'danger' | 'warning' | 'primary';
        onConfirm: () => void;
    }>({ open: false, title: '', description: '', variant: 'danger', onConfirm: () => {} });

    const closeConfirm = useCallback(() => setConfirm(c => ({ ...c, open: false })), []);

    const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success'
    });

    const showToast = (message: string, severity: 'success' | 'error') => {
        setToast({ open: true, message, severity });
    };

    const { data: structuresData, isLoading } = useGetFeeStructures(schoolId, { search: searchTerm });
    const { data: categoriesData } = useGetFeeCategories(schoolId);
    const { data: classesData } = useGetClasses(schoolId);

    const CLASS_OPTIONS = (classesData?.data || []).map((c: any) => ({
        value: c.classId,
        label: c.name
    }));

    const createMutation = useCreateFeeStructure(schoolId);
    const updateMutation = useUpdateFeeStructure(schoolId);
    const deleteMutation = useDeleteFeeStructure(schoolId);
    const publishMutation = usePublishFeeStructure(schoolId);

    // Assign structure state
    const [assignTarget, setAssignTarget] = useState<FeeStructure | null>(null);
    const assignMutation = useAssignFeeStructure(schoolId, assignTarget?.feeStructureId || '');

    const handleAssignOpen = (row: FeeStructure) => setAssignTarget(row);

    const handleAssignSubmit = () => {
        // Send empty body — backend uses structure's own applicableClasses
        assignMutation.mutate(
            {},
            {
                onSuccess: (res: any) => {
                    const created = res.data?.created ?? res.data ?? [];
                    const skipped = res.data?.skipped ?? [];
                    showToast(
                        `Assigned to ${Array.isArray(created) ? created.length : 0} student(s). ${Array.isArray(skipped) ? skipped.length : 0} already had an account.`,
                        'success'
                    );
                    setAssignTarget(null);
                },
                onError: (err: any) => showToast(err.message || 'Assignment failed', 'error')
            }
        );
    };

    const categories = categoriesData?.data || [];
    const structures = structuresData?.data || [];

    // React Hook Form
    const { control, handleSubmit, reset, watch, setValue } = useForm({
        defaultValues: {
            name: '',
            academicYear: currentAcademicYear,
            applicableClasses: [] as string[],
            installmentEnabled: false,
            lateFeeEnabled: false,
            feeItems: [] as any[],
            installments: [] as any[],
            lateFeeRule: {
                gracePeriodDays: 5,
                lateFeeType: 'flat',
                lateFeeValue: 100,
                lateFeeFrequency: 'one_time'
            }
        }
    });

    const { fields: feeItemFields, append: appendFeeItem, remove: removeFeeItem } = useFieldArray({
        control,
        name: 'feeItems'
    });

    const { fields: installmentFields, append: appendInstallment, remove: removeInstallment } = useFieldArray({
        control,
        name: 'installments'
    });

    const installmentEnabled = watch('installmentEnabled');
    const lateFeeEnabled = watch('lateFeeEnabled');

    const handleCreate = () => {
        setEditStructure(null);
        reset({
            name: '',
            academicYear: currentAcademicYear,
            applicableClasses: [],
            installmentEnabled: false,
            lateFeeEnabled: false,
            feeItems: [],
            installments: [],
            lateFeeRule: {
                gracePeriodDays: 5,
                lateFeeType: 'flat',
                lateFeeValue: 100,
                lateFeeFrequency: 'one_time'
            }
        });
        setOpenDialog(true);
    };

    const handleEdit = (row: FeeStructure) => {
        setEditStructure(row);
        reset({
            name: row.name,
            academicYear: row.academicYear,
            applicableClasses: row.applicableClasses,
            installmentEnabled: row.installmentEnabled,
            lateFeeEnabled: row.lateFeeEnabled,
            feeItems: row.feeItems,
            installments: row.installments || [],
            lateFeeRule: row.lateFeeRule || {
                gracePeriodDays: 5,
                lateFeeType: 'flat',
                lateFeeValue: 100,
                lateFeeFrequency: 'one_time'
            }
        });
        setOpenDialog(true);
    };

    const handleDelete = (row: FeeStructure) => {
        setConfirm({
            open: true,
            title: 'Delete Fee Structure',
            description: `Are you sure you want to delete structure "${row.name}"? This action cannot be undone.`,
            variant: 'danger',
            onConfirm: () => {
                closeConfirm();
                deleteMutation.mutate(row.feeStructureId, {
                    onSuccess: () => showToast('Structure deleted successfully', 'success'),
                    onError: (err: any) => showToast(err.message || 'Deletion failed', 'error')
                });
            }
        });
    };

    const handlePublish = (row: FeeStructure) => {
        setConfirm({
            open: true,
            title: 'Publish Fee Structure',
            description: `Publish template "${row.name}"? Once published, structure items are locked from editing.`,
            variant: 'warning',
            onConfirm: () => {
                closeConfirm();
                publishMutation.mutate(row.feeStructureId, {
                    onSuccess: () => showToast('Fee structure published and active!', 'success'),
                    onError: (err: any) => showToast(err.message || 'Publishing failed', 'error')
                });
            }
        });
    };

    const onSubmit = (data: any) => {
        if (data.feeItems.length === 0) {
            showToast('Please add at least one fee category item to the structure breakdown.', 'error');
            return;
        }

        if (data.installmentEnabled) {
            const sumPercent = data.installments.reduce((sum: number, inst: any) => sum + Number(inst.percentageOfTotal), 0);
            if (sumPercent !== 100) {
                showToast('Split installment milestones percentages must sum up exactly to 100%.', 'error');
                return;
            }
        }

        const payload = {
            ...data,
            totalFeeAmount: data.feeItems.reduce((sum: number, item: any) => sum + Number(item.amount), 0)
        };

        if (editStructure) {
            updateMutation.mutate({ structureId: editStructure.feeStructureId, data: payload }, {
                onSuccess: () => {
                    showToast('Fee structure updated successfully', 'success');
                    setOpenDialog(false);
                },
                onError: (err: any) => showToast(err.message || 'Update failed', 'error')
            });
        } else {
            createMutation.mutate(payload, {
                onSuccess: () => {
                    showToast('Fee structure draft created successfully', 'success');
                    setOpenDialog(false);
                },
                onError: (err: any) => showToast(err.message || 'Creation failed', 'error')
            });
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
    };

    const columns = [
        { name: 'Structure Name', selector: (row: FeeStructure) => row.name, cell: (row: FeeStructure) => <Typography variant="body2" fontWeight={600}>{row.name}</Typography> },
        { name: 'Academic Year', selector: (row: FeeStructure) => row.academicYear },
        { name: 'Total Fee Amount', selector: (row: FeeStructure) => row.totalFeeAmount, cell: (row: FeeStructure) => <Typography variant="body2" fontWeight={700} color="success.main">{formatCurrency(row.totalFeeAmount)}</Typography> },
        {
            name: 'Applicable Classes',
            cell: (row: FeeStructure) => (
                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                    {row.applicableClasses.map(c => {
                        const classLabel = CLASS_OPTIONS.find((opt: any) => opt.value === c)?.label || c;
                        return <Chip key={c} label={classLabel} size="small" variant="outlined" />;
                    })}
                </Stack>
            )
        },
        {
            name: 'Status',
            selector: (row: FeeStructure) => row.status,
            cell: (row: FeeStructure) => (
                <Chip
                    label={row.status.toUpperCase()}
                    color={row.status === 'published' ? 'success' : 'default'}
                    size="small"
                />
            )
        },
        {
            name: 'Actions',
            cell: (row: FeeStructure) => (
                <Stack direction="row" spacing={1}>
                    <IconButton size="small" color="primary" onClick={() => setViewStructure(row)}>
                        <VisibilityIcon fontSize="small" />
                    </IconButton>
                    {row.status === 'draft' && (
                        <>
                            <IconButton size="small" color="secondary" onClick={() => handleEdit(row)}>
                                <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="success" onClick={() => handlePublish(row)}>
                                <PublishIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDelete(row)}>
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </>
                    )}
                    {row.status === 'published' && (
                        <IconButton size="small" color="info" title="Assign to Students" onClick={() => handleAssignOpen(row)}>
                            <GroupAddIcon fontSize="small" />
                        </IconButton>
                    )}
                </Stack>
            )
        }
    ];

    return (
        <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, mb: 3, gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight={700} color="text.primary" sx={{ fontSize: { xs: '1.4rem', sm: '2rem' } }}>
                        Fee Structures
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                        Design class templates containing fee breakdowns, split milestones, and overdue late penalties.
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate} fullWidth={isMobile} sx={{ borderRadius: 2 }}>
                    Create Structure
                </Button>
            </Box>

            <Box sx={{ mb: 2 }}>
                <TextField
                    size="small"
                    placeholder="Search structures..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ width: { xs: '100%', sm: 300 } }}
                />
            </Box>

            <AppTable
                columns={columns}
                data={structures}
                isLoading={isLoading}
                emptyMessage="No fee structures registered."
            />

            {/* Create/Edit Form Dialog */}
            <Dialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                fullWidth
                maxWidth="md"
                fullScreen={isMobile}
                PaperProps={{
                    sx: {
                        borderRadius: isMobile ? 0 : 3,
                        maxHeight: isMobile ? '100dvh' : '90vh',
                    }
                }}
            >
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogTitle fontWeight={700}>
                        {editStructure ? 'Edit Fee Structure Draft' : 'Create Fee Structure'}
                    </DialogTitle>
                    <DialogContent dividers>
                        <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Controller
                                    name="name"
                                    control={control}
                                    rules={{ required: 'Structure template name is required' }}
                                    render={({ field, fieldState }: any) => (
                                        <TextField {...field} label="Structure Name" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Controller
                                    name="academicYear"
                                    control={control}
                                    render={({ field }: any) => (
                                        <TextField {...field} select label="Academic Year" fullWidth>
                                            {academicYears.map((ay) => (
                                                <MenuItem key={ay._id || ay.code} value={ay.code}>
                                                    {ay.name} {ay.isCurrent ? '(Current)' : ''}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Controller
                                    name="applicableClasses"
                                    control={control}
                                    render={({ field }: any) => (
                                        <Autocomplete
                                            multiple
                                            options={CLASS_OPTIONS.map(c => c.value)}
                                            getOptionLabel={(val) => CLASS_OPTIONS.find(c => c.value === val)?.label || val}
                                            value={field.value}
                                            onChange={(_, newVal) => field.onChange(newVal)}
                                            renderInput={(params) => (
                                                <TextField {...params} label="Applicable Classes" placeholder="Select multiple classes..." />
                                            )}
                                        />
                                    )}
                                />
                            </Grid>

                            {/* Fee Items Section */}
                            <Grid size={{ xs: 12 }}>
                                <Divider sx={{ my: 1 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                                    <Typography variant="subtitle1" fontWeight={700} color="#1e293b">Fee Items Breakdown</Typography>
                                    <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={() => appendFeeItem({ feeCategoryId: '', categoryName: '', amount: 1000, frequency: 'monthly', dueDayOfMonth: 10, isOptional: false, displayOrder: feeItemFields.length })}>
                                        Add Line Item
                                    </Button>
                                </Box>
                                <Stack spacing={2}>
                                    {feeItemFields.map((fieldItem, index) => (
                                        <Box key={fieldItem.id} sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 2.5, bgcolor: '#f8fafc' }}>
                                            <Grid container spacing={1.5} alignItems="center">
                                                <Grid size={{ xs: 12, sm: 4 }}>
                                                    <Controller
                                                        name={`feeItems.${index}.feeCategoryId`}
                                                        control={control}
                                                        rules={{ required: true }}
                                                        render={({ field }: any) => (
                                                            <TextField
                                                                {...field}
                                                                select
                                                                label="Category"
                                                                fullWidth
                                                                size="small"
                                                                onChange={(e) => {
                                                                    field.onChange(e.target.value);
                                                                    const selectedCat = categories.find((c: FeeCategory) => c.feeCategoryId === e.target.value);
                                                                    if (selectedCat) {
                                                                        setValue(`feeItems.${index}.categoryName`, selectedCat.name);
                                                                        setValue(`feeItems.${index}.categoryType`, selectedCat.categoryType);
                                                                        setValue(`feeItems.${index}.isOptional`, !selectedCat.isMandatory);
                                                                    }
                                                                }}
                                                            >
                                                                {categories.map((cat: FeeCategory) => (
                                                                    <MenuItem key={cat.feeCategoryId} value={cat.feeCategoryId}>{cat.name}</MenuItem>
                                                                ))}
                                                            </TextField>
                                                        )}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 6, sm: 2 }}>
                                                    <Controller
                                                        name={`feeItems.${index}.amount`}
                                                        control={control}
                                                        rules={{ required: true, min: 1 }}
                                                        render={({ field }: any) => (
                                                            <TextField {...field} type="number" label="Amount (₹)" fullWidth size="small" />
                                                        )}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 6, sm: 2.5 }}>
                                                    <Controller
                                                        name={`feeItems.${index}.frequency`}
                                                        control={control}
                                                        render={({ field }: any) => (
                                                            <TextField {...field} select label="Frequency" fullWidth size="small">
                                                                {FREQUENCY_OPTIONS.map(opt => (
                                                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                                                ))}
                                                            </TextField>
                                                        )}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 6, sm: 2 }}>
                                                    <Controller
                                                        name={`feeItems.${index}.dueDayOfMonth`}
                                                        control={control}
                                                        render={({ field }: any) => (
                                                            <TextField {...field} type="number" label="Due Day (1-28)" fullWidth size="small" inputProps={{ min: 1, max: 28 }} />
                                                        )}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 6, sm: 1.5 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <Controller
                                                        name={`feeItems.${index}.isOptional`}
                                                        control={control}
                                                        render={({ field }: any) => (
                                                            <FormControlLabel
                                                                control={<Checkbox checked={field.value} onChange={field.onChange} size="small" />}
                                                                label={<Typography variant="caption">Optional</Typography>}
                                                            />
                                                        )}
                                                    />
                                                    <IconButton color="error" size="small" onClick={() => removeFeeItem(index)}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    ))}
                                </Stack>
                            </Grid>

                            {/* Installments Configuration */}
                            <Grid size={{ xs: 12 }}>
                                <Divider sx={{ my: 1 }} />
                                <Controller
                                    name="installmentEnabled"
                                    control={control}
                                    render={({ field }: any) => (
                                        <FormControlLabel
                                            control={<Checkbox checked={field.value} onChange={field.onChange} />}
                                            label={<Typography fontWeight={700}>Enable Split Installment Payments Plan</Typography>}
                                        />
                                    )}
                                />
                                {installmentEnabled && (
                                    <Box sx={{ mt: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                            <Typography variant="body2" color="text.secondary">Specify milestone breakdown dates. Total must sum to 100%.</Typography>
                                            <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => appendInstallment({ installmentNumber: installmentFields.length + 1, label: `Term ${installmentFields.length + 1}`, dueDate: new Date().toISOString().split('T')[0], percentageOfTotal: 25 })}>
                                                Add Installment Milestone
                                            </Button>
                                        </Box>
                                        <Stack spacing={2}>
                                            {installmentFields.map((inst, index) => (
                                                <Stack key={inst.id} direction="row" spacing={2} alignItems="center">
                                                    <Typography variant="body2" fontWeight={600}>#{index + 1}</Typography>
                                                    <Controller
                                                        name={`installments.${index}.label`}
                                                        control={control}
                                                        render={({ field }: any) => <TextField {...field} label="Label (e.g. Q1 / Term 1)" />}
                                                    />
                                                    <Controller
                                                        name={`installments.${index}.dueDate`}
                                                        control={control}
                                                        render={({ field }: any) => <TextField {...field} type="date" label="Due Date" InputLabelProps={{ shrink: true }} />}
                                                    />
                                                    <Controller
                                                        name={`installments.${index}.percentageOfTotal`}
                                                        control={control}
                                                        render={({ field }: any) => <TextField {...field} type="number" label="Percentage (%)" sx={{ width: 100 }} />}
                                                    />
                                                    <IconButton color="error" onClick={() => removeInstallment(index)}>
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Stack>
                                            ))}
                                        </Stack>
                                    </Box>
                                )}
                            </Grid>

                            {/* Late Fee Configuration */}
                            <Grid size={{ xs: 12 }}>
                                <Divider sx={{ my: 1 }} />
                                <Controller
                                    name="lateFeeEnabled"
                                    control={control}
                                    render={({ field }: any) => (
                                        <FormControlLabel
                                            control={<Checkbox checked={field.value} onChange={field.onChange} />}
                                            label={<Typography fontWeight={700}>Enable Overdue Late Fee Rules</Typography>}
                                        />
                                    )}
                                />
                                {lateFeeEnabled && (
                                    <Grid container spacing={2} sx={{ mt: 1 }}>
                                        <Grid size={{ xs: 12, sm: 3 }}>
                                            <Controller
                                                name="lateFeeRule.gracePeriodDays"
                                                control={control}
                                                render={({ field }: any) => <TextField {...field} type="number" label="Grace Period (Days)" fullWidth />}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 3 }}>
                                            <Controller
                                                name="lateFeeRule.lateFeeType"
                                                control={control}
                                                render={({ field }: any) => (
                                                    <TextField {...field} select label="Late Fee Type" fullWidth>
                                                        <MenuItem value="flat">Flat Amount</MenuItem>
                                                        <MenuItem value="percentage">Percentage (%)</MenuItem>
                                                    </TextField>
                                                )}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 3 }}>
                                            <Controller
                                                name="lateFeeRule.lateFeeValue"
                                                control={control}
                                                render={({ field }: any) => <TextField {...field} type="number" label="Late Fee Value" fullWidth />}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 3 }}>
                                            <Controller
                                                name="lateFeeRule.lateFeeFrequency"
                                                control={control}
                                                render={({ field }: any) => (
                                                    <TextField {...field} select label="Frequency" fullWidth>
                                                        {LATE_FEE_FREQUENCY_OPTIONS.map(o => (
                                                            <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                                                        ))}
                                                    </TextField>
                                                )}
                                            />
                                        </Grid>
                                    </Grid>
                                )}
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                        <Button type="submit" variant="contained" color="primary">Save Draft</Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* View Template Details Dialog */}
            <Dialog
                open={!!viewStructure}
                onClose={() => setViewStructure(null)}
                fullWidth
                maxWidth="sm"
                fullScreen={isMobile}
                PaperProps={{
                    sx: {
                        borderRadius: isMobile ? 0 : 3,
                        maxHeight: isMobile ? '100dvh' : '90vh',
                    }
                }}
            >
                <DialogTitle fontWeight={700}>Fee Structure Template Details</DialogTitle>
                <DialogContent dividers>
                    {viewStructure && (
                        <Stack spacing={2.5}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                                <Typography variant="h6" fontWeight={700} color="primary">{viewStructure.name}</Typography>
                                <Chip label={viewStructure.status.toUpperCase()} color={viewStructure.status === 'published' ? 'success' : 'default'} />
                            </Box>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 6 }}>
                                    <Typography variant="caption" color="text.secondary">Academic Year</Typography>
                                    <Typography variant="body1" fontWeight={600}>{viewStructure.academicYear}</Typography>
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <Typography variant="caption" color="text.secondary">Total Expected Amount</Typography>
                                    <Typography variant="body1" fontWeight={700} color="success.main">{formatCurrency(viewStructure.totalFeeAmount)}</Typography>
                                </Grid>
                            </Grid>
                            <Typography variant="subtitle2" fontWeight={700}>Line Item Breakdowns</Typography>
                            <AppTable
                                columns={[
                                    { name: 'Category', selector: (row: any) => row.categoryName },
                                    { name: 'Amount', selector: (row: any) => formatCurrency(row.amount) },
                                    { name: 'Frequency', selector: (row: any) => row.frequency?.toUpperCase() }
                                ]}
                                data={viewStructure.feeItems}
                            />
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setViewStructure(null)}>Close</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast(t => ({ ...t, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity={toast.severity}>{toast.message}</Alert>
            </Snackbar>

            <ConfirmationDialog
                open={confirm.open}
                title={confirm.title}
                description={confirm.description}
                variant={confirm.variant}
                onClose={closeConfirm}
                onConfirm={confirm.onConfirm}
                isLoading={deleteMutation.isPending || publishMutation.isPending}
            />

            {/* Assign Structure to Students Dialog */}
            <Dialog open={!!assignTarget} onClose={() => setAssignTarget(null)} maxWidth="xs" fullWidth>
                <DialogTitle fontWeight={700}>Assign to Students</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        This will create fee ledgers for all active students in the applicable classes.
                        Students who already have a ledger for <strong>{assignTarget?.academicYear}</strong> will be skipped automatically.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                        {assignTarget?.applicableClasses?.map((cls) => {
                            const classLabel = CLASS_OPTIONS.find((opt: any) => opt.value === cls)?.label || cls;
                            return <Chip key={cls} label={classLabel} color="primary" variant="outlined" size="small" />;
                        })}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setAssignTarget(null)} color="inherit" disabled={assignMutation.isPending}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        disabled={assignMutation.isPending}
                        startIcon={assignMutation.isPending ? <CircularProgress size={18} color="inherit" /> : <GroupAddIcon />}
                        onClick={handleAssignSubmit}
                    >
                        {assignMutation.isPending ? 'Assigning...' : 'Assign Now'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default FeeStructures;
