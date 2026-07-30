import { useState, useMemo } from 'react';
import {
    Box,
    Card,
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
    Skeleton
} from '@mui/material';
import {
    Event as EventIcon,
    Download as DownloadIcon,
    Visibility as ViewIcon,
    Assignment as AssignmentIcon,
    School as SchoolIcon,
    CalendarMonth as CalendarIcon,
    AccessTime as TimeIcon
} from '@mui/icons-material';
import { pdf } from '@react-pdf/renderer';
import { useAuth } from '../../../context/AuthContext';
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

const MyExams = () => {
    const { user } = useAuth();
    const schoolId = user?.schoolId || '';
    const studentId = user?.userId || '';

    const { data: reportCardData, isLoading: reportLoading } = useGetStudentReportCard(schoolId, studentId);
    const { data: examsData, isLoading: examsLoading, error: examsError } = useGetExams(schoolId);

    const upcomingExams = examsData?.data?.filter((e: any) => ['scheduled', 'ongoing', 'draft'].includes(e.status)) || [];

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>My Exams & Results</Typography>

            {/* Error Alert */}
            {examsError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    Failed to load exams. Please try again later.
                </Alert>
            )}

            {/* Admit Cards Section */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AssignmentIcon color="primary" />
                    Upcoming/Ongoing Exams (Admit Cards)
                </Typography>

                {examsLoading ? (
                    <Grid container spacing={3}>
                        {[1, 2, 3].map((i) => (
                            <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                                <Skeleton variant="rounded" height={200} />
                            </Grid>
                        ))}
                    </Grid>
                ) : upcomingExams.length === 0 ? (
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography color="text.secondary">No upcoming exams.</Typography>
                    </Paper>
                ) : (
                    <Grid container spacing={3}>
                        {upcomingExams.map((exam: any) => (
                            <AdmitCardBlock key={exam.examId} schoolId={schoolId} exam={exam} studentId={studentId} />
                        ))}
                    </Grid>
                )}
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Results Section */}
            <Box>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EventIcon color="primary" />
                    Results / Report Cards
                </Typography>

                {reportLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (!reportCardData?.data?.exams || reportCardData.data.exams.length === 0) ? (
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography color="text.secondary">No results published yet.</Typography>
                    </Paper>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {reportCardData.data.exams.map((examResult: any) => (
                            <Card key={examResult.examId} sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Box>
                                        <Typography variant="h6">{examResult.name}</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {examResult.term} | {examResult.type}
                                        </Typography>
                                    </Box>
                                    <Chip label="Published" color="success" size="small" />
                                </Box>

                                <TableContainer component={Paper} elevation={0} variant="outlined">
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: 'grey.100' }}>
                                                <TableCell>Subject</TableCell>
                                                <TableCell align="right">Max Marks</TableCell>
                                                <TableCell align="right">Marks Obtained</TableCell>
                                                <TableCell align="center">Grade</TableCell>
                                                <TableCell>Remarks</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {examResult.results.map((res: any) => (
                                                <TableRow key={res.subjectId}>
                                                    <TableCell>{res.subjectId}</TableCell>
                                                    <TableCell align="right">{res.maxMarks || '-'}</TableCell>
                                                    <TableCell align="right">{res.marksObtained}</TableCell>
                                                    <TableCell align="center">
                                                        <Chip
                                                            label={res.grade}
                                                            color={res.grade === 'F' ? 'error' : 'primary'}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell>{res.remarks}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Card>
                        ))}
                    </Box>
                )}
            </Box>
        </Box>
    );
};

