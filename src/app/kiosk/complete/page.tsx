"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getKioskSession, clearKioskSession } from "@/lib/kioskState";
import { useReceiptPrinter } from "@/components/useReceiptPrinter";
import PrintReceipt from "@/components/PrintReceipt";
import type { ReceptionResult } from "@/types/reception";

const AUTO_RETURN = 15;

export default function CompletePage() {
  const router = useRouter();
  const [result, setResult]       = useState<ReceptionResult | null>(null);
  const [countdown, setCountdown] = useState(AUTO_RETURN);
  const [paused, setPaused]       = useState(false);
  const printer = useReceiptPrinter();
  const printError = printer.error;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const s = getKioskSession();
    if (!s?.receptionResult) {
      router.replace("/kiosk");
      return;
    }
    setResult(s.receptionResult);

  }, [router]);

  useEffect(() => {
    if (!printer.readyToLeave || paused) return;
    setCountdown(AUTO_RETURN);
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
  }, [router, printer.readyToLeave, paused]);

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

  function handlePrint() {
    pauseCountdown();
    printer.retryPrint();
  }

  return (
    <div
      className="w-screen h-screen overflow-hidden select-none flex flex-col"
      onPointerDown={pauseCountdown}
      style={{ background: "#f2f1ed", position: "relative" }}
    >
      <style>{`
        @keyframes kc-pop { 0% { transform: scale(0.6); opacity: 0 } 100% { transform: scale(1); opacity: 1 } }
        @keyframes kc-fadein { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes kc-check { 0% { stroke-dashoffset: 80 } 100% { stroke-dashoffset: 0 } }
      `}</style>

      {/* ━━ 青ヘッダー(他画面と統一) ━━ */}
      <div className="flex items-center px-8 gap-6 flex-shrink-0"
        style={{ background: "#1a3a6b", height: 96 }}>
        {/* 左: チェックアイコン + 受付完了タイトル */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "#0D9488",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(13,148,136,0.28)",
            animation: "kc-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
            flexShrink: 0,
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12.5l4.5 4.5 10-10"
                stroke="#fff" strokeWidth="3"
                strokeLinecap="round" strokeLinejoin="round"
                style={{
                  strokeDasharray: 80, strokeDashoffset: 80,
                  animation: "kc-check 0.4s 0.2s ease-out forwards",
                }}
              />
            </svg>
          </div>
          <h1 style={{
            fontSize: 32, fontWeight: 900, color: "#fff",
            letterSpacing: "0.14em", lineHeight: 1, margin: 0,
          }}>
            受付完了
          </h1>
        </div>
        {/* 右: 全ステップ完了バッジ */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "8px 18px", borderRadius: 999,
          background: "rgba(13,148,136,0.25)", border: "2px solid rgba(13,148,136,0.7)",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5eead4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5 10-10" />
          </svg>
          <span style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "0.12em" }}>
            STEP 4 / 4 完了
          </span>
        </div>
      </div>

      {/* ━━ 中央の受付完了コンテンツ ━━ */}
      <div className="flex-1 flex flex-col items-center justify-center" style={{
        gap: 24, padding: "24px 40px",
        animation: "kc-fadein 0.5s ease-out",
        width: "100%", maxWidth: 900, margin: "0 auto",
      }}>

        {/* ★ 受付番号(ヒーロー) */}
        {result && (
          <div style={{
            background: "#fff",
            border: "2px solid #1a3a6b",
            borderRadius: 20,
            padding: "24px 64px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            boxShadow: "0 12px 36px rgba(26,58,107,0.14)",
          }}>
            <span style={{ fontSize: 15, color: "#5a5852", letterSpacing: "0.32em", fontWeight: 800 }}>
              呼 出 番 号
            </span>
            <span style={{
              fontSize: 120, fontWeight: 900, color: "#1a3a6b",
              fontVariantNumeric: "tabular-nums", letterSpacing: "0.04em", lineHeight: 1,
            }}>
              {String(result.centerDailyNo).padStart(3, "0")}
            </span>
            <span style={{ fontSize: 16, color: "#5a5852", marginTop: 12 }}>受付番号</span>
            <span style={{ fontSize: 24, fontWeight: 800, color: "#1a3a6b", fontFamily: "monospace" }}>
              {result.receptionNo}
            </span>
          </div>
        )}

        {/* ★ NEXT STEP ― 目立たせる（大きめ・ティール塗り） */}
        <div style={{
          marginTop: 4,
          background: "#0D9488",
          borderRadius: 16,
          padding: "28px 48px",
          display: "flex", alignItems: "center", gap: 22,
          boxShadow: "0 12px 32px rgba(13,148,136,0.28)",
          maxWidth: "100%",
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "rgba(255,255,255,0.22)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </div>
          <span style={{
            fontSize: 40, fontWeight: 900, color: "#fff",
            letterSpacing: "0.06em", lineHeight: 1.35,
          }}>
            受付票を取り<br />
            受付カウンターへお進みください
          </span>
        </div>

        {/* 印刷失敗時のフォールバック */}
        {printError && (
          <div style={{
            padding: "14px 22px",
            background: "#fdecef", border: "1px solid #f5bcc7",
            borderRadius: 10,
            display: "flex", alignItems: "center", gap: 12,
            color: "#BE123C", fontSize: 18, fontWeight: 700,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.3 3.5 2.5 17.5a2 2 0 0 0 1.75 3h15.5a2 2 0 0 0 1.75-3L13.7 3.5a2 2 0 0 0-3.4 0z" />
              <path d="M12 9v4M12 17.25v.01" />
            </svg>
            <span>印刷に失敗した可能性があります。「もう一度印刷」かカウンターへお声掛けください</span>
          </div>
        )}

        {/* ボタン + カウントダウン */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginTop: 12 }}>
          <div style={{ display: "flex", gap: 18, width: "100%" }}>
            {/* もう一度印刷（セカンダリ: アウトライン） */}
            <button
              onClick={handlePrint}
              disabled={printer.printing}
              style={{
                flex: 1, height: 88, fontSize: 22, fontWeight: 800,
                background: "#fff", color: "#26251e",
                border: "2px solid #1a3a6b",
                borderRadius: 12, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                letterSpacing: "0.08em",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9V3h12v6M6 17H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
                <path d="M6 14h12v8H6z" />
              </svg>
              もう一度印刷
            </button>

            {/* トップへ戻る（プライマリ） */}
            <button
              onPointerDown={goHome}
              style={{
                flex: 1, height: 88, fontSize: 22, fontWeight: 900,
                background: "#1a3a6b", color: "#fff",
                border: "none",
                borderRadius: 12, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                letterSpacing: "0.08em",
                boxShadow: "0 8px 20px rgba(26,58,107,0.22)",
              }}
            >
              トップへ戻る
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </div>

          {/* カウントダウン */}
          <div style={{
            fontSize: 14, color: paused ? "#9a978c" : "#5a5852",
            letterSpacing: "0.08em", fontWeight: 600,
          }}>
            {paused || !printer.readyToLeave ? (
              <span>自動遷移を停止しました</span>
            ) : (
              <span>
                <span style={{
                  display: "inline-block", minWidth: 18,
                  fontSize: 16, fontWeight: 900, color: "#0D9488",
                  fontVariantNumeric: "tabular-nums",
                }}>{countdown}</span> 秒後に自動でトップへ戻ります
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── 印刷用受付票（画面上は非表示、iframe経由で印刷） ── */}
      {result && <PrintReceipt key={printer.attempt} data={result} onReady={printer.onQrReady} onError={printer.onQrError} />}
    </div>
  );
}
