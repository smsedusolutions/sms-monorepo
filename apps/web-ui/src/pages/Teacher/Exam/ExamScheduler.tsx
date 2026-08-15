import React, { useMemo, useCallback } from 'react';
import {
    Box,
    Typography,
    Paper,
    Chip,
    Grid,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Card,
    CardContent,
    Skeleton,
    Alert,
    Stack,
    Avatar,
} from '@mui/material';
import {
    Event as EventIcon,
    AccessTime as TimeIcon,
    Class as ClassIcon,
    Security as InvigilatorIcon,
    CalendarMonth as CalendarIcon,
    School as SchoolIcon,
} from '@mui/icons-material';
import { useGetExams, useGetExamSchedule } from '../../../queries/Exam';
import { useGetSubjects } from '../../../queries/Subject';
import { useGetClasses } from '../../../queries/Class';
import { useGetTeacherById } from '../../../queries/Teacher';
import TokenService from '../../../queries/token/tokenService';
import { useUrlTab } from '../../../hooks/useUrlTab';

// ─── helpers ─────────────────────────────────────────────────────────────────

const fmtDate = (d: string | Date) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const fmtDay = (d: string | Date) =>
    new Date(d).toLocaleDateString('en-IN', { weekday: 'long' });

const statusColor = (status: string): 'success' | 'warning' | 'info' | 'default' => {
    if (status === 'ongoing') return 'success';
    if (status === 'scheduled') return 'warning';
    if (status === 'completed') return 'info';
    return 'default';
};

// ─── per-exam schedule panel ──────────────────────────────────────────────────

interface ExamPanelProps {
    exam: any;
    schoolId: string;
    teacherIds: string[];
    teacherSubjectIds: string[];
    teacherClassIds: string[];
    getSubjectName: (id: string) => string;
    getClassName: (id: string) => string;
}

// Helper to check if a teacher is assigned in an invigilators array (which can be strings or populated objects)
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

