"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  clearToken,
  fetchMe,
  getToken,
  login as loginRequest,
  register as registerRequest,
  saveToken,
} from "@/services/auth";
import type { LoginPayload, RegisterPayload, User } from "@/types/user";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      return;
    }
    const me = await fetchMe();
    setUser(me);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        if (!getToken()) {
          if (!cancelled) setUser(null);
          return;
        }
        const me = await fetchMe();
        if (!cancelled) setUser(me);
      } catch {
        clearToken();
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const data = await loginRequest(payload);
    saveToken(data.access_token, Boolean(payload.remember_me));
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const data = await registerRequest(payload);
    // 注册后默认保持登录（写入 localStorage）
    saveToken(data.access_token, true);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
