import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,

    Alert,
    Skeleton,
} from '@mui/material';
import {
    Groups as GroupsIcon,
    MenuBook as SubjectIcon,
    Badge as BadgeIcon,
    Class as ClassIcon,
    School as SchoolIcon,
} from '@mui/icons-material';
import TokenService from '../../queries/token/tokenService';
import { useGetClassById } from '../../queries/Class';
import { useGetSubjects } from '../../queries/Subject';

const StudentClasses = () => {
    const user = TokenService.getUser();
    const schoolId = TokenService.getSchoolId() || '';
    const studentClassId = user?.class || '';
    const studentSectionId = user?.section || '';

    // Fetch class details (student role now allowed)
    const { data: classData, isLoading: loadingClass } = useGetClassById(schoolId, studentClassId);
    const classInfo = classData?.data;

    // Fetch subjects
    const { data: subjectsData, isLoading: loadingSubjects } = useGetSubjects(schoolId);
    const allSubjects = subjectsData?.data || [];

    const isLoading = loadingClass || loadingSubjects;

    // Derive display data from token (always available) with API data as enhancement
    const className = classInfo?.name || user?.className || studentClassId;
    const sectionName = (() => {
        if (classInfo?.sections) {
            const sec = classInfo.sections.find(
                (s: any) => s.sectionId === studentSectionId || s._id === studentSectionId
            );
            if (sec) return sec.name;
        }
        return user?.sectionName || studentSectionId;
    })();



    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h5" fontWeight={600} gutterBottom>My Class</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                View your class details and subjects.
            </Typography>

            {isLoading ? (
                <Grid container spacing={3}>
                    {[1, 2, 3, 4].map(i => (
                        <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
                            <Skeleton variant="rounded" height={160} />
                        </Grid>
                    ))}
                    <Grid size={{ xs: 12 }}>
                        <Skeleton variant="rounded" height={200} />
                    </Grid>
                </Grid>
            ) : (
                <>
                    {/* Class Overview Cards */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        {/* Class Info Card */}
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card sx={{
                                borderRadius: 2,
                                height: '100%',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                            }}>
                                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                                    <ClassIcon sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
                                    <Typography variant="h4" fontWeight={700}>{className}</Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
                                        Section {sectionName}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Roll Number Card */}
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card sx={{
                                borderRadius: 2,
                                height: '100%',
                                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                color: 'white',
                            }}>
                                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                                    <BadgeIcon sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
                                    <Typography variant="h4" fontWeight={700}>{user?.rollNumber || 'N/A'}</Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>Roll Number</Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* My Section Card */}
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card sx={{
                                borderRadius: 2,
                                height: '100%',
                                background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                                color: 'white',
                            }}>
                                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                                    <GroupsIcon sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
                                    <Typography variant="h4" fontWeight={700}>{sectionName}</Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>My Section</Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Subjects Count Card */}
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card sx={{
                                borderRadius: 2,
                                height: '100%',
                                background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                            }}>
                                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                                    <SubjectIcon sx={{ fontSize: 40, mb: 1, color: '#e65100' }} />
                                    <Typography variant="h4" fontWeight={700} color="#5d4037">
                                        {allSubjects.filter((s: any) => s.status === 'active').length}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#8d6e63', mt: 0.5 }}>Subjects</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Class Description */}
                    {classInfo?.description && (
                        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                            {classInfo.description}
                        </Alert>
                    )}

                    {/* Subjects Section */}
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SubjectIcon color="primary" /> Subjects
                    </Typography>
                    <Grid container spacing={2}>
                        {allSubjects.filter((s: any) => s.status === 'active').length === 0 ? (
                            <Grid size={{ xs: 12 }}>
                                <Alert severity="info">No subjects available.</Alert>
                            </Grid>
                        ) : allSubjects.filter((s: any) => s.status === 'active').map((subject: any) => (
                            <Grid key={subject.subjectId} size={{ xs: 6, sm: 4, md: 3 }}>
                                <Card
                                    variant="outlined"
                                    sx={{
                                        borderRadius: 2,
                                        textAlign: 'center',
                                        py: 2,
                                        '&:hover': { boxShadow: 2, transform: 'translateY(-2px)' },
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    <CardContent sx={{ py: 1 }}>
                                        <SchoolIcon color="primary" sx={{ fontSize: 28, mb: 0.5 }} />
                                        <Typography variant="subtitle2" fontWeight={600}>{subject.name}</Typography>
                                        {subject.code && (
                                            <Typography variant="caption" color="text.secondary">{subject.code}</Typography>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </>
            )}
        </Box>
    );
};

export default StudentClasses;
