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
} from '@mui/material';
import {
    Add as AddIcon,
    Assignment as AssignmentIcon,
    CalendarToday as CalendarIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { useGetTeacherHomework, useDeleteHomework } from '../../../queries/Homework';
import TokenService from '../../../queries/token/tokenService';
import type { Homework } from '../../../types';
import { AppCard } from '../../../components/shared/AppCard';
import { AppButton } from '../../../components/shared/AppButton';
import HomeworkDialog from '../../../components/Dialogs/HomeworkDialog';
import { useUrlTab } from '../../../hooks/useUrlTab';

const TeacherHomework: React.FC = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const teacherId = TokenService.getTeacherId() || '';

    const [tabValue, setTabValue] = useUrlTab(0, ['active', 'completed', 'all']);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [homeworkToDelete, setHomeworkToDelete] = useState<Homework | null>(null);
    const [isHomeworkDialogOpen, setIsHomeworkDialogOpen] = useState(false);
    const [homeworkToEdit, setHomeworkToEdit] = useState<Homework | null>(null);

    const statusFilter = tabValue === 0 ? 'active' : tabValue === 1 ? 'completed' : undefined;

    const { data, isLoading, error, refetch } = useGetTeacherHomework(schoolId, teacherId, { status: statusFilter });
    const deleteHomework = useDeleteHomework(schoolId);

    const homework = data?.data || [];

    const handleDelete = async () => {
        if (homeworkToDelete) {
            await deleteHomework.mutateAsync(homeworkToDelete.homeworkId);
            setDeleteDialogOpen(false);
            setHomeworkToDelete(null);
            refetch();
        }
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
                mb: 4
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
                        Homework Management
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Design and track academic assignments for your classes
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

            {/* Tabs Bar */}
            <Box sx={{
                mb: 4,
                bgcolor: 'rgba(255, 255, 255, 0.6)',
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
                    sx={{
                        minHeight: 44,
                        '& .MuiTabs-indicator': {
                            height: '100%',
                            borderRadius: 2.5,
                            bgcolor: 'primary.main',
                            zIndex: 0,
                            opacity: 0.08
                        },
                        '& .MuiTab-root': {
                            minHeight: 44,
                            px: 3,
                            borderRadius: 2.5,
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
                    <Tab label="Active" />
                    <Tab label="Completed" />
                    <Tab label="All" />
                </Tabs>
            </Box>

            <Grid container spacing={3}>
                {isLoading ? (
                    [1, 2, 3].map((i) => (
                        <Grid size={{ xs: 12, md: 6, lg: 4 }} key={i}>
                            <AppCard sx={{ height: 240 }}>
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
                                    No Assignments Yet
                                </Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                                    Your list is empty. Start by creating a homework assignment for your students.
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
                                    Assign First Homework
                                </AppButton>
                            </Box>
                        </AppCard>
                    </Grid>
                ) : (
                    homework.map((hw: Homework) => {
                        const statusColor = hw.status === 'active' ? 'success' : hw.status === 'completed' ? 'primary' : 'error';
                        const accentColor = hw.status === 'active' ? '#2e7d32' : hw.status === 'completed' ? '#1976d2' : '#d32f2f';

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
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        '&:hover': {
                                            transform: 'translateY(-6px)',
                                            boxShadow: '0 20px 40px -12px rgba(0,0,0,0.1)'
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

                                    <Box sx={{ p: 3 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
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
                                                sx={{ fontWeight: 800, fontSize: '0.6rem', height: 20 }}
                                            />
                                        </Box>

                                        <Typography variant="h6" fontWeight={700} sx={{ mb: 1, color: 'text.primary', letterSpacing: '-0.01em' }}>
                                            {hw.title}
                                        </Typography>

                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{
                                                mb: 3,
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                                fontWeight: 500,
                                                lineHeight: 1.6,
                                                minHeight: '3.2em'
                                            }}
                                        >
                                            {hw.description}
                                        </Typography>

                                        <Box sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            pt: 2,
                                            borderTop: '1px solid',
                                            borderColor: 'divider'
                                        }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CalendarIcon sx={{ fontSize: 16, color: isOverdue(hw.dueDate) ? 'error.main' : 'text.disabled' }} />
                                                <Typography variant="caption" sx={{ fontWeight: 700, color: isOverdue(hw.dueDate) ? 'error.main' : 'text.secondary' }}>
                                                    Due: {formatDate(hw.dueDate)}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
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
                                                    <EditIcon sx={{ fontSize: 18 }} />
                                                </IconButton>
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
                                                    <DeleteIcon sx={{ fontSize: 18 }} />
                                                </IconButton>
                                            </Box>
                                        </Box>
                                    </Box>
                                </AppCard>
                            </Grid>
                        );
                    })
                )}
            </Grid>

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
        </Box>
    );
};

export default TeacherHomework;
