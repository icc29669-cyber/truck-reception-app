"use client";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onOK: () => void;
  maxLength?: number;
  /** 電話番号モード: 上段に 070/080/090 ショートカット＋幅広レイアウト */
  phoneMode?: boolean;
  /** 単位表示（例: "kg"） */
  unit?: string;
}

export default function NumericKeypad({
  value,
  onChange,
  onOK,
  maxLength = 12,
  phoneMode = false,
  unit,
}: Props) {
  function press(d: string) {
    if (value.replace(/,/g, "").length >= maxLength) return;
    onChange(value + d);
  }

  const numBtn =
    "flex items-center justify-center font-black rounded-2xl border-2 border-gray-300 bg-white " +
    "text-gray-900 select-none touch-none transition-all duration-75 " +
    "shadow-[0_6px_0_#9E9E9E] active:shadow-[0_2px_0_#9E9E9E] active:translate-y-1";

  if (phoneMode) {
    // === 電話番号モード ===
    // 左エリア: 1400px相当、右エリア: 480px相当
    const btnW = 440;
    const btnH = 180;

    return (
      <div className="flex gap-4 select-none">
        {/* 左エリア */}
        <div className="flex flex-col gap-3">
          {/* 070/080/090 ショートカット */}
          <div className="flex gap-3">
            {["070", "080", "090"].map((prefix) => (
              <button
                key={prefix}
                onPointerDown={() => onChange(prefix)}
                className="flex items-center justify-center font-bold rounded-2xl border-2 border-blue-400
                           bg-blue-500 text-white text-4xl active:bg-blue-600 touch-none
                           shadow-[0_6px_0_#1D4ED8] active:shadow-[0_2px_0_#1D4ED8] active:translate-y-1 transition-all duration-75"
                style={{ width: btnW, height: 130 }}
              >
                {prefix}
              </button>
            ))}
          </div>

          {/* 数字キー 1-9 */}
          {[["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"]].map((row, ri) => (
            <div key={ri} className="flex gap-3">
              {row.map((k) => (
                <button
                  key={k}
                  onPointerDown={() => press(k)}
                  className={numBtn}
                  style={{ width: btnW, height: btnH, fontSize: 72 }}
                >
                  {k}
                </button>
              ))}
            </div>
          ))}

          {/* 0 (2倍幅) */}
          <div className="flex gap-3">
            <button
              onPointerDown={() => press("0")}
              className={numBtn}
              style={{ width: btnW * 3 + 24, height: btnH, fontSize: 72 }}
            >
              0
            </button>
          </div>
        </div>

        {/* 右エリア */}
        <div className="flex flex-col gap-3">
          <button
            onPointerDown={() => onChange("")}
            className="flex items-center justify-center font-bold rounded-2xl border-2 border-red-500
                       bg-red-500 text-white text-3xl active:bg-red-600 touch-none
                       shadow-[0_6px_0_#B91C1C] active:shadow-[0_2px_0_#B91C1C] active:translate-y-1 transition-all duration-75"
            style={{ width: 480, height: 160 }}
          >
            すべて消す
          </button>
          <button
            onPointerDown={() => onChange(value.slice(0, -1))}
            className="flex items-center justify-center font-bold rounded-2xl border-2 border-orange-400
                       bg-orange-400 text-white text-3xl active:bg-orange-500 touch-none
                       shadow-[0_6px_0_#C2410C] active:shadow-[0_2px_0_#C2410C] active:translate-y-1 transition-all duration-75"
            style={{ width: 480, height: 160 }}
          >
            1文字消す
          </button>
          <button
            onPointerDown={onOK}
            className="flex items-center justify-center font-black rounded-2xl border-2 border-green-700
                       bg-green-600 text-white text-5xl active:bg-green-700 touch-none
                       shadow-[0_6px_0_#14532D] active:shadow-[0_2px_0_#14532D] active:translate-y-1 transition-all duration-75"
            style={{ width: 480, height: 270 }}
          >
            OK
          </button>
        </div>
      </div>
    );
  }

  // === 数字モード（三桁・4桁・積載） ===
  const btnW = 360;
  const btnH = 200;

  return (
    <div className="flex gap-4 select-none">
      {/* 左エリア */}
      <div className="flex flex-col gap-3">
        {[["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"]].map((row, ri) => (
          <div key={ri} className="flex gap-3">
            {row.map((k) => (
              <button
                key={k}
                onPointerDown={() => press(k)}
                className={numBtn}
                style={{ width: btnW, height: btnH, fontSize: 72 }}
              >
                {k}
              </button>
            ))}
          </div>
        ))}

        {/* 0 (2倍幅) */}
        <div className="flex gap-3">
          <button
            onPointerDown={() => press("0")}
            className={numBtn}
            style={{ width: btnW * 3 + 24, height: btnH, fontSize: 72 }}
          >
            0
          </button>
        </div>
      </div>

      {/* 右エリア */}
      <div className="flex flex-col gap-3">
        <button
          onPointerDown={() => onChange("")}
          className="flex items-center justify-center font-bold rounded-2xl border-2 border-red-500
                     bg-red-500 text-white text-3xl active:bg-red-600 touch-none
                     shadow-[0_6px_0_#B91C1C] active:shadow-[0_2px_0_#B91C1C] active:translate-y-1 transition-all duration-75"
          style={{ width: 480, height: 160 }}
        >
          すべて消す
        </button>
        <button
          onPointerDown={() => onChange(value.slice(0, -1))}
          className="flex items-center justify-center font-bold rounded-2xl border-2 border-orange-400
                     bg-orange-400 text-white text-3xl active:bg-orange-500 touch-none
                     shadow-[0_6px_0_#C2410C] active:shadow-[0_2px_0_#C2410C] active:translate-y-1 transition-all duration-75"
          style={{ width: 480, height: 160 }}
        >
          1文字消す
        </button>
        <button
          onPointerDown={onOK}
          className="flex items-center justify-center font-black rounded-2xl border-2 border-green-700
                     bg-green-600 text-white text-5xl active:bg-green-700 touch-none
                     shadow-[0_6px_0_#14532D] active:shadow-[0_2px_0_#14532D] active:translate-y-1 transition-all duration-75"
          style={{ width: 480, height: 270 }}
        >
          OK
        </button>
      </div>
    </div>
  );
}
