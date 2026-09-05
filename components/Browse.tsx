"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth, type RDUserInfo } from "@/lib/auth";
import type { CinemetaMeta } from "@/lib/types";
import CatalogCard from "@/components/CatalogCard";
import { Wordmark } from "@/components/Wordmark";
import { useRouter } from "next/navigation";
import { useWatchlist, type WatchlistItem } from "@/lib/watchlist";
import {
  useWatchProgress,
  usePruneProgress,
  timeOf,
  type WatchProgress,
} from "@/lib/progress";

type Tab = "movie" | "series";

export default function Browse() {
  const { token, user, clear } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("movie");
  const [query, setQuery] = useState("");
  const [metas, setMetas] = useState<CinemetaMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [sectionLabel, setSectionLabel] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { list, remove, version } = useWatchProgress(token);
  usePruneProgress();
  const { list: listWatchlist, version: watchlistVersion } = useWatchlist();
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [continuing, setContinuing] = useState<WatchProgress[]>([]);

  useEffect(() => {
    setWatchlistItems(listWatchlist());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchlistVersion]);

  const refreshContinue = useCallback(() => {
    setContinuing(list().slice(0, 10));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refreshContinue();
  }, [refreshContinue, version]);

  const sub = user ? premiumDaysLeft(user) : null;

  const load = useCallback(
    async (t: Tab, q?: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (q && q.trim()) {
          params.set("query", q.trim());
          setSectionLabel(`Results for “${q.trim()}”`);
        } else {
          setSectionLabel(t === "movie" ? "Popular movies" : "Popular series");
        }
        params.set("type", t);
        const res = await fetch(`/api/catalog?${params.toString()}`);
        if (!res.ok) return;
        const data = (await res.json()) as { metas: CinemetaMeta[] };
        setMetas(data.metas ?? []);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    load(tab, query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  function onSearch(value: string) {
    setQuery(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      load(tab, value);
    }, 350);
  }

  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!showSettings) return;
    function onDocClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (target && !target.closest("[data-account-menu]")) {
        setShowSettings(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [showSettings]);

  function signOut() {
    clear();
    router.push("/");
  }

  function openContinue(item: WatchProgress) {
    const parts = item.key.split(":");
    if (parts[0] === "series" && parts.length === 4) {
      router.push(`/title/series/${parts[1]}?season=${parts[2]}&episode=${parts[3]}`);
    } else {
      router.push(`/title/movie/${parts[1]}`);
    }
  }

  function removeFromContinue(key: string) {
    remove(key);
    setContinuing((prev) => prev.filter((c) => c.key !== key));
  }

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Navbar */}
      <header
        className="glass"
        style={{
          position: "sticky",
          top: 16,
          zIndex: 20,
          margin: "16px auto 0",
          maxWidth: 1200,
          width: "calc(100% - 48px)",
          borderRadius: "var(--radius-lg)",
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "12px 18px",
        }}
      >
        <button
          onClick={() => {
            setQuery("");
            load(tab);
          }}
          style={{
            background: "transparent",
            border: 0,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: 0,
          }}
        >
          <Wordmark />
        </button>

        <div style={{ flex: 1, position: "relative", maxWidth: 420 }}>
          <input
            className="input"
            style={{ padding: "11px 16px", borderRadius: "var(--radius-pill)", fontSize: 14 }}
            placeholder="Search movies and series"
            value={query}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>

        <div style={{ flex: 1 }} />

        <div
          data-account-menu
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginLeft: "auto",
            position: "relative",
            flexShrink: 0,
          }}
        >
          {sub != null && (
            <span
              className="chip"
              title={
                sub.date
                  ? `Premium expires ${sub.date.toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}`
                  : "Real-Debrid subscription"
              }
            >
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80" }} />
              {sub.days} {sub.days === 1 ? "day" : "days"} left
            </span>
          )}
          {user && (
            <span
              className="chip"
              style={{ maxWidth: 160 }}
              title="Real-Debrid account"
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.username}
              </span>
            </span>
          )}
          <button
            className="btn btn-ghost"
            title="Account settings"
            style={{ padding: "9px 12px", fontSize: 13 }}
            onClick={() => setShowSettings((s) => !s)}
            aria-label="Account settings"
          >
            ⌄
          </button>
          {showSettings && (
            <div
              className="glass glass-strong animate-in"
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 10px)",
                width: 220,
                padding: 14,
                borderRadius: "var(--radius)",
                zIndex: 30,
              }}
            >
              <p className="muted" style={{ fontSize: 12.5, marginBottom: 10, lineHeight: 1.5 }}>
                Signed in as <strong style={{ color: "var(--text)" }}>{user?.username ?? "…"}</strong>
              </p>
              <button className="btn" style={{ width: "100%", padding: "10px 14px", fontSize: 13.5 }} onClick={signOut}>
                Disconnect Real-Debrid
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Body */}
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "36px 24px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 8 }}>
          <div>
            <p className="eyebrow" style={{ marginBottom: 8 }}>Browse</p>
            <h1>{sectionLabel || "Popular"}</h1>
          </div>
          <div className="tabs">
            <button className={`tab ${tab === "movie" ? "active" : ""}`} onClick={() => setTab("movie")}>
              Movies
            </button>
            <button className={`tab ${tab === "series" ? "active" : ""}`} onClick={() => setTab("series")}>
              Series
            </button>
          </div>
        </div>

        {continuing.length > 0 && (
          <section style={{ marginTop: 28 }}>
            <p className="eyebrow" style={{ marginBottom: 14 }}>
              Continue watching · {continuing.length}
            </p>
            <ContinueBanner
              entry={continuing[0]}
              items={continuing.length}
              onResume={() => openContinue(continuing[0])}
              onDismiss={() => removeFromContinue(continuing[0].key)}
            />
            {continuing.length > 1 && (
              <div
                style={{
                  display: "grid",
                  gap: 12,
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                  marginTop: 12,
                }}
              >
                {continuing.slice(1).map((c) => (
                  <div
                    key={c.key}
                    className="glass animate-in"
                    style={{
                      padding: 14,
                      cursor: "pointer",
                      display: "flex",
                      gap: 12,
                      alignItems: "center",
                      position: "relative",
                    }}
                    onClick={() => openContinue(c)}
                  >
                    <button
                      className="btn btn-ghost"
                      aria-label="Remove from continue watching"
                      title="Remove from continue watching"
                      style={{
                        position: "absolute",
                        top: 6,
                        right: 6,
                        padding: "4px 8px",
                        fontSize: 13,
                        borderRadius: 999,
                        lineHeight: 1,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromContinue(c.key);
                      }}
                    >
                      ✕
                    </button>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 11,
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 800,
                        background: "rgba(255,255,255,0.12)",
                        flexShrink: 0,
                      }}
                    >
                      ▶
                    </div>
                    <div style={{ minWidth: 0, paddingRight: 22 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.title}
                      </div>
                      <div className="muted" style={{ fontSize: 12, marginTop: 3 }}>
                        {c.duration ? `${timeOf(c)} of ${prettyDuration(c.duration)}` : timeOf(c)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {watchlistItems.length > 0 && (
          <section style={{ marginTop: 34 }}>
            <p className="eyebrow" style={{ marginBottom: 14 }}>
              My List · {watchlistItems.length}
            </p>
            <div className="grid">
              {watchlistItems.map((item, i) => (
                <CatalogCard
                  key={item.id}
                  meta={{
                    id: item.id,
                    name: item.name,
                    type: item.type,
                    poster: item.poster,
                    background: item.background,
                  }}
                  index={i}
                  fallbackType={item.type}
                />
              ))}
            </div>
          </section>
        )}

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 100 }}>
            <span className="spinner" style={{ width: 30, height: 30 }} />
          </div>
        ) : metas.length === 0 ? (
          <div className="glass" style={{ padding: 60, textAlign: "center", marginTop: 24 }}>
            <p style={{ fontSize: 17, fontWeight: 600 }}>No results</p>
            <p className="muted" style={{ marginTop: 6, fontSize: 14 }}>Try a different search.</p>
          </div>
        ) : (
          <div className="grid" style={{ marginTop: 28 }}>
            {metas.map((m, i) => (
              <CatalogCard key={`${m.id}-${i}`} meta={m} index={i} fallbackType={tab} />
            ))}
          </div>
        )}
      </main>

      {/* Token hint bar */}
      <footer style={{ textAlign: "center", marginTop: 60, fontSize: 12.5, color: "var(--text-faint)" }}>
        <Wordmark size={15} gold={false} /> · stream via Real-Debrid + Torrentio · your token never leaves this browser
      </footer>
    </div>
  );
}

function prettyDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.round((total % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// RD /user returns:
//   - `expiration`: an ISO jsonDate of the premium expiry (e.g. "2032-06-06T04:42:42.000Z")
//   - `premium`: SECONDS LEFT as a premium user (a countdown, not a timestamp!)
// Sometimes legacy/odd payloads come through, so be defensive.
function premiumDaysLeft(user: RDUserInfo): { days: number; date?: Date } | null {
  let ms: number | null = null;

  const toMs = (v: string | number): number | null => {
    if (typeof v === "number") {
      if (v <= 0) return null;
      // Large values look like a unix-seconds timestamp; small ones are seconds-left.
      return v >= 1e9 ? v * 1000 : Date.now() + v * 1000;
    }
    const s = String(v).trim();
    if (!s) return null;
    if (/^\d+$/.test(s)) {
      const n = Number(s);
      if (n <= 0) return null;
      return n >= 1e9 ? n * 1000 : Date.now() + n * 1000;
    }
    const t = Date.parse(s);
    return isFinite(t) ? t : null;
  };

  if (user.expiration != null && user.expiration !== "") {
    ms = toMs(user.expiration);
  }
  if (ms == null) ms = toMs(user.premium);
  if (ms == null || !isFinite(ms)) return null;

  return {
    days: Math.max(0, Math.ceil((ms - Date.now()) / 86400000)),
    date: new Date(ms),
  };
}

function seriesLabel(key: string): string | null {
  const parts = key.split(":");
  if (parts[0] === "series" && parts.length === 4) {
    return `S${String(parts[2]).padStart(2, "0")}E${String(parts[3]).padStart(2, "0")}`;
  }
  return null;
}

function ContinueBanner({
  entry,
  items,
  onResume,
  onDismiss,
}: {
  entry: WatchProgress;
  items: number;
  onResume: () => void;
  onDismiss: () => void;
}) {
  const backdrop = entry.background || entry.poster;
  const remaining = Math.max(0, entry.duration - entry.seconds);
  const ep = seriesLabel(entry.key);

  return (
    <div
      className="glass animate-in"
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "var(--radius-xl)",
        minHeight: 230,
        display: "flex",
        alignItems: "flex-end",
      }}
    >
      {backdrop ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={backdrop}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 0,
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          background:
            "linear-gradient(90deg, rgba(10,10,12,0.9) 0%, rgba(10,10,12,0.72) 45%, rgba(10,10,12,0.25) 100%)",
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 2,
          padding: "clamp(24px, 5vw, 48px)",
          maxWidth: 700,
          width: "100%",
        }}
      >
        <p className="eyebrow" style={{ marginBottom: 10, color: "var(--text-dim)" }}>
          {ep ? `Episode ${ep}` : "Movie"} · {items} {items === 1 ? "title" : "titles"} in your list
        </p>
        <h2 style={{ fontSize: "clamp(24px, 4vw, 38px)", lineHeight: 1.08 }}>{entry.title}</h2>
        <p className="muted" style={{ marginTop: 10, fontSize: 13.5, lineHeight: 1.5 }}>
          {timeOf(entry)} {entry.duration ? ` of ${prettyDuration(entry.duration)}` : ""}
          {remaining > 0 && entry.duration
            ? ` · ${prettyDuration(remaining)} left`
            : ""}
        </p>
        <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
          <button className="btn btn-primary" style={{ padding: "12px 24px", fontSize: 14 }} onClick={onResume}>
            ▶ Resume
          </button>
          <button className="btn btn-ghost" style={{ padding: "12px 18px", fontSize: 14 }} onClick={onDismiss}>
            ✕ Remove
          </button>
        </div>
      </div>
    </div>
  );
}