"use client";

import { useState, useRef, useEffect } from "react";

// ━━ 地名（50音別）━━
// 読みの頭文字で分類（濁音は清音に統合: ぎ→き, ぐ→く, こおりやま→こ など）
const AREAS: Record<string, string[]> = {
  あ: ["会津", "足立", "厚木", "旭川", "安曇野", "青森", "秋田", "奄美"],
  い: ["いわき", "一宮", "伊勢志摩", "伊豆", "石川", "出雲", "市川", "市原", "板橋", "岩手", "茨城", "和泉"],
  う: ["宇都宮", "宇部"],
  え: ["江戸川"],
  お: ["帯広", "岡崎", "岡山", "小山", "大宮", "大分", "大阪", "沖縄", "尾張小牧"],
  か: ["加古川", "香川", "葛飾", "鹿児島", "柏", "春日井", "春日部", "川越", "川口", "川崎", "金沢"],
  き: ["京都", "岐阜", "北九州", "北見", "木更津"],
  く: ["釧路", "久留米", "熊谷", "熊本", "倉敷"],
  こ: ["江東", "越谷", "甲府", "古河", "神戸", "高知", "郡山"],
  さ: ["佐賀", "佐世保", "堺", "相模", "相模原", "札幌"],
  し: ["滋賀", "下関", "庄内", "知床", "品川", "島根", "静岡"],
  す: ["諏訪", "鈴鹿", "杉並"],
  せ: ["世田谷", "仙台"],
  そ: ["袖ヶ浦"],
  た: ["高崎", "高松", "多摩"],
  ち: ["千葉", "千代田", "筑豊"],
  つ: ["つくば", "土浦", "鶴見"],
  と: ["十勝", "徳島", "とちぎ", "苫小牧", "豊田", "豊橋", "所沢", "鳥取", "富山"],
  な: ["長岡", "長崎", "長野", "名古屋", "なにわ", "奈良", "那須", "那覇", "成田", "習志野"],
  に: ["新潟", "西宮", "日光"],
  ぬ: ["沼津"],
  ね: ["練馬"],
  の: ["野田"],
  は: ["八王子", "八戸", "函館", "浜松"],
  ひ: ["東大阪", "飛騨", "弘前", "広島", "姫路", "平泉"],
  ふ: ["福井", "福岡", "福島", "福山", "富士", "富士山", "府中", "船橋"],
  ま: ["前橋", "町田", "松江", "松戸", "松山", "松本"],
  み: ["三河", "三重", "宮城", "宮崎", "宮古", "水戸", "南大阪", "南信州"],
  む: ["室蘭", "武蔵野", "武蔵府中"],
  め: ["目黒"],
  も: ["盛岡", "茂原"],
  や: ["八尾", "八重山", "山形", "山口", "山梨"],
  よ: ["横須賀", "横浜", "米子", "四日市"],
  わ: ["和歌山"],
};

// ━━ 行ラベル（地名・ひらがな共通）━━
const ROW_LABELS = ["あ", "か", "さ", "た", "な", "は", "ま", "や", "ら", "わ"];

// ━━ 地名頭文字グリッド（null = 該当する地名なし）━━
// 列順: あ段・い段・う段・え段・お段（5列固定、50音順）
const AREA_CHAR_GRID: (string | null)[][] = [
  ["あ", "い", "う", "え", "お"],   // あ行
  ["か", "き", "く",  null, "こ"],  // か行 (けなし)
  ["さ", "し", "す", "せ", "そ"],   // さ行 (袖ヶ浦=そ)
  ["た", "ち", "つ",  null, "と"],  // た行 (てなし)
  ["な", "に", "ぬ", "ね", "の"],   // な行 (沼津=ぬ, 野田=の)
  ["は", "ひ", "ふ",  null,  null], // は行 (へ・ほなし)
  ["ま", "み", "む", "め", "も"],   // ま行
  ["や",  null, null, null, "よ"],  // や行 (山形等=や, 横浜等=よ)
  [ null, null, null, null,  null], // ら行 (すべてなし)
  ["わ",  null, null, null,  null], // わ行
];

