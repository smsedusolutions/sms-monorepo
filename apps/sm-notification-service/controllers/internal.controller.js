const { sendToUser } = require("../websocket/wsGateway");
const { sendPushToSubscriptions } = require("../utils/webPush");
const PushSubscription = require("../models/pushSubscription.model");

/**
 * Determine navigation URL based on notification payload if url is not explicitly provided
 */
const resolveNotificationUrl = (notif) => {
  if (notif.url) return notif.url;

  const role = (notif.userRole || "").toLowerCase();
  const prefix =
    role === "parent"
      ? "/parent"
      : role === "student"
      ? "/student"
      : role === "teacher"
      ? "/teacher"
      : "/school-admin";

  switch (notif.type) {
    case "announcement":
      return `${prefix}/announcements`;
    case "homework_assigned":
    case "homework_due":
      return `${prefix}/homework`;
    case "absence_alert":
      return role === "parent" ? "/parent/attendance" : "/student/attendance";
    case "leave_status":
      return role === "parent"
        ? "/parent/leave/history"
        : role === "student"
        ? "/student/leave/my"
        : role === "teacher"
        ? "/teacher/leave/students"
        : "/school-admin/leaverequest";
    case "exam_scheduled":
      return role === "parent" ? "/parent/exam/schedule" : "/student/exam/schedule";
    case "result_published":
      return role === "parent" ? "/parent/exam/results" : "/student/exam/results";
    case "chat_invite":
    case "chat_accepted":
      return "/chat";
    case "bus_departed":
    case "child_picked":
    case "child_dropped":
    case "bus_reached_school":
    case "bus_delayed":
    case "transport_update":
      return role === "parent" ? "/parent/transport" : `${prefix}/transport`;
    default:
      return `${prefix}/notifications`;
  }
};

/**
 * POST /internal/notify
 * Dispatches notification(s) via real-time WebSocket and background Web Push
 */
const handleInternalNotify = async (req, res) => {
  try {
    const body = req.body || {};
    // Normalize into array of notifications
    const notifications = Array.isArray(body.notifications)
      ? body.notifications
      : body.userId
      ? [body]
      : [];

    if (notifications.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No notifications provided to dispatch",
      });
    }

    let wsDeliveredCount = 0;
    let pushDeliveredCount = 0;

    // Group notifications by userId for batch processing
    const userIds = [...new Set(notifications.map((n) => (n.userId || "").toString().trim()))].filter(Boolean);

    // Build case-insensitive regex for all target userIds
    const regexUserIds = userIds.map((id) => new RegExp(`^${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"));

    // Fetch all push subscriptions for target users in one query (matching userId or aliases)
    const subscriptions = await PushSubscription.find({
      $or: [
        { userId: { $in: regexUserIds } },
        { aliases: { $in: regexUserIds } },
      ],
    }).lean();

    const subMap = new Map();
    subscriptions.forEach((sub) => {
      const primaryKey = (sub.userId || "").toString().trim().toLowerCase();
      // Map under primary userId
      if (primaryKey) {
        if (!subMap.has(primaryKey)) {
          subMap.set(primaryKey, []);
        }
        subMap.get(primaryKey).push(sub);
      }

      // Also map under each alias
      if (Array.isArray(sub.aliases)) {
        sub.aliases.forEach((alias) => {
          const aliasKey = (alias || "").toString().trim().toLowerCase();
          if (aliasKey) {
            if (!subMap.has(aliasKey)) {
              subMap.set(aliasKey, []);
            }
            if (!subMap.get(aliasKey).some((s) => s.endpoint === sub.endpoint)) {
              subMap.get(aliasKey).push(sub);
            }
          }
        });
      }
    });

    if (subscriptions.length === 0) {
      console.log(`ℹ️ [sm-notification-service] No registered push devices found in DB for target users: ${userIds.join(", ")}`);
    } else {
      console.log(`📱 [sm-notification-service] Found ${subscriptions.length} active push subscription(s) for target users`);
    }

    // Dispatch each notification
    for (const notif of notifications) {
      const userId = (notif.userId || "").toString().trim();
      const targetUrl = resolveNotificationUrl(notif);

      const dispatchPayload = {
        notificationId: notif.notificationId,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        userRole: notif.userRole,
        schoolId: notif.schoolId,
        referenceId: notif.referenceId,
        referenceType: notif.referenceType,
        url: targetUrl,
        metadata: notif.metadata || {},
        createdAt: notif.createdAt || new Date().toISOString(),
      };

      // 1. WebSocket real-time delivery (if user is currently connected)
      const wsCount = sendToUser(userId, {
        type: "new_notification",
        payload: dispatchPayload,
      });
      wsDeliveredCount += wsCount;

      // 2. Web Push delivery (native browser push for background / offline / inactive tabs)
      const lookupKey = userId.toLowerCase();
      const rawSubs = subMap.get(lookupKey) || [];
      // Deduplicate subscriptions by endpoint so each physical device receives exactly ONE push
      const userSubs = Array.from(new Map(rawSubs.map((s) => [s.endpoint, s])).values());

      if (userSubs.length > 0) {
        const pushPayload = {
          title: notif.title || "SMS Edu Solutions",
          body: notif.message,
          message: notif.message,
          notificationId: notif.notificationId,
          type: notif.type,
          url: targetUrl,
          icon: "/android-chrome-192x192.png",
          badge: "/favicon-32x32.png",
          timestamp: Date.now(),
        };

        const pushResults = await sendPushToSubscriptions(userSubs, pushPayload);
        pushDeliveredCount += pushResults.filter((r) => r.success).length;
      }
    }

    console.log(
      `🔔 [sm-notification-service] Dispatched ${notifications.length} notification(s) | WS Tabs: ${wsDeliveredCount} | Web Push: ${pushDeliveredCount}`
    );

    return res.status(200).json({
      success: true,
      message: "Notifications processed successfully",
      delivered: {
        total: notifications.length,
        wsSockets: wsDeliveredCount,
        webPushDevices: pushDeliveredCount,
      },
    });
  } catch (error) {
    console.error("❌ Internal Notify Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to dispatch notifications",
      error: error.message,
    });
  }
};

module.exports = { handleInternalNotify };
