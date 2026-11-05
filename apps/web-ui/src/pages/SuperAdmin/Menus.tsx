import { useState, useEffect, useMemo, useRef } from "react";
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  Autocomplete,
  Grid,
  InputAdornment,
  Button,
  Badge,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Star as StarIcon,
  Add as AddIcon,
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowRight as ExpandRightIcon,
  RestartAlt as RestartAltIcon,
  SubdirectoryArrowRight as SubMenuIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  SettingsBackupRestore as RestoreIcon,
} from "@mui/icons-material";
import ExcelJS from "exceljs";
import AddMenusDialog from "../../components/Dialogs/AddMenusDialog";
import ConfirmationDialog from "../../components/Dialogs/ConfirmationDialog";
import {
  useGetMenus,
  useDeleteMenu,
  useGetAllMenusForExport,
  useBulkUpdateMenus,
  useRestoreMenuBackup,
} from "../../queries/Menus";
import { useGetSchools } from "../../queries/School";
import { useAuth } from "../../context/AuthContext";
import { useNotificationStore } from "../../stores/notificationStore";
import ManageMenuAccessDialog from "../../components/Dialogs/ManageMenuAccessDialog";
import HtmlTooltip from "../../components/Common/HtmlTooltip";
import type { Menu } from "../../types";
import { useRoleStore } from "../../stores/roleStore";
import { DynamicIcon } from "../../utils/Icons";

const getRoleChipColor = (value: string) => {
  const { roles } = useRoleStore.getState();
  const role = roles.find(r => r.roleCode === value.toLowerCase() || r.prefix === value.toUpperCase());
  return role?.colorTheme || "default";
};

interface GroupedMenu extends Menu {
  children: Menu[];
}

