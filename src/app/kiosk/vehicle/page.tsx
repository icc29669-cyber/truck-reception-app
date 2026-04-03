"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getKioskSession, setKioskSession } from "@/lib/kioskState";
import { detectPlateColor, COLOR_CONFIG } from "@/components/PlateDisplay";
import { formatPlate } from "@/types/reception";
import type { VehicleCandidate, PlateInput } from "@/types/reception";

type Mode = "select" | "confirm" | "input";
type PlateSection = "region" | "classNum" | "hira" | "number";

/* ━━ ステップインジケーター ━━ */
function StepDots({ current }: { current: number }) {
  const labels = ["電話番号", "お名前", "車　両", "最終確認"];
  return (
    <div className="flex items-center gap-3 flex-shrink-0">
      {labels.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <div key={i} className="flex items-center gap-3">
            <div className="flex flex-col items-center" style={{ minWidth: 64 }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: done ? "#4ade80" : active ? "#fff" : "rgba(255,255,255,0.25)",
                border: `3px solid ${done ? "#4ade80" : active ? "#fff" : "rgba(255,255,255,0.4)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, fontWeight: 900,
                color: done ? "#166534" : active ? "#1e3a6b" : "rgba(255,255,255,0.5)",
              }}>
                {done ? "✓" : step}
              </div>
              <span style={{
                fontSize: 13, fontWeight: 700, marginTop: 2,
                color: active ? "#fff" : done ? "#bbf7d0" : "rgba(255,255,255,0.4)",
                whiteSpace: "nowrap",
              }}>{label}</span>
            </div>
            {i < labels.length - 1 && (
              <div style={{
                width: 48, height: 2,
                background: done ? "#4ade80" : "rgba(255,255,255,0.2)",
                marginBottom: 18,
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ━━ プレート表示（小型） ━━ */
function MiniPlate({ plate, size = "md" }: { plate: PlateInput; size?: "sm" | "md" | "lg" }) {
  const color = detectPlateColor(plate.classNum, plate.hira);
  const { bg, text, dim, border } = COLOR_CONFIG[color];
  const pf = '"Hiragino Kaku Gothic ProN","Meiryo","MS Gothic",Arial,sans-serif';
  const dims = size === "sm" ? { w: 200, h: 100, r: 36, c: 18, n: 42 }
             : size === "lg" ? { w: 480, h: 240, r: 52, c: 24, n: 90 }
             : { w: 320, h: 160, r: 42, c: 20, n: 64 };
  const { w, h, r, c, n } = dims;
  const len = plate.number.length;
  return (
    <div style={{
      width: w, height: h, background: bg, border: `4px solid ${border}`,
      borderRadius: 10, display: "flex", flexDirection: "column",
      padding: "6px 14px 8px", boxSizing: "border-box", userSelect: "none",
      boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <span style={{ fontSize: c, fontWeight: 900, fontFamily: pf, color: plate.region ? text : dim }}>
          {plate.region || "地名"}
        </span>
        <span style={{ fontSize: c, fontWeight: 900, fontFamily: pf, letterSpacing: 2, color: plate.classNum ? text : dim }}>
          {plate.classNum || "・・・"}
        </span>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", position: "relative" }}>
        <span style={{ position: "absolute", left: 0, fontSize: r, fontWeight: 900, fontFamily: pf, color: plate.hira ? text : dim, lineHeight: 1 }}>
          {plate.hira || "あ"}
        </span>
        <span style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          paddingLeft: r + 4, fontSize: n, color: plate.number ? text : dim,
          transform: "scaleX(0.85)", transformOrigin: "center", fontFamily: pf, fontWeight: 900,
        }}>
          {[0, 1, 2, 3].map(pos => {
            const hasDigit = pos >= (4 - len);
            const ch = hasDigit ? plate.number[pos - (4 - len)] : null;
            return (
              <span key={pos} style={{ display: "inline-flex", alignItems: "center" }}>
                {pos === 2 && <span style={{ visibility: len >= 3 ? "visible" : "hidden" }}>-</span>}
                {ch !== null ? <span>{ch}</span> : <span style={{ opacity: 0.35 }}>・</span>}
              </span>
            );
          })}
        </span>
      </div>
    </div>
  );
}

/* ━━ 候補選択カード ━━ */
function VehicleCard({
  candidate, isFirst, onSelect,
}: {
  candidate: VehicleCandidate;
  isFirst: boolean;
  onSelect: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onPointerDown={() => { setPressed(true); onSelect(); }}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className="w-full flex items-center text-left select-none touch-none transition-all duration-75"
      style={{
        height: 160, borderRadius: 14,
        background: pressed ? "#EFF6FF" : "#fff",
        border: `2px solid ${pressed ? "#1565C0" : "#D1D5DB"}`,
        boxShadow: pressed ? "0 2px 8px rgba(21,101,192,0.18)" : "0 4px 14px rgba(0,0,0,0.09)",
        borderLeft: isFirst ? "6px solid #16a34a" : undefined,
        paddingLeft: isFirst ? 26 : 32,
        paddingRight: 28,
      }}
    >
      {/* プレート */}
      <div className="flex-shrink-0 mr-8">
        <MiniPlate plate={candidate.plate} size="sm" />
      </div>

      {/* テキスト情報 */}
      <div className="flex flex-col flex-1">
        <span style={{ fontSize: 32, fontWeight: 900, color: "#111827", letterSpacing: "0.06em" }}>
          {formatPlate(candidate.plate) || candidate.vehicleNumber}
        </span>
        <span style={{ fontSize: 28, fontWeight: 600, color: "#6B7280", marginTop: 6 }}>
          最大積載量　{candidate.maxLoad ? Number(candidate.maxLoad).toLocaleString() + " kg" : "未登録"}
        </span>
      </div>

      {/* 最近バッジ */}
      {isFirst && (
        <span style={{
          fontSize: 20, fontWeight: 800, background: "#dcfce7",
          color: "#166534", borderRadius: 8, padding: "4px 14px",
          marginRight: 20, flexShrink: 0,
        }}>最近</span>
      )}

      {/* 矢印 */}
      <span style={{ fontSize: 36, color: "#9CA3AF", flexShrink: 0 }}>▶</span>
    </button>
  );
}

/* ━━ プレート入力パネル（BigPlate + セクション入力）━━ */
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
  ["わ","ら","や","ま","は","な","た","さ","か","あ"],
  ["を","り",null,"み","ひ","に","ち","し","き","い"],
  ["ん","る","ゆ","む","ふ","ぬ","つ","す","く","う"],
  [null,"れ",null,"め","へ","ね","て","せ","け","え"],
  [null,"ろ","よ","も","ほ","の","と","そ","こ","お"],
];
const HIRA_UNUSABLE = new Set(["し","へ","ん","お"]);
const HIRA_JIGYOYO = new Set(["あ","い","う","え","か","き","く","け","こ","を"]);
const HIRA_RENTAL  = new Set(["わ","れ"]);
const ALPHA_KEYS   = ["A","C","F","H","K","L","M","P","X","Y"];

function PlateInputPanel({
  plate, onChange, onDone,
}: {
  plate: PlateInput;
  onChange: (p: Partial<PlateInput>) => void;
  onDone: () => void;
}) {
  const [section, setSection] = useState<PlateSection>(() => {
    if (!plate.region) return "region";
    if (!plate.classNum) return "classNum";
    if (!plate.hira) return "hira";
    return "number";
  });
  const [kanaFilter, setKanaFilter] = useState<string | null>(null);
  const color = detectPlateColor(plate.classNum, plate.hira);
  const { bg, text, dim, border } = COLOR_CONFIG[color];
  const pf = '"Hiragino Kaku Gothic ProN","Meiryo","MS Gothic",Arial,sans-serif';
  const len = plate.number.length;

  const hl = (s: PlateSection): React.CSSProperties => section === s
    ? { outline: "4px solid #FFE600", outlineOffset: 3, borderRadius: 8, background: "rgba(255,230,0,0.18)", cursor: "pointer" }
    : { borderRadius: 8, cursor: "pointer" };

  const numBtnStyle = "flex items-center justify-center font-black rounded-xl border-2 border-gray-200 bg-white text-gray-900 active:bg-gray-100 shadow-[0_4px_0_#BDBDBD] active:shadow-[0_1px_0_#BDBDBD] active:translate-y-[3px] transition-all duration-75 select-none touch-none";

  const sectionLabels: Record<PlateSection, string> = {
    region: "① 地名", classNum: "② 分類番号", hira: "③ ひらがな", number: "④ 4桁番号",
  };
  const sectionColors: Record<PlateSection, string> = {
    region: "#1565C0", classNum: "#BF360C", hira: "#4A148C", number: "#1B5E20",
  };

  const plateFilled = plate.region && plate.classNum && plate.hira && plate.number.length === 4;

  return (
    <div className="flex gap-5 h-full">
      {/* BigPlate */}
      <div className="flex flex-col items-center justify-center flex-shrink-0" style={{ width: 520 }}>
        <div style={{
          width: 500, height: 250, background: bg, border: `6px solid ${border}`,
          borderRadius: 14, boxShadow: "0 10px 32px rgba(0,0,0,0.35)",
          display: "flex", flexDirection: "column", padding: "10px 22px 14px",
          boxSizing: "border-box", userSelect: "none",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <div onPointerDown={() => setSection("region")} style={hl("region")}>
              <span style={{ fontSize: 40, fontWeight: 900, fontFamily: pf, color: plate.region ? text : dim }}>
                {plate.region || "地名"}
              </span>
            </div>
            <div onPointerDown={() => setSection("classNum")} style={hl("classNum")}>
              <span style={{ fontSize: 40, fontWeight: 900, fontFamily: pf, letterSpacing: 4, color: plate.classNum ? text : dim }}>
                {plate.classNum || "・・・"}
              </span>
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", position: "relative" }}>
            <div onPointerDown={() => setSection("hira")} style={{ position: "absolute", left: 0, ...hl("hira") }}>
              <span style={{ fontSize: 58, fontWeight: 900, fontFamily: pf, color: plate.hira ? text : dim, lineHeight: 1 }}>
                {plate.hira || "あ"}
              </span>
            </div>
            <div onPointerDown={() => setSection("number")}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", paddingLeft: 60, transform: "scaleX(0.85)", transformOrigin: "center", ...hl("number") }}>
              <span style={{ fontSize: 106, color: plate.number ? text : dim }}>
                {[0, 1, 2, 3].map(pos => {
                  const hasDigit = pos >= (4 - len);
                  const ch = hasDigit ? plate.number[pos - (4 - len)] : null;
                  return (
                    <span key={pos} style={{ display: "inline-flex", alignItems: "center" }}>
                      {pos === 2 && <span style={{ visibility: len >= 3 ? "visible" : "hidden" }}>-</span>}
                      {ch !== null ? <span>{ch}</span> : <span style={{ opacity: 0.35 }}>・</span>}
                    </span>
                  );
                })}
              </span>
            </div>
          </div>
        </div>
        <p style={{ marginTop: 10, fontSize: 16, color: "rgba(0,0,0,0.4)", fontWeight: 600 }}>
          各部分をタッチして切り替え
        </p>
        {plateFilled && (
          <button
            onPointerDown={onDone}
            className="flex items-center justify-center font-black rounded-2xl text-white select-none touch-none mt-4"
            style={{ height: 80, width: 460, fontSize: 32, background: "linear-gradient(180deg,#16a34a,#166534)", boxShadow: "0 5px 0 #14532d" }}
          >
            この車番で次へ　▶
          </button>
        )}
      </div>

      {/* セクション入力パネル */}
      <div className="flex flex-col overflow-hidden flex-1" style={{ maxWidth: 960 }}>
        {/* バナー */}
        <div className="flex items-center px-6 flex-shrink-0" style={{
          height: 72, background: sectionColors[section], boxShadow: "0 4px 0 rgba(0,0,0,0.2)",
        }}>
          <span style={{ fontSize: 30, fontWeight: 900, color: "#fff" }}>{sectionLabels[section]}</span>
        </div>
        {/* パネル */}
        <div className="flex-1 overflow-y-auto p-4">

          {/* 地名 */}
          {section === "region" && (
            kanaFilter === null ? (
              <div>
                <p style={{ fontSize: 20, fontWeight: 700, color: "#475569", marginBottom: 10 }}>頭文字を選んでください</p>
                <div className="flex flex-col gap-2">
                  {KANA_ROWS.map((row, ri) => (
                    <div key={ri} className="flex gap-2">
                      {row.map((k, ci) => k === null
                        ? <div key={ci} style={{ width: 64, height: 64 }} />
                        : <button key={ci} onPointerDown={() => setKanaFilter(k)}
                            className="flex items-center justify-center font-bold rounded-xl border-2 border-gray-200 bg-white text-gray-800 active:bg-blue-50 shadow-[0_3px_0_#BDBDBD] active:translate-y-[2px] transition-all"
                            style={{ width: 64, height: 64, fontSize: 26 }}>{k}</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <button onPointerDown={() => setKanaFilter(null)}
                    className="flex items-center justify-center font-bold rounded-xl border-2 border-gray-300 bg-white active:bg-gray-100"
                    style={{ height: 48, padding: "0 20px", fontSize: 20 }}>← 戻る</button>
                  <span style={{ fontSize: 20, fontWeight: 700, color: "#475569" }}>「{kanaFilter}」から始まる地名</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {(REGION_MAP[kanaFilter] || []).map(r => (
                    <button key={r} onPointerDown={() => { onChange({ region: r }); setKanaFilter(null); setTimeout(() => setSection("classNum"), 100); }}
                      className="flex items-center justify-center font-black rounded-xl border-2 border-gray-200 bg-white active:bg-blue-50 shadow-[0_3px_0_#BDBDBD] active:translate-y-[2px] transition-all"
                      style={{ height: 72, padding: "0 24px", fontSize: 30, minWidth: 120 }}>{r}</button>
                  ))}
                </div>
              </div>
            )
          )}

          {/* 分類番号 */}
          {section === "classNum" && (
            <div className="flex flex-col gap-3">
              <div style={{ fontSize: 48, fontWeight: 900, fontFamily: pf, letterSpacing: 6, color: plate.classNum ? "#1e293b" : "#94a3b8", minHeight: 56 }}>
                {plate.classNum || "・・・"}
              </div>
              <div className="flex flex-col gap-2">
                {[["1","2","3"],["4","5","6"],["7","8","9"]].map((row, ri) => (
                  <div key={ri} className="flex gap-2">
                    {row.map(k => (
                      <button key={k} onPointerDown={() => { if (plate.classNum.length < 3) { const n = plate.classNum + k; onChange({ classNum: n }); if (n.length === 3) setTimeout(() => setSection("hira"), 150); } }}
                        className={numBtnStyle} style={{ width: 100, height: 100, fontSize: 40 }}>{k}</button>
                    ))}
                  </div>
                ))}
                <div className="flex gap-2">
                  <button onPointerDown={() => { if (plate.classNum.length < 3) { const n = plate.classNum + "0"; onChange({ classNum: n }); if (n.length === 3) setTimeout(() => setSection("hira"), 150); } }}
                    className={numBtnStyle} style={{ width: 214, height: 100, fontSize: 40 }}>0</button>
                  <button onPointerDown={() => onChange({ classNum: plate.classNum.slice(0, -1) })}
                    className="flex items-center justify-center font-bold rounded-xl border-2 border-orange-400 bg-orange-400 text-white active:bg-orange-500 shadow-[0_4px_0_#C2410C] active:translate-y-[3px] transition-all select-none touch-none"
                    style={{ width: 100, height: 100, fontSize: 24 }}>消す</button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {ALPHA_KEYS.map(k => (
                    <button key={k} onPointerDown={() => { if (plate.classNum.length < 3) { const n = plate.classNum + k; onChange({ classNum: n }); if (n.length === 3) setTimeout(() => setSection("hira"), 150); } }}
                      className={numBtnStyle} style={{ width: 80, height: 72, fontSize: 28 }}>{k}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ひらがな */}
          {section === "hira" && (
            <div>
              <div className="flex gap-3 mb-2 flex-wrap" style={{ fontSize: 16, fontWeight: 700 }}>
                <span style={{ color: "#2563eb" }}>■ 事業用(緑)</span>
                <span style={{ color: "#ea580c" }}>■ レンタカー</span>
                <span style={{ color: "#94a3b8" }}>■ 使用不可</span>
              </div>
              <div className="flex flex-col gap-2">
                {KANA_ROWS.map((row, ri) => (
                  <div key={ri} className="flex gap-2">
                    {row.map((k, ci) => k === null
                      ? <div key={ci} style={{ width: 72, height: 72 }} />
                      : (() => {
                          const unusable = HIRA_UNUSABLE.has(k);
                          const jigyoyo = HIRA_JIGYOYO.has(k);
                          const rental = HIRA_RENTAL.has(k);
                          return (
                            <button key={ci} disabled={unusable}
                              onPointerDown={() => { if (!unusable) { onChange({ hira: k }); setTimeout(() => setSection("number"), 120); } }}
                              className="flex items-center justify-center font-bold rounded-xl border-2 transition-all shadow-[0_3px_0_#BDBDBD] active:translate-y-[2px] select-none touch-none"
                              style={{
                                width: 72, height: 72, fontSize: 26,
                                background: unusable ? "#e2e8f0" : jigyoyo ? "#dbeafe" : rental ? "#ffedd5" : "white",
                                borderColor: unusable ? "#cbd5e1" : jigyoyo ? "#93c5fd" : rental ? "#fb923c" : "#e2e8f0",
                                color: unusable ? "#94a3b8" : jigyoyo ? "#1d4ed8" : rental ? "#ea580c" : "#1e293b",
                                opacity: unusable ? 0.4 : 1,
                              }}>{k}</button>
                          );
                        })()
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4桁番号 */}
          {section === "number" && (
            <div className="flex flex-col gap-3">
              <div style={{ fontSize: 72, fontWeight: 900, fontFamily: pf, color: plate.number ? "#1e293b" : "#94a3b8", minHeight: 80, letterSpacing: 4 }}>
                {plate.number || "・・・・"}
              </div>
              <div className="flex flex-col gap-2">
                {[["1","2","3"],["4","5","6"],["7","8","9"]].map((row, ri) => (
                  <div key={ri} className="flex gap-2">
                    {row.map(k => (
                      <button key={k} onPointerDown={() => { if (plate.number.length < 4) onChange({ number: plate.number + k }); }}
                        className={numBtnStyle} style={{ width: 100, height: 100, fontSize: 40 }}>{k}</button>
                    ))}
                  </div>
                ))}
                <div className="flex gap-2">
                  <button onPointerDown={() => { if (plate.number.length < 4) onChange({ number: plate.number + "0" }); }}
                    className={numBtnStyle} style={{ width: 214, height: 100, fontSize: 40 }}>0</button>
                  <button onPointerDown={() => onChange({ number: plate.number.slice(0, -1) })}
                    className="flex items-center justify-center font-bold rounded-xl border-2 border-orange-400 bg-orange-400 text-white active:bg-orange-500 shadow-[0_4px_0_#C2410C] active:translate-y-[3px] transition-all select-none touch-none"
                    style={{ width: 100, height: 100, fontSize: 24 }}>消す</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ━━ 最大積載量入力パネル ━━ */
function MaxLoadPanel({ value, onChange, onNext }: {
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
}) {
  const numBtnBase = "flex items-center justify-center font-black rounded-xl border-2 border-gray-200 bg-white text-gray-900 shadow-[0_4px_0_#BDBDBD] active:shadow-[0_1px_0_#BDBDBD] active:translate-y-[3px] transition-all duration-75 select-none touch-none";
  return (
    <div className="h-full flex items-center justify-center gap-16 px-12">
      {/* 左：説明＋表示 */}
      <div className="flex flex-col gap-5 flex-shrink-0" style={{ width: 400 }}>
        <p style={{ fontSize: 26, fontWeight: 700, color: "#475569", lineHeight: 1.5 }}>
          最大積載量を<br />入力してください
        </p>
        <div style={{
          background: value ? "#FFF9C4" : "#f8fafc",
          border: `3px solid ${value ? "#F59E0B" : "#e2e8f0"}`,
          borderRadius: 16, padding: "16px 28px",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{ fontSize: 80, fontWeight: 900, color: value ? "#1e293b" : "#94a3b8" }}>
            {value ? Number(value).toLocaleString() : "0"}
          </span>
          <span style={{ fontSize: 40, fontWeight: 700, color: "#64748b" }}>kg</span>
        </div>
      </div>
      {/* 右：テンキー */}
      <div className="flex gap-4 flex-shrink-0">
        <div className="flex flex-col gap-3">
          {[["1","2","3"],["4","5","6"],["7","8","9"]].map((row, ri) => (
            <div key={ri} className="flex gap-3">
              {row.map(k => (
                <button key={k} onPointerDown={() => { if (value.length < 6) onChange(value + k); }}
                  className={numBtnBase} style={{ width: 156, height: 122, fontSize: 54 }}>{k}</button>
              ))}
            </div>
          ))}
          <button onPointerDown={() => { if (value.length < 6) onChange(value + "0"); }}
            className={numBtnBase} style={{ width: 492, height: 122, fontSize: 54 }}>0</button>
        </div>
        <div className="flex flex-col gap-3">
          <button onPointerDown={() => onChange("")}
            className="flex items-center justify-center font-bold rounded-xl border-2 border-red-500 bg-red-500 text-white active:bg-red-600 shadow-[0_4px_0_#B91C1C] active:translate-y-[3px] transition-all select-none touch-none"
            style={{ width: 172, height: 122, fontSize: 22, textAlign: "center", lineHeight: 1.3 }}>
            すべて<br />消す
          </button>
          <button onPointerDown={() => onChange(value.slice(0, -1))}
            className="flex items-center justify-center font-bold rounded-xl border-2 border-orange-400 bg-orange-400 text-white active:bg-orange-500 shadow-[0_4px_0_#C2410C] active:translate-y-[3px] transition-all select-none touch-none"
            style={{ width: 172, height: 122, fontSize: 22, textAlign: "center", lineHeight: 1.3 }}>
            1文字<br />消す
          </button>
          <button onPointerDown={() => { if (value) onNext(); }}
            className="flex items-center justify-center font-black rounded-xl border-2 border-green-700 bg-green-600 text-white active:bg-green-700 shadow-[0_4px_0_#14532D] active:translate-y-[3px] transition-all select-none touch-none"
            style={{ width: 172, height: 252, fontSize: 40 }}>OK</button>
        </div>
      </div>
    </div>
  );
}

/* ━━ メインページ ━━ */
export default function VehiclePage() {
  const router = useRouter();
  const initRef = useRef(false);

  const [mode, setMode] = useState<Mode>("select");
  const [candidates, setCandidates] = useState<VehicleCandidate[]>([]);
  const [confirmTarget, setConfirmTarget] = useState<VehicleCandidate | null>(null);

  // 入力モード
  const [plate, setPlate] = useState<PlateInput>({ region: "", classNum: "", hira: "", number: "" });
  const [maxLoad, setMaxLoad] = useState("");
  const [inputStep, setInputStep] = useState<"plate" | "maxload">("plate");

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const s = getKioskSession();
    setCandidates(s.vehicleCandidates ?? []);
    setPlate(s.plate ?? { region: "", classNum: "", hira: "", number: "" });
    setMaxLoad(s.driverInput?.maxLoad ?? "");
    const n = s.vehicleCandidates?.length ?? 0;
    if (n === 0) {
      setMode("input");
    } else if (n === 1) {
      setConfirmTarget(s.vehicleCandidates[0]);
      setMode("confirm");
    } else {
      setMode("select");
    }
    setMounted(true);
  }, []);

  function selectCandidate(c: VehicleCandidate) {
    const s = getKioskSession();
    setKioskSession({
      selectedVehicle: c,
      plate: c.plate,
      driverInput: { ...s.driverInput, maxLoad: c.maxLoad },
    });
    router.push("/kiosk/final-confirm");
  }

  function savePlate(partial: Partial<PlateInput>) {
    const next = { ...plate, ...partial };
    setPlate(next);
    setKioskSession({ plate: next });
  }

  function saveMaxLoad(v: string) {
    if (v.length > 6) return;
    setMaxLoad(v);
    const s = getKioskSession();
    setKioskSession({ driverInput: { ...s.driverInput, maxLoad: v } });
  }

  function submitInput() {
    const s = getKioskSession();
    setKioskSession({
      selectedVehicle: null,
      plate,
      driverInput: { ...s.driverInput, maxLoad },
    });
    router.push("/kiosk/final-confirm");
  }

  const plateStr = formatPlate(plate);
  const bgStyle = "linear-gradient(160deg, #E8F4FD 0%, #D0E8FA 50%, #B8D8F6 100%)";

  if (!mounted) return <div className="w-screen h-screen" style={{ background: "#1e3a5f" }} />;

  return (
    <div className="w-screen h-screen flex flex-col select-none overflow-hidden" style={{ background: bgStyle }}>

      {/* ━━ ヘッダー ━━ */}
      <div className="flex items-center flex-shrink-0 px-8 gap-6"
        style={{ background: "linear-gradient(90deg,#1a3a6b 0%,#1E5799 100%)", height: 100 }}>
        <button
          onPointerDown={() => router.push("/kiosk/person")}
          className="flex items-center justify-center font-bold rounded-2xl border-2 border-white text-white active:bg-blue-800 flex-shrink-0"
          style={{ height: 70, width: 180, fontSize: 28 }}
        >◀ 戻る</button>
        <h1 className="flex-1 font-bold text-white text-center" style={{ fontSize: 40 }}>
          {mode === "select" ? "ご使用の車両を選んでください" :
           mode === "confirm" ? "車両の確認" :
           inputStep === "plate" ? "車両ナンバーを入力" : "最大積載量を入力"}
        </h1>
        <StepDots current={3} />
      </div>

      {/* ━━ メインコンテンツ ━━ */}
      <div className="flex-1 overflow-hidden">

        {/* ── 選択モード ── */}
        {mode === "select" && (
          <div className="h-full flex flex-col px-10 pt-8 pb-6 gap-4">
            <p style={{ fontSize: 28, fontWeight: 600, color: "#374151", flexShrink: 0 }}>
              以前ご使用の車両記録が見つかりました。今回ご使用の車両をタップしてください。
            </p>
            <div className="flex flex-col gap-4 flex-shrink-0">
              {candidates.slice(0, 4).map((c, i) => (
                <VehicleCard key={c.id} candidate={c} isFirst={i === 0} onSelect={() => selectCandidate(c)} />
              ))}
            </div>
            <div className="flex-1 flex items-end">
              <button
                onPointerDown={() => setMode("input")}
                className="w-full flex items-center justify-center gap-3 font-bold rounded-2xl active:bg-blue-50 transition-all select-none touch-none"
                style={{
                  height: 100, border: "2px dashed #1565C0",
                  background: "rgba(255,255,255,0.7)", color: "#1565C0", fontSize: 32,
                }}
              >
                <span style={{ fontSize: 40 }}>＋</span>
                一覧にない場合は新しく入力する
              </button>
            </div>
          </div>
        )}

        {/* ── 確認モード（候補1件）── */}
        {mode === "confirm" && confirmTarget && (
          <div className="h-full flex flex-col items-center justify-center px-10 gap-8">
            {/* 確認カード */}
            <div style={{
              width: 1200, borderRadius: 20,
              border: "3px solid #16a34a", background: "#fff",
              boxShadow: "0 12px 48px rgba(0,0,0,0.14)", overflow: "hidden",
            }}>
              <div style={{
                background: "linear-gradient(90deg,#166534,#16a34a)",
                padding: "20px 40px", display: "flex", alignItems: "center", gap: 16,
              }}>
                <span style={{ fontSize: 36, color: "#fff" }}>✓</span>
                <span style={{ fontSize: 32, fontWeight: 800, color: "#fff" }}>
                  以前ご使用の車両記録があります
                </span>
              </div>
              <div style={{ padding: "32px 48px", display: "flex", alignItems: "center", gap: 48 }}>
                <MiniPlate plate={confirmTarget.plate} size="md" />
                <div className="flex flex-col gap-4">
                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <span style={{ fontSize: 24, fontWeight: 600, color: "#9CA3AF", width: 200 }}>車番</span>
                    <span style={{ fontSize: 40, fontWeight: 900, color: "#111827" }}>
                      {formatPlate(confirmTarget.plate) || confirmTarget.vehicleNumber}
                    </span>
                  </div>
                  <div style={{ height: 1, background: "#E5E7EB" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <span style={{ fontSize: 24, fontWeight: 600, color: "#9CA3AF", width: 200 }}>最大積載量</span>
                    <span style={{ fontSize: 40, fontWeight: 900, color: "#111827" }}>
                      {confirmTarget.maxLoad ? Number(confirmTarget.maxLoad).toLocaleString() + " kg" : "未登録"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-8" style={{ width: 1200 }}>
              <button
                onPointerDown={() => selectCandidate(confirmTarget)}
                className="flex-1 flex items-center justify-center gap-4 font-black rounded-2xl text-white active:brightness-90 select-none touch-none"
                style={{
                  height: 132, fontSize: 44,
                  background: "linear-gradient(180deg,#16a34a,#166534)",
                  boxShadow: "0 6px 0 #14532d, 0 8px 24px rgba(22,163,74,0.4)",
                }}
              >
                <span style={{ fontSize: 48 }}>✓</span>
                はい、この車両で続けます
              </button>
              <button
                onPointerDown={() => setMode("input")}
                className="flex items-center justify-center gap-3 font-bold rounded-2xl active:bg-red-50 select-none touch-none"
                style={{ height: 132, minWidth: 380, fontSize: 32, border: "2px solid #DC2626", background: "#fff", color: "#DC2626" }}
              >
                <span style={{ fontSize: 36 }}>✎</span>
                違います・修正する
              </button>
            </div>
          </div>
        )}

        {/* ── 入力モード：プレート ── */}
        {mode === "input" && inputStep === "plate" && (
          <div className="h-full overflow-hidden p-4">
            <PlateInputPanel
              plate={plate}
              onChange={savePlate}
              onDone={() => setInputStep("maxload")}
            />
          </div>
        )}

        {/* ── 入力モード：最大積載量 ── */}
        {mode === "input" && inputStep === "maxload" && (
          <div className="h-full overflow-hidden">
            <div className="h-full flex flex-col">
              {/* 車番サマリー */}
              <div className="flex items-center gap-4 px-8 py-3 flex-shrink-0"
                style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                <span style={{ fontSize: 22, fontWeight: 700, color: "#6B7280" }}>入力した車番：</span>
                <MiniPlate plate={plate} size="sm" />
                <span style={{ fontSize: 30, fontWeight: 900, color: "#111827" }}>{plateStr}</span>
                <button
                  onPointerDown={() => setInputStep("plate")}
                  style={{ marginLeft: "auto", fontSize: 20, color: "#1565C0", fontWeight: 700, textDecoration: "underline" }}
                >修正する</button>
              </div>
              <div className="flex-1">
                <MaxLoadPanel value={maxLoad} onChange={saveMaxLoad} onNext={submitInput} />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
