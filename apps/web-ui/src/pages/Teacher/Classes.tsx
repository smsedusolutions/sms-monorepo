import { 
    Box, 
    Typography,  
    Card, 
    Chip, 
    Alert, 
    Avatar, 
    Skeleton, 
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import {
    Groups as GroupsIcon,
    Star as StarIcon,
    School as SchoolIcon,
    Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { useGetTeacherById } from '../../queries/Teacher';
import { useGetClasses } from '../../queries/Class';
import { useGetStudents } from '../../queries/Student';
import { useGetSubjects } from '../../queries/Subject';
import TokenService from '../../queries/token/tokenService';
import type { Class, Student, Section } from '../../types';

const TeacherClasses = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const user = TokenService.getUser();
    const teacherId = user?.teacherId || user?.userId || '';

    // Fetch data
    const { data: teacherData, isLoading: loadingTeacher } = useGetTeacherById(schoolId, teacherId);
    const { data: classesData, isLoading: loadingClasses } = useGetClasses(schoolId);
    const { data: studentsData, isLoading: loadingStudents } = useGetStudents(schoolId);
    const { data: subjectsData, isLoading: loadingSubjects } = useGetSubjects(schoolId);

    const teacher = teacherData?.data;
    const allClasses = classesData?.data || [];
    const allStudents = studentsData?.data || [];
    const allSubjects = subjectsData?.data || [];
    const classTeacherSectionId = teacher?.classTeacherSectionId;

    // Helper: student count
    const getStudentCount = (classId: string, sectionId: string): number => {
        return allStudents.filter((s: Student) => s.class === classId && s.section === sectionId && s.status === 'active').length;
    };

    // Build Assignment Map
    const assignmentMap = new Map<string, {
        class: Class;
        section: Section;
        subjects: string[];
        isClassTeacher: boolean;
        studentCount: number;
    }>();

    // Identify which classes/sections to show
    const teacherClassesList = teacher?.classes || [];
    const teacherSectionsList = (teacher as any)?.sections || [];
    const classIdFromCT = classTeacherSectionId?.split('#')[0];

    const uniqueClassIds = Array.from(new Set([
        ...teacherClassesList,
        ...allSubjects.filter(s => s.assignedTeacherId === teacherId).map(s => s.classId),
        ...(classIdFromCT ? [classIdFromCT] : [])
    ])).filter(Boolean);

    allClasses.filter(c => uniqueClassIds.includes(c.classId)).forEach(cls => {
        const relevantSectionIds = new Set<string>();
        
        // Profiles sections
        teacherSectionsList.forEach((sId: any) => {
            if (cls.sections.find(s => s.sectionId === sId)) relevantSectionIds.add(sId);
        });

        // Subjects sections
        allSubjects
            .filter(s => s.assignedTeacherId === teacherId && s.classId === cls.classId)
            .forEach(s => {
                const sId = (s as any).sectionId;
                if (sId) relevantSectionIds.add(sId);
                else {
                    // fallback to profile sections or all if profile empty
                    if (teacherSectionsList.length === 0) cls.sections.forEach(sec => relevantSectionIds.add(sec.sectionId));
                    else cls.sections.filter(sec => teacherSectionsList.includes(sec.sectionId)).forEach(sec => relevantSectionIds.add(sec.sectionId));
                }
            });

        // CT sections
        if (classTeacherSectionId?.startsWith(`${cls.classId}#`)) {
            relevantSectionIds.add(classTeacherSectionId.split('#')[1]);
        }

        cls.sections.filter(s => relevantSectionIds.has(s.sectionId)).forEach(section => {
            const key = `${cls.classId}-${section.sectionId}`;
            const subjects = allSubjects
                .filter(s => s.assignedTeacherId === teacherId && s.classId === cls.classId && 
                             (!(s as any).sectionId || (s as any).sectionId === section.sectionId))
                .map(s => s.name);

            assignmentMap.set(key, {
                class: cls,
                section: section,
                subjects,
                isClassTeacher: classTeacherSectionId === `${cls.classId}#${section.sectionId}`,
                studentCount: getStudentCount(cls.classId, section.sectionId)
            });
        });
    });

    const teacherAssignments = Array.from(assignmentMap.values());
    const isLoading = loadingTeacher || loadingClasses || loadingStudents || loadingSubjects;

    return (
        <Box sx={{ p: { xs: 2, sm: 4 }, minHeight: '100vh', bgcolor: '#f8fafc' }}>
            {/* Header Area */}
            <Box 
                sx={{ 
                    mb: 5, 
                    p: 4, 
                    borderRadius: 6, 
                    background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
                    boxShadow: '0 10px 30px rgba(99, 102, 241, 0.2)',
                    color: 'white'
                }}
            >
                <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: '-0.02em', mb: 1 }}>
                    My Classes
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 500, maxWidth: '600px' }}>
                    Welcome back, {teacher?.firstName}! Manage your classes, sections, and subjects from this central dashboard.
                </Typography>
            </Box>

            {/* Main Assignment Container */}
            <Card elevation={0} sx={{ borderRadius: 6, border: '1px solid #e2e8f0', bgcolor: 'white', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                {isLoading ? (
                    <Box sx={{ p: 4 }}>
                        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} height={60} sx={{ mb: 1, borderRadius: 2 }} />)}
                    </Box>
                ) : (
                    <Box sx={{ p: 0 }}>
                        {/* Class Teacher Header Area - Prominently at top if applicable */}
                        {classTeacherSectionId && (
                            <Box sx={{ bgcolor: '#fffbeb', p: 3, borderBottom: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar sx={{ bgcolor: '#f59e0b', color: 'white', width: 48, height: 48, boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)' }}>
                                        <StarIcon />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight={800} color="#92400e" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Primary Responsibility
                                        </Typography>
                                        <Typography variant="h5" fontWeight={900} color="#78350f">
                                            Class Teacher Profile
                                        </Typography>
                                    </Box>
                                </Box>
                                <Chip 
                                    label={teacher?.classTeacherLabel || classTeacherSectionId} 
                                    sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 800, border: '1px solid #f59e0b', py: 2.5, px: 2, borderRadius: 3 }} 
                                />
                            </Box>
                        )}

                        <TableContainer>
                            <Table sx={{ minWidth: 650 }}>
                                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 800, color: '#64748b', py: 2.5 }}>CLASS</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>SECTION</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>ASSIGNED SUBJECTS</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 800, color: '#64748b' }}>ROLE</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {teacherAssignments.length > 0 ? (
                                        teacherAssignments.map((assign, index) => (
                                            <TableRow 
                                                key={index} 
                                                sx={{ 
                                                    '&:last-child td, &:last-child th': { border: 0 },
                                                    '&:hover': { bgcolor: '#fcfdff' },
                                                    transition: 'background-color 0.2s'
                                                }}
                                            >
                                                <TableCell sx={{ py: 3 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                        <Avatar 
                                                            variant="rounded"
                                                            sx={{ 
                                                                bgcolor: '#eef2ff', 
                                                                color: '#6366f1',
                                                                width: 40,
                                                                height: 40,
                                                                borderRadius: 2
                                                            }}
                                                        >
                                                            <SchoolIcon />
                                                        </Avatar>
                                                        <Typography fontWeight={800} color="#1e293b" sx={{ fontSize: '1rem' }}>
                                                            {assign.class.name}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography fontWeight={800} color="#1e293b">Section {assign.section.name}</Typography>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.2 }}>
                                                        <GroupsIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                                                        <Typography variant="caption" color="#94a3b8" fontWeight={700}>
                                                            {assign.studentCount} Students
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                        {assign.subjects.length > 0 ? (
                                                            assign.subjects.map((sub, i) => (
                                                                <Chip 
                                                                    key={i} 
                                                                    label={sub} 
                                                                    size="small" 
                                                                    sx={{ 
                                                                        bgcolor: '#ede9fe', 
                                                                        color: '#7c3aed', 
                                                                        fontWeight: 800, 
                                                                        borderRadius: 1.5,
                                                                        fontSize: '0.7rem',
                                                                        border: '1px solid #ddd6fe'
                                                                    }} 
                                                                />
                                                            ))
                                                        ) : (
                                                            <Typography variant="body2" color="text.disabled" fontStyle="italic">Not Assigned</Typography>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="center">
                                                    {assign.isClassTeacher ? (
                                                        <Chip 
                                                            icon={<StarIcon sx={{ fontSize: '14px !important', color: '#92400e !important' }} />}
                                                            label="Class In-Charge" 
                                                            size="small" 
                                                            sx={{ 
                                                                bgcolor: '#fef3c7', 
                                                                color: '#92400e', 
                                                                fontWeight: 800,
                                                                border: '1px solid #f59e0b',
                                                                borderRadius: 1.5,
                                                                px: 1,
                                                                height: 28
                                                            }} 
                                                        />
                                                    ) : (
                                                        <Chip 
                                                            label="Subject Teacher" 
                                                            variant="outlined"
                                                            size="small" 
                                                            sx={{ 
                                                                color: '#64748b', 
                                                                fontWeight: 700,
                                                                borderRadius: 1.5,
                                                                fontSize: '0.65rem'
                                                            }} 
                                                        />
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center" sx={{ py: 10 }}>
                                                <Box sx={{ opacity: 0.5 }}>
                                                    <AssignmentIcon sx={{ fontSize: 48, mb: 2 }} />
                                                    <Typography variant="h6">No assignments found</Typography>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}
            </Card>

            {/* Error handling */}
            {!isLoading && !teacher && (
                <Alert severity="error" sx={{ mt: 3, borderRadius: 4 }}>
                    Teacher profile could not be loaded. Please check your connection.
                </Alert>
            )}
        </Box>
    );
};

export default TeacherClasses;
