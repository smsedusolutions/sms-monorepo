const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");
const { AnnouncementSchema: announcementSchema, NotificationSchema: notificationSchema, StudentSchema: studentSchema, ParentSchema: parentSchema, TeacherSchema: teacherSchema } = require("@sms/shared");
const { sendAnnouncementEmail } = require("../utils/mailService");

// Helper to get models for a specific school
const getAnnouncementModels = (schoolDbName) => {
    const schoolDb = getSchoolDbConnection(schoolDbName);
    // Use mongoose's internal model cache - models are registered once per connection
    return {
        Announcement: schoolDb.models.Announcement || schoolDb.model('Announcement', announcementSchema),
        Notification: schoolDb.models.Notification || schoolDb.model('Notification', notificationSchema),
        Student: schoolDb.models.Student || schoolDb.model('Student', studentSchema),
        Parent: schoolDb.models.Parent || schoolDb.model('Parent', parentSchema),
        Teacher: schoolDb.models.Teacher || schoolDb.model('Teacher', teacherSchema),
    };
};

const { generateNextId } = require("@sms/shared/utils");

// Generate unique announcement ID
const generateAnnouncementId = async (AnnouncementModel) => {
    return generateNextId(AnnouncementModel, 'announcementId', 'ANN', 5);
};

// ==========================================
// CREATE ANNOUNCEMENT
// POST /api/school/:schoolId/announcements
// ==========================================
const createAnnouncement = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { title, content, category, priority, targetAudience, targetClasses, attachmentUrl, attachments, publishDate, expiryDate } = req.body;
        const { userId, role, userName } = req.user;

        // Validate required fields
        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: "Title and content are required"
            });
        }

        // Teachers can only target their classes
        if (role === 'teacher' && targetAudience !== 'specific_class') {
            return res.status(403).json({
                success: false,
                message: "Teachers can only create announcements for specific classes"
            });
        }

        const schoolDbName = await getSchoolDbName(schoolId);
        const { Announcement, Notification, Student, Parent, Teacher } = getAnnouncementModels(schoolDbName);

        // Get creator's name from database
        let creatorName = userName || 'Admin';
        if (role === 'teacher') {
            const teacher = await Teacher.findOne({ teacherId: userId }, 'firstName lastName');
            if (teacher) {
                creatorName = `${teacher.firstName} ${teacher.lastName}`;
            }
        } else if (role === 'sch_admin') {
            // For school admin, you can fetch from SchoolAdmin model if needed
            // For now, we'll use userName or default
            creatorName = userName || 'Admin';
        }

        const announcementId = await generateAnnouncementId(Announcement);

        const newAnnouncement = new Announcement({
            announcementId,
            schoolId,
            title,
            content,
            category: category || 'general',
            priority: priority || 'normal',
            targetAudience: targetAudience || 'all',
            targetClasses: targetClasses || [],
            attachments: attachments || [],
            attachmentUrl,  // Keep for backwards compatibility
            publishDate: publishDate ? new Date(publishDate) : new Date(),
            expiryDate: expiryDate ? new Date(expiryDate) : null,
            isPublished: true,
            createdBy: userId,
            createdByRole: role,
            createdByName: creatorName,
            status: 'active',
            seenBy: [],
            seenCount: 0
        });

        await newAnnouncement.save();

        // Create notifications for target audience and collect recipients
        const recipients = await createAnnouncementNotifications(
            Notification, Student, Parent, Teacher,
            schoolId, newAnnouncement, targetAudience, targetClasses
        );

        // Send announcement emails (async, don't block on failure)
        if (recipients && recipients.length > 0) {
            sendAnnouncementEmails(schoolId, newAnnouncement, recipients).catch(error => {
                console.error('Failed to send announcement emails:', error);
            });
        }

        res.status(201).json({
            success: true,
            message: "Announcement created successfully",
            data: newAnnouncement
        });
    } catch (error) {
        console.error("Create Announcement Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create announcement",
            error: error.message
        });
    }
};

