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
    EditOutlined as EditIcon,
    DeleteOutline as DeleteIcon,
} from '@mui/icons-material';
import ConfirmationDialog from '../../../components/Dialogs/ConfirmationDialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useApi from '../../../queries/useApi';
import TokenService from '../../../queries/token/tokenService';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { MobileCardItem, MobileCardList } from '../../../components/mobile';
import { useGetClasses } from '../../../queries/Class';
import { useGetTeachers } from '../../../queries/Teacher';
import { useGetStudents } from '../../../queries/Student';
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
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
    const [editingSession, setEditingSession] = useState<any | null>(null);
    const [durationInput, setDurationInput] = useState<string>('10');

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
    const { data: teachersData } = useGetTeachers(schoolId, { limit: 500, status: 'active' });
    const { data: studentsData } = useGetStudents(schoolId, { limit: 2000, status: 'active' });
    const classes: any[] = classesData?.data || [];
    const teachers: any[] = teachersData?.data || [];
    const allStudents: any[] = studentsData?.data || [];

    // Build a map of classId::sectionId -> number of students that have a parent registered
    const parentCountMap = useMemo<Record<string, number>>(() => {
        const map: Record<string, number> = {};
        allStudents.forEach(s => {
            if (!s.class) return;
            // Count all students (each student = 1 potential parent slot regardless of parentId)
            const secKey = s.section ? `${s.class}::${s.section}` : `${s.class}::all`;
            const classKey = `${s.class}::all`;
            map[secKey] = (map[secKey] || 0) + 1;
            // Also accumulate class-level total
            if (s.section) map[classKey] = (map[classKey] || 0) + 1;
        });
        return map;
    }, [allStudents]);

    // Helper: get parent count for a sectionOption key
    const getParentCount = (key: string) => {
        return parentCountMap[key] || 0;
    };

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
        const secTeacherId = section?.classTeacherId || section?.classTeacher || section?.teacherId;
        if (secTeacherId) {
            const match = teachers.find(
                (t: any) => (t.teacherId === secTeacherId || t._id === secTeacherId || t.userId === secTeacherId) && t.status !== 'inactive'
            );
            if (match) {
                return {
                    ...match,
                    teacherId: match.teacherId || match._id,
                    teacherName: `${match.firstName} ${match.lastName}`.trim(),
                };
            }
            if (teachers.length > 0) {
                return null;
            }
        }

        if (section?.classTeacherName) {
            const match = teachers.find(
                (t: any) => `${t.firstName} ${t.lastName}`.trim().toLowerCase() === section.classTeacherName.trim().toLowerCase() && t.status !== 'inactive'
            );
            if (match) {
                return {
                    ...match,
                    teacherId: match.teacherId || match._id,
                    teacherName: `${match.firstName} ${match.lastName}`.trim(),
                };
            }
            if (teachers.length > 0) {
                return null;
            }
            return {
                teacherId: null,
                teacherName: section.classTeacherName,
                firstName: section.classTeacherName.split(' ')[0] || section.classTeacherName,
                lastName: section.classTeacherName.split(' ').slice(1).join(' ') || '',
            };
        }

        if (section?.sectionId) {
            const fullSecKey = `${classId}#${section.sectionId}`;
            const match = teachers.find(
                (t: any) => (t.classTeacherSectionId === fullSecKey || (t.classTeacherSectionId && t.classTeacherSectionId.startsWith(classId))) && t.status !== 'inactive'
            );
            if (match) {
                return {
                    ...match,
                    teacherId: match.teacherId || match._id,
                    teacherName: `${match.firstName} ${match.lastName}`.trim(),
                };
            }
        }

        const matchByClass = teachers.find((t: any) => t.classTeacherSectionId && t.classTeacherSectionId.startsWith(classId) && t.status !== 'inactive');
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
            setEditingSession(null);
            setToast(res?.message || 'PTM session(s) created and synced to calendar!');
            setSelectedKeys([]);
            setOverrideTeacherId('');
            setDurationInput('10');
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

    const updatePTM = useMutation({
        mutationFn: ({ id, body }: { id: string; body: any }) =>
            useApi<any>('PATCH', `/api/academics/school/${schoolId}/ptm/${id}`, body),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['ptm-sessions', schoolId] });
            queryClient.invalidateQueries({ queryKey: ['school-calendar'] });
            setCreateOpen(false);
            setEditingSession(null);
            setSelectedKeys([]);
            setOverrideTeacherId('');
            setToast(res?.message || 'PTM session updated successfully!');
            setDurationInput('10');
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

    const deletePTM = useMutation({
        mutationFn: (id: string) => useApi<any>('DELETE', `/api/academics/school/${schoolId}/ptm/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ptm-sessions', schoolId] });
            queryClient.invalidateQueries({ queryKey: ['school-calendar'] });
            setDeleteConfirmOpen(false);
            setSessionToDelete(null);
            setToast('PTM session deleted successfully!');
        },
    });

    const handleOpenEdit = (session: any) => {
        setEditingSession(session);
        const sessionDate = session.date ? new Date(session.date) : new Date();
        const dur = session.slotDurationMinutes || 10;
        setDurationInput(String(dur));

        // Restore class/section selection
        if (session.classId) {
            const sectionId = session.sectionId || 'all';
            setSelectedKeys([`${session.classId}::${sectionId}`]);
        } else {
            setSelectedKeys([]);
        }

        // Restore assigned teacher
        if (session.teacherId) {
            setOverrideTeacherId(session.teacherId);
        } else {
            setOverrideTeacherId('');
        }

        setForm({
            title: session.title || '',
            date: sessionDate,
            startTime: session.startTime || '09:00',
            endTime: session.endTime || '13:00',
            breakStartTime: session.breakStartTime || '11:00',
            breakEndTime: session.breakEndTime || '11:30',
            slotDurationMinutes: dur,
            venue: session.venue || '',
            notes: session.notes || '',
        });
        setHasBreakTime(!!(session.breakStartTime && session.breakEndTime));
        setCreateOpen(true);
    };

    const handleDeleteSession = (id: string) => {
        setSessionToDelete(id);
        setDeleteConfirmOpen(true);
    };

    const handleCloseDialog = () => {
        setCreateOpen(false);
        setEditingSession(null);
        setSelectedKeys([]);
        setOverrideTeacherId('');
    };

    const handleSubmit = () => {
        const formattedDate = format(form.date, 'yyyy-MM-dd');
        const payloadBase = {
            ...form,
            date: formattedDate,
            breakStartTime: hasBreakTime ? form.breakStartTime : null,
            breakEndTime: hasBreakTime ? form.breakEndTime : null,
        };

        // Edit mode: patch the existing session
        if (editingSession) {
            let classId = editingSession.classId || null;
            let className = editingSession.className || null;
            let sectionId = editingSession.sectionId || null;
            let sectionName = editingSession.sectionName || null;
            let teacherId = editingSession.teacherId || null;
            let teacherName = editingSession.teacherName || null;

            if (selectedKeys.length > 0) {
                const opt = sectionOptions.find(o => o.key === selectedKeys[0]);
                if (opt) {
                    classId = opt.classId || null;
                    className = opt.className || null;
                    sectionId = opt.sectionId || null;
                    sectionName = opt.sectionName || null;
                    if (!overrideTeacherId && opt.classTeacher) {
                        teacherId = opt.classTeacher.teacherId || opt.classTeacher._id;
                        teacherName = `${opt.classTeacher.firstName} ${opt.classTeacher.lastName}`;
                    }
                }
            }

            if (overrideTeacherId) {
                const singleTeacher = teachers.find(t => (t.teacherId || t._id) === overrideTeacherId);
                if (singleTeacher) {
                    teacherId = singleTeacher.teacherId || singleTeacher._id;
                    teacherName = `${singleTeacher.firstName} ${singleTeacher.lastName}`;
                }
            }

            updatePTM.mutate({
                id: editingSession._id,
                body: {
                    ...payloadBase,
                    classId,
                    className,
                    sectionId,
                    sectionName,
                    teacherId,
                    teacherName,
                },
            });
            return;
        }

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

    const sessions: any[] = (data?.data || []).slice().sort(
        (a: any, b: any) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
    );

    // Real status helper
    const getSessionRealStatus = (session: any): 'scheduled' | 'ongoing' | 'completed' | 'cancelled' => {
        if (session.status === 'cancelled') return 'cancelled';
        if (session.status === 'completed') return 'completed';
        if (!session.date) return (session.status as any) || 'scheduled';
        const now = new Date();
        const d = new Date(session.date);
        if (session.endTime && typeof session.endTime === 'string' && session.endTime.includes(':')) {
            const [eh, em] = session.endTime.split(':').map(Number);
            d.setHours(eh || 0, em || 0, 0, 0);
            if (session.startTime && typeof session.startTime === 'string' && session.startTime.includes(':')) {
                const [sh, sm] = session.startTime.split(':').map(Number);
                const startD = new Date(session.date);
                startD.setHours(sh || 0, sm || 0, 0, 0);
                if (d < startD) d.setDate(d.getDate() + 1);
            }
        } else {
            d.setHours(23, 59, 59, 999);
        }
        if (now > d) return 'completed';
        return (session.status as any) || 'scheduled';
    };

    // A session is editable/deletable only if it's 'scheduled' AND its date is today or future
    const isPTMUpcoming = (session: any): boolean => {
        return getSessionRealStatus(session) === 'scheduled';
    };

    const teacherOptions = useMemo(() => {
        return teachers
            .filter((t: any) => t.status !== 'inactive')
            .map((t: any) => ({
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
                    { label: 'Upcoming', value: sessions.filter(s => getSessionRealStatus(s) === 'scheduled').length, color: 'info.main' },
                    { label: 'Completed', value: sessions.filter(s => getSessionRealStatus(s) === 'completed').length, color: 'success.main' },
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
                            badge={(() => {
                                const st = getSessionRealStatus(s);
                                return <Chip label={st.charAt(0).toUpperCase() + st.slice(1)} color={statusColor[st] || 'info'} size="small" />;
                            })()}
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
                                    <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
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
                                            {(() => {
                                                const st = getSessionRealStatus(s);
                                                return <Chip label={st.charAt(0).toUpperCase() + st.slice(1)} color={statusColor[st] || 'info'} size="small" />;
                                            })()}
                                        </TableCell>
                                        <TableCell align="center">
                                            {isPTMUpcoming(s) ? (
                                                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleOpenEdit(s)}
                                                        sx={{ color: '#3b82f6', border: '1px solid', borderColor: 'divider' }}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDeleteSession(s._id)}
                                                        sx={{ color: '#ef4444', border: '1px solid', borderColor: 'divider' }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            ) : (
                                                <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>—</Typography>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {/* Schedule PTM Dialog */}
            <Dialog open={createOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm" fullScreen={isMobile} PaperProps={{ sx: { borderRadius: 2 } }}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                    <Box>
                        <Typography fontWeight={700} variant="h6">{editingSession ? 'Edit PTM Session' : 'Schedule Parent-Teacher Meeting'}</Typography>
                        <Typography variant="caption" color="text.secondary">{editingSession ? 'Update the PTM session details' : 'Create 1-on-1 parent conversation slots for sections'}</Typography>
                    </Box>
                    <IconButton onClick={handleCloseDialog} size="small"><CloseIcon /></IconButton>
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
                                        const pCount = getParentCount(k);
                                        const slotsFit = form.slotDurationMinutes > 0 ? Math.floor(effectiveMinutes / form.slotDurationMinutes) : 0;
                                        const hasEnoughSlots = slotsFit >= pCount;
                                        return (
                                            <Box key={k} sx={{ p: 0.75, borderRadius: 1, bgcolor: '#ffffff', border: '1px solid #dcfce7' }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography variant="caption" fontWeight={800} color="primary.main">{opt?.label}</Typography>
                                                    <Typography variant="caption" color={ct ? 'text.primary' : 'warning.dark'} fontWeight={ct ? 600 : 500}>
                                                        {ct ? `👨‍🏫 ${ct.firstName} ${ct.lastName}` : '⚠️ No Class Teacher'}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <LocationIcon sx={{ color: 'text.secondary', fontSize: 13 }} />
                                                        <Typography variant="caption" color="text.secondary">
                                                            {secVenue}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <Typography
                                                            variant="caption"
                                                            fontWeight={700}
                                                            sx={{
                                                                px: 0.8,
                                                                py: 0.2,
                                                                borderRadius: 1,
                                                                bgcolor: pCount === 0 ? '#f3f4f6' : hasEnoughSlots ? '#dcfce7' : '#fef3c7',
                                                                color: pCount === 0 ? '#6b7280' : hasEnoughSlots ? '#16a34a' : '#d97706',
                                                                fontSize: '0.68rem',
                                                            }}
                                                        >
                                                            👪 {pCount} {pCount === 1 ? 'parent' : 'parents'}
                                                        </Typography>
                                                    </Box>
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
                                const pCount = target ? getParentCount(target.key) : 0;
                                return (
                                    <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
                                        {target?.classTeacher && (
                                            <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                                                ✓ Class Teacher: {target.classTeacher.firstName} {target.classTeacher.lastName}
                                            </Typography>
                                        )}
                                        <Typography
                                            variant="caption"
                                            fontWeight={700}
                                            sx={{
                                                px: 1,
                                                py: 0.3,
                                                borderRadius: 1.5,
                                                bgcolor: pCount === 0 ? '#f3f4f6' : '#dbeafe',
                                                color: pCount === 0 ? '#6b7280' : '#1d4ed8',
                                            }}
                                        >
                                            👪 {pCount} {pCount === 1 ? 'parent' : 'parents'} registered in this section
                                        </Typography>
                                    </Box>
                                );
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
                                type="text"
                                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                                required
                                value={durationInput}
                                onChange={e => {
                                    const raw = e.target.value.replace(/[^0-9]/g, '');
                                    setDurationInput(raw);
                                    const num = parseInt(raw, 10);
                                    if (!isNaN(num) && num >= 1) {
                                        setForm(f => ({ ...f, slotDurationMinutes: num }));
                                    }
                                }}
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
                                            onClick={() => {
                                                setDurationInput(String(mins));
                                                setForm(f => ({ ...f, slotDurationMinutes: mins }));
                                            }}
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
                                        {selectedKeys.length > 0 && (() => {
                                            const totalAvailable = selectedKeys.reduce((sum, k) => sum + getParentCount(k), 0);
                                            const slotsOk = totalSlots >= totalAvailable;
                                            return totalAvailable > 0 ? (
                                                <Grid size={{ xs: 12 }}>
                                                    <Box sx={{
                                                        mt: 0.5,
                                                        px: 1.5,
                                                        py: 0.75,
                                                        borderRadius: 1.5,
                                                        bgcolor: slotsOk ? '#f0fdf4' : '#fef3c7',
                                                        border: `1px solid ${slotsOk ? '#bbf7d0' : '#fde68a'}`,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 1,
                                                        flexWrap: 'wrap',
                                                    }}>
                                                        <Typography variant="caption" fontWeight={700} sx={{ color: slotsOk ? '#15803d' : '#b45309' }}>
                                                            👪 {totalAvailable} parents available across selected section{selectedKeys.length > 1 ? 's' : ''}
                                                        </Typography>
                                                        {!slotsOk && (
                                                            <Typography variant="caption" sx={{ color: '#b45309', fontWeight: 600 }}>
                                                                ⚠️ Only {totalSlots} slots available — increase meeting window or reduce duration
                                                            </Typography>
                                                        )}
                                                        {slotsOk && (
                                                            <Typography variant="caption" sx={{ color: '#15803d', fontWeight: 600 }}>
                                                                ✓ Enough slots for all parents
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Grid>
                                            ) : null;
                                        })()}
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
                    <AppButton onClick={handleCloseDialog} variant="outlined" color="inherit">
                        Cancel
                    </AppButton>
                    <AppButton
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={createPTM.isPending || updatePTM.isPending || !form.title || !form.date || !form.startTime || !form.endTime || !form.slotDurationMinutes}
                        startIcon={(createPTM.isPending || updatePTM.isPending) ? <CircularProgress size={14} color="inherit" /> : <DoneIcon />}
                    >
                        {createPTM.isPending || updatePTM.isPending
                            ? (editingSession ? 'Updating...' : 'Scheduling...')
                            : editingSession
                            ? 'Update PTM Session'
                            : selectedKeys.length > 1
                            ? `Schedule for ${selectedKeys.length} Sections (${totalSlots} slots each)`
                            : `Schedule PTM (${totalSlots} Parent Slots)`}
                    </AppButton>
                </DialogActions>
            </Dialog>

            <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast('')} message={toast} />

            <ConfirmationDialog
                open={deleteConfirmOpen}
                onClose={() => { setDeleteConfirmOpen(false); setSessionToDelete(null); }}
                onConfirm={() => sessionToDelete && deletePTM.mutate(sessionToDelete)}
                title="Delete PTM Session"
                description="Are you sure you want to delete this PTM session? All bookings associated with this session will also be removed. This action cannot be undone."
                confirmLabel="Delete Session"
                variant="danger"
                isLoading={deletePTM.isPending}
            />
        </Box>
    );
};

export default PTMManagement;
