import React, { useState } from 'react';
import {
    Box,
    Tab,
    Tabs,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Grid,
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CancelIcon from '@mui/icons-material/Cancel';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import StarIcon from '@mui/icons-material/Star';
import { AppInput } from '../../../components/shared/AppInput';
import { AppSelect } from '../../../components/shared/AppSelect';
import { AppButton } from '../../../components/shared/AppButton';
import { AppDatePicker } from '../../../components/shared/AppDatePicker';
import { FormControlLabel, Switch } from '@mui/material';
import { format, parse, isValid, startOfDay } from 'date-fns';
import { useAuth } from '../../../context/AuthContext';
import {
    useCreateExamTerm,
    useGetExamTerms,
    useUpdateExamTerm,
    useDeleteExamTerm,
    useCreateExamType,
    useGetExamTypes,
    useDeleteExamType,
    useCreateGradingSystem,
    useGetGradingSystems,
    useDeleteGradingSystem
} from '../../../queries/Exam';
import {
    useGetAcademicYears,
    useCreateAcademicYear,
    useUpdateAcademicYear,
    useSetCurrentAcademicYear,
    useDeleteAcademicYear
} from '../../../queries/AcademicYear';
import { useAcademicYear } from '../../../hooks/useAcademicYear';
import { useCreateRoom, useDeleteRoom, useGetAllRooms, useUpdateRoom } from '../../../queries/Timetable';
import { useGetClasses } from '../../../queries/Class';
import type { CreateExamTermRequest, CreateExamTypeRequest, GradeRange } from '../../../types/exam.types';
import type { CreateRoomRequest } from '../../../types/timetable.types';
import type { AcademicYear } from '../../../types/academicYear.types';
import ConfirmationDialog from '../../../components/Dialogs/ConfirmationDialog';
import Tooltip from '@mui/material/Tooltip';

import CloseIcon from '@mui/icons-material/Close';
import { useUrlTab } from '../../../hooks/useUrlTab';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { useLocation } from 'react-router-dom';

// ==========================================
// EXAM CONFIGURATION PAGE
// ==========================================

const ExamConfiguration = () => {
    const isMobile = useIsMobile();
    const location = useLocation();
    const autoOpenAddYear = !!(location.state as any)?.openAddAcademicYear;
    const [activeTab, setActiveTab] = useUrlTab(0, ['years', 'terms', 'types', 'grading', 'rooms']);
    const { user } = useAuth();
    const schoolId = user?.schoolId || '';

    React.useEffect(() => {
        if (autoOpenAddYear && activeTab !== 0) {
            setActiveTab(0);
        }
    }, [autoOpenAddYear, activeTab, setActiveTab]);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    return (
        <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
            {!isMobile && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                    <Typography variant="h5" fontWeight={700} color="#0f172a">Academic & Exam Configuration</Typography>
                </Box>
            )}

            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    textColor="primary"
                    indicatorColor="primary"
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ minHeight: 40 }}
                >
                    <Tab label="Academic Years" sx={{ textTransform: 'none', fontWeight: 600, minHeight: 40, py: 1 }} />
                    <Tab label="Exam Terms" sx={{ textTransform: 'none', fontWeight: 600, minHeight: 40, py: 1 }} />
                    <Tab label="Exam Types" sx={{ textTransform: 'none', fontWeight: 600, minHeight: 40, py: 1 }} />
                    <Tab label="Grading Systems" sx={{ textTransform: 'none', fontWeight: 600, minHeight: 40, py: 1 }} />
                    <Tab label="Rooms" sx={{ textTransform: 'none', fontWeight: 600, minHeight: 40, py: 1 }} />
                </Tabs>
            </Box>

            <Box role="tabpanel" hidden={activeTab !== 0}>
                {activeTab === 0 && <AcademicYearsTab schoolId={schoolId} isMobile={isMobile} autoOpenAddYear={autoOpenAddYear} />}
            </Box>
            <Box role="tabpanel" hidden={activeTab !== 1}>
                {activeTab === 1 && <ExamTermsTab schoolId={schoolId} isMobile={isMobile} />}
            </Box>
            <Box role="tabpanel" hidden={activeTab !== 2}>
                {activeTab === 2 && <ExamTypesTab schoolId={schoolId} isMobile={isMobile} />}
            </Box>
            <Box role="tabpanel" hidden={activeTab !== 3}>
                {activeTab === 3 && <GradingSystemsTab schoolId={schoolId} isMobile={isMobile} />}
            </Box>
            <Box role="tabpanel" hidden={activeTab !== 4}>
                {activeTab === 4 && <RoomsTab schoolId={schoolId} isMobile={isMobile} />}
            </Box>
        </Box>
    );
};

// ==========================================
// TAB 0: ACADEMIC YEARS
// ==========================================

