import { useState } from 'react';
import {
    Box,
    IconButton,
    Tooltip,
    Chip,
    Collapse,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
    Button,
    Paper,
    TableContainer,
    Switch,
} from '@mui/material';
import {
    Edit as EditIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Add as AddIcon,
} from '@mui/icons-material';
import { StatusChip } from '../../components/Table/DataTable';
import ClassDialog from '../../components/Dialogs/AddClassDialog';
import { useGetClasses, useUpdateClass, useRemoveSection } from '../../queries/Class';
import { useGetTeachers } from '../../queries/Teacher';
import type { Class, Teacher } from '../../types';
import TokenService from '../../queries/token/tokenService';
import { useNotificationStore } from '../../stores/notificationStore';

const ClassesPage = () => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editData, setEditData] = useState<Class | null>(null);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const { showNotification } = useNotificationStore();

    const schoolId = TokenService.getSchoolId() || '';
    const { data, isLoading, error } = useGetClasses(schoolId);

    const updateMutation = useUpdateClass(schoolId);
    const removeSectionMutation = useRemoveSection(schoolId);

    const classes = data?.data || [];

    const getTeacherName = (section: any): string => {
        if (!section) return '-';
        if (section.classTeacherName) return section.classTeacherName;
        return section.classTeacherId || section.classTeacher || '-';
    };

    const handleAdd = () => {
        setEditData(null);
        setDialogOpen(true);
    };

    const handleEdit = (classItem: Class) => {
        setEditData(classItem);
        setDialogOpen(true);
    };

    const handleToggleStatus = async (classItem: Class) => {
        const newStatus = classItem.status === 'active' ? 'inactive' : 'active';
        try {
            const result = await updateMutation.mutateAsync({
                classId: classItem.classId,
                data: { status: newStatus },
            });
            showNotification(result.message || `Class status updated to ${newStatus}`, 'success');
        } catch (err) {
            console.error('Failed to update status:', err);
            showNotification((err as any)?.message || 'Failed to update status', 'error');
        }
    };

    const handleToggleExpand = (classId: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(classId)) {
            newExpanded.delete(classId);
        } else {
            newExpanded.add(classId);
        }
        setExpandedRows(newExpanded);
    };

    const handleRemoveSection = async (classId: string, sectionId: string) => {
        try {
            const result = await removeSectionMutation.mutateAsync({ classId, sectionId });
            showNotification(result.message || 'Section removed successfully', 'success');
        } catch (err) {
            console.error('Failed to remove section:', err);
            showNotification((err as any)?.message || 'Failed to remove section', 'error');
        }
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
        setEditData(null);
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                }}
            >
                <Typography variant="h5" fontWeight={600} color="text.primary">
                    Classes
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAdd}
                    sx={{
                        textTransform: 'none',
                        borderRadius: 2,
                        px: 3,
                    }}
                >
                    Add Class
                </Button>
            </Box>

            {/* Table */}
            <TableContainer
                component={Paper}
                sx={{
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
            >
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ width: 50, fontWeight: 600, backgroundColor: '#f5f5f5' }}></TableCell>
                            <TableCell sx={{ fontWeight: 600, backgroundColor: '#f5f5f5' }}>ID</TableCell>
                            <TableCell sx={{ fontWeight: 600, backgroundColor: '#f5f5f5' }}>Class Name</TableCell>
                            <TableCell sx={{ fontWeight: 600, backgroundColor: '#f5f5f5' }}>Sections</TableCell>
                            <TableCell sx={{ fontWeight: 600, backgroundColor: '#f5f5f5' }} align="center">Status</TableCell>
                            <TableCell sx={{ fontWeight: 600, backgroundColor: '#f5f5f5' }} align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                    <Typography>Loading...</Typography>
                                </TableCell>
                            </TableRow>
                        ) : error ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                    <Typography color="error">
                                        {(error as { message?: string })?.message || 'Failed to load classes'}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : classes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">
                                        No classes found. Click 'Add Class' to create one.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            classes.map((classItem: Class) => (
                                <>
                                <TableRow 
                                    hover 
                                    key={classItem.classId}
                                    sx={{ '& td': { py: 1 } }} // Keep row height stable
                                >
                                        <TableCell>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleToggleExpand(classItem.classId)}
                                            >
                                                {expandedRows.has(classItem.classId) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                            </IconButton>
                                        </TableCell>
                                        <TableCell>{classItem.classId}</TableCell>
                                        <TableCell>{classItem.name}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={`${classItem.sections?.length || 0} sections`}
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <StatusChip status={classItem.status || 'active'} />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                                <Tooltip title="Edit">
                                                    <IconButton size="small" color="primary" onClick={() => handleEdit(classItem)}>
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title={classItem.status === 'active' ? 'Deactivate' : 'Activate'}>
                                                    <Switch
                                                        size="small"
                                                        checked={classItem.status === 'active'}
                                                        onChange={() => handleToggleStatus(classItem)}
                                                        disabled={updateMutation.isPending}
                                                        color="success"
                                                    />
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                    {/* Expanded Row for Sections */}
                                    <TableRow key={`${classItem.classId}-expand`}>
                                        <TableCell colSpan={6} sx={{ py: 0 }}>
                                            <Collapse in={expandedRows.has(classItem.classId)} timeout="auto" unmountOnExit>
                                                <Box sx={{ p: 2, bgcolor: 'action.hover' }}>
                                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                                        Sections
                                                    </Typography>
                                                    {classItem.sections.length === 0 ? (
                                                        <Typography variant="body2" color="text.secondary">
                                                            No sections added yet.
                                                        </Typography>
                                                    ) : (
                                                        <Table size="small">
                                                            <TableHead>
                                                                <TableRow>
                                                                    <TableCell>Section ID</TableCell>
                                                                    <TableCell>Name</TableCell>
                                                                    <TableCell>Class Teacher</TableCell>
                                                                    <TableCell align="center">Actions</TableCell>
                                                                </TableRow>
                                                            </TableHead>
                                                            <TableBody>
                                                                {classItem.sections.map((section) => (
                                                                    <TableRow key={section.sectionId} sx={{ '& td': { py: 0.5 } }}>
                                                                        <TableCell>{section.sectionId}</TableCell>
                                                                        <TableCell>{section.name}</TableCell>
                                                                        <TableCell>{getTeacherName(section)}</TableCell>
                                                                        <TableCell align="center">
                                                                            <Tooltip title="Remove Section">
                                                                                <Switch
                                                                                    size="small"
                                                                                    checked={true}
                                                                                    onChange={() => handleRemoveSection(classItem.classId, section.sectionId)}
                                                                                    disabled={removeSectionMutation.isPending}
                                                                                    color="error"
                                                                                />
                                                                            </Tooltip>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    )}
                                                    <Button
                                                        startIcon={<AddIcon />}
                                                        size="small"
                                                        sx={{ mt: 1 }}
                                                        onClick={() => handleEdit(classItem)}
                                                    >
                                                        Add Section
                                                    </Button>
                                                </Box>
                                            </Collapse>
                                        </TableCell>
                                    </TableRow>
                                </>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <ClassDialog
                open={dialogOpen}
                onClose={handleDialogClose}
                schoolId={schoolId}
                editData={editData}
            />
        </Box>
    );
};

export default ClassesPage;
