"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_MAIN = [
  { href: "/admin", label: "ダッシュボード", icon: "\u{1F3E0}" },
  { href: "/admin/reservations", label: "予約管理", icon: "\u{1F4C5}" },
  { href: "/admin/receptions", label: "受付一覧", icon: "\u{1F4CB}" },
];
const NAV_DATA = [
  { href: "/admin/drivers", label: "ドライバー・会社", icon: "\u{1F464}" },
  { href: "/admin/vehicles", label: "車両", icon: "\u{1F69B}" },
];
const NAV_COMMON = [
  { href: "/admin/users", label: "ユーザー管理", icon: "\u{1F511}" },
  { href: "/admin/centers", label: "センター設定", icon: "\u{1F3ED}" },
  { href: "/admin/settings", label: "システム設定", icon: "\u{1F527}" },
  { href: "/admin/driver-guide", label: "ドライバー向け案内", icon: "\u{1F4F1}" },
  { href: "/admin/changelog", label: "更新履歴", icon: "\u{1F4DD}" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [dateStr, setDateStr] = useState("");
  const [me, setMe] = useState<{ loginId: string; name: string; centerName: string; centerCode: string } | null>(null);

  useEffect(() => {
    setDateStr(new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" }));
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.authenticated) setMe(d.user); })
      .catch(() => {});
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

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
          {NAV_MAIN.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-5 py-3 text-sm font-semibold transition-colors ${
                  active ? "bg-blue-50 text-[#1a3a6b] border-r-4 border-[#1a3a6b]" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}>
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="px-5 pt-5 pb-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">データ</span>
          </div>
          {NAV_DATA.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-5 py-3 text-sm font-semibold transition-colors ${
                  active ? "bg-blue-50 text-[#1a3a6b] border-r-4 border-[#1a3a6b]" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}>
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="px-5 pt-5 pb-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">共通設定</span>
          </div>
          {NAV_COMMON.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-5 py-3 text-sm font-semibold transition-colors ${
                  active ? "bg-blue-50 text-[#1a3a6b] border-r-4 border-[#1a3a6b]" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}>
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer: user + logout */}
        <div className="px-5 py-3 border-t border-gray-200 space-y-2">
          {me && (
            <div className="text-xs text-gray-500">
              <div className="font-bold text-gray-700">{me.name || me.loginId}</div>
              <div>ID: {me.loginId}</div>
              <div className="text-gray-400">{me.centerCode} {me.centerName}</div>
            </div>
          )}
          {/* キオスク起動: 大きめの目立つボタン */}
          <Link
            href="/kiosk"
            className="flex items-center justify-center gap-2 w-full rounded-xl py-3 text-white font-black text-sm shadow hover:shadow-md transition-all active:scale-[0.98]"
            style={{ background: "linear-gradient(180deg,#0D9488,#0F766E)" }}
          >
            <span className="text-lg">{"\u{1F69B}"}</span>
            <span>キオスクを起動</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full text-left text-xs text-red-500 hover:text-red-700 font-semibold mt-1"
          >
            {"\u{1F6AA}"} ログアウト
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header
          className="flex items-center justify-between px-8 py-3 text-white shadow-md"
          style={{ background: "#1a3a6b" }}
        >
          <h1 className="text-xl font-black tracking-wide">
            {"\u{1F69B}"} トラック受付　管理画面
          </h1>
          <span className="text-sm text-blue-200">{dateStr}</span>
        </header>

        <main className="flex-1 overflow-y-auto p-6" style={{ background: "#F8FAFC" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