const AdmitCardBlock = ({ schoolId, exam, studentId }: { schoolId: string, exam: any, studentId: string }) => {
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
        open: false,
        message: '',
        severity: 'info'
    });

    const { user: student } = useUserStore();
    const { data: admitCard, isLoading } = useGetAdmitCard(schoolId, exam.examId, studentId);
    const { data: scheduleData } = useGetExamSchedule(schoolId, exam.examId);
    const { data: subjectsData } = useGetSubjects(schoolId);

    // Get decoded token for additional info
    const decodedToken = TokenService.decodeToken();

    // Helper to get subject name
    const getSubjectName = (subjectId: string): string => {
        const subjectInfo = subjectsData?.data?.find((s: any) => s._id === subjectId || s.subjectId === subjectId);
        return subjectInfo?.name || subjectId;
    };

    const admitCardData = admitCard?.data;

    // Filter and deduplicate exam schedule for this student's class
    const studentClassId = student?.classId || student?.class || admitCardData?.classId || (decodedToken as any)?.classId || (decodedToken as any)?.class;

    const examSchedule = useMemo(() => {
        if (!scheduleData?.data) return [];
        const classFiltered = scheduleData.data.filter((sch: any) => {
            if (!studentClassId) return true;
            return sch.classId === studentClassId;
        });

        // Deduplicate by subjectId + date + startTime
        const uniqueMap = new Map();
        classFiltered.forEach((sch: any) => {
            const dateStr = sch.date ? new Date(sch.date).toISOString().split('T')[0] : '';
            const key = `${sch.subjectId}_${dateStr}_${sch.startTime}`;
            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, sch);
            }
        });
        return Array.from(uniqueMap.values());
    }, [scheduleData?.data, studentClassId]);

    // Student details from profile API
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

    // School details
    const schoolName = student?.schoolName || decodedToken?.schoolName || 'School Name';
    const schoolAddress = student?.schoolAddress || 'School Address';
    const schoolLogo = student?.schoolLogo || '';

    // Display class/section
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
                    academicYear={exam.academicYear || '2025-2026'}
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

    const handleView = () => {
        setViewDialogOpen(true);
    };


    return (
        <>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Card
                    sx={{
                        borderRadius: 3,
                        overflow: 'hidden',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                            transform: 'translateY(-4px)'
                        }
                    }}
                >
                    {/* Card Header with gradient */}
                    <Box
                        sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            p: 2,
                            position: 'relative',
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box>
                                <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
                                    {exam.name}
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                    {exam.typeId?.name || 'Exam'} | {exam.termId?.name || 'Term'}
                                </Typography>
                            </Box>
                            <Chip
                                label={exam.status}
                                size="small"
                                sx={{
                                    bgcolor: 'rgba(255,255,255,0.2)',
                                    color: 'white',
                                    fontWeight: 600,
                                    textTransform: 'capitalize'
                                }}
                            />
                        </Box>
                    </Box>

                    {/* Card Body */}
                    <Box sx={{ p: 2 }}>
                        {/* Date info */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                            <CalendarIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                                {new Date(exam.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                {' - '}
                                {new Date(exam.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </Typography>
                        </Box>

                        {/* Roll Number */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <TimeIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                                Roll No: <strong>{rollNumber}</strong>
                            </Typography>
                        </Box>

                        {/* Action Buttons */}
                        {isLoading ? (
                            <Skeleton variant="rounded" height={36} />
                        ) : admitCardData?.isEligible !== false ? (
                            admitCardData?.admitCardGenerated ? (
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<ViewIcon />}
                                        onClick={handleView}
                                        sx={{ flex: 1, borderRadius: 2 }}
                                    >
                                        View
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="contained"
                                        startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
                                        onClick={handleDownloadPDF}
                                        disabled={downloading}
                                        sx={{
                                            flex: 1,
                                            borderRadius: 2,
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        }}
                                    >
                                        {downloading ? 'Generating...' : 'Download'}
                                    </Button>
                                </Box>
                            ) : (
                                <Chip
                                    label="Admit Card Pending"
                                    color="warning"
                                    size="small"
                                    sx={{ width: '100%', py: 2 }}
                                />
                            )
                        ) : (
                            <Chip
                                label="Not Eligible"
                                color="error"
                                size="small"
                                sx={{ width: '100%', py: 2 }}
                            />
                        )}
                    </Box>
                </Card>
            </Grid>

            {/* Professional Admit Card View Dialog */}
            <Dialog
                open={viewDialogOpen}
                onClose={() => setViewDialogOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 2, mt: 10 }
                }}
            >
                <DialogContent sx={{ p: 0 }}>
                    {/* Admit Card Container */}
                    <Box sx={{ border: '3px solid #1976d2', borderRadius: 1, overflow: 'hidden' }}>
                        {/* Header with School Logo and Name */}
                        <Box
                            sx={{
                                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                                color: 'white',
                                p: 2,
                                textAlign: 'center',
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 1 }}>
                                {schoolLogo ? (
                                    <Avatar src={schoolLogo} sx={{ width: 60, height: 60, bgcolor: 'white' }} />
                                ) : (
                                    <Avatar sx={{ width: 60, height: 60, bgcolor: 'rgba(255,255,255,0.2)' }}>
                                        <SchoolIcon sx={{ fontSize: 35 }} />
                                    </Avatar>
                                )}
                                <Box>
                                    <Typography variant="h5" fontWeight={700}>
                                        {schoolName}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        {schoolAddress}
                                    </Typography>
                                </Box>
                            </Box>
                            <Chip
                                label="ADMIT CARD"
                                sx={{
                                    mt: 1,
                                    bgcolor: '#ff9800',
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: '1rem',
                                    py: 2
                                }}
                            />
                        </Box>

                        {/* Exam Title */}
                        <Box sx={{ bgcolor: '#e3f2fd', p: 1.5, textAlign: 'center', borderBottom: '2px solid #1976d2' }}>
                            <Typography variant="h6" fontWeight={600} color="primary.dark">
                                {exam.name} - {exam.typeId?.name || 'Examination'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Academic Year: {exam.academicYear || '2025-2026'} | {exam.termId?.name || 'Term'}
                            </Typography>
                        </Box>

                        {/* Main Content */}
                        <Box sx={{ p: 3 }}>
                            <Grid container spacing={3}>
                                {/* Student Details */}
                                <Grid size={{ xs: 12, md: 8 }}>
                                    <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                                        <Table size="small">
                                            <TableBody>
                                                <TableRow>
                                                    <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 600, width: '40%' }}>
                                                        Student Name
                                                    </TableCell>
                                                    <TableCell>{studentName}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 600 }}>
                                                        {fatherNameLabel}
                                                    </TableCell>
                                                    <TableCell>{fatherName}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 600 }}>
                                                        Roll Number
                                                    </TableCell>
                                                    <TableCell>{rollNumber}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 600 }}>
                                                        Student ID
                                                    </TableCell>
                                                    <TableCell>{studentId}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 600 }}>
                                                        Class / Section
                                                    </TableCell>
                                                    <TableCell>{classDisplay}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 600 }}>
                                                        Date of Birth
                                                    </TableCell>
                                                    <TableCell>{dob}</TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </TableContainer>

                                    {/* Exam Period */}
                                    <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fff3e0' }}>
                                        <Typography variant="subtitle2" fontWeight={600} color="warning.dark">
                                            Examination Period
                                        </Typography>
                                        <Typography variant="body1" fontWeight={500}>
                                            {new Date(exam.startDate).toLocaleDateString('en-IN', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                            {' '} to {' '}
                                            {new Date(exam.endDate).toLocaleDateString('en-IN', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </Typography>
                                    </Paper>
                                </Grid>

                                {/* Photo & Signature Section */}
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        {/* Student Photo */}
                                        <Paper
                                            variant="outlined"
                                            sx={{
                                                width: 130,
                                                height: 160,
                                                mx: 'auto',
                                                mb: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            {studentPhoto ? (
                                                <Box
                                                    component="img"
                                                    src={studentPhoto}
                                                    alt="Student Photo"
                                                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <Avatar sx={{ width: 100, height: 100, bgcolor: 'grey.300' }}>
                                                    {studentName.charAt(0)}
                                                </Avatar>
                                            )}
                                        </Paper>
                                        <Typography variant="caption" color="text.secondary">
                                            Photograph of Candidate
                                        </Typography>

                                        {/* Student Signature */}
                                        <Paper
                                            variant="outlined"
                                            sx={{
                                                width: 130,
                                                height: 50,
                                                mx: 'auto',
                                                mt: 2,
                                                mb: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            {studentSignature ? (
                                                <Box
                                                    component="img"
                                                    src={studentSignature}
                                                    alt="Student Signature"
                                                    sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                                />
                                            ) : (
                                                <Typography variant="caption" color="text.disabled">
                                                    Signature
                                                </Typography>
                                            )}
                                        </Paper>
                                        <Typography variant="caption" color="text.secondary">
                                            Signature of Candidate
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>

                            {/* Exam Schedule Table */}
                            {examSchedule.length > 0 && (
                                <Box sx={{ mt: 3 }}>
                                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1, color: 'primary.main' }}>
                                        Exam Schedule
                                    </Typography>
                                    <TableContainer component={Paper} variant="outlined">
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                                                    <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
                                                    <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                                                    <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Invigilator Sign</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {examSchedule.map((sch: any, index: number) => (
                                                    <TableRow key={sch._id || index}>
                                                        <TableCell>
                                                            {new Date(sch.date).toLocaleDateString('en-IN', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })}
                                                        </TableCell>
                                                        <TableCell>{sch.startTime} - {sch.endTime}</TableCell>
                                                        <TableCell>{getSubjectName(sch.subjectId)}</TableCell>
                                                        <TableCell sx={{ textAlign: 'center', minWidth: 100 }}>
                                                            <Box sx={{ borderBottom: '1px solid #ccc', width: 80, mx: 'auto', height: 20 }} />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Box>
                            )}

                            <Divider sx={{ my: 3 }} />

                            {/* Signatures Section */}
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 4 }}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Box sx={{ borderBottom: '1px solid #333', height: 40, mb: 1 }} />
                                        <Typography variant="caption" fontWeight={500}>
                                            Class Teacher's Signature
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 4 }}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Box sx={{ borderBottom: '1px solid #333', height: 40, mb: 1 }} />
                                        <Typography variant="caption" fontWeight={500}>
                                            Candidate's Signature
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 4 }}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Box sx={{ borderBottom: '1px solid #333', height: 40, mb: 1 }} />
                                        <Typography variant="caption" fontWeight={500}>
                                            Principal's Signature
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>

                            {/* Instructions */}
                            <Paper sx={{ mt: 3, p: 2, bgcolor: '#fafafa' }} variant="outlined">
                                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                                    Important Instructions:
                                </Typography>
                                <Typography variant="caption" component="ul" sx={{ pl: 2, m: 0 }}>
                                    <li>Bring this admit card to the examination hall along with a valid ID proof.</li>
                                    <li>Reach the examination center at least 30 minutes before the scheduled time.</li>
                                    <li>Electronic devices including mobile phones are strictly prohibited.</li>
                                    <li>Any attempt to use unfair means will result in disqualification.</li>
                                </Typography>
                            </Paper>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
                    <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
                    <Button
                        variant="contained"
                        startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
                        onClick={handleDownloadPDF}
                        disabled={downloading}
                    >
                        {downloading ? 'Generating...' : 'Download PDF'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                    severity={snackbar.severity}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default MyExams;
