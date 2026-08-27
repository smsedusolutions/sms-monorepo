import TokenService from "../queries/token/tokenService";

const getNotificationApiUrl = (): string => {
  return import.meta.env.VITE_NOTIF_API_URL || "http://localhost:5008";
};

/**
 * Checks if the current browser environment supports Push Notifications & Service Workers
 */
export const isPushSupported = (): boolean => {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
};

/**
 * Gets current notification permission status ('default' | 'granted' | 'denied')
 */
export const getPermissionState = (): NotificationPermission => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  return Notification.permission;
};

/**
 * Helper to convert a URL-safe Base64 string to a Uint8Array
 * Required for `applicationServerKey` in `pushManager.subscribe()`
 */
export const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

/**
 * Registers the Service Worker (`/sw.js`)
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!isPushSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    return registration;
  } catch (err) {
    console.error("❌ Service Worker registration failed:", err);
    return null;
  }
};

/**
 * Fetches the VAPID Public Key from the server or falls back to env variable
 */
export const getVapidPublicKey = async (): Promise<string> => {
  const envKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (envKey) return envKey;

  const res = await fetch(`${getNotificationApiUrl()}/push/vapid-public-key`);
  const data = await res.json();
  if (!data.success || !data.publicKey) {
    throw new Error(data.message || "Failed to obtain VAPID public key");
  }
  return data.publicKey;
};

/**
 * Subscribes the current browser session to Web Push
 */
export const subscribeToPush = async (schoolId?: string): Promise<boolean> => {
  if (!isPushSupported()) {
    console.warn("⚠️ Push notifications are not supported in this browser.");
    return false;
  }

  // 1. Request permission from user
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.warn("⚠️ Notification permission was not granted:", permission);
    return false;
  }

  // 2. Ensure Service Worker is ready
  await registerServiceWorker();
  const registration = await navigator.serviceWorker.ready;

  // 3. Get VAPID Public Key & convert
  const vapidKey = await getVapidPublicKey();
  const applicationServerKey = urlBase64ToUint8Array(vapidKey);

  // 4. Subscribe with browser PushManager
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey as any,
    });
  }

  const subJson = subscription.toJSON();
  const token = TokenService.getToken();

  if (!token) {
    console.warn("⚠️ User not authenticated — skipping server subscription registration.");
    return true;
  }

  // 5. Send subscription to sm-notification-service
  const currentSchoolId = schoolId || TokenService.getSchoolId() || "GLOBAL";
  const userRole = TokenService.getRole() || "user";

  const res = await fetch(`${getNotificationApiUrl()}/push/subscribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      endpoint: subJson.endpoint,
      keys: subJson.keys,
      schoolId: currentSchoolId,
      userRole,
    }),
  });

  const result = await res.json();
  if (!res.ok || !result.success) {
    console.error("❌ Failed to register push subscription on backend:", result);
    return false;
  }

  console.log("✅ Web Push registered successfully with backend");
  return true;
};

/**
 * Unsubscribes current browser session from Web Push
 */
export const unsubscribeFromPush = async (): Promise<boolean> => {
  if (!isPushSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();

      const token = TokenService.getToken();
      if (token) {
        await fetch(`${getNotificationApiUrl()}/push/unsubscribe`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ endpoint }),
        });
      }
      console.log("🔌 Web Push unsubscribed successfully");
      return true;
    }
    return false;
  } catch (err) {
    console.error("❌ Failed to unsubscribe from push:", err);
    return false;
  }
};

/**
 * Check if the browser currently has an active Push subscription
 */
export const getExistingSubscription = async (): Promise<PushSubscription | null> => {
  if (!isPushSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (_e) {
    return null;
  }
};
