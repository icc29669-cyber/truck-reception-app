"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getKioskSession, setKioskSession } from "@/lib/kioskState";
import PlateDisplay from "@/components/PlateDisplay";
import NumericKeypad from "@/components/NumericKeypad";

export default function MaxLoadPage() {
  const router = useRouter();
  const [value, setValue] = useState("");

  useEffect(() => {
    const s = getKioskSession();
    setValue(s.driverInput.maxLoad ?? "");
  }, []);

  function handleChange(v: string) {
    if (v.length > 6) return;
    setValue(v);
  }

  function handleOk() {
    if (!value) return;
    const session = getKioskSession();
    setKioskSession({
      driverInput: { ...session.driverInput, maxLoad: value },
    });
    router.push("/kiosk/data-confirm");
  }

  const displayValue = value ? Number(value).toLocaleString() : "";

  return (
    <div
      className="w-screen h-screen flex flex-col select-none"
      style={{ background: "#F5F0E8" }}
    >
      {/* ヘッダー */}
      <div
        className="flex items-center justify-between px-8 py-3 flex-shrink-0"
        style={{ background: "#1a3a6b" }}
      >
        <button
          onPointerDown={() => router.back()}
          className="min-h-[56px] px-8 rounded-xl border-2 text-2xl font-bold active:opacity-80 transition-opacity"
          style={{ borderColor: "white", color: "white", background: "transparent" }}
        >
          戻る
        </button>
        <h1 className="text-3xl font-bold text-white flex-1 text-center">
          最大積載量の入力
        </h1>
        <PlateDisplay plate={getKioskSession().plate} size="sm" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
        <p className="text-4xl font-bold text-gray-800 text-center">
          最大積載量を入力してください
        </p>

        {/* 入力表示エリア */}
        <div
          suppressHydrationWarning
          className={`rounded-3xl border-4 flex items-center px-10
            ${value ? "bg-yellow-100 border-yellow-400" : "bg-white border-gray-300"}`}
          style={{ minWidth: 500, height: 180, justifyContent: "flex-end" }}
        >
          <span
            className="font-black"
            style={{
              fontSize: 96,
              color: value ? "#1a1a1a" : "#9ca3af",
            }}
          >
            {displayValue || "0"}
          </span>
          <span className="text-5xl font-bold text-gray-600" style={{ marginLeft: 12 }}>kg</span>
        </div>

        <NumericKeypad
          value={value}
          onChange={handleChange}
          maxLength={6}
          onOK={handleOk}
        />
      </div>
    </div>
  );
}
