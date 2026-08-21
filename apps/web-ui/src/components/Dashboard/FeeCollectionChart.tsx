import React from 'react';
import { Box, Typography, Skeleton, Paper } from '@mui/material';
import { Chart } from 'react-google-charts';
import { useIsMobile } from '../../hooks/useIsMobile';
import ConsentGatedChart from '../consent/ConsentGatedChart';

interface MonthlyFee { month: string; collected: number; outstanding: number; }
interface FeeCollectionChartProps {
    data: MonthlyFee[];
    isLoading?: boolean;
    title?: string;
}

export const FeeCollectionChart: React.FC<FeeCollectionChartProps> = ({
    data = [], isLoading, title = 'Monthly Fee Collection'
}) => {
    const isMobile = useIsMobile();

    const chartData = [
        ['Month', 'Collected (₹)', 'Outstanding (₹)'],
        ...data.map(d => [d.month, d.collected, d.outstanding]),
    ];

    const options = {
        title: '',
        chartArea: { width: isMobile ? '70%' : '75%', height: '65%' },
        legend: { position: 'top', textStyle: { fontSize: isMobile ? 10 : 12 } },
        colors: ['#22c55e', '#f87171'],
        bar: { groupWidth: '65%' },
        vAxis: {
            format: '₹#,###',
            textStyle: { fontSize: isMobile ? 9 : 11 },
            minValue: 0,
        },
        hAxis: { textStyle: { fontSize: isMobile ? 9 : 11 } },
        backgroundColor: 'transparent',
        animation: { startup: true, easing: 'out', duration: 600 },
    };

    return (
        <Paper elevation={0} sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Typography fontWeight={700} sx={{ mb: 2, fontSize: { xs: '0.95rem', sm: '1rem' } }}>{title}</Typography>
            {isLoading ? (
                <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2 }} />
            ) : data.length === 0 ? (
                <Box sx={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography color="text.secondary" variant="body2">No fee data available</Typography>
                </Box>
            ) : (
                <ConsentGatedChart height={isMobile ? 220 : 260}>
                    <Chart
                        chartType="ColumnChart"
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

export default FeeCollectionChart;
