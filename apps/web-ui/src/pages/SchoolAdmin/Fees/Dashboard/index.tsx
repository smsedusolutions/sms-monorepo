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

const FeeDashboard: React.FC = () => {
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
        <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
            {/* Header & Main Actions */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, mb: { xs: 2, sm: 3 }, gap: 1.5 }}>
                <Box>
                    <Typography
                        variant="h4"
                        fontWeight={800}
                        sx={{
                            mb: 0.25,
                            background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontSize: { xs: '1.45rem', sm: '1.85rem', md: '2.25rem' },
                            letterSpacing: '-0.02em',
                            lineHeight: 1.2
                        }}
                    >
                        Fees Dashboard
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                        Real-time oversight of collections, dues, and transaction histories.
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', sm: 'auto' }, flexWrap: 'wrap' }}>
                    <Button
                        variant="outlined"
                        size="small"
                        color="primary"
                        onClick={handleRefresh}
                        startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', px: 1.5, py: 0.5, flex: { xs: 1, sm: 'none' } }}
                    >
                        Refresh
                    </Button>
                    <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        component={Link}
                        to="/school-admin/fees/payments"
                        startIcon={<ReceiptIcon sx={{ fontSize: 16 }} />}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', px: 1.5, py: 0.5, flex: { xs: 2, sm: 'none' }, bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
                    >
                        Collect Payment
                    </Button>
                    <Button
                        variant="outlined"
                        size="small"
                        color="primary"
                        component={Link}
                        to="/school-admin/fees/assignments"
                        startIcon={<AssignmentIcon sx={{ fontSize: 16 }} />}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', px: 1.5, py: 0.5, flex: { xs: 2, sm: 'none' } }}
                    >
                        Assign Fees
                    </Button>
                </Stack>
            </Box>

            {/* Statistics Cards Grid - 2x2 on mobile */}
            <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 2.5, sm: 3.5 } }}>
                <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                    <Card elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', height: '100%' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, p: { xs: 1.25, sm: 1.75 }, '&:last-child': { pb: { xs: 1.25, sm: 1.75 } } }}>
                            <Box sx={{ p: { xs: 0.75, sm: 1 }, bgcolor: '#eff6ff', borderRadius: 2, color: '#3b82f6', display: 'flex', flexShrink: 0 }}>
                                <AccountBalanceWalletIcon sx={{ fontSize: { xs: 20, sm: 26 } }} />
                            </Box>
                            <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600} noWrap display="block" sx={{ fontSize: { xs: '0.65rem', sm: '0.72rem' } }}>Total Collected</Typography>
                                {isLoadingStats ? <Skeleton width={60} height={24} /> : (
                                    <Typography variant="h6" fontWeight={800} color="#1e293b" sx={{ fontSize: { xs: '0.95rem', sm: '1.15rem' }, lineHeight: 1.1 }} noWrap>
                                        {formatCurrency(stats?.totalCollected || 0)}
                                    </Typography>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                    <Card elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', height: '100%' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, p: { xs: 1.25, sm: 1.75 }, '&:last-child': { pb: { xs: 1.25, sm: 1.75 } } }}>
                            <Box sx={{ p: { xs: 0.75, sm: 1 }, bgcolor: '#f0fdf4', borderRadius: 2, color: '#22c55e', display: 'flex', flexShrink: 0 }}>
                                <TodayIcon sx={{ fontSize: { xs: 20, sm: 26 } }} />
                            </Box>
                            <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600} noWrap display="block" sx={{ fontSize: { xs: '0.65rem', sm: '0.72rem' } }}>Today's Collection</Typography>
                                {isLoadingStats ? <Skeleton width={60} height={24} /> : (
                                    <Typography variant="h6" fontWeight={800} color="#1e293b" sx={{ fontSize: { xs: '0.95rem', sm: '1.15rem' }, lineHeight: 1.1 }} noWrap>
                                        {formatCurrency(stats?.todayCollection || 0)}
                                    </Typography>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                    <Card elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', height: '100%' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, p: { xs: 1.25, sm: 1.75 }, '&:last-child': { pb: { xs: 1.25, sm: 1.75 } } }}>
                            <Box sx={{ p: { xs: 0.75, sm: 1 }, bgcolor: '#fef2f2', borderRadius: 2, color: '#ef4444', display: 'flex', flexShrink: 0 }}>
                                <HourglassEmptyIcon sx={{ fontSize: { xs: 20, sm: 26 } }} />
                            </Box>
                            <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600} noWrap display="block" sx={{ fontSize: { xs: '0.65rem', sm: '0.72rem' } }}>Pending Dues</Typography>
                                {isLoadingStats ? <Skeleton width={60} height={24} /> : (
                                    <Typography variant="h6" fontWeight={800} color="#dc2626" sx={{ fontSize: { xs: '0.95rem', sm: '1.15rem' }, lineHeight: 1.1 }} noWrap>
                                        {formatCurrency(stats?.totalOutstanding || 0)}
                                    </Typography>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                    <Card elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', height: '100%' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, p: { xs: 1.25, sm: 1.75 }, '&:last-child': { pb: { xs: 1.25, sm: 1.75 } } }}>
                            <Box sx={{ p: { xs: 0.75, sm: 1 }, bgcolor: '#faf5ff', borderRadius: 2, color: '#a855f7', display: 'flex', flexShrink: 0 }}>
                                <PeopleIcon sx={{ fontSize: { xs: 20, sm: 26 } }} />
                            </Box>
                            <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600} noWrap display="block" sx={{ fontSize: { xs: '0.65rem', sm: '0.72rem' } }}>Students with Dues</Typography>
                                {isLoadingStats ? <Skeleton width={60} height={24} /> : (
                                    <Typography variant="h6" fontWeight={800} color="#1e293b" sx={{ fontSize: { xs: '0.95rem', sm: '1.15rem' }, lineHeight: 1.1 }}>
                                        {stats?.totalStudentsWithDues || 0}
                                    </Typography>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Quick Actions & Visual Analytics Grid */}
            <Grid container spacing={{ xs: 2, sm: 2.5 }} sx={{ mb: { xs: 2.5, sm: 3.5 } }}>
                {/* Collection By Class */}
                <Grid size={{ xs: 12, md: 7 }}>
                    <Card elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', height: '100%' }}>
                        <CardContent sx={{ p: { xs: 1.75, sm: 2.5 } }}>
                            <Typography variant="subtitle1" fontWeight={700} color="#1e293b" sx={{ mb: 2, fontSize: { xs: '0.95rem', sm: '1.05rem' } }}>
                                Collections By Class
                            </Typography>
                            <Grid container spacing={1.5} sx={{ maxHeight: 360, overflowY: 'auto', pr: 0.5 }}>
                                {classwiseStats.length === 0 ? (
                                    <Grid size={{ xs: 12 }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>No structure assignments recorded yet.</Typography>
                                    </Grid>
                                ) : (
                                    classwiseStats.map((item: any) => {
                                        const percent = item.totalExpected > 0 ? (item.totalCollected / item.totalExpected) * 100 : 0;
                                        return (
                                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item._id}>
                                                <Box sx={{ p: 1.25, border: '1px solid #f1f5f9', borderRadius: 2, bgcolor: '#f8fafc', height: '100%' }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                        <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ fontSize: '0.825rem' }}>{item.className}</Typography>
                                                        <Typography variant="caption" fontWeight={700} color="text.secondary">
                                                            {Math.round(percent)}%
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.75, fontSize: '0.7rem' }}>
                                                        {formatCurrency(item.totalCollected)} / {formatCurrency(item.totalExpected)}
                                                    </Typography>
                                                    <LinearProgress variant="determinate" value={percent} sx={{ height: 5, borderRadius: 2, bgcolor: '#e2e8f0' }} />
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
                    <Card elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', height: '100%' }}>
                        <CardContent sx={{ p: { xs: 1.75, sm: 2.5 } }}>
                            <Typography variant="subtitle1" fontWeight={700} color="#1e293b" sx={{ mb: 2, fontSize: { xs: '0.95rem', sm: '1.05rem' } }}>
                                Collection Method Distribution
                            </Typography>
                            <Stack spacing={1.5}>
                                {todayMethods.length === 0 ? (
                                    <Box sx={{ py: 3, textAlign: 'center' }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>No payments collected today.</Typography>
                                    </Box>
                                ) : (
                                    todayMethods.map((item: any, idx: number) => {
                                        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                                        const color = colors[idx % colors.length];
                                        return (
                                            <Box key={item._id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #f1f5f9' }}>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
                                                    <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ fontSize: '0.825rem' }}>
                                                        {item._id?.toUpperCase()}
                                                    </Typography>
                                                </Stack>
                                                <Typography variant="body2" fontWeight={700} color="#1e293b" sx={{ fontSize: '0.825rem' }}>
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
            <Card elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', mb: { xs: 2.5, sm: 3.5 } }}>
                <CardContent sx={{ p: { xs: 1.75, sm: 2.5 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                        <Typography variant="subtitle1" fontWeight={700} color="#1e293b" sx={{ fontSize: { xs: '0.95rem', sm: '1.05rem' } }}>
                            Recent Payments
                        </Typography>
                        <Button variant="text" size="small" component={Link} to="/school-admin/fees/receipts" startIcon={<AssessmentIcon sx={{ fontSize: 16 }} />} sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'none' }}>
                            View All Receipts
                        </Button>
                    </Box>
                    <Box sx={{ overflowX: 'auto' }}>
                        <AppTable
                            columns={columns}
                            data={recentPayments}
                            isLoading={isLoadingPayments}
                            emptyMessage="No payments logged in the system yet."
                        />
                    </Box>
                </CardContent>
            </Card>

            {/* Quick Action Navigation Grid */}
            <Typography variant="subtitle1" fontWeight={700} color="#1e293b" sx={{ mb: 1.5, fontSize: { xs: '0.95rem', sm: '1.05rem' } }}>
                Quick Action Panel
            </Typography>
            <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                {[
                    { label: 'Fee Categories', icon: <SettingsIcon />, to: '/school-admin/fees/categories', color: '#3b82f6' },
                    { label: 'Fee Structures', icon: <SettingsIcon />, to: '/school-admin/fees/structures', color: '#10b981' },
                    { label: 'Student Ledgers', icon: <PeopleIcon />, to: '/school-admin/fees/accounts', color: '#8b5cf6' },
                    { label: 'Collection Reports', icon: <AssessmentIcon />, to: '/school-admin/fees/reports', color: '#f59e0b' },
                ].map((action) => (
                    <Grid size={{ xs: 6, sm: 3 }} key={action.label}>
                        <Button
                            variant="outlined"
                            fullWidth
                            component={Link}
                            to={action.to}
                            startIcon={React.cloneElement(action.icon as any, { sx: { fontSize: 20, color: action.color } })}
                            sx={{
                                py: { xs: 1.25, sm: 1.75 },
                                borderRadius: 2.5,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 0.75,
                                borderColor: '#e2e8f0',
                                color: '#334155',
                                fontWeight: 700,
                                fontSize: { xs: '0.75rem', sm: '0.85rem' },
                                textTransform: 'none',
                                bgcolor: '#ffffff',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                                transition: 'all 0.18s ease-in-out',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    borderColor: '#cbd5e1',
                                    boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                                    bgcolor: '#f8fafc'
                                }
                            }}
                        >
                            {action.label}
                        </Button>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default FeeDashboard;
