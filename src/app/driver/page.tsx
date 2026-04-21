"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
} from "@simplewebauthn/browser";
import {
  TruckIcon, KeyIcon, NumPadIcon, AlertIcon, CheckIcon,
  ChevronLeftIcon, ChevronRightIcon, InstallIcon,
} from "@/components/Icon";
import LoginAppHint from "@/components/LoginAppHint";

// ── 電話番号フォーマット ──
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

function formatPhone(digits: string): string {
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
function validatePhone(digits: string): string | null {
  if (digits.length === 0) return null;
  if (digits[0] !== "0") return "電話番号は 0 から始まる番号を入力してください";
  if (digits.startsWith("00")) return "入力された番号は使用できません";
  if (digits.length < 10) return null;
  const mobile = isMobilePrefix(digits);
  if (mobile && digits.length < 11) return null;
  if (mobile && digits.length === 11) return null;
  if (!mobile && digits.length === 10) return null;
  return "入力された番号は使用できません";
}
function isSubmittable(digits: string): boolean {
  if (validatePhone(digits) !== null) return false;
  if (isMobilePrefix(digits)) return digits.length === 11;
  return digits.length === 10;
}

type Step =
  | "phone"
  | "phone_confirm"
  | "policy"
  | "method_choice"
  | "pin_setup"
  | "pin_login"
  | "biometric_setup"
  | "biometric_login"
  | "biometric_done";

type SetupPhase = "enter" | "confirm";

// ── スピナー ──
function Spinner({ size = 22, color = "#1a3a6b" }: { size?: number; color?: string }) {
  return (
    <span
      aria-hidden
      style={{
        width: size, height: size, display: "inline-block",
        border: `3px solid ${color}22`,
        borderTopColor: color,
        borderRadius: "50%",
        animation: "berth-spin 0.8s linear infinite",
      }}
    />
  );
}

// ── PINドット ──
function PinDots({ count, total = 4 }: { count: number; total?: number }) {
  return (
    <div className="flex justify-center gap-4" style={{ padding: "16px 0" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 20, height: 20, borderRadius: "50%",
            border: `2px solid ${i < count ? "#1a3a6b" : "#d6d4cd"}`,
            background: i < count ? "#1a3a6b" : "transparent",
            transition: "all 0.15s ease",
          }}
        />
      ))}
    </div>
  );
}

// ── PINテンキー ──
function PinPad({ onPress, onDelete }: { onPress: (d: string) => void; onDelete: () => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {["1","2","3","4","5","6","7","8","9","","0","del"].map((k, i) =>
        k === "" ? <div key={`empty-${i}`} /> :
        k === "del" ? (
          <button
            key="del" type="button" onClick={onDelete}
            style={{
              height: 60, background: "#fff",
              color: "#BE123C", borderRadius: 12, fontSize: 22, fontWeight: 800,
              border: "1px solid #E7E5DF",
            }}
          >
            ← 削除
          </button>
        ) : (
          <button
            key={k} type="button" onClick={() => onPress(k)}
            style={{
              height: 60, background: "#fff",
              color: "#26251e", borderRadius: 12, fontSize: 30, fontWeight: 800,
              border: "1px solid #E7E5DF",
              boxShadow: "0 1px 0 rgba(26,37,30,0.04)",
            }}
          >
            {k}
          </button>
        )
      )}
    </div>
  );
}

// ── 電話テンキー ──
function PhonePad({ onPress, onDelete }: { onPress: (d: string) => void; onDelete: () => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {["1","2","3","4","5","6","7","8","9","","0","del"].map((k, i) =>
        k === "" ? <div key={`empty-${i}`} /> :
        k === "del" ? (
          <button key="del" type="button" onClick={onDelete}
            style={{
              height: 60, background: "#fff", color: "#BE123C",
              borderRadius: 12, fontSize: 20, fontWeight: 800,
              border: "1px solid #E7E5DF",
            }}>
            ← 削除
          </button>
        ) : (
          <button key={k} type="button" onClick={() => onPress(k)}
            style={{
              height: 60, background: "#fff", color: "#26251e",
              borderRadius: 12, fontSize: 30, fontWeight: 800,
              border: "1px solid #E7E5DF",
              boxShadow: "0 1px 0 rgba(26,37,30,0.04)",
            }}>
            {k}
          </button>
        )
      )}
    </div>
  );
}

