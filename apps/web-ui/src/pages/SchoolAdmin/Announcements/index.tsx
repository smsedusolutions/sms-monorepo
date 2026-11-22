import React, { useState, useMemo } from 'react';
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
    InputAdornment,
    Tooltip,
    useTheme,
    alpha,
    Fade,
    Divider,
} from '@mui/material';
import {
    Add as AddIcon,
    Campaign as AnnouncementIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Close as CloseIcon,
    AttachFile as AttachFileIcon,
    Search as SearchIcon,
    CalendarToday as CalendarIcon,
    FilterList as FilterIcon,
    RestartAlt as ResetIcon,
    Visibility as ViewIcon,
    Download as DownloadIcon,
    WarningAmber as WarningIcon,
    EventNote as EventIcon,
    School as SchoolIcon,
} from '@mui/icons-material';
import {
    useGetAnnouncements,
    useDeleteAnnouncement,
    useCreateAnnouncement,
    useUpdateAnnouncement,
    type AnnouncementFilters,
} from '../../../queries/Announcement';
import { useGetClasses } from '../../../queries/Class';
import TokenService from '../../../queries/token/tokenService';
import { useUrlTab } from '../../../hooks/useUrlTab';
import { useIsMobile } from '../../../hooks/useIsMobile';
import FileUpload from '../../../components/FileUpload/FileUpload';
import { IMAGEKIT_FOLDERS } from '../../../utils/imagekit';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import type {
    Announcement,
    AnnouncementCategory,
    AnnouncementPriority,
    AnnouncementTargetAudience,
    AnnouncementAttachment,
} from '../../../types';

type DatePreset = 'all' | 'today' | 'this_week' | 'this_month' | 'custom';

