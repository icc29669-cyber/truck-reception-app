"use client";

import { useEffect, useState } from "react";
import { detectBrowser, type BrowserInfo } from "@/lib/browserDetect";
import { AlertIcon, CheckIcon, ChevronRightIcon } from "./Icon";

// LINE/Facebook 等の内蔵ブラウザ警告バナー。
// root layout に設置して全ページで監視する。

export default function InAppBrowserBanner() {
  const [info, setInfo] = useState<BrowserInfo | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setInfo(detectBrowser());
  }, []);

  if (!info || !info.inAppBrowser) return null;

  const url = typeof window !== "undefined" ? window.location.origin : "";

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <>
      {/* バナー */}
      <div
        style={{
          position: "sticky", top: 0, zIndex: 100,
          background: "#8a4a15", color: "#fff",
          padding: "10px 14px",
          display: "flex", alignItems: "center", gap: 10,
          fontSize: 13, fontWeight: 700,
          boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
        }}
      >
        <AlertIcon size={18} strokeWidth={2.2} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, lineHeight: 1.4 }}>
          {info.inAppName} のブラウザでは一部機能が使えません
        </span>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          style={{
            background: "#fff", color: "#8a4a15",
            padding: "6px 12px", borderRadius: 8,
            fontWeight: 800, fontSize: 12, border: "none",
            display: "flex", alignItems: "center", gap: 2,
            flexShrink: 0, cursor: "pointer",
          }}
        >
          開き方<ChevronRightIcon size={14} strokeWidth={2.5} />
        </button>
      </div>

      {/* モーダル */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", background: "#faf9f5",
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              padding: "24px 22px 32px",
              maxHeight: "90vh", overflowY: "auto",
              display: "flex", flexDirection: "column", gap: 16,
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
                {info.isIOS ? "Safari" : "Chrome"} で開き直してください
              </h2>
              <p style={{ fontSize: 13, color: "#5a5852", marginTop: 6, lineHeight: 1.6 }}>
                {info.inAppName} の画面では、ログインの保存やホーム画面への追加ができません。
              </p>
            </div>

            {/* 手順 */}
            <div style={{
              background: "#fff", border: "1px solid #E7E5DF", borderRadius: 14,
              padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14,
            }}>
              {info.isIOS ? (
                <>
                  <Step n={1}>画面右下の <b>「共有ボタン」</b>または <b>「Safariで開く」</b>を押す</Step>
                  <Step n={2}>メニューから <b>「Safariで開く」</b>を選ぶ</Step>
                  <Step n={3}>下のURLをコピーして Safari に貼り付けてもOK</Step>
                </>
              ) : info.isAndroid ? (
                <>
                  <Step n={1}>画面右上の <b>「⋮」メニュー</b>をタップ</Step>
                  <Step n={2}><b>「ブラウザで開く」</b>または <b>「Chromeで開く」</b>を選ぶ</Step>
                  <Step n={3}>下のURLをコピーして Chrome に貼り付けてもOK</Step>
                </>
              ) : (
                <>
                  <Step n={1}>このアプリのブラウザの「メニュー」から「ブラウザで開く」を選ぶ</Step>
                  <Step n={2}>または下のURLをコピーしてブラウザに貼り付け</Step>
                </>
              )}
            </div>

            {/* URL コピー */}
            <div style={{
              background: "#fff", border: "1px solid #E7E5DF", borderRadius: 12,
              padding: "12px 14px", display: "flex", alignItems: "center", gap: 10,
            }}>
              <div style={{
                flex: 1, fontSize: 14, fontWeight: 700, color: "#26251e",
                fontFamily: "ui-monospace, Menlo, Consolas, monospace",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {url}
              </div>
              <button
                type="button"
                onClick={copyUrl}
                style={{
                  background: copied ? "#047857" : "#0D9488", color: "#fff",
                  padding: "8px 14px", borderRadius: 8,
                  fontWeight: 800, fontSize: 13, border: "none",
                  display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
                  cursor: "pointer",
                }}
              >
                {copied ? <><CheckIcon size={14} strokeWidth={2.5} />コピー済</> : "URLコピー"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowModal(false)}
              style={{
                padding: "14px 0", background: "#E7E5DF", color: "#26251e",
                fontWeight: 800, fontSize: 15, borderRadius: 12, border: "none",
              }}
            >
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
