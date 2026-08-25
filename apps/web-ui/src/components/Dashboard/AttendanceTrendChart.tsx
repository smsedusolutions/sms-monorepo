import React from 'react';
import { Box, Typography, Skeleton, Paper } from '@mui/material';
import { useIsMobile } from '../../hooks/useIsMobile';
import SVGAreaChart from '../Charts/SVGAreaChart';

interface DayAttendance { date: string; percentage: number; }
interface AttendanceTrendChartProps {
    data: DayAttendance[];
    isLoading?: boolean;
    title?: string;
}

export const AttendanceTrendChart: React.FC<AttendanceTrendChartProps> = ({
    data = [], isLoading, title = 'Attendance Trend (Last 30 Days)'
}) => {
    const isMobile = useIsMobile();
    const chartHeight = isMobile ? 220 : 260;

    const chartData: (string | number)[][] = [
        ['Date', 'Attendance %'],
        ...data.map(d => [d.date, d.percentage]),
    ];

    return (
        <Paper elevation={0} sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Typography fontWeight={700} sx={{ mb: 2, fontSize: { xs: '0.95rem', sm: '1rem' } }}>{title}</Typography>
            {isLoading ? (
                <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2 }} />
            ) : data.length === 0 ? (
                <Box sx={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography color="text.secondary" variant="body2">No attendance data available</Typography>
                </Box>
            ) : (
                <SVGAreaChart
                    data={chartData}
                    colors={['#3b82f6']}
                    height={chartHeight}
                    filled={true}
                    yMin={0}
                    yMax={100}
                />
            )}
        </Paper>
    );
};

export default AttendanceTrendChart;
