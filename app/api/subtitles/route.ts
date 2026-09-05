import { NextResponse } from "next/server";
import { osAvailable, searchSubtitles, type OsSubtitle } from "@/lib/subtitles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!osAvailable()) return NextResponse.json({ disabled: true, subtitles: [] });
  const url = new URL(req.url);
  const imdbId = url.searchParams.get("imdbId")?.trim();
  if (!imdbId) return NextResponse.json({ subtitles: [] });

  try {
    const subtitles = await searchSubtitles(imdbId);
    return NextResponse.json({ subtitles });
  } catch {
    return NextResponse.json({ subtitles: [] });
  }
}