"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getKioskSession, setKioskSession } from "@/lib/kioskState";
import type { DriverInput } from "@/types/reception";

// 50音キーボード（簡易版）
const KANA_ROWS = [
  ["あ","い","う","え","お"],
  ["か","き","く","け","こ"],
  ["さ","し","す","せ","そ"],
  ["た","ち","つ","て","と"],
  ["な","に","ぬ","ね","の"],
  ["は","ひ","ふ","へ","ほ"],
  ["ま","み","む","め","も"],
  ["や","","ゆ","","よ"],
  ["ら","り","る","れ","ろ"],
  ["わ","を","ん","ー","・"],
];

// アルファベット・数字キーボード
const ALPHA_ROWS = [
  ["A","B","C","D","E","F","G"],
  ["H","I","J","K","L","M","N"],
  ["O","P","Q","R","S","T","U"],
  ["V","W","X","Y","Z","0","1"],
  ["2","3","4","5","6","7","8"],
  ["9"," ","（","）","ー","・",""],
];

type InputField = "company" | "name" | "vehicle";

export default function DriverInputPage() {
  const router = useRouter();
  const [form, setForm] = useState<DriverInput>({ companyName: "", driverName: "", vehicleNumber: "" });
  const [activeField, setActiveField] = useState<InputField>("company");
  const [kbMode, setKbMode] = useState<"kana" | "alpha">("kana");

  useEffect(() => {
    const s = getKioskSession();
    if (s?.lookupResult?.driver) {
      const d = s.lookupResult.driver;
      setForm({
        companyName: d.companyName,
        driverName: d.name,
        vehicleNumber: d.defaultVehicle,
      });
    }
  }, []);

  function type(char: string) {
    if (!char) return;
    setForm((prev) => ({
      ...prev,
      [activeField === "company" ? "companyName" : activeField === "name" ? "driverName" : "vehicleNumber"]:
        (activeField === "company" ? prev.companyName : activeField === "name" ? prev.driverName : prev.vehicleNumber) + char,
    }));
  }

  function del() {
    const key = activeField === "company" ? "companyName" : activeField === "name" ? "driverName" : "vehicleNumber";
    setForm((prev) => ({ ...prev, [key]: (prev[key as keyof DriverInput] as string).slice(0, -1) }));
  }

  function clear() {
    const key = activeField === "company" ? "companyName" : activeField === "name" ? "driverName" : "vehicleNumber";
    setForm((prev) => ({ ...prev, [key]: "" }));
  }

  const isValid = form.companyName.trim() && form.driverName.trim() && form.vehicleNumber.trim();

  function proceed() {
    if (!isValid) return;
    setKioskSession({ driverInput: form });
    router.push("/kiosk/final-confirm");
  }

  const currentValue =
    activeField === "company" ? form.companyName :
    activeField === "name" ? form.driverName : form.vehicleNumber;

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 p-4">
      <h2 className="text-2xl font-black text-center text-white mb-4">情報を入力してください</h2>

      {/* 入力フィールド選択 */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {(["company","name","vehicle"] as InputField[]).map((f) => {
          const label = f === "company" ? "会社名" : f === "name" ? "お名前" : "車両番号";
          const val = f === "company" ? form.companyName : f === "name" ? form.driverName : form.vehicleNumber;
          return (
            <button
              key={f}
              onPointerDown={() => { setActiveField(f); setKbMode(f === "vehicle" ? "alpha" : "kana"); }}
              className={`rounded-xl p-3 text-left transition-colors ${
                activeField === f ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"
              }`}
            >
              <div className="text-xs text-gray-400">{label}</div>
              <div className="font-bold text-sm truncate min-h-[1.5rem]">{val || "未入力"}</div>
            </button>
          );
        })}
      </div>

      {/* 入力中の文字表示 */}
      <div className="bg-gray-800 rounded-xl px-4 py-3 mb-3 flex items-center justify-between min-h-[52px]">
        <span className="text-white text-xl font-bold flex-1 truncate">{currentValue || <span className="text-gray-500">入力してください</span>}</span>
        <button onPointerDown={del} className="bg-gray-600 rounded-lg px-4 py-2 text-white font-bold ml-2">⌫</button>
        <button onPointerDown={clear} className="bg-gray-600 rounded-lg px-3 py-2 text-white text-sm ml-2">全消</button>
      </div>

      {/* キーボード切替 */}
      <div className="flex gap-2 mb-2">
        <button onPointerDown={() => setKbMode("kana")}
          className={`flex-1 py-2 rounded-lg font-bold text-sm ${kbMode === "kana" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"}`}>
          かな
        </button>
        <button onPointerDown={() => setKbMode("alpha")}
          className={`flex-1 py-2 rounded-lg font-bold text-sm ${kbMode === "alpha" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"}`}>
          英数
        </button>
      </div>

      {/* キーボード */}
      <div className="flex-1 overflow-hidden">
        {(kbMode === "kana" ? KANA_ROWS : ALPHA_ROWS).map((row, ri) => (
          <div key={ri} className="flex gap-1 mb-1">
            {row.map((k, ki) => (
              <button key={ki} onPointerDown={() => type(k)}
                className={`flex-1 py-3 rounded-lg text-base font-bold transition-colors ${
                  k ? "bg-gray-700 hover:bg-gray-600 active:bg-blue-600 text-white" : "bg-transparent"
                }`}>
                {k}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* ナビゲーション */}
      <div className="grid grid-cols-2 gap-4 mt-3">
        <button onPointerDown={() => router.push("/kiosk/phone")}
          className="py-5 bg-gray-600 text-white rounded-2xl text-xl font-bold">
          戻る
        </button>
        <button onPointerDown={proceed} disabled={!isValid}
          className={`py-5 rounded-2xl text-xl font-bold transition-colors ${
            isValid ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-500"
          }`}>
          確認へ
        </button>
      </div>
    </div>
  );
}
