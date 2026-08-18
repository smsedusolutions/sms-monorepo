import { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    Button,
    Grid,
    Chip,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Alert,
    Snackbar,
    Dialog,
    DialogContent,
    DialogActions,
    Divider,
    Avatar,
    Skeleton,
    useTheme,
    useMediaQuery,
    Stack,
} from '@mui/material';
import {
    Event as EventIcon,
    Download as DownloadIcon,
    Visibility as ViewIcon,
    Assignment as AssignmentIcon,
    School as SchoolIcon,
    CalendarMonth as CalendarIcon,
    Badge as RollIcon,
} from '@mui/icons-material';
import { pdf } from '@react-pdf/renderer';
import {
    useGetAdmitCard,
    useGetStudentReportCard,
    useGetExams,
    useGetExamSchedule
} from '../../../queries/Exam';
import { useGetSubjects } from '../../../queries/Subject';
import TokenService from '../../../queries/token/tokenService';
import { useUserStore } from '../../../stores/userStore';
import { AdmitCardPDF } from '../../../components/PDFLayouts';
import { useAcademicYear } from '../../../hooks/useAcademicYear';

const MyExams = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const user = TokenService.getUser();
    const schoolId = TokenService.getSchoolId() || '';
    const studentId = user?.studentId || '';

    const { data: reportCardData, isLoading: reportLoading } = useGetStudentReportCard(schoolId, studentId);
    const { data: examsData, isLoading: examsLoading, error: examsError } = useGetExams(schoolId);

    const upcomingExams = examsData?.data?.filter((e: any) => ['scheduled', 'ongoing', 'draft'].includes(e.status)) || [];

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant={isMobile ? "h6" : "h5"} fontWeight={700} color="text.primary">
                    My Exams & Results
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    View upcoming exam schedules, download admit cards, and review published report cards
                </Typography>
            </Box>

            {/* Error Alert */}
            {examsError && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                    Failed to load exams. Please try again later.
                </Alert>
            )}

            {/* Admit Cards / Upcoming Exams Section */}
            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <AssignmentIcon color="primary" sx={{ fontSize: 22 }} />
                    <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                        Upcoming & Ongoing Exams
                    </Typography>
                    <Chip
                        label={upcomingExams.length}
                        size="small"
                        color="primary"
                        sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
                    />
                </Box>

                {examsLoading ? (
                    <Grid container spacing={2}>
                        {[1, 2, 3].map((i) => (
                            <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                                <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2 }} />
                            </Grid>
                        ))}
                    </Grid>
                ) : upcomingExams.length === 0 ? (
                    <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
                        <CalendarIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">No upcoming examinations scheduled at the moment.</Typography>
                    </Paper>
                ) : (
                    <Grid container spacing={2}>
                        {upcomingExams.map((exam: any) => (
                            <AdmitCardBlock key={exam.examId} schoolId={schoolId} exam={exam} studentId={studentId} isMobile={isMobile} />
                        ))}
                    </Grid>
                )}
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Results Section */}
            <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <EventIcon color="primary" sx={{ fontSize: 22 }} />
                    <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                        Results & Report Cards
                    </Typography>
                </Box>

                {reportLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={32} />
                    </Box>
                ) : (!reportCardData?.data?.exams || reportCardData.data.exams.length === 0) ? (
                    <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
                        <EventIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">No examination results published yet.</Typography>
                    </Paper>
                ) : (
                    <Stack spacing={2}>
                        {reportCardData.data.exams.map((examResult: any) => (
                            <Paper key={examResult.examId} elevation={0} sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight={700} color="text.primary">{examResult.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {examResult.term} • {examResult.type}
                                        </Typography>
                                    </Box>
                                    <Chip label="Published" color="success" size="small" sx={{ fontWeight: 700, borderRadius: 1.5 }} />
                                </Box>

                                {isMobile ? (
                                    <Stack spacing={1}>
                                        {examResult.results.map((res: any) => (
                                            <Paper key={res.subjectId} elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider' }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                                    <Typography variant="subtitle2" fontWeight={700} color="text.primary">{res.subjectId}</Typography>
                                                    <Chip
                                                        label={`Grade ${res.grade}`}
                                                        color={res.grade === 'F' ? 'error' : 'primary'}
                                                        size="small"
                                                        sx={{ fontWeight: 700, height: 22, fontSize: '0.7rem' }}
                                                    />
                                                </Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    Marks: <strong>{res.marksObtained}</strong> / {res.maxMarks || '-'}
                                                    {res.remarks && ` • Remarks: ${res.remarks}`}
                                                </Typography>
                                            </Paper>
                                        ))}
                                    </Stack>
                                ) : (
                                    <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
                                        <Table size="small">
                                            <TableHead sx={{ bgcolor: 'grey.50' }}>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 700 }}>Max Marks</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 700 }}>Marks Obtained</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 700 }}>Grade</TableCell>
                                                    <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {examResult.results.map((res: any) => (
                                                    <TableRow key={res.subjectId} hover>
                                                        <TableCell sx={{ fontWeight: 600 }}>{res.subjectId}</TableCell>
                                                        <TableCell align="right">{res.maxMarks || '-'}</TableCell>
                                                        <TableCell align="right" sx={{ fontWeight: 700 }}>{res.marksObtained}</TableCell>
                                                        <TableCell align="center">
                                                            <Chip
                                                                label={res.grade}
                                                                color={res.grade === 'F' ? 'error' : 'primary'}
                                                                size="small"
                                                                sx={{ fontWeight: 700, borderRadius: 1.5 }}
                                                            />
                                                        </TableCell>
                                                        <TableCell sx={{ color: 'text.secondary' }}>{res.remarks || '-'}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                            </Paper>
                        ))}
                    </Stack>
                )}
            </Box>
        </Box>
    );
};

