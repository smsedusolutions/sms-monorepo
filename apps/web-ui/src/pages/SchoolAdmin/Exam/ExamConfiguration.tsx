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
import { AppInput } from '../../../components/shared/AppInput';
import { AppSelect } from '../../../components/shared/AppSelect';
import { AppButton } from '../../../components/shared/AppButton';
import { AppDatePicker } from '../../../components/shared/AppDatePicker';
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
import { useCreateRoom, useDeleteRoom, useGetAllRooms, useUpdateRoom } from '../../../queries/Timetable';
import { useGetClasses } from '../../../queries/Class';
import type { CreateExamTermRequest, CreateExamTypeRequest, GradeRange } from '../../../types/exam.types';
import type { CreateRoomRequest } from '../../../types/timetable.types';

import CloseIcon from '@mui/icons-material/Close';
import { useUrlTab } from '../../../hooks/useUrlTab';
import { useIsMobile } from '../../../hooks/useIsMobile';

// ==========================================
// EXAM CONFIGURATION PAGE
// ==========================================

const ExamConfiguration = () => {
    const isMobile = useIsMobile();
    const [activeTab, setActiveTab] = useUrlTab(0, ['terms', 'types', 'grading', 'rooms']);
    const { user } = useAuth();
    const schoolId = user?.schoolId || '';

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    return (
        <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
            {!isMobile && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                    <Typography variant="h5" fontWeight={700} color="#0f172a">Exam Configuration</Typography>
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
                    <Tab label="Exam Terms" sx={{ textTransform: 'none', fontWeight: 600, minHeight: 40, py: 1 }} />
                    <Tab label="Exam Types" sx={{ textTransform: 'none', fontWeight: 600, minHeight: 40, py: 1 }} />
                    <Tab label="Grading Systems" sx={{ textTransform: 'none', fontWeight: 600, minHeight: 40, py: 1 }} />
                    <Tab label="Rooms" sx={{ textTransform: 'none', fontWeight: 600, minHeight: 40, py: 1 }} />
                </Tabs>
            </Box>

            <Box role="tabpanel" hidden={activeTab !== 0}>
                {activeTab === 0 && <ExamTermsTab schoolId={schoolId} isMobile={isMobile} />}
            </Box>
            <Box role="tabpanel" hidden={activeTab !== 1}>
                {activeTab === 1 && <ExamTypesTab schoolId={schoolId} isMobile={isMobile} />}
            </Box>
            <Box role="tabpanel" hidden={activeTab !== 2}>
                {activeTab === 2 && <GradingSystemsTab schoolId={schoolId} isMobile={isMobile} />}
            </Box>
            <Box role="tabpanel" hidden={activeTab !== 3}>
                {activeTab === 3 && <RoomsTab schoolId={schoolId} isMobile={isMobile} />}
            </Box>
        </Box>
    );
};

// ==========================================
// TAB 1: EXAM TERMS
// ==========================================

const ExamTermsTab = ({ schoolId, isMobile }: { schoolId: string; isMobile: boolean }) => {
    const [open, setOpen] = useState(false);
    const [editingTerm, setEditingTerm] = useState<any>(null);
    const { data: terms, isLoading } = useGetExamTerms(schoolId);
    const createTerm = useCreateExamTerm(schoolId);
    const updateTerm = useUpdateExamTerm(schoolId);
    const deleteTerm = useDeleteExamTerm(schoolId);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState<CreateExamTermRequest>({
        name: '',
        academicYear: '2025-2026',
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
        if (window.confirm('Are you sure you want to delete this term?')) {
            deleteTerm.mutate(termId);
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
                    setFormData({ name: '', academicYear: '2025-2026', startDate: '', endDate: '' });
                }
            });
        } else {
            createTerm.mutate(formData, {
                onSuccess: () => {
                    setOpen(false);
                    setFormData({ name: '', academicYear: '2025-2026', startDate: '', endDate: '' });
                }
            });
        }
    };

    const handleClose = () => {
        setOpen(false);
        setEditingTerm(null);
        setFormData({ name: '', academicYear: '2025-2026', startDate: '', endDate: '' });
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
                        <AppInput
                            label="Academic Year"
                            fullWidth
                            value={formData.academicYear}
                            onChange={(e) => handleFieldChange('academicYear', e.target.value)}
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

    const [formData, setFormData] = useState<CreateExamTypeRequest>({
        name: '',
        weightage: 100,
        description: '',
        termId: ''
    });

    const handleDelete = (typeId: string) => {
        if (window.confirm('Are you sure you want to delete this exam type?')) {
            deleteType.mutate(typeId);
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
        if (window.confirm('Are you sure you want to delete this grading system?')) {
            deleteSystem.mutate(systemId);
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
        if (window.confirm('Are you sure you want to delete this room?')) {
            deleteRoom.mutate(roomId);
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
        </Box>
    );
};

export default ExamConfiguration;
