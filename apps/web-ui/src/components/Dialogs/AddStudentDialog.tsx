import { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    IconButton,
    Autocomplete,
    Typography,
    Divider,
    Box,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useCreateStudent, useUpdateStudent } from '../../queries/Student';
import { useNotification } from '../../hooks/useNotification';
import { useIsMobile } from '../../hooks/useIsMobile';
import { searchParentsApi } from '../../queries/Parent';
import { useGetClasses } from '../../queries/Class';
import type { CreateStudentPayload, Student, Parent, Class, Section } from '../../types';
import { ImageUpload } from '../ImageUpload';
import { IMAGEKIT_FOLDERS } from '../../utils/imagekit';
import { AppInput } from '../shared/AppInput';
import { AppSelect } from '../shared/AppSelect';
import { AppButton } from '../shared/AppButton';
import { AppDatePicker } from '../shared/AppDatePicker';
import { PhoneInput } from '../shared/PhoneInput';
import { format } from 'date-fns';

interface StudentDialogProps {
    open: boolean;
    onClose: () => void;
    schoolId: string;
    editData?: Student | null;
}

const useDebounce = <T,>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

const StudentDialog: React.FC<StudentDialogProps> = ({ open, onClose, schoolId, editData }) => {
    const isEditMode = !!editData;
    const notification = useNotification();

    const [formData, setFormData] = useState<CreateStudentPayload>({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        class: '',
        section: '',
        rollNumber: '',
        gender: undefined,
        dateOfBirth: '',
        address: '',
        parentId: '',
        status: 'active',
        profileImage: '',
        signature: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [parentSearchQuery, setParentSearchQuery] = useState('');
    const [parentOptions, setParentOptions] = useState<Parent[]>([]);
    const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
    const [parentLoading, setParentLoading] = useState(false);

    const debouncedParentQuery = useDebounce(parentSearchQuery, 300);

    const createMutation = useCreateStudent(schoolId);
    const updateMutation = useUpdateStudent(schoolId);

    const { data: classesData } = useGetClasses(schoolId);
    const classes = classesData?.data || [];

    const selectedClassData = classes.find((c: Class) => c.classId === formData.class);
    const selectedClassSections = selectedClassData?.sections || [];

    useEffect(() => {
        const fetchParents = async () => {
            if (debouncedParentQuery.length >= 2) {
                setParentLoading(true);
                try {
                    const response = await searchParentsApi(schoolId, debouncedParentQuery);
                    setParentOptions(response.data || []);
                } catch {
                    setParentOptions([]);
                } finally {
                    setParentLoading(false);
                }
            } else {
                setParentOptions([]);
            }
        };
        fetchParents();
    }, [debouncedParentQuery, schoolId]);

    // Fetch real parent details for the linked parent when editing
    useEffect(() => {
        if (!editData?.parentId) return;
        const fetchLinkedParent = async () => {
            try {
                const response = await searchParentsApi(schoolId, editData.parentId!);
                const found = (response.data || []).find((p) => p.parentId === editData.parentId);
                if (found) {
                    setSelectedParent(found);
                } else {
                    // Fallback: split parentName if search returns nothing
                    const nameParts = (editData.parentName || '').split(' ');
                    setSelectedParent({
                        parentId: editData.parentId,
                        firstName: nameParts[0] || 'Parent',
                        lastName: nameParts.slice(1).join(' ') || '(Linked)',
                        email: '',
                        phone: '',
                    } as Parent);
                }
            } catch {
                const nameParts = (editData.parentName || '').split(' ');
                setSelectedParent({
                    parentId: editData.parentId,
                    firstName: nameParts[0] || 'Parent',
                    lastName: nameParts.slice(1).join(' ') || '(Linked)',
                    email: '',
                    phone: '',
                } as Parent);
            }
        };
        fetchLinkedParent();
    }, [editData, schoolId]);

    useEffect(() => {
        if (editData) {
            setFormData({
                firstName: editData.firstName || '',
                lastName: editData.lastName || '',
                email: editData.email || '',
                password: '',
                phone: editData.phone || '',
                class: editData.class || '',
                section: editData.section || '',
                rollNumber: editData.rollNumber || '',
                gender: editData.gender,
                dateOfBirth: editData.dateOfBirth ? editData.dateOfBirth.split('T')[0] : '',
                address: editData.address || '',
                parentId: editData.parentId || '',
                status: editData.status || 'active',
                profileImage: editData.profileImage || '',
                signature: editData.signature || '',
            });
            // Set placeholder; real data loads via the effect above
            if (editData.parentId) {
                const nameParts = (editData.parentName || '').split(' ');
                setSelectedParent({
                    parentId: editData.parentId,
                    firstName: nameParts[0] || 'Parent',
                    lastName: nameParts.slice(1).join(' ') || '(Linked)',
                    email: '',
                    phone: '',
                } as Parent);
            }
        } else {
            setFormData({
                firstName: '', lastName: '', email: '', password: '', phone: '',
                class: '', section: '', rollNumber: '', gender: undefined,
                dateOfBirth: '', address: '', parentId: '', status: 'active',
                profileImage: '', signature: '',
            });
            setSelectedParent(null);
        }
    }, [editData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const handleParentSelect = useCallback((_: unknown, value: Parent | null) => {
        setSelectedParent(value);
        setFormData(prev => ({ ...prev, parentId: value?.parentId || '' }));
    }, []);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.class.trim()) newErrors.class = 'Class is required';
        if (!isEditMode && !formData.password.trim()) newErrors.password = 'Password is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        try {
            if (isEditMode && editData) {
                const updatePayload: Record<string, unknown> = { ...formData };
                if (!formData.password) delete updatePayload.password;
                await updateMutation.mutateAsync({ studentId: editData.studentId, data: updatePayload });
                notification.success("Student profile synchronized successfully");
            } else {
                await createMutation.mutateAsync(formData);
                notification.success("New student enrolled successfully");
            }
            handleClose();
        } catch {
            notification.error("Enrollment failed. Please check student details.");
        }
    };

    const handleClose = () => {
        setFormData({
            firstName: '', lastName: '', email: '', password: '', phone: '',
            class: '', section: '', rollNumber: '', gender: undefined,
            dateOfBirth: '', address: '', parentId: '', status: 'active',
            profileImage: '', signature: '',
        });
        setErrors({});
        setSelectedParent(null);
        setParentSearchQuery('');
        createMutation.reset();
        updateMutation.reset();
        onClose();
    };

    const isMobile = useIsMobile();
    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <Dialog 
            open={open} 
            onClose={handleClose} 
            maxWidth="md" 
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
                    {isEditMode ? 'Modify Student Profile' : 'Register New Student'}
                </Typography>
                <IconButton onClick={handleClose} size="small" edge="end">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                <DialogContent sx={{ p: { xs: 2, sm: 3 }, overflowY: 'auto' }}>
                    {createMutation.isError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {(createMutation.error as any)?.message || 'Failed to save student profile'}
                        </Alert>
                    )}

                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                        <Typography variant="overline" color="primary" sx={{ fontWeight: 800, letterSpacing: 1.2, fontSize: '0.75rem' }}>
                            Student Identity
                        </Typography>

                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                            <AppInput name="firstName" label="First Name" value={formData.firstName} onChange={handleChange} error={!!errors.firstName} helperText={errors.firstName} required />
                            <AppInput name="lastName" label="Last Name" value={formData.lastName} onChange={handleChange} error={!!errors.lastName} helperText={errors.lastName} required />
                        </Box>

                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                            <AppSelect
                                label="Gender"
                                value={formData.gender || ''}
                                options={[
                                    { value: 'male', label: 'Male' },
                                    { value: 'female', label: 'Female' },
                                    { value: 'other', label: 'Other' }
                                ]}
                                onChange={(e) => setFormData((prev) => ({ ...prev, gender: e.target.value as any }))}
                            />
                            <AppDatePicker
                                label="Date of Birth"
                                value={formData.dateOfBirth ? new Date(formData.dateOfBirth) : null}
                                onChange={(date) => setFormData((prev) => ({ ...prev, dateOfBirth: date ? format(date, 'yyyy-MM-dd') : '' }))}
                            />
                        </Box>

                        <AppInput name="email" label="Email Address" type="email" value={formData.email} onChange={handleChange} error={!!errors.email} helperText={errors.email} labelHint="Optional" />

                        <AppInput name="password" label="Portal Access Password" type="password" value={formData.password} onChange={handleChange} error={!!errors.password} helperText={errors.password} required={!isEditMode} labelHint={isEditMode ? 'Leave blank to keep current' : ''} />

                        <Divider sx={{ my: 0.5 }} />

                        <Typography variant="overline" color="primary" sx={{ fontWeight: 800, letterSpacing: 1.2, fontSize: '0.75rem' }}>
                            Academic Placement
                        </Typography>

                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
                            <AppSelect
                                label="Assign Class"
                                value={formData.class}
                                error={!!errors.class}
                                helperText={errors.class}
                                options={classes.filter((c: Class) => c.status === 'active').map((c: Class) => ({ value: c.classId, label: c.name }))}
                                onChange={(e) => setFormData(prev => ({ ...prev, class: e.target.value as string, section: '' }))}
                            />
                            <AppSelect
                                label="Select Section"
                                value={formData.section}
                                disabled={!formData.class}
                                options={[{ value: '', label: 'None' }, ...selectedClassSections.map((s: Section) => ({ value: s.sectionId, label: s.name }))]}
                                onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value as string }))}
                            />
                            <AppInput name="rollNumber" label="Roll Number" value={formData.rollNumber} onChange={handleChange} />
                        </Box>

                        <Divider sx={{ my: 0.5 }} />

                        <Typography variant="overline" color="primary" sx={{ fontWeight: 800, letterSpacing: 1.2, fontSize: '0.75rem' }}>
                            Additional Information
                        </Typography>

                        <PhoneInput name="phone" label="Contact Phone" value={formData.phone} onChange={handleChange} labelHint="Optional" />

                        <Autocomplete
                            options={parentOptions}
                            value={selectedParent}
                            onChange={handleParentSelect}
                            loading={parentLoading}
                            getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.phone || option.email || 'N/A'})`}
                            onInputChange={(_, value) => setParentSearchQuery(value)}
                            renderInput={(params) => (
                                <AppInput {...params} label="Link Parent Account" placeholder="Search by name, email, or phone..." />
                            )}
                        />

                        <AppInput name="address" label="Home Address" value={formData.address} onChange={handleChange} multiline rows={2} />

                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mt: 1 }}>
                            <ImageUpload
                                folder={IMAGEKIT_FOLDERS.PROFILE_IMAGES}
                                fileName={isEditMode && editData ? `${editData.studentId}_profile` : `new_student_profile_${Date.now()}`}
                                currentImage={formData.profileImage}
                                label="Student Photo"
                                authEndpoint="school"
                                variant="avatar"
                                size="medium"
                                onUploadSuccess={(result) => setFormData(prev => ({ ...prev, profileImage: result.url }))}
                                onRemove={() => setFormData(prev => ({ ...prev, profileImage: '' }))}
                            />
                            <ImageUpload
                                folder={IMAGEKIT_FOLDERS.SIGNATURES}
                                fileName={isEditMode && editData ? `${editData.studentId}_signature` : `new_student_signature_${Date.now()}`}
                                currentImage={formData.signature}
                                label="Signature Consent"
                                authEndpoint="school"
                                size="small"
                                onUploadSuccess={(result) => setFormData(prev => ({ ...prev, signature: result.url }))}
                                onRemove={() => setFormData(prev => ({ ...prev, signature: '' }))}
                            />
                        </Box>
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
                    <AppButton type="submit" variant="contained" loading={isPending}>
                        {isEditMode ? 'Update Profile' : 'Register Student'}
                    </AppButton>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default StudentDialog;
