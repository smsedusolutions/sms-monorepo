import React, { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    IconButton,
    Divider,
    Chip,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Snackbar,
    Tabs,
    Tab,
    Avatar,
    CircularProgress,
    Skeleton,
    InputAdornment,
    TextField,
    Stack,
} from '@mui/material';
import { AppInput } from '../../../components/shared/AppInput';
import { AppSelect } from '../../../components/shared/AppSelect';
import { AppButton } from '../../../components/shared/AppButton';
import { AppDatePicker } from '../../../components/shared/AppDatePicker';
import { format, parse, isValid, startOfDay } from 'date-fns';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import DeleteIcon from '@mui/icons-material/Delete';
import ClassIcon from '@mui/icons-material/Class';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SchoolIcon from '@mui/icons-material/School';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { pdf } from '@react-pdf/renderer';
import { useAuth } from '../../../context/AuthContext';
import { useUrlTab } from '../../../hooks/useUrlTab';
import { useIsMobile } from '../../../hooks/useIsMobile';
import {
    useCreateExam,
    useUpdateExam,
    useDeleteExam,
    useGetExams,
    useGetExamTerms,
    useGetExamTypes,
    useGetGradingSystems,
    useGetExamSchedule,
    useScheduleExam,
    useBulkGenerateAdmitCards,
    useGetExamRegistrations
} from '../../../queries/Exam';
import { useGetClasses } from '../../../queries/Class';
import { useGetSubjects } from '../../../queries/Subject';
import { useGetTeachers } from '../../../queries/Teacher';
import { useGetAllRooms } from '../../../queries/Timetable';
import { useGetSchoolById } from '../../../queries/School';
import { useAcademicYear } from '../../../hooks/useAcademicYear';
import { AdmitCardPDF } from '../../../components/PDFLayouts';
import { sortClassesNumerically, compareClassesNumerically } from '../../../utils/classSort';

import type { CreateExamRequest, CreateScheduleRequest, Exam } from '../../../types/exam.types';

// ==========================================
// EXAM SCHEDULER PAGE
// ==========================================

const ExamScheduler = () => {
    const isMobile = useIsMobile();
    const { user } = useAuth();
    const schoolId = user?.schoolId || '';
    const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

    return (
        <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
            {selectedExam ? (
                <ExamDetailView
                    schoolId={schoolId}
                    exam={selectedExam}
                    onBack={() => setSelectedExam(null)}
                    isMobile={isMobile}
                />
            ) : (
                <ExamListView
                    schoolId={schoolId}
                    onSelect={setSelectedExam}
                    isMobile={isMobile}
                />
            )}
        </Box>
    );
};

// ==========================================
// VIEW 1: EXAM LIST
// ==========================================

