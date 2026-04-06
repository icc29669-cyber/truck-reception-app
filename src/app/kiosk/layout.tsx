"use client";

import { useEffect, useRef } from "react";

/**
 * キオスク共通レイアウト
 * - 全 button 要素にタップ時のフラッシュフィードバックを自動付与
 */
function requestFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  }
}

export default function KioskLayout({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

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
