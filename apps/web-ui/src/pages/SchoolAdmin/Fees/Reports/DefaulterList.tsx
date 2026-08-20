import React, { useState } from 'react';
import {
    Box, Typography, Paper, Grid, Button, Chip, Alert, Skeleton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Avatar, TextField, InputAdornment, Snackbar, Tooltip, IconButton,
} from '@mui/material';
import {
    Search as SearchIcon,
    Warning as DefaulterIcon,
    NotificationsActive as RemindIcon,
    Download as DownloadIcon,
    Phone as PhoneIcon,
    AttachMoney as MoneyIcon,
    Send as SendIcon,
} from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import useApi from '../../../../queries/useApi';
import TokenService from '../../../../queries/token/tokenService';
import { useIsMobile } from '../../../../hooks/useIsMobile';
import { MobileCardItem, MobileCardList } from '../../../../components/mobile';

export const DefaulterList: React.FC = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const isMobile = useIsMobile();
    const [search, setSearch] = useState('');
    const [toast, setToast] = useState('');

    const { data, isLoading, error } = useQuery({
        queryKey: ['fee-defaulters', schoolId],
        queryFn: () => useApi<any>('GET', `/api/school/${schoolId}/fees/dashboard/defaulters`),
        enabled: !!schoolId,
        staleTime: 2 * 60 * 1000,
    });

    const sendReminder = useMutation({
        mutationFn: (studentIds: string[]) => useApi<any>('POST', `/api/school/${schoolId}/fees/dashboard/send-reminder`, { studentIds }),
        onSuccess: () => setToast('Reminder notifications sent successfully!'),
    });

    const defaulters: any[] = data?.data || [];
    const filtered = defaulters.filter(d =>
        !search || d.studentName?.toLowerCase().includes(search.toLowerCase()) ||
        d.admissionNumber?.toLowerCase().includes(search.toLowerCase()) ||
        d.className?.toLowerCase().includes(search.toLowerCase())
    );

    const totalOutstanding = filtered.reduce((sum, d) => sum + (d.outstandingAmount || 0), 0);

    const exportCSV = () => {
        const headers = ['Student Name', 'Admission No', 'Class', 'Parent', 'Contact', 'Outstanding (₹)', 'Due Date'];
        const rows = filtered.map(d => [d.studentName, d.admissionNumber, d.className, d.parentName, d.parentContact, d.outstandingAmount, d.oldestDueDate || '—']);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'fee_defaulters.csv'; a.click();
    };

    return (
        <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 1300, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <DefaulterIcon sx={{ color: 'error.main', fontSize: 32 }} />
                    <Box>
                        <Typography variant="h5" fontWeight={800} sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>Fee Defaulters</Typography>
                        <Typography variant="body2" color="text.secondary">Students with outstanding fee dues</Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportCSV} size={isMobile ? 'small' : 'medium'} disabled={filtered.length === 0}>
                        Export CSV
                    </Button>
                    <Button variant="contained" color="error" startIcon={<SendIcon />}
                        onClick={() => sendReminder.mutate(filtered.map(d => d.studentId))}
                        disabled={sendReminder.isPending || filtered.length === 0}
                        size={isMobile ? 'small' : 'medium'}>
                        Send All Reminders
                    </Button>
                </Box>
            </Box>

            {/* Summary Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                        <Typography fontWeight={800} sx={{ fontSize: '1.6rem', color: 'error.main' }}>{filtered.length}</Typography>
                        <Typography variant="caption" color="text.secondary">Total Defaulters</Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                        <Typography fontWeight={800} sx={{ fontSize: '1.6rem', color: 'warning.main' }}>₹{totalOutstanding.toLocaleString('en-IN')}</Typography>
                        <Typography variant="caption" color="text.secondary">Total Outstanding</Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                        <Typography fontWeight={800} sx={{ fontSize: '1.6rem', color: 'primary.main' }}>
                            {filtered.length > 0 ? Math.round(totalOutstanding / filtered.length).toLocaleString('en-IN') : 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Avg. Per Student (₹)</Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                        <Typography fontWeight={800} sx={{ fontSize: '1.6rem', color: 'info.main' }}>
                            {new Set(filtered.map(d => d.className)).size}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Classes Affected</Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Search */}
            <TextField
                fullWidth
                size="small"
                placeholder="Search by student name, class or admission no..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
                sx={{ mb: 2.5, maxWidth: 500 }}
            />

            {error ? (
                <Alert severity="error">Failed to load defaulters. Please try again.</Alert>
            ) : isLoading ? (
                <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
            ) : filtered.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <MoneyIcon sx={{ fontSize: 64, color: 'success.main', mb: 2, opacity: 0.5 }} />
                    <Typography fontWeight={700} color="success.main">No defaulters found!</Typography>
                    <Typography color="text.secondary" variant="body2">All fees are up to date.</Typography>
                </Box>
            ) : isMobile ? (
                <MobileCardList isLoading={false} totalCount={filtered.length} itemCount={filtered.length} emptyTitle="" emptyMessage="">
                    {filtered.map((d: any) => (
                        <MobileCardItem
                            key={d.studentId}
                            title={d.studentName}
                            subtitle={`${d.className} • Adm: ${d.admissionNumber || '—'}`}
                            badge={<Chip label={`₹${(d.outstandingAmount || 0).toLocaleString('en-IN')}`} color="error" size="small" />}
                            metaItems={[
                                { label: 'Parent', value: d.parentName || '—' },
                                { label: 'Contact', value: d.parentContact || '—' },
                                ...(d.oldestDueDate ? [{ label: 'Since', value: new Date(d.oldestDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }] : []),
                            ]}
                            rightAction={
                                <Tooltip title="Send Reminder">
                                    <IconButton size="small" color="error" onClick={() => sendReminder.mutate([d.studentId])}><RemindIcon /></IconButton>
                                </Tooltip>
                            }
                        />
                    ))}
                </MobileCardList>
            ) : (
                <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                    <TableContainer>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.50' }}>Student</TableCell>
                                    <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.50' }}>Class</TableCell>
                                    <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.50' }}>Parent / Contact</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, bgcolor: 'grey.50' }}>Outstanding (₹)</TableCell>
                                    <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.50' }}>Due Since</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 700, bgcolor: 'grey.50' }}>Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filtered.map((d: any) => (
                                    <TableRow key={d.studentId} hover>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Avatar sx={{ width: 34, height: 34, fontSize: '0.85rem', bgcolor: 'error.light' }}>{d.studentName?.charAt(0)}</Avatar>
                                                <Box>
                                                    <Typography fontWeight={600} variant="body2">{d.studentName}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{d.admissionNumber || '—'}</Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell><Typography variant="body2">{d.className}</Typography></TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{d.parentName || '—'}</Typography>
                                            {d.parentContact && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                                                    <PhoneIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                                                    <Typography variant="caption" color="text.secondary">{d.parentContact}</Typography>
                                                </Box>
                                            )}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography fontWeight={700} color="error.main" sx={{ fontSize: '0.95rem' }}>
                                                ₹{(d.outstandingAmount || 0).toLocaleString('en-IN')}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {d.oldestDueDate ? new Date(d.oldestDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Send payment reminder notification">
                                                <Button
                                                    size="small" variant="outlined" color="error"
                                                    startIcon={<RemindIcon />}
                                                    onClick={() => sendReminder.mutate([d.studentId])}
                                                    disabled={sendReminder.isPending}
                                                >
                                                    Remind
                                                </Button>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast('')} message={toast} />
        </Box>
    );
};

export default DefaulterList;
