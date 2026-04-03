"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getKioskSession, setKioskSession } from "@/lib/kioskState";
import PlateDisplay from "@/components/PlateDisplay";

const ALPHA_CHARS = ["A", "C", "F", "H", "K", "L", "M", "P", "X", "Y"];

export default function ClassNumPage() {
  const router = useRouter();
  const [plate, setPlate] = useState(() => getKioskSession().plate);
  const [value, setValue] = useState("");
  const [mode, setMode] = useState<"num" | "alpha">("num");

  useEffect(() => {
    const s = getKioskSession();
    setPlate(s.plate);
    setValue(s.plate.classNum ?? "");
  }, []);

  function handleChange(v: string) {
    if (v.length > 3) return;
    setValue(v);
    const s = getKioskSession();
    const newPlate = { ...s.plate, classNum: v };
    setPlate(newPlate);
    setKioskSession({ plate: newPlate });
  }

  function press(d: string) {
    handleChange(value + d);
  }

  function pressAlpha(ch: string) {
    handleChange(value + ch);
  }

  function handleOK() {
    if (!value) return;
    router.push("/kiosk/plate/hira");
  }

  // ボタン共通
  const numBtn =
    "flex items-center justify-center font-black rounded-2xl border-2 border-gray-200 bg-white " +
    "text-gray-900 select-none touch-none transition-all duration-75 " +
    "shadow-[0_5px_0_#BDBDBD] active:shadow-[0_1px_0_#BDBDBD] active:translate-y-1";

  const BTN_W = 200;
  const BTN_H = 130;
  const FONT = 60;

  return (
    <div
      className="w-screen h-screen flex flex-col select-none overflow-hidden"
      style={{ background: "linear-gradient(160deg, #E8F4FD 0%, #D0E8FA 50%, #B8D8F6 100%)" }}
    >
      {/* ヘッダー */}
      <div
        className="flex items-center px-10 flex-shrink-0"
        style={{ background: "linear-gradient(90deg, #1a3a6b 0%, #1E5799 100%)", height: 90 }}
      >
        <button
          onPointerDown={() => router.push("/kiosk/plate/kana")}
          className="flex items-center justify-center font-bold rounded-2xl border-2 border-white text-white active:bg-blue-800"
          style={{ height: 62, width: 160, fontSize: 28 }}
        >
          戻る
        </button>
        <h1 className="flex-1 text-center text-white font-bold" style={{ fontSize: 38 }}>
          分類番号（3桁）を入力
        </h1>
        <div style={{ width: 160 }} />
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 flex items-center justify-center gap-16 px-16">

        {/* 左：ナンバープレート＋入力表示 */}
        <div className="flex flex-col items-center gap-8">
          {/* 大きなプレート表示 */}
          <PlateDisplay plate={{ ...plate, classNum: value }} highlight="classNum" size="xl" />

          {/* 入力中の分類番号 */}
          <div
            suppressHydrationWarning
            className="rounded-3xl border-4 flex items-center justify-center px-12"
            style={{
              width: 520,
              height: 160,
              background: value ? "#FFF176" : "rgba(255,255,255,0.8)",
              borderColor: value ? "#F59E0B" : "#CBD5E1",
            }}
          >
            <span
              suppressHydrationWarning
              className="font-black tracking-widest"
              style={{
                fontSize: 100,
                color: value ? "#1a1a1a" : "#94A3B8",
                letterSpacing: "0.25em",
              }}
            >
              {value || "_ _ _"}
            </span>
          </div>

          {/* 数字/英字 トグル */}
          <div className="flex gap-3">
            {(["num", "alpha"] as const).map((m) => (
              <button
                key={m}
                onPointerDown={() => setMode(m)}
                className={`font-bold rounded-2xl border-2 transition-all duration-75 ${
                  mode === m
                    ? "bg-blue-600 border-blue-700 text-white shadow-[0_4px_0_#1D4ED8]"
                    : "bg-white border-gray-300 text-gray-700 active:bg-gray-100"
                }`}
                style={{ height: 72, width: 160, fontSize: 30 }}
              >
                {m === "num" ? "数字" : "英字"}
              </button>
            ))}
          </div>
        </div>

        {/* 右：テンキー */}
        {mode === "num" ? (
          <div className="flex gap-4">
            {/* 数字グリッド */}
            <div className="flex flex-col gap-3">
              {[["1","2","3"],["4","5","6"],["7","8","9"]].map((row, ri) => (
                <div key={ri} className="flex gap-3">
                  {row.map((k) => (
                    <button
                      key={k}
                      onPointerDown={() => press(k)}
                      className={numBtn}
                      style={{ width: BTN_W, height: BTN_H, fontSize: FONT }}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              ))}
              <div className="flex gap-3">
                <button
                  onPointerDown={() => press("0")}
                  className={numBtn}
                  style={{ width: BTN_W * 3 + 24, height: BTN_H, fontSize: FONT }}
                >
                  0
                </button>
              </div>
            </div>

            {/* 操作ボタン */}
            <div className="flex flex-col gap-3">
              <button
                onPointerDown={() => handleChange("")}
                className="flex items-center justify-center font-bold rounded-2xl border-2 border-red-500 bg-red-500 text-white active:bg-red-600 touch-none shadow-[0_5px_0_#B91C1C] active:shadow-[0_1px_0_#B91C1C] active:translate-y-1 transition-all duration-75"
                style={{ width: 220, height: BTN_H, fontSize: 28 }}
              >
                すべて消す
              </button>
              <button
                onPointerDown={() => handleChange(value.slice(0, -1))}
                className="flex items-center justify-center font-bold rounded-2xl border-2 border-orange-400 bg-orange-400 text-white active:bg-orange-500 touch-none shadow-[0_5px_0_#C2410C] active:shadow-[0_1px_0_#C2410C] active:translate-y-1 transition-all duration-75"
                style={{ width: 220, height: BTN_H, fontSize: 28 }}
              >
                1文字消す
              </button>
              <button
                onPointerDown={handleOK}
                disabled={!value}
                className={`flex items-center justify-center font-black rounded-2xl border-2 touch-none shadow-[0_5px_0_#14532D] active:shadow-[0_1px_0_#14532D] active:translate-y-1 transition-all duration-75 ${
                  value ? "border-green-700 bg-green-600 text-white active:bg-green-700" : "border-gray-300 bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
                style={{ width: 220, height: BTN_H * 2 + 12, fontSize: 44 }}
              >
                OK
              </button>
            </div>
          </div>
        ) : (
          /* 英字モード */
          <div className="flex flex-col gap-4 items-center">
            <div className="flex gap-3 flex-wrap justify-center" style={{ maxWidth: 700 }}>
              {ALPHA_CHARS.map((ch) => (
                <button
                  key={ch}
                  onPointerDown={() => pressAlpha(ch)}
                  className="flex items-center justify-center font-black rounded-2xl border-2 border-gray-200 bg-white text-gray-900 select-none touch-none shadow-[0_5px_0_#BDBDBD] active:shadow-[0_1px_0_#BDBDBD] active:translate-y-1 transition-all duration-75"
                  style={{ width: 130, height: 130, fontSize: 44 }}
                >
                  {ch}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onPointerDown={() => handleChange("")}
                className="flex items-center justify-center font-bold rounded-2xl border-2 border-red-500 bg-red-500 text-white text-2xl active:bg-red-600 touch-none shadow-[0_5px_0_#B91C1C] active:shadow-[0_1px_0_#B91C1C] active:translate-y-1 transition-all duration-75"
                style={{ width: 200, height: 90 }}
              >
                すべて消す
              </button>
              <button
                onPointerDown={() => handleChange(value.slice(0, -1))}
                className="flex items-center justify-center font-bold rounded-2xl border-2 border-orange-400 bg-orange-400 text-white text-2xl active:bg-orange-500 touch-none shadow-[0_5px_0_#C2410C] active:shadow-[0_1px_0_#C2410C] active:translate-y-1 transition-all duration-75"
                style={{ width: 200, height: 90 }}
              >
                1文字消す
              </button>
              <button
                onPointerDown={handleOK}
                className="flex items-center justify-center font-black rounded-2xl border-2 border-green-700 bg-green-600 text-white text-4xl active:bg-green-700 touch-none shadow-[0_5px_0_#14532D] active:shadow-[0_1px_0_#14532D] active:translate-y-1 transition-all duration-75"
                style={{ width: 200, height: 90 }}
              >
                OK
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
