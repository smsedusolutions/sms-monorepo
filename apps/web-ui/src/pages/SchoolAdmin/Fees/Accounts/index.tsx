// apps/web-ui/src/pages/SchoolAdmin/Fees/Accounts/index.tsx

import React, { useState, useCallback } from 'react';
import ConfirmationDialog from '../../../../components/Dialogs/ConfirmationDialog';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Grid,
    Chip,
    Stack,
    IconButton,
    TextField,
    Paper,
    Snackbar,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AcUnitIcon from '@mui/icons-material/AcUnit'; // Freeze
import WbSunnyIcon from '@mui/icons-material/WbSunny'; // Unfreeze
import ReceiptIcon from '@mui/icons-material/Receipt';
import SaveIcon from '@mui/icons-material/Save';
import TokenService from '../../../../queries/token/tokenService';
import {
    useGetFeeAssignments,
    useGetPaymentsByStudent,
    useFreezeAccount,
    useUnfreezeAccount,
    useUpdateAccountNotes
} from '../../../../queries/Fee';
import { AppTable } from '../../../../components/shared/AppTable';
import type { StudentFeeAccount } from '../../../../types/fee.types';
import { useIsMobile } from '../../../../hooks/useIsMobile';

const FeeAccounts: React.FC = () => {
    const isMobile = useIsMobile();
    const schoolId = TokenService.getSchoolId() || '';
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [selectedAccount, setSelectedAccount] = useState<StudentFeeAccount | null>(null);

    const { data: assignmentsData, isLoading } = useGetFeeAssignments(schoolId, { search: searchTerm, page, limit });
    const { data: paymentsData } = useGetPaymentsByStudent(schoolId, selectedAccount?.studentId || '');

    const freezeMutation = useFreezeAccount(schoolId, selectedAccount?.assignmentId || '');
    const unfreezeMutation = useUnfreezeAccount(schoolId, selectedAccount?.assignmentId || '');
    const notesMutation = useUpdateAccountNotes(schoolId, selectedAccount?.assignmentId || '');

    const [adminNotes, setAdminNotes] = useState('');
    const [openReceiptDialog, setOpenReceiptDialog] = useState<string | null>(null);

    // Confirmation dialog state
    const [confirm, setConfirm] = useState<{
        open: boolean;
        title: string;
        description: string;
        onConfirm: () => void;
    }>({ open: false, title: '', description: '', onConfirm: () => {} });

    const closeConfirm = useCallback(() => setConfirm(c => ({ ...c, open: false })), []);

    const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success'
    });

    const showToast = (message: string, severity: 'success' | 'error') => {
        setToast({ open: true, message, severity });
    };

    const handleFreeze = () => {
        setConfirm({
            open: true,
            title: 'Freeze Fee Ledger',
            description: 'Freeze this ledger? Active payments and edits will be locked until unfrozen.',
            onConfirm: () => {
                closeConfirm();
                freezeMutation.mutate(undefined, {
                    onSuccess: (res) => {
                        showToast('Fee ledger frozen successfully', 'success');
                        setSelectedAccount(res.data);
                    },
                    onError: (err: any) => showToast(err.message || 'Freeze failed', 'error')
                });
            }
        });
    };

    const handleUnfreeze = () => {
        unfreezeMutation.mutate(undefined, {
            onSuccess: (res) => {
                showToast('Fee ledger active state restored successfully', 'success');
                setSelectedAccount(res.data);
            },
            onError: (err: any) => showToast(err.message || 'Unfreeze failed', 'error')
        });
    };

    const handleSaveNotes = () => {
        if (!selectedAccount) return;
        notesMutation.mutate(
            { adminNotes },
            {
                onSuccess: (res) => {
                    showToast('Admin notes updated successfully', 'success');
                    setSelectedAccount(res.data);
                },
                onError: (err: any) => showToast(err.message || 'Notes update failed', 'error')
            }
        );
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
    };

    const assignments = assignmentsData?.data || [];
    const payments = paymentsData?.data || [];

    const listColumns = [
        {
            name: 'Student Name',
            selector: (row: StudentFeeAccount) => row.studentName,
            cell: (row: StudentFeeAccount) => (
                <Box>
                    <Typography variant="body2" fontWeight={600}>{row.studentName}</Typography>
                    <Typography variant="caption" color="text.secondary">Roll: {row.rollNumber || 'N/A'}</Typography>
                </Box>
            )
        },
        {
            name: 'Class',
            selector: (row: StudentFeeAccount) => row.className,
        },
        // {
        //     name: 'Structure Name',
        //     selector: (row: StudentFeeAccount) => row.feeStructureName,
        // },
        {
            name: 'Outstanding Balance',
            selector: (row: StudentFeeAccount) => row.totalBalance,
            cell: (row: StudentFeeAccount) => (
                <Typography variant="body2" fontWeight={700} color={row.totalBalance > 0 ? 'error.main' : 'success.main'}>
                    {formatCurrency(row.totalBalance)}
                </Typography>
            )
        },
        {
            name: 'Status',
            selector: (row: StudentFeeAccount) => row.accountStatus,
            cell: (row: StudentFeeAccount) => {
                const colorMap: Record<string, 'info' | 'success' | 'warning' | 'error' | 'default'> = {
                    active: 'info',
                    paid: 'success',
                    partially_paid: 'warning',
                    overdue: 'error',
                    frozen: 'default',
                    waived: 'default',
                    transferred_out: 'default',
                    transferred_in: 'default'
                };
                const statusColor = colorMap[row.accountStatus] || 'default';
                return <Chip label={row.accountStatus.toUpperCase()} color={statusColor} size="small" />;
            }
        },
        {
            name: 'Action',
            cell: (row: StudentFeeAccount) => (
                <Button variant="outlined" size="small" startIcon={<VisibilityIcon />} onClick={() => {
                    setSelectedAccount(row);
                    setAdminNotes(row.adminNotes || '');
                }}>
                    Ledger
                </Button>
            )
        }
    ];

    if (selectedAccount) {
        return (
            <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
                {/* Header detail view */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 3 }}>
                    <IconButton onClick={() => setSelectedAccount(null)} color="primary" sx={{ mt: 0.5 }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 1.5 }} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                            <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>{selectedAccount.studentName}</Typography>
                            <Chip label={selectedAccount.accountStatus.toUpperCase()} color={selectedAccount.accountStatus === 'paid' ? 'success' : selectedAccount.accountStatus === 'frozen' ? 'default' : 'warning'} size="small" />
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.78rem', sm: '0.875rem' }, mt: 0.5 }}>
                            AY: {selectedAccount.academicYear} | Class: {selectedAccount.className} {selectedAccount.sectionName ? `(${selectedAccount.sectionName})` : ''} | Roll: {selectedAccount.rollNumber || 'N/A'}
                        </Typography>
                    </Box>
                </Box>

                {/* Ledger summary cards grid */}
                <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
                        <Paper elevation={0} sx={{ p: 1.5, border: '1px solid #e2e8f0', borderRadius: 2.5, textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={500} noWrap display="block">Assigned Dues</Typography>
                            <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 0.5 }}>{formatCurrency(selectedAccount.totalOriginalFees)}</Typography>
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
                        <Paper elevation={0} sx={{ p: 1.5, border: '1px solid #e2e8f0', borderRadius: 2.5, textAlign: 'center', bgcolor: '#eff6ff' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={500} noWrap display="block">Discounts/Waivers</Typography>
                            <Typography variant="subtitle1" fontWeight={700} color="primary.main" sx={{ mt: 0.5 }}>{formatCurrency(selectedAccount.totalDiscount + selectedAccount.totalWaived)}</Typography>
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
                        <Paper elevation={0} sx={{ p: 1.5, border: '1px solid #e2e8f0', borderRadius: 2.5, textAlign: 'center', bgcolor: '#f0fdf4' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={500} noWrap display="block">Paid Amount</Typography>
                            <Typography variant="subtitle1" fontWeight={700} color="success.main" sx={{ mt: 0.5 }}>{formatCurrency(selectedAccount.totalPaid)}</Typography>
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
                        <Paper elevation={0} sx={{ p: 1.5, border: '1px solid #e2e8f0', borderRadius: 2.5, textAlign: 'center', bgcolor: '#fef2f2' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={500} noWrap display="block">Outstanding</Typography>
                            <Typography variant="subtitle1" fontWeight={700} color="error.main" sx={{ mt: 0.5 }}>{formatCurrency(selectedAccount.totalBalance)}</Typography>
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2.4 }}>
                        <Paper elevation={0} sx={{ p: 1.5, border: '1px solid #e2e8f0', borderRadius: 2.5, textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={500} noWrap display="block">Ledger Actions</Typography>
                            <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 0.5 }}>
                                {selectedAccount.accountStatus === 'frozen' ? (
                                    <IconButton size="small" color="success" onClick={handleUnfreeze}>
                                        <WbSunnyIcon fontSize="small" />
                                    </IconButton>
                                ) : (
                                    <IconButton size="small" color="warning" onClick={handleFreeze}>
                                        <AcUnitIcon fontSize="small" />
                                    </IconButton>
                                )}
                            </Stack>
                        </Paper>
                    </Grid>
                </Grid>

                {/* Detailed breakdowns */}
                <Grid container spacing={4} sx={{ mb: 4 }}>
                    <Grid size={{ xs: 12, lg: 8 }}>
                        <Card sx={{ borderRadius: 4, border: '1px solid #f1f5f9', boxShadow: 'none', mb: 4 }}>
                            <CardContent>
                                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Fee Items Running Ledger</Typography>
                                <AppTable
                                    columns={[
                                        { name: 'Category', selector: (row: any) => row.categoryName },
                                        { name: 'Assigned', selector: (row: any) => formatCurrency(row.originalAmount) },
                                        { name: 'Discounts', selector: (row: any) => formatCurrency(row.discountAmount) },
                                        { name: 'Paid', selector: (row: any) => formatCurrency(row.paidAmount) },
                                        { name: 'Remaining Dues', selector: (row: any) => formatCurrency(row.balanceAmount), cell: (row: any) => <Typography variant="body2" fontWeight={700} color={row.balanceAmount > 0 ? 'error.main' : 'success.main'}>{formatCurrency(row.balanceAmount)}</Typography> },
                                        { name: 'Due Date', selector: (row: any) => row.dueDate ? new Date(row.dueDate).toLocaleDateString() : 'N/A' },
                                        { name: 'Status', selector: (row: any) => row.status?.toUpperCase() }
                                    ]}
                                    data={selectedAccount.feeBreakdown}
                                />
                            </CardContent>
                        </Card>

                        {/* Expandable transaction history list */}
                        <Card sx={{ borderRadius: 4, border: '1px solid #f1f5f9', boxShadow: 'none' }}>
                            <CardContent>
                                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Transaction Logs Journal</Typography>
                                <AppTable
                                    columns={[
                                        { name: 'Txn ID', selector: (row: any) => row.transactionId },
                                        { name: 'Type', selector: (row: any) => row.paymentType?.toUpperCase() },
                                        { name: 'Date', selector: (row: any) => new Date(row.paymentDate || row.createdAt).toLocaleDateString() },
                                        { name: 'Mode', selector: (row: any) => row.paymentMode?.toUpperCase() || 'N/A' },
                                        { name: 'Amount', selector: (row: any) => formatCurrency(row.amount), cell: (row: any) => <Typography variant="body2" fontWeight={700} color={row.paymentType === 'payment' ? 'success.main' : 'error.main'}>{formatCurrency(row.amount)}</Typography> },
                                        { name: 'Receipt', cell: (row: any) => row.receiptId ? <IconButton size="small" onClick={() => setOpenReceiptDialog(row.receiptId)} color="primary"><ReceiptIcon fontSize="small" /></IconButton> : 'N/A' }
                                    ]}
                                    data={payments}
                                    emptyMessage="No financial ledger transactions posted for this year."
                                />
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Admin notes panel */}
                    <Grid size={{ xs: 12, lg: 4 }}>
                        <Card sx={{ borderRadius: 4, border: '1px solid #f1f5f9', boxShadow: 'none', mb: 4 }}>
                            <CardContent>
                                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Admin Notes & Alerts</Typography>
                                <TextField
                                    multiline
                                    rows={6}
                                    fullWidth
                                    placeholder="Write admin ledger specific notes, alerts, collection commitments..."
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    sx={{ mb: 2 }}
                                />
                                <Button variant="contained" fullWidth startIcon={<SaveIcon />} onClick={handleSaveNotes}>
                                    Save Notes
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Dialog to preview receipt */}
                <Dialog
                    open={!!openReceiptDialog}
                    onClose={() => setOpenReceiptDialog(null)}
                    fullWidth
                    maxWidth="xs"
                    fullScreen={isMobile}
                    PaperProps={{
                        sx: {
                            borderRadius: isMobile ? 0 : 3,
                        }
                    }}
                >
                    <DialogTitle fontWeight={700}>View Receipt</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2">
                            Receipt preview is available. You can print or download the PDF copy directly from the Receipts module.
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={() => setOpenReceiptDialog(null)}>Close</Button>
                        <Button variant="contained" onClick={() => window.open(`${import.meta.env.VITE_PAYMENT_API_URL || 'http://localhost:5005'}/api/school/${schoolId}/fees/receipts/${openReceiptDialog}/pdf`, '_blank')}>
                            Download PDF
                        </Button>
                    </DialogActions>
                </Dialog>

                <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast(t => ({ ...t, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                    <Alert severity={toast.severity}>{toast.message}</Alert>
                </Snackbar>

                <ConfirmationDialog
                    open={confirm.open}
                    title={confirm.title}
                    description={confirm.description}
                    variant="warning"
                    onClose={closeConfirm}
                    onConfirm={confirm.onConfirm}
                    isLoading={freezeMutation.isPending}
                />
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" fontWeight={700} color="text.primary" sx={{ fontSize: { xs: '1.4rem', sm: '2rem' } }}>
                    Student Ledgers
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    Access students comprehensive running academic year financial ledger sheets, balances, and action logs.
                </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
                <TextField
                    size="small"
                    placeholder="Search student ledger..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPage(1);
                    }}
                    sx={{ width: { xs: '100%', sm: 300 } }}
                />
            </Box>

            <AppTable
                columns={listColumns}
                data={assignments}
                isLoading={isLoading}
                emptyMessage="No assigned student running ledgers found."
                paginationServer={true}
                paginationTotalRows={assignmentsData?.pagination?.totalRecords || assignmentsData?.pagination?.total || 0}
                onChangePage={(newPage) => setPage(newPage)}
                onChangeRowsPerPage={(newLimit) => {
                    setLimit(newLimit);
                    setPage(1);
                }}
                paginationPerPage={limit}
            />
        </Box>
    );
};

export default FeeAccounts;
