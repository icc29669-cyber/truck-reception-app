"use client";
import { useEffect } from "react";

/** ピンチズーム・Ctrl+ホイール・Ctrl+[+-0]によるズームを全て防止 */
export default function NoZoom() {
  useEffect(() => {
    // Ctrl+ホイール（トラックパッドのピンチも含む）
    const preventWheel = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault();
    };
    // Ctrl+[+-=0] キーボードショートカット
    const preventKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && ["=", "+", "-", "0"].includes(e.key)) {
        e.preventDefault();
      }
    };
    // gesturechange / gesturestart（Safari ピンチ）
    const preventGesture = (e: Event) => e.preventDefault();

    document.addEventListener("wheel", preventWheel, { passive: false });
    document.addEventListener("keydown", preventKey);
    document.addEventListener("gesturestart", preventGesture);
    document.addEventListener("gesturechange", preventGesture);

    return () => {
      document.removeEventListener("wheel", preventWheel);
      document.removeEventListener("keydown", preventKey);
      document.removeEventListener("gesturestart", preventGesture);
      document.removeEventListener("gesturechange", preventGesture);
    };
  }, []);

  return null;
}
