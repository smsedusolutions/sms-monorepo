import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  IconButton,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Checkbox,
  ListItemText,
  Chip,
  Box,
  OutlinedInput,
  InputAdornment,
  Autocomplete,
  Typography,
  Divider,
  Switch,
} from "@mui/material";
import { Close as CloseIcon, Apps as AppsIcon, SelectAll as SelectAllIcon, SyncAlt as SyncAltIcon } from "@mui/icons-material";
import { useNotification } from "../../hooks/useNotification";
import { useCreateMenu, useSearchParentMenus, useUpdateMenu } from "../../queries/Menus";
import { useGetSchools } from "../../queries/School";
import { useRoleStore } from "../../stores/roleStore";
import type { CreateMenuPayload, Menu } from "../../types";
import IconPickerDialog from "./IconPickerDialog";
import { AppInput } from "../shared/AppInput";
import { AppSelect } from "../shared/AppSelect";
import { AppButton } from "../shared/AppButton";

interface AddMenusDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  menuToEdit?: Menu;
}

const AddMenusDialog: React.FC<AddMenusDialogProps> = ({
  open,
  onClose,
  onSuccess,
  menuToEdit,
}) => {
  const notification = useNotification();
  const [formData, setFormData] = useState<CreateMenuPayload>({
    schoolId: [],
    menuName: "",
    menuUrl: "",
    menuIcon: "",
    menuAccessRoles: [],
    hasSubmenu: false,
    parentMenuId: "",
    menuType: "main",
    status: "active",
    menuOrder: "", // string | number, initializing as empty string for auto-gen
    deactivatedRoles: [],
    defaultMenu: true,
    showInSidebar: true,
  });

  const [menuType, setMenuType] = useState<"main" | "sub">("main");
  const [activeOrderPrefix, setActiveOrderPrefix] = useState("SA"); // To manage which order prefix is currently being edited
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [iconPickerOpen, setIconPickerOpen] = useState(false);

  const createMutation = useCreateMenu();
  const updateMutation = useUpdateMenu();
  const { data: schoolsData, isLoading: isLoadingSchools } = useGetSchools();

  // ── Debounced parent menu search ───────────────────────────────────────
  const [parentSearchInput, setParentSearchInput] = useState("");
  const [parentSearchDebounced, setParentSearchDebounced] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setParentSearchDebounced(parentSearchInput);
    }, 350);
    return () => clearTimeout(timer);
  }, [parentSearchInput]);

  const {
    data: parentMenusData,
    isLoading: isLoadingParentMenus,
  } = useSearchParentMenus(parentSearchDebounced, menuType === "sub");

  const parentMenuOptions: Menu[] = parentMenusData?.data || [];

  const schools = schoolsData?.data || [];

  // Fetch latest roles from API whenever dialog opens so newly created roles appear instantly
  useEffect(() => {
    if (open) {
      useRoleStore.getState().fetchRoles(true);
      // Reset parent search when dialog re-opens
      setParentSearchInput("");
      setParentSearchDebounced("");
    }
  }, [open]);

  // Get roles of the selected parent menu
  const selectedParentRoles = useMemo(() => {
    if (menuType !== "sub" || !formData.parentMenuId) return null;
    const parent = parentMenuOptions.find((m: any) => m.menuId === formData.parentMenuId);
    const roles = parent?.menuAccessRoles || [];
    return Array.isArray(roles) ? roles : [roles];
  }, [menuType, formData.parentMenuId, parentMenuOptions]);

  // Automatically suggest roles from the parent menu when a parent is first selected during creation
  useEffect(() => {
    if (!menuToEdit && selectedParentRoles && selectedParentRoles.length > 0) {
      setFormData((prev) => {
        const currentRoles = Array.isArray(prev.menuAccessRoles)
          ? prev.menuAccessRoles
          : [prev.menuAccessRoles];

        const rolesArray = Array.isArray(selectedParentRoles)
          ? selectedParentRoles
          : [selectedParentRoles];

        const missingRoles = rolesArray.filter(
          (role: string) => !currentRoles.includes(role),
        );

        if (missingRoles.length > 0) {
          return {
            ...prev,
            menuAccessRoles: [...currentRoles, ...missingRoles],
          };
        }
        return prev;
      });
    }
  }, [selectedParentRoles, menuToEdit]);

  // Helper to get the next sequence number for a role prefix
  // Note: We no longer bulk-load menus; returns "01" as the default starting sequence.
  // The user can adjust the sequence number manually in the Priority Sequencing field.
  const getNextSequence = (_prefix: string) => "01";

  const storeRoles = useRoleStore((state) => state.roles);
  const roles = useMemo(() => {
    return storeRoles.map((r) => ({
      value: r.roleCode,
      label: r.roleName,
      prefix: r.prefix,
      colorTheme: r.colorTheme,
    }));
  }, [storeRoles]);

  // Automatically add sequences when roles are added to menuAccessRoles or when roles store loads
  useEffect(() => {
    const selectedRoles = Array.isArray(formData.menuAccessRoles)
      ? formData.menuAccessRoles
      : formData.menuAccessRoles
        ? [formData.menuAccessRoles]
        : [];

    if (selectedRoles.length === 0 || storeRoles.length === 0) return;

    const currentOrders = (
      Array.isArray(formData.menuOrder)
        ? formData.menuOrder
        : formData.menuOrder
          ? [formData.menuOrder]
          : []
    )
      .filter(Boolean)
      .map(String);

    let updated = false;
    const newOrders = [...currentOrders];

    selectedRoles.forEach((roleCode) => {
      const role = storeRoles.find(
        (r) => r.roleCode?.toLowerCase() === String(roleCode).toLowerCase()
      );
      if (role?.prefix) {
        const hasOrder = newOrders.some((o) => {
          const m = String(o).match(/^([A-Z]+)(\d*)$/);
          return m ? m[1] === role.prefix : o.startsWith(role.prefix);
        });
        if (!hasOrder) {
          const nextSeq = getNextSequence(role.prefix);
          newOrders.push(`${role.prefix}${nextSeq}`);
          updated = true;
        }
      }
    });

    if (updated) {
      setFormData((prev) => ({ ...prev, menuOrder: newOrders }));
    }
  }, [formData.menuAccessRoles, storeRoles]);

  // Synchronize activeOrderPrefix with available roles and suggest next sequence if missing
  useEffect(() => {
    const selectedRoles = Array.isArray(formData.menuAccessRoles)
      ? formData.menuAccessRoles
      : formData.menuAccessRoles
        ? [formData.menuAccessRoles]
        : [];

    const currentRole = storeRoles.find((r) => r.prefix === activeOrderPrefix)?.roleCode;

    // If current prefix is not valid for selected roles, pick the first valid one
    if (
      selectedRoles.length > 0 &&
      (!currentRole || !selectedRoles.some((code) => String(code).toLowerCase() === currentRole.toLowerCase()))
    ) {
      const firstRoleCode = selectedRoles[0];
      const role = storeRoles.find(
        (r) => r.roleCode?.toLowerCase() === String(firstRoleCode).toLowerCase()
      );
      if (role?.prefix) {
        setActiveOrderPrefix(role.prefix);
      }
    }
  }, [formData.menuAccessRoles, activeOrderPrefix, storeRoles]);

  // NOTE: parentMenuOptions now comes from the debounced useSearchParentMenus hook above.

  // Populate form data when menuToEdit changes or dialog opens
  useEffect(() => {
    if (open && menuToEdit) {
      setFormData({
        schoolId: Array.isArray(menuToEdit.schoolId)
          ? menuToEdit.schoolId
          : menuToEdit.schoolId
            ? [menuToEdit.schoolId]
            : [],
        menuName: menuToEdit.menuName || "",
        menuUrl: menuToEdit.menuUrl || "",
        menuIcon: menuToEdit.menuIcon || "",
        menuAccessRoles: Array.isArray(menuToEdit.menuAccessRoles)
          ? menuToEdit.menuAccessRoles
          : [menuToEdit.menuAccessRoles],
        hasSubmenu: menuToEdit.hasSubmenu || false,
        parentMenuId: menuToEdit.parentMenuId || "",
        menuType: menuToEdit.menuType || "main",
        status: menuToEdit.status || "active",
        menuOrder: menuToEdit.menuOrder ?? "",
        deactivatedRoles: menuToEdit.deactivatedRoles || [],
        defaultMenu: menuToEdit.defaultMenu || false,
        showInSidebar: menuToEdit.showInSidebar !== false,
      });
      setMenuType(menuToEdit.menuType || "main");
    }
  }, [open, menuToEdit]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name as string]: value }));
    if (errors[name as string]) {
      setErrors((prev) => ({ ...prev, [name as string]: "" }));
    }
  };

  const handleMenuTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const type = e.target.value as "main" | "sub";
    setMenuType(type);
    setFormData((prev) => ({ ...prev, menuType: type }));
    if (type === "main") {
      setFormData((prev) => ({ ...prev, parentMenuId: "", menuType: type }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.menuName.trim()) newErrors.menuName = "Menu name is required";
    if (!formData.menuUrl.trim()) newErrors.menuUrl = "Menu path is required";
    // menuOrder is now optional (auto-generated if empty)
    // if (formData.menuOrder === undefined || formData.menuOrder === null)
    //   newErrors.menuOrder = "Order is required";
    if (
      !formData.menuAccessRoles ||
      (Array.isArray(formData.menuAccessRoles) &&
        formData.menuAccessRoles.length === 0)
    )
      newErrors.menuAccessRoles = "Role is required";
    // For admin roles (like super_admin), schoolId is not required
    const isSuperAdmin = Array.isArray(formData.menuAccessRoles)
      ? formData.menuAccessRoles.includes("super_admin")
      : formData.menuAccessRoles === "super_admin";

    if (
      !isSuperAdmin &&
      (!formData.schoolId ||
        (Array.isArray(formData.schoolId) && formData.schoolId.length === 0))
    )
      newErrors.schoolId = "At least one school is required";

    if (menuType === "sub" && !formData.parentMenuId?.trim()) {
      newErrors.parentMenuId = "Main Menu Heading is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const normalizedData = {
      ...formData,
      menuUrl: formData.menuUrl.startsWith("/") ? formData.menuUrl : `/${formData.menuUrl.trim()}`
    };

    try {
      if (menuToEdit) {
        const res = await updateMutation.mutateAsync({
          menuId: menuToEdit.menuId,
          data: normalizedData,
        });
        notification.success(res.message || "Menu configuration updated");
        onSuccess?.(res.message);
      } else {
        const res = await createMutation.mutateAsync(normalizedData);
        notification.success(res.message || "New navigation gateway registered");
        onSuccess?.(res.message);
      }
      handleClose();
    } catch {
      notification.error("Operation failed. Please verify your configuration and try again.");
    }
  };

  const handleClose = () => {
    setFormData({
      schoolId: [],
      menuName: "",
      menuUrl: "",
      menuIcon: "",
      menuAccessRoles: [],
      hasSubmenu: false,
      parentMenuId: "",
      menuType: "main",
      status: "active",
      menuOrder: "",
      deactivatedRoles: [],
      defaultMenu: true,
      showInSidebar: true,
    });
    setMenuType("main");
    setErrors({});
    createMutation.reset();
    onClose();
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isError = createMutation.isError || updateMutation.isError;
  const errorMessage =
    (createMutation.error as { message?: string })?.message ||
    (updateMutation.error as { message?: string })?.message ||
    "Operation failed";

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        sx={{ mt: 5 }}
        fullWidth
        scroll="paper"
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>{menuToEdit ? "Modify Menu Configuration" : "Register New Navigation Gateway"}</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ minHeight: "450px" }}>
            {isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errorMessage}
              </Alert>
            )}

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
                Visibility & Scope
              </Typography>

              {/* School Selection (Multi-select) */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Assigned Schools</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {/* Select All / Clear All */}
                    {schools.length > 0 && (
                      <AppButton
                        size="small"
                        variant="text"
                        color="primary"
                        startIcon={<SelectAllIcon sx={{ fontSize: 15 }} />}
                        onClick={() => {
                          const allIds = schools.map((s: any) => s.schoolId);
                          const currentIds: string[] = Array.isArray(formData.schoolId) ? formData.schoolId : [formData.schoolId as string];
                          const allSelected = allIds.every((id: string) => currentIds.includes(id));
                          setFormData(prev => ({
                            ...prev,
                            schoolId: allSelected ? [] : allIds,
                          }));
                          setErrors(prev => ({ ...prev, schoolId: '' }));
                        }}
                        sx={{ fontSize: '0.7rem', py: 0, minWidth: 0 }}
                      >
                        {(() => {
                          const allIds = schools.map((s: any) => s.schoolId);
                          const currentIds: string[] = Array.isArray(formData.schoolId) ? formData.schoolId : [formData.schoolId as string];
                          return allIds.every((id: string) => currentIds.includes(id)) ? 'Clear All' : 'Select All';
                        })()}
                      </AppButton>
                    )}

                    {/* Sync Missing Schools — only useful when editing an existing menu */}
                    {menuToEdit && schools.length > 0 && (
                      <AppButton
                        size="small"
                        variant="text"
                        color="warning"
                        startIcon={<SyncAltIcon sx={{ fontSize: 15 }} />}
                        onClick={() => {
                          // Add schools that are NOT already in the schoolId list
                          const currentIds: string[] = Array.isArray(formData.schoolId) ? formData.schoolId : [formData.schoolId as string];
                          const missingSchoolIds = schools
                            .map((s: any) => s.schoolId)
                            .filter((id: string) => !currentIds.includes(id));
                          if (missingSchoolIds.length === 0) return;
                          setFormData(prev => ({
                            ...prev,
                            schoolId: [...currentIds, ...missingSchoolIds],
                          }));
                          setErrors(prev => ({ ...prev, schoolId: '' }));
                        }}
                        sx={{ fontSize: '0.7rem', py: 0, minWidth: 0 }}
                        disabled={(() => {
                          const currentIds: string[] = Array.isArray(formData.schoolId) ? formData.schoolId : [formData.schoolId as string];
                          return schools.every((s: any) => currentIds.includes(s.schoolId));
                        })()}
                      >
                        Assign Missing ({(() => {
                          const currentIds: string[] = Array.isArray(formData.schoolId) ? formData.schoolId : [formData.schoolId as string];
                          return schools.filter((s: any) => !currentIds.includes(s.schoolId)).length;
                        })()})
                      </AppButton>
                    )}
                  </Box>
                </Box>

                <Autocomplete
                  multiple
                  options={schools}
                  getOptionLabel={(school: any) => school.schoolName || ""}
                  value={schools.filter((s: any) =>
                    Array.isArray(formData.schoolId)
                      ? formData.schoolId.includes(s.schoolId)
                      : formData.schoolId === s.schoolId,
                  )}
                  onChange={(_event, newValue) => {
                    setFormData((prev) => ({
                      ...prev,
                      schoolId: newValue.map((s: any) => s.schoolId),
                    }));
                    if (errors.schoolId) {
                      setErrors((prev) => ({ ...prev, schoolId: "" }));
                    }
                  }}
                  loading={isLoadingSchools}
                  renderInput={(params) => (
                    <AppInput
                      {...params}
                      label="Assigned Schools"
                      error={!!errors.schoolId}
                      helperText={errors.schoolId}
                      placeholder="Search and select schools"
                    />
                  )}
                  isOptionEqualToValue={(option, value) =>
                    option.schoolId === value.schoolId
                  }
                  fullWidth
                />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.defaultMenu}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          defaultMenu: e.target.checked,
                        }))
                      }
                      color="primary"
                    />
                  }
                  label="Global Default (Auto-assign to new schools)"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.showInSidebar !== false}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          showInSidebar: e.target.checked,
                        }))
                      }
                      color="primary"
                    />
                  }
                  label="Display in Sidebar Navigation"
                />
              </Box>

              <Divider sx={{ my: 0.5 }} />

              <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
                Basic Information
              </Typography>

              <AppInput
                name="menuName"
                label="Menu Display Name"
                value={formData.menuName}
                onChange={handleChange}
                error={!!errors.menuName}
                helperText={errors.menuName}
                required
              />

              <AppInput
                name="menuUrl"
                label="Navigation Path"
                value={formData.menuUrl}
                onChange={handleChange}
                error={!!errors.menuUrl}
                helperText={errors.menuUrl}
                placeholder="/dashboard/..."
                required
              />

              <AppInput
                name="menuIcon"
                label="Navigation Icon"
                value={formData.menuIcon}
                onClick={() => setIconPickerOpen(true)}
                slotProps={{
                  input: {
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setIconPickerOpen(true)}
                          edge="end"
                          size="small"
                        >
                          <AppsIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: { cursor: 'pointer' }
                  }
                }}
                placeholder="Click to select a brand icon"
              />

              <Divider sx={{ my: 0.5 }} />

              <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
                Menu Structure
              </Typography>

              {/* Menu Type Selection */}
              <FormControl component="fieldset">
                <FormLabel component="legend" sx={{ fontSize: '0.75rem', fontWeight: 600, mb: 1 }}>Structure Type</FormLabel>
                <RadioGroup
                  row
                  name="menuType"
                  value={menuType}
                  onChange={handleMenuTypeChange}
                >
                  <FormControlLabel
                    value="main"
                    control={<Radio size="small" />}
                    label="Independent Main Menu"
                  />
                  <FormControlLabel
                    value="sub"
                    control={<Radio size="small" />}
                    label="Nested Sub Menu"
                  />
                </RadioGroup>
              </FormControl>

              {/* Main Menu Heading (Parent ID) - Conditional */}
              {menuType === "sub" && (
                <Autocomplete
                  options={parentMenuOptions}
                  getOptionLabel={(option: any) => option.menuName || ""}
                  value={
                    parentMenuOptions.find(
                      (m: any) => m.menuId === formData.parentMenuId,
                    ) || null
                  }
                  onInputChange={(_event, value, reason) => {
                    // Only update search when user is actually typing, not on clear/reset
                    if (reason === "input") {
                      setParentSearchInput(value);
                    }
                  }}
                  onChange={(_event, newValue) => {
                    setFormData((prev) => ({
                      ...prev,
                      parentMenuId: newValue ? newValue.menuId : "",
                    }));
                    if (errors.parentMenuId) {
                      setErrors((prev) => ({ ...prev, parentMenuId: "" }));
                    }
                  }}
                  loading={isLoadingParentMenus}
                  filterOptions={(x) => x} // disable client-side filtering — server handles it
                  noOptionsText={
                    parentSearchInput.length === 0
                      ? "Type to search parent menus..."
                      : "No matching parent menus found"
                  }
                  renderInput={(params) => (
                    <AppInput
                      {...params}
                      label="Parent Category"
                      error={!!errors.parentMenuId}
                      helperText={errors.parentMenuId || "Search by menu name"}
                      placeholder="Search parent heading..."
                      required
                    />
                  )}
                  isOptionEqualToValue={(option, value) =>
                    option.menuId === value.menuId
                  }
                  fullWidth
                />
              )}

              {/* Menu Order - Priority Sequencing */}
              <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
                Priority Sequencing
              </Typography>
              <Box
                sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 0.5 }}
              >
                {(Array.isArray(formData.menuOrder)
                  ? formData.menuOrder
                  : [formData.menuOrder]
                )
                  .filter(Boolean)
                  .map((order) => {
                    const o = String(order);
                    const m = o.match(/^([A-Z]+)(\d*)$/);
                    const prefix = m ? m[1] : o.match(/^[A-Z]+/)?.[0];
                    const role = storeRoles.find(r => r.prefix === prefix);
                    const color = role?.colorTheme || "default";

                    return (
                      <Chip
                        key={o}
                        label={o}
                        size="small"
                        color={color}
                        variant="outlined"
                        sx={{ borderRadius: '6px' }}
                        onDelete={() => {
                          setFormData((prev) => {
                            const currentOrders = (
                              Array.isArray(prev.menuOrder)
                                ? prev.menuOrder
                                : [prev.menuOrder]
                            )
                              .filter(Boolean)
                              .map(String);
                            return {
                              ...prev,
                              menuOrder: currentOrders.filter(
                                (item) => item !== o,
                              ),
                            };
                          });
                        }}
                      />
                    );
                  })}
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 8 }}>
                  <AppSelect
                    label="Target Domain"
                    value={activeOrderPrefix}
                    options={storeRoles.filter(r => {
                      const selectedRoles = Array.isArray(formData.menuAccessRoles)
                        ? formData.menuAccessRoles
                        : [formData.menuAccessRoles];
                      return selectedRoles.some(code => String(code).toLowerCase() === r.roleCode?.toLowerCase());
                    }).map(r => ({ value: r.prefix, label: `${r.roleName} (${r.prefix})` }))}
                    onChange={(e) => setActiveOrderPrefix(e.target.value as string)}
                    disabled={!formData.menuAccessRoles?.length}
                  />
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <AppInput
                    name="menuOrderNumber"
                    label="Sequence"
                    value={(() => {
                      const orders = Array.isArray(formData.menuOrder)
                        ? formData.menuOrder
                        : [formData.menuOrder];
                      const match = orders.find((o) => {
                        const m = String(o).match(/^([A-Z]+)(\d*)$/);
                        return m ? m[1] === activeOrderPrefix : false;
                      });
                      if (!match) return "";
                      const m = String(match).match(/^([A-Z]+)(\d*)$/);
                      return m ? m[2] : String(match).slice(activeOrderPrefix.length);
                    })()}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      const newCode = `${activeOrderPrefix}${newValue}`;
                      setFormData((prev) => {
                        const currentOrders = (
                          Array.isArray(prev.menuOrder)
                            ? prev.menuOrder
                            : [prev.menuOrder]
                        )
                          .filter(Boolean)
                          .map(String);
                        const filtered = currentOrders.filter((o) => {
                          const m = String(o).match(/^([A-Z]+)(\d*)$/);
                          return m ? m[1] !== activeOrderPrefix : !o.startsWith(activeOrderPrefix);
                        });
                        if (newValue) {
                          filtered.push(newCode);
                        }
                        return {
                          ...prev,
                          menuOrder: filtered,
                        };
                      });
                    }}
                    error={!!errors.menuOrder}
                    placeholder="01"
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 0.5 }} />

              <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
                Access Control
              </Typography>

              {/* Role Selection */}
              <FormControl fullWidth error={!!errors.menuAccessRoles}>
                <InputLabel sx={{ fontSize: '0.85rem' }}>Authorized User Roles</InputLabel>
                <Select
                  name="menuAccessRoles"
                  multiple
                  value={
                    Array.isArray(formData.menuAccessRoles)
                      ? formData.menuAccessRoles
                      : [formData.menuAccessRoles]
                  }
                  onChange={(e) => handleChange(e as any)}
                  input={<OutlinedInput label="Authorized User Roles" sx={{ borderRadius: '10px' }} />}
                  renderValue={(selected) => {
                    const selectedRoles = (
                      Array.isArray(selected) ? selected : [selected]
                    ) as string[];
                    return (
                      <Box
                        sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
                      >
                        {selectedRoles.map((value) => {
                          const roleLabel = roles.find(
                            (r) => r.value === value,
                          )?.label;
                          const isInherited =
                            selectedParentRoles !== null &&
                            selectedParentRoles.includes(value);

                          return (
                            <Chip
                              key={value}
                              label={roleLabel || value}
                              size="small"
                              onDelete={
                                menuToEdit || !isInherited
                                  ? () => {
                                    const currentRoles = Array.isArray(
                                      formData.menuAccessRoles,
                                    )
                                      ? formData.menuAccessRoles
                                      : [formData.menuAccessRoles];
                                    const newRoles = currentRoles.filter(
                                      (r) => r !== value,
                                    );
                                    setFormData((prev) => ({
                                      ...prev,
                                      menuAccessRoles: newRoles,
                                    }));
                                  }
                                  : undefined
                              }
                              onMouseDown={(event) => {
                                event.stopPropagation();
                              }}
                              sx={{
                                bgcolor: isInherited
                                  ? "rgba(59, 130, 246, 0.1)"
                                  : undefined,
                                borderColor: isInherited
                                  ? "rgba(59, 130, 246, 0.5)"
                                  : undefined,
                                borderRadius: '6px'
                              }}
                              variant={isInherited ? "outlined" : "filled"}
                            />
                          );
                        })}
                      </Box>
                    );
                  }}
                >
                  {roles.map((role) => {
                    const selectedArray = Array.isArray(
                      formData.menuAccessRoles,
                    )
                      ? formData.menuAccessRoles
                      : [formData.menuAccessRoles];

                    return (
                      <MenuItem
                        key={role.value}
                        value={role.value}
                        disabled={
                          !menuToEdit &&
                          menuType === "sub" &&
                          selectedParentRoles !== null &&
                          selectedParentRoles.includes(role.value)
                        }
                      >
                        <Checkbox
                          checked={selectedArray.indexOf(role.value) > -1}
                          size="small"
                          disabled={
                            !menuToEdit &&
                            menuType === "sub" &&
                            selectedParentRoles !== null &&
                            selectedParentRoles.includes(role.value)
                          }
                        />
                        <ListItemText
                          primary={role.label}
                          primaryTypographyProps={{ fontSize: '0.9rem' }}
                          secondary={
                            selectedParentRoles?.includes(role.value)
                              ? !menuToEdit
                                ? "Inherited (Mandatory for sub-menu)"
                                : "Inherited from parent"
                              : ""
                          }
                          secondaryTypographyProps={{ fontSize: '0.75rem' }}
                        />
                      </MenuItem>
                    );
                  })}
                </Select>
                {errors.menuAccessRoles && (
                  <FormHelperText>{errors.menuAccessRoles}</FormHelperText>
                )}
              </FormControl>

              <AppSelect
                label="Overall Availability"
                name="status"
                value={formData.status || 'active'}
                options={[
                  { value: 'active', label: 'Active & Accessible' },
                  { value: 'inactive', label: 'Disabled & Hidden' },
                ]}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
              />
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <AppButton onClick={handleClose} variant="text" color="inherit">
              Cancel
            </AppButton>
            <AppButton
              type="submit"
              variant="contained"
              loading={isPending}
            >
              {menuToEdit ? "Update" : "Create"}
            </AppButton>
          </DialogActions>
        </form>
      </Dialog>

      <IconPickerDialog
        open={iconPickerOpen}
        onClose={() => setIconPickerOpen(false)}
        onSelect={(iconName) => {
          setFormData((prev) => ({ ...prev, menuIcon: iconName }));
          // Clear error if exists
          if (errors.menuIcon) {
            setErrors((prev) => ({ ...prev, menuIcon: "" }));
          }
        }}
        currentIcon={formData.menuIcon}
      />
    </>
  );
};

export default AddMenusDialog;
