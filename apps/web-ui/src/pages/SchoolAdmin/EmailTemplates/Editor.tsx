import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    TextField,
    Button,
    Stack,
    Grid,
    IconButton,
    Tooltip,
    Divider,
    FormControlLabel,
    Switch,
    Alert,
    CircularProgress,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import {
    ArrowBack as BackIcon,
    Save as SaveIcon,
    Visibility as PreviewIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useEmailTemplate, useUpdateEmailTemplate, usePlaceholders, usePreviewTemplate } from '../../../queries/EmailTemplate';
import TokenService from '../../../queries/token/tokenService';
import type { UpdateEmailTemplateInput, Placeholder } from '../../../types/emailTemplate';
import { ImageUpload } from '../../../components/ImageUpload';
import { IMAGEKIT_FOLDERS } from '../../../utils/imagekit';
import DOMPurify from 'dompurify';

const EmailTemplateEditor: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const schoolId = TokenService.getSchoolId() || '';
    const navigate = useNavigate();

    const { data: template, isLoading, error } = useEmailTemplate(schoolId, id);
    const updateTemplate = useUpdateEmailTemplate(schoolId, id!);
    const { data: placeholdersByCategory } = usePlaceholders(schoolId, template?.templateType);
    const previewMutation = usePreviewTemplate(schoolId, id!);

    const [formData, setFormData] = useState<UpdateEmailTemplateInput>({
        templateName: '',
        subject: '',
        htmlContent: '',
        isActive: true,
        isDefault: false,
        styleTemplate: 'modern' as const,
    });

    const [previewOpen, setPreviewOpen] = useState(false);

    useEffect(() => {
        if (template) {
            setFormData({
                templateName: template.templateName,
                subject: template.subject,
                htmlContent: template.htmlContent,
                isActive: template.isActive,
                isDefault: template.isDefault,
                bannerImage: template.bannerImage,
                styleTemplate: template.styleTemplate || 'modern',
            });
        }
    }, [template]);

    const handleSave = async () => {
        try {
            await updateTemplate.mutateAsync(formData);
        } catch (err) {
            console.error('Error updating template:', err);
        }
    };

    const handlePreview = async () => {
        try {
            await previewMutation.mutateAsync({
                subject: formData.subject,
                htmlContent: formData.htmlContent,
                bannerImage: formData.bannerImage,
                styleTemplate: formData.styleTemplate,
                sampleData: {
                    school: {
                        name: 'Springfield International School',
                        address: '123 Education Street, Springfield, State - 442001',
                        phone: '+91 1234567890',
                        email: 'info@springfield-school.com',
                        logo: 'https://via.placeholder.com/150x50/4CAF50/FFFFFF?text=School+Logo',
                    },
                    student: {
                        firstName: 'John',
                        lastName: 'Doe',
                        fullName: 'John Doe',
                        rollNo: '2024001',
                        class: 'Class 10',
                        section: 'Section A',
                        email: 'john.doe@student.springfield-school.com',
                    },
                    parent: {
                        father: {
                            name: 'Michael Doe',
                            phone: '+91 9876543210',
                        },
                        mother: {
                            name: 'Sarah Doe',
                            phone: '+91 9876543211',
                        },
                        guardian: {
                            name: 'Robert Anderson',
                            phone: '+91 9876543212',
                        },
                    },
                    teacher: {
                        firstName: 'Jane',
                        lastName: 'Smith',
                        fullName: 'Jane Smith',
                        subject: 'Mathematics',
                        phone: '+91 9123456789',
                        email: 'jane.smith@springfield-school.com',
                    },
                    // Type-specific placeholders
                    leave: {
                        startDate: '2024-02-15',
                        endDate: '2024-02-20',
                        reason: 'Family function',
                        rejectionReason: 'Insufficient documentation provided',
                    },
                    exam: {
                        name: 'Mid-Term Examination 2024',
                        totalMarks: '500',
                        obtainedMarks: '425',
                        percentage: '85%',
                    },
                    fee: {
                        amount: '₹15,000',
                        dueDate: '2024-03-31',
                        type: 'Quarterly Tuition Fee',
                    },
                    meeting: {
                        date: '2024-02-25',
                        time: '10:00 AM',
                        venue: 'School Auditorium, Main Building',
                    },
                    absence: {
                        date: '2024-01-22',
                        period: 'Morning Session (Period 1-4)',
                    },
                    // Common/custom placeholders
                    date: new Date().toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }),
                    refNo: 'REF-2024-00123',
                    customMessage: 'This is a sample custom message for demonstration purposes.',
                },
            });
            setPreviewOpen(true);
        } catch (err) {
            console.error('Error generating preview:', err);
        }
    };

    const insertPlaceholder = (key: string) => {
        const placeholder = `{{${key}}}`;
        setFormData(prev => ({
            ...prev,
            htmlContent: prev.htmlContent + ' ' + placeholder
        }));
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !template) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Failed to load template. It may not exist or you don't have permission.</Alert>
                <Button startIcon={<BackIcon />} onClick={() => navigate('/school-admin/email-templates')} sx={{ mt: 2 }}>
                    Back to List
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton onClick={() => navigate('/school-admin/email-templates')}>
                        <BackIcon />
                    </IconButton>
                    <Box>
                        <Typography variant="h4" fontWeight={600}>
                            Edit Template
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {template.templateName} • {template.templateType}
                        </Typography>
                    </Box>
                </Box>
                <Stack direction="row" spacing={2}>
                    <Button
                        variant="outlined"
                        startIcon={<PreviewIcon />}
                        onClick={handlePreview}
                        disabled={previewMutation.isPending}
                    >
                        {previewMutation.isPending ? 'Loading...' : 'Preview'}
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        disabled={updateTemplate.isPending}
                    >
                        {updateTemplate.isPending ? 'Saving...' : 'Save Template'}
                    </Button>
                </Stack>
            </Box>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, lg: 8 }}>
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Stack spacing={3}>
                                <TextField
                                    fullWidth
                                    label="Template Name"
                                    value={formData.templateName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, templateName: e.target.value }))}
                                />
                                <TextField
                                    fullWidth
                                    label="Email Subject"
                                    value={formData.subject}
                                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                                    helperText="Use {{variable}} for dynamic content"
                                />

                                {/* Banner Image Upload */}
                                <Box>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Banner Image (Optional)
                                    </Typography>
                                    <ImageUpload
                                        folder={IMAGEKIT_FOLDERS.EMAIL_BANNERS}
                                        fileName={`${schoolId}_${template.templateType}_${Date.now()}`}
                                        currentImage={formData.bannerImage}
                                        label="Upload Banner"
                                        authEndpoint="school"
                                        size="large"
                                        variant="card"
                                        onUploadSuccess={(result: { url: string; fileId: string; name: string }) => {
                                            setFormData(prev => ({ ...prev, bannerImage: result.url }));
                                        }}
                                        onRemove={() => {
                                            setFormData(prev => ({ ...prev, bannerImage: '' }));
                                        }}
                                    />
                                </Box>

                                <Box>
                                    <Typography variant="subtitle2" gutterBottom>
                                        HTML Content
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={15}
                                        value={formData.htmlContent}
                                        onChange={(e) => setFormData(prev => ({ ...prev, htmlContent: e.target.value }))}
                                        placeholder="Enter your email HTML here..."
                                        sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                                    />
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                                        Click placeholder chips on the right to insert dynamic content
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, lg: 4 }}>
                    <Stack spacing={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Template Settings
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                <Stack spacing={2}>
                                    <Box>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Visual Style
                                        </Typography>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Email Style</InputLabel>
                                            <Select
                                                value={formData.styleTemplate || 'modern'}
                                                label="Email Style"
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    styleTemplate: e.target.value as 'modern' | 'classic' | 'professional' | 'vibrant' | 'minimal'
                                                }))}
                                            >
                                                <MenuItem value="modern">✨ Modern (Purple Gradient)</MenuItem>
                                                <MenuItem value="classic">🎓 Classic (Navy & Gold)</MenuItem>
                                                <MenuItem value="professional">💼 Professional (Clean Minimal)</MenuItem>
                                                <MenuItem value="vibrant">🎨 Vibrant (Colorful)</MenuItem>
                                                <MenuItem value="minimal">📝 Minimal (Black & White)</MenuItem>
                                            </Select>
                                        </FormControl>
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                            Applies professional styling to your email (colors, fonts, spacing)
                                        </Typography>
                                    </Box>

                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={formData.isActive}
                                                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                            />
                                        }
                                        label="Active"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={formData.isDefault}
                                                onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                                            />
                                        }
                                        label="Default School Template"
                                    />
                                </Stack>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Placeholders
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                                    Click a placeholder to insert it into the template
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                {placeholdersByCategory && Object.entries(placeholdersByCategory).map(([category, items]) => (
                                    <Box key={category} sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" sx={{ mb: 1, textTransform: 'capitalize', fontWeight: 600 }}>
                                            {category}
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                            {(items as Placeholder[]).map((p) => (
                                                <Tooltip key={p.key} title={`{{${p.key}}}`}>
                                                    <Chip
                                                        label={p.label}
                                                        size="small"
                                                        onClick={() => insertPlaceholder(p.key)}
                                                        sx={{ cursor: 'pointer' }}
                                                        color="primary"
                                                        variant="outlined"
                                                    />
                                                </Tooltip>
                                            ))}
                                        </Box>
                                    </Box>
                                ))}
                            </CardContent>
                        </Card>
                    </Stack>
                </Grid>
            </Grid>

            {/* Preview Dialog */}
            <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">Email Preview</Typography>
                        <Typography variant="caption" color="text.secondary">
                            {previewMutation.data?.subject}
                        </Typography>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    {previewMutation.data ? (
                        <Box>
                            {/* Subject */}
                            <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                                <Typography variant="caption" color="text.secondary">Subject:</Typography>
                                <Typography variant="body1" fontWeight={600}>{previewMutation.data.subject}</Typography>
                            </Box>

                            {/* Email Body */}
                            <Box
                                sx={{
                                    bgcolor: 'white',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                    overflow: 'auto',
                                    maxHeight: '60vh',
                                }}
                                // SECURITY (XSS): sanitize server-returned HTML before rendering
                                // to strip any <script> tags or event handlers injected via template content
                                dangerouslySetInnerHTML={{
                                    __html: DOMPurify.sanitize(previewMutation.data.html, {
                                        ADD_TAGS: ['style'],
                                        FORCE_BODY: true,
                                    })
                                }}
                            />
                        </Box>
                    ) : (
                        <Alert severity="info">Preview not available</Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPreviewOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default EmailTemplateEditor;
