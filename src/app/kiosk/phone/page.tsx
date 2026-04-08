"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getKioskSession, setKioskSession } from "@/lib/kioskState";
import { lookupByPhone, lookupReservation } from "@/lib/api";

// ── 電話番号フォーマット（truck-berth-app準拠） ──
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
function isMobilePrefix(digits: string) {
  return MOBILE_PREFIXES.some((p) => digits.startsWith(p));
}
function fmtPhone(digits: string): string {
  if (digits.length === 0) return "";
  if (isMobilePrefix(digits)) {
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
  const [phoneError, setPhoneError] = useState("");

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
    try {
      const [result, reservations] = await Promise.all([
        lookupByPhone(p, session.centerId),
        fromFinal ? Promise.resolve([]) : lookupReservation(p, session.centerId, session.centerName),
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
      {/* ── ヘッダー（TOP同様の薄いバー）── */}
      <div
        className="flex items-center px-8 gap-6 flex-shrink-0"
        style={{ background: "#1a3a6b", height: 88 }}
      >
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
                select-none touch-none transition-all duration-75 flex-1
                ${isValid && !loading
                  ? "shadow-[0_5px_0_#0F766E] active:shadow-[0_1px_0_#0F766E] active:translate-y-[3px]"
                  : "opacity-40 cursor-not-allowed"
                }`}
              style={{
                fontSize: FONT_NUM,
                background: isValid && !loading
                  ? "linear-gradient(180deg,#2DD4BF,#0D9488)"
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
