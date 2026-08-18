// apps/web-ui/src/pages/SchoolAdmin/Fees/Dashboard/index.tsx

import React from 'react';
import { Box, Grid, Typography, Card, CardContent, Button, Stack, LinearProgress, Skeleton } from '@mui/material';
import { Link } from 'react-router-dom';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TodayIcon from '@mui/icons-material/Today';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SettingsIcon from '@mui/icons-material/Settings';
import AssessmentIcon from '@mui/icons-material/Assessment';
import RefreshIcon from '@mui/icons-material/Refresh';
import TokenService from '../../../../queries/token/tokenService';
import {
    useGetFeeDashboardStats,
    useGetPayments,
    useGetClasswiseCollectionReport,
    useGetTodayCollectionReport
} from '../../../../queries/Fee';
import { AppTable } from '../../../../components/shared/AppTable';

import { useIsMobile } from '../../../../hooks/useIsMobile';

const FeeDashboard: React.FC = () => {
    const isMobile = useIsMobile();
    const schoolId = TokenService.getSchoolId() || '';
    const { data: statsData, isLoading: isLoadingStats, refetch: refetchStats } = useGetFeeDashboardStats(schoolId);
    const { data: paymentsData, isLoading: isLoadingPayments, refetch: refetchPayments } = useGetPayments(schoolId, { limit: 5 });
    const { data: classwiseData, refetch: refetchClasswise } = useGetClasswiseCollectionReport(schoolId);
    const { data: todayCollectionData, refetch: refetchToday } = useGetTodayCollectionReport(schoolId);

    const handleRefresh = () => {
        refetchStats();
        refetchPayments();
        refetchClasswise();
        refetchToday();
    };

    const stats = statsData?.data;
    const recentPayments = paymentsData?.data || [];
    const classwiseStats = classwiseData?.data || [];
    const todayMethods = todayCollectionData?.data || [];

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
    };

    // Columns for recent payments
    const columns = [
        {
            name: 'Transaction ID',
            selector: (row: any) => row.transactionId,
            cell: (row: any) => (
                <Typography variant="body2" fontWeight={600} color="primary">
                    {row.transactionId}
                </Typography>
            )
        },
        {
            name: 'Student Name',
            selector: (row: any) => row.studentName,
        },
        {
            name: 'Academic Year',
            selector: (row: any) => row.academicYear,
        },
        {
            name: 'Date',
            selector: (row: any) => new Date(row.paymentDate).toLocaleDateString(),
        },
        {
            name: 'Mode',
            selector: (row: any) => row.paymentMode?.toUpperCase(),
        },
        {
            name: 'Amount',
            selector: (row: any) => row.totalAmountReceived,
            cell: (row: any) => (
                <Typography variant="body2" fontWeight={700} color="success.main">
                    {formatCurrency(row.totalAmountReceived)}
                </Typography>
            )
        }
    ];

    return (
        <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, mb: 3, gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight={700} color="text.primary" sx={{ fontSize: { xs: '1.4rem', sm: '2rem' } }}>
                        Fees Dashboard
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                        Real-time oversight of collections, dues, and transaction histories.
                    </Typography>
                </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                    <Button variant="outlined" color="primary" onClick={handleRefresh} startIcon={<RefreshIcon />} fullWidth={isMobile} sx={{ borderRadius: 2 }}>
                        Refresh
                    </Button>
                    <Button variant="contained" color="primary" component={Link} to="/school-admin/fees/payments" startIcon={<ReceiptIcon />} fullWidth={isMobile} sx={{ borderRadius: 2 }}>
                        Collect Payment
                    </Button>
                    <Button variant="outlined" color="primary" component={Link} to="/school-admin/fees/assignments" startIcon={<AssignmentIcon />} fullWidth={isMobile} sx={{ borderRadius: 2 }}>
                        Assign Fees
                    </Button>
                </Stack>
            </Box>

            {/* Statistics Cards Grid */}
            <Grid container spacing={{ xs: 1.5, sm: 3 }} sx={{ mb: 4 }}>
                <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', height: '100%' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                            <Box sx={{ p: { xs: 1, sm: 1.5 }, bgcolor: '#eff6ff', borderRadius: 2.5, color: '#3b82f6', display: 'flex' }}>
                                <AccountBalanceWalletIcon sx={{ fontSize: { xs: 24, sm: 32 } }} />
                            </Box>
                            <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={500} noWrap display="block">Total Collected</Typography>
                                {isLoadingStats ? <Skeleton width={60} height={28} /> : (
                                    <Typography variant="h6" fontWeight={700} color="#1e293b" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} noWrap>
                                        {formatCurrency(stats?.totalCollected || 0)}
                                    </Typography>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', height: '100%' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                            <Box sx={{ p: { xs: 1, sm: 1.5 }, bgcolor: '#f0fdf4', borderRadius: 2.5, color: '#22c55e', display: 'flex' }}>
                                <TodayIcon sx={{ fontSize: { xs: 24, sm: 32 } }} />
                            </Box>
                            <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={500} noWrap display="block">Today's Collection</Typography>
                                {isLoadingStats ? <Skeleton width={60} height={28} /> : (
                                    <Typography variant="h6" fontWeight={700} color="#1e293b" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} noWrap>
                                        {formatCurrency(stats?.todayCollection || 0)}
                                    </Typography>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', height: '100%' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                            <Box sx={{ p: { xs: 1, sm: 1.5 }, bgcolor: '#fef2f2', borderRadius: 2.5, color: '#ef4444', display: 'flex' }}>
                                <HourglassEmptyIcon sx={{ fontSize: { xs: 24, sm: 32 } }} />
                            </Box>
                            <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={500} noWrap display="block">Pending Amount</Typography>
                                {isLoadingStats ? <Skeleton width={60} height={28} /> : (
                                    <Typography variant="h6" fontWeight={700} color="#1e293b" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} noWrap>
                                        {formatCurrency(stats?.totalOutstanding || 0)}
                                    </Typography>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', height: '100%' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                            <Box sx={{ p: { xs: 1, sm: 1.5 }, bgcolor: '#faf5ff', borderRadius: 2.5, color: '#a855f7', display: 'flex' }}>
                                <PeopleIcon sx={{ fontSize: { xs: 24, sm: 32 } }} />
                            </Box>
                            <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={500} noWrap display="block">Students with Dues</Typography>
                                {isLoadingStats ? <Skeleton width={60} height={28} /> : (
                                    <Typography variant="h6" fontWeight={700} color="#1e293b" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                                        {stats?.totalStudentsWithDues || 0}
                                    </Typography>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Quick Actions & CSS Visual Analytics Grid */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Collection By Class (Horizontal list) */}
                <Grid size={{ xs: 12, md: 7 }}>
                    <Card sx={{ borderRadius: 4, border: '1px solid #f1f5f9', boxShadow: 'none', height: '100%' }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight={700} color="#1e293b" sx={{ mb: 3 }}>
                                Collections By Class
                            </Typography>
                            <Grid container spacing={2} sx={{ maxHeight: 400, overflowY: 'auto', pr: 1 }}>
                                {classwiseStats.length === 0 ? (
                                    <Grid size={{ xs: 12 }}>
                                        <Typography variant="body2" color="text.secondary">No structure assignments recorded yet.</Typography>
                                    </Grid>
                                ) : (
                                    classwiseStats.map((item: any) => {
                                        const percent = item.totalExpected > 0 ? (item.totalCollected / item.totalExpected) * 100 : 0;
                                        return (
                                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item._id}>
                                                <Box sx={{ p: 1.5, border: '1px solid #f1f5f9', borderRadius: 2, height: '100%' }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                        <Typography variant="body2" fontWeight={600} color="text.primary">{item.className}</Typography>
                                                        <Typography variant="caption" fontWeight={700} color="text.secondary">
                                                            {Math.round(percent)}%
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                                                        {formatCurrency(item.totalCollected)} / {formatCurrency(item.totalExpected)}
                                                    </Typography>
                                                    <LinearProgress variant="determinate" value={percent} sx={{ height: 6, borderRadius: 3, bgcolor: '#f1f5f9' }} />
                                                </Box>
                                            </Grid>
                                        );
                                    })
                                )}
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Payment Methods Breakdown */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Card sx={{ borderRadius: 4, border: '1px solid #f1f5f9', boxShadow: 'none', height: '100%' }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight={700} color="#1e293b" sx={{ mb: 3 }}>
                                Collection Method Distribution
                            </Typography>
                            <Stack spacing={2.5}>
                                {todayMethods.length === 0 ? (
                                    <Box sx={{ py: 4, textAlign: 'center' }}>
                                        <Typography variant="body2" color="text.secondary">No payments collected today.</Typography>
                                    </Box>
                                ) : (
                                    todayMethods.map((item: any, idx: number) => {
                                        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                                        const color = colors[idx % colors.length];
                                        return (
                                            <Box key={item._id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <Stack direction="row" spacing={1.5} alignItems="center">
                                                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: color }} />
                                                    <Typography variant="body2" fontWeight={600} color="text.primary">
                                                        {item._id?.toUpperCase()}
                                                    </Typography>
                                                </Stack>
                                                <Typography variant="body2" fontWeight={700} color="#1e293b">
                                                    {formatCurrency(item.total)} ({item.count} txns)
                                                </Typography>
                                            </Box>
                                        );
                                    })
                                )}
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Recent Payments Table */}
            <Card sx={{ borderRadius: 4, border: '1px solid #f1f5f9', boxShadow: 'none', mb: 4 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" fontWeight={700} color="#1e293b">
                            Recent Payments
                        </Typography>
                        <Button variant="text" size="small" component={Link} to="/school-admin/fees/receipts" startIcon={<AssessmentIcon />}>
                            View All Receipts
                        </Button>
                    </Box>
                    <AppTable
                        columns={columns}
                        data={recentPayments}
                        isLoading={isLoadingPayments}
                        emptyMessage="No payments logged in the system yet."
                    />
                </CardContent>
            </Card>

            {/* Quick Action Navigation Grid */}
            <Typography variant="h6" fontWeight={700} color="#1e293b" sx={{ mb: 2 }}>
                Quick Action Panel
            </Typography>
            <Grid container spacing={3}>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <Button variant="outlined" fullWidth component={Link} to="/school-admin/fees/categories" startIcon={<SettingsIcon />} sx={{ py: 2, borderRadius: 3, display: 'flex', flexDirection: 'column', gap: 1, borderColor: '#e2e8f0', color: '#475569' }}>
                        Fee Categories
                    </Button>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <Button variant="outlined" fullWidth component={Link} to="/school-admin/fees/structures" startIcon={<SettingsIcon />} sx={{ py: 2, borderRadius: 3, display: 'flex', flexDirection: 'column', gap: 1, borderColor: '#e2e8f0', color: '#475569' }}>
                        Fee Structures
                    </Button>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <Button variant="outlined" fullWidth component={Link} to="/school-admin/fees/accounts" startIcon={<PeopleIcon />} sx={{ py: 2, borderRadius: 3, display: 'flex', flexDirection: 'column', gap: 1, borderColor: '#e2e8f0', color: '#475569' }}>
                        Student Ledgers
                    </Button>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <Button variant="outlined" fullWidth component={Link} to="/school-admin/fees/reports" startIcon={<AssessmentIcon />} sx={{ py: 2, borderRadius: 3, display: 'flex', flexDirection: 'column', gap: 1, borderColor: '#e2e8f0', color: '#475569' }}>
                        Collection Reports
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
};

export default FeeDashboard;
