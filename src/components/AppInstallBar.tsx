"use client";

import { useEffect, useState } from "react";
import { detectBrowser, type BrowserInfo } from "@/lib/browserDetect";
import { InstallIcon, AlertIcon, ChevronRightIcon, CheckIcon } from "./Icon";

// ログイン後の全画面（ダッシュボード / 予約 / 予約一覧）でヘッダー直下に表示する
// コンパクトな「ホーム画面に追加」誘導バー。
// すでに PWA として起動していれば出さない。

export default function AppInstallBar() {
  const [info, setInfo] = useState<BrowserInfo | null>(null);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [dismissedSession, setDismissedSession] = useState(false);

  useEffect(() => {
    setInfo(detectBrowser());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);

    // 当セッション中で「あとで」を押した場合は出さない（次回セッションで復活）
    try {
      if (sessionStorage.getItem("install_bar_dismissed") === "1") {
        setDismissedSession(true);
      }
    } catch {}

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // 判定完了前は何も表示しない（SSR とのチラつき防止）
  if (!info) return null;
  if (info.isStandalone) return null;
  if (dismissedSession) return null;
  // InAppBrowserBanner が sticky で出るので、ここではバー重複を避けるため非表示
  if (info.inAppBrowser) return null;

  const isInApp = false;  // 上で弾いているので常に false
  const isIOS = info.isIOS;
  const url = typeof window !== "undefined" ? window.location.origin : "";

  function dismiss() {
    try { sessionStorage.setItem("install_bar_dismissed", "1"); } catch {}
    setDismissedSession(true);
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

  async function handleNativeInstall() {
    if (!deferredPrompt) { setOpen(true); return; }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInfo((i) => i ? { ...i, isStandalone: true } : i);
    setDeferredPrompt(null);
  }

  return (
    <>
      <div style={{
        background: isInApp ? "#D97706" : "#FACC15",
        padding: "10px 14px",
        display: "flex", alignItems: "center", gap: 10,
        borderBottom: "1px solid rgba(0,0,0,0.06)",
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "rgba(255,255,255,0.38)",
          color: isInApp ? "#fff" : "#26251e",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          {isInApp ? <AlertIcon size={16} strokeWidth={2.2} /> : <InstallIcon size={16} strokeWidth={2.2} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 900, color: isInApp ? "#fff" : "#26251e",
            lineHeight: 1.3, letterSpacing: "0.02em",
          }}>
            {isInApp
              ? `${isIOS ? "Safari" : "Chrome"} で開いてください`
              : "ホーム画面に追加するとアイコンから開けます"}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            background: isInApp ? "#fff" : "#26251e",
            color: isInApp ? "#8a4a15" : "#fff",
            padding: "6px 12px", borderRadius: 999,
            fontWeight: 800, fontSize: 12, border: "none",
            display: "flex", alignItems: "center", gap: 2,
            flexShrink: 0, cursor: "pointer",
          }}
        >
          方法<ChevronRightIcon size={13} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="閉じる"
          style={{
            background: "transparent", border: "none",
            color: isInApp ? "rgba(255,255,255,0.75)" : "rgba(38,37,30,0.55)",
            fontSize: 18, fontWeight: 700, lineHeight: 1,
            padding: "4px 6px", cursor: "pointer", flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>

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
              maxHeight: "90vh", overflowY: "auto",
              display: "flex", flexDirection: "column", gap: 16,
            }}
          >
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
                {isInApp ? `${isIOS ? "Safari" : "Chrome"} で開き直す` : "ホーム画面に追加する方法"}
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
                    <Step n={1}>画面右下の <b>「共有」</b>または <b>「Safariで開く」</b>を押す</Step>
                    <Step n={2}><b>「Safariで開く」</b>を選ぶ</Step>
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
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                {copied ? <><CheckIcon size={13} strokeWidth={2.5} />コピー済</> : "URLコピー"}
              </button>
            </div>

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
