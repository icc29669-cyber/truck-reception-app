"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getKioskSession, setKioskSession } from "@/lib/kioskState";
import KatakanaKeyboard from "@/components/KatakanaKeyboard";

export default function NameInputPage() {
  const router = useRouter();
  const [value, setValue] = useState("");

  useEffect(() => {
    const s = getKioskSession();
    setValue(s.driverInput.driverName ?? "");
  }, []);

  function handleComplete() {
    const session = getKioskSession();
    setKioskSession({
      driverInput: { ...session.driverInput, driverName: value.trim() },
    });
    router.push("/kiosk/data-confirm");
  }

  return (
    <div
      className="w-screen h-screen flex flex-col select-none overflow-hidden"
      style={{ background: "#f2f1ed" }}
    >
      {/* ヘッダー */}
      <div
        className="flex items-center px-10 py-5"
        style={{ background: "#1a3a6b" }}
      >
        <button
          onPointerDown={() => router.push("/kiosk/data-confirm")}
          className="flex items-center justify-center font-bold rounded-2xl border-2 border-white text-white text-3xl active:bg-blue-800 flex-shrink-0"
          style={{ height: 90, width: 180 }}
        >
          戻る
        </button>
        <h1 className="flex-1 text-center text-white font-black tracking-widest" style={{ fontSize: 44 }}>
          お名前入力
        </h1>
        <div style={{ width: 180 }} />
      </div>

      <div className="flex-1 flex flex-col items-center gap-4 px-10 pt-5 overflow-hidden">
        {/* タイトル */}
        <p className="font-bold text-gray-800 text-center" style={{ fontSize: 40 }}>
          お名前を入力してください（フルネーム）
        </p>

        {/* 入力表示エリア */}
        <div
          className="w-full rounded-3xl border-4 flex items-center px-8 transition-colors flex-shrink-0"
          style={{
            minHeight: 100,
            background: value ? "#FFF9C4" : "#ffffff",
            borderColor: value ? "#F59E0B" : "#D1D5DB",
          }}
        >
          <span
            className="font-black text-gray-900"
            style={{ fontSize: 56, minHeight: 60 }}
          >
            {value || <span className="text-gray-400">（お名前を入力）</span>}
          </span>
        </div>

        {/* キーボード */}
        <div className="w-full overflow-y-auto overflow-x-auto flex-1">
          <KatakanaKeyboard
            value={value}
            onChange={setValue}
            onComplete={handleComplete}
          />
        </div>
      </div>
    </div>
  );
}
