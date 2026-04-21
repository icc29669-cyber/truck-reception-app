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
      style={{ background: "#f2f1ed" }}
    >
      {/* ヘッダー（他画面と統一） */}
      <div
        className="flex items-center justify-between px-8 flex-shrink-0"
        style={{ background: "#1a3a6b", height: 96 }}
      >
        <button
          onPointerDown={() => router.push("/kiosk/vehicle-select")}
          className="flex items-center justify-center font-bold rounded-xl border-2 border-white text-white active:bg-blue-800 flex-shrink-0"
          style={{ height: 60, width: 240, fontSize: 24 }}
        >
          ◀ 車両選択へ戻る
        </button>
        <PlateDisplay plate={getKioskSession().plate} size="sm" />
      </div>

      {/* サブヘッダー：STEPバッジ+大きな見出し */}
      <div className="flex items-center flex-shrink-0" style={{ padding: "20px 40px 18px", gap: 22 }}>
        <div style={{
          fontSize: 16, color: "#64748B", letterSpacing: "0.22em", fontWeight: 800,
          padding: "6px 14px", background: "#E2E8F0", borderRadius: 6,
          flexShrink: 0,
        }}>
          STEP 3 / 4
        </div>
        <div style={{
          fontSize: 40, fontWeight: 900, color: "#26251e", letterSpacing: "0.04em",
          display: "flex", alignItems: "baseline", gap: 14,
        }}>
          最大積載量
          <span style={{ fontSize: 28, color: "#0D9488", fontWeight: 800 }}>
            を数字で入力してください（kg）
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">

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
            {displayValue || "例:2000"}
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
