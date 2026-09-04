import { NextResponse } from "next/server";
import { getTorrentInfo } from "@/lib/realDebrid";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";
  const id = url.searchParams.get("id") ?? "";

  if (!token || !id) {
    return NextResponse.json({ error: "missing token or id" }, { status: 400 });
  }

  try {
    const info = await getTorrentInfo(token, id);

    return NextResponse.json({
      status: info.status,
      progress: info.progress,
      name: info.filename,
      bytes: info.bytes,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}