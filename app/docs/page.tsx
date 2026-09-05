import type { Metadata } from "next";
import StaticShell from "@/components/StaticShell";

export const metadata: Metadata = {
  title: "Docs · strawflix.wtf",
  description: "How Strawflix works, how to set it up, and how to get the most out of it.",
};

export default function DocsPage() {
  return (
    <StaticShell title="Documentation" updated="September 5, 2026">
      <h2>What is Strawflix?</h2>
      <p className="muted" style={{ lineHeight: 1.7 }}>
        Strawflix is an open, self-hostable streaming interface that brings together your{" "}
        <strong style={{ color: "var(--text)" }}>Real-Debrid</strong> account and community sources
        discovered through <strong style={{ color: "var(--text)" }}>Torrentio</strong>. It gives you a
        fast, glassy, private way to watch movies and series in your browser.
      </p>

      <h2>Requirements</h2>
      <ul className="muted" style={{ lineHeight: 1.9, paddingLeft: 20 }}>
        <li>An active Real-Debrid Premium subscription</li>
        <li>Your personal Real-Debrid API token (never leaves your browser)</li>
        <li>A modern browser — Chrome, Edge, Firefox or Safari</li>
      </ul>

      <h2>Getting started</h2>
      <p className="muted" style={{ lineHeight: 1.7 }}>
        1. Open Real-Debrid&apos;s <strong style={{ color: "var(--text)" }}>API token</strong> page and
        copy your token.
        <br />
        2. Paste it on the home screen and press <em>Connect</em>.
        <br />
        3. Browse movies and series, hit play, and watch.
      </p>

      <h2>Features</h2>
      <ul className="muted" style={{ lineHeight: 1.9, paddingLeft: 20 }}>
        <li>Instant playback of cached, ready-to-stream titles (⚡ Instant)</li>
        <li>One-click hosting of uncached torrents to your Real-Debrid cloud</li>
        <li>Watchlist (My List) and Continue Watching synced across devices</li>
        <li>Keyboard shortcuts — space plays/pauses, arrows seek ±10s, F fullscreen</li>
        <li>Playback speed from 0.5× to 2×, Cast support, and subtitle download</li>
        <li>Automatic next-episode playback for series</li>
        <li>Installable as a PWA — use it from your home screen</li>
        <li>More-like-this recommendations via Cinemeta</li>
      </ul>

      <h2>Your token stays private</h2>
      <p className="muted" style={{ lineHeight: 1.7 }}>
        Your Real-Debrid token is stored only in your browser&apos;s local storage. Strawflix proxies
        video and subtitle traffic through its own endpoints so your token is never exposed to third
        parties. See the Privacy policy for details.
      </p>

      <h2>Playback tips</h2>
      <ul className="muted" style={{ lineHeight: 1.9, paddingLeft: 20 }}>
        <li>
          Prefer <strong style={{ color: "var(--text)" }}>MP4 / WebM</strong> containers for the most
          reliable playback. MKV may not play in every browser.
        </li>
        <li>
          If the proxy has trouble, switch to <em>Direct link</em> mode in the player.
        </li>
        <li>
          If a stream is slow, pick a smaller, cached file — usually a 1080p RARBG or similar source
          is the sweet spot.
        </li>
      </ul>

      <h2>Self-hosting</h2>
      <p className="muted" style={{ lineHeight: 1.7 }}>
        Strawflix runs on Next.js and deploys to Vercel out of the box. Set the Real-Debrid, Torrentio
        and OpenSubtitles environment variables shown in <code style={{ color: "var(--text)" }}>.env.example</code>,
        add a KV store for progress/watchlist sync, and deploy. Because your token never leaves the
        browser, you can even run it without your own backend for single-user use.
      </p>
    </StaticShell>
  );
}