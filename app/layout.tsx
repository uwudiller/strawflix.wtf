import type { Metadata, Viewport } from "next";
import "./globals.css";
import PwaRegister from "@/components/PwaRegister";

export const metadata: Metadata = {
  title: "strawflix.wtf",
  description:
    "Stream movies and series with Real-Debrid + Torrentio. A glassy, cinematic way to watch.",
  icons: {
    icon: "/icon.svg",
  },
  manifest: "/manifest.webmanifest",
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#e50914",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={{ colorScheme: "dark" }}>
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}