import React from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Chip,
    Button,
    LinearProgress,
    Skeleton,
} from '@mui/material';
import {
    CheckCircle as PresentIcon,
    Cancel as AbsentIcon,
    Schedule as LateIcon,
    TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useGetSimpleStudentAttendance } from '../../../queries/Attendance';
import TokenService from '../../../queries/token/tokenService';

interface AttendanceWidgetProps {
    compact?: boolean;
}

const AttendanceWidget: React.FC<AttendanceWidgetProps> = ({ compact = false }) => {
    const navigate = useNavigate();
    const schoolId = TokenService.getSchoolId() || '';
    const studentId = TokenService.getStudentId() || '';

    // Get last 30 days of attendance
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data, isLoading, error } = useGetSimpleStudentAttendance(
        schoolId,
        studentId,
        startDate,
        endDate
    );

    const summary = data?.data?.summary;
    const attendance = data?.data?.attendance || [];

    // Calculate attendance percentage
    const totalDays = summary?.total || 0;
    const presentDays = (summary?.present || 0) + (summary?.late || 0);
    const percentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : 0;

    // Get last 7 days attendance for mini chart
    const last7Days = attendance.slice(0, 7).reverse();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'present': return 'success.main';
            case 'absent': return 'error.main';
            case 'late': return 'warning.main';
            case 'half_day': return 'info.main';
            case 'leave': return 'grey.500';
            default: return 'grey.300';
        }
    };

    if (error) {
        return (
            <Card sx={{ height: '100%' }}>
                <CardContent>
                    <Typography color="error">Failed to load attendance</Typography>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight={600}>
                        My Attendance
                    </Typography>
                    <TrendingUpIcon color="primary" />
                </Box>

                {isLoading ? (
                    <Box>
                        <Skeleton variant="circular" width={80} height={80} sx={{ mx: 'auto', mb: 2 }} />
                        <Skeleton variant="text" />
                        <Skeleton variant="text" width="60%" />
                    </Box>
                ) : (
                    <>
                        {/* Circular Progress */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                <CircularProgress
                                    variant="determinate"
                                    value={Number(percentage)}
                                    size={compact ? 60 : 80}
                                    thickness={4}
                                    sx={{
                                        color: Number(percentage) >= 75 ? 'success.main' :
                                            Number(percentage) >= 50 ? 'warning.main' : 'error.main',
                                    }}
                                />
                                <Box
                                    sx={{
                                        top: 0,
                                        left: 0,
                                        bottom: 0,
                                        right: 0,
                                        position: 'absolute',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Typography variant={compact ? 'body2' : 'h6'} fontWeight={600}>
                                        {percentage}%
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>

                        {/* Stats */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                            <Chip
                                icon={<PresentIcon />}
                                label={`${summary?.present || 0} Present`}
                                size="small"
                                color="success"
                                variant="outlined"
                            />
                            <Chip
                                icon={<AbsentIcon />}
                                label={`${summary?.absent || 0} Absent`}
                                size="small"
                                color="error"
                                variant="outlined"
                            />
                            <Chip
                                icon={<LateIcon />}
                                label={`${summary?.late || 0} Late`}
                                size="small"
                                color="warning"
                                variant="outlined"
                            />
                        </Box>

                        {/* Last 7 Days Mini Chart */}
                        {!compact && last7Days.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="caption" color="text.secondary" gutterBottom>
                                    Last 7 Days
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                                    {last7Days.map((day, idx) => (
                                        <Box
                                            key={idx}
                                            sx={{
                                                width: 24,
                                                height: 24,
                                                borderRadius: 1,
                                                bgcolor: getStatusColor(day.status),
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                            title={`${new Date(day.date).toLocaleDateString()} - ${day.status}`}
                                        >
                                            <Typography variant="caption" sx={{ color: 'white', fontSize: 10 }}>
                                                {day.status.charAt(0).toUpperCase()}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        )}

                        {/* Progress Bar */}
                        <Box sx={{ mb: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">
                                    Attendance Rate
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {totalDays} days
                                </Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={Number(percentage)}
                                sx={{
                                    height: 6,
                                    borderRadius: 2,
                                    bgcolor: 'grey.200',
                                    '& .MuiLinearProgress-bar': {
                                        bgcolor: Number(percentage) >= 75 ? 'success.main' :
                                            Number(percentage) >= 50 ? 'warning.main' : 'error.main',
                                    },
                                }}
                            />
                        </Box>
                    </>
                )}
            </CardContent>

            <Box sx={{ p: 2, pt: 0 }}>
                <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    onClick={() => navigate('/student/attendance/history')}
                >
                    View Full History
                </Button>
            </Box>
        </Card>
    );
};

export default AttendanceWidget;
