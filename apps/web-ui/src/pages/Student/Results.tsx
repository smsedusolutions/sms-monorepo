import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Alert,
    Paper,
    Skeleton,
    TableContainer,
    Button,
} from '@mui/material';
import {
    EmojiEvents as TrophyIcon,
    Assessment as ResultsIcon,
    TrendingUp as TrendingUpIcon,
    Star as StarIcon,
    School as SchoolIcon,
    Download as DownloadIcon,
} from '@mui/icons-material';
import { exportReportCardPDF } from '../../utils/reportCardPdfExport';
import TokenService from '../../queries/token/tokenService';
import { useGetExams, useGetStudentReportCard } from '../../queries/Exam';
import { useGetSubjects } from '../../queries/Subject';

const StudentResults = () => {
    const user = TokenService.getUser();
    const schoolId = TokenService.getSchoolId() || '';
    const studentId = user?.studentId || '';

    const { data: reportData, isLoading: loadingReport } = useGetStudentReportCard(schoolId, studentId);
    const { data: examsData, isLoading: loadingExams } = useGetExams(schoolId);
    const { data: subjectsData, isLoading: loadingSubjects } = useGetSubjects(schoolId);

    const report = reportData?.data;
    const allExams = examsData?.data || [];
    const allSubjects = subjectsData?.data || [];

    const isLoading = loadingReport || loadingExams || loadingSubjects;

    // Helper: get subject name by ID
    const getSubjectName = (subjectId: string): string => {
        const sub = allSubjects.find((s: any) => s.subjectId === subjectId || s._id === subjectId);
        return sub?.name || subjectId;
    };

    // Helper: get grade color
    const getGradeColor = (grade: string): string => {
        if (!grade) return '#9e9e9e';
        const g = grade.toUpperCase();
        if (g === 'A+' || g === 'A') return '#4caf50';
        if (g === 'B+' || g === 'B') return '#2196f3';
        if (g === 'C+' || g === 'C') return '#ff9800';
        if (g === 'D') return '#f44336';
        if (g === 'F') return '#d32f2f';
        return '#9e9e9e';
    };

    // Calculate overall stats across all exams
    const allResults = report?.exams?.flatMap((e: any) => e.results) || [];
    const totalSubjects = allResults.length;
    const avgGradePoints = totalSubjects > 0
        ? (allResults.reduce((sum: number, r: any) => sum + (r.points || 0), 0) / totalSubjects).toFixed(2)
        : '0.00';

    // Count best and grades
    const gradeDistribution: Record<string, number> = {};
    allResults.forEach((r: any) => {
        const g = r.grade || 'N/A';
        gradeDistribution[g] = (gradeDistribution[g] || 0) + 1;
    });

    const publishedExams = report?.exams?.filter((e: any) => e.results?.length > 0) || [];

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h5" fontWeight={600} gutterBottom>My Results</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                View your exam results, grades, and performance overview.
            </Typography>

            {isLoading ? (
                <Grid container spacing={3}>
                    {[1, 2, 3, 4].map(i => (
                        <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
                            <Skeleton variant="rounded" height={140} />
                        </Grid>
                    ))}
                    <Grid size={{ xs: 12 }}>
                        <Skeleton variant="rounded" height={300} />
                    </Grid>
                </Grid>
            ) : publishedExams.length === 0 ? (
                <Box>
                    {/* Overview Cards even when no results */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                                    <ResultsIcon sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
                                    <Typography variant="h4" fontWeight={700}>0</Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.85 }}>Exams Published</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                        No published exam results yet. Results will appear here once exams are completed and results are published.
                    </Alert>

                    {/* Show upcoming exams */}
                    {allExams && allExams.filter((e: any) => e.status !== 'published').length > 0 && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Upcoming / Ongoing Exams</Typography>
                            <Grid container spacing={2}>
                                {allExams.filter((e: any) => e.status !== 'published' && e.status !== 'closed').map((exam: any) => (
                                    <Grid key={exam._id} size={{ xs: 12, sm: 6, md: 4 }}>
                                        <Card variant="outlined" sx={{ borderRadius: 2 }}>
                                            <CardContent>
                                                <Typography variant="subtitle1" fontWeight={600}>{exam.name}</Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                    {exam.typeId?.name || 'Exam'} | {exam.termId?.name || 'Term'}
                                                </Typography>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Chip
                                                        label={exam.status}
                                                        size="small"
                                                        color={exam.status === 'ongoing' ? 'primary' : exam.status === 'scheduled' ? 'secondary' : 'default'}
                                                        sx={{ textTransform: 'capitalize' }}
                                                    />
                                                    <Typography variant="caption" color="text.secondary">
                                                        {new Date(exam.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                        {' — '}
                                                        {new Date(exam.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </Typography>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    )}
                </Box>
            ) : (
                <>
                    {/* Overview Cards */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                                    <ResultsIcon sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
                                    <Typography variant="h4" fontWeight={700}>{publishedExams.length}</Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.85 }}>Exams Published</Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', color: 'white' }}>
                                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                                    <TrendingUpIcon sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
                                    <Typography variant="h4" fontWeight={700}>{avgGradePoints}</Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.85 }}>Avg. Grade Points</Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                                    <StarIcon sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
                                    <Typography variant="h4" fontWeight={700}>{totalSubjects}</Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.85 }}>Subject Results</Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' }}>
                                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                                    <TrophyIcon sx={{ fontSize: 40, mb: 1, color: '#e65100' }} />
                                    <Typography variant="h4" fontWeight={700} color="#5d4037">
                                        {gradeDistribution['A+'] || gradeDistribution['A'] || 0}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#8d6e63' }}>A/A+ Grades</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Exam Results Tables */}
                    {publishedExams.map((exam: any) => {
                        const handleDownloadPDF = () => {
                            const results = (exam.results || []).map((r: any) => ({
                                subjectName: getSubjectName(r.subjectId),
                                totalMarks: r.marksObtained ?? 0,
                                maxMarks: 100,
                                grade: r.grade,
                                gradePoints: r.points,
                                remarks: r.remarks
                            }));

                            exportReportCardPDF({
                                schoolName: 'Demo International School',
                                studentName: report?.student?.name || `${user?.firstName || 'Student'} ${user?.lastName || ''}`,
                                rollNumber: report?.student?.rollNumber,
                                admissionNumber: report?.student?.admissionNumber,
                                className: report?.student?.classId || 'Class',
                                sectionName: report?.student?.sectionId,
                                academicYear: report?.academicYear || '2025-2026',
                                examName: exam.name,
                                termName: exam.term,
                                results,
                                overallGrade: avgGradePoints ? (parseFloat(avgGradePoints) >= 9 ? 'A1' : parseFloat(avgGradePoints) >= 8 ? 'A2' : parseFloat(avgGradePoints) >= 7 ? 'B1' : 'B2') : undefined
                            });
                        };

                        return (
                            <Box key={exam.examId} sx={{ mb: 4 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <SchoolIcon color="primary" />
                                        <Box>
                                            <Typography variant="h6" fontWeight={600}>{exam.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {exam.term || 'Term'} | {exam.type || 'Exam'}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        size="small"
                                        startIcon={<DownloadIcon />}
                                        onClick={handleDownloadPDF}
                                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                                    >
                                        Download PDF Report
                                    </Button>
                                </Box>

                            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                            <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }} align="center">Marks Obtained</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }} align="center">Grade</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }} align="center">Grade Points</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Remarks</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {exam.results?.length > 0 ? exam.results.map((result: any, idx: number) => (
                                            <TableRow key={idx} hover>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={500}>
                                                        {getSubjectName(result.subjectId)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {result.marksObtained ?? '-'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip
                                                        label={result.grade || 'N/A'}
                                                        size="small"
                                                        sx={{
                                                            fontWeight: 700,
                                                            color: 'white',
                                                            bgcolor: getGradeColor(result.grade),
                                                            minWidth: 40,
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Typography variant="body2">{result.points ?? '-'}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {result.remarks || '-'}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center">
                                                    <Typography variant="body2" color="text.secondary">No results available for this exam.</Typography>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    );
                })}

                    {/* Grade Distribution */}
                    {Object.keys(gradeDistribution).length > 0 && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Grade Distribution</Typography>
                            <Grid container spacing={2}>
                                {Object.entries(gradeDistribution).sort(([a], [b]) => a.localeCompare(b)).map(([grade, count]) => (
                                    <Grid key={grade} size={{ xs: 4, sm: 3, md: 2 }}>
                                        <Card variant="outlined" sx={{ borderRadius: 2, textAlign: 'center', py: 1.5 }}>
                                            <Chip
                                                label={grade}
                                                sx={{
                                                    fontWeight: 700,
                                                    color: 'white',
                                                    bgcolor: getGradeColor(grade),
                                                    fontSize: '1rem',
                                                    mb: 0.5,
                                                }}
                                            />
                                            <Typography variant="h6" fontWeight={700}>{count}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {count === 1 ? 'Subject' : 'Subjects'}
                                            </Typography>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    )}
                </>
            )}
        </Box>
    );
};

export default StudentResults;
