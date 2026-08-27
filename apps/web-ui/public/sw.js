/**
 * SMS Edu Solutions - PWA Service Worker
 * Handles background Push notifications and notification click interactions
 */

self.addEventListener("install", (event) => {
  // Activate immediately without waiting
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// =========================================================================
// PUSH EVENT LISTENER
// Fires when a Web Push message arrives from the VAPID push service
// =========================================================================
self.addEventListener("push", (event) => {
  let data = {};
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (err) {
    try {
      data = { message: event.data.text() };
    } catch (_e) {
      data = { message: "New notification received" };
    }
  }

  const title = data.title || "SMS Edu Solutions";
  const body = data.body || data.message || "You have a new update in your school portal.";
  const options = {
    body,
    icon: data.icon || "/android-chrome-192x192.png",
    badge: data.badge || "/favicon-32x32.png",
    vibrate: [200, 100, 200],
    data: {
      url: data.url || "/",
      notificationId: data.notificationId,
      type: data.type,
      timestamp: data.timestamp || Date.now(),
    },
    tag: data.notificationId || `sms-notif-${Date.now()}`,
    renotify: true,
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// =========================================================================
// NOTIFICATION CLICK LISTENER
// Fires when user taps/clicks on a native browser notification
// =========================================================================
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // If a window of this app is already open, focus it and navigate
        for (const client of clientList) {
          if ("focus" in client) {
            client.focus();
            if ("navigate" in client && targetUrl) {
              return client.navigate(targetUrl);
            }
            return client;
          }
        }

        // If no window is open, open a new browser window/tab
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
