"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getKioskSession, clearKioskSession } from "@/lib/kioskState";
import PrintReceipt from "@/components/PrintReceipt";
import type { ReceptionResult } from "@/types/reception";

const AUTO_RETURN = 15;

/** localStorage からプリンタ設定を取得 */
function getPrinterSettings() {
  try {
    const raw = localStorage.getItem("printer_settings");
    if (!raw) return { autoPrint: true, paperWidth: "80" };
    const s = JSON.parse(raw);
    return {
      autoPrint: s.autoPrint ?? true,
      paperWidth: s.paperWidth || "80",
    };
  } catch {
    return { autoPrint: true, paperWidth: "80" };
  }
}

/**
 * サイレント印刷: iframeに受付票を描画して印刷
 * Chrome --kiosk-printing モードならダイアログなしで直接印刷される
 *
 * @returns Promise: 印刷トリガー成功なら resolve、失敗なら reject
 *                   （トリガーしただけで実際に紙が出たかは知ることはできない）
 */
function silentPrint(paperWidth: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const src = document.getElementById("print-receipt");
    if (!src) return reject(new Error("受付票の描画が見つかりません"));

    // 既存iframeがあれば削除
    const old = document.getElementById("print-frame");
    if (old) old.remove();

    const iframe = document.createElement("iframe");
    iframe.id = "print-frame";
    iframe.style.cssText = "position:fixed;width:0;height:0;border:none;left:-9999px;top:-9999px;";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return reject(new Error("印刷用ドキュメントを作成できません"));

    doc.open();
    doc.write(`<!DOCTYPE html><html><head>
<style>
  @page { size: ${paperWidth}mm auto; margin: 3mm; }
  body { margin: 0; padding: 0; }
  * { font-family: "MS Gothic", "Courier New", monospace; }
  img { max-width: 100%; }
</style>
</head><body>${src.innerHTML}</body></html>`);
    doc.close();

    // QR 画像のデコード完了を待ってから印刷（setTimeout 固定待機より確実）
    const img = doc.querySelector("img");
    const triggerPrint = () => {
      try {
        iframe.contentWindow?.print();
        setTimeout(() => iframe.remove(), 2000);
        resolve();
      } catch (e) {
        iframe.remove();
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    };

    if (img && !img.complete) {
      // 画像がまだロード中: onload / onerror を待つ（最大2秒でタイムアウト）
      const timeoutId = setTimeout(triggerPrint, 2000);
      img.onload = () => { clearTimeout(timeoutId); triggerPrint(); };
      img.onerror = () => {
        clearTimeout(timeoutId);
        iframe.remove();
        reject(new Error("QR画像のデコードに失敗しました"));
      };
    } else {
      // 既にロード済 or img がない → 即印刷
      setTimeout(triggerPrint, 100);
    }
  });
}

export default function CompletePage() {
  const router = useRouter();
  const [result, setResult]       = useState<ReceptionResult | null>(null);
  const [countdown, setCountdown] = useState(AUTO_RETURN);
  const [paused, setPaused]       = useState(false);
  const [printError, setPrintError] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const printTriggered = useRef(false);

  useEffect(() => {
    const s = getKioskSession();
    if (!s?.receptionResult) {
      router.replace("/kiosk");
      return;
    }
    setResult(s.receptionResult);

    // 自動印刷: QR画像ロード完了を待って印刷 → 失敗したら画面に案内表示
    const { autoPrint, paperWidth } = getPrinterSettings();
    if (autoPrint && !printTriggered.current) {
      printTriggered.current = true;
      setTimeout(() => {
        silentPrint(paperWidth).catch((e) => {
          console.error("silent print failed:", e);
          setPrintError(true);
        });
      }, 800);
    }

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

  function handlePrint() {
    pauseCountdown();
    setPrintError(false);
    const { paperWidth } = getPrinterSettings();
    silentPrint(paperWidth).catch((e) => {
      console.error("manual print failed:", e);
      setPrintError(true);
    });
  }

  const arrivedAt = result ? new Date(result.arrivedAt) : new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const dateStr = result
    ? `${arrivedAt.getMonth()+1}月${arrivedAt.getDate()}日　${pad(arrivedAt.getHours())}:${pad(arrivedAt.getMinutes())}`
    : "";

  return (
    <div
      className="w-screen h-screen overflow-hidden select-none"
      onPointerDown={pauseCountdown}
      style={{
        background: "#f2f1ed",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        position: "relative",
      }}
    >
      <style>{`
        @keyframes kc-pop { 0% { transform: scale(0.6); opacity: 0 } 100% { transform: scale(1); opacity: 1 } }
        @keyframes kc-fadein { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes kc-check { 0% { stroke-dashoffset: 80 } 100% { stroke-dashoffset: 0 } }
      `}</style>

      {/* 上部の細いアクセントライン */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 4,
        background: "#0D9488",
      }} />

      {/* ── 中央の受付完了エリア ── */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 24, maxWidth: 900, padding: "0 40px",
        animation: "kc-fadein 0.5s ease-out",
      }}>

        {/* チェックアイコン + 受付完了タイトル（横並びで省スペース化） */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "#0D9488",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 20px rgba(13,148,136,0.28)",
            animation: "kc-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
            flexShrink: 0,
          }}>
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none">
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
            fontSize: 48, fontWeight: 900, color: "#26251e",
            letterSpacing: "0.14em", lineHeight: 1, margin: 0,
          }}>
            受付完了
          </h1>
        </div>

        {/* ★ 受付番号（ヒーロー）— 印刷された受付票と同じ番号を大きく */}
        {result && (
          <div style={{
            marginTop: 4,
            background: "#fff",
            border: "2px solid #1a3a6b",
            borderRadius: 20,
            padding: "24px 64px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            boxShadow: "0 12px 36px rgba(26,58,107,0.14)",
          }}>
            <span style={{ fontSize: 15, color: "#5a5852", letterSpacing: "0.32em", fontWeight: 800 }}>
              受 付 番 号
            </span>
            <span style={{
              fontSize: 120, fontWeight: 900, color: "#1a3a6b",
              fontVariantNumeric: "tabular-nums", letterSpacing: "0.04em", lineHeight: 1,
            }}>
              {String(result.centerDailyNo).padStart(3, "0")}
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
              onPointerDown={handlePrint}
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
            {paused ? (
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
      {result && <PrintReceipt data={result} />}
    </div>
  );
}