// Helper: Create notifications for announcement
// Returns array of recipients for email sending
const createAnnouncementNotifications = async (Notification, Student, Parent, Teacher, schoolId, announcement, targetAudience, targetClasses) => {
    try {
        const notifications = [];
        const recipients = []; // Track recipients for email sending

        // Get target users based on audience
        let targetUsers = [];

        if (targetAudience === 'all' || targetAudience === 'students' || targetAudience === 'specific_class') {
            const studentQuery = targetAudience === 'specific_class' && targetClasses?.length > 0
                ? { schoolId, status: 'active', class: { $in: targetClasses } }
                : { schoolId, status: 'active' };
            const students = await Student.find(studentQuery, 'studentId firstName lastName class parentId email');
            students.forEach(s => {
                targetUsers.push({ userId: s.studentId, userRole: 'student', student: s });
                // Add to email recipients if student has email
                if (s.email) {
                    recipients.push({ email: s.email, name: `${s.firstName} ${s.lastName}`, role: 'student' });
                }
            });
        }

        if (targetAudience === 'all' || targetAudience === 'parents' || targetAudience === 'specific_class') {
            // Get parents of target students
            const studentIds = targetUsers.filter(u => u.userRole === 'student').map(u => u.userId);
            if (studentIds.length > 0) {
                const parents = await Parent.find({ schoolId, status: 'active', studentIds: { $in: studentIds } }, 'parentId firstName lastName email');
                parents.forEach(p => {
                    targetUsers.push({ userId: p.parentId, userRole: 'parent' });
                    // Add to email recipients if parent has email
                    if (p.email) {
                        recipients.push({ email: p.email, name: `${p.firstName} ${p.lastName}`, role: 'parent' });
                    }
                });
            } else if (targetAudience === 'parents') {
                const parents = await Parent.find({ schoolId, status: 'active' }, 'parentId firstName lastName email');
                parents.forEach(p => {
                    targetUsers.push({ userId: p.parentId, userRole: 'parent' });
                    if (p.email) {
                        recipients.push({ email: p.email, name: `${p.firstName} ${p.lastName}`, role: 'parent' });
                    }
                });
            }
        }

        if (targetAudience === 'all' || targetAudience === 'teachers') {
            const teachers = await Teacher.find({ schoolId, status: 'active' }, 'teacherId firstName lastName email');
            teachers.forEach(t => {
                targetUsers.push({ userId: t.teacherId, userRole: 'teacher' });
                // Add to email recipients if teacher has email
                if (t.email) {
                    recipients.push({ email: t.email, name: `${t.firstName} ${t.lastName}`, role: 'teacher' });
                }
            });
        }

        // Create notifications in batches
        for (const user of targetUsers) {
            const notificationId = `NOTIF${Date.now()}${Math.random().toString(36).substr(2, 5)}`;
            notifications.push({
                notificationId,
                schoolId,
                userId: user.userId,
                userRole: user.userRole,
                type: 'announcement',
                title: `New Announcement: ${announcement.title}`,
                message: announcement.content.substring(0, 100) + (announcement.content.length > 100 ? '...' : ''),
                referenceId: announcement.announcementId,
                referenceType: 'announcement',
                isRead: false,
                metadata: { category: announcement.category, priority: announcement.priority }
            });
        }

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }

        return recipients; // Return recipients for email sending
    } catch (error) {
        console.error("Error creating announcement notifications:", error);
        return []; // Return empty array on error
    }
};

/**
 * Send announcement emails to recipients
 * Runs asynchronously and logs errors without throwing
 */
