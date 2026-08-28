import React, { useState, useEffect } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    Button, Grid, MenuItem, Typography, Box, Divider
} from '@mui/material';
import { AppInput } from '../shared/AppInput';
import { AppSelect } from '../shared/AppSelect';
import { AppDatePicker } from '../shared/AppDatePicker';
import { PhoneInput } from '../shared/PhoneInput';
import { useNotification } from '../../hooks/useNotification';
import { useCreateDriver, useUpdateDriver } from '../../queries/transport';

interface AddDriverDialogProps {
    open: boolean;
    onClose: () => void;
    schoolId: string;
    editData?: any;
}

const AddDriverDialog: React.FC<AddDriverDialogProps> = ({ open, onClose, schoolId, editData }) => {
    const notification = useNotification();
    const createMutation = useCreateDriver(schoolId);
    const updateMutation = useUpdateDriver(schoolId);

    const [formData, setFormData] = useState<any>({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        gender: '',
        dateOfBirth: null,
        licenseNumber: '',
        licenseExpiry: null,
        status: 'active'
    });

    useEffect(() => {
        if (editData) {
            setFormData({
                ...editData,
                gender: editData.gender || '',
                dateOfBirth: editData.dateOfBirth ? new Date(editData.dateOfBirth) : null,
                licenseExpiry: editData.licenseExpiry ? new Date(editData.licenseExpiry) : null,
                password: '' // Don't show password on edit
            });
        } else {
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                phone: '',
                gender: '',
                dateOfBirth: null,
                licenseNumber: '',
                licenseExpiry: null,
                status: 'active'
            });
        }
    }, [editData, open]);

    const handleSave = async () => {
        try {
            // Validation
            if (!formData.firstName || !formData.lastName || !formData.email || (!editData && !formData.password)) {
                notification.error("Please fill in all required fields (Name, Email, Password)");
                return;
            }

            const payload = {
                ...formData,
                gender: formData.gender || undefined,
                dateOfBirth: formData.dateOfBirth ? formData.dateOfBirth.toISOString() : undefined,
                licenseExpiry: formData.licenseExpiry?.toISOString()
            };

            if (editData) {
                // Remove password if not changed
                if (!payload.password) delete payload.password;
                await updateMutation.mutateAsync({ id: editData.driverId, data: payload });
                notification.success("Driver updated successfully");
            } else {
                await createMutation.mutateAsync(payload);
                notification.success("Driver created successfully. They can now log in.");
            }
            onClose();
        } catch (err: any) {
            notification.error(err?.message || "Failed to save driver");
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
            <DialogTitle sx={{ fontWeight: 800, fontSize: '1.5rem' }}>
                {editData ? 'Edit Driver' : 'Add New Driver'}
                <Typography variant="body2" color="textSecondary">
                    Create login credentials and driver information.
                </Typography>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    <Typography variant="overline" sx={{ fontWeight: 700, color: 'primary.main', mb: 2, display: 'block' }}>
                        Account Credentials & Personal Info
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <AppInput 
                                label="First Name" 
                                required
                                value={formData.firstName} 
                                onChange={(e) => setFormData({...formData, firstName: e.target.value})} 
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <AppInput 
                                label="Last Name" 
                                required
                                value={formData.lastName} 
                                onChange={(e) => setFormData({...formData, lastName: e.target.value})} 
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <AppInput 
                                label="Email" 
                                required
                                placeholder="driver@school.com"
                                value={formData.email} 
                                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                            />
                        </Grid>
                        {!editData && (
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <AppInput 
                                    label="Initial Password" 
                                    required
                                    type="password"
                                    placeholder="Minimum 6 characters"
                                    value={formData.password} 
                                    onChange={(e) => setFormData({...formData, password: e.target.value})} 
                                />
                            </Grid>
                        )}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <PhoneInput 
                                label="Phone Number" 
                                value={formData.phone} 
                                onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <AppSelect
                                label="Gender"
                                value={formData.gender || ''}
                                options={[
                                    { value: 'male', label: 'Male' },
                                    { value: 'female', label: 'Female' },
                                    { value: 'other', label: 'Other' },
                                ]}
                                onChange={(e) => setFormData({...formData, gender: e.target.value})}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <AppDatePicker
                                label="Date of Birth"
                                value={formData.dateOfBirth}
                                onChange={(val) => setFormData({...formData, dateOfBirth: val})}
                            />
                        </Grid>
                    </Grid>

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="overline" sx={{ fontWeight: 700, color: 'primary.main', mb: 2, display: 'block' }}>
                        Logistic Information
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <AppInput 
                                label="License Number" 
                                required
                                placeholder="e.g. DL-1234567890"
                                value={formData.licenseNumber} 
                                onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})} 
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <AppDatePicker 
                                label="License Expiry" 
                                value={formData.licenseExpiry} 
                                onChange={(val) => setFormData({...formData, licenseExpiry: val})} 
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <AppInput 
                                label="Account Status" 
                                select
                                value={formData.status} 
                                onChange={(e) => setFormData({...formData, status: e.target.value})}
                            >
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="inactive">Inactive</MenuItem>
                                <MenuItem value="suspended">Suspended</MenuItem>
                            </AppInput>
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, gap: 1 }}>
                <Button onClick={onClose} sx={{ color: 'text.secondary', fontWeight: 600 }}>Cancel</Button>
                <Button 
                    variant="contained" 
                    onClick={handleSave}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    sx={{ borderRadius: '12px', px: 4, py: 1, fontWeight: 700, textTransform: 'none' }}
                >
                    {editData ? 'Update Driver' : 'Add Driver'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddDriverDialog;
