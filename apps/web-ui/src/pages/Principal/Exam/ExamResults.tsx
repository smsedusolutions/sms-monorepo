import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Card,
    CardContent,
    LinearProgress,
} from '@mui/material';
import {
    Assignment as AssignmentIcon,
    TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useGetExams, useGetExamTerms } from '../../../queries/Exam';
import TokenService from '../../../queries/token/tokenService';
import type { Exam } from '../../../types/exam.types';

const ExamResults: React.FC = () => {
    const schoolId = TokenService.getSchoolId() || '';

    const [selectedExamId, setSelectedExamId] = useState('');
    const [yearFilter, setYearFilter] = useState('');

    const { data: examsData, isLoading: examsLoading } = useGetExams(schoolId, yearFilter || undefined);
    const { data: termsData } = useGetExamTerms(schoolId);

    const exams: Exam[] = examsData?.data || [];
    const terms = termsData?.data || [];

    const publishedExams = exams.filter(
        (e) => e.status === 'published'
    );

    const selectedExam = publishedExams.find((e) => e.examId === selectedExamId) || null;

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h5" fontWeight={600} gutterBottom>
                Exam Results Overview
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                View school-wide exam results and academic performance. (Read-only)
            </Typography>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Academic Year</InputLabel>
                    <Select
                        value={yearFilter}
                        label="Academic Year"
                        onChange={(e) => { setYearFilter(e.target.value); setSelectedExamId(''); }}
                    >
                        <MenuItem value="">All Years</MenuItem>
                        {terms
                            .map((t) => t.academicYear)
                            .filter((v, i, a) => a.indexOf(v) === i)
                            .map((year) => (
                                <MenuItem key={year} value={year}>{year}</MenuItem>
                            ))}
                    </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 240 }}>
                    <InputLabel>Select Exam</InputLabel>
                    <Select
                        value={selectedExamId}
                        label="Select Exam"
                        onChange={(e) => setSelectedExamId(e.target.value)}
                        disabled={publishedExams.length === 0}
                    >
                        <MenuItem value="">All Exams</MenuItem>
                        {publishedExams.map((exam) => (
                            <MenuItem key={exam.examId} value={exam.examId}>
                                {exam.name} {exam.academicYear ? `(${exam.academicYear})` : ''}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Paper>

            {/* Exam Summary Cards */}
            {examsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress />
                </Box>
            ) : publishedExams.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <TrendingUpIcon sx={{ fontSize: 56, color: '#cbd5e1', mb: 2 }} />
                    <Typography color="text.secondary" variant="h6">
                        No published exam results available
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Results will appear here once exams are approved and marks are entered by teachers.
                    </Typography>
                </Box>
            ) : (
                <>
                    <Typography variant="h6" fontWeight={700} color="#1e293b" sx={{ mb: 2 }}>
                        {selectedExam ? `Results: ${selectedExam.name}` : 'All Published Exams'}
                    </Typography>

                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        {(selectedExamId ? [selectedExam].filter(Boolean) : publishedExams).map((exam) => exam && (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={exam.examId}>
                                <Card
                                    sx={{
                                        border: '1px solid #e2e8f0',
                                        borderRadius: 3,
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                                            borderColor: '#3b82f6',
                                        },
                                    }}
                                >
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
                                            <Box
                                                sx={{
                                                    width: 44,
                                                    height: 44,
                                                    borderRadius: '12px',
                                                    background: 'linear-gradient(135deg, #6a11cb, #2575fc)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <AssignmentIcon sx={{ color: 'white', fontSize: 20 }} />
                                            </Box>
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography variant="subtitle2" fontWeight={700} noWrap>
                                                    {exam.name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {typeof exam.termId === 'object' ? (exam.termId as any)?.name : exam.termId || ''} {exam.academicYear ? `• ${exam.academicYear}` : ''}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            {[
                                                { label: 'Duration', value: (exam as any).duration ? `${(exam as any).duration} min` : 'N/A' },
                                                { label: 'Total Marks', value: (exam as any).totalMarks ? `${(exam as any).totalMarks}` : 'N/A' },
                                                { label: 'Passing Marks', value: (exam as any).passingMarks ? `${(exam as any).passingMarks}` : 'N/A' },
                                            ].map((item) => (
                                                <Box
                                                    key={item.label}
                                                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                                >
                                                    <Typography variant="caption" color="text.secondary">
                                                        {item.label}
                                                    </Typography>
                                                    <Typography variant="caption" fontWeight={600}>
                                                        {item.value}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Box>

                                        <Box sx={{ mt: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                <Typography variant="caption" color="text.secondary">Pass Rate</Typography>
                                                <Typography variant="caption" fontWeight={700} color="success.main">
                                                    {(exam as any).passRate != null ? `${(exam as any).passRate}%` : 'Pending'}
                                                </Typography>
                                            </Box>
                                            <LinearProgress
                                                variant={(exam as any).passRate != null ? 'determinate' : 'indeterminate'}
                                                value={(exam as any).passRate || 0}
                                                sx={{
                                                    height: 6,
                                                    borderRadius: 3,
                                                    bgcolor: '#e2e8f0',
                                                    '& .MuiLinearProgress-bar': {
                                                        borderRadius: 3,
                                                        bgcolor: '#22c55e',
                                                    },
                                                }}
                                            />
                                        </Box>

                                        <Chip
                                            label="Published"
                                            color="success"
                                            size="small"
                                            sx={{ mt: 2, fontWeight: 600 }}
                                        />
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Summary Table */}
                    <Paper sx={{ p: 2, borderRadius: 3 }}>
                        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                            Exam Summary
                        </Typography>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                        <TableCell sx={{ fontWeight: 700 }}>Exam Name</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Academic Year</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Term</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }} align="center">Total Marks</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }} align="center">Passing Marks</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {publishedExams.map((exam) => (
                                        <TableRow key={exam.examId} hover>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {exam.name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{exam.academicYear || '—'}</TableCell>
                                            <TableCell>{typeof exam.termId === 'object' ? (exam.termId as any)?.name : exam.termId || '—'}</TableCell>
                                            <TableCell align="center">{(exam as any).totalMarks || '—'}</TableCell>
                                            <TableCell align="center">{(exam as any).passingMarks || '—'}</TableCell>
                                            <TableCell align="center">
                                                <Chip label="Published" color="success" size="small" />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </>
            )}
        </Box>
    );
};

export default ExamResults;
