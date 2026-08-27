import React, { useEffect } from "react";
import TokenService from "../../queries/token/tokenService";
import { notificationSocket } from "../../services/notificationSocket";
import {
  registerServiceWorker,
  subscribeToPush,
  isPushSupported,
  getPermissionState,
} from "../../services/pushNotification";

/**
 * Headless component that manages the lifecycle of:
 * 1. Service Worker registration for PWA Web Push
 * 2. Auto-syncing Push Subscription to MongoDB if permission is granted
 * 3. Real-time WebSocket connection to sm-notification-service
 */
const NotificationInitializer: React.FC = () => {
  useEffect(() => {
    // 1. Register Service Worker on initial mount
    registerServiceWorker()
      .then(() => {
        // If user is authenticated and permission is already granted, ensure push subscription is registered with backend
        const token = TokenService.getToken();
        if (
          token &&
          !TokenService.isTokenExpired() &&
          isPushSupported() &&
          getPermissionState() === "granted"
        ) {
          subscribeToPush().catch((err) => {
            console.warn("⚠️ [NotificationInitializer] Auto-sync push subscription failed:", err);
          });
        }
      })
      .catch((err) => {
        console.warn("⚠️ [NotificationInitializer] SW registration skipped or failed:", err);
      });

    // 2. Connect notification WebSocket if user is currently logged in
    const token = TokenService.getToken();
    if (token && !TokenService.isTokenExpired()) {
      notificationSocket.connect();
    }

    // 3. Listen to storage changes (e.g. login / logout across tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "token") {
        if (e.newValue) {
          notificationSocket.connect();
          if (isPushSupported() && getPermissionState() === "granted") {
            subscribeToPush().catch((err) => {
              console.warn("⚠️ [NotificationInitializer] Push auto-register on login failed:", err);
            });
          }
        } else {
          notificationSocket.disconnect();
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return null;
};

export default NotificationInitializer;