const ExamListView = ({ schoolId, onSelect, isMobile }: { schoolId: string, onSelect: (exam: Exam) => void, isMobile: boolean }) => {
    const [open, setOpen] = useState(false);
    const { academicYearOptions, currentAcademicYear } = useAcademicYear();
    const { data: exams, isLoading } = useGetExams(schoolId);

    const { data: terms } = useGetExamTerms(schoolId);
    const { data: types } = useGetExamTypes(schoolId);
    const { data: gradingSystems } = useGetGradingSystems(schoolId);
    const { data: classes } = useGetClasses(schoolId);

    const createExam = useCreateExam(schoolId);

    const [formData, setFormData] = useState<CreateExamRequest & { status?: string }>({
        name: '',
        typeId: '',
        termId: '',
        academicYear: currentAcademicYear,
        classes: [],
        startDate: '',
        endDate: '',
        gradingSystemId: '',
        status: 'draft'
    });

    const [editingExam, setEditingExam] = useState<any>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [examToDelete, setExamToDelete] = useState<any>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const updateExam = useUpdateExam(schoolId);
    const deleteExam = useDeleteExam(schoolId);

    const handleEdit = (exam: any) => {
        setEditingExam(exam);
        setFormData({
            name: exam.name,
            typeId: typeof exam.typeId === 'object' ? exam.typeId._id : exam.typeId,
            termId: typeof exam.termId === 'object' ? exam.termId._id : exam.termId,
            academicYear: exam.academicYear,
            classes: exam.classes,
            startDate: exam.startDate?.split('T')[0] || '',
            endDate: exam.endDate?.split('T')[0] || '',
            gradingSystemId: typeof exam.gradingSystemId === 'object' ? exam.gradingSystemId._id : exam.gradingSystemId,
            status: exam.status || 'draft'
        });
        setErrors({});
        setOpen(true);
    };

    const handleDeleteClick = (exam: any, event: React.MouseEvent) => {
        event.stopPropagation();
        setExamToDelete(exam);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (examToDelete) {
            deleteExam.mutate(examToDelete.examId, {
                onSuccess: () => {
                    setDeleteDialogOpen(false);
                    setExamToDelete(null);
                }
            });
        }
    };

    const handleSubmit = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name?.trim()) newErrors.name = 'Name is required';
        if (!formData.startDate) newErrors.startDate = 'Commencement Date is required';
        if (!formData.endDate) newErrors.endDate = 'Conclusion Date is required';

        if (formData.startDate) {
            const start = parse(formData.startDate, 'yyyy-MM-dd', new Date());
            if (!isValid(start)) newErrors.startDate = 'Invalid date';
            else if (start < startOfDay(new Date())) newErrors.startDate = 'Cannot be in the past';
        }
        if (formData.endDate) {
            const end = parse(formData.endDate, 'yyyy-MM-dd', new Date());
            if (!isValid(end)) newErrors.endDate = 'Invalid date';
            else if (end < startOfDay(new Date())) newErrors.endDate = 'Cannot be in the past';
        }
        if (formData.startDate && formData.endDate && !newErrors.startDate && !newErrors.endDate) {
            const start = parse(formData.startDate, 'yyyy-MM-dd', new Date());
            const end = parse(formData.endDate, 'yyyy-MM-dd', new Date());
            if (end < start) newErrors.endDate = 'End date cannot be before start date';
        }

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;
        if (editingExam) {
            updateExam.mutate({ examId: editingExam.examId, data: formData }, {
                onSuccess: () => {
                    setOpen(false);
                    setEditingExam(null);
                    setFormData({
                        name: '', typeId: '', termId: '', academicYear: currentAcademicYear,
                        classes: [], startDate: '', endDate: '', gradingSystemId: '', status: 'draft'
                    });
                }
            });
        } else {
            createExam.mutate(formData, {
                onSuccess: () => {
                    setOpen(false);
                    setFormData({
                        name: '', typeId: '', termId: '', academicYear: currentAcademicYear,
                        classes: [], startDate: '', endDate: '', gradingSystemId: '', status: 'draft'
                    });
                }
            });
        }
    };

    const handleClose = () => {
        setOpen(false);
        setEditingExam(null);
        setFormData({
            name: '', typeId: '', termId: '', academicYear: currentAcademicYear,
            classes: [], startDate: '', endDate: '', gradingSystemId: '', status: 'draft'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'published': return 'success';
            case 'ongoing': return 'info';
            case 'scheduled': return 'primary';
            case 'draft': return 'warning';
            default: return 'default';
        }
    };

    return (
        <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                {!isMobile ? (
                    <Typography variant="h5" fontWeight={700} color="#0f172a">Exam Scheduler</Typography>
                ) : (
                    <Box />
                )}
                <Button variant="contained" startIcon={<AddCircleIcon />} onClick={() => setOpen(true)} size="small" sx={{ textTransform: 'none', fontWeight: 600 }}>
                    Create New Exam
                </Button>
            </Box>

            {isLoading ? (
                <Grid container spacing={2}>
                    {[1, 2, 3].map((i) => (
                        <Grid key={i} size={{ xs: 12, md: 6, lg: 4 }}>
                            <Skeleton variant="rounded" height={160} sx={{ borderRadius: 2 }} />
                        </Grid>
                    ))}
                </Grid>
            ) : !exams?.data?.length ? (
                <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                    <Typography color="text.secondary">No exams created yet. Click "Create New Exam" to get started.</Typography>
                </Paper>
            ) : (
                <Grid container spacing={2}>
                    {exams.data.map((exam: any) => {
                        const statusColor = getStatusColor(exam.status);
                        return (
                            <Grid key={exam._id} size={{ xs: 12, md: 6, lg: 4 }}>
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        borderColor: '#e2e8f0',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            borderColor: 'primary.main',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                        }
                                    }}
                                    onClick={() => onSelect(exam)}
                                >
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                        <Box sx={{ flex: 1, pr: 1 }}>
                                            <Typography variant="subtitle1" fontWeight={700} color="#0f172a">
                                                {exam.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                {exam.typeId?.name || 'Exam'} • {exam.termId?.name || 'Term'}
                                            </Typography>
                                        </Box>
                                        <Chip
                                            label={exam.status || 'draft'}
                                            size="small"
                                            color={statusColor as any}
                                            sx={{
                                                height: 22,
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                textTransform: 'capitalize'
                                            }}
                                        />
                                    </Box>

                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, my: 1.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <CalendarMonthIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(exam.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                {' - '}
                                                {new Date(exam.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <ClassIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                            <Typography variant="caption" color="text.secondary">
                                                {exam.classes?.length || 0} Classes Participating
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            pt: 1,
                                            borderTop: '1px solid #f1f5f9'
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Typography variant="caption" color="primary" fontWeight={600} sx={{ cursor: 'pointer' }} onClick={() => onSelect(exam)}>
                                            View Schedule →
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEdit(exam);
                                                }}
                                                sx={{ p: 0.5 }}
                                            >
                                                <EditIcon sx={{ fontSize: 18 }} />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={(e) => handleDeleteClick(exam, e)}
                                                sx={{ p: 0.5 }}
                                            >
                                                <DeleteIcon sx={{ fontSize: 18 }} />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                </Paper>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth fullScreen={isMobile}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>{editingExam ? 'Modify Exam Profile' : 'Register New Exam Event'}</Typography>
                    <IconButton onClick={handleClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
                        <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
                            Core Definition
                        </Typography>

                        <AppInput
                            label="Exam Designation"
                            fullWidth
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Mid-Term Assessment 2025"
                        />

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <AppSelect
                                    label="Academic Year"
                                    value={formData.academicYear}
                                    options={academicYearOptions}
                                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value as string })}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <AppSelect
                                    label="Administrative Term"
                                    value={formData.termId}
                                    options={terms?.data?.map((t: any) => ({ value: t._id, label: t.name })) || []}
                                    onChange={(e) => setFormData({ ...formData, termId: e.target.value as string })}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <AppSelect
                                    label="Examination Category"
                                    value={formData.typeId}
                                    options={types?.data?.map((t: any) => ({ value: t._id, label: t.name })) || []}
                                    onChange={(e) => setFormData({ ...formData, typeId: e.target.value as string })}
                                />
                            </Grid>
                        </Grid>

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <AppSelect
                                label="Event Status"
                                value={formData.status}
                                options={[
                                    { value: 'draft', label: 'Draft / Internal' },
                                    { value: 'scheduled', label: 'Officially Scheduled' },
                                    { value: 'ongoing', label: 'Currently Live' },
                                    { value: 'published', label: 'Results Published' },
                                    { value: 'closed', label: 'Archived / Closed' },
                                ]}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                sx={{ flex: 1 }}
                            />
                            <AppSelect
                                label="Grading Framework"
                                value={formData.gradingSystemId}
                                options={gradingSystems?.data?.map((t: any) => ({ value: t._id, label: t.name })) || []}
                                onChange={(e) => setFormData({ ...formData, gradingSystemId: e.target.value as string })}
                                sx={{ flex: 1 }}
                            />
                        </Box>

                        <Divider sx={{ my: 0.5 }} />

                        <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
                            Scope & Duration
                        </Typography>

                        <AppSelect
                            multiple
                            label="Participating Classes"
                            value={formData.classes}
                            options={sortClassesNumerically(classes?.data || []).map((c: any) => ({ value: c.classId, label: c.name }))}
                            onChange={(e) => {
                                const val = typeof e.target.value === 'string' ? e.target.value.split(',') : (e.target.value as string[]);
                                setFormData({ ...formData, classes: val });
                            }}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {(selected as string[]).map((value: string) => {
                                        const cls = classes?.data?.find((c: any) => c.classId === value);
                                        return <Chip key={value} label={cls?.name || value} size="small" variant="outlined" />;
                                    })}
                                </Box>
                            )}
                        />

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <AppDatePicker
                                    label="Commencement Date"
                                    value={formData.startDate ? parse(formData.startDate, 'yyyy-MM-dd', new Date()) : null}
                                    onChange={(date) => setFormData({ ...formData, startDate: date ? format(date, 'yyyy-MM-dd') : '' })}
                                    maxDate={formData.endDate ? parse(formData.endDate, 'yyyy-MM-dd', new Date()) : undefined}
                                    disablePast
                                    error={!!errors.startDate}
                                    helperText={errors.startDate}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <AppDatePicker
                                    label="Conclusion Date"
                                    value={formData.endDate ? parse(formData.endDate, 'yyyy-MM-dd', new Date()) : null}
                                    onChange={(date) => setFormData({ ...formData, endDate: date ? format(date, 'yyyy-MM-dd') : '' })}
                                    minDate={formData.startDate ? parse(formData.startDate, 'yyyy-MM-dd', new Date()) : undefined}
                                    disablePast
                                    error={!!errors.endDate}
                                    helperText={errors.endDate}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <AppButton onClick={handleClose} variant="text" color="inherit">Cancel</AppButton>
                    <AppButton
                        variant="contained"
                        onClick={handleSubmit}
                        loading={createExam.isPending || updateExam.isPending}
                    >
                        {editingExam ? 'Update Exam Profile' : 'Register Exam Event'}
                    </AppButton>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Confirm Deletion</Typography>
                    <IconButton onClick={() => setDeleteDialogOpen(false)} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ py: 1 }}>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            Are you sure you want to delete <strong>{examToDelete?.name}</strong>?
                        </Typography>
                        <Alert severity="error" variant="outlined" sx={{ borderRadius: 2 }}>
                            This action is permanent and will cascade to all associated schedules, marks, and admit card records.
                        </Alert>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <AppButton onClick={() => setDeleteDialogOpen(false)} variant="text" color="inherit">Cancel</AppButton>
                    <AppButton
                        variant="contained"
                        color="error"
                        onClick={confirmDelete}
                        loading={deleteExam.isPending}
                    >
                        Delete Permanently
                    </AppButton>
                </DialogActions>
            </Dialog>
        </>
    );
};

