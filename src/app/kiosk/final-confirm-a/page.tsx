"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getKioskSession, setKioskSession } from "@/lib/kioskState";
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

function StepDots({ current, completed }: { current: number; completed?: boolean[] }) {
  const labels = ["電話番号", "お名前", "車　両", "最終確認"];
  return (
    <div className="flex items-center gap-4">
      {labels.map((label, i) => {
        const step = i + 1;
        const done = completed ? (completed[i] ?? false) : step < current;
        const active = step === current;
        return (
          <div key={i} className="flex items-center gap-4">
            <div className="flex flex-col items-center" style={{ minWidth: 72 }}>
              <div style={{
                width: 52, height: 52, borderRadius: "50%",
                background: done ? "#4ade80" : active ? "#fff" : "rgba(255,255,255,0.25)",
                border: `3px solid ${done ? "#4ade80" : active ? "#fff" : "rgba(255,255,255,0.4)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, fontWeight: 900,
                color: done ? "#0f766e" : active ? "#1e3a6b" : "rgba(255,255,255,0.5)",
              }}>
                {done ? "✓" : step}
              </div>
              <span style={{
                fontSize: 15, fontWeight: 700, marginTop: 4,
                color: active ? "#fff" : done ? "#bbf7d0" : "rgba(255,255,255,0.4)",
                whiteSpace: "nowrap",
              }}>{label}</span>
            </div>
            {i < labels.length - 1 && (
              <div style={{
                width: 56, height: 3,
                background: done ? "#4ade80" : "rgba(255,255,255,0.2)",
                borderRadius: 2, marginBottom: 20,
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ━━ 案A：セクションごとに「✎ タップ」バッジをオーバーレイ ━━ */
type PlateSection = "region" | "classNum" | "hira" | "number";

const TapBadge = () => (
  <div style={{
    position: "absolute", top: -14, right: -10, zIndex: 10,
    background: "#FFE600", color: "#78350F",
    fontSize: 13, fontWeight: 900,
    borderRadius: 20, padding: "3px 10px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    letterSpacing: "0.02em", whiteSpace: "nowrap",
    pointerEvents: "none",
    display: "flex", alignItems: "center", gap: 4,
    border: "1.5px solid rgba(0,0,0,0.1)",
  }}>
    ✎ タップ
  </div>
);

function InteractivePlate({ plate, onTap }: {
  plate: PlateInput;
  onTap: (section: PlateSection) => void;
}) {
  const color = detectPlateColor(plate.classNum, plate.hira);
  const { bg, text, dim, border } = COLOR_CONFIG[color];
  const pf = '"Hiragino Kaku Gothic ProN","Meiryo","MS Gothic",Arial,sans-serif';
  const len = plate.number.length;

  const tapStyle = (hasVal: boolean): React.CSSProperties => ({
    cursor: "pointer",
    borderRadius: 8,
    border: "2px solid rgba(255,230,0,0.55)",
    position: "relative",
    color: hasVal ? text : dim,
    fontFamily: pf,
    fontWeight: 900,
    userSelect: "none",
    background: "rgba(255,255,255,0.08)",
    transition: "border-color 0.15s, background 0.15s",
  });

  return (
    <div style={{
      width: 500, height: 250, background: bg, border: `5px solid ${border}`,
      borderRadius: 16, display: "flex", flexDirection: "column",
      padding: "12px 18px 12px", boxSizing: "border-box",
      boxShadow: "0 8px 30px rgba(0,0,0,0.28)", flexShrink: 0,
    }}>
      {/* 上段：地名・分類番号 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, paddingTop: 8 }}>
        <div
          onPointerDown={() => onTap("region")}
          onPointerEnter={e => (e.currentTarget.style.borderColor = "#FFE600")}
          onPointerLeave={e => (e.currentTarget.style.borderColor = "rgba(255,230,0,0.55)")}
          style={{ ...tapStyle(!!plate.region), fontSize: 40, padding: "3px 10px" }}
        >
          {plate.region || "地名"}
          <TapBadge />
        </div>
        <div
          onPointerDown={() => onTap("classNum")}
          onPointerEnter={e => (e.currentTarget.style.borderColor = "#FFE600")}
          onPointerLeave={e => (e.currentTarget.style.borderColor = "rgba(255,230,0,0.55)")}
          style={{ ...tapStyle(!!plate.classNum), fontSize: 40, letterSpacing: 4, padding: "3px 10px" }}
        >
          {plate.classNum || "・・・"}
          <TapBadge />
        </div>
      </div>

      {/* 下段：ひらがな・番号 */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", position: "relative" }}>
        {/* ひらがな */}
        <div
          onPointerDown={() => onTap("hira")}
          onPointerEnter={e => (e.currentTarget.style.borderColor = "#FFE600")}
          onPointerLeave={e => (e.currentTarget.style.borderColor = "rgba(255,230,0,0.55)")}
          style={{ ...tapStyle(!!plate.hira), position: "absolute", left: 0, fontSize: 64, lineHeight: 1, padding: "2px 8px" }}
        >
          {plate.hira || "あ"}
          <TapBadge />
        </div>

        {/* 番号（transform外でバッジを配置） */}
        <div style={{ flex: 1, marginLeft: 80, position: "relative" }}>
          <div
            onPointerDown={() => onTap("number")}
            onPointerEnter={e => (e.currentTarget.style.borderColor = "#FFE600")}
            onPointerLeave={e => (e.currentTarget.style.borderColor = "rgba(255,230,0,0.55)")}
            style={{
              ...tapStyle(!!plate.number),
              fontSize: 104,
              display: "flex", alignItems: "center", justifyContent: "center",
              transform: "scaleX(0.85)", transformOrigin: "center", padding: "2px 0",
            }}
          >
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
          </div>
          {/* バッジはtransformの外に配置 */}
          <div style={{
            position: "absolute", top: -14, right: -10, zIndex: 10,
            background: "#FFE600", color: "#78350F",
            fontSize: 13, fontWeight: 900,
            borderRadius: 20, padding: "3px 10px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            letterSpacing: "0.02em", whiteSpace: "nowrap",
            pointerEvents: "none",
            display: "flex", alignItems: "center", gap: 4,
            border: "1.5px solid rgba(0,0,0,0.1)",
          }}>
            ✎ タップ
          </div>
        </div>
      </div>
    </div>
  );
}

const IconPhone = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="36" height="36">
    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
  </svg>
);
const IconPerson = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="36" height="36">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </svg>
);
const IconTruck = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="36" height="36">
    <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
  </svg>
);

type SectionIconType = "phone" | "person" | "truck";
const ICON_CONFIG: Record<SectionIconType, { bg: string; color: string; el: React.ReactNode; colBg: string }> = {
  phone:  { bg: "#FEE2E2", color: "#EF4444", el: <IconPhone />,  colBg: "#FFF5F5" },
  person: { bg: "#EDE9FE", color: "#8B5CF6", el: <IconPerson />, colBg: "#F9F5FF" },
  truck:  { bg: "#DBEAFE", color: "#3B82F6", el: <IconTruck />,  colBg: "#F0F7FF" },
};

function SectionCard({ iconType, title, children, style }: {
  iconType: SectionIconType; title: string; children: React.ReactNode; style?: React.CSSProperties;
}) {
  const ic = ICON_CONFIG[iconType];
  return (
    <div style={{
      display: "flex", background: "#fff", borderRadius: 22, overflow: "hidden",
      boxShadow: "0 2px 20px rgba(0,0,0,0.08)", ...style,
    }}>
      <div style={{
        width: 160, background: ic.colBg, borderRight: "1.5px solid #EEF0F3",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 10, padding: "20px 10px", flexShrink: 0,
      }}>
        <div style={{
          width: 68, height: 68, borderRadius: "50%", background: ic.bg,
          display: "flex", alignItems: "center", justifyContent: "center", color: ic.color,
        }}>
          {ic.el}
        </div>
        <span style={{ fontSize: 22, fontWeight: 700, color: "#374151", textAlign: "center", lineHeight: 1.3 }}>
          {title}
        </span>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>{children}</div>
    </div>
  );
}

function FieldRow({ label, value, onEdit, tall = false }: {
  label: string; value: string; onEdit: () => void; tall?: boolean;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center",
      padding: "0 60px 0 48px",
      borderBottom: "1px solid #F0F3F7",
      minHeight: tall ? 120 : 100, gap: 0,
    }}>
      <span style={{ fontSize: 22, fontWeight: 600, color: "#94A3B8", width: 150, flexShrink: 0, letterSpacing: "0.04em" }}>
        {label}
      </span>
      <span style={{
        flex: 1, fontSize: 56, fontWeight: 800,
        color: value ? "#1E293B" : "#EF4444",
        letterSpacing: "0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        lineHeight: 1.2,
      }}>
        {value || "未入力"}
      </span>
      <button
        onPointerDown={onEdit}
        className="select-none touch-none"
        style={{
          width: 160, height: 72, fontSize: 24, fontWeight: 700,
          background: "linear-gradient(180deg, #3B82F6, #2563EB)",
          color: "#fff", border: "none",
          borderRadius: 14, flexShrink: 0, cursor: "pointer",
          boxShadow: "0 4px 0 #1d4ed8",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          marginLeft: 20,
        }}
      >
        <span style={{ fontSize: 20 }}>✎</span> 修正
      </button>
    </div>
  );
}

export default function FinalConfirmAPage() {
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
        reservationId: sessionData.selectedReservation?.id,
      });
      setKioskSession({ receptionResult: result });
      router.push("/kiosk/complete");
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
      setLoading(false);
    }
  }

  if (!sessionData) return <div className="w-screen h-screen" style={{ background: "#1e3a5f" }} />;

  const { driverInput, plate, phone, selectedReservation } = sessionData;
  const plateStr = formatPlate(plate);
  const isComplete = !!(driverInput.companyName && driverInput.driverName && plateStr);
  const phoneComplete = !!(phone || driverInput.phone);
  const personComplete = !!(driverInput.companyName && driverInput.driverName);
  const vehicleComplete = !!plateStr;

  return (
    <div className="w-screen h-screen flex flex-col select-none overflow-hidden"
      style={{ background: "linear-gradient(160deg,#1a3a6b 0%,#1E5799 100%)" }}>

      {/* ヘッダー */}
      <div className="flex flex-col flex-shrink-0" style={{ padding: "0 56px 16px" }}>
        <div className="flex items-center" style={{ height: 84 }}>
          <button
            onPointerDown={() => router.push("/kiosk/vehicle")}
            className="flex items-center justify-center font-bold rounded-xl border-2 border-white text-white active:bg-blue-800 flex-shrink-0 select-none touch-none"
            style={{ height: 60, width: 160, fontSize: 28 }}
          >◀ 戻る</button>
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <StepDots current={4} completed={[phoneComplete, personComplete, vehicleComplete, true]} />
          </div>
          <div style={{ width: 160 }} />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 52, fontWeight: 800, color: "#fff", letterSpacing: "0.1em" }}>内容をご確認ください</div>
          <div style={{ fontSize: 22, color: "rgba(255,255,255,0.6)", marginTop: 6, letterSpacing: "0.08em" }}>
            修正したい項目をタップしてください
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 flex items-center overflow-hidden" style={{ padding: "16px 40px 24px 56px" }}>
        <div className="flex w-full" style={{ gap: 32 }}>

          {/* 左：カード群 */}
          <div className="flex flex-col flex-1" style={{ gap: 18 }}>

            <SectionCard iconType="phone" title="連絡先">
              <FieldRow
                label="電話番号"
                value={fmtPhone(phone || driverInput.phone)}
                onEdit={() => router.push("/kiosk/phone?from=final-confirm")}
                tall
              />
            </SectionCard>

            <SectionCard iconType="person" title="ご本人">
              <FieldRow
                label="運送会社名"
                value={driverInput.companyName}
                onEdit={() => router.push("/kiosk/person?from=final-confirm&field=company")}
              />
              <FieldRow
                label="お名前"
                value={driverInput.driverName}
                onEdit={() => router.push("/kiosk/person?from=final-confirm&field=name")}
              />
            </SectionCard>

            {/* 車両情報 */}
            <SectionCard iconType="truck" title="車両情報">
              <div style={{ display: "flex", padding: "18px 36px 22px 48px", gap: 24, alignItems: "center" }}>
                {/* プレート（バッジ付き） */}
                <InteractivePlate
                  plate={plate}
                  onTap={(section) => router.push(`/kiosk/vehicle?section=${section}&from=final-confirm`)}
                />
                {/* 最大積載量ボックス */}
                <div style={{
                  flex: 1, background: "#FFF7ED", borderRadius: 18,
                  border: "2px solid #FED7AA", display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  padding: "20px 24px", boxSizing: "border-box",
                  gap: 8, alignSelf: "stretch",
                }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#D97706", letterSpacing: "0.08em" }}>
                    最大積載量
                  </span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{
                      fontSize: driverInput.maxLoad ? 72 : 28, fontWeight: 900, lineHeight: 1,
                      color: driverInput.maxLoad ? "#EA580C" : "#FCA5A5",
                    }}>
                      {driverInput.maxLoad ? Number(driverInput.maxLoad).toLocaleString() : "未入力"}
                    </span>
                    {driverInput.maxLoad && <span style={{ fontSize: 26, fontWeight: 700, color: "#EA580C" }}>kg</span>}
                  </div>
                  <button
                    onPointerDown={() => router.push("/kiosk/vehicle?section=maxload&from=final-confirm")}
                    className="select-none touch-none"
                    style={{
                      width: 160, height: 72, fontSize: 24, fontWeight: 700,
                      background: "linear-gradient(180deg, #3B82F6, #2563EB)",
                      color: "#fff", border: "none", borderRadius: 14, cursor: "pointer",
                      boxShadow: "0 4px 0 #1d4ed8",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      marginTop: "auto", alignSelf: "flex-end",
                    }}
                  >
                    <span style={{ fontSize: 20 }}>✎</span> 修正
                  </button>
                </div>
              </div>
            </SectionCard>

            {error && (
              <div style={{ background: "#FEF2F2", border: "2px solid #FCA5A5", borderRadius: 12, padding: "14px 20px" }}>
                <p style={{ fontSize: 24, fontWeight: 700, color: "#DC2626" }}>{error}</p>
              </div>
            )}
          </div>

          {/* 右：受付ボタン */}
          <div className="flex flex-col flex-shrink-0" style={{ width: 320, gap: selectedReservation ? 20 : 0 }}>
            {selectedReservation && (
              <div style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                background: "linear-gradient(160deg,#F59E0B 0%,#D97706 100%)",
                borderRadius: 28, gap: 6,
                boxShadow: "0 6px 0 #92400E, 0 12px 40px rgba(245,158,11,0.45)",
                padding: "20px 24px", border: "4px solid rgba(255,255,255,0.35)",
                position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.12)" }} />
                <span style={{ fontSize: 20, fontWeight: 800, color: "#fff", background: "rgba(0,0,0,0.18)", borderRadius: 30, padding: "5px 20px", letterSpacing: "0.12em", zIndex: 1 }}>📅 予約時間</span>
                <span style={{ fontSize: 64, fontWeight: 900, color: "#fff", lineHeight: 1, zIndex: 1, textShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>{selectedReservation.startTime}</span>
                <span style={{ fontSize: 24, fontWeight: 800, color: "rgba(255,255,255,0.7)", zIndex: 1 }}>▼</span>
                <span style={{ fontSize: 64, fontWeight: 900, color: "#fff", lineHeight: 1, zIndex: 1, textShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>{selectedReservation.endTime}</span>
              </div>
            )}
            <button
              onPointerDown={handleRegister}
              disabled={loading || !isComplete}
              className="flex flex-col items-center justify-center select-none touch-none"
              style={{
                flex: selectedReservation ? 1 : undefined,
                alignSelf: selectedReservation ? undefined : "stretch",
                height: selectedReservation ? undefined : "100%",
                borderRadius: 28, border: "none",
                background: (loading || !isComplete)
                  ? "linear-gradient(180deg,#9CA3AF,#6B7280)"
                  : "linear-gradient(180deg,#2DD4BF 0%,#0D9488 100%)",
                boxShadow: (loading || !isComplete)
                  ? "0 6px 0 #4B5563"
                  : "0 8px 0 #0f766e, 0 14px 48px rgba(13,148,136,0.4)",
                cursor: (loading || !isComplete) ? "not-allowed" : "pointer",
                gap: selectedReservation ? 8 : 14,
              }}
            >
              {loading ? (
                <>
                  <span style={{ fontSize: selectedReservation ? 48 : 64, color: "#fff" }}>⏳</span>
                  <span style={{ fontSize: selectedReservation ? 28 : 36, fontWeight: 900, color: "#fff" }}>受付中...</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: selectedReservation ? 60 : 88, color: "#fff", lineHeight: 1 }}>✓</span>
                  <span style={{ fontSize: selectedReservation ? 40 : 52, fontWeight: 900, color: "#fff", letterSpacing: "0.12em", lineHeight: 1.3 }}>受付する</span>
                  <span style={{ fontSize: selectedReservation ? 18 : 22, color: "rgba(255,255,255,0.7)", letterSpacing: "0.06em" }}>問題なければタップ</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 下部注意文言 */}
      <div style={{
        height: 56, background: "#FFF8E1", borderTop: "2px solid #FDE68A",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <span style={{ fontSize: 20, color: "#92400E", fontWeight: 600, letterSpacing: "0.03em" }}>
          ⚠ 修正したい項目をタップすると各項目の入力画面に戻ります。修正後、自動的にこの確認画面に戻ります。
        </span>
      </div>
    </div>
  );
}
