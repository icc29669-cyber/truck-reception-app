"use client";
import { useState, useEffect } from "react";
import type { PlateInput } from "@/types/reception";

// ━━ プレート色自動判定（truck-berth-appより移植）━━
export type PlateColor = "white" | "green" | "yellow" | "black";

export function detectPlateColor(num3: string, kana: string = ""): PlateColor {
  if (!num3) return "green";
  const numericStr = num3.replace(/[^0-9]/g, "");
  const n = parseInt(numericStr || "0", 10);
  const isKei =
    (n >= 480 && n <= 499) ||
    (n >= 580 && n <= 799) ||
    (n >= 880 && n <= 899);
  if (isKei) {
    if (kana === "り" || kana === "れ") return "black";
    return "yellow";
  }
  const jigyoKana = new Set(["あ", "い", "う", "え", "か", "き", "く", "け", "こ", "を"]);
  if (jigyoKana.has(kana)) return "green";
  if (!kana) {
    const first = num3[0];
    if (first === "1" || first === "2") return "green";
    return "white";
  }
  return "white";
}

export const COLOR_CONFIG: Record<PlateColor, {
  bg: string; text: string; dim: string; border: string; labelBg: string; labelText: string;
}> = {
  white:  { bg: "#f4f4f4", text: "#1a5c1a", dim: "rgba(26,92,26,0.30)",   border: "#2a7a2a", labelBg: "#1a5c1a", labelText: "#fff" },
  green:  { bg: "#1a6320", text: "#ffffff", dim: "rgba(255,255,255,0.38)", border: "#555",    labelBg: "#fff",    labelText: "#1a6320" },
  yellow: { bg: "#f5d800", text: "#111111", dim: "rgba(17,17,17,0.30)",    border: "#999",    labelBg: "#111",    labelText: "#f5d800" },
  black:  { bg: "#111111", text: "#f5d800", dim: "rgba(245,216,0,0.45)",   border: "#444",    labelBg: "#f5d800", labelText: "#111" },
};

// ━━ ハイフン付き4桁フォーマット ━━
function formatNum4(num4: string): React.ReactElement {
  const pf = '"Hiragino Kaku Gothic ProN","Meiryo","MS Gothic",Arial,sans-serif';
  return (
    <>
      {[0, 1, 2, 3].map((pos) => {
        const hasDigit = pos >= (4 - num4.length);
        const ch = hasDigit ? num4[pos - (4 - num4.length)] : null;
        const showHyphen = pos === 2 && num4.length >= 3;
        return (
          <span key={pos} style={{ display: "inline-flex", alignItems: "center" }}>
            {pos === 2 && (
              <span style={{ fontFamily: pf, fontWeight: 900, lineHeight: 1, visibility: num4.length >= 3 ? "visible" : "hidden" }}>-</span>
            )}
            {ch !== null
              ? <span style={{ display: "inline-block", width: "0.6em", textAlign: "center", fontFamily: pf, fontWeight: 900, lineHeight: 1 }}>{ch}</span>
              : <span style={{ display: "inline-block", width: "0.6em", textAlign: "center", fontFamily: pf, fontWeight: 900, opacity: 0.35, lineHeight: 1 }}>・</span>
            }
          </span>
        );
      })}
    </>
  );
}

// ━━ プレート本体描画 ━━
interface PlateBodyProps {
  area: string; num3: string; kana: string; num4: string;
  color: PlateColor;
  highlightPart?: keyof PlateInput;
  width?: number; height?: number;
}

