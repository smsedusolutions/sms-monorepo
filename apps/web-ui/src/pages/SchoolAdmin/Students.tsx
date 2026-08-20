import { useState, useMemo } from 'react';
import { Box, IconButton, Tooltip, Switch, TextField, FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material';
import { Edit as EditIcon, Badge as BadgeIcon, Article as CertIcon } from '@mui/icons-material';
import DataTable, { StatusChip } from '../../components/Table/DataTable';
import type { Column } from '../../components/Table/DataTable';
import StudentDialog from '../../components/Dialogs/AddStudentDialog';
import StudentIDCardDialog from '../../components/Dialogs/StudentIDCardDialog';
import TransferCertificateDialog from '../../components/Dialogs/TransferCertificateDialog';
import ExcelBulkActions from '../../components/ExcelBulk/ExcelBulkActions';
import { useGetStudents, useUpdateStudent, useBulkCreateStudents } from '../../queries/Student';
import { useGetClasses } from '../../queries/Class';
import type { Student, CreateStudentPayload, StudentFilters, Class } from '../../types';
import type { TemplateConfig, ParseConfig } from '../../utils/excelBulk';
import TokenService from '../../queries/token/tokenService';
import { useAuth } from '../../context/AuthContext';
import { useNotificationStore } from '../../stores/notificationStore';

// Student Excel template column definitions
const STUDENT_TEMPLATE_COLUMNS = [
  { key: 'firstName', header: 'firstName', width: 18 },
  { key: 'lastName', header: 'lastName', width: 18 },
  { key: 'email', header: 'email', width: 25, note: 'Optional. Must be unique across the system.' },
  { key: 'password', header: 'password', width: 15, note: 'Required. Will be used for student login.' },
  { key: 'phone', header: 'phone', width: 15 },
  { key: 'class', header: 'class', width: 12, note: 'Enter Class Name or ID. Required.' },
  { key: 'section', header: 'section', width: 12, note: 'Enter Section Name or ID.' },
  { key: 'rollNumber', header: 'rollNumber', width: 12 },
  { key: 'parentId', header: 'parentId', width: 15, note: 'Enter Parent ID, Phone, or Email to link. Optional.' },
  { key: 'dateOfBirth', header: 'dateOfBirth', width: 15, note: 'Format: YYYY-MM-DD' },
  {
    key: 'gender',
    header: 'gender',
    width: 12,
    validation: { type: 'list' as const, options: ['male', 'female', 'other'] },
  },
  { key: 'address', header: 'address', width: 30 },
  {
    key: 'status',
    header: 'status',
    width: 12,
    validation: { type: 'list' as const, options: ['active', 'inactive'] },
  },
];

const StudentsPage = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<Student | null>(null);
  const [idCardDialogOpen, setIdCardDialogOpen] = useState(false);
  const [idCardStudents, setIdCardStudents] = useState<Student[]>([]);
  const [tcDialogOpen, setTcDialogOpen] = useState(false);
  const [selectedTcStudent, setSelectedTcStudent] = useState<Student | null>(null);

  const schoolId = TokenService.getSchoolId() || "";
  const { page, setPage, limit, setLimit } = useAuth();
  const { showNotification } = useNotificationStore();

  const [filters, setFilters] = useState<StudentFilters>({
    class: '',
    section: '',
    search: '',
  });

  const { data, isLoading, error } = useGetStudents(schoolId, { 
    page, 
    limit,
    ...filters
  });
  const updateMutation = useUpdateStudent(schoolId);
  const bulkCreateMutation = useBulkCreateStudents(schoolId);

  // Fetch classes for reference in notes and filters
  const { data: classesData } = useGetClasses(schoolId);

  const students = data?.data || [];

  // Get sections for the selected class
  const selectedClassSections = useMemo(() => {
    if (!filters.class || !classesData?.data) return [];
    const selectedClass = classesData.data.find((c: Class) => c.classId === filters.class);
    return selectedClass?.sections || [];
  }, [filters.class, classesData]);

  const handleFilterChange = (newFilters: Partial<StudentFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1); // Reset to first page on filter change
  };

  const handleAdd = () => {
    setEditData(null);
    setDialogOpen(true);
  };

  const handleEdit = (student: Student) => {
    setEditData(student);
    setDialogOpen(true);
  };

  const handlePrintIDCard = (student: Student) => {
    setIdCardStudents([student]);
    setIdCardDialogOpen(true);
  };

  const handleOpenTC = (student: Student) => {
    setSelectedTcStudent(student);
    setTcDialogOpen(true);
  };

  const handleBulkIDCards = () => {
    if (students.length === 0) {
      showNotification('No students available to generate ID cards', 'warning');
      return;
    }
    setIdCardStudents(students);
    setIdCardDialogOpen(true);
  };

  const handleToggleStatus = async (student: Student) => {
    const newStatus = student.status === 'active' ? 'inactive' : 'active';
    try {
      const result = await updateMutation.mutateAsync({
        studentId: student.studentId,
        data: { status: newStatus },
      });
      showNotification(result.message || `Student status updated to ${newStatus}`, 'success');
    } catch (err) {
      console.error('Failed to update status:', err);
      showNotification((err as any)?.message || 'Failed to update status', 'error');
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditData(null);
  };

  // Build the template config with class note dynamically
  const templateConfig: TemplateConfig = useMemo(() => {
    const classes = classesData?.data || [];
    const classNote =
      classes.length > 0
        ? `Class Name or ID (required). Available: ${classes.map((c: any) => c.name).join(', ')}`
        : 'Enter Class Name or ID (e.g., "10"). Required.';

    const columns = STUDENT_TEMPLATE_COLUMNS.map((col) => {
      if (col.key === 'class') {
        return { ...col, note: classNote };
      }
      return col;
    });

    return {
      sheetName: 'Students Template',
      fileName: 'students_bulk_upload_template',
      columns,
    };
  }, [classesData]);

  const parseConfig: ParseConfig = useMemo(
    () => ({
      expectedColumns: STUDENT_TEMPLATE_COLUMNS.map((c) => c.header),
    }),
    []
  );

  const handleBulkUpload = async (parsedData: any[]) => {
    try {
      const result = await bulkCreateMutation.mutateAsync(
        parsedData as Partial<CreateStudentPayload>[]
      );

      const { inserted, failed, errors } = (result as any).data || {};

      if (failed > 0 && errors?.length > 0) {
        const errorSummary = errors
          .slice(0, 5)
          .map((e: any) => `Row ${e.row}: ${e.message}`)
          .join('\n');
        const moreText = errors.length > 5 ? `\n...and ${errors.length - 5} more errors` : '';
        showNotification(
          `Inserted ${inserted}, Failed ${failed}. Errors:\n${errorSummary}${moreText}`,
          failed === parsedData.length ? 'error' : 'warning'
        );
      } else {
        showNotification(`Successfully imported ${inserted} student(s)!`, 'success');
      }
    } catch (err: any) {
      showNotification(err.message || 'Bulk upload failed', 'error');
    }
  };

  const columns: Column<Student>[] = [
    {
      id: 'studentId',
      label: 'ID',
      minWidth: 100,
    },
    {
      id: 'firstName',
      label: 'Name',
      minWidth: 150,
      format: (_, row) => `${row.firstName} ${row.lastName}`,
    },
    {
      id: 'class',
      label: 'Class',
      minWidth: 80,
      format: (value, row) => row.className || value || '-',
    },
    {
      id: 'section',
      label: 'Section',
      minWidth: 80,
      format: (value, row) => row.sectionName || value || '-',
    },
    { id: 'rollNumber', label: 'Roll No', minWidth: 80, hide: 'sm' },
    {
      id: 'parentName',
      label: 'Parent',
      minWidth: 120,
      hide: 'md',
      format: (value, row) => value || (row.parentId ? 'Unknown' : 'Not Linked'),
    },
    { id: 'phone', label: 'Phone', minWidth: 120, hide: 'sm' },
    {
      id: 'status',
      label: 'Status',
      minWidth: 80,
      align: 'center',
      hide: 'sm',
      format: (value) => <StatusChip status={(value as 'active' | 'inactive') || 'active'} />,
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 170,
      align: 'center',
      format: (_, row) => (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="Student ID Card">
            <IconButton
              size="small"
              sx={{
                color: '#4f46e5',
                bgcolor: 'rgba(79, 70, 229, 0.08)',
                '&:hover': { bgcolor: 'rgba(79, 70, 229, 0.16)' },
              }}
              onClick={(e) => { e.stopPropagation(); handlePrintIDCard(row); }}
            >
              <BadgeIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Generate Transfer Certificate (TC)">
            <IconButton
              size="small"
              sx={{
                color: '#0284c7',
                bgcolor: 'rgba(2, 132, 199, 0.08)',
                '&:hover': { bgcolor: 'rgba(2, 132, 199, 0.16)' },
              }}
              onClick={(e) => { e.stopPropagation(); handleOpenTC(row); }}
            >
              <CertIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); handleEdit(row); }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={row.status === 'active' ? 'Deactivate' : 'Activate'}>
            <Switch
              size="small"
              checked={row.status === 'active'}
              onChange={(e) => { e.stopPropagation(); handleToggleStatus(row); }}
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
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: 2, 
        mb: 3
      }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          justifyContent: 'space-between', 
          alignItems: { xs: 'stretch', md: 'center' },
          gap: 2 
        }}>
          {/* Filters Row */}
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: { xs: 1, sm: 2 }, 
            flex: 1 
          }}>
            <TextField
              label="Search"
              variant="outlined"
              size="small"
              value={filters.search}
              onChange={(e) => handleFilterChange({ search: e.target.value })}
              placeholder="Search students..."
              sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 250 } }}
            />
            
            <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', sm: 'auto' } }}>
              <FormControl size="small" sx={{ flex: { xs: 1, sm: 'none' }, minWidth: { sm: 150 } }}>
                <InputLabel>Class</InputLabel>
                <Select
                  value={filters.class || ''}
                  label="Class"
                  onChange={(e) => handleFilterChange({ class: e.target.value as string, section: '' })}
                >
                  <MenuItem value="">All Classes</MenuItem>
                  {classesData?.data?.map((cls: Class) => (
                    <MenuItem key={cls.classId} value={cls.classId}>
                      {cls.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ flex: { xs: 1, sm: 'none' }, minWidth: { sm: 150 } }} disabled={!filters.class}>
                <InputLabel>Section</InputLabel>
                <Select
                  value={filters.section || ''}
                  label="Section"
                  onChange={(e) => handleFilterChange({ section: e.target.value as string })}
                >
                  <MenuItem value="">All Sections</MenuItem>
                  {selectedClassSections.map((sec: any) => (
                    <MenuItem key={sec.sectionId} value={sec.sectionId}>
                      {sec.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* Bulk Actions Row */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: { xs: 'center', md: 'flex-end' },
            alignItems: 'center',
            width: { xs: '100%', md: 'auto' },
            gap: 1.5,
            '& > button': { 
              width: { xs: '100%', sm: 'auto' } 
            }
          }}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<BadgeIcon />}
              onClick={handleBulkIDCards}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                borderColor: '#6366f1',
                color: '#4f46e5',
                '&:hover': {
                  borderColor: '#4338ca',
                  bgcolor: 'rgba(99, 102, 241, 0.06)',
                },
              }}
            >
              ID Cards
            </Button>

            <ExcelBulkActions
              templateConfig={templateConfig}
              parseConfig={parseConfig}
              onUploadComplete={handleBulkUpload}
              downloadButtonText="Template"
              uploadButtonText="Bulk Upload"
              disabled={bulkCreateMutation.isPending}
            />
          </Box>
        </Box>
      </Box>

      <DataTable<Student>
        title="Students"
        columns={columns}
        data={students}
        isLoading={isLoading}
        error={error ? (error as { message?: string })?.message || 'Failed to load students' : null}
        onAddClick={handleAdd}
        addButtonLabel="Add Student"
        emptyMessage="No students found. Click 'Add Student' to create one."
        getRowKey={(row) => row.studentId}
        paginationServer
        paginationTotalRows={data?.pagination?.total || 0}
        paginationPerPage={limit}
        onChangePage={(p) => setPage(p)}
        onChangeRowsPerPage={(l) => {
          setLimit(l);
          setPage(1);
        }}
      />

      <StudentDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        schoolId={schoolId}
        editData={editData}
      />

      <StudentIDCardDialog
        open={idCardDialogOpen}
        onClose={() => setIdCardDialogOpen(false)}
        students={idCardStudents}
        title={
          idCardStudents.length === 1
            ? `Student ID Card — ${idCardStudents[0].firstName} ${idCardStudents[0].lastName}`
            : `Student ID Cards (${idCardStudents.length} Students)`
        }
      />

      <TransferCertificateDialog
        open={tcDialogOpen}
        onClose={() => setTcDialogOpen(false)}
        student={selectedTcStudent}
      />
    </Box>
  );
};

export default StudentsPage;
