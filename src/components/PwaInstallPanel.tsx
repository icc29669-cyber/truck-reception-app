"use client";

import { useEffect, useState } from "react";
import { detectBrowser, type BrowserInfo } from "@/lib/browserDetect";
import { InstallIcon, CheckIcon, AlertIcon, ChevronRightIcon } from "./Icon";

// プロフィール画面に常設する「アプリ設定」カード。
// 3つの状態を扱う:
//   1) isStandalone       — PWA として起動中 → 表示のみ
//   2) inAppBrowser あり  — LINE等の中 → ブラウザで開き直す案内
//   3) それ以外            — 通常ブラウザ → ホーム画面追加を案内

export default function PwaInstallPanel() {
  const [info, setInfo] = useState<BrowserInfo | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showBrowserModal, setShowBrowserModal] = useState(false);
  const [copied, setCopied] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    setInfo(detectBrowser());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!info) return null;

  const url = typeof window !== "undefined" ? window.location.origin : "";

  async function handleNativeInstall() {
    if (!deferredPrompt) { setShowModal(true); return; }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setInfo((i) => i ? { ...i, isStandalone: true } : i);
    }
    setDeferredPrompt(null);
  }

  async function copyUrl() {
    try { await navigator.clipboard.writeText(url); }
    catch {
      const ta = document.createElement("textarea");
      ta.value = url; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── 状態別の表示 ──
  return (
    <div style={{
      background: "#faf9f5", borderRadius: 14, padding: 16,
      border: "1px solid #E7E5DF", marginBottom: 14,
    }}>
      <div className="flex items-center gap-3" style={{ marginBottom: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: info.isStandalone ? "#e7f4ed" : info.inAppBrowser ? "#fef6db" : "#eef1f7",
          color: info.isStandalone ? "#047857" : info.inAppBrowser ? "#8a4a15" : "#1a3a6b",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          {info.isStandalone
            ? <CheckIcon size={22} strokeWidth={2.5} />
            : info.inAppBrowser
            ? <AlertIcon size={22} strokeWidth={2} />
            : <InstallIcon size={22} strokeWidth={1.75} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: "#5a5852", fontWeight: 800, letterSpacing: "0.18em" }}>
            APP
          </div>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#26251e", letterSpacing: "0.04em", marginTop: 2 }}>
            {info.isStandalone
              ? "ホーム画面に追加済み"
              : info.inAppBrowser
              ? `${info.inAppName} で開いています`
              : "ブラウザで開いています"}
          </div>
        </div>
      </div>

      {info.isStandalone ? (
        <p style={{ fontSize: 13, color: "#5a5852", lineHeight: 1.6, padding: "0 2px" }}>
          アプリとしてインストール済みです。次回からホーム画面のアイコンからすぐに開けます。
        </p>
      ) : info.inAppBrowser ? (
        <>
          <p style={{ fontSize: 13, color: "#5a5852", lineHeight: 1.6, marginBottom: 12, padding: "0 2px" }}>
            この画面ではホーム画面への追加ができません。{info.isIOS ? "Safari" : "Chrome"}で開き直してください。
          </p>
          <button
            type="button"
            onClick={() => setShowBrowserModal(true)}
            style={{
              width: "100%", padding: "14px 16px",
              background: "#D97706", color: "#fff",
              fontWeight: 800, fontSize: 15, borderRadius: 12,
              border: "none", boxShadow: "0 4px 12px rgba(217,119,6,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              cursor: "pointer",
            }}
          >
            <ChevronRightIcon size={18} strokeWidth={2.5} />
            {info.isIOS ? "Safari" : "Chrome"} で開く方法
          </button>
        </>
      ) : (
        <>
          <p style={{ fontSize: 13, color: "#5a5852", lineHeight: 1.6, marginBottom: 12, padding: "0 2px" }}>
            ホーム画面に追加すると、アイコンをタップするだけで開けます。
          </p>
          <button
            type="button"
            onClick={handleNativeInstall}
            style={{
              width: "100%", padding: "14px 16px",
              background: "#0D9488", color: "#fff",
              fontWeight: 800, fontSize: 15, borderRadius: 12,
              border: "none", boxShadow: "0 4px 12px rgba(13,148,136,0.22)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              cursor: "pointer",
            }}
          >
            <InstallIcon size={18} strokeWidth={2} />
            ホーム画面に追加する
          </button>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            style={{
              width: "100%", marginTop: 8, padding: "10px 0",
              background: "transparent", color: "#1a3a6b",
              fontWeight: 700, fontSize: 13, border: "none",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              cursor: "pointer",
            }}
          >
            手順を見る<ChevronRightIcon size={14} strokeWidth={2} />
          </button>
        </>
      )}

      {/* 診断情報（折りたたみ） */}
      <details style={{ marginTop: 12 }}>
        <summary style={{
          fontSize: 11, color: "#9a978c", fontWeight: 700,
          letterSpacing: "0.14em", cursor: "pointer", userSelect: "none",
          padding: "4px 2px",
        }}>
          接続情報
        </summary>
        <div style={{
          marginTop: 6, padding: "8px 10px",
          background: "#eceae4", borderRadius: 8,
          fontSize: 11, color: "#5a5852", lineHeight: 1.5,
          fontFamily: "ui-monospace, Menlo, Consolas, monospace",
          wordBreak: "break-all",
        }}>
          {info.userAgent}
        </div>
      </details>

      {/* ホーム画面追加 手順モーダル */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ background: "rgba(0,0,0,0.55)" }}
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", background: "#faf9f5",
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              padding: "24px 22px 32px",
              display: "flex", flexDirection: "column", gap: 16,
              maxHeight: "90vh", overflowY: "auto",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "#eef1f7", color: "#1a3a6b",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                marginBottom: 10,
              }}>
                <InstallIcon size={32} strokeWidth={2} />
              </div>
              <h2 style={{ fontSize: 19, fontWeight: 900, color: "#26251e", letterSpacing: "0.04em" }}>
                ホーム画面に追加する方法
              </h2>
            </div>
            <div style={{
              background: "#fff", border: "1px solid #E7E5DF", borderRadius: 14,
              padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12,
            }}>
              {info.isIOS ? (
                <>
                  <Step n={1}>画面<b>下部中央</b>の <span style={{ display: "inline-flex", background: "#eef1f7", border: "1px solid #c9dbe8", borderRadius: 4, padding: "0 6px", fontWeight: 800, color: "#1a3a6b" }}>□↑</span> をタップ</Step>
                  <Step n={2}>スクロールして <b>「ホーム画面に追加」</b>をタップ</Step>
                  <Step n={3}>右上の <b>「追加」</b>をタップ</Step>
                </>
              ) : (
                <>
                  <Step n={1}>画面右上の <b>「⋮」メニュー</b>をタップ</Step>
                  <Step n={2}><b>「ホーム画面に追加」</b>または<b>「アプリをインストール」</b>をタップ</Step>
                  <Step n={3}><b>「追加」</b>をタップして完了</Step>
                </>
              )}
            </div>
            <button type="button" onClick={() => setShowModal(false)}
              style={{
                padding: "14px 0", background: "#E7E5DF", color: "#26251e",
                fontWeight: 800, fontSize: 15, borderRadius: 12, border: "none",
              }}>
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* ブラウザで開き直す 手順モーダル */}
      {showBrowserModal && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ background: "rgba(0,0,0,0.55)" }}
          onClick={() => setShowBrowserModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", background: "#faf9f5",
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              padding: "24px 22px 32px",
              display: "flex", flexDirection: "column", gap: 16,
              maxHeight: "90vh", overflowY: "auto",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "#fef6db", color: "#8a4a15",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                marginBottom: 10,
              }}>
                <AlertIcon size={32} strokeWidth={1.75} />
              </div>
              <h2 style={{ fontSize: 19, fontWeight: 900, color: "#26251e", letterSpacing: "0.04em" }}>
                {info.isIOS ? "Safari" : "Chrome"} で開き直す
              </h2>
              <p style={{ fontSize: 13, color: "#5a5852", marginTop: 6, lineHeight: 1.6 }}>
                アプリ内のブラウザではホーム画面に追加できません。
              </p>
            </div>
            <div style={{
              background: "#fff", border: "1px solid #E7E5DF", borderRadius: 14,
              padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12,
            }}>
              {info.isIOS ? (
                <>
                  <Step n={1}>画面右下の <b>「共有ボタン」</b>または <b>「Safariで開く」</b>を押す</Step>
                  <Step n={2}>メニューから <b>「Safariで開く」</b>を選ぶ</Step>
                  <Step n={3}>Safari に切り替わったら、再度このページを開いて「ホーム画面に追加」</Step>
                </>
              ) : (
                <>
                  <Step n={1}>画面右上の <b>「⋮」メニュー</b>をタップ</Step>
                  <Step n={2}><b>「ブラウザで開く」</b>または <b>「Chromeで開く」</b>を選ぶ</Step>
                  <Step n={3}>Chrome に切り替わったら、再度このページを開いて「ホーム画面に追加」</Step>
                </>
              )}
            </div>
            <div style={{
              background: "#fff", border: "1px solid #E7E5DF", borderRadius: 12,
              padding: "12px 14px", display: "flex", alignItems: "center", gap: 10,
            }}>
              <div style={{
                flex: 1, fontSize: 13, fontWeight: 700, color: "#26251e",
                fontFamily: "ui-monospace, Menlo, Consolas, monospace",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {url}
              </div>
              <button type="button" onClick={copyUrl}
                style={{
                  background: copied ? "#047857" : "#0D9488", color: "#fff",
                  padding: "8px 12px", borderRadius: 8,
                  fontWeight: 800, fontSize: 12, border: "none",
                  flexShrink: 0, cursor: "pointer",
                }}>
                {copied ? "コピー済" : "URLコピー"}
              </button>
            </div>
            <button type="button" onClick={() => setShowBrowserModal(false)}
              style={{
                padding: "14px 0", background: "#E7E5DF", color: "#26251e",
                fontWeight: 800, fontSize: 15, borderRadius: 12, border: "none",
              }}>
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
      <span style={{
        width: 26, height: 26, borderRadius: "50%",
        background: "#1a3a6b", color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 900, flexShrink: 0,
      }}>{n}</span>
      <span style={{ fontSize: 14, color: "#26251e", lineHeight: 1.6, paddingTop: 2 }}>
        {children}
      </span>
    </div>
  );
}
