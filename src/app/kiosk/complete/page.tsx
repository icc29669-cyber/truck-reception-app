"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getKioskSession, clearKioskSession } from "@/lib/kioskState";
import PrintReceipt from "@/components/PrintReceipt";
import type { ReceptionResult } from "@/types/reception";

export default function CompletePage() {
  const router = useRouter();
  const [result, setResult] = useState<ReceptionResult | null>(null);
  const [countdown, setCountdown] = useState(8);
  const printed = useRef(false);

  useEffect(() => {
    const s = getKioskSession();
    if (!s?.receptionResult) {
      router.replace("/kiosk");
      return;
    }
    setResult(s.receptionResult);

    // バーコード描画後に印刷
    if (!printed.current) {
      printed.current = true;
      const t = setTimeout(() => {
        window.print();
        startCountdown();
      }, 500);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startCountdown() {
    let n = 8;
    const timer = setInterval(() => {
      n -= 1;
      setCountdown(n);
      if (n <= 0) {
        clearInterval(timer);
        clearKioskSession();
        router.push("/kiosk");
      }
    }, 1000);
  }

  if (!result) return null;

  return (
    <>
      {/* 印刷用受付票（非表示・印刷時のみ表示） */}
      <PrintReceipt data={result} />

      {/* 完了画面 */}
      <div className="min-h-screen flex flex-col items-center justify-center bg-green-900 px-8">
        <div className="text-center space-y-6 w-full max-w-lg">
          <div className="text-8xl">✅</div>
          <h1 className="text-5xl font-black text-white">受付完了</h1>

          <div className="bg-green-800 rounded-3xl p-6 space-y-3 text-xl">
            <div className="text-green-300 text-2xl font-black">
              受付番号 {String(result.centerDailyNo).padStart(3, "0")}
            </div>
            {result.reservation && (
              <div className="text-white font-bold">
                予約時間：{result.reservation.startTime} 〜 {result.reservation.endTime}
              </div>
            )}
            <div className="text-green-200 text-base">
              {result.driver.companyName}　{result.driver.name} 様
            </div>
          </div>

          <div className="bg-yellow-800 rounded-2xl px-6 py-4">
            <p className="text-yellow-200 text-xl font-bold">
              📄 受付票が印刷されます
            </p>
            <p className="text-yellow-300 text-base mt-1">
              受付カウンターへお持ちください
            </p>
          </div>

          <p className="text-green-400 text-xl">
            {countdown} 秒後に最初の画面に戻ります
          </p>

          <button
            onPointerDown={() => { clearKioskSession(); router.push("/kiosk"); }}
            className="w-full py-5 bg-white text-green-900 rounded-2xl text-2xl font-black"
          >
            最初の画面に戻る
          </button>
        </div>
      </div>
    </>
  );
}
