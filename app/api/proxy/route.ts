// Optional streaming proxy: forwards a media URL with range support so a
// <video> element can play content that would otherwise be blocked by CORS or
// IP-binding rules. Keep it running over Vercel serverless (streaming).

// Streams are long-lived; don't let Vercel kill the function at the default
// limit (10s) or movies cut out mid-playback. 300s = the max on Pro plans.
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const ALLOWED_SUFFIXES = [
  "torrentio.strem.fun",
  "real-debrid.com",
  "real-debrid.download",
  "real-debrid.cc",
];

function isAllowed(target: string): boolean {
  try {
    const u = new URL(target);
    const host = u.hostname.toLowerCase();
    return ALLOWED_SUFFIXES.some(
      (s) => host === s || host.endsWith(`.${s}`)
    );
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const target = url.searchParams.get("url") ?? "";

  if (!target) {
    return new Response("missing url", { status: 400 });
  }
  if (!/^https?:\/\//i.test(target) || !isAllowed(target)) {
    return new Response("url not allowed", { status: 400 });
  }

  const range = req.headers.get("range");
  const headers: Record<string, string> = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
    Accept: "*/*",
  };
  if (range) headers["Range"] = range;

  try {
    const upstream = await fetch(target, { headers, cache: "no-store" });
    if (!upstream.ok && upstream.status !== 206) {
      return new Response(`upstream error ${upstream.status}`, { status: 502 });
    }

    const upstreamType = upstream.headers.get("content-type") ?? "";
    // Force inline playback, never a download; keep a sane content type.
    const responseHeaders = new Headers({
      "Content-Type": upstreamType || "video/mp4",
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Content-Disposition": "inline",
    });

    if (range && upstream.status === 206 && upstream.headers.get("content-range")) {
      responseHeaders.set("Content-Range", upstream.headers.get("content-range") ?? "");
    }
    const len = upstream.headers.get("content-length");
    if (len) responseHeaders.set("Content-Length", len);

    return new Response(upstream.body, {
      status: range ? 206 : 200,
      headers: responseHeaders,
    });
  } catch {
    return new Response("proxy error", { status: 502 });
  }
}