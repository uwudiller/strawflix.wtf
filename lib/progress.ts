"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "strawflix_progress";
const SYNC_DEBOUNCE_MS = 2000;

export interface WatchProgress {
  key: string; // `${type}:${imdbId}${season ? `:${s}:${e}` : ""}`
  title: string;
  poster?: string;
  background?: string;
  seconds: number;
  duration: number;
  updatedAt: number;
}

// ── local helpers ────────────────────────────────────────────────────────────

function readAll(): Record<string, WatchProgress> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, WatchProgress>) : {};
  } catch {
    return {};
  }
}

function writeAll(map: Record<string, WatchProgress>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

// ── public key builder ───────────────────────────────────────────────────────

export function mediaProgressKey(
  type: string,
  imdbId: string,
  season?: number,
  episode?: number
): string {
  if (type === "series" && season != null && episode != null) {
    return `${type}:${imdbId}:${season}:${episode}`;
  }
  return `${type}:${imdbId}`;
}

// ── tiny helpers (no hook) ───────────────────────────────────────────────────

export function timeOf(w?: WatchProgress): string {
  if (!w) return "";
  const total = Math.max(0, Math.floor(w.seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

export function pruneStaleProgress(maxAgeMs = 1000 * 60 * 60 * 24 * 90) {
  const map = readAll();
  const now = Date.now();
  let changed = false;
  for (const k of Object.keys(map)) {
    if (now - map[k].updatedAt > maxAgeMs) {
      delete map[k];
      changed = true;
    }
  }
  if (changed) writeAll(map);
}

// ── cloud sync helpers ───────────────────────────────────────────────────────

let serverAvailable: boolean | null = null;

function authHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    "x-progress-token": token,
  };
}

async function fetchServerMap(token: string): Promise<Record<string, WatchProgress> | null> {
  try {
    const r = await fetch("/api/progress", { headers: { "x-progress-token": token } });
    const j = (await r.json()) as { disabled?: boolean; map?: Record<string, WatchProgress> | null };
    if (j.disabled) {
      serverAvailable = false;
      return null;
    }
    serverAvailable = true;
    return j.map ?? {};
  } catch {
    return null;
  }
}

async function pushServerMap(map: Record<string, WatchProgress>, token: string) {
  if (serverAvailable === false) return;
  try {
    await fetch("/api/progress", {
      method: "PUT",
      headers: authHeaders(token),
      body: JSON.stringify({ map }),
    });
  } catch {
    /* best-effort */
  }
}

// ── hook ─────────────────────────────────────────────────────────────────────

export function useWatchProgress(token?: string | null) {
  const [version, setVersion] = useState(0);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Merge server → localStorage on mount.
  useEffect(() => {
    (async () => {
      if (!token) return;
      const remote = await fetchServerMap(token);
      if (!remote) return;
      const local = readAll();
      let changed = false;
      const merged = { ...local };
      for (const [k, v] of Object.entries(remote)) {
        if (!merged[k] || v.updatedAt > (merged[k]?.updatedAt ?? 0)) {
          merged[k] = v;
          changed = true;
        }
      }
      if (changed) {
        writeAll(merged);
        setVersion((v) => v + 1);
      }
      // If local was empty but remote wasn't, push back (e.g. first load on a new device with old localStorage).
      const localEmpty = Object.keys(local).length === 0;
      const remoteEmpty = Object.keys(remote).length === 0;
      if (localEmpty && !remoteEmpty) {
        writeAll(remote);
        setVersion((v) => v + 1);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Debounced server push.
  const scheduleSync = useCallback(() => {
    if (!token || serverAvailable === false) return;
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      pushServerMap(readAll(), token);
    }, SYNC_DEBOUNCE_MS);
  }, [token]);

  useEffect(() => {
    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, []);

  // Exposed API (unchanged surface) ───────────────────────────────────────────

  const save = useCallback(
    (key: string, seconds: number, duration: number, meta: { title?: string; poster?: string; background?: string }) => {
      const map = readAll();
      map[key] = {
        key,
        title: meta.title || key,
        poster: meta.poster,
        background: meta.background,
        seconds,
        duration,
        updatedAt: Date.now(),
      };
      writeAll(map);
      setVersion((v) => v + 1);
      scheduleSync();
    },
    [scheduleSync]
  );

  const get = useCallback(
    (key: string): WatchProgress | null => readAll()[key] ?? null,
    []
  );

  const remove = useCallback(
    (key: string) => {
      const map = readAll();
      if (map[key]) {
        delete map[key];
        writeAll(map);
        setVersion((v) => v + 1);
        scheduleSync();
      }
    },
    [scheduleSync]
  );

  const list = useCallback((): WatchProgress[] => {
    return Object.values(readAll()).sort((a, b) => b.updatedAt - a.updatedAt);
  }, []);

  const note = useCallback(
    (key: string, meta: { title?: string; poster?: string; background?: string }, currentTime: number, duration: number) => {
      if (!key || !(currentTime > 0) || !duration || currentTime >= duration - 30) return;
      save(key, currentTime, duration, meta);
    },
    [save]
  );

  return { save, get, remove, list, note, version };
}

// ── periodic prune helper (drops stale entries) ──────────────────────────────

export function usePruneProgress() {
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null;
    const run = () => {
      pruneStaleProgress();
      t = setTimeout(run, 1000 * 60 * 5);
    };
    run();
    return () => {
      if (t) clearTimeout(t);
    };
  }, []);
}
