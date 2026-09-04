// Torrentio client (server-side only).
//
// Torrentio implements the Stremio add-on protocol. We query its "stream"
// endpoint with `<realdebrid>=<token>` configuration to find playable links
// for a movie / series. Each stream has a `url` pointing at Torrentio's
// `/realdebrid/<token>/<hash>` proxy, which 302-redirects to a direct
// Real-Debrid download link usable in a <video> element.

import type { TorrentioStream } from "@/lib/types";

export interface MediaRef {
  type: "movie" | "series" | "anime" | "other";
  id: string; // imdb id, e.g. tt1234567
  title: string;
  year?: number;
  season?: number;
  episode?: number;
  poster?: string;
}

export interface ParsedStream {
  displayName: string;
  quality: string;
  cached: boolean;
  sizeLabel?: string;
  seeders?: number;
  container?: string;
}

// Containers the in-browser <video> element can natively play.
export const PLAYABLE_CONTAINERS = new Set(["mp4", "m4v", "webm", "mov", "ogv"]);

function extFrom(inputs: (string | undefined)[]): string | undefined {
  for (const input of inputs) {
    if (!input) continue;
    const chunk =
      input.split("?")[0].split("/").pop() ?? "";
    const clean = (() => {
      try {
        return decodeURIComponent(chunk);
      } catch {
        return chunk;
      }
    })();
    const m = clean.match(/\.([a-z0-9]{2,5})$/i);
    if (m) return m[1].toLowerCase();
  }
  return undefined;
}

function mediaPath(ref: MediaRef): string {
  if (ref.type === "series" && ref.season && ref.episode) {
    return `series/${ref.id}:${ref.season}:${ref.episode}`;
  }
  return `${ref.type}/${ref.id}`;
}

export async function fetchTorrentioStreams(
  token: string,
  ref: MediaRef
): Promise<TorrentioStream[]> {
  const url = `https://torrentio.strem.fun/${encodeURIComponent("realdebrid")}=${token}/stream/${mediaPath(ref)}.json`;

  const res = await fetch(url, {
    headers: { "User-Agent": "strawflix/0.1" },
  });

  if (res.status === 401) throw new Error("REAL_DEBRID_INVALID_TOKEN");
  if (!res.ok) throw new Error(`TORRENTIO_HTTP_${res.status}`);

  const data = (await res.json()) as { streams?: TorrentioStream[] };
  return data.streams ?? [];
}

// The stream objects don't always include an `infoHash`, but Torrentio's
// resolve URLs embed it: /resolve/realdebrid/<token>/<hash>/null/<fileIdx>/...
function infoHashFromUrl(url?: string): string | undefined {
  if (!url) return undefined;
  const parts = url.split("/");
  const idx = parts.findIndex(
    (p) => p === "realdebrid" || (p.startsWith("realdebrid=") && !p.includes(":") && !p.includes("."))
  );
  if (idx === -1) return undefined;
  const hash = parts[idx + 2];
  return hash && /^[a-fA-F0-9]{40}$/.test(hash) ? hash : undefined;
}

export function parseStream(stream: TorrentioStream): ParsedStream & { infoHash?: string } {
  const name = stream.name ?? "";
  const cached = name.includes("RD+") || name.includes("⚡");
  const title = stream.title ?? "";

  // Quality is best taken from Torrentio's short label (name's second line),
  // e.g. "[RD+] Torrentio\n4k DV" -> "4K", "[RD download] Torrentio\nBRRip".
  const labelLine = name.split("\n")[1]?.trim() ?? "";
  const labelMatch = labelLine.match(/\b(2160p|4k|4K|1440p|1080p|1080|720p|480p|BRRip|BDRip|DVDRip)\b/i);
  const quality = labelMatch ? labelMatch[1].toUpperCase().replace("2160P", "4K") : "AUTO";

  const sizeMatch = title.match(/([\d.]+)\s*(GB|MB)/i);
  const sizeLabel = sizeMatch ? `${sizeMatch[1]} ${sizeMatch[2].toUpperCase()}` : undefined;

  const seedMatch = title.match(/👤\s*(\d+)/i);
  const seeders = seedMatch ? parseInt(seedMatch[1], 10) : undefined;

  const firstLine = title.split("\n")[0].trim();
  const displayName = firstLine || quality;

  return {
    displayName,
    quality,
    cached,
    sizeLabel,
    seeders,
    container: extFrom([stream.behaviorHints?.filename, stream.url, title]),
    infoHash: stream.infoHash ?? infoHashFromUrl(stream.url),
  };
}