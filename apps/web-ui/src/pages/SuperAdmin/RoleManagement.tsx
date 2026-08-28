import { useState } from "react";
import {
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  CircularProgress,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { AppInput } from "../../components/shared/AppInput";
import { AppSelect } from "../../components/shared/AppSelect";
import { AppButton } from "../../components/shared/AppButton";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import {
  useGetRoles,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  type Role,
} from "../../queries/Roles";
import { useNotificationStore } from "../../stores/notificationStore";
import { useRoleStore } from "../../stores/roleStore";
import ConfirmationDialog from "../../components/Dialogs/ConfirmationDialog";

const COLOR_OPTIONS: Role["colorTheme"][] = [
  "default",
  "primary",
  "secondary",
  "error",
  "info",
  "success",
  "warning",
];

const RoleManagement = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState<Partial<Role>>({
    roleCode: "",
    roleName: "",
    prefix: "",
    basePath: "",
    colorTheme: "primary",
    isActive: true,
    description: "",
  });

  const { data: rolesData, isLoading, refetch } = useGetRoles();
  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole();
  const deleteMutation = useDeleteRole();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  const { showNotification } = useNotificationStore();

  const handleOpenDialog = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setFormData(role);
    } else {
      setEditingRole(null);
      setFormData({
        roleCode: "",
        roleName: "",
        prefix: "",
        basePath: "",
        colorTheme: "primary",
        isActive: true,
        description: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingRole(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, isActive: e.target.checked }));
  };

  const handleSubmit = async () => {
    try {
      if (editingRole) {
        await updateMutation.mutateAsync({ id: editingRole._id, data: formData });
        showNotification("Role updated successfully", "success");
      } else {
        await createMutation.mutateAsync(formData);
        showNotification("Role created successfully", "success");
      }
      handleCloseDialog();
      refetch();
    } catch (error: any) {
      showNotification(error.message || "An error occurred", "error");
    }
  };

  const handleDelete = (id: string) => {
    setRoleToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteRole = async () => {
    if (!roleToDelete) return;
    try {
      await deleteMutation.mutateAsync({ id: roleToDelete });
      showNotification("Role deactivated successfully", "success");
      setDeleteConfirmOpen(false);
      setRoleToDelete(null);
      refetch();
    } catch (error: any) {
      showNotification(error.message || "An error occurred", "error");
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const roles = rolesData?.data || [];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Role Management</Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <AppButton
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              refetch();
              useRoleStore.getState().fetchRoles(true);
            }}
          >
            Refresh
          </AppButton>
          <AppButton
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Role
          </AppButton>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "background.default" }}>
              <TableCell sx={{ fontWeight: 700 }}>Role Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Prefix</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Base Path</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Theme</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role._id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>{role.roleName}</Typography>
                  <Typography variant="caption" color="text.secondary">{role.description}</Typography>
                </TableCell>
                <TableCell>
                  <Chip label={role.roleCode} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={700}>{role.prefix}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="primary">{role.basePath}</Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={role.colorTheme}
                    size="small"
                    color={role.colorTheme === "default" ? "secondary" : role.colorTheme}
                    sx={{ textTransform: "capitalize" }}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={role.isActive ? "Active" : "Inactive"}
                    size="small"
                    color={role.isActive ? "success" : "error"}
                  />
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Edit">
                    <IconButton color="primary" onClick={() => handleOpenDialog(role)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Deactivate">
                    <IconButton color="error" onClick={() => handleDelete(role._id)} disabled={!role.isActive}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Role Dialog */}
      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingRole ? "Edit Role" : "Add New Role"}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <AppInput
                name="roleName"
                label="Role Name"
                value={formData.roleName}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <AppInput
                name="roleCode"
                label="Role Code"
                value={formData.roleCode}
                onChange={handleInputChange}
                required
                disabled={!!editingRole}
                labelHint="Internal identifier (e.g., 'sch_admin')"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <AppInput
                name="prefix"
                label="Prefix"
                value={formData.prefix}
                onChange={handleInputChange}
                required
                labelHint="Order prefix (e.g., 'A')"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <AppInput
                name="basePath"
                label="Base Path"
                value={formData.basePath}
                onChange={handleInputChange}
                required
                labelHint="URL segment (e.g., '/school-admin')"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <AppSelect
                name="colorTheme"
                value={formData.colorTheme}
                label="Color Theme"
                onChange={handleInputChange as any}
                options={COLOR_OPTIONS.map((color) => ({
                  value: color,
                  label: color.charAt(0).toUpperCase() + color.slice(1),
                }))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ height: "100%", display: "flex", alignItems: "center" }}>
                <FormControlLabel
                  control={<Switch checked={formData.isActive} onChange={handleToggleChange} />}
                  label="Active"
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <AppInput
                name="description"
                label="Description"
                multiline
                rows={2}
                value={formData.description}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <AppButton onClick={handleCloseDialog}>Cancel</AppButton>
          <AppButton variant="contained" onClick={handleSubmit} loading={createMutation.isPending || updateMutation.isPending}>
            {editingRole ? "Save Changes" : "Create Role"}
          </AppButton>
        </DialogActions>
      </Dialog>

      <ConfirmationDialog
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setRoleToDelete(null);
        }}
        onConfirm={confirmDeleteRole}
        title="Deactivate Role"
        description="Are you sure you want to deactivate this role? Users with this role may lose their access permissions."
        confirmLabel="Deactivate Role"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </Box >
  );
};

export default RoleManagement;
