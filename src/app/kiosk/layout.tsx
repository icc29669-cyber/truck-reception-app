"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { clearKioskSession } from "@/lib/kioskState";

/** 無操作タイムアウト（秒） — トップ画面以外で操作がなければ自動リセット */
const INACTIVITY_TIMEOUT_SEC = 300; // 5分

function requestFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  }
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

export default function KioskLayout({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [navigating, setNavigating] = useState(false);
  const prevPathRef = useRef(pathname);

  // トップ画面・完了画面ではタイムアウト不要
  const isExemptPage = pathname === "/kiosk" || pathname === "/kiosk/complete";

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

  useEffect(() => {
    requestFullscreen();
    document.addEventListener("visibilitychange", requestFullscreen);
    return () => document.removeEventListener("visibilitychange", requestFullscreen);
  }, []);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const handler = (e: PointerEvent) => {
      requestFullscreen();
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
  }, []);

  return (
    <div ref={ref}>
      {children}
      {navigating && <TransitionOverlay />}
    </div>
  );
}