// ━━ ナンバープレート用ひらがな（五十音グリッド）━━
// null = 使用不可文字の空欄（「お」「し」「へ」「ん」）
// 列順: あ行・い行・う行・え行・お行（5列固定）
const KANA_GRID: (string | null)[][] = [
  ["あ", "い", "う", "え", null ],  // あ行 (お=不使用)
  ["か", "き", "く", "け", "こ"],  // か行
  ["さ", null,  "す", "せ", "そ"],  // さ行 (し=不使用)
  ["た", "ち", "つ", "て", "と"],  // た行
  ["な", "に", "ぬ", "ね", "の"],  // な行
  ["は", "ひ", "ふ", null,  "ほ"],  // は行 (へ=不使用)
  ["ま", "み", "む", "め", "も"],  // ま行
  ["や", null,  "ゆ", null,  "よ"],  // や行
  ["ら", "り", "る", "れ", "ろ"],  // ら行
  ["わ", null,  null,  null,  "を"],  // わ行 (ん=不使用)
];

export type Step = "area" | "num3" | "kana" | "num4";
export type PlateColor = "white" | "green" | "yellow" | "black";

// ━━ 分類番号＋ひらがなからプレート色を自動判定 ━━
//
// 【色の決まり方】
//   普通車（登録自動車）: 白（自家用） / 緑（事業用）
//   軽自動車           : 黄（自家用） / 黒（事業用）
//
// 【軽自動車の分類番号帯】
//   480〜499 : 軽貨物
//   580〜799 : 軽乗用（780〜799は580〜599枯渇後の繰り上げ）
//   880〜899 : 軽特種
//
// 【事業用ひらがな】
//   普通車: あ い う え か き く け こ を
//   軽自動車: り れ
//
// 【未入力時のデフォルト】
//   分類番号未入力 → 緑（本システムはトラックが多い想定）
//   分類番号あり・ひらがな未入力 → 番号帯で推定
//
export function detectPlateColor(num3: string, kana: string = ""): PlateColor {
  if (!num3) return "green"; // 未入力: トラックが多い想定でデフォルト緑

  // 分類番号の数値部分を取得（下2桁がアルファベットの場合は先頭1〜2桁で判定）
  const numericStr = num3.replace(/[^0-9]/g, "");
  const n = parseInt(numericStr || "0", 10);

  // ── 軽自動車判定 (公式: 軽自動車検査協会) ──
  // 旧実装 580-799 は普通車の 599-679/699-779 も巻き込むので 4 レンジに分離。
  const isKei =
    (n >= 480 && n <= 498) || // 軽貨物
    (n >= 580 && n <= 598) || // 軽乗用
    (n >= 680 && n <= 698) || // 軽乗合
    (n >= 780 && n <= 798) || // 軽乗用(新番号帯)
    (n >= 880 && n <= 898);   // 軽特種

  if (isKei) {
    // 軽事業用（黒ナンバー）: り・れ
    if (kana === "り" || kana === "れ") return "black";
    // ひらがな未入力でも黄で表示（軽自家用が大多数）
    return "yellow";
  }

  // ── 普通車 ──
  // 事業用ひらがな: あいうえ・かきくけこ・を
  const jigyoKana = new Set(["あ", "い", "う", "え", "か", "き", "く", "け", "こ", "を"]);
  if (jigyoKana.has(kana)) return "green"; // 普通車事業用（緑）

  // ひらがな未入力: 分類番号先頭で推定
  if (!kana) {
    const first = num3[0];
    if (first === "1" || first === "2") return "green"; // 大型貨物・バス→事業用が多い
    return "white"; // 3〜9, 0 → 自家用が多い
  }

  return "white"; // 普通車自家用（白）
}

// ━━ プレート色設定 ━━
const COLOR_CONFIG: Record<PlateColor, { bg: string; text: string; dim: string; border: string; label: string }> = {
  white:  { bg: "#f4f4f4", text: "#1a5c1a", dim: "rgba(26,92,26,0.35)",   border: "#2a7a2a", label: "白" },
  green:  { bg: "#1a6320", text: "#ffffff", dim: "rgba(255,255,255,0.45)", border: "#666",    label: "緑" },
  yellow: { bg: "#f5d800", text: "#111111", dim: "rgba(17,17,17,0.35)",    border: "#999",    label: "黄" },
  black:  { bg: "#111111", text: "#f5d800", dim: "rgba(245,216,0,0.55)",   border: "#444",    label: "黒" },
};

