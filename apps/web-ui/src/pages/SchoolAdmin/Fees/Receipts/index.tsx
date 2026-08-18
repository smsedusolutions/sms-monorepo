// apps/web-ui/src/pages/SchoolAdmin/Fees/Receipts/index.tsx

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    TextField,
    Chip,
    Stack,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider,
    List,
    ListItem,
    ListItemText,
    CircularProgress,
    Grid,
    Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ReceiptIcon from '@mui/icons-material/Receipt';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import TokenService from '../../../../queries/token/tokenService';
import {
    useGetFeeAssignments,
    useGetStudentReceipts,
    useGetReceiptById
} from '../../../../queries/Fee';
import { AppTable } from '../../../../components/shared/AppTable';
import type { StudentFeeAccount, FeeReceipt } from '../../../../types/fee.types';
import { useIsMobile } from '../../../../hooks/useIsMobile';

const Receipts: React.FC = () => {
    const isMobile = useIsMobile();
    const schoolId = TokenService.getSchoolId() || '';
    const [searchTerm, setSearchTerm] = useState('');
    const { data: assignmentsData, isLoading: isLoadingStudents } = useGetFeeAssignments(schoolId, { search: searchTerm });

    const [selectedStudent, setSelectedStudent] = useState<StudentFeeAccount | null>(null);
    const { data: receiptsData, isLoading: isLoadingReceipts } = useGetStudentReceipts(schoolId, selectedStudent?.studentId || '');

    const [activeReceiptId, setActiveReceiptId] = useState<string | null>(null);
    const { data: receiptDetailsData, isLoading: isLoadingDetails } = useGetReceiptById(schoolId, activeReceiptId || '');

    const [openDialog, setOpenDialog] = useState(false);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
    };

    const handleSelectStudent = (student: StudentFeeAccount) => {
        setSelectedStudent(student);
    };

    const handleOpenReceipt = (receiptId: string) => {
        setActiveReceiptId(receiptId);
        setOpenDialog(true);
    };

    const handleDownloadPDF = (receiptId: string) => {
        const url = `${import.meta.env.VITE_PAYMENT_API_URL || 'http://localhost:5005'}/api/school/${schoolId}/fees/receipts/${receiptId}/pdf`;
        window.open(url, '_blank');
    };

    const studentColumns = [
        {
            name: 'Student Name',
            selector: (row: StudentFeeAccount) => row.studentName,
            cell: (row: StudentFeeAccount) => (
                <Box>
                    <Typography variant="body2" fontWeight={600}>{row.studentName}</Typography>
                    <Typography variant="caption" color="text.secondary">Class: {row.className} | Roll: {row.rollNumber || 'N/A'}</Typography>
                </Box>
            )
        },
        {
            name: 'Academic Year',
            selector: (row: StudentFeeAccount) => row.academicYear
        },
        {
            name: 'View Receipts',
            cell: (row: StudentFeeAccount) => (
                <Button variant="outlined" size="small" startIcon={<ReceiptIcon />} onClick={() => handleSelectStudent(row)}>
                    Receipts List
                </Button>
            )
        }
    ];

    const receiptColumns = [
        {
            name: 'Receipt Number',
            selector: (row: FeeReceipt) => row.receiptNumber,
            cell: (row: FeeReceipt) => (
                <Typography variant="body2" fontWeight={600} color="primary">
                    {row.receiptNumber}
                </Typography>
            )
        },
        {
            name: 'Payment Date',
            selector: (row: FeeReceipt) => new Date(row.paymentDate).toLocaleDateString(),
        },
        {
            name: 'Paid Mode',
            selector: (row: FeeReceipt) => row.paymentMode?.toUpperCase()
        },
        {
            name: 'Amount Received',
            selector: (row: FeeReceipt) => row.totalAmountPaid,
            cell: (row: FeeReceipt) => (
                <Typography variant="body2" fontWeight={700} color="success.main">
                    {formatCurrency(row.totalAmountPaid)}
                </Typography>
            )
        },
        {
            name: 'Status',
            selector: (row: FeeReceipt) => row.isVoided,
            cell: (row: FeeReceipt) => (
                <Chip
                    label={row.isVoided ? 'VOIDED' : 'VALID'}
                    color={row.isVoided ? 'error' : 'success'}
                    size="small"
                />
            )
        },
        {
            name: 'Actions',
            cell: (row: FeeReceipt) => (
                <Stack direction="row" spacing={1}>
                    <IconButton size="small" color="primary" onClick={() => handleOpenReceipt(row.receiptId)}>
                        <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="info" onClick={() => handleDownloadPDF(row.receiptId)}>
                        <PrintIcon fontSize="small" />
                    </IconButton>
                </Stack>
            )
        }
    ];

    const receipt = receiptDetailsData?.data;

    return (
        <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" fontWeight={700} color="text.primary" sx={{ fontSize: { xs: '1.4rem', sm: '2rem' } }}>
                    Fee Receipts
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    Browse, print, and audit legal fee receipt files linked to student transactions.
                </Typography>
            </Box>

            {!selectedStudent ? (
                <Box>
                    <Box sx={{ mb: 2 }}>
                        <TextField
                            size="small"
                            placeholder="Search student name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{ startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} /> }}
                            sx={{ width: { xs: '100%', sm: 300 } }}
                        />
                    </Box>
                    <AppTable
                        columns={studentColumns}
                        data={assignmentsData?.data || []}
                        isLoading={isLoadingStudents}
                        emptyMessage="No search results matching."
                    />
                </Box>
            ) : (
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 3 }}>
                        <IconButton onClick={() => setSelectedStudent(null)} color="primary" sx={{ mt: 0.5 }}>
                            <ArrowBackIcon />
                        </IconButton>
                        <Box>
                            <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                                Receipts for: {selectedStudent.studentName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                                Class: {selectedStudent.className} | Roll: {selectedStudent.rollNumber || 'N/A'}
                            </Typography>
                        </Box>
                    </Box>

                    <AppTable
                        columns={receiptColumns}
                        data={receiptsData?.data || []}
                        isLoading={isLoadingReceipts}
                        emptyMessage="No receipts generated for this student yet."
                    />
                </Box>
            )}

            {/* Receipt Preview Dialog */}
            <Dialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                fullWidth
                maxWidth="sm"
                fullScreen={isMobile}
                PaperProps={{
                    sx: {
                        borderRadius: isMobile ? 0 : 3,
                        maxHeight: isMobile ? '100dvh' : '90vh',
                    }
                }}
            >
                <DialogTitle fontWeight={700} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Receipt Preview
                    <IconButton onClick={() => setOpenDialog(false)}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    {isLoadingDetails ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
                    ) : receipt ? (
                        <Stack spacing={2.5}>
                            {receipt.isVoided && (
                                <Alert severity="error" variant="filled" sx={{ fontWeight: 700 }}>
                                    VOIDED RECEIPT: REVERSED / REFUNDED ({receipt.voidReason || 'No reason specified'})
                                </Alert>
                            )}
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h6" fontWeight={700}>{receipt.school.schoolName}</Typography>
                                <Typography variant="body2" color="text.secondary">{receipt.school.schoolAddress}</Typography>
                            </Box>
                            <Divider />
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 6 }}>
                                    <Typography variant="caption" color="text.secondary">Receipt Number</Typography>
                                    <Typography variant="body2" fontWeight={600}>{receipt.receiptNumber}</Typography>
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <Typography variant="caption" color="text.secondary">Payment Date</Typography>
                                    <Typography variant="body2" fontWeight={600}>{new Date(receipt.paymentDate).toLocaleDateString()}</Typography>
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <Typography variant="caption" color="text.secondary">Student Name</Typography>
                                    <Typography variant="body2" fontWeight={600}>{receipt.student.studentName}</Typography>
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <Typography variant="caption" color="text.secondary">Payment Mode</Typography>
                                    <Typography variant="body2" fontWeight={600}>{receipt.paymentMode?.toUpperCase()}</Typography>
                                </Grid>
                            </Grid>
                            <Divider />
                            <Typography variant="subtitle2" fontWeight={700}>Line Breakdowns</Typography>
                            <List disablePadding>
                                {receipt.lineItems.map((item, idx) => (
                                    <ListItem key={idx} sx={{ px: 0, py: 0.5 }}>
                                        <ListItemText primary={item.description} />
                                        <Typography variant="body2" fontWeight={600}>{formatCurrency(item.lineTotal)}</Typography>
                                    </ListItem>
                                ))}
                            </List>
                            <Divider />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" fontWeight={700}>Total Collected Amount</Typography>
                                <Typography variant="h6" fontWeight={800} color="success.main">{formatCurrency(receipt.totalAmountPaid)}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2">Outstanding Remaining Dues</Typography>
                                <Typography variant="body2" fontWeight={700} color="error.main">{formatCurrency(receipt.balanceRemaining)}</Typography>
                            </Box>
                        </Stack>
                    ) : (
                        <Typography color="text.secondary">Failed to load details.</Typography>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    {receipt && (
                        <Button variant="contained" startIcon={<PrintIcon />} onClick={() => handleDownloadPDF(receipt.receiptId)}>
                            Print / Open PDF
                        </Button>
                    )}
                    <Button onClick={() => setOpenDialog(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Receipts;
