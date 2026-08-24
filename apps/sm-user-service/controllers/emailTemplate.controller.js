const { EmailTemplateSchema } = require('@sms/shared/models');
const { getDefaultPlaceholders, resolvePlaceholders } = require('@sms/shared/utils');
const sanitizeHtml = require('sanitize-html');

// SECURITY (XSS/SSTI): Allowed HTML elements and attributes for email preview sanitization.
// This prevents malicious script injection via template content while preserving email-safe markup.
const emailSanitizeOptions = {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
        'html', 'head', 'body', 'meta', 'title', 'style',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'div', 'span', 'a', 'br', 'hr', 'strong', 'em', 'b', 'i',
        'ul', 'ol', 'li', 'center',
    ]),
    allowedAttributes: {
        '*': ['style', 'class', 'id', 'align', 'valign', 'width', 'height', 'cellpadding', 'cellspacing', 'border', 'bgcolor'],
        'a': ['href', 'target', 'rel'],
        'img': ['src', 'alt', 'width', 'height', 'style'],
        'td': ['colspan', 'rowspan'],
        'th': ['colspan', 'rowspan'],
        'meta': ['charset', 'name', 'content'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'data'],
    // Strip all event handlers (onclick, onerror, onload, etc.)
    allowedSchemesByTag: {},
    disallowedTagsMode: 'discard',
};

/**
 * Create a new email template
 * POST /api/school/:schoolId/email-templates
 */
const createTemplate = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { templateName, templateType, subject, htmlContent, bannerImage, placeholders, isDefault } = req.body;
        const userId = req.user.userId;

        // Check if template name already exists for this school
        const existing = await EmailTemplateSchema.findOne({ schoolId, templateName });
        if (existing) {
            return res.status(400).json({ error: 'Template with this name already exists for this school' });
        }

        // Create new template
        const template = new EmailTemplateSchema({
            schoolId,
            templateName,
            templateType,
            subject,
            htmlContent,
            bannerImage: bannerImage || null,
            placeholders: placeholders || getDefaultPlaceholders(templateType),
            isActive: true,
            isDefault: isDefault || false,
            version: 1,
            createdBy: userId,
            updatedBy: userId,
        });

        await template.save();

        res.status(201).json({
            message: 'Email template created successfully',
            template,
        });
    } catch (error) {
        console.error('Error creating email template:', error);
        res.status(500).json({ error: 'Failed to create email template', details: error.message });
    }
};

/**
 * Get all templates for a school
 * GET /api/school/:schoolId/email-templates
 */
const getTemplates = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { type, active } = req.query;

        const filter = { schoolId };
        if (type) filter.templateType = type;
        if (active !== undefined) filter.isActive = active === 'true';

        const templates = await EmailTemplateSchema.find(filter)
            .sort({ updatedAt: -1 });

        res.json({ templates, count: templates.length });
    } catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({ error: 'Failed to fetch templates', details: error.message });
    }
};

/**
 * Get single template by ID
 * GET /api/school/:schoolId/email-templates/:id
 */
const getTemplateById = async (req, res) => {
    try {
        const { schoolId, id } = req.params;

        const template = await EmailTemplateSchema.findOne({ _id: id, schoolId });

        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        res.json({ template });
    } catch (error) {
        console.error('Error fetching template:', error);
        res.status(500).json({ error: 'Failed to fetch template', details: error.message });
    }
};

/**
 * Update template by ID
 * PUT /api/school/:schoolId/email-templates/:id
 */
const updateTemplate = async (req, res) => {
    try {
        const { schoolId, id } = req.params;
        const { templateName, templateType, subject, htmlContent, bannerImage, placeholders, isActive, isDefault } = req.body;
        const userId = req.user.userId;

        const template = await EmailTemplateSchema.findOne({ _id: id, schoolId });
        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        // Check for duplicate name if changing name
        if (templateName && templateName !== template.templateName) {
            const existing = await EmailTemplateSchema.findOne({ schoolId, templateName, _id: { $ne: id } });
            if (existing) {
                return res.status(400).json({ error: 'Template with this name already exists' });
            }
        }

        // Update fields
        if (templateName) template.templateName = templateName;
        if (templateType) template.templateType = templateType;
        if (subject) template.subject = subject;
        if (htmlContent) template.htmlContent = htmlContent;
        if (bannerImage !== undefined) template.bannerImage = bannerImage;
        if (placeholders) template.placeholders = placeholders;
        if (isActive !== undefined) template.isActive = isActive;
        if (isDefault !== undefined) template.isDefault = isDefault;

        // Increment version
        template.version += 1;
        template.updatedBy = userId;

        await template.save();

        res.json({
            message: 'Template updated successfully',
            template,
        });
    } catch (error) {
        console.error('Error updating template:', error);
        res.status(500).json({ error: 'Failed to update template', details: error.message });
    }
};

/**
 * Delete template (soft delete by setting isActive to false)
 * DELETE /api/school/:schoolId/email-templates/:id
 */
const deleteTemplate = async (req, res) => {
    try {
        const { schoolId, id } = req.params;

        const template = await EmailTemplateSchema.findOne({ _id: id, schoolId });
        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        // Soft delete
        template.isActive = false;
        template.updatedBy = req.user.userId;
        await template.save();

        res.json({ message: 'Template deleted successfully' });
    } catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({ error: 'Failed to delete template', details: error.message });
    }
};

/**
 * Duplicate template
 * POST /api/school/:schoolId/email-templates/:id/duplicate
 */
