import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Typography, IconButton, Button, CircularProgress,
    Grid, TextField, MenuItem, Tabs, Tab, Alert, Paper,
} from '@mui/material';
import {
    Close as CloseIcon,
    Article as CertIcon,
    Download as DownloadIcon,
    Print as PrintIcon,
    Edit as EditIcon,
    Visibility as PreviewIcon,
} from '@mui/icons-material';
import { pdf } from '@react-pdf/renderer';
import { TransferCertificatePDF } from '../PDFLayouts/TransferCertificatePDF';
import type { TransferCertificateData } from '../PDFLayouts/TransferCertificatePDF';
import type { Student } from '../../types';
import { useUserStore } from '../../stores/userStore';
import { useIsMobile } from '../../hooks/useIsMobile';

interface TransferCertificateDialogProps {
    open: boolean;
    onClose: () => void;
    student: Student | null;
}

const REASONS = [
    'Parent Transfer / Relocation',
    'Higher Studies',
    'Completed Course / Passed Examination',
    'Change of School / Board',
    'Personal / Family Reasons',
    'Other',
];

const CONDUCT_OPTIONS = ['Excellent', 'Very Good', 'Good', 'Satisfactory'];

export const TransferCertificateDialog: React.FC<TransferCertificateDialogProps> = ({
    open,
    onClose,
    student,
}) => {
    const { school } = useUserStore();
    const isMobile = useIsMobile();
    const [tab, setTab] = useState<0 | 1>(0); // 0: Form, 1: Preview
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const schoolName = school?.schoolName || 'School Management System';
    const schoolAddress = school?.address || '';
    const schoolLogoUrl = school?.logo || '';
    const schoolContact = school?.phone || '';
    const schoolEmail = school?.contactEmail || '';

    const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const [form, setForm] = useState<TransferCertificateData>({
        tcNumber: `TC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        issuedDate: todayStr,
        schoolName,
        schoolAddress,
        schoolLogoUrl,
        schoolContact,
        schoolEmail,
        affiliationNumber: 'CBSE-AFF/2026/89421',
        studentName: '',
        admissionNumber: '',
        rollNumber: '',
        dateOfBirth: '',
        gender: 'Male',
        nationality: 'Indian',
        religion: 'General',
        caste: '',
        motherTongue: 'English',
        classLastStudied: '',
        sectionName: '',
        academicYear: '2026-2027',
        dateOfAdmission: '01/06/2025',
        dateOfLeaving: todayStr,
        reasonForLeaving: 'Parent Transfer / Relocation',
        fatherName: '',
        motherName: '',
        parentContact: '',
        conduct: 'Good',
        totalWorkingDays: 220,
        daysPresent: 208,
        attendancePercentage: 94.5,
        feesClearance: 'cleared',
        libraryDues: 'cleared',
        generalRemarks: 'Promoted to next higher class. All school property returned in good order.',
    });

    useEffect(() => {
        if (student) {
            const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim();
            const dob = student.dateOfBirth
                ? new Date(student.dateOfBirth).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                : '';
            const cName = student.className || (typeof student.class === 'string' ? student.class : '') || 'Class 10';
            const sName = student.sectionName || (typeof student.section === 'string' ? student.section : '') || 'A';
            const pName = (student as any).fatherName || student.parentName || 'Parent / Guardian';
            const contactNumber = student.phone || (student as any).phoneNumber || (student as any).parentPhone || (student as any).parentContact || '';

            setForm((prev) => ({
                ...prev,
                tcNumber: `TC-${new Date().getFullYear()}-${student.studentId?.replace(/\D/g, '').slice(-4) || Math.floor(1000 + Math.random() * 9000)}`,
                issuedDate: todayStr,
                schoolName,
                schoolAddress,
                schoolLogoUrl,
                schoolContact,
                schoolEmail,
                studentName: fullName,
                admissionNumber: student.studentId || '',
                rollNumber: student.rollNumber ? String(student.rollNumber) : '',
                dateOfBirth: dob,
                gender: (student as any).gender ? (student as any).gender.charAt(0).toUpperCase() + (student as any).gender.slice(1) : 'Male',
                classLastStudied: cName,
                sectionName: sName,
                fatherName: pName,
                motherName: (student as any).motherName || '',
                parentContact: contactNumber,
            }));
            setTab(0);
        }
    }, [student, school]);

    const generatePdf = async () => {
        setGenerating(true);
        setError(null);
        try {
            const doc = <TransferCertificatePDF data={form} />;
            const blob = await pdf(doc).toBlob();
            const url = URL.createObjectURL(blob);
            if (pdfUrl) URL.revokeObjectURL(pdfUrl);
            setPdfUrl(url);
            setGenerating(false);
            return url;
        } catch (err: any) {
            console.error('Failed to generate TC PDF:', err);
            setError('Failed to generate Transfer Certificate PDF.');
            setGenerating(false);
            return null;
        }
    };

    const handleTabChange = async (_: React.SyntheticEvent, newTab: 0 | 1) => {
        setTab(newTab);
        if (newTab === 1) {
            await generatePdf();
        }
    };

    const handleDownload = async () => {
        let urlToUse = pdfUrl;
        if (!urlToUse) {
            urlToUse = await generatePdf();
        }
        if (!urlToUse) return;

        const link = document.createElement('a');
        link.href = urlToUse;
        link.download = `Transfer_Certificate_${form.admissionNumber || form.studentName.replace(/\s+/g, '_')}.pdf`;
        link.click();
    };

    const handlePrint = async () => {
        let urlToUse = pdfUrl;
        if (!urlToUse) {
            urlToUse = await generatePdf();
        }
        if (!urlToUse) return;

        const printWindow = window.open(urlToUse, '_blank');
        if (printWindow) {
            printWindow.focus();
        }
    };

    if (!student) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            fullScreen={isMobile}
            PaperProps={{
                sx: { borderRadius: '2px', overflow: 'hidden', minHeight: isMobile ? '100%' : 650 },
            }}
        >
            <DialogTitle
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: '#1e3a5f',
                    color: '#ffffff',
                    py: 1.5,
                    px: { xs: 2, sm: 2.5 },
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CertIcon sx={{ color: '#f59e0b', fontSize: 26 }} />
                    <Box>
                        <Typography variant="h6" fontWeight={700} sx={{ color: '#fff', fontSize: '1.05rem' }}>
                            Transfer Certificate (TC)
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#93c5fd' }}>
                            {form.studentName} ({form.admissionNumber}) • {form.classLastStudied}
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={onClose} size="small" sx={{ color: '#ffffff' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f8fafc', px: 2 }}>
                <Tabs value={tab} onChange={handleTabChange} textColor="primary" indicatorColor="primary">
                    <Tab icon={<EditIcon fontSize="small" />} iconPosition="start" label="Certificate Details" />
                    <Tab icon={<PreviewIcon fontSize="small" />} iconPosition="start" label="Live PDF Preview" />
                </Tabs>
            </Box>

            <DialogContent sx={{ p: { xs: 1.5, sm: 2.5 }, bgcolor: '#f8fafc' }}>
                {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '2px' }}>{error}</Alert>}

                {tab === 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* Meta & Issue Block */}
                        <Paper elevation={0} sx={{ p: 2, borderRadius: '2px', border: '1px solid #e2e8f0' }}>
                            <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ mb: 1.5 }}>
                                📄 Certificate Number & Issue Details
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <TextField
                                        label="TC Number"
                                        size="small"
                                        fullWidth
                                        value={form.tcNumber}
                                        onChange={(e) => setForm((f) => ({ ...f, tcNumber: e.target.value }))}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <TextField
                                        label="Date of Issue"
                                        size="small"
                                        fullWidth
                                        value={form.issuedDate}
                                        onChange={(e) => setForm((f) => ({ ...f, issuedDate: e.target.value }))}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <TextField
                                        label="Academic Year"
                                        size="small"
                                        fullWidth
                                        value={form.academicYear}
                                        onChange={(e) => setForm((f) => ({ ...f, academicYear: e.target.value }))}
                                    />
                                </Grid>
                            </Grid>
                        </Paper>

                        {/* Student Information Block */}
                        <Paper elevation={0} sx={{ p: 2, borderRadius: '2px', border: '1px solid #e2e8f0' }}>
                            <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ mb: 1.5 }}>
                                👤 Student & Family Information
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        label="Student Full Name"
                                        size="small"
                                        fullWidth
                                        value={form.studentName}
                                        onChange={(e) => setForm((f) => ({ ...f, studentName: e.target.value }))}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        label="Admission Number"
                                        size="small"
                                        fullWidth
                                        value={form.admissionNumber}
                                        onChange={(e) => setForm((f) => ({ ...f, admissionNumber: e.target.value }))}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        label="Father's / Guardian Name"
                                        size="small"
                                        fullWidth
                                        value={form.fatherName}
                                        onChange={(e) => setForm((f) => ({ ...f, fatherName: e.target.value }))}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        label="Mother's Name"
                                        size="small"
                                        fullWidth
                                        value={form.motherName}
                                        onChange={(e) => setForm((f) => ({ ...f, motherName: e.target.value }))}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <TextField
                                        label="Date of Birth (DD/MM/YYYY)"
                                        size="small"
                                        fullWidth
                                        value={form.dateOfBirth}
                                        onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <TextField
                                        label="Gender"
                                        size="small"
                                        fullWidth
                                        value={form.gender}
                                        onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <TextField
                                        label="Nationality"
                                        size="small"
                                        fullWidth
                                        value={form.nationality}
                                        onChange={(e) => setForm((f) => ({ ...f, nationality: e.target.value }))}
                                    />
                                </Grid>
                            </Grid>
                        </Paper>

                        {/* Academic & Exit Details Block */}
                        <Paper elevation={0} sx={{ p: 2, borderRadius: '2px', border: '1px solid #e2e8f0' }}>
                            <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ mb: 1.5 }}>
                                🎓 Academic & Leaving Details
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <TextField
                                        label="Class Last Studied"
                                        size="small"
                                        fullWidth
                                        value={form.classLastStudied}
                                        onChange={(e) => setForm((f) => ({ ...f, classLastStudied: e.target.value }))}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <TextField
                                        label="Section"
                                        size="small"
                                        fullWidth
                                        value={form.sectionName}
                                        onChange={(e) => setForm((f) => ({ ...f, sectionName: e.target.value }))}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <TextField
                                        label="Date of Leaving"
                                        size="small"
                                        fullWidth
                                        value={form.dateOfLeaving}
                                        onChange={(e) => setForm((f) => ({ ...f, dateOfLeaving: e.target.value }))}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        select
                                        label="Reason for Leaving"
                                        size="small"
                                        fullWidth
                                        value={form.reasonForLeaving}
                                        onChange={(e) => setForm((f) => ({ ...f, reasonForLeaving: e.target.value }))}
                                    >
                                        {REASONS.map((r) => (
                                            <MenuItem key={r} value={r}>{r}</MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        select
                                        label="General Conduct"
                                        size="small"
                                        fullWidth
                                        value={form.conduct}
                                        onChange={(e) => setForm((f) => ({ ...f, conduct: e.target.value }))}
                                    >
                                        {CONDUCT_OPTIONS.map((c) => (
                                            <MenuItem key={c} value={c}>{c}</MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        select
                                        label="School Fees Clearance"
                                        size="small"
                                        fullWidth
                                        value={form.feesClearance}
                                        onChange={(e) => setForm((f) => ({ ...f, feesClearance: e.target.value as 'cleared' | 'pending' }))}
                                    >
                                        <MenuItem value="cleared">Cleared (All Dues Paid)</MenuItem>
                                        <MenuItem value="pending">Pending</MenuItem>
                                    </TextField>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        select
                                        label="Library Dues"
                                        size="small"
                                        fullWidth
                                        value={form.libraryDues}
                                        onChange={(e) => setForm((f) => ({ ...f, libraryDues: e.target.value as 'cleared' | 'pending' }))}
                                    >
                                        <MenuItem value="cleared">Cleared (Books Returned)</MenuItem>
                                        <MenuItem value="pending">Pending</MenuItem>
                                    </TextField>
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        label="General Remarks / Conduct Summary"
                                        size="small"
                                        fullWidth
                                        multiline
                                        rows={2}
                                        value={form.generalRemarks}
                                        onChange={(e) => setForm((f) => ({ ...f, generalRemarks: e.target.value }))}
                                    />
                                </Grid>
                            </Grid>
                        </Paper>
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 480 }}>
                        {generating ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 12, gap: 2 }}>
                                <CircularProgress color="primary" size={48} />
                                <Typography fontWeight={600} color="text.secondary">
                                    Rendering Transfer Certificate PDF...
                                </Typography>
                            </Box>
                        ) : pdfUrl ? (
                            <Box sx={{ flex: 1, minHeight: 480, border: '1px solid #e2e8f0', borderRadius: '2px', overflow: 'hidden', bgcolor: '#ffffff' }}>
                                <iframe
                                    src={`${pdfUrl}#toolbar=0`}
                                    title="Transfer Certificate Preview"
                                    width="100%"
                                    height="500px"
                                    style={{ border: 'none' }}
                                />
                            </Box>
                        ) : null}
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: { xs: 2, sm: 2.5 }, py: 1.5, bgcolor: '#ffffff', borderTop: '1px solid #e2e8f0', gap: 1, flexWrap: 'wrap' }}>
                <Button onClick={onClose} variant="outlined" color="inherit" sx={{ borderRadius: '2px' }}>
                    Cancel
                </Button>
                {tab === 0 && (
                    <Button
                        onClick={() => handleTabChange(null as any, 1)}
                        variant="outlined"
                        color="primary"
                        startIcon={<PreviewIcon />}
                        sx={{ borderRadius: '2px' }}
                    >
                        Preview Certificate
                    </Button>
                )}
                <Button
                    onClick={handlePrint}
                    variant="outlined"
                    color="primary"
                    startIcon={<PrintIcon />}
                    disabled={generating}
                    sx={{ borderRadius: '2px' }}
                >
                    Print
                </Button>
                <Button
                    onClick={handleDownload}
                    variant="contained"
                    color="primary"
                    startIcon={<DownloadIcon />}
                    disabled={generating}
                    sx={{ borderRadius: '2px', bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#162c46' } }}
                >
                    Download Certificate (PDF)
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TransferCertificateDialog;
