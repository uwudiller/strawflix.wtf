"use client";

import type { CinemetaMeta } from "@/lib/types";
import { useRouter } from "next/navigation";

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
  const type = meta.type ?? fallbackType;

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