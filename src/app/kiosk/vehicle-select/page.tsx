"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getKioskSession, setKioskSession } from "@/lib/kioskState";
import PlateDisplay from "@/components/PlateDisplay";
import type { VehicleCandidate } from "@/types/reception";

export default function VehicleSelectPage() {
  const router = useRouter();
  const session = getKioskSession();

  // セッション不完全な場合はトップへリダイレクト
  if (typeof window !== "undefined" && (!session.phone || !session.centerId)) {
    router.replace("/kiosk");
  }

  const [vehicles, setVehicles] = useState<VehicleCandidate[]>(
    session.vehicleCandidates ?? []
  );
  const [navigating, setNavigating] = useState(false);

  function selectVehicle(v: VehicleCandidate) {
    if (navigating) return;
    setNavigating(true);
    setKioskSession({
      selectedVehicle: v,
      plate: v.plate,
      driverInput: { ...session.driverInput, maxLoad: v.maxLoad },
    });
    // maxLoadが未入力なら入力画面を経由させる
    if (!v.maxLoad) {
      router.push("/kiosk/max-load");
    } else {
      router.push("/kiosk/data-confirm");
    }
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
      style={{ background: "#f2f1ed" }}
    >
      {/* ヘッダー */}
      <div
        className="flex items-center px-10 gap-6 flex-shrink-0"
        style={{
          background: "#1a3a6b",
          height: 110,
        }}
      >
        {/* タイトル */}
        <h1 className="flex-1 text-5xl font-black text-white text-center">
          車両ナンバーを選択して下さい
        </h1>

        {/* 戻るボタン */}
        <button
          onPointerDown={() => router.push("/kiosk/person")}
          className="flex items-center justify-center font-bold rounded-2xl border-2 border-white text-white text-4xl active:bg-blue-800 flex-shrink-0"
          style={{ height: 90, width: 180 }}
        >
          ◀ 戻る
        </button>
      </div>

      {/* 車両グリッド */}
      <div className="flex-1 flex items-start justify-center px-10 py-8 overflow-auto">
        {vehicles.length === 0 ? (
          <div className="flex flex-col items-center gap-8 mt-20">
            <p className="text-4xl text-gray-500">車両が見つかりませんでした</p>
            <button
              onPointerDown={notFound}
              className="flex items-center justify-center min-h-[100px] px-12 rounded-2xl bg-[#0D9488] text-white text-3xl font-bold active:bg-teal-700"
            >
              新しい車両を入力する
            </button>
          </div>
        ) : (
          <div
            className="grid gap-6"
            style={{
              gridTemplateColumns: vehicles.length <= 2
                ? `repeat(${vehicles.length}, minmax(0, 420px))`
                : "repeat(3, 1fr)",
              justifyContent: vehicles.length <= 2 ? "center" : undefined,
              width: vehicles.length <= 2 ? undefined : "100%",
            }}
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

      {/* 表示されないお客様ボタン（フッター） */}
      <div className="flex-shrink-0 px-10 pb-6">
        <button
          onPointerDown={notFound}
          className="w-full flex items-center justify-center font-bold rounded-2xl border-3 border-orange-400 bg-orange-500 text-white text-4xl active:bg-orange-600 shadow-lg"
          style={{ height: 100 }}
        >
          表示されないお客様はこちら
        </button>
      </div>
    </div>
  );
}
