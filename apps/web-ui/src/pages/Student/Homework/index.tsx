import React, { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Chip,
    Alert,
    Skeleton,
    Tabs,
    Tab,
    Button,
    Stack,
} from '@mui/material';
import {
    Assignment as AssignmentIcon,
    CalendarToday as CalendarIcon,
    AttachFile as AttachFileIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
    UploadFile as UploadFileIcon,
    EditNote as ChangesIcon,
    Cancel as CancelIcon,
    RateReview as ReviewIcon,
} from '@mui/icons-material';
import { useGetHomeworkByStudent } from '../../../queries/Homework';
import TokenService from '../../../queries/token/tokenService';
import { useUrlTab } from '../../../hooks/useUrlTab';
import type { Homework } from '../../../types';
import SubmitHomework from './SubmitHomework';

const StudentHomework: React.FC = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const studentId = TokenService.getStudentId() || TokenService.getUserId() || '';

    const [tabValue, setTabValue] = useUrlTab(0, ['pending', 'completed', 'all']);
    const statusFilter = tabValue === 0 ? 'active' : tabValue === 1 ? 'completed' : undefined;

    const [selectedHwForSubmit, setSelectedHwForSubmit] = useState<Homework | null>(null);

    const { data, isLoading, error } = useGetHomeworkByStudent(
        schoolId,
        studentId,
        { status: statusFilter }
    );

    const homework = data?.data || [];

    const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Failed to load homework. Please try again later.</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <AssignmentIcon color="primary" sx={{ fontSize: 32 }} />
                <Box>
                    <Typography variant="h4" fontWeight={700} color="#0f172a">
                        My Homework
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        View assignments, submit your answers, and check teacher feedback
                    </Typography>
                </Box>
            </Box>

            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 3, mt: 2 }}>
                <Tab label="Active / Pending" />
                <Tab label="Completed" />
                <Tab label="All Assignments" />
            </Tabs>

            <Grid container spacing={2.5}>
                {isLoading ? (
                    [1, 2, 3, 4].map((i) => (
                        <Grid size={{ xs: 12, md: 6 }} key={i}>
                            <Card sx={{ borderRadius: 3 }}>
                                <CardContent>
                                    <Skeleton variant="text" width="70%" height={30} />
                                    <Skeleton variant="text" width="40%" />
                                    <Skeleton variant="text" width="100%" />
                                </CardContent>
                            </Card>
                        </Grid>
                    ))
                ) : homework.length === 0 ? (
                    <Grid size={{ xs: 12 }}>
                        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                            <CardContent sx={{ textAlign: 'center', py: 6 }}>
                                <AssignmentIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                                <Typography variant="h6" color="text.secondary">
                                    {tabValue === 0 ? 'No pending homework!' : 'No homework found'}
                                </Typography>
                                {tabValue === 0 && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 1 }}>
                                        <CheckCircleIcon color="success" />
                                        <Typography color="success.main" fontWeight={600}>
                                            You're all caught up!
                                        </Typography>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                ) : (
                    homework.map((hw: Homework) => {
                        const mySubmission = hw.submissions?.find((s) => s.studentId === studentId);
                        const isSubmitted = !!mySubmission;
                        const overdue = isOverdue(hw.dueDate);
                        const isChangesRequested = mySubmission?.status === 'changes_requested';
                        const isAccepted = mySubmission?.status === 'accepted';
                        const isRejected = mySubmission?.status === 'rejected';

                        return (
                            <Grid size={{ xs: 12, md: 6 }} key={hw.homeworkId}>
                                <Card
                                    elevation={0}
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        borderRadius: 3,
                                        border: '1px solid',
                                        borderColor: isChangesRequested
                                            ? '#fdba74'
                                            : isAccepted
                                            ? '#86efac'
                                            : overdue && !isSubmitted
                                            ? '#fca5a5'
                                            : '#e2e8f0',
                                        bgcolor: '#ffffff',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
                                            transform: 'translateY(-2px)',
                                        },
                                    }}
                                >
                                    <CardContent sx={{ p: 2.5 }}>
                                        {/* Header & Badges */}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5, gap: 1 }}>
                                            <Typography variant="h6" fontWeight={700} color="#0f172a" sx={{ fontSize: '1.05rem', lineHeight: 1.3 }}>
                                                {hw.title}
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                                {isAccepted ? (
                                                    <Chip size="small" icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />} label="Accepted" color="success" sx={{ fontWeight: 700 }} />
                                                ) : isChangesRequested ? (
                                                    <Chip size="small" icon={<ChangesIcon sx={{ fontSize: '14px !important' }} />} label="Changes Needed" color="warning" sx={{ fontWeight: 700 }} />
                                                ) : isRejected ? (
                                                    <Chip size="small" icon={<CancelIcon sx={{ fontSize: '14px !important' }} />} label="Rejected" color="error" sx={{ fontWeight: 700 }} />
                                                ) : isSubmitted ? (
                                                    <Chip size="small" label={mySubmission?.status === 'late' ? 'Submitted Late' : 'Submitted'} color="info" sx={{ fontWeight: 700 }} />
                                                ) : hw.status === 'completed' ? (
                                                    <Chip size="small" icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />} label="Closed" color="default" sx={{ fontWeight: 700 }} />
                                                ) : overdue ? (
                                                    <Chip size="small" icon={<WarningIcon sx={{ fontSize: '14px !important' }} />} label="Overdue" color="error" sx={{ fontWeight: 700 }} />
                                                ) : (
                                                    <Chip size="small" label="Pending" color="default" variant="outlined" sx={{ fontWeight: 600 }} />
                                                )}
                                            </Box>
                                        </Box>

                                        {/* Subject Chip & Marks Awarded */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                                            <Chip
                                                size="small"
                                                label={hw.subjectName || hw.subjectId}
                                                sx={{
                                                    fontWeight: 700,
                                                    bgcolor: '#eff6ff',
                                                    color: '#2563eb',
                                                    border: '1px solid #bfdbfe',
                                                }}
                                            />
                                            {mySubmission?.marksAwarded !== undefined && (
                                                <Chip
                                                    size="small"
                                                    icon={<ReviewIcon sx={{ fontSize: '14px !important' }} />}
                                                    label={`Score: ${mySubmission.marksAwarded}${mySubmission.maxMarks ? `/${mySubmission.maxMarks}` : ''}`}
                                                    color={isAccepted ? 'success' : 'primary'}
                                                    variant="outlined"
                                                    sx={{ fontWeight: 700 }}
                                                />
                                            )}
                                        </Box>

                                        {/* Description */}
                                        <Typography
                                            variant="body2"
                                            color="#475569"
                                            sx={{
                                                mb: 2,
                                                lineHeight: 1.6,
                                                display: '-webkit-box',
                                                WebkitLineClamp: 3,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            {hw.description}
                                        </Typography>

                                        {/* Changes Requested Banner */}
                                        {isChangesRequested && (
                                            <Alert severity="warning" icon={<ChangesIcon fontSize="small" />} sx={{ mb: 2, py: 0.5, borderRadius: 2 }}>
                                                <Typography variant="caption" fontWeight={700} display="block">
                                                    Teacher Feedback:
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#9a3412' }}>
                                                    {mySubmission?.teacherRemarks || 'Please make the required changes and resubmit.'}
                                                </Typography>
                                            </Alert>
                                        )}

                                        {/* Teacher Remarks for other statuses */}
                                        {mySubmission?.teacherRemarks && !isChangesRequested && (
                                            <Box sx={{ p: 1.25, bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid #e2e8f0', mb: 2 }}>
                                                <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                                                    Teacher Remarks:
                                                </Typography>
                                                <Typography variant="caption" color="#334155">
                                                    {mySubmission.teacherRemarks}
                                                </Typography>
                                            </Box>
                                        )}

                                        {/* Footer Meta & Actions */}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1.5, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                <CalendarIcon fontSize="small" sx={{ color: overdue && !isSubmitted ? '#ef4444' : '#64748b' }} />
                                                <Typography variant="caption" fontWeight={600} color={overdue && !isSubmitted ? 'error.main' : 'text.secondary'}>
                                                    Due: {formatDate(hw.dueDate)}
                                                </Typography>
                                            </Box>

                                            <Stack direction="row" spacing={1} alignItems="center">
                                                {hw.attachmentUrl && (
                                                    <Button
                                                        size="small"
                                                        variant="text"
                                                        startIcon={<AttachFileIcon />}
                                                        href={hw.attachmentUrl}
                                                        target="_blank"
                                                        sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}
                                                    >
                                                        Attachment
                                                    </Button>
                                                )}

                                                <Button
                                                    size="small"
                                                    variant={isChangesRequested ? 'contained' : isSubmitted ? 'outlined' : 'contained'}
                                                    color={isChangesRequested ? 'warning' : 'primary'}
                                                    startIcon={isSubmitted ? <CheckCircleIcon /> : <UploadFileIcon />}
                                                    onClick={() => setSelectedHwForSubmit(hw)}
                                                    sx={{
                                                        borderRadius: 2,
                                                        textTransform: 'none',
                                                        fontWeight: 700,
                                                        fontSize: '0.8rem',
                                                        px: 1.5,
                                                    }}
                                                >
                                                    {isChangesRequested
                                                        ? 'Resubmit'
                                                        : isSubmitted
                                                        ? 'View Submission'
                                                        : 'Submit'}
                                                </Button>
                                            </Stack>
                                        </Box>

                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontSize: '0.75rem' }}>
                                            Assigned by: <strong>{hw.teacherName || 'Teacher'}</strong>
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })
                )}
            </Grid>

            {/* Submit Homework Dialog */}
            {selectedHwForSubmit && (
                <SubmitHomework
                    homework={selectedHwForSubmit}
                    studentId={studentId}
                    onClose={() => setSelectedHwForSubmit(null)}
                />
            )}
        </Box>
    );
};

export default StudentHomework;

