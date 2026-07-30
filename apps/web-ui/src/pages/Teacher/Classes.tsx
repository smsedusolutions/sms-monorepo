import { useState } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CardActionArea,
    Chip,
    Collapse,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    CircularProgress,
    Alert,
    Avatar,
    Skeleton,
    Paper,
} from '@mui/material';
import {
    Class as ClassIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Groups as GroupsIcon,
    Star as StarIcon,
    School as SchoolIcon,
} from '@mui/icons-material';
import { useGetTeacherById } from '../../queries/Teacher';
import { useGetClasses } from '../../queries/Class';
import { useGetStudents } from '../../queries/Student';
import TokenService from '../../queries/token/tokenService';
import type { Class, Student } from '../../types';

const TeacherClasses = () => {
    const [expandedClass, setExpandedClass] = useState<string | null>(null);

    const schoolId = TokenService.getSchoolId() || '';
    const user = TokenService.getUser();
    const teacherId = user?.teacherId || user?.userId || '';

    // Fetch teacher profile to get assigned classes
    const { data: teacherData, isLoading: loadingTeacher } = useGetTeacherById(schoolId, teacherId);
    const teacher = teacherData?.data;
    const teacherClasses = teacher?.classes || [];
    const teacherSections = (teacher as any)?.sections || [];
    const classTeacherSectionId = teacher?.classTeacherSectionId;

    // Fetch all classes and students
    const { data: classesData, isLoading: loadingClasses } = useGetClasses(schoolId);
    const { data: studentsData, isLoading: loadingStudents } = useGetStudents(schoolId);

    const allClasses = classesData?.data || [];
    const allStudents = studentsData?.data || [];

    // Parse class IDs from teacherClasses (handling CLASS#SEC notation)
    const parsedTeacherClassIds = teacherClasses.map((c: string) => c.split('#')[0]);
    const sectionClassIds = teacherSections.map((s: string) => s.split('#')[0]);
    const classTeacherClassId = classTeacherSectionId?.split('#')[0];

    const allAssignedIds = [...new Set([...parsedTeacherClassIds, ...sectionClassIds, classTeacherClassId].filter(Boolean))];

    const myClasses = allAssignedIds.length > 0
        ? allClasses.filter((c: Class) => allAssignedIds.includes(c.classId))
        : allClasses;

    const isLoading = loadingTeacher || loadingClasses || loadingStudents;

    // Helper: get student count for a class (optionally filtered by section)
    const getStudentCount = (classId: string, sectionId?: string): number => {
        return allStudents.filter((s: Student) => {
            if (s.class !== classId) return false;
            if (sectionId && s.section !== sectionId) return false;
            return s.status === 'active';
        }).length;
    };

    // Helper: check if teacher is class teacher for a given section
    const isClassTeacherOf = (classId: string, sectionId: string): boolean => {
        return classTeacherSectionId === `${classId}#${sectionId}`;
    };

    // Helper: get sections relevant to teacher (if sections assigned, filter; else show all)
    const getRelevantSections = (classItem: Class) => {
        if (teacherSections && teacherSections.length > 0) {
            const filtered = classItem.sections.filter(s => teacherSections.includes(s.sectionId));
            // Always include sections where teacher is class teacher
            const classTeacherFiltered = classItem.sections.filter(
                s => isClassTeacherOf(classItem.classId, s.sectionId) && !filtered.find(f => f.sectionId === s.sectionId)
            );
            const combined = [...filtered, ...classTeacherFiltered];
            return combined.length > 0 ? combined : classItem.sections;
        }
        return classItem.sections;
    };

    const handleToggleExpand = (classId: string) => {
        setExpandedClass(expandedClass === classId ? null : classId);
    };

    // Card colors
    const cardColors = [
        { bg: '#ecfdf5', accent: '#10b981', iconBg: '#d1fae5' },
        { bg: '#eff6ff', accent: '#3b82f6', iconBg: '#dbeafe' },
        { bg: '#f5f3ff', accent: '#8b5cf6', iconBg: '#ede9fe' },
        { bg: '#fdf2f8', accent: '#ec4899', iconBg: '#fce7f3' },
        { bg: '#fffbeb', accent: '#f59e0b', iconBg: '#fef3c7' },
        { bg: '#ecfeff', accent: '#06b6d4', iconBg: '#cffafe' },
    ];

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Typography
                    variant="h4"
                    fontWeight={600}
                    gutterBottom
                    color="#1e293b"
                    sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}
                >
                    My Classes
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    View and manage your assigned classes and sections.
                </Typography>
            </Box>

            {/* Loading State */}
            {isLoading && (
                <Grid container spacing={3}>
                    {[1, 2, 3].map((i) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                            <Skeleton
                                variant="rounded"
                                height={180}
                                sx={{ borderRadius: 3 }}
                            />
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Error / Empty States */}
            {!isLoading && !teacher && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    Failed to load teacher profile. Please try again.
                </Alert>
            )}

            {!isLoading && teacher && myClasses.length === 0 && (
                <Paper
                    sx={{
                        p: 6,
                        textAlign: 'center',
                        borderRadius: 3,
                        bgcolor: '#f8fafc',
                        border: '2px dashed #e2e8f0',
                    }}
                >
                    <SchoolIcon sx={{ fontSize: 64, color: '#94a3b8', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No Classes Assigned
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        You haven't been assigned to any classes yet. Please contact your school administrator.
                    </Typography>
                </Paper>
            )}

            {/* Class Cards */}
            {!isLoading && myClasses.length > 0 && (
                <Grid container spacing={3}>
                    {myClasses.map((classItem: Class, index: number) => {
                        const color = cardColors[index % cardColors.length];
                        const sections = getRelevantSections(classItem);
                        const totalStudents = getStudentCount(classItem.classId);
                        const isClassTeacher = classItem.sections.some(
                            s => isClassTeacherOf(classItem.classId, s.sectionId)
                        );
                        const isExpanded = expandedClass === classItem.classId;

                        return (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={classItem.classId}>
                                <Card
                                    sx={{
                                        borderRadius: 3,
                                        overflow: 'visible',
                                        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                                        border: `1px solid ${color.accent}20`,
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            boxShadow: `0 4px 20px ${color.accent}30`,
                                            transform: 'translateY(-2px)',
                                        },
                                    }}
                                >
                                    <CardActionArea
                                        onClick={() => handleToggleExpand(classItem.classId)}
                                        sx={{ borderRadius: 3 }}
                                    >
                                        <CardContent sx={{ p: 3 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                                                <Avatar
                                                    sx={{
                                                        bgcolor: color.iconBg,
                                                        color: color.accent,
                                                        width: 48,
                                                        height: 48,
                                                    }}
                                                >
                                                    <ClassIcon />
                                                </Avatar>
                                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                                    {isClassTeacher && (
                                                        <Chip
                                                            icon={<StarIcon sx={{ fontSize: '14px !important' }} />}
                                                            label="Class Teacher"
                                                            size="small"
                                                            sx={{
                                                                bgcolor: '#fef3c7',
                                                                color: '#92400e',
                                                                fontWeight: 600,
                                                                fontSize: '0.7rem',
                                                                height: 24,
                                                                '& .MuiChip-icon': { color: '#f59e0b' },
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                            </Box>

                                            <Typography
                                                variant="h6"
                                                fontWeight={700}
                                                color="#1e293b"
                                                gutterBottom
                                            >
                                                {classItem.name}
                                            </Typography>

                                            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <SchoolIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                    <Typography variant="body2" color="text.secondary">
                                                        {sections.length} {sections.length === 1 ? 'Section' : 'Sections'}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <GroupsIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                    <Typography variant="body2" color="text.secondary">
                                                        {loadingStudents ? <CircularProgress size={12} /> : totalStudents} Students
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mt: 1 }}>
                                                <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
                                                    {isExpanded ? 'Hide' : 'View'} sections
                                                </Typography>
                                                {isExpanded ? (
                                                    <ExpandLessIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                                ) : (
                                                    <ExpandMoreIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                                )}
                                            </Box>
                                        </CardContent>
                                    </CardActionArea>

                                    {/* Expanded Section Details */}
                                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                        <Box sx={{ px: 3, pb: 3 }}>
                                            <Table size="small" sx={{ mt: 1 }}>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#64748b' }}>
                                                            Section
                                                        </TableCell>
                                                        <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#64748b' }}>
                                                            Students
                                                        </TableCell>
                                                        <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#64748b' }}>
                                                            Role
                                                        </TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {sections.map((section) => {
                                                        const sectionStudents = getStudentCount(classItem.classId, section.sectionId);
                                                        const isCT = isClassTeacherOf(classItem.classId, section.sectionId);

                                                        return (
                                                            <TableRow key={section.sectionId}>
                                                                <TableCell sx={{ fontSize: '0.85rem' }}>
                                                                    {section.name}
                                                                </TableCell>
                                                                <TableCell align="center" sx={{ fontSize: '0.85rem' }}>
                                                                    {sectionStudents}
                                                                </TableCell>
                                                                <TableCell align="center">
                                                                    {isCT ? (
                                                                        <Chip
                                                                            label="Class Teacher"
                                                                            size="small"
                                                                            sx={{
                                                                                bgcolor: '#fef3c7',
                                                                                color: '#92400e',
                                                                                fontWeight: 600,
                                                                                fontSize: '0.65rem',
                                                                                height: 20,
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        <Chip
                                                                            label="Subject Teacher"
                                                                            size="small"
                                                                            variant="outlined"
                                                                            sx={{
                                                                                fontSize: '0.65rem',
                                                                                height: 20,
                                                                                color: '#64748b',
                                                                                borderColor: '#e2e8f0',
                                                                            }}
                                                                        />
                                                                    )}
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </Box>
                                    </Collapse>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {/* Summary Footer */}
            {!isLoading && myClasses.length > 0 && (
                <Box
                    sx={{
                        mt: 4,
                        p: 2,
                        bgcolor: '#f8fafc',
                        borderRadius: 2,
                        display: 'flex',
                        gap: 4,
                        flexWrap: 'wrap',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ClassIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
                        <Typography variant="body2" color="text.secondary">
                            <strong>{myClasses.length}</strong> {myClasses.length === 1 ? 'Class' : 'Classes'} Assigned
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <GroupsIcon sx={{ color: '#10b981', fontSize: 20 }} />
                        <Typography variant="body2" color="text.secondary">
                            <strong>
                                {myClasses.reduce((sum: number, c: Class) => sum + getStudentCount(c.classId), 0)}
                            </strong>{' '}
                            Total Students
                        </Typography>
                    </Box>
                    {classTeacherSectionId && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <StarIcon sx={{ color: '#f59e0b', fontSize: 20 }} />
                            <Typography variant="body2" color="text.secondary">
                                Class Teacher: <strong>{teacher?.classTeacherLabel || classTeacherSectionId}</strong>
                            </Typography>
                        </Box>
                    )}
                </Box>
            )}
        </Box>
    );
};

export default TeacherClasses;
