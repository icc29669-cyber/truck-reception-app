"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getKioskSession, setKioskSession } from "@/lib/kioskState";
import { lookupByPhone } from "@/lib/api";

function fmtPhone(d: string): string {
  if (!d) return "";
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

export default function PhonePage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const s = getKioskSession();
    setPhone(s.phone ?? "");
  }, []);

  const isValid = phone.length >= 10 && phone.length <= 11;

  async function submit(p: string) {
    const session = getKioskSession();
    setLoading(true);
    try {
      const result = await lookupByPhone(p, session.centerId);
      setKioskSession({
        phone: p,
        driverInput: { ...session.driverInput, phone: p },
        driverCandidates: result.drivers,
        vehicleCandidates: result.vehicles,
        selectedDriver: null,
        selectedVehicle: null,
      });
      router.push("/kiosk/person");
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

  const W   = 180;  // テンキーボタン幅
  const WP  = 165;  // プレフィックスボタン幅
  const WA  = 180;  // アクションボタン幅
  const H   = 120;  // ボタン高さ
  const GAP = 24;   // ボタン間隔

  // 3カラム合計幅（プレフィックス列 + テンキー列 + アクション列）
  const totalW = WP + GAP + (W * 3 + GAP * 2) + GAP + WA;

  const numBtn = `flex items-center justify-center font-black rounded-2xl bg-white border-2 border-gray-200
    text-gray-900 shadow-[0_5px_0_#CBD5E1] active:shadow-[0_1px_0_#CBD5E1] active:translate-y-[3px]
    select-none touch-none transition-all duration-75`;

  return (
    <div
      className="w-screen h-screen flex flex-col select-none overflow-hidden"
      style={{ background: "linear-gradient(160deg,#E8F4FD 0%,#D0E8FA 50%,#B8D8F6 100%)" }}
    >
      {/* ヘッダー */}
      <div
        className="flex items-center px-8 flex-shrink-0"
        style={{ background: "linear-gradient(90deg,#1a3a6b 0%,#1E5799 100%)", height: 80 }}
      >
        <button
          onPointerDown={() => router.push("/kiosk/caution")}
          className="flex items-center justify-center font-bold rounded-xl border-2 border-white text-white active:bg-blue-800"
          style={{ height: 56, width: 140, fontSize: 26 }}
        >
          戻る
        </button>
        <div style={{ flex: 1 }} />
        <div style={{ width: 140 }} />
      </div>

      {/* メインエリア */}
      <div className="flex-1 flex flex-col items-center justify-center pb-6" style={{ gap: GAP + 8 }}>

        {/* ── ラベル＋入力表示（同じ枠）── */}
        <div
          suppressHydrationWarning
          className="rounded-2xl border-4 flex flex-col items-center justify-center transition-colors"
          style={{
            width: totalW,
            borderColor: phone ? "#F59E0B" : "#93C5FD",
            background: phone ? "#FFF9C4" : "rgba(255,255,255,0.72)",
            paddingTop: 18,
            paddingBottom: 18,
            gap: 6,
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: phone ? "#92400E" : "#1a3a6b",
              letterSpacing: "0.12em",
            }}
          >
            電話番号を入力してください
          </div>
          <span
            className="font-black tracking-widest"
            style={{ fontSize: 72, color: phone ? "#1a1a1a" : "#94a3b8" }}
          >
            {phone ? fmtPhone(phone) : "090-0000-0000"}
          </span>
        </div>

        {/* ── 3カラムレイアウト ── */}
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
                style={{ width: WP, height: H, fontSize: 34, background: "#3B82F6" }}
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
                    className={numBtn} style={{ width: W, height: H, fontSize: 52 }}>
                    {k}
                  </button>
                ))}
              </div>
            ))}
            <div className="flex" style={{ gap: GAP }}>
              <button onPointerDown={() => press("0")}
                className={numBtn}
                style={{ width: W * 3 + GAP * 2, height: H, fontSize: 52 }}>
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
                fontSize: 52,
                background: isValid && !loading ? "#22C55E" : "#9CA3AF",
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
