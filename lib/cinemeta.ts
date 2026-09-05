// Helper for proxying the Cinemeta metadata add-on (Stremio's official
// metadata provider). It provides catalogs, search and rich meta data
// (posters, background art, ratings, episode lists) without any API key.

import type { CinemetaMeta } from "@/lib/types";

const CINEMETA = "https://v3-cinemeta.strem.io";

async function cinemetaFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${CINEMETA}${path}`, {
    headers: { "User-Agent": "strawflix/0.1" },
  });
  if (!res.ok) throw new Error(`CINEMETA_HTTP_${res.status}`);
  return (await res.json()) as T;
}

export async function getCatalog(type: "movie" | "series", id = "top"): Promise<CinemetaMeta[]> {
  const data = await cinemetaFetch<{ metas: CinemetaMeta[] }>(
    `/catalog/${type}/${id}.json`
  );
  return data.metas ?? [];
}

export async function searchCinemeta(
  type: "movie" | "series",
  query: string
): Promise<CinemetaMeta[]> {
  const data = await cinemetaFetch<{ metas: CinemetaMeta[] }>(
    `/catalog/${type}/top/search=${encodeURIComponent(query)}.json`
  );
  return data.metas ?? [];
}

export async function getMeta(
  type: "movie" | "series",
  id: string
): Promise<CinemetaMeta | null> {
  const data = await cinemetaFetch<{ meta: CinemetaMeta }>(`/meta/${type}/${id}.json`);
  return data.meta ?? null;
}

export async function getSimilar(
  type: "movie" | "series",
  id: string
): Promise<CinemetaMeta[]> {
  const data = await cinemetaFetch<{ metas: CinemetaMeta[] }>(
    `/catalog/${type}/recommend/${id}.json`
  );
  return data.metas ?? [];
}