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
    // 受付登録済（checked_in / completed）の予約は非表示
    const active = (s.reservationCandidates ?? []).filter(
      (r) => r.status !== "checked_in" && r.status !== "completed"
    );
    setReservations(active);
  }, []);

  function selectReservation(r: ReservationCandidate) {
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
        <span style={{ fontSize: 44, fontWeight: 800, color: "#1E293B", letterSpacing: "0.08em" }}>
          予約が見つかりました
        </span>
        <span style={{ fontSize: 24, color: "#64748B", marginTop: 8 }}>
          該当する予約を選択してください
        </span>
      </div>

      {/* 予約カード一覧 + 予約なしボタン */}
      <div className="flex-1 flex flex-col items-center gap-4 px-12 py-4" style={{ overflow: "auto" }}>
        {reservations.map((r) => (
          <button
            key={r.id}
            onPointerDown={() => selectReservation(r)}
            className="w-full flex items-center rounded-2xl active:scale-[0.98] transition-transform"
            style={{
              maxWidth: 1200,
              background: "#fff",
              padding: "14px 28px",
              gap: 24,
              boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            }}
          >
            {/* 時間 */}
            <div className="flex items-center flex-shrink-0 gap-2" style={{ minWidth: 180 }}>
              <span style={{ fontSize: 38, fontWeight: 900, color: "#1a3a6b", lineHeight: 1 }}>
                {r.startTime}
              </span>
              <span style={{ fontSize: 20, color: "#94A3B8", fontWeight: 700 }}>〜</span>
              <span style={{ fontSize: 38, fontWeight: 900, color: "#1a3a6b", lineHeight: 1 }}>
                {r.endTime}
              </span>
            </div>

            {/* 区切り線 */}
            <div style={{ width: 2, alignSelf: "stretch", background: "#E2E8F0", borderRadius: 2 }} />

            {/* 情報 */}
            <div className="flex-1 flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 16, color: "#94A3B8", flexShrink: 0 }}>会社名</span>
                <span style={{ fontSize: 28, fontWeight: 800, color: "#1e293b" }}>{r.companyName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 16, color: "#94A3B8", flexShrink: 0 }}>ドライバー</span>
                <span style={{ fontSize: 28, fontWeight: 800, color: "#1e293b" }}>{r.driverName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 16, color: "#94A3B8", flexShrink: 0 }}>車両</span>
                <span style={{ fontSize: 24, fontWeight: 700, color: "#1e293b" }}>{r.vehicleNumber}</span>
              </div>
            </div>

            {/* 選択矢印 */}
            <div className="flex items-center justify-center flex-shrink-0"
              style={{
                width: 60, height: 60, borderRadius: "50%",
                background: "linear-gradient(180deg,#3B82F6,#2563EB)",
                boxShadow: "0 3px 0 #1E40AF",
              }}
            >
              <span style={{ fontSize: 28, color: "#fff", fontWeight: 900 }}>▶</span>
            </div>
          </button>
        ))}

        {/* 予約なしで受付ボタン（カードと同じスタイル） */}
        <button
          onPointerDown={skipReservation}
          className="w-full flex items-center justify-center rounded-2xl active:scale-[0.98] transition-transform"
          style={{
            maxWidth: 1200,
            background: "#F8FAFC",
            padding: "14px 28px",
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
      </div>
    </div>
  );
}
