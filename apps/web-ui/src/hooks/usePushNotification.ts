import { useState, useEffect, useCallback } from "react";
import {
  isPushSupported,
  getPermissionState,
  subscribeToPush,
  unsubscribeFromPush,
  getExistingSubscription,
} from "../services/pushNotification";
import TokenService from "../queries/token/tokenService";

export interface UsePushNotificationReturn {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  refreshStatus: () => Promise<void>;
}

export const usePushNotification = (): UsePushNotificationReturn => {
  const [isSupported] = useState<boolean>(() => isPushSupported());
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    getPermissionState()
  );
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshStatus = useCallback(async () => {
    if (!isSupported) return;

    const currentPermission = getPermissionState();
    setPermission(currentPermission);

    if (currentPermission === "granted") {
      const sub = await getExistingSubscription();
      setIsSubscribed(!!sub);
    } else {
      setIsSubscribed(false);
    }
  }, [isSupported]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const handleSubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    setIsLoading(true);
    try {
      const schoolId = TokenService.getSchoolId() || undefined;
      const success = await subscribeToPush(schoolId);
      await refreshStatus();
      return success;
    } catch (err) {
      console.error("❌ [usePushNotification] Subscribe failed:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, refreshStatus]);

  const handleUnsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    setIsLoading(true);
    try {
      const success = await unsubscribeFromPush();
      await refreshStatus();
      return success;
    } catch (err) {
      console.error("❌ [usePushNotification] Unsubscribe failed:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, refreshStatus]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe: handleSubscribe,
    unsubscribe: handleUnsubscribe,
    refreshStatus,
  };
};

export default usePushNotification;
