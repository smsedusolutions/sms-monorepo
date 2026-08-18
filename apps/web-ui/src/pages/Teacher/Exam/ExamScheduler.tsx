import React, { useMemo, useCallback } from 'react';
import {
    Box,
    Typography,
    Paper,
    Chip,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Skeleton,
    Alert,
    Stack,
    Divider,
    useTheme,
    useMediaQuery,
    ToggleButton,
    ToggleButtonGroup,
} from '@mui/material';
import {
    Event as EventIcon,
    AccessTime as TimeIcon,
    Class as ClassIcon,
    Security as InvigilatorIcon,
    CalendarMonth as CalendarIcon,
    MeetingRoom as RoomIcon,
} from '@mui/icons-material';
import { useGetExams, useGetExamSchedule } from '../../../queries/Exam';
import { useGetSubjects } from '../../../queries/Subject';
import { useGetClasses } from '../../../queries/Class';
import { useGetTeacherById } from '../../../queries/Teacher';
import TokenService from '../../../queries/token/tokenService';
import { useUrlTab } from '../../../hooks/useUrlTab';
import { useAcademicYear } from '../../../hooks/useAcademicYear';

// ─── helpers ─────────────────────────────────────────────────────────────────

const fmtDate = (d: string | Date) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

const fmtDay = (d: string | Date) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { weekday: 'short' });
};

const extractClassRank = (name: string): number => {
    const lower = (name || '').toLowerCase().trim();
    if (lower.includes('play') || lower.includes('daycare')) return -50;
    if (lower.includes('nursery') || lower.includes('pre-kg') || lower.includes('prekg')) return -40;
    if (lower.includes('lkg') || lower.includes('jr') || lower.includes('junior')) return -30;
    if (lower.includes('ukg') || lower.includes('sr') || lower.includes('senior')) return -20;
    if (lower.includes('kg') || lower.includes('kindergarten')) return -10;

    const match = lower.match(/\d+/);
    if (match) {
        return parseInt(match[0], 10);
    }
    return 999;
};

const statusColor = (status: string): 'success' | 'warning' | 'info' | 'default' => {
    if (status === 'ongoing') return 'success';
    if (status === 'scheduled') return 'warning';
    if (status === 'completed') return 'info';
    return 'default';
};

// Helper to check if a teacher is assigned in an invigilators array
const isInvigilatorAssigned = (invigilators: any[], teacherIds: string[]): boolean => {
    if (!Array.isArray(invigilators)) return false;
    return invigilators.some((inv: any) => {
        if (!inv) return false;
        if (typeof inv === 'string') return teacherIds.includes(inv);
        if (typeof inv === 'object') {
            return (
                (inv.teacherId && teacherIds.includes(inv.teacherId)) ||
                (inv._id && teacherIds.includes(String(inv._id))) ||
                (inv.userId && teacherIds.includes(inv.userId))
            );
        }
        return false;
    });
};

const getRoomDisplay = (roomId: any): string => {
    if (!roomId) return '—';
    if (typeof roomId === 'object') {
        return roomId.name || roomId.code || roomId.roomId || '—';
    }
    return String(roomId);
};

// ─── Reusable Schedule Table / Card List ─────────────────────────────────────