// ━━ 4桁を「12-34」形式で右詰め表示（3桁以上でハイフン登場）━━
// 例: ""→"・・・・"  "1"→"・・・1"  "12"→"・・12"  "123"→"・1-23"  "1234"→"12-34"
function formatNum4(num4: string): string {
  const padded = ("・・・・" + num4).slice(-4); // 右詰めで4桁にパディング
  if (num4.length < 3) return padded; // 1〜2桁はハイフンなし
  return padded.slice(0, 2) + "-" + padded.slice(2, 4);
}

// ━━ フルstring→パーツ分解（num3は1〜3桁、num4は1〜4桁可変に対応）━━
// ひらがなの位置を基準に分割するためnum4が何桁でも正しく解析できる
export function parsePlate(value: string) {
  // ひらがな（U+3041〜U+3096）を右から探してkana位置を特定
  let kanaIdx = -1;
  for (let i = value.length - 1; i >= 0; i--) {
    const c = value.charCodeAt(i);
    if (c >= 0x3041 && c <= 0x3096) { kanaIdx = i; break; }
  }
  if (kanaIdx < 0) return { area: "", num3: "", kana: "", num4: "" };

  const kana = value[kanaIdx];
  const num4 = value.slice(kanaIdx + 1);          // kana以降がnum4（1〜4桁）
  const rest = value.slice(0, kanaIdx);            // kana以前がarea+num3
  // num3は末尾の連続した英数字、areaは漢字
  let num3Start = rest.length;
  for (let i = rest.length - 1; i >= 0; i--) {
    if (/[0-9A-Za-z]/.test(rest[i])) num3Start = i;
    else break;
  }
  return { area: rest.slice(0, num3Start), num3: rest.slice(num3Start), kana, num4 };
}

