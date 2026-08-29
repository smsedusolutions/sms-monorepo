import React, { useState } from 'react';
import { 
    Box, Typography, Button, Dialog, 
    DialogTitle, DialogContent, DialogActions, 
    Grid, MenuItem, IconButton, Tooltip
} from '@mui/material';
import { 
    Edit as EditIcon, 
    Delete as DeleteIcon,
    BusAlert as BusIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import TokenService from '../../../queries/token/tokenService';
import { 
    useGetVehicles, 
    useCreateVehicle, 
    useUpdateVehicle, 
    useDeleteVehicle 
} from '../../../queries/transport';
import { AppInput } from '../../../components/shared/AppInput';
import { AppDatePicker } from '../../../components/shared/AppDatePicker';
import DataTable, { type Column } from '../../../components/Table/DataTable';
import { useNotification } from '../../../hooks/useNotification';
import ConfirmationDialog from '../../../components/Dialogs/ConfirmationDialog';

const VehicleManagement: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);
    const [formData, setFormData] = useState<any>({
        name: '', plateNumber: '', model: '', make: '', 
        capacity: 40, insuranceExpiry: null, registrationExpiry: null, 
        status: 'active'
    });

    const schoolId = TokenService.getSchoolId() || '';
    const notification = useNotification();

    const { data: vehiclesRes, isLoading } = useGetVehicles(schoolId);
    const vehicles = vehiclesRes?.data || [];

    const createMutation = useCreateVehicle(schoolId);
    const updateMutation = useUpdateVehicle(schoolId);
    const deleteMutation = useDeleteVehicle(schoolId);

    const handleOpen = (vehicle: any = null) => {
        if (vehicle) {
            setEditMode(true);
            setSelectedVehicle(vehicle);
            setFormData({
                ...vehicle,
                insuranceExpiry: vehicle.insuranceExpiry ? new Date(vehicle.insuranceExpiry) : null,
                registrationExpiry: vehicle.registrationExpiry ? new Date(vehicle.registrationExpiry) : null
            });
        } else {
            setEditMode(false);
            setFormData({
                name: '', plateNumber: '', model: '', make: '', 
                capacity: 40, insuranceExpiry: null, registrationExpiry: null, 
                status: 'active'
            });
        }
        setOpen(true);
    };

    const handleSave = async () => {
        try {
            const payload = {
                ...formData,
                insuranceExpiry: formData.insuranceExpiry?.toISOString(),
                registrationExpiry: formData.registrationExpiry?.toISOString()
            };

            if (editMode) {
                await updateMutation.mutateAsync({ id: selectedVehicle.vehicleId, data: payload });
                notification.success("Vehicle updated successfully");
            } else {
                await createMutation.mutateAsync(payload);
                notification.success("Vehicle added successfully");
            }
            setOpen(false);
        } catch (err: any) {
            notification.error(err?.message || "Failed to save vehicle");
        }
    };

    const handleDelete = (id: string) => {
        setVehicleToDelete(id);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!vehicleToDelete) return;
        try {
            await deleteMutation.mutateAsync(vehicleToDelete);
            notification.success("Vehicle deleted successfully");
            setDeleteConfirmOpen(false);
            setVehicleToDelete(null);
        } catch (err: any) {
            notification.error(err?.message || "Failed to delete vehicle");
        }
    };

    const isExpiringSoon = (dateStr: any) => {
        if (!dateStr) return false;
        const expiry = new Date(dateStr);
        const diff = (expiry.getTime() - new Date().getTime()) / (1000 * 3600 * 24);
        return diff < 15;
    };

    const columns: Column<any>[] = [
        {
            id: 'name',
            label: 'Vehicle Details',
            minWidth: 250,
            format: (_, row) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
                    <Box sx={{ p: 1, borderRadius: '12px', bgcolor: 'primary.light', color: 'primary.main', display: 'flex' }}>
                        <BusIcon />
                    </Box>
                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{row.name}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{row.make} {row.model}</Typography>
                    </Box>
                </Box>
            )
        },
        { id: 'plateNumber', label: 'Plate Number', minWidth: 150 },
        { id: 'capacity', label: 'Capacity', minWidth: 120, format: (val) => `${val} Seats` },
        {
            id: 'status',
            label: 'Status',
            minWidth: 120,
            format: (val) => (
                <Box
                    sx={{
                        px: 1.5, py: 0.5, borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700,
                        display: 'inline-block', textTransform: 'capitalize',
                        bgcolor: val === 'active' ? 'success.light' : val === 'maintenance' ? 'warning.light' : 'error.light',
                        color: val === 'active' ? 'success.main' : val === 'maintenance' ? 'warning.dark' : 'error.main'
                    }}
                >
                    {val}
                </Box>
            )
        },
        {
            id: 'insuranceExpiry',
            label: 'Insurance',
            minWidth: 180,
            format: (val) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">{val ? new Date(val).toLocaleDateString() : 'N/A'}</Typography>
                    {isExpiringSoon(val) && (
                        <Tooltip title="Expiring Soon!">
                            <WarningIcon sx={{ color: 'warning.main', fontSize: '1rem' }} />
                        </Tooltip>
                    )}
                </Box>
            )
        },
        {
            id: 'registrationExpiry',
            label: 'Registration',
            minWidth: 180,
            format: (val) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">{val ? new Date(val).toLocaleDateString() : 'N/A'}</Typography>
                    {isExpiringSoon(val) && (
                        <Tooltip title="Expiring Soon!">
                            <WarningIcon sx={{ color: 'error.main', fontSize: '1rem' }} />
                        </Tooltip>
                    )}
                </Box>
            )
        },
        {
            id: 'actions',
            label: 'Actions',
            minWidth: 120,
            align: 'right',
            format: (_, row) => (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleOpen(row)} color="primary"><EditIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDelete(row.vehicleId)} color="error"><DeleteIcon fontSize="small" /></IconButton>
                    </Tooltip>
                </Box>
            )
        }
    ];

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <DataTable
                title="Vehicle Fleet Management"
                columns={columns}
                data={vehicles}
                isLoading={isLoading}
                onAddClick={() => handleOpen()}
                addButtonLabel="Add New Vehicle"
                emptyMessage="No vehicles found. Start by adding one."
                renderHeaderActions={() => (
                     <Typography variant="body2" sx={{ color: 'text.secondary', ml: 1 }}>
                        Manage school buses, insurance, and maintenance records.
                    </Typography>
                )}
            />

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
                <DialogTitle sx={{ fontWeight: 800, fontSize: '1.5rem', pb: 1 }}>
                    {editMode ? 'Edit Vehicle' : 'Add New Vehicle'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <AppInput 
                                label="Vehicle Name" 
                                placeholder="e.g. Bus 1" 
                                value={formData.name} 
                                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <AppInput 
                                label="Plate Number" 
                                placeholder="e.g. KA05LS7929" 
                                value={formData.plateNumber} 
                                onChange={(e) => setFormData({...formData, plateNumber: e.target.value})} 
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <AppInput 
                                label="Make" 
                                placeholder="e.g. Ashok Leyland" 
                                value={formData.make} 
                                onChange={(e) => setFormData({...formData, make: e.target.value})} 
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <AppInput 
                                label="Model" 
                                placeholder="e.g. S34" 
                                value={formData.model} 
                                onChange={(e) => setFormData({...formData, model: e.target.value})} 
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <AppDatePicker 
                                label="Insurance Expiry" 
                                value={formData.insuranceExpiry} 
                                onChange={(val) => setFormData({...formData, insuranceExpiry: val})} 
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <AppDatePicker 
                                label="Registration Expiry" 
                                value={formData.registrationExpiry} 
                                onChange={(val) => setFormData({...formData, registrationExpiry: val})} 
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <AppInput 
                                label="Status" 
                                select 
                                value={formData.status} 
                                onChange={(e) => setFormData({...formData, status: e.target.value})}
                            >
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="maintenance">Maintenance</MenuItem>
                                <MenuItem value="inactive">Inactive</MenuItem>
                            </AppInput>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <AppInput 
                                label="Capacity" 
                                type="number" 
                                value={formData.capacity} 
                                onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})} 
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3, gap: 1 }}>
                    <Button onClick={() => setOpen(false)} sx={{ color: 'text.secondary', fontWeight: 600 }}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleSave} 
                        disabled={createMutation.isPending || updateMutation.isPending}
                        sx={{ borderRadius: '12px', px: 4, py: 1, fontWeight: 700, textTransform: 'none' }}
                    >
                        {editMode ? 'Update Vehicle' : 'Add Vehicle'}
                    </Button>
                </DialogActions>
            </Dialog>

            <ConfirmationDialog
                open={deleteConfirmOpen}
                onClose={() => {
                    setDeleteConfirmOpen(false);
                    setVehicleToDelete(null);
                }}
                onConfirm={confirmDelete}
                title="Delete Vehicle"
                description="Are you sure you want to delete this vehicle? This action cannot be undone."
                confirmLabel="Delete Vehicle"
                variant="danger"
                isLoading={deleteMutation.isPending}
            />
        </Box>
    );
};

export default VehicleManagement;
