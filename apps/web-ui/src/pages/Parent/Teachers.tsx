import React, { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Avatar,
    Chip,
    Alert,
    Skeleton,
    Divider,
    Button,
    InputAdornment,
    TextField,
    Tooltip,
    Paper,
    Stack,
    IconButton,
} from '@mui/material';
import {
    Person as PersonIcon,
    School as SchoolIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Star as StarIcon,
    Search as SearchIcon,
    ContentCopy as CopyIcon,
    Call as CallIcon,
    MenuBook as SubjectIcon,
    Badge as BadgeIcon,
    Chat as ChatIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useChildSelector } from '../../context/ChildSelectorContext';
import { useGetChildTeachers } from '../../queries/ParentPortal';
import TokenService from '../../queries/token/tokenService';
import type { ChildTeacherInfo } from '../../types';

const AVATAR_COLORS = [
    'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    'linear-gradient(135deg, #10b981 0%, #047857 100%)',
    'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
];

const ParentTeachers: React.FC = () => {
    const navigate = useNavigate();
    const schoolId = TokenService.getSchoolId() || '';
    const { selectedChild, setSelectedChild, children: contextChildren, isLoading: loadingChild } = useChildSelector();
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedText, setCopiedText] = useState<string | null>(null);

    const { data, isLoading, error } = useGetChildTeachers(
        schoolId,
        selectedChild?.studentId || ''
    );

    const teachers: ChildTeacherInfo[] = data?.data || [];

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedText(text);
        setTimeout(() => setCopiedText(null), 2000);
    };

    // Filter teachers by search query
    const filteredTeachers = useMemo(() => {
        if (!searchQuery.trim()) return teachers;
        const q = searchQuery.toLowerCase();
        return teachers.filter(t => {
            const name = `${t.firstName || ''} ${t.lastName || ''}`.toLowerCase();
            const subjects = (t.subjectNames || []).join(' ').toLowerCase();
            const email = (t.email || '').toLowerCase();
            return name.includes(q) || subjects.includes(q) || email.includes(q);
        });
    }, [teachers, searchQuery]);

    // Show loading skeleton while initializing
    if (loadingChild) {
        return (
            <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1300, mx: 'auto' }}>
                <Skeleton variant="text" width="40%" height={45} sx={{ mb: 1 }} />
                <Skeleton variant="text" width="25%" height={25} sx={{ mb: 3 }} />
                <Grid container spacing={3}>
                    {[1, 2, 3].map((i) => (
                        <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={i}>
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
                <Alert severity="info" sx={{ borderRadius: 3 }}>Please select a child to view their teachers.</Alert>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3, maxWidth: 1300, mx: 'auto' }}>
                <Alert severity="error" sx={{ borderRadius: 3 }}>Failed to load teacher information. Please try again later.</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1300, mx: 'auto' }}>
            {/* Page Header */}
            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                    <Box sx={{ p: 1.25, borderRadius: 2.5, bgcolor: '#eff6ff', color: '#2563eb' }}>
                        <PersonIcon sx={{ fontSize: 28 }} />
                    </Box>
                    <Box>
                        <Typography variant="h4" fontWeight={800} color="#1e293b" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                            Faculty & Teachers
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Teaching staff for {selectedChild.firstName} {selectedChild.lastName} ({selectedChild.className ? `Grade ${selectedChild.className}-${selectedChild.sectionName}` : 'Class'})
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* ── Multi-Child Switcher Bar ── */}
            {contextChildren.length > 1 && (
                <Paper elevation={0} sx={{ p: 2, mb: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
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

            {/* Search & Stats Bar */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <TextField
                    size="small"
                    placeholder="Search by teacher name or subject..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{
                        width: { xs: '100%', sm: 340 },
                        bgcolor: '#ffffff',
                        '& .MuiOutlinedInput-root': { borderRadius: 3 }
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: '#94a3b8' }} />
                            </InputAdornment>
                        ),
                    }}
                />

                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    Showing {filteredTeachers.length} of {teachers.length} teachers
                </Typography>
            </Box>

            {/* Teachers Grid */}
            <Grid container spacing={3}>
                {isLoading ? (
                    [1, 2, 3, 4].map((i) => (
                        <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={i}>
                            <Card sx={{ borderRadius: 4, p: 2 }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <Skeleton variant="circular" width={60} height={60} />
                                        <Box sx={{ flex: 1 }}>
                                            <Skeleton variant="text" width="70%" height={30} />
                                            <Skeleton variant="text" width="50%" />
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))
                ) : filteredTeachers.length === 0 ? (
                    <Grid size={{ xs: 12 }}>
                        <Paper elevation={0} sx={{ textAlign: 'center', py: 8, px: 3, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                            <PersonIcon sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
                            <Typography variant="h6" fontWeight={700} color="#1e293b">
                                {searchQuery ? 'No matching teachers found' : 'No teachers assigned yet'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {searchQuery ? 'Try searching with a different name or subject' : 'Teacher assignments will appear here once configured.'}
                            </Typography>
                        </Paper>
                    </Grid>
                ) : (
                    filteredTeachers.map((teacher: ChildTeacherInfo, index: number) => {
                        const avatarBg = AVATAR_COLORS[index % AVATAR_COLORS.length];
                        const teacherName = `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || 'Faculty';

                        return (
                            <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={teacher.teacherId || index}>
                                <Card
                                    elevation={0}
                                    sx={{
                                        height: '100%',
                                        borderRadius: 4,
                                        border: '1px solid',
                                        borderColor: teacher.isClassTeacher ? '#6366f1' : '#e2e8f0',
                                        bgcolor: '#ffffff',
                                        boxShadow: teacher.isClassTeacher
                                            ? '0 10px 30px -10px rgba(99, 102, 241, 0.2)'
                                            : '0 4px 16px rgba(0, 0, 0, 0.04)',
                                        transition: 'all 0.25 ease',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.08)',
                                        },
                                        position: 'relative',
                                        overflow: 'hidden',
                                    }}
                                >
                                    {teacher.isClassTeacher && (
                                        <Box sx={{
                                            position: 'absolute', top: 0, left: 0, right: 0, height: 4,
                                            background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)'
                                        }} />
                                    )}

                                    <CardContent sx={{ p: 3 }}>
                                        {/* Avatar & Header */}
                                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 2 }}>
                                            <Avatar
                                                src={teacher.profileImage}
                                                alt={teacherName}
                                                sx={{
                                                    width: 64,
                                                    height: 64,
                                                    background: avatarBg,
                                                    fontWeight: 800,
                                                    fontSize: '1.5rem',
                                                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
                                                    border: '2px solid #ffffff',
                                                }}
                                            >
                                                {teacher.firstName?.[0]}
                                            </Avatar>
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.75, mb: 0.5 }}>
                                                    <Typography variant="h6" fontWeight={800} color="#1e293b" noWrap>
                                                        {teacherName}
                                                    </Typography>
                                                </Box>

                                                {teacher.isClassTeacher && (
                                                    <Chip
                                                        size="small"
                                                        icon={<StarIcon sx={{ color: '#fbbf24 !important', fontSize: 15 }} />}
                                                        label="Class Teacher"
                                                        sx={{
                                                            height: 24,
                                                            fontWeight: 700,
                                                            bgcolor: '#fef3c7',
                                                            color: '#92400e',
                                                            border: '1px solid #fde68a',
                                                            mb: 1,
                                                        }}
                                                    />
                                                )}

                                                {/* Subject Badges */}
                                                <Box sx={{ display: 'flex', gap: 0.6, flexWrap: 'wrap', mt: 0.5 }}>
                                                    {teacher.subjectNames && teacher.subjectNames.length > 0 ? (
                                                        teacher.subjectNames.map((subject, idx) => (
                                                            <Chip
                                                                key={idx}
                                                                size="small"
                                                                icon={<SubjectIcon sx={{ fontSize: '13px !important', color: '#475569 !important' }} />}
                                                                label={subject}
                                                                sx={{
                                                                    height: 22,
                                                                    fontWeight: 600,
                                                                    bgcolor: '#f1f5f9',
                                                                    color: '#334155',
                                                                    fontSize: '0.72rem',
                                                                    border: '1px solid #e2e8f0',
                                                                }}
                                                            />
                                                        ))
                                                    ) : (
                                                        <Chip
                                                            size="small"
                                                            icon={<SchoolIcon sx={{ fontSize: '13px !important' }} />}
                                                            label="Subject Teacher"
                                                            sx={{ height: 22, bgcolor: '#f8fafc', color: '#64748b' }}
                                                        />
                                                    )}
                                                </Box>
                                            </Box>
                                        </Box>

                                        <Divider sx={{ my: 2 }} />

                                        {/* Contact Details */}
                                        <Stack spacing={1.5}>
                                            {teacher.email && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                                                        <Box sx={{ p: 0.75, borderRadius: 1.5, bgcolor: '#f1f5f9', color: '#64748b', display: 'flex' }}>
                                                            <EmailIcon sx={{ fontSize: 16 }} />
                                                        </Box>
                                                        <Typography variant="body2" color="#334155" fontWeight={500} noWrap>
                                                            {teacher.email}
                                                        </Typography>
                                                    </Box>
                                                    <Tooltip title={copiedText === teacher.email ? 'Copied!' : 'Copy Email'}>
                                                        <IconButton size="small" onClick={() => handleCopy(teacher.email || '')}>
                                                            <CopyIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            )}

                                            {teacher.phone && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                                                        <Box sx={{ p: 0.75, borderRadius: 1.5, bgcolor: '#ecfdf5', color: '#10b981', display: 'flex' }}>
                                                            <PhoneIcon sx={{ fontSize: 16 }} />
                                                        </Box>
                                                        <Typography variant="body2" color="#334155" fontWeight={600} noWrap>
                                                            {teacher.phone}
                                                        </Typography>
                                                    </Box>
                                                    <Stack direction="row" spacing={0.5}>
                                                        <Tooltip title="Call Teacher">
                                                            <IconButton
                                                                size="small"
                                                                component="a"
                                                                href={`tel:${teacher.phone}`}
                                                                sx={{ bgcolor: '#ecfdf5', color: '#10b981', '&:hover': { bgcolor: '#d1fae5' } }}
                                                            >
                                                                <CallIcon sx={{ fontSize: 15 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title={copiedText === teacher.phone ? 'Copied!' : 'Copy Phone'}>
                                                            <IconButton size="small" onClick={() => handleCopy(teacher.phone || '')}>
                                                                <CopyIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Stack>
                                                </Box>
                                            )}
                                        </Stack>

                                        {/* Action buttons */}
                                        <Stack direction="row" spacing={1} sx={{ mt: 2.5 }}>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                fullWidth
                                                startIcon={<ChatIcon />}
                                                onClick={() =>
                                                    navigate(
                                                        `/parent/chat?partnerId=${teacher.teacherId}&studentId=${selectedChild?.studentId || ''}`
                                                    )
                                                }
                                                sx={{
                                                    borderRadius: 2.5,
                                                    fontWeight: 700,
                                                    textTransform: 'none',
                                                    bgcolor: '#2563eb',
                                                    '&:hover': { bgcolor: '#1d4ed8' },
                                                }}
                                            >
                                                Chat
                                            </Button>

                                            {teacher.email && (
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    fullWidth
                                                    startIcon={<EmailIcon />}
                                                    component="a"
                                                    href={`mailto:${teacher.email}`}
                                                    sx={{
                                                        borderRadius: 2.5,
                                                        fontWeight: 700,
                                                        textTransform: 'none',
                                                        borderColor: '#cbd5e1',
                                                        color: '#475569',
                                                        '&:hover': { borderColor: '#2563eb', bgcolor: '#eff6ff', color: '#2563eb' }
                                                    }}
                                                >
                                                    Email
                                                </Button>
                                            )}
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })
                )}
            </Grid>
        </Box>
    );
};

export default ParentTeachers;
