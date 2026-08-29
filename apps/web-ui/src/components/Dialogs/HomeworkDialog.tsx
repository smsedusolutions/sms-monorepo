import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    IconButton,
    Box,
    Grid,
    Alert,
    Divider,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import {
    Close as CloseIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { AppInput } from '../shared/AppInput';
import { AppSelect } from '../shared/AppSelect';
import { AppDatePicker } from '../shared/AppDatePicker';
import { AppButton } from '../shared/AppButton';
import FileUpload from '../FileUpload/FileUpload';
import { useCreateHomework, useUpdateHomework } from '../../queries/Homework';
import { useGetClasses } from '../../queries/Class';
import { useGetSubjects } from '../../queries/Subject';
import { useUserStore } from '../../stores/userStore';
import TokenService from '../../queries/token/tokenService';
import type { Homework, CreateHomeworkPayload, AnnouncementAttachment } from '../../types';

interface HomeworkDialogProps {
    open: boolean;
    onClose: () => void;
    schoolId: string;
    editData?: Homework | null;
}

const HomeworkDialog: React.FC<HomeworkDialogProps> = ({ open, onClose, schoolId, editData }) => {
    const isEditMode = !!editData;
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const { user: userProfile, fetchProfile } = useUserStore();
    const role = TokenService.getRole();
    const isTeacher = role === 'teacher' || userProfile?.role === 'teacher';

    useEffect(() => {
        if (!userProfile && open) {
            fetchProfile();
        }
    }, [userProfile, open, fetchProfile]);

    const [formData, setFormData] = useState<Omit<CreateHomeworkPayload, 'dueDate'>>({
        classId: '',
        sectionId: '',
        subjectId: '',
        title: '',
        description: '',
        attachmentUrl: '',
        referenceLinks: [''],
        attachments: [],
    });
    const [dueDate, setDueDate] = useState<Date | null>(null);
    const [error, setError] = useState('');

    const { data: classesData } = useGetClasses(schoolId);
    const { data: subjectsData } = useGetSubjects(schoolId);

    const createMutation = useCreateHomework(schoolId);
    const updateMutation = useUpdateHomework(schoolId);

    const rawClasses = useMemo(() => classesData?.data || [], [classesData]);
    const rawSubjects = useMemo(() => subjectsData?.data || [], [subjectsData]);

    // 1. Filter subjects for teacher: only subjects assigned to the teacher
    const availableSubjects = useMemo(() => {
        if (!isTeacher) return rawSubjects;

        const teacherSubjects: string[] = userProfile?.subjects || [];
        const teacherSubjectNames: string[] = userProfile?.subjectNames || [];

        if (teacherSubjects.length === 0 && teacherSubjectNames.length === 0) {
            return rawSubjects;
        }

        const filtered = rawSubjects.filter((s: any) => {
            const sId = s.subjectId?.toLowerCase();
            const sName = s.name?.toLowerCase();
            const matchId = teacherSubjects.some((ts) => {
                const tsLower = ts.toLowerCase();
                return tsLower === sId || tsLower === sName;
            });
            const matchName = teacherSubjectNames.some((tsn) => {
                const tsnLower = tsn.toLowerCase();
                return tsnLower === sName || tsnLower === sId;
            });
            return matchId || matchName;
        });

        return filtered.length > 0 ? filtered : rawSubjects;
    }, [rawSubjects, isTeacher, userProfile]);

    // 2. Filter classes: ONLY classes that have the selected subject (or teacher's assigned subjects) assigned in class.subjects
    const availableClasses = useMemo(() => {
        if (!isTeacher) return rawClasses;

        // If a subject is specifically chosen in formData
        if (formData.subjectId) {
            const selectedSubj = rawSubjects.find(
                (s: any) => s.subjectId?.toLowerCase() === formData.subjectId.toLowerCase() || s.name?.toLowerCase() === formData.subjectId.toLowerCase()
            );
            const targetIds = [formData.subjectId.toLowerCase().trim()];
            const targetNames = selectedSubj?.name ? [selectedSubj.name.toLowerCase().trim()] : [];

            const withSubject = rawClasses.filter((c: any) => {
                if (!Array.isArray(c.subjects) || c.subjects.length === 0) return false;
                return c.subjects.some((cs: any) => {
                    if (!cs) return false;
                    const csLower = String(cs).toLowerCase().trim();
                    return targetIds.includes(csLower) || targetNames.includes(csLower);
                });
            });

            // If classes have this subject configured, return only those classes
            if (withSubject.length > 0) {
                return withSubject;
            }
            return rawClasses;
        }

        // If no subject selected yet: filter classes offering ANY of the teacher's available subjects
        const teacherSubjIds = availableSubjects.map((s: any) => s.subjectId?.toLowerCase().trim()).filter(Boolean);
        const teacherSubjNames = availableSubjects.map((s: any) => s.name?.toLowerCase().trim()).filter(Boolean);

        if (teacherSubjIds.length > 0 || teacherSubjNames.length > 0) {
            const withAnySubject = rawClasses.filter((c: any) => {
                if (!Array.isArray(c.subjects) || c.subjects.length === 0) return false;
                return c.subjects.some((cs: any) => {
                    if (!cs) return false;
                    const csLower = String(cs).toLowerCase().trim();
                    return teacherSubjIds.includes(csLower) || teacherSubjNames.includes(csLower);
                });
            });
            if (withAnySubject.length > 0) {
                return withAnySubject;
            }
        }

        return rawClasses;
    }, [rawClasses, isTeacher, formData.subjectId, availableSubjects, rawSubjects]);

    // 3. Sections: all sections belonging to the selected class
    const selectedClass = rawClasses.find((c: any) => c.classId === formData.classId);
    const sections = useMemo(() => {
        if (!selectedClass) return [];
        return selectedClass.sections || [];
    }, [selectedClass]);

    // Auto-select single subject or class if teacher only has one option
    useEffect(() => {
        if (!editData && open) {
            setFormData(prev => {
                let updated = { ...prev };
                if (!updated.subjectId && availableSubjects.length === 1) {
                    updated.subjectId = availableSubjects[0].subjectId;
                }
                if (!updated.classId && availableClasses.length === 1) {
                    updated.classId = availableClasses[0].classId;
                }
                return updated;
            });
        }
    }, [editData, open, availableSubjects, availableClasses]);

    useEffect(() => {
        if (editData) {
            setFormData({
                classId: editData.classId || '',
                sectionId: editData.sectionId || '',
                subjectId: editData.subjectId || '',
                title: editData.title || '',
                description: editData.description || '',
                attachmentUrl: editData.attachmentUrl || '',
                referenceLinks: editData.referenceLinks?.length ? editData.referenceLinks : [''],
                attachments: editData.attachments || [],
            });
            setDueDate(editData.dueDate ? new Date(editData.dueDate) : null);
        } else {
            setFormData({
                classId: '',
                sectionId: '',
                subjectId: '',
                title: '',
                description: '',
                attachmentUrl: '',
                referenceLinks: [''],
                attachments: [],
            });
            setDueDate(null);
        }
        setError('');
    }, [editData, open]);

    const handleClose = () => {
        setError('');
        createMutation.reset();
        updateMutation.reset();
        onClose();
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (error) setError('');
    };

    const handleSubjectChange = (subjectId: string) => {
        setFormData(prev => {
            const updated = { ...prev, subjectId };
            // If the currently chosen class does not offer this subject, reset class & section
            if (updated.classId) {
                const cls = rawClasses.find((c: any) => c.classId === updated.classId);
                const selectedSubj = rawSubjects.find((s: any) => s.subjectId === subjectId);
                const subjName = selectedSubj?.name?.toLowerCase();
                const subjIdLower = subjectId.toLowerCase();

                if (cls && Array.isArray(cls.subjects) && cls.subjects.length > 0) {
                    const hasSubj = cls.subjects.some((cs: string) => {
                        const csLower = cs.toLowerCase();
                        return csLower === subjIdLower || (subjName && csLower === subjName);
                    });
                    if (!hasSubj) {
                        updated.classId = '';
                        updated.sectionId = '';
                    }
                }
            }
            return updated;
        });
        if (error) setError('');
    };

    const handleClassChange = (classId: string) => {
        setFormData(prev => ({ ...prev, classId, sectionId: '' }));
        if (error) setError('');
    };

    const handleAddLink = () => {
        setFormData(prev => ({
            ...prev,
            referenceLinks: [...(prev.referenceLinks || []), '']
        }));
    };

    const handleRemoveLink = (index: number) => {
        setFormData(prev => ({
            ...prev,
            referenceLinks: prev.referenceLinks?.filter((_, i) => i !== index)
        }));
    };

    const handleLinkChange = (index: number, value: string) => {
        const newLinks = [...(formData.referenceLinks || [])];
        newLinks[index] = value;
        setFormData(prev => ({ ...prev, referenceLinks: newLinks }));
    };

    const handleFilesChange = (newAttachments: AnnouncementAttachment[]) => {
        setFormData(prev => ({ ...prev, attachments: newAttachments }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.classId || !formData.subjectId || !formData.title || !formData.description || !dueDate) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            const payload = {
                ...formData,
                referenceLinks: formData.referenceLinks?.filter(link => link.trim() !== ''),
                dueDate: dueDate.toISOString(),
            };

            if (isEditMode && editData) {
                await updateMutation.mutateAsync({
                    homeworkId: editData.homeworkId,
                    ...payload,
                });
            } else {
                await createMutation.mutateAsync(payload as CreateHomeworkPayload);
            }
            handleClose();
        } catch (err: any) {
            setError(err?.message || `Failed to ${isEditMode ? 'update' : 'create'} homework`);
        }
    };

    const user = TokenService.getUser();
    const teacherName = user ? `${user.firstName || ''}_${user.lastName || ''}`.replace(/\s+/g, '_') : 'teacher';
    const className = selectedClass?.name?.replace(/\s+/g, '_') || 'class';
    const imageKitFolder = `homework/${teacherName}/${className}`;

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Dialog 
                open={open} 
                onClose={handleClose} 
                maxWidth="md" 
                fullWidth
                fullScreen={isMobile}
                PaperProps={{
                    sx: {
                        borderRadius: isMobile ? 0 : { xs: 3, sm: 4 },
                        m: isMobile ? 0 : { xs: 1.5, sm: 3 },
                        maxHeight: isMobile ? '100%' : { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' },
                    }
                }}
            >
                <DialogTitle sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    p: { xs: 2, sm: 3 },
                    pb: { xs: 1.5, sm: 2 }
                }}>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                            {isEditMode ? 'Modify Assignment' : 'New Academic Assignment'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                            {isEditMode ? 'Update homework details and materials' : 'Fill in the details to assign new work to students'}
                        </Typography>
                    </Box>
                    <IconButton onClick={handleClose} size="small" sx={{ bgcolor: 'action.hover' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <form onSubmit={handleSubmit}>
                    <DialogContent sx={{ p: { xs: 2, sm: 3 }, pt: 0 }}>
                        {error && (
                            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
                                {error}
                            </Alert>
                        )}

                        <Grid container spacing={{ xs: 2, sm: 2.5 }}>
                            <Grid size={{ xs: 12 }}>
                                <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
                                    Placement & Schedule
                                </Typography>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <AppSelect
                                    label="Subject"
                                    value={formData.subjectId}
                                    onChange={(e) => handleSubjectChange(e.target.value as string)}
                                    options={availableSubjects.map((s: any) => ({ value: s.subjectId, label: s.name }))}
                                    required
                                    helperText={availableSubjects.length === 0 ? "No assigned subjects found" : undefined}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <AppSelect
                                    label="Class"
                                    value={formData.classId}
                                    onChange={(e) => handleClassChange(e.target.value as string)}
                                    options={availableClasses.map((c: any) => ({ value: c.classId, label: c.name }))}
                                    required
                                    helperText={availableClasses.length === 0 ? "No classes assigned for this subject" : undefined}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <AppSelect
                                    label="Section"
                                    value={formData.sectionId}
                                    onChange={(e) => handleChange('sectionId', e.target.value)}
                                    options={[{ value: '', label: 'All Sections' }, ...sections.map((s: any) => ({ value: s.sectionId, label: s.name }))]}
                                    disabled={!formData.classId}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <AppDatePicker
                                    label="Due Date"
                                    value={dueDate}
                                    onChange={(date: Date | null) => setDueDate(date)}
                                    minDate={new Date()}
                                    required
                                />
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <Divider sx={{ my: 0.5 }} />
                                <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
                                    Assignment Details
                                </Typography>
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <AppInput
                                    fullWidth
                                    label="Homework Title"
                                    value={formData.title}
                                    onChange={(e) => handleChange('title', e.target.value)}
                                    placeholder="e.g., Chapter 5 Exercises"
                                    required
                                />
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <AppInput
                                    fullWidth
                                    multiline
                                    rows={4}
                                    label="Instructions"
                                    value={formData.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    placeholder="Details about the homework..."
                                    required
                                />
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <Divider sx={{ my: 0.5 }} />
                                <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
                                    Resources & Materials
                                </Typography>
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <Box sx={{ mb: 1 }}>
                                    <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                                        Web Reference Links
                                    </Typography>
                                    {(formData.referenceLinks || []).map((link, index) => (
                                        <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                                            <AppInput
                                                fullWidth
                                                placeholder="https://..."
                                                value={link}
                                                onChange={(e) => handleLinkChange(index, e.target.value)}
                                            />
                                            <IconButton
                                                color="error"
                                                onClick={() => handleRemoveLink(index)}
                                                disabled={formData.referenceLinks?.length === 1}
                                                sx={{ bgcolor: 'error.50', borderRadius: 1.5, '&:hover': { bgcolor: 'error.100' } }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    ))}
                                    <AppButton
                                        startIcon={<AddIcon />}
                                        variant="outlined"
                                        size="small"
                                        onClick={handleAddLink}
                                        sx={{ borderRadius: 2 }}
                                    >
                                        Add Another Link
                                    </AppButton>
                                </Box>
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <FileUpload
                                    folder={imageKitFolder}
                                    baseFileName={`homework_${formData.title.replace(/\s+/g, '_')}`}
                                    currentAttachments={formData.attachments}
                                    onUploadSuccess={handleFilesChange}
                                    label="Upload Attachments (PDFs, Images, Docs)"
                                    maxFiles={5}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>

                    <DialogActions sx={{ p: { xs: 2, sm: 3 }, pt: 0, gap: 1 }}>
                        <AppButton onClick={handleClose} variant="text" color="inherit">
                            Discard
                        </AppButton>
                        <AppButton
                            type="submit"
                            variant="contained"
                            loading={isPending}
                            sx={{ minWidth: { xs: 120, sm: 140 }, borderRadius: 2 }}
                        >
                            {isEditMode ? 'Apply Changes' : 'Assign Homework'}
                        </AppButton>
                    </DialogActions>
                </form>
            </Dialog>
        </LocalizationProvider>
    );
};

export default HomeworkDialog;
