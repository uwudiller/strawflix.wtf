import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Proxies a subtitle file download link so the browser never makes a
// cross-origin request to OpenSubtitles' signed CDN URL.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const target = url.searchParams.get("url");

  if (!target) {
    return NextResponse.json({ error: "missing url" }, { status: 400 });
  }

  try {
    const upstream = await fetch(target);
    if (!upstream.ok) {
      return NextResponse.json({ error: `upstream ${upstream.status}` }, { status: 502 });
    }
    const body = await upstream.text();

    return new NextResponse(body, {
      headers: {
        "Content-Type": "text/vtt; charset=utf-8",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "proxy failed" }, { status: 502 });
  }
}