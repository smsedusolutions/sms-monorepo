// apps/web-ui/src/pages/SchoolAdmin/Fees/Assignments/index.tsx

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Chip,
    Stack,
    Grid,
    Drawer,
    IconButton,
    Snackbar,
    Alert,
    FormControl,
    InputLabel,
    Select,
    Checkbox,
    Divider
} from '@mui/material';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { Link } from 'react-router-dom';
import TokenService from '../../../../queries/token/tokenService';
import {
    useGetFeeAssignments,
    useGetFeeStructures,
    useAssignFeeStructure,
    useGetDiscounts,
    useApplyDiscountToStudent,
    useCreateAdjustment
} from '../../../../queries/Fee';
import { useGetClasses } from '../../../../queries/Class';
import { AppTable } from '../../../../components/shared/AppTable';
import { useIsMobile } from '../../../../hooks/useIsMobile';
import type { StudentFeeAccount } from '../../../../types/fee.types';

// Dynamic class options will be mapped from useGetClasses

const ADJUSTMENT_TYPES = [
    { value: 'charge', label: 'Additional Charge' },
    { value: 'discount', label: 'Discount/Scholarship' },
    { value: 'waiver', label: 'Manual Fee Waiver' },
    { value: 'refund', label: 'Reconciliation Refund' }
];

