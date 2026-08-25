// apps/web-ui/src/pages/SchoolAdmin/Fees/PaymentCollection/index.tsx

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Grid,
    TextField,
    MenuItem,
    Checkbox,
    FormControlLabel,
    Stack,
    Divider,
    Snackbar,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReceiptIcon from '@mui/icons-material/Receipt';
import TokenService from '../../../../queries/token/tokenService';
import { useGetFeeAssignments, useRecordPayment } from '../../../../queries/Fee';
import { AppTable } from '../../../../components/shared/AppTable';
import { AppDatePicker } from '../../../../components/shared/AppDatePicker';
import { format, isValid } from 'date-fns';
import type { StudentFeeAccount } from '../../../../types/fee.types';
import { useIsMobile } from '../../../../hooks/useIsMobile';

const CollectPayment: React.FC = () => {
    const isMobile = useIsMobile();
    const schoolId = TokenService.getSchoolId() || '';
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [selectedStudent, setSelectedStudent] = useState<StudentFeeAccount | null>(null);

    // Collect configurations state
    const [selectedItems, setSelectedItems] = useState<Record<string, { selected: boolean; payAmount: number; lateFee: number }>>({});
    const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'card' | 'cheque' | 'bank_transfer'>('cash');
    const [referenceNumber, setReferenceNumber] = useState('');
    const [collectedBy, setCollectedBy] = useState('School Accounts Office');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

    // Success dialog
    const [successReceipt, setSuccessReceipt] = useState<string | null>(null);
    const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success'
    });

    const { data: studentsData, isLoading: isLoadingStudents } = useGetFeeAssignments(schoolId, { search: searchQuery, page, limit });
    const collectPaymentMutation = useRecordPayment(schoolId);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
    };

    const handleSelectStudent = (student: StudentFeeAccount) => {
        setSelectedStudent(student);
        // Pre-initialize selected checks
        const items: Record<string, { selected: boolean; payAmount: number; lateFee: number }> = {};
        student.feeBreakdown.forEach(item => {
            if (item.balanceAmount > 0) {
                items[item.feeCategoryId] = {
                    selected: true,
                    payAmount: item.balanceAmount,
                    lateFee: 0
                };
            }
        });
        setSelectedItems(items);
    };

    const handleCheckboxChange = (categoryId: string, checked: boolean) => {
        setSelectedItems(prev => ({
            ...prev,
            [categoryId]: {
                ...prev[categoryId],
                selected: checked
            }
        }));
    };

    const handlePayAmountChange = (categoryId: string, amount: number) => {
        setSelectedItems(prev => ({
            ...prev,
            [categoryId]: {
                ...prev[categoryId],
                payAmount: amount
            }
        }));
    };

    const handleLateFeeChange = (categoryId: string, amount: number) => {
        setSelectedItems(prev => ({
            ...prev,
            [categoryId]: {
                ...prev[categoryId],
                lateFee: amount
            }
        }));
    };

    const handleCollectPaymentSubmit = () => {
        if (!selectedStudent) return;
        const lineItems = Object.entries(selectedItems)
            .filter(([_, value]) => value.selected && value.payAmount > 0)
            .map(([categoryId, value]) => ({
                feeCategoryId: categoryId,
                amountPaid: value.payAmount,
                lateFeePaid: value.lateFee
            }));

        if (lineItems.length === 0) {
            setToast({ open: true, message: 'Please select at least one fee category with a paying amount greater than 0.', severity: 'error' });
            return;
        }

        const body = {
            paymentMode,
            referenceNumber: referenceNumber || undefined,
            collectedBy,
            paymentDate,
            items: lineItems,
            studentId: selectedStudent.studentId
        };

        collectPaymentMutation.mutate(body, {
            onSuccess: (res: any) => {
                setSuccessReceipt(res.data.receiptNumber);
                setToast({ open: true, message: 'Payment recorded and ledger reconciled successfully!', severity: 'success' });
            },
            onError: (err: any) => {
                setToast({ open: true, message: err.message || 'Failed to capture payment', severity: 'error' });
            }
        });
    };

    const handleDownloadReceipt = () => {
        if (!successReceipt) return;
        // In actual system redirect to print preview or stream bytes
        const url = `${import.meta.env.VITE_PAYMENT_API_URL || 'http://localhost:5005'}/api/school/${schoolId}/fees/receipts/${successReceipt}/pdf`;
        window.open(url, '_blank');
    };

    const students = studentsData?.data || [];

    // Calculations
    const selectedEntries = Object.values(selectedItems).filter(item => item.selected);
    const totalFeesToPay = selectedEntries.reduce((sum, item) => sum + item.payAmount, 0);
    const totalLateFeesToPay = selectedEntries.reduce((sum, item) => sum + item.lateFee, 0);
    const netGrandTotal = totalFeesToPay + totalLateFeesToPay;

    if (selectedStudent) {
        return (
            <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h4" fontWeight={700} color="text.primary" sx={{ fontSize: { xs: '1.4rem', sm: '2rem' } }}>Collect Student Fees</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Enter collections parameters, partial splits, checks, late overrides.</Typography>
                </Box>

                <Card sx={{ borderRadius: 2, border: '1px solid #f2f5f9', p: { xs: 1.5, sm: 3 }, boxShadow: 'none', bgcolor: '#fff', mb: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, mb: 3, gap: 1.5 }}>
                        <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                            Collecting Fees for: <span style={{ color: '#3b82f6' }}>{selectedStudent.studentName}</span> ({selectedStudent.className})
                        </Typography>
                        <Button variant="outlined" size="small" startIcon={<CloseIcon />} onClick={() => setSelectedStudent(null)} fullWidth={isMobile}>
                            Change Student
                        </Button>
                    </Box>

                    <Grid container spacing={3}>
                        {/* Selected line items list */}
                        <Grid size={{ xs: 12, lg: 8 }}>
                            <Card sx={{ borderRadius: 2, border: '1px solid #f1f5f9', boxShadow: 'none', mb: 3 }}>
                                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Select Fee Categories to Collect</Typography>
                                    <Stack spacing={2}>
                                        {selectedStudent.feeBreakdown.filter(i => i.balanceAmount > 0).map(item => {
                                            const selection = selectedItems[item.feeCategoryId] || { selected: false, payAmount: item.balanceAmount, lateFee: 0 };
                                            return (
                                                <Box key={item.feeCategoryId} sx={{ p: 1.5, border: '1px solid #f1f5f9', borderRadius: 2, bgcolor: '#fafafa' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: selection.selected ? 1.5 : 0 }}>
                                                        <FormControlLabel
                                                            control={<Checkbox checked={selection.selected} onChange={(e) => handleCheckboxChange(item.feeCategoryId, e.target.checked)} />}
                                                            label={
                                                                <Box>
                                                                    <Typography variant="body2" fontWeight={600}>{item.categoryName}</Typography>
                                                                    <Typography variant="caption" color="text.secondary">Dues: {formatCurrency(item.balanceAmount)}</Typography>
                                                                </Box>
                                                            }
                                                        />
                                                    </Box>
                                                    {selection.selected && (
                                                        <Grid container spacing={1.5}>
                                                            <Grid size={{ xs: 6, sm: 6 }}>
                                                                <TextField
                                                                    type="number"
                                                                    size="small"
                                                                    label="Paying (₹)"
                                                                    fullWidth
                                                                    value={selection.payAmount}
                                                                    onChange={(e) => handlePayAmountChange(item.feeCategoryId, Number(e.target.value))}
                                                                />
                                                            </Grid>
                                                            <Grid size={{ xs: 6, sm: 6 }}>
                                                                <TextField
                                                                    type="number"
                                                                    size="small"
                                                                    label="Late Fee (₹)"
                                                                    fullWidth
                                                                    value={selection.lateFee}
                                                                    onChange={(e) => handleLateFeeChange(item.feeCategoryId, Number(e.target.value))}
                                                                />
                                                            </Grid>
                                                        </Grid>
                                                    )}
                                                </Box>
                                            );
                                        })}
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Payment mode configurations and totals */}
                        <Grid size={{ xs: 12, lg: 4 }}>
                            <Card sx={{ borderRadius: 4, border: '1px solid #f1f5f9', boxShadow: 'none', mb: 3 }}>
                                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                    <Typography variant="subtitle1" fontWeight={700}>Payment Summary</Typography>
                                    <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2" color="text.secondary">Fee Total</Typography>
                                            <Typography variant="body2" fontWeight={600}>{formatCurrency(totalFeesToPay)}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2" color="text.secondary">Late Fee Total</Typography>
                                            <Typography variant="body2" fontWeight={600}>{formatCurrency(totalLateFeesToPay)}</Typography>
                                        </Box>
                                        <Divider sx={{ my: 1.5 }} />
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2" fontWeight={700}>Grand Net Total</Typography>
                                            <Typography variant="body2" fontWeight={700} color="primary.main">{formatCurrency(netGrandTotal)}</Typography>
                                        </Box>
                                    </Box>

                                    <TextField
                                        select
                                        size="small"
                                        label="Payment Method"
                                        value={paymentMode}
                                        onChange={(e) => setPaymentMode(e.target.value as any)}
                                        fullWidth
                                    >
                                        <MenuItem value="cash">Cash Payment</MenuItem>
                                        <MenuItem value="upi">UPI/QR Code scan</MenuItem>
                                        <MenuItem value="card">POS Terminal Card</MenuItem>
                                        <MenuItem value="cheque">Bank Cheque</MenuItem>
                                        <MenuItem value="bank_transfer">Direct Bank Transfer</MenuItem>
                                    </TextField>

                                    <AppDatePicker
                                        label="Payment Date"
                                        value={paymentDate ? new Date(paymentDate) : null}
                                        onChange={(date: Date | null) => setPaymentDate(date && isValid(date) ? format(date, 'yyyy-MM-dd') : '')}
                                        disableMargin
                                        fullWidth
                                    />

                                    {paymentMode !== 'cash' && (
                                        <TextField
                                            size="small"
                                            label="Ref/Cheque/TXN Number"
                                            value={referenceNumber}
                                            onChange={(e) => setReferenceNumber(e.target.value)}
                                            fullWidth
                                        />
                                    )}

                                    <TextField
                                        size="small"
                                        label="Collected By Personnel"
                                        value={collectedBy}
                                        onChange={(e) => setCollectedBy(e.target.value)}
                                        fullWidth
                                    />

                                    <Button
                                        variant="contained"
                                        color="primary"
                                        fullWidth
                                        disabled={netGrandTotal <= 0 || collectPaymentMutation.isPending}
                                        onClick={handleCollectPaymentSubmit}
                                        sx={{ py: 1.5, borderRadius: 2 }}
                                    >
                                        {collectPaymentMutation.isPending ? 'Processing...' : 'Submit Collection Ledger'}
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Card>

                {/* Success Modal */}
                <Dialog open={!!successReceipt} onClose={() => setSuccessReceipt(null)} maxWidth="xs" fullWidth>
                    <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
                        <CheckCircleIcon color="success" sx={{ fontSize: 64, mb: 1 }} />
                        <Typography variant="h5" fontWeight={700}>Payment Confirmed!</Typography>
                    </DialogTitle>
                    <DialogContent sx={{ textAlign: 'center', pb: 4 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Receipt Number <strong style={{ color: '#1e293b' }}>{successReceipt}</strong> was recorded successfully.
                        </Typography>
                        <Stack spacing={2}>
                            <Button variant="contained" color="success" startIcon={<ReceiptIcon />} onClick={handleDownloadReceipt} fullWidth>
                                Download Official Receipt (PDF)
                            </Button>
                            <Button variant="outlined" onClick={() => { setSuccessReceipt(null); setSelectedStudent(null); }} fullWidth>
                                Settle Another Ledger
                            </Button>
                        </Stack>
                    </DialogContent>
                </Dialog>

                <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast(t => ({ ...t, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                    <Alert severity={toast.severity}>{toast.message}</Alert>
                </Snackbar>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" fontWeight={700} color="text.primary" sx={{ fontSize: { xs: '1.4rem', sm: '2rem' } }}>Payment Collection Counter</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Search and select a student profile to record physical and digital payments.</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
                <TextField
                    size="small"
                    placeholder="Search by student name or roll number..."
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setPage(1);
                    }}
                    sx={{ width: { xs: '100%', sm: 320 } }}
                />
            </Box>

            <AppTable
                columns={[
                    { name: 'Student Name', selector: (row: StudentFeeAccount) => row.studentName, cell: (row: StudentFeeAccount) => <Typography variant="body2" fontWeight={600}>{row.studentName}</Typography> },
                    { name: 'Class', selector: (row: StudentFeeAccount) => row.className },
                    { name: 'Net Dues Balance', selector: (row: StudentFeeAccount) => row.totalBalance, cell: (row: StudentFeeAccount) => <Typography variant="body2" fontWeight={700} color={row.totalBalance > 0 ? 'error.main' : 'success.main'}>{formatCurrency(row.totalBalance)}</Typography> },
                    {
                        name: 'Action',
                        cell: (row: StudentFeeAccount) => (
                            <Button variant="contained" size="small" disabled={row.totalBalance <= 0} onClick={() => handleSelectStudent(row)}>
                                Collect Payment
                            </Button>
                        )
                    }
                ]}
                data={students}
                isLoading={isLoadingStudents}
                emptyMessage="No student fee accounts found."
                paginationServer={true}
                paginationTotalRows={studentsData?.pagination?.totalRecords || studentsData?.pagination?.total || 0}
                onChangePage={(newPage) => setPage(newPage)}
                onChangeRowsPerPage={(newLimit) => {
                    setLimit(newLimit);
                    setPage(1);
                }}
                paginationPerPage={limit}
            />

            <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast(t => ({ ...t, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity={toast.severity}>{toast.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default CollectPayment;
