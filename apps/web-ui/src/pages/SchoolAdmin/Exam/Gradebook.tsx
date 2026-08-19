import React, { useState } from 'react';
import {
    Box, Typography, Paper, Grid, Select, MenuItem, FormControl, InputLabel,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, Button, Skeleton, Alert, Avatar,
} from '@mui/material';
import {
    Download as DownloadIcon,
    Assessment as GradebookIcon,
    EmojiEvents as TrophyIcon,
    School as ClassIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import useApi from '../../../queries/useApi';
import TokenService from '../../../queries/token/tokenService';
import { useGetExams } from '../../../queries/Exam';
import { useGetClasses } from '../../../queries/Class';
import { useGetSubjects } from '../../../queries/Subject';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { MobileCardItem, MobileCardList } from '../../../components/mobile';
import { sortClassesNumerically } from '../../../utils/classSort';

const gradeColor = (grade: string) => {
    if (!grade) return '#94a3b8';
    const g = grade.toUpperCase();
    if (g.startsWith('A')) return '#22c55e';
    if (g.startsWith('B')) return '#3b82f6';
    if (g.startsWith('C')) return '#f59e0b';
    if (g === 'D') return '#f97316';
    return '#ef4444';
};

export const Gradebook: React.FC = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const isMobile = useIsMobile();

    const [selectedExam, setSelectedExam] = useState('');
    const [selectedClass, setSelectedClass] = useState('');

    const { data: examsData } = useGetExams(schoolId);
    const { data: classesData } = useGetClasses(schoolId);
    const { data: subjectsData } = useGetSubjects(schoolId);

    const exams = examsData?.data || [];
    const classes = sortClassesNumerically(classesData?.data || []);
    const allSubjects = subjectsData?.data || [];

    const { data, isLoading, error } = useQuery({
        queryKey: ['gradebook', schoolId, selectedExam, selectedClass],
        queryFn: () => useApi<any>('GET', `/api/academics/school/${schoolId}/results/gradebook`, undefined, { examId: selectedExam, classId: selectedClass }),
        enabled: !!schoolId && !!selectedExam && !!selectedClass,
    });

    const gradebook: any = data?.data;
    const students: any[] = gradebook?.students || [];
    const subjects: any[] = gradebook?.subjects || [];

    const getSubjectName = (id: string) => allSubjects.find((s: any) => s._id === id || s.subjectId === id)?.name || id;

    const exportCSV = () => {
        const headers = ['Student Name', 'Roll No', ...subjects.map(s => getSubjectName(s.subjectId || s._id)), 'Total', 'Percentage', 'Grade', 'Rank'];
        const rows = students.map((s: any) => [
            s.studentName, s.rollNumber,
            ...subjects.map((sub: any) => {
                const r = s.results?.find((r: any) => r.subjectId === (sub.subjectId || sub._id));
                return r ? r.grade || r.marksObtained || '—' : '—';
            }),
            s.totalMarks || '—', s.percentage ? `${s.percentage}%` : '—', s.overallGrade || '—', s.rank || '—',
        ]);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gradebook_${selectedExam}_${selectedClass}.csv`;
        a.click();
    };

    return (
        <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <GradebookIcon sx={{ color: 'primary.main', fontSize: 32 }} />
                    <Box>
                        <Typography variant="h5" fontWeight={800} sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>Gradebook</Typography>
                        <Typography variant="body2" color="text.secondary">Class-wise academic performance overview</Typography>
                    </Box>
                </Box>
                {students.length > 0 && (
                    <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportCSV} size={isMobile ? 'small' : 'medium'}>
                        Export CSV
                    </Button>
                )}
            </Box>

            {/* Filters */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 3 }}>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Select Exam *</InputLabel>
                            <Select value={selectedExam} label="Select Exam *" onChange={e => setSelectedExam(e.target.value)}>
                                {exams.map((e: any) => <MenuItem key={e.examId} value={e.examId}>{e.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Select Class *</InputLabel>
                            <Select value={selectedClass} label="Select Class *" onChange={e => setSelectedClass(e.target.value)}>
                                {classes.map((c: any) => <MenuItem key={c.classId || c._id} value={c.classId || c._id}>{c.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Paper>

            {!selectedExam || !selectedClass ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <ClassIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.4 }} />
                    <Typography color="text.secondary">Select an exam and class to view the gradebook</Typography>
                </Box>
            ) : isLoading ? (
                <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
            ) : error ? (
                <Alert severity="error">Failed to load gradebook. Please try again.</Alert>
            ) : students.length === 0 ? (
                <Alert severity="info">No result data available for the selected exam and class.</Alert>
            ) : isMobile ? (
                /* Mobile: Card list */
                <MobileCardList isLoading={false} totalCount={students.length} itemCount={students.length} emptyTitle="No Students" emptyMessage="">
                    {students.map((student: any) => (
                        <MobileCardItem
                            key={student.studentId}
                            title={student.studentName}
                            subtitle={`Roll: ${student.rollNumber || '—'} • Rank: ${student.rank || '—'}`}
                            badge={student.overallGrade ? <Chip label={student.overallGrade} size="small" sx={{ bgcolor: gradeColor(student.overallGrade) + '20', color: gradeColor(student.overallGrade), fontWeight: 700 }} /> : undefined}
                            metaItems={[
                                ...(student.percentage !== undefined ? [{ label: 'Percentage', value: `${student.percentage}%` }] : []),
                                ...(student.totalMarks !== undefined ? [{ label: 'Total Marks', value: String(student.totalMarks) }] : []),
                            ]}
                        />
                    ))}
                </MobileCardList>
            ) : (
                /* Desktop: Spreadsheet table */
                <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                    <TableContainer sx={{ maxHeight: 600 }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, minWidth: 50, position: 'sticky', left: 0, zIndex: 3, bgcolor: 'grey.50' }}>#</TableCell>
                                    <TableCell sx={{ fontWeight: 700, minWidth: 160, position: 'sticky', left: 50, zIndex: 3, bgcolor: 'grey.50' }}>Student</TableCell>
                                    <TableCell sx={{ fontWeight: 700, minWidth: 80, position: 'sticky', left: 210, zIndex: 3, bgcolor: 'grey.50' }}>Roll</TableCell>
                                    {subjects.map((s: any) => (
                                        <TableCell key={s.subjectId || s._id} align="center" sx={{ fontWeight: 700, minWidth: 90, bgcolor: 'grey.50' }}>
                                            {getSubjectName(s.subjectId || s._id)}
                                        </TableCell>
                                    ))}
                                    <TableCell align="center" sx={{ fontWeight: 700, minWidth: 80, bgcolor: 'grey.50' }}>Total</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 700, minWidth: 90, bgcolor: 'grey.50' }}>Percentage</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 700, minWidth: 80, bgcolor: 'grey.50' }}>Grade</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 700, minWidth: 70, bgcolor: 'grey.50' }}>Rank</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {students.map((student: any, idx: number) => (
                                    <TableRow key={student.studentId} hover sx={{ '&:nth-of-type(even)': { bgcolor: 'grey.50' } }}>
                                        <TableCell sx={{ position: 'sticky', left: 0, bgcolor: 'inherit', zIndex: 1 }}>{idx + 1}</TableCell>
                                        <TableCell sx={{ position: 'sticky', left: 50, bgcolor: 'inherit', zIndex: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: 'primary.light' }}>
                                                    {student.studentName?.charAt(0)}
                                                </Avatar>
                                                <Typography variant="body2" fontWeight={600} noWrap>{student.studentName}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ position: 'sticky', left: 210, bgcolor: 'inherit', zIndex: 1 }}>
                                            <Typography variant="body2">{student.rollNumber || '—'}</Typography>
                                        </TableCell>
                                        {subjects.map((sub: any) => {
                                            const result = student.results?.find((r: any) => r.subjectId === (sub.subjectId || sub._id));
                                            return (
                                                <TableCell key={sub.subjectId || sub._id} align="center">
                                                    {result ? (
                                                        <Chip
                                                            label={result.grade || result.marksObtained || '—'}
                                                            size="small"
                                                            sx={{ bgcolor: result.grade ? gradeColor(result.grade) + '20' : 'grey.100', color: result.grade ? gradeColor(result.grade) : 'text.secondary', fontWeight: 700, minWidth: 40 }}
                                                        />
                                                    ) : (
                                                        <Typography variant="body2" color="text.disabled">—</Typography>
                                                    )}
                                                </TableCell>
                                            );
                                        })}
                                        <TableCell align="center"><Typography variant="body2" fontWeight={600}>{student.totalMarks ?? '—'}</Typography></TableCell>
                                        <TableCell align="center">
                                            <Typography variant="body2" fontWeight={700} color={student.percentage >= 60 ? 'success.main' : student.percentage >= 40 ? 'warning.main' : 'error.main'}>
                                                {student.percentage !== undefined ? `${student.percentage}%` : '—'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            {student.overallGrade ? (
                                                <Chip label={student.overallGrade} size="small" sx={{ bgcolor: gradeColor(student.overallGrade) + '20', color: gradeColor(student.overallGrade), fontWeight: 800 }} />
                                            ) : '—'}
                                        </TableCell>
                                        <TableCell align="center">
                                            {student.rank === 1 ? (
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                                    <TrophyIcon sx={{ color: '#f59e0b', fontSize: 16 }} />
                                                    <Typography fontWeight={700} color="#f59e0b">1st</Typography>
                                                </Box>
                                            ) : (
                                                <Typography variant="body2">{student.rank ? `#${student.rank}` : '—'}</Typography>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}
        </Box>
    );
};

export default Gradebook;
