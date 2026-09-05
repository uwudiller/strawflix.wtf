import { NextResponse } from "next/server";
import { getTopMetas, searchCinemeta } from "@/lib/cinemeta";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const type = (url.searchParams.get("type") ?? "movie") as "movie" | "series";
  const query = url.searchParams.get("query")?.trim();

  try {
    if (query) {
      const metas = await searchCinemeta(type, query);
      return NextResponse.json({ metas });
    }
    const metas = await getTopMetas(type, 50);
    return NextResponse.json({ metas });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown";
    return NextResponse.json(
      { error: message, detail: String(e) },
      { status: 500 }
    );
  }
}