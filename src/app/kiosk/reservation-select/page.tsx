"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getKioskSession, setKioskSession } from "@/lib/kioskState";
import type { ReservationCandidate } from "@/types/reception";
import PlateDisplay from "@/components/PlateDisplay";

/* ━━ ステップドット ━━ */
function StepDots({ current }: { current: number }) {
  const labels = ["電話番号", "お名前", "車　両", "最終確認"];
  return (
    <div className="flex items-center gap-4">
      {labels.map((label, i) => {
        const step = i + 1;
        const done = step < current;
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
                color: done ? "#166534" : active ? "#1e3a6b" : "rgba(255,255,255,0.5)",
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

export default function ReservationSelectPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState<ReservationCandidate[]>([]);
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    const s = getKioskSession();
    if (!s.phone || !s.centerId) {
      router.replace("/kiosk");
      return;
    }
    // 受付登録済（checked_in / completed）の予約は非表示
    const active = (s.reservationCandidates ?? []).filter(
      (r) => r.status !== "checked_in" && r.status !== "completed"
    );
    setReservations(active);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectReservation(r: ReservationCandidate) {
    if (navigating) return;
    setNavigating(true);
    const s = getKioskSession();

    // 記憶済みドライバーと一致するか検索
    const matchedDriver = (s.driverCandidates ?? []).find(
      (d) => d.companyName === r.companyName && d.name === r.driverName
    ) ?? null;

    // 記憶済み車両と一致するか検索
    const matchedVehicle = (s.vehicleCandidates ?? []).find(
      (v) =>
        v.plate.region === r.plateRegion &&
        v.plate.classNum === r.plateClassNum &&
        v.plate.hira === r.plateHira &&
        v.plate.number === r.plateNumber
    ) ?? null;

    setKioskSession({
      selectedReservation: r,
      driverInput: {
        companyName: r.companyName,
        driverName: r.driverName,
        phone: s.phone,
        maxLoad: r.maxLoad || matchedVehicle?.maxLoad || "",
      },
      plate: {
        region: r.plateRegion,
        classNum: r.plateClassNum,
        hira: r.plateHira,
        number: r.plateNumber,
      },
      selectedDriver: matchedDriver,
      selectedVehicle: matchedVehicle,
    });
    router.push("/kiosk/final-confirm");
  }

  function skipReservation() {
    if (navigating) return;
    setNavigating(true);
    setKioskSession({ selectedReservation: null });
    router.push("/kiosk/person");
  }

  return (
    <div
      className="w-screen h-screen flex flex-col select-none overflow-hidden"
      style={{ background: "#F5F0E8" }}
    >
      {/* ヘッダー */}
      <div className="flex items-center px-8 gap-6 flex-shrink-0" style={{ background: "#1a3a6b", height: 84 }}>
        <button
          onPointerDown={() => router.push("/kiosk/phone")}
          className="flex items-center justify-center font-bold rounded-xl border-2 border-white text-white active:bg-blue-800 flex-shrink-0"
          style={{ height: 60, width: 160, fontSize: 28 }}
        >
          ◀ 戻る
        </button>
        <div style={{ flex: 1 }} />
        <StepDots current={1} />
      </div>

      {/* タイトル */}
      <div className="flex flex-col items-center flex-shrink-0" style={{ marginTop: 8, marginBottom: 24 }}>
        {reservations.length > 0 ? (
          <>
            <span style={{ fontSize: 44, fontWeight: 800, color: "#1E293B", letterSpacing: "0.08em" }}>
              予約が見つかりました
            </span>
            <span style={{ fontSize: 24, color: "#64748B", marginTop: 8 }}>
              該当する予約を選択してください
            </span>
          </>
        ) : (
          <span style={{ fontSize: 44, fontWeight: 800, color: "#64748B", letterSpacing: "0.08em" }}>
            利用可能な予約はありません
          </span>
        )}
      </div>

      {/* 予約カード一覧 + 予約なしボタン */}
      <div className="flex-1 flex flex-col items-center gap-5 px-8 py-4" style={{ overflow: "auto" }}>
        {reservations.length === 0 ? (
          /* 予約が全て受付済み等で空の場合 */
          <div className="flex flex-col items-center justify-center" style={{ marginTop: 40, gap: 32 }}>
            <div style={{
              fontSize: 28, fontWeight: 700, color: "#94A3B8", textAlign: "center", lineHeight: 1.6,
            }}>
              該当する予約がすべて受付済みです
            </div>
            <button
              onPointerDown={skipReservation}
              className="flex items-center justify-center rounded-2xl active:scale-[0.98] transition-transform"
              style={{
                width: 600, height: 120,
                background: "linear-gradient(180deg,#3B82F6,#2563EB)",
                boxShadow: "0 6px 0 #1E40AF",
                gap: 16,
              }}
            >
              <span style={{ fontSize: 36, fontWeight: 900, color: "#fff" }}>
                予約なしで受付する
              </span>
              <div className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: 56, height: 56, borderRadius: "50%",
                  background: "rgba(255,255,255,0.25)",
                }}
              >
                <span style={{ fontSize: 28, color: "#fff", fontWeight: 900 }}>▶</span>
              </div>
            </button>
          </div>
        ) : (
          <>
            {reservations.map((r) => (
              <button
                key={r.id}
                onPointerDown={() => selectReservation(r)}
                className="w-full flex items-center rounded-2xl active:scale-[0.98] transition-transform"
                style={{
                  maxWidth: 1200,
                  minHeight: 180,
                  background: "#fff",
                  padding: "20px 24px",
                  gap: 20,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                }}
              >
                {/* ナンバープレート（左側） */}
                <div className="flex-shrink-0">
                  <PlateDisplay
                    plate={{
                      region: r.plateRegion,
                      classNum: r.plateClassNum,
                      hira: r.plateHira,
                      number: r.plateNumber,
                    }}
                    size="sm"
                  />
                </div>

                {/* 区切り線 */}
                <div style={{ width: 2, alignSelf: "stretch", background: "#E2E8F0", borderRadius: 2 }} />

                {/* 情報ブロック（右側） */}
                <div className="flex-1 flex flex-col justify-center gap-2" style={{ minWidth: 0 }}>
                  {/* 予約時間 */}
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 16, color: "#94A3B8", flexShrink: 0, fontWeight: 700 }}>予約</span>
                    <span style={{ fontSize: 36, fontWeight: 900, color: "#1a3a6b", lineHeight: 1 }}>
                      {r.startTime}
                    </span>
                    <span style={{ fontSize: 20, color: "#94A3B8", fontWeight: 700 }}>〜</span>
                    <span style={{ fontSize: 36, fontWeight: 900, color: "#1a3a6b", lineHeight: 1 }}>
                      {r.endTime}
                    </span>
                  </div>
                  {/* 会社名・ドライバー名 */}
                  <div className="flex items-center gap-4" style={{ marginTop: 4 }}>
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 15, color: "#94A3B8", flexShrink: 0 }}>会社</span>
                      <span style={{ fontSize: 26, fontWeight: 800, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.companyName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 15, color: "#94A3B8", flexShrink: 0 }}>氏名</span>
                      <span style={{ fontSize: 26, fontWeight: 800, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.driverName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 選択矢印 */}
                <div className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 64, height: 64, borderRadius: "50%",
                    background: "linear-gradient(180deg,#3B82F6,#2563EB)",
                    boxShadow: "0 4px 0 #1E40AF",
                  }}
                >
                  <span style={{ fontSize: 30, color: "#fff", fontWeight: 900 }}>▶</span>
                </div>
              </button>
            ))}

            {/* 予約なしで受付ボタン */}
            <button
              onPointerDown={skipReservation}
              className="w-full flex items-center justify-center rounded-2xl active:scale-[0.98] transition-transform"
              style={{
                maxWidth: 1200,
                minHeight: 100,
                background: "#F8FAFC",
                padding: "20px 28px",
                gap: 16,
                boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                border: "2px dashed #CBD5E1",
              }}
            >
              <span style={{ fontSize: 28, fontWeight: 800, color: "#64748B" }}>
                予約なしで受付する
              </span>
              <div className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: "#94A3B8",
                }}
              >
                <span style={{ fontSize: 22, color: "#fff", fontWeight: 900 }}>▶</span>
              </div>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
