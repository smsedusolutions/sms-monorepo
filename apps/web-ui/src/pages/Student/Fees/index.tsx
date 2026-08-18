// apps/web-ui/src/pages/Student/Fees/index.tsx

import React from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    Alert,
    IconButton,
    CircularProgress
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import InfoIcon from '@mui/icons-material/Info';
import TokenService from '../../../queries/token/tokenService';
import {
    useGetStudentFeeAccounts,
    useGetPaymentsByStudent,
    useGetStudentReceipts
} from '../../../queries/Fee';
import { AppTable } from '../../../components/shared/AppTable';

const StudentFees: React.FC = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const studentId = TokenService.getStudentId() || '';

    const { data: accountsData, isLoading: isLoadingAccount } = useGetStudentFeeAccounts(schoolId, studentId);
    const { data: paymentsData, isLoading: isLoadingPayments } = useGetPaymentsByStudent(schoolId, studentId);
    const { data: receiptsData, isLoading: isLoadingReceipts } = useGetStudentReceipts(schoolId, studentId);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
    };

    const handleDownloadPDF = (receiptId: string) => {
        const url = `${import.meta.env.VITE_PAYMENT_API_URL || 'http://localhost:5005'}/api/school/${schoolId}/fees/receipts/${receiptId}/pdf`;
        window.open(url, '_blank');
    };

    if (!studentId) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="warning">Failed to resolve student profile from token session. Please contact support.</Alert>
            </Box>
        );
    }

    const isLoading = isLoadingAccount || isLoadingPayments || isLoadingReceipts;
    const account = accountsData?.data?.[0]; // Get current academic year running ledger
    const payments = paymentsData?.data || [];
    const receipts = receiptsData?.data || [];

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!account) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>Fees & Dues</Typography>
                <Alert severity="info">No fee account schedules assigned to your profile for this academic year.</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" fontWeight={700} color="text.primary" sx={{ fontSize: { xs: '1.4rem', sm: '2rem' } }}>
                    My Fees & Dues
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    View your assigned structure breakdowns, receipt history, and outstanding balances.
                </Typography>
            </Box>

            <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3, borderRadius: 2.5 }}>
                Online payments are coming soon. To settle dues, please pay at the school accounts counter.
            </Alert>

            {/* Account Summary Cards */}
            <Grid container spacing={{ xs: 1.5, sm: 2.5 }} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Paper elevation={0} sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 2.5, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={500}>Net Assigned Dues</Typography>
                        <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5 }}>{formatCurrency(account.netFees)}</Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                    <Paper elevation={0} sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 2.5, textAlign: 'center', bgcolor: '#f0fdf4' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={500}>Paid Amount</Typography>
                        <Typography variant="h6" fontWeight={700} color="success.main" sx={{ mt: 0.5 }}>{formatCurrency(account.totalPaid)}</Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                    <Paper elevation={0} sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 2.5, textAlign: 'center', bgcolor: '#fef2f2' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={500}>Outstanding Balance</Typography>
                        <Typography variant="h6" fontWeight={700} color="error.main" sx={{ mt: 0.5 }}>{formatCurrency(account.totalBalance)}</Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Fee Items Details */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>Itemized Fee Breakdowns</Typography>
                <AppTable
                    columns={[
                        { name: 'Fee Category', selector: (row: any) => row.categoryName },
                        { name: 'Due Date', selector: (row: any) => row.dueDate ? new Date(row.dueDate).toLocaleDateString() : 'N/A' },
                        { name: 'Assigned Total', selector: (row: any) => formatCurrency(row.originalAmount) },
                        { name: 'Waived/Discounts', selector: (row: any) => formatCurrency(row.discountAmount + row.waivedAmount) },
                        { name: 'Paid Amount', selector: (row: any) => formatCurrency(row.paidAmount), cell: (row: any) => <Typography variant="body2" color="success.main" fontWeight={600}>{formatCurrency(row.paidAmount)}</Typography> },
                        { name: 'Remaining Balance', selector: (row: any) => formatCurrency(row.balanceAmount), cell: (row: any) => <Typography variant="body2" color={row.balanceAmount > 0 ? 'error.main' : 'success.main'} fontWeight={700}>{formatCurrency(row.balanceAmount)}</Typography> }
                    ]}
                    data={account.feeBreakdown}
                />
            </Box>

            <Grid container spacing={3}>
                {/* Receipts list */}
                <Grid size={{ xs: 12, md: 7 }}>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" fontWeight={700} sx={{ mb: 2, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>My Receipts</Typography>
                        <AppTable
                            columns={[
                                { name: 'Receipt No', selector: (row: any) => row.receiptNumber, cell: (row: any) => <Typography variant="body2" fontWeight={600} color="primary">{row.receiptNumber}</Typography> },
                                { name: 'Date', selector: (row: any) => new Date(row.paymentDate).toLocaleDateString() },
                                { name: 'Amount Paid', selector: (row: any) => formatCurrency(row.totalAmountPaid), cell: (row: any) => <Typography variant="body2" fontWeight={700}>{formatCurrency(row.totalAmountPaid)}</Typography> },
                                { name: 'Download', cell: (row: any) => <IconButton size="small" color="primary" onClick={() => handleDownloadPDF(row.receiptId)}><PrintIcon /></IconButton> }
                            ]}
                            data={receipts}
                            emptyMessage="No receipts available yet."
                        />
                    </Box>
                </Grid>

                {/* Recent transaction history log */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" fontWeight={700} sx={{ mb: 2, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>Transaction Logs</Typography>
                        <AppTable
                            columns={[
                                { name: 'Type', selector: (row: any) => row.paymentType?.toUpperCase() },
                                { name: 'Date', selector: (row: any) => new Date(row.paymentDate || row.createdAt).toLocaleDateString() },
                                { name: 'Method', selector: (row: any) => row.paymentMode?.toUpperCase() || 'N/A' },
                                { name: 'Amount', selector: (row: any) => formatCurrency(row.amount), cell: (row: any) => <Typography variant="body2" fontWeight={700} color={row.paymentType === 'payment' ? 'success.main' : 'error.main'}>{formatCurrency(row.amount)}</Typography> }
                            ]}
                            data={payments}
                            emptyMessage="No transactions registered."
                        />
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default StudentFees;
