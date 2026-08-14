import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    IconButton,
    Typography,
    Divider,
    Box,
    Avatar,
    Chip,
} from '@mui/material';
import {
    Close as CloseIcon,
    AdminPanelSettings as PrincipalIcon,
} from '@mui/icons-material';
import {
    useCreatePrincipal,
    useUpdatePrincipal,
    type Principal,
    type CreatePrincipalPayload,
} from '../../queries/Principal';
import { useNotification } from '../../hooks/useNotification';
import { ImageUpload } from '../ImageUpload';
import { IMAGEKIT_FOLDERS } from '../../utils/imagekit';
import { AppInput } from '../shared/AppInput';
import { AppSelect } from '../shared/AppSelect';
import { AppButton } from '../shared/AppButton';
import { PhoneInput } from '../shared/PhoneInput';

interface PrincipalDialogProps {
    open: boolean;
    onClose: () => void;
    schoolId: string;
    editData?: Principal | null;
}

const PrincipalDialog: React.FC<PrincipalDialogProps> = ({
    open,
    onClose,
    schoolId,
    editData,
}) => {
    const isEditMode = !!editData;
    const notification = useNotification();

    const emptyForm: CreatePrincipalPayload = {
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        profileImage: '',
        status: 'active',
    };

    const [formData, setFormData] = useState<CreatePrincipalPayload>(emptyForm);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const createMutation = useCreatePrincipal(schoolId);
    const updateMutation = useUpdatePrincipal(schoolId);

    // Populate form when editing
    useEffect(() => {
        if (editData) {
            setFormData({
                firstName: editData.firstName || '',
                lastName: editData.lastName || '',
                email: editData.email || '',
                password: '',
                phone: editData.phone || '',
                profileImage: editData.profileImage || '',
                status: editData.status || 'active',
            });
        } else {
            setFormData(emptyForm);
        }
        setErrors({});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editData, open]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name as string]: value }));
        if (errors[name as string]) setErrors((prev) => ({ ...prev, [name as string]: '' }));
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }
        if (!isEditMode && !formData.password.trim()) {
            newErrors.password = 'Password is required for new account';
        } else if (formData.password && formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        try {
            if (isEditMode && editData) {
                const payload: Record<string, unknown> = { ...formData };
                if (!formData.password) delete payload.password;
                await updateMutation.mutateAsync({
                    principalId: editData.principalId,
                    data: payload as any,
                });
                notification.success('Principal updated successfully');
            } else {
                await createMutation.mutateAsync(formData);
                notification.success('Principal account created successfully');
            }
            handleClose();
        } catch {
            notification.error('Operation failed. Please try again.');
        }
    };

    const handleClose = () => {
        setFormData(emptyForm);
        setErrors({});
        createMutation.reset();
        updateMutation.reset();
        onClose();
    };

    const isPending = createMutation.isPending || updateMutation.isPending;
    const isError = createMutation.isError || updateMutation.isError;
    const errorMessage =
        (createMutation.error as { message?: string })?.message ||
        (updateMutation.error as { message?: string })?.message ||
        'Operation failed';

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar
                        sx={{
                            background: 'linear-gradient(135deg, #6a11cb, #2575fc)',
                            width: 36,
                            height: 36,
                        }}
                    >
                        <PrincipalIcon sx={{ fontSize: 20 }} />
                    </Avatar>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                            {isEditMode ? 'Edit Principal' : 'Register Principal'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {isEditMode ? 'Update principal account details' : 'Create the school principal account'}
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={handleClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent>
                    {!isEditMode && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            <Typography variant="body2" fontWeight={600} gutterBottom>
                                One Principal Per School
                            </Typography>
                            <Typography variant="body2">
                                Each school can have only one active principal. Creating a new one will replace the current principal account.
                            </Typography>
                        </Alert>
                    )}

                    {isError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {errorMessage}
                        </Alert>
                    )}

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        {/* ── Profile Image ── */}
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <ImageUpload
                                folder={IMAGEKIT_FOLDERS.PROFILE_IMAGES}
                                fileName={
                                    isEditMode && editData
                                        ? `${editData.principalId}_profile`
                                        : `new_principal_profile_${Date.now()}`
                                }
                                currentImage={formData.profileImage}
                                label="Profile Photo"
                                authEndpoint="school"
                                variant="avatar"
                                size="large"
                                onUploadSuccess={(result) =>
                                    setFormData((prev) => ({ ...prev, profileImage: result.url }))
                                }
                                onRemove={() => setFormData((prev) => ({ ...prev, profileImage: '' }))}
                            />
                        </Box>

                        <Divider>
                            <Chip label="Personal Information" size="small" />
                        </Divider>

                        {/* ── Name ── */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <AppInput
                                name="firstName"
                                label="First Name"
                                value={formData.firstName}
                                onChange={handleChange}
                                error={!!errors.firstName}
                                helperText={errors.firstName}
                                required
                            />
                            <AppInput
                                name="lastName"
                                label="Last Name"
                                value={formData.lastName}
                                onChange={handleChange}
                                error={!!errors.lastName}
                                helperText={errors.lastName}
                                required
                            />
                        </Box>

                        {/* ── Email ── */}
                        <AppInput
                            name="email"
                            label="Email Address"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            error={!!errors.email}
                            helperText={errors.email}
                            required
                            disabled={isEditMode} // email shouldn't change (login credential)
                        />

                        {/* ── Password + Phone ── */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <AppInput
                                name="password"
                                label="Password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                error={!!errors.password}
                                helperText={errors.password}
                                required={!isEditMode}
                                labelHint={isEditMode ? 'Leave blank to keep current' : ''}
                            />
                            <PhoneInput
                                name="phone"
                                label="Phone"
                                value={formData.phone || ''}
                                onChange={handleChange}
                            />
                        </Box>

                        <Divider>
                            <Chip label="Account Status" size="small" />
                        </Divider>

                        <AppSelect
                            label="Account Status"
                            value={formData.status || 'active'}
                            options={[
                                { value: 'active', label: 'Active' },
                                { value: 'inactive', label: 'Inactive' },
                            ]}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    status: e.target.value as 'active' | 'inactive',
                                }))
                            }
                        />
                    </Box>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <AppButton onClick={handleClose} variant="text" color="inherit">
                        Cancel
                    </AppButton>
                    <AppButton type="submit" variant="contained" loading={isPending}>
                        {isEditMode ? 'Save Changes' : 'Create Principal Account'}
                    </AppButton>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default PrincipalDialog;
