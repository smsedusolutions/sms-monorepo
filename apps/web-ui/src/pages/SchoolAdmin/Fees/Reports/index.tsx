// apps/web-ui/src/pages/SchoolAdmin/Fees/Reports/index.tsx

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Grid,
    Stack,
    Tabs,
    Tab,
    TextField,
    MenuItem,
    LinearProgress
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import TokenService from '../../../../queries/token/tokenService';
import {
    useGetPendingFeesReport,
    useGetTodayCollectionReport,
    useGetMonthlyCollectionReport,
    useGetClasswiseCollectionReport,
    useGetDiscountReport,
    useGetFeeDefaulters
} from '../../../../queries/Fee';
import { useUrlTab } from '../../../../hooks/useUrlTab';
import { AppTable } from '../../../../components/shared/AppTable';

const FeeReports: React.FC = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const [activeTab, setActiveTab] = useUrlTab(0, ['pending', 'today', 'monthly', 'classwise', 'discounts', 'defaulters']);

    // Filters
    const [academicYear, setAcademicYear] = useState('2026-2027');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const { data: pendingData, isLoading: isLoadingPending } = useGetPendingFeesReport(schoolId, { academicYear });
    const { data: todayData, isLoading: isLoadingToday } = useGetTodayCollectionReport(schoolId);
    const { data: monthlyData, isLoading: isLoadingMonthly } = useGetMonthlyCollectionReport(schoolId, { academicYear });
    const { data: classwiseData, isLoading: isLoadingClasswise } = useGetClasswiseCollectionReport(schoolId, { academicYear });
    const { data: discountData, isLoading: isLoadingDiscount } = useGetDiscountReport(schoolId, { academicYear });
    const { data: defaultersData, isLoading: isLoadingDefaulters } = useGetFeeDefaulters(schoolId);

    const handleTabChange = (_: any, newValue: number) => {
        setActiveTab(newValue);
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
    };

    const handleExportExcel = () => {
        const url = `${import.meta.env.VITE_PAYMENT_API_URL || 'http://localhost:5005'}/api/school/${schoolId}/fees/dashboard/collection/export?startDate=${startDate}&endDate=${endDate}`;
        window.open(url, '_blank');
    };

    const pendingReport = pendingData?.data || [];
    const todayReport = todayData?.data || [];
    const monthlyReport = monthlyData?.data || [];
    const classwiseReport = classwiseData?.data || [];
    const discountReport = discountData?.data || [];
    const defaultersList = defaultersData?.data || [];

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight={700} color="text.primary">
                        Financial Reports
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Analyze collections, pending dues, late fee calculations, and applied waivers.
                    </Typography>
                </Box>
                <Button variant="contained" color="success" startIcon={<DownloadIcon />} onClick={handleExportExcel} sx={{ borderRadius: 2 }}>
                    Export Collection Ledger (Excel)
                </Button>
            </Box>

            {/* Filter Card */}
            <Card sx={{ borderRadius: 4, border: '1px solid #f1f5f9', boxShadow: 'none', mb: 4 }}>
                <CardContent sx={{ p: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                size="small"
                                select
                                fullWidth
                                label="Academic Year"
                                value={academicYear}
                                onChange={(e) => setAcademicYear(e.target.value)}
                            >
                                <MenuItem value="2026-2027">2026-2027</MenuItem>
                                <MenuItem value="2027-2028">2027-2028</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                type="date"
                                size="small"
                                fullWidth
                                label="Export Start Date"
                                InputLabelProps={{ shrink: true }}
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                type="date"
                                size="small"
                                fullWidth
                                label="Export End Date"
                                InputLabelProps={{ shrink: true }}
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Tabs panel */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
                    <Tab label="Pending Dues Report" />
                    <Tab label="Today's Collection" />
                    <Tab label="Monthly Trends" />
                    <Tab label="Class-wise Collection" />
                    <Tab label="Discount Allocations" />
                    <Tab label="Dues Defaulters" />
                </Tabs>
            </Box>

            {/* Tab content area */}
            {activeTab === 0 && (
                <Card sx={{ borderRadius: 4, border: '1px solid #f1f5f9', boxShadow: 'none' }}>
                    <CardContent sx={{ p: 0 }}>
                        <AppTable
                            columns={[
                                { name: 'Class Name', selector: (row: any) => row.className },
                                { name: 'Total Expected Dues', selector: (row: any) => formatCurrency(row.totalExpected) },
                                { name: 'Total Collected', selector: (row: any) => formatCurrency(row.totalCollected), cell: (row: any) => <Typography variant="body2" color="success.main" fontWeight={600}>{formatCurrency(row.totalCollected)}</Typography> },
                                { name: 'Pending Balance', selector: (row: any) => formatCurrency(row.totalPending), cell: (row: any) => <Typography variant="body2" color="error.main" fontWeight={700}>{formatCurrency(row.totalPending)}</Typography> },
                                { name: 'Students with Dues', selector: (row: any) => row.defaultersCount }
                            ]}
                            data={pendingReport}
                            isLoading={isLoadingPending}
                        />
                    </CardContent>
                </Card>
            )}

            {activeTab === 1 && (
                <Card sx={{ borderRadius: 4, border: '1px solid #f1f5f9', boxShadow: 'none' }}>
                    <CardContent sx={{ p: 0 }}>
                        <AppTable
                            columns={[
                                { name: 'Payment Mode', selector: (row: any) => row._id?.toUpperCase() },
                                { name: 'Transactions Count', selector: (row: any) => row.count },
                                { name: 'Total Collected Today', selector: (row: any) => formatCurrency(row.total), cell: (row: any) => <Typography variant="body2" fontWeight={700} color="success.main">{formatCurrency(row.total)}</Typography> }
                            ]}
                            data={todayReport}
                            isLoading={isLoadingToday}
                        />
                    </CardContent>
                </Card>
            )}

            {activeTab === 2 && (
                <Box>
                    {/* Monthly CSS visual trends */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid size={{ xs: 12 }}>
                            <Card sx={{ borderRadius: 4, border: '1px solid #f1f5f9', boxShadow: 'none' }}>
                                <CardContent>
                                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 3 }}>Monthly Collection Trends</Typography>
                                    <Stack spacing={2.5}>
                                        {monthlyReport.length === 0 ? (
                                            <Typography variant="body2" color="text.secondary">No monthly payment data recorded.</Typography>
                                        ) : (
                                            monthlyReport.map((item: any, idx: number) => {
                                                const maxTotal = Math.max(...monthlyReport.map((m: any) => m.totalAmount), 1);
                                                const percent = (item.totalAmount / maxTotal) * 100;
                                                const monthNames = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                                                return (
                                                    <Box key={idx}>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                            <Typography variant="body2" fontWeight={600}>{monthNames[item._id.month]} {item._id.year}</Typography>
                                                            <Typography variant="body2" fontWeight={700}>{formatCurrency(item.totalAmount)} ({item.transactionCount} txns)</Typography>
                                                        </Box>
                                                        <LinearProgress variant="determinate" value={percent} sx={{ height: 8, borderRadius: 4, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { bgcolor: '#8b5cf6' } }} />
                                                    </Box>
                                                );
                                            })
                                        )}
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    <Card sx={{ borderRadius: 4, border: '1px solid #f1f5f9', boxShadow: 'none' }}>
                        <CardContent sx={{ p: 0 }}>
                            <AppTable
                                columns={[
                                    { name: 'Month / Year', cell: (row: any) => {
                                        const monthNames = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                                        return `${monthNames[row._id.month]} ${row._id.year}`;
                                    }},
                                    { name: 'Transaction Count', selector: (row: any) => row.transactionCount },
                                    { name: 'Total Amount Received', selector: (row: any) => formatCurrency(row.totalAmount), cell: (row: any) => <Typography variant="body2" fontWeight={700} color="success.main">{formatCurrency(row.totalAmount)}</Typography> }
                                ]}
                                data={monthlyReport}
                                isLoading={isLoadingMonthly}
                            />
                        </CardContent>
                    </Card>
                </Box>
            )}

            {activeTab === 3 && (
                <Card sx={{ borderRadius: 4, border: '1px solid #f1f5f9', boxShadow: 'none' }}>
                    <CardContent sx={{ p: 0 }}>
                        <AppTable
                            columns={[
                                { name: 'Class Name', selector: (row: any) => row.className },
                                { name: 'Total Expected Dues', selector: (row: any) => formatCurrency(row.totalExpected) },
                                { name: 'Total Collected', selector: (row: any) => formatCurrency(row.totalCollected), cell: (row: any) => <Typography variant="body2" fontWeight={700} color="success.main">{formatCurrency(row.totalCollected)}</Typography> }
                            ]}
                            data={classwiseReport}
                            isLoading={isLoadingClasswise}
                        />
                    </CardContent>
                </Card>
            )}

            {activeTab === 4 && (
                <Card sx={{ borderRadius: 4, border: '1px solid #f1f5f9', boxShadow: 'none' }}>
                    <CardContent sx={{ p: 0 }}>
                        <AppTable
                            columns={[
                                { name: 'Discount Template', selector: (row: any) => row.discountName },
                                { name: 'Total Waived Amount', selector: (row: any) => formatCurrency(row.totalWaived), cell: (row: any) => <Typography variant="body2" color="primary.main" fontWeight={700}>{formatCurrency(row.totalWaived)}</Typography> },
                                { name: 'Students Count Applied', selector: (row: any) => row.appliedCount }
                            ]}
                            data={discountReport}
                            isLoading={isLoadingDiscount}
                        />
                    </CardContent>
                </Card>
            )}

            {activeTab === 5 && (
                <Card sx={{ borderRadius: 4, border: '1px solid #f1f5f9', boxShadow: 'none' }}>
                    <CardContent sx={{ p: 0 }}>
                        <AppTable
                            columns={[
                                { name: 'Student Name', selector: (row: any) => row.studentName, cell: (row: any) => <Typography variant="body2" fontWeight={600}>{row.studentName}</Typography> },
                                { name: 'Class', selector: (row: any) => row.className },
                                { name: 'Outstanding Dues', selector: (row: any) => formatCurrency(row.totalBalance), cell: (row: any) => <Typography variant="body2" fontWeight={700} color="error.main">{formatCurrency(row.totalBalance)}</Typography> },
                                { name: 'Last Txn Date', selector: (row: any) => row.lastTransactionDate ? new Date(row.lastTransactionDate).toLocaleDateString() : 'None' }
                            ]}
                            data={defaultersList}
                            isLoading={isLoadingDefaulters}
                        />
                    </CardContent>
                </Card>
            )}
        </Box>
    );
};

export default FeeReports;
