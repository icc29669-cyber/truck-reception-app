"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getKioskSession, clearKioskSession } from "@/lib/kioskState";
import type { ReceptionResult } from "@/types/reception";

const AUTO_RETURN = 15;

export default function CompletePage() {
  const router = useRouter();
  const [result, setResult]       = useState<ReceptionResult | null>(null);
  const [countdown, setCountdown] = useState(AUTO_RETURN);
  const [paused, setPaused]       = useState(false);
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

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pauseCountdown() {
    if (paused) return;
    setPaused(true);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function goHome() {
    if (timerRef.current) clearInterval(timerRef.current);
    clearKioskSession();
    router.push("/kiosk");
  }

  const arrivedAt = result ? new Date(result.arrivedAt) : new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const dateStr = result
    ? `${arrivedAt.getMonth()+1}月${arrivedAt.getDate()}日　${pad(arrivedAt.getHours())}:${pad(arrivedAt.getMinutes())}`
    : "";

  return (
    <div className="w-screen h-screen overflow-hidden select-none" onPointerDown={pauseCountdown} style={{
      display: "flex", flexDirection: "column",
      background: "#F5F0E8",
    }}>

      {/* 受付完了 グリーンライン */}
      <div style={{ height: 10, background: "#0D9488", flexShrink: 0 }} />

      {/* ── コンテンツ ── */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 32, padding: "0 80px",
      }}>

        {/* チェックアイコン */}
        <div style={{
          width: 100, height: 100, borderRadius: "50%",
          background: "#2DD4BF",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 0 14px rgba(45,212,191,0.1)",
        }}>
          <span style={{ fontSize: 54, color: "#fff", lineHeight: 1 }}>✓</span>
        </div>

        {/* タイトル */}
        <div style={{
          fontSize: 62, fontWeight: 800, color: "#1E293B",
          letterSpacing: "0.14em",
        }}>
          受付完了
        </div>

        {/* 日時・予約 */}
        {result && (
          <div style={{ display: "flex", gap: 20 }}>
            <div style={{
              background: "#EDE8DF", border: "1.5px solid #D9D0C2",
              borderRadius: 16, padding: "20px 52px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            }}>
              <span style={{ fontSize: 14, color: "#94A3B8", letterSpacing: "0.14em", fontWeight: 500 }}>受付日時</span>
              <span style={{ fontSize: 44, fontWeight: 700, color: "#1E293B", fontVariantNumeric: "tabular-nums" }}>
                {dateStr}
              </span>
            </div>
            {result.reservation && (
              <div style={{
                background: "#FFFBEB", border: "1.5px solid #FDE68A",
                borderRadius: 16, padding: "20px 52px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              }}>
                <span style={{ fontSize: 14, color: "#D97706", letterSpacing: "0.14em", fontWeight: 500 }}>📅 予約時間</span>
                <span style={{ fontSize: 44, fontWeight: 700, color: "#92400E" }}>
                  {result.reservation.startTime} 〜 {result.reservation.endTime}
                </span>
              </div>
            )}
          </div>
        )}

        {/* 区切り */}
        <div style={{ width: 64, height: 3, background: "#0D9488", borderRadius: 2 }} />

        {/* 案内メッセージ */}
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontSize: 46, fontWeight: 900, color: "#1E293B",
            letterSpacing: "0.06em", lineHeight: 1.65,
          }}>
            受付票を取り<br />受付カウンターへお進みください
          </div>
        </div>

        {/* カウントダウン or 一時停止メッセージ */}
        <div style={{ fontSize: 20, color: "#94A3B8", letterSpacing: "0.06em" }}>
          {paused
            ? "自動遷移を停止しました"
            : `${countdown}秒後に自動的に最初の画面に戻ります`}
        </div>

        {/* 戻るボタン */}
        <button
          onPointerDown={goHome}
          style={{
            width: 580, height: 110, fontSize: 38, fontWeight: 800,
            background: "linear-gradient(180deg, #2DD4BF 0%, #0D9488 100%)",
            color: "#fff", border: "none",
            borderRadius: 14,
            boxShadow: "0 7px 0 #0F766E, 0 12px 36px rgba(13,148,136,0.22)",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            letterSpacing: "0.1em",
          }}
        >
          {paused ? "トップに戻る" : "最初の画面に戻る"}
        </button>
      </div>
    </div>
  );
}
