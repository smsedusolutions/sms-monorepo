import React, { useMemo } from 'react';
import {
    Box,
    Typography,
    Alert,
    Skeleton,
    Paper,
    Chip,
    Grid,
    Button,
    Stack,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    ToggleButton,
    ToggleButtonGroup,
    useTheme,
    useMediaQuery,
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
import { useUrlTab } from '../../../hooks/useUrlTab';
import { useAcademicYear } from '../../../hooks/useAcademicYear';

const fmtDate = (d: string | Date) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

const fmtDay = (d: string | Date) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { weekday: 'short' });
};

const ParentExamSchedule: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const schoolId = TokenService.getSchoolId() || '';
    const { selectedChild, setSelectedChild, children: contextChildren, isLoading: loadingChild } = useChildSelector();
    const [selectedTab, setSelectedTab] = useUrlTab(0, ['upcoming', 'ongoing', 'completed']);

    const { data: examsData, isLoading: examsLoading, error } = useGetExams(schoolId);
    const { data: subjectsData } = useGetSubjects(schoolId);

    const allExams = examsData?.data || [];
    const sortByStartDate = (a: any, b: any) => {
        const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
        const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
        return dateA - dateB;
    };

    const upcomingExams = allExams.filter((e: any) => ['scheduled', 'draft'].includes(e.status)).sort(sortByStartDate);
    const ongoingExams = allExams.filter((e: any) => e.status === 'ongoing').sort(sortByStartDate);
    const completedExams = allExams.filter((e: any) => e.status === 'completed').sort(sortByStartDate);

    const tabExams = [upcomingExams, ongoingExams, completedExams][selectedTab] ?? [];

    const getSubjectName = (subjectId: string): string => {
        const subjectInfo = subjectsData?.data?.find((s: any) => s._id === subjectId || s.subjectId === subjectId);
        return subjectInfo?.name || subjectId;
    };

    if (loadingChild) {
        return (
            <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: 'auto' }}>
                <Skeleton variant="text" width="40%" height={36} sx={{ mb: 2 }} />
                <Skeleton variant="rectangular" width="100%" height={240} sx={{ borderRadius: 3 }} />
            </Box>
        );
    }

    if (!selectedChild) {
        return (
            <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: 'auto' }}>
                <Alert severity="info" sx={{ borderRadius: 2.5 }}>Please select a child to view their exam schedule.</Alert>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: 'auto' }}>
                <Alert severity="error" sx={{ borderRadius: 2.5 }}>Failed to load exam schedules. Please try again later.</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ mb: 2 }}>
                <Typography variant={isMobile ? "h6" : "h5"} fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EventIcon color="primary" />
                    Exam Schedule
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Timetables and schedules for {selectedChild.firstName} {selectedChild.lastName} ({selectedChild.className ? `Grade ${selectedChild.className}-${selectedChild.sectionName || ''}` : 'Class'})
                </Typography>
            </Box>

            {/* Child Selector Pills */}
            {contextChildren.length > 1 && (
                <Paper elevation={0} sx={{ p: 1.5, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 1, display: 'block' }}>
                        Select Child
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 0.5 }}>
                        {contextChildren.map((child) => {
                            const isSelected = selectedChild.studentId === child.studentId;
                            return (
                                <Button
                                    key={child.studentId}
                                    variant={isSelected ? 'contained' : 'outlined'}
                                    size="small"
                                    onClick={() => setSelectedChild(child)}
                                    startIcon={<BadgeIcon />}
                                    sx={{
                                        borderRadius: 2,
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        px: 1.75,
                                        py: 0.5,
                                        whiteSpace: 'nowrap',
                                        fontSize: '0.8rem',
                                    }}
                                >
                                    {child.firstName} {child.lastName} {child.className ? `(${child.className})` : ''}
                                </Button>
                            );
                        })}
                    </Box>
                </Paper>
            )}

            {/* Compact 3-Item Summary Stat Bar */}
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
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
                            bgcolor: 'grey.50',
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        <Typography variant={isMobile ? "h6" : "h5"} fontWeight={700} color="text.primary">
                            {completedExams.length}
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
                    <ToggleButton value={0}>Upcoming ({upcomingExams.length})</ToggleButton>
                    <ToggleButton value={1}>Ongoing ({ongoingExams.length})</ToggleButton>
                    <ToggleButton value={2}>Completed ({completedExams.length})</ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* Exam Content */}
            {examsLoading ? (
                <Skeleton variant="rectangular" width="100%" height={260} sx={{ borderRadius: 3 }} />
            ) : tabExams.length === 0 ? (
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
                    <EventIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
                    <Typography variant="subtitle1" fontWeight={600} color="text.primary" gutterBottom>
                        No {['upcoming', 'ongoing', 'completed'][selectedTab]} exams
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        There are no exams found in this category for {selectedChild.firstName}.
                    </Typography>
                </Paper>
            ) : (
                <Stack spacing={2.5}>
                    {tabExams.map((exam: any) => (
                        <ExamScheduleCard
                            key={exam.examId}
                            exam={exam}
                            schoolId={schoolId}
                            selectedChild={selectedChild}
                            getSubjectName={getSubjectName}
                            isMobile={isMobile}
                        />
                    ))}
                </Stack>
            )}
        </Box>
    );
};

