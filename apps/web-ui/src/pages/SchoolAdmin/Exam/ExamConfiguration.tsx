import React, { useState } from 'react';
import {
    Box,
    Card,
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
    Tooltip,
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

import { useUrlTab } from '../../../hooks/useUrlTab';

// ==========================================
// EXAM CONFIGURATION PAGE
// ==========================================

const ExamConfiguration = () => {
    const [activeTab, setActiveTab] = useUrlTab(0, ['terms', 'types', 'grading', 'rooms']);
    const { user } = useAuth();
    const schoolId = user?.schoolId || '';

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight={600}>Exam Configuration</Typography>
            </Box>

            <Card sx={{ mb: 3 }}>
                <Tabs value={activeTab} onChange={handleTabChange} aria-label="exam configuration tabs" variant="scrollable" scrollButtons="auto">
                    <Tab label="Exam Terms" />
                    <Tab label="Exam Types" />
                    <Tab label="Grading Systems" />
                    <Tab label="Rooms" />
                </Tabs>
            </Card>

            <Box role="tabpanel" hidden={activeTab !== 0}>
                {activeTab === 0 && <ExamTermsTab schoolId={schoolId} />}
            </Box>
            <Box role="tabpanel" hidden={activeTab !== 1}>
                {activeTab === 1 && <ExamTypesTab schoolId={schoolId} />}
            </Box>
            <Box role="tabpanel" hidden={activeTab !== 2}>
                {activeTab === 2 && <GradingSystemsTab schoolId={schoolId} />}
            </Box>
            <Box role="tabpanel" hidden={activeTab !== 3}>
                {activeTab === 3 && <RoomsTab schoolId={schoolId} />}
            </Box>
        </Box>
    );
};

// ==========================================
// TAB 1: EXAM TERMS
// ==========================================

