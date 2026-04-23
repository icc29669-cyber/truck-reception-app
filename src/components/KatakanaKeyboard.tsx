"use client";
import { useState } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onComplete: () => void;
  label?: string;
}

// ━━ カタカナ行（左→右：ア行左端、ワ行右端）━━
const KATA_ROWS: (string | null)[][] = [
  ["ア","カ","サ","タ","ナ","ハ","マ","ヤ","ラ","ワ"],
  ["イ","キ","シ","チ","ニ","ヒ","ミ", null,"リ","ヲ"],
  ["ウ","ク","ス","ツ","ヌ","フ","ム","ユ","ル","ン"],
  ["エ","ケ","セ","テ","ネ","ヘ","メ", null,"レ", null],
  ["オ","コ","ソ","ト","ノ","ホ","モ","ヨ","ロ", null],
];

// ━━ 英数（メイン7列×5行 / 数字3列×5行）━━
const ALPHA_ROWS: (string | null)[][] = [
  ["A","B","C","D","E","F","G"],
  ["H","I","J","K","L","M","N"],
  ["O","P","Q","R","S","T","U"],
  ["V","W","X","Y","Z",null,null],
  ["&","・",".","-","_",null,null],
];
const NUM_ROWS: (string | null)[][] = [
  ["1","2","3"],
  ["4","5","6"],
  ["7","8","9"],
  [null,"0",null],
  [null,null,null],
];

// ━━ 濁点・半濁点変換 ━━
const DAKUTEN: Record<string,string> = {
  "カ":"ガ","キ":"ギ","ク":"グ","ケ":"ゲ","コ":"ゴ",
  "サ":"ザ","シ":"ジ","ス":"ズ","セ":"ゼ","ソ":"ゾ",
  "タ":"ダ","チ":"ヂ","ツ":"ヅ","テ":"デ","ト":"ド",
  "ハ":"バ","ヒ":"ビ","フ":"ブ","ヘ":"ベ","ホ":"ボ","ウ":"ヴ",
  "ガ":"カ","ギ":"キ","グ":"ク","ゲ":"ケ","ゴ":"コ",
  "ザ":"サ","ジ":"シ","ズ":"ス","ゼ":"セ","ゾ":"ソ",
  "ダ":"タ","ヂ":"チ","ヅ":"ツ","デ":"テ","ド":"ト",
  "バ":"ハ","ビ":"ヒ","ブ":"フ","ベ":"ヘ","ボ":"ホ","ヴ":"ウ",
};
const HANDAKUTEN: Record<string,string> = {
  "ハ":"パ","ヒ":"ピ","フ":"プ","ヘ":"ペ","ホ":"ポ",
  "パ":"ハ","ピ":"ヒ","プ":"フ","ペ":"ヘ","ポ":"ホ",
};
// ━━ 小文字変換 ━━
const SMALL: Record<string,string> = {
  "ア":"ァ","イ":"ィ","ウ":"ゥ","エ":"ェ","オ":"ォ",
  "ツ":"ッ","ヤ":"ャ","ユ":"ュ","ヨ":"ョ",
  "ァ":"ア","ィ":"イ","ゥ":"ウ","ェ":"エ","ォ":"オ",
  "ッ":"ツ","ャ":"ヤ","ュ":"ユ","ョ":"ヨ",
};

function applyToLast(map: Record<string,string>, val: string): string {
  if (!val) return val;
  const last = val[val.length-1];
  return map[last] ? val.slice(0,-1)+map[last] : val;
}

// ━━ サイズ定数 ━━
const W  = 116;  // メインボタン幅
const H  = 130;  // メインボタン高さ
const G  = 8;    // ギャップ
const LW = 136;  // 左列幅
const AW = 168;  // 操作列幅
const TOTAL_H = 5*H + 4*G; // 682px（5行分）

// ━━ 行カラー（列インデックス: 0=ワ行 … 9=ア行）━━
// 淡いパステルで品よく色分け
const COL_COLORS: { bg: string; border: string; shadow: string }[] = [
  { bg: "#EFF6FF", border: "#BFDBFE", shadow: "#93C5FD" },  // ア行
  { bg: "#FFFFFF", border: "#D1D5DB", shadow: "#9E9E9E" },  // カ行
  { bg: "#EFF6FF", border: "#BFDBFE", shadow: "#93C5FD" },  // サ行
  { bg: "#FFFFFF", border: "#D1D5DB", shadow: "#9E9E9E" },  // タ行
  { bg: "#EFF6FF", border: "#BFDBFE", shadow: "#93C5FD" },  // ナ行
  { bg: "#FFFFFF", border: "#D1D5DB", shadow: "#9E9E9E" },  // ハ行
  { bg: "#EFF6FF", border: "#BFDBFE", shadow: "#93C5FD" },  // マ行
  { bg: "#FFFFFF", border: "#D1D5DB", shadow: "#9E9E9E" },  // ヤ行
  { bg: "#EFF6FF", border: "#BFDBFE", shadow: "#93C5FD" },  // ラ行
  { bg: "#FFFFFF", border: "#D1D5DB", shadow: "#9E9E9E" },  // ワ行
];
// 行ラベル（上段ボタンに小さく表示）
const COL_LABELS = ["ア", "カ", "サ", "タ", "ナ", "ハ", "マ", "ヤ", "ラ", "ワ"];

