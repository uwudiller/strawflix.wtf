"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth, type RDUserInfo } from "@/lib/auth";
import type { CinemetaMeta } from "@/lib/types";
import CatalogCard from "@/components/CatalogCard";
import { Wordmark } from "@/components/Wordmark";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  const loadSeq = useRef(0);
  const navBarRef = useRef<HTMLDivElement | null>(null);
  const movieTabRef = useRef<HTMLButtonElement | null>(null);
  const seriesTabRef = useRef<HTMLButtonElement | null>(null);
  const [navSlide, setNavSlide] = useState({ left: 0, width: 0 });

  const measureSlide = useCallback(() => {
    const active = tab === "movie" ? movieTabRef.current : seriesTabRef.current;
    const bar = navBarRef.current;
    if (!active || !bar) return;
    const barRect = bar.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    const left = activeRect.left - barRect.left;
    const width = activeRect.width;
    setNavSlide((prev) =>
      Math.abs(prev.left - left) < 0.5 && Math.abs(prev.width - width) < 0.5 ? prev : { left, width }
    );
  }, [tab]);

  useEffect(() => {
    measureSlide();
    window.addEventListener("resize", measureSlide);
    document.fonts?.ready?.then(measureSlide).catch(() => {});
    return () => window.removeEventListener("resize", measureSlide);
  }, [measureSlide]);

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
      const seq = ++loadSeq.current;
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
        if (seq !== loadSeq.current) return;
        if (!res.ok) return;
        const data = (await res.json()) as { metas: CinemetaMeta[] };
        if (seq !== loadSeq.current) return;
        setMetas(data.metas ?? []);
      } finally {
        if (seq === loadSeq.current) setLoading(false);
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
      <header className="nav-scrim">
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
          <Wordmark size={22} />
        </button>

        <nav
          ref={navBarRef}
          className="nav-link-wrap"
          style={{ display: "flex", gap: "clamp(14px, 2vw, 28px)", alignItems: "center", flexShrink: 0 }}
        >
          <button
            ref={movieTabRef}
            className={`nav-link ${tab === "movie" ? "active" : ""}`}
            onClick={() => {
              setQuery("");
              setTab("movie");
            }}
          >
            Movies
          </button>
          <button
            ref={seriesTabRef}
            className={`nav-link ${tab === "series" ? "active" : ""}`}
            onClick={() => {
              setQuery("");
              setTab("series");
            }}
          >
            Series
          </button>
          <span
            className="nav-slider"
            style={{ transform: `translateX(${navSlide.left}px)`, width: navSlide.width }}
          />
        </nav>

        <div style={{ flex: 1 }} />

        <div style={{ position: "relative", width: "clamp(220px, 26vw, 420px)" }}>
          <input
            className="input"
            style={{ padding: "9px 18px", borderRadius: "var(--radius-pill)", fontSize: 14.5 }}
            placeholder="Search movies and series"
            value={query}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>

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
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)" }} />
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
      <main style={{ padding: "32px clamp(20px, 4vw, 64px) 0" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 8 }}>
          <div>
            <p className="eyebrow" style={{ marginBottom: 8 }}>Browse</p>
            <h1 style={{ fontSize: "clamp(30px, 4vw, 48px)" }}>{sectionLabel || "Popular"}</h1>
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
              <div className="row-scroll" style={{ marginTop: 12 }}>
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
                      width: 300,
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
          <section style={{ marginTop: 40 }}>
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

      {/* Footer */}
      <footer style={{ textAlign: "center", marginTop: 60, padding: "24px 16px 0", display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
        <Wordmark size={17} />
        <div className="footer-links" style={{ marginTop: 4 }}>
          <Link href="/docs">Docs</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/legal">Legal · DMCA</Link>
        </div>
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
      className="glass animate-in billboard"
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
            "linear-gradient(90deg, rgba(10,10,12,0.94) 0%, rgba(10,10,12,0.78) 40%, rgba(10,10,12,0.18) 78%, rgba(10,10,12,0.35) 100%)",
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 2,
          padding: "clamp(28px, 5vw, 64px)",
          maxWidth: 760,
          width: "100%",
        }}
      >
        <p className="eyebrow" style={{ marginBottom: 12, color: "var(--text-dim)" }}>
          {ep ? `Episode ${ep}` : "Movie"} · {items} {items === 1 ? "title" : "titles"} in your list
        </p>
        <h1 className="billboard-title">{entry.title}</h1>
        <p className="muted" style={{ marginTop: 14, fontSize: 15, lineHeight: 1.5 }}>
          {timeOf(entry)} {entry.duration ? ` of ${prettyDuration(entry.duration)}` : ""}
          {remaining > 0 && entry.duration
            ? ` · ${prettyDuration(remaining)} left`
            : ""}
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
          <button className="btn btn-primary" style={{ padding: "14px 40px", fontSize: 17, fontWeight: 700 }} onClick={onResume}>
            ▶ Play
          </button>
          <button className="btn" style={{ padding: "14px 26px", fontSize: 15, background: "rgba(255,255,255,0.14)" }} onClick={onDismiss}>
            ✕ Remove
          </button>
        </div>
      </div>
    </div>
  );
}