const AcademicYearsTab = ({ schoolId, isMobile, autoOpenAddYear }: { schoolId: string; isMobile: boolean; autoOpenAddYear?: boolean }) => {
    const [open, setOpen] = useState(autoOpenAddYear || false);
    const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);

    React.useEffect(() => {
        if (autoOpenAddYear) {
            setOpen(true);
            window.history.replaceState({}, document.title);
        }
    }, [autoOpenAddYear]);
    const { data: yearsData, isLoading } = useGetAcademicYears(schoolId);
    const createYear = useCreateAcademicYear(schoolId);
    const updateYear = useUpdateAcademicYear(schoolId);
    const setCurrentYear = useSetCurrentAcademicYear(schoolId);
    const deleteYear = useDeleteAcademicYear(schoolId);

    const years = yearsData?.data || [];
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        title: string;
        description: string;
        variant: 'primary' | 'danger' | 'warning';
        confirmLabel?: string;
        onConfirm: () => void;
    }>({
        open: false,
        title: '',
        description: '',
        variant: 'primary',
        onConfirm: () => {}
    });

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        startDate: '',
        endDate: '',
        isCurrent: false,
        status: 'active',
        description: ''
    });

    const handleEdit = (year: AcademicYear) => {
        setEditingYear(year);
        setFormData({
            name: year.name,
            code: year.code,
            startDate: year.startDate?.split('T')[0] || '',
            endDate: year.endDate?.split('T')[0] || '',
            isCurrent: year.isCurrent,
            status: year.status || 'active',
            description: year.description || ''
        });
        setErrors({});
        setOpen(true);
    };

    const handleDelete = (year: AcademicYear) => {
        if (year.isCurrent) {
            return;
        }
        setConfirmDialog({
            open: true,
            title: 'Delete Academic Year',
            description: `Are you sure you want to delete academic year '${year.name}'? This action cannot be undone.`,
            variant: 'danger',
            confirmLabel: 'Delete Year',
            onConfirm: () => {
                deleteYear.mutate(year._id || year.academicYearId);
                setConfirmDialog((prev) => ({ ...prev, open: false }));
            }
        });
    };

    const handleSetCurrent = (year: AcademicYear) => {
        if (year.status === 'completed' || year.status === 'archived') {
            return;
        }
        setConfirmDialog({
            open: true,
            title: 'Set Current Academic Year',
            description: `Set '${year.name}' as the active current academic year across the school?`,
            variant: 'primary',
            confirmLabel: 'Set as Current',
            onConfirm: () => {
                setCurrentYear.mutate(year._id || year.academicYearId);
                setConfirmDialog((prev) => ({ ...prev, open: false }));
            }
        });
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.name?.trim()) newErrors.name = 'Name is required';
        if (!formData.startDate) newErrors.startDate = 'Start date is required';
        if (!formData.endDate) newErrors.endDate = 'End date is required';

        if (formData.startDate && formData.endDate) {
            const start = parse(formData.startDate, 'yyyy-MM-dd', new Date());
            const end = parse(formData.endDate, 'yyyy-MM-dd', new Date());
            if (end < start) newErrors.endDate = 'End date cannot be before start date';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        const payload = {
            name: formData.name.trim(),
            code: (formData.code || formData.name).trim(),
            startDate: formData.startDate,
            endDate: formData.endDate,
            isCurrent: formData.isCurrent,
            status: formData.status,
            description: formData.description
        };

        if (editingYear) {
            updateYear.mutate({ id: editingYear._id || editingYear.academicYearId, data: payload }, {
                onSuccess: () => {
                    handleClose();
                }
            });
        } else {
            createYear.mutate(payload, {
                onSuccess: () => {
                    handleClose();
                }
            });
        }
    };

    const handleClose = () => {
        setOpen(false);
        setEditingYear(null);
        setFormData({
            name: '',
            code: '',
            startDate: '',
            endDate: '',
            isCurrent: false,
            status: 'active',
            description: ''
        });
        setErrors({});
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Box>
                    <Typography variant="h6" fontWeight={700} color="#0f172a">Academic Years List</Typography>
                    <Typography variant="caption" color="text.secondary">
                        Manage school academic years and configure the currently active academic cycle
                    </Typography>
                </Box>
                <AppButton variant="contained" startIcon={<AddCircleIcon />} onClick={() => setOpen(true)} size="small" sx={{ textTransform: 'none', fontWeight: 600 }}>
                    Add Academic Year
                </AppButton>
            </Box>

            {years.length === 0 && !isLoading ? (
                <Paper elevation={0} variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                    <Typography color="text.secondary">No academic years configured yet. Click 'Add Academic Year' to create one.</Typography>
                </Paper>
            ) : (
                <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.100' }}>
                                <TableCell><strong>Academic Year</strong></TableCell>
                                <TableCell><strong>Code</strong></TableCell>
                                <TableCell><strong>Duration</strong></TableCell>
                                <TableCell align="center"><strong>Status</strong></TableCell>
                                <TableCell align="center"><strong>Current Year</strong></TableCell>
                                <TableCell align="right"><strong>Actions</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {years.map((year: AcademicYear) => (
                                <TableRow key={year._id || year.academicYearId} hover sx={{ bgcolor: year.isCurrent ? 'rgba(37, 99, 235, 0.04)' : 'inherit' }}>
                                    <TableCell sx={{ fontWeight: year.isCurrent ? 700 : 500 }}>
                                        {year.name}
                                    </TableCell>
                                    <TableCell>{year.code}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                                            {year.startDate ? new Date(year.startDate).toLocaleDateString() : '—'}
                                            {' – '}
                                            {year.endDate ? new Date(year.endDate).toLocaleDateString() : '—'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={year.status || 'active'}
                                            size="small"
                                            color={year.status === 'active' ? 'success' : year.status === 'upcoming' ? 'info' : 'default'}
                                            sx={{ textTransform: 'capitalize', fontWeight: 600, fontSize: '0.72rem' }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        {year.isCurrent ? (
                                            <Chip
                                                icon={<StarIcon sx={{ fontSize: '15px !important' }} />}
                                                label="Current Active Year"
                                                size="small"
                                                color="primary"
                                                sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                                            />
                                        ) : year.status === 'completed' || year.status === 'archived' ? (
                                            <Tooltip title="Completed academic years cannot be set as current">
                                                <span>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        color="inherit"
                                                        disabled
                                                        sx={{ textTransform: 'none', fontSize: '0.72rem', py: 0.2, px: 1, borderRadius: 1.5, opacity: 0.5 }}
                                                    >
                                                        Completed
                                                    </Button>
                                                </span>
                                            </Tooltip>
                                        ) : (
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                color="primary"
                                                onClick={() => handleSetCurrent(year)}
                                                disabled={setCurrentYear.isPending}
                                                sx={{ textTransform: 'none', fontSize: '0.72rem', py: 0.2, px: 1, borderRadius: 1.5 }}
                                            >
                                                Set as Current
                                            </Button>
                                        )}
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" color="primary" onClick={() => handleEdit(year)}><EditIcon fontSize="small" /></IconButton>
                                        <IconButton size="small" color="error" onClick={() => handleDelete(year)} disabled={year.isCurrent}><DeleteIcon fontSize="small" /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" fullScreen={isMobile}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight={600}>{editingYear ? 'Edit Academic Year' : 'Add New Academic Year'}</Typography>
                    {isMobile && (
                        <IconButton onClick={handleClose} size="small">
                            <CloseIcon />
                        </IconButton>
                    )}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <AppInput
                            label="Academic Year Name"
                            placeholder="e.g. 2025-2026"
                            fullWidth
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value, code: formData.code || e.target.value })}
                            error={!!errors.name}
                            helperText={errors.name}
                        />
                        <AppInput
                            label="Year Code"
                            placeholder="e.g. 2025-2026"
                            fullWidth
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        />
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                            <AppDatePicker
                                label="Start Date"
                                value={formData.startDate ? parse(formData.startDate, 'yyyy-MM-dd', new Date()) : null}
                                onChange={(date) => setFormData({ ...formData, startDate: date ? format(date, 'yyyy-MM-dd') : '' })}
                                error={!!errors.startDate}
                                helperText={errors.startDate}
                            />
                            <AppDatePicker
                                label="End Date"
                                value={formData.endDate ? parse(formData.endDate, 'yyyy-MM-dd', new Date()) : null}
                                onChange={(date) => setFormData({ ...formData, endDate: date ? format(date, 'yyyy-MM-dd') : '' })}
                                error={!!errors.endDate}
                                helperText={errors.endDate}
                            />
                        </Box>
                        <AppSelect
                            label="Status"
                            value={formData.status}
                            options={[
                                { label: 'Active', value: 'active' },
                                { label: 'Upcoming', value: 'upcoming' },
                                { label: 'Completed', value: 'completed' },
                                { label: 'Archived', value: 'archived' }
                            ]}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as string })}
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.isCurrent}
                                    onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })}
                                    color="primary"
                                />
                            }
                            label="Set as Current Active Academic Year"
                        />
                        <AppInput
                            label="Description (Optional)"
                            placeholder="e.g. Academic cycle for standard sessions"
                            fullWidth
                            multiline
                            rows={2}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <AppButton variant="outlined" onClick={handleClose}>Cancel</AppButton>
                    <AppButton variant="contained" onClick={handleSubmit} disabled={createYear.isPending || updateYear.isPending}>
                        {editingYear ? 'Save Changes' : 'Create Academic Year'}
                    </AppButton>
                </DialogActions>
            </Dialog>

            <ConfirmationDialog
                open={confirmDialog.open}
                onClose={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                description={confirmDialog.description}
                variant={confirmDialog.variant}
                confirmLabel={confirmDialog.confirmLabel}
                isLoading={setCurrentYear.isPending || deleteYear.isPending}
            />
        </Box>
    );
};

