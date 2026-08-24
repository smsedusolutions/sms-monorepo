import { useState, useMemo } from 'react';
import { Box, IconButton, Tooltip, FormControl, InputLabel, Select, MenuItem, Chip } from '@mui/material';
import { Edit as EditIcon, Block as BlockIcon, Chat as ChatIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import DataTable, { StatusChip } from '../../components/Table/DataTable';
import type { Column } from '../../components/Table/DataTable';
import ParentDialog from '../../components/Dialogs/AddParentDialog';
import { useGetParents, useUpdateParent } from '../../queries/Parent';
import { useGetClasses } from '../../queries/Class';
import { useGetTeacherById } from '../../queries/Teacher';
import type { Parent, Class } from '../../types';
import TokenService from '../../queries/token/tokenService';
import { useAuth } from '../../context/AuthContext';
import { AppSearchInput } from '../../components/shared/AppSearchInput';

const TeacherParentsPage = () => {
    const navigate = useNavigate();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editData, setEditData] = useState<Parent | null>(null);

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

    const { data, isLoading, error } = useGetParents(schoolId, {
        page,
        limit,
        class: classFilter || undefined,
        search: search || undefined,
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
        const newStatus = parent.status === 'active' ? 'inactive' : 'active';
        try {
            await updateMutation.mutateAsync({
                parentId: parent.parentId,
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

    const columns: Column<Parent>[] = [
        { id: 'parentId', label: 'ID', minWidth: 100 },
        {
            id: 'firstName',
            label: 'Name',
            minWidth: 150,
            format: (_, row) => `${row.firstName} ${row.lastName}`,
        },
        { id: 'email', label: 'Email', minWidth: 180 },
        { id: 'phone', label: 'Phone', minWidth: 120 },
        {
            id: 'childrenNames',
            label: 'Children',
            minWidth: 160,
            format: (_, row: any) => {
                const names = row.childrenNames || [];
                if (names.length === 0) return '-';
                return (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {names.map((name: string, i: number) => (
                            <Chip key={i} label={name} size="small" variant="outlined" sx={{ fontSize: '0.75rem' }} />
                        ))}
                    </Box>
                );
            },
        },
        {
            id: 'relationship',
            label: 'Relationship',
            minWidth: 100,
            format: (value) => (value as string)?.charAt(0).toUpperCase() + (value as string)?.slice(1),
        },
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
                    <Tooltip title="Send Encrypted Message">
                        <IconButton
                            size="small"
                            color="info"
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/teacher/chat?partnerId=${row.parentId}`);
                            }}
                        >
                            <ChatIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
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
                    label="Search Parents"
                    placeholder="Search parent name, email, phone..."
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
                        {assignedClasses.map((cls: Class) => (
                            <MenuItem key={cls.classId} value={cls.classId}>
                                {cls.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            <DataTable<Parent>
                title="Parents"
                columns={columns}
                data={parents}
                isLoading={isLoading}
                error={error ? (error as { message?: string })?.message || 'Failed to load parents' : null}
                onAddClick={isAdmin ? handleAdd : undefined}
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

export default TeacherParentsPage;
