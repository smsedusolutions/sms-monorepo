const PushSubscription = require("../models/pushSubscription.model");
const { sendPushToSubscriptions } = require("../utils/webPush");

/**
 * GET /push/vapid-public-key
 * Returns the VAPID Public Key for Web Push subscription creation
 */
const getVapidPublicKey = async (_req, res) => {
  try {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    if (!publicKey) {
      return res.status(500).json({
        success: false,
        message: "VAPID Public Key is not configured on server",
      });
    }

    return res.status(200).json({
      success: true,
      publicKey,
    });
  } catch (error) {
    console.error("❌ Get VAPID Public Key Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve VAPID Public Key",
      error: error.message,
    });
  }
};

/**
 * POST /push/subscribe
 * Subscribes a user's browser/device to Web Push notifications
 */
const subscribe = async (req, res) => {
  try {
    const { endpoint, keys, schoolId: bodySchoolId, userRole: bodyRole } = req.body;
    const user = req.user || {};

    const userId = (
      user.parentId ||
      user.teacherId ||
      user.studentId ||
      user.userId ||
      user.id ||
      user._id ||
      user.adminId ||
      ""
    ).toString();

    const schoolId = user.schoolId || bodySchoolId || "GLOBAL";
    const userRole = (user.role || bodyRole || "user").toLowerCase();

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID missing",
      });
    }

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({
        success: false,
        message: "Missing required subscription fields: endpoint, keys (p256dh, auth)",
      });
    }

    const aliases = [
      user.parentId,
      user.teacherId,
      user.studentId,
      user.userId,
      user.id,
      user._id,
      user.adminId,
      user.email,
    ]
      .filter(Boolean)
      .map((id) => id.toString());

    const userAgent = req.headers["user-agent"] || "";

    // Upsert subscription uniquely by device endpoint (updates user, aliases, and keys if already registered)
    const subscription = await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        userId,
        aliases,
        schoolId,
        userRole,
        endpoint,
        keys: {
          p256dh: keys.p256dh,
          auth: keys.auth,
        },
        userAgent,
        updatedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`📲 [PushController] User ${userId} (${userRole}) registered push subscription`);

    return res.status(200).json({
      success: true,
      message: "Push notification subscription registered successfully",
      data: {
        id: subscription._id,
        userId: subscription.userId,
        endpoint: subscription.endpoint,
      },
    });
  } catch (error) {
    console.error("❌ Subscribe Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to register push subscription",
      error: error.message,
    });
  }
};

/**
 * DELETE /push/unsubscribe
 * Unsubscribes a user's browser/device from Web Push notifications
 */
const unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body;
    const user = req.user || {};

    const userId = (
      user.parentId ||
      user.teacherId ||
      user.studentId ||
      user.userId ||
      user.id ||
      user._id ||
      user.adminId ||
      ""
    ).toString();

    if (!endpoint) {
      return res.status(400).json({
        success: false,
        message: "Subscription endpoint is required",
      });
    }

    const result = await PushSubscription.deleteMany({
      ...(userId ? { userId } : {}),
      endpoint,
    });

    console.log(`🔌 [PushController] Unsubscribed endpoint (${result.deletedCount} removed)`);

    return res.status(200).json({
      success: true,
      message: "Unsubscribed successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("❌ Unsubscribe Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove push subscription",
      error: error.message,
    });
  }
};

/**
 * GET /push/status
 * Check if the authenticated user has any active subscriptions
 */
const getSubscriptionStatus = async (req, res) => {
  try {
    const user = req.user || {};
    const userId = (
      user.parentId ||
      user.teacherId ||
      user.studentId ||
      user.userId ||
      user.id ||
      user._id ||
      user.adminId ||
      ""
    ).toString();

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const count = await PushSubscription.countDocuments({ userId });

    return res.status(200).json({
      success: true,
      data: {
        isSubscribed: count > 0,
        activeSubscriptions: count,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to check subscription status",
      error: error.message,
    });
  }
};

/**
 * POST /push/test
 * Sends an immediate test Web Push notification to all active devices of the caller
 */
const sendTestPush = async (req, res) => {
  try {
    const user = req.user || {};
    const aliases = [
      user.parentId,
      user.teacherId,
      user.studentId,
      user.userId,
      user.id,
      user._id,
      user.adminId,
      user.email,
    ]
      .filter(Boolean)
      .map((id) => id.toString());

    if (aliases.length === 0) {
      return res.status(401).json({ success: false, message: "Unauthorized: User ID missing" });
    }

    const subscriptions = await PushSubscription.find({
      $or: [{ userId: { $in: aliases } }, { aliases: { $in: aliases } }],
    }).lean();

    if (subscriptions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No registered push subscriptions found for this user in database.",
        aliasesChecked: aliases,
      });
    }

    const testPayload = {
      title: "Test Notification 🔔",
      body: `Web push is working on your Android device! (${new Date().toLocaleTimeString()})`,
      message: `Web push is working on your Android device! (${new Date().toLocaleTimeString()})`,
      notificationId: `TEST-${Date.now()}`,
      type: "system_alert",
      url: "/notifications",
      icon: "/android-chrome-192x192.png",
      badge: "/favicon-32x32.png",
      timestamp: Date.now(),
    };

    const results = await sendPushToSubscriptions(subscriptions, testPayload);

    return res.status(200).json({
      success: true,
      message: `Dispatched test push to ${subscriptions.length} device(s)`,
      devicesCount: subscriptions.length,
      results,
    });
  } catch (error) {
    console.error("❌ Send Test Push Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to dispatch test push",
      error: error.message,
    });
  }
};

module.exports = {
  getVapidPublicKey,
  subscribe,
  unsubscribe,
  getSubscriptionStatus,
  sendTestPush,
};