const ExamScheduleCard = ({
    exam,
    schoolId,
    selectedChild,
    getSubjectName,
    isMobile,
}: {
    exam: any;
    schoolId: string;
    selectedChild: any;
    getSubjectName: (id: string) => string;
    isMobile: boolean;
}) => {
    const { currentAcademicYear } = useAcademicYear();
    const { data: scheduleData, isLoading } = useGetExamSchedule(schoolId, exam.examId);

    const examSchedule = useMemo(() => {
        if (!scheduleData?.data) return [];

        const childClass = selectedChild?.classId || selectedChild?.class || selectedChild?.className;

        const classFiltered = scheduleData.data.filter((sch: any) => {
            if (!childClass) return true;
            return (
                sch.classId === childClass ||
                sch.classId === selectedChild?.classId ||
                sch.classId === selectedChild?.class ||
                sch.classId === selectedChild?.className
            );
        });

        // Deduplicate
        const uniqueMap = new Map();
        classFiltered.forEach((sch: any) => {
            const dateStr = sch.date ? new Date(sch.date).toISOString().split('T')[0] : '';
            const key = `${sch.subjectId}_${dateStr}_${sch.startTime}`;
            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, sch);
            }
        });

        return Array.from(uniqueMap.values()).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [scheduleData?.data, selectedChild]);

    return (
        <Paper
            elevation={0}
            sx={{
                borderRadius: 2,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
            }}
        >
            {/* Header */}
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
                            {exam.typeId?.name || 'Examination'} • {exam.termId?.name || 'Term'} • Academic Year: {exam.academicYear || currentAcademicYear}
                        </Typography>
                    </Box>
                    <Chip
                        label={exam.status}
                        size="small"
                        color={exam.status === 'scheduled' ? 'warning' : exam.status === 'ongoing' ? 'success' : 'default'}
                        sx={{ textTransform: 'capitalize', fontWeight: 700, fontSize: '0.75rem', height: 24 }}
                    />
                </Box>

                {/* Period Badge */}
                {exam.startDate && (
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, bgcolor: '#ffffff', px: 1, py: 0.5, borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                        <CalendarIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                        <Typography variant="caption" fontWeight={600} color="text.primary">
                            {fmtDate(exam.startDate)} — {fmtDate(exam.endDate)}
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Schedule Section */}
            <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
                {isLoading ? (
                    <Skeleton variant="rectangular" width="100%" height={120} sx={{ borderRadius: 2 }} />
                ) : examSchedule.length === 0 ? (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                        Timetable schedule for this examination will be published shortly.
                    </Alert>
                ) : isMobile ? (
                    /* Mobile Period Cards */
                    <Stack spacing={1}>
                        {examSchedule.map((schedule: any) => (
                            <Paper
                                key={schedule._id}
                                elevation={0}
                                sx={{
                                    p: 1.5,
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    bgcolor: 'grey.50',
                                }}
                            >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                                    <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                                        {getSubjectName(schedule.subjectId)}
                                    </Typography>
                                    <Chip
                                        label={fmtDay(schedule.date)}
                                        size="small"
                                        variant="outlined"
                                        sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                                    />
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <CalendarIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                        <Typography variant="caption" fontWeight={600} color="text.primary">
                                            {fmtDate(schedule.date)}
                                        </Typography>
                                    </Box>
                                    <Divider orientation="vertical" flexItem sx={{ height: 12, my: 'auto' }} />
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <TimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                        <Typography variant="caption" fontWeight={600} color="text.secondary">
                                            {schedule.startTime} – {schedule.endTime}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Paper>
                        ))}
                    </Stack>
                ) : (
                    /* Desktop Table */
                    <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: 'grey.50' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Day</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Time Slot</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {examSchedule.map((schedule: any) => (
                                    <TableRow key={schedule._id} hover>
                                        <TableCell sx={{ fontWeight: 600 }}>{fmtDate(schedule.date)}</TableCell>
                                        <TableCell sx={{ color: 'text.secondary' }}>{fmtDay(schedule.date)}</TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <TimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                <Typography variant="body2">{schedule.startTime} – {schedule.endTime}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                                            {getSubjectName(schedule.subjectId)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Box>
        </Paper>
    );
};

export default ParentExamSchedule;
