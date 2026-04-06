"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getKioskSession, setKioskSession, clearKioskSession } from "@/lib/kioskState";
import { registerReception } from "@/lib/api";
import { formatPlate } from "@/types/reception";
import { detectPlateColor, COLOR_CONFIG } from "@/components/PlateDisplay";
import type { PlateInput } from "@/types/reception";

const MOBILE_PREFIXES = ["070", "080", "090"];
const JP_AREA: Record<string, number> = {
  "0120": 2, "0570": 2, "0800": 2, "0990": 2,
  "0494": 2, "0493": 2, "0492": 2, "0491": 2, "0490": 2,
  "0480": 2, "0479": 2, "0478": 2, "0477": 2, "0476": 2,
  "0475": 2, "0474": 2, "0472": 2, "0471": 2, "0470": 2,
  "0467": 2, "0466": 2, "0465": 2, "0463": 2, "0460": 2,
  "0439": 2, "0438": 2, "0436": 2, "0428": 2, "0426": 2,
  "0267": 2, "0266": 2, "0265": 2, "0264": 2, "0263": 2,
  "0261": 2, "0260": 2, "0259": 2, "0258": 2, "0257": 2,
  "0256": 2, "0255": 2, "0254": 2, "0250": 2,
  "0246": 2, "0244": 2, "0243": 2, "0242": 2, "0241": 2,
  "0240": 2, "0237": 2, "0235": 2, "0234": 2, "0233": 2,
  "0229": 2, "0228": 2, "0227": 2, "0226": 2, "0225": 2,
  "0224": 2, "0223": 2, "0220": 2,
  "0197": 2, "0195": 2, "0194": 2, "0193": 2, "0192": 2,
  "0191": 2, "0187": 2, "0186": 2, "0185": 2, "0184": 2,
  "0183": 2, "0182": 2, "0180": 2, "0179": 2, "0178": 2,
  "0176": 2, "0175": 2, "0174": 2, "0173": 2, "0172": 2,
  "0170": 2, "0167": 2, "0166": 2, "0165": 2, "0164": 2,
  "0163": 2, "0162": 2, "0158": 2, "0157": 2, "0156": 2,
  "0155": 2, "0154": 2, "0153": 2, "0152": 2, "0146": 2,
  "0145": 2, "0144": 2, "0143": 2, "0142": 2, "0135": 2,
  "0134": 2, "0133": 2, "0132": 2, "0125": 2, "0124": 2,
  "0123": 2,
  "011": 3, "012": 3, "013": 3, "014": 3, "015": 3, "016": 3, "017": 3, "018": 3, "019": 3,
  "022": 3, "023": 3, "024": 3, "025": 3, "026": 3, "027": 3, "028": 3, "029": 3,
  "042": 3, "043": 3, "044": 3, "045": 3, "046": 3, "047": 3, "048": 3, "049": 3,
  "052": 3, "053": 3, "054": 3, "055": 3, "056": 3, "057": 3, "058": 3, "059": 3,
  "072": 3, "073": 3, "074": 3, "075": 3, "076": 3, "077": 3, "078": 3, "079": 3,
  "082": 3, "083": 3, "084": 3, "085": 3, "086": 3, "087": 3, "088": 3, "089": 3,
  "092": 3, "093": 3, "094": 3, "095": 3, "096": 3, "097": 3, "098": 3, "099": 3,
  "03": 4, "06": 4, "04": 4,
};
function fmtPhone(digits: string): string {
  if (!digits) return "";
  if (MOBILE_PREFIXES.some(p => digits.startsWith(p))) {
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  }
  for (const areaLen of [4, 3, 2]) {
    const prefix = digits.slice(0, areaLen);
    const midLen = JP_AREA[prefix];
    if (midLen !== undefined) {
      const midEnd = areaLen + midLen;
      if (digits.length <= areaLen) return digits;
      if (digits.length <= midEnd) return `${digits.slice(0, areaLen)}-${digits.slice(areaLen)}`;
      return `${digits.slice(0, areaLen)}-${digits.slice(areaLen, midEnd)}-${digits.slice(midEnd, 10)}`;
    }
  }
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

/* ━━ ステップドット ━━ */
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
                borderRadius: 2,
                marginBottom: 20,
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ━━ プレート（枠付き・修正ボタン右下） ━━ */
function EditablePlate({ plate, onEdit }: {
  plate: PlateInput;
  onEdit: (section: string) => void;
}) {
  const color = detectPlateColor(plate.classNum, plate.hira);
  const { bg, text, dim, border } = COLOR_CONFIG[color];
  const pf = '"Hiragino Kaku Gothic ProN","Meiryo","MS Gothic",Arial,sans-serif';
  const len = plate.number.length;
  const secBorder = "2px dashed #F59E0B";

  const editBtn = (onClick: () => void) => (
    <button
      onPointerDown={(e) => { e.stopPropagation(); onClick(); }}
      className="select-none touch-none"
      style={{
        position: "absolute" as const, bottom: 4, right: 4,
        height: 26, fontSize: 11, fontWeight: 700,
        background: "linear-gradient(180deg, #3B82F6, #2563EB)",
        color: "#fff", border: "none", borderRadius: 7,
        boxShadow: "0 2px 0 #1d4ed8", cursor: "pointer",
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 3,
        padding: "0 9px", whiteSpace: "nowrap" as const,
      }}
    ><span style={{ fontSize: 10 }}>✎</span> 修正</button>
  );

  return (
    <div style={{
      width: 500, height: 280, background: bg, border: `5px solid ${border}`,
      borderRadius: 16, display: "flex", flexDirection: "column",
      padding: "10px 14px 10px", boxSizing: "border-box",
      boxShadow: "0 8px 30px rgba(0,0,0,0.28)", flexShrink: 0,
      gap: 8,
    }}>
      {/* 上段: 地名 + 分類番号 */}
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        {/* 地名 */}
        <div
          onPointerDown={() => onEdit("region")}
          style={{
            position: "relative", border: secBorder, borderRadius: 10,
            padding: "4px 14px 22px", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 38, fontWeight: 900, fontFamily: pf, color: plate.region ? text : dim }}>
            {plate.region || "地名"}
          </span>
          {editBtn(() => onEdit("region"))}
        </div>
        {/* 分類番号 */}
        <div
          onPointerDown={() => onEdit("classNum")}
          style={{
            position: "relative", border: secBorder, borderRadius: 10,
            padding: "4px 14px 22px", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 38, fontWeight: 900, fontFamily: pf, color: plate.classNum ? text : dim, letterSpacing: 4 }}>
            {plate.classNum || "・・・"}
          </span>
          {editBtn(() => onEdit("classNum"))}
        </div>
      </div>

      {/* 下段: ひらがな + 4桁番号 */}
      <div style={{ flex: 1, display: "flex", gap: 10 }}>
        {/* ひらがな */}
        <div
          onPointerDown={() => onEdit("hira")}
          style={{
            position: "relative", border: secBorder, borderRadius: 10,
            width: 72, flexShrink: 0, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 58, fontWeight: 900, fontFamily: pf, color: plate.hira ? text : dim, lineHeight: 1 }}>
            {plate.hira || "あ"}
          </span>
          {editBtn(() => onEdit("hira"))}
        </div>
        {/* 4桁番号 */}
        <div
          onPointerDown={() => onEdit("number")}
          style={{
            position: "relative", border: secBorder, borderRadius: 10,
            flex: 1, cursor: "pointer", overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <span style={{
            fontSize: 96, fontWeight: 900, fontFamily: pf, color: plate.number ? text : dim,
            display: "flex", alignItems: "center", justifyContent: "center",
            transform: "scaleX(0.85)", transformOrigin: "center", lineHeight: 1,
          }}>
            {[0, 1, 2, 3].map(pos => {
              const hasDigit = pos >= (4 - len);
              const ch = hasDigit ? plate.number[pos - (4 - len)] : null;
              return (
                <span key={pos} style={{ display: "inline-flex", alignItems: "center" }}>
                  {pos === 2 && <span style={{ visibility: len >= 3 ? "visible" : "hidden" }}>-</span>}
                  {ch !== null
                    ? <span style={{ display: "inline-block", width: "0.6em", textAlign: "center" }}>{ch}</span>
                    : <span style={{ display: "inline-block", width: "0.6em", textAlign: "center", opacity: 0.35 }}>・</span>
                  }
                </span>
              );
            })}
          </span>
          {editBtn(() => onEdit("number"))}
        </div>
      </div>
    </div>
  );
}

/* ━━ アイコン定義 ━━ */
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

/* ━━ セクションカード（左ラベル型） ━━ */
function SectionCard({ iconType, title, hint, children, style }: {
  iconType: SectionIconType; title: string; hint?: string; children: React.ReactNode; style?: React.CSSProperties;
}) {
  const ic = ICON_CONFIG[iconType];
  return (
    <div style={{
      display: "flex", background: "#fff", borderRadius: 22, overflow: "hidden",
      boxShadow: "0 2px 20px rgba(0,0,0,0.08)", ...style,
    }}>
      {/* 左：アイコン＋タイトル */}
      <div style={{
        width: 160, background: ic.colBg, borderRight: "1.5px solid #EEF0F3",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 10, padding: "20px 10px", flexShrink: 0,
      }}>
        <div style={{
          width: 68, height: 68, borderRadius: "50%", background: ic.bg,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: ic.color,
        }}>
          {ic.el}
        </div>
        <span style={{ fontSize: 22, fontWeight: 700, color: "#374151", textAlign: "center", lineHeight: 1.3 }}>
          {title}
        </span>
        {hint && (
          <span style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center", lineHeight: 1.4 }}>
            {hint}
          </span>
        )}
      </div>
      {/* 右：コンテンツ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>{children}</div>
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
      padding: "0 60px 0 48px",
      borderBottom: "1px solid #F0F3F7",
      minHeight: tall ? 120 : 100, gap: 0,
    }}>
      {/* ラベル */}
      <span style={{
        fontSize: 22, fontWeight: 600, color: "#94A3B8",
        width: 150, flexShrink: 0, letterSpacing: "0.04em",
      }}>
        {label}
      </span>
      {/* 値 */}
      <span style={{
        flex: 1, fontSize: 56, fontWeight: 800,
        color: value ? "#1E293B" : "#EF4444",
        letterSpacing: "0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        lineHeight: 1.2,
      }}>
        {value || "未入力"}
      </span>
      {/* 修正ボタン */}
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
    const s = getKioskSession();
    if (!s.phone) {
      router.replace("/kiosk");
      return;
    }
    setSessionData(s);
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const raw = e instanceof Error ? e.message : String(e);
      // ユーザーフレンドリーなメッセージに変換
      let friendly = "受付処理中にエラーが発生しました。もう一度お試しください。";
      if (raw.includes("fetch") || raw.includes("network") || raw.includes("Network")) {
        friendly = "通信エラーが発生しました。ネットワーク接続を確認して再試行してください。";
      } else if (raw.includes("timeout") || raw.includes("Timeout")) {
        friendly = "サーバーの応答がタイムアウトしました。しばらくお待ちいただき再試行してください。";
      } else if (raw.includes("500") || raw.includes("server")) {
        friendly = "サーバーエラーが発生しました。しばらくお待ちいただき再試行してください。";
      }
      setError(friendly);
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

      {/* ━━ ヘッダー ━━ */}
      <div className="flex flex-col flex-shrink-0" style={{ padding: "0 56px 16px" }}>
        {/* ナビ行 */}
        <div className="flex items-center" style={{ height: 84 }}>
          <button
            onPointerDown={() => { clearKioskSession(); router.push("/kiosk"); }}
            className="flex items-center justify-center font-bold rounded-xl border-2 border-white text-white active:bg-blue-800 flex-shrink-0 select-none touch-none"
            style={{ height: 60, width: 200, fontSize: 24, lineHeight: 1.3, textAlign: "center" }}
          >🔄 最初から</button>
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <StepDots current={4} completed={[phoneComplete, personComplete, vehicleComplete, true]} />
          </div>
          <div style={{ width: 160 }} />
        </div>
        {/* タイトル */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 52, fontWeight: 800, color: "#fff", letterSpacing: "0.1em" }}>
            内容をご確認ください
          </div>
          <div style={{ fontSize: 22, color: "rgba(255,255,255,0.6)", marginTop: 6, letterSpacing: "0.08em" }}>
            修正したい項目をタップしてください
          </div>
        </div>
      </div>

      {/* ━━ メインコンテンツ ━━ */}
      <div className="flex-1 flex items-center overflow-hidden" style={{ padding: "16px 40px 24px 56px" }}>
        <div className="flex w-full" style={{ gap: 32 }}>

        {/* 左：セクションカード群 */}
        <div className="flex flex-col flex-1" style={{ gap: 18 }}>

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

          {/* 車両情報 */}
          <SectionCard iconType="truck" title="車両情報">
            {/* ナンバー（各項目: ラベル + 値 + 修正ボタン） */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr",
              padding: "12px 40px 12px 48px",
              gap: "8px 24px", borderBottom: "1px solid #F0F3F7",
            }}>
              {([
                { label: "地名", value: plate.region, section: "region" },
                { label: "分類番号", value: plate.classNum, section: "classNum" },
                { label: "ひらがな", value: plate.hira, section: "hira" },
                { label: "一連番号", value: plate.number, section: "number" },
              ] as const).map(({ label, value, section }) => (
                <div key={section} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  minHeight: 56,
                }}>
                  <span style={{
                    fontSize: 18, fontWeight: 600, color: "#94A3B8",
                    flexShrink: 0, letterSpacing: "0.04em",
                  }}>
                    {label}
                  </span>
                  <span style={{
                    flex: 1, fontSize: 36, fontWeight: 800,
                    color: value ? "#1E293B" : "#EF4444",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {value || "未入力"}
                  </span>
                  <button
                    onPointerDown={() => router.push(`/kiosk/vehicle?section=${section}&from=final-confirm`)}
                    className="select-none touch-none"
                    style={{
                      height: 48, fontSize: 18, fontWeight: 700,
                      background: "linear-gradient(180deg, #3B82F6, #2563EB)",
                      color: "#fff", border: "none", borderRadius: 12,
                      cursor: "pointer", boxShadow: "0 3px 0 #1d4ed8",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                      padding: "0 14px", whiteSpace: "nowrap", flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: 14 }}>✎</span> 修正
                  </button>
                </div>
              ))}
            </div>
            <FieldRow
              label="最大積載量"
              value={driverInput.maxLoad ? `${Number(driverInput.maxLoad).toLocaleString()} kg` : ""}
              onEdit={() => router.push("/kiosk/vehicle?section=maxload&from=final-confirm")}
            />
          </SectionCard>

          {error && (
            <div style={{
              background: "#FEF2F2", border: "2px solid #FCA5A5",
              borderRadius: 16, padding: "20px 28px",
              display: "flex", alignItems: "center", gap: 20,
            }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 24, fontWeight: 700, color: "#DC2626", margin: 0 }}>⚠ {error}</p>
              </div>
              <button
                onPointerDown={handleRegister}
                className="select-none touch-none"
                style={{
                  flexShrink: 0, width: 180, height: 64, fontSize: 24, fontWeight: 800,
                  background: "linear-gradient(180deg, #EF4444, #DC2626)",
                  color: "#fff", border: "none", borderRadius: 14, cursor: "pointer",
                  boxShadow: "0 4px 0 #991B1B",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                🔄 再試行
              </button>
            </div>
          )}
        </div>

        {/* 右：予約バナー＋受付ボタン */}
        <div className="flex flex-col flex-shrink-0" style={{ width: 320, gap: selectedReservation ? 20 : 0 }}>
          {/* 予約時間バナー（予約ありの場合のみ） */}
          {selectedReservation && (
            <div style={{
              flex: 1,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              background: "linear-gradient(160deg,#F59E0B 0%,#D97706 100%)",
              borderRadius: 28, gap: 6,
              boxShadow: "0 6px 0 #92400E, 0 12px 40px rgba(245,158,11,0.45)",
              padding: "20px 24px",
              border: "4px solid rgba(255,255,255,0.35)",
              position: "relative",
              overflow: "hidden",
            }}>
              {/* 背景装飾 */}
              <div style={{
                position: "absolute", top: -30, right: -30,
                width: 120, height: 120, borderRadius: "50%",
                background: "rgba(255,255,255,0.12)", pointerEvents: "none",
              }} />
              <div style={{
                position: "absolute", bottom: -20, left: -20,
                width: 80, height: 80, borderRadius: "50%",
                background: "rgba(255,255,255,0.08)", pointerEvents: "none",
              }} />
              {/* ラベル */}
              <span style={{
                fontSize: 20, fontWeight: 800, color: "#fff",
                background: "rgba(0,0,0,0.18)", borderRadius: 30,
                padding: "5px 20px", letterSpacing: "0.12em",
                zIndex: 1,
              }}>
                📅 予約時間
              </span>
              {/* 時間 */}
              <span style={{
                fontSize: 64, fontWeight: 900, color: "#fff",
                lineHeight: 1, zIndex: 1,
                textShadow: "0 2px 8px rgba(0,0,0,0.2)",
              }}>
                {selectedReservation.startTime}
              </span>
              <span style={{
                fontSize: 24, fontWeight: 800, color: "rgba(255,255,255,0.7)",
                zIndex: 1,
              }}>▼</span>
              <span style={{
                fontSize: 64, fontWeight: 900, color: "#fff",
                lineHeight: 1, zIndex: 1,
                textShadow: "0 2px 8px rgba(0,0,0,0.2)",
              }}>
                {selectedReservation.endTime}
              </span>
            </div>
          )}

          {/* 受付するボタン */}
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
                <span style={{
                  fontSize: selectedReservation ? 40 : 52, fontWeight: 900, color: "#fff",
                  letterSpacing: "0.12em", lineHeight: 1.3,
                }}>
                  受付する
                </span>
                <span style={{ fontSize: selectedReservation ? 18 : 22, color: "rgba(255,255,255,0.7)", letterSpacing: "0.06em" }}>
                  問題なければタップ
                </span>
              </>
            )}
          </button>
        </div>
        </div>
      </div>

      {/* ━━ 送信中オーバーレイ ━━ */}
      {loading && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.45)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 24, pointerEvents: "all",
        }}>
          <div style={{
            width: 120, height: 120, borderRadius: "50%",
            border: "6px solid rgba(255,255,255,0.2)",
            borderTopColor: "#2DD4BF",
            animation: "spin 1s linear infinite",
          }} />
          <span style={{ fontSize: 36, fontWeight: 800, color: "#fff", letterSpacing: "0.08em" }}>
            受付処理中...
          </span>
          <span style={{ fontSize: 20, color: "rgba(255,255,255,0.6)" }}>
            しばらくお待ちください
          </span>
          <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
        </div>
      )}

      {/* ━━ 下部注意文言 ━━ */}
      <div style={{
        height: 56, background: "#FFF8E1", borderTop: "2px solid #FDE68A",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 20, color: "#92400E", fontWeight: 600, letterSpacing: "0.03em" }}>
          ⚠ 各項目の「修正」ボタンをタップすると入力画面に戻ります。修正後、自動的にこの確認画面に戻ります。
        </span>
      </div>
    </div>
  );
}
