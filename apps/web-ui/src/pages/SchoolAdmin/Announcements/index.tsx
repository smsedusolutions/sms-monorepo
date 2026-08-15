import React, { useState } from 'react';
import {
    Box,
    Typography,
    Chip,
    Alert,
    Skeleton,
    Button,
    Tabs,
    Tab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    FormControlLabel,
    Checkbox,
    Stack,
    Paper,
    IconButton,
} from '@mui/material';
import {
    Add as AddIcon,
    Announcement as AnnouncementIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Warning as WarningIcon,
    Close as CloseIcon,
    AttachFile as AttachFileIcon,
} from '@mui/icons-material';
import { useGetAnnouncements, useDeleteAnnouncement, useCreateAnnouncement, useUpdateAnnouncement } from '../../../queries/Announcement';
import { useGetClasses } from '../../../queries/Class';
import TokenService from '../../../queries/token/tokenService';
import { useUrlTab } from '../../../hooks/useUrlTab';
import { useIsMobile } from '../../../hooks/useIsMobile';
import FileUpload from '../../../components/FileUpload/FileUpload';
import { IMAGEKIT_FOLDERS } from '../../../utils/imagekit';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import type { Announcement, AnnouncementCategory, AnnouncementPriority, AnnouncementTargetAudience, AnnouncementAttachment } from '../../../types';

const categoryColors: Record<AnnouncementCategory, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
    general: 'default',
    academic: 'primary',
    exam: 'info',
    holiday: 'success',
    event: 'secondary',
    fee: 'warning',
    emergency: 'error',
};

