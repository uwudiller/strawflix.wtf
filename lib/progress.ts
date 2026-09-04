"use client";

import { useCallback, useEffect, useRef } from "react";

const STORAGE_KEY = "strawflix_progress";

export interface WatchProgress {
  key: string; // `${type}:${imdbId}${+episode? `:${s}:${e}` : ""}`
  title: string;
  poster?: string;
  seconds: number;
  duration: number;
  updatedAt: number;
}

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

export function useWatchProgress() {
  const lastPlayed = useRef<Record<string, { seconds: number; duration: number }>>({});

  // Save progress periodically from the player.
  const save = useCallback(
    (key: string, seconds: number, duration: number, meta: { title?: string }) => {
      const map = readAll();
      map[key] = {
        key,
        title: meta.title || key,
        seconds,
        duration,
        updatedAt: Date.now(),
      };
      writeAll(map);
    },
    []
  );

  const get = useCallback((key: string): WatchProgress | null => {
    const map = readAll();
    return map[key] ?? null;
  }, []);

  const remove = useCallback((key: string) => {
    const map = readAll();
    if (map[key]) {
      delete map[key];
      writeAll(map);
    }
  }, []);

  const list = useCallback((): WatchProgress[] => {
    const map = readAll();
    return Object.values(map).sort((a, b) => b.updatedAt - a.updatedAt);
  }, []);

  // Record a position only if it's > 0 and not near the very end.
  const note = useCallback(
    (key: string, meta: { title?: string }, currentTime: number, duration: number) => {
      if (!key || !(currentTime > 0) || !duration || currentTime >= duration - 30) return;
      lastPlayed.current[key] = { seconds: currentTime, duration };
      save(key, currentTime, duration, meta);
    },
    [save]
  );

  return { save, get, remove, list, note };
}

// Format a saved cumulative seconds value as a playback timecode label.
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

// Clear stale entries (kept in check periodically so the store stays small).
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