export default function KatakanaKeyboard({ value, onChange, onComplete }: Props) {
  const [mode, setMode] = useState<"kata"|"alpha">("kata");
  // 英数字モードで以降の入力を大文字/小文字どちらで打ち込むかを保持する(いわゆる Caps Lock)
  const [alphaCase, setAlphaCase] = useState<"upper"|"lower">("upper");

  const btnBase =
    "flex items-center justify-center font-bold rounded-xl border-2 border-gray-300 bg-white text-gray-800 " +
    "active:bg-blue-100 active:border-blue-400 select-none touch-none transition-all duration-75 " +
    "shadow-[0_5px_0_#9E9E9E] active:shadow-[0_1px_0_#9E9E9E] active:translate-y-1";
  const cell = { width:W, height:H, minWidth:W };

  return (
    <div className="flex select-none flex-shrink-0" style={{ gap:G }}>

      {/* ━━ 左列：モード切替 + 修飾キー ━━ */}
      <div className="flex flex-col flex-shrink-0" style={{ gap:G, width:LW }}>
        {/* カタカナ */}
        <button
          onPointerDown={() => setMode("kata")}
          style={{ width:LW, height:H, fontSize:24, lineHeight:1.2 }}
          className={`flex items-center justify-center font-bold rounded-xl border-2 select-none touch-none transition-all ${
            mode==="kata"
              ? "bg-gray-900 text-white border-gray-900"
              : "bg-white text-gray-700 border-gray-300 active:bg-gray-100"
          }`}
        >
          カタカナ
        </button>
        {/* 英数字 */}
        <button
          onPointerDown={() => setMode("alpha")}
          style={{ width:LW, height:H, fontSize:24 }}
          className={`flex items-center justify-center font-bold rounded-xl border-2 select-none touch-none transition-all ${
            mode==="alpha"
              ? "bg-gray-900 text-white border-gray-900"
              : "bg-white text-gray-700 border-gray-300 active:bg-gray-100"
          }`}
        >
          英数字
        </button>
        {/* 濁点 */}
        <button
          onPointerDown={() => onChange(applyToLast(DAKUTEN, value))}
          className={btnBase}
          style={{ width:LW, height:H, fontSize:44 }}
        >
          ゛
        </button>
        {/* 半濁点 */}
        <button
          onPointerDown={() => onChange(applyToLast(HANDAKUTEN, value))}
          className={btnBase}
          style={{ width:LW, height:H, fontSize:44 }}
        >
          ゜
        </button>
        {/* 左列 最下段 の役割は mode で切り替える:
            - カタカナ: 末尾 1 文字を小文字化(ア→ァ / ツ→ッ 等)
            - 英数字 : 以降の入力を大文字/小文字で切替するトグル(Caps Lock 的) */}
        {mode === "alpha" ? (
          <button
            onPointerDown={() => setAlphaCase(c => c === "upper" ? "lower" : "upper")}
            className={`flex flex-col items-center justify-center font-bold rounded-xl border-2 select-none touch-none transition-all ${
              alphaCase === "upper"
                ? "bg-gray-900 text-white border-gray-900 shadow-[0_5px_0_#111]"
                : "bg-amber-400 text-gray-900 border-amber-500 shadow-[0_5px_0_#B45309]"
            }`}
            style={{ width:LW, height:H, padding: "6px 4px" }}
          >
            <span style={{ fontSize: 13, opacity: 0.8, letterSpacing: "0.05em" }}>今は</span>
            <span style={{ fontSize: 28, fontWeight: 900, lineHeight: 1, margin: "2px 0 4px" }}>
              {alphaCase === "upper" ? "大文字" : "小文字"}
            </span>
            <span style={{ fontSize: 11, opacity: 0.75 }}>タッチで切替</span>
          </button>
        ) : (
          <button
            onPointerDown={() => onChange(applyToLast(SMALL, value))}
            className={btnBase}
            style={{ width:LW, height:H, fontSize:22, lineHeight:1.3, textAlign:"center" }}
          >
            小文字{"\n"}変換
          </button>
        )}
      </div>

      {/* ━━ メイングリッド（カタカナ10列 / 英数7列）━━ */}
      <div className="flex flex-col flex-shrink-0" style={{ gap:G }}>
        {(mode==="kata" ? KATA_ROWS : ALPHA_ROWS).map((row, ri) => (
          <div key={ri} className="flex" style={{ gap:G }}>
            {row.map((ch, ci) => {
              if (ch === null) return <div key={ci} style={cell} />;
              const isKata = mode === "kata";
              const col = isKata ? COL_COLORS[ci] : null;
              const isTopRow = ri === 0 && isKata;
              // 英数字モード時はキーの表示文字とアウトプット文字を alphaCase に合わせて変える。
              // 英字 (A-Z) のみ大文字/小文字切替の対象で、記号 (&・.-_) は常にそのまま。
              const isLetter = !isKata && /^[A-Z]$/.test(ch);
              const display = isLetter && alphaCase === "lower" ? ch.toLowerCase() : ch;
              return (
                <button
                  key={ci}
                  onPointerDown={() => onChange(value + display)}
                  className="flex items-center justify-center font-bold rounded-xl border-2 select-none touch-none transition-all duration-75 active:translate-y-1"
                  style={{
                    ...cell,
                    fontSize: isKata ? 42 : 34,
                    background: col ? col.bg : "#fff",
                    borderColor: col ? col.border : "#D1D5DB",
                    color: "#1a1a1a",
                    boxShadow: `0 5px 0 ${col ? col.shadow : "#9E9E9E"}`,
                    fontWeight: isTopRow ? 900 : 700,
                    position: isTopRow ? "relative" as const : undefined,
                  }}
                >
                  {display}
                  {isTopRow && (
                    <span style={{
                      position: "absolute", top: 4, left: 6,
                      fontSize: 11, fontWeight: 800, color: "#9CA3AF",
                      lineHeight: 1, letterSpacing: "0.02em",
                    }}>
                      {COL_LABELS[ci]}行
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* ━━ 右補助列（alpha=数字3列）━━ */}
      {mode === "alpha" && (
        <div className="flex flex-col flex-shrink-0" style={{ gap:G }}>
          {NUM_ROWS.map((row, ri) => (
            <div key={ri} className="flex" style={{ gap:G }}>
              {row.map((ch, ci) =>
                ch === null
                  ? <div key={ci} style={cell} />
                  : <button
                      key={ci}
                      onPointerDown={() => onChange(value + ch)}
                      className={btnBase}
                      style={{ ...cell, fontSize:38, background:"#fefce8", borderColor:"#fde047" }}
                    >{ch}</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ━━ 操作ボタン（右端縦並び）━━ */}
      <div className="flex flex-col flex-shrink-0" style={{ gap:G }}>
        <button
          onPointerDown={() => onChange("")}
          className="flex items-center justify-center font-bold rounded-xl border-2 border-red-600 bg-red-500 text-white active:bg-red-600 select-none touch-none transition-all shadow-[0_5px_0_#B91C1C] active:shadow-[0_1px_0_#B91C1C] active:translate-y-1"
          style={{ width:AW, height:H, fontSize:28, textAlign:"center", lineHeight:1.35 }}
        >
          すべて<br />消す
        </button>
        <button
          onPointerDown={() => onChange(value.slice(0, -1))}
          className="flex items-center justify-center font-bold rounded-xl border-2 border-orange-500 bg-orange-400 text-white active:bg-orange-500 select-none touch-none transition-all shadow-[0_5px_0_#C2410C] active:shadow-[0_1px_0_#C2410C] active:translate-y-1"
          style={{ width:AW, height:H, fontSize:28, textAlign:"center", lineHeight:1.35 }}
        >
          1文字<br />消す
        </button>
        {/* ー（長音符）*/}
        <button
          onPointerDown={() => onChange(value + "ー")}
          className={btnBase}
          style={{ width:AW, height:H, fontSize:38 }}
        >
          ー
        </button>
        {/* スペース */}
        <button
          onPointerDown={() => onChange(value + "　")}
          className={btnBase}
          style={{ width:AW, height:H, fontSize:22 }}
        >
          スペース
        </button>
        {/* 入力完了 */}
        <button
          onPointerDown={value.trim() ? onComplete : undefined}
          disabled={!value.trim()}
          className={`flex items-center justify-center font-bold rounded-xl border-2 select-none touch-none transition-all ${
            value.trim()
              ? "border-teal-700 bg-teal-600 text-white active:bg-teal-700 shadow-[0_5px_0_#0F766E] active:shadow-[0_1px_0_#0F766E] active:translate-y-1"
              : "border-gray-300 bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          style={{ width:AW, height: H, fontSize:36 }}
        >
          入力完了
        </button>
      </div>

    </div>
  );
}
