import type { Metadata } from "next";
import StaticShell from "@/components/StaticShell";

export const metadata: Metadata = {
  title: "Legal · strawflix.wtf",
  description: "Legal information, DMCA policy and contact for Strawflix.",
};

export default function LegalPage() {
  return (
    <StaticShell title="Legal & DMCA" updated="September 5, 2026">
      <h2>Disclaimers</h2>
      <p className="muted" style={{ lineHeight: 1.7 }}>
        Strawflix is an interface, not a content provider. We do not host, store, upload, or distribute
        any media files, and we are not a streaming video-on-demand provider. All content is provided
        by third-party services and users. Accessing content you do not have the rights to may violate
        the law in your jurisdiction — you are responsible for what you watch.
      </p>

      <h2>Copyright &amp; DMCA</h2>
      <p className="muted" style={{ lineHeight: 1.7 }}>
        We respect the intellectual property rights of others. If you believe material made available
        through this Service infringes your copyright, you may submit a notice to us including:
      </p>
      <ul className="muted" style={{ lineHeight: 1.9, paddingLeft: 20 }}>
        <li>Identification of the copyrighted work claimed to be infringed.</li>
        <li>Identification of the material you claim is infringing, with enough detail to locate it.</li>
        <li>Your contact information (name, email, address, phone).</li>
        <li>A statement made under penalty of perjury that use of the material is not authorized.</li>
        <li>Your physical or electronic signature.</li>
      </ul>
      <p className="muted" style={{ lineHeight: 1.7 }}>
        Because Strawflix itself does not store or serve media content, most takedown requests relate
        to metadata, posters, or other non-infringing reference material, and should be directed to the
        relevant content source. We will review good-faith notices and respond as the law requires.
      </p>

      <h2>Expectations &amp; fair use</h2>
      <p className="muted" style={{ lineHeight: 1.7 }}>
        Metadata, posters and synopses shown in the interface are reference material for search and
        classification and are intended to fall within fair-use norms. They remain the property of
        their respective owners.
      </p>

      <h2>This instance</h2>
      <p className="muted" style={{ lineHeight: 1.7 }}>
        This copy of Strawflix is a self-hosted or hobby deployment. It is provided without warranty
        and without endorsement of any content. If you operate your own instance, you are responsible
        for the applicable laws in your jurisdiction and for any third-party services you connect.
      </p>

      <h2>Contact</h2>
      <p className="muted" style={{ lineHeight: 1.7 }}>
        For legal or support questions regarding this instance, contact the instance operator. If you
        forked or deployed this project yourself, replace this page with your own contact details
        before going public.
      </p>
    </StaticShell>
  );
}