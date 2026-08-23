import React from 'react';
import {
    Box, Typography, Paper, Grid, Button, Chip, Alert, Skeleton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Tabs, Tab, Avatar, Stack, IconButton, Divider
} from '@mui/material';
import {
    ReceiptLong as StatementIcon,
    Download as DownloadIcon,
    CheckCircle as PaidIcon,
    Print as PrintIcon,
    Info as InfoIcon,
} from '@mui/icons-material';
import TokenService from '../../../queries/token/tokenService';
import { useChildSelector } from '../../../context/ChildSelectorContext';
import { useUrlTab } from '../../../hooks/useUrlTab';
import {
    useGetStudentFeeAccounts,
    useGetPaymentsByStudent,
    useGetStudentReceipts
} from '../../../queries/Fee';
import type { FeeBreakdownItem } from '../../../types/fee.types';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { MobileCardItem, MobileCardList } from '../../../components/mobile';

const statusConfig: Record<string, { label: string; color: 'success' | 'warning' | 'error' | 'default' }> = {
    paid: { label: 'Paid', color: 'success' },
    partial: { label: 'Partially Paid', color: 'warning' },
    pending: { label: 'Pending', color: 'error' },
    overdue: { label: 'Overdue', color: 'error' },
    unpaid: { label: 'Unpaid', color: 'error' },
    waived: { label: 'Waived', color: 'default' },
    refunded: { label: 'Refunded', color: 'warning' },
};

const formatCurrency = (val: number = 0) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

