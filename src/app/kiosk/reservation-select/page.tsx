"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getKioskSession, setKioskSession } from "@/lib/kioskState";
import type { ReservationCandidate } from "@/types/reception";

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

  useEffect(() => {
    const s = getKioskSession();
    setReservations(s.reservationCandidates ?? []);
  }, []);

  function selectReservation(r: ReservationCandidate) {
    const s = getKioskSession();
    setKioskSession({
      selectedReservation: r,
      driverInput: {
        companyName: r.companyName,
        driverName: r.driverName,
        phone: s.phone,
        maxLoad: r.maxLoad,
      },
      plate: {
        region: r.plateRegion,
        classNum: r.plateClassNum,
        hira: r.plateHira,
        number: r.plateNumber,
      },
      selectedDriver: null,
      selectedVehicle: null,
    });
    router.push("/kiosk/final-confirm");
  }

  function skipReservation() {
    setKioskSession({ selectedReservation: null });
    router.push("/kiosk/person");
  }

  return (
    <div
      className="w-screen h-screen flex flex-col select-none overflow-hidden"
      style={{ background: "linear-gradient(160deg,#1a3a6b 0%,#1E5799 100%)" }}
    >
      {/* ヘッダー */}
      <div className="flex items-center px-8 gap-6 flex-shrink-0" style={{ height: 84 }}>
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
        <span style={{ fontSize: 44, fontWeight: 800, color: "#fff", letterSpacing: "0.08em" }}>
          予約が見つかりました
        </span>
        <span style={{ fontSize: 24, color: "rgba(255,255,255,0.7)", marginTop: 8 }}>
          該当する予約を選択してください
        </span>
      </div>

      {/* 予約カード一覧 */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-12" style={{ overflow: "auto" }}>
        {reservations.map((r) => (
          <button
            key={r.id}
            onPointerDown={() => selectReservation(r)}
            className="w-full flex items-center rounded-2xl active:scale-[0.98] transition-transform"
            style={{
              maxWidth: 1200,
              background: "#fff",
              padding: "28px 40px",
              gap: 40,
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            }}
          >
            {/* 時間 */}
            <div className="flex flex-col items-center flex-shrink-0" style={{ minWidth: 220 }}>
              <div style={{
                fontSize: 20, fontWeight: 700, color: "#1a3a6b",
                background: "#E0EDFF", borderRadius: 12, padding: "6px 20px",
                marginBottom: 8,
              }}>
                予約時間
              </div>
              <div style={{ fontSize: 52, fontWeight: 900, color: "#1a3a6b", lineHeight: 1.1 }}>
                {r.startTime}
              </div>
              <div style={{ fontSize: 24, color: "#64748b", margin: "4px 0" }}>〜</div>
              <div style={{ fontSize: 52, fontWeight: 900, color: "#1a3a6b", lineHeight: 1.1 }}>
                {r.endTime}
              </div>
            </div>

            {/* 区切り線 */}
            <div style={{ width: 3, alignSelf: "stretch", background: "#E2E8F0", borderRadius: 2 }} />

            {/* 情報 */}
            <div className="flex-1 flex flex-col gap-3">
              <div className="flex items-center gap-4">
                <span style={{ fontSize: 20, color: "#64748b", minWidth: 100 }}>会社名</span>
                <span style={{ fontSize: 32, fontWeight: 800, color: "#1e293b" }}>{r.companyName}</span>
              </div>
              <div className="flex items-center gap-4">
                <span style={{ fontSize: 20, color: "#64748b", minWidth: 100 }}>ドライバー</span>
                <span style={{ fontSize: 32, fontWeight: 800, color: "#1e293b" }}>{r.driverName}</span>
              </div>
              <div className="flex items-center gap-4">
                <span style={{ fontSize: 20, color: "#64748b", minWidth: 100 }}>車両番号</span>
                <span style={{ fontSize: 28, fontWeight: 700, color: "#1e293b" }}>{r.vehicleNumber}</span>
              </div>
            </div>

            {/* 選択矢印 */}
            <div className="flex items-center justify-center flex-shrink-0"
              style={{
                width: 80, height: 80, borderRadius: "50%",
                background: "linear-gradient(180deg,#3B82F6,#2563EB)",
                boxShadow: "0 4px 0 #1E40AF",
              }}
            >
              <span style={{ fontSize: 36, color: "#fff", fontWeight: 900 }}>▶</span>
            </div>
          </button>
        ))}
      </div>

      {/* 予約なしで受付ボタン */}
      <div className="flex justify-center flex-shrink-0" style={{ padding: "24px 0 36px" }}>
        <button
          onPointerDown={skipReservation}
          className="flex items-center justify-center font-bold rounded-2xl active:scale-[0.97] transition-transform"
          style={{
            width: 600,
            height: 100,
            fontSize: 34,
            color: "#fff",
            background: "rgba(255,255,255,0.15)",
            border: "3px solid rgba(255,255,255,0.4)",
            borderRadius: 20,
          }}
        >
          予約なしで受付する ▶
        </button>
      </div>
    </div>
  );
}
