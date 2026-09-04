import { NextResponse } from "next/server";
import { hostMagnet } from "@/lib/realDebrid";

export async function POST(req: Request) {
  let body: { token?: string; magnet?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { token, magnet } = body;
  if (!token || !magnet) {
    return NextResponse.json({ error: "missing token or magnet" }, { status: 400 });
  }

  try {
    const torrentId = await hostMagnet(token, magnet);
    return NextResponse.json({ torrentId });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}