export const FeeStatement: React.FC = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const isMobile = useIsMobile();
    const { children, selectedChild, setSelectedChild, isLoading: childrenLoading } = useChildSelector();
    const [activeTab, setActiveTab] = useUrlTab(0);

    // Get current child based on active tab or selected child
    const currentChild = children[activeTab] || selectedChild || children[0];
    const studentId = currentChild?.studentId || '';

    const {
        data: accountsData,
        isLoading: loadingAccounts,
        error: accountError
    } = useGetStudentFeeAccounts(schoolId, studentId);

    const {
        data: paymentsData,
        isLoading: loadingPayments
    } = useGetPaymentsByStudent(schoolId, studentId);

    const {
        data: receiptsData,
        isLoading: loadingReceipts
    } = useGetStudentReceipts(schoolId, studentId);

    const isLoading = childrenLoading || loadingAccounts || loadingPayments || loadingReceipts;

    // Get primary fee account ledger (sorted latest academic year)
    const account = accountsData?.data?.[0];
    const feeBreakdown: FeeBreakdownItem[] = account?.feeBreakdown || [];
    const payments = paymentsData?.data || [];
    const receipts = receiptsData?.data || [];

    const summary = {
        totalFees: account?.netFees ?? account?.totalOriginalFees ?? 0,
        totalPaid: account?.totalPaid ?? 0,
        totalOutstanding: account?.totalBalance ?? 0,
        totalDiscounts: (account?.totalDiscount || 0) + (account?.totalWaived || 0),
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadReceiptPDF = (receiptId: string) => {
        const url = `${import.meta.env.VITE_PAYMENT_API_URL || 'http://localhost:5005'}/api/school/${schoolId}/fees/receipts/${receiptId}/pdf`;
        window.open(url, '_blank');
    };

    if (childrenLoading) {
        return (
            <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 1000, mx: 'auto' }}>
                <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2, mb: 3 }} />
                <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2, mb: 3 }} />
                <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
            </Box>
        );
    }

    if (!children || children.length === 0) {
        return (
            <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 1000, mx: 'auto' }}>
                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    No children linked to your parent account. Please contact the school administration.
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 1000, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <StatementIcon sx={{ color: 'primary.main', fontSize: 32 }} />
                    <Box>
                        <Typography variant="h5" fontWeight={800} sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
                            Fee Statement & Ledger
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Detailed summary of assigned fee structures, breakdown, payments, and receipts
                        </Typography>
                    </Box>
                </Box>
                <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handlePrint}
                    size={isMobile ? 'small' : 'medium'}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                >
                    Download / Print Statement
                </Button>
            </Box>

            {/* Multi-child Tabs */}
            {children.length > 1 && (
                <Paper elevation={0} sx={{ mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Tabs
                        value={activeTab}
                        onChange={(_, v) => {
                            setActiveTab(v);
                            if (children[v]) {
                                setSelectedChild(children[v]);
                            }
                        }}
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
                                sx={{ textTransform: 'none', minHeight: 56, alignItems: 'center' }}
                            />
                        ))}
                    </Tabs>
                </Paper>
            )}

            {/* Child Profile Banner */}
            {currentChild && (
                <Paper
                    elevation={0}
                    sx={{
                        p: 2,
                        mb: 3,
                        borderRadius: 2,
                        border: '1px solid #e0e7ff',
                        bgcolor: '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 2
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                            src={currentChild.profileImage}
                            sx={{ width: 44, height: 44, bgcolor: 'primary.main', fontWeight: 700 }}
                        >
                            {currentChild.firstName?.[0]}
                        </Avatar>
                        <Box>
                            <Typography variant="subtitle1" fontWeight={700}>
                                {currentChild.firstName} {currentChild.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Student ID: <strong>{currentChild.studentId}</strong> • Class: {currentChild.className || currentChild.class} {currentChild.sectionName ? `(${currentChild.sectionName})` : ''}
                            </Typography>
                        </Box>
                    </Box>
                    {account && (
                        <Chip
                            label={`Academic Year: ${account.academicYear}`}
                            variant="outlined"
                            color="primary"
                            size="small"
                            sx={{ fontWeight: 600 }}
                        />
                    )}
                </Paper>
            )}

            {/* Summary KPI Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', textAlign: 'center', bgcolor: 'grey.50' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>TOTAL APPLICABLE FEES</Typography>
                        <Typography fontWeight={800} sx={{ fontSize: '1.6rem', mt: 0.5, color: 'text.primary' }}>
                            {formatCurrency(summary.totalFees)}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', textAlign: 'center', bgcolor: '#f0fdf4' }}>
                        <Typography variant="caption" color="success.main" fontWeight={600}>TOTAL PAID</Typography>
                        <Typography fontWeight={800} sx={{ fontSize: '1.6rem', mt: 0.5, color: 'success.main' }}>
                            {formatCurrency(summary.totalPaid)}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', textAlign: 'center', bgcolor: '#fef2f2' }}>
                        <Typography variant="caption" color="error.main" fontWeight={600}>OUTSTANDING BALANCE</Typography>
                        <Typography fontWeight={800} sx={{ fontSize: '1.6rem', mt: 0.5, color: 'error.main' }}>
                            {formatCurrency(summary.totalOutstanding)}
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {isLoading ? (
                <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
            ) : accountError ? (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                    Failed to load fee statement for {currentChild?.firstName}.
                </Alert>
            ) : !account ? (
                <Alert severity="info" icon={<InfoIcon />} sx={{ borderRadius: 2 }}>
                    No fee ledger assigned to <strong>{currentChild?.firstName} {currentChild?.lastName}</strong> for the current academic session.
                </Alert>
            ) : feeBreakdown.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <PaidIcon sx={{ fontSize: 56, color: 'success.main', mb: 1, opacity: 0.5 }} />
                    <Typography fontWeight={700} color="success.main">All dues are fully settled!</Typography>
                    <Typography variant="body2" color="text.secondary">No outstanding or pending fee line items found.</Typography>
                </Box>
            ) : isMobile ? (
                <MobileCardList isLoading={false} totalCount={feeBreakdown.length} itemCount={feeBreakdown.length} emptyTitle="" emptyMessage="">
                    {feeBreakdown.map((r, idx) => {
                        const isOverdue = r.dueDate ? new Date(r.dueDate) < new Date() : false;
                        const statusKey = (r.balanceAmount || 0) <= 0 ? 'paid' : (r.paidAmount || 0) > 0 ? 'partial' : isOverdue ? 'overdue' : 'pending';
                        const cfg = statusConfig[statusKey] || statusConfig.pending;
                        return (
                            <MobileCardItem
                                key={r.feeCategoryId || idx}
                                title={r.categoryName || 'Fee Component'}
                                subtitle={`Due: ${r.dueDate ? new Date(r.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}`}
                                badge={<Chip label={cfg.label} color={cfg.color} size="small" />}
                                metaItems={[
                                    { label: 'Original', value: formatCurrency(r.originalAmount) },
                                    { label: 'Paid', value: formatCurrency(r.paidAmount) },
                                    { label: 'Balance', value: formatCurrency(r.balanceAmount) },
                                ]}
                            />
                        );
                    })}
                </MobileCardList>
            ) : (
                <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden', mb: 4 }}>
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="subtitle1" fontWeight={700}>
                            Itemized Fee Breakdown
                        </Typography>
                    </Box>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'grey.50' }}>
                                    <TableCell sx={{ fontWeight: 700 }}>Fee Component</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Due Date</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>Assigned (₹)</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>Discounts (₹)</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>Paid (₹)</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>Balance (₹)</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {feeBreakdown.map((r, idx) => {
                                    const isOverdue = r.dueDate ? new Date(r.dueDate) < new Date() : false;
                                    const statusKey = (r.balanceAmount || 0) <= 0 ? 'paid' : (r.paidAmount || 0) > 0 ? 'partial' : isOverdue ? 'overdue' : (r.status || 'pending');
                                    const cfg = statusConfig[statusKey] || statusConfig.pending;
                                    const discounts = (r.discountAmount || 0) + (r.waivedAmount || 0);

                                    return (
                                        <TableRow key={r.feeCategoryId || idx} hover>
                                            <TableCell>
                                                <Typography fontWeight={600} variant="body2">{r.categoryName || 'Fee Component'}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary">
                                                    {r.dueDate ? new Date(r.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" fontWeight={600}>
                                                    {formatCurrency(r.originalAmount)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" color={discounts > 0 ? 'info.main' : 'text.secondary'}>
                                                    {formatCurrency(discounts)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" color="success.main" fontWeight={600}>
                                                    {formatCurrency(r.paidAmount)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography
                                                    variant="body2"
                                                    color={(r.balanceAmount || 0) > 0 ? 'error.main' : 'text.secondary'}
                                                    fontWeight={700}
                                                >
                                                    {formatCurrency(r.balanceAmount)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip label={cfg.label} color={cfg.color} size="small" />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {/* Payment Receipts & Transaction History */}
            {account && (
                <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid size={{ xs: 12, md: 7 }}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                                Payment Receipts
                            </Typography>
                            {receipts.length === 0 ? (
                                <Typography variant="body2" color="text.secondary">
                                    No payment receipts issued yet.
                                </Typography>
                            ) : (
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 700 }}>Receipt #</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 700 }}>Amount</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 700 }}>PDF</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {receipts.map((rc: any) => (
                                                <TableRow key={rc.receiptId || rc._id}>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={600} color="primary.main">
                                                            {rc.receiptNumber}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {new Date(rc.paymentDate).toLocaleDateString('en-IN')}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography variant="body2" fontWeight={700} color="success.main">
                                                            {formatCurrency(rc.totalAmountPaid)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <IconButton
                                                            size="small"
                                                            color="primary"
                                                            onClick={() => handleDownloadReceiptPDF(rc.receiptId)}
                                                            title="Download PDF"
                                                        >
                                                            <PrintIcon fontSize="small" />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, md: 5 }}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                                Transaction Logs
                            </Typography>
                            {payments.length === 0 ? (
                                <Typography variant="body2" color="text.secondary">
                                    No transaction records found.
                                </Typography>
                            ) : (
                                <Stack spacing={1.5} divider={<Divider />}>
                                    {payments.slice(0, 5).map((pm: any) => (
                                        <Box key={pm.transactionId || pm._id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {pm.paymentMode ? pm.paymentMode.toUpperCase() : 'PAYMENT'} • {pm.paymentType?.toUpperCase()}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {new Date(pm.paymentDate || pm.createdAt).toLocaleDateString('en-IN')}
                                                </Typography>
                                            </Box>
                                            <Typography
                                                variant="body2"
                                                fontWeight={700}
                                                color={pm.paymentType === 'refund' ? 'error.main' : 'success.main'}
                                            >
                                                {pm.paymentType === 'refund' ? '-' : '+'}{formatCurrency(pm.amount)}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};

export default FeeStatement;
