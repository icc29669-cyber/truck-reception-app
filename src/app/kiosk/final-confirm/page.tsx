"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getKioskSession, setKioskSession, clearKioskSession } from "@/lib/kioskState";
import { registerReception } from "@/lib/api";
import { formatPlate } from "@/types/reception";
import { detectPlateColor, COLOR_CONFIG } from "@/components/PlateDisplay";
import type { PlateInput } from "@/types/reception";

function fmtPhone(d: string): string {
  if (!d) return "";
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

/* ━━ ステップドット ━━ */
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

/* ━━ プレート表示（中） ━━ */
function PlateView({ plate }: { plate: PlateInput }) {
  const color = detectPlateColor(plate.classNum, plate.hira);
  const { bg, text, dim, border } = COLOR_CONFIG[color];
  const pf = '"Hiragino Kaku Gothic ProN","Meiryo","MS Gothic",Arial,sans-serif';
  const len = plate.number.length;
  return (
    <div style={{
      width: 360, height: 180, background: bg, border: `5px solid ${border}`,
      borderRadius: 12, display: "flex", flexDirection: "column",
      padding: "8px 18px 10px", boxSizing: "border-box", userSelect: "none",
      boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
        <span style={{ fontSize: 30, fontWeight: 900, fontFamily: pf, color: plate.region ? text : dim }}>
          {plate.region || "地名"}
        </span>
        <span style={{ fontSize: 30, fontWeight: 900, fontFamily: pf, letterSpacing: 3, color: plate.classNum ? text : dim }}>
          {plate.classNum || "・・・"}
        </span>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", position: "relative" }}>
        <span style={{ position: "absolute", left: 0, fontSize: 46, fontWeight: 900, fontFamily: pf, color: plate.hira ? text : dim, lineHeight: 1 }}>
          {plate.hira || "あ"}
        </span>
        <span style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          paddingLeft: 52, fontSize: 80, color: plate.number ? text : dim,
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

/* ━━ 確認行コンポーネント ━━ */
function ConfirmSection({
  icon, title, rows, onEdit,
}: {
  icon: string;
  title: string;
  rows: { label: string; value: string; highlight?: boolean }[];
  onEdit: () => void;
}) {
  return (
    <div style={{
      borderRadius: 16, overflow: "hidden",
      border: "2px solid #E5E7EB",
      boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
    }}>
      {/* セクションヘッダー */}
      <div style={{
        background: "#F8FAFC", borderBottom: "2px solid #E5E7EB",
        padding: "14px 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 28 }}>{icon}</span>
          <span style={{ fontSize: 26, fontWeight: 700, color: "#374151" }}>{title}</span>
        </div>
        <button
          onPointerDown={onEdit}
          className="flex items-center justify-center gap-2 font-bold rounded-xl border-2 border-blue-500 bg-blue-500 text-white active:bg-blue-600 select-none touch-none transition-all"
          style={{ height: 60, padding: "0 24px", fontSize: 24 }}
        >
          ✎ 修正する
        </button>
      </div>
      {/* 行 */}
      {rows.map((row, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center",
          padding: "18px 28px", background: "#fff",
          borderBottom: i < rows.length - 1 ? "1px solid #F3F4F6" : "none",
          minHeight: 88,
        }}>
          <span style={{ fontSize: 24, fontWeight: 600, color: "#9CA3AF", width: 200, flexShrink: 0 }}>
            {row.label}
          </span>
          <span style={{
            fontSize: row.highlight ? 44 : 36,
            fontWeight: 900,
            color: row.value ? "#111827" : "#EF4444",
            letterSpacing: row.highlight ? "0.05em" : "normal",
          }}>
            {row.value || "未入力"}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ━━ メインページ ━━ */
export default function FinalConfirmPage() {
  const router = useRouter();
  const initRef = useRef(false);
  const [sessionData, setSessionData] = useState<ReturnType<typeof getKioskSession> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    setSessionData(getKioskSession());
  }, []);

  async function handleRegister() {
    if (!sessionData) return;
    setLoading(true);
    setError("");
    try {
      const result = await registerReception({
        phone: sessionData.phone || sessionData.driverInput.phone,
        centerId: sessionData.centerId,
        plate: sessionData.plate,
        driverInput: sessionData.driverInput,
      });
      setKioskSession({ receptionResult: result });
      router.push("/kiosk/complete");
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
      setLoading(false);
    }
  }

  if (!sessionData) return <div className="w-screen h-screen" style={{ background: "#1e3a5f" }} />;

  const { driverInput, plate, phone } = sessionData;
  const plateStr = formatPlate(plate);
  const isComplete = driverInput.companyName && driverInput.driverName && plateStr;

  return (
    <div className="w-screen h-screen flex flex-col select-none overflow-hidden"
      style={{ background: "linear-gradient(160deg,#E8F4FD 0%,#D0E8FA 50%,#B8D8F6 100%)" }}>

      {/* ━━ ヘッダー ━━ */}
      <div className="flex items-center flex-shrink-0 px-8 gap-6"
        style={{ background: "linear-gradient(90deg,#1a3a6b 0%,#1E5799 100%)", height: 100 }}>
        <button
          onPointerDown={() => router.push("/kiosk/vehicle")}
          className="flex items-center justify-center font-bold rounded-2xl border-2 border-white text-white active:bg-blue-800 flex-shrink-0"
          style={{ height: 70, width: 180, fontSize: 28 }}
        >◀ 戻る</button>
        <h1 className="flex-1 font-bold text-white text-center" style={{ fontSize: 40 }}>
          内容をご確認ください
        </h1>
        <StepDots current={4} />
      </div>

      {/* ━━ メイン ━━ */}
      <div className="flex-1 flex gap-6 px-10 py-6 overflow-hidden">

        {/* 左：確認カード群 */}
        <div className="flex flex-col gap-4 flex-1 overflow-y-auto">

          {/* 連絡先 */}
          <ConfirmSection
            icon="📞"
            title="連絡先"
            rows={[{ label: "電話番号", value: fmtPhone(phone || driverInput.phone) }]}
            onEdit={() => router.push("/kiosk/phone")}
          />

          {/* 人情報 */}
          <ConfirmSection
            icon="👤"
            title="ご本人"
            rows={[
              { label: "運送会社名", value: driverInput.companyName },
              { label: "お名前", value: driverInput.driverName, highlight: true },
            ]}
            onEdit={() => router.push("/kiosk/person")}
          />

          {/* 車両情報 */}
          <ConfirmSection
            icon="🚛"
            title="車両"
            rows={[
              { label: "車番", value: plateStr, highlight: true },
              { label: "最大積載量", value: driverInput.maxLoad ? `${Number(driverInput.maxLoad).toLocaleString()} kg` : "" },
            ]}
            onEdit={() => router.push("/kiosk/vehicle")}
          />

          {error && (
            <div style={{
              background: "#FEF2F2", border: "2px solid #FCA5A5",
              borderRadius: 12, padding: "16px 24px",
            }}>
              <p style={{ fontSize: 26, fontWeight: 700, color: "#DC2626" }}>{error}</p>
            </div>
          )}
        </div>

        {/* 右：プレート + 受付ボタン */}
        <div className="flex flex-col items-center gap-6 flex-shrink-0" style={{ width: 460 }}>
          {/* プレート表示 */}
          <div style={{
            background: "#fff", borderRadius: 20,
            border: "2px solid #E5E7EB", padding: "28px 24px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
            width: "100%",
          }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: "#9CA3AF" }}>ナンバープレート</span>
            <PlateView plate={plate} />
            <span style={{ fontSize: 32, fontWeight: 900, color: "#111827", letterSpacing: "0.05em" }}>
              {plateStr || "未入力"}
            </span>
          </div>

          {/* 受付ボタン */}
          <button
            onPointerDown={handleRegister}
            disabled={loading || !isComplete}
            className="w-full flex flex-col items-center justify-center font-black rounded-2xl text-white select-none touch-none transition-all"
            style={{
              flex: 1,
              fontSize: 52,
              background: (loading || !isComplete)
                ? "linear-gradient(180deg,#9CA3AF,#6B7280)"
                : "linear-gradient(180deg,#16a34a,#166534)",
              boxShadow: (loading || !isComplete) ? "0 5px 0 #4B5563" : "0 8px 0 #14532d, 0 12px 32px rgba(22,163,74,0.4)",
              cursor: (loading || !isComplete) ? "not-allowed" : "pointer",
              letterSpacing: "0.08em",
            }}
          >
            {loading ? (
              <>
                <span style={{ fontSize: 48 }}>⏳</span>
                <span style={{ fontSize: 36, marginTop: 8 }}>受付中...</span>
              </>
            ) : (
              <>
                <span style={{ fontSize: 56 }}>✓</span>
                <span>受　付</span>
                <span>す　る</span>
              </>
            )}
          </button>

          {/* やり直しリンク */}
          <button
            onPointerDown={() => { clearKioskSession(); router.push("/kiosk"); }}
            style={{
              fontSize: 22, color: "#6B7280", textDecoration: "underline",
              padding: "8px 0", flexShrink: 0,
            }}
          >
            ← 最初からやり直す
          </button>
        </div>
      </div>

      {/* 注意文言 */}
      <div style={{
        height: 64, background: "#FFF8E1", borderTop: "2px solid #FDE68A",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 22, color: "#92400E", fontWeight: 600 }}>
          ⚠ 内容をご確認の上、「受付する」ボタンを押してください。修正がある場合は各セクションの「修正する」を押してください。
        </span>
      </div>
    </div>
  );
}
