import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import {
  Close as CloseIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
} from "@mui/icons-material";
import { useUpdateMenu } from "../../queries/Menus";
import { useRoleStore } from "../../stores/roleStore";
import type { Menu } from "../../types";
import { AppButton } from "../shared/AppButton";

interface ManageMenuAccessDialogProps {
  open: boolean;
  onClose: () => void;
  menu: Menu | null;
  mode: "roles" | "schools";
  schools?: Array<{ schoolId: string; schoolName: string; status?: string }>;
  onSuccess?: (message: string) => void;
}

// ROLE_LABELS is now handled dynamically via useRoleStore

const ManageMenuAccessDialog: React.FC<ManageMenuAccessDialogProps> = ({
  open,
  onClose,
  menu,
  mode,
  schools = [],
  onSuccess,
}) => {
  const updateMutation = useUpdateMenu();
  const [loadingItem, setLoadingItem] = useState<string | null>(null);

  // Local states for instant feedback
  const [localDeactivatedRoles, setLocalDeactivatedRoles] = useState<string[]>(
    [],
  );
  const [localDeactivatedSchools, setLocalDeactivatedSchools] = useState<
    string[]
  >([]);

  // Sync local state when menu prop changes and fetch latest roles
  React.useEffect(() => {
    if (open) {
      useRoleStore.getState().fetchRoles(true);
    }
    if (menu) {
      setLocalDeactivatedRoles(menu.deactivatedRoles || []);
      setLocalDeactivatedSchools(menu.deactivatedSchools || []);
    }
  }, [open, menu]);

  if (!menu) return null;

  const handleToggleRole = async (role: string) => {
    const isCurrentlyDeactivated = localDeactivatedRoles.includes(role);
    const newDeactivated = isCurrentlyDeactivated
      ? localDeactivatedRoles.filter((r) => r !== role)
      : [...localDeactivatedRoles, role];

    // Optimistic local update
    setLocalDeactivatedRoles(newDeactivated);
    setLoadingItem(role);

    try {
      const res = await updateMutation.mutateAsync({
        menuId: menu.menuId,
        data: { deactivatedRoles: newDeactivated },
      });
      onSuccess?.(res.message);
    } catch (err: any) {
      // Revert local state on error
      setLocalDeactivatedRoles(localDeactivatedRoles);
      console.error("Failed to toggle role:", err);
    } finally {
      setLoadingItem(null);
    }
  };

  const handleToggleSchool = async (schoolId: string) => {
    const isCurrentlyDeactivated = localDeactivatedSchools.includes(schoolId);
    const newDeactivated = isCurrentlyDeactivated
      ? localDeactivatedSchools.filter((s) => s !== schoolId)
      : [...localDeactivatedSchools, schoolId];

    // Optimistic local update
    setLocalDeactivatedSchools(newDeactivated);
    setLoadingItem(schoolId);

    try {
      const res = await updateMutation.mutateAsync({
        menuId: menu.menuId,
        data: { deactivatedSchools: newDeactivated },
      });
      onSuccess?.(res.message);
    } catch (err: any) {
      // Revert local state on error
      setLocalDeactivatedSchools(localDeactivatedSchools);
      console.error("Failed to toggle school:", err);
    } finally {
      setLoadingItem(null);
    }
  };

  // Build rows based on mode
  const roles = Array.isArray(menu.menuAccessRoles)
    ? menu.menuAccessRoles
    : menu.menuAccessRoles
      ? [menu.menuAccessRoles]
      : [];
  const menuSchoolIds = Array.isArray(menu.schoolId)
    ? menu.schoolId
    : menu.schoolId
      ? [menu.schoolId]
      : [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 1.5 } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="h6" component="span">
            Manage {mode === "roles" ? "Roles" : "Schools"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {menu.menuName}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                {mode === "schools" && (
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    School Status
                  </TableCell>
                )}
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {mode === "schools" ? "Menu Access" : "Status"}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mode === "roles" ? (
                roles.length > 0 ? (
                  roles.map((role: string) => {
                    const isDeactivated = localDeactivatedRoles.includes(role);
                    const isLoading = loadingItem === role;

                    return (
                      <TableRow key={role} hover>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {role}
                          </Typography>
                        </TableCell>
                        <TableCell>{useRoleStore.getState().getRoleByCode(role)?.roleName || role}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={isDeactivated ? "Inactive" : "Active"}
                            size="small"
                            color={isDeactivated ? "default" : "success"}
                            variant={isDeactivated ? "outlined" : "filled"}
                            sx={{ minWidth: 75 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => handleToggleRole(role)}
                            disabled={isLoading}
                            color={isDeactivated ? "success" : "error"}
                          >
                            {isLoading ? (
                              <CircularProgress size={20} />
                            ) : isDeactivated ? (
                              <ToggleOffIcon />
                            ) : (
                              <ToggleOnIcon />
                            )}
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No roles assigned
                      </Typography>
                    </TableCell>
                  </TableRow>
                )
              ) : menuSchoolIds.length > 0 ? (
                menuSchoolIds.map((id: string) => {
                  const school = schools.find((s) => s.schoolId === id);
                  const isDeactivated = localDeactivatedSchools.includes(id);
                  const isLoading = loadingItem === id;
                  const schoolIsInactive = school?.status === "inactive";

                  return (
                    <TableRow key={id} hover>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {id}
                        </Typography>
                      </TableCell>
                      <TableCell>{school?.schoolName || id}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={schoolIsInactive ? "Inactive" : "Active"}
                          size="small"
                          color={schoolIsInactive ? "error" : "success"}
                          variant="filled"
                          sx={{ minWidth: 75 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={isDeactivated ? "Disabled" : "Enabled"}
                          size="small"
                          color={isDeactivated ? "default" : "info"}
                          variant={isDeactivated ? "outlined" : "filled"}
                          sx={{ minWidth: 75 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleToggleSchool(id)}
                          disabled={isLoading}
                          color={isDeactivated ? "success" : "error"}
                        >
                          {isLoading ? (
                            <CircularProgress size={20} />
                          ) : isDeactivated ? (
                            <ToggleOffIcon />
                          ) : (
                            <ToggleOnIcon />
                          )}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No schools assigned
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <AppButton onClick={onClose} variant="outlined" color="inherit">
          Close
        </AppButton>
      </DialogActions>
    </Dialog>
  );
};

export default ManageMenuAccessDialog;
