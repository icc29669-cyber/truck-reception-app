"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getKioskSession, setKioskSession } from "@/lib/kioskState";
import type { PlateInput } from "@/types/reception";
import { detectPlateColor, COLOR_CONFIG } from "@/components/PlateDisplay";

/* ── データ ─────────────────────────────────── */
const REGION_MAP: Record<string, string[]> = {
  あ: ["会津","足立","厚木","旭川","安曇野","青森","秋田","奄美"],
  い: ["いわき","一宮","伊勢志摩","伊豆","石川","出雲","市川","市原","板橋","岩手","茨城","和泉"],
  う: ["宇都宮","宇部"],
  え: ["江戸川"],
  お: ["帯広","岡崎","岡山","小山","大宮","大分","大阪","沖縄","尾張小牧"],
  か: ["加古川","香川","葛飾","鹿児島","柏","春日井","春日部","川越","川口","川崎","金沢"],
  き: ["京都","岐阜","北九州","北見","木更津"],
  く: ["釧路","久留米","熊谷","熊本","倉敷"],
  こ: ["江東","越谷","甲府","古河","神戸","高知","郡山"],
  さ: ["佐賀","佐世保","堺","相模","相模原","札幌"],
  し: ["滋賀","下関","庄内","知床","品川","島根","静岡"],
  す: ["諏訪","鈴鹿","杉並"],
  せ: ["世田谷","仙台"],
  そ: ["袖ヶ浦"],
  た: ["高崎","高松","多摩","高槻"],
  ち: ["千葉","千代田","筑豊"],
  つ: ["つくば","土浦","鶴見"],
  と: ["十勝","徳島","とちぎ","苫小牧","豊田","豊橋","所沢","鳥取","富山"],
  な: ["長岡","長崎","長野","名古屋","なにわ","奈良","那須","那覇","成田","習志野"],
  に: ["新潟","西宮","日光"],
  ぬ: ["沼津"],
  ね: ["練馬"],
  の: ["野田"],
  は: ["八王子","八戸","函館","浜松"],
  ひ: ["東大阪","飛騨","弘前","広島","姫路","平泉"],
  ふ: ["福井","福岡","福島","福山","富士","富士山","府中","船橋"],
  ま: ["前橋","町田","松江","松戸","松山","松本"],
  み: ["三河","三重","宮城","宮崎","宮古","水戸","南大阪","南信州"],
  む: ["室蘭","武蔵野","武蔵府中"],
  め: ["目黒"],
  も: ["盛岡","茂原"],
  や: ["八尾","八重山","山形","山口","山梨"],
  よ: ["横須賀","横浜","米子","四日市"],
  ら: [], り: [], る: [], れ: [], ろ: [],
  わ: ["和歌山"],
  を: [], ん: [],
};

const KANA_ROWS: (string | null)[][] = [
  ["わ","ら","や","ま","は","な","た","さ","か","あ"],
  ["を","り", null,"み","ひ","に","ち","し","き","い"],
  ["ん","る","ゆ","む","ふ","ぬ","つ","す","く","う"],
  [null,"れ", null,"め","へ","ね","て","せ","け","え"],
  [null,"ろ","よ","も","ほ","の","と","そ","こ","お"],
];

const HIRA_ROWS: (string | null)[][] = [
  ["わ","ら","や","ま","は","な","た","さ","か","あ"],
  ["を","り", null,"み","ひ","に","ち","し","き","い"],
  ["ん","る","ゆ","む","ふ","ぬ","つ","す","く","う"],
  [null,"れ", null,"め","へ","ね","て","せ","け","え"],
  [null,"ろ","よ","も","ほ","の","と","そ","こ","お"],
];

const HIRA_UNUSABLE = new Set(["し","へ","ん","お"]);
// 事業用（緑ナンバー）ひらがな
const HIRA_JIGYOYO = new Set(["あ","い","う","え","か","き","く","け","こ","を"]);
// レンタカー
const HIRA_RENTAL = new Set(["わ","れ"]);
// 分類番号に使うアルファベット（ひらがな欄では使わない）
const ALPHA_KEYS = ["A","C","F","H","K","L","M","P","X","Y"];

type Section = "region" | "classNum" | "hira" | "number";

