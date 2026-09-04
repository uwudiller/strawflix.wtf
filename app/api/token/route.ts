import { NextResponse } from "next/server";
import { getRDUser } from "@/lib/realDebrid";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";

  if (!token) {
    return NextResponse.json({ error: "missing token" }, { status: 400 });
  }

  try {
    const user = await getRDUser(token);
    return NextResponse.json({ user });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown";
    const status = message === "REAL_DEBRID_INVALID_TOKEN" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}