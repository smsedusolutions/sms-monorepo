const webpush = require("web-push");
const PushSubscription = require("../models/pushSubscription.model");

let vapidConfigured = false;

const initVapid = () => {
  if (vapidConfigured) return;

  const subject = process.env.VAPID_SUBJECT || "mailto:smsedusolutions@gmail.com";
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (publicKey && privateKey) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    vapidConfigured = true;
    console.log("🔑 [sm-notification-service] VAPID details initialized successfully");
  } else {
    console.warn("⚠️ [sm-notification-service] VAPID keys missing in env. Web Push will be disabled.");
  }
};

/**
 * Send Web Push notification to a single PushSubscription document.
 * Automatically cleans up stale/expired subscriptions (HTTP 410 or 404).
 * @param {object} subscription 
 * @param {object} payload 
 */
const sendPushToSubscription = async (subscription, payload) => {
  initVapid();
  if (!vapidConfigured) return { success: false, reason: "VAPID_NOT_CONFIGURED" };

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  };

  try {
    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify(payload),
      {
        TTL: 60 * 60 * 24, // 24 hours TTL
        urgency: payload.urgency || "normal",
      }
    );
    return { success: true, endpoint: subscription.endpoint };
  } catch (error) {
    console.error(
      `❌ [WebPush] Delivery error for endpoint ${subscription.endpoint.substring(0, 35)}... :`,
      error.statusCode || error.message
    );

    // If subscription is expired or unregistered (HTTP 404 / 410 Gone), remove it from DB
    if (error.statusCode === 404 || error.statusCode === 410) {
      console.log(`🧹 [WebPush] Removing expired push subscription for user ${subscription.userId}`);
      try {
        await PushSubscription.deleteOne({ _id: subscription._id });
      } catch (dbErr) {
        console.error("❌ [WebPush] Failed to remove expired subscription:", dbErr.message);
      }
    }

    return {
      success: false,
      statusCode: error.statusCode,
      error: error.message,
      endpoint: subscription.endpoint,
    };
  }
};

/**
 * Send Web Push notification to all subscriptions for given user/list
 * @param {Array<object>} subscriptions 
 * @param {object} payload 
 */
const sendPushToSubscriptions = async (subscriptions, payload) => {
  if (!subscriptions || subscriptions.length === 0) return [];
  const results = await Promise.allSettled(
    subscriptions.map((sub) => sendPushToSubscription(sub, payload))
  );
  return results.map((r) => (r.status === "fulfilled" ? r.value : { success: false, error: r.reason }));
};

module.exports = {
  initVapid,
  sendPushToSubscription,
  sendPushToSubscriptions,
};
