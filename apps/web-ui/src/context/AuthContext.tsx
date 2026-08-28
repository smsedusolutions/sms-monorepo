import React, { createContext, useContext, useEffect, useState } from "react";
import TokenService from "../queries/token/tokenService";
import { useUserStore } from "../stores/userStore";
import {
  subscribeToPush,
  isPushSupported,
  getPermissionState,
} from "../services/pushNotification";

interface AuthUser {
  userId: string;
  email: string;
  role: string;
  schoolId?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  page: number;
  setPage: (page: number) => void;
  limit: number;
  setLimit: (limit: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    const decoded = TokenService.decodeToken();
    if (decoded && !TokenService.isTokenExpired()) {
      setUser({
        userId: decoded.userId || decoded.adminId || "",
        email: decoded.email || decoded.username || "",
        role: decoded.role,
        schoolId: decoded.schoolId,
      });
    }
  }, []);

  const login = (token: string) => {
    TokenService.setToken(token);

    const decoded = TokenService.decodeToken();
    if (!decoded) return;

    setUser({
      userId: decoded.userId || decoded.adminId || "",
      email: decoded.email || decoded.username || "",
      role: decoded.role,
      schoolId: decoded.schoolId,
    });

    // Clear stale user profile and fetch fresh profile for newly logged in user
    useUserStore.getState().clearStore();
    useUserStore.getState().fetchProfile(true);

    // When user logs in, prompt for notification permission if not yet decided, or sync push subscription if granted
    if (isPushSupported() && getPermissionState() !== "denied") {
      subscribeToPush(decoded.schoolId).catch((err) => {
        console.warn("⚠️ Push registration on login:", err);
      });
    }
  };

  const logout = () => {
    TokenService.removeToken();
    useUserStore.getState().clearStore();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        page,
        setPage,
        limit,
        setLimit,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context) {
    return context;
  }

  // Safe fallback if called outside or during early render of AuthProvider
  const decoded = TokenService.decodeToken();
  const user =
    decoded && !TokenService.isTokenExpired()
      ? {
          userId: decoded.userId || decoded.adminId || "",
          email: decoded.email || decoded.username || "",
          role: decoded.role,
          schoolId: decoded.schoolId,
        }
      : null;

  return {
    user,
    isAuthenticated: !!user,
    login: (token: string) => {
      TokenService.setToken(token);
      useUserStore.getState().clearStore();
      useUserStore.getState().fetchProfile(true);
    },
    logout: () => {
      TokenService.removeToken();
      useUserStore.getState().clearStore();
    },
    page: 1,
    setPage: () => {},
    limit: 10,
    setLimit: () => {},
  };
};
