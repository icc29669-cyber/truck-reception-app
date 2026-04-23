"use client";
import { useRouter } from "next/navigation";
import { getKioskSession, setKioskSession } from "@/lib/kioskState";
import PlateDisplay from "@/components/PlateDisplay";

// 左から右（あ行→左端、わ行→右端）
const HIRA_ROWS: (string | null)[][] = [
  ["あ", "か", "さ", "た", "な", "は", "ま", "や", "ら", "わ"],
  ["い", "き", "し", "ち", "に", "ひ", "み",  null, "り", "を"],
  ["う", "く", "す", "つ", "ぬ", "ふ", "む", "ゆ", "る", "ん"],
  ["え", "け", "せ", "て", "ね", "へ", "め",  null, "れ",  null],
  ["お", "こ", "そ", "と", "の", "ほ", "も", "よ", "ろ",  null],
];

// ナンバープレートで使用不可の文字
const UNUSABLE = new Set(["し", "へ", "ん", "お"]);

// 事業用（緑ナンバー）英字
const ALPHA_KEYS = ["A", "C", "F", "H", "K", "L", "M", "P", "X", "Y"];

// 左=あ行 → 右=わ行
const COL_COLORS: { bg: string; border: string; shadow: string }[] = [
  { bg: "#EFF6FF", border: "#BFDBFE", shadow: "#93C5FD" }, // あ行
  { bg: "#F0FDF4", border: "#C6F6D5", shadow: "#A7F3D0" }, // か行
  { bg: "#FFFBEB", border: "#FDE68A", shadow: "#FCD34D" }, // さ行
  { bg: "#FFF7ED", border: "#FDE0C2", shadow: "#FDBA74" }, // た行
  { bg: "#FDF2F8", border: "#F5D0E0", shadow: "#F0ABCF" }, // な行
  { bg: "#FAF5FF", border: "#E4D5F7", shadow: "#C4B5FD" }, // は行
  { bg: "#F0FDFA", border: "#C2F5E9", shadow: "#99F6E4" }, // ま行
  { bg: "#F7FEE7", border: "#D9F99D", shadow: "#BEF264" }, // や行
  { bg: "#EEF2FF", border: "#C7D2FE", shadow: "#A5B4FC" }, // ら行
  { bg: "#F8FAFC", border: "#CBD5E1", shadow: "#94A3B8" }, // わ行
];

const COL_LABELS = ["あ", "か", "さ", "た", "な", "は", "ま", "や", "ら", "わ"];

// ヒント用の地名例
const HINTS = [
  { place: "所沢", hira: "と" },
  { place: "横浜", hira: "よ" },
  { place: "神戸", hira: "こ" },
  { place: "名古屋", hira: "な" },
  { place: "浦和", hira: "う" },
];

const BTN_W = 126;
const BTN_H = 104;
const GAP = 9;

export default function HiraPage() {
  const router = useRouter();
  const session = getKioskSession();

  function select(ch: string) {
    if (!ch || UNUSABLE.has(ch)) return;
    setKioskSession({ plate: { ...session.plate, hira: ch } });
    router.push("/kiosk/plate/number");
  }

  return (
    <div
      className="w-screen h-screen flex flex-col select-none overflow-hidden"
      style={{ background: "#f2f1ed" }}
    >
      {/* ━━ ヘッダー ━━ */}
      <div
        className="flex items-center justify-between px-8 flex-shrink-0"
        style={{ background: "#1a3a6b", height: 96 }}
      >
        <button
          onPointerDown={() => router.push("/kiosk/plate/classnum")}
          className="flex items-center justify-center font-bold rounded-2xl border-2 border-white text-white active:bg-blue-800 flex-shrink-0"
          style={{ height: 62, width: 240, fontSize: 24 }}
        >
          ◀ 分類番号へ戻る
        </button>
        <h1 className="flex-1 text-center text-white font-bold" style={{ fontSize: 38 }}>
          地名のひらがなを選んでください
        </h1>
        {/* PlateDisplay + ヒント（右側） */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
          <PlateDisplay plate={session.plate} highlight="hira" size="sm" />
          {/* ヒントカード（小） */}
          <div style={{
            background: "#FFFBEB",
            border: "2.5px solid #F59E0B",
            borderRadius: 12,
            padding: "10px 14px",
            minWidth: 180,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}>
            <div style={{ fontSize: 14, color: "#92400E", fontWeight: 800, marginBottom: 6, letterSpacing: "0.04em" }}>
              💡 地名の最初の文字
            </div>
            <div style={{ fontSize: 14, color: "#26251e", lineHeight: 1.9 }}>
              {HINTS.map(h => (
                <span key={h.place} style={{ display: "block" }}>
                  {h.place} →{" "}
                  <span style={{ fontWeight: 900, color: "#D97706" }}>「{h.hira}」</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ━━ コンテンツ ━━ */}
      <div className="flex-1 flex flex-col items-center px-8 pt-3 pb-3 gap-3 overflow-hidden">

        {/* ── グリッド + 英字 ── */}
        <div style={{ display: "flex", gap: 20, flexShrink: 0 }}>

          {/* ひらがなグリッド */}
          <div style={{ display: "flex", flexDirection: "column", gap: GAP }}>
            {HIRA_ROWS.map((row, ri) => (
              <div key={ri} style={{ display: "flex", gap: GAP }}>
                {row.map((ch, ci) => {
                  if (ch === null) {
                    return <div key={ci} style={{ width: BTN_W, height: BTN_H }} />;
                  }
                  // 使用不可文字は空白スペースとして非表示（タップ不可）
                  if (UNUSABLE.has(ch)) {
                    return <div key={ci} style={{ width: BTN_W, height: BTN_H }} />;
                  }
                  const col = COL_COLORS[ci];
                  const isTopRow = ri === 0;
                  return (
                    <button
                      key={ci}
                      onPointerDown={() => select(ch)}
                      className="active:translate-y-[4px]"
                      style={{
                        width: BTN_W,
                        height: BTN_H,
                        fontSize: 44,
                        fontWeight: isTopRow ? 900 : 700,
                        borderRadius: 14,
                        border: `2px solid ${col.border}`,
                        background: col.bg,
                        color: "#26251e",
                        boxShadow: `0 5px 0 ${col.shadow}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        position: "relative",
                        transition: "transform 75ms",
                        userSelect: "none",
                      }}
                    >
                      {ch}
                      {/* 行ラベル（先頭行） */}
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

          {/* ── 事業用（英字） ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 306, flexShrink: 0 }}>
            {/* ラベル */}
            <div style={{
              background: "#EFF6FF", border: "2px solid #BFDBFE",
              borderRadius: 12, padding: "10px 16px", textAlign: "center",
            }}>
              <p style={{ fontSize: 24, fontWeight: 800, color: "#1E40AF", margin: 0 }}>
                事業用（緑ナンバー）
              </p>
            </div>
            {/* 英字ボタン 2列 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: GAP }}>
              {ALPHA_KEYS.map((k) => (
                <button
                  key={k}
                  onPointerDown={() => select(k)}
                  className="active:translate-y-[4px]"
                  style={{
                    height: BTN_H,
                    fontSize: 34,
                    fontWeight: 800,
                    borderRadius: 14,
                    border: "2px solid #BFDBFE",
                    background: "#EFF6FF",
                    color: "#1E40AF",
                    boxShadow: "0 5px 0 #93C5FD",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "transform 75ms",
                    userSelect: "none",
                  }}
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
