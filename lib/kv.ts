// Thin wrapper around the Upstash / Vercel KV REST API.
// If the env vars are missing the whole module is a no-op and callers
// fall back to localStorage.

const BASE = process.env.KV_REST_API_URL ?? "";
const AUTH = process.env.KV_REST_API_TOKEN ?? "";

export function kvAvailable(): boolean {
  return Boolean(BASE && AUTH);
}

async function kvFetch(
  path: string,
  init?: RequestInit
): Promise<string | null> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${AUTH}`, ...(init?.headers ?? {}) },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { result?: string | null };
  return json.result ?? null;
}

export async function kvGet(key: string): Promise<string | null> {
  return kvFetch(`/get/${encodeURIComponent(key)}`);
}

export async function kvSet(
  key: string,
  value: string
): Promise<void> {
  await kvFetch(`/set/${encodeURIComponent(key)}`, {
    method: "POST",
    body: value,
    headers: { "Content-Type": "text/plain" },
  });
}

export async function kvDel(key: string): Promise<void> {
  await kvFetch(`/del/${encodeURIComponent(key)}`);
}
