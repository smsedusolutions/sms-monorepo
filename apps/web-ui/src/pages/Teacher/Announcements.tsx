import React, { useState, useMemo } from 'react';
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
    Paper,
    TextField,
    MenuItem,
    InputAdornment,
    useTheme,
    alpha,
} from '@mui/material';
import {
    Announcement as AnnouncementIcon,
    AttachFile as AttachFileIcon,
    Add as AddIcon,
    Close as CloseIcon,
    Download as DownloadIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    CalendarToday as CalendarIcon,
    RestartAlt as ResetIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
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
    useUpdateAnnouncement,
    type AnnouncementFilters,
} from '../../queries/Announcement';
import { useGetClasses } from '../../queries/Class';
import FileUpload from '../../components/FileUpload/FileUpload';

type DatePreset = 'all' | 'today' | 'this_week' | 'this_month' | 'custom';
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
    const theme = useTheme();
    const schoolId = TokenService.getSchoolId() || '';
    const userId = TokenService.getUserId() || '';

    const [tabValue, setTabValue] = useUrlTab(0, ['all', 'mine']);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [currentFile, setCurrentFile] = useState<AnnouncementAttachment | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [datePreset, setDatePreset] = useState<DatePreset>('all');
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);

    // Compute active date boundaries
    const dateRangeValues = useMemo(() => {
        const now = new Date();
        if (datePreset === 'today') {
            const todayStr = now.toISOString().split('T')[0];
            return { start: todayStr, end: todayStr };
        }
        if (datePreset === 'this_week') {
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(now.setDate(diff));
            return {
                start: monday.toISOString().split('T')[0],
                end: new Date().toISOString().split('T')[0],
            };
        }
        if (datePreset === 'this_month') {
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            return {
                start: firstDay.toISOString().split('T')[0],
                end: new Date().toISOString().split('T')[0],
            };
        }
        if (datePreset === 'custom') {
            return {
                start: startDate ? startDate.toISOString().split('T')[0] : undefined,
                end: endDate ? endDate.toISOString().split('T')[0] : undefined,
            };
        }
        return { start: undefined, end: undefined };
    }, [datePreset, startDate, endDate]);

    const queryFilters: AnnouncementFilters = useMemo(() => ({
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        search: searchQuery.trim() || undefined,
        startDate: dateRangeValues.start,
        endDate: dateRangeValues.end,
    }), [categoryFilter, priorityFilter, searchQuery, dateRangeValues]);

    const { data, isLoading, error, refetch } = useGetAnnouncements(schoolId, queryFilters);
    const markAsSeen = useMarkAnnouncementSeen(schoolId);

    const deleteAnnouncement = useDeleteAnnouncement(schoolId);
    const createAnnouncement = useCreateAnnouncement(schoolId);
    const updateAnnouncement = useUpdateAnnouncement(schoolId);
    const { data: classesData } = useGetClasses(schoolId);

    const classes = classesData?.data || [];
    const allAnnouncements = data?.data || [];

    const handleResetFilters = () => {
        setSearchQuery('');
        setCategoryFilter('all');
        setPriorityFilter('all');
        setDatePreset('all');
        setStartDate(null);
        setEndDate(null);
    };

    const hasActiveFilters = Boolean(
        searchQuery.trim() ||
        categoryFilter !== 'all' ||
        priorityFilter !== 'all' ||
        datePreset !== 'all' ||
        startDate ||
        endDate
    );

    // Client-side filtering fallback
    const announcements = useMemo(() => {
        let list = tabValue === 0
            ? allAnnouncements
            : allAnnouncements.filter((ann: Announcement) => ann.createdBy === userId);

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(ann =>
                (ann.title || '').toLowerCase().includes(q) ||
                (ann.content || '').toLowerCase().includes(q)
            );
        }

        if (categoryFilter !== 'all') {
            list = list.filter(ann => ann.category === categoryFilter);
        }

        if (priorityFilter !== 'all') {
            list = list.filter(ann => ann.priority === priorityFilter);
        }

        if (datePreset !== 'all') {
            const now = new Date();
            let startMs = 0;
            let endMs = Infinity;

            if (datePreset === 'today') {
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                startMs = today.getTime();
                endMs = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
            } else if (datePreset === 'this_week') {
                const day = now.getDay();
                const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                const start = new Date(now.setDate(diff));
                start.setHours(0, 0, 0, 0);
                startMs = start.getTime();
            } else if (datePreset === 'this_month') {
                const start = new Date(now.getFullYear(), now.getMonth(), 1);
                startMs = start.getTime();
            } else if (datePreset === 'custom') {
                if (startDate) {
                    const s = new Date(startDate);
                    s.setHours(0, 0, 0, 0);
                    startMs = s.getTime();
                }
                if (endDate) {
                    const e = new Date(endDate);
                    e.setHours(23, 59, 59, 999);
                    endMs = e.getTime();
                }
            }

            list = list.filter(ann => {
                const annTime = new Date(ann.publishDate || ann.createdAt || '').getTime();
                return annTime >= startMs && annTime <= endMs;
            });
        }

        return list;
    }, [allAnnouncements, tabValue, userId, searchQuery, categoryFilter, priorityFilter, datePreset, startDate, endDate]);

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
            refetch();
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
            refetch();
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

            {/* Tabs Row */}
            <Box sx={{ mb: 2.5, borderBottom: '1px solid', borderColor: theme.palette.divider }}>
                <Tabs
                    value={tabValue}
                    onChange={(_, v) => setTabValue(v)}
                    sx={{
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            minHeight: 48,
                        },
                    }}
                >
                    <Tab
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <span>All Announcements</span>
                                <Chip
                                    size="small"
                                    label={allAnnouncements.length}
                                    sx={{ height: 20, fontSize: '0.75rem', fontWeight: 700 }}
                                />
                            </Box>
                        }
                    />
                    <Tab
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <span>Your Announcements</span>
                                <Chip
                                    size="small"
                                    label={allAnnouncements.filter((ann: Announcement) => ann.createdBy === userId).length}
                                    sx={{ height: 20, fontSize: '0.75rem', fontWeight: 700 }}
                                />
                            </Box>
                        }
                    />
                </Tabs>
            </Box>

            {/* Comprehensive Theme-Based Filter Bar */}
            <Paper
                elevation={0}
                sx={{
                    p: 2,
                    mb: 3,
                    borderRadius: 2.5,
                    border: '1px solid',
                    borderColor: theme.palette.divider,
                    bgcolor: theme.palette.background.paper,
                }}
            >
                {/* Search & Selectors Row */}
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: '1fr',
                            sm: 'repeat(2, 1fr)',
                            md: '2fr 1fr 1fr 1fr',
                        },
                        gap: 1.5,
                        alignItems: 'center',
                    }}
                >
                    {/* Search Field */}
                    <TextField
                        size="small"
                        placeholder="Search notices by title or content..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: theme.palette.text.secondary, fontSize: 18 }} />
                                </InputAdornment>
                            ),
                            endAdornment: searchQuery ? (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => setSearchQuery('')}>
                                        <CloseIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </InputAdornment>
                            ) : null,
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                bgcolor: theme.palette.background.default,
                            },
                        }}
                    />

                    {/* Date Range Preset */}
                    <TextField
                        select
                        size="small"
                        label="Date Range"
                        value={datePreset}
                        onChange={(e) => setDatePreset(e.target.value as DatePreset)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <CalendarIcon sx={{ color: theme.palette.text.secondary, fontSize: 18 }} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                bgcolor: theme.palette.background.default,
                            },
                        }}
                    >
                        <MenuItem value="all">All Time</MenuItem>
                        <MenuItem value="today">Today</MenuItem>
                        <MenuItem value="this_week">This Week</MenuItem>
                        <MenuItem value="this_month">This Month</MenuItem>
                        <MenuItem value="custom">Custom Date Range</MenuItem>
                    </TextField>

                    {/* Category Filter */}
                    <TextField
                        select
                        size="small"
                        label="Category"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                bgcolor: theme.palette.background.default,
                            },
                        }}
                    >
                        <MenuItem value="all">All Categories</MenuItem>
                        <MenuItem value="general">General</MenuItem>
                        <MenuItem value="academic">Academic</MenuItem>
                        <MenuItem value="exam">Examination</MenuItem>
                        <MenuItem value="event">Events & Sports</MenuItem>
                        <MenuItem value="holiday">Holiday Notice</MenuItem>
                        <MenuItem value="fee">Fee Circular</MenuItem>
                        <MenuItem value="emergency">Emergency / Alert</MenuItem>
                    </TextField>

                    {/* Priority Filter */}
                    <TextField
                        select
                        size="small"
                        label="Priority"
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                bgcolor: theme.palette.background.default,
                            },
                        }}
                    >
                        <MenuItem value="all">All Priorities</MenuItem>
                        <MenuItem value="normal">Normal</MenuItem>
                        <MenuItem value="urgent">Urgent</MenuItem>
                        <MenuItem value="high">High</MenuItem>
                        <MenuItem value="low">Low</MenuItem>
                    </TextField>
                </Box>

                {/* Custom Date Range Pickers (Expandable when Custom is selected) */}
                {datePreset === 'custom' && (
                    <Box
                        sx={{
                            mt: 2,
                            pt: 2,
                            borderTop: '1px dashed',
                            borderColor: theme.palette.divider,
                            display: 'flex',
                            gap: 2,
                            flexWrap: 'wrap',
                            alignItems: 'center',
                        }}
                    >
                        <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>
                            Custom Period:
                        </Typography>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                label="From Date"
                                value={startDate}
                                maxDate={endDate || undefined}
                                onChange={(val) => {
                                    setStartDate(val);
                                    if (val && endDate && val > endDate) {
                                        setEndDate(null);
                                    }
                                }}
                                slotProps={{
                                    textField: {
                                        size: 'small',
                                        sx: {
                                            minWidth: 160,
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                bgcolor: theme.palette.background.default,
                                            },
                                        },
                                    },
                                }}
                            />
                            <DatePicker
                                label="To Date"
                                value={endDate}
                                minDate={startDate || undefined}
                                referenceDate={startDate || undefined}
                                onChange={(val) => {
                                    setEndDate(val);
                                    if (val && startDate && val < startDate) {
                                        setStartDate(null);
                                    }
                                }}
                                slotProps={{
                                    textField: {
                                        size: 'small',
                                        sx: {
                                            minWidth: 160,
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                bgcolor: theme.palette.background.default,
                                            },
                                        },
                                    },
                                }}
                            />
                        </LocalizationProvider>
                    </Box>
                )}

                {/* Active Filter Chips & Reset */}
                {hasActiveFilters && (
                    <Box
                        sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            gap: 1,
                            mt: 2,
                            pt: 1.5,
                            borderTop: '1px solid',
                            borderColor: alpha(theme.palette.divider, 0.6),
                        }}
                    >
                        <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.text.secondary, mr: 0.5 }}>
                            Active Filters:
                        </Typography>

                        {searchQuery && (
                            <Chip
                                size="small"
                                label={`Search: "${searchQuery}"`}
                                onDelete={() => setSearchQuery('')}
                                sx={{ borderRadius: 1.5 }}
                            />
                        )}

                        {datePreset !== 'all' && (
                            <Chip
                                size="small"
                                label={`Date: ${
                                    datePreset === 'custom'
                                        ? `${startDate ? startDate.toLocaleDateString() : 'Start'} – ${endDate ? endDate.toLocaleDateString() : 'End'}`
                                        : datePreset.replace('_', ' ')
                                }`}
                                onDelete={() => {
                                    setDatePreset('all');
                                    setStartDate(null);
                                    setEndDate(null);
                                }}
                                sx={{ borderRadius: 1.5 }}
                            />
                        )}

                        {categoryFilter !== 'all' && (
                            <Chip
                                size="small"
                                label={`Category: ${categoryFilter}`}
                                onDelete={() => setCategoryFilter('all')}
                                sx={{ borderRadius: 1.5, textTransform: 'capitalize' }}
                            />
                        )}

                        {priorityFilter !== 'all' && (
                            <Chip
                                size="small"
                                label={`Priority: ${priorityFilter}`}
                                onDelete={() => setPriorityFilter('all')}
                                sx={{ borderRadius: 1.5, textTransform: 'capitalize' }}
                            />
                        )}

                        <Button
                            size="small"
                            variant="text"
                            color="inherit"
                            startIcon={<ResetIcon sx={{ fontSize: 16 }} />}
                            onClick={handleResetFilters}
                            sx={{
                                textTransform: 'none',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                ml: 'auto',
                                color: theme.palette.text.secondary,
                                '&:hover': { color: theme.palette.error.main },
                            }}
                        >
                            Reset Filters
                        </Button>
                    </Box>
                )}
            </Paper>

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
