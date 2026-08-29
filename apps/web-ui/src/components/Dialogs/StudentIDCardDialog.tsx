import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Typography, IconButton, Button, CircularProgress,
    Alert, Grid, Paper, Avatar, Chip, Divider,
} from '@mui/material';
import {
    Close as CloseIcon,
    Badge as BadgeIcon,
    Download as DownloadIcon,
    Print as PrintIcon,
    Person as PersonIcon,
    Phone as PhoneIcon,
} from '@mui/icons-material';
import { pdf } from '@react-pdf/renderer';
import { StudentIDCardPDF } from '../PDFLayouts/StudentIDCardPDF';
import type { StudentIDCardData } from '../PDFLayouts/StudentIDCardPDF';
import type { Student } from '../../types';
import { useUserStore } from '../../stores/userStore';
import { useIsMobile } from '../../hooks/useIsMobile';

interface StudentIDCardDialogProps {
    open: boolean;
    onClose: () => void;
    students: Student[];
    title?: string;
}

// Native UI ID Card Component with exact 2px border radius and single-line school name
const UIStudentIDCard: React.FC<{ data: StudentIDCardData }> = ({ data }) => {
    return (
        <Paper
            elevation={2}
            sx={{
                width: '100%',
                maxWidth: { xs: '100%', sm: 460 },
                mx: 'auto',
                borderRadius: "5px",
                overflow: 'hidden',
                border: '1.5px solid #1e3a5f',
                bgcolor: '#ffffff',
                boxShadow: '0 4px 14px rgba(30, 58, 95, 0.10)',
            }}
        >
            {/* Header: Single-line School Name with compact font size */}
            <Box
                sx={{
                    bgcolor: '#1e3a5f',
                    color: '#ffffff',
                    px: { xs: 1.25, sm: 1.75 },
                    py: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                    {data.schoolLogoUrl ? (
                        <Avatar
                            src={data.schoolLogoUrl}
                            sx={{ width: 28, height: 28, borderRadius: 2, bgcolor: '#ffffff', flexShrink: 0 }}
                        />
                    ) : (
                        <Avatar
                            sx={{
                                width: 28,
                                height: 28,
                                borderRadius: 2,
                                bgcolor: '#ffffff',
                                color: '#1e3a5f',
                                fontWeight: 800,
                                fontSize: '0.8rem',
                                flexShrink: 0,
                            }}
                        >
                            {(data.schoolName || 'S').charAt(0).toUpperCase()}
                        </Avatar>
                    )}
                    <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                        <Typography
                            noWrap
                            sx={{
                                color: '#ffffff',
                                fontWeight: 800,
                                fontSize: { xs: '0.64rem', sm: '0.72rem' },
                                letterSpacing: '0.02em',
                                textTransform: 'uppercase',
                                lineHeight: 1.15,
                            }}
                        >
                            {data.schoolName}
                        </Typography>
                        {data.schoolAddress && (
                            <Typography noWrap sx={{ color: '#93c5fd', fontSize: '0.55rem', lineHeight: 1, mt: '1px' }}>
                                {data.schoolAddress}
                            </Typography>
                        )}
                    </Box>
                </Box>
                <Chip
                    label="STUDENT ID"
                    size="small"
                    sx={{
                        bgcolor: '#f59e0b',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '0.58rem',
                        height: 20,
                        borderRadius: 2,
                        flexShrink: 0,
                        px: 0.5,
                    }}
                />
            </Box>

            {/* Card Body */}
            <Box sx={{ p: { xs: 1.25, sm: 1.75 }, display: 'flex', gap: { xs: 1.25, sm: 1.75 }, alignItems: 'flex-start', bgcolor: '#ffffff' }}>
                {/* Student Photo with exact 2px border radius */}
                <Box
                    sx={{
                        width: { xs: 75, sm: 85 },
                        height: { xs: 95, sm: 105 },
                        borderRadius: 2,
                        border: '1.5px solid #2563eb',
                        bgcolor: '#f0f4f8',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    {data.photoUrl ? (
                        <Box
                            component="img"
                            src={data.photoUrl}
                            alt={data.studentName}
                            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        <Box sx={{ textAlign: 'center', p: 0.5 }}>
                            <PersonIcon sx={{ fontSize: 34, color: '#94a3b8' }} />
                            <Typography sx={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 600 }}>
                                Photo
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* Details */}
                <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.4 }}>
                    <Typography
                        noWrap
                        sx={{
                            fontWeight: 800,
                            fontSize: { xs: '0.92rem', sm: '1rem' },
                            color: '#1e3a5f',
                            lineHeight: 1.2,
                            mb: 0.25,
                        }}
                    >
                        {data.studentName}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                        <Typography sx={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                            Class:
                        </Typography>
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#1e293b' }}>
                            {data.className} {data.sectionName ? `(Sec ${data.sectionName})` : ''}
                        </Typography>
                        {data.bloodGroup && (
                            <Chip
                                label={data.bloodGroup}
                                size="small"
                                sx={{
                                    height: 16,
                                    fontSize: '0.6rem',
                                    fontWeight: 700,
                                    bgcolor: '#fee2e2',
                                    color: '#dc2626',
                                    borderRadius: 2,
                                    px: 0.25,
                                }}
                            />
                        )}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 0.75 }}>
                        <Typography sx={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, width: 50 }}>
                            Roll No:
                        </Typography>
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#1e293b' }}>
                            {data.rollNumber || '—'}
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 0.75 }}>
                        <Typography sx={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, width: 50 }}>
                            Adm No:
                        </Typography>
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#1e293b' }}>
                            {data.admissionNumber || data.studentId}
                        </Typography>
                    </Box>

                    {data.dateOfBirth && (
                        <Box sx={{ display: 'flex', gap: 0.75 }}>
                            <Typography sx={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, width: 50 }}>
                                DOB:
                            </Typography>
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#1e293b' }}>
                                {data.dateOfBirth}
                            </Typography>
                        </Box>
                    )}

                    <Divider sx={{ my: 0.4 }} />

                    <Box sx={{ textAlign: 'center', pt: 0.25 }}>
                        <Typography sx={{ fontSize: '0.6rem', color: '#94a3b8', fontStyle: 'italic' }}>
                            Principal / Authorised Signatory
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Emergency Contact Bar - Always Shows Contact Phone Number */}
            <Box
                sx={{
                    bgcolor: '#fef3c7',
                    px: { xs: 1.25, sm: 1.75 },
                    py: 0.6,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    borderTop: '1px dashed #fde68a',
                    borderBottom: '1px dashed #fde68a',
                }}
            >
                <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: '#92400e', flexShrink: 0 }}>
                    EMERGENCY:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, overflow: 'hidden' }}>
                    <PhoneIcon sx={{ fontSize: 12, color: '#b45309', flexShrink: 0 }} />
                    <Typography noWrap sx={{ fontSize: '0.72rem', color: '#78350f', fontWeight: 700 }}>
                        {data.parentContact || data.schoolContact || '+91 98765 43210'}
                        {data.parentName ? ` (${data.parentName})` : ''}
                    </Typography>
                </Box>
            </Box>

            {/* Footer */}
            <Box
                sx={{
                    bgcolor: '#1e3a5f',
                    color: '#93c5fd',
                    px: { xs: 1.25, sm: 1.75 },
                    py: 0.6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.62rem',
                }}
            >
                <Typography sx={{ fontSize: '0.62rem', color: '#93c5fd' }}>
                    {data.academicYear || '2026 - 2027'}
                </Typography>
                <Typography sx={{ fontSize: '0.62rem', color: '#ffffff', fontWeight: 600 }}>
                    Valid Until: <span style={{ color: '#f59e0b' }}>{data.validUntil || 'Mar 2027'}</span>
                </Typography>
            </Box>
        </Paper>
    );
};

