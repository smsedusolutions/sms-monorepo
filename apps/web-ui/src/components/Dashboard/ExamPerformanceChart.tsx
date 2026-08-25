import React from 'react';
import { Box, Typography, Skeleton, Paper, Chip } from '@mui/material';
import EventNoteIcon from '@mui/icons-material/EventNote';
import { useIsMobile } from '../../hooks/useIsMobile';
import DonutChart from '../Charts/DonutChart';

interface ExamPerformanceChartProps {
    passed?: number;
    failed?: number;
    absent?: number;
    examName?: string;
    examStatus?: string;
    statusMessage?: string;
    isLoading?: boolean;
    title?: string;
}

export const ExamPerformanceChart: React.FC<ExamPerformanceChartProps> = ({
    passed = 0,
    failed = 0,
    absent = 0,
    examName,
    examStatus,
    statusMessage,
    isLoading,
    title = 'Exam Performance',
}) => {
    const isMobile = useIsMobile();
    const total = passed + failed + absent;

    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    return (
        <Paper
            elevation={0}
            sx={{
                p: { xs: 2, sm: 2.5 },
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: '#ffffff',
                height: '100%',
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                <Box>
                    <Typography fontWeight={700} sx={{ fontSize: { xs: '0.95rem', sm: '1.05rem' }, color: '#1e293b' }}>
                        {title}
                    </Typography>
                    {examName && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                            {examName}
                        </Typography>
                    )}
                </Box>

                {total > 0 && passRate > 0 ? (
                    <Chip
                        label={`${passRate}% Pass Rate`}
                        color={passRate >= 70 ? 'success' : passRate >= 50 ? 'warning' : 'error'}
                        size="small"
                        sx={{ fontWeight: 700 }}
                    />
                ) : examStatus ? (
                    <Chip
                        label={examStatus.toUpperCase()}
                        size="small"
                        color={examStatus === 'published' ? 'success' : examStatus === 'ongoing' ? 'primary' : 'default'}
                        variant="outlined"
                        sx={{ fontWeight: 700, fontSize: '0.65rem' }}
                    />
                ) : null}
            </Box>

            {isLoading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                    <Skeleton variant="circular" width={160} height={160} />
                    <Skeleton variant="text" width={120} sx={{ mt: 1.5 }} />
                </Box>
            ) : total === 0 ? (
                <Box
                    sx={{
                        minHeight: 160,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        py: 3,
                        px: 2,
                        textAlign: 'center',
                        bgcolor: '#f8fafc',
                        borderRadius: 2,
                        border: '1px dashed #cbd5e1',
                    }}
                >
                    <Box sx={{ p: 1.25, borderRadius: '50%', bgcolor: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6', mb: 1 }}>
                        <EventNoteIcon sx={{ fontSize: 28 }} />
                    </Box>
                    <Typography fontWeight={700} variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                        {statusMessage || 'No exam results published yet'}
                    </Typography>
                    <Typography color="text.secondary" variant="caption" sx={{ maxWidth: 320, lineHeight: 1.3 }}>
                        {examName
                            ? `${examName} is currently scheduled. Pass rates and distribution will appear here after marks evaluation and publishing.`
                            : 'Results and pass rate analytics will appear here once exams are conducted and published.'}
                    </Typography>
                </Box>
            ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                    <DonutChart
                        segments={[
                            { label: 'Passed', value: passed, color: '#22c55e' },
                            { label: 'Failed', value: failed, color: '#ef4444' },
                            { label: 'Absent', value: absent, color: '#94a3b8' },
                        ]}
                        size={isMobile ? 160 : 190}
                        holeRatio={0.52}
                        showLegend
                    />
                </Box>
            )}
        </Paper>
    );
};

export default ExamPerformanceChart;
