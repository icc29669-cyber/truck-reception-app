"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { clearKioskSession } from "@/lib/kioskState";

/** 無操作タイムアウト（秒） — トップ画面以外で操作がなければ自動リセット */
const INACTIVITY_TIMEOUT_SEC = 600; // 10分（現場オペレーションで電話応対や休憩を挟む余裕を優先）

function requestFullscreen(): Promise<void> {
  if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
    return document.documentElement.requestFullscreen().catch(() => {});
  }
  return Promise.resolve();
}

/** ページ遷移中のローディングオーバーレイ */
function TransitionOverlay() {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 99999,
      background: "rgba(15,23,42,0.35)",
      backdropFilter: "blur(3px)",
      WebkitBackdropFilter: "blur(3px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "kiosk-overlay-in 0.15s ease-out",
    }}>
      <style>{`
        @keyframes kiosk-overlay-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes kiosk-overlay-spin { to { transform: rotate(360deg) } }
      `}</style>
      <div style={{
        width: 56, height: 56,
        border: "5px solid rgba(255,255,255,0.15)",
        borderTopColor: "#2DD4BF",
        borderRadius: "50%",
        animation: "kiosk-overlay-spin 0.8s linear infinite",
      }} />
    </div>
  );
}

/** 全画面起動オーバーレイ（ブラウザの仕様でユーザー操作必須） */
function FullscreenPrompt({ onStart }: { onStart: () => void }) {
  return (
    <div
      onPointerDown={onStart}
      style={{
        position: "fixed", inset: 0, zIndex: 999999,
        background: "linear-gradient(135deg, #0F172A 0%, #1a3a6b 100%)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        cursor: "pointer", userSelect: "none",
        animation: "kiosk-fsprompt-in 0.3s ease-out",
      }}
    >
      <style>{`
        @keyframes kiosk-fsprompt-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes kiosk-fsprompt-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.85; }
        }
      `}</style>

      <div style={{
        fontSize: 14, color: "rgba(255,255,255,0.45)",
        letterSpacing: "0.32em", fontWeight: 800, marginBottom: 24,
      }}>
        TRUCK RECEPTION SYSTEM
      </div>

      <div style={{
        fontSize: 64, fontWeight: 900, color: "#fff",
        letterSpacing: "0.1em", marginBottom: 16,
      }}>
        画面をタッチ
      </div>

      <div style={{
        fontSize: 22, color: "rgba(255,255,255,0.65)",
        letterSpacing: "0.08em", fontWeight: 500, marginBottom: 80,
      }}>
        受付を開始します
      </div>

      <div style={{
        fontSize: 80,
        animation: "kiosk-fsprompt-pulse 1.8s ease-in-out infinite",
      }}>
        👆
      </div>
    </div>
  );
}

export default function KioskLayout({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [navigating, setNavigating] = useState(false);
  const [needsFullscreen, setNeedsFullscreen] = useState(false);
  const [ready, setReady] = useState(false);
  const prevPathRef = useRef(pathname);
  const promptShownRef = useRef(false);  // 初回プロンプト表示済みフラグ（セッション中は再表示しない）

  // トップ画面・完了画面ではタイムアウト不要
  const isExemptPage = pathname === "/kiosk" || pathname === "/kiosk/complete";

  // 初期マウント時（業務開始時）にのみ全画面プロンプトを表示。
  // 受付完了後の /kiosk への自動復帰では再表示しない（印刷で fullscreen が抜けた場合は
  // visibilitychange / pointerdown ハンドラが自動再取得する）。
  useEffect(() => {
    // iframeやプレビュー環境では全画面プロンプトを出さない
    const isEmbedded = window.self !== window.top;
    const isSmallScreen = window.innerWidth < 800;
    if (isEmbedded || isSmallScreen) {
      setReady(true);
      return;
    }
    // セッション中に既に一度表示していれば再表示しない
    if (promptShownRef.current) {
      setReady(true);
      return;
    }
    // トップ画面でのみプロンプト表示（業務開始時の1回のみ）
    if (pathname === "/kiosk" && !document.fullscreenElement) {
      setNeedsFullscreen(true);
      promptShownRef.current = true;
    } else {
      setReady(true);
    }
  }, [pathname]);

  const startFullscreen = useCallback(() => {
    requestFullscreen().finally(() => {
      setNeedsFullscreen(false);
      setReady(true);
    });
  }, []);

  // ページ遷移検知: pathnameが変わったらオーバーレイを消す
  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;
      setNavigating(false);
    }
  }, [pathname]);

  // router.pushをインターセプトしてオーバーレイ表示
  useEffect(() => {
    const originalPush = router.push.bind(router);
    const originalReplace = router.replace.bind(router);

    router.push = (...args: Parameters<typeof router.push>) => {
      setNavigating(true);
      return originalPush(...args);
    };
    router.replace = (...args: Parameters<typeof router.replace>) => {
      setNavigating(true);
      return originalReplace(...args);
    };

    return () => {
      router.push = originalPush;
      router.replace = originalReplace;
    };
  }, [router]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (isExemptPage) return;
    timerRef.current = setTimeout(() => {
      clearKioskSession();
      router.replace("/kiosk");
    }, INACTIVITY_TIMEOUT_SEC * 1000);
  }, [isExemptPage, router]);

  // 無操作タイムアウト
  useEffect(() => {
    if (isExemptPage) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }
    const events = ["pointerdown", "keydown", "scroll"] as const;
    const handler = () => resetTimer();
    events.forEach((e) => document.addEventListener(e, handler));
    resetTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((e) => document.removeEventListener(e, handler));
    };
  }, [isExemptPage, resetTimer]);

  // 全画面の維持（フォーカス戻り時 & fullscreen 解除検知）
  useEffect(() => {
    if (!ready) return;
    const onVisibilityChange = () => {
      if (!document.hidden && !document.fullscreenElement) {
        requestFullscreen();
      }
    };
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setTimeout(() => requestFullscreen(), 250);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [ready]);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const handler = (e: PointerEvent) => {
      // タッチのたびに全画面を維持（ESC後の復帰）
      if (ready && !document.fullscreenElement) requestFullscreen();
      const btn = (e.target as HTMLElement).closest("button");
      if (!btn || btn.disabled) return;
      btn.classList.remove("btn-flash");
      void btn.offsetWidth;
      btn.classList.add("btn-flash");
      const cleanup = () => btn.classList.remove("btn-flash");
      btn.addEventListener("animationend", cleanup, { once: true });
    };

    container.addEventListener("pointerdown", handler);
    return () => container.removeEventListener("pointerdown", handler);
  }, [ready]);

  return (
    <div ref={ref}>
      {children}
      {navigating && <TransitionOverlay />}
      {needsFullscreen && <FullscreenPrompt onStart={startFullscreen} />}
    </div>
  );
}
