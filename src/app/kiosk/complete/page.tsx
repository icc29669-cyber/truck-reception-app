"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getKioskSession, clearKioskSession } from "@/lib/kioskState";
import type { ReceptionResult } from "@/types/reception";

const AUTO_RETURN = 30;

export default function CompletePage() {
  const router = useRouter();
  const [result, setResult] = useState<ReceptionResult | null>(null);
  const [countdown, setCountdown] = useState(AUTO_RETURN);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const s = getKioskSession();
    if (!s?.receptionResult) {
      router.replace("/kiosk");
      return;
    }
    setResult(s.receptionResult);

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

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function goHome() {
    if (timerRef.current) clearInterval(timerRef.current);
    clearKioskSession();
    router.push("/kiosk");
  }

  const arrivedAt = result ? new Date(result.arrivedAt) : new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const dateStr = result
    ? `${arrivedAt.getMonth() + 1}月${arrivedAt.getDate()}日 ${pad(arrivedAt.getHours())}:${pad(arrivedAt.getMinutes())}`
    : "";

  return (
    <div
      className="w-screen h-screen flex flex-col select-none overflow-hidden"
      style={{ background: "linear-gradient(160deg, #E8F4FD 0%, #D0E8FA 50%, #B8D8F6 100%)" }}
    >
      {/* ヘッダー */}
      <div
        className="flex items-center justify-center px-16 py-5"
        style={{ background: "linear-gradient(90deg, #1a3a6b 0%, #1E5799 100%)" }}
      >
        <div className="text-center">
          <p className="text-white font-bold opacity-90" style={{ fontSize: 28 }}>
            日本セイフティー株式会社
          </p>
          <p className="text-white font-black" style={{ fontSize: 40 }}>
            {result?.centerName ?? ""}
          </p>
        </div>
      </div>

      {!result ? (
        /* ローディング中 */
        <div className="flex-1 flex items-center justify-center">
          <p className="text-4xl font-bold text-gray-500">読み込み中...</p>
        </div>
      ) : (
        /* メインコンテンツ */
        <div className="flex-1 flex flex-col items-center justify-center gap-10 px-16">
          {/* 完了メッセージ */}
          <div
            className="rounded-full bg-green-100 border-4 border-green-500 flex items-center justify-center"
            style={{ width: 200, height: 200 }}
          >
            <span style={{ fontSize: 100, color: "#2E7D32" }}>✓</span>
          </div>
          <h1 className="font-black text-center" style={{ fontSize: 72, color: "#2E7D32" }}>
            受付完了
          </h1>

          {/* 日時と待機台数 */}
          <div className="flex gap-10">
            <div className="bg-white rounded-3xl border-2 border-gray-200 shadow-md px-12 py-6 text-center">
              <p className="font-bold text-gray-500" style={{ fontSize: 30 }}>受付日時</p>
              <p className="font-black text-gray-900" style={{ fontSize: 48 }}>{dateStr}</p>
            </div>
            <div className="bg-white rounded-3xl border-2 border-blue-200 shadow-md px-12 py-6 text-center">
              <p className="font-bold text-gray-500" style={{ fontSize: 30 }}>現在の待機台数</p>
              <p className="font-black text-blue-700" style={{ fontSize: 72 }}>
                {result.waitingCount}
                <span style={{ fontSize: 40 }}>台</span>
              </p>
            </div>
          </div>

          {/* 案内テキスト */}
          <div
            className="rounded-3xl border-4 border-amber-400 px-16 py-8 text-center"
            style={{ background: "#FFF8E1", maxWidth: 900 }}
          >
            <p className="font-black text-amber-900" style={{ fontSize: 48 }}>
              受付票を取り<br />受付カウンターへお進みください
            </p>
          </div>

          {/* カウントダウン */}
          <p className="font-bold text-gray-500" style={{ fontSize: 32 }}>
            {countdown}秒後に自動的に最初の画面に戻ります
          </p>

          {/* 戻るボタン */}
          <button
            onPointerDown={goHome}
            className="bg-[#2E7D32] text-white font-black rounded-3xl
                       shadow-[0_14px_0_#1B5E20] active:shadow-[0_3px_0_#1B5E20]
                       active:translate-y-[11px] transition-all duration-75
                       flex items-center justify-center border-4 border-[#4CAF50]"
            style={{ width: 600, height: 160, fontSize: 52 }}
          >
            最初の画面に戻る
          </button>
        </div>
      )}
    </div>
  );
}
