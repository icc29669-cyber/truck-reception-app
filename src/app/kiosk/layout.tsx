"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { clearKioskSession } from "@/lib/kioskState";

/** 無操作タイムアウト（秒） — トップ画面以外で操作がなければ自動リセット */
const INACTIVITY_TIMEOUT_SEC = 300; // 5分

/**
 * キオスク共通レイアウト
 * - 全 button 要素にタップ時のフラッシュフィードバックを自動付与
 * - 無操作タイムアウトで自動的にトップへ戻る
 */
function requestFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  }
}

export default function KioskLayout({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // トップ画面・完了画面ではタイムアウト不要
  const isExemptPage = pathname === "/kiosk" || pathname === "/kiosk/complete";

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
    // ページ表示時・フォーカス復帰時に全画面を試みる
    requestFullscreen();
    document.addEventListener("visibilitychange", requestFullscreen);
    return () => document.removeEventListener("visibilitychange", requestFullscreen);
  }, []);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const handler = (e: PointerEvent) => {
      // タップのたびに全画面を維持（ESC後の復帰）
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

  return <div ref={ref}>{children}</div>;
}
