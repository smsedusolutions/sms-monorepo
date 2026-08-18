import React, { useMemo, useState } from 'react';
import {
    Box,
    Typography,
    Grid,
    Avatar,
    Stack,
    Skeleton,
    Alert,
    Chip,
    Card,
    CardContent,
    Paper,
} from '@mui/material';
import { format } from 'date-fns';
import {
    People as StudentsIcon,
    Schedule as ScheduleIcon,
    Assessment as AttendanceIcon,
    EventAvailable as EventIcon,
    Add as AddIcon,
    Class as ClassIcon,
    Star as StarIcon,
    School as SchoolIcon,
    Groups as GroupsIcon,
    Chat as ChatIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import TokenService from '../../queries/token/tokenService';
import { useGetTeacherDashboardStats } from '../../queries/TeacherDashboard';
import { useGetTeacherById } from '../../queries/Teacher';
import { useGetClasses } from '../../queries/Class';
import { useGetStudents } from '../../queries/Student';
import { useTimeSettingsStore } from '../../stores/timeSettingsStore';
import { formatTimeDisplay } from '../../utils/timeUtils';
import { AppCard } from '../../components/shared/AppCard';
import { AppButton } from '../../components/shared/AppButton';
import { AppSection } from '../../components/shared/AppSection';
import RequestChangeDialog from '../../components/Dialogs/RequestChangeDialog';
import type { Class, Student } from '../../types';

const TeacherDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [supportDialogOpen, setSupportDialogOpen] = useState(false);
    const user = TokenService.getUser();
    const schoolId = TokenService.getSchoolId() || '';
    const teacherId = user?.teacherId || user?.userId || '';
    const { timeFormat } = useTimeSettingsStore();

    const { data, isLoading, error } = useGetTeacherDashboardStats(schoolId);
    const stats = data?.data;

    // Fetch teacher profile, classes, and students for assigned class cards
    const { data: teacherData } = useGetTeacherById(schoolId, teacherId);
    const { data: classesData } = useGetClasses(schoolId);
    const { data: studentsData } = useGetStudents(schoolId, { limit: 1000 });

    const teacher = teacherData?.data;
    const allClasses: Class[] = classesData?.data || [];
    const allStudents: Student[] = studentsData?.data || [];

    // Derive assigned class cards with exact section & student counts
    const myClassCards = useMemo(() => {
        const teacherClasses: string[] = teacher?.classes || [];
        const teacherSections: string[] = (teacher as any)?.sections || [];
        const classTeacherSectionId: string = teacher?.classTeacherSectionId || '';

        // Collect assigned entries for each class
        const classAssignedMap: Record<string, Set<string>> = {};

        // Process teacher.classes (items like "CLS00001#SEC00001" or "CLS00001")
        teacherClasses.forEach((item) => {
            const [clsId, secId] = item.split('#');
            if (!classAssignedMap[clsId]) classAssignedMap[clsId] = new Set();
            if (secId) classAssignedMap[clsId].add(secId);
        });

        // Process teacher.sections
        teacherSections.forEach((item) => {
            const [clsId, secId] = item.split('#');
            const classId = secId ? clsId : item;
            const sectionId = secId || item;
            if (classId) {
                if (!classAssignedMap[classId]) classAssignedMap[classId] = new Set();
                if (sectionId && sectionId !== classId) classAssignedMap[classId].add(sectionId);
            }
        });

        // Process classTeacherSectionId
        if (classTeacherSectionId) {
            const [clsId, secId] = classTeacherSectionId.split('#');
            if (clsId) {
                if (!classAssignedMap[clsId]) classAssignedMap[clsId] = new Set();
                if (secId) classAssignedMap[clsId].add(secId);
            }
        }

        const assignedClassIds = Object.keys(classAssignedMap);
        const targetClasses = assignedClassIds.length > 0
            ? allClasses.filter((c) => assignedClassIds.includes(c.classId))
            : allClasses;

        return targetClasses.map((c) => {
            const assignedSecSet = classAssignedMap[c.classId];
            const hasSpecificSections = assignedSecSet && assignedSecSet.size > 0;

            // Section count (only assigned sections for this teacher)
            const sectionCount = hasSpecificSections ? assignedSecSet.size : (c.sections?.length || 1);

            // Resolve assigned section names
            let sectionNamesList: string[] = [];
            if (hasSpecificSections) {
                sectionNamesList = Array.from(assignedSecSet).map((secId) => {
                    const secObj = c.sections?.find((s) => s.sectionId === secId || s.name === secId);
                    return secObj?.name || secId;
                });
            } else if (c.sections && c.sections.length > 0) {
                sectionNamesList = c.sections.map((s) => s.name);
            }

            const sectionLabel = sectionNamesList.length > 0
                ? `Section - ${sectionNamesList.join(' | ')}`
                : `${sectionCount} ${sectionCount === 1 ? 'Section' : 'Sections'}`;

            // Student count: filter by class AND assigned section(s)
            const studentCount = allStudents.filter((s) => {
                if (s.class !== c.classId || s.status !== 'active') return false;
                if (hasSpecificSections && s.section) {
                    return assignedSecSet.has(s.section);
                }
                return true;
            }).length;

            const isClassTeacher = c.sections?.some(
                (s) => classTeacherSectionId === `${c.classId}#${s.sectionId}`
            );

            return {
                classId: c.classId,
                className: c.name,
                sectionCount,
                sectionLabel,
                studentCount,
                isClassTeacher,
            };
        });
    }, [teacher, allClasses, allStudents]);

    const cardColors = [
        { bg: '#ecfdf5', accent: '#10b981', iconBg: '#d1fae5' },
        { bg: '#eff6ff', accent: '#3b82f6', iconBg: '#dbeafe' },
        { bg: '#f5f3ff', accent: '#8b5cf6', iconBg: '#ede9fe' },
        { bg: '#fdf2f8', accent: '#ec4899', iconBg: '#fce7f3' },
        { bg: '#fffbeb', accent: '#f59e0b', iconBg: '#fef3c7' },
    ];

    const assignedTotalStudents = useMemo(() => {
        return myClassCards.reduce((acc, c) => acc + c.studentCount, 0);
    }, [myClassCards]);

    return (
        <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
            {/* Professional Greeting */}
            <Box sx={{ mb: { xs: 4, md: 5 }, mt: 2 }}>
                {isLoading ? (
                    <>
                        <Skeleton variant="text" width="60%" height={80} sx={{ borderRadius: 2 }} />
                        <Skeleton variant="text" width="40%" height={32} sx={{ mt: 1 }} />
                    </>
                ) : (
                    <Box>
                        <Typography
                            variant="h3"
                            fontWeight={800}
                            sx={{
                                mb: 1,
                                background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                fontSize: { xs: '2.25rem', md: '3rem' }
                            }}
                        >
                            Good morning, {user?.firstName || 'Teacher'}!
                        </Typography>
                        <Typography variant="h6" color="text.secondary" fontWeight={400} sx={{ opacity: 0.8 }}>
                            You have {stats?.periodsToday || 0} classes scheduled for today.
                        </Typography>
                    </Box>
                )}
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 4 }}>
                    Failed to load dashboard stats. Please try again.
                </Alert>
            )}

            {/* Quick Stats Grid */}
            <Grid container spacing={3} sx={{ mb: 5 }} component="div">
                {isLoading ? (
                    [1, 2, 3].map((i) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i} component="div">
                            <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 4 }} />
                        </Grid>
                    ))
                ) : (
                    [
                        { label: 'Total Students', value: assignedTotalStudents > 0 ? assignedTotalStudents : (stats?.totalStudents || 0), icon: <StudentsIcon />, color: '#6366f1' },
                        { label: 'Today\'s Attendance', value: stats?.attendancePercentage || 'Not Marked', icon: <AttendanceIcon />, color: '#10b981' },
                        { label: 'Pending Leaves', value: stats?.pendingLeaveRequests || 0, icon: <EventIcon />, color: '#f59e0b' },
                    ].map((stat) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={stat.label} component="div">
                            <AppCard sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3,
                                p: 3,
                                borderRadius: 4,
                                backdropFilter: 'blur(10px)',
                                bgcolor: 'rgba(255, 255, 255, 0.7)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)'
                            }}>
                                <Avatar sx={{ bgcolor: `${stat.color}15`, color: stat.color, width: 56, height: 56, border: '1px solid', borderColor: `${stat.color}20` }}>
                                    {stat.icon}
                                </Avatar>
                                <Box>
                                    <Typography variant="h4" fontWeight={800}>{stat.value}</Typography>
                                    <Typography variant="body2" color="text.secondary" fontWeight={500}>{stat.label}</Typography>
                                </Box>
                            </AppCard>
                        </Grid>
                    ))
                )}
            </Grid>

            {/* Quick Attendance CTA Banner */}
            <Paper
                elevation={0}
                onClick={() => navigate('/teacher/attendance')}
                sx={{
                    p: 2.5,
                    mb: 4,
                    borderRadius: 3.5,
                    bgcolor: '#f0fdf4',
                    border: '1px solid #a7f3d0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 2,
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 24px rgba(16, 185, 129, 0.15)',
                    }
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: '#10b981', color: '#fff' }}>
                        <AttendanceIcon sx={{ fontSize: 28 }} />
                    </Box>
                    <Box>
                        <Typography variant="subtitle1" fontWeight={700} color="#065f46">
                            Record Today's Attendance
                        </Typography>
                        <Typography variant="caption" color="#047857">
                            Quickly mark simple or period-wise student attendance for your assigned classes.
                        </Typography>
                    </Box>
                </Box>
                <AppButton
                    variant="contained"
                    onClick={(e) => { e.stopPropagation(); navigate('/teacher/attendance'); }}
                    sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, fontWeight: 700 }}
                >
                    Mark Attendance Now
                </AppButton>
            </Paper>

            {/* Chat with Parents CTA Banner */}
            <Paper
                elevation={0}
                onClick={() => navigate('/teacher/chat')}
                sx={{
                    p: 2.5,
                    mb: 4,
                    borderRadius: 3.5,
                    bgcolor: '#f5f3ff',
                    border: '1px solid #c4b5fd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 2,
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 24px rgba(139, 92, 246, 0.18)',
                    }
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: '#7c3aed', color: '#fff' }}>
                        <ChatIcon sx={{ fontSize: 28 }} />
                    </Box>
                    <Box>
                        <Typography variant="subtitle1" fontWeight={700} color="#4c1d95">
                            Chat with Parents
                        </Typography>
                        <Typography variant="caption" color="#6d28d9">
                            Send secure, end-to-end encrypted messages to parents about student progress.
                        </Typography>
                    </Box>
                </Box>
                <AppButton
                    variant="contained"
                    onClick={(e) => { e.stopPropagation(); navigate('/teacher/chat'); }}
                    sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' }, fontWeight: 700 }}
                >
                    Open Chat
                </AppButton>
            </Paper>

            {/* My Assigned Classes Section */}
            {myClassCards.length > 0 && (
                <Box sx={{ mb: 5 }}>
                    <AppSection title="My Assigned Classes">
                        <Grid container spacing={3}>
                            {myClassCards.map((c, index) => {
                                const color = cardColors[index % cardColors.length];
                                return (
                                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={c.classId}>
                                        <Card
                                            onClick={() => navigate('/teacher/attendance')}
                                            sx={{
                                                borderRadius: 4,
                                                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                                                border: `1px solid ${color.accent}25`,
                                                bgcolor: 'background.paper',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    transform: 'translateY(-3px)',
                                                    boxShadow: `0 8px 25px ${color.accent}25`,
                                                }
                                            }}
                                        >
                                            <CardContent sx={{ p: 3 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                                    <Avatar sx={{ bgcolor: color.iconBg, color: color.accent, width: 48, height: 48 }}>
                                                        <ClassIcon />
                                                    </Avatar>
                                                    {c.isClassTeacher && (
                                                        <Chip
                                                            icon={<StarIcon sx={{ fontSize: '14px !important' }} />}
                                                            label="Class Teacher"
                                                            size="small"
                                                            sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 700, fontSize: '0.7rem' }}
                                                        />
                                                    )}
                                                </Box>

                                                <Typography variant="h6" fontWeight={800} color="#1e293b" gutterBottom>
                                                    {c.className}
                                                </Typography>

                                                <Box sx={{ display: 'flex', gap: 2.5, mt: 1.5 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                                        <SchoolIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                                        <Typography variant="body2" color="text.secondary" fontWeight={600}>
                                                            {c.sectionLabel}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                                        <GroupsIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                                        <Typography variant="body2" color="text.secondary" fontWeight={600}>
                                                            {c.studentCount} Students
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    </AppSection>
                </Box>
            )}

            <Grid container spacing={4}>
                {/* Main Content: Schedule & Tasks */}
                <Grid size={{ xs: 12, lg: 8 }}>
                    <AppSection
                        title="Today's Schedule"
                        action={
                            <AppButton size="small" variant="text" onClick={() => navigate('/teacher/timetable')}>
                                Full Timetable
                            </AppButton>
                        }
                    >
                        {isLoading ? (
                            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 4 }} />
                        ) : (
                            <Grid container spacing={2}>
                                {stats?.todaySchedule && stats.todaySchedule.length > 0 ? (
                                    stats.todaySchedule.map((period, i) => (
                                        <Grid size={{ xs: 12, sm: 6 }} key={i}>
                                            <Box sx={{
                                                p: 2.5,
                                                borderRadius: 4,
                                                border: '1px solid',
                                                borderColor: 'rgba(255, 255, 255, 0.4)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2,
                                                bgcolor: 'rgba(255, 255, 255, 0.5)',
                                                backdropFilter: 'blur(4px)',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    transform: 'translateY(-2px)',
                                                    boxShadow: '0 8px 16px rgba(0,0,0,0.06)'
                                                }
                                            }}>
                                                <Box sx={{
                                                    p: 1.5,
                                                    borderRadius: 2,
                                                    bgcolor: 'primary.light',
                                                    color: 'primary.dark',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    minWidth: 100,
                                                    textAlign: 'center'
                                                }}>
                                                    <Typography variant="caption" fontWeight={800} sx={{ textTransform: 'uppercase', fontSize: '0.9rem', opacity: 0.8 }}>
                                                        {'Period'} <b>#{period.periodNumber}</b>
                                                    </Typography>
                                                    <Typography variant="caption" fontWeight={700} sx={{ mt: 0.5, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                                        {formatTimeDisplay(period.time, timeFormat)}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ flexGrow: 1 }}>
                                                    <Typography variant="subtitle1" fontWeight={700} color="text.primary">{period.subject}</Typography>
                                                    <Typography variant="caption" color="text.secondary" fontWeight={500}>{period.class}</Typography>
                                                </Box>
                                            </Box>
                                        </Grid>
                                    ))
                                ) : (
                                    <Box sx={{ py: 4, width: '100%', textAlign: 'center' }}>
                                        <ScheduleIcon sx={{ fontSize: 48, color: 'text.disabled', opacity: 0.5, mb: 1 }} />
                                        <Typography color="text.secondary">No classes scheduled for today</Typography>
                                    </Box>
                                )}
                            </Grid>
                        )}
                    </AppSection>

                    <AppSection title="Pending Tasks">
                        <Stack spacing={2}>
                            {isLoading ? (
                                [1, 2, 3].map((i) => <Skeleton key={i} variant="rectangular" height={70} sx={{ borderRadius: 3 }} />)
                            ) : stats?.pendingTasks && stats.pendingTasks.length > 0 ? (
                                stats.pendingTasks.map((task, i) => (
                                    <Box
                                        key={i}
                                        onClick={() => {
                                            if (task.task.includes('Attendance')) {
                                                navigate('/teacher/attendance');
                                            }
                                        }}
                                        sx={{
                                            p: 2,
                                            borderRadius: 3,
                                            bgcolor: 'background.default',
                                            border: '1px solid',
                                            borderColor: task.priority === 'high' ? 'error.light' : 'divider',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            cursor: task.task.includes('Attendance') ? 'pointer' : 'default',
                                            '&:hover': task.task.includes('Attendance') ? { bgcolor: '#fef2f2' } : {}
                                        }}
                                    >
                                        <Box>
                                            <Typography variant="body1" fontWeight={600}>{task.task}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Due: {format(new Date(task.deadline), 'MMM dd, yyyy')}
                                            </Typography>
                                        </Box>
                                        <Chip
                                            size="small"
                                            label={task.priority.toUpperCase()}
                                            color={task.priority === 'high' ? 'error' : 'primary'}
                                            variant="filled"
                                        />
                                    </Box>
                                ))
                            ) : (
                                <Box sx={{ py: 3, textAlign: 'center', opacity: 0.6 }}>
                                    <Typography variant="body2">No pending tasks</Typography>
                                </Box>
                            )}
                        </Stack>
                    </AppSection>
                </Grid>

                {/* Sidebar: Quick Actions */}
                <Grid size={{ xs: 12, lg: 4 }}>
                    <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>Quick Actions</Typography>
                    <Stack spacing={2}>
                        <AppButton
                            variant="contained"
                            fullWidth
                            size="large"
                            startIcon={<AddIcon />}
                            onClick={() => navigate('/teacher/homework/add')}
                            sx={{ py: 2 }}
                        >
                            Add Homework
                        </AppButton>
                        <AppButton
                            variant="outlined"
                            fullWidth
                            size="large"
                            startIcon={<ScheduleIcon />}
                            onClick={() => navigate('/teacher/exam/book')}
                            sx={{ py: 2 }}
                        >
                            Book Exam
                        </AppButton>
                        <AppButton
                            variant="outlined"
                            fullWidth
                            size="large"
                            startIcon={<ChatIcon />}
                            onClick={() => navigate('/teacher/chat')}
                            sx={{
                                py: 2,
                                borderColor: '#7c3aed',
                                color: '#7c3aed',
                                '&:hover': { borderColor: '#6d28d9', bgcolor: '#f5f3ff' }
                            }}
                        >
                            Chat with Parents
                        </AppButton>
                        <AppButton
                            variant="text"
                            fullWidth
                            size="large"
                            startIcon={<EventIcon />}
                            onClick={() => navigate('/teacher/leave/apply')}
                            sx={{ py: 2, color: 'text.secondary' }}
                        >
                            Apply Leave
                        </AppButton>
                    </Stack>

                    <AppCard sx={{ mt: 4, p: 3, bgcolor: 'secondary.main', color: 'secondary.contrastText' }}>
                        <Typography variant="h6" sx={{ mb: 1 }}>Teacher Support</Typography>
                        <Typography variant="body2" sx={{ mb: 3, opacity: 0.9 }}>
                            Need technical help with the platform?
                        </Typography>
                        <AppButton variant="contained" color="primary" fullWidth onClick={() => setSupportDialogOpen(true)}>
                            Open Support Ticket
                        </AppButton>
                    </AppCard>
                </Grid>
            </Grid>

            <RequestChangeDialog
                open={supportDialogOpen}
                onClose={() => setSupportDialogOpen(false)}
                schoolId={schoolId}
                userId={teacherId}
                userName={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Teacher'}
                userType="teacher"
                fieldType="general"
            />
        </Box>
    );
};

export default TeacherDashboard;

