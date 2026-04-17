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
 * 通常モードでもiframe経由でメインページに影響しない
 */
function silentPrint(paperWidth: string) {
  const src = document.getElementById("print-receipt");
  if (!src) return;

  // 既存iframeがあれば削除
  const old = document.getElementById("print-frame");
  if (old) old.remove();

  const iframe = document.createElement("iframe");
  iframe.id = "print-frame";
  iframe.style.cssText = "position:fixed;width:0;height:0;border:none;left:-9999px;top:-9999px;";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(`<!DOCTYPE html><html><head>
<style>
  @page { size: ${paperWidth}mm auto; margin: 3mm; }
  body { margin: 0; padding: 0; }
  * { font-family: "MS Gothic", "Courier New", monospace; }
</style>
</head><body>${src.innerHTML}</body></html>`);
  doc.close();

  // バーコードSVGをコピー
  const origSvg = src.querySelector("svg");
  const newSvg = doc.querySelector("svg");
  if (origSvg && newSvg) {
    newSvg.outerHTML = origSvg.outerHTML;
  }

  setTimeout(() => {
    iframe.contentWindow?.print();
    // 印刷後にiframe削除
    setTimeout(() => iframe.remove(), 2000);
  }, 300);
}

export default function CompletePage() {
  const router = useRouter();
  const [result, setResult]       = useState<ReceptionResult | null>(null);
  const [countdown, setCountdown] = useState(AUTO_RETURN);
  const [paused, setPaused]       = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const printTriggered = useRef(false);

  useEffect(() => {
    const s = getKioskSession();
    if (!s?.receptionResult) {
      router.replace("/kiosk");
      return;
    }
    setResult(s.receptionResult);

    // 自動印刷（バーコード描画待ち後）
    const { autoPrint, paperWidth } = getPrinterSettings();
    if (autoPrint && !printTriggered.current) {
      printTriggered.current = true;
      setTimeout(() => {
        silentPrint(paperWidth);
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
    const { paperWidth } = getPrinterSettings();
    silentPrint(paperWidth);
  }

  const arrivedAt = result ? new Date(result.arrivedAt) : new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const dateStr = result
    ? `${arrivedAt.getMonth()+1}月${arrivedAt.getDate()}日　${pad(arrivedAt.getHours())}:${pad(arrivedAt.getMinutes())}`
    : "";

  return (
    <div className="w-screen h-screen overflow-hidden select-none" onPointerDown={pauseCountdown} style={{
      display: "flex", flexDirection: "column",
      background: "#f2f1ed",
    }}>

      {/* 受付完了 グリーンライン */}
      <div style={{ height: 10, background: "#0D9488", flexShrink: 0 }} />

      {/* ── コンテンツ ── */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 28, padding: "0 80px",
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
          fontSize: 62, fontWeight: 800, color: "#26251e",
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
              <span style={{ fontSize: 44, fontWeight: 700, color: "#26251e", fontVariantNumeric: "tabular-nums" }}>
                {dateStr}
              </span>
            </div>
            {result.reservation && (
              <div style={{
                background: "#FFFBEB", border: "1.5px solid #FDE68A",
                borderRadius: 16, padding: "20px 52px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              }}>
                <span style={{ fontSize: 14, color: "#D97706", letterSpacing: "0.14em", fontWeight: 500 }}>予約時間</span>
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
            fontSize: 46, fontWeight: 900, color: "#26251e",
            letterSpacing: "0.06em", lineHeight: 1.65,
          }}>
            受付票を取り<br />受付カウンターへお進みください
          </div>
        </div>

        {/* カウントダウン or 一時停止メッセージ */}
        <div style={{ fontSize: 20, color: "#94A3B8", letterSpacing: "0.06em" }}>
          {paused
            ? "自動遷移を停止しました"
            : `${countdown}秒後に自動的にトップへ戻ります`}
        </div>

        {/* ボタン群 */}
        <div style={{ display: "flex", gap: 24 }}>
          {/* もう一度印刷ボタン */}
          <button
            onPointerDown={handlePrint}
            style={{
              width: 300, height: 110, fontSize: 34, fontWeight: 800,
              background: "linear-gradient(180deg, #60A5FA 0%, #2563EB 100%)",
              color: "#fff", border: "none",
              borderRadius: 14,
              boxShadow: "0 7px 0 #1D4ED8, 0 12px 36px rgba(37,99,235,0.22)",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              letterSpacing: "0.08em",
            }}
          >
            もう一度印刷
          </button>

          {/* 戻るボタン */}
          <button
            onPointerDown={goHome}
            style={{
              width: 300, height: 110, fontSize: 34, fontWeight: 800,
              background: "linear-gradient(180deg, #2DD4BF 0%, #0D9488 100%)",
              color: "#fff", border: "none",
              borderRadius: 14,
              boxShadow: "0 7px 0 #0F766E, 0 12px 36px rgba(13,148,136,0.22)",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              letterSpacing: "0.08em",
            }}
          >
            トップへ戻る
          </button>
        </div>
      </div>

      {/* ── 印刷用受付票（画面上は非表示、iframe経由で印刷） ── */}
      {result && <PrintReceipt data={result} />}
    </div>
  );
}
