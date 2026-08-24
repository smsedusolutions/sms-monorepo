import { useState } from "react";
import { Box, IconButton, Tooltip, Switch, FormControl, InputLabel, Select, MenuItem, Chip, Typography } from "@mui/material";

import { Edit as EditIcon } from "@mui/icons-material";
import DataTable, { StatusChip } from "../../components/Table/DataTable";
import type { Column } from "../../components/Table/DataTable";
import ParentDialog from "../../components/Dialogs/AddParentDialog";
import { useGetParents, useUpdateParent } from "../../queries/Parent";
import type { Parent, ParentFilters } from "../../types";
import TokenService from "../../queries/token/tokenService";
import { useAuth } from "../../context/AuthContext";
import { AppSearchInput } from "../../components/shared/AppSearchInput";
import { useNotificationStore } from "../../stores/notificationStore";

const ParentsPage = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<Parent | null>(null);
  const { showNotification } = useNotificationStore();

  const schoolId = TokenService.getSchoolId() || "";
  const { page, setPage, limit, setLimit } = useAuth();
  const [filters, setFilters] = useState<ParentFilters>({
    search: '',
    relationship: undefined,
    status: undefined,
  });

  const handleFilterChange = (newFilters: Partial<ParentFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  const { data, isLoading, error } = useGetParents(schoolId, { 
    page, 
    limit,
    ...filters
  });
  const updateMutation = useUpdateParent(schoolId);

  const parents = data?.data || [];

  const handleAdd = () => {
    setEditData(null);
    setDialogOpen(true);
  };

  const handleEdit = (parent: Parent) => {
    setEditData(parent);
    setDialogOpen(true);
  };

  const handleToggleStatus = async (parent: Parent) => {
    const newStatus = parent.status === "active" ? "inactive" : "active";
    try {
      const result = await updateMutation.mutateAsync({
        parentId: parent.parentId,
        data: { status: newStatus },
      });
      showNotification(result.message || `Parent status updated to ${newStatus}`, "success");
    } catch (err) {
      console.error("Failed to update status:", err);
      showNotification((err as any)?.message || "Failed to update status", "error");
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditData(null);
  };

  const columns: Column<Parent>[] = [
    { id: "parentId", label: "ID", minWidth: 80, hide: 'md' },
    {
      id: "firstName",
      label: "Name",
      minWidth: 150,
      format: (_, row) => `${row.firstName} ${row.lastName}`,
    },
    { id: "email", label: "Email", minWidth: 180 },
    { id: "phone", label: "Phone", minWidth: 120 },
    {
      id: "relationship",
      label: "Relationship",
      minWidth: 100,
      hide: 'sm',
      format: (value) =>
        (value as string)?.charAt(0).toUpperCase() +
        (value as string)?.slice(1),
    },
    {
      id: "childrenNames",
      label: "Linked Children",
      minWidth: 200,
      format: (value) => (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {Array.isArray(value) && value.length > 0 ? (
            (value as string[]).map((name, idx) => (
              <Chip key={idx} label={name} size="small" variant="outlined" color="primary" />
            ))
          ) : (
            <Typography variant="caption" color="text.secondary">None</Typography>
          )}
        </Box>
      ),
    },

    {
      id: "status",
      label: "Status",
      minWidth: 80,
      align: "center",
      hide: 'sm',
      format: (value) => (
        <StatusChip status={(value as "active" | "inactive") || "active"} />
      ),
    },
    {
      id: "actions",
      label: "Actions",
      minWidth: 120,
      align: "center",
      format: (_, row) => (
        <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(row);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={row.status === "active" ? "Deactivate" : "Activate"}>
            <Switch
              size="small"
              checked={row.status === "active"}
              onChange={(e) => {
                e.stopPropagation();
                handleToggleStatus(row);
              }}
              disabled={updateMutation.isPending}
              color="success"
            />
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Filters */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', md: 'center' },
        gap: 2, 
        mb: 3
      }}>
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: { xs: 1, sm: 2 }, 
          flex: 1 
        }}>
          <AppSearchInput
            label="Search"
            placeholder="Search parents..."
            value={filters.search}
            onSearch={(val) => handleFilterChange({ search: val })}
            sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 250 } }}
          />
          
          <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', sm: 'auto' } }}>
            <FormControl size="small" sx={{ flex: { xs: 1, sm: 'none' }, minWidth: { sm: 150 } }}>
              <InputLabel>Relationship</InputLabel>
              <Select
                value={filters.relationship || ''}
                label="Relationship"
                onChange={(e) => handleFilterChange({ relationship: e.target.value as any })}
              >
                <MenuItem value="">All Relationships</MenuItem>
                <MenuItem value="father">Father</MenuItem>
                <MenuItem value="mother">Mother</MenuItem>
                <MenuItem value="guardian">Guardian</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ flex: { xs: 1, sm: 'none' }, minWidth: { sm: 150 } }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status || ''}
                label="Status"
                onChange={(e) => handleFilterChange({ status: e.target.value as any })}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Box>
      <DataTable<Parent>
        title="Parents"
        columns={columns}
        data={parents}
        isLoading={isLoading}
        error={
          error
            ? (error as { message?: string })?.message ||
              "Failed to load parents"
            : null
        }
        onAddClick={handleAdd}
        addButtonLabel="Add Parent"
        emptyMessage="No parents found. Click 'Add Parent' to create one."
        getRowKey={(row) => row.parentId}
        paginationServer
        paginationTotalRows={data?.pagination?.total || 0}
        paginationPerPage={limit}
        onChangePage={(p) => setPage(p)}
        onChangeRowsPerPage={(l) => {
          setLimit(l);
          setPage(1);
        }}
      />

      <ParentDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        schoolId={schoolId}
        editData={editData}
      />
    </Box>
  );
};

export default ParentsPage;
