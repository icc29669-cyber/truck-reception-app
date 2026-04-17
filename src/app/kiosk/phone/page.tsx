"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getKioskSession, setKioskSession } from "@/lib/kioskState";
import { lookupByPhone, lookupReservation } from "@/lib/api";
import { fmtPhone, isMobilePrefix, getJpAreaMap } from "@/lib/phoneFormat";

const JP_AREA = getJpAreaMap();

/* ━━ ステップインジケータ ━━ */
function StepDots({ current }: { current: number }) {
  const labels = ["電話番号", "お名前", "車　両", "最終確認"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {labels.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 66 }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: done ? "#4ade80" : active ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.12)",
                border: `2.5px solid ${done ? "#22c55e" : active ? "#fff" : "rgba(255,255,255,0.25)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, fontWeight: 900,
                color: done ? "#166534" : active ? "#1e3a6b" : "rgba(255,255,255,0.35)",
                transition: "all 0.3s ease",
              }}>
                {done ? "✓" : step}
              </div>
              <span style={{
                fontSize: 12.5, fontWeight: 700, marginTop: 3,
                color: active ? "#fff" : done ? "#bbf7d0" : "rgba(255,255,255,0.3)",
                whiteSpace: "nowrap",
              }}>{label}</span>
            </div>
            {i < labels.length - 1 && (
              <div style={{
                width: 36, height: 2.5,
                background: done ? "#4ade80" : "rgba(255,255,255,0.12)",
                borderRadius: 2, marginBottom: 16,
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ━━ レイアウト定数 ━━ */
const W   = 190;
const WP  = 170;
const WA  = 210;
const H   = 155;
const GAP = 14;
const totalW = WP + GAP + (W * 3 + GAP * 2) + GAP + WA;

export default function PhonePage() {
  const router = useRouter();
  const [phone, setPhone]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [fromFinal, setFromFinal] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [error, setError]         = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setFromFinal(params.get("from") === "final-confirm");
    const s = getKioskSession();
    setPhone(s.phone ?? "");
  }, []);

  /* ── バリデーション ── */
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
  const isValid    = isLengthOk && !phone.startsWith("00") && phone.startsWith("0");

  /* ── 送信 ── */
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
      // 受付済み・完了済みを除いた有効な予約のみ
      const activeReservations = reservations.filter(
        (r: { status: string }) => r.status !== "checked_in" && r.status !== "completed"
      );
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
      } else if (activeReservations.length > 0) {
        router.push("/kiosk/reservation-select");
      } else {
        // 1件でも選択画面を表示する（自動スキップしない）
        router.push("/kiosk/person");
      }
    } catch {
      setError("検索に失敗しました。もう一度お試しください。");
      setLoading(false);
    }
  }

  /* ── キー押下（自動送信なし — OKボタンで送信） ── */
  function press(d: string) {
    if (phone.length >= 11 || loading) return;
    setError("");
    const next = phone + d;
    setPhone(next);
    setPhoneError(validatePhone(next));
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

  /* ── ボタン状態 ── */
  const okActive  = isValid && !loading;
  const okLoading = loading;

  return (
    <div style={{
      width: "100vw", height: "100vh",
      display: "flex", flexDirection: "column",
      background: "#F5F0E8",
      overflow: "hidden", userSelect: "none",
    }}>

      {/* ── CSS Animations ── */}
      <style>{`
        @keyframes kiosk-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes kiosk-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes kiosk-pulse-border {
          0%, 100% { border-color: #0D9488; box-shadow: 0 0 0 4px rgba(13,148,136,0.10); }
          50%      { border-color: #14B8A6; box-shadow: 0 0 0 6px rgba(20,184,166,0.18); }
        }
        .kiosk-num:active { transform: translateY(3px); box-shadow: 0 1px 0 #CBD5E1 !important; }
        .kiosk-prefix:active { transform: translateY(3px); box-shadow: 0 1px 0 #1D4ED8 !important; }
        .kiosk-del:active { transform: translateY(3px); }
        .kiosk-ok:active:not(:disabled) { transform: translateY(4px); box-shadow: 0 2px 0 #047857 !important; }
      `}</style>

      {/* ── 全画面ローディング ── */}
      {loading && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(15,23,42,0.55)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", gap: 28,
          animation: "kiosk-fade-in 0.25s ease-out",
        }}>
          <div style={{ position: "relative", width: 96, height: 96 }}>
            <div style={{
              width: 96, height: 96,
              border: "5px solid rgba(255,255,255,0.1)",
              borderTopColor: "#2DD4BF",
              borderRightColor: "#2DD4BF",
              borderRadius: "50%",
              animation: "kiosk-spin 0.9s ease-in-out infinite",
            }} />
            <div style={{
              position: "absolute", inset: 14,
              border: "4px solid rgba(255,255,255,0.06)",
              borderBottomColor: "#60A5FA",
              borderLeftColor: "#60A5FA",
              borderRadius: "50%",
              animation: "kiosk-spin 1.4s linear infinite reverse",
            }} />
          </div>
          <span style={{
            color: "rgba(255,255,255,0.85)", fontSize: 24,
            fontWeight: 600, letterSpacing: "0.25em",
          }}>
            検索しています
          </span>
        </div>
      )}

      {/* ━━ ヘッダー ━━ */}
      <div style={{
        display: "flex", alignItems: "center",
        padding: "0 28px", gap: 20, flexShrink: 0,
        background: "linear-gradient(135deg, #172554 0%, #1e3a6b 100%)",
        height: 82,
        boxShadow: "0 2px 16px rgba(0,0,0,0.18)",
      }}>
        <button
          onPointerDown={() => router.push(fromFinal ? "/kiosk/final-confirm" : "/kiosk/caution")}
          style={{
            height: 56, width: 130, fontSize: 24, fontWeight: 700,
            background: "rgba(255,255,255,0.08)",
            border: "2px solid rgba(255,255,255,0.35)",
            borderRadius: 12, color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", letterSpacing: "0.04em",
          }}
        >
          ◀ 戻る
        </button>
        <div style={{ flex: 1 }} />
        <StepDots current={1} />
      </div>

      {/* ━━ サブヘッダー：左にSTEP、中央に大きな指示 ━━ */}
      <div style={{
        display: "flex", alignItems: "center", flexShrink: 0,
        padding: "10px 40px 12px", position: "relative",
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14, position: "absolute", left: 40 }}>
          <div style={{
            fontSize: 13, color: "#64748B", letterSpacing: "0.22em", fontWeight: 800,
            padding: "4px 10px", background: "#E2E8F0", borderRadius: 4,
          }}>
            STEP 1 / 4
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#1E293B", letterSpacing: "0.04em" }}>
            電話番号
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <div style={{
            fontSize: 26, fontWeight: 900, color: "#0D9488", letterSpacing: "0.04em",
            display: "flex", alignItems: "center", gap: 14,
            background: "#F0FDFA", padding: "12px 28px", borderRadius: 14,
            border: "3px solid #5EEAD4",
            boxShadow: "0 4px 12px rgba(13,148,136,0.12)",
          }}>
            <span style={{ fontSize: 28 }}>👉</span>
            携帯電話の番号（11桁）を入力してください
          </div>
        </div>
      </div>

      {/* ━━ メインコンテンツ ━━ */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 20, paddingBottom: 16, paddingLeft: 40, paddingRight: 40,
        minHeight: 0,
      }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 20, minWidth: 0, justifyContent: "center" }}>

        {/* 番号表示エリア */}
        <div style={{
          width: totalW, height: 116, borderRadius: 18,
          border: `3px solid ${phone ? "#0D9488" : "#D1CCC3"}`,
          background: phone
            ? "linear-gradient(180deg, #FFFFFF 0%, #F0FDFA 100%)"
            : "#FFFFFF",
          boxShadow: phone
            ? "0 0 0 5px rgba(13,148,136,0.08), inset 0 2px 6px rgba(0,0,0,0.03)"
            : "inset 0 2px 6px rgba(0,0,0,0.04)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.25s ease",
          animation: isValid ? "kiosk-pulse-border 2s ease-in-out infinite" : "none",
        }}>
          <span style={{
            fontSize: 68, fontWeight: 900,
            letterSpacing: "0.16em",
            fontVariantNumeric: "tabular-nums",
            color: phone ? "#0F172A" : "#C8C3BA",
            transition: "color 0.2s ease",
          }}>
            {phone ? fmtPhone(phone) : "090-0000-0000"}
          </span>
        </div>

        {/* バリデーションエラー */}
        {phoneError && (
          <div style={{
            padding: "6px 20px",
            background: "rgba(239,68,68,0.08)", borderRadius: 10,
            display: "flex", alignItems: "center", gap: 8,
            marginTop: -16,
          }}>
            <span style={{ fontSize: 20, color: "#DC2626" }}>!</span>
            <span style={{ fontSize: 19, fontWeight: 700, color: "#DC2626" }}>{phoneError}</span>
          </div>
        )}
        {/* 検索エラー */}
        {error && (
          <div style={{
            padding: "14px 28px",
            background: "#FEF2F2", border: "2px solid #FECACA", borderRadius: 14,
            display: "flex", alignItems: "center", gap: 12,
            maxWidth: totalW, marginTop: -16,
          }}>
            <span style={{ fontSize: 28, color: "#DC2626", flexShrink: 0 }}>!</span>
            <span style={{ fontSize: 24, fontWeight: 700, color: "#DC2626" }}>{error}</span>
          </div>
        )}
        <div style={{ display: "flex", gap: GAP }}>

          {/* ── 左列: プレフィクス (070/080/090) ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: GAP }}>
            {["070", "080", "090"].map((prefix) => (
              <button
                key={prefix}
                className="kiosk-prefix"
                onPointerDown={() => pressPrefix(prefix)}
                style={{
                  width: WP, height: H,
                  fontSize: 40, fontWeight: 800,
                  background: "linear-gradient(180deg, #60A5FA 0%, #3B82F6 100%)",
                  color: "#fff",
                  border: "none", borderRadius: 16,
                  boxShadow: "0 5px 0 #1D4ED8, 0 8px 20px rgba(59,130,246,0.18)",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  letterSpacing: "0.06em",
                  touchAction: "manipulation",
                  transition: "transform 75ms ease, box-shadow 75ms ease",
                }}
              >
                {prefix}
              </button>
            ))}
          </div>

          {/* ── 中央列: テンキー ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: GAP }}>
            {[["1","2","3"],["4","5","6"],["7","8","9"]].map((row, ri) => (
              <div key={ri} style={{ display: "flex", gap: GAP }}>
                {row.map((k) => (
                  <button
                    key={k}
                    className="kiosk-num"
                    onPointerDown={() => press(k)}
                    style={{
                      width: W, height: H,
                      fontSize: 52, fontWeight: 900,
                      background: "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)",
                      color: "#1E293B",
                      border: "1.5px solid #E2E8F0",
                      borderRadius: 16,
                      boxShadow: "0 4px 0 #CBD5E1, 0 6px 14px rgba(0,0,0,0.05)",
                      cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      touchAction: "manipulation",
                      transition: "transform 75ms ease, box-shadow 75ms ease",
                    }}
                  >
                    {k}
                  </button>
                ))}
              </div>
            ))}
            <div style={{ display: "flex", gap: GAP }}>
              <button
                className="kiosk-num"
                onPointerDown={() => press("0")}
                style={{
                  width: W * 3 + GAP * 2, height: H,
                  fontSize: 52, fontWeight: 900,
                  background: "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)",
                  color: "#1E293B",
                  border: "1.5px solid #E2E8F0",
                  borderRadius: 16,
                  boxShadow: "0 4px 0 #CBD5E1, 0 6px 14px rgba(0,0,0,0.05)",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  touchAction: "manipulation",
                  transition: "transform 75ms ease, box-shadow 75ms ease",
                }}
              >
                0
              </button>
            </div>
          </div>

          {/* ── 右列: 全消し / 1文字消す / OK ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: GAP, width: WA }}>
            {/* 全消し */}
            <button
              className="kiosk-del"
              onPointerDown={() => { setPhone(""); setPhoneError(""); setError(""); }}
              style={{
                height: H, fontSize: 26, fontWeight: 800,
                background: "linear-gradient(180deg, #F87171 0%, #EF4444 100%)",
                color: "#fff",
                border: "none", borderRadius: 16,
                boxShadow: "0 5px 0 #B91C1C, 0 8px 20px rgba(239,68,68,0.15)",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                touchAction: "manipulation",
                transition: "transform 75ms ease, box-shadow 75ms ease",
              }}
            >
              全消し
            </button>

            {/* 1文字消す */}
            <button
              className="kiosk-del"
              onPointerDown={() => {
                const next = phone.slice(0, -1);
                setPhone(next);
                setPhoneError(validatePhone(next));
              }}
              style={{
                height: H, fontSize: 22, fontWeight: 800, lineHeight: 1.3,
                background: "linear-gradient(180deg, #FBBF24 0%, #F59E0B 100%)",
                color: "#fff",
                border: "none", borderRadius: 16,
                boxShadow: "0 5px 0 #B45309, 0 8px 20px rgba(245,158,11,0.15)",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                touchAction: "manipulation",
                transition: "transform 75ms ease, box-shadow 75ms ease",
              }}
            >
              1文字<br/>消す
            </button>

            {/* OK */}
            <button
              className="kiosk-ok"
              onPointerDown={handleOk}
              disabled={!okActive && !okLoading}
              style={{
                minHeight: 240, flex: 1,
                fontSize: okLoading ? 0 : 66,
                fontWeight: 900, letterSpacing: "0.12em",
                background: (okActive || okLoading)
                  ? "linear-gradient(180deg, #34D399 0%, #059669 100%)"
                  : "#D1D5DB",
                color: "#fff",
                border: "none", borderRadius: 16,
                boxShadow: (okActive || okLoading)
                  ? "0 7px 0 #047857, 0 10px 28px rgba(5,150,105,0.22)"
                  : "0 4px 0 #9CA3AF",
                opacity: (okActive || okLoading) ? 1 : 0.4,
                cursor: okActive ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                touchAction: "manipulation",
                transition: "all 200ms ease",
                overflow: "hidden",
              }}
            >
              {okLoading ? (
                /* ── スピナー（OK内に表示） ── */
                <div style={{
                  width: 56, height: 56,
                  border: "5px solid rgba(255,255,255,0.25)",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  animation: "kiosk-spin 0.8s linear infinite",
                }} />
              ) : "OK"}
            </button>
          </div>

        </div>
        </div>
      </div>
    </div>
  );
}
