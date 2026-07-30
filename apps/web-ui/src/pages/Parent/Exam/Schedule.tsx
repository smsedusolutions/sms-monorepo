import React, { useState } from 'react';
import {
    Box,
    Typography,
    Alert,
    Skeleton,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Grid,
    Tabs,
    Tab,
    Button,
    Stack,
} from '@mui/material';
import {
    CalendarMonth as CalendarIcon,
    AccessTime as TimeIcon,
    Event as EventIcon,
    Badge as BadgeIcon,
} from '@mui/icons-material';
import { useChildSelector } from '../../../context/ChildSelectorContext';
import { useGetExams, useGetExamSchedule } from '../../../queries/Exam';
import { useGetSubjects } from '../../../queries/Subject';
import TokenService from '../../../queries/token/tokenService';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel = (props: TabPanelProps) => {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            {...other}
        >
            {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
        </div>
    );
};

const ParentExamSchedule: React.FC = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const { selectedChild, setSelectedChild, children: contextChildren, isLoading: loadingChild } = useChildSelector();
    const [selectedTab, setSelectedTab] = useState(0);

    // Fetch exams without restricting to hardcoded academic year
    const { data: examsData, isLoading: examsLoading, error } = useGetExams(schoolId);
    const { data: subjectsData } = useGetSubjects(schoolId);

    // Filter exams by status
    const allExams = examsData?.data || [];
    const upcomingExams = allExams.filter((e: any) => ['scheduled', 'draft'].includes(e.status));
    const ongoingExams = allExams.filter((e: any) => e.status === 'ongoing');
    const completedExams = allExams.filter((e: any) => e.status === 'completed');

    // Helper to get subject name
    const getSubjectName = (subjectId: string): string => {
        const subjectInfo = subjectsData?.data?.find((s: any) => s._id === subjectId || s.subjectId === subjectId);
        return subjectInfo?.name || subjectId;
    };

    // Show loading while children are being loaded
    if (loadingChild) {
        return (
            <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1300, mx: 'auto' }}>
                <Skeleton variant="text" width="40%" height={40} sx={{ mb: 2 }} />
                <Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: 4 }} />
            </Box>
        );
    }

    if (!selectedChild) {
        return (
            <Box sx={{ p: 3, maxWidth: 1300, mx: 'auto' }}>
                <Alert severity="info" sx={{ borderRadius: 3 }}>Please select a child to view their exam schedule.</Alert>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3, maxWidth: 1300, mx: 'auto' }}>
                <Alert severity="error" sx={{ borderRadius: 3 }}>Failed to load exam schedules. Please try again later.</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1300, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                    <Box sx={{ p: 1.25, borderRadius: 2.5, bgcolor: '#eff6ff', color: '#2563eb' }}>
                        <EventIcon sx={{ fontSize: 28 }} />
                    </Box>
                    <Box>
                        <Typography variant="h4" fontWeight={800} color="#1e293b" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                            Exam Schedule
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Timetables and schedules for {selectedChild.firstName} {selectedChild.lastName} ({selectedChild.className ? `Grade ${selectedChild.className}-${selectedChild.sectionName}` : 'Class'})
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* ── Multi-Child Switcher Bar ── */}
            {contextChildren.length > 1 && (
                <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 1, display: 'block' }}>
                        Select Child
                    </Typography>
                    <Stack direction="row" spacing={1.5} flexWrap="wrap">
                        {contextChildren.map((child) => {
                            const isSelected = selectedChild.studentId === child.studentId;
                            return (
                                <Button
                                    key={child.studentId}
                                    variant={isSelected ? 'contained' : 'outlined'}
                                    onClick={() => setSelectedChild(child)}
                                    startIcon={<BadgeIcon />}
                                    sx={{
                                        borderRadius: 2.5,
                                        fontWeight: 700,
                                        textTransform: 'none',
                                        px: 2.5,
                                        py: 0.75,
                                        bgcolor: isSelected ? '#2563eb' : '#ffffff',
                                        borderColor: isSelected ? '#2563eb' : '#cbd5e1',
                                        color: isSelected ? '#ffffff' : '#475569',
                                        '&:hover': {
                                            bgcolor: isSelected ? '#1d4ed8' : '#f1f5f9',
                                            borderColor: isSelected ? '#1d4ed8' : '#94a3b8',
                                        }
                                    }}
                                >
                                    {child.firstName} {child.lastName} {child.className ? `(${child.className}-${child.sectionName})` : ''}
                                </Button>
                            );
                        })}
                    </Stack>
                </Paper>
            )}

            {/* Status Filter Tabs */}
            <Tabs
                value={selectedTab}
                onChange={(_, newValue) => setSelectedTab(newValue)}
                sx={{
                    mb: 2,
                    borderBottom: '1px solid #e2e8f0',
                    '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', fontSize: '0.95rem' }
                }}
            >
                <Tab label={`Upcoming (${upcomingExams.length})`} />
                <Tab label={`Ongoing (${ongoingExams.length})`} />
                <Tab label={`Completed (${completedExams.length})`} />
            </Tabs>

            <TabPanel value={selectedTab} index={0}>
                {examsLoading ? (
                    <Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: 4 }} />
                ) : upcomingExams.length === 0 ? (
                    <Paper elevation={0} sx={{ p: 5, textAlign: 'center', borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                        <EventIcon sx={{ fontSize: 54, color: '#cbd5e1', mb: 1.5 }} />
                        <Typography variant="h6" fontWeight={700} color="#1e293b">No Upcoming Exams Scheduled</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            There are currently no upcoming exams scheduled for this academic term.
                        </Typography>
                    </Paper>
                ) : (
                    <Grid container spacing={3}>
                        {upcomingExams.map((exam: any) => (
                            <ExamScheduleCard
                                key={exam.examId}
                                exam={exam}
                                schoolId={schoolId}
                                selectedChild={selectedChild}
                                getSubjectName={getSubjectName}
                            />
                        ))}
                    </Grid>
                )}
            </TabPanel>

            <TabPanel value={selectedTab} index={1}>
                {examsLoading ? (
                    <Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: 4 }} />
                ) : ongoingExams.length === 0 ? (
                    <Paper elevation={0} sx={{ p: 5, textAlign: 'center', borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                        <EventIcon sx={{ fontSize: 54, color: '#cbd5e1', mb: 1.5 }} />
                        <Typography variant="h6" fontWeight={700} color="#1e293b">No Ongoing Exams</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            No examinations are currently in progress.
                        </Typography>
                    </Paper>
                ) : (
                    <Grid container spacing={3}>
                        {ongoingExams.map((exam: any) => (
                            <ExamScheduleCard
                                key={exam.examId}
                                exam={exam}
                                schoolId={schoolId}
                                selectedChild={selectedChild}
                                getSubjectName={getSubjectName}
                            />
                        ))}
                    </Grid>
                )}
            </TabPanel>

            <TabPanel value={selectedTab} index={2}>
                {examsLoading ? (
                    <Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: 4 }} />
                ) : completedExams.length === 0 ? (
                    <Paper elevation={0} sx={{ p: 5, textAlign: 'center', borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                        <EventIcon sx={{ fontSize: 54, color: '#cbd5e1', mb: 1.5 }} />
                        <Typography variant="h6" fontWeight={700} color="#1e293b">No Completed Exams</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Past completed examinations will be archived here.
                        </Typography>
                    </Paper>
                ) : (
                    <Grid container spacing={3}>
                        {completedExams.map((exam: any) => (
                            <ExamScheduleCard
                                key={exam.examId}
                                exam={exam}
                                schoolId={schoolId}
                                selectedChild={selectedChild}
                                getSubjectName={getSubjectName}
                            />
                        ))}
                    </Grid>
                )}
            </TabPanel>
        </Box>
    );
};

