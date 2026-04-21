"use client";

import { useEffect, useState } from "react";
import { detectBrowser, type BrowserInfo } from "@/lib/browserDetect";
import { InstallIcon, AlertIcon, ChevronRightIcon } from "./Icon";

// ログイン画面下部に表示するコンパクトな案内。
// ログイン前でもホーム画面追加 or ブラウザ切替の導線を持たせる。

export default function LoginAppHint() {
  const [info, setInfo] = useState<BrowserInfo | null>(null);
  const [open, setOpen] = useState(false);
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

  // info が null のときも button は表示する（SSR / WebView で JS 遅延しても見える）
  if (info?.isStandalone) return null;

  const url = typeof window !== "undefined" ? window.location.origin : "";
  const isInApp = info?.inAppBrowser;
  const isIOS = info?.isIOS ?? false;

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

  async function handleNativeInstall() {
    if (!deferredPrompt) { setOpen(true); return; }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setInfo((i) => i ? { ...i, isStandalone: true } : i);
    }
    setDeferredPrompt(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          width: "100%", padding: "16px 18px",
          background: isInApp ? "#D97706" : "#FACC15",
          border: "none",
          color: isInApp ? "#fff" : "#26251e",
          borderRadius: 14, fontSize: 16, fontWeight: 900,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          cursor: "pointer",
          boxShadow: "0 8px 20px rgba(0,0,0,0.22)",
          letterSpacing: "0.04em",
        }}
      >
        {isInApp
          ? <><AlertIcon size={20} strokeWidth={2.2} />{isIOS ? "Safari" : "Chrome"}で開く方法</>
          : <><InstallIcon size={20} strokeWidth={2.2} />アプリとして使う<span style={{ fontSize: 12, fontWeight: 700, opacity: 0.7 }}>（ホーム画面に追加）</span></>}
        <ChevronRightIcon size={18} strokeWidth={2.5} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setOpen(false)}
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
            {/* 状態ラベル */}
            <div style={{
              display: "inline-flex", alignSelf: "center",
              background: isInApp ? "#fef6db" : "#eef1f7",
              color: isInApp ? "#8a4a15" : "#1a3a6b",
              padding: "4px 12px", borderRadius: 999,
              fontSize: 11, fontWeight: 800, letterSpacing: "0.18em",
            }}>
              現在: {info?.inAppName || (isIOS ? "iOS ブラウザ" : info?.isAndroid ? "Android ブラウザ" : "ブラウザ")}
            </div>

            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: isInApp ? "#fef6db" : "#eef1f7",
                color: isInApp ? "#8a4a15" : "#1a3a6b",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                marginBottom: 10,
              }}>
                {isInApp ? <AlertIcon size={32} strokeWidth={1.75} /> : <InstallIcon size={32} strokeWidth={2} />}
              </div>
              <h2 style={{ fontSize: 19, fontWeight: 900, color: "#26251e", letterSpacing: "0.04em" }}>
                {isInApp
                  ? `${isIOS ? "Safari" : "Chrome"} で開き直す`
                  : "ホーム画面に追加する方法"}
              </h2>
              {isInApp && (
                <p style={{ fontSize: 13, color: "#5a5852", marginTop: 6, lineHeight: 1.6 }}>
                  アプリ内のブラウザではホーム画面に追加できません。
                </p>
              )}
            </div>

            <div style={{
              background: "#fff", border: "1px solid #E7E5DF", borderRadius: 14,
              padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12,
            }}>
              {isInApp ? (
                isIOS ? (
                  <>
                    <Step n={1}>画面右下の <b>「共有ボタン」</b>または <b>「Safariで開く」</b>を押す</Step>
                    <Step n={2}>メニューから <b>「Safariで開く」</b>を選ぶ</Step>
                  </>
                ) : (
                  <>
                    <Step n={1}>画面右上の <b>「⋮」メニュー</b>をタップ</Step>
                    <Step n={2}><b>「ブラウザで開く」</b>または <b>「Chromeで開く」</b>を選ぶ</Step>
                  </>
                )
              ) : isIOS ? (
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

            {/* Android 通常ブラウザで beforeinstallprompt が来ていたらワンタップ */}
            {!isInApp && deferredPrompt && (
              <button type="button" onClick={handleNativeInstall}
                style={{
                  padding: "16px 0", background: "#0D9488", color: "#fff",
                  fontWeight: 900, fontSize: 16, borderRadius: 12, border: "none",
                  boxShadow: "0 6px 16px rgba(13,148,136,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                <InstallIcon size={18} strokeWidth={2} />
                ワンタップで追加する
              </button>
            )}

            {/* URL コピー */}
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
                  background: copied ? "#047857" : "#1a3a6b", color: "#fff",
                  padding: "8px 12px", borderRadius: 8,
                  fontWeight: 800, fontSize: 12, border: "none",
                  flexShrink: 0, cursor: "pointer",
                }}>
                {copied ? "コピー済" : "URLコピー"}
              </button>
            </div>

            {/* 接続情報 */}
            <details>
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
                {info?.userAgent ?? "検出中..."}
              </div>
            </details>

            <button type="button" onClick={() => setOpen(false)}
              style={{
                padding: "14px 0", background: "#E7E5DF", color: "#26251e",
                fontWeight: 800, fontSize: 15, borderRadius: 12, border: "none",
              }}>
              閉じる
            </button>
          </div>
        </div>
      )}
    </>
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
