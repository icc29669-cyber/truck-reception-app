"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogoutIcon } from "./Icon";

export default function Header({ driverName, isAdmin: _isAdmin }: { driverName: string; isAdmin?: boolean }) {
  const router = useRouter();
  const [confirmLogout, setConfirmLogout] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/");
  }

  return (
    <>
      <header
        className="px-5 flex items-center justify-between"
        style={{ height: 88, background: "#1a3a6b", color: "#fff" }}
      >
        <div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: "0.24em", fontWeight: 700, marginBottom: 4 }}>
            日本セイフティー株式会社
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "0.06em", lineHeight: 1.15 }}>
            受付予約
          </div>
        </div>
        <div className="text-right">
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.72)", marginBottom: 6 }}>
            {driverName} さん
          </div>
          <button
            onClick={() => setConfirmLogout(true)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.28)",
              color: "#fff", fontWeight: 700, fontSize: 14,
              padding: "8px 14px", borderRadius: 10,
            }}
          >
            <LogoutIcon size={16} strokeWidth={2} />
            ログアウト
          </button>
        </div>
      </header>

      {confirmLogout && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.55)" }}>
          <div
            style={{
              width: "100%", background: "#faf9f5",
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              padding: 28, display: "flex", flexDirection: "column", gap: 20,
            }}
          >
            <div className="text-center">
              <h2 style={{ fontSize: 26, fontWeight: 900, color: "#26251e", letterSpacing: "0.04em" }}>
                ログアウトしますか？
              </h2>
              <div style={{ fontSize: 15, color: "#5a5852", marginTop: 8 }}>
                次回は再度ログインが必要になります
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setConfirmLogout(false)}
                style={{
                  padding: "18px 0", fontSize: 19, fontWeight: 800,
                  background: "#E7E5DF", color: "#26251e",
                  border: "none", borderRadius: 14,
                }}
              >
                やめる
              </button>
              <button
                onClick={handleLogout}
                style={{
                  padding: "18px 0", fontSize: 19, fontWeight: 800,
                  background: "#1a3a6b", color: "#fff",
                  border: "none", borderRadius: 14,
                }}
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
