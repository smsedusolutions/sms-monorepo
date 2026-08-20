import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Grid, Chip, Alert, Skeleton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Dialog, DialogTitle, DialogContent, DialogActions,
    IconButton, CircularProgress, InputAdornment, Avatar, Snackbar,
    Autocomplete, TextField,
} from '@mui/material';
import {
    Add as AddIcon,
    Search as SearchIcon,
    Gavel as GavelIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useApi from '../../../queries/useApi';
import TokenService from '../../../queries/token/tokenService';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { MobileCardItem, MobileCardList } from '../../../components/mobile';
import { useGetClasses } from '../../../queries/Class';
import { useGetStudents } from '../../../queries/Student';
import { AppInput } from '../../../components/shared/AppInput';
import { AppSelect } from '../../../components/shared/AppSelect';
import { AppDatePicker } from '../../../components/shared/AppDatePicker';
import { AppButton } from '../../../components/shared/AppButton';
import { format } from 'date-fns';

const SEVERITIES = [
    { value: 'low', label: 'Low', color: 'warning' as const },
    { value: 'medium', label: 'Medium', color: 'warning' as const },
    { value: 'high', label: 'High', color: 'error' as const },
    { value: 'critical', label: 'Critical', color: 'error' as const },
];

const CATEGORIES = ['Behavioral', 'Academic Dishonesty', 'Attendance', 'Bullying', 'Property Damage', 'Tardiness', 'Dress Code', 'Other'];
const ACTIONS = ['Verbal Warning', 'Written Warning', 'Parent Notification', 'Detention', 'Suspension', 'Other'];

export const DisciplineRecord: React.FC = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const isMobile = useIsMobile();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [filterClass, setFilterClass] = useState('');
    const [logOpen, setLogOpen] = useState(false);
    const [toast, setToast] = useState('');

    // Student Search with Debounce
    const [studentSearchInput, setStudentSearchInput] = useState('');
    const [debouncedStudentSearch, setDebouncedStudentSearch] = useState('');
    const [selectedStudents, setSelectedStudents] = useState<any[]>([]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedStudentSearch(studentSearchInput);
        }, 300);
        return () => clearTimeout(handler);
    }, [studentSearchInput]);

    const { data: studentsData, isLoading: isSearchingStudents } = useGetStudents(schoolId, {
        search: debouncedStudentSearch || undefined,
        limit: 50,
    });
    const studentOptions: any[] = studentsData?.data || [];

    const [form, setForm] = useState({
        studentId: '',
        studentName: '',
        classId: '',
        className: '',
        incidentDate: new Date(),
        category: 'Behavioral',
        description: '',
        severity: 'low',
        actionTaken: '',
        actionDescription: '',
        parentNotified: false,
    });

    const { data: classesData } = useGetClasses(schoolId);
    const classes: any[] = classesData?.data || [];

    const { data, isLoading, error } = useQuery({
        queryKey: ['discipline', schoolId, filterClass, search],
        queryFn: () => useApi<any>('GET', `/api/school/${schoolId}/discipline`, undefined, {
            classId: filterClass || undefined,
            search: search || undefined,
        }),
        enabled: !!schoolId,
    });

    const logIncident = useMutation({
        mutationFn: (body: any) => useApi<any>('POST', `/api/school/${schoolId}/discipline`, {
            ...body,
            incidentDate: format(body.incidentDate, 'yyyy-MM-dd'),
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['discipline', schoolId] });
            setLogOpen(false);
            setToast('Discipline incident logged successfully');
            setSelectedStudents([]);
            setStudentSearchInput('');
            setForm({
                studentId: '',
                studentName: '',
                classId: '',
                className: '',
                incidentDate: new Date(),
                category: 'Behavioral',
                description: '',
                severity: 'low',
                actionTaken: '',
                actionDescription: '',
                parentNotified: false,
            });
        },
    });

    const handleOpenDialog = () => {
        setSelectedStudents([]);
        setStudentSearchInput('');
        setForm({
            studentId: '',
            studentName: '',
            classId: '',
            className: '',
            incidentDate: new Date(),
            category: 'Behavioral',
            description: '',
            severity: 'low',
            actionTaken: '',
            actionDescription: '',
            parentNotified: false,
        });
        setLogOpen(true);
    };

    const handleStudentChange = (_: any, newSelected: any[]) => {
        setSelectedStudents(newSelected);
        if (newSelected.length === 1) {
            const st = newSelected[0];
            const fullName = `${st.firstName || ''} ${st.lastName || ''}`.trim() || st.name || '';
            const cId = st.class || st.classId || '';
            const matchedClass = classes.find(c => (c.classId || c._id) === cId);
            const cName = st.className || matchedClass?.name || '';
            setForm(f => ({
                ...f,
                studentId: st.studentId || st._id || '',
                studentName: fullName,
                classId: cId,
                className: cName,
            }));
        } else if (newSelected.length === 0) {
            setForm(f => ({
                ...f,
                studentId: '',
                studentName: '',
                classId: '',
                className: '',
            }));
        }
    };

    const handleSubmit = () => {
        if (selectedStudents.length > 1) {
            const batch = selectedStudents.map(st => {
                const fullName = `${st.firstName || ''} ${st.lastName || ''}`.trim() || st.name || '';
                const cId = st.class || st.classId || '';
                const matchedClass = classes.find(c => (c.classId || c._id) === cId);
                const cName = st.className || matchedClass?.name || '';
                return {
                    studentId: st.studentId || st._id || null,
                    studentName: fullName,
                    classId: cId || null,
                    className: cName || null,
                };
            });
            logIncident.mutate({
                ...form,
                students: batch,
            });
        } else if (selectedStudents.length === 1) {
            const st = selectedStudents[0];
            const fullName = `${st.firstName || ''} ${st.lastName || ''}`.trim() || st.name || '';
            const cId = st.class || st.classId || '';
            const matchedClass = classes.find(c => (c.classId || c._id) === cId);
            const cName = st.className || matchedClass?.name || '';
            logIncident.mutate({
                ...form,
                studentId: st.studentId || st._id || null,
                studentName: fullName,
                classId: cId || null,
                className: cName || null,
            });
        } else {
            logIncident.mutate(form);
        }
    };

    const incidents: any[] = data?.data || [];
    const severityConfig = (s: string) => SEVERITIES.find(x => x.value === s) || SEVERITIES[0];

    return (
        <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 1300, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <GavelIcon sx={{ color: 'error.main', fontSize: 32 }} />
                    <Box>
                        <Typography variant="h5" fontWeight={800} sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>Discipline Records</Typography>
                        <Typography variant="body2" color="text.secondary">Track and manage student conduct incidents</Typography>
                    </Box>
                </Box>
                <AppButton variant="contained" color="error" startIcon={<AddIcon />} onClick={handleOpenDialog}>
                    Log Incident
                </AppButton>
            </Box>

            {/* Stats */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: 'Total Incidents', value: incidents.length, color: 'error.main' },
                    { label: 'This Month', value: incidents.filter(i => new Date(i.incidentDate).getMonth() === new Date().getMonth()).length, color: 'warning.main' },
                    { label: 'High/Critical', value: incidents.filter(i => ['high', 'critical'].includes(i.severity)).length, color: '#d32f2f' },
                    { label: 'Parent Notified', value: incidents.filter(i => i.parentNotified).length, color: 'info.main' },
                ].map(stat => (
                    <Grid size={{ xs: 6, sm: 3 }} key={stat.label}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                            <Typography fontWeight={800} sx={{ fontSize: '1.5rem', color: stat.color }}>{stat.value}</Typography>
                            <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Filters */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
                <Box sx={{ flex: 1, minWidth: 200, maxWidth: { sm: 350 } }}>
                    <AppInput
                        size="small"
                        placeholder="Search by student name..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment> }}
                        sx={{ mb: 0 }}
                    />
                </Box>
                <Box sx={{ minWidth: 180 }}>
                    <AppSelect
                        size="small"
                        value={filterClass}
                        onChange={e => setFilterClass(e.target.value as string)}
                        options={[{ value: '', label: 'All Classes' }, ...classes.map((c: any) => ({ value: c.classId || c._id, label: c.name }))]}
                        containerSx={{ mb: 0 }}
                    />
                </Box>
            </Box>

            {error ? (
                <Alert severity="error">Failed to load discipline records.</Alert>
            ) : isLoading ? (
                <Skeleton variant="rectangular" height={350} sx={{ borderRadius: 3 }} />
            ) : incidents.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <GavelIcon sx={{ fontSize: 64, color: 'success.main', mb: 2, opacity: 0.4 }} />
                    <Typography fontWeight={700} color="success.main">No incidents on record!</Typography>
                    <Typography variant="body2" color="text.secondary">All students are maintaining good conduct.</Typography>
                </Box>
            ) : isMobile ? (
                <MobileCardList isLoading={false} totalCount={incidents.length} itemCount={incidents.length} emptyTitle="" emptyMessage="">
                    {incidents.map((i: any) => {
                        const sc = severityConfig(i.severity);
                        return (
                            <MobileCardItem
                                key={i._id}
                                title={i.studentName}
                                subtitle={`${i.className || '—'} • ${new Date(i.incidentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                                badge={<Chip label={sc.label} color={sc.color} size="small" />}
                                metaItems={[
                                    { label: 'Category', value: i.category },
                                    { label: 'Action', value: i.actionTaken || '—' },
                                    { label: 'Parent Notified', value: i.parentNotified ? 'Yes' : 'No' },
                                    { label: 'Severity', value: sc.label },
                                ]}
                            />
                        );
                    })}
                </MobileCardList>
            ) : (
                <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'grey.50' }}>
                                    <TableCell sx={{ fontWeight: 700 }}>Student & Class</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Incident Date</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 700 }}>Severity</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Action Taken</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 700 }}>Parent Notified</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {incidents.map((i: any) => {
                                    const sc = severityConfig(i.severity);
                                    return (
                                        <TableRow key={i._id} hover>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Avatar sx={{ width: 30, height: 30, fontSize: '0.8rem', bgcolor: 'error.light' }}>{i.studentName?.charAt(0)}</Avatar>
                                                    <Box>
                                                        <Typography fontWeight={600} variant="body2">{i.studentName}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{i.className}</Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell><Typography variant="body2">{new Date(i.incidentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Typography></TableCell>
                                            <TableCell><Typography variant="body2">{i.category}</Typography></TableCell>
                                            <TableCell><Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>{i.description}</Typography></TableCell>
                                            <TableCell align="center"><Chip label={sc.label} color={sc.color} size="small" /></TableCell>
                                            <TableCell><Typography variant="body2">{i.actionTaken || '—'}</Typography></TableCell>
                                            <TableCell align="center">
                                                <Chip label={i.parentNotified ? 'Yes' : 'No'} color={i.parentNotified ? 'success' : 'default'} size="small" />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {/* Log Incident Dialog with Debounced Searchable Student Autocomplete */}
            <Dialog open={logOpen} onClose={() => setLogOpen(false)} fullWidth maxWidth="sm" fullScreen={isMobile} PaperProps={{ sx: { borderRadius: 2 } }}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                    <Typography fontWeight={700} variant="h6">Log Discipline Incident</Typography>
                    <IconButton onClick={() => setLogOpen(false)} size="small"><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    {/* Debounced Student Search Autocomplete */}
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" component="label" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5, display: 'block' }}>
                            Select Involved Student(s) *
                        </Typography>
                        <Autocomplete
                            multiple
                            options={studentOptions}
                            getOptionLabel={(option: any) => {
                                const fullName = `${option.firstName || ''} ${option.lastName || ''}`.trim() || option.name || '';
                                const stId = option.studentId || option.rollNumber || '';
                                return stId ? `${fullName} (${stId})` : fullName;
                            }}
                            isOptionEqualToValue={(option: any, value: any) =>
                                Boolean((option.studentId && option.studentId === value.studentId) ||
                                (option._id && option._id === value._id))
                            }
                            value={selectedStudents}
                            onChange={handleStudentChange}
                            onInputChange={(_, newInputValue: string) => setStudentSearchInput(newInputValue)}
                            loading={isSearchingStudents}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    size="small"
                                    placeholder={selectedStudents.length === 0 ? "Search by student name, ID or roll no..." : "Add more students..."}
                                    InputProps={{
                                        ...params.InputProps,
                                        startAdornment: (
                                            <>
                                                <InputAdornment position="start">
                                                    <SearchIcon fontSize="small" color="action" />
                                                </InputAdornment>
                                                {params.InputProps.startAdornment}
                                            </>
                                        ),
                                        endAdornment: (
                                            <>
                                                {isSearchingStudents ? <CircularProgress color="inherit" size={16} /> : null}
                                                {params.InputProps.endAdornment}
                                            </>
                                        ),
                                    }}
                                />
                            )}
                            renderOption={(props, option: any) => {
                                const fullName = `${option.firstName || ''} ${option.lastName || ''}`.trim() || option.name || '';
                                const cId = option.class || option.classId;
                                const matchedClass = classes.find(c => (c.classId || c._id) === cId);
                                const className = option.className || matchedClass?.name || 'Class';
                                const secName = option.sectionName || option.section || '';
                                const classSec = secName ? `${className} - Sec ${secName}` : className;

                                return (
                                    <li {...props} key={option.studentId || option._id}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5, width: '100%' }}>
                                            <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: 'primary.light' }}>
                                                {fullName.charAt(0)}
                                            </Avatar>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="body2" fontWeight={600}>{fullName}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    ID: {option.studentId || '—'} • {classSec} {option.rollNumber ? `• Roll: ${option.rollNumber}` : ''}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </li>
                                );
                            }}
                        />
                    </Box>

                    {/* Auto-Populated Student Details Preview Card */}
                    {selectedStudents.length > 0 && (
                        <Paper elevation={0} sx={{ p: 1.5, mb: 2, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                            <Typography variant="caption" fontWeight={700} color="primary.main" sx={{ display: 'block', mb: 0.5 }}>
                                ✓ Auto-Filled Details ({selectedStudents.length} {selectedStudents.length > 1 ? 'Students' : 'Student'} Selected):
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {selectedStudents.map(st => {
                                    const fullName = `${st.firstName || ''} ${st.lastName || ''}`.trim() || st.name || '';
                                    const cId = st.class || st.classId;
                                    const matchedClass = classes.find(c => (c.classId || c._id) === cId);
                                    const cName = st.className || matchedClass?.name || '';
                                    const secName = st.sectionName || st.section || '';
                                    const classSec = secName ? `${cName} (Sec ${secName})` : cName;

                                    return (
                                        <Chip
                                            key={st.studentId || st._id}
                                            avatar={<Avatar sx={{ bgcolor: 'error.main', color: '#fff' }}>{fullName.charAt(0)}</Avatar>}
                                            label={`${fullName} • ${st.studentId || ''} • ${classSec}`}
                                            size="small"
                                            variant="outlined"
                                            color="error"
                                            sx={{ fontWeight: 600, py: 1.5 }}
                                        />
                                    );
                                })}
                            </Box>
                        </Paper>
                    )}

                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <AppDatePicker
                                label="Incident Date"
                                required
                                value={form.incidentDate}
                                onChange={val => val && setForm(f => ({ ...f, incidentDate: val }))}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <AppSelect
                                label="Category"
                                value={form.category}
                                onChange={e => setForm(f => ({ ...f, category: e.target.value as string }))}
                                options={CATEGORIES.map(c => ({ value: c, label: c }))}
                            />
                        </Grid>
                    </Grid>

                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <AppSelect
                                label="Severity"
                                value={form.severity}
                                onChange={e => setForm(f => ({ ...f, severity: e.target.value as string }))}
                                options={SEVERITIES.map(s => ({ value: s.value, label: s.label }))}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <AppSelect
                                label="Action Taken"
                                value={form.actionTaken}
                                onChange={e => setForm(f => ({ ...f, actionTaken: e.target.value as string }))}
                                options={[{ value: '', label: 'None Yet' }, ...ACTIONS.map(a => ({ value: a, label: a }))]}
                            />
                        </Grid>
                    </Grid>

                    <AppInput
                        label="Incident Description"
                        required
                        multiline
                        rows={3}
                        value={form.description}
                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Describe what happened..."
                    />

                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <AppSelect
                                label="Parent Notified?"
                                value={form.parentNotified ? 'yes' : 'no'}
                                onChange={e => setForm(f => ({ ...f, parentNotified: e.target.value === 'yes' }))}
                                options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            {form.actionTaken && (
                                <AppInput
                                    label="Action Details"
                                    value={form.actionDescription}
                                    onChange={e => setForm(f => ({ ...f, actionDescription: e.target.value }))}
                                    placeholder="e.g. Detention after school / warning slip issued"
                                    sx={{ mb: 0 }}
                                />
                            )}
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, gap: 1 }}>
                    <AppButton onClick={() => setLogOpen(false)} variant="outlined" color="inherit">
                        Cancel
                    </AppButton>
                    <AppButton
                        variant="contained"
                        color="error"
                        onClick={handleSubmit}
                        disabled={logIncident.isPending || selectedStudents.length === 0 || !form.category || !form.description}
                        startIcon={logIncident.isPending ? <CircularProgress size={14} color="inherit" /> : <GavelIcon />}
                    >
                        {logIncident.isPending
                            ? 'Logging...'
                            : selectedStudents.length > 1
                            ? `Log Incident (${selectedStudents.length} Students)`
                            : 'Log Incident'}
                    </AppButton>
                </DialogActions>
            </Dialog>

            <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast('')} message={toast} />
        </Box>
    );
};

export default DisciplineRecord;
