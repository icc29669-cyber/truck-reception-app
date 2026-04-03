"use client";
import { useRouter } from "next/navigation";
import { getKioskSession, setKioskSession } from "@/lib/kioskState";
import PlateDisplay from "@/components/PlateDisplay";

// カーナビ方式: 右から左へ（あ行が右端、わ行が左端）
// 使用不可: し、へ、ん、お
const HIRA_ROWS: (string | null)[][] = [
  ["わ", "ら", "や", "ま", "は", "な", "た", "さ", "か", "あ"],
  ["を", "り",  null, "み", "ひ", "に", "ち", "し", "き", "い"],
  ["ん", "る", "ゆ", "む", "ふ", "ぬ", "つ", "す", "く", "う"],
  [null, "れ",  null, "め", "へ", "ね", "て", "せ", "け", "え"],
  [null, "ろ", "よ", "も", "ほ", "の", "と", "そ", "こ", "お"],
];

const UNUSABLE = new Set(["し", "へ", "ん", "お"]);

const ALPHA_KEYS = ["A", "C", "F", "H", "K", "L", "M", "P", "X", "Y"];

const BTN_SIZE = 150;
const GAP = 10;

export default function HiraPage() {
  const router = useRouter();
  const session = getKioskSession();

  function select(hira: string) {
    if (!hira || UNUSABLE.has(hira)) return;
    setKioskSession({ plate: { ...session.plate, hira } });
    router.push("/kiosk/plate/number");
  }

  return (
    <div
      className="w-screen h-screen flex flex-col select-none overflow-hidden"
      style={{ background: "linear-gradient(160deg, #E8F4FD 0%, #D0E8FA 50%, #B8D8F6 100%)" }}
    >
      {/* ヘッダー */}
      <div
        className="flex items-center justify-between px-8 py-3 flex-shrink-0"
        style={{ background: "linear-gradient(90deg, #1a3a6b 0%, #1E5799 100%)" }}
      >
        <button
          onPointerDown={() => router.push("/kiosk/plate/classnum")}
          className="min-h-[56px] px-8 rounded-xl border-2 text-2xl font-bold active:opacity-80 transition-opacity"
          style={{ borderColor: "white", color: "white", background: "transparent" }}
        >
          戻る
        </button>
        <PlateDisplay plate={session.plate} highlight="hira" size="sm" />
        <div style={{ width: 120 }} />
      </div>

      <div className="flex-1 flex flex-col items-center px-8 pt-4 pb-2 gap-4 overflow-y-auto">
        <p className="font-bold text-gray-800 text-center text-5xl flex-shrink-0">
          該当するひらがなをタッチしてください
        </p>

        <div className="flex gap-8">
          {/* ひらがなグリッド（カーナビ方式） */}
          <div className="flex flex-col flex-shrink-0" style={{ gap: GAP }}>
            {HIRA_ROWS.map((row, ri) => (
              <div key={ri} className="flex" style={{ gap: GAP }}>
                {row.map((ch, ci) => {
                  if (ch === null) {
                    return <div key={ci} style={{ width: BTN_SIZE, height: 90 }} />;
                  }
                  const isUnavailable = UNUSABLE.has(ch);
                  return (
                    <button
                      key={ci}
                      onPointerDown={() => !isUnavailable ? select(ch) : undefined}
                      disabled={isUnavailable}
                      className={`rounded-2xl font-bold flex items-center justify-center transition-all duration-75
                        ${isUnavailable
                          ? "bg-gray-200 text-gray-400 border-2 border-gray-200 shadow-none pointer-events-none"
                          : "bg-white border-2 border-gray-300 text-gray-900 shadow-[0_4px_0_#9E9E9E] active:shadow-[0_1px_0_#9E9E9E] active:translate-y-[3px]"
                        }`}
                      style={{ width: 130, height: 90, fontSize: 36 }}
                    >
                      {ch}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* 英字（事業用） */}
          <div className="flex flex-col gap-3 flex-shrink-0" style={{ width: 320 }}>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl px-4 py-2 text-center">
              <p className="text-3xl font-bold text-blue-700">事業用（緑ナンバー）</p>
            </div>
            <div className="grid grid-cols-2" style={{ gap: GAP }}>
              {ALPHA_KEYS.map((k) => (
                <button
                  key={k}
                  onPointerDown={() => select(k)}
                  className="rounded-2xl font-bold flex items-center justify-center bg-blue-50 border-2 border-blue-300 text-blue-800
                             shadow-[0_4px_0_#93C5FD] active:shadow-[0_1px_0_#93C5FD] active:translate-y-[3px] transition-all duration-75"
                  style={{ width: 130, height: 90, fontSize: 28 }}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
