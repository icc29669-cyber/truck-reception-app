import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "来場受付",
  description: "来場者受付システム",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body
        className="bg-gray-900 text-white min-h-screen"
        suppressHydrationWarning
        style={{ touchAction: "pan-x pan-y" }}
      >
        {children}
      </body>
    </html>
  );
}
