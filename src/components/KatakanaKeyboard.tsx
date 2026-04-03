"use client";
import { useState } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onComplete: () => void;
  label?: string;
}

// ━━ カタカナ行（右→左：ア行右端、ワ行左端）━━
const KATA_ROWS: (string | null)[][] = [
  ["ワ","ラ","ヤ","マ","ハ","ナ","タ","サ","カ","ア"],
  ["ヲ","リ", null,"ミ","ヒ","ニ","チ","シ","キ","イ"],
  ["ン","ル","ユ","ム","フ","ヌ","ツ","ス","ク","ウ"],
  [null,"レ", null,"メ","ヘ","ネ","テ","セ","ケ","エ"],
  [null,"ロ","ヨ","モ","ホ","ノ","ト","ソ","コ","オ"],
];

// ━━ 小文字（縦2列 × 5行）━━
const SMALL_A = ["ァ","ィ","ゥ","ェ","ォ"];
const SMALL_B = ["ッ","ャ","ュ","ョ","ー"];

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

// ━━ 濁点・半濁点変換（トグル）━━
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
function applyToLast(map: Record<string,string>, val: string): string {
  if (!val) return val;
  const last = val[val.length-1];
  return map[last] ? val.slice(0,-1)+map[last] : val;
}

// ━━ サイズ定数 ━━
const W  = 116;  // メインボタン幅
const H  = 130;  // メインボタン高さ
const G  = 8;    // ギャップ
const LW = 130;  // 左列幅
const AW = 158;  // 操作列幅
const TOTAL_H = 5*H + 4*G; // 682px（5行分）

export default function KatakanaKeyboard({ value, onChange, onComplete }: Props) {
  const [mode, setMode] = useState<"kata"|"alpha">("kata");

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
          style={{ width:LW, height:H, fontSize:19, lineHeight:1.2 }}
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
          style={{ width:LW, height:H, fontSize:19 }}
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
          style={{ width:LW, height:H, fontSize:40 }}
        >
          ゛
        </button>
        {/* 半濁点 */}
        <button
          onPointerDown={() => onChange(applyToLast(HANDAKUTEN, value))}
          className={btnBase}
          style={{ width:LW, height:H, fontSize:40 }}
        >
          ゜
        </button>
        {/* スペース */}
        <button
          onPointerDown={() => onChange(value + "　")}
          className={btnBase}
          style={{ width:LW, height:H, fontSize:18 }}
        >
          スペース
        </button>
      </div>

      {/* ━━ メイングリッド（カタカナ10列 / 英数7列）━━ */}
      <div className="flex flex-col flex-shrink-0" style={{ gap:G }}>
        {(mode==="kata" ? KATA_ROWS : ALPHA_ROWS).map((row, ri) => (
          <div key={ri} className="flex" style={{ gap:G }}>
            {row.map((ch, ci) =>
              ch === null
                ? <div key={ci} style={cell} />
                : <button
                    key={ci}
                    onPointerDown={() => onChange(value + ch)}
                    className={btnBase}
                    style={{ ...cell, fontSize: mode==="kata" ? 36 : 30 }}
                  >{ch}</button>
            )}
          </div>
        ))}
      </div>

      {/* ━━ 右補助列（kata=小文字縦2列 / alpha=数字3列）━━ */}
      {mode === "kata" ? (
        <>
          {/* 小文字 列A：ァィゥェォ */}
          <div className="flex flex-col flex-shrink-0" style={{ gap:G }}>
            {SMALL_A.map(ch => (
              <button
                key={ch}
                onPointerDown={() => onChange(value + ch)}
                className={btnBase}
                style={{ ...cell, fontSize:30, background:"#eef2ff", borderColor:"#a5b4fc" }}
              >{ch}</button>
            ))}
          </div>
          {/* 小文字 列B：ッャュョー */}
          <div className="flex flex-col flex-shrink-0" style={{ gap:G }}>
            {SMALL_B.map(ch => (
              <button
                key={ch}
                onPointerDown={() => onChange(value + ch)}
                className={btnBase}
                style={{ ...cell, fontSize:30, background:"#eef2ff", borderColor:"#a5b4fc" }}
              >{ch}</button>
            ))}
          </div>
        </>
      ) : (
        /* 数字（3列×5行） */
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
                      style={{ ...cell, fontSize:32, background:"#fefce8", borderColor:"#fde047" }}
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
          style={{ width:AW, height:H, fontSize:22, textAlign:"center", lineHeight:1.35 }}
        >
          すべて<br />消す
        </button>
        <button
          onPointerDown={() => onChange(value.slice(0, -1))}
          className="flex items-center justify-center font-bold rounded-xl border-2 border-orange-500 bg-orange-400 text-white active:bg-orange-500 select-none touch-none transition-all shadow-[0_5px_0_#C2410C] active:shadow-[0_1px_0_#C2410C] active:translate-y-1"
          style={{ width:AW, height:H, fontSize:22, textAlign:"center", lineHeight:1.35 }}
        >
          1文字<br />消す
        </button>
        <button
          onPointerDown={onComplete}
          className="flex items-center justify-center font-bold rounded-xl border-2 border-green-700 bg-green-600 text-white active:bg-green-700 select-none touch-none transition-all shadow-[0_5px_0_#14532D] active:shadow-[0_1px_0_#14532D] active:translate-y-1"
          style={{ width:AW, height: TOTAL_H - 2*(H+G), fontSize:36 }}
        >
          入力完了
        </button>
      </div>

    </div>
  );
}
