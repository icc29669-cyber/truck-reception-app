"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getKioskSession, setKioskSession } from "@/lib/kioskState";
import PlateDisplay from "@/components/PlateDisplay";
import type { VehicleCandidate } from "@/types/reception";

export default function VehicleSelectPage() {
  const router = useRouter();
  const session = getKioskSession();
  const [vehicles, setVehicles] = useState<VehicleCandidate[]>(
    session.vehicleCandidates ?? []
  );

  function selectVehicle(v: VehicleCandidate) {
    setKioskSession({
      selectedVehicle: v,
      plate: v.plate,
      driverInput: { ...session.driverInput, maxLoad: v.maxLoad },
    });
    router.push("/kiosk/data-confirm");
  }

  function deleteVehicle(id: number) {
    const updated = vehicles.filter((v) => v.id !== id);
    setVehicles(updated);
    setKioskSession({ vehicleCandidates: updated });
  }

  function notFound() {
    setKioskSession({ selectedVehicle: null });
    router.push("/kiosk/data-confirm");
  }

  return (
    <div
      className="w-screen h-screen flex flex-col select-none overflow-hidden"
      style={{ background: "linear-gradient(160deg, #E8F4FD 0%, #D0E8FA 50%, #B8D8F6 100%)" }}
    >
      {/* ヘッダー */}
      <div
        className="flex items-center px-10 gap-6 flex-shrink-0"
        style={{
          background: "linear-gradient(90deg, #1a3a6b 0%, #1E5799 100%)",
          height: 110,
        }}
      >
        {/* 表示されないお客様ボタン */}
        <button
          onPointerDown={notFound}
          className="flex items-center justify-center font-bold rounded-2xl border-2 border-pink-400 bg-pink-500 text-white text-4xl active:bg-pink-600 flex-shrink-0"
          style={{ height: 110, width: 400 }}
        >
          表示されないお客様
        </button>

        {/* タイトル */}
        <h1 className="flex-1 text-5xl font-black text-white text-center">
          車両ナンバーを選択して下さい
        </h1>

        {/* 戻るボタン */}
        <button
          onPointerDown={() => router.back()}
          className="flex items-center justify-center font-bold rounded-2xl border-2 border-white text-white text-4xl active:bg-blue-800 flex-shrink-0"
          style={{ height: 90, width: 180 }}
        >
          戻る
        </button>
      </div>

      {/* 車両グリッド */}
      <div className="flex-1 flex items-start justify-center px-10 py-8 overflow-auto">
        {vehicles.length === 0 ? (
          <div className="flex flex-col items-center gap-8 mt-20">
            <p className="text-4xl text-gray-500">車両が見つかりませんでした</p>
            <button
              onPointerDown={notFound}
              className="flex items-center justify-center min-h-[100px] px-12 rounded-2xl bg-[#2E7D32] text-white text-3xl font-bold active:bg-green-700"
            >
              新しい車両を入力する
            </button>
          </div>
        ) : (
          <div
            className="grid gap-6 w-full"
            style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
          >
            {vehicles.map((v) => (
              <div
                key={v.id}
                className="flex flex-col items-center gap-4 bg-white rounded-3xl border-2 border-gray-200 shadow-md p-8"
                style={{ minHeight: 360 }}
              >
                {/* プレート表示 + タップで選択 */}
                <button
                  onPointerDown={() => selectVehicle(v)}
                  className="flex flex-col items-center gap-3 w-full flex-1 active:bg-green-50 rounded-2xl p-3"
                >
                  <PlateDisplay plate={v.plate} size="lg" />
                  {v.maxLoad && (
                    <p className="text-4xl text-gray-600 font-bold">
                      最大積載: {Number(v.maxLoad).toLocaleString()}kg
                    </p>
                  )}
                </button>

                {/* 削除ボタン */}
                <button
                  onPointerDown={() => deleteVehicle(v.id)}
                  className="w-full flex items-center justify-center rounded-xl border-2 border-red-500 bg-red-500 text-white text-3xl font-bold active:bg-red-600"
                  style={{ height: 80 }}
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
