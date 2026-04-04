"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getKioskSession, setKioskSession } from "@/lib/kioskState";
import { lookupByPhone, lookupReservation } from "@/lib/api";

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

// ── レイアウト定数 ──
const W        = 180;  // テンキーボタン幅
const WP       = 165;  // プレフィックスボタン幅
const WA       = 180;  // アクションボタン幅
const H        = 120;  // ボタン高さ
const GAP      = 24;   // ボタン間隔
const FONT_NUM   = 52;
const FONT_PRE   = 40;
const FONT_INPUT = 72;

const totalW = WP + GAP + (W * 3 + GAP * 2) + GAP + WA; // 981px

export default function PhonePage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [fromFinal, setFromFinal] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setFromFinal(params.get("from") === "final-confirm");
    const s = getKioskSession();
    setPhone(s.phone ?? "");
  }, []);

  const isValid = phone.length >= 10 && phone.length <= 11;

  async function submit(p: string) {
    const session = getKioskSession();
    setLoading(true);
    try {
      const [result, reservations] = await Promise.all([
        lookupByPhone(p, session.centerId),
        fromFinal ? Promise.resolve([]) : lookupReservation(p, session.centerId),
      ]);
      setKioskSession({
        phone: p,
        driverInput: { ...session.driverInput, phone: p },
        driverCandidates: result.drivers,
        vehicleCandidates: result.vehicles,
        selectedDriver: null,
        selectedVehicle: null,
        reservationCandidates: reservations,
        selectedReservation: null,
      });
      if (fromFinal) {
        router.push("/kiosk/final-confirm");
      } else if (reservations.length > 0) {
        router.push("/kiosk/reservation-select");
      } else {
        router.push("/kiosk/person");
      }
    } finally {
      setLoading(false);
    }
  }

  function press(d: string) {
    if (phone.length >= 11 || loading) return;
    const next = phone + d;
    setPhone(next);
    if (next.length >= 11) submit(next);
  }

  function pressPrefix(prefix: string) {
    if (loading) return;
    setPhone(prefix);
  }

  async function handleOk() {
    if (!isValid || loading) return;
    submit(phone);
  }

  const numBtn = `flex items-center justify-center font-black rounded-2xl bg-white border-2 border-gray-200
    text-gray-900 shadow-[0_5px_0_#CBD5E1] active:shadow-[0_1px_0_#CBD5E1] active:translate-y-[3px]
    select-none touch-none transition-all duration-75`;

  return (
    <div
      className="w-screen h-screen flex flex-col select-none overflow-hidden"
      style={{ background: "linear-gradient(160deg,#E8F4FD 0%,#D0E8FA 50%,#B8D8F6 100%)" }}
    >
      {/* ── ヘッダー（戻るボタン＋タイトル＋入力欄を含む濃い青エリア）── */}
      <div
        className="flex flex-col flex-shrink-0 items-center"
        style={{
          background: "linear-gradient(160deg,#1a3a6b 0%,#1E5799 100%)",
          paddingBottom: 52,
        }}
      >
        {/* 戻るボタン行 */}
        <div className="flex items-center px-8 gap-6 w-full" style={{ height: 84 }}>
          <button
            onPointerDown={() => router.push(fromFinal ? "/kiosk/final-confirm" : "/kiosk/caution")}
            className="flex items-center justify-center font-bold rounded-xl border-2 border-white text-white active:bg-blue-800 flex-shrink-0"
            style={{ height: 60, width: 160, fontSize: 28 }}
          >
            ◀ 戻る
          </button>
          <div style={{ flex: 1 }} />
          <StepDots current={1} />
        </div>

        {/* タイトル */}
        <div style={{ marginBottom: 20 }}>
          <span
            style={{
              fontSize: 48,
              fontWeight: 800,
              color: "#FFFFFF",
              letterSpacing: "0.12em",
            }}
          >
            電話番号を入力してください
          </span>
        </div>

        {/* 入力表示ボックス */}
        <div
          suppressHydrationWarning
          className="rounded-2xl border-4 flex items-center justify-center transition-colors"
          style={{
            width: totalW,
            height: 110,
            borderColor: phone ? "#F59E0B" : "rgba(255,255,255,0.55)",
            background: "#FFFFFF",
          }}
        >
          <span
            className="font-black tracking-widest"
            style={{ fontSize: FONT_INPUT, color: phone ? "#1a1a1a" : "#94a3b8" }}
          >
            {phone ? fmtPhone(phone) : "090-0000-0000"}
          </span>
        </div>
      </div>

      {/* ── テンキーエリア ── */}
      <div className="flex-1 flex flex-col items-center justify-center pb-6" style={{ gap: GAP + 8 }}>

        {/* 3カラムレイアウト */}
        <div className="flex" style={{ gap: GAP }}>

          {/* 左列: 070 / 080 / 090 */}
          <div className="flex flex-col" style={{ gap: GAP }}>
            {["070", "080", "090"].map((prefix) => (
              <button
                key={prefix}
                onPointerDown={() => pressPrefix(prefix)}
                className="flex items-center justify-center font-bold rounded-2xl text-white
                  shadow-[0_5px_0_#1E40AF] active:shadow-[0_1px_0_#1E40AF] active:translate-y-[3px]
                  select-none touch-none transition-all duration-75"
                style={{ width: WP, height: H, fontSize: FONT_PRE, background: "#3B82F6" }}
              >
                {prefix}
              </button>
            ))}
          </div>

          {/* 中央列: テンキー（1〜9 + 0） */}
          <div className="flex flex-col" style={{ gap: GAP }}>
            {[["1","2","3"],["4","5","6"],["7","8","9"]].map((row, ri) => (
              <div key={ri} className="flex" style={{ gap: GAP }}>
                {row.map((k) => (
                  <button key={k} onPointerDown={() => press(k)}
                    className={numBtn} style={{ width: W, height: H, fontSize: FONT_NUM }}>
                    {k}
                  </button>
                ))}
              </div>
            ))}
            <div className="flex" style={{ gap: GAP }}>
              <button onPointerDown={() => press("0")}
                className={numBtn}
                style={{ width: W * 3 + GAP * 2, height: H, fontSize: FONT_NUM }}>
                0
              </button>
            </div>
          </div>

          {/* 右列: 全消し / 1文字消す / OK */}
          <div className="flex flex-col" style={{ gap: GAP, width: WA }}>
            <button
              onPointerDown={() => setPhone("")}
              className="flex items-center justify-center font-bold rounded-2xl text-white
                shadow-[0_5px_0_#991B1B] active:shadow-[0_1px_0_#991B1B] active:translate-y-[3px]
                select-none touch-none transition-all duration-75"
              style={{ height: H, fontSize: 28, background: "#EF4444" }}
            >
              全消し
            </button>
            <button
              onPointerDown={() => setPhone(phone.slice(0, -1))}
              className="flex items-center justify-center font-bold rounded-2xl text-white
                shadow-[0_5px_0_#C2410C] active:shadow-[0_1px_0_#C2410C] active:translate-y-[3px]
                select-none touch-none transition-all duration-75"
              style={{ height: H, fontSize: 24, background: "#F97316" }}
            >
              1文字<br/>消す
            </button>
            <button
              onPointerDown={handleOk}
              disabled={!isValid || loading}
              className={`flex items-center justify-center font-black rounded-2xl text-white
                select-none touch-none transition-all duration-75 flex-1
                ${isValid && !loading
                  ? "shadow-[0_5px_0_#14532D] active:shadow-[0_1px_0_#14532D] active:translate-y-[3px]"
                  : "opacity-40 cursor-not-allowed"
                }`}
              style={{
                fontSize: FONT_NUM,
                background: isValid && !loading
                  ? "linear-gradient(180deg,#22C55E,#16A34A)"
                  : "#9CA3AF",
              }}
            >
              {loading ? "…" : "OK"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
