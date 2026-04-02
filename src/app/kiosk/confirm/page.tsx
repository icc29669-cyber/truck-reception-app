"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getKioskSession, setKioskSession } from "@/lib/kioskState";
import { registerReception } from "@/lib/api";
import type { KioskSession } from "@/types/reception";

export default function ConfirmPage() {
  const router = useRouter();
  const [session, setSession] = useState<KioskSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const s = getKioskSession();
    if (!s?.lookupResult?.reservation) {
      router.replace("/kiosk/phone");
      return;
    }
    setSession(s);
  }, [router]);

  if (!session?.lookupResult?.reservation) return null;

  const { driver, reservation } = session.lookupResult;

  async function handleRegister() {
    if (!session || !reservation) return;
    setLoading(true);
    setError("");
    try {
      const result = await registerReception({
        phone: session.phone,
        centerId: session.centerId,
        reservationId: reservation.id,
        driverData: {
          companyName: driver?.companyName ?? reservation.companyName,
          driverName: driver?.name ?? reservation.driverName,
          vehicleNumber: reservation.vehicleNumber,
        },
      });
      setKioskSession({ receptionResult: result });
      router.push("/kiosk/complete");
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 px-8">
      <div className="w-full max-w-lg space-y-6">
        {/* 予約あり表示 */}
        <div className="bg-green-800 rounded-3xl px-6 py-4 text-center">
          <p className="text-green-300 text-lg font-bold">✅ 予約が見つかりました</p>
          <p className="text-white text-3xl font-black mt-1">
            {reservation.startTime} 〜 {reservation.endTime}
          </p>
        </div>

        {/* 情報確認 */}
        <div className="bg-gray-800 rounded-3xl p-6 space-y-4 text-lg">
          <h3 className="text-xl font-black text-white border-b border-gray-600 pb-3">
            以下の内容で受付しますか？
          </h3>
          <Row label="会社名" value={driver?.companyName || reservation.companyName} />
          <Row label="お名前" value={driver?.name || reservation.driverName} />
          <Row label="車両番号" value={reservation.vehicleNumber} />
          <Row label="電話番号" value={session.phone} />
        </div>

        {error && <p className="text-red-400 text-center font-bold">{error}</p>}

        <div className="grid grid-cols-2 gap-4">
          <button
            onPointerDown={() => router.push("/kiosk/phone")}
            className="py-6 bg-gray-600 hover:bg-gray-500 active:bg-gray-700 text-white rounded-2xl text-2xl font-bold transition-colors"
          >
            戻る
          </button>
          <button
            onPointerDown={handleRegister}
            disabled={loading}
            className={`py-6 rounded-2xl text-2xl font-bold transition-colors ${
              loading
                ? "bg-gray-700 text-gray-500"
                : "bg-green-500 hover:bg-green-400 active:bg-green-600 text-white"
            }`}
          >
            {loading ? "受付中..." : "受付する"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-4">
      <span className="text-gray-400 w-24 shrink-0 text-base">{label}</span>
      <span className="text-white font-bold text-xl">{value || "—"}</span>
    </div>
  );
}