const ExamScheduleCard = ({
    exam,
    schoolId,
    selectedChild,
    getSubjectName
}: {
    exam: any;
    schoolId: string;
    selectedChild: any;
    getSubjectName: (id: string) => string
}) => {
    const { data: scheduleData, isLoading } = useGetExamSchedule(schoolId, exam.examId);

    // Filter and deduplicate exam schedule specifically for selected child's class
    const examSchedule = React.useMemo(() => {
        if (!scheduleData?.data) return [];

        const childClass = selectedChild?.classId || selectedChild?.class || selectedChild?.className;

        // Filter schedule matching selected child's class
        const classFiltered = scheduleData.data.filter((sch: any) => {
            if (!childClass) return true;
            return (
                sch.classId === childClass ||
                sch.classId === selectedChild?.classId ||
                sch.classId === selectedChild?.class ||
                sch.classId === selectedChild?.className
            );
        });

        // Deduplicate by subjectId + date + startTime
        const uniqueMap = new Map();
        classFiltered.forEach((sch: any) => {
            const dateStr = sch.date ? new Date(sch.date).toISOString().split('T')[0] : '';
            const key = `${sch.subjectId}_${dateStr}_${sch.startTime}`;
            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, sch);
            }
        });

        return Array.from(uniqueMap.values());
    }, [scheduleData?.data, selectedChild]);

    return (
        <Grid size={{ xs: 12 }}>
            <Card
                elevation={0}
                sx={{
                    borderRadius: 4,
                    border: '1px solid #e2e8f0',
                    bgcolor: '#ffffff',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                    }
                }}
            >
                <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                        <Box>
                            <Typography variant="h6" fontWeight={800} color="#1e293b">
                                {exam.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                {exam.typeId?.name || 'Examination'} | {exam.termId?.name || 'Term'} | Academic Year: {exam.academicYear}
                            </Typography>
                        </Box>
                        <Chip
                            label={exam.status?.toUpperCase() || 'SCHEDULED'}
                            color={exam.status === 'scheduled' ? 'primary' : exam.status === 'ongoing' ? 'warning' : 'success'}
                            size="small"
                            sx={{ fontWeight: 700, px: 1 }}
                        />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5, bgcolor: '#f8fafc', p: 1.5, borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
                        <CalendarIcon fontSize="small" sx={{ color: '#2563eb' }} />
                        <Typography variant="body2" fontWeight={600} color="#334155">
                            Exam Period: {new Date(exam.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {' — '}
                            {new Date(exam.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </Typography>
                    </Box>

                    {isLoading ? (
                        <Skeleton variant="rectangular" width="100%" height={160} sx={{ borderRadius: 2.5 }} />
                    ) : examSchedule.length > 0 ? (
                        <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                                        <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Time Slot</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {examSchedule.map((schedule: any, index: number) => (
                                        <TableRow key={schedule._id || index} hover>
                                            <TableCell sx={{ fontWeight: 600 }}>
                                                {new Date(schedule.date).toLocaleDateString('en-IN', {
                                                    weekday: 'short',
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                    <TimeIcon fontSize="small" sx={{ color: '#64748b', fontSize: 16 }} />
                                                    <Typography variant="body2" fontWeight={500}>
                                                        {schedule.startTime} - {schedule.endTime}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: '#2563eb' }}>
                                                {getSubjectName(schedule.subjectId)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Alert severity="info" sx={{ borderRadius: 2 }}>Subject timetable schedule will be published shortly by school administration.</Alert>
                    )}
                </CardContent>
            </Card>
        </Grid>
    );
};

export default ParentExamSchedule;
