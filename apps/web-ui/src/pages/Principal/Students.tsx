import { useState } from 'react';
import {
    Box,
    Typography,
    Chip,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import DataTable, { StatusChip } from '../../components/Table/DataTable';
import type { Column } from '../../components/Table/DataTable';
import { useGetStudents } from '../../queries/Student';
import type { Student, StudentFilters } from '../../types';
import TokenService from '../../queries/token/tokenService';
import { useAuth } from '../../context/AuthContext';

/**
 * Principal Students page — Read-only directory of all students.
 * No add/edit/delete actions — those remain with School Admin.
 */
const PrincipalStudents = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const { page, setPage, limit, setLimit } = useAuth();

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');

    const filters: StudentFilters = {
        page,
        limit,
        status: (statusFilter as 'active' | 'inactive') || undefined,
        search: search || undefined,
    };

    const { data, isLoading, error } = useGetStudents(schoolId, filters);

    const students = data?.data || [];

    const columns: Column<Student>[] = [
        { id: 'studentId', label: 'ID', minWidth: 100 },
        {
            id: 'firstName',
            label: 'Name',
            minWidth: 160,
            format: (_, row) => `${row.firstName} ${row.lastName || ''}`.trim(),
        },
        { id: 'email', label: 'Email', minWidth: 180 },
        {
            id: 'className',
            label: 'Class',
            minWidth: 120,
            format: (value, row) => (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {value ? (
                        <Chip label={`${value}${row.sectionName ? ` - ${row.sectionName}` : ''}`} size="small" variant="outlined" color="primary" />
                    ) : (
                        <Typography variant="caption" color="text.secondary">Not assigned</Typography>
                    )}
                </Box>
            ),
        },
        {
            id: 'rollNumber',
            label: 'Roll No.',
            minWidth: 100,
            format: (value) => value || '—',
        },
        {
            id: 'status',
            label: 'Status',
            minWidth: 100,
            align: 'center',
            format: (value) => (
                <StatusChip status={(value as 'active' | 'inactive') || 'active'} />
            ),
        },
    ];

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h5" fontWeight={600} gutterBottom>
                Student Directory
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Browse all students enrolled in the school. Contact School Admin to add, edit, or remove students.
            </Typography>

            {/* Search + Filter bar */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2, alignItems: 'center' }}>
                <TextField
                    label="Search"
                    variant="outlined"
                    size="small"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search by name or email..."
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

            <DataTable<Student>
                title="Students"
                columns={columns}
                data={students}
                isLoading={isLoading}
                error={
                    error
                        ? (error as { message?: string })?.message || 'Failed to load students'
                        : null
                }
                emptyMessage="No students found."
                getRowKey={(row) => row.studentId}
                paginationServer
                paginationTotalRows={data?.pagination?.total || 0}
                paginationPerPage={limit}
                onChangePage={(p) => setPage(p)}
                onChangeRowsPerPage={(l) => { setLimit(l); setPage(1); }}
            />
        </Box>
    );
};

export default PrincipalStudents;
