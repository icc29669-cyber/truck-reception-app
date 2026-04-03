"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getKioskSession, setKioskSession } from "@/lib/kioskState";
import type { PlateInput } from "@/types/reception";
import { detectPlateColor, COLOR_CONFIG } from "@/components/PlateDisplay";

/* ── 地名データ ─────────────────────────────── */
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

/* ── 五十音表（10列×5行）
   列 = 行（あ行〜わ行）、行 = 段（あ段〜お段）─── */
const KANA_GRID: (string | null)[][] = [
  ["あ","か","さ","た","な","は","ま","や","ら","わ"],
  ["い","き","し","ち","に","ひ","み",null, "り","を"],
  ["う","く","す","つ","ぬ","ふ","む","ゆ","る",null],
  ["え","け","せ","て","ね","へ","め",null, "れ",null],
  ["お","こ","そ","と","の","ほ","も","よ","ろ","ん"],
];

const HIRA_UNUSABLE = new Set(["し","へ","ん","お"]);
const HIRA_JIGYOYO  = new Set(["あ","い","う","え","か","き","く","け","こ","を"]);
const HIRA_RENTAL   = new Set(["わ","れ"]);
const ALPHA_KEYS    = ["A","C","F","H","K","L","M","P","X","Y"];

type Section = "region" | "classNum" | "hira" | "number";

const STEP_CONFIG: Record<Section, { num: string; label: string; color: string; shadow: string }> = {
  region:   { num: "①", label: "地名を選んでください",       color: "#1565C0", shadow: "#0D47A1" },
  classNum: { num: "②", label: "分類番号（3桁）を入力",     color: "#BF360C", shadow: "#7F2800" },
  hira:     { num: "③", label: "ひらがなを選んでください",   color: "#4A148C", shadow: "#2D0D6A" },
  number:   { num: "④", label: "4桁番号を入力してください", color: "#1B5E20", shadow: "#0A3D10" },
};

