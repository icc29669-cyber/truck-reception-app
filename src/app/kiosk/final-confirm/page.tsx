"use client";
import KioskSteps from "@/components/KioskSteps";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getKioskSession, setKioskSession, clearKioskSession, RECEPTION_REQUEST_KEY } from "@/lib/kioskState";
import { getPendingRequestId } from "@/lib/pendingRequest";
import { registerReception } from "@/lib/api";
import { formatPlate } from "@/types/reception";
import PlateDisplay from "@/components/PlateDisplay";
import { fmtPhone } from "@/lib/phoneFormat";


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
      minHeight: tall ? 90 : 76, gap: 0,
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
        flex: 1, fontSize: 46, fontWeight: 800,
        color: value ? "#26251e" : "#EF4444",
        letterSpacing: "0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        lineHeight: 1.2,
      }}>
        {value || "未入力"}
      </span>
      {/* 修正ボタン */}
      <button
        onClick={onEdit}
        className="select-none touch-manipulation"
        style={{
          width: 140, height: 56, fontSize: 22, fontWeight: 700,
          background: "linear-gradient(180deg, #3B82F6, #2563EB)",
          color: "#fff", border: "none",
          borderRadius: 12, flexShrink: 0, cursor: "pointer",
          boxShadow: "0 3px 0 #1d4ed8",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          marginLeft: 16,
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
  const submittingRef = useRef(false);  // 連打ガード（React state より早く反映される）
  const [sessionData, setSessionData] = useState<ReturnType<typeof getKioskSession> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // 確認モーダル廃止: 受付ボタンで直接受付

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const s = getKioskSession();
    if (s.receptionResult) {
      router.replace("/kiosk/complete");
      return;
    }
    if (!s.phone || !s.centerId) {
      router.replace("/kiosk");
      return;
    }
    setSessionData(s);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRegister() {
    if (!sessionData) return;
    if (submittingRef.current) return;  // 連打: React render を待たずに即 block
    submittingRef.current = true;
    setLoading(true);
    setError("");
    try {
      const payload = {
        phone: sessionData.phone || sessionData.driverInput.phone,
        centerId: sessionData.centerId,
        plate: sessionData.plate,
        driverInput: sessionData.driverInput,
        reservationId: sessionData.selectedReservation?.id,
        reservationSource: sessionData.selectedReservation?.source,
      };
      const requestId = getPendingRequestId(RECEPTION_REQUEST_KEY, payload);
      const result = await registerReception({ ...payload, requestId });
      setKioskSession({ receptionResult: result });
      // 次の来場でclearKioskSessionするまで送信IDを保持し、結果保存後の再読込も回復できる。
      router.push("/kiosk/complete");
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      // ユーザーフレンドリーなメッセージに変換
      let friendly = raw || "受付処理中にエラーが発生しました。もう一度お試しください。";
      if (raw.includes("fetch") || raw.includes("network") || raw.includes("Network")) {
        friendly = "通信エラーが発生しました。ネットワーク接続を確認して再試行してください。";
      } else if (raw.includes("timeout") || raw.includes("Timeout")) {
        friendly = "サーバーの応答がタイムアウトしました。しばらくお待ちいただき再試行してください。";
      } else if (raw.includes("500") || raw.includes("server")) {
        friendly = "サーバーエラーが発生しました。しばらくお待ちいただき再試行してください。";
      }
      setError(friendly);
      setLoading(false);
      submittingRef.current = false;  // エラー時は再試行可能に
    }
  }

  if (!sessionData) return <div className="w-screen h-screen" style={{ background: "#f2f1ed" }} />;

  const { driverInput, plate, phone, selectedReservation } = sessionData;
  const plateStr = formatPlate(plate);
  const isComplete = !!(driverInput.companyName && driverInput.driverName && plateStr && driverInput.maxLoad);

  const phoneComplete = !!(phone || driverInput.phone);
  const personComplete = !!(driverInput.companyName && driverInput.driverName);
  const vehicleComplete = !!plateStr;

  return (
    <div className="w-screen h-screen flex flex-col select-none overflow-hidden"
      style={{ background: "#f2f1ed" }}>

      {/* ━━ ヘッダー（TOP同様の薄いバー）━━ */}
      <div className="flex items-center flex-shrink-0 px-14"
        style={{ background: "#1a3a6b", height: 96 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="button"
            onClick={() => { clearKioskSession(); router.push("/kiosk"); }}
            className="flex items-center justify-center font-bold rounded-xl border-2 border-white text-white active:bg-blue-800 flex-shrink-0 select-none touch-manipulation"
            style={{ height: 60, width: 180, fontSize: 22, lineHeight: 1.3, textAlign: "center" }}
          >🔄 最初から</button>
          {/* 車両選択に戻る — 候補があれば select 画面、なければ地名入力から */}
          <button
            type="button"
            onClick={() => router.push("/kiosk/vehicle?back=true")}
            className="flex items-center justify-center font-bold rounded-xl border-2 border-white/60 text-white active:bg-blue-800 flex-shrink-0 select-none touch-manipulation"
            style={{ height: 60, width: 220, fontSize: 22, lineHeight: 1.3, textAlign: "center" }}
          >◀ 車両選択へ戻る</button>
        </div>
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <KioskSteps large current={4} completed={[phoneComplete, personComplete, vehicleComplete, true]} />
        </div>
        <div style={{ width: 160 }} />
      </div>
      {/* タイトル（ベージュ背景上）*/}
      <div style={{ textAlign: "center", padding: "16px 0 10px" }}>
        <div style={{ fontSize: 48, fontWeight: 800, color: "#26251e", letterSpacing: "0.1em" }}>
          内容をご確認ください
        </div>
        <div style={{ fontSize: 20, color: "#64748B", marginTop: 2, letterSpacing: "0.08em" }}>
          修正したい項目をタッチしてください
        </div>
      </div>

      {/* ━━ メインコンテンツ ━━ */}
      <div className="flex-1 flex items-center overflow-hidden" style={{ padding: "8px 56px 12px 72px" }}>
        <div className="flex w-full" style={{ gap: 36 }}>

        {/* 左：セクションカード群 */}
        <div className="flex flex-col flex-1" style={{ gap: 20 }}>

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
            <div style={{ display: "flex", alignItems: "stretch" }}>
              {/* 左: ナンバープレート（大きめ表示） */}
              <div style={{
                flexShrink: 0, padding: "24px 40px",
                display: "flex", alignItems: "center", justifyContent: "center",
                borderRight: "1px solid #F0F3F7",
              }}>
                <PlateDisplay plate={plate} size="lg" />
              </div>
              {/* 右: 個別フィールド + 最大積載量 */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr",
                padding: "14px 60px 14px 16px",
                gap: "10px 20px",
              }}>
                {([
                  { label: "地名", value: plate.region, section: "region" },
                  { label: "分類番号", value: plate.classNum, section: "classNum" },
                  { label: "ひらがな", value: plate.hira, section: "hira" },
                  { label: "一連番号", value: plate.number, section: "number" },
                ] as const).map(({ label, value, section }) => (
                  <button
                    key={section}
                    onClick={() => router.push(`/kiosk/vehicle?section=${section}&from=final-confirm`)}
                    className="select-none touch-manipulation"
                    style={{
                      display: "flex", alignItems: "center",
                      background: "#F1F5F9", borderRadius: 14,
                      border: "1.5px solid #E2E8F0", cursor: "pointer",
                      padding: "10px 16px", gap: 10,
                      minHeight: 72,
                    }}
                  >
                    <span style={{
                      fontSize: 16, fontWeight: 600, color: "#94A3B8",
                      flexShrink: 0, width: 70,
                    }}>
                      {label}
                    </span>
                    <span style={{
                      flex: 1, fontSize: 40, fontWeight: 800,
                      color: value ? "#26251e" : "#EF4444",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {value || "未入力"}
                    </span>
                    <span style={{
                      height: 48, fontSize: 20, fontWeight: 700,
                      background: "linear-gradient(180deg, #3B82F6, #2563EB)",
                      color: "#fff", borderRadius: 12,
                      boxShadow: "0 2px 0 #1d4ed8",
                      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
                      padding: "0 16px", whiteSpace: "nowrap", flexShrink: 0,
                    }}>
                      <span style={{ fontSize: 16 }}>✎</span> 修正
                    </span>
                  </button>
                ))}
              </div>
              <FieldRow
                label="最大積載量"
                value={driverInput.maxLoad ? `${Number(driverInput.maxLoad).toLocaleString()} kg` : ""}
                onEdit={() => router.push("/kiosk/vehicle?section=maxload&from=final-confirm")}
              />
              </div>
            </div>
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
                onClick={handleRegister}
                className="select-none touch-manipulation"
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
        <div className="flex flex-col flex-shrink-0" style={{ width: 360, gap: selectedReservation ? 20 : 0 }}>
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
            onClick={() => { if (!loading && isComplete) handleRegister(); }}
            disabled={loading || !isComplete}
            className="flex flex-col items-center justify-center select-none touch-manipulation"
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
                  問題なければタッチ
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
          ⚠ 各項目の「修正」ボタンをタッチすると入力画面に戻ります。修正後、自動的にこの確認画面に戻ります。
        </span>
      </div>
    </div>
  );
}