const ScheduleView: React.FC<{
    rows: any[];
    teacherIds: string[];
    showSubject?: boolean;
    showClass?: boolean;
    showInvigBadge?: boolean;
    headerColor?: string;
    getSubjectName: (id: string) => string;
    getClassName: (id: string) => string;
    emptyText: string;
}> = ({
    rows,
    teacherIds,
    showSubject = true,
    showClass = true,
    showInvigBadge = false,
    headerColor = 'primary',
    getSubjectName,
    getClassName,
    emptyText
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    if (!rows.length) {
        return emptyText ? (
            <Alert severity="info" sx={{ mx: 2, my: 1.5, borderRadius: 2 }}>{emptyText}</Alert>
        ) : null;
    }

    const sorted = [...rows].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (isMobile) {
        return (
            <Stack spacing={1.25} sx={{ px: { xs: 1.5, sm: 2 }, pb: 2 }}>
                {sorted.map((s: any) => {
                    const isInvig = isInvigilatorAssigned(s.invigilators, teacherIds);
                    const subjectName = getSubjectName(s.subjectId);
                    const className = getClassName(s.classId);
                    const roomName = getRoomDisplay(s.roomId);

                    return (
                        <Paper
                            key={s._id}
                            elevation={0}
                            sx={{
                                p: 1.5,
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: isInvig && showInvigBadge ? 'error.light' : 'divider',
                                bgcolor: isInvig && showInvigBadge ? '#fff5f5' : 'background.paper',
                            }}
                        >
                            {/* Top row: Subject + Class Badge */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, gap: 1 }}>
                                {showSubject && (
                                    <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                                        {subjectName}
                                    </Typography>
                                )}
                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', ml: 'auto' }}>
                                    {showClass && (
                                        <Chip
                                            label={className}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                            sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600 }}
                                        />
                                    )}
                                    {showInvigBadge && isInvig && (
                                        <Chip
                                            label="Duty Assigned"
                                            size="small"
                                            color="error"
                                            icon={<InvigilatorIcon sx={{ fontSize: 13 }} />}
                                            sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700 }}
                                        />
                                    )}
                                </Box>
                            </Box>

                            {/* Middle row: Date & Time bar */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    p: 0.75,
                                    bgcolor: 'grey.50',
                                    borderRadius: 1.5,
                                    mb: 0.75,
                                    flexWrap: 'wrap',
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <CalendarIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                    <Typography variant="caption" fontWeight={600} color="text.primary">
                                        {fmtDate(s.date)} ({fmtDay(s.date)})
                                    </Typography>
                                </Box>
                                <Divider orientation="vertical" flexItem sx={{ height: 12, my: 'auto' }} />
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <TimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                    <Typography variant="caption" fontWeight={600} color="primary.main">
                                        {s.startTime} – {s.endTime}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Bottom row: Room */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <RoomIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                                <Typography variant="caption" color="text.secondary">
                                    Room: <strong>{roomName}</strong>
                                </Typography>
                            </Box>
                        </Paper>
                    );
                })}
            </Stack>
        );
    }

    // Desktop Table
    return (
        <TableContainer component={Paper} variant="outlined" sx={{ mx: 2, mb: 2, borderRadius: 2 }}>
            <Table size="small">
                <TableHead>
                    <TableRow sx={{ bgcolor: `${headerColor}.50` }}>
                        <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Day</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
                        {showClass && <TableCell sx={{ fontWeight: 700 }}>Class</TableCell>}
                        {showSubject && <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>}
                        <TableCell sx={{ fontWeight: 700 }}>Room / Hall</TableCell>
                        {showInvigBadge && <TableCell sx={{ fontWeight: 700 }}>Invigilator Status</TableCell>}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {sorted.map((s: any) => {
                        const isInvig = isInvigilatorAssigned(s.invigilators, teacherIds);
                        return (
                            <TableRow key={s._id} hover sx={isInvig && showInvigBadge ? { bgcolor: '#fff5f5' } : undefined}>
                                <TableCell>
                                    <Typography variant="body2" fontWeight={600}>{fmtDate(s.date)}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="caption" color="text.secondary">{fmtDay(s.date)}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Stack direction="row" alignItems="center" gap={0.5}>
                                        <TimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                        <Typography variant="body2">{s.startTime} – {s.endTime}</Typography>
                                    </Stack>
                                </TableCell>
                                {showClass && (
                                    <TableCell>
                                        <Chip label={getClassName(s.classId)} size="small" color="primary" variant="outlined" />
                                    </TableCell>
                                )}
                                {showSubject && (
                                    <TableCell>
                                        <Typography variant="body2">{getSubjectName(s.subjectId)}</Typography>
                                    </TableCell>
                                )}
                                <TableCell>
                                    <Typography variant="body2" color="text.secondary">
                                        {getRoomDisplay(s.roomId)}
                                    </Typography>
                                </TableCell>
                                {showInvigBadge && (
                                    <TableCell>
                                        {isInvig ? (
                                            <Chip label="Assigned" size="small" color="error" icon={<InvigilatorIcon />} />
                                        ) : (
                                            <Typography variant="caption" color="text.disabled">—</Typography>
                                        )}
                                    </TableCell>
                                )}
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

// ─── Per-Exam Schedule Panel ──────────────────────────────────────────────────

interface ExamPanelProps {
    exam: any;
    schoolId: string;
    teacherIds: string[];
    teacherSubjectIds: string[];
    teacherClassIds: string[];
    getSubjectName: (id: string) => string;
    getClassName: (id: string) => string;
}

const ExamPanel: React.FC<ExamPanelProps> = ({
    exam,
    schoolId,
    teacherIds,
    teacherSubjectIds,
    teacherClassIds,
    getSubjectName,
    getClassName
}) => {
    const [innerTab, setInnerTab] = useUrlTab(0, ['my-classes', 'my-subjects', 'invigilation'], 'subtab');
    const { data: scheduleData, isLoading } = useGetExamSchedule(schoolId, exam.examId);
    const allSchedules: any[] = scheduleData?.data || [];

    // Tab 1: Classes I manage
    const myClassSchedules = useMemo(() =>
        allSchedules.filter((s: any) => teacherClassIds.includes(s.classId)),
        [allSchedules, teacherClassIds]);

    // Tab 2: Subjects I teach
    const mySubjectSchedules = useMemo(() =>
        allSchedules.filter((s: any) => teacherSubjectIds.includes(s.subjectId)),
        [allSchedules, teacherSubjectIds]);

    // Tab 3: Invigilator duties
    const invigilatorSchedules = useMemo(() =>
        allSchedules.filter((s: any) => isInvigilatorAssigned(s.invigilators, teacherIds)),
        [allSchedules, teacherIds]);

    if (isLoading) return (
        <Box sx={{ p: 2 }}>
            {[1, 2, 3].map(i => <Skeleton key={i} variant="rectangular" height={48} sx={{ mb: 1, borderRadius: 2 }} />)}
        </Box>
    );

    if (!allSchedules.length) return (
        <Alert severity="info" sx={{ m: 2, borderRadius: 2 }}>No schedule published yet for this exam.</Alert>
    );

    return (
        <Box sx={{ pb: 1 }}>
            {/* Sub-tab Navigation */}
            <Box sx={{ px: { xs: 1.5, sm: 2 }, pt: 1.5, pb: 1 }}>
                <ToggleButtonGroup
                    value={innerTab}
                    exclusive
                    onChange={(_, val) => val !== null && setInnerTab(val)}
                    size="small"
                    fullWidth
                    sx={{
                        display: 'flex',
                        gap: 0.5,
                        '& .MuiToggleButton-root': {
                            flex: 1,
                            py: 0.6,
                            px: 1,
                            fontSize: { xs: '0.75rem', sm: '0.8rem' },
                            fontWeight: 600,
                            borderRadius: '8px !important',
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'grey.50',
                            color: 'text.secondary',
                            '&.Mui-selected': {
                                bgcolor: 'primary.main',
                                color: '#ffffff',
                                borderColor: 'primary.main',
                                '&:hover': { bgcolor: 'primary.dark' },
                            },
                        },
                    }}
                >
                    <ToggleButton value={0}>
                        🏫 Classes ({myClassSchedules.length})
                    </ToggleButton>
                    <ToggleButton value={1}>
                        📘 Subjects ({mySubjectSchedules.length})
                    </ToggleButton>
                    <ToggleButton value={2}>
                        🛡️ Invigilation ({invigilatorSchedules.length})
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* Tab 0: My Classes */}
            {innerTab === 0 && (() => {
                if (myClassSchedules.length === 0) return (
                    <Alert severity="info" sx={{ mx: 2, my: 1.5, borderRadius: 2 }}>
                        No exam slots found for your assigned classes in this exam.
                    </Alert>
                );

                const byClass = myClassSchedules.reduce((acc: Record<string, any[]>, s: any) => {
                    if (!acc[s.classId]) acc[s.classId] = [];
                    acc[s.classId].push(s);
                    return acc;
                }, {} as Record<string, any[]>);

                const sortedByClass = Object.entries(byClass).sort(([classIdA], [classIdB]) => {
                    const nameA = getClassName(classIdA);
                    const nameB = getClassName(classIdB);
                    const rankA = extractClassRank(nameA);
                    const rankB = extractClassRank(nameB);
                    if (rankA !== rankB) return rankA - rankB;
                    return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
                });

                return (
                    <Box sx={{ pt: 0.5 }}>
                        {sortedByClass.map(([classId, rows]) => (
                            <Box key={classId} sx={{ mb: 1.5 }}>
                                <Box sx={{
                                    display: 'flex', alignItems: 'center', gap: 1,
                                    px: 1.5, py: 0.75, mx: { xs: 1.5, sm: 2 }, mb: 1,
                                    bgcolor: 'info.50', borderRadius: 2,
                                    border: '1px solid', borderColor: '#bae6fd',
                                }}>
                                    <ClassIcon sx={{ color: 'info.main', fontSize: 16 }} />
                                    <Typography variant="subtitle2" fontWeight={700} color="info.dark">
                                        {getClassName(classId)}
                                    </Typography>
                                    <Chip
                                        label={`${rows.length} exam${rows.length !== 1 ? 's' : ''}`}
                                        size="small"
                                        color="info"
                                        variant="outlined"
                                        sx={{ ml: 'auto', height: 20, fontSize: '0.7rem' }}
                                    />
                                </Box>
                                <ScheduleView
                                    rows={rows}
                                    teacherIds={teacherIds}
                                    showClass={false}
                                    showSubject={true}
                                    headerColor="info"
                                    getSubjectName={getSubjectName}
                                    getClassName={getClassName}
                                    emptyText=""
                                />
                            </Box>
                        ))}
                    </Box>
                );
            })()}

            {/* Tab 1: My Subjects */}
            {innerTab === 1 && (
                <Box sx={{ pt: 0.5 }}>
                    <ScheduleView
                        rows={mySubjectSchedules}
                        teacherIds={teacherIds}
                        showClass={true}
                        showSubject={true}
                        headerColor="primary"
                        getSubjectName={getSubjectName}
                        getClassName={getClassName}
                        emptyText="No exam slots found for your assigned subjects in this exam."
                    />
                </Box>
            )}

            {/* Tab 2: Invigilator Duties */}
            {innerTab === 2 && (
                <Box sx={{ pt: 0.5 }}>
                    {invigilatorSchedules.length === 0 ? (
                        <Alert severity="success" sx={{ mx: 2, my: 1.5, borderRadius: 2 }}>
                            ✅ You have no invigilator duty assigned for this exam.
                        </Alert>
                    ) : (
                        <ScheduleView
                            rows={invigilatorSchedules}
                            teacherIds={teacherIds}
                            showClass={true}
                            showSubject={true}
                            showInvigBadge={true}
                            headerColor="error"
                            getSubjectName={getSubjectName}
                            getClassName={getClassName}
                            emptyText=""
                        />
                    )}
                </Box>
            )}
        </Box>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const TeacherExamScheduler: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const schoolId = TokenService.getSchoolId() || '';
    const teacherId = TokenService.getUserId() || '';
    const { currentAcademicYear } = useAcademicYear();

    const [selectedTab, setSelectedTab] = useUrlTab(0, ['ongoing', 'upcoming', 'completed']);

    const { data: examsData, isLoading: examsLoading, error } = useGetExams(schoolId);
    const { data: subjectsData } = useGetSubjects(schoolId);
    const { data: classesData } = useGetClasses(schoolId);
    const { data: teacherData } = useGetTeacherById(schoolId, teacherId);

    const teacher = teacherData?.data;

    // All ID variants for this teacher
    const teacherIds: string[] = useMemo(() => {
        const ids = new Set<string>();
        if (teacherId) ids.add(teacherId);
        if (teacher?._id) ids.add(String(teacher._id));
        if (teacher?.teacherId) ids.add(teacher.teacherId);
        if (teacher?.userId) ids.add(teacher.userId);
        return Array.from(ids);
    }, [teacherId, teacher]);

    // Subject IDs this teacher is assigned to
    const teacherSubjectIds: string[] = useMemo(() => {
        if (!teacher?.subjects) return [];
        const ids = new Set<string>();
        const allSubjects: any[] = subjectsData?.data || [];

        teacher.subjects.forEach((sId: string) => {
            ids.add(sId);
            const found = allSubjects.find(sub => sub.subjectId === sId || sub._id === sId);
            if (found) {
                if (found.subjectId) ids.add(found.subjectId);
                if (found._id) ids.add(String(found._id));
                if (found.parentSubjectId) ids.add(found.parentSubjectId);
                allSubjects.forEach(sub => {
                    if (sub.parentSubjectId === found.subjectId || sub.parentSubjectId === found._id) {
                        if (sub.subjectId) ids.add(sub.subjectId);
                        if (sub._id) ids.add(String(sub._id));
                    }
                });
            }
        });
        return Array.from(ids);
    }, [teacher, subjectsData]);

    // Class IDs extracted from teacher's classes array
    const teacherClassIds: string[] = useMemo(() => {
        if (!teacher?.classes) return [];
        const ids = new Set<string>();
        teacher.classes.forEach((c: string) => {
            const rawId = c.includes('#') ? c.split('#')[0] : c;
            ids.add(rawId);
            ids.add(c);
        });
        return Array.from(ids);
    }, [teacher]);

    const allExams: any[] = examsData?.data || [];

    const sortByStartDate = (a: any, b: any) => {
        const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
        const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
        return dateA - dateB;
    };

    const ongoingExams = allExams.filter(e => e.status === 'ongoing').sort(sortByStartDate);
    const upcomingExams = allExams.filter(e => ['scheduled', 'draft'].includes(e.status)).sort(sortByStartDate);
    const pastExams = allExams.filter(e => e.status === 'completed').sort(sortByStartDate);

    const tabExams = [ongoingExams, upcomingExams, pastExams][selectedTab] ?? [];

    const subjectMap = useMemo(() => {
        const map = new Map<string, string>();
        subjectsData?.data?.forEach((s: any) => {
            if (s.subjectId) map.set(s.subjectId, s.name);
            if (s._id) map.set(s._id, s.name);
        });
        return map;
    }, [subjectsData]);

    const classMap = useMemo(() => {
        const map = new Map<string, string>();
        classesData?.data?.forEach((c: any) => {
            if (c.classId) map.set(c.classId, c.name);
            if (c._id) map.set(c._id, c.name);
        });
        return map;
    }, [classesData]);

    const getSubjectName = useCallback((id: string) => subjectMap.get(id) || id, [subjectMap]);
    const getClassName = useCallback((id: string) => classMap.get(id) || id, [classMap]);

    if (examsLoading) return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Skeleton variant="text" width="40%" height={36} sx={{ mb: 2 }} />
            <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                {[1, 2, 3].map(i => (
                    <Grid key={i} size={{ xs: 4, sm: 4 }}>
                        <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 2 }} />
                    </Grid>
                ))}
            </Grid>
            <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
        </Box>
    );

    if (error) return (
        <Box sx={{ p: 3 }}>
            <Alert severity="error" sx={{ borderRadius: 2 }}>Failed to load exam data. Please try again.</Alert>
        </Box>
    );

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ mb: 2 }}>
                <Typography variant={isMobile ? "h6" : "h5"} fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EventIcon color="primary" />
                    My Exam Schedule
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    View exam timetables for your classes & subjects, and check invigilator assignments.
                </Typography>
            </Box>

            {/* Compact 3-Item Summary Stat Bar */}
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
                <Grid size={{ xs: 4, sm: 4 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 1.25, sm: 1.75 },
                            textAlign: 'center',
                            bgcolor: '#f0fdf4',
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: '#bbf7d0',
                        }}
                    >
                        <Typography variant={isMobile ? "h6" : "h5"} fontWeight={700} color="#15803d">
                            {ongoingExams.length}
                        </Typography>
                        <Typography variant="caption" color="#166534" fontWeight={600}>
                            Ongoing
                        </Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 4, sm: 4 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 1.25, sm: 1.75 },
                            textAlign: 'center',
                            bgcolor: '#fffbeb',
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: '#fde68a',
                        }}
                    >
                        <Typography variant={isMobile ? "h6" : "h5"} fontWeight={700} color="#b45309">
                            {upcomingExams.length}
                        </Typography>
                        <Typography variant="caption" color="#92400e" fontWeight={600}>
                            Upcoming
                        </Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 4, sm: 4 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 1.25, sm: 1.75 },
                            textAlign: 'center',
                            bgcolor: 'grey.50',
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        <Typography variant={isMobile ? "h6" : "h5"} fontWeight={700} color="text.primary">
                            {pastExams.length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            Completed
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Filter Toggle Buttons */}
            <Box sx={{ mb: 2.5 }}>
                <ToggleButtonGroup
                    value={selectedTab}
                    exclusive
                    onChange={(_, val) => val !== null && setSelectedTab(val)}
                    size="small"
                    fullWidth
                    sx={{
                        display: 'flex',
                        gap: 0.5,
                        '& .MuiToggleButton-root': {
                            flex: 1,
                            py: 0.75,
                            px: 1,
                            fontSize: { xs: '0.75rem', sm: '0.85rem' },
                            fontWeight: 600,
                            borderRadius: '8px !important',
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.paper',
                            color: 'text.secondary',
                            '&.Mui-selected': {
                                bgcolor: 'primary.main',
                                color: '#ffffff',
                                borderColor: 'primary.main',
                                '&:hover': { bgcolor: 'primary.dark' },
                            },
                        },
                    }}
                >
                    <ToggleButton value={0}>Ongoing ({ongoingExams.length})</ToggleButton>
                    <ToggleButton value={1}>Upcoming ({upcomingExams.length})</ToggleButton>
                    <ToggleButton value={2}>Completed ({pastExams.length})</ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* Exam Cards List */}
            {tabExams.length === 0 ? (
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        textAlign: 'center',
                        borderRadius: 2,
                        border: '1px dashed',
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                    }}
                >
                    <CalendarIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
                    <Typography variant="subtitle1" fontWeight={600} color="text.primary" gutterBottom>
                        No {['ongoing', 'upcoming', 'completed'][selectedTab]} exams
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        There are currently no exams in this category.
                    </Typography>
                </Paper>
            ) : (
                tabExams.map((exam: any) => (
                    <Paper
                        key={exam.examId}
                        elevation={0}
                        sx={{
                            borderRadius: 2,
                            overflow: 'hidden',
                            mb: 2.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.paper',
                        }}
                    >
                        {/* Exam Header */}
                        <Box sx={{
                            p: { xs: 1.75, sm: 2 },
                            bgcolor: 'grey.50',
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                        }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, gap: 1 }}>
                                <Box>
                                    <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                                        {exam.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {exam.termId?.name || exam.term || 'Term'} • Academic Year {exam.academicYear || currentAcademicYear}
                                    </Typography>
                                </Box>
                                <Chip
                                    label={exam.status}
                                    size="small"
                                    color={statusColor(exam.status)}
                                    sx={{ textTransform: 'capitalize', fontWeight: 700, fontSize: '0.75rem', height: 24 }}
                                />
                            </Box>

                            {/* Date Badge */}
                            {exam.startDate && (
                                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, bgcolor: '#ffffff', px: 1, py: 0.5, borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                                    <CalendarIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                                    <Typography variant="caption" fontWeight={600} color="text.primary">
                                        {fmtDate(exam.startDate)} — {fmtDate(exam.endDate)}
                                    </Typography>
                                </Box>
                            )}
                        </Box>

                        {/* Exam Schedule Panel */}
                        <ExamPanel
                            exam={exam}
                            schoolId={schoolId}
                            teacherIds={teacherIds}
                            teacherSubjectIds={teacherSubjectIds}
                            teacherClassIds={teacherClassIds}
                            getSubjectName={getSubjectName}
                            getClassName={getClassName}
                        />
                    </Paper>
                ))
            )}
        </Box>
    );
};

export default TeacherExamScheduler;
