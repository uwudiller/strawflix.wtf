import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";

export default function StaticShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ paddingBottom: 80 }}>
      <header className="nav-scrim">
        <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <Wordmark size={22} />
        </Link>
        <div style={{ flex: 1 }} />
        <nav style={{ display: "flex", gap: "clamp(12px, 1.6vw, 24px)", alignItems: "center" }}>
          <Link className="nav-link" href="/docs">
            Docs
          </Link>
          <Link className="nav-link" href="/privacy">
            Privacy
          </Link>
          <Link className="nav-link" href="/terms">
            Terms
          </Link>
          <Link className="nav-link" href="/legal">
            Legal
          </Link>
        </nav>
      </header>

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "48px clamp(20px, 4vw, 48px) 0" }}>
        <Wordmark size={20} gold={false} />
        <h1 style={{ fontSize: "clamp(32px, 5vw, 48px)", marginTop: 18, letterSpacing: "-0.03em" }}>
          {title}
        </h1>
        <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>
          Last updated · {updated}
        </p>
        <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 18 }}>
          {children}
        </div>
      </main>
    </div>
  );
}