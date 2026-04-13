"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getKioskSession, setKioskSession } from "@/lib/kioskState";
import { lookupByPhone, lookupReservation } from "@/lib/api";
import { fmtPhone, isMobilePrefix, getJpAreaMap } from "@/lib/phoneFormat";

const JP_AREA = getJpAreaMap();

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

// ── レイアウト定数 ──
const W        = 180;  // テンキーボタン幅
const WP       = 165;  // プレフィックスボタン幅
const WA       = 200;  // アクションボタン幅（OK大型化に合わせ拡大）
const H        = 130;  // ボタン高さ（手袋対応で130px）
const GAP      = 16;   // ボタン間隔
const FONT_NUM   = 52;
const FONT_PRE   = 40;
const FONT_INPUT = 72;

const totalW = WP + GAP + (W * 3 + GAP * 2) + GAP + WA; // 981px

export default function PhonePage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [fromFinal, setFromFinal] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setFromFinal(params.get("from") === "final-confirm");
    const s = getKioskSession();
    setPhone(s.phone ?? "");
  }, []);

  // バリデーション
  function validatePhone(p: string): string {
    if (p.length === 0) return "";
    if (!p.startsWith("0")) return "電話番号は「0」から始めてください";
    if (p.length >= 2 && p.startsWith("00")) return "「00」から始まる番号は無効です";
    const isMob = isMobilePrefix(p);
    if (isMob && p.length === 11) return "";
    if (!isMob && p.length === 10) return "";
    if (p.length >= 3 && !isMob && !Object.keys(JP_AREA).some(a => p.startsWith(a)) && !p.startsWith("050")) {
      return "有効な市外局番が見つかりません";
    }
    return "";
  }

  const isLengthOk = isMobilePrefix(phone) ? phone.length === 11 : phone.length === 10;
  const isValid = isLengthOk && !phone.startsWith("00") && phone.startsWith("0");

  async function submit(p: string) {
    const session = getKioskSession();
    setLoading(true);
    setError("");
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const [result, reservations] = await Promise.all([
        lookupByPhone(p, session.centerId, controller.signal),
        fromFinal ? Promise.resolve([]) : lookupReservation(p, session.centerId, session.centerName, controller.signal),
      ]);
      clearTimeout(timeoutId);
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
      } else if (
        result.drivers.length === 1 &&
        result.vehicles.length === 1 &&
        reservations.length === 0
      ) {
        // ドライバー1名・車両1台のみ → 選択画面をスキップして確認画面へ直行
        const d = result.drivers[0];
        const v = result.vehicles[0];
        setKioskSession({
          selectedDriver: d,
          selectedVehicle: v,
          driverInput: {
            ...session.driverInput,
            phone: p,
            companyName: d.companyName,
            driverName: d.name,
            maxLoad: v.maxLoad,
          },
          plate: v.plate,
        });
        router.push("/kiosk/data-confirm");
      } else if (
        result.drivers.length === 1 &&
        result.vehicles.length === 0 &&
        reservations.length === 0
      ) {
        // ドライバー1名・車両なし → ドライバー自動選択して確認画面へ
        const d = result.drivers[0];
        setKioskSession({
          selectedDriver: d,
          driverInput: {
            ...session.driverInput,
            phone: p,
            companyName: d.companyName,
            driverName: d.name,
          },
        });
        router.push("/kiosk/data-confirm");
      } else {
        router.push("/kiosk/person");
      }
    } catch {
      setError("検索に失敗しました。もう一度お試しください。");
      setLoading(false);
    }
  }

  function press(d: string) {
    if (phone.length >= 11 || loading) return;
    setError("");
    const next = phone + d;
    setPhone(next);
    const err = validatePhone(next);
    setPhoneError(err);
    if (err) return; // エラーがあれば自動送信しない
    // 携帯は11桁で自動送信、固定は10桁で自動送信
    if (isMobilePrefix(next) && next.length >= 11) submit(next);
    else if (!isMobilePrefix(next) && next.length >= 10) submit(next);
  }

  function pressPrefix(prefix: string) {
    if (loading) return;
    setPhone(prefix);
    setPhoneError("");
    setError("");
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
      style={{ background: "#F5F0E8" }}
    >
      {/* ── スピナーアニメーション ── */}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── フルページローディングオーバーレイ ── */}
      {loading && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", gap: 24,
        }}>
          <div style={{
            width: 80, height: 80, border: "8px solid rgba(255,255,255,0.3)",
            borderTopColor: "#fff", borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }} />
          <div style={{ color: "#fff", fontSize: 32, fontWeight: 900 }}>
            検索中...
          </div>
        </div>
      )}

      {/* ── ヘッダー（TOP同様の薄いバー）── */}
      <div
        className="flex items-center px-8 gap-6 flex-shrink-0"
        style={{ background: "#1a3a6b", height: 88 }}
      >
        <button
          onPointerDown={() => router.push(fromFinal ? "/kiosk/final-confirm" : "/kiosk/caution")}
          className="flex items-center justify-center font-bold rounded-xl border-2 border-white text-white active:bg-blue-800 flex-shrink-0"
          style={{ height: 80, width: 160, fontSize: 28 }}
        >
          ◀ 戻る
        </button>
        <div style={{ flex: 1 }} />
        <StepDots current={1} />
      </div>

      {/* ── タイトル＋入力欄（ベージュ背景上）── */}
      <div className="flex flex-col items-center flex-shrink-0" style={{ padding: "24px 0 20px" }}>
        <div style={{ marginBottom: 20 }}>
          <span style={{ fontSize: 48, fontWeight: 800, color: "#1E293B", letterSpacing: "0.1em" }}>
            電話番号を入力してください
          </span>
        </div>
        <div
          suppressHydrationWarning
          className="rounded-2xl border-4 flex items-center justify-center transition-colors"
          style={{
            width: totalW,
            height: 110,
            borderColor: phone ? "#F59E0B" : "#CBD5E1",
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
        {phoneError && (
          <div style={{
            marginTop: 10, padding: "8px 24px",
            background: "rgba(239,68,68,0.12)", borderRadius: 12,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 24, color: "#DC2626" }}>⚠</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: "#DC2626" }}>{phoneError}</span>
          </div>
        )}
        {error && (
          <div style={{
            marginTop: 14, padding: "18px 36px",
            background: "#FEE2E2", border: "3px solid #EF4444", borderRadius: 16,
            display: "flex", alignItems: "center", gap: 14,
            maxWidth: totalW,
          }}>
            <span style={{ fontSize: 36, color: "#DC2626", flexShrink: 0 }}>⚠</span>
            <span style={{ fontSize: 28, fontWeight: 800, color: "#DC2626" }}>{error}</span>
          </div>
        )}
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
              onPointerDown={() => { setPhone(""); setPhoneError(""); }}
              className="flex items-center justify-center font-bold rounded-2xl text-white
                shadow-[0_5px_0_#991B1B] active:shadow-[0_1px_0_#991B1B] active:translate-y-[3px]
                select-none touch-none transition-all duration-75"
              style={{ height: H, fontSize: 28, background: "#EF4444" }}
            >
              全消し
            </button>
            <button
              onPointerDown={() => { const next = phone.slice(0, -1); setPhone(next); setPhoneError(validatePhone(next)); }}
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
                select-none touch-none transition-all duration-75
                ${isValid && !loading
                  ? "shadow-[0_8px_0_#0F766E] active:shadow-[0_2px_0_#0F766E] active:translate-y-[5px]"
                  : "opacity-40 cursor-not-allowed"
                }`}
              style={{
                minHeight: 200,
                flex: 1,
                fontSize: 64,
                letterSpacing: "0.1em",
                background: isValid && !loading
                  ? "linear-gradient(180deg,#34D399,#059669)"
                  : "#9CA3AF",
              }}
            >
              {loading ? "検索中…" : "OK"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
