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
    <div className="w-screen h-screen overflow-hidden select-none" onPointerDown={pauseCountdown} style={{
      display: "grid",
      gridTemplateColumns: "minmax(520px, 44%) 1fr",
      background: "#f2f1ed",
      position: "relative",
    }}>

      {/* ══ 上部グリーンライン（全幅） ══ */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 10,
        background: "#0D9488", zIndex: 5,
      }} />

      {/* ══════════════════════════════════════════ */}
      {/* 左パネル: ヒーローエリア（大きく目立つ成功表示） */}
      {/* ══════════════════════════════════════════ */}
      <div style={{
        background: "linear-gradient(180deg, #EDE8DF 0%, #E3DCCC 100%)",
        borderRight: "1px solid #D9D0C2",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "60px 40px", gap: 40,
      }}>

        {/* 大きなチェックアイコン（パルス付き） */}
        <div style={{
          width: 220, height: 220, borderRadius: "50%",
          background: "#2DD4BF",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 0 24px rgba(45,212,191,0.12), 0 0 0 48px rgba(45,212,191,0.06), 0 20px 60px rgba(13,148,136,0.25)",
          animation: "kiosk-complete-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}>
          <span style={{ fontSize: 140, color: "#fff", lineHeight: 1, fontWeight: 900 }}>✓</span>
        </div>

        {/* タイトル */}
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontSize: 92, fontWeight: 900, color: "#26251e",
            letterSpacing: "0.2em", lineHeight: 1, marginBottom: 18,
          }}>
            受付完了
          </div>
          <div style={{
            fontSize: 20, fontWeight: 600, color: "#0D9488",
            letterSpacing: "0.32em",
          }}>
            RECEPTION COMPLETED
          </div>
        </div>

        <style>{`
          @keyframes kiosk-complete-pop {
            0% { transform: scale(0.4); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes kiosk-complete-fadein {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>

      {/* ══════════════════════════════════════════ */}
      {/* 右パネル: 情報＋案内＋ボタン */}
      {/* ══════════════════════════════════════════ */}
      <div style={{
        display: "flex", flexDirection: "column",
        padding: "72px 72px 40px 72px",
        animation: "kiosk-complete-fadein 0.6s ease-out",
      }}>

        {/* ── セクション1: 情報カード群 ── */}
        {result && (
          <div style={{ display: "flex", gap: 20, marginBottom: 40 }}>
            <div style={{
              flex: result.reservation ? 1 : "initial",
              minWidth: 320,
              background: "#fff", border: "1.5px solid #E5E7EB",
              borderRadius: 20, padding: "24px 32px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 6, height: 22, background: "#0D9488", borderRadius: 3 }} />
                <span style={{ fontSize: 16, color: "#64748B", letterSpacing: "0.2em", fontWeight: 700 }}>
                  受付日時
                </span>
              </div>
              <div style={{
                fontSize: 52, fontWeight: 800, color: "#26251e",
                fontVariantNumeric: "tabular-nums", letterSpacing: "0.02em", lineHeight: 1.1,
              }}>
                {dateStr}
              </div>
            </div>

            {result.reservation && (
              <div style={{
                flex: 1,
                background: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
                border: "2px solid #FDE68A",
                borderRadius: 20, padding: "24px 32px",
                boxShadow: "0 4px 12px rgba(251,191,36,0.15)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 6, height: 22, background: "#D97706", borderRadius: 3 }} />
                  <span style={{ fontSize: 16, color: "#D97706", letterSpacing: "0.2em", fontWeight: 700 }}>
                    予約時間
                  </span>
                </div>
                <div style={{
                  fontSize: 48, fontWeight: 800, color: "#92400E",
                  fontVariantNumeric: "tabular-nums", lineHeight: 1.1,
                }}>
                  {result.reservation.startTime}<span style={{ fontSize: 32, margin: "0 8px" }}>〜</span>{result.reservation.endTime}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── セクション2: 案内メッセージ（大バナー風） ── */}
        <div style={{
          background: "#fff",
          border: "1.5px solid #E5E7EB",
          borderLeft: "8px solid #0D9488",
          borderRadius: 20, padding: "36px 44px",
          marginBottom: 32,
          boxShadow: "0 6px 16px rgba(0,0,0,0.05)",
        }}>
          <div style={{
            fontSize: 14, color: "#0D9488", letterSpacing: "0.24em",
            fontWeight: 800, marginBottom: 14,
          }}>
            NEXT STEP
          </div>
          <div style={{
            fontSize: 44, fontWeight: 900, color: "#26251e",
            letterSpacing: "0.04em", lineHeight: 1.45,
          }}>
            受付票を取り<br />受付カウンターへお進みください
          </div>
        </div>

        {/* 印刷失敗時のフォールバック */}
        {printError && (
          <div style={{
            background: "#fef3c7", border: "2px solid #f59e0b",
            borderRadius: 16, padding: "18px 28px",
            display: "flex", alignItems: "center", gap: 16,
            marginBottom: 24,
          }}>
            <span style={{ fontSize: 32, lineHeight: 1 }}>⚠</span>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#92400e", lineHeight: 1.5 }}>
              印刷に失敗した可能性があります。<br />
              <span style={{ fontSize: 16, fontWeight: 700 }}>
                「もう一度印刷」またはカウンターへお声掛けください
              </span>
            </div>
          </div>
        )}

        {/* スペーサー */}
        <div style={{ flex: 1 }} />

        {/* ── セクション3: ボタン + カウントダウン ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {/* もう一度印刷 */}
          <button
            onPointerDown={handlePrint}
            style={{
              flex: 1, height: 124, fontSize: 32, fontWeight: 800,
              background: "linear-gradient(180deg, #60A5FA 0%, #2563EB 100%)",
              color: "#fff", border: "none",
              borderRadius: 16,
              boxShadow: "0 7px 0 #1D4ED8, 0 12px 36px rgba(37,99,235,0.22)",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 14,
              letterSpacing: "0.08em",
            }}
          >
            <span style={{ fontSize: 36 }}>🖨</span>もう一度印刷
          </button>

          {/* トップへ戻る */}
          <button
            onPointerDown={goHome}
            style={{
              flex: 1, height: 124, fontSize: 32, fontWeight: 800,
              background: "linear-gradient(180deg, #2DD4BF 0%, #0D9488 100%)",
              color: "#fff", border: "none",
              borderRadius: 16,
              boxShadow: "0 7px 0 #0F766E, 0 12px 36px rgba(13,148,136,0.22)",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 14,
              letterSpacing: "0.08em",
            }}
          >
            トップへ戻る<span style={{ fontSize: 36 }}>→</span>
          </button>
        </div>

        {/* カウントダウン（ボタン下） */}
        <div style={{
          marginTop: 20, textAlign: "center",
          fontSize: 18, color: paused ? "#94A3B8" : "#64748B",
          letterSpacing: "0.1em", fontWeight: 600,
        }}>
          {paused ? (
            <span>⏸ 自動遷移を停止しました</span>
          ) : (
            <span>
              <span style={{
                display: "inline-block", minWidth: 28,
                fontSize: 22, fontWeight: 800, color: "#0D9488",
                fontVariantNumeric: "tabular-nums",
              }}>{countdown}</span>
              秒後に自動的にトップへ戻ります
            </span>
          )}
        </div>
      </div>

      {/* ── 印刷用受付票（画面上は非表示、iframe経由で印刷） ── */}
      {result && <PrintReceipt data={result} />}
    </div>
  );
}
