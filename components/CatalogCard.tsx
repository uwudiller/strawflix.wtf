"use client";

import type { CinemetaMeta } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useWatchlist } from "@/lib/watchlist";

export default function CatalogCard({
  meta,
  index,
  fallbackType,
}: {
  meta: CinemetaMeta;
  index: number;
  fallbackType: "movie" | "series";
}) {
  const router = useRouter();
  const { has, toggle } = useWatchlist();
  const type = meta.type ?? fallbackType;
  const saved = has(meta.id);

  return (
    <div
      className="card animate-in"
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
      onClick={() => router.push(`/title/${type}/${meta.id}`)}
    >
      <div className="card-poster">
        {meta.poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={meta.poster} alt={meta.name} loading="lazy" style={{ borderRadius: "inherit" }} />
        ) : (
          <div className="card-fallback">{meta.name?.trim().charAt(0).toUpperCase() || "S"}</div>
        )}
        <button
          aria-label={saved ? "Remove from My List" : "Add to My List"}
          title={saved ? "Remove from My List" : "Add to My List"}
          onClick={(e) => {
            e.stopPropagation();
            toggle({
              id: meta.id,
              type,
              name: meta.name ?? meta.id,
              poster: meta.poster,
              background: meta.background,
            });
          }}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 3,
            width: 32,
            height: 32,
            borderRadius: 999,
            display: "grid",
            placeItems: "center",
            fontSize: 16,
            lineHeight: 1,
            border: "1px solid rgba(255,255,255,0.18)",
            background: saved ? "rgba(229,9,20,0.92)" : "rgba(10,10,12,0.55)",
            color: saved ? "#0a0a0c" : "rgba(255,255,255,0.85)",
            backdropFilter: "blur(8px)",
            cursor: "pointer",
          }}
        >
          {saved ? "★" : "☆"}
        </button>
      </div>
      <div className="card-body">
        <div className="card-title">{meta.name}</div>
        <div className="card-sub">
          <span>{meta.year || meta.releaseInfo || ""}</span>
          {meta.imdbRating ? (
            <span style={{ color: "rgba(255,255,255,0.8)", fontWeight: 700 }}>★ {meta.imdbRating}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}