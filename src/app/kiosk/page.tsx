"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clearKioskSession, setKioskSession } from "@/lib/kioskState";

type CenterConfig = { id: number; code: string; name: string };

/* ── ローディングスピナー ── */
function LoadingSpinner() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
      <div style={{
        width: 56, height: 56, border: "5px solid #E2E8F0",
        borderTop: "5px solid #0D9488", borderRadius: "50%",
        animation: "kiosk-spin 0.8s linear infinite",
      }} />
      <div style={{ fontSize: 20, color: "#64748B", letterSpacing: "0.08em" }}>
        センター情報を読み込み中...
      </div>
    </div>
  );
}

export default function KioskTopPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}><LoadingSpinner /></div>}>
      <KioskTop />
    </Suspense>
  );
}

function KioskTop() {
  const router  = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [now, setNow]         = useState(new Date());
  const [center, setCenter]   = useState<CenterConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    setMounted(true);
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // URLの ?center=3101 またはマスタ設定からセンター取得
  useEffect(() => {
    setLoading(true);
    const centerCode = searchParams.get("center");
    const url = centerCode
      ? `/api/kiosk-config?code=${encodeURIComponent(centerCode)}`
      : "/api/kiosk-config";

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data: CenterConfig) => setCenter(data))
      .catch(() =>
        setError(
          centerCode
            ? `センターCD「${centerCode}」が見つかりません。URLを確認してください。`
            : "センターが設定されていません。管理画面で設定するか、URLに ?center=3101 を指定してください。"
        )
      )
      .finally(() => setLoading(false));
  }, [searchParams]);

  function start() {
    if (!center) return;
    clearKioskSession();
    setKioskSession({ centerId: center.id, centerName: center.name });
    router.push("/kiosk/caution");
  }

  if (!mounted) return null;

  const pad  = (n: number) => String(n).padStart(2, "0");
  const days = ["日","月","火","水","木","金","土"];
  const dateStr = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日（${days[now.getDay()]}）`;
  const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const secStr  = pad(now.getSeconds());

  return (
    <div className="w-screen h-screen overflow-hidden select-none" style={{
      display: "flex", flexDirection: "column", position: "relative",
      background: "#F5F0E8",
    }}>

      {/* ── キーフレーム ── */}
      <style>{`
        @keyframes kiosk-spin { to { transform: rotate(360deg) } }
        @keyframes kiosk-pulse {
          0%, 100% { box-shadow: 0 8px 0 #0F766E, 0 18px 56px rgba(13,148,136,0.22); }
          50%      { box-shadow: 0 8px 0 #0F766E, 0 18px 72px rgba(13,148,136,0.38), 0 0 0 12px rgba(45,212,191,0.12); }
        }
        @keyframes kiosk-colon {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.3; }
        }
      `}</style>

      {/* ── ヘッダー ── */}
      <div style={{
        background: "#1a3a6b",
        height: 96, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 56px",
      }}>
        <div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.38)", letterSpacing: "0.22em", marginBottom: 5 }}>
            日本セイフティー株式会社
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, color: "#fff", letterSpacing: "0.06em" }}>
            {loading ? "" : center ? center.name : "---"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 15, color: "rgba(255,255,255,0.52)", marginBottom: 6, letterSpacing: "0.06em" }}>
            {dateStr}
          </div>
          <div style={{
            fontSize: 52, fontWeight: 300, color: "#fff",
            lineHeight: 1, fontVariantNumeric: "tabular-nums", letterSpacing: "0.05em",
            display: "flex", alignItems: "baseline", justifyContent: "flex-end",
          }}>
            <span>{timeStr}</span>
            <span style={{
              fontSize: 22, color: "rgba(255,255,255,0.38)", marginLeft: 4,
              fontVariantNumeric: "tabular-nums",
            }}>
              {secStr}
            </span>
          </div>
        </div>
      </div>

      {/* ── メイン ── */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 40,
      }}>

        {/* ローディング */}
        {loading && !error && <LoadingSpinner />}

        {/* あいさつ（ローディング完了後に表示） */}
        {!loading && (
          <>
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
                width: 800, height: 220,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                borderRadius: 20,
                background: center
                  ? "linear-gradient(180deg, #2DD4BF 0%, #0D9488 100%)"
                  : "linear-gradient(180deg, #CBD5E1 0%, #94A3B8 100%)",
                border: "none",
                boxShadow: center
                  ? "0 8px 0 #0F766E, 0 18px 56px rgba(13,148,136,0.22)"
                  : "0 8px 0 #64748B",
                cursor: center ? "pointer" : "default",
                gap: 12,
                opacity: center ? 1 : 0.5,
                animation: center ? "kiosk-pulse 2.4s ease-in-out infinite" : "none",
                transition: "transform 0.1s ease",
              }}
              onPointerUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
            >
              <span style={{
                fontSize: 66, fontWeight: 800, color: "#fff", letterSpacing: "0.16em",
                textShadow: "0 2px 8px rgba(0,0,0,0.12)",
              }}>
                受付はこちら
              </span>
              <span style={{ fontSize: 23, color: "rgba(255,255,255,0.7)", fontWeight: 500, letterSpacing: "0.16em" }}>
                タッチしてください
              </span>
            </button>

            {/* 安全注意 */}
            <div style={{ fontSize: 18, color: "#94A3B8", letterSpacing: "0.1em" }}>
              &#x26A0; 保護帽・安全靴を着用の上ご入場ください
            </div>
          </>
        )}
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
