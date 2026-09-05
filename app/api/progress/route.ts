import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { kvAvailable, kvGet, kvSet, kvDel } from "@/lib/kv";

function userKey(token: string): string {
  return createHash("sha256").update(token).digest("hex").slice(0, 32);
}

// Allow the edge-style node runtime so the streaming progress route works on
// both Hobby and Pro; KV itself is fetched over HTTP so no native APIs needed.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!kvAvailable()) {
    return NextResponse.json({ disabled: true }, { status: 501 });
  }
  const token = req.headers.get("x-progress-token") ?? "";
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const raw = await kvGet(`progress:${userKey(token)}`);
  return NextResponse.json({ map: raw ? JSON.parse(raw) : null });
}

export async function PUT(req: Request) {
  if (!kvAvailable()) {
    return NextResponse.json({ disabled: true }, { status: 501 });
  }
  const token = req.headers.get("x-progress-token") ?? "";
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { map } = (await req.json()) as { map?: Record<string, unknown> };
  if (!map || typeof map !== "object") {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  await kvSet(`progress:${userKey(token)}`, JSON.stringify(map));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!kvAvailable()) {
    return NextResponse.json({ disabled: true }, { status: 501 });
  }
  const token = req.headers.get("x-progress-token") ?? "";
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await kvDel(`progress:${userKey(token)}`);
  return NextResponse.json({ ok: true });
}
