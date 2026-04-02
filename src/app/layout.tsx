import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "来場受付",
  description: "来場者受付システム",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-gray-900 text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