const AdmitCardBlock = ({
    schoolId,
    exam,
    studentId,
    isMobile,
}: {
    schoolId: string;
    exam: any;
    studentId: string;
    isMobile: boolean;
}) => {
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
        open: false,
        message: '',
        severity: 'info'
    });

    const { user: student } = useUserStore();
    const { currentAcademicYear } = useAcademicYear();
    const { data: admitCard, isLoading } = useGetAdmitCard(schoolId, exam.examId, studentId);
    const { data: scheduleData } = useGetExamSchedule(schoolId, exam.examId);
    const { data: subjectsData } = useGetSubjects(schoolId);

    const decodedToken = TokenService.decodeToken();

    const getSubjectName = (subjectId: string): string => {
        const subjectInfo = subjectsData?.data?.find((s: any) => s._id === subjectId || s.subjectId === subjectId);
        return subjectInfo?.name || subjectId;
    };

    const admitCardData = admitCard?.data;
    const studentClassId = student?.classId || student?.class || admitCardData?.classId || (decodedToken as any)?.classId || (decodedToken as any)?.class;

    const examSchedule = useMemo(() => {
        if (!scheduleData?.data) return [];
        const classFiltered = scheduleData.data.filter((sch: any) => {
            if (!studentClassId) return true;
            return sch.classId === studentClassId;
        });

        const uniqueMap = new Map();
        classFiltered.forEach((sch: any) => {
            const dateStr = sch.date ? new Date(sch.date).toISOString().split('T')[0] : '';
            const key = `${sch.subjectId}_${dateStr}_${sch.startTime}`;
            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, sch);
            }
        });
        return Array.from(uniqueMap.values()).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [scheduleData?.data, studentClassId]);

    const studentName = student?.firstName
        ? `${student.firstName} ${student.lastName || ''}`.trim()
        : 'Student Name';
    const fatherName = student?.fatherName || student?.parentName || 'N/A';
    const fatherNameLabel = student?.fatherNameLabel || "Father's Name";
    const rollNumber = admitCardData?.rollNumber || student?.rollNumber || 'N/A';
    const className = student?.className || admitCardData?.classId || '';
    const sectionName = student?.sectionName || admitCardData?.sectionId || '';
    const dob = student?.dateOfBirth
        ? new Date(student.dateOfBirth).toLocaleDateString()
        : 'N/A';
    const studentPhoto = student?.profileImage || '';
    const studentSignature = student?.signature || '';

    const schoolName = student?.schoolName || decodedToken?.schoolName || 'School Name';
    const schoolAddress = student?.schoolAddress || 'School Address';
    const schoolLogo = student?.schoolLogo || '';

    const classDisplay = className && sectionName
        ? `${className} / ${sectionName}`
        : className || 'N/A';

    const handleDownloadPDF = async () => {
        setDownloading(true);
        try {
            const blob = await pdf(
                <AdmitCardPDF
                    studentName={studentName}
                    fatherName={fatherName}
                    fatherNameLabel={fatherNameLabel}
                    rollNumber={rollNumber}
                    studentId={studentId}
                    className={className}
                    sectionName={sectionName}
                    dob={dob}
                    schoolName={schoolName}
                    schoolAddress={schoolAddress}
                    schoolLogo={schoolLogo}
                    studentPhoto={studentPhoto}
                    studentSignature={studentSignature}
                    examName={exam.name}
                    examType={exam.typeId?.name || 'Examination'}
                    examTerm={exam.termId?.name || 'Term'}
                    academicYear={exam.academicYear || currentAcademicYear}
                    startDate={exam.startDate}
                    endDate={exam.endDate}
                    examSchedule={examSchedule.map((sch: any) => ({
                        date: sch.date,
                        startTime: sch.startTime,
                        endTime: sch.endTime,
                        subjectName: getSubjectName(sch.subjectId),
                    }))}
                />
            ).toBlob();

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `AdmitCard_${studentId}_${exam.name.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setSnackbar({ open: true, message: 'Admit card downloaded successfully!', severity: 'success' });
        } catch (error) {
            console.error('PDF generation error:', error);
            setSnackbar({ open: true, message: 'Failed to generate PDF', severity: 'error' });
        } finally {
            setDownloading(false);
        }
    };

    return (
        <>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                    }}
                >
                    {/* Header */}
                    <Box sx={{ p: 2, bgcolor: 'primary.50', borderBottom: '1px solid', borderColor: '#bfdbfe' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5, gap: 1 }}>
                            <Typography variant="subtitle1" fontWeight={700} color="primary.dark">
                                {exam.name}
                            </Typography>
                            <Chip
                                label={exam.status}
                                size="small"
                                color={exam.status === 'scheduled' ? 'warning' : exam.status === 'ongoing' ? 'success' : 'default'}
                                sx={{ textTransform: 'capitalize', fontWeight: 700, fontSize: '0.7rem', height: 22 }}
                            />
                        </Box>
                        <Typography variant="caption" color="primary.main" fontWeight={500}>
                            {exam.typeId?.name || 'Exam'} • {exam.termId?.name || 'Term'}
                        </Typography>
                    </Box>

                    {/* Body */}
                    <Box sx={{ p: 2 }}>
                        {/* Dates */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="caption" fontWeight={600} color="text.primary">
                                {new Date(exam.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                {' — '}
                                {new Date(exam.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </Typography>
                        </Box>

                        {/* Roll Number */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <RollIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                                Roll No: <strong>{rollNumber}</strong>
                            </Typography>
                        </Box>

                        {/* Actions */}
                        {isLoading ? (
                            <Skeleton variant="rectangular" height={36} sx={{ borderRadius: 2 }} />
                        ) : admitCardData?.isEligible !== false ? (
                            admitCardData?.admitCardGenerated ? (
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<ViewIcon sx={{ fontSize: 16 }} />}
                                        onClick={() => setViewDialogOpen(true)}
                                        sx={{ flex: 1, borderRadius: 2, textTransform: 'none', fontWeight: 600, py: 0.6 }}
                                    >
                                        View
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="contained"
                                        startIcon={downloading ? <CircularProgress size={14} color="inherit" /> : <DownloadIcon sx={{ fontSize: 16 }} />}
                                        onClick={handleDownloadPDF}
                                        disabled={downloading}
                                        sx={{ flex: 1, borderRadius: 2, textTransform: 'none', fontWeight: 600, py: 0.6 }}
                                    >
                                        {downloading ? 'Downloading...' : 'Download'}
                                    </Button>
                                </Box>
                            ) : (
                                <Chip
                                    label="Admit Card Pending"
                                    color="warning"
                                    size="small"
                                    sx={{ width: '100%', py: 1.5, fontWeight: 600, borderRadius: 2 }}
                                />
                            )
                        ) : (
                            <Chip
                                label="Not Eligible"
                                color="error"
                                size="small"
                                sx={{ width: '100%', py: 1.5, fontWeight: 600, borderRadius: 2 }}
                            />
                        )}
                    </Box>
                </Paper>
            </Grid>

            {/* Admit Card View Dialog */}
            <Dialog
                open={viewDialogOpen}
                onClose={() => setViewDialogOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 2 } }}
            >
                <DialogContent sx={{ p: { xs: 1.5, sm: 3 } }}>
                    <Box sx={{ border: '2px solid', borderColor: 'primary.main', borderRadius: 2, overflow: 'hidden' }}>
                        {/* Header */}
                        <Box sx={{ bgcolor: 'primary.main', color: '#ffffff', p: 2, textAlign: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 1 }}>
                                {schoolLogo ? (
                                    <Avatar src={schoolLogo} sx={{ width: 48, height: 48, bgcolor: 'white' }} />
                                ) : (
                                    <Avatar sx={{ width: 48, height: 48, bgcolor: 'rgba(255,255,255,0.2)' }}>
                                        <SchoolIcon sx={{ fontSize: 28 }} />
                                    </Avatar>
                                )}
                                <Box>
                                    <Typography variant="h6" fontWeight={700}>{schoolName}</Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.9 }}>{schoolAddress}</Typography>
                                </Box>
                            </Box>
                            <Chip label="ADMIT CARD" sx={{ bgcolor: '#ff9800', color: '#ffffff', fontWeight: 800, fontSize: '0.8rem', height: 26 }} />
                        </Box>

                        {/* Title */}
                        <Box sx={{ bgcolor: 'grey.100', p: 1.5, textAlign: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                                {exam.name} — {exam.typeId?.name || 'Examination'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Academic Year {exam.academicYear || currentAcademicYear} • {exam.termId?.name || 'Term'}
                            </Typography>
                        </Box>

                        {/* Details */}
                        <Box sx={{ p: { xs: 1.5, sm: 2.5 } }}>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 8 }}>
                                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                                        <Table size="small">
                                            <TableBody>
                                                <TableRow>
                                                    <TableCell sx={{ bgcolor: 'grey.50', fontWeight: 600, width: '40%' }}>Student Name</TableCell>
                                                    <TableCell sx={{ fontWeight: 700 }}>{studentName}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ bgcolor: 'grey.50', fontWeight: 600 }}>{fatherNameLabel}</TableCell>
                                                    <TableCell>{fatherName}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ bgcolor: 'grey.50', fontWeight: 600 }}>Roll Number</TableCell>
                                                    <TableCell sx={{ fontWeight: 700 }}>{rollNumber}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ bgcolor: 'grey.50', fontWeight: 600 }}>Student ID</TableCell>
                                                    <TableCell>{studentId}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ bgcolor: 'grey.50', fontWeight: 600 }}>Class / Section</TableCell>
                                                    <TableCell>{classDisplay}</TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Grid>

                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Paper variant="outlined" sx={{ width: 100, height: 120, mx: 'auto', mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 2 }}>
                                            {studentPhoto ? (
                                                <Box component="img" src={studentPhoto} alt="Student Photo" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <Avatar sx={{ width: 64, height: 64, bgcolor: 'grey.300' }}>{studentName.charAt(0)}</Avatar>
                                            )}
                                        </Paper>
                                        <Typography variant="caption" color="text.secondary">Candidate Photo</Typography>
                                    </Box>
                                </Grid>
                            </Grid>

                            {/* Schedule Table */}
                            {examSchedule.length > 0 && (
                                <Box sx={{ mt: 2.5 }}>
                                    <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ mb: 1 }}>
                                        Examination Schedule
                                    </Typography>
                                    {isMobile ? (
                                        <Stack spacing={1}>
                                            {examSchedule.map((sch: any) => (
                                                <Paper key={sch._id} elevation={0} sx={{ p: 1.25, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
                                                    <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                                                        {getSubjectName(sch.subjectId)}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {new Date(sch.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })} • {sch.startTime} – {sch.endTime}
                                                    </Typography>
                                                </Paper>
                                            ))}
                                        </Stack>
                                    ) : (
                                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                                            <Table size="small">
                                                <TableHead sx={{ bgcolor: 'grey.50' }}>
                                                    <TableRow>
                                                        <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                                        <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
                                                        <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {examSchedule.map((sch: any) => (
                                                        <TableRow key={sch._id} hover>
                                                            <TableCell sx={{ fontWeight: 600 }}>
                                                                {new Date(sch.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </TableCell>
                                                            <TableCell>{sch.startTime} – {sch.endTime}</TableCell>
                                                            <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                                                                {getSubjectName(sch.subjectId)}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    )}
                                </Box>
                            )}
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setViewDialogOpen(false)} sx={{ textTransform: 'none' }}>Close</Button>
                    <Button
                        variant="contained"
                        startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
                        onClick={handleDownloadPDF}
                        disabled={downloading}
                        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                    >
                        {downloading ? 'Downloading...' : 'Download PDF'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} severity={snackbar.severity}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default MyExams;
