import React, { useState } from 'react';
import {
    Box, Typography, Paper, Grid, Select, MenuItem, FormControl, InputLabel,
    LinearProgress, Chip, Skeleton, Alert, Stack, Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import {
    MenuBook as SyllabusIcon,
    ExpandMore as ExpandMoreIcon,
    CheckCircle as DoneIcon,
    RadioButtonUnchecked as PendingIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import useApi from '../../../queries/useApi';
import TokenService from '../../../queries/token/tokenService';
import { useGetClasses } from '../../../queries/Class';
import { useGetSubjects } from '../../../queries/Subject';

export const SyllabusOverview: React.FC = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');

    const { data: classesData } = useGetClasses(schoolId);
    const { data: subjectsData } = useGetSubjects(schoolId);
    const classes = classesData?.data || [];
    const subjects = subjectsData?.data || [];

    const { data, isLoading, error } = useQuery({
        queryKey: ['syllabus-overview', schoolId, selectedClass, selectedSubject],
        queryFn: () => useApi<any>('GET', `/api/academics/school/${schoolId}/syllabus`, undefined, {
            classId: selectedClass || undefined,
            subjectId: selectedSubject || undefined,
        }),
        enabled: !!schoolId,
    });

    const chapters: any[] = data?.data?.chapters || [];
    const completedChapters = chapters.filter(c => c.status === 'completed').length;
    const progress = chapters.length > 0 ? Math.round((completedChapters / chapters.length) * 100) : 0;

    return (
        <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 1000, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <SyllabusIcon sx={{ color: 'primary.main', fontSize: 32 }} />
                <Box>
                    <Typography variant="h5" fontWeight={800} sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
                        Syllabus & Curriculum Tracker
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Monitor chapter-wise teaching completion and progress</Typography>
                </Box>
            </Box>

            {/* Filters */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 3 }}>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Select Class</InputLabel>
                            <Select value={selectedClass} label="Select Class" onChange={e => setSelectedClass(e.target.value)}>
                                <MenuItem value="">All Classes</MenuItem>
                                {classes.map((c: any) => <MenuItem key={c.classId || c._id} value={c.classId || c._id}>{c.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Select Subject</InputLabel>
                            <Select value={selectedSubject} label="Select Subject" onChange={e => setSelectedSubject(e.target.value)}>
                                <MenuItem value="">All Subjects</MenuItem>
                                {subjects.map((s: any) => <MenuItem key={s.subjectId || s._id} value={s.subjectId || s._id}>{s.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Paper>

            {/* Progress Summary Card */}
            {chapters.length > 0 && (
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 3, bgcolor: 'grey.50' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography fontWeight={700}>Overall Completion</Typography>
                        <Chip label={`${progress}% Completed`} color={progress >= 75 ? 'success' : progress >= 40 ? 'warning' : 'default'} size="small" />
                    </Box>
                    <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 5, mb: 1 }} />
                    <Typography variant="caption" color="text.secondary">
                        {completedChapters} of {chapters.length} chapters completed
                    </Typography>
                </Paper>
            )}

            {isLoading ? (
                <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
            ) : error ? (
                <Alert severity="error">Failed to load syllabus data.</Alert>
            ) : chapters.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <SyllabusIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.4 }} />
                    <Typography color="text.secondary">No syllabus chapters configured for this selection.</Typography>
                </Box>
            ) : (
                <Stack spacing={1.5}>
                    {chapters.map((chapter: any, idx: number) => {
                        const isDone = chapter.status === 'completed';
                        return (
                            <Accordion key={chapter.id || idx} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px !important', '&:before': { display: 'none' } }}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, pr: 1 }}>
                                        {isDone ? <DoneIcon sx={{ color: 'success.main' }} /> : <PendingIcon sx={{ color: 'text.disabled' }} />}
                                        <Box sx={{ flex: 1 }}>
                                            <Typography fontWeight={600} sx={{ fontSize: '0.95rem' }}>
                                                Chapter {idx + 1}: {chapter.title}
                                            </Typography>
                                            {chapter.subjectName && (
                                                <Typography variant="caption" color="text.secondary">{chapter.subjectName}</Typography>
                                            )}
                                        </Box>
                                        <Chip label={isDone ? 'Completed' : 'In Progress'} color={isDone ? 'success' : 'default'} size="small" />
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails sx={{ pt: 0 }}>
                                    {chapter.description && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{chapter.description}</Typography>
                                    )}
                                    {chapter.estimatedHours && (
                                        <Typography variant="caption" color="text.secondary">Estimated: {chapter.estimatedHours} teaching hours</Typography>
                                    )}
                                </AccordionDetails>
                            </Accordion>
                        );
                    })}
                </Stack>
            )}
        </Box>
    );
};

export default SyllabusOverview;
