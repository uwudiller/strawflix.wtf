// Central configuration for Strawflix
//
// Torrentio (a Stremio add-on) does the torrent scraping and, when given your
// Real-Debrid API token, serves playable / cached streams. Real-Debrid does the
// heavy lifting of caching torrents and serving fast direct-download links.

export const TORRENTIO_BASE = "https://torrentio.strem.fun";
export const REAL_DEBRID_API = "https://api.real-debrid.com/rest/1.0";
export const REAL_DEBRID_DEVICE_URL = "https://real-debrid.com/device";

// Optional: you can override the Torrentio instance (e.g. a self-hosted
// instance) via environment variables at build/deploy time.
export const torrentioBase = process.env.TORRENTIO_BASE ?? TORRENTIO_BASE;

// Build a Torrentio instance URL that is configured for your Real-Debrid token.
// Format: /{provider}={token}/stream/{type}/{id}.json
export function torrentioInstance(token: string): string {
  return `${torrentioBase}/${encodeURIComponent("realdebrid")}=${token}`;
}
