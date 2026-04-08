"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getKioskSession, setKioskSession } from "@/lib/kioskState";
import type { DriverCandidate } from "@/types/reception";

export default function NameSelectPage() {
  const router = useRouter();
  const session = getKioskSession();
  const [candidates, setCandidates] = useState<DriverCandidate[]>(
    session.driverCandidates ?? []
  );

  function selectDriver(driver: DriverCandidate) {
    setKioskSession({
      selectedDriver: driver,
      driverInput: {
        companyName: driver.companyName,
        driverName: driver.name,
        phone: driver.phone,
        maxLoad: session.driverInput.maxLoad ?? "",
      },
    });
    const updatedSession = getKioskSession();
    if (updatedSession.vehicleCandidates && updatedSession.vehicleCandidates.length > 0) {
      router.push("/kiosk/vehicle-select");
    } else {
      router.push("/kiosk/data-confirm");
    }
  }

  function deleteCandidate(id: number) {
    const updated = candidates.filter((c) => c.id !== id);
    setCandidates(updated);
    setKioskSession({ driverCandidates: updated });
  }

  function notFound() {
    setKioskSession({
      selectedDriver: null,
      driverInput: { ...session.driverInput, companyName: "", driverName: "" },
    });
    router.push("/kiosk/data-confirm");
  }

  return (
    <div
      className="w-screen h-screen flex flex-col select-none overflow-hidden"
      style={{ background: "#F5F0E8" }}
    >
      {/* ヘッダー */}
      <div
        className="flex items-center px-10 gap-6 flex-shrink-0"
        style={{
          background: "#1a3a6b",
          height: 110,
        }}
      >
        {/* 表示されないお客様ボタン */}
        <button
          onPointerDown={notFound}
          className="flex items-center justify-center font-bold rounded-2xl border-2 border-red-400 bg-red-500 text-white text-4xl active:bg-red-600 flex-shrink-0"
          style={{ height: 110, width: 400 }}
        >
          表示されないお客様
        </button>

        {/* タイトル */}
        <h1 className="flex-1 text-6xl font-black text-white text-center">
          お名前を選択してください
        </h1>

        {/* 戻るボタン */}
        <button
          onPointerDown={() => router.push("/kiosk/phone")}
          className="flex items-center justify-center font-bold rounded-2xl border-2 border-white text-white text-4xl active:bg-blue-800 flex-shrink-0"
          style={{ height: 90, width: 180 }}
        >
          戻る
        </button>
      </div>

      {/* テーブル */}
      <div className="flex-1 flex flex-col px-10 py-6 gap-0 overflow-hidden">
        {candidates.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-4xl text-gray-500">候補が見つかりませんでした</p>
          </div>
        ) : (
          <div className="flex flex-col gap-0 bg-white rounded-3xl border-2 border-gray-200 shadow-md overflow-hidden">
            {/* ヘッダー行 */}
            <div
              className="flex items-center px-6 bg-gray-100 border-b-2 border-gray-200"
              style={{ height: 64 }}
            >
              <div className="flex-1 text-2xl font-bold text-gray-600 pl-4">お名前</div>
              <div className="flex-1 text-2xl font-bold text-gray-600">運送会社名</div>
              <div style={{ width: 120 }} className="text-2xl font-bold text-gray-600 text-center">
                削除
              </div>
            </div>

            {/* データ行 */}
            {candidates.slice(0, 5).map((c, idx) => (
              <div
                key={c.id}
                className={`flex items-center overflow-hidden ${
                  idx < Math.min(candidates.length, 5) - 1 ? "border-b-2 border-gray-100" : ""
                }`}
                style={{ height: 180 }}
              >
                {/* 名前セル */}
                <button
                  onPointerDown={() => selectDriver(c)}
                  className="flex-1 flex items-center px-6 h-full active:bg-blue-50 border-r border-gray-100"
                >
                  <span className="text-6xl font-black text-gray-900">{c.name}</span>
                </button>

                {/* 会社名セル */}
                <button
                  onPointerDown={() => selectDriver(c)}
                  className="flex-1 flex items-center px-6 h-full active:bg-blue-50 border-r border-gray-100"
                >
                  <span className="text-5xl text-gray-700 font-bold">{c.companyName}</span>
                </button>

                {/* 削除ボタン */}
                <div
                  className="flex items-center justify-center"
                  style={{ width: 120 }}
                >
                  <button
                    onPointerDown={() => deleteCandidate(c.id)}
                    className="flex items-center justify-center font-bold rounded-xl border-2 border-red-500 bg-red-500 text-white text-4xl active:bg-red-600"
                    style={{ width: 100, height: 100 }}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
