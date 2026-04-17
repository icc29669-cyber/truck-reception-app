"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getKioskSession, setKioskSession } from "@/lib/kioskState";
import PlateDisplay from "@/components/PlateDisplay";
import NumericKeypad from "@/components/NumericKeypad";

export default function PlateNumberPage() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [overwrite, setOverwrite] = useState(false); // 戻り時の上書きフラグ

  useEffect(() => {
    const s = getKioskSession();
    const existing = s.plate.number ?? "";
    setValue(existing);
    if (existing) setOverwrite(true); // 既存値があれば上書きモード
  }, []);

  function handleChange(v: string, fromOverwrite = false) {
    if (v.length > 4) return;
    setValue(v);
    const session = getKioskSession();
    setKioskSession({ plate: { ...session.plate, number: v } });
    // 4桁入力で自動進行（上書き直後の1桁目は進行しない）
    if (v.length === 4 && !fromOverwrite) {
      router.push("/kiosk/data-confirm");
    }
  }

  // NumericKeypadのonChangeをラップして上書きモード対応
  function handleKeypadChange(v: string) {
    if (overwrite && v.length > 0) {
      // 上書き: 最後に追加された1文字だけ取得
      const newChar = v.slice(-1);
      setOverwrite(false);
      handleChange(newChar, true);
    } else {
      handleChange(v);
    }
  }

  function handleOK() {
    if (!value) return;
    router.push("/kiosk/data-confirm");
  }

  return (
    <div
      className="w-screen h-screen flex flex-col select-none"
      style={{ background: "#f2f1ed" }}
    >
      {/* ヘッダー */}
      <div
        className="flex items-center justify-between px-8 flex-shrink-0"
        style={{ background: "#1a3a6b", height: 100 }}
      >
        <button
          onPointerDown={() => router.push("/kiosk/plate/hira")}
          className="flex items-center justify-center font-bold rounded-2xl border-2 border-white text-white active:bg-blue-800 flex-shrink-0"
          style={{ height: 70, width: 180, fontSize: 28 }}
        >
          戻る
        </button>
        <h1 className="flex-1 text-center text-white font-bold" style={{ fontSize: 40 }}>
          ナンバーの数字を入力してください（1〜4桁）
        </h1>
        <PlateDisplay
          plate={{ ...getKioskSession().plate, number: value }}
          highlight="number"
          size="sm"
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8 overflow-hidden">
        {/* 入力表示エリア */}
        <div
          suppressHydrationWarning
          className={`rounded-3xl border-4 flex items-center justify-center px-10
            ${overwrite ? "bg-blue-100 border-blue-500" : value ? "bg-yellow-100 border-yellow-400" : "bg-white border-gray-300"}`}
          style={{ minWidth: 400, height: 180, animation: overwrite ? "pulse 1.5s ease-in-out infinite" : "none" }}
        >
          <span
            className="font-black"
            style={{
              fontSize: 108,
              letterSpacing: "0.15em",
              color: value ? "#1a1a1a" : "#9ca3af",
            }}
          >
            {value || <span style={{ fontSize: 80 }}>____</span>}
          </span>
        </div>

        {/* テンキー（数字のみ、maxLength=4） */}
        <NumericKeypad
          value={value}
          onChange={handleKeypadChange}
          onOK={handleOK}
          maxLength={4}
        />
      </div>
    </div>
  );
}
