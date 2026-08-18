// apps/web-ui/src/pages/SchoolAdmin/Fees/Discounts/index.tsx

import React, { useState } from 'react';
import ConfirmationDialog from '../../../../components/Dialogs/ConfirmationDialog';
import {
    Box,
    Typography,
    Button,
    Chip,
    Stack,
    IconButton,
    TextField,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    Alert,
    InputAdornment,
    Grid
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import PercentIcon from '@mui/icons-material/Percent';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import TokenService from '../../../../queries/token/tokenService';
import {
    useGetDiscounts,
    useCreateDiscount,
    useUpdateDiscount,
    useDeleteDiscount,
    useGetFeeCategories
} from '../../../../queries/Fee';
import { AppTable } from '../../../../components/shared/AppTable';
import type { FeeDiscount } from '../../../../types/fee.types';
import { useIsMobile } from '../../../../hooks/useIsMobile';

const EMPTY_FORM = {
    name: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'flat',
    discountValue: '',
    appliesTo: 'all_fees' as 'all_fees' | 'specific_category' | 'tuition_only',
    specificCategoryId: '',
};

const FeeDiscounts: React.FC = () => {
    const isMobile = useIsMobile();
    const schoolId = TokenService.getSchoolId() || '';

    const { data: discountsData, isLoading } = useGetDiscounts(schoolId);
    const { data: categoriesData } = useGetFeeCategories(schoolId);
    const createMutation = useCreateDiscount(schoolId);
    const deleteMutation = useDeleteDiscount(schoolId);

    const discounts: FeeDiscount[] = discountsData?.data || [];
    const categories = categoriesData?.data || [];

    // Form dialog
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<FeeDiscount | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Inline update mutation — recreated when editTarget changes
    const updateMutation = useUpdateDiscount(schoolId, editTarget?.discountId || '');

    // Confirm dialog
    const [confirm, setConfirm] = useState({ open: false, title: '', description: '', onConfirm: () => {} });
    const closeConfirm = () => setConfirm(c => ({ ...c, open: false }));

    // Toast
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
    const showToast = (message: string, severity: 'success' | 'error' = 'success') =>
        setToast({ open: true, message, severity });

    const openCreate = () => {
        setEditTarget(null);
        setForm(EMPTY_FORM);
        setFormErrors({});
        setDialogOpen(true);
    };

    const openEdit = (row: FeeDiscount) => {
        setEditTarget(row);
        setForm({
            name: row.name,
            description: row.description || '',
            discountType: row.discountType,
            discountValue: String(row.discountValue),
            appliesTo: row.appliesTo,
            specificCategoryId: row.specificCategoryId || '',
        });
        setFormErrors({});
        setDialogOpen(true);
    };

    const validate = () => {
        const errors: Record<string, string> = {};
        if (!form.name.trim()) errors.name = 'Name is required';
        const val = Number(form.discountValue);
        if (!form.discountValue || isNaN(val) || val <= 0) errors.discountValue = 'Enter a valid positive value';
        if (form.discountType === 'percentage' && val > 100) errors.discountValue = 'Percentage cannot exceed 100';
        if (form.appliesTo === 'specific_category' && !form.specificCategoryId) errors.specificCategoryId = 'Select a category';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        const payload = {
            name: form.name.trim(),
            description: form.description.trim(),
            discountType: form.discountType,
            discountValue: Number(form.discountValue),
            appliesTo: form.appliesTo,
            specificCategoryId: form.appliesTo === 'specific_category' ? form.specificCategoryId : null,
        };

        if (editTarget) {
            updateMutation.mutate(payload as any, {
                onSuccess: () => { showToast('Discount template updated'); setDialogOpen(false); },
                onError: (e: any) => showToast(e.message || 'Update failed', 'error'),
            });
        } else {
            createMutation.mutate(payload as any, {
                onSuccess: () => { showToast('Discount template created'); setDialogOpen(false); },
                onError: (e: any) => showToast(e.message || 'Create failed', 'error'),
            });
        }
    };

    const handleDelete = (row: FeeDiscount) => {
        setConfirm({
            open: true,
            title: 'Delete Discount Template',
            description: `Are you sure you want to delete "${row.name}"? This cannot be undone if no students have it applied.`,
            onConfirm: () => {
                deleteMutation.mutate(row.discountId, {
                    onSuccess: () => { showToast('Discount template deleted'); closeConfirm(); },
                    onError: (e: any) => { showToast(e.message || 'Delete failed', 'error'); closeConfirm(); },
                });
            }
        });
    };

    const columns = [
        {
            name: 'Name',
            cell: (row: FeeDiscount) => (
                <Stack direction="row" spacing={1} alignItems="center">
                    <LocalOfferIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                    <Box>
                        <Typography variant="body2" fontWeight={600}>{row.name}</Typography>
                        {row.description && (
                            <Typography variant="caption" color="text.secondary">{row.description}</Typography>
                        )}
                    </Box>
                </Stack>
            )
        },
        {
            name: 'Type',
            cell: (row: FeeDiscount) => (
                <Chip
                    icon={row.discountType === 'percentage' ? <PercentIcon sx={{ fontSize: 14 }} /> : <CurrencyRupeeIcon sx={{ fontSize: 14 }} />}
                    label={row.discountType === 'percentage' ? 'Percentage' : 'Flat Amount'}
                    size="small"
                    color="info"
                    variant="outlined"
                />
            )
        },
        {
            name: 'Value',
            cell: (row: FeeDiscount) => (
                <Typography variant="body2" fontWeight={700} color="success.main">
                    {row.discountType === 'percentage' ? `${row.discountValue}%` : `₹${row.discountValue.toLocaleString('en-IN')}`}
                </Typography>
            )
        },
        {
            name: 'Applies To',
            cell: (row: FeeDiscount) => (
                <Chip
                    label={row.appliesTo === 'all_fees' ? 'All Fees' : 'Specific Category'}
                    size="small"
                    variant="outlined"
                    color={row.appliesTo === 'all_fees' ? 'default' : 'warning'}
                />
            )
        },
        {
            name: 'Status',
            cell: (row: FeeDiscount) => (
                <Chip label={row.isActive ? 'Active' : 'Inactive'} size="small" color={row.isActive ? 'success' : 'default'} />
            )
        },
        {
            name: 'Actions',
            cell: (row: FeeDiscount) => (
                <Stack direction="row" spacing={0.5}>
                    <IconButton size="small" color="primary" onClick={() => openEdit(row)}>
                        <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(row)}>
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Stack>
            )
        }
    ];

    const isSaving = createMutation.isPending || updateMutation.isPending;

    return (
        <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
            {/* Header */}
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
                <Box>
                    <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: '1.3rem', sm: '1.5rem' } }}>Fee Discounts & Scholarships</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                        Create discount templates to apply percentage or flat-rate waivers to student fee accounts.
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} fullWidth={isMobile} sx={{ borderRadius: 2 }}>
                    Create Discount
                </Button>
            </Stack>

            {/* Summary chips */}
            {discounts.length > 0 && (
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} sx={{ mb: 3 }}>
                    <Chip label={`${discounts.length} Template${discounts.length !== 1 ? 's' : ''}`} color="primary" size="small" />
                    <Chip label={`${discounts.filter(d => d.discountType === 'percentage').length} Percentage`} variant="outlined" icon={<PercentIcon />} size="small" />
                    <Chip label={`${discounts.filter(d => d.discountType === 'flat').length} Flat Amount`} variant="outlined" icon={<CurrencyRupeeIcon />} size="small" />
                </Stack>
            )}

            <AppTable
                columns={columns}
                data={discounts}
                isLoading={isLoading}
                emptyMessage="No discount templates yet. Click 'Create Discount' to add your first template."
            />

            {/* Create / Edit Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
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
                <DialogTitle fontWeight={700}>
                    {editTarget ? 'Edit Discount Template' : 'Create Discount Template'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                label="Template Name"
                                fullWidth
                                required
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                error={!!formErrors.name}
                                helperText={formErrors.name || 'e.g. Merit Scholarship, Sibling Discount'}
                                placeholder="e.g. Merit Scholarship"
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <TextField
                                label="Description"
                                fullWidth
                                multiline
                                rows={2}
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                placeholder="Optional details about this discount"
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                select
                                label="Discount Type"
                                fullWidth
                                value={form.discountType}
                                onChange={e => setForm(f => ({ ...f, discountType: e.target.value as any }))}
                            >
                                <MenuItem value="percentage">Percentage (%)</MenuItem>
                                <MenuItem value="flat">Flat Amount (₹)</MenuItem>
                            </TextField>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label={form.discountType === 'percentage' ? 'Percentage Value' : 'Amount (₹)'}
                                fullWidth
                                required
                                type="number"
                                value={form.discountValue}
                                onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                                error={!!formErrors.discountValue}
                                helperText={formErrors.discountValue || (form.discountType === 'percentage' ? '0–100' : 'INR amount')}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            {form.discountType === 'percentage' ? '%' : '₹'}
                                        </InputAdornment>
                                    )
                                }}
                                inputProps={{ min: 0, max: form.discountType === 'percentage' ? 100 : undefined, step: 'any' }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <TextField
                                select
                                label="Applies To"
                                fullWidth
                                value={form.appliesTo}
                                onChange={e => setForm(f => ({ ...f, appliesTo: e.target.value as any, specificCategoryId: '' }))}
                            >
                                <MenuItem value="all_fees">All Fee Categories</MenuItem>
                                <MenuItem value="specific_category">Specific Category Only</MenuItem>
                            </TextField>
                        </Grid>

                        {form.appliesTo === 'specific_category' && (
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    select
                                    label="Target Category"
                                    fullWidth
                                    required
                                    value={form.specificCategoryId}
                                    onChange={e => setForm(f => ({ ...f, specificCategoryId: e.target.value }))}
                                    error={!!formErrors.specificCategoryId}
                                    helperText={formErrors.specificCategoryId}
                                >
                                    {categories.map((cat: any) => (
                                        <MenuItem key={cat.categoryId} value={cat.categoryId}>{cat.name}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                        )}
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setDialogOpen(false)} color="inherit" disabled={isSaving}>Cancel</Button>
                    <Button variant="contained" onClick={handleSubmit} disabled={isSaving}>
                        {isSaving ? 'Saving...' : editTarget ? 'Update' : 'Create Template'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast(t => ({ ...t, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity={toast.severity}>{toast.message}</Alert>
            </Snackbar>

            <ConfirmationDialog
                open={confirm.open}
                title={confirm.title}
                description={confirm.description}
                variant="danger"
                onClose={closeConfirm}
                onConfirm={confirm.onConfirm}
                isLoading={deleteMutation.isPending}
            />
        </Box>
    );
};

export default FeeDiscounts;
