import React from 'react';
import { Box, Typography, Skeleton, Paper } from '@mui/material';
import { Chart } from 'react-google-charts';
import { useIsMobile } from '../../hooks/useIsMobile';
import ConsentGatedChart from '../consent/ConsentGatedChart';

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

    const chartData = [
        ['Date', 'Attendance %'],
        ...data.map(d => [d.date, d.percentage]),
    ];

    const options = {
        title: '',
        chartArea: { width: isMobile ? '72%' : '78%', height: '65%' },
        legend: { position: 'none' },
        colors: ['#3b82f6'],
        lineWidth: 2.5,
        pointSize: isMobile ? 3 : 5,
        vAxis: {
            minValue: 0,
            maxValue: 100,
            format: "#'%'",
            textStyle: { fontSize: isMobile ? 9 : 11 },
            gridlines: { count: 5 },
        },
        hAxis: {
            textStyle: { fontSize: isMobile ? 7 : 10 },
            slantedText: true,
            slantedTextAngle: 45,
        },
        backgroundColor: 'transparent',
        animation: { startup: true, easing: 'inAndOut', duration: 700 },
        curveType: 'function',
    };

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
                <ConsentGatedChart height={isMobile ? 220 : 260}>
                    <Chart
                        chartType="LineChart"
                        data={chartData}
                        options={options}
                        width="100%"
                        height={isMobile ? '220px' : '260px'}
                    />
                </ConsentGatedChart>
            )}
        </Paper>
    );
};

export default AttendanceTrendChart;
