"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getKioskSession, setKioskSession } from "@/lib/kioskState";
import { registerReception } from "@/lib/api";
import type { KioskSession } from "@/types/reception";

export default function FinalConfirmPage() {
  const router = useRouter();
  const [session, setSession] = useState<KioskSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const s = getKioskSession();
    if (!s?.driverInput?.driverName) {
      router.replace("/kiosk/driver-input");
      return;
    }
    setSession(s);
  }, [router]);

  if (!session) return null;

  const { driverInput, phone, centerId } = session;

  async function handleRegister() {
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      const result = await registerReception({
        phone,
        centerId,
        driverData: driverInput,
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
        <h2 className="text-3xl font-black text-center text-white">内容を確認してください</h2>

        <div className="bg-gray-800 rounded-3xl p-6 space-y-4 text-lg">
          <Row label="会社名" value={driverInput.companyName} onEdit={() => router.push("/kiosk/driver-input")} />
          <Row label="お名前" value={driverInput.driverName} onEdit={() => router.push("/kiosk/driver-input")} />
          <Row label="車両番号" value={driverInput.vehicleNumber} onEdit={() => router.push("/kiosk/driver-input")} />
          <Row label="電話番号" value={phone} onEdit={() => router.push("/kiosk/phone")} />
        </div>

        <div className="bg-yellow-900 rounded-2xl px-5 py-3 text-yellow-300 text-base font-bold text-center">
          ⚠️ この内容で受付します。よろしければ「受付する」を押してください
        </div>

        {error && <p className="text-red-400 text-center font-bold">{error}</p>}

        <div className="grid grid-cols-2 gap-4">
          <button
            onPointerDown={() => router.push("/kiosk/driver-input")}
            className="py-6 bg-gray-600 hover:bg-gray-500 text-white rounded-2xl text-2xl font-bold transition-colors"
          >
            修正する
          </button>
          <button
            onPointerDown={handleRegister}
            disabled={loading}
            className={`py-6 rounded-2xl text-2xl font-bold transition-colors ${
              loading ? "bg-gray-700 text-gray-500" : "bg-green-500 hover:bg-green-400 text-white"
            }`}
          >
            {loading ? "受付中..." : "受付する"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-gray-400 w-24 shrink-0 text-base">{label}</span>
      <span className="text-white font-bold text-xl flex-1">{value || "—"}</span>
      <button onPointerDown={onEdit} className="text-blue-400 text-sm border border-blue-600 px-3 py-1 rounded-lg">修正</button>
    </div>
  );
}
