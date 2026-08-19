import React from 'react';
import { Box, Typography, Skeleton, Paper, Chip } from '@mui/material';
import { Chart } from 'react-google-charts';
import { useIsMobile } from '../../hooks/useIsMobile';

interface ExamPerformanceChartProps {
    passed?: number;
    failed?: number;
    absent?: number;
    examName?: string;
    isLoading?: boolean;
    title?: string;
}

export const ExamPerformanceChart: React.FC<ExamPerformanceChartProps> = ({
    passed = 0, failed = 0, absent = 0, examName, isLoading, title = 'Exam Performance'
}) => {
    const isMobile = useIsMobile();
    const total = passed + failed + absent;

    const chartData = [
        ['Result', 'Students'],
        ['Passed', passed],
        ['Failed', failed],
        ['Absent', absent],
    ];

    const options = {
        title: '',
        chartArea: { width: '90%', height: '80%' },
        legend: { position: 'right', textStyle: { fontSize: isMobile ? 10 : 12 } },
        colors: ['#22c55e', '#ef4444', '#94a3b8'],
        pieHole: 0.5,
        backgroundColor: 'transparent',
        animation: { startup: true, easing: 'out', duration: 700 },
        pieSliceText: 'value',
        slices: { 0: { offset: 0.05 } },
    };

    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    return (
        <Paper elevation={0} sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Typography fontWeight={700} sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}>{title}</Typography>
                {passRate > 0 && (
                    <Chip
                        label={`${passRate}% Pass Rate`}
                        color={passRate >= 70 ? 'success' : passRate >= 50 ? 'warning' : 'error'}
                        size="small"
                    />
                )}
            </Box>
            {examName && (
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>{examName}</Typography>
            )}
            {isLoading ? (
                <Skeleton variant="circular" width={180} height={180} sx={{ mx: 'auto', mt: 2 }} />
            ) : total === 0 ? (
                <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography color="text.secondary" variant="body2">No exam results yet</Typography>
                </Box>
            ) : (
                <Chart
                    chartType="PieChart"
                    data={chartData}
                    options={options}
                    width="100%"
                    height={isMobile ? '200px' : '240px'}
                />
            )}
        </Paper>
    );
};

export default ExamPerformanceChart;
