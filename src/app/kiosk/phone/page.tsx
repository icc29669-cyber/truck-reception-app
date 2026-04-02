"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import NumericKeypad from "@/components/NumericKeypad";
import { lookupDriver } from "@/lib/api";
import { getKioskSession, setKioskSession } from "@/lib/kioskState";

function formatDisplay(digits: string): string {
  if (digits.length === 0) return "";
  if (digits.startsWith("070") || digits.startsWith("080") || digits.startsWith("090")) {
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0,3)}-${digits.slice(3)}`;
    return `${digits.slice(0,3)}-${digits.slice(3,7)}-${digits.slice(7)}`;
  }
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0,3)}-${digits.slice(3)}`;
  return `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6)}`;
}

export default function PhonePage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isValid = phone.length >= 10 && phone.length <= 11;

  async function handleSearch() {
    if (!isValid) return;
    setLoading(true);
    setError("");
    try {
      const session = getKioskSession();
      const centerId = session?.centerId ?? Number(process.env.NEXT_PUBLIC_CENTER_ID ?? 1);
      const result = await lookupDriver(phone, centerId);
      setKioskSession({ phone, lookupResult: result });

      if (result.reservation) {
        // 予約あり → 確認画面へ
        router.push("/kiosk/confirm");
      } else {
        // 予約なし（またはドライバー情報未登録）→ 入力画面へ
        router.push("/kiosk/driver-input");
      }
    } catch {
      setError("通信エラーが発生しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 px-8">
      <div className="w-full max-w-sm space-y-6">
        <h2 className="text-3xl font-black text-center text-white">電話番号を入力</h2>

        {/* 表示エリア */}
        <div className="bg-gray-800 rounded-2xl px-6 py-5 text-center">
          {phone.length > 0 ? (
            <span className="text-4xl font-black text-white tracking-widest">
              {formatDisplay(phone)}
            </span>
          ) : (
            <span className="text-3xl text-gray-500">000-0000-0000</span>
          )}
        </div>

        {error && (
          <p className="text-red-400 text-center font-bold">{error}</p>
        )}

        {/* テンキー */}
        <NumericKeypad value={phone} onChange={setPhone} maxLength={11} />

        {/* ボタン */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <button
            onPointerDown={() => router.push("/kiosk/caution")}
            className="py-6 bg-gray-600 hover:bg-gray-500 active:bg-gray-700 text-white rounded-2xl text-2xl font-bold transition-colors"
          >
            戻る
          </button>
          <button
            onPointerDown={handleSearch}
            disabled={!isValid || loading}
            className={`py-6 rounded-2xl text-2xl font-bold transition-colors ${
              isValid && !loading
                ? "bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white"
                : "bg-gray-700 text-gray-500 cursor-not-allowed"
            }`}
          >
            {loading ? "検索中..." : "次へ"}
          </button>
        </div>
      </div>
    </div>
  );
}