const sendAnnouncementEmails = async (schoolId, announcement, recipients) => {
    try {
        console.log(`Sending announcement emails to ${recipients.length} recipients...`);

        const { sendEmail, resolvePlaceholders, getStyleTemplate } = require('@sms/shared/utils');
        const { EmailTemplateSchema, SchoolModel } = require('@sms/shared/models');

        // Fetch school details
        const school = await SchoolModel.findOne({ schoolId });
        const schoolDetails = {
            name: school?.schoolName || 'School',
            address: school?.schoolAddress || '',
            email: school?.schoolEmail || '',
            phone: school?.schoolPhone || '',
            logo: school?.schoolLogo || '',
        };

        // Try to get custom template for announcements
        let customTemplate = null;
        try {
            customTemplate = await EmailTemplateSchema.findOne({
                schoolId,
                templateType: 'announcement',
                isActive: true
            }).sort({ isDefault: -1, updatedAt: -1 });
        } catch (err) {
            console.log('No custom announcement template found, using default');
        }

        const styleTemplate = customTemplate?.styleTemplate || 'modern';
        const templateSubject = customTemplate?.subject || 'Announcement: {{announcement.title}}';
        const templateContent = customTemplate?.htmlContent || `
            <h1>{{announcement.title}}</h1>
            <p>Dear {{student.firstName || parent.father.name || teacher.fullName || 'User'}},</p>
            <p>{{announcement.message}}</p>
            <p>Best regards,<br/>{{school.name}}</p>
        `;

        // Send emails to each recipient with personalized data
        const emailPromises = recipients.map(async (recipient) => {
            try {
                // Build recipient-specific data
                const recipientData = {
                    school: schoolDetails,
                    announcement: {
                        title: announcement.title,
                        message: announcement.content,
                        content: announcement.content,
                        date: new Date(announcement.publishDate || announcement.createdAt).toLocaleDateString('en-IN'),
                    },
                };

                // Add role-specific data with both camelCase and snake_case for compatibility
                const userRole = (recipient.role || '').toLowerCase();
                if (userRole === 'student') {
                    const [firstName, ...lastNameParts] = (recipient.name || '').split(' ');
                    const lastName = lastNameParts.join(' ');
                    recipientData.student = {
                        firstName, first_name: firstName,
                        lastName, last_name: lastName,
                        fullName: recipient.name, full_name: recipient.name
                    };
                } else if (userRole === 'parent') {
                    recipientData.parent = {
                        father: { name: recipient.name },
                        mother: { name: recipient.name }, // Fallback
                        guardian: { name: recipient.name } // Fallback
                    };
                } else if (userRole === 'teacher') {
                    const [firstName, ...lastNameParts] = (recipient.name || '').split(' ');
                    const lastName = lastNameParts.join(' ');
                    recipientData.teacher = {
                        firstName, first_name: firstName,
                        lastName, last_name: lastName,
                        fullName: recipient.name, full_name: recipient.name
                    };
                }

                // Resolve placeholders
                const resolvedSubject = resolvePlaceholders(templateSubject, recipientData);
                const resolvedContent = resolvePlaceholders(templateContent, recipientData);

                // Apply style template
                const styledHTML = getStyleTemplate(styleTemplate, resolvedContent, {
                    bannerImage: customTemplate?.bannerImage || recipientData.school.logo,
                    schoolName: recipientData.school.name,
                    schoolAddress: recipientData.school.address,
                    schoolEmail: recipientData.school.email,
                    schoolPhone: recipientData.school.phone,
                });

                // Format attachments for email (if any)
                const emailAttachments = announcement.attachments?.map(att => ({
                    filename: att.fileName,
                    path: att.url  // ImageKit CDN URL - Nodemailer will fetch this
                })) || [];

                // Send email
                await sendEmail({
                    to: recipient.email,
                    subject: resolvedSubject,
                    html: styledHTML,
                    from: recipientData.school.name,
                    attachments: emailAttachments  // Include attachments
                });

                return { success: true, email: recipient.email };
            } catch (error) {
                console.error(`Failed to send announcement to ${recipient.email}:`, error.message);
                return { success: false, email: recipient.email, error: error.message };
            }
        });

        const results = await Promise.allSettled(emailPromises);

        const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        const failCount = results.length - successCount;

        console.log(`Announcement emails sent: ${successCount} succeeded, ${failCount} failed`);
    } catch (error) {
        console.error('Error in sendAnnouncementEmails:', error);
    }
};

