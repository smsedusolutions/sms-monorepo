import React, { useState } from 'react';
import {
    Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Chip, Alert, CircularProgress, IconButton, Paper, Divider,
} from '@mui/material';
import {
    Upload as UploadIcon,
    CheckCircle as DoneIcon,
    Close as CloseIcon,
    CloudUpload as CloudIcon,
    Assignment as HwIcon,
    RateReview as ReviewIcon,
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
    onClose: () => void;
}

export const SubmitHomework: React.FC<SubmitHomeworkProps> = ({ homework, studentId, onClose }) => {
    const schoolId = TokenService.getSchoolId() || '';
    const isMobile = useIsMobile();
    const queryClient = useQueryClient();

    const existingSubmission = homework.submissions?.find(s => s.studentId === studentId);
    const isOverdue = new Date() > new Date(homework.dueDate);
    const isAlreadySubmitted = !!existingSubmission;

    const [content, setContent] = useState(existingSubmission?.content || '');
    const [attachmentUrl, setAttachmentUrl] = useState(existingSubmission?.attachmentUrl || '');
    const [attachmentFileName, setAttachmentFileName] = useState(existingSubmission?.attachmentFileName || '');
    const [success, setSuccess] = useState(false);

    const submitMutation = useMutation({
        mutationFn: () => useApi<any>('POST', `/api/academics/school/${schoolId}/homework/${homework.homeworkId}/submit`, {
            content, attachmentUrl, attachmentFileName,
        }),
        onSuccess: () => {
            setSuccess(true);
            queryClient.invalidateQueries({ queryKey: ['homework', schoolId, studentId] });
            setTimeout(() => onClose(), 1800);
        },
    });

    const statusLabel = existingSubmission
        ? existingSubmission.status === 'reviewed'
            ? { label: 'Reviewed', color: 'info' as const }
            : existingSubmission.status === 'late'
            ? { label: 'Late Submission', color: 'warning' as const }
            : { label: 'Submitted', color: 'success' as const }
        : isOverdue
        ? { label: 'Overdue', color: 'error' as const }
        : { label: 'Due ' + new Date(homework.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), color: 'default' as const };

    return (
        <Dialog open onClose={onClose} fullWidth maxWidth="sm" fullScreen={isMobile}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, pb: 1 }}>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <HwIcon sx={{ color: 'primary.main' }} />
                    <Box>
                        <Typography fontWeight={700} sx={{ lineHeight: 1.2 }}>{homework.title}</Typography>
                        <Chip label={statusLabel.label} color={statusLabel.color} size="small" sx={{ mt: 0.5 }} />
                    </Box>
                </Box>
                <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
            </DialogTitle>

            <DialogContent>
                {/* Assignment Brief */}
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, mb: 3, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>ASSIGNMENT</Typography>
                    <Typography sx={{ mt: 0.5 }}>{homework.description}</Typography>
                    <Typography variant="caption" color={isOverdue ? 'error' : 'text.secondary'} sx={{ mt: 1, display: 'block' }}>
                        {isOverdue ? '⚠️ ' : '📅 '}Due: {new Date(homework.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </Typography>
                </Paper>

                {/* Teacher Review (if reviewed) */}
                {existingSubmission?.status === 'reviewed' && (
                    <>
                        <Box sx={{ p: 2, bgcolor: '#e0f2fe', borderRadius: 2, mb: 3, border: '1px solid #bae6fd' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <ReviewIcon sx={{ color: '#0284c7', fontSize: 18 }} />
                                <Typography fontWeight={700} sx={{ color: '#0284c7', fontSize: '0.9rem' }}>Teacher Feedback</Typography>
                            </Box>
                            {existingSubmission.teacherRemarks && (
                                <Typography variant="body2">{existingSubmission.teacherRemarks}</Typography>
                            )}
                            {existingSubmission.marksAwarded !== undefined && (
                                <Chip
                                    label={`Marks: ${existingSubmission.marksAwarded}${existingSubmission.maxMarks ? `/${existingSubmission.maxMarks}` : ''}`}
                                    color="primary" size="small" sx={{ mt: 1 }}
                                />
                            )}
                        </Box>
                        <Divider sx={{ mb: 2 }} />
                    </>
                )}

                {success ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <DoneIcon sx={{ fontSize: 56, color: 'success.main', mb: 1 }} />
                        <Typography fontWeight={700} color="success.main">Submitted Successfully!</Typography>
                        <Typography variant="body2" color="text.secondary">Closing automatically…</Typography>
                    </Box>
                ) : (
                    <>
                        {isOverdue && (
                            <Alert severity="warning" sx={{ mb: 2 }}>
                                The due date has passed. Your submission will be marked as <strong>late</strong>.
                            </Alert>
                        )}

                        {/* Text Answer */}
                        <TextField
                            label="Your Answer"
                            multiline
                            rows={isMobile ? 5 : 6}
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            fullWidth
                            placeholder="Type your answer here..."
                            sx={{ mb: 2 }}
                        />

                        {/* Attachment URL field (ImageKit upload) */}
                        <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 2, p: 2, textAlign: 'center', mb: 1 }}>
                            <CloudIcon sx={{ fontSize: 32, color: 'text.secondary', mb: 1 }} />
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Or paste an attachment URL (Google Drive, OneDrive, etc.)</Typography>
                            <TextField
                                size="small"
                                label="Attachment URL (optional)"
                                value={attachmentUrl}
                                onChange={e => setAttachmentUrl(e.target.value)}
                                fullWidth
                                sx={{ mb: 1 }}
                            />
                            <TextField
                                size="small"
                                label="File Name (optional)"
                                value={attachmentFileName}
                                onChange={e => setAttachmentFileName(e.target.value)}
                                fullWidth
                                placeholder="e.g. homework_solution.pdf"
                            />
                        </Box>
                    </>
                )}
            </DialogContent>

            {!success && (
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button onClick={onClose} color="inherit">Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={() => submitMutation.mutate()}
                        disabled={submitMutation.isPending || (!content && !attachmentUrl)}
                        startIcon={submitMutation.isPending ? <CircularProgress size={14} /> : isAlreadySubmitted ? <DoneIcon /> : <UploadIcon />}
                        color={isOverdue ? 'warning' : 'primary'}
                    >
                        {submitMutation.isPending ? 'Submitting...' : isAlreadySubmitted ? 'Update Submission' : 'Submit'}
                    </Button>
                </DialogActions>
            )}
        </Dialog>
    );
};

export default SubmitHomework;
