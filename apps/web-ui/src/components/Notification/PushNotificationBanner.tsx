import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
  IconButton,
} from "@mui/material";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import NotificationsOffIcon from "@mui/icons-material/NotificationsOff";
import CloseIcon from "@mui/icons-material/Close";
import { usePushNotification } from "../../hooks/usePushNotification";

const DISMISSED_KEY = "sms_push_prompt_dismissed";
const ENABLED_KEY = "sms_push_enabled";

interface PushNotificationBannerProps {
  variant?: "banner" | "card" | "compact";
  showWhenSubscribed?: boolean;
}

export const PushNotificationBanner: React.FC<PushNotificationBannerProps> = ({
  variant = "card",
  showWhenSubscribed = false,
}) => {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
  } = usePushNotification();

  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return (
        localStorage.getItem(DISMISSED_KEY) === "true" ||
        localStorage.getItem(ENABLED_KEY) === "true"
      );
    } catch {
      return false;
    }
  });

  // If already subscribed, granted, dismissed, or unsupported, do not show at all
  if (
    dismissed ||
    !isSupported ||
    (isSubscribed && !showWhenSubscribed) ||
    (permission === "granted" && !showWhenSubscribed)
  ) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, "true");
    } catch (e) {
      console.warn(e);
    }
  };

  const handleSubscribe = async () => {
    const ok = await subscribe();
    if (ok) {
      try {
        localStorage.setItem(ENABLED_KEY, "true");
      } catch (e) {
        console.warn(e);
      }
      setDismissed(true);
    }
  };

  // State 1: Permission Denied in browser
  if (permission === "denied") {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2.5,
          borderRadius: 2.5,
          border: "1px solid #fecaca",
          bgcolor: "#fff1f2",
          display: "flex",
          alignItems: "flex-start",
          gap: 1.5,
        }}
      >
        <NotificationsOffIcon sx={{ color: "#e11d48", mt: 0.25 }} />
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, color: "#9f1239" }}
          >
            Push Notifications Blocked
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "#be123c", fontSize: "0.825rem", mt: 0.25 }}
          >
            Notifications are blocked in your browser settings. To receive alerts on this device, click the lock or site settings icon in your browser address bar and allow notifications.
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={handleDismiss}
          sx={{ color: "#be123c" }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Paper>
    );
  }

  // State 2: Compact Prompt
  if (variant === "compact") {
    return (
      <Box
        sx={{
          p: 1.5,
          borderRadius: 2,
          bgcolor: "#eff6ff",
          border: "1px solid #bfdbfe",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
          <NotificationsActiveIcon sx={{ color: "#2563eb", fontSize: 20 }} />
          <Typography
            sx={{
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: "#1e40af",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            Enable push notifications
          </Typography>
        </Box>
        <Button
          size="small"
          variant="contained"
          color="primary"
          disabled={isLoading}
          onClick={handleSubscribe}
          sx={{
            fontSize: "0.75rem",
            py: 0.25,
            px: 1.25,
            textTransform: "none",
            borderRadius: 1.5,
            minWidth: "auto",
          }}
        >
          {isLoading ? <CircularProgress size={14} color="inherit" /> : "Enable"}
        </Button>
      </Box>
    );
  }

  // State 3: Card Prompt (Default for Notifications Page)
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.25 },
        mb: 2.5,
        borderRadius: 2.5,
        background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
        color: "#ffffff",
        boxShadow: "0 4px 20px rgba(37, 99, 235, 0.18)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background Decorative Glow */}
      <Box
        sx={{
          position: "absolute",
          top: -30,
          right: -30,
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)",
          pointerEvents: "none",
        }}
      />

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: 2,
          position: "relative",
          zIndex: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.75, flex: 1, pr: { xs: 4, sm: 0 } }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "12px",
              bgcolor: "rgba(255, 255, 255, 0.2)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <NotificationsActiveIcon sx={{ color: "#ffffff", fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.25 }}>
              Enable Instant Push Notifications
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "rgba(255, 255, 255, 0.9)",
                fontSize: { xs: "0.8rem", sm: "0.85rem" },
                mt: 0.5,
                lineHeight: 1.4,
              }}
            >
              Receive instant alerts on this device for announcements, attendance status, homework deadlines, and live transport updates even when the app is closed.
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            width: { xs: "100%", sm: "auto" },
            justifyContent: { xs: "flex-end", sm: "flex-start" },
          }}
        >
          <Button
            variant="contained"
            disabled={isLoading}
            onClick={handleSubscribe}
            sx={{
              bgcolor: "#ffffff",
              color: "#1e40af",
              fontWeight: 700,
              fontSize: "0.85rem",
              px: 2.5,
              py: 0.9,
              borderRadius: 2,
              textTransform: "none",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              "&:hover": {
                bgcolor: "#f8fafc",
              },
              width: { xs: "100%", sm: "auto" },
            }}
          >
            {isLoading ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={16} sx={{ color: "#1e40af" }} />
                <span>Enabling...</span>
              </Box>
            ) : (
              "Enable Notifications"
            )}
          </Button>

          <IconButton
            size="small"
            onClick={handleDismiss}
            sx={{
              color: "rgba(255, 255, 255, 0.8)",
              position: { xs: "absolute", sm: "static" },
              top: { xs: -8, sm: "auto" },
              right: { xs: -8, sm: "auto" },
              "&:hover": { color: "#ffffff", bgcolor: "rgba(255,255,255,0.15)" },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
};

export default PushNotificationBanner;