const duplicateTemplate = async (req, res) => {
    try {
        const { schoolId, id } = req.params;
        const userId = req.user.userId;

        const original = await EmailTemplateSchema.findOne({ _id: id, schoolId });
        if (!original) {
            return res.status(404).json({ error: 'Template not found' });
        }

        // Create copy with "(Copy)" suffix
        const copyName = `${original.templateName} (Copy)`;
        let uniqueName = copyName;
        let counter = 1;

        // Ensure unique name
        while (await EmailTemplateSchema.findOne({ schoolId, templateName: uniqueName })) {
            uniqueName = `${copyName} ${counter}`;
            counter++;
        }

        const duplicate = new EmailTemplateSchema({
            schoolId: original.schoolId,
            templateName: uniqueName,
            templateType: original.templateType,
            subject: original.subject,
            htmlContent: original.htmlContent,
            bannerImage: original.bannerImage,
            placeholders: original.placeholders,
            isActive: true,
            isDefault: false,
            version: 1,
            createdBy: userId,
            updatedBy: userId,
        });

        await duplicate.save();

        res.status(201).json({
            message: 'Template duplicated successfully',
            template: duplicate,
        });
    } catch (error) {
        console.error('Error duplicating template:', error);
        res.status(500).json({ error: 'Failed to duplicate template', details: error.message });
    }
};

/**
 * Get available template types
 * GET /api/school/:schoolId/email-templates/types
 */
const getTemplateTypes = async (req, res) => {
    try {
        const types = [
            { value: 'welcome', label: 'Welcome Email' },
            { value: 'announcement', label: 'Announcement' },
            { value: 'student_absent', label: 'Student Absent Notification' },
            { value: 'parent_teacher_meeting', label: 'Parent-Teacher Meeting' },
            { value: 'leave_approval', label: 'Leave Approval' },
            { value: 'leave_rejection', label: 'Leave Rejection' },
            { value: 'exam_results', label: 'Exam Results' },
            { value: 'fee_reminder', label: 'Fee Reminder' },
            { value: 'custom', label: 'Custom Template' },
        ];

        res.json({ types });
    } catch (error) {
        console.error('Error fetching template types:', error);
        res.status(500).json({ error: 'Failed to fetch template types', details: error.message });
    }
};

/**
 * Get placeholders for a template type
 * GET /api/school/:schoolId/email-templates/placeholders/:type
 */
const getPlaceholdersByType = async (req, res) => {
    try {
        const { type } = req.params;
        const placeholders = getDefaultPlaceholders(type);

        // Group by category
        const grouped = placeholders.reduce((acc, placeholder) => {
            if (!acc[placeholder.category]) {
                acc[placeholder.category] = [];
            }
            acc[placeholder.category].push(placeholder);
            return acc;
        }, {});

        res.json({ placeholders: grouped });
    } catch (error) {
        console.error('Error fetching placeholders:', error);
        res.status(500).json({ error: 'Failed to fetch placeholders', details: error.message });
    }
};

/**
 * Preview template with sample data
 * POST /api/school/:schoolId/email-templates/:id/preview
 */
const previewTemplate = async (req, res) => {
    try {
        const { schoolId, id } = req.params;
        const { sampleData, subject, htmlContent, bannerImage, styleTemplate } = req.body;

        let template = null;
        if (id !== 'new') {
            template = await EmailTemplateSchema.findOne({ _id: id, schoolId });
        }

        // Use provided data or fallback to stored template
        const finalSubject = subject || template?.subject || '';
        const finalHtml = htmlContent || template?.htmlContent || '';
        const finalBanner = bannerImage || template?.bannerImage;
        const finalStyle = styleTemplate || template?.styleTemplate || 'modern';

        // Generate default sample data if not provided
        const defaultSampleData = {
            school: {
                name: 'ABC International School',
                address: '123 Education Street, City',
                phone: '+91 1234567890',
                email: 'info@abcschool.com',
            },
            student: {
                firstName: 'John',
                lastName: 'Doe',
                fullName: 'John Doe',
                rollNo: '2024001',
                class: 'Class 10',
                section: 'Section A',
                email: 'john.doe@example.com',
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
            },
            teacher: {
                firstName: 'Jane',
                lastName: 'Smith',
                fullName: 'Jane Smith',
                subject: 'Mathematics',
                phone: '+91 9876543212',
                email: 'jane.smith@abcschool.com',
            },
            date: new Date().toLocaleDateString(),
            refNo: 'REF' + Date.now(),
            customMessage: 'This is a sample preview message.',
        };

        const { resolvePlaceholders, getStyleTemplate } = require('@sms/shared/utils');

        const data = { ...defaultSampleData, ...sampleData };

        // Resolve placeholders
        const resolvedSubject = resolvePlaceholders(finalSubject, data);
        const resolvedHtml = resolvePlaceholders(finalHtml, data);

        // Apply style template
        const styledHtml = getStyleTemplate(finalStyle, resolvedHtml, {
            bannerImage: finalBanner,
            schoolName: data.school?.name || 'School',
            schoolAddress: data.school?.address,
            schoolEmail: data.school?.email,
            schoolPhone: data.school?.phone,
        });

        // SECURITY (XSS/SSTI): sanitize the fully-resolved HTML before returning to the client.
        // This strips <script> tags, event handlers, and javascript: URIs that could be injected
        // via template htmlContent stored in the database.
        const sanitizedHtml = sanitizeHtml(styledHtml, emailSanitizeOptions);

        res.json({
            subject: resolvedSubject,
            html: sanitizedHtml,
            bannerImage: finalBanner,
        });
    } catch (error) {
        console.error('Error previewing template:', error);
        res.status(500).json({ error: 'Failed to preview template', details: error.message });
    }
};

module.exports = {
    createTemplate,
    getTemplates,
    getTemplateById,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    getTemplateTypes,
    getPlaceholdersByType,
    previewTemplate,
};
