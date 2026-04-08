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
    <div className="flex items-center gap-3">
      {labels.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <div key={i} className="flex items-center gap-3">
            <div className="flex flex-col items-center" style={{ minWidth: 64 }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: done ? "#4ade80" : active ? "#fff" : "rgba(255,255,255,0.25)",
                border: `3px solid ${done ? "#4ade80" : active ? "#fff" : "rgba(255,255,255,0.4)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, fontWeight: 900,
                color: done ? "#0f766e" : active ? "#1e3a6b" : "rgba(255,255,255,0.5)",
              }}>
                {done ? "✓" : step}
              </div>
              <span style={{
                fontSize: 13, fontWeight: 700, marginTop: 3,
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

/* ━━ インタラクティブプレート ━━ */
type PlateSection = "region" | "classNum" | "hira" | "number";

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
    border: "3px solid transparent",
    transition: "border-color 0.12s",
    color: hasVal ? text : dim,
    fontFamily: pf,
    fontWeight: 900,
    userSelect: "none",
  });

  return (
    <div style={{
      width: 420, height: 190, background: bg, border: `4px solid ${border}`,
      borderRadius: 14, display: "flex", flexDirection: "column",
      padding: "8px 14px 8px", boxSizing: "border-box",
      boxShadow: "0 8px 28px rgba(0,0,0,0.28)", flexShrink: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <div
          onPointerDown={() => onTap("region")}
          onPointerEnter={e => (e.currentTarget.style.borderColor = "#FFE600")}
          onPointerLeave={e => (e.currentTarget.style.borderColor = "transparent")}
          style={{ ...tapStyle(!!plate.region), fontSize: 30, padding: "2px 8px" }}
        >
          {plate.region || "地名"}
        </div>
        <div
          onPointerDown={() => onTap("classNum")}
          onPointerEnter={e => (e.currentTarget.style.borderColor = "#FFE600")}
          onPointerLeave={e => (e.currentTarget.style.borderColor = "transparent")}
          style={{ ...tapStyle(!!plate.classNum), fontSize: 30, letterSpacing: 3, padding: "2px 8px" }}
        >
          {plate.classNum || "・・・"}
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", position: "relative" }}>
        <div
          onPointerDown={() => onTap("hira")}
          onPointerEnter={e => (e.currentTarget.style.borderColor = "#FFE600")}
          onPointerLeave={e => (e.currentTarget.style.borderColor = "transparent")}
          style={{ ...tapStyle(!!plate.hira), position: "absolute", left: 0, fontSize: 48, lineHeight: 1, padding: "2px 4px" }}
        >
          {plate.hira || "あ"}
        </div>
        <div
          onPointerDown={() => onTap("number")}
          onPointerEnter={e => (e.currentTarget.style.borderColor = "#FFE600")}
          onPointerLeave={e => (e.currentTarget.style.borderColor = "transparent")}
          style={{
            ...tapStyle(!!plate.number),
            flex: 1, marginLeft: 62, fontSize: 78,
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
      </div>
    </div>
  );
}

/* ━━ アイコン定義 ━━ */
const IconPhone = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
  </svg>
);
const IconPerson = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </svg>
);
const IconTruck = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
    <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
  </svg>
);

type SectionIconType = "phone" | "person" | "truck";
const ICON_CONFIG: Record<SectionIconType, { bg: string; color: string; el: React.ReactNode; colBg: string; accentColor: string }> = {
  phone:  { bg: "#FEE2E2", color: "#EF4444", el: <IconPhone />,  colBg: "#FFF5F5", accentColor: "#EF4444" },
  person: { bg: "#EDE9FE", color: "#8B5CF6", el: <IconPerson />, colBg: "#F9F5FF", accentColor: "#8B5CF6" },
  truck:  { bg: "#DBEAFE", color: "#3B82F6", el: <IconTruck />,  colBg: "#F0F7FF", accentColor: "#3B82F6" },
};

/* ━━ セクションカード（左ラベル型） ━━ */
function SectionCard({ iconType, title, hint, children, style }: {
  iconType: SectionIconType; title: string; hint?: string; children: React.ReactNode; style?: React.CSSProperties;
}) {
  const ic = ICON_CONFIG[iconType];
  return (
    <div style={{
      display: "flex", background: "#fff", borderRadius: 16, overflow: "hidden",
      boxShadow: "0 2px 16px rgba(0,0,0,0.1)",
      borderLeft: `4px solid ${ic.accentColor}`,
      ...style,
    }}>
      {/* 左：アイコン＋タイトル */}
      <div style={{
        width: 110, background: ic.colBg, borderRight: "1.5px solid #EEF0F3",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 8, padding: "14px 6px", flexShrink: 0,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%", background: ic.bg,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: ic.color,
        }}>
          {ic.el}
        </div>
        <span style={{ fontSize: 17, fontWeight: 700, color: "#374151", textAlign: "center", lineHeight: 1.3 }}>
          {title}
        </span>
        {hint && (
          <span style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center", lineHeight: 1.4 }}>
            {hint}
          </span>
        )}
      </div>
      {/* 右：コンテンツ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>{children}</div>
    </div>
  );
}

/* ━━ フィールド行 ━━ */
function FieldRow({ label, value, onEdit, tall = false }: {
  label: string; value: string; onEdit: () => void; tall?: boolean;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center",
      padding: tall ? "12px 24px 12px 32px" : "8px 24px 8px 32px",
      borderBottom: "1px solid #F0F3F7",
      minHeight: tall ? 80 : 68, gap: 0,
    }}>
      {/* ラベル */}
      <span style={{
        fontSize: 17, fontWeight: 600, color: "#B0B8C4",
        width: 110, flexShrink: 0, letterSpacing: "0.04em",
      }}>
        {label}
      </span>
      {/* 値 */}
      <span style={{
        flex: 1, fontSize: 42, fontWeight: 900,
        color: value ? "#111827" : "#EF4444",
        letterSpacing: "0.03em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        lineHeight: 1.2,
      }}>
        {value || "未入力"}
      </span>
      {/* 修正ボタン（右寄せ） */}
      <button
        onPointerDown={onEdit}
        className="select-none touch-none"
        style={{
          width: 130, height: 58, fontSize: 19, fontWeight: 700,
          background: "#3B82F6", color: "#fff", border: "none",
          borderRadius: 12, flexShrink: 0, cursor: "pointer",
          boxShadow: "0 3px 0 #1d4ed8",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
        }}
      >
        <span style={{ fontSize: 17 }}>✎</span> 修正
      </button>
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

  if (!sessionData) return <div className="w-screen h-screen" style={{ background: "#F5F0E8" }} />;

  const { driverInput, plate, phone } = sessionData;
  const plateStr = formatPlate(plate);
  const isComplete = !!(driverInput.companyName && driverInput.driverName && plateStr);

  return (
    <div className="w-screen h-screen flex flex-col select-none overflow-hidden"
      style={{ background: "#F5F0E8" }}>

      {/* ━━ ヘッダー ━━ */}
      <div className="flex flex-col flex-shrink-0" style={{ background: "#1a3a6b", padding: "0 40px 10px" }}>
        {/* ナビ行 */}
        <div className="flex items-center" style={{ height: 76 }}>
          <button
            onPointerDown={() => router.push("/kiosk/vehicle")}
            className="flex items-center justify-center font-bold rounded-xl border-2 border-white text-white active:bg-blue-800 flex-shrink-0 select-none touch-none"
            style={{ height: 52, width: 130, fontSize: 24 }}
          >◀ 戻る</button>
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <StepDots current={4} />
          </div>
          <div style={{ width: 130 }} />
        </div>
        {/* タイトル */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, fontWeight: 800, color: "#fff", letterSpacing: "0.1em" }}>
            内容をご確認ください
          </div>
          <div style={{ fontSize: 17, color: "rgba(255,255,255,0.65)", marginTop: 6, letterSpacing: "0.08em" }}>
            修正したい項目をタップしてください
          </div>
        </div>
      </div>

      {/* ━━ メインコンテンツ ━━ */}
      <div className="flex-1 flex overflow-hidden" style={{ padding: "10px 20px 14px 28px", gap: 22 }}>

        {/* 左：セクションカード群 */}
        <div className="flex flex-col flex-1" style={{ gap: 14, minHeight: 0 }}>

          {/* 連絡先 */}
          <SectionCard iconType="phone" title="連絡先">
            <FieldRow
              label="電話番号"
              value={fmtPhone(phone || driverInput.phone)}
              onEdit={() => router.push("/kiosk/phone?from=final-confirm")}
              tall
            />
          </SectionCard>

          {/* ご本人 */}
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

          {/* 車両ナンバー＋最大積載 */}
          <SectionCard iconType="truck" title="車両情報" style={{ flex: 1 }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "10px 20px 12px 24px", justifyContent: "center", gap: 8 }}>
              {/* ヒント */}
              <div>
                <span style={{
                  fontSize: 12, color: "#92400E", background: "#FEF3C7",
                  borderRadius: 14, padding: "3px 12px", fontWeight: 700,
                  letterSpacing: "0.05em", border: "1px solid #FDE68A",
                }}>
                  👆 ナンバーをタップして修正
                </span>
              </div>
              {/* プレート（左）＋最大積載（右） */}
              <div style={{ display: "flex", gap: 20, alignItems: "stretch", flex: 1 }}>
                <InteractivePlate
                  plate={plate}
                  onTap={(section) => router.push(`/kiosk/vehicle?section=${section}&from=final-confirm`)}
                />
                {/* 最大積載量ボックス */}
                <div style={{
                  flex: 1, background: "#FFF7ED", borderRadius: 14,
                  border: "1.5px solid #FED7AA", display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  padding: "12px 10px 10px", boxSizing: "border-box", gap: 8,
                }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#D97706", letterSpacing: "0.06em" }}>
                    最大積載量
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flex: 1, justifyContent: "center" }}>
                    <span style={{
                      fontSize: driverInput.maxLoad ? 60 : 18, fontWeight: 900, lineHeight: 1.1,
                      color: driverInput.maxLoad ? "#EA580C" : "#FCA5A5", textAlign: "center",
                    }}>
                      {driverInput.maxLoad ? Number(driverInput.maxLoad).toLocaleString() : "未入力"}
                    </span>
                    {driverInput.maxLoad && (
                      <span style={{ fontSize: 18, fontWeight: 700, color: "#EA580C" }}>kg</span>
                    )}
                  </div>
                  <button
                    onPointerDown={() => router.push("/kiosk/vehicle?section=maxload&from=final-confirm")}
                    className="select-none touch-none"
                    style={{
                      width: "100%", height: 46, fontSize: 17, fontWeight: 700,
                      background: "#3B82F6", color: "#fff", border: "none",
                      borderRadius: 10, cursor: "pointer", boxShadow: "0 3px 0 #1d4ed8",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                    }}
                  >
                    <span style={{ fontSize: 15 }}>✎</span> 修正
                  </button>
                </div>
              </div>
            </div>
          </SectionCard>

          {error && (
            <div style={{
              background: "#FEF2F2", border: "2px solid #FCA5A5",
              borderRadius: 12, padding: "12px 18px",
            }}>
              <p style={{ fontSize: 22, fontWeight: 700, color: "#DC2626" }}>{error}</p>
            </div>
          )}
        </div>

        {/* 右：受付ボタン（左列と同じ高さ） */}
        <button
          onPointerDown={handleRegister}
          disabled={loading || !isComplete}
          className="flex flex-col items-center justify-center flex-shrink-0 select-none touch-none"
          style={{
            width: 240,
            alignSelf: "stretch",
            borderRadius: 24, border: "none",
            background: (loading || !isComplete)
              ? "linear-gradient(180deg,#9CA3AF,#6B7280)"
              : "linear-gradient(180deg,#2DD4BF 0%,#0D9488 100%)",
            boxShadow: (loading || !isComplete)
              ? "0 4px 0 #4B5563"
              : "0 8px 0 #0f766e, 0 12px 40px rgba(13,148,136,0.45)",
            cursor: (loading || !isComplete) ? "not-allowed" : "pointer",
            gap: 12,
          }}
        >
          {loading ? (
            <>
              <span style={{ fontSize: 52, color: "#fff" }}>⏳</span>
              <span style={{ fontSize: 30, fontWeight: 900, color: "#fff" }}>受付中...</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: 68, color: "#fff", lineHeight: 1 }}>✓</span>
              <span style={{ fontSize: 44, fontWeight: 900, color: "#fff", letterSpacing: "0.12em", lineHeight: 1.3 }}>
                受付する
              </span>
              <span style={{ fontSize: 18, color: "rgba(255,255,255,0.75)", letterSpacing: "0.06em" }}>
                問題なければタップ
              </span>
            </>
          )}
        </button>
      </div>

      {/* ━━ 下部注意文言 ━━ */}
      <div style={{
        height: 50, background: "#FFF8E1", borderTop: "2px solid #FDE68A",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 18, color: "#92400E", fontWeight: 600 }}>
          ⚠ 修正したい項目をタップすると各項目の入力画面に戻ります。修正後、自動的にこの確認画面に戻ります。
        </span>
      </div>
    </div>
  );
}
