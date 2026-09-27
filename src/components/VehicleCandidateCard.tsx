"use client";
import { useState } from "react";
import { detectPlateColor, COLOR_CONFIG } from "@/components/PlateDisplay";
import { formatPlate, type PlateInput, type VehicleCandidate } from "@/types/reception";
function MiniPlate({ plate, size = "md" }: { plate: PlateInput; size?: "sm" | "md" | "lg" }) {
  const color = detectPlateColor(plate.classNum, plate.hira);
  const { bg, text, dim, border } = COLOR_CONFIG[color];
  const pf = '"Hiragino Kaku Gothic ProN","Meiryo","MS Gothic",Arial,sans-serif';
  // ひらがな(r)は「視覚的ノイズにならない」よう数字よりかなり小さめに抑える
  const dims = size === "sm" ? { w: 200, h: 100, r: 28, c: 18, n: 42 }
             : size === "lg" ? { w: 480, h: 240, r: 40, c: 24, n: 90 }
             : { w: 320, h: 160, r: 32, c: 20, n: 64 };
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
                {ch !== null ? <span style={{ display: "inline-block", width: "0.6em", textAlign: "center" }}>{ch}</span> : <span style={{ display: "inline-block", width: "0.6em", textAlign: "center", opacity: 0.35 }}>・</span>}
              </span>
            );
          })}
        </span>
      </div>
    </div>
  );
}
export default function VehicleCard({
  candidate, isFirst, onSelect, onDelete,
}: {
  candidate: VehicleCandidate;
  isFirst: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <div className="w-full flex items-center gap-3">
      <button
        type="button"
        onClick={onSelect}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        onPointerCancel={() => setPressed(false)}
        className="flex-1 flex items-center text-left select-none touch-pan-y transition-all duration-75"
        style={{
          height: 140, borderRadius: 22,
          background: pressed ? "#EFF6FF" : "#fff",
          border: `2px solid ${pressed ? "#1565C0" : "#D1D5DB"}`,
          boxShadow: pressed ? "0 2px 8px rgba(21,101,192,0.18)" : "0 4px 14px rgba(0,0,0,0.09)",
          borderLeft: isFirst ? "6px solid #0d9488" : undefined,
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
          <span style={{ fontSize: 32, fontWeight: 900, color: "#26251e", letterSpacing: "0.06em" }}>
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
            color: "#0f766e", borderRadius: 8, padding: "4px 14px",
            marginRight: 20, flexShrink: 0,
        }}>最近</span>
      )}

        {/* 矢印 */}
        <span style={{ fontSize: 36, color: "#9CA3AF", flexShrink: 0 }}>▶</span>
      </button>

      {/* 削除ボタン */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="flex items-center justify-center select-none touch-pan-y active:scale-95 transition-transform flex-shrink-0"
        style={{
          width: 100, height: 60, borderRadius: 14,
          background: "#FEE2E2", border: "2px solid #FECACA",
          color: "#DC2626", fontSize: 22, fontWeight: 800,
        }}
      >
        削除
      </button>
    </div>
  );
}