/* ── ナンバープレート ─────────────────────────
   親コンテナの width/height に対して 100% で表示
───────────────────────────────────────────── */
function BigPlate({
  plate, active, onTap,
}: {
  plate: PlateInput; active: Section; onTap: (s: Section) => void;
}) {
  const pf = '"Hiragino Kaku Gothic ProN","Meiryo","MS Gothic",Arial,sans-serif';
  const color = detectPlateColor(plate.classNum, plate.hira);
  const { bg, text, dim, border } = COLOR_CONFIG[color];

  const hl = (s: Section): React.CSSProperties => active === s
    ? { outline: "6px solid #FFE600", outlineOffset: 4, borderRadius: 8, background: "rgba(255,230,0,0.22)" }
    : { borderRadius: 8 };

  const numDisplay = (() => {
    const num = plate.number;
    if (!num) return <span style={{ opacity: 0.55 }}>{"・・-・・"}</span>;
    const len = num.length;
    return (
      <>
        {[0,1,2,3].map((pos) => {
          const hasDigit = pos >= (4 - len);
          const ch = hasDigit ? num[pos - (4 - len)] : null;
          return (
            <span key={pos} style={{ display: "inline-flex", alignItems: "center" }}>
              {pos === 2 && <span style={{ visibility: len >= 3 ? "visible" : "hidden" }}>-</span>}
              {ch !== null ? <span>{ch}</span> : <span style={{ opacity: 0.55 }}>・</span>}
            </span>
          );
        })}
      </>
    );
  })();

  return (
    <div style={{
      width: "100%", height: "100%",
      background: bg,
      border: `clamp(5px, 0.8vmin, 14px) solid ${border}`,
      borderRadius: "clamp(10px, 1.6vmin, 26px)",
      boxShadow: "0 24px 64px rgba(0,0,0,0.55), 0 4px 12px rgba(0,0,0,0.3)",
      display: "flex", flexDirection: "column",
      padding: "clamp(8px, 1.2vmin, 20px)",
      boxSizing: "border-box",
      userSelect: "none",
    }}>
      {/* 上段: 地名 + 分類番号 */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: "3vmin", flex: "0 0 auto", paddingBottom: "0.8vmin",
      }}>
        <div
          onPointerDown={() => onTap("region")}
          style={{
            fontFamily: pf, fontWeight: 900,
            fontSize: "clamp(28px, 6vmin, 96px)",
            color: plate.region ? text : dim,
            cursor: "pointer", padding: "0.3vmin 1vmin",
            transition: "all 0.1s", ...hl("region"),
          }}
        >
          {plate.region || "地名"}
        </div>
        <div
          onPointerDown={() => onTap("classNum")}
          style={{
            fontFamily: pf, fontWeight: 900,
            fontSize: "clamp(28px, 6vmin, 96px)",
            color: plate.classNum ? text : dim,
            cursor: "pointer", padding: "0.3vmin 1vmin",
            letterSpacing: "0.15em", transition: "all 0.1s",
            ...hl("classNum"),
          }}
        >
          {plate.classNum || <span style={{ opacity: 0.6 }}>・・・</span>}
        </div>
      </div>

      {/* 下段: ひらがな + 4桁番号 */}
      <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
        <div
          onPointerDown={() => onTap("hira")}
          style={{
            fontFamily: pf, fontWeight: 900,
            fontSize: "clamp(48px, 11vmin, 180px)",
            color: plate.hira ? text : dim,
            cursor: "pointer", padding: "0.2vmin 0.6vmin",
            lineHeight: 1, ...hl("hira"),
          }}
        >
          {plate.hira || <span style={{ opacity: 0.6 }}>あ</span>}
        </div>
        <div
          onPointerDown={() => onTap("number")}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: pf, fontWeight: 900,
            fontSize: "clamp(48px, 12vmin, 195px)",
            color: plate.number ? text : dim,
            cursor: "pointer", padding: "0.2vmin 0.5vmin",
            transform: "scaleX(0.85)", transformOrigin: "center",
            letterSpacing: "0.08em", ...hl("number"),
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
  const [plate, setPlate]           = useState<PlateInput>({ region: "", classNum: "", hira: "", number: "" });
  const [kanaFilter, setKanaFilter] = useState<string | null>(null);
  const [classMode, setClassMode]   = useState<"num" | "alpha">("num");
  const [mounted, setMounted]       = useState(false);
  const [active, setActive]         = useState<Section>("region");
  const [forceEdit, setForceEdit]   = useState(false);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const s = getKioskSession();
    setPlate(s.plate);
    setMounted(true);
    const editSection = sessionStorage.getItem("plateEditSection") as Section | null;
    sessionStorage.removeItem("plateEditSection");
    if (editSection) {
      setActive(editSection); setForceEdit(true);
    } else if (!s.plate.region)   setActive("region");
    else if (!s.plate.classNum)   setActive("classNum");
    else if (!s.plate.hira)       setActive("hira");
    else                          setActive("number");
  }, []);

  function save(partial: Partial<PlateInput>) {
    const next = { ...plate, ...partial };
    setPlate(next); setKioskSession({ plate: next }); return next;
  }
  function selectRegion(region: string) {
    save({ region }); setKanaFilter(null);
    setTimeout(() => setActive("classNum"), 120);
  }
  function pressClassNum(d: string) {
    const next = plate.classNum + d;
    if (next.length > 3) return;
    save({ classNum: next });
    if (next.length === 3) setTimeout(() => setActive("hira"), 200);
  }
  function selectHira(hira: string) {
    save({ hira }); setTimeout(() => setActive("number"), 120);
  }
  function pressNumber(d: string) {
    const next = plate.number + d;
    if (next.length > 4) return;
    save({ number: next });
  }

  const isComplete = !!(plate.region && plate.classNum && plate.hira && plate.number);
  const step = STEP_CONFIG[active];

  const numBtn =
    "flex items-center justify-center font-black rounded-2xl border-2 border-gray-200 bg-white " +
    "text-gray-900 select-none touch-none " +
    "shadow-[0_5px_0_#BDBDBD] active:shadow-[0_1px_0_#BDBDBD] active:translate-y-1 transition-all duration-75";

  /* 右パネル幅 = 40vw。キーパッドは最大 520px、かなボタンは 10列 */
  const keyH  = "clamp(60px, 7.5vh, 100px)";
  const keyFs = "clamp(26px, 4vh, 58px)";
  /* かなグリッド: 40vw内で10列 → 1列≒3.6vw */
  const kanaW = "clamp(40px, 3.6vw, 60px)";
  const kanaH = "clamp(48px, 7.5vh, 88px)";
  const kanaFs= "clamp(14px, 1.8vw, 26px)";

  return (
    <div
      className="w-screen h-screen flex flex-col select-none overflow-hidden"
      style={{ background: "linear-gradient(160deg, #E8F4FD 0%, #D0E8FA 40%, #B8D8F6 100%)" }}
    >
      {/* ── ヘッダー ── */}
      <div
        className="flex items-center px-8 flex-shrink-0"
        style={{
          background: "linear-gradient(90deg, #1a3a6b 0%, #1E5799 100%)",
          height: 64,
        }}
      >
        <button
          onPointerDown={() => router.push("/kiosk/phone")}
          className="flex items-center justify-center font-bold rounded-2xl border-2 border-white text-white active:bg-blue-800 flex-shrink-0"
          style={{ height: 48, paddingLeft: 24, paddingRight: 24, fontSize: 24 }}
        >
          ← 戻る
        </button>
        <h1 className="flex-1 text-center text-white font-black" style={{ fontSize: 30 }}>
          車両ナンバーを入力してください
        </h1>
        <div style={{ width: 120 }} />
      </div>

      {/* ── メイン（左右2分割）── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ════════════════════════════════
            左60vw  ── プレート表示
        ════════════════════════════════ */}
        <div
          className="flex flex-col flex-shrink-0"
          style={{
            width: "60vw",
            background: "#1A2F50",
            borderRight: "3px solid #0D1E35",
          }}
        >
          {/* 上部ラベル */}
          <div style={{
            padding: "16px 28px 0",
            color: "rgba(255,255,255,0.45)",
            fontSize: "clamp(13px, 1.6vh, 20px)",
            fontWeight: 700,
            letterSpacing: "0.15em",
          }}>
            ナンバープレート
          </div>

          {/* プレート本体: 左カラム幅いっぱい、flex-1で縦も広げる */}
          <div className="flex-1 flex items-center justify-center" style={{ padding: "12px 28px" }}>
            <div style={{ width: "calc(60vw - 56px)", aspectRatio: "2 / 1" }}>
              {mounted && (
                <BigPlate
                  plate={plate}
                  active={active}
                  onTap={(s) => { setActive(s); setForceEdit(true); }}
                />
              )}
            </div>
          </div>

          {/* 下部: 入力ステップ進捗 */}
          <div style={{ padding: "0 28px 20px" }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 8,
            }}>
              {(["region","classNum","hira","number"] as Section[]).map((s, i) => {
                const labels = ["地名","分類番号","ひらがな","番号"];
                const vals   = [plate.region, plate.classNum, plate.hira, plate.number];
                const filled = !!vals[i];
                const isCurrent = active === s && !isComplete;
                return (
                  <button
                    key={s}
                    onPointerDown={() => { setActive(s); setForceEdit(true); }}
                    style={{
                      borderRadius: 12,
                      border: isCurrent ? "2px solid #FFE600" : "2px solid rgba(255,255,255,0.15)",
                      background: filled ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)",
                      padding: "10px 6px",
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{
                      fontSize: "clamp(11px, 1.3vh, 17px)",
                      color: filled ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.3)",
                      marginBottom: 4,
                      fontWeight: 600,
                    }}>
                      {["①","②","③","④"][i]} {labels[i]}
                    </div>
                    <div style={{
                      fontSize: "clamp(14px, 2vh, 26px)",
                      fontWeight: 900,
                      color: filled ? "#fff" : "rgba(255,255,255,0.2)",
                      letterSpacing: "0.05em",
                      lineHeight: 1.2,
                    }}>
                      {vals[i] || "─"}
                    </div>
                  </button>
                );
              })}
            </div>
            <p style={{
              textAlign: "center",
              marginTop: 10,
              fontSize: "clamp(12px, 1.5vh, 18px)",
              color: "rgba(255,255,255,0.3)",
              fontWeight: 600,
            }}>
              ▲ プレートまたはカードをタッチすると修正できます
            </p>
          </div>
        </div>

        {/* ════════════════════════════════
            右半分 (flex-1)  ── 入力パネル
        ════════════════════════════════ */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {isComplete && !forceEdit ? (
            /* ── 全入力完了 ── */
            <div className="flex-1 flex flex-col">
              <button
                onPointerDown={() => router.push("/kiosk/data-confirm")}
                className="flex-1 flex flex-col items-center justify-center font-black text-white active:brightness-90"
                style={{
                  background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)",
                  fontSize: "clamp(40px, 6vh, 80px)", gap: "2vh",
                }}
              >
                <span style={{ fontSize: "clamp(56px, 8vh, 100px)" }}>✓</span>
                <span>入力完了！</span>
                <span style={{ fontSize: "clamp(22px, 3vh, 40px)", fontWeight: 700, opacity: 0.85 }}>
                  タップして次へ進む
                </span>
              </button>
              <button
                onPointerDown={() => setForceEdit(true)}
                className="flex-shrink-0 flex items-center justify-center font-bold text-gray-500
                           bg-gray-100 border-t border-gray-200 active:bg-gray-200"
                style={{ height: 60, fontSize: 26 }}
              >
                ✎ 入力内容を修正する
              </button>
            </div>
          ) : (
            <>
              {/* ── ステップバナー ── */}
              <div
                className="flex items-center justify-between px-6 flex-shrink-0"
                style={{ background: step.color, height: 60, boxShadow: `0 5px 0 ${step.shadow}` }}
              >
                <div className="flex items-center gap-3">
                  <div style={{
                    width: 42, height: 42,
                    background: "rgba(255,255,255,0.25)", border: "2px solid rgba(255,255,255,0.8)",
                    borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 24, fontWeight: 900, color: "white", flexShrink: 0,
                  }}>
                    {step.num}
                  </div>
                  <span style={{ fontSize: 28, fontWeight: 900, color: "white" }}>{step.label}</span>
                </div>
                {isComplete && (
                  <button
                    onPointerDown={() => router.push("/kiosk/data-confirm")}
                    className="flex items-center justify-center font-black rounded-2xl text-white active:brightness-90 flex-shrink-0"
                    style={{ background: "#2E7D32", border: "3px solid rgba(255,255,255,0.6)", height: 46, paddingLeft: 18, paddingRight: 18, fontSize: 20 }}
                  >
                    ✓ 次へ
                  </button>
                )}
              </div>

              {/* ── 入力パネル ── */}
              <div className="flex-1 overflow-hidden flex flex-col">

                {/* ① 地名 */}
                {active === "region" && (
                  <div className="flex-1 overflow-hidden">
                    {!kanaFilter ? (
                      /* 五十音表（10列×5行）*/
                      <div className="h-full flex flex-col items-center justify-center py-2">
                        <p className="font-bold text-gray-500 mb-2" style={{ fontSize: 18 }}>
                          地名の頭文字を選んでください
                        </p>
                        <div className="flex flex-col" style={{ gap: 5 }}>
                          {KANA_GRID.map((row, ri) => (
                            <div key={ri} className="flex" style={{ gap: 5 }}>
                              {row.map((k, ci) => {
                                if (!k) return <div key={ci} style={{ width: kanaW, height: kanaH }} />;
                                const has = (REGION_MAP[k] ?? []).length > 0;
                                return (
                                  <button
                                    key={ci}
                                    onPointerDown={() => has ? setKanaFilter(k) : undefined}
                                    disabled={!has}
                                    className={`rounded-xl font-bold flex items-center justify-center transition-all duration-75 ${
                                      has
                                        ? "bg-white text-gray-800 border-2 border-gray-200 shadow-[0_4px_0_#BDBDBD] active:shadow-[0_1px_0_#BDBDBD] active:translate-y-[3px] active:bg-blue-50"
                                        : "bg-gray-100 text-gray-300 border-2 border-gray-100"
                                    }`}
                                    style={{ width: kanaW, height: kanaH, fontSize: kanaFs }}
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
                      /* 地名リスト */
                      <div className="h-full flex flex-col overflow-hidden">
                        <div
                          className="flex items-center gap-3 px-4 py-2 border-b border-blue-100 flex-shrink-0"
                          style={{ background: "rgba(255,255,255,0.5)" }}
                        >
                          <button
                            onPointerDown={() => setKanaFilter(null)}
                            className="flex items-center justify-center font-bold rounded-xl border-2 border-blue-400 bg-white text-blue-600 active:bg-blue-50"
                            style={{ height: 48, paddingLeft: 16, paddingRight: 16, fontSize: 22 }}
                          >
                            ← 戻る
                          </button>
                          <span className="font-black text-gray-700" style={{ fontSize: 26 }}>
                            「{kanaFilter}」の地名
                          </span>
                        </div>
                        <div className="flex-1 px-4 py-3 overflow-y-auto">
                          <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                            {(REGION_MAP[kanaFilter] ?? []).map((r) => (
                              <button
                                key={r}
                                onPointerDown={() => selectRegion(r)}
                                className="bg-white border-4 border-gray-200 rounded-2xl font-black text-gray-900
                                           active:bg-green-100 active:border-green-500 transition-all duration-75
                                           flex items-center justify-center
                                           shadow-[0_5px_0_#BDBDBD] active:shadow-[0_1px_0_#BDBDBD] active:translate-y-1"
                                style={{ height: 100, fontSize: 30 }}
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

                {/* ② 分類番号 */}
                {active === "classNum" && (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3 w-full px-4">
                      {classMode === "num" ? (
                        <div style={{
                          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
                          gap: "clamp(6px, 1vw, 12px)", width: "100%", maxWidth: "clamp(260px, 42vw, 560px)",
                        }}>
                          {["1","2","3","4","5","6","7","8","9"].map((k) => (
                            <button key={k} onPointerDown={() => pressClassNum(k)}
                              className={numBtn} style={{ height: keyH, fontSize: keyFs }}>{k}</button>
                          ))}
                          <button onPointerDown={() => save({ classNum: "" })}
                            className="flex items-center justify-center font-bold rounded-2xl border-2 border-red-500 bg-red-500 text-white touch-none shadow-[0_5px_0_#B91C1C] active:shadow-[0_1px_0_#B91C1C] active:translate-y-1 transition-all duration-75"
                            style={{ height: keyH, fontSize: "clamp(14px, 2vh, 24px)" }}>消す</button>
                          <button onPointerDown={() => pressClassNum("0")}
                            className={numBtn} style={{ height: keyH, fontSize: keyFs }}>0</button>
                          <button onPointerDown={() => save({ classNum: plate.classNum.slice(0, -1) })}
                            className="flex items-center justify-center font-bold rounded-2xl border-2 border-orange-400 bg-orange-400 text-white touch-none shadow-[0_5px_0_#C2410C] active:shadow-[0_1px_0_#C2410C] active:translate-y-1 transition-all duration-75"
                            style={{ height: keyH, fontSize: "clamp(12px, 1.8vh, 22px)" }}>1文字消す</button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3 items-center">
                          <div className="flex gap-2 flex-wrap justify-center" style={{ maxWidth: "clamp(320px, 46vw, 640px)" }}>
                            {ALPHA_KEYS.map((ch) => (
                              <button key={ch} onPointerDown={() => pressClassNum(ch)}
                                className="flex items-center justify-center font-black rounded-2xl border-2 border-gray-200 bg-white text-gray-900 select-none touch-none shadow-[0_5px_0_#BDBDBD] active:shadow-[0_1px_0_#BDBDBD] active:translate-y-1 transition-all duration-75"
                                style={{ width: "clamp(64px, 8vw, 108px)", height: "clamp(64px, 8vw, 108px)", fontSize: "clamp(22px, 3vw, 44px)" }}>
                                {ch}
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-3">
                            <button onPointerDown={() => save({ classNum: "" })} className="flex items-center justify-center font-bold rounded-2xl border-2 border-red-500 bg-red-500 text-white active:bg-red-600 touch-none shadow-[0_5px_0_#B91C1C] active:translate-y-1 transition-all duration-75" style={{ width: 160, height: 72, fontSize: 20 }}>すべて消す</button>
                            <button onPointerDown={() => save({ classNum: plate.classNum.slice(0, -1) })} className="flex items-center justify-center font-bold rounded-2xl border-2 border-orange-400 bg-orange-400 text-white active:bg-orange-500 touch-none shadow-[0_5px_0_#C2410C] active:translate-y-1 transition-all duration-75" style={{ width: 160, height: 72, fontSize: 20 }}>1文字消す</button>
                          </div>
                        </div>
                      )}
                      <button
                        onPointerDown={() => setClassMode(classMode === "num" ? "alpha" : "num")}
                        className="flex items-center justify-center font-bold rounded-2xl border-2 border-blue-500 bg-blue-500 text-white touch-none shadow-[0_5px_0_#1D4ED8] active:shadow-[0_1px_0_#1D4ED8] active:translate-y-1 transition-all duration-75"
                        style={{ height: "clamp(44px, 5.5vh, 76px)", paddingLeft: 24, paddingRight: 24, fontSize: "clamp(15px, 2vh, 26px)" }}
                      >
                        {classMode === "num" ? "英字入力に切替" : "数字入力に切替"}
                      </button>
                    </div>
                  </div>
                )}

                {/* ③ ひらがな */}
                {active === "hira" && (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex items-center gap-4 px-6 py-2 flex-shrink-0 border-b border-blue-100">
                      <div className="flex items-center gap-1">
                        <div className="rounded bg-blue-500" style={{ width: 16, height: 16 }} />
                        <span className="font-bold text-gray-700" style={{ fontSize: 14 }}>事業用</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="rounded bg-orange-400" style={{ width: 16, height: 16 }} />
                        <span className="font-bold text-gray-700" style={{ fontSize: 14 }}>レンタカー</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="rounded bg-gray-200" style={{ width: 16, height: 16 }} />
                        <span className="font-bold text-gray-500" style={{ fontSize: 14 }}>使用不可</span>
                      </div>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <div className="flex flex-col" style={{ gap: 5 }}>
                        {KANA_GRID.map((row, ri) => (
                          <div key={ri} className="flex" style={{ gap: 5 }}>
                            {row.map((ch, ci) => {
                              if (!ch) return <div key={ci} style={{ width: kanaW, height: kanaH }} />;
                              const disabled = HIRA_UNUSABLE.has(ch);
                              const isJigyo  = HIRA_JIGYOYO.has(ch);
                              const isRental = HIRA_RENTAL.has(ch);
                              const btnCls = disabled
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
                                  className={`rounded-xl font-bold flex items-center justify-center transition-all duration-75 ${btnCls}`}
                                  style={{ width: kanaW, height: kanaH, fontSize: kanaFs }}
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

                {/* ④ 4桁番号 */}
                {active === "number" && (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3 w-full px-4">
                      <div style={{
                        display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "clamp(6px, 1vw, 12px)", width: "100%", maxWidth: "clamp(260px, 42vw, 560px)",
                      }}>
                        {["1","2","3","4","5","6","7","8","9"].map((k) => (
                          <button key={k} onPointerDown={() => pressNumber(k)}
                            className={numBtn} style={{ height: keyH, fontSize: keyFs }}>{k}</button>
                        ))}
                        <button onPointerDown={() => save({ number: "" })}
                          className="flex items-center justify-center font-bold rounded-2xl border-2 border-red-500 bg-red-500 text-white touch-none shadow-[0_5px_0_#B91C1C] active:shadow-[0_1px_0_#B91C1C] active:translate-y-1 transition-all duration-75"
                          style={{ height: keyH, fontSize: "clamp(14px, 2vh, 24px)" }}>消す</button>
                        <button onPointerDown={() => pressNumber("0")}
                          className={numBtn} style={{ height: keyH, fontSize: keyFs }}>0</button>
                        <button onPointerDown={() => save({ number: plate.number.slice(0, -1) })}
                          className="flex items-center justify-center font-bold rounded-2xl border-2 border-orange-400 bg-orange-400 text-white touch-none shadow-[0_5px_0_#C2410C] active:shadow-[0_1px_0_#C2410C] active:translate-y-1 transition-all duration-75"
                          style={{ height: keyH, fontSize: "clamp(12px, 1.8vh, 22px)" }}>1文字消す</button>
                      </div>
                    </div>
                  </div>
                )}

              </div>{/* /入力パネル */}
            </>
          )}

        </div>{/* /右半分 */}
      </div>{/* /左右 */}
    </div>
  );
}