// ━━ プレート描画コア ━━
function PlateBody({
  area, num3, kana, num4, color, highlightPart, onPartClick, selectableMode,
}: {
  area: string; num3: string; kana: string; num4: string; color: PlateColor;
  highlightPart?: Step;
  onPartClick?: (part: Step) => void;
  selectableMode?: boolean;
}) {
  const { bg, text, dim, border } = COLOR_CONFIG[color];
  const areaDisp = area || "地名";
  const num3Disp = num3 || "・・・";
  const kanaDisp = kana || "あ";
  const dimArea  = !area;
  const dimNum3  = !num3;
  const dimKana  = !kana;
  const dimNum4  = !num4;

  // 日本語・数字とも統一フォント
  const pf = '"Hiragino Kaku Gothic ProN", "Meiryo", "MS Gothic", Arial, sans-serif';

  // 入力中パーツのハイライト：白リング＋黄枠で全プレート色で視認できる
  // selectableMode: 全パーツに青い破線枠を表示（タップ可能を示す）
  const hl = (part: Step): React.CSSProperties =>
    highlightPart === part
      ? { boxShadow: "0 0 0 2px #fff, 0 0 0 5px #ffe600", borderRadius: 4, padding: "1px 4px" }
      : selectableMode
      ? { boxShadow: "0 0 0 2.5px #3b82f6", borderRadius: 6, padding: "1px 4px", background: "rgba(59,130,246,0.12)" }
      : { padding: "1px 4px" };

  return (
    <div style={{
      width: "100%", maxWidth: 320, height: 160,
      background: bg,
      border: `5px solid ${border}`,
      borderRadius: 8,
      display: "flex", flexDirection: "column",
      padding: "3px",
      boxSizing: "border-box",
      position: "relative",
      overflow: "hidden",
    }}>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "4px 14px 6px", boxSizing: "border-box" }}>
        {/* 上段：地名＋分類番号（中央寄せ） */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "center", gap: 6,
          flexShrink: 0,
        }}>
          <span style={{
            fontSize: 26, fontWeight: 900, fontFamily: pf,
            letterSpacing: 2, color: dimArea ? dim : text,
            display: "inline-block", ...hl("area"),
            cursor: onPartClick ? "pointer" : undefined,
          }} onClick={() => onPartClick?.("area")}>{areaDisp}</span>
          <span style={{
            fontSize: 26, fontWeight: 900, fontFamily: pf,
            letterSpacing: 4, color: dimNum3 ? dim : text,
            display: "inline-block", ...hl("num3"),
            cursor: onPartClick ? "pointer" : undefined,
          }} onClick={() => onPartClick?.("num3")}>{num3Disp}</span>
        </div>
        {/* 下段：ひらがな（左）＋一連番号（大） */}
        {/* overflow: hidden を外す → ハイライトのboxShadowがプレート外枠でクリップされるのを防ぐ */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", position: "relative" }}>
          <span style={{
            position: "absolute", left: 0,
            fontSize: 40, fontWeight: 900, fontFamily: pf,
            color: dimKana ? dim : text,
            lineHeight: 1,
            display: "inline-block", ...hl("kana"),
            cursor: onPartClick ? "pointer" : undefined,
          }} onClick={() => onPartClick?.("kana")}>{kanaDisp}</span>
          {/* 一連番号：右詰めスロット表示（・は小フォントで幅節約） */}
          <div style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            paddingLeft: 32, transform: "scaleX(0.85)", transformOrigin: "center",
            cursor: onPartClick ? "pointer" : undefined,
          }} onClick={() => onPartClick?.("num4")}>
            {/* ハイライトは数字部分だけに絞る */}
            <span style={{
              display: "inline-flex", alignItems: "center",
              ...(highlightPart === "num4"
                ? { boxShadow: "0 0 0 2px #fff, 0 0 0 5px #ffe600", borderRadius: 4, padding: "1px 4px" }
                : selectableMode
                ? { boxShadow: "0 0 0 2.5px #3b82f6", borderRadius: 6, padding: "1px 4px", background: "rgba(59,130,246,0.12)" }
                : {}),
            }}>
              {[0, 1, 2, 3].map((pos) => {
                const hasDigit = pos >= (4 - num4.length);
                const ch = hasDigit ? num4[pos - (4 - num4.length)] : null;
                const showHyphen = pos === 2 && num4.length >= 3;
                return (
                  <span key={pos} style={{ display: "inline-flex", alignItems: "center" }}>
                    {showHyphen && (
                      <span style={{ fontSize: 72, fontWeight: 900, fontFamily: pf, color: text, lineHeight: 1 }}>-</span>
                    )}
                    {ch !== null ? (
                      <span style={{ fontSize: 72, fontWeight: 900, fontFamily: pf, color: text, lineHeight: 1 }}>{ch}</span>
                    ) : (
                      <span style={{ fontSize: 26, fontWeight: 900, fontFamily: pf, color: dim, lineHeight: "72px", verticalAlign: "middle" }}>・</span>
                    )}
                  </span>
                );
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ━━ 外部公開：保存済み車番表示コンポーネント ━━
export function PlateView({ value, onPartClick, selectableMode }: { value: string; onPartClick?: (part: Step) => void; selectableMode?: boolean }) {
  const parts = parsePlate(value);
  const color = parts.num3 ? detectPlateColor(parts.num3, parts.kana) : "green";
  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <PlateBody {...parts} color={color} onPartClick={onPartClick} selectableMode={selectableMode} />
    </div>
  );
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onComplete?: () => void; // 入力完了（確定ボタン押下）時に呼ばれる
  initialStep?: Step;
  singleStepMode?: boolean; // true: 1箇所修正したらonComplete（次に進まない）
}

// 分類番号で使用可能な英字（JAF公式）
// 数字との混同を防ぐため10文字のみ使用可 ※先頭桁は必ず数字
const PLATE_ALPHA = ["A", "C", "F", "H", "K", "L", "M", "P", "X", "Y"];

// ━━ カスタムテンキー ━━
function NumPad({
  value, maxLength, onInput, hint, alphanumeric = false, rightAlign = false,
  validAlpha, noAlphaFirst = false,
}: {
  value: string; maxLength: number; onInput: (v: string) => void;
  hint?: string; alphanumeric?: boolean; rightAlign?: boolean;
  validAlpha?: string[];   // 使用可能な英字リスト（未指定=全て）
  noAlphaFirst?: boolean;  // true = 先頭桁に英字不可
}) {
  const [showAlpha, setShowAlpha] = useState(false);

  function press(char: string) {
    // 先頭桁に英字を禁止（新規入力・リセット入力の両方）
    if (noAlphaFirst && /[A-Z]/i.test(char) && (value.length === 0 || value.length >= maxLength)) return;
    if (value.length >= maxLength) {
      // 入力済みの場合、クリアして新規入力
      onInput(char);
    } else {
      onInput(value + char);
    }
  }
  function del() { onInput(value.slice(0, -1)); }

  return (
    <div>
      <div className="flex items-center justify-center gap-1 mb-3">
        {Array.from({ length: maxLength }).map((_, i) => {
          let ch: string | undefined;
          let isCurrent: boolean;
          if (rightAlign) {
            const offset = maxLength - value.length; // 左側の空欄数
            const valueIdx = i - offset;
            ch = valueIdx >= 0 ? value[valueIdx] : undefined;
            isCurrent = !ch && i === offset - 1; // 入力済み桁のすぐ左
          } else {
            ch = value[i];
            isCurrent = i === value.length;
          }
          return (
            <div key={i} className={`flex-1 h-14 flex items-center justify-center rounded-xl text-3xl font-black border-2 transition-colors ${
              ch ? "border-blue-500 bg-blue-50 text-blue-700"
                : isCurrent ? "border-blue-400 bg-white animate-pulse"
                : "border-gray-200 bg-gray-50 text-gray-300"
            }`}>
              {ch || (isCurrent ? "▏" : "　")}
            </div>
          );
        })}
      </div>
      {hint && <p className="text-xs text-gray-400 text-center mb-2">{hint}</p>}

      {alphanumeric && (
        <div className="flex gap-2 mb-3">
          <button type="button" onClick={() => setShowAlpha(false)}
            className={`flex-1 py-2.5 rounded-xl text-base font-bold transition-colors ${!showAlpha ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"}`}>
            数字
          </button>
          <button type="button" onClick={() => setShowAlpha(true)}
            className={`flex-1 py-2.5 rounded-xl text-base font-bold transition-colors ${showAlpha ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"}`}>
            ABC
          </button>
        </div>
      )}

      {!showAlpha && (
        <div className="grid grid-cols-3 gap-2">
          {["1","2","3","4","5","6","7","8","9","","0","DEL"].map((k, i) =>
            k === "" ? <div key={`empty-${i}`} /> :
            k === "DEL" ? (
              <button key="del" type="button" onClick={del}
                className="h-14 bg-red-100 text-red-500 rounded-xl text-2xl font-bold active:bg-red-200">⌫</button>
            ) : (
              <button key={k} type="button" onClick={() => press(k)}
                className="h-14 bg-white border border-gray-200 text-gray-800 rounded-xl text-2xl font-bold shadow-sm active:bg-blue-100">
                {k}
              </button>
            )
          )}
        </div>
      )}

      {showAlpha && (
        <div>
          {/* 先頭桁に英字不可の場合は注意書きを表示 */}
          {noAlphaFirst && value.length === 0 && (
            <p className="text-xs text-orange-500 font-bold text-center mb-2">先頭桁は数字を入力してください</p>
          )}
          <div className="grid grid-cols-5 gap-2">
            {(validAlpha ?? PLATE_ALPHA).map((l) => {
              const disabled = noAlphaFirst && value.length === 0;
              return (
                <button key={l} type="button" onClick={() => press(l)}
                  disabled={disabled}
                  className={`h-12 rounded-xl text-xl font-bold border transition-colors ${
                    disabled
                      ? "bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed"
                      : "bg-white border-gray-200 text-gray-800 shadow-sm active:bg-blue-100"
                  }`}>
                  {l}
                </button>
              );
            })}
          </div>
          <button type="button" onClick={del}
            className="w-full h-12 bg-red-100 text-red-500 rounded-xl text-xl font-bold mt-2 active:bg-red-200">
            ⌫ 削除
          </button>
        </div>
      )}
    </div>
  );
}

// ━━ メインコンポーネント ━━
export default function LicensePlateInput({ value, onChange, onComplete, initialStep, singleStepMode }: Props) {
  // 初期値を value プロパティから復元（修正時に入力内容を保持するため）
  const init = parsePlate(value);
  const initStep: Step = initialStep
    ? initialStep
    : !init.area ? "area"
    : init.num3.length < 3 ? "num3"
    : !init.kana ? "kana"
    : "num4";

  // singleStepMode: 修正対象のステップはクリアして打ち替えにする
  // 地名: ひらがな選択（50音）から始める
  const initAreaChar = (singleStepMode && initialStep === "area")
    ? null
    : init.area
    ? (Object.keys(AREAS).find((k) => AREAS[k].includes(init.area)) ?? null)
    : null;

  const [step, setStep] = useState<Step>(initStep);
  const rootRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  // ステップ切替時にコンポーネント上端（＝プレート）が画面上端に来るようスクロール
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setTimeout(() => rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }, [step]);
  const [selectedAreaChar, setSelectedAreaChar] = useState<string | null>(initAreaChar);
  const [area, setArea] = useState(init.area);
  const [num3, setNum3] = useState(init.num3);
  const [kana, setKana] = useState(init.kana);
  const [num4, setNum4] = useState(init.num4);

  const plateColor = detectPlateColor(num3, kana);
  // singleStepMode: 最初のキー入力でクリアして打ち替え開始
  const pendingClear = useRef(singleStepMode && (initialStep === "num3" || initialStep === "num4"));

  function emit(a: string, n3: string, k: string, n4: string) {
    onChange(`${a}${n3}${k}${n4}`);
  }

  function selectArea(name: string) {
    setArea(name); emit(name, num3, kana, num4);
    if (singleStepMode && onComplete) { onComplete(); return; }
    setStep("num3");
  }
  function onNum3Input(v: string) {
    // 打ち替え: 最初のキーでクリアしてその1文字から開始
    if (pendingClear.current) {
      pendingClear.current = false;
      const lastChar = v.slice(-1);
      const clean = lastChar.toUpperCase().replace(/[^A-Z0-9]/g, "");
      setNum3(clean); emit(area, clean, kana, num4);
      return;
    }
    const clean = v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);
    setNum3(clean); emit(area, clean, kana, num4);
    if (clean.length === 3) {
      if (singleStepMode && onComplete) { onComplete(); return; }
      setStep("kana");
    }
  }
  function selectKana(k: string) {
    setKana(k); emit(area, num3, k, num4);
    if (singleStepMode && onComplete) { onComplete(); return; }
    setStep("num4");
  }
  function onNum4Input(v: string) {
    // 打ち替え: 最初のキーでクリアしてその1文字から開始
    if (pendingClear.current) {
      pendingClear.current = false;
      const lastChar = v.slice(-1);
      setNum4(lastChar); emit(area, num3, kana, lastChar);
      return;
    }
    setNum4(v); emit(area, num3, kana, v);
    if (v.length === 4 && onComplete) onComplete();
  }

  const stepReady = {
    area: true,
    num3: !!area,
    kana: !!area && num3.length === 3,
    num4: !!area && num3.length === 3 && !!kana,
  };

  // ── ステップ別の案内テキスト ──
  const guideText = (() => {
    switch (step) {
      case "area":
        return selectedAreaChar
          ? `「${selectedAreaChar}」で始まる地名を選んでください`
          : "地名の頭文字（ひらがな）を選んでください";
      case "num3":
        return num3.length === 3
          ? "分類番号が入力済みです。キーを押すと上書きできます"
          : "分類番号を3桁で入力してください";
      case "kana":
        return "ひらがなを1文字選んでください";
      case "num4":
        return num4.length === 4
          ? "一連番号が入力済みです。キーを押すと上書きできます"
          : "一連番号を入力してください（1〜4桁）";
    }
  })();

  // ── プレートプレビュー ──
  const plateDisplay = (
    <div className="sticky top-0 z-10 mb-4 pt-1">
      <p className="text-center text-sm font-bold mb-2" style={{ color: "#1d4ed8" }}>
        {guideText}
      </p>
      <p className="text-center text-xs text-gray-400 mb-2">
        プレートの各部分をタップで修正できます
      </p>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <PlateBody area={area} num3={num3} kana={kana} num4={num4} color={plateColor} highlightPart={step}
          onPartClick={(part) => {
            if (!stepReady[part]) return;
            if (part === "area" && area) {
              // 地名修正時：ひらがな選択画面から開始
              const charKey = Object.keys(AREAS).find(k => AREAS[k].includes(area)) ?? null;
              setSelectedAreaChar(charKey);
            }
            setStep(part);
          }}
        />
      </div>
    </div>
  );

  return (
    <div ref={rootRef} className="space-y-3">
      {plateDisplay}

      {/* アクティブなステップの入力部分のみ表示 */}
      <div className="bg-white rounded-xl shadow-sm border-2 border-blue-400 overflow-hidden">
        {/* ステップヘッダー */}
        <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
          <span className="text-blue-700 font-bold text-lg">
            {step === "area" && "① 地名を選択"}
            {step === "num3" && "② 分類番号を入力（3桁）"}
            {step === "kana" && "③ ひらがなを選択"}
            {step === "num4" && "④ 一連番号を入力"}
          </span>
        </div>

        <div className="p-3">
          {/* Step 1: 地名 */}
          {step === "area" && (
            selectedAreaChar ? (
              <div>
                <button
                  type="button"
                  onClick={() => setSelectedAreaChar(null)}
                  className="flex items-center gap-2 mb-3 text-blue-600 font-bold text-base active:opacity-60"
                >
                  <span className="text-lg">←</span>
                  <span className="text-2xl font-black">{selectedAreaChar}</span>
                  <span className="text-gray-400 text-sm font-normal">の地名 — 文字を選び直す</span>
                </button>
                <div className="grid grid-cols-3 gap-2">
                  {(AREAS[selectedAreaChar] ?? []).map((name) => (
                    <button key={name} type="button" onClick={() => selectArea(name)}
                      className={`py-5 px-2 rounded-xl text-xl font-bold text-center transition-all active:scale-95 ${
                        area === name ? "bg-blue-600 text-white shadow" : "bg-gray-100 text-gray-800"
                      }`}>{name}</button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {AREA_CHAR_GRID.map((row, ri) => {
                  const hasAny = row.some((c) => c !== null);
                  if (!hasAny) return null;
                  const isEven = ri % 2 === 1;
                  return (
                    <div key={ri} className={`flex items-center gap-1.5 rounded-xl px-1 py-1 ${isEven ? "bg-blue-50" : ""}`}>
                      <div className="w-5 text-xs text-gray-300 font-bold text-right shrink-0">{ROW_LABELS[ri]}</div>
                      <div className="flex-1 grid gap-1.5" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
                        {row.map((c, ci) =>
                          c ? (
                            <button key={c} type="button"
                              onClick={() => setSelectedAreaChar(c)}
                              className="h-12 rounded-xl text-xl font-bold transition-all active:scale-95 bg-white text-gray-800 shadow-sm border border-gray-200">
                              {c}
                            </button>
                          ) : (
                            <div key={`ea-${ri}-${ci}`} className="h-12" />
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* Step 2: 分類番号 */}
          {step === "num3" && (
            <NumPad value={num3} maxLength={3} onInput={onNum3Input}
              alphanumeric validAlpha={PLATE_ALPHA} noAlphaFirst />
          )}

          {/* Step 3: ひらがな */}
          {step === "kana" && (
            <div className="flex flex-col gap-0.5">
              {KANA_GRID.map((row, ri) => {
                const isEven = ri % 2 === 1;
                return (
                  <div key={ri} className={`flex items-center gap-1.5 rounded-xl px-1 py-1 ${isEven ? "bg-blue-50" : ""}`}>
                    <div className="w-5 text-xs text-gray-300 font-bold text-right shrink-0">{ROW_LABELS[ri]}</div>
                    <div className="flex-1 grid gap-1.5" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
                      {row.map((k, ci) =>
                        k ? (
                          <button key={k} type="button" onClick={() => selectKana(k)}
                            className={`h-14 rounded-xl text-2xl font-bold transition-all active:scale-95 ${
                              kana === k
                                ? "bg-blue-600 text-white shadow ring-2 ring-blue-300"
                                : "bg-white text-gray-800 shadow-sm border border-gray-200"
                            }`}>{k}</button>
                        ) : (
                          <div key={`blank-${ri}-${ci}`} className="h-14 rounded-xl border border-dashed border-gray-200" />
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Step 4: 一連番号 */}
          {step === "num4" && (
            <>
              <NumPad value={num4} maxLength={4} onInput={onNum4Input} rightAlign />
              {num4.length >= 1 && num4.length < 4 && onComplete && (
                <button
                  type="button"
                  onClick={onComplete}
                  className="w-full mt-3 py-4 bg-green-500 text-white font-bold text-xl rounded-2xl active:scale-95 transition-transform"
                >
                  この番号で確定する ✓
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

