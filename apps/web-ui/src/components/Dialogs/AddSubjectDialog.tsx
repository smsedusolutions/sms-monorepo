import { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    IconButton,
    Box,
    Typography,
    Divider,
    FormControlLabel,
    Switch,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useCreateSubject, useUpdateSubject, useGetSubjects } from '../../queries/Subject';
import { useGetClasses } from '../../queries/Class';
import { useGetTeachers } from '../../queries/Teacher';
import { useNotification } from '../../hooks/useNotification';
import { useIsMobile } from '../../hooks/useIsMobile';
import type { Subject, Teacher, Class } from '../../types';
import { AppInput } from '../shared/AppInput';
import { AppSelect } from '../shared/AppSelect';
import { AppButton } from '../shared/AppButton';
import { AppMultiSelect } from '../shared/AppMultiSelect';

interface SubjectDialogProps {
    open: boolean;
    onClose: () => void;
    schoolId: string;
    editData?: Subject | null;
    initialClassId?: string;
}

export const AddSubjectDialog: React.FC<SubjectDialogProps> = ({
    open,
    onClose,
    schoolId,
    editData,
    initialClassId,
}) => {
    const isMobile = useIsMobile();
    const isEditMode = !!editData;
    const notification = useNotification();

    const [formData, setFormData] = useState({
        name: "",
        code: "",
        description: "",
        classes: [] as string[],
        teacherIds: [] as string[],
        isSubSubject: false,
        parentSubjectId: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const createMutation = useCreateSubject(schoolId);
    const updateMutation = useUpdateSubject(schoolId);
    
    // Fetch parent subjects for the dropdown
    const { data: subjectsData } = useGetSubjects(schoolId);
    const parentSubjects = (subjectsData?.data || []).filter(s => !s.isSubSubject);

    const { data: classesData } = useGetClasses(schoolId);
    const classes = classesData?.data || [];

    const { data: teachersData } = useGetTeachers(schoolId);
    const teachers = (teachersData?.data || []) as Teacher[];

    useEffect(() => {
        if (editData) {
            setFormData({
                name: editData.name || "",
                code: editData.code || "",
                description: editData.description || "",
                classes: editData.classes || [],
                teacherIds: editData.assignedTeacherIds || (editData.assignedTeacherId ? [editData.assignedTeacherId] : []),
                isSubSubject: editData.isSubSubject || false,
                parentSubjectId: editData.parentSubjectId || "",
            });
        } else {
            const initialClasses = initialClassId ? [initialClassId] : [];
            setFormData({
                name: "",
                code: "",
                description: "",
                classes: initialClasses,
                teacherIds: [],
                isSubSubject: false,
                parentSubjectId: "",
            });
        }
    }, [editData, open, initialClassId]);

    const handleChange = (e: any) => {
        const { name, value, checked, type } = e.target;
        setFormData((prev) => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };


    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) newErrors.name = "Subject name is required";
        if (!formData.code.trim()) {
            newErrors.code = "Subject code is required";
        } else if (formData.code.length > 10) {
            newErrors.code = "Code must be 10 characters or less";
        }

        if (formData.isSubSubject && !formData.parentSubjectId) {
            newErrors.parentSubjectId = "Parent Subject is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            if (isEditMode && editData) {
                await updateMutation.mutateAsync({
                    subjectId: editData.subjectId,
                    data: formData,
                });
                notification.success("Subject profile updated successfully");
            } else {
                await createMutation.mutateAsync(formData);
                notification.success("New subject registered successfully");
            }
            handleClose();
        } catch {
            notification.error("Failed to save subject. Please check your data.");
        }
    };

    const handleClose = () => {
        setFormData({
            name: "",
            code: "",
            description: "",
            classes: [],
            teacherIds: [],
            isSubSubject: false,
            parentSubjectId: "",
        });
        setErrors({});
        createMutation.reset();
        updateMutation.reset();
        onClose();
    };

    const isPending = createMutation.isPending || updateMutation.isPending;
    const isError = createMutation.isError || updateMutation.isError;
    const errorMessage =
        (createMutation.error as { message?: string })?.message ||
        (updateMutation.error as { message?: string })?.message ||
        "Operation failed";

    // Build option arrays for AppMultiSelect
    const classOptions = classes
        .filter((c: Class) => c.status === 'active')
        .map((c: Class) => ({ id: c.classId, label: c.name }));

    const teacherOptions = teachers
        .filter((t: Teacher) => t.status === 'active')
        .map((t: Teacher) => ({ id: t.teacherId, label: `${t.firstName} ${t.lastName}` }));

    return (
        <Dialog 
            open={open} 
            onClose={handleClose} 
            maxWidth="sm" 
            fullWidth
            fullScreen={isMobile}
            PaperProps={{
                sx: {
                    borderRadius: isMobile ? 0 : 3,
                    maxHeight: isMobile ? '100dvh' : '90vh',
                }
            }}
        >
            <DialogTitle sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                borderBottom: '1px solid',
                borderColor: 'divider',
                py: { xs: 1.5, sm: 2 },
                px: { xs: 2, sm: 3 },
            }}>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                    {isEditMode ? 'Modify Subject Profile' : 'Register New Subject'}
                </Typography>
                <IconButton onClick={handleClose} size="small" edge="end">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                <DialogContent sx={{ p: { xs: 2, sm: 3 }, overflowY: 'auto' }}>
                    {isError && (
                        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
                            {errorMessage}
                        </Alert>
                    )}

                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                        <Typography variant="overline" color="primary" sx={{ fontWeight: 800, letterSpacing: 1.2, fontSize: '0.75rem' }}>
                            Subject Identification
                        </Typography>

                        <AppInput
                            name="name"
                            label="Official Subject Name"
                            value={formData.name}
                            onChange={handleChange}
                            error={!!errors.name}
                            helperText={errors.name}
                            required
                            fullWidth
                            placeholder="e.g., Advanced Mathematics, World History"
                        />

                        <AppInput
                            name="code"
                            label="Identifier Code"
                            value={formData.code}
                            onChange={handleChange}
                            error={!!errors.code}
                            helperText={errors.code || 'Short code for internal tracking (e.g., MATH101)'}
                            required
                            fullWidth
                            inputProps={{ style: { textTransform: 'uppercase' } }}
                            placeholder="MATH01"
                        />

                        <AppMultiSelect
                            label="Assign to Classes"
                            placeholder="Select classes (Leave empty for General / All Classes)"
                            helperText="Select target classes, or leave empty for General / All Classes"
                            options={classOptions}
                            value={formData.classes}
                            onChange={(ids) => setFormData(prev => ({ ...prev, classes: ids }))}
                            chipColor="primary"
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    name="isSubSubject"
                                    checked={formData.isSubSubject}
                                    onChange={handleChange}
                                    color="primary"
                                />
                            }
                            label="Is this a Sub-Subject? (e.g. Physics under Science)"
                        />

                        {formData.isSubSubject && (
                            <AppSelect
                                label="Parent Subject"
                                name="parentSubjectId"
                                value={formData.parentSubjectId}
                                onChange={handleChange}
                                options={[
                                    { value: "", label: "Select Parent Subject" },
                                    ...parentSubjects.map((s: Subject) => ({
                                        value: s.subjectId,
                                        label: s.name
                                    }))
                                ]}
                            />
                        )}

                        <Divider sx={{ my: 0.5 }} />

                        <Typography variant="overline" color="primary" sx={{ fontWeight: 800, letterSpacing: 1.2, fontSize: '0.75rem' }}>
                            Faculty Assignment
                        </Typography>

                        <AppMultiSelect
                            label="Assigned Teachers"
                            placeholder="Search and select faculty members..."
                            options={teacherOptions}
                            value={formData.teacherIds || []}
                            onChange={(ids) => setFormData(prev => ({ ...prev, teacherIds: ids }))}
                            chipColor="primary"
                        />

                        <Divider sx={{ my: 0.5 }} />

                        <Typography variant="overline" color="primary" sx={{ fontWeight: 800, letterSpacing: 1.2, fontSize: '0.75rem' }}>
                            Categorization & Notes
                        </Typography>

                        <AppInput
                            name="description"
                            label="Subject Overview"
                            value={formData.description}
                            onChange={handleChange}
                            fullWidth
                            multiline
                            rows={3}
                            placeholder="Briefly describe the curriculum or scope of this subject"
                        />
                    </Box>
                </DialogContent>

                <DialogActions sx={{ 
                    px: { xs: 2, sm: 3 }, 
                    py: 2, 
                    borderTop: '1px solid', 
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    gap: 1.5,
                    flexDirection: { xs: 'column-reverse', sm: 'row' },
                    '& > button': {
                        width: { xs: '100%', sm: 'auto' },
                        height: 44,
                    }
                }}>
                    <AppButton onClick={handleClose} variant="text" color="inherit">Cancel</AppButton>
                    <AppButton
                        type="submit"
                        variant="contained"
                        loading={isPending}
                    >
                        {isEditMode ? 'Update Subject' : 'Create Subject'}
                    </AppButton>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default AddSubjectDialog;
