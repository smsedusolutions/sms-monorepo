import React, { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Chip,
    Alert,
    Skeleton,
    Button,
    Paper,
    Stack,
    TextField,
    InputAdornment,
    Tabs,
    Tab,
    Avatar,
} from '@mui/material';
import {
    Assignment as AssignmentIcon,
    CalendarToday as CalendarIcon,
    AttachFile as AttachFileIcon,
    Warning as WarningIcon,
    Search as SearchIcon,
    CheckCircle as DoneIcon,
    Badge as BadgeIcon,
    Person as PersonIcon,
    School as SchoolIcon,
    ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useChildSelector } from '../../context/ChildSelectorContext';
import { useGetHomeworkByStudent } from '../../queries/Homework';
import TokenService from '../../queries/token/tokenService';
import { useUrlTab } from '../../hooks/useUrlTab';
import type { Homework } from '../../types';

const ParentHomework: React.FC = () => {
    const navigate = useNavigate();
    const schoolId = TokenService.getSchoolId() || '';
    const { selectedChild, setSelectedChild, children: contextChildren, isLoading: loadingChild } = useChildSelector();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTab, setSelectedTab] = useUrlTab(0, ['all', 'active', 'overdue']); // 0: All, 1: Pending, 2: Overdue

    const { data, isLoading, error } = useGetHomeworkByStudent(
        schoolId,
        selectedChild?.studentId || ''
    );

    const homeworkList: Homework[] = data?.data || [];

    const isOverdue = (dueDate: string) => {
        const due = new Date(dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return due < today;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    // Filter homework by tab and search
    const filteredHomework = useMemo(() => {
        return homeworkList.filter(hw => {
            const overdue = isOverdue(hw.dueDate);
            if (selectedTab === 1 && overdue) return false;
            if (selectedTab === 2 && !overdue) return false;

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const titleMatch = (hw.title || '').toLowerCase().includes(q);
                const descMatch = (hw.description || '').toLowerCase().includes(q);
                const subjectMatch = (hw.subjectName || hw.subjectId || '').toLowerCase().includes(q);
                return titleMatch || descMatch || subjectMatch;
            }
            return true;
        });
    }, [homeworkList, selectedTab, searchQuery]);

    // Show loading skeleton while children are being loaded
    if (loadingChild) {
        return (
            <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1300, mx: 'auto' }}>
                <Skeleton variant="text" width="40%" height={45} sx={{ mb: 1 }} />
                <Skeleton variant="text" width="25%" height={25} sx={{ mb: 3 }} />
                <Grid container spacing={3}>
                    {[1, 2].map((i) => (
                        <Grid size={{ xs: 12, md: 6 }} key={i}>
                            <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 4 }} />
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    }

    if (!selectedChild) {
        return (
            <Box sx={{ p: 3, maxWidth: 1300, mx: 'auto' }}>
                <Alert severity="info" sx={{ borderRadius: 2 }}>Please select a child to view their homework assignments.</Alert>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3, maxWidth: 1300, mx: 'auto' }}>
                <Alert severity="error" sx={{ borderRadius: 2 }}>Failed to load homework assignments. Please try again later.</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1300, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                    <Box sx={{ p: 1.25, borderRadius: 2.5, bgcolor: '#fff7ed', color: '#ea580c' }}>
                        <AssignmentIcon sx={{ fontSize: 28 }} />
                    </Box>
                    <Box>
                        <Typography variant="h4" fontWeight={800} color="#1e293b" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                            Homework & Assignments
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Track homework tasks for {selectedChild.firstName} {selectedChild.lastName} ({selectedChild.className ? `Grade ${selectedChild.className}-${selectedChild.sectionName}` : 'Class'})
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* ── Multi-Child Switcher Bar ── */}
            {contextChildren.length > 1 && (
                <Paper elevation={0} sx={{ p: 2, mb: 2.5, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5, display: 'block' }}>
                        Select Child
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
                        {contextChildren.map((child) => {
                            const isSelected = selectedChild?.studentId === child.studentId;
                            return (
                                <Button
                                    key={child.studentId}
                                    variant={isSelected ? 'contained' : 'outlined'}
                                    size="small"
                                    onClick={() => setSelectedChild(child)}
                                    startIcon={<BadgeIcon fontSize="small" />}
                                    sx={{
                                        borderRadius: '20px',
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        px: 2,
                                        py: 0.75,
                                        fontSize: '0.8125rem',
                                        flexShrink: 0,
                                        bgcolor: isSelected ? '#4f46e5' : '#ffffff',
                                        color: isSelected ? '#ffffff' : '#475569',
                                        borderColor: isSelected ? '#4f46e5' : '#cbd5e1',
                                        boxShadow: isSelected ? '0 2px 8px rgba(79, 70, 229, 0.25)' : 'none',
                                        '&:hover': {
                                            bgcolor: isSelected ? '#4338ca' : '#f1f5f9',
                                            borderColor: isSelected ? '#4338ca' : '#94a3b8',
                                        }
                                    }}
                                >
                                    {child.firstName} {child.lastName} {child.className ? `(${child.className}${child.sectionName ? `-${child.sectionName}` : ''})` : ''}
                                </Button>
                            );
                        })}
                    </Box>
                </Paper>
            )}

            {/* Search & Filter Controls */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Tabs
                    value={selectedTab}
                    onChange={(_, val) => setSelectedTab(val)}
                    sx={{
                        '& .MuiTab-root': { fontWeight: 700, textTransform: 'none' }
                    }}
                >
                    <Tab label={`All (${homeworkList.length})`} />
                    <Tab label={`Active / Due`} />
                    <Tab label={`Overdue`} />
                </Tabs>

                <TextField
                    size="small"
                    placeholder="Search by title, subject..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{
                        width: { xs: '100%', sm: 300 },
                        bgcolor: '#ffffff',
                        '& .MuiOutlinedInput-root': { borderRadius: 2 }
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: '#94a3b8' }} />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

            {/* Content Area */}
            {isLoading ? (
                <Grid container spacing={3}>
                    {[1, 2].map((i) => (
                        <Grid size={{ xs: 12, md: 6 }} key={i}>
                            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 4 }} />
                        </Grid>
                    ))}
                </Grid>
            ) : homeworkList.length === 0 ? (
                /* ── Full-Page Rich Empty State Container ── */
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 4, sm: 6 },
                        borderRadius: 4,
                        border: '1px solid #e2e8f0',
                        bgcolor: '#ffffff',
                        textAlign: 'center',
                        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.04)',
                    }}
                >
                    {/* Centered Icon */}
                    <Box
                        sx={{
                            width: 88,
                            height: 88,
                            borderRadius: '50%',
                            bgcolor: '#f0fdf4',
                            border: '2px solid #bbf7d0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 'auto',
                            mb: 2.5,
                            boxShadow: '0 12px 24px -6px rgba(16, 185, 129, 0.2)'
                        }}
                    >
                        <DoneIcon sx={{ fontSize: 44, color: '#10b981' }} />
                    </Box>

                    <Typography variant="h5" fontWeight={800} color="#1e293b" sx={{ mb: 1 }}>
                        All Homework Up To Date!
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', mb: 4, lineHeight: 1.6 }}>
                        No pending homework assignments found for <strong>{selectedChild.firstName}</strong>. Subject teachers will upload new assignments, worksheets, and project tasks here.
                    </Typography>

                    {/* Informational Cards */}
                    <Grid container spacing={2.5} sx={{ maxWidth: 850, mx: 'auto', mb: 4, textAlign: 'left' }}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', height: '100%' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: '#2563eb' }}>
                                    <SchoolIcon fontSize="small" />
                                    <Typography variant="subtitle2" fontWeight={700} color="#1e293b">Class Syllabus</Typography>
                                </Box>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.5 }}>
                                    Keep track of daily class subjects and study goals with teachers.
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', height: '100%' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: '#8b5cf6' }}>
                                    <PersonIcon fontSize="small" />
                                    <Typography variant="subtitle2" fontWeight={700} color="#1e293b">Contact Teachers</Typography>
                                </Box>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.5 }}>
                                    Need help with assignments? Reach out to subject teachers directly.
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', height: '100%' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: '#f59e0b' }}>
                                    <CalendarIcon fontSize="small" />
                                    <Typography variant="subtitle2" fontWeight={700} color="#1e293b">Timetable</Typography>
                                </Box>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.5 }}>
                                    Review daily subject schedules to prepare books in advance.
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>

                    {/* Actions */}
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                        <Button
                            variant="contained"
                            endIcon={<ArrowForwardIcon />}
                            onClick={() => navigate('/parent/timetable')}
                            sx={{
                                bgcolor: '#2563eb',
                                '&:hover': { bgcolor: '#1d4ed8' },
                                borderRadius: 2.5,
                                fontWeight: 700,
                                px: 3.5,
                                py: 1.2,
                                textTransform: 'none'
                            }}
                        >
                            View Class Timetable
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => navigate('/parent/teachers')}
                            sx={{
                                borderRadius: 2.5,
                                fontWeight: 700,
                                px: 3.5,
                                py: 1.2,
                                textTransform: 'none',
                                borderColor: '#cbd5e1',
                                color: '#475569',
                                '&:hover': { borderColor: '#2563eb', bgcolor: '#f0f9ff' }
                            }}
                        >
                            Contact Subject Teachers
                        </Button>
                    </Stack>
                </Paper>
            ) : filteredHomework.length === 0 ? (
                <Paper elevation={0} sx={{ p: 5, textAlign: 'center', borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                    <SearchIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1.5 }} />
                    <Typography variant="h6" fontWeight={700} color="#1e293b">No matching homework found</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Try clearing your search or switching filter tabs.
                    </Typography>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {filteredHomework.map((hw: Homework) => {
                        const overdue = isOverdue(hw.dueDate);
                        return (
                            <Grid size={{ xs: 12, md: 6 }} key={hw.homeworkId}>
                                <Card
                                    elevation={0}
                                    sx={{
                                        height: '100%',
                                        borderRadius: 4,
                                        border: '1px solid',
                                        borderColor: overdue ? '#fca5a5' : '#e2e8f0',
                                        bgcolor: '#ffffff',
                                        boxShadow: overdue
                                            ? '0 6px 20px -6px rgba(239, 68, 68, 0.15)'
                                            : '0 4px 16px rgba(0,0,0,0.04)',
                                        transition: 'all 0.2s ease',
                                        '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }
                                    }}
                                >
                                    <CardContent sx={{ p: 3 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5, gap: 1 }}>
                                            <Typography variant="h6" fontWeight={800} color="#1e293b">
                                                {hw.title}
                                            </Typography>
                                            {overdue ? (
                                                <Chip
                                                    size="small"
                                                    icon={<WarningIcon sx={{ fontSize: '14px !important' }} />}
                                                    label="Overdue"
                                                    color="error"
                                                    sx={{ fontWeight: 700, height: 24 }}
                                                />
                                            ) : (
                                                <Chip
                                                    size="small"
                                                    label="Active"
                                                    color="success"
                                                    sx={{ fontWeight: 700, height: 24 }}
                                                />
                                            )}
                                        </Box>

                                        <Chip
                                            size="small"
                                            label={hw.subjectName || hw.subjectId}
                                            sx={{
                                                mb: 2,
                                                fontWeight: 700,
                                                bgcolor: '#eff6ff',
                                                color: '#2563eb',
                                                border: '1px solid #bfdbfe'
                                            }}
                                        />

                                        <Typography
                                            variant="body2"
                                            color="#475569"
                                            sx={{
                                                mb: 2.5,
                                                lineHeight: 1.6,
                                                display: '-webkit-box',
                                                WebkitLineClamp: 3,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            {hw.description}
                                        </Typography>

                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, pt: 1.5, borderTop: '1px solid #f1f5f9' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CalendarIcon fontSize="small" sx={{ color: overdue ? '#ef4444' : '#64748b' }} />
                                                <Typography variant="caption" fontWeight={700} color={overdue ? 'error.main' : 'text.secondary'}>
                                                    Due: {formatDate(hw.dueDate)}
                                                </Typography>
                                            </Box>

                                            {hw.attachmentUrl && (
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    startIcon={<AttachFileIcon />}
                                                    href={hw.attachmentUrl}
                                                    target="_blank"
                                                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                                                >
                                                    Attachment
                                                </Button>
                                            )}
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
                                            <Avatar sx={{ width: 22, height: 22, fontSize: '0.7rem', bgcolor: '#e2e8f0', color: '#475569' }}>
                                                {hw.teacherName?.[0] || 'T'}
                                            </Avatar>
                                            <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                                Assigned by: <strong>{hw.teacherName || 'Subject Teacher'}</strong>
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}
        </Box>
    );
};

export default ParentHomework;