function PlateBody({ area, num3, kana, num4, color, highlightPart, width = 320, height = 160 }: PlateBodyProps) {
  const { bg, text, dim, border } = COLOR_CONFIG[color];
  const pf = '"Hiragino Kaku Gothic ProN","Meiryo","MS Gothic",Arial,sans-serif';

  const areaDisp = area || "地名";
  const num3Disp = num3 || "・・・";
  const kanaDisp = kana || "あ";

  const hl = (part: keyof PlateInput): React.CSSProperties =>
    highlightPart === part
      ? { boxShadow: "0 0 0 2px #fff, 0 0 0 6px #ffe600", borderRadius: 4, padding: "1px 4px", background: "rgba(255,230,0,0.25)" }
      : { padding: "1px 4px" };

  const scale = width / 320;
  const hScale = height / 160;
  const s = Math.min(scale, hScale);

  return (
    <div style={{
      width, height,
      background: bg,
      border: `${Math.round(5 * s)}px solid ${border}`,
      borderRadius: Math.round(8 * s),
      display: "flex", flexDirection: "column",
      padding: Math.round(3 * s),
      boxSizing: "border-box",
      overflow: "visible",
      boxShadow: `0 ${Math.round(6*s)}px ${Math.round(16*s)}px rgba(0,0,0,0.35)`,
    }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: `${4*s}px ${14*s}px ${6*s}px`, boxSizing: "border-box" }}>
        {/* 上段：地名＋分類番号 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6*s, flexShrink: 0 }}>
          <span style={{
            fontSize: 26*s, fontWeight: 900, fontFamily: pf,
            letterSpacing: 2, color: area ? text : dim,
            display: "inline-block", ...hl("region"),
          }}>{areaDisp}</span>
          <span style={{
            fontSize: 26*s, fontWeight: 900, fontFamily: pf,
            letterSpacing: 4, color: num3 ? text : dim,
            display: "inline-block", ...hl("classNum"),
          }}>{num3Disp}</span>
        </div>
        {/* 下段：ひらがな（左）＋4桁（右） */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", position: "relative" }}>
          <span style={{
            position: "absolute", left: 0,
            fontSize: 40*s, fontWeight: 900, fontFamily: pf,
            color: kana ? text : dim, lineHeight: 1,
            display: "inline-block", ...hl("hira"),
          }}>{kanaDisp}</span>
          <div style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            paddingLeft: 32*s, transform: "scaleX(0.85)", transformOrigin: "center",
          }}>
            <span style={{
              display: "inline-flex", alignItems: "center",
              fontSize: 72*s,
              color: num4 ? text : dim,
              ...(highlightPart === "number"
                ? { boxShadow: "0 0 0 2px #fff, 0 0 0 6px #ffe600", borderRadius: 4, padding: "1px 4px", background: "rgba(255,230,0,0.25)" }
                : {}),
            }}>
              {formatNum4(num4)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ━━ 外部公開コンポーネント ━━
interface Props {
  plate: PlateInput;
  highlight?: keyof PlateInput;
  size?: "sm" | "lg" | "xl";
}

export default function PlateDisplay({ plate, highlight, size = "lg" }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const dims = {
    sm: { width: 260,  height: 130 },
    lg: { width: 380,  height: 190 },
    xl: { width: 520,  height: 260 },
  }[size];

  if (!mounted) {
    return <div style={{ width: dims.width, height: dims.height, borderRadius: 8, background: "#1a6320" }} />;
  }

  const color = detectPlateColor(plate.classNum, plate.hira);
  return (
    <PlateBody
      area={plate.region}
      num3={plate.classNum}
      kana={plate.hira}
      num4={plate.number}
      color={color}
      highlightPart={highlight}
      width={dims.width}
      height={dims.height}
    />
  );
}

// ━━ 文字列から表示用（final-confirm / complete など）━━
export function PlateViewFromString({ value, size = "lg" }: { value: string; size?: "sm" | "lg" | "xl" }) {
  // "多摩 500 あ 7917" → parts
  const parts = value.trim().split(/\s+/);
  const plate: PlateInput = {
    region:   parts[0] ?? "",
    classNum: parts[1] ?? "",
    hira:     parts[2] ?? "",
    number:   parts[3] ?? "",
  };
  return <PlateDisplay plate={plate} size={size} />;
}
