import { useState } from "react";
import {
  Box,
  IconButton,
  Tooltip,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  Typography,
  TextField,
} from "@mui/material";
import { Edit as EditIcon } from "@mui/icons-material";
import DataTable, { StatusChip } from "../../components/Table/DataTable";
import type { Column } from "../../components/Table/DataTable";
import SubjectDialog from "../../components/Dialogs/AddSubjectDialog";
import { useGetSubjects, useUpdateSubject } from "../../queries/Subject";
import { useGetClasses } from "../../queries/Class";
import type { Subject, Class } from "../../types";
import TokenService from "../../queries/token/tokenService";
import { useNotificationStore } from "../../stores/notificationStore";

const SubjectsPage = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<Subject | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [search, setSearch] = useState("");
  const { showNotification } = useNotificationStore();

  const schoolId = TokenService.getSchoolId() || "";

  // Fetch classes for the dropdown
  const { data: classesData } = useGetClasses(schoolId);
  const classes = classesData?.data || [];

  const { data, isLoading, error } = useGetSubjects(schoolId, {
    classId: selectedClass || undefined,
    search: search || undefined,
  } as any);
  const updateMutation = useUpdateSubject(schoolId);

  const subjects = data?.data || [];

  const handleAdd = () => {
    setEditData(null);
    setDialogOpen(true);
  };

  const handleEdit = (subject: Subject) => {
    setEditData(subject);
    setDialogOpen(true);
  };

  const handleToggleStatus = async (subject: Subject) => {
    const newStatus = subject.status === "active" ? "inactive" : "active";
    try {
      const result = await updateMutation.mutateAsync({
        subjectId: subject.subjectId,
        data: { status: newStatus },
      });
      showNotification(result.message || `Subject status updated to ${newStatus}`, "success");
    } catch (err) {
      console.error("Failed to update status:", err);
      showNotification((err as any)?.message || "Failed to update status", "error");
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditData(null);
  };

  const columns: Column<Subject>[] = [
    { id: "subjectId", label: "ID", minWidth: 100 },
    {
      id: "name",
      label: "Subject Name",
      minWidth: 180,
      format: (value, row) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: row.isSubSubject ? 400 : 600 }}>
            {row.isSubSubject && <span style={{ color: '#888', marginRight: 4 }}>↳</span>}
            {value as string}
          </Typography>
          {row.isSubSubject ? (
            <Chip label="Sub-Subject" size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 18 }} />
          ) : (
            <Chip label="Main" size="small" color="primary" sx={{ fontSize: '0.65rem', height: 18 }} />
          )}
        </Box>
      ),
    },
    {
      id: "code",
      label: "Code",
      minWidth: 100,
      format: (value) => (
        <Chip
          label={value as string}
          size="small"
          color="secondary"
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      id: "className",
      label: "Assigned Class",
      minWidth: 150,
      format: (value) => value || "General",
    },
    {
      id: "assignedTeacherName",
      label: "Assigned Faculty",
      minWidth: 220,
      format: (value) => (
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
          {value ? (
            (value as string).split(", ").map((name, idx) => (
              <Chip
                key={idx}
                label={name}
                size="small"
                color="primary"
                variant="outlined"
              />
            ))
          ) : (
            <Typography variant="caption" color="text.secondary">
              Not Assigned
            </Typography>
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
      {/* Search + Filter Bar */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          mb: 3,
          alignItems: "center",
        }}
      >
        <TextField
          label="Search Subjects"
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or code..."
          sx={{ minWidth: 240, flex: { xs: 1, sm: "none" } }}
        />
        
        <FormControl size="small" sx={{ minWidth: 180, flex: { xs: 1, sm: "none" } }}>
          <InputLabel>Filter by Class</InputLabel>
          <Select
            value={selectedClass}
            label="Filter by Class"
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <MenuItem value="">All Classes</MenuItem>
            <MenuItem value="general">General (No Class)</MenuItem>
            {classes.filter((c: Class) => c.status === "active").map((c: Class) => (
              <MenuItem key={c.classId} value={c.classId}>
                {c.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <DataTable<Subject>
        title="Curriculum Subjects"
        columns={columns}
        data={subjects}
        isLoading={isLoading}
        error={
          error
            ? (error as { message?: string })?.message ||
              "Failed to load subjects"
            : null
        }
        onAddClick={handleAdd}
        addButtonLabel="Add Subject"
        emptyMessage="No subjects match your criteria. Click 'Add Subject' to create one."
        getRowKey={(row) => row.subjectId}
      />

      <SubjectDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        schoolId={schoolId}
        editData={editData}
        initialClassId={selectedClass === 'general' ? "" : selectedClass}
      />
    </Box>
  );
};

export default SubjectsPage;
