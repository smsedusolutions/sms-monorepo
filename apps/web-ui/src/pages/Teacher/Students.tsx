import { useState, useMemo } from 'react';
import { Box, IconButton, Tooltip, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Edit as EditIcon, Block as BlockIcon } from '@mui/icons-material';
import DataTable, { StatusChip } from '../../components/Table/DataTable';
import type { Column } from '../../components/Table/DataTable';
import StudentDialog from '../../components/Dialogs/AddStudentDialog';
import { useGetStudents, useUpdateStudent } from '../../queries/Student';
import { useGetClasses } from '../../queries/Class';
import { useGetTeacherById } from '../../queries/Teacher';
import type { Student, Class } from '../../types';
import TokenService from '../../queries/token/tokenService';
import { useAuth } from '../../context/AuthContext';
import { AppSearchInput } from '../../components/shared/AppSearchInput';

const TeacherStudentsPage = () => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editData, setEditData] = useState<Student | null>(null);

    const schoolId = TokenService.getSchoolId() || '';
    const user = TokenService.getUser();
    const teacherId = user?.teacherId || user?.userId || '';

    const { page, setPage, limit, setLimit } = useAuth();
    const [search, setSearch] = useState('');
    const [classFilter, setClassFilter] = useState('');

    const { data: teacherData } = useGetTeacherById(schoolId, teacherId);
    const { data: classesData } = useGetClasses(schoolId);

    const teacher = teacherData?.data;
    const allClasses: Class[] = classesData?.data || [];

    // Only classes assigned to this teacher
    const assignedClasses = useMemo(() => {
        const rawTeacherClasses = teacher?.classes || [];
        if (rawTeacherClasses.length === 0) return allClasses;
        const parsedIds = rawTeacherClasses.map((c: string) => c.split('#')[0]);
        return allClasses.filter((c: Class) => parsedIds.includes(c.classId));
    }, [teacher?.classes, allClasses]);

    const handleSearchChange = (val: string) => {
        setSearch(val);
        setPage(1);
    };

    const handleClassChange = (val: string) => {
        setClassFilter(val);
        setPage(1);
    };

    const { data, isLoading, error } = useGetStudents(schoolId, {
        page,
        limit,
        class: classFilter || undefined,
        search: search || undefined,
    });
    const updateMutation = useUpdateStudent(schoolId);

    const students = data?.data || [];

    const handleAdd = () => {
        setEditData(null);
        setDialogOpen(true);
    };

    const handleEdit = (student: Student) => {
        setEditData(student);
        setDialogOpen(true);
    };

    const handleToggleStatus = async (student: Student) => {
        const newStatus = student.status === 'active' ? 'inactive' : 'active';
        try {
            await updateMutation.mutateAsync({
                studentId: student.studentId,
                data: { status: newStatus },
            });
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
        setEditData(null);
    };

    const userRole = TokenService.getRole() || user?.role || '';
    const isAdmin = userRole === 'sch_admin' || userRole === 'super_admin';

    const columns: Column<Student>[] = [
        { id: 'studentId', label: 'ID', minWidth: 100 },
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
        { id: 'rollNumber', label: 'Roll No', minWidth: 80 },
        {
            id: 'parentName',
            label: 'Parent',
            minWidth: 120,
            format: (value, row) => value || (row.parentId ? 'Unknown' : 'Not Linked'),
        },
        { id: 'phone', label: 'Phone', minWidth: 120 },
        {
            id: 'status',
            label: 'Status',
            minWidth: 100,
            align: 'center',
            format: (value) => <StatusChip status={(value as 'active' | 'inactive') || 'active'} />,
        },
        {
            id: 'actions',
            label: 'Actions',
            minWidth: 120,
            align: 'center',
            format: (_, row) => (
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                    <Tooltip title={isAdmin ? "Edit" : "Only Admin can edit"}>
                        <span>
                            <IconButton
                                size="small"
                                color="primary"
                                onClick={(e) => { e.stopPropagation(); if (isAdmin) handleEdit(row); }}
                                disabled={!isAdmin}
                            >
                                <EditIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title={isAdmin ? (row.status === 'active' ? 'Deactivate' : 'Activate') : "Only Admin can deactivate"}>
                        <span>
                            <IconButton
                                size="small"
                                color={row.status === 'active' ? 'error' : 'success'}
                                onClick={(e) => { e.stopPropagation(); if (isAdmin) handleToggleStatus(row); }}
                                disabled={!isAdmin || updateMutation.isPending}
                            >
                                <BlockIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>
            ),
        },
    ];

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {/* Filter Bar */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3, alignItems: 'center' }}>
                <AppSearchInput
                    label="Search Students / Parents"
                    placeholder="Search by student name or parent name..."
                    value={search}
                    onSearch={(val) => handleSearchChange(val)}
                    sx={{ minWidth: 260, flex: { xs: 1, sm: 'none' } }}
                />

                <FormControl size="small" sx={{ minWidth: 180, flex: { xs: 1, sm: 'none' } }}>
                    <InputLabel>Filter by Class</InputLabel>
                    <Select
                        value={classFilter}
                        label="Filter by Class"
                        onChange={(e) => handleClassChange(e.target.value)}
                    >
                        <MenuItem value="">All Assigned Classes</MenuItem>
                        {assignedClasses.map((cls) => (
                            <MenuItem key={cls.classId} value={cls.classId}>
                                {cls.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            <DataTable<Student>
                title="Students"
                columns={columns}
                data={students}
                isLoading={isLoading}
                error={error ? (error as { message?: string })?.message || 'Failed to load students' : null}
                onAddClick={isAdmin ? handleAdd : undefined}
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
        </Box>
    );
};

export default TeacherStudentsPage;
