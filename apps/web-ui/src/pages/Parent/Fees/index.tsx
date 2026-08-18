// apps/web-ui/src/pages/Parent/Fees/index.tsx

import React from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Paper,
    Alert,
    IconButton,
    CircularProgress,
    Tabs,
    Tab,
    Avatar,
    Stack
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import InfoIcon from '@mui/icons-material/Info';

import TokenService from '../../../queries/token/tokenService';
import { useChildSelector } from '../../../context/ChildSelectorContext';
import { useUrlTab } from '../../../hooks/useUrlTab';
import {
    useGetStudentFeeAccounts,
    useGetPaymentsByStudent,
    useGetStudentReceipts
} from '../../../queries/Fee';
import { AppTable } from '../../../components/shared/AppTable';
import type { Student } from '../../../types';

// ── Per-child fee panel ───────────────────────────────────────────────────────
const ChildFeePanel: React.FC<{
    child: Student & { className?: string; sectionName?: string };
    schoolId: string;
    formatCurrency: (v: number) => string;
}> = ({ child, schoolId, formatCurrency }) => {
    const { data: accountsData, isLoading: loadingAccount } = useGetStudentFeeAccounts(schoolId, child.studentId);
    const { data: paymentsData, isLoading: loadingPayments } = useGetPaymentsByStudent(schoolId, child.studentId);
    const { data: receiptsData, isLoading: loadingReceipts } = useGetStudentReceipts(schoolId, child.studentId);

    const isLoading = loadingAccount || loadingPayments || loadingReceipts;
    const account = accountsData?.data?.[0];
    const payments = paymentsData?.data || [];
    const receipts = receiptsData?.data || [];

    const handleDownloadPDF = (receiptId: string) => {
        const url = `${import.meta.env.VITE_PAYMENT_API_URL || 'http://localhost:5005'}/api/school/${schoolId}/fees/receipts/${receiptId}/pdf`;
        window.open(url, '_blank');
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={32} />
            </Box>
        );
    }

    if (!account) {
        return (
            <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                No fee ledger assigned to <strong>{child.firstName} {child.lastName}</strong> for this academic year.
                Please contact the school administration.
            </Alert>
        );
    }

    return (
        <Box sx={{ mt: 2 }}>
            {/* Summary cards */}
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

            {/* Itemized breakdown */}
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

            {/* Receipts + Transactions */}
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 7 }}>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" fontWeight={700} sx={{ mb: 2, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>Payment Receipts</Typography>
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

const ParentFees: React.FC = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const { children, isLoading: childrenLoading } = useChildSelector();
    const [activeTab, setActiveTab] = useUrlTab(0);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

    if (childrenLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (children.length === 0) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="warning">No children linked to your account. Please contact school administration.</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" fontWeight={700} color="text.primary" sx={{ fontSize: { xs: '1.4rem', sm: '2rem' } }}>
                    Fees & Online Payments
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    View fee ledgers, outstanding balances, and payment receipts for all your children.
                </Typography>
            </Box>

            <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3, borderRadius: 2.5 }}>
                Online payment gateway integrations are coming soon. To settle outstanding balances, please contact the school cash counter.
            </Alert>

            {/* Child tabs */}
            <Card sx={{ borderRadius: 3, border: '1px solid #f1f5f9', boxShadow: 'none' }}>
                <Box sx={{ borderBottom: '1px solid #f1f5f9' }}>
                    <Tabs
                        value={activeTab}
                        onChange={(_, v) => setActiveTab(v)}
                        variant="scrollable"
                        scrollButtons="auto"
                        allowScrollButtonsMobile
                        sx={{ px: 1 }}
                    >
                        {children.map((child, idx) => (
                            <Tab
                                key={child.studentId}
                                value={idx}
                                label={
                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                        <Avatar
                                            src={child.profileImage}
                                            sx={{ width: 28, height: 28, fontSize: 12, bgcolor: 'primary.main' }}
                                        >
                                            {child.firstName?.[0]}
                                        </Avatar>
                                        <Box sx={{ textAlign: 'left' }}>
                                            <Typography variant="body2" fontWeight={600} lineHeight={1.2}>
                                                {child.firstName} {child.lastName}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" lineHeight={1}>
                                                {child.className || `Class ${child.class}`} {child.sectionName ? `• ${child.sectionName}` : ''}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                }
                                sx={{ textTransform: 'none', minHeight: 60, alignItems: 'center' }}
                            />
                        ))}
                    </Tabs>
                </Box>

                <CardContent sx={{ p: { xs: 1.5, sm: 3 } }}>
                    {children.map((child, idx) =>
                        activeTab === idx ? (
                            <ChildFeePanel
                                key={child.studentId}
                                child={child}
                                schoolId={schoolId}
                                formatCurrency={formatCurrency}
                            />
                        ) : null
                    )}
                </CardContent>
            </Card>
        </Box>
    );
};

export default ParentFees;
