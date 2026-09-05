"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function Onboarding() {
  const { setToken, verifying } = useAuth();
  const [tokenInput, setTokenInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    setError(null);
    setBusy(true);
    const ok = await setToken(tokenInput);
    setBusy(false);
    if (!ok) {
      setError("That token doesn't look right. Double-check it on real-debrid.com/apitoken.");
    }
  }

  return (
    <div
      className="animate-in"
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <div style={{ width: "100%", maxWidth: 460 }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 38 }}>
            <span style={{ fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>strawflix</span>
            <span style={{ fontWeight: 800, letterSpacing: "-0.03em", color: "var(--accent)" }}>.wtf</span>
          </div>
        </div>

        {error && (
          <div
            style={{
              marginBottom: 18,
              padding: "12px 14px",
              borderRadius: 14,
              fontSize: 13.5,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.85)",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={submit}>
          <div className="glass" style={{ padding: 32, borderRadius: "var(--radius-lg)" }}>
            <p className="eyebrow">Welcome</p>
            <h2 style={{ margin: "10px 0 8px", fontSize: 30 }}>Connect Real-Debrid</h2>
            <p className="muted" style={{ lineHeight: 1.6, fontSize: 14.5 }}>
              Paste your Real-Debrid API token to unlock instant streaming via
              Torrentio. Your token stays in this browser only.
            </p>

            <div style={{ marginTop: 24 }}>
              <label htmlFor="rdToken" className="muted" style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                Real-Debrid API token
              </label>
              <input
                id="rdToken"
                className="input"
                type="password"
                autoComplete="off"
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                autoFocus
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
              <a
                href="https://real-debrid.com/apitoken"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost"
                style={{ textDecoration: "none", padding: "12px 18px", fontSize: 14 }}
              >
                Get my token →
              </a>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!tokenInput.trim() || busy || verifying}
                style={{ minWidth: 150 }}
              >
                {busy || verifying ? "Checking…" : "Connect"}
              </button>
            </div>
          </div>
        </form>

        <p className="muted-bright" style={{ textAlign: "center", fontSize: 12.5, marginTop: 22, lineHeight: 1.7 }}>
          Requires an active Real-Debrid Premium account.
          <br />
          Only stream content you have permission to watch.
        </p>

        <div className="footer-links" style={{ marginTop: 24 }}>
          <Link className="loud" href="/docs">Docs</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/legal">Legal · DMCA</Link>
        </div>
      </div>
    </div>
  );
}