import { useMutation } from "@tanstack/react-query";
import useApi from "../useApi";

interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: {
      userId?: string;
      adminId?: string;
      email: string;
      role: string;
      schoolId?: string;
      firstName?: string;
      lastName?: string;
    };
  };
}

/**
 * Unified login hook - works for all user types
 * (super_admin, sch_admin, teacher, student, parent)
 * Path /api/auth/* auto-routes to AUTH service
 */
export const useLogin = () => {
  return useMutation({
    mutationFn: (data: LoginPayload) =>
      useApi<LoginResponse>("POST", "/api/auth/login", data),
  });
};

/**
 * Verify token hook
 * Path /api/auth/* auto-routes to AUTH service
 */
export const useVerifyToken = () => {
  return useMutation({
    mutationFn: () =>
      useApi<{ success: boolean; data: unknown }>("GET", "/api/auth/verify-token"),
  });
};

/**
 * Record DPDP consent decision
 * Path /api/auth/consent auto-routes to AUTH service
 */
export interface ConsentRecordPayload {
  userId: string;
  schoolId?: string | null;
  role: string;
  email: string;
  consentVersion?: string;
  purposes?: {
    accountManagement?: boolean;
    platformServices?: boolean;
    communication?: boolean;
    analytics?: boolean;
  };
  source?: string;
}

export const useRecordConsent = () => {
  return useMutation({
    mutationFn: (data: ConsentRecordPayload) =>
      useApi<{ success: boolean; message: string }>("POST", "/api/auth/consent", data),
  });
};

/**
 * Forgot Password - Request 6-digit OTP via nodemailer
 */
export const useRequestPasswordResetOtp = () => {
  return useMutation({
    mutationFn: (data: { email: string }) =>
      useApi<{ success: boolean; message: string }>(
        "POST",
        "/api/auth/forgot-password/request-otp",
        data
      ),
  });
};

/**
 * Forgot Password - Verify OTP code
 */
export const useVerifyPasswordResetOtp = () => {
  return useMutation({
    mutationFn: (data: { email: string; otp: string }) =>
      useApi<{ success: boolean; message: string }>(
        "POST",
        "/api/auth/forgot-password/verify-otp",
        data
      ),
  });
};

/**
 * Forgot Password - Submit new password with OTP
 */
export const useResetPasswordWithOtp = () => {
  return useMutation({
    mutationFn: (data: {
      email: string;
      otp: string;
      newPassword: string;
      confirmPassword?: string;
    }) =>
      useApi<{ success: boolean; message: string }>(
        "POST",
        "/api/auth/forgot-password/reset-password",
        data
      ),
  });
};

// Alias for backward compatibility
export const useSuperAdminLogin = useLogin;
