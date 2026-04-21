"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarIcon, ListIcon, UserIcon, SettingsIcon } from "./Icon";
import type { ComponentType } from "react";

type IconC = ComponentType<{ size?: number; strokeWidth?: number; style?: React.CSSProperties }>;

export default function BottomNav({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = usePathname();

  const tabs: { href: string; label: string; Icon: IconC }[] = [
    { href: "/dashboard",       label: "空き確認",     Icon: CalendarIcon },
    { href: "/my-reservations", label: "自分の予約",   Icon: ListIcon },
    { href: "/profile",         label: "プロフィール", Icon: UserIcon },
    ...(isAdmin ? [{ href: "/admin", label: "管理", Icon: SettingsIcon }] : []),
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40"
      style={{
        background: "#faf9f5",
        borderTop: "1px solid #E7E5DF",
        boxShadow: "0 -6px 18px rgba(26,37,30,0.06)",
      }}
    >
      <div className="flex max-w-lg mx-auto">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          const color = active ? "#1a3a6b" : "#5a5852";
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex flex-col items-center justify-center"
              style={{
                padding: "12px 4px 14px",
                gap: 4,
                color,
                position: "relative",
                textDecoration: "none",
              }}
            >
              {active && (
                <span
                  aria-hidden
                  style={{
                    position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                    width: 48, height: 3, background: "#1a3a6b", borderRadius: 2,
                  }}
                />
              )}
              <tab.Icon size={26} strokeWidth={active ? 2 : 1.75} style={{ color }} />
              <span style={{
                fontSize: 12, fontWeight: active ? 800 : 700,
                letterSpacing: "0.04em", color,
              }}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
