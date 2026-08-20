import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, Paper, Grid, Chip, Alert, Skeleton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Dialog, DialogTitle, DialogContent, DialogActions,
    IconButton, CircularProgress, Snackbar,
    RadioGroup, FormControlLabel, Radio, Autocomplete, TextField,
    Switch,
} from '@mui/material';
import {
    Add as AddIcon,
    People as PTMIcon,
    Close as CloseIcon,
    CheckCircle as DoneIcon,
    School as SchoolIcon,
    Person as PersonIcon,
    Coffee as CoffeeIcon,
    AccessTime as TimeIcon,
    LocationOn as LocationIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useApi from '../../../queries/useApi';
import TokenService from '../../../queries/token/tokenService';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { MobileCardItem, MobileCardList } from '../../../components/mobile';
import { useGetClasses } from '../../../queries/Class';
import { useGetTeachers } from '../../../queries/Teacher';
import { AppInput } from '../../../components/shared/AppInput';
import { AppDatePicker } from '../../../components/shared/AppDatePicker';
import { AppButton } from '../../../components/shared/AppButton';
import { AppMultiSelect } from '../../../components/shared/AppMultiSelect';
import { format } from 'date-fns';

const statusColor: Record<string, 'success' | 'warning' | 'error' | 'default' | 'info'> = {
    scheduled: 'info',
    ongoing: 'warning',
    completed: 'success',
    cancelled: 'error',
};

interface TargetSectionItem {
    key: string;
    classId: string;
    className: string;
    sectionId: string | null;
    sectionName: string | null;
    label: string;
    classTeacher: any | null;
    defaultVenue: string;
}

export const PTMManagement: React.FC = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const isMobile = useIsMobile();
    const queryClient = useQueryClient();
    const [createOpen, setCreateOpen] = useState(false);
    const [toast, setToast] = useState('');

    const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
    const [assignmentMode, setAssignmentMode] = useState<'class_teacher' | 'single_teacher'>('class_teacher');
    const [overrideTeacherId, setOverrideTeacherId] = useState<string>('');
    const [hasBreakTime, setHasBreakTime] = useState(false);

    const [form, setForm] = useState({
        title: '',
        date: new Date(),
        startTime: '09:00',
        endTime: '13:00',
        breakStartTime: '11:00',
        breakEndTime: '11:30',
        slotDurationMinutes: 10,
        venue: '',
        notes: '',
    });

    const { data: classesData } = useGetClasses(schoolId);
    const { data: teachersData } = useGetTeachers(schoolId, { limit: 500 });
    const classes: any[] = classesData?.data || [];
    const teachers: any[] = teachersData?.data || [];

    const { data, isLoading, error } = useQuery({
        queryKey: ['ptm-sessions', schoolId],
        queryFn: () => useApi<any>('GET', `/api/academics/school/${schoolId}/ptm`),
        enabled: !!schoolId,
    });

    // Helper: Compute meeting minutes and break time
    const { totalMinutes, breakMinutes, effectiveMinutes, totalSlots } = useMemo(() => {
        if (!form.startTime || !form.endTime) {
            return { totalMinutes: 0, breakMinutes: 0, effectiveMinutes: 0, totalSlots: 0 };
        }
        const [sh, sm] = form.startTime.split(':').map(Number);
        const [eh, em] = form.endTime.split(':').map(Number);
        const startMins = (sh || 0) * 60 + (sm || 0);
        const endMins = (eh || 0) * 60 + (em || 0);
        const total = Math.max(0, endMins - startMins);

        let brk = 0;
        if (hasBreakTime && form.breakStartTime && form.breakEndTime) {
            const [bsh, bsm] = form.breakStartTime.split(':').map(Number);
            const [beh, bem] = form.breakEndTime.split(':').map(Number);
            const bStart = (bsh || 0) * 60 + (bsm || 0);
            const bEnd = (beh || 0) * 60 + (bem || 0);
            brk = Math.max(0, bEnd - bStart);
        }

        const effective = Math.max(0, total - brk);
        const slots = form.slotDurationMinutes > 0 ? Math.floor(effective / form.slotDurationMinutes) : 0;

        return {
            totalMinutes: total,
            breakMinutes: brk,
            effectiveMinutes: effective,
            totalSlots: slots,
        };
    }, [form.startTime, form.endTime, form.breakStartTime, form.breakEndTime, form.slotDurationMinutes, hasBreakTime]);

    // Helper: Find class teacher for a section or class
    const findTeacherForSection = (classId: string, section: any) => {
        if (section?.classTeacherName) {
            const secTeacherId = section?.classTeacherId || section?.classTeacher || section?.teacherId;
            const fullTeacher = teachers.find(
                (t: any) => t.teacherId === secTeacherId || t._id === secTeacherId || t.userId === secTeacherId
            );
            return {
                teacherId: fullTeacher?.teacherId || fullTeacher?._id || secTeacherId || null,
                teacherName: section.classTeacherName,
                firstName: fullTeacher?.firstName || section.classTeacherName.split(' ')[0] || section.classTeacherName,
                lastName: fullTeacher?.lastName || section.classTeacherName.split(' ').slice(1).join(' ') || '',
            };
        }

        const secTeacherId = section?.classTeacherId || section?.teacherId || section?.classTeacher;
        if (secTeacherId) {
            const match = teachers.find(
                (t: any) => t.teacherId === secTeacherId || t._id === secTeacherId || t.userId === secTeacherId
            );
            if (match) {
                return {
                    ...match,
                    teacherId: match.teacherId || match._id,
                    teacherName: `${match.firstName} ${match.lastName}`.trim(),
                };
            }
        }

        if (section?.sectionId) {
            const fullSecKey = `${classId}#${section.sectionId}`;
            const match = teachers.find(
                (t: any) => t.classTeacherSectionId === fullSecKey || (t.classTeacherSectionId && t.classTeacherSectionId.startsWith(classId))
            );
            if (match) {
                return {
                    ...match,
                    teacherId: match.teacherId || match._id,
                    teacherName: `${match.firstName} ${match.lastName}`.trim(),
                };
            }
        }

        const matchByClass = teachers.find((t: any) => t.classTeacherSectionId && t.classTeacherSectionId.startsWith(classId));
        if (matchByClass) {
            return {
                ...matchByClass,
                teacherId: matchByClass.teacherId || matchByClass._id,
                teacherName: `${matchByClass.firstName} ${matchByClass.lastName}`.trim(),
            };
        }

        return null;
    };

    // Flatten all classes and sections into granular selectable options with default classroom venue
    const sectionOptions = useMemo<TargetSectionItem[]>(() => {
        const options: TargetSectionItem[] = [];
        classes.forEach(c => {
            const classId = c.classId || c._id;
            const className = c.name;
            const sections = c.sections || [];

            if (sections.length > 0) {
                sections.forEach((sec: any) => {
                    const secId = sec.sectionId || sec._id || sec.name;
                    const secName = sec.name || 'A';
                    const ct = findTeacherForSection(classId, sec);
                    const defaultVenue = `${className} - Section ${secName} Classroom`;
                    options.push({
                        key: `${classId}::${secId}`,
                        classId,
                        className,
                        sectionId: secId,
                        sectionName: secName,
                        label: `${className} - Section ${secName}`,
                        classTeacher: ct,
                        defaultVenue,
                    });
                });
            } else {
                const ct = findTeacherForSection(classId, null);
                const defaultVenue = `${className} Classroom`;
                options.push({
                    key: `${classId}::all`,
                    classId,
                    className,
                    sectionId: null,
                    sectionName: null,
                    label: `${className}`,
                    classTeacher: ct,
                    defaultVenue,
                });
            }
        });
        return options;
    }, [classes, teachers]);

    // Auto-update teacher and venue assignment when selections change
    useEffect(() => {
        if (selectedKeys.length === 1) {
            const target = sectionOptions.find(opt => opt.key === selectedKeys[0]);
            if (target?.classTeacher) {
                setOverrideTeacherId(target.classTeacher.teacherId || target.classTeacher._id);
            }
            if (target?.defaultVenue && (!form.venue || form.venue.includes('Classroom'))) {
                setForm(f => ({ ...f, venue: target.defaultVenue }));
            }
        } else if (selectedKeys.length > 1) {
            // When multiple sections selected, if previous venue was a single classroom, reset to empty so respective classrooms are used
            if (form.venue.includes('Classroom')) {
                setForm(f => ({ ...f, venue: '' }));
            }
        }
    }, [selectedKeys, sectionOptions]);

    const createPTM = useMutation({
        mutationFn: (body: any) => useApi<any>('POST', `/api/academics/school/${schoolId}/ptm`, body),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['ptm-sessions', schoolId] });
            queryClient.invalidateQueries({ queryKey: ['school-calendar'] });
            setCreateOpen(false);
            setToast(res?.message || 'PTM session(s) created and synced to calendar!');
            setSelectedKeys([]);
            setOverrideTeacherId('');
            setForm({
                title: '',
                date: new Date(),
                startTime: '09:00',
                endTime: '13:00',
                breakStartTime: '11:00',
                breakEndTime: '11:30',
                slotDurationMinutes: 10,
                venue: '',
                notes: '',
            });
        },
    });

    const handleSubmit = () => {
        const formattedDate = format(form.date, 'yyyy-MM-dd');
        const payloadBase = {
            ...form,
            date: formattedDate,
            breakStartTime: hasBreakTime ? form.breakStartTime : null,
            breakEndTime: hasBreakTime ? form.breakEndTime : null,
        };

        // Case 1: Multiple sections/classes selected
        if (selectedKeys.length > 1) {
            const batch = selectedKeys.map(k => {
                const opt = sectionOptions.find(o => o.key === k);
                const singleTeacher = teachers.find(t => (t.teacherId || t._id) === overrideTeacherId);
                const assignedTeacher = assignmentMode === 'class_teacher' && opt?.classTeacher
                    ? opt.classTeacher
                    : singleTeacher || opt?.classTeacher;

                // Auto-assign classroom venue for each section unless a custom venue is explicitly entered
                const venueForSection = form.venue?.trim() ? form.venue : opt?.defaultVenue || 'Section Classroom';

                return {
                    classId: opt?.classId,
                    className: opt?.className,
                    sectionId: opt?.sectionId,
                    sectionName: opt?.sectionName,
                    teacherId: assignedTeacher ? (assignedTeacher.teacherId || assignedTeacher._id) : null,
                    teacherName: assignedTeacher ? `${assignedTeacher.firstName} ${assignedTeacher.lastName}` : null,
                    venue: venueForSection,
                };
            });

            createPTM.mutate({
                ...payloadBase,
                classes: batch,
            });
            return;
        }

        // Case 2: Single section/class selected
        if (selectedKeys.length === 1) {
            const opt = sectionOptions.find(o => o.key === selectedKeys[0]);
            const chosenTeacher = teachers.find(t => (t.teacherId || t._id) === overrideTeacherId) || opt?.classTeacher;
            const venueForSection = form.venue?.trim() ? form.venue : opt?.defaultVenue || 'Section Classroom';

            createPTM.mutate({
                ...payloadBase,
                classId: opt?.classId || null,
                className: opt?.className || null,
                sectionId: opt?.sectionId || null,
                sectionName: opt?.sectionName || null,
                teacherId: chosenTeacher ? (chosenTeacher.teacherId || chosenTeacher._id) : null,
                teacherName: chosenTeacher ? `${chosenTeacher.firstName} ${chosenTeacher.lastName}` : null,
                venue: venueForSection,
            });
            return;
        }

        // Case 3: All school / no specific class selected
        const chosenTeacher = teachers.find(t => (t.teacherId || t._id) === overrideTeacherId);
        createPTM.mutate({
            ...payloadBase,
            classId: null,
            className: null,
            sectionId: null,
            sectionName: null,
            teacherId: chosenTeacher ? (chosenTeacher.teacherId || chosenTeacher._id) : null,
            teacherName: chosenTeacher ? `${chosenTeacher.firstName} ${chosenTeacher.lastName}` : null,
            venue: form.venue?.trim() || 'School Campus',
        });
    };

    const sessions: any[] = data?.data || [];

    const teacherOptions = useMemo(() => {
        return teachers.map((t: any) => ({
            id: t.teacherId || t._id,
            label: `${t.firstName} ${t.lastName}`,
            department: t.department || '',
        }));
    }, [teachers]);

    return (
        <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <PTMIcon sx={{ color: 'primary.main', fontSize: 32 }} />
                    <Box>
                        <Typography variant="h5" fontWeight={800} sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
                            Parent-Teacher Meetings
                        </Typography>
                        <Typography variant="body2" color="text.secondary">Schedule and manage section-wise 1-on-1 parent meeting sessions</Typography>
                    </Box>
                </Box>
                <AppButton variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
                    Schedule PTM
                </AppButton>
            </Box>

            {/* Summary */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: 'Total Sessions', value: sessions.length, color: 'primary.main' },
                    { label: 'Upcoming', value: sessions.filter(s => s.status === 'scheduled').length, color: 'info.main' },
                    { label: 'Completed', value: sessions.filter(s => s.status === 'completed').length, color: 'success.main' },
                    { label: 'Total Bookings', value: sessions.reduce((a, s) => a + (s.bookingsCount || 0), 0), color: 'warning.main' },
                ].map(stat => (
                    <Grid size={{ xs: 6, sm: 3 }} key={stat.label}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                            <Typography fontWeight={800} sx={{ fontSize: '1.5rem', color: stat.color }}>{stat.value}</Typography>
                            <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {error ? (
                <Alert severity="error">Failed to load PTM sessions.</Alert>
            ) : isLoading ? (
                <Skeleton variant="rectangular" height={350} sx={{ borderRadius: 2 }} />
            ) : sessions.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <PTMIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.4 }} />
                    <Typography color="text.secondary">No PTM sessions scheduled yet.</Typography>
                    <AppButton variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)} sx={{ mt: 2 }}>Schedule First PTM</AppButton>
                </Box>
            ) : isMobile ? (
                <MobileCardList isLoading={false} totalCount={sessions.length} itemCount={sessions.length} emptyTitle="" emptyMessage="">
                    {sessions.map((s: any) => (
                        <MobileCardItem
                            key={s._id}
                            title={s.title}
                            subtitle={`${new Date(s.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • ${s.startTime} - ${s.endTime}`}
                            badge={<Chip label={s.status || 'Scheduled'} color={statusColor[s.status] || 'info'} size="small" />}
                            metaItems={[
                                { label: 'Teacher', value: s.teacherName || '—' },
                                { label: 'Venue', value: s.venue || 'Classroom' },
                                { label: 'Parent Slots', value: `${s.slotDurationMinutes || 10} min/parent` },
                                { label: 'Bookings', value: String(s.bookingsCount || 0) },
                            ]}
                        />
                    ))}
                </MobileCardList>
            ) : (
                <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'grey.50' }}>
                                    <TableCell sx={{ fontWeight: 700 }}>Title / Class & Section</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Date & Meeting Window</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Class Teacher</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Meeting Venue</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Duration / Parent</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 700 }}>Bookings</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sessions.map((s: any) => (
                                    <TableRow key={s._id} hover>
                                        <TableCell>
                                            <Typography fontWeight={600} variant="body2">{s.title}</Typography>
                                            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                                                {s.className && (
                                                    <Chip label={s.className} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                                                )}
                                                {s.sectionName && (
                                                    <Chip label={`Sec ${s.sectionName}`} size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }} />
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{new Date(s.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</Typography>
                                            <Typography variant="caption" color="text.secondary">{s.startTime} – {s.endTime}</Typography>
                                            {s.breakStartTime && s.breakEndTime && (
                                                <Typography variant="caption" sx={{ color: 'warning.dark', display: 'block', fontWeight: 600 }}>
                                                    ☕ Break: {s.breakStartTime} – {s.breakEndTime}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                <PersonIcon fontSize="small" color="action" />
                                                <Typography variant="body2" fontWeight={600}>{s.teacherName || '—'}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <LocationIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: 16 }} />
                                                <Typography variant="body2">{s.venue || '—'}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={`${s.slotDurationMinutes || 10} min`}
                                                size="small"
                                                variant="outlined"
                                                color="primary"
                                                sx={{ fontWeight: 600 }}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip label={s.bookingsCount || 0} size="small" color="primary" variant="outlined" />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip label={s.status || 'Scheduled'} color={statusColor[s.status] || 'info'} size="small" />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {/* Schedule PTM Dialog */}
            <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm" fullScreen={isMobile} PaperProps={{ sx: { borderRadius: 2 } }}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                    <Box>
                        <Typography fontWeight={700} variant="h6">Schedule Parent-Teacher Meeting</Typography>
                        <Typography variant="caption" color="text.secondary">Create 1-on-1 parent conversation slots for sections</Typography>
                    </Box>
                    <IconButton onClick={() => setCreateOpen(false)} size="small"><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <AppInput
                        label="Session Title"
                        required
                        value={form.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="e.g. Term 1 Parent-Teacher Meeting"
                    />

                    {/* Autocomplete Multi-Select for Target Classes & Sections */}
                    <AppMultiSelect
                        label="Target Class & Sections"
                        placeholder="Search class or section (e.g. Class 10, Sec A)..."
                        helperText="Each section automatically sets its Class Teacher and respective Classroom venue."
                        options={sectionOptions.map(opt => ({ id: opt.key, label: opt.label }))}
                        value={selectedKeys}
                        onChange={setSelectedKeys}
                    />

                    {/* Dynamic Section-Wise Class Teacher and Venue Assignment Preview */}
                    {selectedKeys.length > 1 && (
                        <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <SchoolIcon color="success" fontSize="small" />
                                <Typography variant="subtitle2" fontWeight={700} color="success.dark">
                                    Multi-Section Auto-Assignment ({selectedKeys.length} sections selected)
                                </Typography>
                            </Box>

                            <RadioGroup
                                row
                                value={assignmentMode}
                                onChange={e => setAssignmentMode(e.target.value as any)}
                                sx={{ mb: 1 }}
                            >
                                <FormControlLabel
                                    value="class_teacher"
                                    control={<Radio size="small" color="success" />}
                                    label={<Typography variant="body2" fontWeight={600}>Auto-assign each section's Class Teacher & Classroom</Typography>}
                                />
                                <FormControlLabel
                                    value="single_teacher"
                                    control={<Radio size="small" />}
                                    label={<Typography variant="body2">Assign single teacher to all</Typography>}
                                />
                            </RadioGroup>

                            {assignmentMode === 'class_teacher' ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mt: 1, maxHeight: 200, overflowY: 'auto' }}>
                                    {selectedKeys.map(k => {
                                        const opt = sectionOptions.find(o => o.key === k);
                                        const ct = opt?.classTeacher;
                                        const secVenue = form.venue?.trim() || opt?.defaultVenue || 'Section Classroom';
                                        return (
                                            <Box key={k} sx={{ p: 0.75, borderRadius: 1, bgcolor: '#ffffff', border: '1px solid #dcfce7' }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography variant="caption" fontWeight={800} color="primary.main">{opt?.label}</Typography>
                                                    <Typography variant="caption" color={ct ? 'text.primary' : 'warning.dark'} fontWeight={ct ? 600 : 500}>
                                                        {ct ? `👨‍🏫 ${ct.firstName} ${ct.lastName}` : '⚠️ No Class Teacher'}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                                                    <LocationIcon sx={{ color: 'text.secondary', fontSize: 13 }} />
                                                    <Typography variant="caption" color="text.secondary">
                                                        Venue: {secVenue}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            ) : (
                                <Autocomplete
                                    size="small"
                                    options={teacherOptions}
                                    getOptionLabel={(o) => o.label}
                                    value={teacherOptions.find(t => t.id === overrideTeacherId) || null}
                                    onChange={(_, val) => setOverrideTeacherId(val ? val.id : '')}
                                    renderInput={(params) => (
                                        <TextField {...params} label="Search and Assign Teacher" placeholder="Select teacher for all..." />
                                    )}
                                    sx={{ mt: 1 }}
                                />
                            )}
                        </Paper>
                    )}

                    {/* Single Section or General Session Teacher Autocomplete */}
                    {selectedKeys.length <= 1 && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" component="label" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5, display: 'block' }}>
                                Assigned Teacher
                            </Typography>
                            <Autocomplete
                                size="small"
                                options={teacherOptions}
                                getOptionLabel={(o) => o.label}
                                value={teacherOptions.find(t => t.id === overrideTeacherId) || null}
                                onChange={(_, val) => setOverrideTeacherId(val ? val.id : '')}
                                renderInput={(params) => (
                                    <TextField {...params} placeholder="Search teacher by name..." />
                                )}
                            />
                            {selectedKeys.length === 1 && (() => {
                                const target = sectionOptions.find(o => o.key === selectedKeys[0]);
                                return target?.classTeacher ? (
                                    <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600, display: 'block', mt: 0.5 }}>
                                        ✓ Auto-detected Section Class Teacher: {target.classTeacher.firstName} {target.classTeacher.lastName}
                                    </Typography>
                                ) : null;
                            })()}
                        </Box>
                    )}

                    {/* Date and Overall Meeting Time Window */}
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <AppDatePicker
                                label="Meeting Date"
                                required
                                value={form.date}
                                onChange={val => val && setForm(f => ({ ...f, date: val }))}
                            />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 4 }}>
                            <AppInput
                                label="Overall Start Time"
                                type="time"
                                required
                                value={form.startTime}
                                onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                            />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 4 }}>
                            <AppInput
                                label="Overall End Time"
                                type="time"
                                required
                                value={form.endTime}
                                onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                            />
                        </Grid>
                    </Grid>

                    {/* Optional Break / Recess Time Toggle */}
                    <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: '#faf5ff', border: '1px solid #f3e8ff' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CoffeeIcon sx={{ color: '#9333ea', fontSize: 20 }} />
                                <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#6b21a8' }}>
                                    Include Teacher Break / Tea Timing
                                </Typography>
                            </Box>
                            <Switch
                                size="small"
                                checked={hasBreakTime}
                                onChange={e => setHasBreakTime(e.target.checked)}
                                color="secondary"
                            />
                        </Box>

                        {hasBreakTime && (
                            <Grid container spacing={2} sx={{ mt: 0.5 }}>
                                <Grid size={{ xs: 6 }}>
                                    <AppInput
                                        label="Break Start Time"
                                        type="time"
                                        value={form.breakStartTime}
                                        onChange={e => setForm(f => ({ ...f, breakStartTime: e.target.value }))}
                                    />
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <AppInput
                                        label="Break End Time"
                                        type="time"
                                        value={form.breakEndTime}
                                        onChange={e => setForm(f => ({ ...f, breakEndTime: e.target.value }))}
                                    />
                                </Grid>
                            </Grid>
                        )}
                    </Box>

                    {/* Per-Parent Conversation Duration & Venue Breakdown */}
                    <Box sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.100' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <TimeIcon color="primary" fontSize="small" />
                            <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                                1-on-1 Parent Conversation Timing & Venue
                            </Typography>
                        </Box>

                        <Box sx={{ mb: 1.5 }}>
                            <AppInput
                                label="Conversation Duration per Parent (Minutes)"
                                type="number"
                                required
                                value={form.slotDurationMinutes}
                                onChange={e => setForm(f => ({ ...f, slotDurationMinutes: Math.max(1, Number(e.target.value)) }))}
                                helperText="Minutes the teacher spends with each parent (e.g. 10 or 15 mins)"
                                sx={{ mb: 1 }}
                            />
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, py: 0.5, px: 1, bgcolor: '#f1f5f9', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                                <LocationIcon sx={{ color: 'primary.main', fontSize: 16 }} />
                                <Typography variant="caption" fontWeight={600} color="text.secondary">
                                    Meeting Venue: <strong style={{ color: '#0f172a' }}>Respective Section Classroom</strong> (Automatically assigned per section)
                                </Typography>
                            </Box>
                        </Box>

                        {totalMinutes > 0 && (
                            <>
                                <Box sx={{ display: 'flex', gap: 0.75, mb: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Popular Durations:</Typography>
                                    {[5, 10, 15, 20, 30].map(mins => (
                                        <Chip
                                            key={mins}
                                            label={`${mins} min/parent`}
                                            size="small"
                                            clickable
                                            color={form.slotDurationMinutes === mins ? 'primary' : 'default'}
                                            variant={form.slotDurationMinutes === mins ? 'filled' : 'outlined'}
                                            onClick={() => setForm(f => ({ ...f, slotDurationMinutes: mins }))}
                                            sx={{ height: 24, fontSize: '0.7rem', fontWeight: 600 }}
                                        />
                                    ))}
                                </Box>

                                <Paper elevation={0} sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                                    <Grid container spacing={1}>
                                        <Grid size={{ xs: 6, sm: 3 }}>
                                            <Typography variant="caption" color="text.secondary" display="block">Meeting Window</Typography>
                                            <Typography variant="body2" fontWeight={700}>{Math.floor(totalMinutes / 60)}h {totalMinutes % 60 ? `${totalMinutes % 60}m` : ''}</Typography>
                                        </Grid>
                                        {hasBreakTime && breakMinutes > 0 && (
                                            <Grid size={{ xs: 6, sm: 3 }}>
                                                <Typography variant="caption" color="text.secondary" display="block">Break Time</Typography>
                                                <Typography variant="body2" fontWeight={700} color="warning.main">☕ {breakMinutes} mins</Typography>
                                            </Grid>
                                        )}
                                        <Grid size={{ xs: 6, sm: 3 }}>
                                            <Typography variant="caption" color="text.secondary" display="block">Discussion Time</Typography>
                                            <Typography variant="body2" fontWeight={700} color="primary.main">{effectiveMinutes} mins</Typography>
                                        </Grid>
                                        <Grid size={{ xs: 6, sm: 3 }}>
                                            <Typography variant="caption" color="text.secondary" display="block">Total Parent Slots</Typography>
                                            <Typography variant="body2" fontWeight={800} color="success.main">🎯 {totalSlots} Parents</Typography>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            </>
                        )}
                    </Box>

                    <AppInput
                        label="Notes / Instructions for Parents"
                        multiline
                        rows={2}
                        value={form.notes}
                        onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                        placeholder="e.g. Please bring the Term 1 progress card. Enter through Gate 2."
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2.5, gap: 1 }}>
                    <AppButton onClick={() => setCreateOpen(false)} variant="outlined" color="inherit">
                        Cancel
                    </AppButton>
                    <AppButton
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={createPTM.isPending || !form.title || !form.date || !form.startTime || !form.endTime}
                        startIcon={createPTM.isPending ? <CircularProgress size={14} color="inherit" /> : <DoneIcon />}
                    >
                        {createPTM.isPending ? 'Scheduling...' : selectedKeys.length > 1 ? `Schedule for ${selectedKeys.length} Sections (${totalSlots} slots each)` : `Schedule PTM (${totalSlots} Parent Slots)`}
                    </AppButton>
                </DialogActions>
            </Dialog>

            <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast('')} message={toast} />
        </Box>
    );
};

export default PTMManagement;
