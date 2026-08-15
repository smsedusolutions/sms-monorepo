import React, { useState } from 'react';
import {
    Box,
    Typography,
    Chip,
    Alert,
    Skeleton,
    Button,
    Divider,
    Tabs,
    Tab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Stack,
    Grid,
} from '@mui/material';
import {
    Announcement as AnnouncementIcon,
    AttachFile as AttachFileIcon,
    Add as AddIcon,
    Close as CloseIcon,
    Download as DownloadIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import type { Announcement, AnnouncementCategory, AnnouncementAttachment, AnnouncementPriority, AnnouncementTargetAudience, Class } from '../../types';
import { AppInput } from '../../components/shared/AppInput';
import { AppSelect } from '../../components/shared/AppSelect';
import { AppDatePicker } from '../../components/shared/AppDatePicker';
import { AppButton } from '../../components/shared/AppButton';
import { AppExpandableTable } from '../../components/shared/AppExpandableTable';
import TokenService from '../../queries/token/tokenService';
import { useUrlTab } from '../../hooks/useUrlTab';
import {
    useGetAnnouncements,
    useMarkAnnouncementSeen,
    useDeleteAnnouncement,
    useCreateAnnouncement,
    useUpdateAnnouncement
} from '../../queries/Announcement';
import { useGetClasses } from '../../queries/Class';
import FileUpload from '../../components/FileUpload/FileUpload';
import { IMAGEKIT_FOLDERS } from '../../utils/imagekit';


const categoryColors: Record<AnnouncementCategory, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
    general: 'default',
    academic: 'primary',
    exam: 'info',
    holiday: 'success',
    event: 'secondary',
    fee: 'warning',
    emergency: 'error',
};


