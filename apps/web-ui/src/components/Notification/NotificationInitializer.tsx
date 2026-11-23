import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import TokenService from "../../queries/token/tokenService";
import { notificationSocket } from "../../services/notificationSocket";
import {
  registerServiceWorker,
  subscribeToPush,
  isPushSupported,
  getPermissionState,
} from "../../services/pushNotification";
import PushNotificationBanner from "./PushNotificationBanner";

/**
 * Component that manages the lifecycle of:
 * 1. Service Worker registration for PWA Web Push
 * 2. Auto-syncing Push Subscription to MongoDB if permission is granted
 * 3. Real-time WebSocket connection to sm-notification-service
 * 4. Surfacing an actionable 1-click prompt if notifications are not yet enabled
 */
const NotificationInitializer: React.FC = () => {
  const initializedRef = React.useRef(false);
  const [showPrompt, setShowPrompt] = useState<boolean>(false);

  useEffect(() => {
    // Check if prompt should be visible
    const checkPrompt = () => {
      const token = TokenService.getToken();
      if (
        token &&
        !TokenService.isTokenExpired() &&
        isPushSupported() &&
        getPermissionState() !== "granted"
      ) {
        setShowPrompt(true);
      } else {
        setShowPrompt(false);
      }
    };

    checkPrompt();

    if (initializedRef.current) return;
    initializedRef.current = true;

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
          checkPrompt();
          if (isPushSupported() && getPermissionState() === "granted") {
            subscribeToPush().catch((err) => {
              console.warn("⚠️ [NotificationInitializer] Push auto-register on login failed:", err);
            });
          }
        } else {
          notificationSocket.disconnect();
          setShowPrompt(false);
        }
      }
    };

    // 4. Listen to window focus (e.g. user toggled permission in Android settings and switched back to app)
    const handleWindowFocus = () => {
      checkPrompt();
      const token = TokenService.getToken();
      if (
        token &&
        !TokenService.isTokenExpired() &&
        isPushSupported() &&
        getPermissionState() === "granted"
      ) {
        subscribeToPush().catch((err) => {
          console.warn("⚠️ [NotificationInitializer] Focus push auto-sync failed:", err);
        });
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, []);

  if (!showPrompt) {
    return null;
  }

  return (
    <Box
      sx={{
        position: "fixed",
        top: { xs: 8, sm: 16 },
        right: { xs: 8, sm: 16 },
        left: { xs: 8, sm: "auto" },
        zIndex: 99999,
        maxWidth: { xs: "calc(100% - 16px)", sm: 380 },
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
        borderRadius: 2,
      }}
    >
      <PushNotificationBanner variant="compact" />
    </Box>
  );
};

export default NotificationInitializer;
