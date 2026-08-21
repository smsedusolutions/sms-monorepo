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
    Button,
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
import { useGetExams, useGetExamPublishStatus } from '../../queries/Exam';
import { useTimeSettingsStore } from '../../stores/timeSettingsStore';
import { formatTimeDisplay } from '../../utils/timeUtils';
import RequestChangeDialog from '../../components/Dialogs/RequestChangeDialog';
import ExamPerformanceChart from '../../components/Dashboard/ExamPerformanceChart';
import UpcomingEventsWidget from '../../components/Dashboard/UpcomingEventsWidget';
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
    const { data: examsData, isLoading: isExamsLoading } = useGetExams(schoolId);

    const teacher = teacherData?.data;
    const allClasses: Class[] = classesData?.data || [];
    const allStudents: Student[] = studentsData?.data || [];
    const exams = examsData?.data || [];

    const activeExam = exams.find((e: any) => e.status === 'published' || e.status === 'completed') || exams[0];

    const { data: publishStatusData, isLoading: isStatusLoading } = useGetExamPublishStatus(
        schoolId,
        activeExam?.examId || ''
    );
    const publishData = publishStatusData?.data;

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
        <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
            {/* Professional Greeting */}
            <Box sx={{ mb: { xs: 2, sm: 3 }, mt: 0.5 }}>
                {isLoading ? (
                    <>
                        <Skeleton variant="text" width="60%" height={40} sx={{ borderRadius: 2 }} />
                        <Skeleton variant="text" width="40%" height={24} sx={{ mt: 0.5 }} />
                    </>
                ) : (
                    <Box>
                        <Typography
                            variant="h4"
                            fontWeight={800}
                            sx={{
                                mb: 0.25,
                                background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                fontSize: { xs: '1.45rem', sm: '1.85rem', md: '2.25rem' },
                                letterSpacing: '-0.02em',
                                lineHeight: 1.2
                            }}
                        >
                            Good morning, {user?.firstName || 'Teacher'}!
                        </Typography>
                        <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                            You have {stats?.periodsToday || 0} classes scheduled for today.
                        </Typography>
                    </Box>
                )}
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2.5 }}>
                    Failed to load dashboard stats. Please try again.
                </Alert>
            )}

            {/* Upcoming Events & Schedule Gadget */}
            <UpcomingEventsWidget calendarPath="/teacher/calendar" />

            {/* Quick Stats Grid */}
            <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 2, sm: 3 } }}>
                {isLoading ? (
                    [1, 2, 3].map((i) => (
                        <Grid size={{ xs: 4, sm: 4, md: 4 }} key={i}>
                            <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2.5 }} />
                        </Grid>
                    ))
                ) : (
                    [
                        { label: 'Total Students', value: assignedTotalStudents > 0 ? assignedTotalStudents : (stats?.totalStudents || 0), icon: <StudentsIcon sx={{ fontSize: { xs: 18, sm: 22 } }} />, color: '#6366f1' },
                        { label: 'Today Attendance', value: stats?.attendancePercentage || 'Not Marked', icon: <AttendanceIcon sx={{ fontSize: { xs: 18, sm: 22 } }} />, color: '#10b981' },
                        { label: 'Pending Leaves', value: stats?.pendingLeaveRequests || 0, icon: <EventIcon sx={{ fontSize: { xs: 18, sm: 22 } }} />, color: '#f59e0b' },
                    ].map((stat) => (
                        <Grid size={{ xs: 4, sm: 4, md: 4 }} key={stat.label}>
                            <Paper
                                elevation={0}
                                sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    alignItems: { xs: 'flex-start', sm: 'center' },
                                    gap: { xs: 1, sm: 2 },
                                    p: { xs: 1.25, sm: 2 },
                                    borderRadius: 2.5,
                                    bgcolor: '#ffffff',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                                    height: '100%'
                                }}
                            >
                                <Avatar sx={{ bgcolor: `${stat.color}15`, color: stat.color, width: { xs: 32, sm: 42 }, height: { xs: 32, sm: 42 }, border: '1px solid', borderColor: `${stat.color}20`, borderRadius: 2 }}>
                                    {stat.icon}
                                </Avatar>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="h6" fontWeight={800} sx={{ fontSize: { xs: '1.05rem', sm: '1.35rem' }, lineHeight: 1.1 }} noWrap>{stat.value}</Typography>
                                    <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, display: 'block' }} noWrap>{stat.label}</Typography>
                                </Box>
                            </Paper>
                        </Grid>
                    ))
                )}
            </Grid>

            {/* Quick Attendance CTA Banner & Chat */}
            <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 2, sm: 3 } }}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper
                        elevation={0}
                        onClick={() => navigate('/teacher/attendance')}
                        sx={{
                            p: { xs: 1.5, sm: 2 },
                            borderRadius: 2.5,
                            bgcolor: '#f0fdf4',
                            border: '1px solid #a7f3d0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 1.5,
                            cursor: 'pointer',
                            transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                            '&:hover': {
                                transform: 'translateY(-1.5px)',
                                boxShadow: '0 6px 18px rgba(16, 185, 129, 0.12)',
                            }
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                            <Box sx={{ p: 0.75, borderRadius: 2, bgcolor: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <AttendanceIcon sx={{ fontSize: 20 }} />
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" fontWeight={700} color="#065f46" sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                                    Record Attendance
                                </Typography>
                                <Typography variant="caption" color="#047857" sx={{ fontSize: '0.72rem', display: { xs: 'none', sm: 'block' } }}>
                                    Mark simple or period-wise student attendance.
                                </Typography>
                            </Box>
                        </Box>
                        <Button
                            variant="contained"
                            size="small"
                            onClick={(e) => { e.stopPropagation(); navigate('/teacher/attendance'); }}
                            sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, fontWeight: 700, borderRadius: 2, textTransform: 'none', fontSize: '0.75rem', px: 1.5, py: 0.4, flexShrink: 0 }}
                        >
                            Mark Now
                        </Button>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper
                        elevation={0}
                        onClick={() => navigate('/teacher/chat')}
                        sx={{
                            p: { xs: 1.5, sm: 2 },
                            borderRadius: 2.5,
                            bgcolor: '#f5f3ff',
                            border: '1px solid #c4b5fd',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 1.5,
                            cursor: 'pointer',
                            transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                            '&:hover': {
                                transform: 'translateY(-1.5px)',
                                boxShadow: '0 6px 18px rgba(139, 92, 246, 0.12)',
                            }
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                            <Box sx={{ p: 0.75, borderRadius: 2, bgcolor: '#7c3aed', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ChatIcon sx={{ fontSize: 20 }} />
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" fontWeight={700} color="#4c1d95" sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                                    Chat with Parents
                                </Typography>
                                <Typography variant="caption" color="#6d28d9" sx={{ fontSize: '0.72rem', display: { xs: 'none', sm: 'block' } }}>
                                    Send secure messages regarding student progress.
                                </Typography>
                            </Box>
                        </Box>
                        <Button
                            variant="contained"
                            size="small"
                            onClick={(e) => { e.stopPropagation(); navigate('/teacher/chat'); }}
                            sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' }, fontWeight: 700, borderRadius: 2, textTransform: 'none', fontSize: '0.75rem', px: 1.5, py: 0.4, flexShrink: 0 }}
                        >
                            Open Chat
                        </Button>
                    </Paper>
                </Grid>
            </Grid>

            {/* My Assigned Classes Section */}
            {myClassCards.length > 0 && (
                <Box sx={{ mb: { xs: 2.5, sm: 3 } }}>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5, fontSize: { xs: '0.95rem', sm: '1.05rem' } }}>My Assigned Classes</Typography>
                    <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                        {myClassCards.map((c, index) => {
                            const color = cardColors[index % cardColors.length];
                            return (
                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={c.classId}>
                                    <Card
                                        onClick={() => navigate('/teacher/attendance')}
                                        sx={{
                                            borderRadius: 2.5,
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                                            border: `1px solid ${color.accent}30`,
                                            bgcolor: 'background.paper',
                                            cursor: 'pointer',
                                            transition: 'all 0.18s ease',
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
                                                boxShadow: `0 6px 18px ${color.accent}20`,
                                            }
                                        }}
                                    >
                                        <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                                <Avatar sx={{ bgcolor: color.iconBg, color: color.accent, width: 36, height: 36, borderRadius: 2 }}>
                                                    <ClassIcon sx={{ fontSize: 18 }} />
                                                </Avatar>
                                                {c.isClassTeacher && (
                                                    <Chip
                                                        icon={<StarIcon sx={{ fontSize: '12px !important' }} />}
                                                        label="Class Teacher"
                                                        size="small"
                                                        sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 700, fontSize: '0.65rem', height: 20 }}
                                                    />
                                                )}
                                            </Box>

                                            <Typography variant="subtitle1" fontWeight={800} color="#1e293b" sx={{ fontSize: '0.95rem', mb: 0.5 }}>
                                                {c.className}
                                            </Typography>

                                            <Box sx={{ display: 'flex', gap: 2, mt: 0.5, flexWrap: 'wrap' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <SchoolIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                                                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: '0.72rem' }}>
                                                        {c.sectionLabel}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <GroupsIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                                                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: '0.72rem' }}>
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
                </Box>
            )}

            <Grid container spacing={{ xs: 2, sm: 3 }}>
                {/* Main Content: Schedule & Tasks */}
                <Grid size={{ xs: 12, lg: 8 }}>
                    <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                            <Typography variant="subtitle1" fontWeight={700} sx={{ fontSize: { xs: '0.95rem', sm: '1.05rem' } }}>Today's Schedule</Typography>
                            <Button size="small" variant="text" onClick={() => navigate('/teacher/timetable')} sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'none' }}>
                                Full Timetable
                            </Button>
                        </Box>
                        {isLoading ? (
                            <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2.5 }} />
                        ) : (
                            <Grid container spacing={1.5}>
                                {stats?.todaySchedule && stats.todaySchedule.length > 0 ? (
                                    stats.todaySchedule.map((period, i) => (
                                        <Grid size={{ xs: 12, sm: 6 }} key={i}>
                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    p: 1.5,
                                                    borderRadius: 2.5,
                                                    border: '1px solid #e2e8f0',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1.5,
                                                    bgcolor: '#ffffff',
                                                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                                                    transition: 'all 0.18s ease',
                                                    '&:hover': {
                                                        transform: 'translateY(-1.5px)',
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                                    }
                                                }}
                                            >
                                                <Box sx={{
                                                    p: 1,
                                                    borderRadius: 2,
                                                    bgcolor: 'primary.light',
                                                    color: 'primary.dark',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    minWidth: 70,
                                                    textAlign: 'center'
                                                }}>
                                                    <Typography variant="caption" fontWeight={800} sx={{ textTransform: 'uppercase', fontSize: '0.72rem', opacity: 0.85 }}>
                                                        P#{period.periodNumber}
                                                    </Typography>
                                                    <Typography variant="caption" fontWeight={700} sx={{ mt: 0.25, fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                                                        {formatTimeDisplay(period.time, timeFormat)}
                                                    </Typography>
                                                </Box>
                                                 <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                                    <Typography variant="subtitle2" fontWeight={700} color="text.primary" noWrap sx={{ fontSize: '0.85rem' }}>{period.subject}</Typography>
                                                    <Typography variant="caption" color="text.secondary" fontWeight={500} noWrap sx={{ display: 'block', fontSize: '0.72rem' }}>{period.class}</Typography>
                                                </Box>
                                            </Paper>
                                        </Grid>
                                    ))
                                ) : (
                                    <Box sx={{ py: 3, width: '100%', textAlign: 'center' }}>
                                        <ScheduleIcon sx={{ fontSize: 36, color: 'text.disabled', opacity: 0.5, mb: 0.5 }} />
                                        <Typography color="text.secondary" variant="body2" sx={{ fontSize: '0.8rem' }}>No classes scheduled for today</Typography>
                                    </Box>
                                )}
                            </Grid>
                        )}
                    </Box>

                    {(() => {
                        const examName = publishData?.exam?.name || activeExam?.name;
                        const examStatus = publishData?.exam?.status || activeExam?.status;

                        let teacherPassed = 0;
                        let teacherFailed = 0;
                        let teacherAbsent = 0;

                        const teacherClassIds = new Set(myClassCards.map((c) => c.classId));

                        if (publishData?.subjects && publishData.subjects.length > 0) {
                            publishData.subjects.forEach((subj: any) => {
                                if (teacherClassIds.has(subj.classId) && subj.publishStatus === 'final_published') {
                                    teacherPassed += subj.passedCount || 0;
                                    teacherFailed += subj.failedCount || 0;
                                    teacherAbsent += subj.absentCount || 0;
                                }
                            });
                        }

                        const totalTeacherResults = teacherPassed + teacherFailed + teacherAbsent;
                        const hasPublishedResults = publishData?.summary?.finalPublishedCount && publishData.summary.finalPublishedCount > 0;

                        const teacherStatusMessage = !activeExam
                            ? 'No examinations scheduled yet'
                            : examStatus === 'draft' || examStatus === 'scheduled' || !hasPublishedResults
                            ? `${examName || 'Examination'} is scheduled • Results pending marks evaluation`
                            : totalTeacherResults === 0
                            ? 'Class results evaluation and publishing in progress'
                            : undefined;

                        return (
                            <Box sx={{ mb: { xs: 2.5, sm: 3 } }}>
                                <ExamPerformanceChart
                                    title="Class Exam Performance"
                                    examName={examName ? `${examName} (My Assigned Classes)` : undefined}
                                    examStatus={examStatus}
                                    isLoading={isExamsLoading || isStatusLoading}
                                    passed={teacherPassed}
                                    failed={teacherFailed}
                                    absent={teacherAbsent}
                                    statusMessage={teacherStatusMessage}
                                />
                            </Box>
                        );
                    })()}

                    <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5, fontSize: { xs: '0.95rem', sm: '1.05rem' } }}>Pending Tasks</Typography>
                        <Stack spacing={1}>
                            {isLoading ? (
                                [1, 2, 3].map((i) => <Skeleton key={i} variant="rectangular" height={50} sx={{ borderRadius: 2 }} />)
                            ) : stats?.pendingTasks && stats.pendingTasks.length > 0 ? (
                                stats.pendingTasks.map((task, i) => (
                                    <Paper
                                        key={i}
                                        elevation={0}
                                        onClick={() => {
                                            if (task.task.includes('Attendance')) {
                                                navigate('/teacher/attendance');
                                            }
                                        }}
                                        sx={{
                                            p: 1.5,
                                            borderRadius: 2.5,
                                            bgcolor: '#ffffff',
                                            border: '1px solid',
                                            borderColor: task.priority === 'high' ? '#fecaca' : '#e2e8f0',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            cursor: task.task.includes('Attendance') ? 'pointer' : 'default',
                                            '&:hover': task.task.includes('Attendance') ? { bgcolor: '#fef2f2' } : {}
                                        }}
                                    >
                                        <Box>
                                            <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.825rem' }}>{task.task}</Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                                Due: {format(new Date(task.deadline), 'MMM dd, yyyy')}
                                            </Typography>
                                        </Box>
                                        <Chip
                                            size="small"
                                            label={task.priority.toUpperCase()}
                                            color={task.priority === 'high' ? 'error' : 'primary'}
                                            variant="filled"
                                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                                        />
                                    </Paper>
                                ))
                            ) : (
                                <Box sx={{ py: 2, textAlign: 'center', opacity: 0.6 }}>
                                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>No pending tasks</Typography>
                                </Box>
                            )}
                        </Stack>
                    </Box>
                </Grid>

                {/* Sidebar: Quick Actions */}
                <Grid size={{ xs: 12, lg: 4 }}>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5, fontSize: { xs: '0.95rem', sm: '1.05rem' } }}>Quick Actions</Typography>
                    <Grid container spacing={1.5}>
                        {[
                            { label: 'Add Homework', icon: <AddIcon />, onClick: () => navigate('/teacher/homework/add'), color: '#3b82f6' },
                            { label: 'Book Exam', icon: <ScheduleIcon />, onClick: () => navigate('/teacher/exam/book'), color: '#8b5cf6' },
                            { label: 'Chat Parents', icon: <ChatIcon />, onClick: () => navigate('/teacher/chat'), color: '#7c3aed' },
                            { label: 'Apply Leave', icon: <EventIcon />, onClick: () => navigate('/teacher/leave/apply'), color: '#f59e0b' },
                        ].map((action) => (
                            <Grid size={{ xs: 6, lg: 6 }} key={action.label}>
                                <Paper
                                    elevation={0}
                                    onClick={action.onClick}
                                    sx={{
                                        p: { xs: 1.25, sm: 1.75 },
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        borderRadius: 2.5,
                                        bgcolor: '#ffffff',
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                                        transition: 'all 0.18s ease-in-out',
                                        '&:hover': { transform: 'translateY(-2px)', borderColor: '#cbd5e1', boxShadow: '0 4px 14px rgba(0,0,0,0.06)' }
                                    }}
                                >
                                    <Avatar sx={{ bgcolor: `${action.color}15`, color: action.color, mb: 0.75, mx: 'auto', width: 36, height: 36, border: '1px solid', borderColor: `${action.color}30` }}>
                                        {React.cloneElement(action.icon as any, { sx: { fontSize: 18 } })}
                                    </Avatar>
                                    <Typography variant="caption" fontWeight={700} color="text.primary" sx={{ display: 'block', fontSize: '0.75rem' }} noWrap>{action.label}</Typography>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>

                    <Paper sx={{ mt: 2, p: { xs: 1.75, sm: 2 }, bgcolor: '#1e293b', color: '#ffffff', borderRadius: 2.5 }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5, fontSize: '0.875rem' }}>Teacher Support</Typography>
                        <Typography variant="caption" sx={{ mb: 1.5, opacity: 0.85, display: 'block', fontSize: '0.72rem' }}>
                            Need technical help with the platform?
                        </Typography>
                        <Button
                            variant="contained"
                            size="small"
                            fullWidth
                            onClick={() => setSupportDialogOpen(true)}
                            sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' }, fontWeight: 700, borderRadius: 2, textTransform: 'none', py: 0.5, fontSize: '0.775rem' }}
                        >
                            Open Support Ticket
                        </Button>
                    </Paper>
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

