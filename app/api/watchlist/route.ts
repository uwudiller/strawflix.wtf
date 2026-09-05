import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { kvAvailable, kvGet, kvSet } from "@/lib/kv";

function userKey(token: string): string {
  return createHash("sha256").update(token).digest("hex").slice(0, 32);
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!kvAvailable()) {
    return NextResponse.json({ disabled: true }, { status: 501 });
  }
  const token = req.headers.get("x-progress-token") ?? "";
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const raw = await kvGet(`watchlist:${userKey(token)}`);
  return NextResponse.json({ items: raw ? JSON.parse(raw) : null });
}

export async function PUT(req: Request) {
  if (!kvAvailable()) {
    return NextResponse.json({ disabled: true }, { status: 501 });
  }
  const token = req.headers.get("x-progress-token") ?? "";
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { items } = (await req.json()) as { items?: Record<string, unknown> };
  if (!items || typeof items !== "object") {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  await kvSet(`watchlist:${userKey(token)}`, JSON.stringify(items));
  return NextResponse.json({ ok: true });
}