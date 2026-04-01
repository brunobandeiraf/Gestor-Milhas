import { useCallback, useSyncExternalStore } from "react";
import api from "../services/api";

interface UserInfo {
  userId: string;
  email: string;
  role: string;
  registrationStatus: string;
}

// Simple external store for auth state changes
let listeners: Array<() => void> = [];
const subscribe = (listener: () => void) => {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
};
const emitChange = () => {
  listeners.forEach((l) => l());
};

const decodeJwtPayload = (token: string): UserInfo | null => {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json) as UserInfo;
  } catch {
    return null;
  }
};

const getSnapshot = (): string | null => localStorage.getItem("accessToken");

export const useAuth = () => {
  const accessToken = useSyncExternalStore(subscribe, getSnapshot, () => null);

  const getUser = useCallback((): UserInfo | null => {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;
    return decodeJwtPayload(token);
  }, []);

  const isAuthenticated = useCallback((): boolean => {
    return localStorage.getItem("accessToken") !== null;
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<UserInfo> => {
    const response = await api.post<{ accessToken: string; refreshToken: string }>(
      "/auth/login",
      { email, password }
    );
    localStorage.setItem("accessToken", response.data.accessToken);
    localStorage.setItem("refreshToken", response.data.refreshToken);
    emitChange();
    const user = decodeJwtPayload(response.data.accessToken);
    if (!user) throw new Error("Token inválido");
    return user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    emitChange();
  }, []);

  const user = accessToken ? decodeJwtPayload(accessToken) : null;

  return { user, login, logout, getUser, isAuthenticated };
};
