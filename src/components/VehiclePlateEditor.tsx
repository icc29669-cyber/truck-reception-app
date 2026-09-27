"use client";
import { useEffect, useRef, useState } from "react";
import type { PlateInput } from "@/types/reception";
export type PlateSection = "region" | "classNum" | "hira" | "number";
const REGION_MAP: Record<string, string[]> = {
  あ: ["会津","足立","厚木","旭川","安曇野","青森","秋田","奄美"],
  い: ["いわき","一宮","伊勢志摩","伊豆","石川","出雲","市川","市原","板橋","岩手","茨城","和泉"],
  う: ["宇都宮","宇部"], え: ["江戸川"],
  お: ["帯広","岡崎","岡山","小山","大宮","大分","大阪","沖縄","尾張小牧"],
  か: ["加古川","香川","葛飾","鹿児島","柏","春日井","春日部","川越","川口","川崎","金沢"],
  き: ["京都","岐阜","北九州","北見","木更津"],
  く: ["釧路","久留米","熊谷","熊本","倉敷"],
  こ: ["江東","越谷","甲府","古河","神戸","高知","郡山"],
  さ: ["佐賀","佐世保","堺","相模","相模原","札幌"],
  し: ["滋賀","下関","庄内","知床","品川","島根","静岡"],
  す: ["諏訪","鈴鹿","杉並"], せ: ["世田谷","仙台"], そ: ["袖ヶ浦"],
  た: ["高崎","高松","多摩","高槻"], ち: ["千葉","千代田","筑豊"],
  つ: ["つくば","土浦","鶴見"],
  と: ["十勝","徳島","とちぎ","苫小牧","豊田","豊橋","所沢","鳥取","富山"],
  な: ["長岡","長崎","長野","名古屋","なにわ","奈良","那須","那覇","成田","習志野"],
  に: ["新潟","西宮","日光"], ぬ: ["沼津"], ね: ["練馬"], の: ["野田"],
  は: ["八王子","八戸","函館","浜松"],
  ひ: ["東大阪","飛騨","弘前","広島","姫路","平泉"],
  ふ: ["福井","福岡","福島","福山","富士","富士山","府中","船橋"],
  ま: ["前橋","町田","松江","松戸","松山","松本"],
  み: ["三河","三重","宮城","宮崎","宮古","水戸","南大阪","南信州"],
  む: ["室蘭","武蔵野","武蔵府中"], め: ["目黒"], も: ["盛岡","茂原"],
  や: ["八尾","八重山","山形","山口","山梨"],
  よ: ["横須賀","横浜","米子","四日市"],
  ら: [],り: [],る: [],れ: [],ろ: [], わ: ["和歌山"], を: [], ん: [],
};
const KANA_ROWS: (string | null)[][] = [
  ["あ","か","さ","た","な","は","ま","や","ら","わ"],
  ["い","き","し","ち","に","ひ","み", null,"り","を"],
  ["う","く","す","つ","ぬ","ふ","む","ゆ","る","ん"],
  ["え","け","せ","て","ね","へ","め", null,"れ", null],
  ["お","こ","そ","と","の","ほ","も","よ","ろ", null],
];
const HIRA_UNUSABLE = new Set(["し","へ","ん","お"]);
const HIRA_JIGYOYO = new Set(["あ","い","う","え","か","き","く","け","こ","を"]);
const HIRA_RENTAL  = new Set(["わ","れ"]);
const ALPHA_KEYS   = ["A","C","F","H","K","L","M","P","X","Y"];
const HIRA_COL_COLORS = [
  { bg: "#EFF6FF", border: "#BFDBFE", shadow: "#93C5FD" }, // あ行
  { bg: "#FFFFFF", border: "#D1D5DB", shadow: "#9E9E9E" }, // か行
  { bg: "#EFF6FF", border: "#BFDBFE", shadow: "#93C5FD" }, // さ行
  { bg: "#FFFFFF", border: "#D1D5DB", shadow: "#9E9E9E" }, // た行
  { bg: "#EFF6FF", border: "#BFDBFE", shadow: "#93C5FD" }, // な行
  { bg: "#FFFFFF", border: "#D1D5DB", shadow: "#9E9E9E" }, // は行
  { bg: "#EFF6FF", border: "#BFDBFE", shadow: "#93C5FD" }, // ま行
  { bg: "#FFFFFF", border: "#D1D5DB", shadow: "#9E9E9E" }, // や行
  { bg: "#EFF6FF", border: "#BFDBFE", shadow: "#93C5FD" }, // ら行
  { bg: "#FFFFFF", border: "#D1D5DB", shadow: "#9E9E9E" }, // わ行
];
const HIRA_COL_LABELS = ["あ","か","さ","た","な","は","ま","や","ら","わ"];
type Props = { plate: PlateInput; plateSection: PlateSection; fromFinal: boolean;
  savePlate: (value: Partial<PlateInput>) => void; onSectionChange: (section: PlateSection) => void; onComplete: () => void };
