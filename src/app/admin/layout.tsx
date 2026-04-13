"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "受付一覧", icon: "\u{1F4CB}" },
  { href: "/admin/reservations", label: "予約管理", icon: "\u{1F4C5}" },
  { href: "/admin/drivers", label: "ドライバー", icon: "\u{1F464}" },
  { href: "/admin/vehicles", label: "車両", icon: "\u{1F69B}" },
  { href: "/admin/centers", label: "センター管理", icon: "\u{1F3ED}" },
  { href: "/admin/settings", label: "システム設定", icon: "\u{1F527}" },
];

const BERTH_ADMIN_URL = process.env.NEXT_PUBLIC_BERTH_ADMIN_URL || "";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [dateStr, setDateStr] = useState("");
  useEffect(() => {
    setDateStr(new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" }));
  }, []);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div style={{ colorScheme: "light" }} className="flex h-screen overflow-hidden bg-gray-100">
      {/* ── Sidebar ── */}
      <aside className="flex flex-col w-[240px] min-w-[240px] bg-white border-r border-gray-200 shadow-sm">
        {/* Header */}
        <div
          className="flex items-center gap-2 px-5 py-4 text-white font-black text-lg tracking-wide"
          style={{ background: "#1a3a6b" }}
        >
          <span className="text-xl">{"\u{1F69B}"}</span>
          <span>管理画面</span>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-5 py-3 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-blue-50 text-[#1a3a6b] border-r-4 border-[#1a3a6b]"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-200 space-y-2">
          {BERTH_ADMIN_URL && (
            <a
              href={BERTH_ADMIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-blue-500 hover:text-blue-700 transition-colors font-semibold"
            >
              <span>{"\u{1F517}"}</span>
              <span>予約システム管理画面</span>
            </a>
          )}
          <Link
            href="/kiosk"
            className="text-xs text-gray-400 hover:text-blue-500 transition-colors"
          >
            {"\u2190"} キオスク画面へ
          </Link>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header
          className="flex items-center justify-between px-8 py-3 text-white shadow-md"
          style={{ background: "#1a3a6b" }}
        >
          <h1 className="text-xl font-black tracking-wide">
            {"\u{1F69B}"} トラック受付　管理画面
          </h1>
          <span className="text-sm text-blue-200">
            {dateStr}
          </span>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6" style={{ background: "#F8FAFC" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