const Menus = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<Menu | undefined>(undefined);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState<Menu | null>(null);
  const [manageMenu, setManageMenu] = useState<Menu | null>(null);
  const [manageMode, setManageMode] = useState<"roles" | "schools">("roles");
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [restoreBatchId, setRestoreBatchId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedSchool, setAppliedSchool] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [schoolInput, setSchoolInput] = useState<string | null>(null);

  const { showNotification } = useNotificationStore();

  // Use global pagination state from AuthContext
  const { page, setPage, limit, setLimit } = useAuth();

  // Reset page when applied filters change
  useEffect(() => {
    setPage(1);
  }, [appliedSearch, appliedSchool, setPage]);

  // Fetch menus and schools
  const {
    data: menusData,
    isLoading: isLoadingMenus,
    error,
  } = useGetMenus(page, limit, appliedSearch, appliedSchool || undefined);
  const { refetch: fetchAllMenus } = useGetAllMenusForExport();
  const bulkUpdateMutation = useBulkUpdateMenus();
  const restoreMutation = useRestoreMenuBackup();
  const { data: schoolsData, isLoading: isLoadingSchools } = useGetSchools();

  const menus = menusData?.data || [];
  const schools = schoolsData?.data || [];

  const isLoading = isLoadingMenus || isLoadingSchools;

  // Group menus: main menus with their submenus nested
  const groupedMenus = useMemo<GroupedMenu[]>(() => {
    const mainMenus = menus.filter((m: Menu) => m.menuType === "main");
    const subMenus = menus.filter((m: Menu) => m.menuType === "sub");

    return mainMenus.map((main: Menu) => ({
      ...main,
      children: subMenus.filter((sub: Menu) => sub.parentMenuId === main.menuId),
    }));
  }, [menus]);

  const handleToggleExpand = (menuId: string) => {
    setExpandedMenus((prev) => {
      const next = new Set(prev);
      if (next.has(menuId)) {
        next.delete(menuId);
      } else {
        next.add(menuId);
      }
      return next;
    });
  };

  const handleSearch = () => {
    setAppliedSearch(searchInput);
    setAppliedSchool(schoolInput);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setSchoolInput(null);
    setAppliedSearch("");
    setAppliedSchool(null);
    setPage(1);
  };

  const handleAddClick = () => {
    setIsAddDialogOpen(true);
  };

  // ---- Excel template columns ----
  const TEMPLATE_COLUMNS = [
    "menuId",
    "menuName",
    "menuUrl",
    "menuOrder",
    "menuType",
    "parentMenuId",
    "menuAccessRoles",
    "menuIcon",
    "schoolId",
    "defaultMenu",
    "showInSidebar",
    "status",
  ];

  const handleDownloadTemplate = async () => {
    try {
      const result = await fetchAllMenus();
      const allMenus: Menu[] = result.data?.data || [];

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Menus");

      // Header row
      sheet.columns = TEMPLATE_COLUMNS.map((col) => ({
        header: col,
        key: col,
        width: col === "menuId" ? 12 : col === "menuName" ? 25 : 20,
      }));

      // Style header row
      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1976D2" },
      };
      headerRow.alignment = { horizontal: "center" };

      // Add data rows
      allMenus.forEach((menu: any) => {
        const row: Record<string, any> = {};
        TEMPLATE_COLUMNS.forEach((col) => {
          const val = menu[col];
          if (Array.isArray(val)) {
            row[col] = val.join(", ");
          } else if (typeof val === "boolean") {
            row[col] = val ? "true" : "false";
          } else {
            row[col] = val ?? "";
          }
        });
        sheet.addRow(row);
      });

      // Lock menuId column (light gray background to indicate read-only)
      sheet.eachRow((row, rowNum) => {
        if (rowNum > 1) {
          const cell = row.getCell(1);
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF0F0F0" },
          };
        }
      });

      // Add data validation (dropdowns) for menuType, defaultMenu, and status
      // menuType is column 5 (E), defaultMenu is column 10 (J), status is column 11 (K)
      // We apply to the first 500 rows to ensure dropdowns are available for new entries
      for (let i = 2; i <= 500; i++) {
        // menuType: main, sub
        (sheet.getCell(`E${i}`) as any).dataValidation = {
          type: "list",
          allowBlank: true,
          formulae: ['"main,sub"'],
          showErrorMessage: true,
          errorTitle: "Invalid Menu Type",
          error: "Please select main or sub",
        };

        // defaultMenu: true, false
        (sheet.getCell(`J${i}`) as any).dataValidation = {
          type: "list",
          allowBlank: true,
          formulae: ['"true,false"'],
          showErrorMessage: true,
          errorTitle: "Invalid Value",
          error: "Please select true or false",
        };

        // showInSidebar: true, false
        (sheet.getCell(`K${i}`) as any).dataValidation = {
          type: "list",
          allowBlank: true,
          formulae: ['"true,false"'],
          showErrorMessage: true,
          errorTitle: "Invalid Value",
          error: "Please select true or false",
        };

        // status: active, inactive
        (sheet.getCell(`L${i}`) as any).dataValidation = {
          type: "list",
          allowBlank: true,
          formulae: ['"active,inactive"'],
          showErrorMessage: true,
          errorTitle: "Invalid Status",
          error: "Please select active or inactive",
        };
      }

      // Add guidance for menuIcon (Column H)
      const iconHeaderCell = sheet.getCell("H1");
      iconHeaderCell.note = {
        texts: [
          { text: "Use Iconify format (e.g., mdi:home, uil:setting).\n" },
          { text: "Browse icons at: https://icon-sets.iconify.design" },
        ],
      };

      // Add a prompt/help message for the icon column cells
      for (let i = 2; i <= 500; i++) {
        const cell = sheet.getCell(`H${i}`);
        (cell as any).dataValidation = {
          type: "custom",
          allowBlank: true,
          formulae: ["=TRUE"], // Allows any input but enables the prompt
          showInputMessage: true,
          promptTitle: "Iconify Format",
          prompt: "Example: mdi:home or uil:setting. Visit icon-sets.iconify.design for names.",
        };
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `menus_template_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);

      showNotification("Template downloaded successfully", "success");
    } catch (err: any) {
      console.error("Download failed:", err);
      showNotification(err.message || "Failed to download template", "error");
    }
  };

  const handleUploadExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so the same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";

    setIsUploading(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const arrayBuffer = await file.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);

      const sheet = workbook.getWorksheet("Menus") || workbook.getWorksheet(1);
      if (!sheet) {
        showNotification("Invalid file: no worksheet found", "error");
        return;
      }

      // Validate columns
      const headerRow = sheet.getRow(1);
      const headers: string[] = [];
      headerRow.eachCell((cell, colNum) => {
        headers[colNum - 1] = String(cell.value || "").trim();
      });

      // Check for exact column match
      const templateSet = new Set(TEMPLATE_COLUMNS);
      const headerSet = new Set(headers);

      const extraCols = headers.filter((h) => !templateSet.has(h));
      const missingCols = TEMPLATE_COLUMNS.filter((c) => !headerSet.has(c));

      if (extraCols.length > 0) {
        showNotification(
          `Invalid template: Please use the downloaded template.`,
          "error",
        );
        return;
      }

      if (missingCols.length > 0) {
        showNotification(
          `Invalid template: Please use the downloaded template.`,
          "error",
        );
        return;
      }

      // Fetch current data to diff
      const currentResult = await fetchAllMenus();
      const currentMenus: Menu[] = currentResult.data?.data || [];
      const currentMap = new Map(currentMenus.map((m) => [m.menuId, m]));

      // Parse rows
      const changedMenus: Partial<Menu>[] = [];

      sheet.eachRow((row, rowNum) => {
        if (rowNum === 1) return; // Skip header

        const rowData: Record<string, any> = {};
        headers.forEach((header, idx) => {
          const cell = row.getCell(idx + 1);
          rowData[header] = cell.value ?? "";
        });

        const menuId = String(rowData.menuId || "").trim();
        if (!menuId) return;

        const current = currentMap.get(menuId);
        if (!current) return; // Skip unknown menuIds

        // Convert Excel values back to proper types
        const parseArrayField = (val: any): string[] => {
          const str = String(val || "").trim();
          if (!str) return [];
          return str.split(",").map((s: string) => s.trim()).filter(Boolean);
        };

        const parseBool = (val: any): boolean => {
          const str = String(val || "").trim().toLowerCase();
          return str === "true" || str === "1" || str === "yes";
        };

        const uploaded: Record<string, any> = {
          menuId,
          menuName: String(rowData.menuName || "").trim(),
          menuUrl: String(rowData.menuUrl || "").trim(),
          menuOrder: parseArrayField(rowData.menuOrder),
          menuType: String(rowData.menuType || "").trim(),
          parentMenuId: String(rowData.parentMenuId || "").trim() || null,
          menuAccessRoles: parseArrayField(rowData.menuAccessRoles),
          menuIcon: String(rowData.menuIcon || "").trim() || null,
          schoolId: parseArrayField(rowData.schoolId),
          defaultMenu: parseBool(rowData.defaultMenu),
          showInSidebar: parseBool(rowData.showInSidebar),
          status: String(rowData.status || "").trim(),
        };

        // Diff against current
        let hasChanges = false;
        const fieldsToCompare = TEMPLATE_COLUMNS.filter((f) => f !== "menuId");

        for (const field of fieldsToCompare) {
          const currentVal = (current as any)[field];
          const uploadedVal = uploaded[field];

          if (Array.isArray(currentVal)) {
            const currentArr = (currentVal || []).map(String).sort();
            const uploadedArr = (uploadedVal || []).map(String).sort();
            if (JSON.stringify(currentArr) !== JSON.stringify(uploadedArr)) {
              hasChanges = true;
              break;
            }
          } else if (typeof currentVal === "boolean") {
            if (currentVal !== uploadedVal) {
              hasChanges = true;
              break;
            }
          } else {
            if (String(currentVal ?? "") !== String(uploadedVal ?? "")) {
              hasChanges = true;
              break;
            }
          }
        }

        if (hasChanges) {
          changedMenus.push(uploaded as Partial<Menu>);
        }
      });

      if (changedMenus.length === 0) {
        showNotification("No changes found in the uploaded file", "info");
        return;
      }

      // Send changes to backend
      const res = await bulkUpdateMutation.mutateAsync(changedMenus);
      showNotification(
        res.message || `${changedMenus.length} menu(s) updated successfully`,
        "success",
      );
    } catch (err: any) {
      console.error("Upload failed:", err);
      showNotification(err.message || "Failed to process uploaded file", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setSelectedMenu(undefined);
  };

  const deleteMutation = useDeleteMenu();

  const handleEditClick = (menu: Menu) => {
    setSelectedMenu(menu);
    setIsAddDialogOpen(true);
  };

  const handleDeleteClick = (menu: Menu) => {
    setMenuToDelete(menu);
    setDeleteConfirmationOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (menuToDelete) {
      try {
        const res = await deleteMutation.mutateAsync(menuToDelete.menuId);
        setDeleteConfirmationOpen(false);
        setMenuToDelete(null);
        showNotification(res.message, "success");
      } catch (err: any) {
        console.error("Failed to delete menu:", err);
        showNotification(err.message || "Failed to delete menu", "error");
      }
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmationOpen(false);
    setMenuToDelete(null);
  };

  const handleRestoreBackup = async () => {
    if (!restoreBatchId.trim()) {
      showNotification("Please enter a Batch ID", "error");
      return;
    }

    try {
      await restoreMutation.mutateAsync(restoreBatchId.trim());
      showNotification("Menus restored successfully", "success");
      setIsRestoreDialogOpen(false);
      setRestoreBatchId("");
    } catch (err: any) {
      console.error("Restore failed:", err);
      showNotification(err.message || "Failed to restore backup", "error");
    }
  };

  // ---- Shared cell renderers ----

  const renderMenuName = (menu: Menu, isChild = false) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {isChild && (
        <SubMenuIcon sx={{ fontSize: 16, color: "text.secondary", mr: 0.5 }} />
      )}
      {menu.menuIcon && (
        <DynamicIcon icon={menu.menuIcon} size="1.25rem" />
      )}
      <Typography variant="body2" sx={{ fontWeight: isChild ? 400 : 600 }}>
        {menu.menuName}
      </Typography>
      {menu.defaultMenu && (
        <Tooltip title="Default menu (auto-assigned to new schools)">
          <StarIcon sx={{ fontSize: 16, color: "warning.main", ml: 0.5 }} />
        </Tooltip>
      )}
    </Box>
  );

  const renderOrder = (menu: Menu) => {
    const value = menu.menuOrder;
    if (!value) return null;
    const orders = Array.isArray(value) ? value : [value];
    return (
      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
        {orders.map((orderItem: string | number) => {
          const order = String(orderItem);
          const color = getRoleChipColor(order);
          return (
            <Chip
              key={order}
              label={order}
              size="small"
              variant="outlined"
              color={color}
              sx={{ fontWeight: 600, minWidth: "50px" }}
            />
          );
        })}
      </Box>
    );
  };

  const renderRoles = (menu: Menu) => {
    const value = menu.menuAccessRoles;
    if (!value) return null;
    const roles = Array.isArray(value) ? value : [value];
    const deactivatedRoles = menu.deactivatedRoles || [];
    const activeCount = roles.filter(
      (r: string) => !deactivatedRoles.includes(r),
    ).length;

    const rolesList = roles.map((role: string) => {
      const isDeactivated = deactivatedRoles.includes(role);
      const label = role.replace(/_/g, " ");
      return (
        <Box
          key={role}
          sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}
        >
          <Chip
            label={label}
            size="small"
            variant={isDeactivated ? "outlined" : "filled"}
            color={isDeactivated ? "default" : getRoleChipColor(role)}
            sx={{
              textTransform: "capitalize",
              fontSize: "0.75rem",
              opacity: isDeactivated ? 0.6 : 1,
            }}
          />
          <Typography
            variant="caption"
            color={isDeactivated ? "error" : "success.main"}
            sx={{ fontWeight: 600 }}
          >
            {isDeactivated ? "Inactive" : "Active"}
          </Typography>
        </Box>
      );
    });

    return (
      <HtmlTooltip
        title={
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
              Assigned Roles ({activeCount}/{roles.length} active)
            </Typography>
            {rolesList}
          </Box>
        }
        arrow
        placement="right"
      >
        <Badge badgeContent={roles.length} color="primary" sx={{ mr: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={(e) => {
              e.stopPropagation();
              setManageMenu(menu);
              setManageMode("roles");
            }}
            sx={{ minWidth: "auto", fontSize: "0.75rem", py: 0.5, px: 1.5 }}
          >
            Manage
          </Button>
        </Badge>
      </HtmlTooltip>
    );
  };

  const renderSchools = (menu: Menu) => {
    const value = menu.schoolId;
    if (!value) return null;
    const ids = Array.isArray(value) ? value : [value];
    const deactivatedSchools = menu.deactivatedSchools || [];

    if (ids.length === 0)
      return (
        <Chip label="Global" size="small" variant="outlined" color="info" />
      );

    const activeCount = ids.filter(
      (id: string) => !deactivatedSchools.includes(id),
    ).length;

    const schoolsList = ids.map((id: string) => {
      const school = schools.find((s: any) => s.schoolId === id);
      const isDeactivated = deactivatedSchools.includes(id);
      return (
        <Box
          key={id}
          sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}
        >
          <Chip
            label={school ? school.schoolName : id}
            size="small"
            variant={isDeactivated ? "outlined" : "filled"}
            color={isDeactivated ? "default" : "primary"}
            sx={{ fontSize: "0.75rem", opacity: isDeactivated ? 0.6 : 1 }}
          />
          <Typography
            variant="caption"
            color={isDeactivated ? "error" : "success.main"}
            sx={{ fontWeight: 600 }}
          >
            {isDeactivated ? "Disabled" : "Enabled"}
          </Typography>
        </Box>
      );
    });

    return (
      <HtmlTooltip
        title={
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
              Assigned Schools ({activeCount}/{ids.length} enabled)
            </Typography>
            {schoolsList}
          </Box>
        }
        arrow
        placement="right"
      >
        <Badge badgeContent={ids.length} color="primary" sx={{ mr: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={(e) => {
              e.stopPropagation();
              setManageMenu(menu);
              setManageMode("schools");
            }}
            sx={{ minWidth: "auto", fontSize: "0.75rem", py: 0.5, px: 1.5 }}
          >
            Manage
          </Button>
        </Badge>
      </HtmlTooltip>
    );
  };

  const renderActions = (menu: Menu) => (
    <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
      <Tooltip title="Edit">
        <IconButton
          size="small"
          color="primary"
          onClick={(e) => {
            e.stopPropagation();
            handleEditClick(menu);
          }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete">
        <IconButton
          size="small"
          color="error"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteClick(menu);
          }}
          disabled={deleteMutation.isPending}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );

  // ---- Render a single menu row ----
  const renderMenuRow = (menu: Menu, isChild = false) => (
    <TableRow
      key={menu.menuId}
      hover
      sx={{
        bgcolor: isChild ? "action.hover" : undefined,
        "& > td": { py: 1.2 },
      }}
    >
      {/* Menu Name (with expand button for main menus) */}
      <TableCell>
        <Box sx={{ display: "flex", alignItems: "center", pl: isChild ? 4 : 0 }}>
          {!isChild && (
            <Box sx={{ width: 32 }}>
              {(menu as GroupedMenu).children?.length > 0 ? (
                <IconButton
                  size="small"
                  onClick={() => handleToggleExpand(menu.menuId)}
                  sx={{ p: 0.5 }}
                >
                  {expandedMenus.has(menu.menuId) ? (
                    <ExpandMoreIcon fontSize="small" />
                  ) : (
                    <ExpandRightIcon fontSize="small" />
                  )}
                </IconButton>
              ) : null}
            </Box>
          )}
          {renderMenuName(menu, isChild)}
        </Box>
      </TableCell>

      {/* Order */}
      <TableCell>{renderOrder(menu)}</TableCell>

      {/* Path */}
      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {menu.menuUrl}
        </Typography>
      </TableCell>

      {/* Sidebar */}
      <TableCell>
        <Chip
          label={menu.showInSidebar !== false ? "Visible" : "Hidden"}
          size="small"
          color={menu.showInSidebar !== false ? "success" : "default"}
          variant={menu.showInSidebar !== false ? "filled" : "outlined"}
          sx={{ fontSize: "0.75rem" }}
        />
      </TableCell>

      {/* Roles */}
      <TableCell>{renderRoles(menu)}</TableCell>

      {/* Schools */}
      <TableCell>{renderSchools(menu)}</TableCell>

      {/* Action */}
      <TableCell>{renderActions(menu)}</TableCell>
    </TableRow>
  );

  return (
    <Box>
      {/* Filters Section */}
      <Box
        sx={{
          mb: 3,
          p: 2,
          bgcolor: "background.paper",
          borderRadius: 1.5,
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 5 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search menus or roles..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Autocomplete
              options={schools}
              getOptionLabel={(school: any) => school.schoolName || ""}
              value={
                schools.find((s: any) => s.schoolId === schoolInput) || null
              }
              onChange={(_event, newValue) => {
                setSchoolInput(newValue ? newValue.schoolId : null);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Filter by School"
                  variant="outlined"
                  size="small"
                  placeholder="Select a school"
                />
              )}
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleSearch}
                fullWidth
                sx={{ height: "40px" }}
              >
                Search
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<RestartAltIcon />}
                onClick={handleClearFilters}
                fullWidth
                sx={{ height: "40px" }}
              >
                Clear
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Typography variant="h5" fontWeight={600} color="text.primary">
          Menus Management
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadTemplate}
            sx={{ textTransform: "none", borderRadius: 1 }}
          >
            Download Template
          </Button>
          <Button
            variant="outlined"
            startIcon={isUploading ? <CircularProgress size={18} /> : <UploadIcon />}
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            sx={{ textTransform: "none", borderRadius: 1 }}
          >
            {isUploading ? "Uploading..." : "Upload Excel"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: "none" }}
            onChange={handleUploadExcel}
          />
          <Button
            variant="outlined"
            startIcon={<RestoreIcon />}
            onClick={() => setIsRestoreDialogOpen(true)}
            sx={{ textTransform: "none", borderRadius: 1 }}
          >
            Restore Backup
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddClick}
            sx={{ textTransform: "none", borderRadius: 1, px: 3 }}
          >
            Add Menu
          </Button>
        </Box>
      </Box>

      {/* Table */}
      <Paper
        sx={{
          borderRadius: 1,
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow
                sx={{
                  bgcolor: "grey.100",
                  "& th": {
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    py: 1.5,
                    color: "text.primary",
                  },
                }}
              >
                <TableCell sx={{ minWidth: 200 }}>Menu Name</TableCell>
                <TableCell sx={{ minWidth: 150 }}>Order</TableCell>
                <TableCell sx={{ minWidth: 150 }}>Path</TableCell>
                <TableCell sx={{ minWidth: 100 }}>Sidebar</TableCell>
                <TableCell sx={{ minWidth: 120 }}>Roles</TableCell>
                <TableCell sx={{ minWidth: 120 }}>Schools</TableCell>
                <TableCell sx={{ minWidth: 100 }} align="center">
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={40} />
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      Loading...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="error">
                      {(error as any).message || "Failed to load menus"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : groupedMenus.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No menus found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                groupedMenus.map((mainMenu) => (
                  <>
                    {/* Main menu row */}
                    {renderMenuRow(mainMenu)}

                    {/* Submenu rows rendered directly in same table */}
                    {mainMenu.children.length > 0 &&
                      expandedMenus.has(mainMenu.menuId) &&
                      mainMenu.children.map((subMenu) =>
                        renderMenuRow(subMenu, true),
                      )}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={menusData?.pagination?.total || 0}
          page={page - 1}
          onPageChange={(_e, newPage) => setPage(newPage + 1)}
          rowsPerPage={limit}
          onRowsPerPageChange={(e) => {
            setLimit(parseInt(e.target.value, 10));
            setPage(1);
          }}
          rowsPerPageOptions={[10, 20, 30, 50]}
        />
      </Paper>

      <AddMenusDialog
        open={isAddDialogOpen}
        onClose={handleCloseDialog}
        onSuccess={(msg) => showNotification(msg, "success")}
        menuToEdit={selectedMenu}
      />

      <ConfirmationDialog
        open={deleteConfirmationOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Menu"
        description={`Are you sure you want to delete the menu "${menuToDelete?.menuName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      <ManageMenuAccessDialog
        open={!!manageMenu}
        onClose={() => setManageMenu(null)}
        menu={manageMenu}
        mode={manageMode}
        schools={schools}
        onSuccess={(msg) => showNotification(msg, "success")}
      />

      {/* Restore Backup Dialog */}
      <Dialog
        open={isRestoreDialogOpen}
        onClose={() => !restoreMutation.isPending && setIsRestoreDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 1.5 } }}
      >
        <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>Restore Menu Backup</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter the Batch ID of the backup you want to restore. This will replace the current menu
            table with the backup snapshot.
          </Typography>
          <TextField
            fullWidth
            label="Batch ID"
            placeholder="e.g., BATCH_1740212345678"
            value={restoreBatchId}
            onChange={(e) => setRestoreBatchId(e.target.value)}
            disabled={restoreMutation.isPending}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => setIsRestoreDialogOpen(false)}
            disabled={restoreMutation.isPending}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleRestoreBackup}
            disabled={restoreMutation.isPending || !restoreBatchId.trim()}
            sx={{ textTransform: "none", borderRadius: 1 }}
          >
            {restoreMutation.isPending ? <CircularProgress size={24} /> : "Restore Now"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Menus;
