"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ResolvedStream } from "@/lib/types";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const SEEK_STEP = 10;

interface PlayerProps {
  stream: ResolvedStream;
  title: string;
  subtitle?: string;
  onClose: () => void;
  resumeSeconds?: number;
  onProgress?: (seconds: number, duration: number) => void;
  onEnded?: () => void;
  nextLabel?: string;
  onNext?: () => void;
  onPrev?: () => void;
  subtitleImdbId?: string;
}

interface SubFile {
  fileId: string;
  label: string;
  lang: string;
  url: string;
}

export default function Player({
  stream,
  title,
  subtitle,
  onClose,
  resumeSeconds = 0,
  onProgress,
  onEnded,
  nextLabel,
  onNext,
  onPrev,
  subtitleImdbId,
}: PlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState<string>(stream.url ?? "");
  const [proxy, setProxy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const resumeApplied = useRef(false);
  const autoFallback = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [speed, setSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [castSupported, setCastSupported] = useState(false);

  // Subtitles
  const [subs, setSubs] = useState<SubFile[]>([]);
  const [selectedSubIdx, setSelectedSubIdx] = useState<number>(-1);
  const [subError, setSubError] = useState<string | null>(null);

  const directUrl = stream.url ?? "";

  function computeSrc(isProxy: boolean) {
    return isProxy ? `/api/proxy?url=${encodeURIComponent(directUrl)}` : directUrl;
  }

  function toggleProxy() {
    setError(null);
    setLoading(true);
    setResumeBehaviour(false);
    setProxy((p) => {
      const next = !p;
      setSrc(computeSrc(next));
      return next;
    });
  }

  // Reset whenever a new stream is opened.
  useEffect(() => {
    setProxy(true);
    setSrc(computeSrc(true));
    setError(null);
    setLoading(true);
    resumeApplied.current = false;
    setSpeed(1);
    setSelectedSubIdx(-1);
    setSubs([]);
    setSubError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream]);

  // Apply resume once metadata loads.
  function setResumeBehaviour(force: boolean) {
    const v = videoRef.current;
    if (!v) return;
    resumeApplied.current = true;
    if (force && resumeSeconds > 1 && v.duration && resumeSeconds < v.duration) {
      v.currentTime = resumeSeconds;
    }
  }

  // Flush the current position when the player unmounts.
  useEffect(() => {
    return () => {
      const v = videoRef.current;
      if (v && v.duration) onProgress?.(v.currentTime, v.duration);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Periodic progress reporting.
  useEffect(() => {
    const tick = () => {
      const v = videoRef.current;
      if (v && v.duration) {
        onProgress?.(v.currentTime, v.duration);
      }
    };
    saveTimer.current = setInterval(tick, 5000);
    return () => {
      if (saveTimer.current) clearInterval(saveTimer.current);
    };
  }, [onProgress, src]);

  // Keyboard shortcuts.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const v = videoRef.current;
      if (!v) return;
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        v.currentTime = Math.max(0, v.currentTime - SEEK_STEP);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        v.currentTime = Math.min(v.duration, v.currentTime + SEEK_STEP);
      } else if (e.key === " ") {
        e.preventDefault();
        v.paused ? v.play() : v.pause();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        v.volume = Math.min(1, v.volume + 0.05);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        v.volume = Math.max(0, v.volume - 0.05);
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Speed
  useEffect(() => {
    const v = videoRef.current;
    if (v) v.playbackRate = speed;
  }, [speed, src]);

  // Fullscreen
  function toggleFullscreen() {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  useEffect(() => {
    function onChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Cast via Remote Playback API
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const rp = (v as HTMLVideoElement & {
      remotePlayback?: { prompt: () => Promise<void>; watchAvailability?: () => Promise<unknown> };
    }).remotePlayback;
    if (rp && typeof rp.prompt === "function") {
      setCastSupported(true);
    }
  }, [src]);

  function promptCast() {
    const v = videoRef.current;
    if (!v) return;
    const rp = (v as HTMLVideoElement & {
      remotePlayback?: { prompt: () => Promise<void> };
    }).remotePlayback;
    if (!rp) return;
    rp.prompt().catch(() => {});
  }

  // Load subtitles list
  useEffect(() => {
    if (!subtitleImdbId) return;
    setSubs([]);
    setSelectedSubIdx(-1);
    setSubError(null);
    fetch(`/api/subtitles?imdbId=${subtitleImdbId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.disabled || !d?.subtitles?.length) {
          setSubError(null);
          return;
        }
        const mapped: SubFile[] = (d.subtitles as { fileId: string; label: string; lang: string; url: string }[])
          .map((s) => ({ fileId: s.fileId, label: s.label, lang: s.lang, url: s.url }));
        setSubs(mapped);
      })
      .catch(() => setSubError(null));
  }, [subtitleImdbId]);

  // Timecode label from saved position
  const startLabel =
    resumeSeconds > 1 ? timeLabel(resumeSeconds) : null;

  const isMkv = stream.container === "mkv";

  const activeSub = selectedSubIdx >= 0 ? subs[selectedSubIdx] : null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(5,5,8,0.82)",
        backdropFilter: "blur(30px) saturate(140%)",
        WebkitBackdropFilter: "blur(30px) saturate(140%)",
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        ref={containerRef}
        className="glass glass-strong animate-in"
        style={{
          width: "100%",
          maxWidth: 1100,
          borderRadius: isFullscreen ? 0 : "var(--radius-xl)",
          padding: isFullscreen ? 0 : 16,
          boxShadow: isFullscreen ? "none" : "0 40px 120px -20px rgba(0,0,0,0.8)",
          background: isFullscreen ? "#000" : undefined,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {!isFullscreen && (
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "6px 8px 14px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>{title}</div>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {subtitle ?? stream.displayName}
                {startLabel ? <span style={{ marginLeft: 8 }}>· resume from {startLabel}</span> : null}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span className="chip">{stream.quality}</span>
              <select
                aria-label="Playback speed"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                style={{
                  padding: "7px 10px",
                  fontSize: 12.5,
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(255,255,255,0.08)",
                  color: "var(--text)",
                  cursor: "pointer",
                }}
              >
                {SPEEDS.map((s) => (
                  <option key={s} value={s}>{s === 1 ? "1×" : `${s}×`}</option>
                ))}
              </select>
              {castSupported && (
                <button className="btn" style={{ padding: "9px 14px", fontSize: 12.5 }} onClick={promptCast}>
                  Cast
                </button>
              )}
              <button className="btn" style={{ padding: "9px 14px", fontSize: 12.5 }} onClick={toggleFullscreen}>
                {isFullscreen ? "Exit Full" : "Full"}
              </button>
              <button className="btn" style={{ padding: "9px 14px", fontSize: 13 }} onClick={toggleProxy}>
                {proxy ? "Direct link" : "Proxy mode"}
              </button>
              {onPrev && (
                <button className="btn" style={{ padding: "9px 14px", fontSize: 13 }} onClick={onPrev}>
                  ← Prev
                </button>
              )}
              {nextLabel && (
                <button className="btn" style={{ padding: "9px 14px", fontSize: 12.5, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} onClick={onNext} title={nextLabel}>
                  ▸ Next
                </button>
              )}
              {subs.length > 0 && (
                <select
                  aria-label="Subtitles"
                  value={selectedSubIdx}
                  onChange={(e) => setSelectedSubIdx(Number(e.target.value))}
                  style={{
                    padding: "7px 10px",
                    fontSize: 12.5,
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.18)",
                    background: "rgba(255,255,255,0.08)",
                    color: "var(--text)",
                    cursor: "pointer",
                  }}
                >
                  <option value={-1}>CC: Off</option>
                  {subs.map((s, i) => (
                    <option key={s.fileId} value={i}>{s.label}</option>
                  ))}
                </select>
              )}
              <button
                className="btn"
                style={{ padding: "10px 16px", fontSize: 13 }}
                onClick={onClose}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Stage */}
        <div
          style={{
            position: "relative",
            borderRadius: isFullscreen ? 0 : "calc(var(--radius-xl) - 8px)",
            overflow: "hidden",
            background: "#000",
            aspectRatio: isFullscreen ? undefined : "16 / 9",
            display: "grid",
            placeItems: "center",
          }}
        >
          {loading && (
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", zIndex: 2, background: "#000" }}>
              <span className="spinner" style={{ width: 40, height: 40 }} />
            </div>
          )}

          {src ? (
            <video
              key={src}
              ref={videoRef}
              controls
              autoPlay
              playsInline
              style={{ width: "100%", height: isFullscreen ? "100vh" : "100%", display: "block" }}
              onLoadedMetadata={(e) => {
                setLoading(false);
                if (!resumeApplied.current) setResumeBehaviour(true);
              }}
              onCanPlay={() => {
                setLoading(false);
                setError(null);
              }}
              onPlaying={() => {
                setLoading(false);
                setError(null);
              }}
              onWaiting={() => setLoading(true)}
              onEnded={() => onEnded?.()}
              onError={() => {
                setLoading(false);
                if (proxy && !autoFallback.current) {
                  autoFallback.current = true;
                  toggleProxy();
                  setError("Proxy hiccuped — retrying on the direct link…");
                  return;
                }
                setError(
                  `Couldn't play this link${proxy ? " through the proxy" : ""}.` +
                    (isMkv
                      ? " It's an MKV, which browsers rarely play — pick an MP4/WebM stream instead."
                      : " Try switching modes above.")
                );
              }}
              src={src}
            >
              {activeSub && (
                <track
                  key={activeSub.fileId}
                  kind="subtitles"
                  src={activeSub.url}
                  srcLang={activeSub.lang}
                  label={activeSub.label}
                  default
                />
              )}
            </video>
          ) : (
            <div className="muted" style={{ fontSize: 15 }}>
              No playable link for this stream.
            </div>
          )}
        </div>

        {error && (
          <div
            style={{
              marginTop: 14,
              padding: "12px 14px",
              borderRadius: 14,
              fontSize: 13.5,
              border: "1px solid rgba(255,255,255,0.16)",
              background: "rgba(255,255,255,0.06)",
            }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export function timeLabel(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}