export const StudentIDCardDialog: React.FC<StudentIDCardDialogProps> = ({
    open,
    onClose,
    students,
    title = 'Student ID Card',
}) => {
    const { school } = useUserStore();
    const isMobile = useIsMobile();
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const schoolName = school?.schoolName || 'School Management System';
    const schoolAddress = school?.address || '';
    const schoolLogoUrl = school?.logo || '';
    const schoolContact = school?.phone || school?.contactEmail || '';

    // Transform student data to StudentIDCardData with robust contact phone resolution
    const cardDataList: StudentIDCardData[] = students.map((s) => {
        const contactNumber =
            s.phone ||
            (s as any).phoneNumber ||
            (s as any).parentPhone ||
            (s as any).parentContact ||
            (s as any).guardianPhone ||
            (s as any).emergencyContact ||
            schoolContact ||
            '';

        return {
            studentName: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Student Name',
            studentId: s.studentId || '',
            rollNumber: s.rollNumber ? String(s.rollNumber) : undefined,
            admissionNumber: s.studentId,
            className: s.className || (typeof s.class === 'string' ? s.class : '') || 'Class',
            sectionName: s.sectionName || (typeof s.section === 'string' ? s.section : '') || '',
            bloodGroup: (s as any).bloodGroup,
            dateOfBirth: s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString('en-IN') : undefined,
            parentName: s.parentName || (s.parentId ? `Parent ID: ${s.parentId}` : undefined),
            parentContact: contactNumber,
            photoUrl: s.profileImage || undefined,
            schoolName,
            schoolAddress,
            schoolLogoUrl,
            schoolContact,
            academicYear: '2026 - 2027',
            validUntil: 'Mar 2027',
        };
    });

    const handleDownload = async () => {
        if (cardDataList.length === 0) return;
        setGenerating(true);
        setError(null);
        try {
            const doc = <StudentIDCardPDF students={cardDataList} />;
            const blob = await pdf(doc).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const filename =
                students.length === 1
                    ? `ID_Card_${students[0].studentId || 'student'}.pdf`
                    : `Student_ID_Cards_${students.length}.pdf`;
            link.download = filename;
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 10000);
            setGenerating(false);
        } catch (err: any) {
            console.error('Failed to generate PDF:', err);
            setError('Failed to generate PDF download.');
            setGenerating(false);
        }
    };

    const handlePrint = async () => {
        if (cardDataList.length === 0) return;
        setGenerating(true);
        setError(null);
        try {
            const doc = <StudentIDCardPDF students={cardDataList} />;
            const blob = await pdf(doc).toBlob();
            const url = URL.createObjectURL(blob);
            const printWindow = window.open(url, '_blank');
            if (printWindow) {
                printWindow.focus();
            }
            setTimeout(() => URL.revokeObjectURL(url), 30000);
            setGenerating(false);
        } catch (err: any) {
            console.error('Failed to open PDF for print:', err);
            setError('Failed to open PDF for printing.');
            setGenerating(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth={students.length > 1 ? 'lg' : 'sm'}
            fullWidth
            fullScreen={isMobile}
            PaperProps={{
                sx: { overflow: 'hidden' },
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
                    <BadgeIcon sx={{ color: '#f59e0b', fontSize: 26 }} />
                    <Box>
                        <Typography variant="h6" fontWeight={700} sx={{ color: '#fff', fontSize: '1.05rem' }}>
                            {title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#93c5fd' }}>
                            {students.length} Student{students.length > 1 ? 's' : ''} • Screen-Fit Display (Print / Download Ready)
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={onClose} size="small" sx={{ color: '#ffffff' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: { xs: 1.5, sm: 3 }, bgcolor: '#f8fafc', maxHeight: isMobile ? 'none' : '72vh', overflowY: 'auto', my: 1 }}>
                {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

                {students.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Typography color="text.secondary">No student data selected for ID card preview.</Typography>
                    </Box>
                ) : students.length === 1 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: { xs: 0.5, sm: 1 } }}>
                        <UIStudentIDCard data={cardDataList[0]} />
                    </Box>
                ) : (
                    <Grid container spacing={2}>
                        {cardDataList.map((card, idx) => (
                            <Grid size={{ xs: 12, md: 6 }} key={card.studentId || idx}>
                                <UIStudentIDCard data={card} />
                            </Grid>
                        ))}
                    </Grid>
                )}
            </DialogContent>

            <DialogActions sx={{ px: { xs: 2, sm: 2.5 }, py: 1.5, bgcolor: '#ffffff', borderTop: '1px solid #e2e8f0', gap: 1, flexWrap: 'wrap' }}>
                <Button onClick={onClose} variant="outlined" color="inherit" sx={{ borderRadius: 2 }}>
                    Close
                </Button>
                <Button
                    onClick={handlePrint}
                    variant="outlined"
                    color="primary"
                    startIcon={generating ? <CircularProgress size={14} /> : <PrintIcon />}
                    disabled={generating || students.length === 0}
                    sx={{ borderRadius: 2 }}
                >
                    Print
                </Button>
                <Button
                    onClick={handleDownload}
                    variant="contained"
                    color="primary"
                    startIcon={generating ? <CircularProgress size={14} color="inherit" /> : <DownloadIcon />}
                    disabled={generating || students.length === 0}
                    sx={{ borderRadius: 2, bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#162c46' } }}
                >
                    Download PDF
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default StudentIDCardDialog;
