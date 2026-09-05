"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/lib/auth";

const STORAGE_KEY = "strawflix_watchlist";
const SYNC_DEBOUNCE_MS = 1500;

export interface WatchlistItem {
  id: string;
  type: "movie" | "series";
  name: string;
  poster?: string;
  background?: string;
  addedAt: number;
}

interface WatchlistCtx {
  has: (id: string) => boolean;
  get: (id: string) => WatchlistItem | undefined;
  toggle: (item: Omit<WatchlistItem, "addedAt">) => void;
  remove: (id: string) => void;
  list: () => WatchlistItem[];
  version: number;
}

const Ctx = createContext<WatchlistCtx | null>(null);

function readAll(): Record<string, WatchlistItem> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, WatchlistItem>) : {};
  } catch {
    return {};
  }
}

let serverAvailable: boolean | null = null;

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [map, setMap] = useState<Record<string, WatchlistItem>>(() => readAll());
  const [version, setVersion] = useState(0);
  const mapRef = useRef(map);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mapRef.current = map;
  }, [map]);

  const push = useCallback(
    async (items: Record<string, WatchlistItem>) => {
      if (serverAvailable === false || !token) return;
      try {
        const r = await fetch("/api/watchlist", {
          method: "PUT",
          headers: { "Content-Type": "application/json", "x-progress-token": token },
          body: JSON.stringify({ items }),
        });
        const j = (await r.json()) as { disabled?: boolean };
        if (j.disabled) serverAvailable = false;
      } catch {
        /* best-effort */
      }
    },
    [token]
  );

  const scheduleSync = useCallback(() => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      push(mapRef.current);
    }, SYNC_DEBOUNCE_MS);
  }, [push]);

  // Merge server → local on mount.
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const r = await fetch("/api/watchlist", {
          headers: { "x-progress-token": token },
        });
        const j = (await r.json()) as {
          disabled?: boolean;
          items?: Record<string, WatchlistItem> | null;
        };
        if (j.disabled) {
          serverAvailable = false;
          return;
        }
        serverAvailable = true;
        const remote = j.items ?? {};
        const local = readAll();
        let changed = false;
        const merged: Record<string, WatchlistItem> = { ...local };
        for (const [k, v] of Object.entries(remote)) {
          if (!merged[k] || v.addedAt > (merged[k]?.addedAt ?? 0)) {
            merged[k] = v;
            changed = true;
          }
        }
        if (Object.keys(local).length === 0 && Object.keys(remote).length > 0) {
          writeLocal(remote);
          mapRef.current = remote;
          setMap(remote);
          setVersion((v) => v + 1);
          return;
        }
        if (changed) {
          writeLocal(merged);
          mapRef.current = merged;
          setMap(merged);
          setVersion((v) => v + 1);
        }
      } catch {
        /* offline fallback */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, []);

  const writeLocal = useCallback((items: Record<string, WatchlistItem>) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, []);

  const mutate = useCallback(
    (fn: (cur: Record<string, WatchlistItem>) => Record<string, WatchlistItem>) => {
      const next = fn(mapRef.current);
      mapRef.current = next;
      setMap(next);
      writeLocal(next);
      setVersion((v) => v + 1);
      scheduleSync();
    },
    [writeLocal, scheduleSync]
  );

  const toggle = useCallback(
    (item: Omit<WatchlistItem, "addedAt">) => {
      mutate((cur) => {
        const n = { ...cur };
        if (n[item.id]) {
          delete n[item.id];
        } else {
          n[item.id] = { ...item, addedAt: Date.now() };
        }
        return n;
      });
    },
    [mutate]
  );

  const remove = useCallback(
    (id: string) => {
      mutate((cur) => {
        const n = { ...cur };
        delete n[id];
        return n;
      });
    },
    [mutate]
  );

  const has = useCallback((id: string) => Boolean(map[id]), [map]);
  const get = useCallback((id: string) => map[id], [map]);
  const list = useCallback(
    () => Object.values(map).sort((a, b) => b.addedAt - a.addedAt),
    [map]
  );

  return (
    <Ctx.Provider value={{ has, get, toggle, remove, list, version }}>
      {children}
    </Ctx.Provider>
  );
}

export function useWatchlist(): WatchlistCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWatchlist must be used within WatchlistProvider");
  return ctx;
}