const STEP_CONFIG: Record<Section, { num: string; label: string; color: string; shadow: string }> = {
  region:   { num: "①", label: "地名を選んでください",       color: "#1565C0", shadow: "#0D47A1" },
  classNum: { num: "②", label: "分類番号（3桁）を入力",     color: "#BF360C", shadow: "#7F2800" },
  hira:     { num: "③", label: "ひらがなを選んでください",   color: "#4A148C", shadow: "#2D0D6A" },
  number:   { num: "④", label: "4桁番号を入力してください", color: "#1B5E20", shadow: "#0A3D10" },
};

/* ── 大型インタラクティブプレート ───────────── */
function BigPlate({
  plate, active, onTap,
}: {
  plate: PlateInput; active: Section; onTap: (s: Section) => void;
}) {
  const pf = '"Hiragino Kaku Gothic ProN","Meiryo","MS Gothic",Arial,sans-serif';
  const color = detectPlateColor(plate.classNum, plate.hira);
  const { bg, text, dim, border } = COLOR_CONFIG[color];

  const W = 700, H = 350;

  const hl = (s: Section): React.CSSProperties => active === s
    ? { outline: "5px solid #FFE600", outlineOffset: 3, borderRadius: 8, background: "rgba(255,230,0,0.20)" }
    : { borderRadius: 8 };

  const numDisplay = (() => {
    const num = plate.number;
    if (!num) return <span style={{ opacity: 0.35 }}>{"・・-・・"}</span>;
    const len = num.length;
    return (
      <>
        {[0, 1, 2, 3].map((pos) => {
          const hasDigit = pos >= (4 - len);
          const ch = hasDigit ? num[pos - (4 - len)] : null;
          const showHyphen = pos === 2 && len >= 3;
          return (
            <span key={pos} style={{ display: "inline-flex", alignItems: "center" }}>
              {pos === 2 && (
                <span style={{ visibility: len >= 3 ? "visible" : "hidden" }}>-</span>
              )}
              {ch !== null
                ? <span>{ch}</span>
                : <span style={{ opacity: 0.35 }}>・</span>
              }
            </span>
          );
        })}
      </>
    );
  })();

  return (
    <div
      style={{
        width: W, height: H,
        background: bg,
        border: `8px solid ${border}`,
        borderRadius: 16,
        boxShadow: "0 16px 48px rgba(0,0,0,0.45)",
        display: "flex", flexDirection: "column",
        padding: 12,
        boxSizing: "border-box",
        userSelect: "none",
      }}
    >
      {/* 上段: 地名 + 分類番号 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, flex: "0 0 auto", paddingBottom: 8 }}>
        <div
          onPointerDown={() => onTap("region")}
          style={{
            fontFamily: pf, fontWeight: 900, fontSize: 60,
            color: plate.region ? text : dim,
            cursor: "pointer", padding: "4px 14px",
            transition: "all 0.1s",
            ...hl("region"),
          }}
        >
          {plate.region || "地名"}
        </div>
        <div
          onPointerDown={() => onTap("classNum")}
          style={{
            fontFamily: pf, fontWeight: 900, fontSize: 60,
            color: plate.classNum ? text : dim,
            cursor: "pointer", padding: "4px 14px",
            letterSpacing: "0.15em",
            transition: "all 0.1s",
            ...hl("classNum"),
          }}
        >
          {plate.classNum || <span style={{ opacity: 0.4 }}>・・・</span>}
        </div>
      </div>

      {/* 下段: ひらがな + 4桁番号 */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", position: "relative" }}>
        <div
          onPointerDown={() => onTap("hira")}
          style={{
            fontFamily: pf, fontWeight: 900, fontSize: 100,
            color: plate.hira ? text : dim,
            cursor: "pointer", padding: "4px 10px",
            lineHeight: 1,
            ...hl("hira"),
          }}
        >
          {plate.hira || <span style={{ opacity: 0.4 }}>あ</span>}
        </div>
        <div
          onPointerDown={() => onTap("number")}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: pf, fontWeight: 900, fontSize: 116,
            color: plate.number ? text : dim,
            cursor: "pointer", padding: "4px 8px",
            transform: "scaleX(0.85)", transformOrigin: "center",
            letterSpacing: "0.08em",
            ...hl("number"),
          }}
        >
          {numDisplay}
        </div>
      </div>
    </div>
  );
}

