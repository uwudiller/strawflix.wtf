import { NextResponse } from "next/server";
import { getCatalog, searchCinemeta } from "@/lib/cinemeta";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const type = (url.searchParams.get("type") ?? "movie") as "movie" | "series";
  const catalog = url.searchParams.get("catalog") ?? "featured";
  const query = url.searchParams.get("query")?.trim();

  try {
    if (query) {
      const metas = await searchCinemeta(type, query);
      return NextResponse.json({ metas });
    }
    const metas = await getCatalog(type, catalog);
    return NextResponse.json({ metas });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown";
    return NextResponse.json(
      { error: message, detail: String(e) },
      { status: 500 }
    );
  }
}