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
import { useGetTeachers } from '../../queries/Teacher';
import type { Teacher } from '../../types';
import TokenService from '../../queries/token/tokenService';
import { useAuth } from '../../context/AuthContext';

/**
 * Principal Teachers page — Read-only directory of all teachers.
 * No add/edit/delete actions — those remain with School Admin.
 */
const PrincipalTeachers = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const { page, setPage, limit, setLimit } = useAuth();

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');

    const { data, isLoading, error } = useGetTeachers(schoolId, {
        page,
        limit,
        status: statusFilter || undefined,
        search: search || undefined,
    } as any);

    const teachers = data?.data || [];

    const columns: Column<Teacher>[] = [
        { id: 'teacherId', label: 'ID', minWidth: 100 },
        {
            id: 'firstName',
            label: 'Name',
            minWidth: 150,
            format: (_, row) => `${row.firstName} ${row.lastName}`,
        },
        { id: 'email', label: 'Email', minWidth: 180 },
        { id: 'phone', label: 'Phone', minWidth: 120 },
        {
            id: 'subjectNames',
            label: 'Subjects',
            minWidth: 200,
            format: (value) => (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {Array.isArray(value) && value.length > 0 ? (
                        (value as string[]).map((name, idx) => (
                            <Chip key={idx} label={name} size="small" variant="outlined" color="secondary" />
                        ))
                    ) : (
                        <Typography variant="caption" color="text.secondary">None assigned</Typography>
                    )}
                </Box>
            ),
        },
        {
            id: 'classNames',
            label: 'Classes',
            minWidth: 180,
            format: (value) => (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {Array.isArray(value) && value.length > 0 ? (
                        (value as string[]).map((name, idx) => (
                            <Chip key={idx} label={name} size="small" variant="outlined" color="primary" />
                        ))
                    ) : (
                        <Typography variant="caption" color="text.secondary">None assigned</Typography>
                    )}
                </Box>
            ),
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
                Teacher Directory
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                View all teachers in the school. Contact School Admin to add, edit, or remove teachers.
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

            <DataTable<Teacher>
                title="Teachers"
                columns={columns}
                data={teachers}
                isLoading={isLoading}
                error={
                    error
                        ? (error as { message?: string })?.message || 'Failed to load teachers'
                        : null
                }
                emptyMessage="No teachers found."
                getRowKey={(row) => row.teacherId}
                paginationServer
                paginationTotalRows={data?.pagination?.total || 0}
                paginationPerPage={limit}
                onChangePage={(p) => setPage(p)}
                onChangeRowsPerPage={(l) => { setLimit(l); setPage(1); }}
            />
        </Box>
    );
};

export default PrincipalTeachers;
