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

export async function getCatalog(
  type: "movie" | "series",
  id = "top",
  skip = 0
): Promise<CinemetaMeta[]> {
  const data = await cinemetaFetch<{ metas: CinemetaMeta[] }>(
    `/catalog/${type}/${id}.json${skip > 0 ? `?skip=${skip}` : ""}`
  );
  return data.metas ?? [];
}

// Fetch enough pages of the "top" catalog to reach `count` unique titles.
export async function getTopMetas(
  type: "movie" | "series",
  count = 50
): Promise<CinemetaMeta[]> {
  const seen = new Map<string, CinemetaMeta>();
  let skip = 0;
  let attempts = 0;
  while (seen.size < count && attempts < 10) {
    const batch = await getCatalog(type, "top", skip);
    if (!batch.length) break;
    for (const m of batch) {
      if (m.id && !seen.has(m.id)) seen.set(m.id, m);
    }
    skip += batch.length;
    attempts += 1;
    if (batch.length < 24) break;
  }
  return [...seen.values()].slice(0, count);
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