import type { Metadata } from "next";
import StaticShell from "@/components/StaticShell";

export const metadata: Metadata = {
  title: "Terms · strawflix.wtf",
  description: "Terms of service for Strawflix.",
};

export default function TermsPage() {
  return (
    <StaticShell title="Terms of Service" updated="September 5, 2026">
      <p className="muted" style={{ lineHeight: 1.7 }}>
        By accessing or using Strawflix (&quot;the Service&quot;) you agree to these terms. If you do
        not agree, do not use the Service.
      </p>

      <h2>1. Description of service</h2>
      <p className="muted" style={{ lineHeight: 1.7 }}>
        Strawflix is a software interface that connects to third-party services (including
        Real-Debrid, Torrentio, Cinemeta and OpenSubtitles) to stream media. We do not host, upload,
        or produce any media content ourselves.
      </p>

      <h2>2. Acceptable use</h2>
      <ul className="muted" style={{ lineHeight: 1.9, paddingLeft: 20 }}>
        <li>You must have legal rights to the media you access through the Service.</li>
        <li>You must comply with the terms of any third-party service you use (e.g. Real-Debrid).</li>
        <li>You may not use the Service for unlawful purposes or to infringe copyright.</li>
        <li>You may not attempt to interfere with, abuse, or reverse engineer the Service.</li>
      </ul>

      <h2>3. No warranties</h2>
      <p className="muted" style={{ lineHeight: 1.7 }}>
        The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of
        any kind, express or implied, including fitness for a particular purpose. We do not guarantee
        availability, accuracy, or that any particular title will be playable.
      </p>

      <h2>4. Limitation of liability</h2>
      <p className="muted" style={{ lineHeight: 1.7 }}>
        To the maximum extent permitted by law, Strawflix and its operators shall not be liable for any
        indirect, incidental, special, consequential or punitive damages, or for any loss of data,
        arising out of or in connection with your use of the Service.
      </p>

      <h2>5. Third-party services</h2>
      <p className="muted" style={{ lineHeight: 1.7 }}>
        The Service relies on third-party providers. We are not responsible for their content,
        availability, or practices. Your use of each provider is governed by their own terms.
      </p>

      <h2>6. Intellectual property</h2>
      <p className="muted" style={{ lineHeight: 1.7 }}>
        Strawflix software is provided as open source under its own license. Media metadata, posters,
        logos and trademarks belong to their respective owners and are used only for identification
        and commentary purposes.
      </p>

      <h2>7. Changes</h2>
      <p className="muted" style={{ lineHeight: 1.7 }}>
        We may update these terms from time to time. Continued use of the Service after changes
        constitutes acceptance of the updated terms.
      </p>

      <h2>8. Governing law</h2>
      <p className="muted" style={{ lineHeight: 1.7 }}>
        These terms are governed by the laws of the jurisdiction in which the Service operator is
        located, without regard to conflict-of-law principles.
      </p>

      <h2>9. Contact</h2>
      <p className="muted" style={{ lineHeight: 1.7 }}>
        Questions about these terms can be sent using the contact details in the Legal section.
      </p>
    </StaticShell>
  );
}