const Announcements: React.FC = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const userId = TokenService.getUserId() || '';
    const { data, isLoading, error } = useGetAnnouncements(schoolId);
    const markAsSeen = useMarkAnnouncementSeen(schoolId);

    const [tabValue, setTabValue] = useUrlTab(0, ['all', 'mine']);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [currentFile, setCurrentFile] = useState<AnnouncementAttachment | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

    const deleteAnnouncement = useDeleteAnnouncement(schoolId);
    const createAnnouncement = useCreateAnnouncement(schoolId);
    const updateAnnouncement = useUpdateAnnouncement(schoolId);
    const { data: classesData } = useGetClasses(schoolId);

    const classes = classesData?.data || [];
    console.log(currentFile, "currentFile")
    const allAnnouncements = data?.data || [];

    // Filter announcements based on tab
    const announcements = tabValue === 0
        ? allAnnouncements // All announcements
        : allAnnouncements.filter((ann: Announcement) => ann.createdBy === userId); // Your announcements

    const handleExpand = (announcementId: string, isSeen: boolean) => {
        // Mark as seen when expanding if not already seen
        if (!isSeen) {
            markAsSeen.mutate(announcementId);
        }
    };

    const handleViewFile = (attachment: AnnouncementAttachment) => {
        setCurrentFile(attachment);
        setViewerOpen(true);
    };

    const handleCloseViewer = () => {
        setViewerOpen(false);
        setCurrentFile(null);
    };

    const handleDelete = async () => {
        if (selectedAnnouncement) {
            await deleteAnnouncement.mutateAsync(selectedAnnouncement.announcementId);
            setDeleteDialogOpen(false);
            setSelectedAnnouncement(null);
        }
    };

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
        targetAudience: 'specific_class',
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
            targetAudience: 'specific_class',
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
        } catch (error) {
            console.error('Error saving announcement:', error);
        }
    };

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Failed to load announcements. Please try again later.</Alert>
            </Box>
        );
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const isImageType = (fileType: string, fileName: string) => {
        const ext = fileType.toLowerCase();
        const fileNameExt = fileName.split('.').pop()?.toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'image'].includes(ext) ||
            ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileNameExt || '');
    };

    const isPdfType = (fileType: string, fileName: string) => {
        return fileType.toLowerCase() === 'pdf' || fileName.toLowerCase().endsWith('.pdf');
    };

    const isDocumentType = (fileType: string, fileName: string) => {
        const ext = fileType.toLowerCase();
        const fileNameExt = fileName.split('.').pop()?.toLowerCase();
        return ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'odt', 'ods', 'odp', 'document'].includes(ext) ||
            ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'odt', 'ods', 'odp'].includes(fileNameExt || '');
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <AnnouncementIcon color="primary" />
                        <Typography variant="h4" fontWeight={600}>
                            Announcements
                        </Typography>
                    </Box>
                    <Typography variant="body1" color="text.secondary">
                        School announcements and circulars
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

            {/* Tabs for filtering */}
            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 3 }}>
                <Tab label="All Announcements" />
                <Tab label="Your Announcements" />
            </Tabs>

            {isLoading ? (
                <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 4 }} />
            ) : (
                <AppExpandableTable<Announcement>
                    columns={[
                        {
                            name: 'Status',
                            width: '80px',
                            cell: (row) => !row.isSeen ? (
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }} />
                            ) : null
                        },
                        {
                            name: 'Title',
                            selector: (row) => row.title,
                            sortable: true,
                            cell: (row) => (
                                <Stack spacing={0.5}>
                                    <Typography variant="body2" fontWeight={row.isSeen ? 500 : 700}>
                                        {row.title}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        {row.priority === 'urgent' && <Chip size="small" label="Urgent" color="error" variant="filled" />}
                                        {row.priority === 'high' && <Chip size="small" label="High" color="warning" variant="filled" />}
                                    </Box>
                                </Stack>
                            )
                        },
                        {
                            name: 'Category',
                            width: '150px',
                            cell: (row) => (
                                <Chip
                                    size="small"
                                    label={row.category.toUpperCase()}
                                    color={categoryColors[row.category]}
                                    variant="outlined"
                                />
                            )
                        },
                        {
                            name: 'Date',
                            width: '120px',
                            selector: (row) => formatDate(row.publishDate)
                        },
                        {
                            name: 'By',
                            width: '150px',
                            selector: (row) => row.createdByName || 'N/A'
                        }
                    ]}
                    data={announcements}
                    expandableRowsComponent={({ data: row }) => (
                        <Box sx={{ p: 4, bgcolor: 'background.default' }} onMouseEnter={() => !row.isSeen && handleExpand(row.announcementId, false)}>
                            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 3, maxWidth: 800 }}>
                                {row.content}
                            </Typography>

                            {row.attachments && row.attachments.length > 0 && (
                                <Box sx={{ mt: 3 }}>
                                    <Divider sx={{ mb: 2 }} />
                                    <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Attachments</Typography>
                                    <Stack direction="row" spacing={1} flexWrap="wrap">
                                        {row.attachments.map((att, i) => (
                                            <AppButton key={i} size="small" variant="outlined" startIcon={<AttachFileIcon />} onClick={() => handleViewFile(att)}>
                                                {att.fileName}
                                            </AppButton>
                                        ))}
                                    </Stack>
                                </Box>
                            )}

                            {row.createdBy === userId && (
                                <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1 }}>
                                    <AppButton size="small" variant="text" startIcon={<EditIcon />} onClick={() => handleOpenEditDialog(row)}>Edit</AppButton>
                                    <AppButton size="small" variant="text" color="error" startIcon={<DeleteIcon />} onClick={() => { setSelectedAnnouncement(row); setDeleteDialogOpen(true); }}>Archive</AppButton>
                                </Box>
                            )}
                        </Box>
                    )}
                />
            )}

            {/* File Viewer Dialog */}
            <Dialog
                open={viewerOpen}
                onClose={handleCloseViewer}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: { height: '90vh' }
                }}
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">{currentFile?.fileName}</Typography>
                        <Box>
                            <IconButton
                                component="a"
                                href={currentFile?.url}
                                download
                                target="_blank"
                                size="small"
                                sx={{ mr: 1 }}
                            >
                                <DownloadIcon />
                            </IconButton>
                            <IconButton onClick={handleCloseViewer} size="small">
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: 'grey.100' }}>
                    {currentFile && isImageType(currentFile.fileType, currentFile.fileName) && (
                        <Box
                            component="img"
                            src={currentFile.url}
                            alt={currentFile.fileName}
                            sx={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                            }}
                        />
                    )}
                    {currentFile && isPdfType(currentFile.fileType, currentFile.fileName) && (
                        <iframe
                            src={currentFile.url}
                            style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                            }}
                            title={currentFile.fileName}
                        />
                    )}
                    {currentFile && isDocumentType(currentFile.fileType, currentFile.fileName) && (
                        <iframe
                            src={`https://docs.google.com/viewer?url=${encodeURIComponent(currentFile.url)}&embedded=true`}
                            style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                            }}
                            title={currentFile.fileName}
                        />
                    )}
                    {currentFile &&
                        !isImageType(currentFile.fileType, currentFile.fileName) &&
                        !isPdfType(currentFile.fileType, currentFile.fileName) &&
                        !isDocumentType(currentFile.fileType, currentFile.fileName) && (
                            <Box sx={{ textAlign: 'center', p: 4 }}>
                                <AttachFileIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                                <Typography variant="body1" color="text.secondary">
                                    Preview not available for this file type
                                </Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<DownloadIcon />}
                                    href={currentFile.url}
                                    download
                                    target="_blank"
                                    sx={{ mt: 2 }}
                                >
                                    Download File
                                </Button>
                            </Box>
                        )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
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
            <Dialog open={formDialogOpen} onClose={handleCloseFormDialog} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>{editMode ? 'Edit Announcement' : 'Create New Announcement'}</DialogTitle>
                <DialogContent dividers sx={{ p: 3 }}>
                    <Stack spacing={3}>
                        <AppInput
                            fullWidth
                            label="Announcement Title"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            required
                            placeholder="e.g., Upcoming Sports Day"
                        />

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <AppSelect
                                    label="Category"
                                    value={formData.category}
                                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as AnnouncementCategory }))}
                                    options={[
                                        { value: 'general', label: 'General' },
                                        { value: 'academic', label: 'Academic' },
                                        { value: 'exam', label: 'Exam' },
                                        { value: 'holiday', label: 'Holiday' },
                                        { value: 'event', label: 'Event' },
                                        { value: 'fee', label: 'Fee' },
                                        { value: 'emergency', label: 'Emergency' },
                                    ]}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <AppSelect
                                    label="Priority"
                                    value={formData.priority}
                                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as AnnouncementPriority }))}
                                    options={[
                                        { value: 'low', label: 'Low' },
                                        { value: 'normal', label: 'Normal' },
                                        { value: 'high', label: 'High' },
                                        { value: 'urgent', label: 'Urgent' },
                                    ]}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <AppDatePicker
                                    label="Expiry Date"
                                    value={formData.expiryDate}
                                    onChange={(date: Date | null) => setFormData(prev => ({ ...prev, expiryDate: date }))}
                                    minDate={new Date()}
                                />
                            </Grid>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <AppSelect
                                label="Target Classes"
                                value={formData.targetClasses[0] || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, targetClasses: [e.target.value as string] }))}
                                options={classes.map((c: Class) => ({ value: c.classId, label: c.name }))}
                            />
                        </Grid>

                        <AppInput
                            fullWidth
                            multiline
                            rows={5}
                            label="Announcement Details"
                            value={formData.content}
                            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                            required
                            placeholder="Write your message here..."
                        />

                        <FileUpload
                            folder={IMAGEKIT_FOLDERS.ANNOUNCEMENTS}
                            baseFileName={`announcement_${schoolId}`}
                            currentAttachments={formData.attachments}
                            onUploadSuccess={(attachments: AnnouncementAttachment[]) => setFormData(prev => ({ ...prev, attachments }))}
                            label="Add Attachments"
                            maxFiles={5}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <AppButton onClick={handleCloseFormDialog} variant="text" color="inherit">Cancel</AppButton>
                    <AppButton
                        variant="contained"
                        onClick={handleFormSubmit}
                        loading={createAnnouncement.isPending || updateAnnouncement.isPending}
                    >
                        {editMode ? 'Update Announcement' : 'Publish Announcement'}
                    </AppButton>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Announcements;