// ==========================================
// VIRTUALIZED INFINITE SCROLL ADMIT CARD GRID
// ==========================================

const AdmitCardTile = React.memo(({
    reg,
    getClassSectionName,
    handleViewAdmitCard
}: {
    reg: any;
    getClassSectionName: (classId: string, sectionId: string) => string;
    handleViewAdmitCard: (reg: any) => void;
}) => {
    return (
        <Paper
            variant="outlined"
            sx={{
                p: 2,
                borderRadius: 2,
                borderColor: '#e2e8f0',
                bgcolor: '#ffffff',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
                '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }
            }}
        >
            <Box>
                {/* Top Row: Avatar, Name, ID & Status Chips */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Avatar
                            src={reg.student?.profileImage}
                            sx={{
                                width: 42,
                                height: 42,
                                bgcolor: '#e0e7ff',
                                color: '#4338ca',
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                border: '1px solid #c7d2fe'
                            }}
                        >
                            {reg.student?.firstName?.[0] || 'S'}
                        </Avatar>
                        <Box>
                            <Typography variant="subtitle2" fontWeight={700} color="#0f172a" noWrap sx={{ maxWidth: { xs: 150, sm: 180 } }}>
                                {reg.student?.firstName} {reg.student?.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {reg.studentId}
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                        <Chip
                            label={reg.admitCardGenerated ? "Generated" : "Pending"}
                            color={reg.admitCardGenerated ? "success" : "warning"}
                            size="small"
                            sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                        />
                        <Chip
                            label={reg.isEligible ? "Eligible" : "Not Eligible"}
                            color={reg.isEligible ? "primary" : "error"}
                            size="small"
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                        />
                    </Box>
                </Box>

                {/* Details Row: Class & Roll No */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, px: 1.25, bgcolor: '#f8fafc', borderRadius: 1.5, mb: 1.5 }}>
                    <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                            Class
                        </Typography>
                        <Typography variant="body2" fontWeight={600} color="#1e293b">
                            {getClassSectionName(reg.classId, reg.sectionId)}
                        </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                            Roll No
                        </Typography>
                        <Typography variant="body2" fontWeight={600} color="#1e293b">
                            {reg.rollNumber || '—'}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Action Button */}
            {reg.admitCardGenerated && (
                <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    startIcon={<VisibilityIcon fontSize="small" />}
                    onClick={() => handleViewAdmitCard(reg)}
                    sx={{
                        borderRadius: 1.5,
                        textTransform: 'none',
                        fontWeight: 600,
                        py: 0.75,
                        borderColor: '#cbd5e1',
                        color: 'primary.main',
                        '&:hover': {
                            borderColor: 'primary.main',
                            bgcolor: 'primary.50'
                        }
                    }}
                >
                    View Admit Card
                </Button>
            )}
        </Paper>
    );
});

