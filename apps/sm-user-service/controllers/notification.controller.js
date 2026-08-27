const axios = require("axios");
const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");
const {
    NotificationSchema: notificationSchema,
    StudentSchema: studentSchema,
    ParentSchema: parentSchema,
    TeacherSchema: teacherSchema,
} = require("@sms/shared");

// Helper to get Notification model for a specific school
const getNotificationModel = (schoolDbName) => {
    const schoolDb = getSchoolDbConnection(schoolDbName);
    // Use mongoose's internal model cache - models are registered once per connection
    return schoolDb.models.Notification || schoolDb.model('Notification', notificationSchema);
};

// Generate notification ID
const generateNotificationId = () => {
    return `NOTIF${Date.now()}${Math.random().toString(36).substr(2, 5)}`;
};

/**
 * Dispatches notification(s) to sm-notification-service for real-time WebSocket and Web Push delivery
 * Non-blocking: failures are logged without interrupting the caller
 */
const dispatchRealtimePush = async (notifications) => {
    try {
        const notifServiceUrl = process.env.NOTIFICATION_SERVICE_URL;
        const secret = process.env.INTERNAL_SECRET;

        if (!notifServiceUrl || !secret) {
            console.warn("⚠️ [sm-user-service] NOTIFICATION_SERVICE_URL or INTERNAL_SECRET not set in env - skipping push.");
            return;
        }

        const payload = Array.isArray(notifications)
            ? { notifications }
            : { notifications: [notifications] };

        await axios.post(`${notifServiceUrl}/internal/notify`, payload, {
            headers: {
                "Content-Type": "application/json",
                "X-Internal-Secret": secret,
            },
            timeout: 4000,
        });
    } catch (err) {
        console.warn(
            "⚠️ [sm-user-service] Failed to dispatch real-time/push notification:",
            err.response?.data?.message || err.message
        );
    }
};

// ==========================================
// GET MY NOTIFICATIONS
// GET /api/school/:schoolId/notifications
// ==========================================
const getMyNotifications = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { userId, role, parentId, studentId, teacherId } = req.user;
        const { isRead, type, page = 1, limit = 20 } = req.query;

        const schoolDbName = await getSchoolDbName(schoolId);
        const Notification = getNotificationModel(schoolDbName);

        // Determine the actual user ID based on role
        let actualUserId = userId;
        if (role === 'parent' && parentId) actualUserId = parentId;
        if (role === 'student' && studentId) actualUserId = studentId;
        if (role === 'teacher' && teacherId) actualUserId = teacherId;

        let query = { userId: actualUserId };

        // SECURITY (NoSQL Injection): Only accept plain scalar values for query filters.
        // Reject objects like {"$gt": ""} that could manipulate Mongoose queries.
        if (isRead !== undefined && typeof isRead === 'string') {
            query.isRead = isRead === 'true';
        }
        if (type && typeof type === 'string') {
            query.type = type;
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Notification.countDocuments(query);

        res.status(200).json({
            success: true,
            message: "Notifications fetched successfully",
            data: notifications,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Get Notifications Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch notifications",
            error: error.message
        });
    }
};

// ==========================================
// GET UNREAD COUNT
// GET /api/school/:schoolId/notifications/unread-count
// ==========================================
const getUnreadCount = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { userId, role, parentId, studentId, teacherId } = req.user;

        const schoolDbName = await getSchoolDbName(schoolId);
        const Notification = getNotificationModel(schoolDbName);

        // Determine the actual user ID based on role
        let actualUserId = userId;
        if (role === 'parent' && parentId) actualUserId = parentId;
        if (role === 'student' && studentId) actualUserId = studentId;
        if (role === 'teacher' && teacherId) actualUserId = teacherId;

        const count = await Notification.countDocuments({
            userId: actualUserId,
            isRead: false
        });

        res.status(200).json({
            success: true,
            data: { unreadCount: count }
        });
    } catch (error) {
        console.error("Get Unread Count Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get unread count",
            error: error.message
        });
    }
};

// ==========================================
// MARK NOTIFICATION AS READ
// PUT /api/school/:schoolId/notifications/:notificationId/read
// ==========================================
const markAsRead = async (req, res) => {
    try {
        const { schoolId, notificationId } = req.params;
        const { userId, role, parentId, studentId, teacherId } = req.user;

        const schoolDbName = await getSchoolDbName(schoolId);
        const Notification = getNotificationModel(schoolDbName);

        // Determine the actual user ID based on role
        let actualUserId = userId;
        if (role === 'parent' && parentId) actualUserId = parentId;
        if (role === 'student' && studentId) actualUserId = studentId;
        if (role === 'teacher' && teacherId) actualUserId = teacherId;

        const notification = await Notification.findOneAndUpdate(
            { notificationId, userId: actualUserId },
            { isRead: true, readAt: new Date() },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Notification marked as read",
            data: notification
        });
    } catch (error) {
        console.error("Mark As Read Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to mark notification as read",
            error: error.message
        });
    }
};

