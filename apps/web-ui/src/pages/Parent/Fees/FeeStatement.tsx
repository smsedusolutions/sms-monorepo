import React from 'react';
import {
    Box, Typography, Paper, Grid, Button, Chip, Alert, Skeleton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import {
    ReceiptLong as StatementIcon,
    Download as DownloadIcon,
    CheckCircle as PaidIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import useApi from '../../../queries/useApi';
import TokenService from '../../../queries/token/tokenService';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { MobileCardItem, MobileCardList } from '../../../components/mobile';

interface FeeRecord {
    id?: string;
    feeType: string;
    dueDate: string;
    amount: number;
    paidAmount: number;
    status: 'paid' | 'partial' | 'pending' | 'overdue';
    paymentDate?: string;
    receiptNumber?: string;
}

const statusConfig: Record<string, { label: string; color: 'success' | 'warning' | 'error' | 'default' }> = {
    paid: { label: 'Paid', color: 'success' },
    partial: { label: 'Partially Paid', color: 'warning' },
    pending: { label: 'Pending', color: 'error' },
    overdue: { label: 'Overdue', color: 'error' },
};

export const FeeStatement: React.FC = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const studentId = TokenService.getUserId() || '';
    const isMobile = useIsMobile();

    const { data, isLoading, error } = useQuery({
        queryKey: ['parent-fee-statement', schoolId, studentId],
        queryFn: () => useApi<any>('GET', `/api/school/${schoolId}/fees/assignments/student/${studentId}`),
        enabled: !!schoolId && !!studentId,
    });

    const statement = data?.data || {};
    const records: FeeRecord[] = statement.records || [];
    const summary = statement.summary || {
        totalFees: 0,
        totalPaid: 0,
        totalOutstanding: 0,
    };

    const handlePrint = () => {
        window.print();
    };

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
                            Detailed summary of all assigned fee structures, payments, and dues
                        </Typography>
                    </Box>
                </Box>
                <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handlePrint} size={isMobile ? 'small' : 'medium'}>
                    Download / Print Statement
                </Button>
            </Box>

            {/* Summary KPI Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', textAlign: 'center', bgcolor: 'grey.50' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>TOTAL APPLICABLE FEES</Typography>
                        <Typography fontWeight={800} sx={{ fontSize: '1.6rem', mt: 0.5, color: 'text.primary' }}>
                            ₹{(summary.totalFees || 0).toLocaleString('en-IN')}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', textAlign: 'center', bgcolor: '#f0fdf4' }}>
                        <Typography variant="caption" color="success.main" fontWeight={600}>TOTAL PAID</Typography>
                        <Typography fontWeight={800} sx={{ fontSize: '1.6rem', mt: 0.5, color: 'success.main' }}>
                            ₹{(summary.totalPaid || 0).toLocaleString('en-IN')}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', textAlign: 'center', bgcolor: '#fef2f2' }}>
                        <Typography variant="caption" color="error.main" fontWeight={600}>OUTSTANDING BALANCE</Typography>
                        <Typography fontWeight={800} sx={{ fontSize: '1.6rem', mt: 0.5, color: 'error.main' }}>
                            ₹{(summary.totalOutstanding || 0).toLocaleString('en-IN')}
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {isLoading ? (
                <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
            ) : error ? (
                <Alert severity="error">Failed to load fee statement.</Alert>
            ) : records.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <PaidIcon sx={{ fontSize: 56, color: 'success.main', mb: 1, opacity: 0.5 }} />
                    <Typography fontWeight={700} color="success.main">All dues are fully settled!</Typography>
                    <Typography variant="body2" color="text.secondary">No outstanding or pending fee line items found.</Typography>
                </Box>
            ) : isMobile ? (
                <MobileCardList isLoading={false} totalCount={records.length} itemCount={records.length} emptyTitle="" emptyMessage="">
                    {records.map((r, idx) => {
                        const cfg = statusConfig[r.status] || statusConfig.pending;
                        return (
                            <MobileCardItem
                                key={r.id || idx}
                                title={r.feeType}
                                subtitle={`Due: ${new Date(r.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                                badge={<Chip label={cfg.label} color={cfg.color} size="small" />}
                                metaItems={[
                                    { label: 'Amount', value: `₹${(r.amount || 0).toLocaleString('en-IN')}` },
                                    { label: 'Paid', value: `₹${(r.paidAmount || 0).toLocaleString('en-IN')}` },
                                    ...(r.receiptNumber ? [{ label: 'Receipt #', value: r.receiptNumber }] : []),
                                ]}
                            />
                        );
                    })}
                </MobileCardList>
            ) : (
                <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'grey.50' }}>
                                    <TableCell sx={{ fontWeight: 700 }}>Fee Line Item</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Due Date</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>Total (₹)</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>Paid (₹)</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>Balance (₹)</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 700 }}>Receipt #</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {records.map((r, idx) => {
                                    const cfg = statusConfig[r.status] || statusConfig.pending;
                                    const balance = (r.amount || 0) - (r.paidAmount || 0);
                                    return (
                                        <TableRow key={r.id || idx} hover>
                                            <TableCell>
                                                <Typography fontWeight={600} variant="body2">{r.feeType}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary">
                                                    {new Date(r.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" fontWeight={600}>
                                                    ₹{(r.amount || 0).toLocaleString('en-IN')}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" color="success.main" fontWeight={600}>
                                                    ₹{(r.paidAmount || 0).toLocaleString('en-IN')}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" color={balance > 0 ? 'error.main' : 'text.secondary'} fontWeight={700}>
                                                    ₹{balance.toLocaleString('en-IN')}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip label={cfg.label} color={cfg.color} size="small" />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Typography variant="caption" color="text.secondary">
                                                    {r.receiptNumber || '—'}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}
        </Box>
    );
};

export default FeeStatement;