// ==========================================
// GET ALL ANNOUNCEMENTS
// GET /api/school/:schoolId/announcements
// ==========================================
const getAllAnnouncements = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { category, status, page = 1, limit = 20 } = req.query;
        const { role, userId, classId, studentId } = req.user;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { Announcement, Student } = getAnnouncementModels(schoolDbName);

        let query = { schoolId, status: status || 'active', isPublished: true };

        // Filter by category if provided
        if (category) {
            query.category = category;
        }

        // Filter expiry date
        query.$or = [
            { expiryDate: null },
            { expiryDate: { $gte: new Date() } }
        ];

        // Role-based filtering
        if (role === 'student') {
            const student = await Student.findOne({ studentId: userId || studentId });
            query.$and = [
                {
                    $or: [
                        { targetAudience: 'all' },
                        { targetAudience: 'students' },
                        { targetAudience: 'specific_class', targetClasses: student?.class }
                    ]
                }
            ];
        } else if (role === 'parent') {
            // Get parent's children classes
            const students = await Student.find({ parentId: userId }, 'class');
            const classes = [...new Set(students.map(s => s.class))];
            query.$and = [
                {
                    $or: [
                        { targetAudience: 'all' },
                        { targetAudience: 'parents' },
                        { targetAudience: 'specific_class', targetClasses: { $in: classes } }
                    ]
                }
            ];
        } else if (role === 'teacher') {
            query.$and = [
                {
                    $or: [
                        { targetAudience: 'all' },
                        { targetAudience: 'teachers' },
                        { createdBy: userId }
                    ]
                }
            ];
        }
        // sch_admin sees all

        const announcements = await Announcement.find(query)
            .sort({ publishDate: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        // Add isSeen flag for each announcement based on current user
        const announcementsWithSeenStatus = announcements.map(announcement => {
            const announcementObj = announcement.toObject();
            const seenByUser = announcement.seenBy?.some(s => s.userId === userId);
            return {
                ...announcementObj,
                isSeen: seenByUser || false
            };
        });

        const total = await Announcement.countDocuments(query);

        res.status(200).json({
            success: true,
            message: "Announcements fetched successfully",
            data: announcementsWithSeenStatus,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Get Announcements Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch announcements",
            error: error.message
        });
    }
};

// ==========================================
// GET MY ANNOUNCEMENTS (Teacher)
// GET /api/school/:schoolId/announcements/my
// ==========================================
const getMyAnnouncements = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { userId } = req.user;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { Announcement } = getAnnouncementModels(schoolDbName);

        const announcements = await Announcement.find({
            schoolId,
            createdBy: userId
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: "My announcements fetched successfully",
            data: announcements
        });
    } catch (error) {
        console.error("Get My Announcements Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch announcements",
            error: error.message
        });
    }
};

// ==========================================
// GET ANNOUNCEMENT BY ID
// GET /api/school/:schoolId/announcements/:announcementId
// ==========================================
const getAnnouncementById = async (req, res) => {
    try {
        const { schoolId, announcementId } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { Announcement } = getAnnouncementModels(schoolDbName);

        const announcement = await Announcement.findOne({ schoolId, announcementId });

        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: "Announcement not found"
            });
        }

        res.status(200).json({
            success: true,
            data: announcement
        });
    } catch (error) {
        console.error("Get Announcement Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch announcement",
            error: error.message
        });
    }
};

