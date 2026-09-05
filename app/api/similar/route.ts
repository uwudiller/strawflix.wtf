import { NextResponse } from "next/server";
import { getSimilar } from "@/lib/cinemeta";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const type = (url.searchParams.get("type") ?? "movie") as "movie" | "series";
  const id = url.searchParams.get("id") ?? "";

  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  try {
    const metas = await getSimilar(type, id);
    return NextResponse.json({ metas });
  } catch (e) {
    return NextResponse.json({ error: "failed" }, { status: 502 });
  }
}