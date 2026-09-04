// Real-Debrid API client (server-side only).
// Docs: https://api.real-debrid.com/

import { REAL_DEBRID_API } from "@/lib/config";

export interface RDUser {
  id: number;
  username: string;
  email: string;
  type: string;
  points: number;
  locale: string;
  avatar: string;
  premium: number;
  expiration?: string | number | null;
}

export interface RDTorrentInfo {
  id: string;
  filename: string;
  original_filename?: string;
  hash: string;
  bytes: number;
  original_bytes?: number;
  host?: string;
  split?: number;
  progress: number;
  status: string;
  added: string;
  files?: Array<{
    id: number;
    path: string;
    bytes: number;
    selected?: number;
  }>;
  links: string[];
  type?: string;
}

async function rdFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${REAL_DEBRID_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
      ...(init?.headers ?? {}),
    },
  });

  if (res.status === 401) throw new Error("REAL_DEBRID_INVALID_TOKEN");
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`REAL_DEBRID_HTTP_${res.status}${text ? `:${text}` : ""}`);
  }
  return (await res.json()) as T;
}

export function getRDUser(token: string): Promise<RDUser> {
  return rdFetch<RDUser>("/user", token);
}

// Add an uncached magnet to the user's Real-Debrid cloud and select all files.
// Returns the RD torrent id for status polling.
export async function hostMagnet(token: string, magnet: string): Promise<string> {
  const added = await rdFetch<RDTorrentInfo>("/torrents/addMagnet", token, {
    method: "POST",
    body: `magnet=${encodeURIComponent(magnet)}`,
  });

  const info = await rdFetch<RDTorrentInfo>(`/torrents/info/${added.id}`, token);
  const allFiles = (info.files ?? []).map((f) => f.id).join(",");
  if (allFiles) {
    await rdFetch(`/torrents/selectFiles/${added.id}`, token, {
      method: "POST",
      body: `files=${encodeURIComponent(allFiles)}`,
    });
  }
  return added.id;
}

export function getTorrentInfo(token: string, id: string): Promise<RDTorrentInfo> {
  return rdFetch<RDTorrentInfo>(`/torrents/info/${id}`, token);
}

// Turn a host link into an unrestricted, playable direct link.
export async function unrestrictLink(
  token: string,
  link: string
): Promise<string> {
  const r = await rdFetch<{ link: string }>("/unrestrict/link", token, {
    method: "POST",
    body: `link=${encodeURIComponent(link)}`,
  });
  return r.link;
}