const FeeAssignments: React.FC = () => {
    const isMobile = useIsMobile();
    const schoolId = TokenService.getSchoolId() || '';

    // Filters
    const [academicYear, setAcademicYear] = useState('2026-2027');
    const [classId, setClassId] = useState('');
    const [status, setStatus] = useState('');
    const [search, setSearch] = useState('');

    // Assignments modal state
    const [openAssignModal, setOpenAssignModal] = useState(false);
    const [assignTargetClass, setAssignTargetClass] = useState('class-6');
    const [assignTargetStructureId, setAssignTargetStructureId] = useState('');

    // Discounts modal state
    const [openDiscountModal, setOpenDiscountModal] = useState(false);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [selectedDiscountId, setSelectedDiscountId] = useState('');

    // Manual Adjustments state
    const [openAdjustmentModal, setOpenAdjustmentModal] = useState(false);
    const [adjustStudentId, setAdjustStudentId] = useState('');
    const [adjustCategoryId, setAdjustCategoryId] = useState('');
    const [adjustmentType, setAdjustmentType] = useState('charge');
    const [adjustAmount, setAdjustAmount] = useState(100);
    const [adjustReason, setAdjustReason] = useState('Transport adjustment');

    // Details Drawer
    const [activeDrawerAccount, setActiveDrawerAccount] = useState<StudentFeeAccount | null>(null);

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success'
    });

    const showToast = (message: string, severity: 'success' | 'error') => {
        setToast({ open: true, message, severity });
    };

    // Queries & Mutations
    const { data: assignmentsData, isLoading } = useGetFeeAssignments(schoolId, { academicYear, classId, status, search, page, limit });
    const { data: structuresData } = useGetFeeStructures(schoolId);
    const { data: discountsData } = useGetDiscounts(schoolId);
    const { data: classesData } = useGetClasses(schoolId);

    const CLASS_OPTIONS = (classesData?.data || []).map((c: any) => ({
        value: c.classId,
        label: c.name
    }));

    const assignMutation = useAssignFeeStructure(schoolId, assignTargetStructureId);
    const applyDiscountMutation = useApplyDiscountToStudent(schoolId);
    const adjustMutation = useCreateAdjustment(schoolId);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
    };

    const handleAssignSubmit = () => {
        if (!assignTargetStructureId) {
            showToast('Please select a fee structure template to assign', 'error');
            return;
        }

        assignMutation.mutate(
            {
                className: assignTargetClass,
                feeStructureId: assignTargetStructureId,
                academicYear
            },
            {
                onSuccess: () => {
                    showToast('Fee structure assigned successfully to all class students!', 'success');
                    setOpenAssignModal(false);
                },
                onError: (err: any) => showToast(err.message || 'Structure assignment failed', 'error')
            }
        );
    };

    const handleApplyDiscountSubmit = () => {
        if (selectedStudentIds.length === 0) {
            showToast('Please select at least one student from the table checklist', 'error');
            return;
        }
        if (!selectedDiscountId) {
            showToast('Please select a discount or scholarship template to apply', 'error');
            return;
        }

        let completedCount = 0;
        selectedStudentIds.forEach(studentId => {
            applyDiscountMutation.mutate(
                {
                    studentId,
                    discountId: selectedDiscountId
                },
                {
                    onSuccess: () => {
                        completedCount++;
                        if (completedCount === selectedStudentIds.length) {
                            showToast('Discounts applied successfully to all selected students!', 'success');
                            setOpenDiscountModal(false);
                            setSelectedStudentIds([]);
                        }
                    },
                    onError: (err: any) => showToast(`Failed for one of the student: ${err.message || 'Error'}`, 'error')
                }
            );
        });
    };

    const handleApplyAdjustmentSubmit = () => {
        if (!adjustCategoryId) {
            showToast('Please select a fee category line to adjust', 'error');
            return;
        }

        adjustMutation.mutate(
            {
                studentId: adjustStudentId,
                feeCategoryId: adjustCategoryId,
                adjustmentType: adjustmentType as any,
                amount: Number(adjustAmount),
                notes: adjustReason
            },
            {
                onSuccess: () => {
                    showToast('Manual adjustment recorded and ledger updated!', 'success');
                    setOpenAdjustmentModal(false);
                },
                onError: (err: any) => showToast(err.message || 'Adjustment failed', 'error')
            }
        );
    };

    const listColumns = [
        {
            name: 'Select',
            cell: (row: StudentFeeAccount) => (
                <Checkbox
                    checked={selectedStudentIds.includes(row.studentId)}
                    onChange={(e) => {
                        if (e.target.checked) {
                            setSelectedStudentIds(prev => [...prev, row.studentId]);
                        } else {
                            setSelectedStudentIds(prev => prev.filter(id => id !== row.studentId));
                        }
                    }}
                />
            )
        },
        {
            name: 'Student Name',
            selector: (row: StudentFeeAccount) => row.studentName,
            cell: (row: StudentFeeAccount) => (
                <Box>
                    <Typography variant="body2" fontWeight={600}>{row.studentName}</Typography>
                    <Typography variant="caption" color="text.secondary">Roll Number: {row.rollNumber || 'N/A'}</Typography>
                </Box>
            )
        },
        {
            name: 'Class',
            selector: (row: StudentFeeAccount) => row.className,
        },
        // {
        //     name: 'Structure Assigned',
        //     selector: (row: StudentFeeAccount) => row.feeStructureName || 'Unassigned',
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
            name: 'View',
            cell: (row: StudentFeeAccount) => (
                <IconButton size="small" color="primary" onClick={() => setActiveDrawerAccount(row)}>
                    <VisibilityIcon fontSize="small" />
                </IconButton>
            )
        }
    ];

    const assignments = assignmentsData?.data || [];
    const structures = structuresData?.data || [];
    const discounts = discountsData?.data || [];

    return (
        <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
            {/* Header & Actions */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, mb: { xs: 2.5, sm: 3.5 }, gap: 2 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, fontSize: { xs: '1.3rem', sm: '1.6rem', md: '1.85rem' }, color: '#0f172a' }}>
                        Student Fee Assignments
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: { xs: '0.82rem', sm: '0.875rem' } }}>
                        Map structure templates to students, configure waivers, and adjust ledger line balances.
                    </Typography>
                </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 1.5 }} sx={{ width: { xs: '100%', md: 'auto' } }}>
                    <Button
                        variant="outlined"
                        color="secondary"
                        component={Link}
                        to="/school-admin/fees/discounts"
                        startIcon={<LocalOfferIcon />}
                        fullWidth={isMobile}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, py: { xs: 1, sm: 0.75 } }}
                    >
                        Discount Templates
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<AssignmentTurnedInIcon />}
                        onClick={() => setOpenAssignModal(true)}
                        fullWidth={isMobile}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, py: { xs: 1, sm: 0.75 } }}
                    >
                        Assign Class Structure
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddCircleIcon />}
                        onClick={() => setOpenDiscountModal(true)}
                        disabled={selectedStudentIds.length === 0}
                        fullWidth={isMobile}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, py: { xs: 1, sm: 0.75 } }}
                    >
                        Apply Discount ({selectedStudentIds.length})
                    </Button>
                </Stack>
            </Box>

            {/* Filter Section */}
            <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none', mb: { xs: 2, sm: 3 } }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                    <Grid container spacing={1.5} alignItems="center">
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Academic Year</InputLabel>
                                <Select value={academicYear} label="Academic Year" onChange={(e) => {
                                    setAcademicYear(e.target.value);
                                    setPage(1);
                                }}>
                                    <MenuItem value="2026-2027">2026-2027</MenuItem>
                                    <MenuItem value="2027-2028">2027-2028</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Class</InputLabel>
                                <Select value={classId} label="Class" onChange={(e) => {
                                    setClassId(e.target.value);
                                    setPage(1);
                                }}>
                                    <MenuItem value="">All Classes</MenuItem>
                                    {CLASS_OPTIONS.map(c => (
                                        <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Ledger Status</InputLabel>
                                <Select value={status} label="Ledger Status" onChange={(e) => {
                                    setStatus(e.target.value);
                                    setPage(1);
                                }}>
                                    <MenuItem value="">All Statuses</MenuItem>
                                    <MenuItem value="active">Active Dues</MenuItem>
                                    <MenuItem value="paid">Fully Paid</MenuItem>
                                    <MenuItem value="partially_paid">Partially Paid</MenuItem>
                                    <MenuItem value="overdue">Overdue Dues</MenuItem>
                                    <MenuItem value="frozen">Frozen</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Search Student..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Table / Mobile Cards */}
            <Box sx={{ width: '100%' }}>
                <AppTable
                    columns={listColumns}
                    data={assignments}
                    isLoading={isLoading}
                    emptyMessage="No assigned student structures found."
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

            {/* Drawer for Student Ledger Breakdowns */}
            <Drawer
                anchor={isMobile ? 'bottom' : 'right'}
                open={!!activeDrawerAccount}
                onClose={() => setActiveDrawerAccount(null)}
                PaperProps={{
                    sx: {
                        width: { xs: '100%', sm: 480 },
                        maxHeight: { xs: '90dvh', sm: '100vh' },
                        borderTopLeftRadius: { xs: 16, sm: 0 },
                        borderTopRightRadius: { xs: 16, sm: 0 },
                    }
                }}
            >
                <Box sx={{ p: { xs: 2, sm: 3 }, overflowY: 'auto' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                        <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                            Student Fee Summary
                        </Typography>
                        <IconButton onClick={() => setActiveDrawerAccount(null)} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    {activeDrawerAccount && (
                        <Stack spacing={2.5}>
                            <Card sx={{ bgcolor: '#eff6ff', border: '1px solid #dbeafe', boxShadow: 'none', borderRadius: 3 }}>
                                <CardContent sx={{ p: 2 }}>
                                    <Typography variant="subtitle1" fontWeight={700} color="#1e3a8a">{activeDrawerAccount.studentName}</Typography>
                                    <Typography variant="body2" color="text.secondary">Class: {activeDrawerAccount.className}</Typography>
                                    <Typography variant="body2" color="text.secondary">Structure: {activeDrawerAccount.feeStructureName}</Typography>
                                    <Divider sx={{ my: 1.5 }} />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">Net Assigned Fees</Typography>
                                        <Typography variant="body2" fontWeight={700}>{formatCurrency(activeDrawerAccount.netFees)}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">Total Paid to Date</Typography>
                                        <Typography variant="body2" fontWeight={700} color="success.main">{formatCurrency(activeDrawerAccount.totalPaid)}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                                        <Typography variant="body2" fontWeight={600}>Outstanding Balance</Typography>
                                        <Typography variant="body2" fontWeight={700} color="error.main">{formatCurrency(activeDrawerAccount.totalBalance)}</Typography>
                                    </Box>
                                </CardContent>
                            </Card>

                            <Typography variant="subtitle2" fontWeight={700}>Line Breakdowns</Typography>
                            <AppTable
                                columns={[
                                    { name: 'Category', selector: (row: any) => row.categoryName },
                                    { name: 'Assigned', selector: (row: any) => formatCurrency(row.originalAmount) },
                                    { name: 'Balance', selector: (row: any) => formatCurrency(row.balanceAmount), cell: (row: any) => <Typography variant="body2" fontWeight={700} color={row.balanceAmount > 0 ? 'error.main' : 'success.main'}>{formatCurrency(row.balanceAmount)}</Typography> }
                                ]}
                                data={activeDrawerAccount.feeBreakdown}
                            />

                            <Button
                                variant="contained"
                                startIcon={<AddCircleIcon />}
                                fullWidth
                                sx={{ py: 1, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                                onClick={() => {
                                    setAdjustStudentId(activeDrawerAccount.studentId);
                                    setAdjustCategoryId(activeDrawerAccount.feeBreakdown[0]?.feeCategoryId || '');
                                    setOpenAdjustmentModal(true);
                                }}
                            >
                                Apply Adjustment / Waiver
                            </Button>
                        </Stack>
                    )}
                </Box>
            </Drawer>

            {/* Assign Structure Modal */}
            <Dialog
                open={openAssignModal}
                onClose={() => setOpenAssignModal(false)}
                fullWidth
                maxWidth="xs"
                fullScreen={isMobile}
                PaperProps={{
                    sx: {
                        borderRadius: isMobile ? 0 : 3,
                        maxHeight: isMobile ? '100dvh' : '90vh',
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Bulk Assign Fee Structure
                    {isMobile && (
                        <IconButton size="small" onClick={() => setOpenAssignModal(false)}>
                            <CloseIcon />
                        </IconButton>
                    )}
                </DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2.5} sx={{ mt: 1 }}>
                        <TextField
                            select
                            label="Target Class"
                            value={assignTargetClass}
                            onChange={(e) => setAssignTargetClass(e.target.value)}
                            fullWidth
                        >
                            {CLASS_OPTIONS.map(c => (
                                <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            select
                            label="Fee Structure Template"
                            value={assignTargetStructureId}
                            onChange={(e) => setAssignTargetStructureId(e.target.value)}
                            fullWidth
                        >
                            {structures.map((s: any) => (
                                <MenuItem key={s.feeStructureId} value={s.feeStructureId}>{s.name} ({formatCurrency(s.totalFeeAmount)})</MenuItem>
                            ))}
                        </TextField>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: { xs: 2, sm: 2 } }}>
                    <Button onClick={() => setOpenAssignModal(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleAssignSubmit} disabled={assignMutation.isPending}>Assign</Button>
                </DialogActions>
            </Dialog>

            {/* Apply Discount Modal */}
            <Dialog
                open={openDiscountModal}
                onClose={() => setOpenDiscountModal(false)}
                fullWidth
                maxWidth="xs"
                fullScreen={isMobile}
                PaperProps={{
                    sx: {
                        borderRadius: isMobile ? 0 : 3,
                        maxHeight: isMobile ? '100dvh' : '90vh',
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Apply Discount Template
                    {isMobile && (
                        <IconButton size="small" onClick={() => setOpenDiscountModal(false)}>
                            <CloseIcon />
                        </IconButton>
                    )}
                </DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2.5} sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            Applying discount to <strong>{selectedStudentIds.length}</strong> selected students.
                        </Typography>
                        {discounts.length === 0 ? (
                            <Box sx={{ py: 2, textAlign: 'center' }}>
                                <Alert severity="warning" sx={{ mb: 2 }}>
                                    No discount templates found. Please create a discount template first.
                                </Alert>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    component={Link}
                                    to="/school-admin/fees/discounts"
                                    fullWidth
                                    startIcon={<LocalOfferIcon />}
                                >
                                    Create Discount Template
                                </Button>
                            </Box>
                        ) : (
                            <TextField
                                select
                                label="Discount / Scholarship Template"
                                value={selectedDiscountId}
                                onChange={(e) => setSelectedDiscountId(e.target.value)}
                                fullWidth
                            >
                                {discounts.map((d: any) => {
                                    const dId = d.discountId || d.discountTemplateId;
                                    const dVal = d.discountValue !== undefined ? d.discountValue : d.value;
                                    return (
                                        <MenuItem key={dId} value={dId}>
                                             {d.name} ({d.discountType === 'percentage' ? `${dVal}%` : formatCurrency(dVal)} waiver)
                                        </MenuItem>
                                    );
                                })}
                            </TextField>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: { xs: 2, sm: 2 } }}>
                    <Button onClick={() => setOpenDiscountModal(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleApplyDiscountSubmit}
                        disabled={discounts.length === 0 || applyDiscountMutation.isPending}
                    >
                        Apply
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Apply Adjustment Modal */}
            <Dialog
                open={openAdjustmentModal}
                onClose={() => setOpenAdjustmentModal(false)}
                fullWidth
                maxWidth="xs"
                fullScreen={isMobile}
                PaperProps={{
                    sx: {
                        borderRadius: isMobile ? 0 : 3,
                        maxHeight: isMobile ? '100dvh' : '90vh',
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Record Manual Adjustment
                    {isMobile && (
                        <IconButton size="small" onClick={() => setOpenAdjustmentModal(false)}>
                            <CloseIcon />
                        </IconButton>
                    )}
                </DialogTitle>
                <DialogContent dividers>
                    {activeDrawerAccount && (
                        <Stack spacing={2.5} sx={{ mt: 1 }}>
                            <TextField
                                select
                                label="Fee Category"
                                value={adjustCategoryId}
                                onChange={(e) => setAdjustCategoryId(e.target.value)}
                                fullWidth
                            >
                                {activeDrawerAccount.feeBreakdown.map(item => (
                                    <MenuItem key={item.feeCategoryId} value={item.feeCategoryId}>{item.categoryName} (Bal: {formatCurrency(item.balanceAmount)})</MenuItem>
                                ))}
                            </TextField>

                            <TextField
                                select
                                label="Adjustment Type"
                                value={adjustmentType}
                                onChange={(e) => setAdjustmentType(e.target.value)}
                                fullWidth
                            >
                                {ADJUSTMENT_TYPES.map(a => (
                                    <MenuItem key={a.value} value={a.value}>{a.label}</MenuItem>
                                ))}
                            </TextField>

                            <TextField
                                type="number"
                                label="Adjustment Amount"
                                value={adjustAmount}
                                onChange={(e) => setAdjustAmount(Number(e.target.value))}
                                fullWidth
                            />

                            <TextField
                                label="Reason / Notes"
                                multiline
                                rows={3}
                                value={adjustReason}
                                onChange={(e) => setAdjustReason(e.target.value)}
                                fullWidth
                            />
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: { xs: 2, sm: 2 } }}>
                    <Button onClick={() => setOpenAdjustmentModal(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleApplyAdjustmentSubmit} disabled={adjustMutation.isPending}>Apply Adjustment</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast(t => ({ ...t, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity={toast.severity}>{toast.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default FeeAssignments;
