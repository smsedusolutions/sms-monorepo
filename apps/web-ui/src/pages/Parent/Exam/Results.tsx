import React from 'react';
import {
    Box,
    Typography,
    Alert,
    Skeleton,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Grid,
    Divider,
    Button,
    Stack,
} from '@mui/material';
import {
    EmojiEvents as TrophyIcon,
    TrendingUp as TrendingIcon,
    CalendarMonth as CalendarIcon,
    School as SchoolIcon,
    NotificationsActive as NotifyIcon,
    ArrowForward as ArrowForwardIcon,
    Badge as BadgeIcon,
    AssignmentTurnedIn as ReportIcon,
    Download as DownloadIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useChildSelector } from '../../../context/ChildSelectorContext';
import { useGetStudentReportCard } from '../../../queries/Exam';
import { useGetSubjects } from '../../../queries/Subject';
import TokenService from '../../../queries/token/tokenService';
import { exportReportCardPDF } from '../../../utils/reportCardPdfExport';
import { useAcademicYear } from '../../../hooks/useAcademicYear';

const ParentExamResults: React.FC = () => {
    const navigate = useNavigate();
    const schoolId = TokenService.getSchoolId() || '';
    const { currentAcademicYear } = useAcademicYear();
    const { selectedChild, setSelectedChild, children: contextChildren, isLoading: loadingChild } = useChildSelector();

    const { data: reportCardData, isLoading: reportLoading, error } = useGetStudentReportCard(
        schoolId,
        selectedChild?.studentId || ''
    );
    const { data: subjectsData } = useGetSubjects(schoolId);
    const subjects = subjectsData?.data || [];

    const getSubjectName = (subjectId: string): string => {
        const sub = subjects.find((s: any) => s.subjectId === subjectId || s._id === subjectId);
        return sub?.name || subjectId;
    };

    const reportCard = reportCardData?.data;
    const examResults = reportCard?.exams || [];

    // Show loading skeleton while children are loading
    if (loadingChild) {
        return (
            <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1300, mx: 'auto' }}>
                <Skeleton variant="text" width="40%" height={45} sx={{ mb: 1 }} />
                <Skeleton variant="text" width="25%" height={25} sx={{ mb: 3 }} />
                <Skeleton variant="rectangular" width="100%" height={350} sx={{ borderRadius: 4 }} />
            </Box>
        );
    }

    if (!selectedChild) {
        return (
            <Box sx={{ p: 3, maxWidth: 1300, mx: 'auto' }}>
                <Alert severity="info" sx={{ borderRadius: 3 }}>Please select a child to view their exam results.</Alert>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3, maxWidth: 1300, mx: 'auto' }}>
                <Alert severity="error" sx={{ borderRadius: 3 }}>Failed to load examination results. Please try again later.</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1300, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                    <Box sx={{ p: 1.25, borderRadius: 2.5, bgcolor: '#fef3c7', color: '#d97706' }}>
                        <TrophyIcon sx={{ fontSize: 28 }} />
                    </Box>
                    <Box>
                        <Typography variant="h4" fontWeight={800} color="#1e293b" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                            Exam Results & Report Cards
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Academic evaluation and grade reports for {selectedChild.firstName} {selectedChild.lastName} ({selectedChild.className ? `Grade ${selectedChild.className}-${selectedChild.sectionName}` : 'Class'})
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* ── Multi-Child Switcher Bar ── */}
            {contextChildren.length > 1 && (
                <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 1, display: 'block' }}>
                        Select Child
                    </Typography>
                    <Stack direction="row" spacing={1.5} flexWrap="wrap">
                        {contextChildren.map((child) => {
                            const isSelected = selectedChild.studentId === child.studentId;
                            return (
                                <Button
                                    key={child.studentId}
                                    variant={isSelected ? 'contained' : 'outlined'}
                                    onClick={() => setSelectedChild(child)}
                                    startIcon={<BadgeIcon />}
                                    sx={{
                                        borderRadius: 2.5,
                                        fontWeight: 700,
                                        textTransform: 'none',
                                        px: 2.5,
                                        py: 0.75,
                                        bgcolor: isSelected ? '#2563eb' : '#ffffff',
                                        borderColor: isSelected ? '#2563eb' : '#cbd5e1',
                                        color: isSelected ? '#ffffff' : '#475569',
                                        '&:hover': {
                                            bgcolor: isSelected ? '#1d4ed8' : '#f1f5f9',
                                            borderColor: isSelected ? '#1d4ed8' : '#94a3b8',
                                        }
                                    }}
                                >
                                    {child.firstName} {child.lastName} {child.className ? `(${child.className}-${child.sectionName})` : ''}
                                </Button>
                            );
                        })}
                    </Stack>
                </Paper>
            )}

            {/* Main Content Area */}
            {reportLoading ? (
                <Stack spacing={2}>
                    {[1, 2].map((i) => (
                        <Skeleton key={i} variant="rectangular" width="100%" height={220} sx={{ borderRadius: 4 }} />
                    ))}
                </Stack>
            ) : examResults.length === 0 ? (
                /* ── Full-Page Rich Empty State Container ── */
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 3, sm: 6 },
                        borderRadius: 4,
                        border: '1px solid #e2e8f0',
                        bgcolor: '#ffffff',
                        textAlign: 'center',
                        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.04)',
                    }}
                >
                    {/* Glowing Centered Icon */}
                    <Box
                        sx={{
                            width: 88,
                            height: 88,
                            borderRadius: '50%',
                            bgcolor: '#fffbeb',
                            border: '2px solid #fef3c7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 'auto',
                            mb: 2.5,
                            boxShadow: '0 12px 24px -6px rgba(245, 158, 11, 0.2)'
                        }}
                    >
                        <ReportIcon sx={{ fontSize: 44, color: '#f59e0b' }} />
                    </Box>

                    <Typography variant="h5" fontWeight={800} color="#1e293b" sx={{ mb: 1 }}>
                        No Examination Results Published Yet
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 620, mx: 'auto', mb: 4, lineHeight: 1.6 }}>
                        Report cards, subject-wise marks, and term evaluation details for <strong>{selectedChild.firstName}</strong> will appear here as soon as teachers complete grading and results are officially released by the school administration.
                    </Typography>

                    {/* Feature Information Grid */}
                    <Grid container spacing={2.5} sx={{ maxWidth: 850, mx: 'auto', mb: 4, textAlign: 'left' }}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', height: '100%' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: '#2563eb' }}>
                                    <CalendarIcon fontSize="small" />
                                    <Typography variant="subtitle2" fontWeight={700} color="#1e293b">Exam Timetable</Typography>
                                </Box>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.5 }}>
                                    Check upcoming exam dates, term schedules, and subject syllabus breakdown.
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', height: '100%' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: '#10b981' }}>
                                    <SchoolIcon fontSize="small" />
                                    <Typography variant="subtitle2" fontWeight={700} color="#1e293b">Grading Standard</Typography>
                                </Box>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.5 }}>
                                    Standardized grading scale from A+ (90%+) to D, verified by subject teachers.
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', height: '100%' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: '#8b5cf6' }}>
                                    <NotifyIcon fontSize="small" />
                                    <Typography variant="subtitle2" fontWeight={700} color="#1e293b">Instant Alerts</Typography>
                                </Box>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.5 }}>
                                    You will receive a notification as soon as fresh report cards are published.
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>

                    {/* Action buttons */}
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                        <Button
                            variant="contained"
                            endIcon={<ArrowForwardIcon />}
                            onClick={() => navigate('/parent/exam/scheduler')}
                            sx={{
                                bgcolor: '#2563eb',
                                '&:hover': { bgcolor: '#1d4ed8' },
                                borderRadius: 2.5,
                                fontWeight: 700,
                                px: 3.5,
                                py: 1.2,
                                textTransform: 'none'
                            }}
                        >
                            View Exam Schedules
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => navigate('/parent/teachers')}
                            sx={{
                                borderRadius: 2.5,
                                fontWeight: 700,
                                px: 3.5,
                                py: 1.2,
                                textTransform: 'none',
                                borderColor: '#cbd5e1',
                                color: '#475569',
                                '&:hover': { borderColor: '#2563eb', bgcolor: '#f0f9ff' }
                            }}
                        >
                            Contact Class Teacher
                        </Button>
                    </Stack>
                </Paper>
            ) : (
                /* Results List View when available */
                <Stack spacing={3}>
                    {examResults.map((examResult: any) => (
                        <Card key={examResult.examId} sx={{ borderRadius: 4, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                            <CardContent sx={{ p: 3 }}>
                                {/* Exam Header */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
                                    <Box>
                                        <Typography variant="h6" fontWeight={800} color="#1e293b">
                                            {examResult.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                            {examResult.term} | {examResult.type}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Chip
                                            label="Published"
                                            color="success"
                                            size="small"
                                            icon={<TrendingIcon />}
                                            sx={{ fontWeight: 700, px: 1 }}
                                        />
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            color="primary"
                                            startIcon={<DownloadIcon />}
                                            onClick={() => {
                                                const formattedResults = (examResult.results || []).map((r: any) => ({
                                                    subjectName: getSubjectName(r.subjectId),
                                                    totalMarks: r.marksObtained ?? 0,
                                                    maxMarks: r.maxMarks || 100,
                                                    grade: r.grade,
                                                    gradePoints: r.points,
                                                    remarks: r.remarks
                                                }));

                                                exportReportCardPDF({
                                                    schoolName: 'Demo International School',
                                                    studentName: selectedChild ? `${selectedChild.firstName} ${selectedChild.lastName}` : (reportCard?.student?.name || 'Student'),
                                                    rollNumber: selectedChild?.rollNumber || reportCard?.student?.rollNumber,
                                                    admissionNumber: (selectedChild as any)?.admissionNumber || reportCard?.student?.admissionNumber,
                                                    className: selectedChild?.className || reportCard?.student?.classId || 'Class',
                                                    sectionName: selectedChild?.sectionName || reportCard?.student?.sectionId,
                                                    academicYear: reportCard?.academicYear || currentAcademicYear,
                                                    examName: examResult.name,
                                                    termName: examResult.term,
                                                    results: formattedResults
                                                });
                                            }}
                                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                                        >
                                            Download PDF
                                        </Button>
                                    </Box>
                                </Box>

                                {/* Overall Performance Summary */}
                                {examResult.overall && (
                                    <Grid container spacing={2} sx={{ mb: 2.5 }}>
                                        <Grid size={{ xs: 6, sm: 3 }}>
                                            <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: '#eff6ff', borderRadius: 2.5, border: '1px solid #bfdbfe' }}>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>Total Marks</Typography>
                                                <Typography variant="h6" fontWeight={800} color="#1e40af">{examResult.overall.totalMarks || '-'}</Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid size={{ xs: 6, sm: 3 }}>
                                            <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: '#f5f3ff', borderRadius: 2.5, border: '1px solid #ddd6fe' }}>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>Obtained Marks</Typography>
                                                <Typography variant="h6" fontWeight={800} color="#6d28d9">{examResult.overall.obtainedMarks || '-'}</Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid size={{ xs: 6, sm: 3 }}>
                                            <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: '#ecfdf5', borderRadius: 2.5, border: '1px solid #a7f3d0' }}>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>Percentage</Typography>
                                                <Typography variant="h6" fontWeight={800} color="#047857">{examResult.overall.percentage ? `${examResult.overall.percentage}%` : '-'}</Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid size={{ xs: 6, sm: 3 }}>
                                            <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: '#fffbeb', borderRadius: 2.5, border: '1px solid #fde68a' }}>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>Overall Grade</Typography>
                                                <Typography variant="h6" fontWeight={800} color="#b45309">{examResult.overall.grade || '-'}</Typography>
                                            </Paper>
                                        </Grid>
                                    </Grid>
                                )}

                                <Divider sx={{ my: 2 }} />

                                {/* Subject-wise Results */}
                                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }} color="#1e293b">
                                    Subject-wise Performance
                                </Typography>

                                <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                                <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 700 }}>Max Marks</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 700 }}>Obtained</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 700 }}>Percentage</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 700 }}>Grade</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {examResult.results?.map((result: any, index: number) => {
                                                const percentage = result.maxMarks > 0
                                                    ? ((result.marksObtained / result.maxMarks) * 100).toFixed(1)
                                                    : '-';
                                                const isPass = result.grade !== 'F';

                                                return (
                                                    <TableRow key={result.subjectId || index} hover>
                                                        <TableCell sx={{ fontWeight: 600 }}>{getSubjectName(result.subjectId)}</TableCell>
                                                        <TableCell align="right">{result.maxMarks || 100}</TableCell>
                                                        <TableCell align="right">
                                                            <Typography variant="body2" fontWeight={700}>{result.marksObtained || '-'}</Typography>
                                                        </TableCell>
                                                        <TableCell align="right">{percentage}%</TableCell>
                                                        <TableCell align="center">
                                                            <Chip
                                                                label={result.grade || '-'}
                                                                size="small"
                                                                color={isPass ? 'success' : 'error'}
                                                                sx={{ fontWeight: 700, height: 22 }}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {result.remarks || 'Good'}
                                                            </Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                {/* Teacher's Remarks */}
                                {examResult.remarks && (
                                    <Paper elevation={0} sx={{ mt: 2.5, p: 2, bgcolor: '#fefce8', border: '1px solid #fef08a', borderRadius: 2.5 }}>
                                        <Typography variant="subtitle2" fontWeight={700} color="#854d0e">
                                            Teacher's Remarks:
                                        </Typography>
                                        <Typography variant="body2" color="#713f12" sx={{ mt: 0.5 }}>
                                            {examResult.remarks}
                                        </Typography>
                                    </Paper>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </Stack>
            )}
        </Box>
    );
};

export default ParentExamResults;
