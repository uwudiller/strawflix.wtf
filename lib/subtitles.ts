const OS_BASE = "https://api.opensubtitles.com/api/v1";

let tokenCache: { token: string; expiresAt: number } | null = null;

function env(name: string): string | null {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : null;
}

export function osAvailable(): boolean {
  return !!(env("OS_API_KEY") && env("OS_USERNAME") && env("OS_PASSWORD"));
}

async function login(): Promise<string | null> {
  const apiKey = env("OS_API_KEY");
  const username = env("OS_USERNAME");
  const password = env("OS_PASSWORD");
  if (!apiKey || !username || !password) return null;
  if (tokenCache && tokenCache.expiresAt > Date.now()) return tokenCache.token;
  const res = await fetch(`${OS_BASE}/login`, {
    method: "POST",
    headers: { "Api-Key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { token?: string; expires?: string };
  if (!data.token) return null;
  // expires is ISO date string; store with 5-minute safety margin.
  const expiresAt = data.expires ? new Date(data.expires).getTime() - 300_000 : Date.now() + 23 * 3600_000;
  tokenCache = { token: data.token, expiresAt };
  return data.token;
}

export interface OsSubtitle {
  fileId: string;
  label: string;
  lang: string;
  url: string;
}

export async function searchSubtitles(imdbId: string): Promise<OsSubtitle[]> {
  const apiKey = env("OS_API_KEY");
  if (!apiKey) return [];
  const tok = await login();
  if (!tok) return [];
  const imdbClean = imdbId.replace(/^tt/, "");
  const langs = (env("OS_LANGUAGES") ?? "en")
    .split(",")
    .map((l) => l.trim())
    .filter(Boolean)
    .join(",");
  const res = await fetch(
    `${OS_BASE}/subtitles?imdb_id=${imdbClean}&languages=${langs}`,
    {
      headers: {
        "Api-Key": apiKey,
        Authorization: `Bearer ${tok}`,
        "Content-Type": "application/json",
      },
    }
  );
  if (!res.ok) return [];
  const data = (await res.json()) as {
    data?: { id?: string; attributes?: { language?: string; release?: string; url?: string; files?: { file_id: string }[] } }[];
  };
  const items: OsSubtitle[] = [];
  if (!data.data) return items;
  for (const item of data.data.slice(0, 15)) {
    const attrs = item.attributes;
    if (!attrs?.files?.length) continue;
    const fileId = String(attrs.files[0].file_id);
    items.push({
      fileId,
      label: attrs.release ?? attrs.language ?? fileId,
      lang: (attrs.language ?? "en").slice(0, 2),
      url: attrs.url ?? "",
    });
  }
  return items;
}

export async function downloadSubtitle(fileId: string): Promise<string | null> {
  const apiKey = env("OS_API_KEY");
  if (!apiKey) return null;
  const tok = await login();
  if (!tok) return null;
  const res = await fetch(`${OS_BASE}/download`, {
    method: "POST",
    headers: {
      "Api-Key": apiKey,
      Authorization: `Bearer ${tok}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ file_id: Number(fileId), sub_format: "webvtt" }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { link?: string };
  return data.link ?? null;
}