/* ── メインページ ────────────────────────────── */
export default function PlatePage() {
  const router = useRouter();
  const [plate, setPlate] = useState<PlateInput>({ region: "", classNum: "", hira: "", number: "" });
  const [kanaFilter, setKanaFilter] = useState<string | null>(null);
  const [classMode, setClassMode] = useState<"num" | "alpha">("num");
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState<Section>("region");
  const [forceEdit, setForceEdit] = useState(false);
  // Strict Mode の useEffect 二重実行ガード
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const s = getKioskSession();
    setPlate(s.plate);
    setMounted(true);
    // data-confirm から特定セクション指定で来た場合
    const editSection = sessionStorage.getItem("plateEditSection") as Section | null;
    sessionStorage.removeItem("plateEditSection");
    if (editSection) {
      setActive(editSection);
      setForceEdit(true);
    } else if (!s.plate.region) setActive("region");
    else if (!s.plate.classNum) setActive("classNum");
    else if (!s.plate.hira) setActive("hira");
    else setActive("number");
  }, []);

  function save(partial: Partial<PlateInput>) {
    const next = { ...plate, ...partial };
    setPlate(next);
    setKioskSession({ plate: next });
    return next;
  }

  function selectRegion(region: string) {
    save({ region });
    setKanaFilter(null);
    setTimeout(() => setActive("classNum"), 120);
  }

  function pressClassNum(d: string) {
    const next = plate.classNum + d;
    if (next.length > 3) return;
    save({ classNum: next });
    if (next.length === 3) setTimeout(() => setActive("hira"), 200);
  }

  function selectHira(hira: string) {
    save({ hira });
    setTimeout(() => setActive("number"), 120);
  }

  function pressNumber(d: string) {
    const next = plate.number + d;
    if (next.length > 4) return;
    save({ number: next });
  }

  const isComplete = !!(plate.region && plate.classNum && plate.hira && plate.number);

  const numBtn =
    "flex items-center justify-center font-black rounded-2xl border-2 border-gray-200 bg-white " +
    "text-gray-900 select-none touch-none " +
    "shadow-[0_5px_0_#BDBDBD] active:shadow-[0_1px_0_#BDBDBD] active:translate-y-1 transition-all duration-75";

  const step = STEP_CONFIG[active];

  return (
    <div
      className="w-screen h-screen flex flex-col select-none overflow-hidden"
      style={{ background: "linear-gradient(160deg, #E8F4FD 0%, #D0E8FA 50%, #B8D8F6 100%)" }}
    >
      {/* ヘッダー */}
      <div
        className="flex items-center px-10 flex-shrink-0"
        style={{ background: "linear-gradient(90deg, #1a3a6b 0%, #1E5799 100%)", height: 88 }}
      >
        <button
          onPointerDown={() => router.push("/kiosk/phone")}
          className="flex items-center justify-center font-bold rounded-2xl border-2 border-white text-white active:bg-blue-800"
          style={{ height: 60, width: 160, fontSize: 28 }}
        >
          戻る
        </button>
        <h1 className="flex-1 text-center text-white font-bold" style={{ fontSize: 38 }}>
          車両ナンバーを入力してください
        </h1>
        <div style={{ width: 160 }} />
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 flex overflow-hidden">

        {/* 左: プレートのみ */}
        <div
          className="flex flex-col items-center justify-center gap-6 flex-shrink-0 border-r border-blue-200"
          style={{ width: 760, background: "rgba(255,255,255,0.25)" }}
        >
          {mounted && (
            <BigPlate plate={plate} active={active} onTap={(s) => { setActive(s); setForceEdit(true); }} />
          )}
          <p className="text-gray-500 font-bold text-center" style={{ fontSize: 22 }}>
            プレートの文字をタッチすると切り替えられます
          </p>
        </div>

        {/* 右: ステップバナー + 入力パネル OR 完了ボタン */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {isComplete && !forceEdit ? (
            /* ── 全入力完了 → 大きな次へボタン ── */
            <div className="flex-1 flex flex-col">
              <button
                onPointerDown={() => router.push("/kiosk/data-confirm")}
                className="flex-1 flex flex-col items-center justify-center font-black text-white
                           active:brightness-90"
                style={{
                  background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)",
                  fontSize: 80,
                  gap: 24,
                }}
              >
                <span style={{ fontSize: 100 }}>✓</span>
                <span>入力完了！</span>
                <span style={{ fontSize: 44, fontWeight: 700, opacity: 0.85 }}>タップして次へ進む</span>
              </button>
              <button
                onPointerDown={() => setForceEdit(true)}
                className="flex-shrink-0 flex items-center justify-center font-bold text-gray-500
                           bg-gray-100 border-t border-gray-200 active:bg-gray-200"
                style={{ height: 80, fontSize: 30 }}
              >
                ✎ 入力内容を修正する
              </button>
            </div>
          ) : (
            <>
              {/* ステップバナー */}
              <div
                className="flex items-center justify-between px-8 flex-shrink-0"
                style={{
                  background: step.color,
                  height: 110,
                  boxShadow: `0 6px 0 ${step.shadow}`,
                }}
              >
                <div className="flex items-center gap-5">
                  <div
                    style={{
                      width: 72, height: 72,
                      background: "rgba(255,255,255,0.25)",
                      border: "3px solid rgba(255,255,255,0.8)",
                      borderRadius: 12,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 42, fontWeight: 900, color: "white",
                      flexShrink: 0,
                    }}
                  >
                    {step.num}
                  </div>
                  <span style={{ fontSize: 46, fontWeight: 900, color: "white" }}>
                    {step.label}
                  </span>
                </div>
                {isComplete && (
                  <button
                    onPointerDown={() => router.push("/kiosk/data-confirm")}
                    className="flex items-center justify-center font-black rounded-2xl text-white
                               active:brightness-90 flex-shrink-0"
                    style={{
                      background: "#2E7D32",
                      border: "3px solid rgba(255,255,255,0.6)",
                      height: 76, paddingLeft: 28, paddingRight: 28,
                      fontSize: 28, gap: 10,
                    }}
                  >
                    ✓ 次へ進む
                  </button>
                )}
              </div>

              {/* 入力パネル */}
              <div className="flex-1 overflow-hidden flex flex-col">

                {/* ─── 地名パネル ─── */}
                {active === "region" && (
                  <div className="flex-1 overflow-hidden">
                    {!kanaFilter ? (
                      /* かなグリッド */
                      <div className="h-full flex flex-col items-center justify-center py-4">
                        <p className="font-bold text-gray-600 mb-5 text-center" style={{ fontSize: 28 }}>
                          頭文字を選んでください
                        </p>
                        <div className="flex flex-col gap-2">
                          {KANA_ROWS.map((row, ri) => (
                            <div key={ri} className="flex gap-2">
                              {row.map((k, ci) => {
                                if (!k) return <div key={ci} style={{ width: 88, height: 88 }} />;
                                const has = (REGION_MAP[k] ?? []).length > 0;
                                return (
                                  <button
                                    key={ci}
                                    onPointerDown={() => has ? setKanaFilter(k) : undefined}
                                    disabled={!has}
                                    className={`rounded-2xl font-bold flex items-center justify-center transition-all duration-75 ${
                                      has
                                        ? "bg-white text-gray-800 border-2 border-gray-200 shadow-[0_4px_0_#BDBDBD] active:shadow-[0_1px_0_#BDBDBD] active:translate-y-[3px] active:bg-blue-50"
                                        : "bg-gray-100 text-gray-300 border-2 border-gray-100"
                                    }`}
                                    style={{ width: 88, height: 88, fontSize: 32 }}
                                  >
                                    {k}
                                  </button>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      /* 地名リスト（全幅） */
                      <div className="h-full flex flex-col overflow-hidden">
                        <div className="flex items-center gap-4 px-6 py-3 border-b border-blue-100 flex-shrink-0"
                             style={{ background: "rgba(255,255,255,0.5)" }}>
                          <button
                            onPointerDown={() => setKanaFilter(null)}
                            className="flex items-center justify-center font-bold rounded-xl border-2 border-blue-400
                                       bg-white text-blue-600 active:bg-blue-50 transition-all"
                            style={{ height: 56, paddingLeft: 20, paddingRight: 20, fontSize: 26 }}
                          >
                            ← 戻る
                          </button>
                          <span className="font-black text-gray-700" style={{ fontSize: 32 }}>
                            「{kanaFilter}」の地名
                          </span>
                        </div>
                        <div className="flex-1 px-6 py-4 overflow-y-auto">
                          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                            {(REGION_MAP[kanaFilter] ?? []).map((r) => (
                              <button
                                key={r}
                                onPointerDown={() => selectRegion(r)}
                                className="bg-white border-4 border-gray-200 rounded-2xl font-black text-gray-900
                                           active:bg-green-100 active:border-green-500 transition-all duration-75
                                           flex items-center justify-center
                                           shadow-[0_5px_0_#BDBDBD] active:shadow-[0_1px_0_#BDBDBD] active:translate-y-1"
                                style={{ height: 130, fontSize: 36 }}
                              >
                                {r}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ─── 分類番号パネル ─── */}
                {active === "classNum" && (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="flex gap-8">
                      {classMode === "num" ? (
                        <div className="flex gap-4">
                          <div className="flex flex-col gap-3">
                            {[["1","2","3"],["4","5","6"],["7","8","9"]].map((row, ri) => (
                              <div key={ri} className="flex gap-3">
                                {row.map((k) => (
                                  <button key={k} onPointerDown={() => pressClassNum(k)} className={numBtn} style={{ width: 180, height: 120, fontSize: 56 }}>{k}</button>
                                ))}
                              </div>
                            ))}
                            <div className="flex gap-3">
                              <button onPointerDown={() => pressClassNum("0")} className={numBtn} style={{ width: 180*3+24, height: 120, fontSize: 56 }}>0</button>
                            </div>
                          </div>
                          <div className="flex flex-col gap-3">
                            <button onPointerDown={() => save({ classNum: "" })} className="flex items-center justify-center font-bold rounded-2xl border-2 border-red-500 bg-red-500 text-white active:bg-red-600 touch-none shadow-[0_5px_0_#B91C1C] active:shadow-[0_1px_0_#B91C1C] active:translate-y-1 transition-all duration-75" style={{ width: 200, height: 120, fontSize: 26 }}>すべて消す</button>
                            <button onPointerDown={() => save({ classNum: plate.classNum.slice(0,-1) })} className="flex items-center justify-center font-bold rounded-2xl border-2 border-orange-400 bg-orange-400 text-white active:bg-orange-500 touch-none shadow-[0_5px_0_#C2410C] active:shadow-[0_1px_0_#C2410C] active:translate-y-1 transition-all duration-75" style={{ width: 200, height: 120, fontSize: 26 }}>1文字消す</button>
                            <button onPointerDown={() => setClassMode("alpha")} className="flex items-center justify-center font-bold rounded-2xl border-2 border-blue-500 bg-blue-500 text-white active:bg-blue-600 touch-none shadow-[0_5px_0_#1D4ED8] active:shadow-[0_1px_0_#1D4ED8] active:translate-y-1 transition-all duration-75" style={{ width: 200, height: 120, fontSize: 26 }}>英字<br/>入力</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4 items-center">
                          <div className="flex gap-3 flex-wrap justify-center" style={{ maxWidth: 700 }}>
                            {ALPHA_KEYS.map((ch) => (
                              <button key={ch} onPointerDown={() => pressClassNum(ch)} className="flex items-center justify-center font-black rounded-2xl border-2 border-gray-200 bg-white text-gray-900 select-none touch-none shadow-[0_5px_0_#BDBDBD] active:shadow-[0_1px_0_#BDBDBD] active:translate-y-1 transition-all duration-75" style={{ width: 120, height: 120, fontSize: 40 }}>{ch}</button>
                            ))}
                          </div>
                          <div className="flex gap-3">
                            <button onPointerDown={() => save({ classNum: "" })} className="flex items-center justify-center font-bold rounded-2xl border-2 border-red-500 bg-red-500 text-white text-2xl active:bg-red-600 touch-none shadow-[0_5px_0_#B91C1C] active:shadow-[0_1px_0_#B91C1C] active:translate-y-1 transition-all duration-75" style={{ width: 180, height: 90 }}>すべて消す</button>
                            <button onPointerDown={() => save({ classNum: plate.classNum.slice(0,-1) })} className="flex items-center justify-center font-bold rounded-2xl border-2 border-orange-400 bg-orange-400 text-white text-2xl active:bg-orange-500 touch-none shadow-[0_5px_0_#C2410C] active:shadow-[0_1px_0_#C2410C] active:translate-y-1 transition-all duration-75" style={{ width: 180, height: 90 }}>1文字消す</button>
                            <button onPointerDown={() => setClassMode("num")} className="flex items-center justify-center font-bold rounded-2xl border-2 border-blue-500 bg-blue-500 text-white text-2xl active:bg-blue-600 touch-none shadow-[0_5px_0_#1D4ED8] active:shadow-[0_1px_0_#1D4ED8] active:translate-y-1 transition-all duration-75" style={{ width: 180, height: 90 }}>数字入力</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ─── ひらがなパネル ─── */}
                {active === "hira" && (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* 凡例 */}
                    <div className="flex items-center gap-6 px-8 py-3 flex-shrink-0 border-b border-blue-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-500" />
                        <span className="font-bold text-gray-700" style={{ fontSize: 20 }}>事業用（緑ナンバー）</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-orange-400" />
                        <span className="font-bold text-gray-700" style={{ fontSize: 20 }}>レンタカー</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gray-200" />
                        <span className="font-bold text-gray-500" style={{ fontSize: 20 }}>使用不可</span>
                      </div>
                    </div>
                    {/* かなグリッド */}
                    <div className="flex-1 flex items-center justify-center">
                      <div className="flex flex-col gap-2">
                        {HIRA_ROWS.map((row, ri) => (
                          <div key={ri} className="flex gap-2">
                            {row.map((ch, ci) => {
                              if (!ch) return <div key={ci} style={{ width: 90, height: 80 }} />;
                              const disabled = HIRA_UNUSABLE.has(ch);
                              const isJigyo = HIRA_JIGYOYO.has(ch);
                              const isRental = HIRA_RENTAL.has(ch);
                              const btnClass = disabled
                                ? "bg-gray-100 text-gray-300 border-2 border-gray-100 cursor-not-allowed"
                                : isJigyo
                                ? "bg-blue-500 border-2 border-blue-600 text-white shadow-[0_4px_0_#1D4ED8] active:shadow-[0_1px_0_#1D4ED8] active:translate-y-[3px]"
                                : isRental
                                ? "bg-orange-400 border-2 border-orange-500 text-white shadow-[0_4px_0_#C2410C] active:shadow-[0_1px_0_#C2410C] active:translate-y-[3px]"
                                : "bg-white border-2 border-gray-200 text-gray-900 shadow-[0_4px_0_#BDBDBD] active:shadow-[0_1px_0_#BDBDBD] active:translate-y-[3px]";
                              return (
                                <button
                                  key={ci}
                                  onPointerDown={() => !disabled && selectHira(ch)}
                                  disabled={disabled}
                                  className={`rounded-2xl font-bold flex items-center justify-center transition-all duration-75 ${btnClass}`}
                                  style={{ width: 90, height: 80, fontSize: 30 }}
                                >
                                  {ch}
                                </button>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── 4桁番号パネル ─── */}
                {active === "number" && (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="flex gap-4">
                      <div className="flex flex-col gap-3">
                        {[["1","2","3"],["4","5","6"],["7","8","9"]].map((row, ri) => (
                          <div key={ri} className="flex gap-3">
                            {row.map((k) => (
                              <button key={k} onPointerDown={() => pressNumber(k)} className={numBtn} style={{ width: 180, height: 120, fontSize: 56 }}>{k}</button>
                            ))}
                          </div>
                        ))}
                        <div className="flex gap-3">
                          <button onPointerDown={() => pressNumber("0")} className={numBtn} style={{ width: 180*3+24, height: 120, fontSize: 56 }}>0</button>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3">
                        <button onPointerDown={() => save({ number: "" })} className="flex items-center justify-center font-bold rounded-2xl border-2 border-red-500 bg-red-500 text-white active:bg-red-600 touch-none shadow-[0_5px_0_#B91C1C] active:shadow-[0_1px_0_#B91C1C] active:translate-y-1 transition-all duration-75" style={{ width: 200, height: 120, fontSize: 26 }}>すべて消す</button>
                        <button onPointerDown={() => save({ number: plate.number.slice(0,-1) })} className="flex items-center justify-center font-bold rounded-2xl border-2 border-orange-400 bg-orange-400 text-white active:bg-orange-500 touch-none shadow-[0_5px_0_#C2410C] active:shadow-[0_1px_0_#C2410C] active:translate-y-1 transition-all duration-75" style={{ width: 200, height: 120, fontSize: 26 }}>1文字消す</button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