const VirtualizedAdmitCardGrid = ({
    registrations,
    total,
    regLoading,
    isFetching,
    hasMore,
    onLoadMore,
    getClassSectionName,
    handleViewAdmitCard
}: {
    registrations: any[];
    total: number;
    regLoading: boolean;
    isFetching: boolean;
    hasMore: boolean;
    onLoadMore: () => void;
    getClassSectionName: (classId: string, sectionId: string) => string;
    handleViewAdmitCard: (reg: any) => void;
}) => {
    const observerTarget = React.useRef<HTMLDivElement>(null);

    // IntersectionObserver triggers onLoadMore when user scrolls near bottom of grid
    React.useEffect(() => {
        const target = observerTarget.current;
        if (!target || !hasMore || isFetching) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isFetching) {
                    onLoadMore();
                }
            },
            { threshold: 0.1, rootMargin: '200px' }
        );

        observer.observe(target);
        return () => observer.disconnect();
    }, [hasMore, isFetching, onLoadMore]);

    if (regLoading && registrations.length === 0) {
        return (
            <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                        <Skeleton variant="rounded" height={140} sx={{ borderRadius: 2 }} />
                    </Grid>
                ))}
            </Grid>
        );
    }

    if (!registrations || registrations.length === 0) {
        return (
            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2, bgcolor: '#ffffff' }}>
                <Typography variant="subtitle1" fontWeight={700} color="#1e293b">No Admit Cards Found</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Admit cards will appear here once generated or matching your search filter.
                </Typography>
            </Paper>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Chip
                    label={`Displaying ${registrations.length} of ${total || registrations.length} Admit Cards`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 600, height: 22, fontSize: '0.75rem' }}
                />
            </Box>

            {/* Scrollable Container for Card Grid */}
            <Box
                sx={{
                    pr: { xs: 0, sm: 1 },
                    pt: 0.5,
                    pb: 2,
                }}
            >
                <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                    {registrations.map((reg: any) => (
                        <Grid key={reg._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                            <AdmitCardTile
                                reg={reg}
                                getClassSectionName={getClassSectionName}
                                handleViewAdmitCard={handleViewAdmitCard}
                            />
                        </Grid>
                    ))}
                </Grid>

                {/* Infinite Scroll Trigger Sentinel */}
                <Box
                    ref={observerTarget}
                    sx={{
                        py: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: 60
                    }}
                >
                    {hasMore ? (
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <CircularProgress size={20} color="primary" />
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                Fetching... ({registrations.length} / {total})
                            </Typography>
                        </Stack>
                    ) : total > 24 ? (
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            ✓ All {total} admit cards loaded
                        </Typography>
                    ) : null}
                </Box>
            </Box>
        </Box>
    );
};

// ==========================================
// VIEW 2: EXAM DETAIL / SCHEDULE
// ==========================================