// ==========================================
// MARK ALL AS READ
// PUT /api/school/:schoolId/notifications/mark-all-read
// ==========================================
const markAllAsRead = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { userId, role, parentId, studentId, teacherId } = req.user;

        const schoolDbName = await getSchoolDbName(schoolId);
        const Notification = getNotificationModel(schoolDbName);

        // Determine the actual user ID based on role
        let actualUserId = userId;
        if (role === 'parent' && parentId) actualUserId = parentId;
        if (role === 'student' && studentId) actualUserId = studentId;
        if (role === 'teacher' && teacherId) actualUserId = teacherId;

        const result = await Notification.updateMany(
            { userId: actualUserId, isRead: false },
            { isRead: true, readAt: new Date() }
        );

        res.status(200).json({
            success: true,
            message: `${result.modifiedCount} notifications marked as read`
        });
    } catch (error) {
        console.error("Mark All As Read Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to mark all notifications as read",
            error: error.message
        });
    }
};

// ==========================================
// DELETE NOTIFICATION
// DELETE /api/school/:schoolId/notifications/:notificationId
// ==========================================
const deleteNotification = async (req, res) => {
    try {
        const { schoolId, notificationId } = req.params;
        const { userId, role, parentId, studentId, teacherId } = req.user;

        const schoolDbName = await getSchoolDbName(schoolId);
        const Notification = getNotificationModel(schoolDbName);

        // Determine the actual user ID based on role
        let actualUserId = userId;
        if (role === 'parent' && parentId) actualUserId = parentId;
        if (role === 'student' && studentId) actualUserId = studentId;
        if (role === 'teacher' && teacherId) actualUserId = teacherId;

        const notification = await Notification.findOneAndDelete({
            notificationId,
            userId: actualUserId
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Notification deleted successfully"
        });
    } catch (error) {
        console.error("Delete Notification Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete notification",
            error: error.message
        });
    }
};

// ==========================================
// CREATE NOTIFICATION (Internal Use)
// Used by other controllers to create notifications
// ==========================================
const createNotification = async (schoolDbName, notificationData) => {
    try {
        const Notification = getNotificationModel(schoolDbName);
        const notification = new Notification({
            notificationId: generateNotificationId(),
            ...notificationData
        });
        await notification.save();

        // Asynchronously dispatch real-time WebSocket and Web Push
        dispatchRealtimePush(notification.toObject ? notification.toObject() : notification);

        return notification;
    } catch (error) {
        console.error("Create Notification Error:", error);
        throw error;
    }
};

// ==========================================
// CREATE MULTIPLE NOTIFICATIONS (Internal Use)
// Used for bulk notification creation
// ==========================================
const createBulkNotifications = async (schoolDbName, notifications) => {
    try {
        const Notification = getNotificationModel(schoolDbName);
        const notificationsWithIds = notifications.map(n => ({
            notificationId: generateNotificationId(),
            ...n
        }));
        await Notification.insertMany(notificationsWithIds);

        // Asynchronously dispatch real-time WebSocket and Web Push in bulk
        dispatchRealtimePush(notificationsWithIds);

        return notificationsWithIds;
    } catch (error) {
        console.error("Create Bulk Notifications Error:", error);
        throw error;
    }
};

// ==========================================
// SEND CHAT INVITE NOTIFICATION
// POST /api/school/:schoolId/notifications/chat-invite
// ==========================================
const sendChatInviteNotification = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { recipientId, recipientRole, inviterName, inviterRole, inviterId, roomId } = req.body;

        if (!recipientId) {
            return res.status(400).json({
                success: false,
                message: "recipientId is required"
            });
        }

        const schoolDbName = await getSchoolDbName(schoolId);
        const Notification = getNotificationModel(schoolDbName);

        const targetRole = (recipientRole || (recipientId.startsWith("PAR") ? "parent" : "teacher")).toLowerCase();

        const newNotification = new Notification({
            notificationId: generateNotificationId(),
            schoolId,
            userId: recipientId,
            userRole: targetRole,
            type: "chat_invite",
            title: "New Chat Invitation 💬",
            message: `${inviterName || "A contact"} (${inviterRole || "Contact"}) invited you to start a secure end-to-end encrypted chat.`,
            referenceId: roomId || recipientId,
            referenceType: "chat",
            isRead: false,
            metadata: {
                inviterId: inviterId || req.user?.userId || req.user?.teacherId || req.user?.parentId,
                inviterName: inviterName || "Contact",
                inviterRole: inviterRole || "Contact",
                partnerId: inviterId || req.user?.userId || req.user?.teacherId || req.user?.parentId,
                roomId,
            }
        });

        await newNotification.save();

        // Asynchronously dispatch real-time WebSocket and Web Push
        dispatchRealtimePush(newNotification.toObject ? newNotification.toObject() : newNotification);

        console.log(`📩 [notification-controller] Chat invite notification sent to ${recipientId} by ${inviterName}`);

        return res.status(201).json({
            success: true,
            message: "Chat invitation notification sent successfully",
            data: newNotification
        });
    } catch (error) {
        console.error("❌ Send Chat Invite Notification Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to send chat invite notification",
            error: error.message
        });
    }
};