const SchoolAdminAnnouncements: React.FC = () => {
    const theme = useTheme();
    const isMobile = useIsMobile();
    const schoolId = TokenService.getSchoolId() || '';
    const role = TokenService.getRole();

    const [tabValue, setTabValue] = useUrlTab(0, ['active', 'archived', 'all']);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [viewAnnouncement, setViewAnnouncement] = useState<Announcement | null>(null);

    // ── Filter State ──
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');
    const [audienceFilter, setAudienceFilter] = useState<string>('all');
    const [datePreset, setDatePreset] = useState<DatePreset>('all');
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);

    const statusFilter = tabValue === 0 ? 'active' : tabValue === 1 ? 'archived' : 'all';

    // Helper to calculate preset date boundaries
    const dateRangeValues = useMemo(() => {
        if (datePreset === 'today') {
            const todayStr = new Date().toISOString().split('T')[0];
            return { start: todayStr, end: todayStr };
        }
        if (datePreset === 'this_week') {
            const now = new Date();
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
            const start = new Date(now.setDate(diff));
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            return {
                start: start.toISOString().split('T')[0],
                end: end.toISOString().split('T')[0],
            };
        }
        if (datePreset === 'this_month') {
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            return {
                start: start.toISOString().split('T')[0],
                end: end.toISOString().split('T')[0],
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

    // Build backend query parameters
    const queryFilters: AnnouncementFilters = useMemo(() => {
        return {
            status: statusFilter,
            category: categoryFilter !== 'all' ? categoryFilter : undefined,
            priority: priorityFilter !== 'all' ? priorityFilter : undefined,
            targetAudience: audienceFilter !== 'all' ? audienceFilter : undefined,
            search: searchQuery.trim() || undefined,
            startDate: dateRangeValues.start,
            endDate: dateRangeValues.end,
            limit: 100,
        };
    }, [statusFilter, categoryFilter, priorityFilter, audienceFilter, searchQuery, dateRangeValues]);

    const { data, isLoading, error, refetch } = useGetAnnouncements(schoolId, queryFilters);
    const deleteAnnouncement = useDeleteAnnouncement(schoolId);
    const createAnnouncement = useCreateAnnouncement(schoolId);
    const updateAnnouncement = useUpdateAnnouncement(schoolId);

    const { data: classesData } = useGetClasses(schoolId);
    const classes = classesData?.data || [];
    const rawAnnouncements = data?.data || [];

    // Client-side filtering pass for instant responsiveness while typing
    const announcements = useMemo(() => {
        return rawAnnouncements.filter((ann) => {
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchTitle = (ann.title || '').toLowerCase().includes(q);
                const matchContent = (ann.content || '').toLowerCase().includes(q);
                if (!matchTitle && !matchContent) return false;
            }
            if (categoryFilter !== 'all' && ann.category !== categoryFilter) {
                return false;
            }
            if (priorityFilter !== 'all' && ann.priority !== priorityFilter) {
                return false;
            }
            if (audienceFilter !== 'all' && ann.targetAudience !== audienceFilter) {
                return false;
            }
            if (dateRangeValues.start) {
                const annDate = new Date(ann.publishDate || ann.createdAt || '').getTime();
                const startMs = new Date(dateRangeValues.start).getTime();
                if (annDate < startMs) return false;
            }
            if (dateRangeValues.end) {
                const annDate = new Date(ann.publishDate || ann.createdAt || '').getTime();
                const endMs = new Date(dateRangeValues.end).setHours(23, 59, 59, 999);
                if (annDate > endMs) return false;
            }
            return true;
        });
    }, [rawAnnouncements, searchQuery, categoryFilter, priorityFilter, audienceFilter, dateRangeValues]);

    // Check if any non-default filter is applied
    const hasActiveFilters =
        searchQuery.trim() !== '' ||
        categoryFilter !== 'all' ||
        priorityFilter !== 'all' ||
        audienceFilter !== 'all' ||
        datePreset !== 'all' ||
        startDate !== null ||
        endDate !== null;

    const handleResetFilters = () => {
        setSearchQuery('');
        setCategoryFilter('all');
        setPriorityFilter('all');
        setAudienceFilter('all');
        setDatePreset('all');
        setStartDate(null);
        setEndDate(null);
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
        } catch (err) {
            console.error('Error saving announcement:', err);
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

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const getPriorityBorder = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return theme.palette.error.main;
            case 'high':
                return theme.palette.warning.main;
            case 'low':
                return theme.palette.info.main;
            default:
                return theme.palette.primary.main;
        }
    };

    const getPriorityColor = (priority: string): 'error' | 'warning' | 'info' | 'primary' => {
        switch (priority) {
            case 'urgent':
                return 'error';
            case 'high':
                return 'warning';
            case 'low':
                return 'info';
            default:
                return 'primary';
        }
    };

    if (error) {
        return (
            <Box sx={{ p: isMobile ? 1.5 : 3 }}>
                <Alert severity="error">Failed to load announcements. Please try again later.</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 } }}>
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: 2,
                    mb: 3,
                }}
            >
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 0.5 }}>
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 2,
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.primary.main,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <AnnouncementIcon />
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: theme.palette.text.primary }}>
                            Announcements & Circulars
                        </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        Broadcast and manage academic notices, event circulars, and school communications
                    </Typography>
                </Box>

                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenCreateDialog}
                    sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 700,
                        px: 2.5,
                        py: 1,
                        boxShadow: 'none',
                        '&:hover': { boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}` },
                    }}
                >
                    Create Announcement
                </Button>
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
                            md: '2fr 1fr 1fr 1fr 1fr',
                        },
                        gap: 1.5,
                        alignItems: 'center',
                        mb: 1.5,
                    }}
                >
                    {/* Search Field */}
                    <TextField
                        size="small"
                        placeholder="Search by title or keyword..."
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
                        <MenuItem value="urgent">Urgent</MenuItem>
                        <MenuItem value="high">High</MenuItem>
                        <MenuItem value="normal">Normal</MenuItem>
                        <MenuItem value="low">Low</MenuItem>
                    </TextField>

                    {/* Audience Filter */}
                    <TextField
                        select
                        size="small"
                        label="Audience"
                        value={audienceFilter}
                        onChange={(e) => setAudienceFilter(e.target.value)}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                bgcolor: theme.palette.background.default,
                            },
                        }}
                    >
                        <MenuItem value="all">All Audiences</MenuItem>
                        <MenuItem value="students">Students</MenuItem>
                        <MenuItem value="parents">Parents</MenuItem>
                        <MenuItem value="teachers">Teachers</MenuItem>
                        <MenuItem value="specific_class">Specific Classes</MenuItem>
                    </TextField>
                </Box>

                {/* Custom Date Pickers (when custom range is chosen) */}
                {datePreset === 'custom' && (
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <Box
                            sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                gap: 2,
                                p: 1.5,
                                mb: 1.5,
                                borderRadius: 2,
                                bgcolor: alpha(theme.palette.primary.main, 0.04),
                                border: '1px dashed',
                                borderColor: alpha(theme.palette.primary.main, 0.25),
                            }}
                        >
                            <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                                Custom Range:
                            </Typography>
                            <DatePicker
                                label="From Date"
                                value={startDate}
                                onChange={(date) => setStartDate(date)}
                                slotProps={{
                                    textField: {
                                        size: 'small',
                                        sx: { minWidth: 160, bgcolor: theme.palette.background.paper, borderRadius: 2 },
                                    },
                                }}
                            />
                            <DatePicker
                                label="To Date"
                                value={endDate}
                                onChange={(date) => setEndDate(date)}
                                slotProps={{
                                    textField: {
                                        size: 'small',
                                        sx: { minWidth: 160, bgcolor: theme.palette.background.paper, borderRadius: 2 },
                                    },
                                }}
                            />
                        </Box>
                    </LocalizationProvider>
                )}

                {/* Tabs & Active Filter Summary Row */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        alignItems: { xs: 'flex-start', md: 'center' },
                        justifyContent: 'space-between',
                        gap: 1.5,
                        pt: 1,
                        borderTop: '1px solid',
                        borderColor: theme.palette.divider,
                    }}
                >
                    {/* Status Tabs */}
                    <Tabs
                        value={tabValue}
                        onChange={(_, v) => setTabValue(v)}
                        sx={{
                            minHeight: 36,
                            '& .MuiTab-root': {
                                minHeight: 36,
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '0.82rem',
                                py: 0.5,
                                px: 2,
                                borderRadius: 1.5,
                                '&.Mui-selected': {
                                    fontWeight: 700,
                                    color: theme.palette.primary.main,
                                },
                            },
                        }}
                    >
                        <Tab label="Active Notices" />
                        <Tab label="Archived" />
                        <Tab label="All Notices" />
                    </Tabs>

                    {/* Active Filter Chips & Reset Button */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        {hasActiveFilters && (
                            <>
                                {searchQuery && (
                                    <Chip
                                        size="small"
                                        label={`Search: "${searchQuery}"`}
                                        onDelete={() => setSearchQuery('')}
                                        sx={{ borderRadius: 1.5, fontSize: '0.75rem' }}
                                    />
                                )}
                                {categoryFilter !== 'all' && (
                                    <Chip
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                        label={`Category: ${categoryFilter}`}
                                        onDelete={() => setCategoryFilter('all')}
                                        sx={{ borderRadius: 1.5, fontSize: '0.75rem' }}
                                    />
                                )}
                                {priorityFilter !== 'all' && (
                                    <Chip
                                        size="small"
                                        color={getPriorityColor(priorityFilter)}
                                        variant="outlined"
                                        label={`Priority: ${priorityFilter}`}
                                        onDelete={() => setPriorityFilter('all')}
                                        sx={{ borderRadius: 1.5, fontSize: '0.75rem' }}
                                    />
                                )}
                                {audienceFilter !== 'all' && (
                                    <Chip
                                        size="small"
                                        variant="outlined"
                                        label={`Audience: ${audienceFilter}`}
                                        onDelete={() => setAudienceFilter('all')}
                                        sx={{ borderRadius: 1.5, fontSize: '0.75rem' }}
                                    />
                                )}
                                {datePreset !== 'all' && (
                                    <Chip
                                        size="small"
                                        icon={<CalendarIcon sx={{ fontSize: '13px !important' }} />}
                                        label={
                                            datePreset === 'custom'
                                                ? `${formatDate(dateRangeValues.start)} - ${formatDate(dateRangeValues.end)}`
                                                : datePreset.replace('_', ' ')
                                        }
                                        onDelete={() => {
                                            setDatePreset('all');
                                            setStartDate(null);
                                            setEndDate(null);
                                        }}
                                        sx={{ borderRadius: 1.5, fontSize: '0.75rem' }}
                                    />
                                )}
                                <Button
                                    size="small"
                                    color="inherit"
                                    startIcon={<ResetIcon fontSize="small" />}
                                    onClick={handleResetFilters}
                                    sx={{
                                        textTransform: 'none',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        color: theme.palette.text.secondary,
                                    }}
                                >
                                    Reset Filters
                                </Button>
                            </>
                        )}
                        <Typography
                            variant="caption"
                            sx={{ fontWeight: 600, color: theme.palette.text.secondary, ml: 'auto' }}
                        >
                            Showing {announcements.length} announcement{announcements.length === 1 ? '' : 's'}
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            {/* Announcement Grid */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
                    gap: 2.5,
                }}
            >
                {isLoading ? (
                    [1, 2, 3, 4, 5, 6].map((i) => (
                        <Paper
                            key={i}
                            elevation={0}
                            sx={{
                                p: 2.5,
                                borderRadius: 2.5,
                                border: '1px solid',
                                borderColor: theme.palette.divider,
                                bgcolor: theme.palette.background.paper,
                            }}
                        >
                            <Skeleton variant="text" width="60%" height={26} />
                            <Skeleton variant="text" width="40%" height={18} sx={{ mb: 2 }} />
                            <Skeleton variant="rectangular" height={70} sx={{ borderRadius: 1.5, mb: 2 }} />
                            <Skeleton variant="text" width="80%" height={20} />
                        </Paper>
                    ))
                ) : announcements.length === 0 ? (
                    <Box sx={{ gridColumn: '1 / -1' }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 4, sm: 6 },
                                textAlign: 'center',
                                borderRadius: 3,
                                border: '1px dashed',
                                borderColor: theme.palette.divider,
                                bgcolor: theme.palette.background.paper,
                            }}
                        >
                            <Box
                                sx={{
                                    width: 60,
                                    height: 60,
                                    borderRadius: '50%',
                                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                                    color: theme.palette.primary.main,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mx: 'auto',
                                    mb: 2,
                                }}
                            >
                                <AnnouncementIcon sx={{ fontSize: 32 }} />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 0.5 }}>
                                No announcements found
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ color: theme.palette.text.secondary, maxWidth: 420, mx: 'auto', mb: 2.5 }}
                            >
                                {hasActiveFilters
                                    ? 'No notices match the selected search criteria or date range. Try resetting filters.'
                                    : `There are currently no ${tabValue === 0 ? 'active' : tabValue === 1 ? 'archived' : ''} announcements published.`}
                            </Typography>
                            {hasActiveFilters ? (
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<ResetIcon />}
                                    onClick={handleResetFilters}
                                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                                >
                                    Clear Applied Filters
                                </Button>
                            ) : (
                                <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={<AddIcon />}
                                    onClick={handleOpenCreateDialog}
                                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                                >
                                    Create New Announcement
                                </Button>
                            )}
                        </Paper>
                    </Box>
                ) : (
                    announcements.map((ann: Announcement) => {
                        const audienceLabel =
                            ann.targetAudience === 'specific_class'
                                ? 'Specific Classes'
                                : ann.targetAudience.charAt(0).toUpperCase() + ann.targetAudience.slice(1);

                        const priorityBorder = getPriorityBorder(ann.priority);

                        return (
                            <Paper
                                key={ann.announcementId}
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    borderRadius: 2.5,
                                    border: '1px solid',
                                    borderColor: theme.palette.divider,
                                    bgcolor: theme.palette.background.paper,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    borderLeft: `4px solid ${priorityBorder}`,
                                    transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                                    '&:hover': {
                                        borderColor: alpha(theme.palette.primary.main, 0.4),
                                        boxShadow:
                                            theme.palette.mode === 'dark'
                                                ? '0 6px 20px rgba(0,0,0,0.4)'
                                                : '0 6px 20px rgba(15, 23, 42, 0.06)',
                                        transform: 'translateY(-2px)',
                                    },
                                }}
                            >
                                <Box>
                                    {/* Top Metadata Row: Category + Priority + Date */}
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            mb: 1.5,
                                            gap: 1,
                                            flexWrap: 'wrap',
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                            <Chip
                                                size="small"
                                                label={ann.category.toUpperCase()}
                                                sx={{
                                                    fontSize: '0.68rem',
                                                    fontWeight: 700,
                                                    borderRadius: 1.25,
                                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                    color: theme.palette.primary.main,
                                                    height: 22,
                                                }}
                                            />
                                            <Chip
                                                size="small"
                                                label={ann.priority.toUpperCase()}
                                                color={getPriorityColor(ann.priority)}
                                                variant="outlined"
                                                sx={{
                                                    fontSize: '0.65rem',
                                                    fontWeight: 700,
                                                    borderRadius: 1.25,
                                                    height: 22,
                                                }}
                                            />
                                        </Box>
                                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                                            {formatDate(ann.publishDate)}
                                        </Typography>
                                    </Box>

                                    {/* Title */}
                                    <Typography
                                        variant="subtitle1"
                                        onClick={() => {
                                            setViewAnnouncement(ann);
                                            setViewDialogOpen(true);
                                        }}
                                        sx={{
                                            fontWeight: 800,
                                            color: theme.palette.text.primary,
                                            lineHeight: 1.35,
                                            mb: 1,
                                            cursor: 'pointer',
                                            '&:hover': { color: theme.palette.primary.main },
                                        }}
                                    >
                                        {ann.title}
                                    </Typography>

                                    {/* Content Excerpt */}
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: theme.palette.text.secondary,
                                            lineHeight: 1.6,
                                            mb: 2,
                                            display: '-webkit-box',
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {ann.content}
                                    </Typography>

                                    {/* Attachments preview pill if present */}
                                    {ann.attachments && ann.attachments.length > 0 && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                                            <Chip
                                                size="small"
                                                icon={<AttachFileIcon sx={{ fontSize: '13px !important' }} />}
                                                label={`${ann.attachments.length} Attachment${ann.attachments.length > 1 ? 's' : ''}`}
                                                variant="outlined"
                                                sx={{
                                                    height: 22,
                                                    fontSize: '0.7rem',
                                                    bgcolor: alpha(theme.palette.divider, 0.2),
                                                    borderRadius: 1.25,
                                                }}
                                            />
                                        </Box>
                                    )}
                                </Box>

                                {/* Bottom Metadata & Actions */}
                                <Box
                                    sx={{
                                        pt: 1.5,
                                        borderTop: '1px solid',
                                        borderColor: theme.palette.divider,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            mb: 1.25,
                                        }}
                                    >
                                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                            By {ann.createdByName || 'School Admin'}
                                        </Typography>
                                        <Chip
                                            size="small"
                                            label={`Audience: ${audienceLabel}`}
                                            sx={{
                                                height: 20,
                                                fontSize: '0.68rem',
                                                bgcolor: alpha(theme.palette.text.secondary, 0.08),
                                                color: theme.palette.text.secondary,
                                                fontWeight: 600,
                                                borderRadius: 1,
                                            }}
                                        />
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Button
                                            size="small"
                                            variant="text"
                                            startIcon={<ViewIcon fontSize="small" />}
                                            onClick={() => {
                                                setViewAnnouncement(ann);
                                                setViewDialogOpen(true);
                                            }}
                                            sx={{
                                                textTransform: 'none',
                                                fontWeight: 700,
                                                fontSize: '0.78rem',
                                                p: 0,
                                                color: theme.palette.primary.main,
                                            }}
                                        >
                                            View Notice
                                        </Button>

                                        {(role === 'sch_admin' || ann.createdBy === TokenService.getUserId()) && (
                                            <Box sx={{ display: 'flex', gap: 0.75 }}>
                                                <Tooltip title="Edit Notice">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleOpenEditDialog(ann)}
                                                        sx={{
                                                            border: '1px solid',
                                                            borderColor: theme.palette.divider,
                                                            borderRadius: 1.5,
                                                        }}
                                                    >
                                                        <EditIcon sx={{ fontSize: 15 }} />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Archive Notice">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => {
                                                            setSelectedAnnouncement(ann);
                                                            setDeleteDialogOpen(true);
                                                        }}
                                                        sx={{
                                                            border: '1px solid',
                                                            borderColor: alpha(theme.palette.error.main, 0.3),
                                                            borderRadius: 1.5,
                                                        }}
                                                    >
                                                        <DeleteIcon sx={{ fontSize: 15 }} />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            </Paper>
                        );
                    })
                )}
            </Box>

            {/* View Full Announcement Dialog */}
            <Dialog
                open={viewDialogOpen}
                onClose={() => setViewDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: theme.palette.divider,
                        bgcolor: theme.palette.background.paper,
                    },
                }}
            >
                {viewAnnouncement && (
                    <>
                        <DialogTitle
                            sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between',
                                pb: 1.5,
                                pt: 2.5,
                                px: 3,
                                borderBottom: '1px solid',
                                borderColor: theme.palette.divider,
                            }}
                        >
                            <Box sx={{ pr: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Chip
                                        size="small"
                                        label={viewAnnouncement.category.toUpperCase()}
                                        color="primary"
                                        sx={{ fontWeight: 700, borderRadius: 1.25, height: 22 }}
                                    />
                                    <Chip
                                        size="small"
                                        label={viewAnnouncement.priority.toUpperCase()}
                                        color={getPriorityColor(viewAnnouncement.priority)}
                                        variant="outlined"
                                        sx={{ fontWeight: 700, borderRadius: 1.25, height: 22 }}
                                    />
                                </Box>
                                <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.text.primary, lineHeight: 1.3 }}>
                                    {viewAnnouncement.title}
                                </Typography>
                                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, mt: 0.5, display: 'block' }}>
                                    Published on {formatDate(viewAnnouncement.publishDate)} • By {viewAnnouncement.createdByName || 'School Admin'}
                                </Typography>
                            </Box>
                            <IconButton onClick={() => setViewDialogOpen(false)} size="small">
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent sx={{ p: 3 }}>
                            {/* Targeted Audience Banner */}
                            <Box
                                sx={{
                                    p: 1.5,
                                    mb: 2.5,
                                    borderRadius: 2,
                                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                                    border: '1px solid',
                                    borderColor: alpha(theme.palette.primary.main, 0.15),
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: 1,
                                }}
                            >
                                <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                                    Target Audience:
                                </Typography>
                                <Chip
                                    size="small"
                                    label={
                                        viewAnnouncement.targetAudience === 'specific_class'
                                            ? `Classes: ${(viewAnnouncement.targetClasses || []).join(', ') || 'N/A'}`
                                            : viewAnnouncement.targetAudience.toUpperCase()
                                    }
                                    sx={{ fontWeight: 700, borderRadius: 1.5 }}
                                />
                            </Box>

                            {/* Full Content */}
                            <Typography
                                variant="body1"
                                sx={{
                                    whiteSpace: 'pre-wrap',
                                    lineHeight: 1.7,
                                    color: theme.palette.text.primary,
                                    mb: 3,
                                }}
                            >
                                {viewAnnouncement.content}
                            </Typography>

                            {/* Attachments Section */}
                            {viewAnnouncement.attachments && viewAnnouncement.attachments.length > 0 && (
                                <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: theme.palette.divider }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                                        Attached Files ({viewAnnouncement.attachments.length}):
                                    </Typography>
                                    <Stack spacing={1}>
                                        {viewAnnouncement.attachments.map((file, idx) => (
                                            <Paper
                                                key={idx}
                                                elevation={0}
                                                component="a"
                                                href={file.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    p: 1.25,
                                                    borderRadius: 2,
                                                    border: '1px solid',
                                                    borderColor: theme.palette.divider,
                                                    bgcolor: theme.palette.background.default,
                                                    textDecoration: 'none',
                                                    color: 'inherit',
                                                    '&:hover': {
                                                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                                                        borderColor: theme.palette.primary.main,
                                                    },
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <AttachFileIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {file.name || `Attachment ${idx + 1}`}
                                                    </Typography>
                                                </Box>
                                                <DownloadIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                                            </Paper>
                                        ))}
                                    </Stack>
                                </Box>
                            )}
                        </DialogContent>
                        <DialogActions sx={{ px: 3, pb: 2.5 }}>
                            <Button
                                variant="contained"
                                onClick={() => setViewDialogOpen(false)}
                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                            >
                                Close
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* Archive Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: theme.palette.divider,
                        bgcolor: theme.palette.background.paper,
                    },
                }}
            >
                <DialogTitle sx={{ fontWeight: 800 }}>Archive Announcement</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.6 }}>
                        Are you sure you want to archive <strong>"{selectedAnnouncement?.title}"</strong>? It will no longer be visible on active school portals.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setDeleteDialogOpen(false)} color="inherit" sx={{ textTransform: 'none', fontWeight: 600 }}>
                        Cancel
                    </Button>
                    <Button
                        color="error"
                        variant="contained"
                        onClick={handleDelete}
                        disabled={deleteAnnouncement.isPending}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
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
                PaperProps={{
                    sx: {
                        borderRadius: isMobile ? 0 : 3,
                        border: '1px solid',
                        borderColor: theme.palette.divider,
                        bgcolor: theme.palette.background.paper,
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        pb: 1.5,
                        pt: 2,
                        px: { xs: 2, sm: 3 },
                        borderBottom: '1px solid',
                        borderColor: theme.palette.divider,
                    }}
                >
                    <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.text.primary }}>
                        {editMode ? 'Edit Announcement' : 'Create New Announcement'}
                    </Typography>
                    <IconButton onClick={handleCloseFormDialog} size="small" sx={{ color: theme.palette.text.secondary }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Stack spacing={2.5} sx={{ mt: 1 }}>
                        <TextField
                            fullWidth
                            label="Announcement Title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g., Annual Sports Meet 2026-27 Schedule"
                            required
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />

                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                            <TextField
                                select
                                fullWidth
                                label="Category"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value as AnnouncementCategory })}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            >
                                <MenuItem value="general">General</MenuItem>
                                <MenuItem value="academic">Academic</MenuItem>
                                <MenuItem value="exam">Examination</MenuItem>
                                <MenuItem value="event">Event & Sports</MenuItem>
                                <MenuItem value="holiday">Holiday Notice</MenuItem>
                                <MenuItem value="fee">Fee Circular</MenuItem>
                                <MenuItem value="emergency">Emergency Alert</MenuItem>
                            </TextField>

                            <TextField
                                select
                                fullWidth
                                label="Priority"
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value as AnnouncementPriority })}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            >
                                <MenuItem value="low">Low</MenuItem>
                                <MenuItem value="normal">Normal</MenuItem>
                                <MenuItem value="high">High</MenuItem>
                                <MenuItem value="urgent">Urgent</MenuItem>
                            </TextField>
                        </Box>

                        <TextField
                            select
                            fullWidth
                            label="Target Audience"
                            value={formData.targetAudience}
                            onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as AnnouncementTargetAudience })}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        >
                            <MenuItem value="all">Entire School (Everyone)</MenuItem>
                            <MenuItem value="students">Students Only</MenuItem>
                            <MenuItem value="parents">Parents Only</MenuItem>
                            <MenuItem value="teachers">Teachers Only</MenuItem>
                            <MenuItem value="specific_class">Specific Classes</MenuItem>
                        </TextField>

                        {formData.targetAudience === 'specific_class' && (
                            <Box
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: theme.palette.divider,
                                    bgcolor: theme.palette.background.default,
                                }}
                            >
                                <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.text.secondary, mb: 1, display: 'block' }}>
                                    Select Target Classes:
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {classes.map((cls) => {
                                        const isSelected = formData.targetClasses.includes(cls.classId);
                                        return (
                                            <Chip
                                                key={cls.classId}
                                                label={cls.name}
                                                clickable
                                                color={isSelected ? 'primary' : 'default'}
                                                variant={isSelected ? 'filled' : 'outlined'}
                                                onClick={() => {
                                                    const updated = isSelected
                                                        ? formData.targetClasses.filter((id) => id !== cls.classId)
                                                        : [...formData.targetClasses, cls.classId];
                                                    setFormData({ ...formData, targetClasses: updated });
                                                }}
                                                sx={{ borderRadius: 1.5 }}
                                            />
                                        );
                                    })}
                                </Box>
                            </Box>
                        )}

                        <TextField
                            fullWidth
                            multiline
                            rows={5}
                            label="Announcement Body / Notice Text"
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            placeholder="Write the full announcement text here..."
                            required
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />

                        {/* Publication & Expiry Dates */}
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                                <DatePicker
                                    label="Publish Date"
                                    value={formData.publishDate}
                                    onChange={(date) => setFormData({ ...formData, publishDate: date })}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            sx: { '& .MuiOutlinedInput-root': { borderRadius: 2 } },
                                        },
                                    }}
                                />
                                <DatePicker
                                    label="Expiry Date (Optional)"
                                    value={formData.expiryDate}
                                    onChange={(date) => setFormData({ ...formData, expiryDate: date })}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            sx: { '& .MuiOutlinedInput-root': { borderRadius: 2 } },
                                        },
                                    }}
                                />
                            </Box>
                        </LocalizationProvider>

                        {/* File Upload Component */}
                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                                Notice Circulars & Documents (Optional)
                            </Typography>
                            <FileUpload
                                folder={IMAGEKIT_FOLDERS.ANNOUNCEMENTS}
                                multiple
                                onUploadSuccess={(url, file) => {
                                    const newAttachment: AnnouncementAttachment = {
                                        url,
                                        name: file.name,
                                        type: file.type,
                                        size: file.size,
                                    };
                                    setFormData((prev) => ({
                                        ...prev,
                                        attachments: [...prev.attachments, newAttachment],
                                    }));
                                }}
                            />
                            {formData.attachments.length > 0 && (
                                <Stack spacing={1} sx={{ mt: 1.5 }}>
                                    {formData.attachments.map((file, idx) => (
                                        <Box
                                            key={idx}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                p: 1,
                                                borderRadius: 1.5,
                                                border: '1px solid',
                                                borderColor: theme.palette.divider,
                                                bgcolor: theme.palette.background.default,
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <AttachFileIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                                                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                                    {file.name}
                                                </Typography>
                                            </Box>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => {
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        attachments: prev.attachments.filter((_, i) => i !== idx),
                                                    }));
                                                }}
                                            >
                                                <CloseIcon sx={{ fontSize: 14 }} />
                                            </IconButton>
                                        </Box>
                                    ))}
                                </Stack>
                            )}
                        </Box>
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: 2.5, pt: 1.5, borderTop: '1px solid', borderColor: theme.palette.divider }}>
                    <Button onClick={handleCloseFormDialog} color="inherit" sx={{ textTransform: 'none', fontWeight: 600 }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleFormSubmit}
                        disabled={createAnnouncement.isPending || updateAnnouncement.isPending || !formData.title.trim() || !formData.content.trim()}
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 700,
                            px: 3,
                        }}
                    >
                        {createAnnouncement.isPending || updateAnnouncement.isPending
                            ? 'Saving...'
                            : editMode
                            ? 'Update Announcement'
                            : 'Publish Announcement'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SchoolAdminAnnouncements;
