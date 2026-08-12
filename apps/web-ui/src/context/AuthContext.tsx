import React, { createContext, useContext, useEffect, useState } from "react";
import TokenService from "../queries/token/tokenService";
import { useUserStore } from "../stores/userStore";

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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
