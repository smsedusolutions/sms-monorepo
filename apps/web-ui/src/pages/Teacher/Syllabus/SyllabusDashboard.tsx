import React, { useState } from 'react';
import {
    Box, Typography, Paper, Grid, Button, LinearProgress, Chip, Skeleton,
    Alert, Stack, Checkbox, FormControlLabel, Snackbar,
} from '@mui/material';
import {
    MenuBook as SyllabusIcon,
    CheckCircle as DoneIcon,
    Save as SaveIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useApi from '../../../queries/useApi';
import TokenService from '../../../queries/token/tokenService';
import { useIsMobile } from '../../../hooks/useIsMobile';

export const SyllabusDashboard: React.FC = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const teacherId = TokenService.getUserId() || '';
    const isMobile = useIsMobile();
    const queryClient = useQueryClient();
    const [toast, setToast] = useState('');

    const { data, isLoading, error } = useQuery({
        queryKey: ['teacher-syllabus', schoolId, teacherId],
        queryFn: () => useApi<any>('GET', `/api/academics/school/${schoolId}/syllabus/teacher/${teacherId}`),
        enabled: !!schoolId && !!teacherId,
    });

    const updateChapter = useMutation({
        mutationFn: ({ chapterId, completed }: { chapterId: string; completed: boolean }) =>
            useApi<any>('PATCH', `/api/academics/school/${schoolId}/syllabus/chapters/${chapterId}`, {
                status: completed ? 'completed' : 'in_progress',
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teacher-syllabus'] });
            setToast('Syllabus progress updated!');
        },
    });

    const chapters: any[] = data?.data?.chapters || [];
    const completedCount = chapters.filter(c => c.status === 'completed').length;
    const progress = chapters.length > 0 ? Math.round((completedCount / chapters.length) * 100) : 0;

    return (
        <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 900, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <SyllabusIcon sx={{ color: 'primary.main', fontSize: 32 }} />
                <Box>
                    <Typography variant="h5" fontWeight={800} sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
                        My Teaching Syllabus Progress
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Mark chapters as completed as you finish teaching them</Typography>
                </Box>
            </Box>

            {/* Progress Card */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 3, bgcolor: 'grey.50' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography fontWeight={700}>Your Course Completion</Typography>
                    <Chip label={`${progress}% Done`} color={progress >= 80 ? 'success' : 'primary'} size="small" />
                </Box>
                <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 5, mb: 1 }} />
                <Typography variant="caption" color="text.secondary">
                    {completedCount} of {chapters.length} chapters marked as completed
                </Typography>
            </Paper>

            {isLoading ? (
                <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
            ) : error ? (
                <Alert severity="error">Failed to load syllabus items.</Alert>
            ) : chapters.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <SyllabusIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.4 }} />
                    <Typography color="text.secondary">No assigned syllabus chapters found for your subjects.</Typography>
                </Box>
            ) : (
                <Stack spacing={1.5}>
                    {chapters.map((chapter: any, idx: number) => {
                        const isDone = chapter.status === 'completed';
                        return (
                            <Paper
                                key={chapter.id || chapter._id || idx}
                                elevation={0}
                                sx={{
                                    p: 2,
                                    borderRadius: 2.5,
                                    border: '1px solid',
                                    borderColor: isDone ? 'success.light' : 'divider',
                                    bgcolor: isDone ? '#f0fdf4' : 'background.paper',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 2,
                                }}
                            >
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={isDone}
                                            onChange={(e) => updateChapter.mutate({ chapterId: chapter.id || chapter._id, completed: e.target.checked })}
                                            color="success"
                                        />
                                    }
                                    label={
                                        <Box>
                                            <Typography fontWeight={600} sx={{ fontSize: '0.95rem', textDecoration: isDone ? 'line-through' : 'none', color: isDone ? 'text.secondary' : 'text.primary' }}>
                                                {chapter.title}
                                            </Typography>
                                            {chapter.className && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {chapter.className} • {chapter.subjectName || 'Subject'}
                                                </Typography>
                                            )}
                                        </Box>
                                    }
                                    sx={{ m: 0, flex: 1 }}
                                />
                                <Chip label={isDone ? 'Completed' : 'Pending'} size="small" color={isDone ? 'success' : 'default'} />
                            </Paper>
                        );
                    })}
                </Stack>
            )}

            <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast('')} message={toast} />
        </Box>
    );
};

export default SyllabusDashboard;