const ExamDetailView = ({ schoolId, exam, onBack, isMobile }: { schoolId: string, exam: Exam, onBack: () => void, isMobile: boolean }) => {
    const { currentAcademicYear } = useAcademicYear();
    const [tabValue, setTabValue] = useUrlTab(0, ['schedule', 'admit-cards']);
    const [open, setOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<any>(null);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [admitCardDialogOpen, setAdmitCardDialogOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [downloading, setDownloading] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [accumulatedRegistrations, setAccumulatedRegistrations] = useState<any[]>([]);
    const [totalRegistrations, setTotalRegistrations] = useState(0);

    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
        open: false,
        message: '',
        severity: 'info'
    });

    // Debounce search input and reset pagination
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchInput);
            setPage(1);
            setAccumulatedRegistrations([]);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const { data: schedule, isLoading } = useGetExamSchedule(schoolId, exam.examId);
    const { data: registrationsResponse, isLoading: regLoading, isFetching: regFetching } = useGetExamRegistrations(
        schoolId,
        exam.examId,
        undefined,
        debouncedSearch,
        page,
        24
    );

    React.useEffect(() => {
        if (registrationsResponse?.data) {
            if (page === 1) {
                setAccumulatedRegistrations(registrationsResponse.data);
            } else {
                setAccumulatedRegistrations(prev => {
                    const existingIds = new Set(prev.map((item: any) => item._id));
                    const newItems = registrationsResponse.data.filter((item: any) => !existingIds.has(item._id));
                    return [...prev, ...newItems];
                });
            }
            if (typeof registrationsResponse.total === 'number') {
                setTotalRegistrations(registrationsResponse.total);
            }
        }
    }, [registrationsResponse, page]);

    const hasMoreRegistrations = accumulatedRegistrations.length < totalRegistrations;
    const handleLoadMore = () => {
        if (hasMoreRegistrations && !regFetching) {
            setPage(prev => prev + 1);
        }
    };
    const { data: schoolData } = useGetSchoolById(schoolId);
    const scheduleExam = useScheduleExam(schoolId);
    const generateAdmitCards = useBulkGenerateAdmitCards(schoolId);

    const { data: subjects } = useGetSubjects(schoolId);
    const { data: teachers } = useGetTeachers(schoolId);
    const { data: rooms } = useGetAllRooms(schoolId);
    const { data: allClasses, isLoading: classesLoading } = useGetClasses(schoolId);

    // Robust filtering for exam classes - check both classId and mongo _id, sorted numerically
    const examClasses = React.useMemo(() => {
        if (!allClasses?.data || !exam.classes) return [];
        const filtered = allClasses.data.filter((c: any) =>
            exam.classes.includes(c.classId) || exam.classes.includes(c._id)
        );
        return sortClassesNumerically(filtered);
    }, [allClasses, exam.classes]);

    // School details
    const school = schoolData?.data;
    const schoolName = school?.schoolName || 'School Name';
    const schoolAddress = school?.schoolAddress || '';
    const schoolLogo = school?.schoolLogo || '';

    // Filter and deduplicate exam schedule specifically for selected student's class
    const filteredStudentSchedule = React.useMemo(() => {
        if (!schedule?.data || !selectedStudent?.classId) return [];

        // 1. Filter schedule items matching selected student's classId
        const classSchedules = schedule.data.filter((sch: any) =>
            sch.classId === selectedStudent.classId
        );

        // 2. Deduplicate by subjectId + date + startTime
        const uniqueMap = new Map();
        classSchedules.forEach((sch: any) => {
            const dateStr = sch.date ? new Date(sch.date).toISOString().split('T')[0] : '';
            const key = `${sch.subjectId}_${dateStr}_${sch.startTime}`;
            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, sch);
            }
        });

        return Array.from(uniqueMap.values());
    }, [schedule?.data, selectedStudent?.classId]);

    const getClassSectionName = (classId: string, sectionId: string): string => {
        const classInfo = allClasses?.data?.find((c: any) => c.classId === classId);
        const className = classInfo?.name || classId;
        const sectionInfo = classInfo?.sections?.find((s: any) => s.sectionId === sectionId || s._id === sectionId);
        const sectionName = sectionInfo?.name || sectionId;
        return `${className} - ${sectionName}`;
    };

    const getClassName = (classId: string): string => {
        const classInfo = allClasses?.data?.find((c: any) => c.classId === classId);
        return classInfo?.name || classId;
    };

    const getSectionName = (classId: string, sectionId: string): string => {
        const classInfo = allClasses?.data?.find((c: any) => c.classId === classId);
        const sectionInfo = classInfo?.sections?.find((s: any) => s.sectionId === sectionId || s._id === sectionId);
        return sectionInfo?.name || sectionId;
    };

    const getSubjectName = (subjectId: string): string => {
        const sub = subjects?.data?.find((s: any) => s._id === subjectId || s.subjectId === subjectId);
        return sub?.name || subjectId;
    };

    const [formData, setFormData] = useState<CreateScheduleRequest & { _id?: string }>({
        examId: exam.examId,
        classId: '',
        subjectId: '',
        date: '',
        startTime: '',
        endTime: '',
        roomId: '',
        invigilators: [],
        passingMarks: 35,
        maxMarksTheory: 80,
        maxMarksPractical: 0
    });

    const [errorMsg, setErrorMsg] = useState('');
    const [errors, setErrors] = useState<any>({});

    const handleSubmit = () => {
        setErrorMsg('');
        setErrors({});
        const payload = editingSchedule
            ? { ...formData, _id: editingSchedule._id }
            : formData;
        scheduleExam.mutate(payload, {
            onSuccess: () => {
                setOpen(false);
                setEditingSchedule(null);
                setSnackbar({ open: true, message: editingSchedule ? 'Schedule updated successfully!' : 'Exam scheduled successfully!', severity: 'success' });
                setFormData(prev => ({ ...prev, _id: undefined, subjectId: '', startTime: '', endTime: '' }));
            },
            onError: (err: any) => {
                setErrorMsg(err?.message || "Failed to schedule exam. Check conflicts.");
            }
        });
    };

    const handleEditSchedule = (sch: any) => {
        setEditingSchedule(sch);
        setFormData({
            examId: exam.examId,
            classId: sch.classId || '',
            subjectId: sch.subjectId || '',
            date: sch.date ? new Date(sch.date).toISOString().split('T')[0] : '',
            startTime: sch.startTime || '',
            endTime: sch.endTime || '',
            roomId: typeof sch.roomId === 'object' ? sch.roomId?._id || '' : sch.roomId || '',
            invigilators: sch.invigilators?.map((inv: any) => typeof inv === 'object' ? inv.teacherId || inv._id : inv) || [],
            passingMarks: sch.passingMarks ?? 35,
            maxMarksTheory: sch.maxMarksTheory ?? 80,
            maxMarksPractical: sch.maxMarksPractical ?? 0
        });
        setErrorMsg('');
        setOpen(true);
    };

    const handleGenerateAdmitCards = () => {
        setConfirmDialogOpen(true);
    };

    const confirmGenerateAdmitCards = () => {
        setConfirmDialogOpen(false);
        generateAdmitCards.mutate({ examId: exam.examId }, {
            onSuccess: (data: any) => {
                setSnackbar({
                    open: true,
                    message: data?.message || 'Admit cards generated successfully!',
                    severity: 'success'
                });
            },
            onError: (err: any) => {
                setSnackbar({
                    open: true,
                    message: err?.message || 'Failed to generate admit cards',
                    severity: 'error'
                });
            }
        });
    };

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    const handleViewAdmitCard = (reg: any) => {
        setSelectedStudent(reg);
        setAdmitCardDialogOpen(true);
    };

    const handleDownloadPDF = async () => {
        if (!selectedStudent) return;

        setDownloading(true);
        try {
            const studentName = `${selectedStudent.student?.firstName || ''} ${selectedStudent.student?.lastName || ''}`.trim() || 'Student';
            const fatherName = selectedStudent.student?.fatherName || selectedStudent.student?.parentName || 'N/A';
            const fatherNameLabel = selectedStudent.student?.fatherNameLabel || "Father's Name";
            const className = getClassName(selectedStudent.classId);
            const sectionName = getSectionName(selectedStudent.classId, selectedStudent.sectionId);
            const dob = selectedStudent.student?.dateOfBirth
                ? new Date(selectedStudent.student.dateOfBirth).toLocaleDateString()
                : 'N/A';

            const blob = await pdf(
                <AdmitCardPDF
                    studentName={studentName}
                    fatherName={fatherName}
                    fatherNameLabel={fatherNameLabel}
                    rollNumber={selectedStudent.rollNumber || 'N/A'}
                    studentId={selectedStudent.studentId}
                    className={className}
                    sectionName={sectionName}
                    dob={dob}
                    schoolName={schoolName}
                    schoolAddress={schoolAddress}
                    schoolLogo={schoolLogo}
                    studentPhoto={selectedStudent.student?.profileImage || ''}
                    studentSignature={selectedStudent.student?.signature || ''}
                    examName={exam.name}
                    examType={typeof exam.typeId === 'object' ? exam.typeId?.name : 'Examination'}
                    examTerm={typeof exam.termId === 'object' ? exam.termId?.name : 'Term'}
                    academicYear={exam.academicYear || currentAcademicYear}
                    startDate={exam.startDate}
                    endDate={exam.endDate}
                    examSchedule={(filteredStudentSchedule || []).map((sch: any) => ({
                        date: sch.date,
                        startTime: sch.startTime,
                        endTime: sch.endTime,
                        subjectName: getSubjectName(sch.subjectId),
                    }))}
                />
            ).toBlob();

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `AdmitCard_${selectedStudent.studentId}_${exam.name.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setSnackbar({ open: true, message: 'Admit card downloaded successfully!', severity: 'success' });
        } catch (error) {
            console.error('PDF generation error:', error);
            setSnackbar({ open: true, message: 'Failed to generate PDF', severity: 'error' });
        } finally {
            setDownloading(false);
        }
    };

    return (
        <>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
                <IconButton onClick={onBack} sx={{ mr: 0.5 }} size="small"><ArrowBackIcon /></IconButton>
                <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" fontWeight={700} color="#0f172a">{exam.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                        {typeof exam.typeId === 'object' ? exam.typeId?.name : 'Exam'} • {typeof exam.termId === 'object' ? exam.termId?.name : 'Term'}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'stretch', sm: 'flex-end' } }}>
                    <Button
                        variant="outlined"
                        startIcon={<CardMembershipIcon />}
                        onClick={handleGenerateAdmitCards}
                        disabled={generateAdmitCards.isPending}
                        size="small"
                        sx={{ flex: { xs: 1, sm: 'none' }, textTransform: 'none', fontWeight: 600 }}
                    >
                        {generateAdmitCards.isPending ? 'Generating...' : 'Admit Cards'}
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddCircleIcon />}
                        onClick={() => setOpen(true)}
                        size="small"
                        sx={{ flex: { xs: 1, sm: 'none' }, textTransform: 'none', fontWeight: 600 }}
                    >
                        Schedule Subject
                    </Button>
                </Box>
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={tabValue} onChange={(_e, value) => setTabValue(value)} textColor="primary" indicatorColor="primary">
                    <Tab label="Exam Schedule" sx={{ textTransform: 'none', fontWeight: 600, minHeight: 40, py: 1 }} />
                    <Tab label="Admit Cards" sx={{ textTransform: 'none', fontWeight: 600, minHeight: 40, py: 1 }} />
                </Tabs>
            </Box>

            {tabValue === 0 && (
                isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <Typography color="text.secondary">Loading schedule...</Typography>
                    </Box>
                ) : schedule?.data?.length === 0 ? (
                    <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                        <Typography color="text.secondary">No exams scheduled yet</Typography>
                    </Paper>
                ) : isMobile ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {[...(schedule?.data || [])].sort((a: any, b: any) =>
                            compareClassesNumerically(getClassName(a.classId), getClassName(b.classId)) ||
                            new Date(a.date).getTime() - new Date(b.date).getTime()
                        ).map((sch: any) => (
                            <Paper key={sch._id} variant="outlined" sx={{ p: 1.5, borderRadius: 2, borderColor: '#e2e8f0' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                                    <Box>
                                        <Typography variant="body1" fontWeight={700} color="#0f172a">
                                            {getClassName(sch.classId)} • {getSubjectName(sch.subjectId)}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(sch.date).toLocaleDateString()} • {sch.startTime} - {sch.endTime}
                                        </Typography>
                                    </Box>
                                    <IconButton size="small" color="primary" onClick={() => handleEditSchedule(sch)} sx={{ p: 0.5 }}>
                                        <EditIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                </Box>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, pt: 0.5, borderTop: '1px solid #f1f5f9' }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Room: <strong>{sch.roomId?.name || 'N/A'}</strong>
                                    </Typography>
                                    {sch.invigilators?.length > 0 && (
                                        <Typography variant="caption" color="text.secondary">
                                            • Invigilators: <strong>{sch.invigilators.map((inv: any) => `${inv.firstName} ${inv.lastName}`).join(', ')}</strong>
                                        </Typography>
                                    )}
                                </Box>
                            </Paper>
                        ))}
                    </Box>
                ) : (
                    <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'grey.100' }}>
                                    <TableCell><strong>Date</strong></TableCell>
                                    <TableCell><strong>Time</strong></TableCell>
                                    <TableCell><strong>Class</strong></TableCell>
                                    <TableCell><strong>Subject</strong></TableCell>
                                    <TableCell><strong>Room</strong></TableCell>
                                    <TableCell><strong>Invigilators</strong></TableCell>
                                    <TableCell><strong>Actions</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {[...(schedule?.data || [])].sort((a: any, b: any) =>
                                    compareClassesNumerically(getClassName(a.classId), getClassName(b.classId)) ||
                                    new Date(a.date).getTime() - new Date(b.date).getTime()
                                ).map((sch: any) => (
                                    <TableRow key={sch._id}>
                                        <TableCell>{new Date(sch.date).toLocaleDateString()}</TableCell>
                                        <TableCell>{sch.startTime} - {sch.endTime}</TableCell>
                                        <TableCell>{getClassName(sch.classId)}</TableCell>
                                        <TableCell>{getSubjectName(sch.subjectId)}</TableCell>
                                        <TableCell>{sch.roomId?.name || 'N/A'}</TableCell>
                                        <TableCell>
                                            {sch.invigilators?.map((inv: any) => `${inv.firstName} ${inv.lastName}`).join(', ')}
                                        </TableCell>
                                        <TableCell>
                                            <IconButton size="small" color="primary" onClick={() => handleEditSchedule(sch)}><EditIcon fontSize="small" /></IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )
            )}

            {tabValue === 1 && (
                <Box>
                    {/* Search Input */}
                    <Box sx={{ mb: 2 }}>
                        <TextField
                            placeholder="Search by name, ID, or roll number..."
                            value={searchInput}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)}
                            size="small"
                            sx={{ width: { xs: '100%', sm: 350 } }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>

                    <VirtualizedAdmitCardGrid
                        registrations={accumulatedRegistrations}
                        total={totalRegistrations}
                        regLoading={regLoading}
                        isFetching={regFetching}
                        hasMore={hasMoreRegistrations}
                        onLoadMore={handleLoadMore}
                        getClassSectionName={getClassSectionName}
                        handleViewAdmitCard={handleViewAdmitCard}
                    />
                </Box>
            )}

            {/* Schedule Dialog */}
            <Dialog open={open} onClose={() => { setOpen(false); setEditingSchedule(null); }} maxWidth="md" fullWidth fullScreen={isMobile}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>{editingSchedule ? 'Modify Assessment Schedule' : 'Schedule Subject Assessment'}</Typography>
                    <IconButton onClick={() => { setOpen(false); setEditingSchedule(null); }} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
                        {errorMsg && <Alert severity="error" variant="outlined" sx={{ borderRadius: 2 }}>{errorMsg}</Alert>}

                        {examClasses.length === 0 && !classesLoading && (
                            <Alert severity="warning" variant="outlined" sx={{ borderRadius: 2 }}>
                                No participating classes found for this exam. Please define target classes in the Exam Profile first.
                            </Alert>
                        )}

                        <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
                            Target & Subject
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <AppSelect
                                    label="Target Class"
                                    value={formData.classId}
                                    options={examClasses.map((c: any) => ({ value: c.classId, label: c.name }))}
                                    onChange={(e) => setFormData({ ...formData, classId: e.target.value as string })}
                                    disabled={examClasses.length === 0 || classesLoading}
                                    error={examClasses.length === 0}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <AppSelect
                                    label="Academic Subject"
                                    value={formData.subjectId}
                                    options={
                                        (subjects?.data || [])
                                            .filter((s: any) => !s.isSubSubject)
                                            .map((s: any) => ({ value: s.subjectId, label: s.name }))
                                    }
                                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value as string })}
                                />
                            </Grid>
                        </Grid>

                        <Divider sx={{ my: 0.5 }} />

                        <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
                            Temporal Logistics
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <AppDatePicker
                                    label="Exam Date"
                                    value={formData.date ? new Date(formData.date) : null}
                                    onChange={(date) => setFormData({ ...formData, date: date ? format(date, 'yyyy-MM-dd') : '' })}
                                    error={!!errors.date}
                                    helperText={errors.date}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <AppInput
                                    label="Commencement Time"
                                    type="time"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    value={formData.startTime}
                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <AppInput
                                    label="Conclusion Time"
                                    type="time"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    value={formData.endTime}
                                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                />
                            </Grid>
                        </Grid>

                        <Divider sx={{ my: 0.5 }} />

                        <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
                            Allocation & Invigilation
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <AppSelect
                                    label="Examination Venue"
                                    value={formData.roomId}
                                    options={[
                                        { value: "", label: "Unassigned / None" },
                                        ...(rooms?.data?.map((r: any) => ({
                                            value: r._id,
                                            label: `${r.name} (${r.code}) — Cap: ${r.capacity}`
                                        })) || [])
                                    ]}
                                    onChange={(e) => setFormData({ ...formData, roomId: e.target.value as string })}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <AppSelect
                                    multiple
                                    label="Assigned Invigilators"
                                    value={formData.invigilators}
                                    options={teachers?.data?.map((t: any) => ({
                                        value: t.teacherId,
                                        label: `${t.firstName} ${t.lastName}`
                                    })) || []}
                                    onChange={(e) => {
                                        const val = typeof e.target.value === 'string' ? e.target.value.split(',') : (e.target.value as string[]);
                                        setFormData({ ...formData, invigilators: val });
                                    }}
                                />
                            </Grid>
                        </Grid>

                        <Divider sx={{ my: 0.5 }} />

                        <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
                            Assessment Weightage
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <AppInput
                                    label="Max Marks (Theory)"
                                    type="number"
                                    fullWidth
                                    value={formData.maxMarksTheory}
                                    onChange={(e) => setFormData({ ...formData, maxMarksTheory: parseInt(e.target.value) })}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <AppInput
                                    label="Max Marks (Practical)"
                                    type="number"
                                    fullWidth
                                    value={formData.maxMarksPractical}
                                    onChange={(e) => setFormData({ ...formData, maxMarksPractical: parseInt(e.target.value) })}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <AppInput
                                    label="Minimum Passing Marks"
                                    type="number"
                                    fullWidth
                                    value={formData.passingMarks}
                                    onChange={(e) => setFormData({ ...formData, passingMarks: parseInt(e.target.value) })}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <AppButton onClick={() => setOpen(false)} variant="text" color="inherit">Cancel</AppButton>
                    <AppButton variant="contained" onClick={handleSubmit} loading={scheduleExam.isPending}>
                        {editingSchedule ? 'Update Schedule' : 'Finalize Schedule'}
                    </AppButton>
                </DialogActions>
            </Dialog>

            {/* Confirmation Dialog for Admit Cards */}
            <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Batch Generation</Typography>
                    <IconButton onClick={() => setConfirmDialogOpen(false)} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ py: 1 }}>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            Are you sure you want to generate admit cards for all eligible students in participating classes?
                        </Typography>
                        <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
                            This will automatically skip students who already have generated cards and process new registrations.
                        </Alert>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <AppButton onClick={() => setConfirmDialogOpen(false)} variant="text" color="inherit">Cancel</AppButton>
                    <AppButton
                        variant="contained"
                        onClick={confirmGenerateAdmitCards}
                        loading={generateAdmitCards.isPending}
                    >
                        Start Generation
                    </AppButton>
                </DialogActions>
            </Dialog>

            {/* Admit Card View Dialog */}
            <Dialog
                open={admitCardDialogOpen}
                onClose={() => setAdmitCardDialogOpen(false)}
                maxWidth="md"
                fullWidth
                fullScreen={isMobile}
                PaperProps={{ sx: { borderRadius: isMobile ? 0 : 2, mt: isMobile ? 0 : 10 } }}
            >
                <DialogContent sx={{ p: 0 }}>
                    {selectedStudent && (
                        <Box sx={{ border: '3px solid #1976d2', borderRadius: 1, overflow: 'hidden' }}>
                            {/* Header */}
                            <Box
                                sx={{
                                    background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                                    color: 'white',
                                    p: 2,
                                    textAlign: 'center',
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 1 }}>
                                    {schoolLogo ? (
                                        <Avatar src={schoolLogo} sx={{ width: 60, height: 60, bgcolor: 'white' }} />
                                    ) : (
                                        <Avatar sx={{ width: 60, height: 60, bgcolor: 'rgba(255,255,255,0.2)' }}>
                                            <SchoolIcon sx={{ fontSize: 35 }} />
                                        </Avatar>
                                    )}
                                    <Box>
                                        <Typography variant="h5" fontWeight={700}>{schoolName}</Typography>
                                        <Typography variant="body2" sx={{ opacity: 0.9 }}>{schoolAddress}</Typography>
                                    </Box>
                                </Box>
                                <Chip
                                    label="ADMIT CARD"
                                    sx={{ mt: 1, bgcolor: '#ff9800', color: 'white', fontWeight: 700, fontSize: '1rem', py: 2 }}
                                />
                            </Box>

                            {/* Exam Title */}
                            <Box sx={{ bgcolor: '#e3f2fd', p: 1.5, textAlign: 'center', borderBottom: '2px solid #1976d2' }}>
                                <Typography variant="h6" fontWeight={600} color="primary.dark">
                                    {exam.name} - {typeof exam.typeId === 'object' ? exam.typeId?.name : 'Examination'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Academic Year: {exam.academicYear || currentAcademicYear} | {typeof exam.termId === 'object' ? exam.termId?.name : 'Term'}
                                </Typography>
                            </Box>

                            {/* Content */}
                            <Box sx={{ p: 3 }}>
                                <Grid container spacing={3}>
                                    <Grid size={{ xs: 12, md: 8 }}>
                                        <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                                            <Table size="small">
                                                <TableBody>
                                                    <TableRow>
                                                        <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 600, width: '40%' }}>Student Name</TableCell>
                                                        <TableCell>{selectedStudent.student?.firstName} {selectedStudent.student?.lastName}</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 600 }}>
                                                            {selectedStudent?.student?.fatherNameLabel || "Father's Name"}
                                                        </TableCell>
                                                        <TableCell>{selectedStudent.student?.fatherName || selectedStudent.student?.parentName || 'N/A'}</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 600 }}>Roll Number</TableCell>
                                                        <TableCell>{selectedStudent.rollNumber}</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 600 }}>Student ID</TableCell>
                                                        <TableCell>{selectedStudent.studentId}</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 600 }}>Class / Section</TableCell>
                                                        <TableCell>{getClassSectionName(selectedStudent.classId, selectedStudent.sectionId)}</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 600 }}>Date of Birth</TableCell>
                                                        <TableCell>
                                                            {selectedStudent.student?.dateOfBirth
                                                                ? new Date(selectedStudent.student.dateOfBirth).toLocaleDateString()
                                                                : 'N/A'}
                                                        </TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </TableContainer>

                                        <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fff3e0' }}>
                                            <Typography variant="subtitle2" fontWeight={600} color="warning.dark">Examination Period</Typography>
                                            <Typography variant="body1" fontWeight={500}>
                                                {new Date(exam.startDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                {' '} to {' '}
                                                {new Date(exam.endDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                            </Typography>
                                        </Paper>
                                    </Grid>

                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Paper
                                                variant="outlined"
                                                sx={{ width: 130, height: 160, mx: 'auto', mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
                                            >
                                                {selectedStudent.student?.profileImage ? (
                                                    <Box component="img" src={selectedStudent.student.profileImage} alt="Student Photo" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <Avatar sx={{ width: 100, height: 100, bgcolor: 'grey.300' }}>
                                                        {selectedStudent.student?.firstName?.[0] || 'S'}
                                                    </Avatar>
                                                )}
                                            </Paper>
                                            <Typography variant="caption" color="text.secondary">Photograph of Candidate</Typography>

                                            <Paper
                                                variant="outlined"
                                                sx={{ width: 130, height: 50, mx: 'auto', mt: 2, mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            >
                                                {selectedStudent.student?.signature ? (
                                                    <Box component="img" src={selectedStudent.student.signature} alt="Signature" sx={{ maxWidth: '100%', maxHeight: '100%' }} />
                                                ) : (
                                                    <Typography variant="caption" color="text.disabled">Signature</Typography>
                                                )}
                                            </Paper>
                                            <Typography variant="caption" color="text.secondary">Signature of Candidate</Typography>
                                        </Box>
                                    </Grid>
                                </Grid>

                                {/* Exam Schedule Table */}
                                {filteredStudentSchedule.length > 0 && (
                                    <Box sx={{ mt: 3 }}>
                                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1, color: 'primary.main' }}>
                                            Exam Schedule
                                        </Typography>
                                        <TableContainer component={Paper} variant="outlined">
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                                        <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                                                        <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
                                                        <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                                                        <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Invigilator Sign</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {filteredStudentSchedule.map((sch: any, index: number) => (
                                                        <TableRow key={sch._id || index}>
                                                            <TableCell>
                                                                {new Date(sch.date).toLocaleDateString('en-IN', {
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                    year: 'numeric'
                                                                })}
                                                            </TableCell>
                                                            <TableCell>{sch.startTime} - {sch.endTime}</TableCell>
                                                            <TableCell>{getSubjectName(sch.subjectId)}</TableCell>
                                                            <TableCell sx={{ textAlign: 'center', minWidth: 100 }}>
                                                                <Box sx={{ borderBottom: '1px solid #ccc', width: 80, mx: 'auto', height: 20 }} />
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Box>
                                )}

                                <Divider sx={{ my: 3 }} />

                                <Grid container spacing={2}>
                                    {['Class Teacher\'s Signature', 'Candidate\'s Signature', 'Principal\'s Signature'].map((label) => (
                                        <Grid key={label} size={{ xs: 4 }}>
                                            <Box sx={{ textAlign: 'center' }}>
                                                <Box sx={{ borderBottom: '1px solid #333', height: 40, mb: 1 }} />
                                                <Typography variant="caption" fontWeight={500}>{label}</Typography>
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>

                                <Paper sx={{ mt: 3, p: 2, bgcolor: '#fafafa' }} variant="outlined">
                                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Important Instructions:</Typography>
                                    <Typography variant="caption" component="ul" sx={{ pl: 2, m: 0 }}>
                                        <li>Bring this admit card to the examination hall along with a valid ID proof.</li>
                                        <li>Reach the examination center at least 30 minutes before the scheduled time.</li>
                                        <li>Electronic devices including mobile phones are strictly prohibited.</li>
                                        <li>Any attempt to use unfair means will result in disqualification.</li>
                                    </Typography>
                                </Paper>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
                    <Button onClick={() => setAdmitCardDialogOpen(false)}>Close</Button>
                    <Button
                        variant="contained"
                        startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
                        onClick={handleDownloadPDF}
                        disabled={downloading}
                    >
                        {downloading ? 'Generating...' : 'Download PDF'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default ExamScheduler;
