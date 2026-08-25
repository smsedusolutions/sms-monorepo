import React from 'react';
import { Box, Typography, Skeleton, Paper } from '@mui/material';
import { useIsMobile } from '../../hooks/useIsMobile';
import SVGBarChart from '../Charts/SVGBarChart';

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
    const chartHeight = isMobile ? 220 : 260;

    const chartData: (string | number)[][] = [
        ['Month', 'Collected (₹)', 'Outstanding (₹)'],
        ...data.map(d => [d.month, d.collected, d.outstanding]),
    ];

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
                <SVGBarChart
                    data={chartData}
                    colors={['#22c55e', '#f87171']}
                    height={chartHeight}
                />
            )}
        </Paper>
    );
};

export default FeeCollectionChart;