const ExamTermsTab = ({ schoolId }: { schoolId: string }) => {
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
        <Card sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight={600}>Academic Terms</Typography>
                <AppButton variant="contained" startIcon={<AddCircleIcon />} onClick={() => setOpen(true)}>
                    Add Term
                </AppButton>
            </Box>

            <TableContainer component={Paper} elevation={0} variant="outlined">
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Academic Year</TableCell>
                            <TableCell>Start Date</TableCell>
                            <TableCell>End Date</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={6} align="center">Loading...</TableCell></TableRow>
                        ) : terms?.data?.map((term: any) => (
                            <TableRow key={term._id}>
                                <TableCell>{term.name}</TableCell>
                                <TableCell>{term.academicYear}</TableCell>
                                <TableCell>{new Date(term.startDate).toLocaleDateString()}</TableCell>
                                <TableCell>{new Date(term.endDate).toLocaleDateString()}</TableCell>
                                <TableCell>{term.isActive ? 'Active' : 'Inactive'}</TableCell>
                                <TableCell>
                                    <IconButton size="small" color="primary" onClick={() => handleEdit(term)}><EditIcon /></IconButton>
                                    <IconButton size="small" color="error" onClick={() => handleDelete(term._id)}><DeleteIcon /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {terms?.data?.length === 0 && (
                            <TableRow><TableCell colSpan={6} align="center">No terms found</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={handleClose} fullWidth>
                <DialogTitle>{editingTerm ? 'Edit Term' : 'Add New Term'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
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
                        <Box sx={{ display: 'flex', gap: 2 }}>
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
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button variant="contained" onClick={handleSubmit} disabled={createTerm.isPending || updateTerm.isPending}>
                        {(createTerm.isPending || updateTerm.isPending) ? 'Saving...' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Card>
    );
};

// ==========================================
// TAB 2: EXAM TYPES
// ==========================================

const ExamTypesTab = ({ schoolId }: { schoolId: string }) => {
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
        <Card sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight={600}>Exam Types</Typography>
                <AppButton variant="contained" startIcon={<AddCircleIcon />} onClick={() => setOpen(true)}>
                    Add Exam Type
                </AppButton>
            </Box>

            <TableContainer component={Paper} elevation={0} variant="outlined">
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Related Term</TableCell>
                            <TableCell>Weightage</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={5} align="center">Loading...</TableCell></TableRow>
                        ) : types?.data?.map((type: any) => (
                            <TableRow key={type._id}>
                                <TableCell>{type.name}</TableCell>
                                <TableCell>{type.termId?.name || 'N/A'}</TableCell>
                                <TableCell>{type.weightage}%</TableCell>
                                <TableCell>{type.description}</TableCell>
                                <TableCell>
                                    <IconButton size="small" color="error" onClick={() => handleDelete(type._id)}><DeleteIcon /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
                <DialogTitle>Add Exam Type</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
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
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSubmit} disabled={createType.isPending}>
                        {createType.isPending ? 'Saving...' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Card>
    );
};

// ==========================================
// TAB 3: GRADING SYSTEMS
// ==========================================

const GradingSystemsTab = ({ schoolId }: { schoolId: string }) => {
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
        <Card sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight={600}>Grading Systems</Typography>
                <Button variant="contained" startIcon={<AddCircleIcon />} onClick={() => setOpen(true)}>
                    Add System
                </Button>
            </Box>

            <TableContainer component={Paper} elevation={0} variant="outlined">
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>System Name</TableCell>
                            <TableCell>Grades</TableCell>
                            <TableCell>Is Default</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={4} align="center">Loading...</TableCell></TableRow>
                        ) : systems?.data?.map((sys: any) => (
                            <TableRow key={sys._id}>
                                <TableCell>{sys.name}</TableCell>
                                <TableCell>
                                    {sys.grades.map((g: any) => g.name).join(', ')}
                                </TableCell>
                                <TableCell>{sys.isDefault ? 'Yes' : 'No'}</TableCell>
                                <TableCell>
                                    <IconButton size="small" color="error" onClick={() => handleDelete(sys._id)}><DeleteIcon /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Add Grading System</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField
                            label="System Name"
                            fullWidth
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />

                        <Typography variant="subtitle2" className="mt-4">Grade Ranges</Typography>
                        {grades.map((grade, index) => (
                            <div key={index} className="flex gap-2 items-center mb-2">
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
                                <IconButton color="error" onClick={() => removeGradeRow(index)}>
                                    <CancelIcon />
                                </IconButton>
                            </div>
                        ))}
                        <Button startIcon={<AddCircleIcon />} onClick={addGradeRow}>Add Grade</Button>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSubmit} disabled={createSystem.isPending}>
                        {createSystem.isPending ? 'Saving...' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Card>
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

const RoomsTab = ({ schoolId }: { schoolId: string }) => {
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

    // Helper to get class-section label
    const getClassLabel = (ref: string) => {
        // ref format: "classId:sectionId" or just "classId"
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

        // Store class reference in equipment array as a tag
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

    // Extract class reference from equipment array
    const getRoomClassRef = (room: any) => {
        const ref = room.equipment?.find((e: string) => e.startsWith('CLASS_REF:'));
        return ref ? ref.replace('CLASS_REF:', '') : null;
    };

    return (
        <Card sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h6" fontWeight={600}>Exam Rooms</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage rooms for exam scheduling. Assign each room to a class for reference.
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<AddCircleIcon />} onClick={() => setOpen(true)}>
                    Add Room
                </Button>
            </Box>

            <TableContainer component={Paper} elevation={0} variant="outlined">
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Room Name</TableCell>
                            <TableCell>Code</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Capacity</TableCell>
                            <TableCell>Class Reference</TableCell>
                            <TableCell>Floor / Building</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={8} align="center">Loading...</TableCell></TableRow>
                        ) : rooms?.data?.map((room: any) => {
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
                                        <Tooltip title="Edit">
                                            <IconButton size="small" color="primary" onClick={() => handleEdit(room)}>
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete">
                                            <IconButton size="small" color="error" onClick={() => handleDelete(room.roomId)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {!isLoading && (!rooms?.data || rooms.data.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={8} align="center">
                                    <Box sx={{ py: 4 }}>
                                        <MeetingRoomIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                        <Typography color="text.secondary">No rooms created yet</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Click "Add Room" to create your first room (e.g., Room 101 for Class 8-A)
                                        </Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add / Edit Room Dialog */}
            <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
                <DialogTitle>{editingRoom ? 'Edit Room' : 'Add New Room'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Room Name"
                                    fullWidth
                                    placeholder="e.g., Room 101"
                                    value={formData.name}
                                    onChange={(e) => handleFieldChange('name', e.target.value)}
                                    error={!!errors.name}
                                    helperText={errors.name || 'Example: Room 101, Science Lab 1'}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Room Code"
                                    fullWidth
                                    placeholder="e.g., R101"
                                    value={formData.code}
                                    onChange={(e) => handleFieldChange('code', e.target.value)}
                                    error={!!errors.code}
                                    helperText={errors.code || 'Unique code for this room'}
                                />
                            </Grid>
                        </Grid>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormControl fullWidth>
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
                                    value={formData.capacity}
                                    onChange={(e) => handleFieldChange('capacity', parseInt(e.target.value) || 0)}
                                    error={!!errors.capacity}
                                    helperText={errors.capacity}
                                />
                            </Grid>
                        </Grid>

                        <FormControl fullWidth>
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
                                    placeholder="e.g., Ground Floor, 1st Floor"
                                    value={formData.floor}
                                    onChange={(e) => handleFieldChange('floor', e.target.value)}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Building (Optional)"
                                    fullWidth
                                    placeholder="e.g., Main Block, East Wing"
                                    value={formData.building}
                                    onChange={(e) => handleFieldChange('building', e.target.value)}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button variant="contained" onClick={handleSubmit} disabled={createRoom.isPending || updateRoom.isPending}>
                        {(createRoom.isPending || updateRoom.isPending) ? 'Saving...' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Card>
    );
};

export default ExamConfiguration;
