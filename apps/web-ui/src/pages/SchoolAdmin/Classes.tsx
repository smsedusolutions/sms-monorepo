import { useState, useMemo } from 'react';
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
    CircularProgress,
    Card,
    CardContent,
} from '@mui/material';
import {
    Edit as EditIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    Class as ClassIcon,
    Person as PersonIcon,
} from '@mui/icons-material';
import { StatusChip } from '../../components/Table/DataTable';
import ClassDialog from '../../components/Dialogs/AddClassDialog';
import { useGetClasses, useUpdateClass, useRemoveSection } from '../../queries/Class';
import type { Class } from '../../types';
import TokenService from '../../queries/token/tokenService';
import { useNotificationStore } from '../../stores/notificationStore';
import { useIsMobile } from '../../hooks/useIsMobile';
import MobileCardList from '../../components/mobile/data/MobileCardList';
import { sortClassesNumerically } from '../../utils/classSort';

const ClassesPage = () => {
    const isMobile = useIsMobile();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editData, setEditData] = useState<Class | null>(null);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const { showNotification } = useNotificationStore();

    const schoolId = TokenService.getSchoolId() || '';
    const { data, isLoading, error } = useGetClasses(schoolId);

    const updateMutation = useUpdateClass(schoolId);
    const removeSectionMutation = useRemoveSection(schoolId);

    // Natural & numerical ascending sort for classes (e.g. Nursery, LKG, UKG, Class 1, Class 2, ... Class 10)
    const classes = useMemo(() => {
        return sortClassesNumerically(data?.data || []);
    }, [data?.data]);

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
        <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: { xs: 2, sm: 3 },
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h5" fontWeight={700} color="text.primary" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                        Classes
                    </Typography>
                    <Chip
                        label={`${classes.length} Total`}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontWeight: 700, borderRadius: '8px' }}
                    />
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAdd}
                    sx={{
                        textTransform: 'none',
                        borderRadius: 2.5,
                        px: { xs: 2, sm: 3 },
                        py: { xs: 0.8, sm: 1 },
                        fontWeight: 700,
                    }}
                >
                    Add Class
                </Button>
            </Box>

            {/* Mobile View */}
            {isMobile ? (
                <MobileCardList
                    isLoading={isLoading}
                    emptyTitle="No Classes Found"
                    emptyMessage="Click 'Add Class' to create your first class and define sections."
                    totalCount={classes.length}
                    itemCount={classes.length}
                >
                    {classes.map((classItem: Class) => {
                        const isExpanded = expandedRows.has(classItem.classId);
                        const sectionsCount = classItem.sections?.length || 0;

                        return (
                            <Card
                                key={classItem.classId}
                                variant="outlined"
                                sx={{
                                    borderRadius: 2,
                                    mb: 1.5,
                                    borderColor: isExpanded ? 'primary.main' : 'divider',
                                    transition: 'all 0.2s ease',
                                    boxShadow: isExpanded ? '0 4px 14px rgba(79, 70, 229, 0.08)' : 'none',
                                }}
                            >
                                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                    {/* Top Row: Class Info & Quick Actions */}
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                                        <Box
                                            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, cursor: 'pointer' }}
                                            onClick={() => handleToggleExpand(classItem.classId)}
                                        >
                                            <Box
                                                sx={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: 2.5,
                                                    bgcolor: 'primary.50',
                                                    color: 'primary.main',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <ClassIcon fontSize="small" />
                                            </Box>
                                            <Box sx={{ minWidth: 0 }}>
                                                <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a', lineHeight: 1.2 }}>
                                                    {classItem.name}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
                                                    {classItem.classId}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        {/* Status & Edit */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                                            <StatusChip status={classItem.status || 'active'} />
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={() => handleEdit(classItem)}
                                                sx={{ p: 0.8 }}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleToggleExpand(classItem.classId)}
                                                sx={{ p: 0.8 }}
                                            >
                                                {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                                            </IconButton>
                                        </Box>
                                    </Box>

                                    {/* Middle Row: Meta Chips */}
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            mt: 1.5,
                                            pt: 1,
                                            borderTop: '1px dashed',
                                            borderColor: 'divider',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => handleToggleExpand(classItem.classId)}
                                    >
                                        <Chip
                                            label={`${sectionsCount} ${sectionsCount === 1 ? 'section' : 'sections'}`}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                            sx={{ fontWeight: 700, borderRadius: '6px', fontSize: '0.75rem' }}
                                        />
                                        <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700 }}>
                                            {isExpanded ? 'Hide Sections' : 'View Sections'}
                                        </Typography>
                                    </Box>

                                    {/* Expandable Sections List */}
                                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                        <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: 1 }}>
                                                    Class Sections
                                                </Typography>
                                                <Button
                                                    startIcon={<AddIcon />}
                                                    size="small"
                                                    onClick={() => handleEdit(classItem)}
                                                    sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'none', py: 0.2 }}
                                                >
                                                    Add Section
                                                </Button>
                                            </Box>

                                            {classItem.sections.length === 0 ? (
                                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 1 }}>
                                                    No sections configured.
                                                </Typography>
                                            ) : (
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                    {classItem.sections.map((section) => (
                                                        <Box
                                                            key={section.sectionId}
                                                            sx={{
                                                                p: 1.5,
                                                                borderRadius: 2,
                                                                bgcolor: 'action.hover',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                            }}
                                                        >
                                                            <Box sx={{ minWidth: 0 }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                                                        Section {section.name}
                                                                    </Typography>
                                                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
                                                                        ({section.sectionId})
                                                                    </Typography>
                                                                </Box>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                                                                    <PersonIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                                                        Teacher: {getTeacherName(section)}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>

                                                            <Tooltip title="Delete Section">
                                                                <IconButton
                                                                    size="small"
                                                                    color="error"
                                                                    onClick={() => handleRemoveSection(classItem.classId, section.sectionId)}
                                                                    disabled={removeSectionMutation.isPending}
                                                                >
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Box>
                                                    ))}
                                                </Box>
                                            )}
                                        </Box>
                                    </Collapse>
                                </CardContent>
                            </Card>
                        );
                    })}
                </MobileCardList>
            ) : (
                /* Desktop Table View */
                <TableContainer
                    component={Paper}
                    sx={{
                        borderRadius: 2,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        border: '1px solid',
                        borderColor: 'divider',
                    }}
                    elevation={0}
                >
                    <Table>
                        <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                            <TableRow>
                                <TableCell sx={{ width: 50, fontWeight: 700 }}></TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Class Name</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Sections</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                        <CircularProgress size={30} />
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
                                            sx={{ '& td': { py: 1.5 } }}
                                        >
                                            <TableCell>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleToggleExpand(classItem.classId)}
                                                >
                                                    {expandedRows.has(classItem.classId) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                                </IconButton>
                                            </TableCell>
                                            <TableCell sx={{ fontFamily: 'monospace' }}>{classItem.classId}</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>{classItem.name}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={`${classItem.sections?.length || 0} sections`}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                    sx={{ fontWeight: 600 }}
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
                                                    <Box sx={{ p: 2.5, bgcolor: 'rgba(0,0,0,0.015)' }}>
                                                        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>
                                                            Sections
                                                        </Typography>
                                                        {classItem.sections.length === 0 ? (
                                                            <Typography variant="body2" color="text.secondary">
                                                                No sections added yet.
                                                            </Typography>
                                                        ) : (
                                                            <Table size="small">
                                                                <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                                                                    <TableRow>
                                                                        <TableCell sx={{ fontWeight: 600 }}>Section ID</TableCell>
                                                                        <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                                                                        <TableCell sx={{ fontWeight: 600 }}>Class Teacher</TableCell>
                                                                        <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                                                                    </TableRow>
                                                                </TableHead>
                                                                <TableBody>
                                                                    {classItem.sections.map((section) => (
                                                                        <TableRow key={section.sectionId} sx={{ '& td': { py: 1 } }}>
                                                                            <TableCell sx={{ fontFamily: 'monospace' }}>{section.sectionId}</TableCell>
                                                                            <TableCell sx={{ fontWeight: 600 }}>{section.name}</TableCell>
                                                                            <TableCell>{getTeacherName(section)}</TableCell>
                                                                            <TableCell align="center">
                                                                                <Tooltip title="Remove Section">
                                                                                    <IconButton
                                                                                        size="small"
                                                                                        color="error"
                                                                                        onClick={() => handleRemoveSection(classItem.classId, section.sectionId)}
                                                                                        disabled={removeSectionMutation.isPending}
                                                                                    >
                                                                                        <DeleteIcon fontSize="small" />
                                                                                    </IconButton>
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
                                                            sx={{ mt: 1.5, fontWeight: 600, textTransform: 'none' }}
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
            )}

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
