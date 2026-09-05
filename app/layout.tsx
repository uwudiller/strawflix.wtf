import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "strawflix.uwu",
  description:
    "Stream movies and series with Real-Debrid + Torrentio. A glassy, cinematic way to watch.",
  icons: {
    icon: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0c",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={{ colorScheme: "dark" }}>
      <body>{children}</body>
    </html>
  );
}