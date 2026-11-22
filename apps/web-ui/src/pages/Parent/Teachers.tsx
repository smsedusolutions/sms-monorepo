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
import { useTheme, alpha } from '@mui/material/styles';
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

const ParentTeachers: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const schoolId = TokenService.getSchoolId() || '';
    const { selectedChild, setSelectedChild, children: contextChildren, isLoading: loadingChild } = useChildSelector();
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedText, setCopiedText] = useState<string | null>(null);

    const AVATAR_COLORS = useMemo(() => [
        `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
        `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
        `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
    ], [theme]);

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
                <Alert severity="info" sx={{ borderRadius: 2 }}>Please select a child to view their teachers.</Alert>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3, maxWidth: 1300, mx: 'auto' }}>
                <Alert severity="error" sx={{ borderRadius: 2 }}>Failed to load teacher information. Please try again later.</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1300, mx: 'auto' }}>
            {/* Page Header */}
            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                    <Box sx={{ p: 1.25, borderRadius: 2.5, bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
                        <PersonIcon sx={{ fontSize: 28 }} />
                    </Box>
                    <Box>
                        <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
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
                <Paper elevation={0} sx={{ p: 2, mb: 2.5, borderRadius: 2, border: '1px solid', borderColor: theme.palette.divider, bgcolor: theme.palette.background.paper }}>
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
                                        bgcolor: isSelected ? theme.palette.primary.main : theme.palette.background.paper,
                                        color: isSelected ? theme.palette.primary.contrastText : theme.palette.text.secondary,
                                        borderColor: isSelected ? theme.palette.primary.main : theme.palette.divider,
                                        boxShadow: isSelected ? `0 2px 8px ${alpha(theme.palette.primary.main, 0.25)}` : 'none',
                                        '&:hover': {
                                            bgcolor: isSelected ? theme.palette.primary.dark : alpha(theme.palette.text.primary, 0.04),
                                            borderColor: isSelected ? theme.palette.primary.dark : theme.palette.divider,
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
                        bgcolor: theme.palette.background.paper,
                        '& .MuiOutlinedInput-root': { borderRadius: 2 }
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: theme.palette.text.secondary }} />
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
                        <Paper elevation={0} sx={{ textAlign: 'center', py: 8, px: 3, borderRadius: 4, border: '1px solid', borderColor: theme.palette.divider, bgcolor: theme.palette.background.paper }}>
                            <PersonIcon sx={{ fontSize: 64, color: theme.palette.divider, mb: 2 }} />
                            <Typography variant="h6" fontWeight={700} color="text.primary">
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
                                        borderColor: teacher.isClassTeacher ? theme.palette.primary.main : theme.palette.divider,
                                        bgcolor: theme.palette.background.paper,
                                        boxShadow: teacher.isClassTeacher
                                            ? `0 6px 20px -6px ${alpha(theme.palette.primary.main, 0.25)}`
                                            : '0 4px 16px rgba(0, 0, 0, 0.04)',
                                        transition: 'all 0.25s ease',
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
                                            background: theme.palette.primary.main
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
                                                    border: '2px solid',
                                                    borderColor: theme.palette.background.paper,
                                                }}
                                            >
                                                {teacher.firstName?.[0]}
                                            </Avatar>
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.75, mb: 0.5 }}>
                                                    <Typography variant="h6" fontWeight={800} color="text.primary" noWrap>
                                                        {teacherName}
                                                    </Typography>
                                                </Box>

                                                {teacher.isClassTeacher && (
                                                    <Chip
                                                        size="small"
                                                        icon={<StarIcon sx={{ color: `${theme.palette.warning.main} !important`, fontSize: 15 }} />}
                                                        label="Class Teacher"
                                                        sx={{
                                                            height: 24,
                                                            fontWeight: 700,
                                                            bgcolor: alpha(theme.palette.warning.main, 0.1),
                                                            color: theme.palette.warning.dark,
                                                            border: `1px solid ${alpha(theme.palette.warning.main, 0.25)}`,
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
                                                                icon={<SubjectIcon sx={{ fontSize: '13px !important', color: `${theme.palette.text.secondary} !important` }} />}
                                                                label={subject}
                                                                sx={{
                                                                    height: 22,
                                                                    fontWeight: 600,
                                                                    bgcolor: alpha(theme.palette.text.primary, 0.04),
                                                                    color: theme.palette.text.primary,
                                                                    fontSize: '0.72rem',
                                                                    border: '1px solid',
                                                                    borderColor: theme.palette.divider,
                                                                }}
                                                            />
                                                        ))
                                                    ) : (
                                                        <Chip
                                                            size="small"
                                                            icon={<SchoolIcon sx={{ fontSize: '13px !important' }} />}
                                                            label="Subject Teacher"
                                                            sx={{ height: 22, bgcolor: alpha(theme.palette.text.primary, 0.04), color: theme.palette.text.secondary }}
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
                                                        <Box sx={{ p: 0.75, borderRadius: 1.5, bgcolor: alpha(theme.palette.text.primary, 0.04), color: theme.palette.text.secondary, display: 'flex' }}>
                                                            <EmailIcon sx={{ fontSize: 16 }} />
                                                        </Box>
                                                        <Typography variant="body2" color="text.primary" fontWeight={500} noWrap>
                                                            {teacher.email}
                                                        </Typography>
                                                    </Box>
                                                    <Tooltip title={copiedText === teacher.email ? 'Copied!' : 'Copy Email'}>
                                                        <IconButton size="small" onClick={() => handleCopy(teacher.email || '')}>
                                                            <CopyIcon sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            )}

                                            {teacher.phone && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                                                        <Box sx={{ p: 0.75, borderRadius: 1.5, bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main, display: 'flex' }}>
                                                            <PhoneIcon sx={{ fontSize: 16 }} />
                                                        </Box>
                                                        <Typography variant="body2" color="text.primary" fontWeight={600} noWrap>
                                                            {teacher.phone}
                                                        </Typography>
                                                    </Box>
                                                    <Stack direction="row" spacing={0.5}>
                                                        <Tooltip title="Call Teacher">
                                                            <IconButton
                                                                size="small"
                                                                component="a"
                                                                href={`tel:${teacher.phone}`}
                                                                sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main, '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.2) } }}
                                                            >
                                                                <CallIcon sx={{ fontSize: 15 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title={copiedText === teacher.phone ? 'Copied!' : 'Copy Phone'}>
                                                            <IconButton size="small" onClick={() => handleCopy(teacher.phone || '')}>
                                                                <CopyIcon sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Stack>
                                                </Box>
                                            )}
                                        </Stack>

                                        {/* Action buttons */}
                                        <Stack direction="row" spacing={1} sx={{ mt: 2.5 }}>
                                            {/* Chat button temporarily commented out
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
                                                    bgcolor: theme.palette.primary.main,
                                                    '&:hover': { bgcolor: theme.palette.primary.dark },
                                                }}
                                            >
                                                Chat
                                            </Button>
                                            */}

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
                                                        borderColor: theme.palette.divider,
                                                        color: theme.palette.text.primary,
                                                        '&:hover': { borderColor: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.04) }
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