// ── メインコンポーネント ──
export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [step, setStep] = useState<Step>("phone");
  const [hasPin, setHasPin] = useState(false);
  const [hasPasskey, setHasPasskey] = useState(false);
  const [webAuthnSupported, setWebAuthnSupported] = useState(false);
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [setupPhase, setSetupPhase] = useState<SetupPhase>("enter");
  const [pinError, setPinError] = useState("");
  const [pinShake, setPinShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState("");

  useEffect(() => {
    setWebAuthnSupported(browserSupportsWebAuthn());
    // ※ PWA インストール案内は LoginAppHint / AppInstallBar に集約（重複ポップアップ防止）
  }, []);

  function pressNum(d: string) {
    setPhone((prev) => {
      const max = isMobilePrefix(prev) || prev.length < 3 ? 11 : 10;
      return prev.length < max ? prev + d : prev;
    });
  }
  function del() { setPhone((prev) => prev.slice(0, -1)); }

  async function handlePhoneSubmit() {
    const err = validatePhone(phone);
    if (err) { setPhoneError(err); return; }
    setPhoneError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (!res.ok) {
        let msg = "エラーが発生しました";
        try { const d = await res.json(); msg = d.error || msg; } catch { /* non-JSON */ }
        if (res.status === 429) { setPhoneError(msg); return; }
        setPhoneError(msg);
        return;
      }
      const data = await res.json();
      if (data.status === "new_user") {
        // 新規ユーザーは電話番号確認ステップを挟む（誤登録防止）
        setStep("phone_confirm");
      } else if (data.status === "need_setup") {
        setStep("method_choice");
      } else if (data.status === "ready") {
        setHasPin(data.hasPin);
        setHasPasskey(data.hasPasskey);
        if (data.hasPasskey && webAuthnSupported) {
          setStep("biometric_login");
        } else {
          setStep("pin_login");
        }
      }
    } catch {
      setPhoneError("通信エラーが発生しました。ネットワーク接続を確認してください");
    } finally {
      setLoading(false);
    }
  }

  const handleBiometricSetup = useCallback(async (agreed: boolean) => {
    setLoading(true);
    setBiometricStatus("デバイスの認証を準備中...");
    try {
      const optRes = await fetch("/api/driver/auth/passkey/register-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (!optRes.ok) { setBiometricStatus("エラーが発生しました"); return; }
      const options = await optRes.json();

      setBiometricStatus("デバイスの認証を待っています...");
      const credential = await startRegistration(options);

      setBiometricStatus("登録中...");
      const verRes = await fetch("/api/driver/auth/passkey/register-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, credential, agreedToPolicy: agreed }),
      });
      const verData = await verRes.json();
      if (verRes.ok) {
        setStep("biometric_done");
        setTimeout(() => router.push("/driver/dashboard"), 800);
      } else {
        setBiometricStatus(verData.error || "登録に失敗しました");
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "NotAllowedError") {
        setBiometricStatus("キャンセルされました");
      } else {
        setBiometricStatus("生体認証の登録に失敗しました");
      }
    } finally {
      setLoading(false);
    }
  }, [phone, router]);

  const handleBiometricLogin = useCallback(async () => {
    setLoading(true);
    setBiometricStatus("認証を準備中...");
    try {
      const optRes = await fetch("/api/driver/auth/passkey/auth-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (!optRes.ok) { setBiometricStatus("エラーが発生しました"); return; }
      const options = await optRes.json();

      setBiometricStatus("デバイスの認証を待っています...");
      const credential = await startAuthentication(options);

      setBiometricStatus("確認中...");
      const verRes = await fetch("/api/driver/auth/passkey/auth-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, credential }),
      });
      const verData = await verRes.json();
      if (verRes.ok) {
        setStep("biometric_done");
        setTimeout(() => router.push("/driver/dashboard"), 600);
      } else {
        setBiometricStatus(verData.error || "認証に失敗しました");
        setLoading(false);
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "NotAllowedError") {
        setBiometricStatus("キャンセルされました");
      } else {
        setBiometricStatus("生体認証に失敗しました");
      }
      setLoading(false);
    }
  }, [phone, router]);

  const handlePinSetup = useCallback(async (finalPin: string, agreed: boolean) => {
    setLoading(true);
    setPinError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, newPin: finalPin, agreedToPolicy: agreed }),
      });
      if (!res.ok) {
        let msg = "エラーが発生しました";
        try { const d = await res.json(); msg = d.error || msg; } catch { /* non-JSON */ }
        setPinError(msg);
        setPin(""); setPinConfirm(""); setSetupPhase("enter");
        setLoading(false);
        return;
      }
      router.push("/driver/dashboard");
    } catch {
      setPinError("通信エラーが発生しました。ネットワーク接続を確認してください");
      setPin(""); setPinConfirm(""); setSetupPhase("enter");
      setLoading(false);
    }
  }, [phone, router]);

  const handlePinLogin = useCallback(async (finalPin: string) => {
    setLoading(true);
    setPinError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, pin: finalPin }),
      });
      if (!res.ok) {
        let msg = "PINが正しくありません";
        try { const d = await res.json(); msg = d.error || msg; } catch { /* non-JSON */ }
        setPinError(msg);
        setPinShake(true);
        setTimeout(() => { setPinShake(false); setPin(""); }, 600);
        setLoading(false);
        return;
      }
      router.push("/driver/dashboard");
    } catch {
      setPinError("通信エラーが発生しました。ネットワーク接続を確認してください");
      setPin("");
      setLoading(false);
    }
  }, [phone, router]);

  function pressPinSetup(d: string) {
    if (loading) return;
    if (setupPhase === "enter") {
      setPin((prev) => {
        const next = prev.length < 4 ? prev + d : prev;
        if (next.length === 4) setTimeout(() => setSetupPhase("confirm"), 300);
        return next;
      });
    } else {
      setPinConfirm((prev) => {
        const next = prev.length < 4 ? prev + d : prev;
        if (next.length === 4) {
          setTimeout(() => {
            if (pin === next) {
              handlePinSetup(pin, true);
            } else {
              setPinError("PINが一致しません。最初から入力してください");
              setPinShake(true);
              setTimeout(() => {
                setPinShake(false);
                setPin(""); setPinConfirm(""); setSetupPhase("enter"); setPinError("");
              }, 800);
            }
          }, 200);
        }
        return next;
      });
    }
  }

  function pressPinLogin(d: string) {
    if (loading) return;
    setPin((prev) => {
      const next = prev.length < 4 ? prev + d : prev;
      if (next.length === 4) setTimeout(() => handlePinLogin(next), 200);
      return next;
    });
  }

  // ── 共通ヘッダー ──
  const AppHeader = () => (
    <div className="text-center" style={{ marginBottom: 4 }}>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        background: "#fff", borderRadius: 10, padding: "6px 14px",
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://www.nihonsafety.com/wp-content/themes/nihonsafety2022/assets/images/logo_ns_large.svg"
          alt="日本セイフティー株式会社"
          style={{ height: 26, objectFit: "contain" }}
        />
      </div>
      <div className="flex items-center justify-center gap-3" style={{ marginTop: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: "rgba(255,255,255,0.12)",
          border: "1px solid rgba(255,255,255,0.22)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff",
        }}>
          <TruckIcon size={24} strokeWidth={1.75} />
        </div>
        <div className="text-left">
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#fff", letterSpacing: "0.08em", lineHeight: 1.15 }}>
            受付予約
          </h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", letterSpacing: "0.12em", marginTop: 2 }}>
            機材センター受付予約システム
          </p>
        </div>
      </div>
    </div>
  );

  const BackButton = ({ onClick }: { onClick: () => void }) => (
    <button type="button" onClick={onClick}
      style={{
        width: "100%", padding: "14px 0", color: "rgba(255,255,255,0.68)",
        fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center",
        justifyContent: "center", gap: 6, background: "transparent", border: "none",
      }}>
      <ChevronLeftIcon size={16} strokeWidth={2} />戻る
    </button>
  );

  // 背景色統一（ネイビー）— ロゴ位置を全ステップで固定するため flex-start
  const pageBg: React.CSSProperties = {
    minHeight: "100vh", background: "#1a3a6b",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "flex-start",
    padding: "40px 16px 24px",
  };
  const cardStyle: React.CSSProperties = {
    background: "#faf9f5",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 10px 32px rgba(15,23,42,0.22)",
  };

  // ════════════════════════════════
  // 電話番号入力
  // ════════════════════════════════
  if (step === "phone") return (
    <div style={pageBg}>
      <style>{`@keyframes berth-spin { to { transform: rotate(360deg) } }`}</style>
      <div className="w-full max-w-sm space-y-3">
        <AppHeader />
        <LoginAppHint />
        <div style={cardStyle}>
          <p style={{ fontSize: 18, fontWeight: 800, color: "#26251e", textAlign: "center", marginBottom: 12 }}>
            電話番号を入力
          </p>
          <div style={{
            background: "#fff", border: "1.5px solid #d6d4cd", borderRadius: 12,
            padding: "14px 16px", textAlign: "center", overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center", minHeight: 64,
          }}>
            {phone.length > 0
              ? <span style={{ fontSize: 30, fontWeight: 900, color: "#26251e", letterSpacing: "0.04em" }}>{formatPhone(phone)}</span>
              : <span style={{ fontSize: 24, color: "#bdb9b0" }}>090-0000-0000</span>}
          </div>

          {/* 進捗バー */}
          {(() => {
            const total = isMobilePrefix(phone) || phone.length < 3 ? 11 : 10;
            return (
              <div className="flex gap-1" style={{ margin: "12px 0 8px" }}>
                {Array.from({ length: total }).map((_, i) => (
                  <div key={i} style={{
                    flex: 1, height: 4, borderRadius: 2,
                    background: i < phone.length
                      ? (validatePhone(phone) ? "#BE123C" : "#1a3a6b")
                      : "#E7E5DF",
                    transition: "background 0.15s",
                  }} />
                ))}
              </div>
            );
          })()}

          {validatePhone(phone) && (
            <div className="flex items-center justify-center gap-2" style={{ color: "#BE123C", fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
              <AlertIcon size={16} strokeWidth={2} />
              <span>{validatePhone(phone)}</span>
            </div>
          )}

          {phone.length === 0 && (
            <div className="grid grid-cols-3 gap-2" style={{ marginBottom: 8 }}>
              {["090","080","070"].map((p) => (
                <button key={p} type="button" onClick={() => setPhone(p)}
                  style={{
                    height: 60, background: "#fff", borderRadius: 12,
                    border: "1.5px solid #c9dbe8",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                  <span style={{ fontSize: 26, fontWeight: 900, color: "#1a3a6b", letterSpacing: "0.04em" }}>{p}</span>
                </button>
              ))}
            </div>
          )}

          <PhonePad onPress={pressNum} onDelete={del} />
        </div>

        {phoneError && (
          <div style={{
            background: "#fdecef", border: "1.5px solid #f5bcc7",
            color: "#BE123C", padding: 14, borderRadius: 12,
            fontSize: 15, fontWeight: 700, textAlign: "center",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            <AlertIcon size={18} strokeWidth={2} />
            <span>{phoneError}</span>
          </div>
        )}

        <button type="button" onClick={handlePhoneSubmit} disabled={loading || !isSubmittable(phone)}
          style={{
            width: "100%", padding: "20px 0", fontWeight: 900, borderRadius: 14,
            fontSize: 22, letterSpacing: "0.08em",
            background: loading ? "#0f172a"
              : isSubmittable(phone) ? "#0D9488"
              : "rgba(13,148,136,0.35)",
            color: "#fff", border: "none",
            boxShadow: "0 8px 20px rgba(13,148,136,0.28)",
            cursor: (loading || !isSubmittable(phone)) ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          }}>
          {loading ? (<><Spinner size={20} color="#fff" />確認中...</>) : (<>次へ<ChevronRightIcon size={20} strokeWidth={2.5} /></>)}
        </button>

      </div>
    </div>
  );

  // ════════════════════════════════
  // 電話番号確認（新規登録前の誤入力防止）
  // ════════════════════════════════
  if (step === "phone_confirm") return (
    <div style={pageBg}>
      <style>{`@keyframes berth-spin { to { transform: rotate(360deg) } }`}</style>
      <div className="w-full max-w-sm space-y-3">
        <AppHeader />
        <div style={cardStyle}>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{
              display: "inline-block",
              fontSize: 12, fontWeight: 800, color: "#8a4a15",
              background: "#fef6db", border: "1px solid #f4d27a",
              padding: "5px 14px", borderRadius: 999, letterSpacing: "0.18em",
              marginBottom: 14,
            }}>
              入力内容の確認
            </div>
            <p style={{ fontSize: 20, fontWeight: 900, color: "#26251e", letterSpacing: "0.04em" }}>
              この電話番号で登録します
            </p>
            <p style={{ fontSize: 13, color: "#5a5852", marginTop: 4 }}>
              間違っていないかご確認ください
            </p>
          </div>

          <div style={{
            background: "#fff", border: "1.5px solid #d6d4cd", borderRadius: 14,
            padding: "22px 16px", textAlign: "center", marginBottom: 16,
          }}>
            <div style={{
              fontSize: 11, color: "#9a978c", letterSpacing: "0.22em", fontWeight: 700, marginBottom: 6,
            }}>
              PHONE NUMBER
            </div>
            <div style={{ fontSize: 34, fontWeight: 900, color: "#26251e", letterSpacing: "0.04em" }}>
              {formatPhone(phone)}
            </div>
          </div>

          <div style={{
            background: "#fef6db", border: "1px solid #f4d27a",
            borderRadius: 12, padding: "12px 14px", marginBottom: 16,
            fontSize: 13, color: "#8a4a15", lineHeight: 1.6,
          }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <AlertIcon size={16} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                この番号で登録すると、次回以降<strong style={{ fontWeight: 900 }}>この番号でログイン</strong>します。予約の連絡にも使用されます。
              </div>
            </div>
          </div>

          <button type="button" onClick={() => setStep("policy")}
            style={{
              width: "100%", padding: "20px 0", background: "#0D9488",
              color: "#fff", fontWeight: 900, fontSize: 19, borderRadius: 14,
              border: "none", letterSpacing: "0.06em",
              boxShadow: "0 8px 20px rgba(13,148,136,0.28)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              marginBottom: 10,
            }}>
            <CheckIcon size={22} strokeWidth={2.5} />
            この番号で続ける
          </button>
          <button type="button" onClick={() => setStep("phone")}
            style={{
              width: "100%", padding: "16px 0", background: "#fff",
              color: "#26251e", fontWeight: 800, fontSize: 16, borderRadius: 14,
              border: "1.5px solid #d6d4cd",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
            <ChevronLeftIcon size={18} strokeWidth={2} />
            修正する
          </button>
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════
  // プライバシーポリシー
  // ════════════════════════════════
  if (step === "policy") return (
    <div style={pageBg}>
      <style>{`@keyframes berth-spin { to { transform: rotate(360deg) } }`}</style>
      <div className="w-full max-w-sm space-y-3">
        <AppHeader />
        <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
          <div style={{ background: "#1a3a6b", padding: "14px 20px" }}>
            <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 800, textAlign: "center", letterSpacing: "0.04em" }}>
              プライバシーポリシー
            </h2>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, textAlign: "center", marginTop: 2 }}>
              初回ご利用前にご確認ください
            </p>
          </div>
          <div style={{
            padding: 20, height: 280, overflowY: "auto",
            fontSize: 14, color: "#26251e", lineHeight: 1.75,
            display: "flex", flexDirection: "column", gap: 14,
          }}>
            <p>日本セイフティー株式会社（以下「当社」）は、本アプリにおいて以下のとおり個人情報を取り扱います。</p>
            <div>
              <p style={{ fontWeight: 800, marginBottom: 4 }}>■ 収集する個人情報</p>
              <ul style={{ paddingLeft: 20, color: "#5a5852" }}>
                <li>電話番号</li>
                <li>氏名・所属会社名</li>
                <li>車両番号（ナンバープレート）・最大積載量</li>
                <li>ログインPIN（暗号化保存）・生体認証情報（パスキー）</li>
              </ul>
            </div>
            <div>
              <p style={{ fontWeight: 800, marginBottom: 4 }}>■ 利用目的</p>
              <p style={{ color: "#5a5852" }}>機材センターのバース予約管理および予約に関する連絡のみに使用します。</p>
            </div>
            <div>
              <p style={{ fontWeight: 800, marginBottom: 4 }}>■ 第三者への提供</p>
              <p style={{ color: "#5a5852" }}>法令に基づく場合を除き、個人情報を第三者に提供しません。</p>
            </div>
            <div>
              <p style={{ fontWeight: 800, marginBottom: 4 }}>■ 安全管理</p>
              <p style={{ color: "#5a5852" }}>通信の暗号化・PINのハッシュ保存等、適切なセキュリティ対策を講じています。</p>
            </div>
          </div>
          <div style={{ padding: 20, borderTop: "1px solid #E7E5DF" }}>
            <button type="button" onClick={() => setStep("method_choice")}
              style={{
                width: "100%", padding: "18px 0", background: "#0D9488",
                color: "#fff", fontWeight: 900, fontSize: 17, borderRadius: 14,
                border: "none", boxShadow: "0 6px 16px rgba(13,148,136,0.25)",
                letterSpacing: "0.04em",
              }}>
              同意して認証方法を設定する
            </button>
            <button type="button" onClick={() => { setStep("phone"); setPhone(""); }}
              style={{
                width: "100%", marginTop: 10, padding: "10px 0", color: "#5a5852",
                fontWeight: 700, fontSize: 13, background: "transparent", border: "none",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
              <ChevronLeftIcon size={16} strokeWidth={2} />戻る
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════
  // 認証方法の選択
  // ════════════════════════════════
  if (step === "method_choice") return (
    <div style={pageBg}>
      <style>{`@keyframes berth-spin { to { transform: rotate(360deg) } }`}</style>
      <div className="w-full max-w-sm space-y-3">
        <AppHeader />
        <div style={cardStyle}>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <p style={{ fontSize: 20, fontWeight: 800, color: "#26251e" }}>
              認証方法を選んでください
            </p>
            <p style={{ fontSize: 13, color: "#5a5852", marginTop: 4 }}>
              ログイン時に使用する方法
            </p>
          </div>

          {webAuthnSupported ? (
            <button type="button" onClick={() => { setStep("biometric_setup"); handleBiometricSetup(true); }}
              style={{
                width: "100%", padding: "20px 18px", background: "#0D9488",
                color: "#fff", borderRadius: 14, border: "none",
                boxShadow: "0 6px 16px rgba(13,148,136,0.25)",
                display: "flex", alignItems: "center", gap: 14,
                marginBottom: 12,
              }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: "rgba(255,255,255,0.18)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <KeyIcon size={26} strokeWidth={2} />
              </div>
              <div className="text-left">
                <p style={{ fontSize: 18, fontWeight: 900, letterSpacing: "0.04em" }}>生体認証（推奨）</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 2 }}>
                  指紋・Face ID・Touch ID
                </p>
              </div>
            </button>
          ) : (
            <div style={{
              padding: "14px 16px", background: "#fff4e6", border: "1.5px solid #f4c38a",
              borderRadius: 12, color: "#8a4a15", fontSize: 13, textAlign: "center",
              marginBottom: 12,
            }}>
              <p style={{ fontWeight: 800 }}>このブラウザは生体認証に対応していません</p>
              <p style={{ fontSize: 11, marginTop: 2 }}>Safari または Chrome で直接開いてください</p>
            </div>
          )}

          <button type="button" onClick={() => setStep("pin_setup")}
            style={{
              width: "100%", padding: "20px 18px", background: "#fff",
              color: "#1a3a6b", borderRadius: 14,
              border: "1.5px solid #c9dbe8",
              display: "flex", alignItems: "center", gap: 14,
            }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: "#eef1f7",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, color: "#1a3a6b",
            }}>
              <NumPadIcon size={26} strokeWidth={2} />
            </div>
            <div className="text-left">
              <p style={{ fontSize: 18, fontWeight: 900, letterSpacing: "0.04em" }}>PIN番号</p>
              <p style={{ fontSize: 12, color: "#5a5852", marginTop: 2 }}>4桁の暗証番号</p>
            </div>
          </button>
        </div>
        <BackButton onClick={() => setStep("policy")} />
      </div>
    </div>
  );

  // ════════════════════════════════
  // 生体認証 登録中／完了
  // ════════════════════════════════
  if (step === "biometric_setup" || step === "biometric_done") return (
    <div style={pageBg}>
      <style>{`@keyframes berth-spin { to { transform: rotate(360deg) } }`}</style>
      <div className="w-full max-w-sm space-y-3">
        <AppHeader />
        <div style={{ ...cardStyle, padding: 32, textAlign: "center" }}>
          {step === "biometric_done" ? (
            <>
              <div style={{
                width: 88, height: 88, borderRadius: "50%",
                background: "#047857", color: "#fff",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                marginBottom: 16,
              }}>
                <CheckIcon size={56} strokeWidth={3} />
              </div>
              <p style={{ fontSize: 22, fontWeight: 900, color: "#047857", letterSpacing: "0.04em" }}>
                認証完了しました
              </p>
            </>
          ) : loading ? (
            <>
              <div style={{
                width: 88, height: 88, borderRadius: "50%",
                background: "#eef1f7", color: "#1a3a6b",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                marginBottom: 16,
              }}>
                <KeyIcon size={44} strokeWidth={1.75} />
              </div>
              <p style={{ fontSize: 17, fontWeight: 800, color: "#26251e", marginBottom: 14 }}>
                {biometricStatus || "処理中..."}
              </p>
              <div className="flex justify-center"><Spinner size={28} /></div>
            </>
          ) : (
            <>
              <div style={{
                width: 88, height: 88, borderRadius: "50%",
                background: "#fdecef", color: "#BE123C",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                marginBottom: 16,
              }}>
                <AlertIcon size={44} strokeWidth={1.75} />
              </div>
              <p style={{ fontSize: 16, fontWeight: 800, color: "#26251e", marginBottom: 16 }}>
                {biometricStatus}
              </p>
              <button type="button" onClick={() => handleBiometricSetup(true)}
                style={{
                  width: "100%", padding: "16px 0", background: "#1a3a6b",
                  color: "#fff", fontWeight: 800, fontSize: 16, borderRadius: 14,
                  border: "none", marginBottom: 10,
                }}>
                もう一度試す
              </button>
              <button type="button" onClick={() => setStep("pin_setup")}
                style={{
                  width: "100%", padding: "10px 0", color: "#1a3a6b",
                  fontWeight: 700, fontSize: 14, background: "transparent", border: "none",
                }}>
                PINで設定する
              </button>
            </>
          )}
        </div>
        {!loading && step !== "biometric_done" && <BackButton onClick={() => setStep("method_choice")} />}
      </div>
    </div>
  );

  // ════════════════════════════════
  // 生体認証 ログイン
  // ════════════════════════════════
  if (step === "biometric_login") return (
    <div style={pageBg}>
      <style>{`@keyframes berth-spin { to { transform: rotate(360deg) } }`}</style>
      <div className="w-full max-w-sm space-y-3">
        <AppHeader />
        <div style={{ ...cardStyle, padding: 24 }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <p style={{ fontSize: 20, fontWeight: 800, color: "#26251e" }}>ログイン</p>
            <p style={{ fontSize: 13, color: "#5a5852", marginTop: 2 }}>{formatPhone(phone)}</p>
          </div>

          {loading ? (
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 80, height: 80, borderRadius: "50%",
                background: "#eef1f7", color: "#1a3a6b",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                marginBottom: 14,
              }}>
                <KeyIcon size={40} strokeWidth={1.75} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 800, color: "#5a5852", marginBottom: 12 }}>
                {biometricStatus}
              </p>
              <div className="flex justify-center"><Spinner size={28} /></div>
            </div>
          ) : (
            <>
              {biometricStatus && (
                <div className="flex items-center justify-center gap-2"
                  style={{ color: "#D97706", fontSize: 14, fontWeight: 700, marginBottom: 14 }}>
                  <AlertIcon size={16} strokeWidth={2} />
                  <span>{biometricStatus}</span>
                </div>
              )}
              <button type="button" onClick={handleBiometricLogin}
                style={{
                  width: "100%", padding: "22px 0", background: "#0D9488",
                  color: "#fff", borderRadius: 14, border: "none",
                  boxShadow: "0 8px 20px rgba(13,148,136,0.28)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                  marginBottom: 10,
                }}>
                <KeyIcon size={26} strokeWidth={2} />
                <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: "0.08em" }}>
                  生体認証でログイン
                </span>
              </button>
              {hasPin && (
                <button type="button" onClick={() => { setStep("pin_login"); setPin(""); }}
                  style={{
                    width: "100%", padding: "12px 0", color: "#1a3a6b",
                    fontWeight: 700, fontSize: 14,
                    background: "#fff", border: "1.5px solid #c9dbe8", borderRadius: 14,
                  }}>
                  PINでログインする
                </button>
              )}
            </>
          )}
        </div>
        <button type="button" onClick={() => { setStep("phone"); setPin(""); setBiometricStatus(""); }}
          style={{
            width: "100%", padding: "12px 0", color: "rgba(255,255,255,0.68)",
            fontSize: 14, fontWeight: 700, background: "transparent", border: "none",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
          <ChevronLeftIcon size={16} strokeWidth={2} />電話番号を変更する
        </button>
      </div>
    </div>
  );

  // ════════════════════════════════
  // PIN設定
  // ════════════════════════════════
  if (step === "pin_setup") return (
    <div style={pageBg}>
      <style>{`
        @keyframes berth-spin { to { transform: rotate(360deg) } }
        @keyframes pin-shake { 0%,100% { transform: translateX(0) } 25% { transform: translateX(-6px) } 75% { transform: translateX(6px) } }
      `}</style>
      <div className="w-full max-w-sm space-y-3">
        <AppHeader />
        <div style={cardStyle}>
          <div style={{ textAlign: "center", marginBottom: 4 }}>
            <p style={{ fontSize: 22, fontWeight: 900, color: "#26251e", letterSpacing: "0.04em" }}>
              {setupPhase === "enter" ? "PINを設定してください" : "もう一度入力してください"}
            </p>
            <p style={{ fontSize: 13, color: "#5a5852", marginTop: 4 }}>
              {setupPhase === "enter" ? "4桁の数字を入力" : "確認のため再入力"}
            </p>
          </div>
          <div style={pinShake ? { animation: "pin-shake 0.4s" } : undefined}>
            <PinDots count={setupPhase === "enter" ? pin.length : pinConfirm.length} />
          </div>
          {pinError && (
            <div className="flex items-center justify-center gap-2"
              style={{ color: "#BE123C", fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
              <AlertIcon size={16} strokeWidth={2} />
              <span>{pinError}</span>
            </div>
          )}
          {loading
            ? <div className="flex justify-center" style={{ padding: "16px 0" }}><Spinner size={28} /></div>
            : <PinPad onPress={pressPinSetup} onDelete={() => { if (setupPhase === "confirm") setPinConfirm(p => p.slice(0,-1)); else setPin(p => p.slice(0,-1)); }} />}
        </div>
        <BackButton onClick={() => { setStep("method_choice"); setPin(""); setPinConfirm(""); setSetupPhase("enter"); setPinError(""); }} />
      </div>
    </div>
  );

  // ════════════════════════════════
  // PINログイン
  // ════════════════════════════════
  return (
    <div style={pageBg}>
      <style>{`
        @keyframes berth-spin { to { transform: rotate(360deg) } }
        @keyframes pin-shake { 0%,100% { transform: translateX(0) } 25% { transform: translateX(-6px) } 75% { transform: translateX(6px) } }
      `}</style>
      <div className="w-full max-w-sm space-y-3">
        <AppHeader />
        <div style={cardStyle}>
          <div style={{ textAlign: "center", marginBottom: 4 }}>
            <p style={{ fontSize: 22, fontWeight: 900, color: "#26251e", letterSpacing: "0.04em" }}>
              PINを入力してください
            </p>
            <p style={{ fontSize: 13, color: "#5a5852", marginTop: 4 }}>{formatPhone(phone)}</p>
          </div>
          <div style={pinShake ? { animation: "pin-shake 0.4s" } : undefined}>
            <PinDots count={pin.length} />
          </div>
          {pinError && (
            <div className="flex items-center justify-center gap-2"
              style={{ color: "#BE123C", fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
              <AlertIcon size={16} strokeWidth={2} />
              <span>{pinError}</span>
            </div>
          )}
          {loading
            ? <div className="flex justify-center" style={{ padding: "16px 0" }}><Spinner size={28} /></div>
            : <PinPad onPress={pressPinLogin} onDelete={() => setPin(p => p.slice(0,-1))} />}

          {hasPasskey && webAuthnSupported && (
            <button type="button"
              onClick={() => { setStep("biometric_login"); setPin(""); setPinError(""); }}
              style={{
                width: "100%", marginTop: 12, padding: "14px 0",
                color: "#047857", fontWeight: 800, fontSize: 14,
                background: "#fff", border: "1.5px solid #a7e3c8",
                borderRadius: 14, display: "flex", alignItems: "center",
                justifyContent: "center", gap: 8,
              }}>
              <KeyIcon size={18} strokeWidth={2} />
              生体認証でログインする
            </button>
          )}
          {!hasPasskey && webAuthnSupported && (
            <button type="button"
              onClick={() => { setStep("biometric_setup"); setPin(""); setPinError(""); handleBiometricSetup(true); }}
              style={{
                width: "100%", marginTop: 12, padding: "12px 0",
                color: "#5a5852", fontWeight: 700, fontSize: 13,
                background: "transparent", border: "1px solid #E7E5DF",
                borderRadius: 14, display: "flex", alignItems: "center",
                justifyContent: "center", gap: 8,
              }}>
              <KeyIcon size={16} strokeWidth={2} />
              生体認証を登録する
            </button>
          )}
        </div>
        <button type="button" onClick={() => { setStep("phone"); setPin(""); setPinError(""); }}
          style={{
            width: "100%", padding: "12px 0", color: "rgba(255,255,255,0.68)",
            fontSize: 14, fontWeight: 700, background: "transparent", border: "none",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
          <ChevronLeftIcon size={16} strokeWidth={2} />電話番号を変更する
        </button>
      </div>
    </div>
  );
}
