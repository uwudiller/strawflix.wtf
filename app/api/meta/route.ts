import { NextResponse } from "next/server";
import { getMeta } from "@/lib/cinemeta";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const type = (url.searchParams.get("type") ?? "movie") as "movie" | "series";
  const id = url.searchParams.get("id") ?? "";

  if (!id) {
    return NextResponse.json({ error: "missing id" }, { status: 400 });
  }

  try {
    const meta = await getMeta(type, id);
    if (!meta) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return NextResponse.json({ meta });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}