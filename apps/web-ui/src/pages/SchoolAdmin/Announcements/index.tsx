import React, { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
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
} from '@mui/material';
import {
    Add as AddIcon,
    Announcement as AnnouncementIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Warning as WarningIcon,
} from '@mui/icons-material';
import { useGetAnnouncements, useDeleteAnnouncement, useCreateAnnouncement, useUpdateAnnouncement } from '../../../queries/Announcement';
import { useGetClasses } from '../../../queries/Class';
import TokenService from '../../../queries/token/tokenService';
import { useUrlTab } from '../../../hooks/useUrlTab';
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
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Failed to load announcements. Please try again later.</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AnnouncementIcon color="primary" />
                        <Typography variant="h4" fontWeight={600}>
                            Announcements
                        </Typography>
                    </Box>
                    <Typography variant="body1" color="text.secondary">
                        Manage school announcements and circulars
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenCreateDialog}
                >
                    Create Announcement
                </Button>
            </Box>

            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 3 }}>
                <Tab label="Active" />
                <Tab label="Archived" />
                <Tab label="All" />
            </Tabs>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
                {isLoading ? (
                    [1, 2, 3].map((i) => (
                        <Card key={i}>
                            <CardContent>
                                <Skeleton variant="text" width="70%" height={30} />
                                <Skeleton variant="text" width="40%" />
                                <Skeleton variant="text" width="100%" />
                            </CardContent>
                        </Card>
                    ))
                ) : announcements.length === 0 ? (
                    <Box sx={{ gridColumn: '1 / -1' }}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center', py: 6 }}>
                                <AnnouncementIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                                <Typography variant="h6" color="text.secondary">
                                    No announcements found
                                </Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    sx={{ mt: 2 }}
                                    onClick={handleOpenCreateDialog}
                                >
                                    Create First Announcement
                                </Button>
                            </CardContent>
                        </Card>
                    </Box>
                ) : (
                    announcements.map((ann: Announcement) => (
                        <Card
                            key={ann.announcementId}
                            sx={{
                                height: '100%',
                                borderTop: 4,
                                borderColor: ann.priority === 'urgent' ? 'error.main' :
                                    ann.priority === 'high' ? 'warning.main' : 'primary.main',
                            }}
                        >
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                                    <Typography variant="h6" fontWeight={600} noWrap>
                                        {ann.title}
                                    </Typography>
                                    {ann.priority === 'urgent' && (
                                        <Chip size="small" label="Urgent" color="error" icon={<WarningIcon />} />
                                    )}
                                </Box>

                                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                                    <Chip
                                        size="small"
                                        label={ann.category}
                                        color={categoryColors[ann.category]}
                                        variant="outlined"
                                    />
                                    <Chip
                                        size="small"
                                        label={ann.targetAudience === 'specific_class' ? 'Specific Classes' : ann.targetAudience}
                                        variant="outlined"
                                    />
                                    <Chip
                                        size="small"
                                        label={ann.status}
                                        color={ann.status === 'active' ? 'success' : 'default'}
                                    />
                                </Box>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                        mb: 2,
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                    }}
                                >
                                    {ann.content}
                                </Typography>

                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                                    Published: {formatDate(ann.publishDate)} • By {ann.createdByName || 'Admin'}
                                </Typography>

                                {(role === 'sch_admin' || ann.createdBy === TokenService.getUserId()) && (
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Button
                                            size="small"
                                            startIcon={<EditIcon />}
                                            onClick={() => handleOpenEditDialog(ann)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            size="small"
                                            color="error"
                                            startIcon={<DeleteIcon />}
                                            onClick={() => {
                                                setSelectedAnnouncement(ann);
                                                setDeleteDialogOpen(true);
                                            }}
                                        >
                                            Archive
                                        </Button>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </Box>

            {/* Archive Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Archive Announcement</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to archive "{selectedAnnouncement?.title}"?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button
                        color="error"
                        variant="contained"
                        onClick={handleDelete}
                        disabled={deleteAnnouncement.isPending}
                    >
                        Archive
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Create/Edit Form Dialog */}
            <Dialog open={formDialogOpen} onClose={handleCloseFormDialog} maxWidth="md" fullWidth>
                <DialogTitle>{editMode ? 'Edit Announcement' : 'Create Announcement'}</DialogTitle>
                <DialogContent dividers>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <Stack spacing={3} sx={{ mt: 1 }}>
                            <TextField
                                fullWidth
                                label="Announcement Title"
                                value={formData.title}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                required
                                placeholder="Enter a descriptive title"
                            />

                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Category"
                                    value={formData.category}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, category: e.target.value as AnnouncementCategory }))}
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
                                            textField: { fullWidth: true }
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
                            >
                                <MenuItem value="all">All</MenuItem>
                                <MenuItem value="parents">Parents</MenuItem>
                                <MenuItem value="students">Students</MenuItem>
                                <MenuItem value="teachers">Teachers</MenuItem>
                                <MenuItem value="specific_class">Specific Classes</MenuItem>
                            </TextField>

                            {formData.targetAudience === 'specific_class' && (
                                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                                    <Typography variant="subtitle2" gutterBottom color="primary">
                                        Select Target Classes *
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
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
                                rows={5}
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
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={handleCloseFormDialog} color="inherit">
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleFormSubmit}
                        disabled={createAnnouncement.isPending || updateAnnouncement.isPending}
                        sx={{ minWidth: 120 }}
                    >
                        {createAnnouncement.isPending || updateAnnouncement.isPending ? 'Saving...' : (editMode ? 'Update' : 'Create')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SchoolAdminAnnouncements;
