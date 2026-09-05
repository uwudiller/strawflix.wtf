import type { Metadata } from "next";
import StaticShell from "@/components/StaticShell";

export const metadata: Metadata = {
  title: "Privacy · strawflix.wtf",
  description: "How Strawflix handles your data, tokens and privacy.",
};

export default function PrivacyPage() {
  return (
    <StaticShell title="Privacy Policy" updated="September 5, 2026">
      <p className="muted" style={{ lineHeight: 1.7 }}>
        This policy describes how Strawflix (&quot;we&quot;, &quot;us&quot;) handles information when you
        use the service. We designed Strawflix to be private by default: most of your data never
        leaves your device.
      </p>

      <h2>What we do NOT collect</h2>
      <ul className="muted" style={{ lineHeight: 1.9, paddingLeft: 20 }}>
        <li>We do not track your viewing history.</li>
        <li>We do not sell or share personal data with advertisers.</li>
        <li>We do not require an account or email address.</li>
        <li>We do not store your Real-Debrid API token on any server.</li>
      </ul>

      <h2>Your Real-Debrid token</h2>
      <p className="muted" style={{ lineHeight: 1.7 }}>
        Your API token is held only in your browser&apos;s local storage. When you start a stream,
        your browser requests a signed stream bundle from Real-Debrid. Strawflix routes playback
        through its own proxy endpoint so third-party indexers never see your token. If you clear
        your browser data, your token is gone for good.
      </p>

      <h2>Playback progress &amp; watchlist</h2>
      <p className="muted" style={{ lineHeight: 1.7 }}>
        When enabled, watchlist and continue-watching entries are stored in an encrypted,
        access-controlled key/value store so they can sync across your devices. This data contains
        only identifiers like movie titles, poster URLs and timestamps — never your token. You can
        remove items at any time.
      </p>

      <h2>Third-party services</h2>
      <ul className="muted" style={{ lineHeight: 1.9, paddingLeft: 20 }}>
        <li>
          <strong style={{ color: "var(--text)" }}>Real-Debrid</strong> — provides the streaming
          infrastructure you interact with.
        </li>
        <li>
          <strong style={{ color: "var(--text)" }}>Torrentio / indexers</strong> — discover stream
          links for requested titles. They receive only the title you asked for.
        </li>
        <li>
          <strong style={{ color: "var(--text)" }}>Cinemeta / Stremio add-ons</strong> — provide
          metadata such as posters, ratings and synopses.
        </li>
        <li>
          <strong style={{ color: "var(--text)" }}>OpenSubtitles</strong> — provides subtitle files
          when you request them.
        </li>
      </ul>
      <p className="muted" style={{ lineHeight: 1.7 }}>
        These services operate under their own privacy policies. Strawflix only passes them the
        minimum information needed to function.
      </p>

      <h2>Cookies &amp; analytics</h2>
      <p className="muted" style={{ lineHeight: 1.7 }}>
        Strawflix does not use advertising cookies or third-party analytics. Any authentication or
        feature data is stored locally in your browser. Third-party providers may set cookies in
        accordance with their own policies when you use links we surface.
      </p>

      <h2>Data you send to us</h2>
      <p className="muted" style={{ lineHeight: 1.7 }}>
        If you self-host or contact us, we may receive whatever you choose to share. We keep logs
        only as needed for security and reliability, and purge them periodically.
      </p>

      <h2>Your rights</h2>
      <p className="muted" style={{ lineHeight: 1.7 }}>
        You can stop using the service at any time. To delete synced progress and watchlist entries,
        remove them from the interface. You may also contact us (see Legal) to request deletion of
        any data we hold.
      </p>
    </StaticShell>
  );
}