// Reusable schedule table
const ScheduleTable: React.FC<{
    rows: any[];
    teacherIds: string[];
    showSubject?: boolean;
    showClass?: boolean;
    showInvigBadge?: boolean;
    headerColor?: string;
    getSubjectName: (id: string) => string;
    getClassName: (id: string) => string;
    emptyText: string;
}> = ({ rows, teacherIds, showSubject = true, showClass = true, showInvigBadge = false, headerColor = 'primary', getSubjectName, getClassName, emptyText }) => {
    if (!rows.length) return (
        <Alert severity="info" sx={{ m: 2, borderRadius: 2 }}>{emptyText}</Alert>
    );

    const sorted = [...rows].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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
                            <TableRow key={s._id} hover sx={isInvig && showInvigBadge ? { bgcolor: 'error.50' } : undefined}>
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
                                        <Chip label="Assigned" size="small" color="error" icon={<InvigilatorIcon />} />
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

const ExamPanel: React.FC<ExamPanelProps> = ({
    exam, schoolId, teacherIds,
    teacherSubjectIds, teacherClassIds,
    getSubjectName, getClassName
}) => {
    const [innerTab, setInnerTab] = useUrlTab(0, ['my-classes', 'invigilation', 'all-schedules'], 'subtab');
    const { data: scheduleData, isLoading } = useGetExamSchedule(schoolId, exam.examId);
    const allSchedules: any[] = scheduleData?.data || [];

    // Tab 1: Subjects I teach — filter by subjectId in teacher's subjects
    const mySubjectSchedules = useMemo(() =>
        allSchedules.filter((s: any) => teacherSubjectIds.includes(s.subjectId)),
        [allSchedules, teacherSubjectIds]);

    // Tab 2: Classes I manage — filter by classId in teacher's classes
    const myClassSchedules = useMemo(() =>
        allSchedules.filter((s: any) => teacherClassIds.includes(s.classId)),
        [allSchedules, teacherClassIds]);

    // Tab 3: Invigilator duties — filter by any matching teacher ID in invigilators[]
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
        <Box sx={{ pb: 2 }}>
            {/* Inner 3-tab bar */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
                <Tabs
                    value={innerTab}
                    onChange={(_, v) => setInnerTab(v)}
                    sx={{ px: 2, minHeight: 42 }}
                    TabIndicatorProps={{ style: { height: 3 } }}
                >
                    <Tab
                        sx={{ minHeight: 42, fontSize: '0.8rem' }}
                        label={
                            <Stack direction="row" spacing={0.8} alignItems="center">
                                <span>🏫 My Classes</span>
                                <Chip label={myClassSchedules.length} size="small" color="info" sx={{ height: 18, fontSize: '0.65rem' }} />
                            </Stack>
                        }
                    />
                    <Tab
                        sx={{ minHeight: 42, fontSize: '0.8rem' }}
                        label={
                            <Stack direction="row" spacing={0.8} alignItems="center">
                                <span>📘 My Subjects</span>
                                <Chip label={mySubjectSchedules.length} size="small" color="primary" sx={{ height: 18, fontSize: '0.65rem' }} />
                            </Stack>
                        }
                    />
                    <Tab
                        sx={{ minHeight: 42, fontSize: '0.8rem' }}
                        label={
                            <Stack direction="row" spacing={0.8} alignItems="center">
                                <span>🛡️ Invigilator</span>
                                <Chip label={invigilatorSchedules.length} size="small" color="error" sx={{ height: 18, fontSize: '0.65rem' }} />
                            </Stack>
                        }
                    />
                </Tabs>
            </Box>

            {/* Tab 1: My Subjects */}
            {innerTab === 1 && (
                <Box sx={{ pt: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ px: 2, display: 'block', mb: 1 }}>
                        Exam slots for subjects you are assigned to teach.
                    </Typography>
                    <ScheduleTable
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

            {/* Tab 2: My Classes — each class in its own section */}
            {innerTab === 0 && (() => {
                if (myClassSchedules.length === 0) return (
                    <Alert severity="info" sx={{ m: 2, borderRadius: 2 }}>
                        No exam slots found for your assigned classes in this exam.
                    </Alert>
                );

                // Group schedules by classId
                const byClass = myClassSchedules.reduce((acc: Record<string, any[]>, s: any) => {
                    if (!acc[s.classId]) acc[s.classId] = [];
                    acc[s.classId].push(s);
                    return acc;
                }, {} as Record<string, any[]>);

                return (
                    <Box sx={{ pt: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ px: 2, display: 'block', mb: 1 }}>
                            All exam slots grouped by class. Each class's timetable is shown separately.
                        </Typography>
                        {Object.entries(byClass).map(([classId, rows]) => (
                            <Box key={classId} sx={{ mb: 3 }}>
                                {/* Class header */}
                                <Box sx={{
                                    display: 'flex', alignItems: 'center', gap: 1.5,
                                    px: 2, py: 1, mx: 2, mb: 0.5,
                                    bgcolor: 'info.50', borderRadius: 2,
                                    border: '1px solid', borderColor: 'info.200',
                                }}>
                                    <ClassIcon sx={{ color: 'info.main', fontSize: 18 }} />
                                    <Typography variant="subtitle2" fontWeight={700} color="info.main">
                                        {getClassName(classId)}
                                    </Typography>
                                    <Chip label={`${rows.length} exam${rows.length !== 1 ? 's' : ''}`} size="small" color="info" variant="outlined" sx={{ ml: 'auto' }} />
                                </Box>
                                <ScheduleTable
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


            {/* Tab 3: Invigilator Duties */}
            {innerTab === 2 && (
                <Box sx={{ pt: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ px: 2, display: 'block', mb: 1 }}>
                        Exam slots where you are assigned as an invigilator.
                    </Typography>
                    {invigilatorSchedules.length === 0 ? (
                        <Alert severity="success" sx={{ mx: 2, borderRadius: 2 }}>
                            ✅ You have no invigilator duty assigned for this exam.
                        </Alert>
                    ) : (
                        <ScheduleTable
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

// ─── main page ────────────────────────────────────────────────────────────────

const TeacherExamScheduler: React.FC = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const teacherId = TokenService.getUserId() || '';

    const [selectedTab, setSelectedTab] = useUrlTab(0, ['ongoing', 'upcoming', 'completed']);

    const { data: examsData, isLoading: examsLoading, error } = useGetExams(schoolId);
    const { data: subjectsData } = useGetSubjects(schoolId);
    const { data: classesData } = useGetClasses(schoolId);
    const { data: teacherData } = useGetTeacherById(schoolId, teacherId);

    const teacher = teacherData?.data;

    // All ID variants for this teacher (TCH-xxx, _id, userId, etc.)
    const teacherIds: string[] = useMemo(() => {
        const ids = new Set<string>();
        if (teacherId) ids.add(teacherId);
        if (teacher?._id) ids.add(String(teacher._id));
        if (teacher?.teacherId) ids.add(teacher.teacherId);
        if (teacher?.userId) ids.add(teacher.userId);
        return Array.from(ids);
    }, [teacherId, teacher]);

    // Subject IDs this teacher is assigned to (including parent/sub-subject mapped IDs)
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
                // Also add children if this is a parent subject
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

    // Class IDs extracted from teacher's classes array (format: "classId#sectionId" or just "classId")
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

    // Helper to sort exams by startDate ascending (earliest exam comes first)
    const sortByStartDate = (a: any, b: any) => {
        const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
        const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
        return dateA - dateB;
    };

    // Organise exams by status and sort chronologically
    const upcomingExams = allExams.filter(e => ['scheduled', 'draft'].includes(e.status)).sort(sortByStartDate);
    const ongoingExams = allExams.filter(e => e.status === 'ongoing').sort(sortByStartDate);
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

    // ── summary stats ───────────────────────────────────────────────────────
    const StatCard = ({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) => (
        <Card variant="outlined" sx={{ borderRadius: 3, flex: 1, minWidth: 120 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '12px !important' }}>
                <Avatar sx={{ bgcolor: `${color}.100`, color: `${color}.main`, width: 40, height: 40 }}>
                    {icon}
                </Avatar>
                <Box>
                    <Typography variant="h5" fontWeight={800} color={`${color}.main`}>{value}</Typography>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                </Box>
            </CardContent>
        </Card>
    );

    if (examsLoading) return (
        <Box sx={{ p: 3 }}>
            <Skeleton variant="text" width="40%" height={40} sx={{ mb: 2 }} />
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[1, 2, 3].map(i => <Grid key={i} size={{ xs: 12, sm: 4 }}><Skeleton variant="rectangular" height={80} sx={{ borderRadius: 3 }} /></Grid>)}
            </Grid>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
        </Box>
    );

    if (error) return (
        <Box sx={{ p: 3 }}>
            <Alert severity="error" sx={{ borderRadius: 2 }}>Failed to load exam data. Please try again.</Alert>
        </Box>
    );

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1400, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <EventIcon color="primary" />
                    My Exam Schedule
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    View upcoming exam timetables for your classes & subjects, and check your invigilator assignments.
                </Typography>
            </Box>

            {/* Summary stats */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
                <StatCard label="Ongoing Exams" value={ongoingExams.length} color="success" icon={<SchoolIcon fontSize="small" />} />
                <StatCard label="Upcoming Exams" value={upcomingExams.length} color="warning" icon={<CalendarIcon fontSize="small" />} />
                <StatCard label="Completed Exams" value={pastExams.length} color="info" icon={<EventIcon fontSize="small" />} />
            </Stack>

            {/* Tabs */}
            <Paper variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
                <Tabs
                    value={selectedTab}
                    onChange={(_, v) => setSelectedTab(v)}
                    variant="fullWidth"
                    sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 3 }}
                >
                    <Tab
                        label={
                            <Stack direction="row" spacing={1} alignItems="center">
                                <span>Ongoing</span>
                                <Chip label={ongoingExams.length} size="small" color="success" />
                            </Stack>
                        }
                    />
                    <Tab
                        label={
                            <Stack direction="row" spacing={1} alignItems="center">
                                <span>Upcoming</span>
                                <Chip label={upcomingExams.length} size="small" color="warning" />
                            </Stack>
                        }
                    />
                    <Tab
                        label={
                            <Stack direction="row" spacing={1} alignItems="center">
                                <span>Completed</span>
                                <Chip label={pastExams.length} size="small" color="default" />
                            </Stack>
                        }
                    />
                </Tabs>
            </Paper>

            {tabExams.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: 3, p: 3 }}>
                    No {['ongoing', 'upcoming', 'completed'][selectedTab]} exams at the moment.
                </Alert>
            ) : (
                tabExams.map((exam: any) => (
                    <Paper
                        key={exam.examId}
                        variant="outlined"
                        sx={{
                            borderRadius: 3,
                            overflow: 'hidden',
                            mb: 3,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                            border: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        {/* Exam header */}
                        <Box sx={{
                            display: 'flex', alignItems: 'center', gap: 2,
                            px: 3, py: 2, bgcolor: 'action.hover',
                            borderBottom: 1, borderColor: 'divider',
                        }}>
                            <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                                <ClassIcon fontSize="small" />
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle1" fontWeight={700}>{exam.name}</Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                    <Chip label={exam.term || 'N/A'} size="small" variant="outlined" />
                                    <Chip label={exam.academicYear || ''} size="small" variant="outlined" />
                                    <Chip
                                        label={exam.status}
                                        size="small"
                                        color={statusColor(exam.status)}
                                    />
                                    {exam.startDate && (
                                        <Chip
                                            label={`${fmtDate(exam.startDate)} → ${fmtDate(exam.endDate)}`}
                                            size="small"
                                            icon={<CalendarIcon />}
                                            variant="outlined"
                                        />
                                    )}
                                </Stack>
                            </Box>
                        </Box>

                        {/* Schedule panel */}
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
