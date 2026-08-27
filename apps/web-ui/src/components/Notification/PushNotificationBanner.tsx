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
    refreshStatus,
  } = usePushNotification();

  const [sessionDismissed, setSessionDismissed] = useState(false);

  // If already subscribed and granted, or unsupported, or dismissed for this session, hide
  if (
    !isSupported ||
    sessionDismissed ||
    (permission === "granted" && isSubscribed && !showWhenSubscribed)
  ) {
    return null;
  }

  const handleDismiss = () => {
    setSessionDismissed(true);
  };

  const handleSubscribe = async () => {
    const ok = await subscribe();
    if (ok) {
      setSessionDismissed(true);
    }
  };

  // State 1: Permission Denied in browser or Android App settings
  if (permission === "denied") {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 2.5,
          border: "1px solid #fecaca",
          bgcolor: "#fff1f2",
          display: "flex",
          alignItems: "flex-start",
          gap: 1.5,
        }}
      >
        <NotificationsOffIcon sx={{ color: "#e11d48", mt: 0.25, fontSize: 24 }} />
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, color: "#9f1239", fontSize: "0.9rem" }}
          >
            Push Notifications are Blocked
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "#be123c", fontSize: "0.8rem", mt: 0.5, lineHeight: 1.5 }}
          >
            To receive notifications on this device:
            <br />
            1. <b>In Chrome:</b> Tap the <b>🔒 icon</b> or <b>Site Settings</b> next to the URL bar ➔ <b>Notifications ➔ Allow</b>.
            <br />
            2. <b>In Installed App:</b> Long-press the App icon ➔ <b>App Info ➔ Notifications ➔ Turn On</b>.
          </Typography>

          <Button
            size="small"
            variant="contained"
            onClick={async () => {
              await refreshStatus();
              if (Notification.permission === "granted") {
                await handleSubscribe();
              }
            }}
            sx={{
              mt: 1.25,
              bgcolor: "#e11d48",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "0.78rem",
              textTransform: "none",
              borderRadius: 2,
              px: 2,
              "&:hover": { bgcolor: "#be123c" },
            }}
          >
            I've enabled it — Check Status
          </Button>
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
        borderRadius: 3,
        bgcolor: "#f0f7ff",
        border: "1.5px solid #bfdbfe",
        boxShadow: "0 4px 18px rgba(37, 99, 235, 0.08)",
        position: "relative",
        overflow: "hidden",
      }}
    >
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
              bgcolor: "#dbeafe",
              border: "1px solid #bfdbfe",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <NotificationsActiveIcon sx={{ color: "#2563eb", fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.25, color: "#1e3a8a" }}>
              Enable Instant Push Notifications
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "#3b82f6",
                fontSize: { xs: "0.8rem", sm: "0.85rem" },
                mt: 0.5,
                lineHeight: 1.4,
                fontWeight: 500,
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
            gap: 1.25,
            width: { xs: "100%", sm: "auto" },
            justifyContent: { xs: "flex-end", sm: "flex-start" },
          }}
        >
          <Button
            variant="contained"
            disabled={isLoading}
            onClick={handleSubscribe}
            sx={{
              bgcolor: "#2563eb !important",
              color: "#ffffff !important",
              fontWeight: 700,
              fontSize: "0.875rem",
              px: 2.75,
              py: 1,
              borderRadius: 2.5,
              textTransform: "none",
              boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)",
              "&:hover": {
                bgcolor: "#1d4ed8 !important",
                boxShadow: "0 6px 18px rgba(37, 99, 235, 0.45)",
              },
              width: { xs: "100%", sm: "auto" },
            }}
          >
            {isLoading ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={16} sx={{ color: "#ffffff !important" }} />
                <span style={{ color: "#ffffff", fontWeight: 700 }}>Enabling...</span>
              </Box>
            ) : (
              "Enable Notifications"
            )}
          </Button>

          <IconButton
            size="small"
            onClick={handleDismiss}
            sx={{
              color: "#64748b",
              position: { xs: "absolute", sm: "static" },
              top: { xs: 0, sm: "auto" },
              right: { xs: 0, sm: "auto" },
              "&:hover": { color: "#1e293b", bgcolor: "#e2e8f0" },
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

