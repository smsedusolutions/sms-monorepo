// apps/web-ui/src/pages/SchoolAdmin/Fees/Categories/index.tsx

import React, { useState, useCallback } from 'react';
import ConfirmationDialog from '../../../../components/Dialogs/ConfirmationDialog';
import {
    Box,
    Typography,
    Button,
    TextField,
    Chip,
    Stack,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Checkbox,
    FormControlLabel,
    MenuItem,
    Snackbar,
    Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import TokenService from '../../../../queries/token/tokenService';
import {
    useGetFeeCategories,
    useCreateFeeCategory,
    useUpdateFeeCategory,
    useToggleFeeCategory,
    useDeleteFeeCategory
} from '../../../../queries/Fee';
import { AppTable } from '../../../../components/shared/AppTable';
import { useForm, Controller } from 'react-hook-form';
import { useIsMobile } from '../../../../hooks/useIsMobile';
import type { FeeCategory } from '../../../../types/fee.types';

const CATEGORY_TYPES = [
    { value: 'tuition', label: 'Tuition Fee' },
    { value: 'admission', label: 'Admission Fee' },
    { value: 'transport', label: 'Transport Fee' },
    { value: 'books', label: 'Books & Stationery' },
    { value: 'uniform', label: 'Uniform Fee' },
    { value: 'sports', label: 'Sports & Cultural' },
    { value: 'examination', label: 'Examination Fee' },
    { value: 'other', label: 'Other Miscellaneous' }
];

const FeeCategories: React.FC = () => {
    const isMobile = useIsMobile();
    const schoolId = TokenService.getSchoolId() || '';
    const [searchTerm, setSearchTerm] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [editCategory, setEditCategory] = useState<FeeCategory | null>(null);

    // Confirmation dialog state
    const [confirm, setConfirm] = useState<{
        open: boolean;
        title: string;
        description: string;
        onConfirm: () => void;
    }>({ open: false, title: '', description: '', onConfirm: () => {} });

    const closeConfirm = useCallback(() => setConfirm(c => ({ ...c, open: false })), []);

    const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success'
    });

    const showToast = (message: string, severity: 'success' | 'error') => {
        setToast({ open: true, message, severity });
    };

    const { data: categoriesData, isLoading } = useGetFeeCategories(schoolId, { search: searchTerm });
    const createMutation = useCreateFeeCategory(schoolId);
    const updateMutation = useUpdateFeeCategory(schoolId);
    const toggleMutation = useToggleFeeCategory(schoolId);
    const deleteMutation = useDeleteFeeCategory(schoolId);

    const categories = categoriesData?.data || [];

    // React Hook Form
    const { control, handleSubmit, reset } = useForm({
        defaultValues: {
            name: '',
            categoryType: 'tuition',
            isRecurring: true,
            isMandatory: true,
            description: ''
        }
    });

    const handleCreate = () => {
        setEditCategory(null);
        reset({
            name: '',
            categoryType: 'tuition',
            isRecurring: true,
            isMandatory: true,
            description: ''
        });
        setOpenDialog(true);
    };

    const handleEdit = (category: FeeCategory) => {
        setEditCategory(category);
        reset({
            name: category.name,
            categoryType: category.categoryType,
            isRecurring: category.isRecurring,
            isMandatory: category.isMandatory,
            description: category.description || ''
        });
        setOpenDialog(true);
    };

    const onSubmit = (formData: any) => {
        if (editCategory) {
            updateMutation.mutate(
                { categoryId: editCategory.feeCategoryId, data: formData },
                {
                    onSuccess: () => {
                        showToast('Category updated successfully', 'success');
                        setOpenDialog(false);
                    },
                    onError: (err: any) => {
                        showToast(err.message || 'Failed to update category', 'error');
                    }
                }
            );
        } else {
            createMutation.mutate(formData, {
                onSuccess: () => {
                    showToast('Category created successfully', 'success');
                    setOpenDialog(false);
                },
                onError: (err: any) => {
                    showToast(err.message || 'Failed to create category', 'error');
                }
            });
        }
    };

    const handleToggle = (category: FeeCategory) => {
        toggleMutation.mutate(category.feeCategoryId, {
            onSuccess: () => {
                showToast('Status toggled successfully', 'success');
            },
            onError: (err: any) => {
                showToast(err.message || 'Failed to toggle status', 'error');
            }
        });
    };

    const handleDelete = (category: FeeCategory) => {
        setConfirm({
            open: true,
            title: 'Delete Fee Category',
            description: `Are you sure you want to delete category "${category.name}"? This action cannot be undone.`,
            onConfirm: () => {
                closeConfirm();
                deleteMutation.mutate(category.feeCategoryId, {
                    onSuccess: () => showToast('Category soft deleted successfully', 'success'),
                    onError: (err: any) => showToast(err.message || 'Failed to delete category', 'error')
                });
            }
        });
    };

    const columns = [
        {
            name: 'Category Name',
            selector: (row: FeeCategory) => row.name,
            cell: (row: FeeCategory) => <Typography variant="body2" fontWeight={600}>{row.name}</Typography>,
            sortable: true
        },
        {
            name: 'Type',
            selector: (row: FeeCategory) => row.categoryType?.toUpperCase(),
            sortable: true
        },
        {
            name: 'Recurring',
            selector: (row: FeeCategory) => row.isRecurring,
            cell: (row: FeeCategory) => <Chip label={row.isRecurring ? 'Recurring' : 'One-time'} size="small" variant="outlined" color={row.isRecurring ? 'primary' : 'default'} />
        },
        {
            name: 'Mandatory',
            selector: (row: FeeCategory) => row.isMandatory,
            cell: (row: FeeCategory) => <Chip label={row.isMandatory ? 'Mandatory' : 'Optional'} size="small" variant="outlined" color={row.isMandatory ? 'secondary' : 'default'} />
        },
        {
            name: 'Status',
            selector: (row: FeeCategory) => row.isActive ? 'active' : 'inactive',
            cell: (row: FeeCategory) => <Chip label={row.isActive ? 'ACTIVE' : 'INACTIVE'} color={row.isActive ? 'success' : 'default'} size="small" />
        },
        {
            name: 'Actions',
            cell: (row: FeeCategory) => (
                <Stack direction="row" spacing={1}>
                    <IconButton size="small" color="primary" onClick={() => handleEdit(row)}>
                        <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="secondary" onClick={() => handleToggle(row)}>
                        <ToggleOnIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(row)}>
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Stack>
            )
        }
    ];

    return (
        <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, mb: 3, gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight={700} color="text.primary" sx={{ fontSize: { xs: '1.4rem', sm: '2rem' } }}>
                        Fee Categories
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                        Configure school fee ledger items like Tuition, Examination, Transport, and Uniform Dues.
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate} fullWidth={isMobile} sx={{ borderRadius: 2 }}>
                    Create Category
                </Button>
            </Box>

            <Box sx={{ mb: 2 }}>
                <TextField
                    size="small"
                    placeholder="Search categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ width: { xs: '100%', sm: 300 } }}
                />
            </Box>

            <AppTable
                columns={columns}
                data={categories}
                isLoading={isLoading}
                emptyMessage="No fee categories found."
            />

            {/* Create/Edit Category Dialog */}
            <Dialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                fullWidth
                maxWidth="xs"
                fullScreen={isMobile}
                PaperProps={{
                    sx: {
                        borderRadius: isMobile ? 0 : 3,
                        maxHeight: isMobile ? '100dvh' : '90vh',
                    }
                }}
            >
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogTitle fontWeight={700}>{editCategory ? 'Edit Category' : 'Create Category'}</DialogTitle>
                    <DialogContent dividers>
                        <Stack spacing={2.5} sx={{ mt: 1 }}>
                            <Controller
                                name="name"
                                control={control}
                                rules={{ required: 'Category name is required' }}
                                render={({ field, fieldState }: any) => (
                                    <TextField
                                        {...field}
                                        label="Category Name"
                                        fullWidth
                                        error={!!fieldState.error}
                                        helperText={fieldState.error?.message}
                                    />
                                )}
                            />

                            <Controller
                                name="categoryType"
                                control={control}
                                render={({ field }: any) => (
                                    <TextField {...field} select label="Category Type" fullWidth>
                                        {CATEGORY_TYPES.map(opt => (
                                            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                        ))}
                                    </TextField>
                                )}
                            />

                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 2 }}>
                                <Controller
                                    name="isRecurring"
                                    control={control}
                                    render={({ field }: any) => (
                                        <FormControlLabel
                                            control={<Checkbox checked={field.value} onChange={field.onChange} />}
                                            label="Is Recurring (monthly/term)"
                                        />
                                    )}
                                />

                                <Controller
                                    name="isMandatory"
                                    control={control}
                                    render={({ field }: any) => (
                                        <FormControlLabel
                                            control={<Checkbox checked={field.value} onChange={field.onChange} />}
                                            label="Is Mandatory"
                                        />
                                    )}
                                />
                            </Stack>

                            <Controller
                                name="description"
                                control={control}
                                render={({ field }: any) => (
                                    <TextField
                                        {...field}
                                        label="Description"
                                        multiline
                                        rows={3}
                                        fullWidth
                                        placeholder="Optional category description notes..."
                                    />
                                )}
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                        <Button type="submit" variant="contained" color="primary">Save Category</Button>
                    </DialogActions>
                </form>
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

export default FeeCategories;
