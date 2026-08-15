import React from 'react';
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
} from '@mui/material';
import {
    Assignment as AssignmentIcon,
    CalendarToday as CalendarIcon,
    AttachFile as AttachFileIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useGetHomeworkByStudent } from '../../../queries/Homework';
import TokenService from '../../../queries/token/tokenService';
import { useUrlTab } from '../../../hooks/useUrlTab';
import type { Homework } from '../../../types';

const StudentHomework: React.FC = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const studentId = TokenService.getStudentId() || TokenService.getUserId() || '';

    const [tabValue, setTabValue] = useUrlTab(0, ['pending', 'completed', 'all']);
    const statusFilter = tabValue === 0 ? 'active' : tabValue === 1 ? 'completed' : undefined;

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
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AssignmentIcon color="warning" />
                <Typography variant="h4" fontWeight={600}>
                    My Homework
                </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                View and track your homework assignments
            </Typography>

            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 3 }}>
                <Tab label="Pending" />
                <Tab label="Completed" />
                <Tab label="All" />
            </Tabs>

            <Grid container spacing={2}>
                {isLoading ? (
                    [1, 2, 3].map((i) => (
                        <Grid size={{ xs: 12, md: 6 }} key={i}>
                            <Card>
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
                        <Card>
                            <CardContent sx={{ textAlign: 'center', py: 6 }}>
                                <AssignmentIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                                <Typography variant="h6" color="text.secondary">
                                    {tabValue === 0 ? 'No pending homework!' : 'No homework found'}
                                </Typography>
                                {tabValue === 0 && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 1 }}>
                                        <CheckCircleIcon color="success" />
                                        <Typography color="success.main">You're all caught up!</Typography>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                ) : (
                    homework.map((hw: Homework) => (
                        <Grid size={{ xs: 12, md: 6 }} key={hw.homeworkId}>
                            <Card
                                sx={{
                                    height: '100%',
                                    borderLeft: 4,
                                    borderColor: hw.status === 'completed' ? 'success.main' :
                                        isOverdue(hw.dueDate) ? 'error.main' : 'primary.main',
                                }}
                            >
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                                        <Typography variant="h6" fontWeight={600}>
                                            {hw.title}
                                        </Typography>
                                        {hw.status === 'completed' ? (
                                            <Chip size="small" icon={<CheckCircleIcon />} label="Completed" color="success" />
                                        ) : isOverdue(hw.dueDate) ? (
                                            <Chip size="small" icon={<WarningIcon />} label="Overdue" color="error" />
                                        ) : null}
                                    </Box>

                                    <Chip
                                        size="small"
                                        label={hw.subjectName || hw.subjectId}
                                        color="primary"
                                        variant="outlined"
                                        sx={{ mb: 2 }}
                                    />

                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                            mb: 2,
                                            display: '-webkit-box',
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {hw.description}
                                    </Typography>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <CalendarIcon fontSize="small" color="action" />
                                            <Typography variant="caption" color="text.secondary">
                                                Due: {formatDate(hw.dueDate)}
                                            </Typography>
                                        </Box>

                                        {hw.attachmentUrl && (
                                            <Button
                                                size="small"
                                                startIcon={<AttachFileIcon />}
                                                href={hw.attachmentUrl}
                                                target="_blank"
                                            >
                                                Attachment
                                            </Button>
                                        )}
                                    </Box>

                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                        Assigned by: {hw.teacherName || 'Teacher'}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))
                )}
            </Grid>
        </Box>
    );
};

export default StudentHomework;
