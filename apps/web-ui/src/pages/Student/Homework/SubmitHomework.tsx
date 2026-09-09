import React, { useState } from 'react';
import {
    Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Chip, Alert, CircularProgress, IconButton, Paper,
} from '@mui/material';
import {
    Upload as UploadIcon,
    CheckCircle as DoneIcon,
    Close as CloseIcon,
    CloudUpload as CloudIcon,
    Assignment as HwIcon,
    RateReview as ReviewIcon,
    EditNote as ChangesIcon,
} from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import useApi from '../../../queries/useApi';
import TokenService from '../../../queries/token/tokenService';
import { useIsMobile } from '../../../hooks/useIsMobile';

interface SubmitHomeworkProps {
    homework: {
        homeworkId: string;
        title: string;
        description: string;
        dueDate: string;
        submissions?: Array<{
            studentId: string;
            content?: string;
            attachmentUrl?: string;
            attachmentFileName?: string;
            status: string;
            submittedAt: string;
            teacherRemarks?: string;
            marksAwarded?: number;
            maxMarks?: number;
        }>;
    };
    studentId: string;
    studentName?: string;
    onClose: () => void;
}

export const SubmitHomework: React.FC<SubmitHomeworkProps> = ({ homework, studentId, studentName, onClose }) => {
    const schoolId = TokenService.getSchoolId() || '';
    const isMobile = useIsMobile();
    const queryClient = useQueryClient();

    const existingSubmission = homework.submissions?.find(s => s.studentId === studentId);
    const isOverdue = new Date() > new Date(homework.dueDate);
    const isAlreadySubmitted = !!existingSubmission;
    const isChangesRequested = existingSubmission?.status === 'changes_requested';
    const isAccepted = existingSubmission?.status === 'accepted';

    const [content, setContent] = useState(existingSubmission?.content || '');
    const [attachmentUrl, setAttachmentUrl] = useState(existingSubmission?.attachmentUrl || '');
    const [attachmentFileName, setAttachmentFileName] = useState(existingSubmission?.attachmentFileName || '');
    const [success, setSuccess] = useState(false);

    const submitMutation = useMutation({
        mutationFn: () => useApi<any>('POST', `/api/academics/school/${schoolId}/homework/${homework.homeworkId}/submit`, {
            content,
            attachmentUrl,
            attachmentFileName,
            studentId,
        }),
        onSuccess: () => {
            setSuccess(true);
            queryClient.invalidateQueries({ queryKey: ['homework'] });
            setTimeout(() => onClose(), 1600);
        },
    });

    const getStatusDetails = () => {
        if (!existingSubmission) {
            return isOverdue
                ? { label: 'Overdue (Not Submitted)', color: 'error' as const, bg: '#fef2f2' }
                : { label: 'Due ' + new Date(homework.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), color: 'default' as const, bg: '#f8fafc' };
        }

        switch (existingSubmission.status) {
            case 'accepted':
                return { label: 'Accepted & Approved', color: 'success' as const, bg: '#f0fdf4' };
            case 'changes_requested':
                return { label: 'Changes Requested', color: 'warning' as const, bg: '#fff7ed' };
            case 'rejected':
                return { label: 'Rejected', color: 'error' as const, bg: '#fef2f2' };
            case 'reviewed':
                return { label: 'Reviewed', color: 'info' as const, bg: '#f0f9ff' };
            case 'late':
                return { label: 'Late Submission', color: 'warning' as const, bg: '#fffbeb' };
            default:
                return { label: 'Submitted', color: 'info' as const, bg: '#eff6ff' };
        }
    };

    const statusDetail = getStatusDetails();

    return (
        <Dialog open onClose={onClose} fullWidth maxWidth="sm" fullScreen={isMobile}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, pb: 1 }}>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <HwIcon sx={{ color: 'primary.main', fontSize: 26 }} />
                    <Box>
                        <Typography fontWeight={700} sx={{ lineHeight: 1.2, fontSize: '1.05rem', color: '#0f172a' }}>
                            {homework.title}
                        </Typography>
                        {studentName && (
                            <Typography variant="caption" color="text.secondary" display="block">
                                Student: <strong>{studentName}</strong>
                            </Typography>
                        )}
                        <Chip
                            label={statusDetail.label}
                            color={statusDetail.color}
                            size="small"
                            sx={{ mt: 0.5, fontWeight: 700, fontSize: '0.72rem' }}
                        />
                    </Box>
                </Box>
                <IconButton onClick={onClose} size="small" sx={{ color: '#64748b' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 1 }}>
                {/* Assignment Brief */}
                <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, mb: 2.5, border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: '0.04em' }}>
                        ASSIGNMENT DETAILS
                    </Typography>
                    <Typography sx={{ mt: 0.5, fontSize: '0.9rem', color: '#334155' }}>
                        {homework.description}
                    </Typography>
                    <Typography variant="caption" color={isOverdue ? 'error.main' : 'text.secondary'} sx={{ mt: 1, display: 'block', fontWeight: 600 }}>
                        {isOverdue ? '⚠️ ' : '📅 '}Due Date: {new Date(homework.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </Typography>
                </Paper>

                {/* Changes Requested Banner */}
                {isChangesRequested && (
                    <Alert severity="warning" icon={<ChangesIcon />} sx={{ mb: 2.5, borderRadius: 2 }}>
                        <Typography variant="subtitle2" fontWeight={700}>
                            Teacher Requested Changes
                        </Typography>
                        <Typography variant="body2">
                            {existingSubmission?.teacherRemarks || 'Please update your answers according to teacher feedback and resubmit.'}
                        </Typography>
                    </Alert>
                )}

                {/* Teacher Feedback / Marks Card */}
                {existingSubmission && (existingSubmission.status === 'reviewed' || existingSubmission.status === 'accepted' || existingSubmission.status === 'rejected') && (
                    <Box sx={{ p: 2, bgcolor: isAccepted ? '#f0fdf4' : existingSubmission.status === 'rejected' ? '#fef2f2' : '#f0f9ff', borderRadius: 2, mb: 2.5, border: '1px solid', borderColor: isAccepted ? '#bbf7d0' : existingSubmission.status === 'rejected' ? '#fecaca' : '#bae6fd' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                            <ReviewIcon sx={{ color: isAccepted ? '#16a34a' : existingSubmission.status === 'rejected' ? '#dc2626' : '#0284c7', fontSize: 18 }} />
                            <Typography fontWeight={700} sx={{ color: isAccepted ? '#16a34a' : existingSubmission.status === 'rejected' ? '#dc2626' : '#0284c7', fontSize: '0.9rem' }}>
                                Teacher Evaluation
                            </Typography>
                        </Box>
                        {existingSubmission.teacherRemarks && (
                            <Typography variant="body2" sx={{ color: '#334155' }}>
                                {existingSubmission.teacherRemarks}
                            </Typography>
                        )}
                        {existingSubmission.marksAwarded !== undefined && (
                            <Chip
                                label={`Score: ${existingSubmission.marksAwarded}${existingSubmission.maxMarks ? `/${existingSubmission.maxMarks}` : ''} Marks`}
                                color={isAccepted ? 'success' : 'primary'}
                                size="small"
                                sx={{ mt: 1, fontWeight: 700 }}
                            />
                        )}
                    </Box>
                )}

                {success ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <DoneIcon sx={{ fontSize: 56, color: 'success.main', mb: 1 }} />
                        <Typography fontWeight={700} color="success.main" variant="h6">
                            Homework Submitted Successfully!
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Your teacher will be notified. Closing window...
                        </Typography>
                    </Box>
                ) : (
                    <>
                        {isOverdue && !isAlreadySubmitted && (
                            <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                                The due date has passed. Your submission will be marked as <strong>late</strong>.
                            </Alert>
                        )}

                        {/* Text Answer */}
                        <TextField
                            label="Your Answer / Notes"
                            multiline
                            rows={isMobile ? 4 : 5}
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            fullWidth
                            placeholder="Type your homework answers, solution steps, or explanatory notes here..."
                            sx={{ mb: 2 }}
                        />

                        {/* Attachment URL field */}
                        <Box sx={{ border: '1px dashed #cbd5e1', borderRadius: 2, p: 2, textAlign: 'center', mb: 1, bgcolor: '#ffffff' }}>
                            <CloudIcon sx={{ fontSize: 30, color: '#6366f1', mb: 0.5 }} />
                            <Typography variant="body2" fontWeight={600} color="#1e293b" sx={{ mb: 0.5 }}>
                                Attachment Link
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
                                Paste a public URL or share link (Google Drive, Dropbox, OneDrive, etc.)
                            </Typography>
                            <TextField
                                size="small"
                                label="Attachment URL (optional)"
                                value={attachmentUrl}
                                onChange={e => setAttachmentUrl(e.target.value)}
                                fullWidth
                                placeholder="https://..."
                                sx={{ mb: 1.5 }}
                            />
                            <TextField
                                size="small"
                                label="File Name (optional)"
                                value={attachmentFileName}
                                onChange={e => setAttachmentFileName(e.target.value)}
                                fullWidth
                                placeholder="e.g. math_homework_ch4.pdf"
                            />
                        </Box>
                    </>
                )}
            </DialogContent>

            {!success && (
                <DialogActions sx={{ p: 2, gap: 1, borderTop: '1px solid #f1f5f9' }}>
                    <Button onClick={onClose} color="inherit" sx={{ fontWeight: 600 }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => submitMutation.mutate()}
                        disabled={submitMutation.isPending || (!content.trim() && !attachmentUrl.trim())}
                        startIcon={submitMutation.isPending ? <CircularProgress size={14} /> : isAlreadySubmitted ? <DoneIcon /> : <UploadIcon />}
                        color={isChangesRequested ? 'warning' : isOverdue ? 'warning' : 'primary'}
                        sx={{ fontWeight: 700, px: 2.5, borderRadius: 2 }}
                    >
                        {submitMutation.isPending
                            ? 'Submitting...'
                            : isChangesRequested
                            ? 'Resubmit with Changes'
                            : isAlreadySubmitted
                            ? 'Update Submission'
                            : 'Submit Homework'}
                    </Button>
                </DialogActions>
            )}
        </Dialog>
    );
};

export default SubmitHomework;