const SchoolAdminAnnouncements: React.FC = () => {
    const isMobile = useIsMobile();
    const schoolId = TokenService.getSchoolId() || '';
    const role = TokenService.getRole();

    const [tabValue, setTabValue] = useUrlTab(0, ['active', 'archived', 'all']);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

    const statusFilter = tabValue === 0 ? 'active' : tabValue === 1 ? 'archived' : undefined;

    const { data, isLoading, error, refetch } = useGetAnnouncements(schoolId, { status: statusFilter });
    const deleteAnnouncement = useDeleteAnnouncement(schoolId);
    const createAnnouncement = useCreateAnnouncement(schoolId);
    const updateAnnouncement = useUpdateAnnouncement(schoolId);

    const { data: classesData } = useGetClasses(schoolId);
    const classes = classesData?.data || [];
    const announcements = data?.data || [];

    // Form dialog state
    const [formDialogOpen, setFormDialogOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState<{
        title: string;
        content: string;
        category: AnnouncementCategory;
        priority: AnnouncementPriority;
        targetAudience: AnnouncementTargetAudience;
        targetClasses: string[];
        attachments: AnnouncementAttachment[];
        publishDate: Date | null;
        expiryDate: Date | null;
    }>({
        title: '',
        content: '',
        category: 'general',
        priority: 'normal',
        targetAudience: 'all',
        targetClasses: [],
        attachments: [],
        publishDate: new Date(),
        expiryDate: null,
    });

    const handleOpenCreateDialog = () => {
        setEditMode(false);
        setFormData({
            title: '',
            content: '',
            category: 'general',
            priority: 'normal',
            targetAudience: 'all',
            targetClasses: [],
            attachments: [],
            publishDate: new Date(),
            expiryDate: null,
        });
        setFormDialogOpen(true);
    };

    const handleOpenEditDialog = (announcement: Announcement) => {
        setEditMode(true);
        setSelectedAnnouncement(announcement);
        setFormData({
            title: announcement.title,
            content: announcement.content,
            category: announcement.category,
            priority: announcement.priority,
            targetAudience: announcement.targetAudience,
            targetClasses: announcement.targetClasses || [],
            attachments: announcement.attachments || [],
            publishDate: announcement.publishDate ? new Date(announcement.publishDate) : new Date(),
            expiryDate: announcement.expiryDate ? new Date(announcement.expiryDate) : null,
        });
        setFormDialogOpen(true);
    };

    const handleCloseFormDialog = () => {
        setFormDialogOpen(false);
        setEditMode(false);
        setSelectedAnnouncement(null);
    };

    const handleFormSubmit = async () => {
        try {
            const payload = {
                title: formData.title,
                content: formData.content,
                category: formData.category,
                priority: formData.priority,
                targetAudience: formData.targetAudience,
                targetClasses: formData.targetClasses,
                attachments: formData.attachments,
                publishDate: formData.publishDate?.toISOString() || new Date().toISOString(),
                expiryDate: formData.expiryDate?.toISOString(),
            };

            if (editMode && selectedAnnouncement) {
                await updateAnnouncement.mutateAsync({
                    announcementId: selectedAnnouncement.announcementId,
                    ...payload,
                });
            } else {
                await createAnnouncement.mutateAsync(payload);
            }

            handleCloseFormDialog();
            refetch();
        } catch (error) {
            console.error('Error saving announcement:', error);
        }
    };

    const handleDelete = async () => {
        if (selectedAnnouncement) {
            await deleteAnnouncement.mutateAsync(selectedAnnouncement.announcementId);
            setDeleteDialogOpen(false);
            setSelectedAnnouncement(null);
            refetch();
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    if (error) {
        return (
            <Box sx={{ p: isMobile ? 1.5 : 3 }}>
                <Alert severity="error">Failed to load announcements. Please try again later.</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: isMobile ? 1.5 : 3 }}>
            {/* Desktop Header */}
            {!isMobile && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AnnouncementIcon color="primary" />
                            <Typography variant="h4" fontWeight={700}>
                                Announcements
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            Manage school announcements and circulars
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleOpenCreateDialog}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                    >
                        Create Announcement
                    </Button>
                </Box>
            )}

            {/* Mobile / Desktop Action Bar & Tabs */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #e2e8f0',
                    mb: 2,
                    pb: isMobile ? 0.5 : 0,
                    gap: 1,
                }}
            >
                <Tabs
                    value={tabValue}
                    onChange={(_, v) => setTabValue(v)}
                    sx={{
                        minHeight: 40,
                        '& .MuiTab-root': {
                            minHeight: 40,
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '0.88rem',
                            px: isMobile ? 1.5 : 2.5,
                            color: '#64748b',
                            '&.Mui-selected': {
                                color: 'primary.main',
                                fontWeight: 700,
                            },
                        },
                    }}
                >
                    <Tab label="Active" />
                    <Tab label="Archived" />
                    <Tab label="All" />
                </Tabs>

                {isMobile && (
                    <Button
                        size="small"
                        variant="contained"
                        startIcon={<AddIcon fontSize="small" />}
                        onClick={handleOpenCreateDialog}
                        sx={{
                            borderRadius: 1.5,
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            py: 0.5,
                            px: 1.25,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        Create
                    </Button>
                )}
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
                {isLoading ? (
                    [1, 2, 3].map((i) => (
                        <Paper key={i} variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: '#e2e8f0' }}>
                            <Skeleton variant="text" width="70%" height={28} />
                            <Skeleton variant="text" width="40%" height={20} sx={{ mb: 1 }} />
                            <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 1, mb: 1 }} />
                            <Skeleton variant="text" width="50%" height={18} />
                        </Paper>
                    ))
                ) : announcements.length === 0 ? (
                    <Box sx={{ gridColumn: '1 / -1' }}>
                        <Paper
                            variant="outlined"
                            sx={{
                                p: { xs: 3, sm: 5 },
                                textAlign: 'center',
                                borderRadius: 2.5,
                                borderColor: '#e2e8f0',
                                bgcolor: '#ffffff',
                            }}
                        >
                            <AnnouncementIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 1.5 }} />
                            <Typography variant="h6" fontWeight={700} color="#1e293b">
                                No announcements found
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2.5, maxWidth: 400, mx: 'auto' }}>
                                There are no {tabValue === 0 ? 'active' : tabValue === 1 ? 'archived' : ''} announcements for this school.
                            </Typography>
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={handleOpenCreateDialog}
                                sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
                            >
                                Create Announcement
                            </Button>
                        </Paper>
                    </Box>
                ) : (
                    announcements.map((ann: Announcement) => {
                        const audienceLabel = ann.targetAudience === 'specific_class'
                            ? 'Specific Classes'
                            : ann.targetAudience.charAt(0).toUpperCase() + ann.targetAudience.slice(1);

                        return (
                            <Paper
                                key={ann.announcementId}
                                variant="outlined"
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    borderColor: '#e2e8f0',
                                    bgcolor: '#ffffff',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    transition: 'all 0.2s ease',
                                    borderLeft: `4px solid ${
                                        ann.priority === 'urgent' ? '#ef4444' :
                                        ann.priority === 'high' ? '#f59e0b' : '#6366f1'
                                    }`,
                                    '&:hover': {
                                        borderColor: '#cbd5e1',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                    },
                                }}
                            >
                                <Box>
                                    {/* Top Badges */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, gap: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                                            <Chip
                                                size="small"
                                                label={ann.category}
                                                color={categoryColors[ann.category]}
                                                sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600, textTransform: 'capitalize' }}
                                            />
                                            {ann.priority === 'urgent' && (
                                                <Chip
                                                    size="small"
                                                    label="Urgent"
                                                    color="error"
                                                    icon={<WarningIcon sx={{ fontSize: '14px !important' }} />}
                                                    sx={{ height: 22, fontSize: '0.72rem', fontWeight: 700 }}
                                                />
                                            )}
                                            {ann.priority === 'high' && (
                                                <Chip
                                                    size="small"
                                                    label="High Priority"
                                                    color="warning"
                                                    sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600 }}
                                                />
                                            )}
                                        </Box>
                                        <Chip
                                            size="small"
                                            label={ann.status}
                                            color={ann.status === 'active' ? 'success' : 'default'}
                                            variant="outlined"
                                            sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600, textTransform: 'capitalize' }}
                                        />
                                    </Box>

                                    {/* Title */}
                                    <Typography variant="subtitle1" fontWeight={700} color="#0f172a" sx={{ mb: 0.5 }}>
                                        {ann.title}
                                    </Typography>

                                    {/* Content excerpt */}
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                            mb: 1.5,
                                            display: '-webkit-box',
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        {ann.content}
                                    </Typography>

                                    {/* Attachments preview pill if any */}
                                    {ann.attachments && ann.attachments.length > 0 && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                                            <Chip
                                                size="small"
                                                icon={<AttachFileIcon sx={{ fontSize: '14px !important' }} />}
                                                label={`${ann.attachments.length} Attachment${ann.attachments.length > 1 ? 's' : ''}`}
                                                variant="outlined"
                                                sx={{ height: 22, fontSize: '0.72rem', bgcolor: '#f8fafc' }}
                                            />
                                        </Box>
                                    )}
                                </Box>

                                {/* Bottom Metadata & Actions */}
                                <Box sx={{ pt: 1.5, borderTop: '1px solid #f1f5f9' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            {formatDate(ann.publishDate)} • {ann.createdByName || 'Admin'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                            Audience: {audienceLabel}
                                        </Typography>
                                    </Box>

                                    {(role === 'sch_admin' || ann.createdBy === TokenService.getUserId()) && (
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                startIcon={<EditIcon fontSize="small" />}
                                                onClick={() => handleOpenEditDialog(ann)}
                                                sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600, fontSize: '0.78rem', py: 0.4 }}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                color="error"
                                                startIcon={<DeleteIcon fontSize="small" />}
                                                onClick={() => {
                                                    setSelectedAnnouncement(ann);
                                                    setDeleteDialogOpen(true);
                                                }}
                                                sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600, fontSize: '0.78rem', py: 0.4 }}
                                            >
                                                Archive
                                            </Button>
                                        </Box>
                                    )}
                                </Box>
                            </Paper>
                        );
                    })
                )}
            </Box>

            {/* Archive Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Archive Announcement</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        Are you sure you want to archive "{selectedAnnouncement?.title}"?
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 2.5, pb: 2 }}>
                    <Button onClick={() => setDeleteDialogOpen(false)} color="inherit" sx={{ textTransform: 'none', fontWeight: 600 }}>
                        Cancel
                    </Button>
                    <Button
                        color="error"
                        variant="contained"
                        onClick={handleDelete}
                        disabled={deleteAnnouncement.isPending}
                        sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
                    >
                        Archive
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Create/Edit Form Dialog */}
            <Dialog
                open={formDialogOpen}
                onClose={handleCloseFormDialog}
                maxWidth="md"
                fullWidth
                fullScreen={isMobile}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1.5, pt: 2, px: { xs: 2, sm: 3 } }}>
                    <Typography variant="h6" fontWeight={700} color="#0f172a">
                        {editMode ? 'Edit Announcement' : 'Create Announcement'}
                    </Typography>
                    <IconButton onClick={handleCloseFormDialog} size="small" sx={{ color: 'text.secondary' }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <Stack spacing={2.5} sx={{ mt: 0.5 }}>
                            <TextField
                                fullWidth
                                label="Announcement Title"
                                value={formData.title}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                required
                                placeholder="Enter a descriptive title"
                                size="small"
                            />

                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Category"
                                    value={formData.category}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, category: e.target.value as AnnouncementCategory }))}
                                    size="small"
                                >
                                    <MenuItem value="general">General</MenuItem>
                                    <MenuItem value="academic">Academic</MenuItem>
                                    <MenuItem value="exam">Exam</MenuItem>
                                    <MenuItem value="holiday">Holiday</MenuItem>
                                    <MenuItem value="event">Event</MenuItem>
                                    <MenuItem value="fee">Fee</MenuItem>
                                    <MenuItem value="emergency">Emergency</MenuItem>
                                </TextField>

                                <TextField
                                    select
                                    fullWidth
                                    label="Priority"
                                    value={formData.priority}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, priority: e.target.value as AnnouncementPriority }))}
                                    size="small"
                                >
                                    <MenuItem value="low">Low</MenuItem>
                                    <MenuItem value="normal">Normal</MenuItem>
                                    <MenuItem value="high">High</MenuItem>
                                    <MenuItem value="urgent">Urgent</MenuItem>
                                </TextField>

                                <Box sx={{ width: '100%' }}>
                                    <DatePicker
                                        label="Expiry Date (Optional)"
                                        value={formData.expiryDate}
                                        onChange={(date: Date | null) => setFormData(prev => ({ ...prev, expiryDate: date }))}
                                        slotProps={{
                                            textField: { fullWidth: true, size: 'small' }
                                        }}
                                    />
                                </Box>
                            </Stack>

                            <TextField
                                select
                                fullWidth
                                label="Target Audience"
                                value={formData.targetAudience}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, targetAudience: e.target.value as AnnouncementTargetAudience }))}
                                size="small"
                            >
                                <MenuItem value="all">All</MenuItem>
                                <MenuItem value="parents">Parents</MenuItem>
                                <MenuItem value="students">Students</MenuItem>
                                <MenuItem value="teachers">Teachers</MenuItem>
                                <MenuItem value="specific_class">Specific Classes</MenuItem>
                            </TextField>

                            {formData.targetAudience === 'specific_class' && (
                                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom color="primary" fontWeight={600}>
                                        Select Target Classes *
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                                        {classes.map((cls: any) => (
                                            <FormControlLabel
                                                key={cls.classId}
                                                control={
                                                    <Checkbox
                                                        size="small"
                                                        checked={formData.targetClasses.includes(cls.classId)}
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                            if (e.target.checked) {
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    targetClasses: [...prev.targetClasses, cls.classId]
                                                                }));
                                                            } else {
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    targetClasses: prev.targetClasses.filter(id => id !== cls.classId)
                                                                }));
                                                            }
                                                        }}
                                                    />
                                                }
                                                label={
                                                    <Typography variant="body2">
                                                        {cls.name || 'Unknown Class'}
                                                    </Typography>
                                                }
                                            />
                                        ))}
                                    </Box>
                                </Paper>
                            )}

                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                label="Announcement Content"
                                value={formData.content}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                                required
                                placeholder="Write the full announcement message here..."
                            />

                            <FileUpload
                                folder={IMAGEKIT_FOLDERS.ANNOUNCEMENTS}
                                baseFileName={`announcement_${schoolId}`}
                                currentAttachments={formData.attachments}
                                onUploadSuccess={(attachments) => setFormData(prev => ({ ...prev, attachments }))}
                                label="Attachments"
                                maxFiles={5}
                            />
                        </Stack>
                    </LocalizationProvider>
                </DialogContent>
                <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: 1.5, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                    <Button onClick={handleCloseFormDialog} color="inherit" sx={{ textTransform: 'none', fontWeight: 600 }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleFormSubmit}
                        disabled={createAnnouncement.isPending || updateAnnouncement.isPending}
                        sx={{ minWidth: 100, borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
                    >
                        {createAnnouncement.isPending || updateAnnouncement.isPending ? 'Saving...' : (editMode ? 'Update' : 'Create')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SchoolAdminAnnouncements;
