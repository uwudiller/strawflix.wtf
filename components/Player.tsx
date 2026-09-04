"use client";

import { useEffect, useRef, useState } from "react";
import type { ResolvedStream } from "@/lib/types";

interface PlayerProps {
  stream: ResolvedStream;
  title: string;
  subtitle?: string;
  onClose: () => void;
  resumeSeconds?: number;
  onProgress?: (seconds: number, duration: number) => void;
}

export default function Player({
  stream,
  title,
  subtitle,
  onClose,
  resumeSeconds = 0,
  onProgress,
}: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState<string>(stream.url ?? "");
  const [proxy, setProxy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const resumeApplied = useRef(false);
  const autoFallback = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setInterval> | null>(null);

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

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
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

  // Timecode label from saved position
  const startLabel =
    resumeSeconds > 1 ? timeLabel(resumeSeconds) : null;

  const isMkv = stream.container === "mkv";

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
        className="glass glass-strong animate-in"
        style={{
          width: "100%",
          maxWidth: 1100,
          borderRadius: "var(--radius-xl)",
          padding: 16,
          boxShadow: "0 40px 120px -20px rgba(0,0,0,0.8)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "6px 8px 14px", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>{title}</div>
            <div className="muted" style={{ fontSize: 12.5, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {subtitle ?? stream.displayName}
              {startLabel ? <span style={{ marginLeft: 8 }}>· resume from {startLabel}</span> : null}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span className="chip">{stream.quality}</span>
            <button className="btn" style={{ padding: "10px 16px", fontSize: 13 }} onClick={toggleProxy}>
              {proxy ? "Direct link" : "Proxy mode"}
            </button>
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

        {/* Stage */}
        <div
          style={{
            position: "relative",
            borderRadius: "calc(var(--radius-xl) - 8px)",
            overflow: "hidden",
            background: "#000",
            aspectRatio: "16 / 9",
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
              style={{ width: "100%", height: "100%", display: "block" }}
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
            />
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