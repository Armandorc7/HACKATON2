import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "../api/client";
import type { User } from "../api/types";

interface AuthState {
  token: string | null;
  user: User | null;
  restoring: boolean;
  login: (teamCode: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const tokenKey = "tropelcare.token";
const userKey = "tropelcare.user";
const AuthContext = createContext<AuthState | null>(null);

function readStoredUser(): User | null {
  const raw = localStorage.getItem(userKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    localStorage.removeItem(userKey);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(tokenKey));
  const [user, setUser] = useState<User | null>(() => readStoredUser());
  const [restoring, setRestoring] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(userKey);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!token) {
      setRestoring(false);
      return;
    }
    const controller = new AbortController();
    setRestoring(true);
    api
      .me(token, controller.signal)
      .then((currentUser) => {
        localStorage.setItem(userKey, JSON.stringify(currentUser));
        setUser(currentUser);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        logout();
      })
      .finally(() => setRestoring(false));
    return () => controller.abort();
  }, [logout, token]);

  const login = useCallback(async (teamCode: string, email: string, password: string) => {
    const response = await api.login({ teamCode: teamCode.trim().toUpperCase(), email: email.trim(), password });
    localStorage.setItem(tokenKey, response.token);
    localStorage.setItem(userKey, JSON.stringify(response.user));
    setToken(response.token);
    setUser(response.user);
  }, []);

  const value = useMemo<AuthState>(() => ({ token, user, restoring, login, logout }), [login, logout, restoring, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
