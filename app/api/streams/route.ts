import { NextResponse } from "next/server";
import {
  PLAYABLE_CONTAINERS,
  fetchTorrentioStreams,
  parseStream,
} from "@/lib/torrentio";

export async function POST(req: Request) {
  let body: {
    token?: string;
    type?: string;
    id?: string;
    season?: number;
    episode?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { token, type: rawType, id, season, episode } = body;
  const type = (rawType ?? "movie") as "movie" | "series" | "anime" | "other";

  if (!token || !id) {
    return NextResponse.json({ error: "missing token or id" }, { status: 400 });
  }

  try {
    const streams = await fetchTorrentioStreams(token, {
      type,
      id,
      season,
      episode,
      title: id,
    });

    const scored = streams
      .map((s) => ({ ...s, ...parseStream(s) }))
      .sort((a, b) => {
        if (a.cached !== b.cached) return a.cached ? -1 : 1;
        const pa = playableRank(a.container);
        const pb = playableRank(b.container);
        if (pa !== pb) return pb - pa;
        const qA = qualityRank(a.quality);
        const qB = qualityRank(b.quality);
        if (qA !== qB) return qB - qA;
        return 0;
      });

    return NextResponse.json({ streams: scored });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown";
    const status = message === "REAL_DEBRID_INVALID_TOKEN" ? 401 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}

function playableRank(container?: string): number {
  if (!container) return 1; // unknown -> treat as neutral
  return PLAYABLE_CONTAINERS.has(container) ? 2 : 0;
}

function qualityRank(q: string): number {
  const map: Record<string, number> = {
    "4K": 5,
    "2160P": 5,
    "1440P": 4.5,
    "1080P": 4,
    "720P": 3,
    "480P": 2,
    AUTO: 1,
  };
  return map[q] ?? 0;
}