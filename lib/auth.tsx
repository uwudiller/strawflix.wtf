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

const STORAGE_KEY = "strawflix_rd_token";

export interface RDUserInfo {
  username: string;
  email: string;
  premium: number;
  expiration?: string | number | null;
}

interface AuthState {
  token: string | null;
  user: RDUserInfo | null;
  verifying: boolean;
  setToken: (token: string) => Promise<boolean>;
  verifyToken: (token: string) => Promise<boolean>;
  clear: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<RDUserInfo | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setTokenState(saved);
      verifyToken(saved).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verifyToken = useCallback(async (t: string) => {
    setVerifying(true);
    try {
      const res = await fetch(`/api/token?token=${encodeURIComponent(t)}`);
      if (!res.ok) return false;
      const data = (await res.json()) as { user: RDUserInfo };
      setUser(data.user);
      return true;
    } catch {
      return false;
    } finally {
      setVerifying(false);
    }
  }, []);

  const setToken = useCallback(
    async (t: string) => {
      const trimmed = t.trim();
      if (!trimmed) return false;
      const ok = await verifyToken(trimmed);
      if (ok) {
        window.localStorage.setItem(STORAGE_KEY, trimmed);
        setTokenState(trimmed);
      }
      return ok;
    },
    [verifyToken]
  );

  const clear = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setTokenState(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ token, user, verifying, setToken, verifyToken, clear }),
    [token, user, verifying, setToken, verifyToken, clear]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}