/**
 * POST /api/school/:schoolId/notifications/broadcast
 * Broadcasts a push & in-app notification to all users/devices in the school
 * Allowed roles: sch_admin, principal, super_admin, admin
 */
const broadcastNotification = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { role, userId } = req.user;

        // Permissions check
        const allowedRoles = ["sch_admin", "principal", "super_admin", "admin"];
        if (!allowedRoles.includes(role)) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: Only school administrators can broadcast notifications.",
            });
        }

        const {
            title = "📢 School Broadcast Alert",
            message = "This is a broadcast notification sent to all registered devices.",
            targetAudience = "all", // "all" | "parents" | "teachers" | "students"
            type = "system_alert",
            url,
        } = req.body;

        const schoolDbName = await getSchoolDbName(schoolId);
        const schoolDb = getSchoolDbConnection(schoolDbName);

        const Notification = schoolDb.models.Notification || schoolDb.model("Notification", notificationSchema);
        const Student = schoolDb.models.Student || schoolDb.model("Student", studentSchema);
        const Parent = schoolDb.models.Parent || schoolDb.model("Parent", parentSchema);
        const Teacher = schoolDb.models.Teacher || schoolDb.model("Teacher", teacherSchema);

        const targetUsers = [];

        if (targetAudience === "all" || targetAudience === "parents") {
            const parents = await Parent.find({ schoolId, status: "active" }, "parentId firstName lastName").lean();
            parents.forEach((p) => targetUsers.push({ userId: p.parentId, userRole: "parent" }));
        }

        if (targetAudience === "all" || targetAudience === "teachers") {
            const teachers = await Teacher.find({ schoolId, status: "active" }, "teacherId firstName lastName").lean();
            teachers.forEach((t) => targetUsers.push({ userId: t.teacherId, userRole: "teacher" }));
        }

        if (targetAudience === "all" || targetAudience === "students") {
            const students = await Student.find({ schoolId, status: "active" }, "studentId firstName lastName").lean();
            students.forEach((s) => targetUsers.push({ userId: s.studentId, userRole: "student" }));
        }

        // Also notify the admin themselves
        if (userId) {
            const normalizedRole = role === "admin" ? "sch_admin" : role;
            targetUsers.push({ userId, userRole: normalizedRole });
        }

        // Deduplicate target users by userId
        const uniqueUsers = Array.from(new Map(targetUsers.map((u) => [u.userId, u])).values());

        const validTypes = [
            'absence_alert', 'leave_status', 'announcement', 'homework_assigned',
            'homework_due', 'exam_scheduled', 'result_published', 'bus_departed',
            'child_picked', 'child_dropped', 'bus_reached_school', 'bus_delayed',
            'transport_update', 'chat_invite', 'chat_accepted', 'system_alert'
        ];
        const notifType = validTypes.includes(type) ? type : 'announcement';

        const notifications = uniqueUsers.map((u) => ({
            notificationId: generateNotificationId(),
            schoolId,
            userId: u.userId,
            userRole: u.userRole === "admin" ? "sch_admin" : u.userRole,
            type: notifType,
            title,
            message,
            url: url || (u.userRole === "parent" ? "/parent/notifications" : u.userRole === "teacher" ? "/teacher/notifications" : "/student/notifications"),
            referenceId: schoolId,
            referenceType: "school_broadcast",
            isRead: false,
            metadata: {
                broadcastedBy: userId,
                broadcastTime: new Date().toISOString(),
                targetAudience,
            },
        }));

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
            // Dispatch Web Push + WebSocket to all devices
            await dispatchRealtimePush(notifications);
        }

        console.log(`📢 [notification-controller] Broadcast sent to ${uniqueUsers.length} user(s) in school ${schoolId}`);

        return res.status(200).json({
            success: true,
            message: `Notification broadcast dispatched to ${uniqueUsers.length} recipient(s) across all devices!`,
            recipientsCount: uniqueUsers.length,
            targetAudience,
        });
    } catch (error) {
        console.error("❌ Broadcast Notification Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to broadcast notification",
            error: error.message,
        });
    }
};

module.exports = {
    getMyNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    createBulkNotifications,
    dispatchRealtimePush,
    sendChatInviteNotification,
    generateNotificationId,
    broadcastNotification,
};
