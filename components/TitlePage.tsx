"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import type { CinemetaMeta, ResolvedStream, Episode } from "@/lib/types";
import Player from "@/components/Player";
import { mediaProgressKey, useWatchProgress } from "@/lib/progress";

interface HostingState {
  id: string;
  progress: number;
  status: string;
}

export default function TitlePage({
  type,
  imdbId,
  initialSeason,
  initialEpisode,
}: {
  type: "movie" | "series";
  imdbId: string;
  initialSeason?: number;
  initialEpisode?: number;
}) {
  const { token } = useAuth();
  const router = useRouter();

  const [meta, setMeta] = useState<CinemetaMeta | null>(null);
  const [metaError, setMetaError] = useState(false);

  const [streams, setStreams] = useState<ResolvedStream[]>([]);
  const [streamsLoading, setStreamsLoading] = useState(true);
  const [streamError, setStreamError] = useState<string | null>(null);

  const [activeStream, setActiveStream] = useState<ResolvedStream | null>(null);
  const [playerTitle, setPlayerTitle] = useState("");
  const [playerSubtitle, setPlayerSubtitle] = useState("");

  const [season, setSeason] = useState(initialSeason ?? 1);
  const [episode, setEpisode] = useState<Episode | null>(null);

  const [hosting, setHosting] = useState<HostingState | null>(null);
  const [hostingFor, setHostingFor] = useState<ResolvedStream | null>(null);

  const progress = useWatchProgress();

  // Key for the currently-watched media (used to save + resume progress).
  const currentKey = mediaProgressKey(
    type,
    imdbId,
    type === "series" && episode ? episode.season : undefined,
    type === "series" && episode ? episode.episode : undefined
  );

  const resumeSeconds = useMemo(() => {
    const p = progress.get(currentKey);
    return p && p.seconds > 1 ? p.seconds : 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKey, activeStream]);

  // Load metadata
  useEffect(() => {
    fetch(`/api/meta?type=${type}&id=${imdbId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.meta) setMeta(d.meta as CinemetaMeta);
        else setMetaError(true);
      })
      .catch(() => setMetaError(true));
  }, [type, imdbId]);

  const seasons = useMemo(() => {
    if (!meta?.videos?.length) return [];
    const set = new Set<number>();
    for (const v of meta.videos) {
      if (v.season != null) set.add(v.season);
    }
    return [...set].sort((a, b) => a - b);
  }, [meta]);

  const episodes = useMemo(() => {
    if (!meta?.videos?.length) return [];
    return meta.videos
      .filter((v) => v.season === season)
      .sort((a, b) => (a.episode ?? 0) - (b.episode ?? 0))
      .map((v) => ({
        id: v.id,
        season: v.season ?? 0,
        episode: v.episode ?? 0,
        name: v.name ?? v.title ?? "",
        released: v.released,
      }));
  }, [meta, season]);

  useEffect(() => {
    if (!episodes.length) return;
    if (episode) {
      // If the chosen episode is part of another season, ensure season matches
      if (episode.season !== season) setEpisode(null);
      return;
    }
    const match = initialEpisode
      ? episodes.find((e) => e.episode === initialEpisode)
      : undefined;
    setEpisode(match ?? episodes[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episodes]);

  // Fetch streams for the current media / episode
  const fetchStreams = useCallback(
    async (mediaSeason?: number, mediaEpisode?: number) => {
      if (!token) return;
      setStreamsLoading(true);
      setStreamError(null);
      try {
        const res = await fetch("/api/streams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            type,
            id: imdbId,
            season: mediaSeason,
            episode: mediaEpisode,
          }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          setStreamError(
            data.error === "REAL_DEBRID_INVALID_TOKEN"
              ? "Your Real-Debrid token is invalid. Reconnect it from the home page."
              : "Torrentio couldn't find streams for this title."
          );
          setStreams([]);
          return;
        }
        const data = (await res.json()) as { streams: ResolvedStream[] };
        setStreams(data.streams ?? []);
      } catch {
        setStreamError("Network error while fetching streams.");
        setStreams([]);
      } finally {
        setStreamsLoading(false);
      }
    },
    [token, type, imdbId]
  );

  useEffect(() => {
    if (type === "movie") {
      fetchStreams();
    } else if (episode) {
      fetchStreams(episode.season, episode.episode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, type, imdbId, episode, episode?.id]);

  function play(stream: ResolvedStream) {
    if (!stream.url) return;
    setActiveStream(stream);
    const label = meta?.name ?? imdbId;
    setPlayerTitle(label);
    setPlayerSubtitle(
      type === "series" && episode
        ? `S${String(episode.season).padStart(2, "0")}E${String(episode.episode).padStart(2, "0")} · ${stream.displayName}`
        : stream.displayName
    );
  }

  // Host an uncached stream to Real-Debrid
  async function hostToDebrid(stream: ResolvedStream) {
    if (!stream.infoHash) return;
    const magnet = `magnet:?xt=urn:btih:${stream.infoHash}`;
    setHostingFor(stream);
    setHosting({ id: "", progress: 0, status: "starting" });
    try {
      const res = await fetch("/api/magnet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, magnet }),
      });
      if (!res.ok) throw new Error("host failed");
      const { torrentId } = (await res.json()) as { torrentId: string };

      const poll = async () => {
        const r = await fetch(`/api/magnet/status?token=${encodeURIComponent(token ?? "")}&id=${torrentId}`);
        const data = (await r.json()) as { status: string; progress: number };
        setHosting({ id: torrentId, progress: data.progress, status: data.status });
        if (data.status === "downloaded") {
          setTimeout(() => {
            setHosting(null);
            setHostingFor(null);
            play(stream);
          }, 1500);
          return;
        }
        if (
          data.status === "error" ||
          data.status === "magnet_error" ||
          data.status === "virus" ||
          data.status === "dead"
        ) {
          setHosting(null);
          setHostingFor(null);
          setStreamError("Real-Debrid failed to host this torrent.");
          return;
        }
        setTimeout(poll, 5000);
      };
      poll();
    } catch {
      setHosting(null);
      setHostingFor(null);
      setStreamError("Could not reach Real-Debrid to host this torrent.");
    }
  }

  const displayYear = meta?.year ?? meta?.releaseInfo ?? "";

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Back bar */}
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
          gap: 12,
          padding: "12px 16px",
        }}
      >
        <button className="btn" style={{ padding: "9px 16px", fontSize: 13 }} onClick={() => router.back()}>
          ← Back
        </button>
        <span style={{ fontWeight: 600, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {meta?.name ?? "…"}
        </span>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 0" }}>
        {/* Hero */}
        {metaError ? (
          <div className="glass" style={{ padding: 50, textAlign: "center" }}>
            <p style={{ fontWeight: 700 }}>We couldn’t load this title.</p>
            <p className="muted" style={{ fontSize: 14, marginTop: 6 }}>
              It may not exist in Cinemeta.
            </p>
          </div>
        ) : meta ? (
          <>
            <div
              className="glass animate-in"
              style={{
                borderRadius: "var(--radius-xl)",
                overflow: "hidden",
                position: "relative",
                minHeight: 320,
              }}
            >
              {meta.background ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={meta.background}
                  alt=""
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}
                />
              ) : null}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 1,
                  background:
                    "linear-gradient(190deg, rgba(10,10,12,0.25) 0%, rgba(10,10,12,0.72) 55%, rgba(10,10,12,0.95) 100%)",
                }}
              />
              <div style={{ position: "relative", zIndex: 2, padding: "clamp(28px, 6vw, 64px)", maxWidth: 760 }}>
                <p className="eyebrow" style={{ marginBottom: 12 }}>
                  {type === "movie" ? "Movie" : "Series"}
                </p>
                <h1 style={{ fontSize: "clamp(34px, 6vw, 60px)" }}>{meta.name}</h1>
                <div className="muted" style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginTop: 14, fontSize: 14 }}>
                  <span>{displayYear}</span>
                  {meta.imdbRating ? (
                    <span>
                      ★ <strong style={{ color: "rgba(255,255,255,0.9)" }}>{meta.imdbRating}</strong>
                    </span>
                  ) : null}
                  {meta.runtime ? <span>{meta.runtime}</span> : null}
                </div>
                <div className="muted" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                  {(meta.genres ?? []).map((g) => (
                    <span key={g} className="chip">{g}</span>
                  ))}
                </div>
                {meta.description ? (
                  <p className="muted" style={{ marginTop: 16, lineHeight: 1.65, fontSize: 14.5, maxWidth: 640 }}>
                    {meta.description}
                  </p>
                ) : null}
              </div>
            </div>

            {/* Season / episode selector */}
            {type === "series" && episodes.length > 0 && (
              <div className="glass animate-in" style={{ marginTop: 22, padding: 18, borderRadius: "var(--radius-lg)" }}>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>Season</span>
                  <div className="tabs">
                    {seasons.map((s) => (
                      <button
                        key={s}
                        className={`tab ${season === s ? "active" : ""}`}
                        onClick={() => {
                          setSeason(s);
                          setEpisode(null);
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gap: 8,
                    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                    marginTop: 16,
                  }}
                >
                  {episodes.map((ep) => {
                    const selected = episode?.id === ep.id;
                    return (
                      <button
                        key={ep.id}
                        onClick={() => setEpisode(ep)}
                        className="glass"
                        style={{
                          textAlign: "left",
                          padding: "10px 12px",
                          cursor: "pointer",
                          color: selected ? "#0a0a0c" : "var(--text)",
                          background: selected ? "rgba(255,255,255,0.92)" : undefined,
                          border: selected ? "1px solid transparent" : undefined,
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 700 }}>
                          E{String(ep.episode).padStart(2, "0")}
                        </div>
                        <div style={{ fontSize: 12, opacity: 0.7, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {ep.name || "Episode"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
            <span className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        )}

        {/* Streams */}
        <div style={{ marginTop: 30 }}>
          <p className="eyebrow" style={{ marginBottom: 14 }}>
            {type === "series" && episode
              ? `Streams · S${String(episode.season).padStart(2, "0")}E${String(episode.episode).padStart(2, "0")}`
              : "Streams"}
          </p>

          {!token ? (
            <div className="glass" style={{ padding: 40, textAlign: "center" }}>
              <p style={{ fontWeight: 600 }}>Connect your Real-Debrid token to see streams.</p>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => router.push("/")}>
                Connect
              </button>
            </div>
          ) : streamsLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
              <span className="spinner" style={{ width: 28, height: 28 }} />
            </div>
          ) : streamError ? (
            <div className="glass" style={{ padding: 40, textAlign: "center" }}>
              <p style={{ fontWeight: 600 }}>{streamError}</p>
            </div>
          ) : streams.length === 0 ? (
            <div className="glass" style={{ padding: 40, textAlign: "center" }}>
              <p style={{ fontWeight: 600 }}>No streams found.</p>
              <p className="muted" style={{ fontSize: 14, marginTop: 6 }}>
                Try another episode or title.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {streams.map((s, i) => (
                <StreamRow
                  key={`${s.name}-${i}-${s.displayName}`}
                  stream={s}
                  index={i}
                  hosting={hostingFor === s}
                  hostingProgress={hosting?.progress ?? 0}
                  onPlay={() => play(s)}
                  onHost={() => hostToDebrid(s)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {activeStream && activeStream.url ? (
        <Player
          stream={activeStream}
          title={playerTitle}
          subtitle={playerSubtitle}
          onClose={() => setActiveStream(null)}
          resumeSeconds={resumeSeconds}
          onProgress={(seconds, duration) =>
            progress.note(currentKey, { title: playerTitle }, seconds, duration)
          }
        />
      ) : null}
    </div>
  );
}

function StreamRow({
  stream,
  index,
  hosting,
  hostingProgress,
  onPlay,
  onHost,
}: {
  stream: ResolvedStream;
  index: number;
  hosting: boolean;
  hostingProgress: number;
  onPlay: () => void;
  onHost: () => void;
}) {
  return (
    <div
      className="glass animate-in"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "14px 16px",
        borderRadius: "var(--radius)",
        background: stream.cached ? "rgba(255,255,255,0.08)" : undefined,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: "1 1 240px" }}>
        <span
          className="chip"
          style={{ minWidth: 46, justifyContent: "center", fontWeight: 800 }}
        >
          {stream.quality}
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {stream.displayName}
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 3, display: "flex", gap: 10 }}>
            {stream.container ? (
              <span
                title={
                  stream.container === "mkv"
                    ? "MKV — may not play in this browser. Prefer MP4/WebM."
                    : undefined
                }
                style={{
                  fontWeight: 700,
                  color:
                    stream.container === "mkv"
                      ? "rgba(245,197,24,0.85)"
                      : "rgba(255,255,255,0.75)",
                }}
              >
                {stream.container.toUpperCase()}
              </span>
            ) : null}
            {stream.sizeLabel ? <span>{stream.sizeLabel}</span> : null}
            {stream.seeders != null ? <span>{stream.seeders} peers</span> : null}
            {stream.fileIdx != null ? <span>file {stream.fileIdx}</span> : null}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span className={stream.cached ? "chip cached" : "chip"}>
          {stream.cached ? "⚡ Instant" : "Uncached"}
        </span>
        {!stream.cached && stream.infoHash && (
          <button className="btn" style={{ padding: "9px 14px", fontSize: 12.5 }} onClick={onHost} disabled={hosting}>
            {hosting ? "Hosting…" : "Host to Debrid"}
          </button>
        )}
        {hosting && (
          <span className="chip" style={{ minWidth: 120 }}>
            {hostingProgress}%
          </span>
        )}
        <button className="btn btn-primary" style={{ padding: "9px 20px", fontSize: 13.5 }} onClick={onPlay}>
          Play
        </button>
      </div>
    </div>
  );
}