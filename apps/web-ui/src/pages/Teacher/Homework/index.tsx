import React, { useState } from 'react';
import {
    Box,
    Typography,
    Grid,
    Chip,
    Alert,
    Skeleton,
    Button,
    IconButton,
    Tabs,
    Tab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Tooltip,
} from '@mui/material';
import {
    Add as AddIcon,
    Assignment as AssignmentIcon,
    CalendarToday as CalendarIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    CheckCircleOutline as CompleteIcon,
    Replay as ReopenIcon,
    PeopleAlt as SubmissionsIcon,
    Grading as GradingIcon,
} from '@mui/icons-material';
import { useGetTeacherHomework, useDeleteHomework, useToggleHomeworkStatus } from '../../../queries/Homework';
import TokenService from '../../../queries/token/tokenService';
import type { Homework } from '../../../types';
import { AppCard } from '../../../components/shared/AppCard';
import { AppButton } from '../../../components/shared/AppButton';
import HomeworkDialog from '../../../components/Dialogs/HomeworkDialog';
import SubmissionsView from './SubmissionsView';
import { useUrlTab } from '../../../hooks/useUrlTab';
import { useLocation } from 'react-router-dom';

const TeacherHomework: React.FC = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const teacherId = TokenService.getTeacherId() || '';
    const location = useLocation();

    const [tabValue, setTabValue] = useUrlTab(0, ['active', 'completed', 'all', 'submissions']);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [homeworkToDelete, setHomeworkToDelete] = useState<Homework | null>(null);
    const [isHomeworkDialogOpen, setIsHomeworkDialogOpen] = useState(false);
    const [homeworkToEdit, setHomeworkToEdit] = useState<Homework | null>(null);
    const [selectedHwForSubmissions, setSelectedHwForSubmissions] = useState<Homework | null>(null);
    const [isSubmissionsModalOpen, setIsSubmissionsModalOpen] = useState(false);

    React.useEffect(() => {
        if (location.state?.openDialog || location.state?.openCreateDialog) {
            setIsHomeworkDialogOpen(true);
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const statusFilter = tabValue === 0 ? 'active' : tabValue === 1 ? 'completed' : undefined;

    const { data, isLoading, error, refetch } = useGetTeacherHomework(schoolId, teacherId, { status: statusFilter });
    const deleteHomework = useDeleteHomework(schoolId);
    const toggleHomeworkStatus = useToggleHomeworkStatus(schoolId);

    const homework = data?.data || [];

    // Set initial homework for submissions tab if not selected
    React.useEffect(() => {
        if (homework.length > 0 && !selectedHwForSubmissions) {
            setSelectedHwForSubmissions(homework[0]);
        }
    }, [homework, selectedHwForSubmissions]);

    const handleDelete = async () => {
        if (homeworkToDelete) {
            await deleteHomework.mutateAsync(homeworkToDelete.homeworkId);
            setDeleteDialogOpen(false);
            setHomeworkToDelete(null);
            refetch();
        }
    };

    const handleToggleStatus = (hw: Homework, targetStatus: 'active' | 'completed') => {
        toggleHomeworkStatus.mutate(
            { homeworkId: hw.homeworkId, status: targetStatus },
            { onSuccess: () => refetch() }
        );
    };

    const handleOpenSubmissions = (hw: Homework) => {
        setSelectedHwForSubmissions(hw);
        setIsSubmissionsModalOpen(true);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Failed to load homework. Please try again later.</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1400, mx: 'auto' }}>
            {/* Header Section */}
            <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: 2,
                mb: 3
            }}>
                <Box>
                    <Typography variant="h4" fontWeight={800} sx={{
                        color: 'text.primary',
                        letterSpacing: '-0.02em',
                        mb: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5
                    }}>
                        <AssignmentIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                        Homework & Submissions
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Manage assignments, mark completion, and evaluate student submissions
                    </Typography>
                </Box>
                <AppButton
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                        setHomeworkToEdit(null);
                        setIsHomeworkDialogOpen(true);
                    }}
                    sx={{ px: 3, py: 1.2, borderRadius: 2, boxShadow: '0 8px 16px -4px rgba(25, 118, 210, 0.3)' }}
                >
                    Create Homework
                </AppButton>
            </Box>

            {/* Navigation Tabs Bar */}
            <Box sx={{
                mb: 3,
                bgcolor: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                p: 0.5,
                width: 'fit-content',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 4px 12px -2px rgba(0,0,0,0.05)'
            }}>
                <Tabs
                    value={tabValue}
                    onChange={(_, v) => setTabValue(v)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        minHeight: 44,
                        '& .MuiTabs-indicator': {
                            height: '100%',
                            borderRadius: 2,
                            bgcolor: 'primary.main',
                            zIndex: 0,
                            opacity: 0.08
                        },
                        '& .MuiTab-root': {
                            minHeight: 44,
                            px: 2.5,
                            borderRadius: 2,
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            textTransform: 'none',
                            color: 'text.secondary',
                            transition: '0.2s',
                            zIndex: 1,
                            '&.Mui-selected': { color: 'primary.main' },
                            '&:hover': { color: 'primary.main' }
                        }
                    }}
                >
                    <Tab label="Active Assignments" />
                    <Tab label="Completed" />
                    <Tab label="All Assignments" />
                    <Tab icon={<GradingIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Submissions Tab" />
                </Tabs>
            </Box>

            {/* TAB 3: DEDICATED SUBMISSIONS TAB */}
            {tabValue === 3 ? (
                <Box sx={{ bgcolor: '#ffffff', borderRadius: 3, border: '1px solid #e2e8f0', p: { xs: 2, sm: 3 } }}>
                    {/* Homework Selector for Submissions */}
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', gap: 2, mb: 3 }}>
                        <Box sx={{ minWidth: 280, maxWidth: 450 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel id="select-hw-label">Select Homework Assignment</InputLabel>
                                <Select
                                    labelId="select-hw-label"
                                    label="Select Homework Assignment"
                                    value={selectedHwForSubmissions?.homeworkId || (homework[0]?.homeworkId || '')}
                                    onChange={(e) => {
                                        const selected = homework.find(h => h.homeworkId === e.target.value);
                                        if (selected) setSelectedHwForSubmissions(selected);
                                    }}
                                    sx={{ borderRadius: 2, fontWeight: 600 }}
                                >
                                    {homework.map((hw) => (
                                        <MenuItem key={hw.homeworkId} value={hw.homeworkId}>
                                            {hw.title} ({hw.className} - {hw.subjectName})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                        {selectedHwForSubmissions && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip
                                    size="small"
                                    label={`Due: ${formatDate(selectedHwForSubmissions.dueDate)}`}
                                    color={isOverdue(selectedHwForSubmissions.dueDate) ? 'error' : 'default'}
                                    sx={{ fontWeight: 600 }}
                                />
                                <Chip
                                    size="small"
                                    label={selectedHwForSubmissions.status.toUpperCase()}
                                    color={selectedHwForSubmissions.status === 'active' ? 'success' : 'primary'}
                                    sx={{ fontWeight: 700 }}
                                />
                            </Box>
                        )}
                    </Box>

                    {selectedHwForSubmissions ? (
                        <SubmissionsView
                            key={selectedHwForSubmissions.homeworkId}
                            homeworkId={selectedHwForSubmissions.homeworkId}
                            homeworkTitle={`${selectedHwForSubmissions.title} (${selectedHwForSubmissions.className} - ${selectedHwForSubmissions.subjectName})`}
                        />
                    ) : (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                            <AssignmentIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 1.5 }} />
                            <Typography variant="h6" fontWeight={700} color="#1e293b">
                                No Homework Assignments Found
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Please create a homework assignment to view student submissions.
                            </Typography>
                        </Box>
                    )}
                </Box>
            ) : (
                /* ASSIGNMENTS LIST (TABS 0, 1, 2) */
                <Grid container spacing={3}>
                    {isLoading ? (
                        [1, 2, 3].map((i) => (
                            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={i}>
                                <AppCard sx={{ height: 260 }}>
                                    <Box sx={{ p: 1 }}>
                                        <Skeleton variant="rectangular" width="40%" height={24} sx={{ borderRadius: 1, mb: 2 }} />
                                        <Skeleton variant="text" width="90%" height={32} sx={{ mb: 1 }} />
                                        <Skeleton variant="text" width="60%" />
                                        <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                                            <Skeleton variant="circular" width={32} height={32} />
                                            <Skeleton variant="circular" width={32} height={32} />
                                        </Box>
                                    </Box>
                                </AppCard>
                            </Grid>
                        ))
                    ) : homework.length === 0 ? (
                        <Grid size={{ xs: 12 }}>
                            <AppCard sx={{ p: 6, textAlign: 'center', border: '2px dashed', borderColor: 'divider', bgcolor: 'transparent' }} hover={false}>
                                <Box sx={{ maxWidth: 400, mx: 'auto' }}>
                                    <Box sx={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: '50%',
                                        bgcolor: 'primary.50',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mx: 'auto',
                                        mb: 3
                                    }}>
                                        <AssignmentIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                                    </Box>
                                    <Typography variant="h5" fontWeight={700} gutterBottom>
                                        No Assignments Found
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                                        {tabValue === 1
                                            ? 'No completed assignments. Mark active homework as completed when finished.'
                                            : 'Your list is empty. Start by creating a homework assignment for your students.'}
                                    </Typography>
                                    <AppButton
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={() => {
                                            setHomeworkToEdit(null);
                                            setIsHomeworkDialogOpen(true);
                                        }}
                                        sx={{ borderRadius: 2 }}
                                    >
                                        Assign Homework
                                    </AppButton>
                                </Box>
                            </AppCard>
                        </Grid>
                    ) : (
                        homework.map((hw: Homework) => {
                            const isCompleted = hw.status === 'completed';
                            const statusColor = hw.status === 'active' ? 'success' : isCompleted ? 'primary' : 'error';
                            const accentColor = hw.status === 'active' ? '#2e7d32' : isCompleted ? '#1976d2' : '#d32f2f';

                            return (
                                <Grid size={{ xs: 12, md: 6, lg: 4 }} key={hw.homeworkId}>
                                    <AppCard
                                        sx={{
                                            height: '100%',
                                            p: 0,
                                            position: 'relative',
                                            overflow: 'hidden',
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            '&:hover': {
                                                transform: 'translateY(-4px)',
                                                boxShadow: '0 16px 32px -8px rgba(0,0,0,0.08)'
                                            }
                                        }}
                                    >
                                        {/* Status Accent Bar */}
                                        <Box sx={{
                                            position: 'absolute',
                                            left: 0,
                                            top: 0,
                                            bottom: 0,
                                            width: 6,
                                            bgcolor: accentColor,
                                            opacity: 0.8
                                        }} />

                                        <Box sx={{ p: 2.5 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                                                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                                                    <Chip
                                                        label={hw.className}
                                                        size="small"
                                                        sx={{
                                                            fontWeight: 700,
                                                            bgcolor: 'primary.50',
                                                            color: 'primary.700',
                                                            borderRadius: 1,
                                                            fontSize: '0.65rem',
                                                            textTransform: 'uppercase'
                                                        }}
                                                    />
                                                    <Chip
                                                        label={hw.subjectName}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{
                                                            fontWeight: 700,
                                                            borderColor: 'divider',
                                                            borderRadius: 1,
                                                            fontSize: '0.65rem',
                                                            textTransform: 'uppercase'
                                                        }}
                                                    />
                                                </Box>
                                                <Chip
                                                    size="small"
                                                    label={hw.status.toUpperCase()}
                                                    color={statusColor as any}
                                                    sx={{ fontWeight: 800, fontSize: '0.65rem', height: 22 }}
                                                />
                                            </Box>

                                            <Typography variant="h6" fontWeight={700} sx={{ mb: 1, color: 'text.primary', letterSpacing: '-0.01em', fontSize: '1.05rem' }}>
                                                {hw.title}
                                            </Typography>

                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{
                                                    mb: 2,
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                    fontWeight: 500,
                                                    lineHeight: 1.5,
                                                    minHeight: '3em'
                                                }}
                                            >
                                                {hw.description}
                                            </Typography>

                                            {/* Due Date & Submissions Quick Button */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 1 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                    <CalendarIcon sx={{ fontSize: 16, color: isOverdue(hw.dueDate) ? 'error.main' : 'text.disabled' }} />
                                                    <Typography variant="caption" sx={{ fontWeight: 700, color: isOverdue(hw.dueDate) ? 'error.main' : 'text.secondary' }}>
                                                        Due: {formatDate(hw.dueDate)}
                                                    </Typography>
                                                </Box>

                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    color="primary"
                                                    startIcon={<SubmissionsIcon sx={{ fontSize: 16 }} />}
                                                    onClick={() => handleOpenSubmissions(hw)}
                                                    sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', py: 0.3, px: 1 }}
                                                >
                                                    Submissions
                                                </Button>
                                            </Box>

                                            {/* Action Bar (Mark Complete, Edit, Delete) */}
                                            <Box sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                pt: 1.5,
                                                borderTop: '1px solid',
                                                borderColor: 'divider'
                                            }}>
                                                {/* Mark as Complete / Reopen Button */}
                                                {isCompleted ? (
                                                    <Button
                                                        size="small"
                                                        color="info"
                                                        startIcon={<ReopenIcon sx={{ fontSize: 16 }} />}
                                                        onClick={() => handleToggleStatus(hw, 'active')}
                                                        disabled={toggleHomeworkStatus.isPending}
                                                        sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', px: 1 }}
                                                    >
                                                        Reopen
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="small"
                                                        color="success"
                                                        startIcon={<CompleteIcon sx={{ fontSize: 16 }} />}
                                                        onClick={() => handleToggleStatus(hw, 'completed')}
                                                        disabled={toggleHomeworkStatus.isPending}
                                                        sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', px: 1 }}
                                                    >
                                                        Mark Completed
                                                    </Button>
                                                )}

                                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                    <Tooltip title="Edit Homework">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => {
                                                                setHomeworkToEdit(hw);
                                                                setIsHomeworkDialogOpen(true);
                                                            }}
                                                            sx={{
                                                                color: 'primary.main',
                                                                bgcolor: 'primary.50',
                                                                '&:hover': { bgcolor: 'primary.100' }
                                                            }}
                                                        >
                                                            <EditIcon sx={{ fontSize: 17 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete / Cancel">
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => {
                                                                setHomeworkToDelete(hw);
                                                                setDeleteDialogOpen(true);
                                                            }}
                                                            sx={{
                                                                bgcolor: 'error.50',
                                                                '&:hover': { bgcolor: 'error.100' }
                                                            }}
                                                        >
                                                            <DeleteIcon sx={{ fontSize: 17 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </AppCard>
                                </Grid>
                            );
                        })
                    )}
                </Grid>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Delete Homework</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete "{homeworkToDelete?.title}"? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button
                        color="error"
                        variant="contained"
                        onClick={handleDelete}
                        disabled={deleteHomework.isPending}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Create / Edit Homework Dialog */}
            <HomeworkDialog
                open={isHomeworkDialogOpen}
                onClose={() => {
                    setIsHomeworkDialogOpen(false);
                    setHomeworkToEdit(null);
                    refetch();
                }}
                schoolId={schoolId}
                editData={homeworkToEdit}
            />

            {/* Submissions Modal Dialog */}
            <Dialog
                open={isSubmissionsModalOpen}
                onClose={() => setIsSubmissionsModalOpen(false)}
                fullWidth
                maxWidth="md"
            >
                {selectedHwForSubmissions && (
                    <SubmissionsView
                        homeworkId={selectedHwForSubmissions.homeworkId}
                        homeworkTitle={`${selectedHwForSubmissions.title} (${selectedHwForSubmissions.className} - ${selectedHwForSubmissions.subjectName})`}
                        onClose={() => {
                            setIsSubmissionsModalOpen(false);
                            refetch();
                        }}
                    />
                )}
            </Dialog>
        </Box>
    );
};

export default TeacherHomework;
