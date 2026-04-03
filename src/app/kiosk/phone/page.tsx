"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getKioskSession, setKioskSession } from "@/lib/kioskState";
import { lookupByPhone } from "@/lib/api";

function fmtPhone(d: string): string {
  if (!d) return "";
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

export default function PhonePage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const s = getKioskSession();
    setPhone(s.phone ?? "");
  }, []);

  const isValid = phone.length >= 10 && phone.length <= 11;

  function press(d: string) {
    if (phone.length >= 11) return;
    setPhone(phone + d);
  }

  function pressPrefix(prefix: string) {
    setPhone(prefix);
  }

  async function handleOk() {
    if (!isValid || loading) return;
    setLoading(true);
    try {
      const session = getKioskSession();
      const result = await lookupByPhone(phone, session.centerId);
      setKioskSession({
        phone,
        driverInput: { ...session.driverInput, phone },
        driverCandidates: result.drivers,
        vehicleCandidates: result.vehicles,
        selectedDriver: null,
        selectedVehicle: null,
      });
      // 候補数に関わらず /kiosk/person で3パターンを統合処理
      router.push("/kiosk/person");
    } finally {
      setLoading(false);
    }
  }

  // ボタン共通スタイル
  const numBtn =
    "flex items-center justify-center font-black rounded-2xl border-2 border-gray-300 bg-white text-gray-900 active:bg-gray-200 select-none touch-none transition-all duration-75";

  const NUM_W = 440;
  const NUM_H = 200;

  return (
    <div
      className="w-screen h-screen flex flex-col select-none overflow-hidden"
      style={{ background: "linear-gradient(160deg, #E8F4FD 0%, #D0E8FA 50%, #B8D8F6 100%)" }}
    >
      {/* ヘッダーバー */}
      <div
        className="flex items-center px-10 flex-shrink-0"
        style={{
          background: "linear-gradient(90deg, #1a3a6b 0%, #1E5799 100%)",
          height: 100,
        }}
      >
        <button
          onPointerDown={() => router.push("/kiosk/caution")}
          className="flex items-center justify-center font-bold rounded-2xl border-2 border-white text-white active:bg-blue-800 flex-shrink-0"
          style={{ height: 70, width: 200, fontSize: 32 }}
        >
          戻る
        </button>
        <h1
          className="flex-1 font-bold text-white text-center"
          style={{ fontSize: 44 }}
        >
          電話番号を入力してください
        </h1>
        {/* 右側スペーサー（戻るボタンと対称） */}
        <div style={{ width: 200 }} />
      </div>

      {/* 入力表示エリア */}
      <div className="flex justify-center px-10 pt-4 pb-4">
        <div
          suppressHydrationWarning
          className="rounded-3xl border-4 flex items-center justify-center px-10 transition-colors"
          style={{
            width: "100%",
            maxWidth: 1200,
            height: 160,
            background: phone ? "#FFF176" : "#f3f4f6",
            borderColor: phone ? "#f59e0b" : "#d1d5db",
          }}
        >
          <span
            className="font-black tracking-widest"
            style={{
              fontSize: 88,
              color: phone ? "#1a1a1a" : "#9ca3af",
            }}
          >
            {phone ? fmtPhone(phone) : "090-0000-0000"}
          </span>
        </div>
      </div>

      {/* テンキーエリア */}
      <div className="flex-1 flex justify-center px-10 pb-6">
        <div className="flex gap-6 h-full">
          {/* 左側: プレフィックス + 数字 */}
          <div className="flex flex-col gap-3">
            {/* 070/080/090 ショートカット */}
            <div className="flex gap-3">
              {["070", "080", "090"].map((prefix) => (
                <button
                  key={prefix}
                  onPointerDown={() => pressPrefix(prefix)}
                  className="flex items-center justify-center font-bold rounded-2xl border-2 border-blue-500 bg-blue-500 text-white text-4xl active:bg-blue-600 touch-none"
                  style={{ width: 440, height: 130 }}
                >
                  {prefix}
                </button>
              ))}
            </div>

            {/* 数字キー 1〜9 */}
            {[["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"]].map((row, ri) => (
              <div key={ri} className="flex gap-3">
                {row.map((k) => (
                  <button
                    key={k}
                    onPointerDown={() => press(k)}
                    className={numBtn}
                    style={{ width: NUM_W, height: NUM_H, fontSize: 80 }}
                  >
                    {k}
                  </button>
                ))}
              </div>
            ))}

            {/* 0 */}
            <div className="flex gap-3">
              <button
                onPointerDown={() => press("0")}
                className={numBtn}
                style={{ width: NUM_W * 3 + 24, height: NUM_H, fontSize: 80 }}
              >
                0
              </button>
            </div>
          </div>

          {/* 右側: すべて消す / 1文字消す / OK */}
          <div className="flex flex-col gap-3">
            <button
              onPointerDown={() => setPhone("")}
              className="flex items-center justify-center font-bold rounded-2xl border-2 border-red-500 bg-red-500 text-white text-3xl active:bg-red-600 touch-none"
              style={{ width: 320, height: 170 }}
            >
              すべて消す
            </button>
            <button
              onPointerDown={() => setPhone(phone.slice(0, -1))}
              className="flex items-center justify-center font-bold rounded-2xl border-2 border-orange-400 bg-orange-400 text-white text-3xl active:bg-orange-500 touch-none"
              style={{ width: 320, height: 170 }}
            >
              1文字消す
            </button>
            <button
              onPointerDown={handleOk}
              disabled={!isValid || loading}
              className={`flex items-center justify-center font-black rounded-2xl border-2 text-white text-6xl touch-none flex-1 transition-colors ${
                isValid && !loading
                  ? "border-green-700 bg-green-600 active:bg-green-700"
                  : "border-gray-400 bg-gray-400 cursor-not-allowed"
              }`}
              style={{ width: 320, minHeight: 300 }}
            >
              {loading ? "..." : "OK"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