// ==========================================
// UPDATE ANNOUNCEMENT
// PUT /api/school/:schoolId/announcements/:announcementId
// ==========================================
const updateAnnouncement = async (req, res) => {
    try {
        const { schoolId, announcementId } = req.params;
        const { userId, role } = req.user;
        const updates = req.body;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { Announcement } = getAnnouncementModels(schoolDbName);

        const announcement = await Announcement.findOne({ schoolId, announcementId });

        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: "Announcement not found"
            });
        }

        // Only creator or admin can update
        if (role !== 'sch_admin' && announcement.createdBy !== userId) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to update this announcement"
            });
        }

        // Update allowed fields
        const allowedUpdates = ['title', 'content', 'category', 'priority', 'targetAudience', 'targetClasses', 'attachmentUrl', 'expiryDate', 'isPublished', 'status'];
        allowedUpdates.forEach(field => {
            if (updates[field] !== undefined) {
                announcement[field] = updates[field];
            }
        });

        await announcement.save();

        res.status(200).json({
            success: true,
            message: "Announcement updated successfully",
            data: announcement
        });
    } catch (error) {
        console.error("Update Announcement Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update announcement",
            error: error.message
        });
    }
};

// ==========================================
// DELETE (ARCHIVE) ANNOUNCEMENT
// DELETE /api/school/:schoolId/announcements/:announcementId
// ==========================================
const deleteAnnouncement = async (req, res) => {
    try {
        const { schoolId, announcementId } = req.params;
        const { userId, role } = req.user;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { Announcement } = getAnnouncementModels(schoolDbName);

        const announcement = await Announcement.findOne({ schoolId, announcementId });

        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: "Announcement not found"
            });
        }

        // Only creator or admin can delete
        if (role !== 'sch_admin' && announcement.createdBy !== userId) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to delete this announcement"
            });
        }

        announcement.status = 'archived';
        await announcement.save();

        res.status(200).json({
            success: true,
            message: "Announcement archived successfully"
        });
    } catch (error) {
        console.error("Delete Announcement Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete announcement",
            error: error.message
        });
    }
};

// ==========================================
// MARK ANNOUNCEMENT AS SEEN
// POST /api/school/:schoolId/announcements/:announcementId/seen
// ==========================================
const markAnnouncementAsSeen = async (req, res) => {
    try {
        const { schoolId, announcementId } = req.params;
        const { userId, role } = req.user;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { Announcement } = getAnnouncementModels(schoolDbName);

        const announcement = await Announcement.findOne({ schoolId, announcementId });

        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: "Announcement not found"
            });
        }

        // Check if user has already seen this announcement
        const alreadySeen = announcement.seenBy.some(s => s.userId === userId);

        if (!alreadySeen) {
            announcement.seenBy.push({
                userId,
                userRole: role,
                seenAt: new Date()
            });
            announcement.seenCount = announcement.seenBy.length;
            await announcement.save();
        }

        res.status(200).json({
            success: true,
            message: "Announcement marked as seen"
        });
    } catch (error) {
        console.error("Mark Announcement Seen Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to mark announcement as seen",
            error: error.message
        });
    }
};

// ==========================================
// GET ANNOUNCEMENT SEEN STATUS
// GET /api/school/:schoolId/announcements/:announcementId/seen-status
// ==========================================
const getAnnouncementSeenStatus = async (req, res) => {
    try {
        const { schoolId, announcementId } = req.params;
        const { role } = req.user;

        // Only admin and teachers (who created it) can view seen status
        if (role !== 'sch_admin' && role !== 'teacher') {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        const schoolDbName = await getSchoolDbName(schoolId);
        const { Announcement } = getAnnouncementModels(schoolDbName);

        const announcement = await Announcement.findOne(
            { schoolId, announcementId },
            'seenBy seenCount targetAudience targetClasses'
        );

        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: "Announcement not found"
            });
        }

        res.status(200).json({
            success: true,
            data: {
                seenBy: announcement.seenBy,
                seenCount: announcement.seenCount,
                targetAudience: announcement.targetAudience,
                targetClasses: announcement.targetClasses
            }
        });
    } catch (error) {
        console.error("Get Announcement Seen Status Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch announcement seen status",
            error: error.message
        });
    }
};

module.exports = {
    createAnnouncement,
    getAllAnnouncements,
    getMyAnnouncements,
    getAnnouncementById,
    updateAnnouncement,
    deleteAnnouncement,
    markAnnouncementAsSeen,
    getAnnouncementSeenStatus,
};