// ==========================================
// TAB 1: EXAM TERMS
// ==========================================

const ExamTermsTab = ({ schoolId, isMobile }: { schoolId: string; isMobile: boolean }) => {
    const [open, setOpen] = useState(false);
    const [editingTerm, setEditingTerm] = useState<any>(null);
    const { academicYearOptions, currentAcademicYear } = useAcademicYear();
    const { data: terms, isLoading } = useGetExamTerms(schoolId);
    const createTerm = useCreateExamTerm(schoolId);
    const updateTerm = useUpdateExamTerm(schoolId);
    const deleteTerm = useDeleteExamTerm(schoolId);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [termToDelete, setTermToDelete] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState<CreateExamTermRequest>({
        name: '',
        academicYear: currentAcademicYear,
        startDate: '',
        endDate: ''
    });

    const handleEdit = (term: any) => {
        setEditingTerm(term);
        setFormData({
            name: term.name,
            academicYear: term.academicYear,
            startDate: term.startDate?.split('T')[0] || '',
            endDate: term.endDate?.split('T')[0] || ''
        });
        setErrors({});
        setOpen(true);
    };

    const handleDelete = (termId: string) => {
        setTermToDelete(termId);
        setDeleteConfirmOpen(true);
    };

    const confirmDeleteTerm = () => {
        if (termToDelete) {
            deleteTerm.mutate(termToDelete, {
                onSettled: () => {
                    setDeleteConfirmOpen(false);
                    setTermToDelete(null);
                }
            });
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.name?.trim()) newErrors.name = 'Name is required';
        if (!formData.academicYear?.trim()) newErrors.academicYear = 'Academic year is required';
        if (!formData.startDate) newErrors.startDate = 'Start date is required';
        if (!formData.endDate) newErrors.endDate = 'End date is required';

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
        return Object.keys(newErrors).length === 0;
    };

    const handleFieldChange = (field: string, value: string) => {
        setFormData({ ...formData, [field]: value });
        if (errors[field]) setErrors({ ...errors, [field]: '' });
    };

    const handleSubmit = () => {
        if (!validate()) return;
        if (editingTerm) {
            updateTerm.mutate({ termId: editingTerm._id, data: formData }, {
                onSuccess: () => {
                    setOpen(false);
                    setEditingTerm(null);
                    setFormData({ name: '', academicYear: currentAcademicYear, startDate: '', endDate: '' });
                }
            });
        } else {
            createTerm.mutate(formData, {
                onSuccess: () => {
                    setOpen(false);
                    setFormData({ name: '', academicYear: currentAcademicYear, startDate: '', endDate: '' });
                }
            });
        }
    };

    const handleClose = () => {
        setOpen(false);
        setEditingTerm(null);
        setFormData({ name: '', academicYear: currentAcademicYear, startDate: '', endDate: '' });
        setErrors({});
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={700} color="#0f172a">Academic Terms</Typography>
                <AppButton variant="contained" startIcon={<AddCircleIcon />} onClick={() => setOpen(true)} size="small" sx={{ textTransform: 'none', fontWeight: 600 }}>
                    Add Term
                </AppButton>
            </Box>

            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <Typography color="text.secondary">Loading terms...</Typography>
                </Box>
            ) : !terms?.data || terms.data.length === 0 ? (
                <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
                    <Typography color="text.secondary">No academic terms found.</Typography>
                </Paper>
            ) : isMobile ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {terms.data.map((term: any) => (
                        <Paper key={term._id} variant="outlined" sx={{ p: 1.5, borderRadius: 2, borderColor: '#e2e8f0' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.75 }}>
                                <Box>
                                    <Typography variant="body1" fontWeight={700} color="#0f172a">{term.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">Academic Year: {term.academicYear}</Typography>
                                </Box>
                                <Chip
                                    label={term.isActive ? 'Active' : 'Inactive'}
                                    size="small"
                                    color={term.isActive ? 'success' : 'default'}
                                    sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                                />
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 0.5, borderTop: '1px solid #f1f5f9' }}>
                                <Typography variant="caption" color="text.secondary">
                                    {new Date(term.startDate).toLocaleDateString()} - {new Date(term.endDate).toLocaleDateString()}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    <IconButton size="small" color="primary" onClick={() => handleEdit(term)} sx={{ p: 0.5 }}>
                                        <EditIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                    <IconButton size="small" color="error" onClick={() => handleDelete(term._id)} sx={{ p: 0.5 }}>
                                        <DeleteIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                </Box>
                            </Box>
                        </Paper>
                    ))}
                </Box>
            ) : (
                <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.100' }}>
                                <TableCell><strong>Name</strong></TableCell>
                                <TableCell><strong>Academic Year</strong></TableCell>
                                <TableCell><strong>Start Date</strong></TableCell>
                                <TableCell><strong>End Date</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                                <TableCell><strong>Actions</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {terms.data.map((term: any) => (
                                <TableRow key={term._id}>
                                    <TableCell>{term.name}</TableCell>
                                    <TableCell>{term.academicYear}</TableCell>
                                    <TableCell>{new Date(term.startDate).toLocaleDateString()}</TableCell>
                                    <TableCell>{new Date(term.endDate).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Chip label={term.isActive ? 'Active' : 'Inactive'} size="small" color={term.isActive ? 'success' : 'default'} />
                                    </TableCell>
                                    <TableCell>
                                        <IconButton size="small" color="primary" onClick={() => handleEdit(term)}><EditIcon fontSize="small" /></IconButton>
                                        <IconButton size="small" color="error" onClick={() => handleDelete(term._id)}><DeleteIcon fontSize="small" /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" fullScreen={isMobile}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight={600}>{editingTerm ? 'Edit Term' : 'Add New Term'}</Typography>
                    {isMobile && (
                        <IconButton onClick={handleClose} size="small">
                            <CloseIcon />
                        </IconButton>
                    )}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <AppInput
                            label="Term Name"
                            fullWidth
                            value={formData.name}
                            onChange={(e) => handleFieldChange('name', e.target.value)}
                            error={!!errors.name}
                            helperText={errors.name}
                        />
                        <AppSelect
                            label="Academic Year"
                            value={formData.academicYear}
                            options={academicYearOptions}
                            onChange={(e) => handleFieldChange('academicYear', e.target.value as string)}
                            error={!!errors.academicYear}
                            helperText={errors.academicYear}
                        />
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                            <AppDatePicker
                                label="Start Date"
                                value={formData.startDate ? parse(formData.startDate, 'yyyy-MM-dd', new Date()) : null}
                                onChange={(date) => handleFieldChange('startDate', date ? format(date, 'yyyy-MM-dd') : '')}
                                maxDate={formData.endDate ? parse(formData.endDate, 'yyyy-MM-dd', new Date()) : undefined}
                                disablePast
                                error={!!errors.startDate}
                                helperText={errors.startDate}
                            />
                            <AppDatePicker
                                label="End Date"
                                value={formData.endDate ? parse(formData.endDate, 'yyyy-MM-dd', new Date()) : null}
                                onChange={(date) => handleFieldChange('endDate', date ? format(date, 'yyyy-MM-dd') : '')}
                                minDate={formData.startDate ? parse(formData.startDate, 'yyyy-MM-dd', new Date()) : undefined}
                                disablePast
                                error={!!errors.endDate}
                                helperText={errors.endDate}
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button variant="contained" onClick={handleSubmit} disabled={createTerm.isPending || updateTerm.isPending}>
                        {(createTerm.isPending || updateTerm.isPending) ? 'Saving...' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>

            <ConfirmationDialog
                open={deleteConfirmOpen}
                onClose={() => {
                    setDeleteConfirmOpen(false);
                    setTermToDelete(null);
                }}
                onConfirm={confirmDeleteTerm}
                title="Delete Exam Term"
                description="Are you sure you want to delete this term? This action cannot be undone."
                confirmLabel="Delete Term"
                variant="danger"
                isLoading={deleteTerm.isPending}
            />
        </Box>
    );
};

// ==========================================
// TAB 2: EXAM TYPES
// ==========================================

const ExamTypesTab = ({ schoolId, isMobile }: { schoolId: string; isMobile: boolean }) => {
    const [open, setOpen] = useState(false);
    const { data: types, isLoading } = useGetExamTypes(schoolId);
    const { data: terms } = useGetExamTerms(schoolId);
    const createType = useCreateExamType(schoolId);
    const deleteType = useDeleteExamType(schoolId);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [typeToDelete, setTypeToDelete] = useState<string | null>(null);

    const [formData, setFormData] = useState<CreateExamTypeRequest>({
        name: '',
        weightage: 100,
        description: '',
        termId: ''
    });

    const handleDelete = (typeId: string) => {
        setTypeToDelete(typeId);
        setDeleteConfirmOpen(true);
    };

    const confirmDeleteType = () => {
        if (typeToDelete) {
            deleteType.mutate(typeToDelete, {
                onSettled: () => {
                    setDeleteConfirmOpen(false);
                    setTypeToDelete(null);
                }
            });
        }
    };

    const handleSubmit = () => {
        createType.mutate(formData, {
            onSuccess: () => {
                setOpen(false);
                setFormData({ name: '', weightage: 100, description: '', termId: '' });
            }
        });
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={700} color="#0f172a">Exam Types</Typography>
                <AppButton variant="contained" startIcon={<AddCircleIcon />} onClick={() => setOpen(true)} size="small" sx={{ textTransform: 'none', fontWeight: 600 }}>
                    Add Exam Type
                </AppButton>
            </Box>

            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <Typography color="text.secondary">Loading exam types...</Typography>
                </Box>
            ) : !types?.data || types.data.length === 0 ? (
                <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
                    <Typography color="text.secondary">No exam types found.</Typography>
                </Paper>
            ) : isMobile ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {types.data.map((type: any) => (
                        <Paper key={type._id} variant="outlined" sx={{ p: 1.5, borderRadius: 2, borderColor: '#e2e8f0' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                                <Box>
                                    <Typography variant="body1" fontWeight={700} color="#0f172a">{type.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">Term: {type.termId?.name || 'N/A'}</Typography>
                                </Box>
                                <Chip label={`${type.weightage}%`} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700, height: 22 }} />
                            </Box>
                            {type.description && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', my: 0.5 }}>
                                    {type.description}
                                </Typography>
                            )}
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 0.5, borderTop: '1px solid #f1f5f9' }}>
                                <IconButton size="small" color="error" onClick={() => handleDelete(type._id)} sx={{ p: 0.5 }}>
                                    <DeleteIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Box>
                        </Paper>
                    ))}
                </Box>
            ) : (
                <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.100' }}>
                                <TableCell><strong>Name</strong></TableCell>
                                <TableCell><strong>Related Term</strong></TableCell>
                                <TableCell><strong>Weightage</strong></TableCell>
                                <TableCell><strong>Description</strong></TableCell>
                                <TableCell><strong>Actions</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {types.data.map((type: any) => (
                                <TableRow key={type._id}>
                                    <TableCell>{type.name}</TableCell>
                                    <TableCell>{type.termId?.name || 'N/A'}</TableCell>
                                    <TableCell>{type.weightage}%</TableCell>
                                    <TableCell>{type.description}</TableCell>
                                    <TableCell>
                                        <IconButton size="small" color="error" onClick={() => handleDelete(type._id)}><DeleteIcon fontSize="small" /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" fullScreen={isMobile}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight={600}>Add Exam Type</Typography>
                    {isMobile && (
                        <IconButton onClick={() => setOpen(false)} size="small">
                            <CloseIcon />
                        </IconButton>
                    )}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <AppInput
                            label="Name"
                            fullWidth
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                        <AppSelect
                            label="Associated Term (Optional)"
                            value={formData.termId}
                            options={[
                                { value: '', label: 'None' },
                                ...(terms?.data?.map((t: any) => ({ value: t._id, label: t.name })) || [])
                            ]}
                            onChange={(e) => setFormData({ ...formData, termId: e.target.value as string })}
                        />
                        <AppInput
                            label="Weightage (%)"
                            type="number"
                            fullWidth
                            value={formData.weightage}
                            onChange={(e) => setFormData({ ...formData, weightage: parseInt(e.target.value) })}
                        />
                        <AppInput
                            label="Description"
                            fullWidth
                            multiline
                            rows={2}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSubmit} disabled={createType.isPending}>
                        {createType.isPending ? 'Saving...' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>

            <ConfirmationDialog
                open={deleteConfirmOpen}
                onClose={() => {
                    setDeleteConfirmOpen(false);
                    setTypeToDelete(null);
                }}
                onConfirm={confirmDeleteType}
                title="Delete Exam Type"
                description="Are you sure you want to delete this exam type? This action cannot be undone."
                confirmLabel="Delete Type"
                variant="danger"
                isLoading={deleteType.isPending}
            />
        </Box>
    );
};

// ==========================================
// TAB 3: GRADING SYSTEMS
// ==========================================

const GradingSystemsTab = ({ schoolId, isMobile }: { schoolId: string; isMobile: boolean }) => {
    const [open, setOpen] = useState(false);
    const { data: systems, isLoading } = useGetGradingSystems(schoolId);
    const createSystem = useCreateGradingSystem(schoolId);
    const deleteSystem = useDeleteGradingSystem(schoolId);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [systemToDelete, setSystemToDelete] = useState<string | null>(null);

    const [name, setName] = useState('');
    const [grades, setGrades] = useState<GradeRange[]>([
        { name: 'A1', minPercentage: 91, maxPercentage: 100, points: 10 },
        { name: 'A2', minPercentage: 81, maxPercentage: 90, points: 9 }
    ]);

    const addGradeRow = () => {
        setGrades([...grades, { name: '', minPercentage: 0, maxPercentage: 0, points: 0 }]);
    };

    const updateGradeRow = (index: number, field: keyof GradeRange, value: any) => {
        const newGrades = [...grades];
        newGrades[index] = { ...newGrades[index], [field]: value };
        setGrades(newGrades);
    };

    const removeGradeRow = (index: number) => {
        setGrades(grades.filter((_, i) => i !== index));
    };

    const handleDelete = (systemId: string) => {
        setSystemToDelete(systemId);
        setDeleteConfirmOpen(true);
    };

    const confirmDeleteSystem = () => {
        if (systemToDelete) {
            deleteSystem.mutate(systemToDelete, {
                onSettled: () => {
                    setDeleteConfirmOpen(false);
                    setSystemToDelete(null);
                }
            });
        }
    };

    const handleSubmit = () => {
        createSystem.mutate({ name, grades, isDefault: false }, {
            onSuccess: () => {
                setOpen(false);
                setName('');
                setGrades([{ name: 'A1', minPercentage: 91, maxPercentage: 100, points: 10 }]);
            }
        });
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={700} color="#0f172a">Grading Systems</Typography>
                <Button variant="contained" startIcon={<AddCircleIcon />} onClick={() => setOpen(true)} size="small" sx={{ textTransform: 'none', fontWeight: 600 }}>
                    Add System
                </Button>
            </Box>

            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <Typography color="text.secondary">Loading grading systems...</Typography>
                </Box>
            ) : !systems?.data || systems.data.length === 0 ? (
                <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
                    <Typography color="text.secondary">No grading systems found.</Typography>
                </Paper>
            ) : isMobile ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {systems.data.map((sys: any) => (
                        <Paper key={sys._id} variant="outlined" sx={{ p: 1.5, borderRadius: 2, borderColor: '#e2e8f0' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                <Typography variant="body1" fontWeight={700} color="#0f172a">{sys.name}</Typography>
                                {sys.isDefault && <Chip label="Default" size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem' }} />}
                            </Box>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                                {sys.grades.map((g: any, i: number) => (
                                    <Chip key={i} label={`${g.name}: ${g.minPercentage}-${g.maxPercentage}%`} size="small" variant="outlined" sx={{ fontSize: '0.75rem', height: 22 }} />
                                ))}
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 0.5, borderTop: '1px solid #f1f5f9' }}>
                                <IconButton size="small" color="error" onClick={() => handleDelete(sys._id)} sx={{ p: 0.5 }}>
                                    <DeleteIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Box>
                        </Paper>
                    ))}
                </Box>
            ) : (
                <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.100' }}>
                                <TableCell><strong>System Name</strong></TableCell>
                                <TableCell><strong>Grades</strong></TableCell>
                                <TableCell><strong>Is Default</strong></TableCell>
                                <TableCell><strong>Actions</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {systems.data.map((sys: any) => (
                                <TableRow key={sys._id}>
                                    <TableCell>{sys.name}</TableCell>
                                    <TableCell>
                                        {sys.grades.map((g: any) => g.name).join(', ')}
                                    </TableCell>
                                    <TableCell>{sys.isDefault ? 'Yes' : 'No'}</TableCell>
                                    <TableCell>
                                        <IconButton size="small" color="error" onClick={() => handleDelete(sys._id)}><DeleteIcon fontSize="small" /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight={600}>Add Grading System</Typography>
                    {isMobile && (
                        <IconButton onClick={() => setOpen(false)} size="small">
                            <CloseIcon />
                        </IconButton>
                    )}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField
                            label="System Name"
                            fullWidth
                            size="small"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />

                        <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 1 }}>Grade Ranges</Typography>
                        {grades.map((grade, index) => (
                            <Box key={index} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr 1fr 1fr auto', sm: '1fr 1fr 1fr 1fr auto' }, gap: 1, alignItems: 'center' }}>
                                <TextField
                                    label="Grade"
                                    size="small"
                                    value={grade.name}
                                    onChange={(e) => updateGradeRow(index, 'name', e.target.value)}
                                />
                                <TextField
                                    label="Min %"
                                    type="number"
                                    size="small"
                                    value={grade.minPercentage}
                                    onChange={(e) => updateGradeRow(index, 'minPercentage', parseFloat(e.target.value))}
                                />
                                <TextField
                                    label="Max %"
                                    type="number"
                                    size="small"
                                    value={grade.maxPercentage}
                                    onChange={(e) => updateGradeRow(index, 'maxPercentage', parseFloat(e.target.value))}
                                />
                                <TextField
                                    label="Points"
                                    type="number"
                                    size="small"
                                    value={grade.points}
                                    onChange={(e) => updateGradeRow(index, 'points', parseFloat(e.target.value))}
                                />
                                <IconButton color="error" size="small" onClick={() => removeGradeRow(index)}>
                                    <CancelIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        ))}
                        <Button startIcon={<AddCircleIcon />} onClick={addGradeRow} size="small" sx={{ alignSelf: 'flex-start', textTransform: 'none' }}>
                            Add Grade Tier
                        </Button>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSubmit} disabled={createSystem.isPending}>
                        {createSystem.isPending ? 'Saving...' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>

            <ConfirmationDialog
                open={deleteConfirmOpen}
                onClose={() => {
                    setDeleteConfirmOpen(false);
                    setSystemToDelete(null);
                }}
                onConfirm={confirmDeleteSystem}
                title="Delete Grading System"
                description="Are you sure you want to delete this grading system? This action cannot be undone."
                confirmLabel="Delete System"
                variant="danger"
                isLoading={deleteSystem.isPending}
            />
        </Box>
    );
};

// ==========================================
// TAB 4: ROOMS
// ==========================================

const ROOM_TYPES = [
    { value: 'classroom', label: 'Classroom' },
    { value: 'lab', label: 'Lab' },
    { value: 'hall', label: 'Hall' },
    { value: 'playground', label: 'Playground' },
    { value: 'library', label: 'Library' },
    { value: 'auditorium', label: 'Auditorium' },
    { value: 'other', label: 'Other' },
];

const RoomsTab = ({ schoolId, isMobile }: { schoolId: string; isMobile: boolean }) => {
    const [open, setOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<any>(null);
    const { data: rooms, isLoading } = useGetAllRooms(schoolId);
    const { data: classes } = useGetClasses(schoolId);
    const createRoom = useCreateRoom(schoolId);
    const updateRoom = useUpdateRoom(schoolId);
    const deleteRoom = useDeleteRoom(schoolId);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [roomToDelete, setRoomToDelete] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState<CreateRoomRequest & { classRef?: string }>({
        name: '',
        code: '',
        type: 'classroom',
        capacity: 40,
        floor: '',
        building: '',
        classRef: ''
    });

    const getClassLabel = (ref: string) => {
        const [classId, sectionId] = ref.split(':');
        const cls = (classes as any)?.data?.find((c: any) => c.classId === classId);
        if (!cls) return ref;
        if (sectionId) {
            const section = cls.sections?.find((s: any) => s.sectionId === sectionId || s._id === sectionId);
            return `${cls.name} - ${section?.name || sectionId}`;
        }
        return cls.name;
    };

    const handleEdit = (room: any) => {
        setEditingRoom(room);
        setFormData({
            name: room.name,
            code: room.code,
            type: room.type || 'classroom',
            capacity: room.capacity || 40,
            floor: room.floor || '',
            building: room.building || '',
            classRef: room.equipment?.find((e: string) => e.startsWith('CLASS_REF:'))?.replace('CLASS_REF:', '') || ''
        });
        setErrors({});
        setOpen(true);
    };

    const handleDelete = (roomId: string) => {
        setRoomToDelete(roomId);
        setDeleteConfirmOpen(true);
    };

    const confirmDeleteRoom = () => {
        if (roomToDelete) {
            deleteRoom.mutate(roomToDelete, {
                onSettled: () => {
                    setDeleteConfirmOpen(false);
                    setRoomToDelete(null);
                }
            });
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.name?.trim()) newErrors.name = 'Room name is required';
        if (!formData.code?.trim()) newErrors.code = 'Room code is required';
        if (!formData.capacity || formData.capacity < 1) newErrors.capacity = 'Capacity must be at least 1';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleFieldChange = (field: string, value: any) => {
        setFormData({ ...formData, [field]: value });
        if (errors[field]) setErrors({ ...errors, [field]: '' });
    };

    const handleSubmit = () => {
        if (!validate()) return;

        const equipment = formData.classRef
            ? [`CLASS_REF:${formData.classRef}`]
            : [];

        const payload: CreateRoomRequest = {
            name: formData.name,
            code: formData.code,
            type: formData.type,
            capacity: formData.capacity,
            floor: formData.floor,
            building: formData.building,
            equipment
        };

        if (editingRoom) {
            updateRoom.mutate({ roomId: editingRoom.roomId, data: payload }, {
                onSuccess: () => {
                    handleClose();
                }
            });
        } else {
            createRoom.mutate(payload, {
                onSuccess: () => {
                    handleClose();
                }
            });
        }
    };

    const handleClose = () => {
        setOpen(false);
        setEditingRoom(null);
        setFormData({ name: '', code: '', type: 'classroom', capacity: 40, floor: '', building: '', classRef: '' });
        setErrors({});
    };

    const getRoomClassRef = (room: any) => {
        const ref = room.equipment?.find((e: string) => e.startsWith('CLASS_REF:'));
        return ref ? ref.replace('CLASS_REF:', '') : null;
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                    <Typography variant="h6" fontWeight={700} color="#0f172a">Exam Rooms</Typography>
                </Box>
                <Button variant="contained" startIcon={<AddCircleIcon />} onClick={() => setOpen(true)} size="small" sx={{ textTransform: 'none', fontWeight: 600 }}>
                    Add Room
                </Button>
            </Box>

            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <Typography color="text.secondary">Loading rooms...</Typography>
                </Box>
            ) : !rooms?.data || rooms.data.length === 0 ? (
                <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
                    <MeetingRoomIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                    <Typography color="text.secondary">No rooms created yet</Typography>
                </Paper>
            ) : isMobile ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {rooms.data.map((room: any) => {
                        const classRef = getRoomClassRef(room);
                        return (
                            <Paper key={room._id} variant="outlined" sx={{ p: 1.5, borderRadius: 2, borderColor: '#e2e8f0' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                        <MeetingRoomIcon fontSize="small" color="primary" />
                                        <Typography variant="body1" fontWeight={700} color="#0f172a">{room.name}</Typography>
                                    </Box>
                                    <Chip label={room.code} size="small" variant="outlined" sx={{ fontWeight: 600, height: 22 }} />
                                </Box>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, my: 0.5 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                                        Type: <strong>{room.type}</strong>
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Capacity: <strong>{room.capacity} seats</strong>
                                    </Typography>
                                    {classRef && (
                                        <Typography variant="caption" color="primary">
                                            Ref: <strong>{getClassLabel(classRef)}</strong>
                                        </Typography>
                                    )}
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 0.5, borderTop: '1px solid #f1f5f9' }}>
                                    <Chip
                                        label={room.status}
                                        size="small"
                                        color={room.status === 'active' ? 'success' : room.status === 'maintenance' ? 'warning' : 'default'}
                                        sx={{ height: 20, fontSize: '0.7rem' }}
                                    />
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        <IconButton size="small" color="primary" onClick={() => handleEdit(room)} sx={{ p: 0.5 }}>
                                            <EditIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => handleDelete(room.roomId)} sx={{ p: 0.5 }}>
                                            <DeleteIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                    </Box>
                                </Box>
                            </Paper>
                        );
                    })}
                </Box>
            ) : (
                <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.100' }}>
                                <TableCell><strong>Room Name</strong></TableCell>
                                <TableCell><strong>Code</strong></TableCell>
                                <TableCell><strong>Type</strong></TableCell>
                                <TableCell><strong>Capacity</strong></TableCell>
                                <TableCell><strong>Class Reference</strong></TableCell>
                                <TableCell><strong>Floor / Building</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                                <TableCell><strong>Actions</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rooms.data.map((room: any) => {
                                const classRef = getRoomClassRef(room);
                                return (
                                    <TableRow key={room._id}>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <MeetingRoomIcon fontSize="small" color="primary" />
                                                <Typography fontWeight={500}>{room.name}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={room.code} size="small" variant="outlined" />
                                        </TableCell>
                                        <TableCell sx={{ textTransform: 'capitalize' }}>{room.type}</TableCell>
                                        <TableCell>{room.capacity} seats</TableCell>
                                        <TableCell>
                                            {classRef ? (
                                                <Chip
                                                    label={getClassLabel(classRef)}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">—</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {[room.floor, room.building].filter(Boolean).join(', ') || '—'}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={room.status}
                                                size="small"
                                                color={room.status === 'active' ? 'success' : room.status === 'maintenance' ? 'warning' : 'default'}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <IconButton size="small" color="primary" onClick={() => handleEdit(room)}>
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton size="small" color="error" onClick={() => handleDelete(room.roomId)}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Add / Edit Room Dialog */}
            <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" fullScreen={isMobile}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight={600}>{editingRoom ? 'Edit Room' : 'Add New Room'}</Typography>
                    {isMobile && (
                        <IconButton onClick={handleClose} size="small">
                            <CloseIcon />
                        </IconButton>
                    )}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Room Name"
                                    fullWidth
                                    size="small"
                                    placeholder="e.g., Room 101"
                                    value={formData.name}
                                    onChange={(e) => handleFieldChange('name', e.target.value)}
                                    error={!!errors.name}
                                    helperText={errors.name}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Room Code"
                                    fullWidth
                                    size="small"
                                    placeholder="e.g., R101"
                                    value={formData.code}
                                    onChange={(e) => handleFieldChange('code', e.target.value)}
                                    error={!!errors.code}
                                    helperText={errors.code}
                                />
                            </Grid>
                        </Grid>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Room Type</InputLabel>
                                    <Select
                                        value={formData.type}
                                        label="Room Type"
                                        onChange={(e) => handleFieldChange('type', e.target.value)}
                                    >
                                        {ROOM_TYPES.map(rt => (
                                            <MenuItem key={rt.value} value={rt.value}>{rt.label}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Capacity (seats)"
                                    type="number"
                                    fullWidth
                                    size="small"
                                    value={formData.capacity}
                                    onChange={(e) => handleFieldChange('capacity', parseInt(e.target.value) || 0)}
                                    error={!!errors.capacity}
                                    helperText={errors.capacity}
                                />
                            </Grid>
                        </Grid>

                        <FormControl fullWidth size="small">
                            <InputLabel>Class Reference (Optional)</InputLabel>
                            <Select
                                value={formData.classRef || ''}
                                label="Class Reference (Optional)"
                                onChange={(e) => handleFieldChange('classRef', e.target.value)}
                            >
                                <MenuItem value="">None</MenuItem>
                                {(classes as any)?.data?.flatMap((c: any) =>
                                    c.sections?.length > 0
                                        ? c.sections.map((s: any) => (
                                            <MenuItem key={`${c.classId}:${s.sectionId || s._id}`} value={`${c.classId}:${s.sectionId || s._id}`}>
                                                {c.name} - {s.name}
                                            </MenuItem>
                                        ))
                                        : [<MenuItem key={c.classId} value={c.classId}>{c.name}</MenuItem>]
                                )}
                            </Select>
                        </FormControl>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Floor (Optional)"
                                    fullWidth
                                    size="small"
                                    placeholder="e.g., Ground Floor"
                                    value={formData.floor}
                                    onChange={(e) => handleFieldChange('floor', e.target.value)}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Building (Optional)"
                                    fullWidth
                                    size="small"
                                    placeholder="e.g., Main Block"
                                    value={formData.building}
                                    onChange={(e) => handleFieldChange('building', e.target.value)}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button variant="contained" onClick={handleSubmit} disabled={createRoom.isPending || updateRoom.isPending}>
                        {(createRoom.isPending || updateRoom.isPending) ? 'Saving...' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>

            <ConfirmationDialog
                open={deleteConfirmOpen}
                onClose={() => {
                    setDeleteConfirmOpen(false);
                    setRoomToDelete(null);
                }}
                onConfirm={confirmDeleteRoom}
                title="Delete Room"
                description="Are you sure you want to delete this room? This action cannot be undone."
                confirmLabel="Delete Room"
                variant="danger"
                isLoading={deleteRoom.isPending}
            />
        </Box>
    );
};

export default ExamConfiguration;
