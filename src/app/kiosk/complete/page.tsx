"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getKioskSession, clearKioskSession } from "@/lib/kioskState";
import type { ReceptionResult } from "@/types/reception";

const AUTO_RETURN = 30;

export default function CompletePage() {
  const router = useRouter();
  const [result, setResult] = useState<ReceptionResult | null>(null);
  const [countdown, setCountdown] = useState(AUTO_RETURN);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const s = getKioskSession();
    if (!s?.receptionResult) {
      router.replace("/kiosk");
      return;
    }
    setResult(s.receptionResult);

    let n = AUTO_RETURN;
    timerRef.current = setInterval(() => {
      n -= 1;
      setCountdown(n);
      if (n <= 0) {
        clearInterval(timerRef.current!);
        clearKioskSession();
        router.push("/kiosk");
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function goHome() {
    if (timerRef.current) clearInterval(timerRef.current);
    clearKioskSession();
    router.push("/kiosk");
  }

  const arrivedAt = result ? new Date(result.arrivedAt) : new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const dateStr = result
    ? `${arrivedAt.getMonth() + 1}月${arrivedAt.getDate()}日 ${pad(arrivedAt.getHours())}:${pad(arrivedAt.getMinutes())}`
    : "";

  return (
    <div className="w-screen h-screen overflow-hidden" style={{
      display: "flex", flexDirection: "column",
      userSelect: "none",
      background: "linear-gradient(160deg,#1a3a6b 0%,#1E5799 100%)",
    }}>
      {/* ── ヘッダーセクション ── */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        flexShrink: 0, paddingTop: 48, paddingBottom: 40,
      }}>
        {/* 完了アイコン */}
        <div style={{
          width: 130, height: 130, borderRadius: "50%",
          background: "#22C55E",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 20,
          boxShadow: "0 6px 24px rgba(34,197,94,0.4)",
        }}>
          <span style={{ fontSize: 72, color: "#fff", lineHeight: 1 }}>✓</span>
        </div>

        {/* タイトル */}
        <div style={{ marginBottom: 32 }}>
          <span style={{ fontSize: 56, fontWeight: 900, color: "#FFFFFF", letterSpacing: "0.12em" }}>
            受付完了
          </span>
        </div>

        {/* 受付情報ボックス */}
        {result && (
          <div style={{ display: "flex", gap: 32 }}>
            <div style={{
              borderRadius: 22, background: "#FFFFFF",
              boxShadow: "0 2px 20px rgba(0,0,0,0.08)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: "28px 64px",
            }}>
              <p style={{ fontSize: 24, fontWeight: 600, color: "#6B7280", marginBottom: 8 }}>受付日時</p>
              <p style={{ fontSize: 48, fontWeight: 900, color: "#111827" }}>{dateStr}</p>
            </div>
            {result.reservation && (
              <div style={{
                borderRadius: 22, background: "#EFF6FF",
                border: "3px solid #93C5FD",
                boxShadow: "0 2px 20px rgba(0,0,0,0.08)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                padding: "28px 64px",
              }}>
                <p style={{ fontSize: 24, fontWeight: 600, color: "#1E40AF", marginBottom: 8 }}>📅 予約時間</p>
                <p style={{ fontSize: 48, fontWeight: 900, color: "#1E40AF" }}>
                  {result.reservation.startTime} 〜 {result.reservation.endTime}
                </p>
              </div>
            )}
            <div style={{
              borderRadius: 22, background: "#FFFFFF",
              boxShadow: "0 2px 20px rgba(0,0,0,0.08)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: "28px 64px",
            }}>
              <p style={{ fontSize: 24, fontWeight: 600, color: "#6B7280", marginBottom: 8 }}>現在の待機台数</p>
              <p style={{ fontSize: 64, fontWeight: 900, color: "#1E5799" }}>
                {result.waitingCount}<span style={{ fontSize: 36 }}>台</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── メインエリア ── */}
      {!result ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ fontSize: 40, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>読み込み中...</p>
        </div>
      ) : (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 32, padding: "0 80px",
        }}>
          {/* 案内カード */}
          <div style={{
            borderRadius: 22, background: "#FFF8E1",
            border: "4px solid #FDE68A",
            boxShadow: "0 2px 20px rgba(0,0,0,0.08)",
            padding: "40px 80px",
            textAlign: "center",
            maxWidth: 1100,
          }}>
            <p style={{ fontSize: 52, fontWeight: 900, color: "#92400E", lineHeight: 1.5 }}>
              受付票を取り<br />受付カウンターへお進みください
            </p>
          </div>

          {/* カウントダウン */}
          <p style={{ fontSize: 32, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>
            {countdown}秒後に自動的に最初の画面に戻ります
          </p>

          {/* 戻るボタン */}
          <button
            onPointerDown={goHome}
            style={{
              width: 760, height: 180, fontSize: 56, fontWeight: 900,
              background: "linear-gradient(180deg,#22C55E 0%,#16A34A 100%)",
              color: "#fff", border: "none",
              borderRadius: 28,
              boxShadow: "0 8px 0 #14532d, 0 14px 48px rgba(22,163,74,0.4)",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              letterSpacing: "0.1em",
              transition: "transform 0.08s, box-shadow 0.08s",
            }}
          >
            最初の画面に戻る
          </button>
        </div>
      )}
    </div>
  );
}
