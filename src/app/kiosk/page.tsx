"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearKioskSession, setKioskSession } from "@/lib/kioskState";

type CenterConfig = { id: number; code: string; name: string };

export default function KioskTop() {
  const router  = useRouter();
  const [mounted, setMounted] = useState(false);
  const [now, setNow]         = useState(new Date());
  const [center, setCenter]   = useState<CenterConfig | null>(null);
  const [error, setError]     = useState("");

  useEffect(() => {
    setMounted(true);
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // マスタで設定されたセンターを取得
  useEffect(() => {
    fetch("/api/kiosk-config")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data: CenterConfig) => setCenter(data))
      .catch(() => setError("センターが設定されていません。管理画面で設定してください。"));
  }, []);

  function start() {
    if (!center) return;
    clearKioskSession();
    setKioskSession({ centerId: center.id, centerName: center.name });
    router.push("/kiosk/caution");
  }

  if (!mounted) return null;

  const pad  = (n: number) => String(n).padStart(2, "0");
  const days = ["日","月","火","水","木","金","土"];
  const dateStr = `${now.getMonth()+1}月${now.getDate()}日（${days[now.getDay()]}）`;
  const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  return (
    <div className="w-screen h-screen overflow-hidden select-none" style={{
      display: "flex", flexDirection: "column", position: "relative",
      background: "#F5F0E8",
    }}>

      {/* ── ヘッダー ── */}
      <div style={{
        background: "#1a3a6b",
        height: 88, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 56px",
      }}>
        <div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.38)", letterSpacing: "0.22em", marginBottom: 5 }}>
            日本セイフティー株式会社
          </div>
          <div style={{ fontSize: 28, fontWeight: 600, color: "#fff", letterSpacing: "0.06em" }}>
            {center ? center.name : ""}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.38)", marginBottom: 6 }}>{dateStr}</div>
          <div style={{
            fontSize: 44, fontWeight: 300, color: "#fff",
            lineHeight: 1, fontVariantNumeric: "tabular-nums", letterSpacing: "0.05em",
          }}>
            {timeStr}
          </div>
        </div>
      </div>

      {/* ── メイン ── */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 44,
      }}>

        {/* あいさつ */}
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontSize: 14, color: "#94A3B8",
            letterSpacing: "0.32em", marginBottom: 20,
            fontWeight: 500,
          }}>
            TRUCK RECEPTION
          </div>
          <div style={{
            fontSize: 68, fontWeight: 700, color: "#1E293B",
            letterSpacing: "0.14em", marginBottom: 14,
          }}>
            いらっしゃいませ
          </div>
          <div style={{ fontSize: 23, color: "#64748B", letterSpacing: "0.1em", fontWeight: 400 }}>
            受付をご案内いたします
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div style={{
            background: "#FEF2F2", border: "2px solid #FECACA", borderRadius: 14,
            padding: "16px 32px", fontSize: 20, color: "#B91C1C", fontWeight: 600,
          }}>
            {error}
          </div>
        )}

        {/* 受付ボタン */}
        <button
          onPointerDown={start}
          style={{
            width: 780, height: 210,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            borderRadius: 18,
            background: center
              ? "linear-gradient(180deg, #2DD4BF 0%, #0D9488 100%)"
              : "linear-gradient(180deg, #CBD5E1 0%, #94A3B8 100%)",
            border: "none",
            boxShadow: center
              ? "0 8px 0 #0F766E, 0 18px 56px rgba(13,148,136,0.22)"
              : "0 8px 0 #64748B",
            cursor: center ? "pointer" : "default",
            gap: 10,
            opacity: center ? 1 : 0.5,
          }}
        >
          <span style={{ fontSize: 62, fontWeight: 800, color: "#fff", letterSpacing: "0.16em" }}>
            受付はこちら
          </span>
          <span style={{ fontSize: 22, color: "rgba(255,255,255,0.62)", fontWeight: 500, letterSpacing: "0.16em" }}>
            タッチしてください
          </span>
        </button>

        {/* 安全注意 */}
        <div style={{ fontSize: 18, color: "#94A3B8", letterSpacing: "0.1em" }}>
          ⚠ 保護帽・安全靴を着用の上ご入場ください
        </div>
      </div>

      {/* 管理画面 */}
      <button
        onPointerDown={() => router.push("/admin")}
        style={{
          position: "absolute", bottom: 16, right: 22,
          fontSize: 12, color: "#CBD5E1",
          background: "transparent", border: "none",
          cursor: "pointer", padding: "8px 12px",
        }}
      >
        管理画面
      </button>
    </div>
  );
}