export default function VehiclePlateEditor({ plate, plateSection, fromFinal, savePlate, onSectionChange, onComplete }: Props) {
  const [kanaFilter, setKanaFilter] = useState<string | null>(null);
  const [alphaMode, setAlphaMode] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  function advance(next: PlateSection, delay: number) {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => fromFinal ? onComplete() : onSectionChange(next), delay);
  }
  const sectionLabels: Record<PlateSection, string> = { region: "① 地名", classNum: "② 分類番号", hira: "③ ひらがな", number: "④ 4桁番号" };
  const sectionColors: Record<PlateSection, string> = { region: "#1565C0", classNum: "#BF360C", hira: "#4A148C", number: "#1B5E20" };
  const numBtnStyle = "flex items-center justify-center font-black rounded-xl border-2 border-gray-200 bg-white text-gray-900 active:bg-gray-100 shadow-[0_4px_0_#BDBDBD] active:shadow-[0_1px_0_#BDBDBD] active:translate-y-[3px] transition-all duration-75 select-none touch-pan-y";
  // 10列と8pxの間隔を、両端32pxの余白内に収める。1024px端末でも全キーを押せる。
  const regionKeyWidth = "min(180px, calc(10vw - 13.6px))";
  const plateFilled = !!(plate.region && plate.classNum && plate.hira && plate.number.length >= 1);
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Colored section banner — 英字切替ボタンはキーパッド側(操作ボタン列)に移設済み */}
      <div className="flex items-center px-10 flex-shrink-0" style={{ height: 72, background: sectionColors[plateSection], boxShadow: "0 4px 0 rgba(0,0,0,0.2)" }}>
        <span style={{ fontSize: 34, fontWeight: 900, color: "#fff" }}>{sectionLabels[plateSection]}</span>
      </div>
      {/* Section content */}
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-8 py-4">
        {/* 地名 */}
        {plateSection === "region" && (kanaFilter === null ? (
          <div>
            <p style={{ fontSize: 24, fontWeight: 700, color: "#475569", marginBottom: 10 }}>頭文字を選んでください</p>
            <div className="flex flex-col" style={{ gap: 8 }}>
              {KANA_ROWS.map((row, ri) => (
                <div key={ri} className="flex" style={{ gap: 8 }}>
                  {row.map((k, ci) => {
                    if (k === null) return <div key={ci} style={{ width: regionKeyWidth, height: 100, flexShrink: 0 }} />;
                    const col = HIRA_COL_COLORS[ci];
                    const isTopRow = ri === 0;
                    const hasRegions = (REGION_MAP[k] && REGION_MAP[k].length > 0);
                    return (
                      <button
                        key={ci}
                        onClick={hasRegions ? () => setKanaFilter(k) : undefined}
                        disabled={!hasRegions}
                        className={`flex items-center justify-center font-bold rounded-xl border-2 transition-all select-none touch-pan-y ${hasRegions ? "active:translate-y-[3px]" : ""}`}
                        style={{
                          width: regionKeyWidth, height: 100, fontSize: 42, flexShrink: 0,
                          background: hasRegions ? col.bg : "#F1F5F9",
                          borderColor: hasRegions ? col.border : "#E2E8F0",
                          boxShadow: hasRegions ? `0 4px 0 ${col.shadow}` : "none",
                          color: hasRegions ? "#26251e" : "#CBD5E1",
                          fontWeight: isTopRow ? 900 : 700,
                          position: "relative",
                          cursor: hasRegions ? "pointer" : "not-allowed",
                          opacity: hasRegions ? 1 : 0.5,
                        }}
                      >
                        {k}
                        {isTopRow && (
                          <span style={{
                            position: "absolute", top: 3, left: 5,
                            fontSize: 11, fontWeight: 800, color: "#9CA3AF",
                            lineHeight: 1, letterSpacing: "0.02em",
                          }}>{HIRA_COL_LABELS[ci]}行</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => setKanaFilter(null)}
                className="flex items-center justify-center font-bold rounded-xl select-none touch-pan-y transition-all active:scale-95"
                style={{
                  height: 68, padding: "0 28px", fontSize: 22, fontWeight: 800,
                  border: "3px solid #F59E0B",
                  background: "#FFFBEB",
                  color: "#92400E",
                  display: "flex", alignItems: "center", gap: 10,
                }}
              >
                <span style={{ fontSize: 26 }}>◀</span>
                別の文字を選ぶ
              </button>
              <span style={{ fontSize: 26, fontWeight: 700, color: "#475569" }}>
                「<span style={{ color: "#D97706", fontWeight: 900 }}>{kanaFilter}</span>」から始まる地名
              </span>
            </div>
            <div className="flex flex-wrap" style={{ gap: 14 }}>
              {(REGION_MAP[kanaFilter] || []).map(r => (
                <button key={r} onClick={() => { savePlate({ region: r }); setKanaFilter(null); advance("classNum", 100); }} className="flex items-center justify-center font-black rounded-xl border-2 border-gray-200 bg-white active:bg-blue-50 shadow-[0_5px_0_#BDBDBD] active:translate-y-[3px] transition-all select-none touch-pan-y" style={{ height: 120, padding: "0 36px", fontSize: 44, minWidth: 190, color: "#26251e" }}>{r}</button>
              ))}
            </div>
          </div>
        ))}

        {/* 分類番号 */}
        {plateSection === "classNum" && (
          <div className="min-h-full flex items-center justify-center py-4">
            {!alphaMode ? (
              <div className="flex items-stretch" style={{ gap: 20 }}>
                {/* テンキー */}
                <div className="flex flex-col" style={{ gap: 16 }}>
                  {[["1","2","3"],["4","5","6"],["7","8","9"]].map((row, ri) => (
                    <div key={ri} className="flex" style={{ gap: 16 }}>{row.map(k => (
                      <button key={k} onClick={() => { if (plate.classNum.length < 3) { const n = plate.classNum + k; savePlate({ classNum: n }); if (n.length === 3) advance("hira", 150); } }} className={numBtnStyle} style={{ width: 180, height: 130, fontSize: 56 }}>{k}</button>
                    ))}</div>
                  ))}
                  <button onClick={() => { if (plate.classNum.length < 3) { const n = plate.classNum + "0"; savePlate({ classNum: n }); if (n.length === 3) advance("hira", 150); } }} className={numBtnStyle} style={{ width: 572, height: 130, fontSize: 56 }}>0</button>
                </div>
                {/* 操作ボタン列(英字/数字切替 + 全消し + 1文字消す) */}
                <div className="flex flex-col" style={{ gap: 16 }}>
                  {/* 英字切替 — キーパッドの隣に置いて押しやすく */}
                  <button
                    onClick={() => setAlphaMode(true)}
                    className="flex items-center justify-center font-bold rounded-xl border-2 select-none touch-pan-y active:translate-y-[2px] transition-all"
                    style={{
                      width: 180, flex: 0.8, fontSize: 22,
                      background: "#fefce8", borderColor: "#facc15", color: "#92400e",
                      boxShadow: "0 5px 0 #ca8a04", textAlign: "center", lineHeight: 1.25,
                    }}
                  >英字を<br/>入力</button>
                  <button onClick={() => savePlate({ classNum: "" })} className="flex items-center justify-center font-bold rounded-xl border-2 border-red-500 bg-red-500 text-white active:bg-red-600 shadow-[0_5px_0_#B91C1C] active:shadow-[0_1px_0_#B91C1C] active:translate-y-[3px] transition-all select-none touch-pan-y" style={{ width: 180, flex: 1, fontSize: 28 }}>全消し</button>
                  <button onClick={() => savePlate({ classNum: plate.classNum.slice(0, -1) })} className="flex items-center justify-center font-bold rounded-xl border-2 border-orange-400 bg-orange-400 text-white active:bg-orange-500 shadow-[0_5px_0_#C2410C] active:shadow-[0_1px_0_#C2410C] active:translate-y-[3px] transition-all select-none touch-pan-y" style={{ width: 180, flex: 1, fontSize: 24, textAlign: "center", lineHeight: 1.3 }}>1文字<br/>消す</button>
                </div>
              </div>
            ) : (
              /* 英字モード */
              <div className="flex items-stretch" style={{ gap: 20 }}>
                <div className="flex flex-wrap" style={{ gap: 16, maxWidth: 940 }}>
                  {ALPHA_KEYS.map(k => (
                    <button key={k} onClick={() => { if (plate.classNum.length < 3) { const n = plate.classNum + k; savePlate({ classNum: n }); if (n.length === 3) advance("hira", 150); } }} className={numBtnStyle} style={{ width: 180, height: 130, fontSize: 56, background: "#fefce8", borderColor: "#fde047" }}>{k}</button>
                  ))}
                </div>
                <div className="flex flex-col" style={{ gap: 16 }}>
                  {/* 数字に戻す(英字モード時) */}
                  <button
                    onClick={() => setAlphaMode(false)}
                    className="flex items-center justify-center font-bold rounded-xl border-2 select-none touch-pan-y active:translate-y-[2px] transition-all"
                    style={{
                      width: 180, height: 130, fontSize: 22,
                      background: "#fff", borderColor: "#3b82f6", color: "#1e3a8a",
                      boxShadow: "0 5px 0 #2563eb", textAlign: "center", lineHeight: 1.25,
                    }}
                  >数字に<br/>戻す</button>
                  <button onClick={() => savePlate({ classNum: "" })} className="flex items-center justify-center font-bold rounded-xl border-2 border-red-500 bg-red-500 text-white active:bg-red-600 shadow-[0_5px_0_#B91C1C] active:translate-y-[3px] transition-all select-none touch-pan-y" style={{ width: 180, height: 130, fontSize: 28 }}>全消し</button>
                  <button onClick={() => savePlate({ classNum: plate.classNum.slice(0, -1) })} className="flex items-center justify-center font-bold rounded-xl border-2 border-orange-400 bg-orange-400 text-white active:bg-orange-500 shadow-[0_5px_0_#C2410C] active:translate-y-[3px] transition-all select-none touch-pan-y" style={{ width: 180, height: 130, fontSize: 24, textAlign: "center", lineHeight: 1.3 }}>1文字<br/>消す</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ひらがな */}
        {plateSection === "hira" && (
          <div>
            <div className="flex gap-6 mb-3 flex-wrap" style={{ fontSize: 20, fontWeight: 700 }}>
              <span style={{ color: "#2563eb" }}>■ 事業用（緑ナンバー）</span>
              <span style={{ color: "#ea580c" }}>■ レンタカー</span>
            </div>
            <div className="flex flex-col" style={{ gap: 8 }}>
              {KANA_ROWS.map((row, ri) => (
                <div key={ri} className="flex" style={{ gap: 8 }}>
                  {row.map((k, ci) => {
                    if (k === null || HIRA_UNUSABLE.has(k)) {
                      return <div key={ci} style={{ width: regionKeyWidth, height: 100, flexShrink: 0 }} />;
                    }
                    const jigyoyo = HIRA_JIGYOYO.has(k);
                    const rental = HIRA_RENTAL.has(k);
                    const col = HIRA_COL_COLORS[ci];
                    const isTopRow = ri === 0;
                    const bg = jigyoyo ? "#dbeafe" : rental ? "#ffedd5" : col.bg;
                    const borderColor = jigyoyo ? "#93c5fd" : rental ? "#fb923c" : col.border;
                    const shadow = jigyoyo ? "#93c5fd" : rental ? "#fb923c" : col.shadow;
                    const color = jigyoyo ? "#1d4ed8" : rental ? "#ea580c" : "#26251e";
                    return (
                      <button
                        key={ci}
                        onClick={() => { savePlate({ hira: k }); advance("number", 120); }}
                        className="flex items-center justify-center font-bold rounded-xl border-2 transition-all active:translate-y-[3px] select-none touch-pan-y"
                        style={{
                          width: regionKeyWidth, height: 100, fontSize: 42, flexShrink: 0,
                          background: bg,
                          borderColor: borderColor,
                          boxShadow: `0 4px 0 ${shadow}`,
                          color: color,
                          fontWeight: isTopRow ? 900 : 700,
                          position: "relative",
                        }}
                      >
                        {k}
                        {isTopRow && (
                          <span style={{
                            position: "absolute", top: 3, left: 5,
                            fontSize: 11, fontWeight: 800, color: "#9CA3AF",
                            lineHeight: 1, letterSpacing: "0.02em",
                          }}>{HIRA_COL_LABELS[ci]}行</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4桁番号 */}
        {plateSection === "number" && (
          <div className="min-h-full flex items-center justify-center py-4">
            <div className="flex items-stretch" style={{ gap: 20 }}>
              {/* テンキー */}
              <div className="flex flex-col" style={{ gap: 16 }}>
                {[["1","2","3"],["4","5","6"],["7","8","9"]].map((row, ri) => (
                  <div key={ri} className="flex" style={{ gap: 16 }}>{row.map(k => (
                    <button key={k} onClick={() => { if (plate.number.length < 4) savePlate({ number: plate.number + k }); }} className={numBtnStyle} style={{ width: 180, height: 130, fontSize: 56 }}>{k}</button>
                  ))}</div>
                ))}
                <button onClick={() => { if (plate.number.length < 4) savePlate({ number: plate.number + "0" }); }} className={numBtnStyle} style={{ width: 572, height: 130, fontSize: 56 }}>0</button>
              </div>
              {/* 操作ボタン */}
              <div className="flex flex-col" style={{ gap: 16 }}>
                <button onClick={() => savePlate({ number: "" })} className="flex items-center justify-center font-bold rounded-xl border-2 border-red-500 bg-red-500 text-white active:bg-red-600 shadow-[0_5px_0_#B91C1C] active:shadow-[0_1px_0_#B91C1C] active:translate-y-[3px] transition-all select-none touch-pan-y" style={{ width: 200, flex: 1, fontSize: 28 }}>全消し</button>
                <button onClick={() => savePlate({ number: plate.number.slice(0, -1) })} className="flex items-center justify-center font-bold rounded-xl border-2 border-orange-400 bg-orange-400 text-white active:bg-orange-500 shadow-[0_5px_0_#C2410C] active:shadow-[0_1px_0_#C2410C] active:translate-y-[3px] transition-all select-none touch-pan-y" style={{ width: 200, flex: 1, fontSize: 24, textAlign: "center", lineHeight: 1.3 }}>1文字<br/>消す</button>
                <button
                  onClick={() => { if (plateFilled) { onComplete(); } }}
                  className="flex items-center justify-center font-black rounded-2xl text-white select-none touch-pan-y active:brightness-90"
                  style={{
                    width: 200, flex: 1.5, fontSize: 28,
                    background: plateFilled ? "linear-gradient(180deg,#0d9488,#0f766e)" : "#9CA3AF",
                    boxShadow: plateFilled ? "0 6px 0 #0f766e, 0 8px 24px rgba(13,148,136,0.4)" : "0 4px 0 #6B7280",
                    opacity: plateFilled ? 1 : 0.5,
                    transition: "all 0.2s",
                    textAlign: "center", lineHeight: 1.3,
                  }}
                >{fromFinal ? <>確定して<br/>戻る ▶</> : <>この車番で<br/>次へ ▶</>}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

}
