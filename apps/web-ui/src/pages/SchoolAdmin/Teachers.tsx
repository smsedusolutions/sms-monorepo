import { useState } from "react";
import {
  Box,
  IconButton,
  Tooltip,
  Chip,
  Switch,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { Edit as EditIcon } from "@mui/icons-material";
import DataTable, { StatusChip } from "../../components/Table/DataTable";
import type { Column } from "../../components/Table/DataTable";
import TeacherDialog from "../../components/Dialogs/AddTeacherDialog";
import { useGetTeachers, useUpdateTeacher } from "../../queries/Teacher";
import type { Teacher } from "../../types";
import TokenService from "../../queries/token/tokenService";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../hooks/useNotification";
import { AppSearchInput } from "../../components/shared/AppSearchInput";

const TeachersPage = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<Teacher | null>(null);
  const notification = useNotification();

  const schoolId = TokenService.getSchoolId() || "";
  const { page, setPage, limit, setLimit } = useAuth();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data, isLoading, error } = useGetTeachers(schoolId, {
    page,
    limit,
    status: statusFilter || undefined,
    search: search || undefined,
  } as any);
  const updateMutation = useUpdateTeacher(schoolId);

  const teachers = data?.data || [];

  const handleAdd = () => {
    setEditData(null);
    setDialogOpen(true);
  };

  const handleEdit = (teacher: Teacher) => {
    setEditData(teacher);
    setDialogOpen(true);
  };

  const handleToggleStatus = async (teacher: Teacher) => {
    const newStatus = teacher.status === "active" ? "inactive" : "active";
    try {
      const result = await updateMutation.mutateAsync({
        teacherId: teacher.teacherId,
        data: { status: newStatus },
      });
      notification.success(result.message || `Teacher status updated to ${newStatus}`);
    } catch (err) {
      notification.error((err as any)?.message || "Failed to update status");
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditData(null);
  };

  const columns: Column<Teacher>[] = [
    { id: "teacherId", label: "ID", minWidth: 100 },
    {
      id: "firstName",
      label: "Name",
      minWidth: 150,
      format: (_, row) => `${row.firstName} ${row.lastName}`,
    },
    { id: "email", label: "Email", minWidth: 180 },
    { id: "phone", label: "Phone", minWidth: 120 },
    {
      id: "subjectNames",
      label: "Assigned Subjects",
      minWidth: 200,
      format: (value) => (
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
          {Array.isArray(value) && value.length > 0 ? (
            (value as string[]).map((name, idx) => (
              <Chip key={idx} label={name} size="small" variant="outlined" color="secondary" />
            ))
          ) : (
            "None"
          )}
        </Box>
      ),
    },
    {
      id: "classNames",
      label: "Assigned Classes",
      minWidth: 180,
      format: (value) => (
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
          {Array.isArray(value) && value.length > 0 ? (
            (value as string[]).map((name, idx) => (
              <Chip key={idx} label={name} size="small" variant="outlined" color="primary" />
            ))
          ) : (
            "None"
          )}
        </Box>
      ),
    },
    {
      id: "status",
      label: "Status",
      minWidth: 100,
      align: "center",
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
      {/* Search + Filter bar */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          mb: 2,
          alignItems: "center",
        }}
      >
        <AppSearchInput
          label="Search"
          placeholder="Search by name or email..."
          value={search}
          onSearch={(val) => {
            setSearch(val);
            setPage(1);
          }}
          sx={{ minWidth: 240 }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <DataTable<Teacher>
        title="Teachers"
        columns={columns}
        data={teachers}
        isLoading={isLoading}
        error={
          error
            ? (error as { message?: string })?.message || "Failed to load teachers"
            : null
        }
        onAddClick={handleAdd}
        addButtonLabel="Add Teacher"
        emptyMessage="No teachers found. Click 'Add Teacher' to create one."
        getRowKey={(row) => row.teacherId}
        paginationServer
        paginationTotalRows={data?.pagination?.total || 0}
        paginationPerPage={limit}
        onChangePage={(p) => setPage(p)}
        onChangeRowsPerPage={(l) => {
          setLimit(l);
          setPage(1);
        }}
      />

      <TeacherDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        schoolId={schoolId}
        editData={editData}
      />
    </Box>
  );
};

export default TeachersPage;
