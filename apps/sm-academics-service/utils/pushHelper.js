const http = require("http");
const https = require("https");

/**
 * Dispatch notification(s) to sm-notification-service for instant WebSocket emission & Web Push
 * @param {Object|Array<Object>} notifications - One or more notification objects
 */
const dispatchRealtimePush = (notifications) => {
  const notifUrl = process.env.NOTIFICATION_SERVICE_URL;
  const internalSecret = process.env.INTERNAL_SECRET;

  if (!notifUrl || !internalSecret) {
    console.warn("⚠️ [RealtimePush] NOTIFICATION_SERVICE_URL or INTERNAL_SECRET missing in env - skipping push.");
    return;
  }

  const notifArray = Array.isArray(notifications) ? notifications : [notifications];
  if (notifArray.length === 0) return;

  try {
    const parsedUrl = new URL(`${notifUrl}/internal/notify`);
    const postData = JSON.stringify({ notifications: notifArray });

    const isHttps = parsedUrl.protocol === "https:";
    const transport = isHttps ? https : http;

    const req = transport.request(
      {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
          "X-Internal-Secret": internalSecret,
        },
        timeout: 5000,
      },
      (res) => {
        // Drain response stream to free memory
        res.resume();
      }
    );

    req.on("error", (err) => {
      console.warn("⚠️ [RealtimePush] Could not reach notification service:", err.message);
    });

    req.write(postData);
    req.end();
  } catch (err) {
    console.warn("⚠️ [RealtimePush] Error dispatching push:", err.message);
  }
};

module.exports = {
  dispatchRealtimePush,
};
