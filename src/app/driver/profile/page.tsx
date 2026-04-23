"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { UserIcon, CheckIcon, AlertIcon, PhoneIcon, PencilIcon } from "@/components/Icon";
import PwaInstallPanel from "@/components/PwaInstallPanel";
import { normalizePhone } from "@/lib/phone";

// ── 電話番号フォーマット（driver/page.tsx と同一仕様の複製） ──
// 共通化は phoneFormat.ts があるが validatePhone/isSubmittable が未定義のため、
// ログイン画面を壊さないようここに複製。今後ログイン画面もここを使う形に寄せる想定。
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

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; isAdmin: boolean; companyName: string; defaultVehicle: string; defaultMaxLoad: string; phone: string; hasPin: boolean } | null>(null);
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [defaultVehicle, setDefaultVehicle] = useState("");
  const [defaultMaxLoad, setDefaultMaxLoad] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // 電話番号変更モーダル
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phonePin, setPhonePin] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [phoneConfirming, setPhoneConfirming] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [phoneSaving, setPhoneSaving] = useState(false);

  useEffect(() => {
    fetch("/api/driver/auth")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((u) => {
        setUser(u);
        setName(u.name);
        setCompanyName(u.companyName);
        setDefaultVehicle(u.defaultVehicle);
        setDefaultMaxLoad(u.defaultMaxLoad || "");
      })
      .catch(() => router.push("/driver"));
  }, [router]);

  function openPhoneModal() {
    setPhonePin("");
    setNewPhone("");
    setPhoneError("");
    setPhoneConfirming(false);
    setShowPhoneModal(true);
  }
  function closePhoneModal() {
    if (phoneSaving) return;
    setShowPhoneModal(false);
    setPhonePin(""); // モーダル閉時に PIN をメモリから消す
  }

  // テンキーからの数字入力（桁上限はモバイルプレフィックス判定で11 or 10）
  function pressNewPhoneNum(d: string) {
    setNewPhone((prev) => {
      const max = isMobilePrefix(prev) || prev.length < 3 ? 11 : 10;
      return prev.length < max ? prev + d : prev;
    });
  }
  function delNewPhone() {
    setNewPhone((prev) => prev.slice(0, -1));
  }

  async function handlePhoneSubmit() {
    if (!/^\d{4}$/.test(phonePin)) {
      setPhoneError("PINを4桁の数字で入力してください"); return;
    }
    const normalized = normalizePhone(newPhone);
    if (!isSubmittable(normalized)) {
      setPhoneError("0から始まる10桁または11桁の電話番号を入力してください"); return;
    }
    if (user && normalized === user.phone) {
      setPhoneError("現在の電話番号と同じです"); return;
    }
    if (!phoneConfirming) { setPhoneConfirming(true); setPhoneError(""); return; }

    setPhoneSaving(true);
    setPhoneError("");
    try {
      const res = await fetch("/api/driver/profile/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: phonePin, newPhone: normalized }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPhoneError(data.error ?? "変更に失敗しました");
        setPhoneConfirming(false);
        setPhoneSaving(false);
        setPhonePin(""); // 失敗時は PIN をメモリから消す
        return;
      }
      setUser((u) => u ? { ...u, phone: data.phone } : u);
      setShowPhoneModal(false);
      setPhonePin(""); // 成功時も PIN をメモリから消す
      setMsg("電話番号を変更しました");
    } catch {
      setPhoneError("通信エラーが発生しました");
      setPhoneConfirming(false);
      setPhonePin("");
    } finally {
      setPhoneSaving(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !companyName.trim()) {
      setMsg("会社名とお名前は必須です");
      return;
    }
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/driver/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, companyName, defaultVehicle, defaultMaxLoad }),
      });
      if (res.ok) {
        setMsg("保存しました");
        setUser((u) => u ? { ...u, name, companyName, defaultVehicle, defaultMaxLoad } : u);
      } else {
        setMsg("保存に失敗しました");
      }
    } catch {
      setMsg("通信エラーが発生しました");
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ color: "#5a5852", background: "#f2f1ed" }}>
        読み込み中...
      </div>
    );
  }

  const isSuccess = msg === "保存しました" || msg === "電話番号を変更しました";

  return (
    <div style={{ minHeight: "100vh", background: "#f2f1ed", paddingBottom: 100 }}>
      <Header driverName={user.name} isAdmin={user.isAdmin} />

      {/* 電話番号変更モーダル */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.55)" }} onClick={closePhoneModal}>
          <div
            style={{
              width: "100%", background: "#faf9f5",
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              padding: "24px 22px 32px",
              display: "flex", flexDirection: "column", gap: 16,
              maxHeight: "90vh", overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "#eef1f7", color: "#1a3a6b",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                marginBottom: 10,
              }}>
                <PhoneIcon size={32} strokeWidth={1.75} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: "#26251e", letterSpacing: "0.04em" }}>
                {phoneConfirming ? "この番号で変更しますか？" : "電話番号を変更"}
              </h2>
              {!phoneConfirming && (
                <p style={{ fontSize: 13, color: "#5a5852", marginTop: 6 }}>
                  本人確認のため現在のPINを入力してください
                </p>
              )}
            </div>

            {phoneConfirming ? (
              <>
                <div style={{
                  background: "#fff", border: "1px solid #E7E5DF", borderRadius: 12,
                  padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 12, color: "#9a978c", letterSpacing: "0.14em", fontWeight: 700 }}>変更前</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "#5a5852" }}>{user.phone}</span>
                  </div>
                  <div style={{ height: 1, background: "#E7E5DF" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 12, color: "#9a978c", letterSpacing: "0.14em", fontWeight: 700 }}>変更後</span>
                    <span style={{ fontSize: 20, fontWeight: 900, color: "#0D9488" }}>{formatPhone(newPhone)}</span>
                  </div>
                </div>
                <div style={{
                  background: "#fef6db", border: "1px solid #f4d27a",
                  borderRadius: 10, padding: "10px 12px",
                  fontSize: 12, color: "#8a4a15", lineHeight: 1.6,
                  display: "flex", gap: 6, alignItems: "flex-start",
                }}>
                  <AlertIcon size={14} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>変更後は新しい番号でログインします。PINと生体認証の設定は引き継がれます。</span>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: "#26251e", marginBottom: 6 }}>
                    現在のPIN（4桁）
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    name="current-pin"
                    autoComplete="one-time-code"
                    maxLength={4}
                    spellCheck={false}
                    autoCorrect="off"
                    autoCapitalize="off"
                    data-1p-ignore
                    data-lpignore="true"
                    data-form-type="other"
                    value={phonePin}
                    onChange={(e) => setPhonePin(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
                    placeholder="＊＊＊＊"
                    style={{
                      width: "100%", border: "1.5px solid #d6d4cd", borderRadius: 10,
                      padding: "13px 15px", fontSize: 22, fontWeight: 800,
                      textAlign: "center", letterSpacing: "0.3em",
                      background: "#fff", color: "#26251e",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: "#26251e", marginBottom: 6 }}>
                    新しい電話番号
                  </label>

                  {/* 表示 */}
                  <div style={{
                    background: "#fff", border: "1.5px solid #d6d4cd", borderRadius: 12,
                    padding: "14px 16px", textAlign: "center", overflow: "hidden",
                    display: "flex", alignItems: "center", justifyContent: "center", height: 64,
                  }}>
                    {newPhone.length > 0
                      ? <span style={{ fontSize: 28, fontWeight: 900, color: "#26251e", letterSpacing: "0.04em", lineHeight: 1 }}>{formatPhone(newPhone)}</span>
                      : <span style={{ fontSize: 28, fontWeight: 700, color: "#bdb9b0", letterSpacing: "0.04em", lineHeight: 1 }}>090-0000-0000</span>}
                  </div>

                  {/* 進捗バー（11桁分固定で出す。login 画面は動的だったが
                      モーダル内は横幅狭いので 11 固定の方が安定） */}
                  <div className="flex gap-1" style={{ margin: "12px 0 8px" }}>
                    {Array.from({ length: 11 }).map((_, i) => (
                      <div key={i} style={{
                        flex: 1, height: 4, borderRadius: 2,
                        background: i < newPhone.length
                          ? (validatePhone(newPhone) ? "#BE123C" : "#1a3a6b")
                          : "#E7E5DF",
                        transition: "background 0.15s",
                      }} />
                    ))}
                  </div>

                  {/* バリデーションエラー枠（常時確保でテンキーのガタつき防止） */}
                  <div
                    className="flex items-center justify-center gap-2"
                    style={{
                      color: "#BE123C", fontSize: 13, fontWeight: 700,
                      marginBottom: 8, minHeight: 20,
                      visibility: validatePhone(newPhone) ? "visible" : "hidden",
                    }}
                    aria-live="polite"
                  >
                    {validatePhone(newPhone) && (<><AlertIcon size={14} strokeWidth={2} /><span>{validatePhone(newPhone)}</span></>)}
                  </div>

                  {/* 090/080/070 クイック選択。
                      newPhone に何か入力されたら visibility:hidden で枠だけ残す
                      （下のテンキーがジャンプしてミスタップを誘発するのを防ぐ） */}
                  <div
                    className="grid grid-cols-3 gap-2"
                    style={{ marginBottom: 8, visibility: newPhone.length === 0 ? "visible" : "hidden" }}
                    aria-hidden={newPhone.length !== 0}
                  >
                    {["090","080","070"].map((p) => (
                      <button key={p} type="button" onClick={() => setNewPhone(p)}
                        tabIndex={newPhone.length === 0 ? 0 : -1}
                        style={{
                          height: 56, background: "#fff", borderRadius: 12,
                          border: "1.5px solid #c9dbe8",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                        <span style={{ fontSize: 24, fontWeight: 900, color: "#1a3a6b", letterSpacing: "0.04em" }}>{p}</span>
                      </button>
                    ))}
                  </div>

                  <PhonePad onPress={pressNewPhoneNum} onDelete={delNewPhone} />

                  <p style={{ fontSize: 12, color: "#9a978c", marginTop: 8 }}>
                    現在: {user.phone}
                  </p>
                </div>
              </>
            )}

            {phoneError && (
              <div style={{
                background: "#fdecef", border: "1px solid #f5bcc7", color: "#BE123C",
                padding: "10px 12px", borderRadius: 10,
                fontSize: 13, fontWeight: 700,
                display: "flex", gap: 6, alignItems: "flex-start",
              }}>
                <AlertIcon size={14} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{phoneError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={phoneConfirming ? () => setPhoneConfirming(false) : closePhoneModal}
                disabled={phoneSaving}
                style={{
                  padding: "16px 0", background: "#E7E5DF", color: "#26251e",
                  fontWeight: 800, fontSize: 16, borderRadius: 12, border: "none",
                  opacity: phoneSaving ? 0.5 : 1,
                }}
              >
                {phoneConfirming ? "戻る" : "キャンセル"}
              </button>
              {(() => {
                // 入力段階では PIN 4 桁 + 電話番号 submittable を両方満たさないと無効。
                // 確認段階に入ったら（確認済みなので）常時押下可。
                const entryDisabled = !phoneConfirming && (phonePin.length !== 4 || !isSubmittable(newPhone));
                const disabled = phoneSaving || entryDisabled;
                return (
                  <button
                    type="button"
                    onClick={handlePhoneSubmit}
                    disabled={disabled}
                    style={{
                      padding: "16px 0",
                      background: disabled ? "#d6d4cd" : "#0D9488",
                      color: disabled ? "#9a978c" : "#fff",
                      fontWeight: 900, fontSize: 16, borderRadius: 12, border: "none",
                      boxShadow: disabled ? "none" : "0 6px 16px rgba(13,148,136,0.25)",
                      cursor: disabled ? "not-allowed" : "pointer",
                    }}
                  >
                    {phoneSaving ? "変更中..." : phoneConfirming ? "変更を確定" : "次へ"}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto" style={{ padding: "20px 16px" }}>

        <div className="flex items-center gap-3" style={{ marginBottom: 16, padding: "0 2px" }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "#eef1f7", color: "#1a3a6b",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <UserIcon size={24} strokeWidth={1.75} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#5a5852", fontWeight: 800, letterSpacing: "0.2em" }}>PROFILE</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#26251e", letterSpacing: "0.04em" }}>
              プロフィール編集
            </div>
          </div>
        </div>

        {/* 電話番号カード */}
        <div style={{
          background: "#faf9f5", borderRadius: 14, padding: 16,
          border: "1px solid #E7E5DF", marginBottom: 14,
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "#eef1f7", color: "#1a3a6b",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <PhoneIcon size={22} strokeWidth={1.75} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: "#5a5852", fontWeight: 800, letterSpacing: "0.18em" }}>
              電話番号（ログインID）
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#26251e", letterSpacing: "0.04em", marginTop: 2 }}>
              {user.phone || "—"}
            </div>
          </div>
          {user.hasPin && (
            <button
              type="button"
              onClick={openPhoneModal}
              style={{
                padding: "8px 14px", background: "#fff", color: "#1a3a6b",
                fontWeight: 800, fontSize: 13, borderRadius: 10,
                border: "1.5px solid #c9dbe8",
                display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
              }}
            >
              <PencilIcon size={14} strokeWidth={2} />
              変更
            </button>
          )}
        </div>

        {/* アプリ設定（ホーム画面追加） */}
        <PwaInstallPanel />

        <form
          onSubmit={handleSave}
          style={{
            background: "#faf9f5", borderRadius: 14, padding: 20,
            border: "1px solid #E7E5DF",
            display: "flex", flexDirection: "column", gap: 16,
          }}
        >
          <div>
            <label style={{ display: "block", fontSize: 14, fontWeight: 800, color: "#26251e", marginBottom: 6 }}>
              会社名 <span style={{ color: "#BE123C" }}>*</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              style={{
                width: "100%", border: "1.5px solid #d6d4cd", borderRadius: 10,
                padding: "13px 15px", fontSize: 17, fontWeight: 600, color: "#26251e",
                background: "#fff",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 14, fontWeight: 800, color: "#26251e", marginBottom: 6 }}>
              お名前 <span style={{ color: "#BE123C" }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: "100%", border: "1.5px solid #d6d4cd", borderRadius: 10,
                padding: "13px 15px", fontSize: 17, fontWeight: 600, color: "#26251e",
                background: "#fff",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 14, fontWeight: 800, color: "#26251e", marginBottom: 6 }}>
              よく使う車番
            </label>
            <input
              type="text"
              value={defaultVehicle}
              onChange={(e) => setDefaultVehicle(e.target.value)}
              placeholder="例: 足立100あ1234"
              style={{
                width: "100%", border: "1.5px solid #d6d4cd", borderRadius: 10,
                padding: "13px 15px", fontSize: 17, fontWeight: 600, color: "#26251e",
                background: "#fff",
              }}
            />
            <p style={{ fontSize: 12, color: "#9a978c", marginTop: 4 }}>予約時に自動で選択されます</p>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 14, fontWeight: 800, color: "#26251e", marginBottom: 6 }}>
              最大積載量（kg）
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={defaultMaxLoad}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9]/g, "");
                  if (v.length <= 6) setDefaultMaxLoad(v);
                }}
                placeholder="例: 2000"
                style={{
                  flex: 1, border: "1.5px solid #d6d4cd", borderRadius: 10,
                  padding: "13px 15px", fontSize: 17, fontWeight: 800, color: "#26251e",
                  textAlign: "right", background: "#fff",
                }}
              />
              <span style={{ fontSize: 17, fontWeight: 800, color: "#5a5852", flexShrink: 0 }}>kg</span>
            </div>
            <p style={{ fontSize: 12, color: "#9a978c", marginTop: 4 }}>予約時に自動で入力されます</p>
          </div>

          {msg && (
            <div style={{
              fontSize: 14, fontWeight: 700, padding: 12, borderRadius: 10,
              display: "flex", alignItems: "center", gap: 8,
              background: isSuccess ? "#e7f4ed" : "#fdecef",
              color: isSuccess ? "#047857" : "#BE123C",
              border: `1px solid ${isSuccess ? "#a7d6bb" : "#f5bcc7"}`,
            }}>
              {isSuccess ? <CheckIcon size={16} strokeWidth={2.5} /> : <AlertIcon size={16} strokeWidth={2} />}
              <span>{msg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            style={{
              width: "100%", padding: "18px 0", fontSize: 18, fontWeight: 900,
              borderRadius: 14, border: "none", letterSpacing: "0.06em",
              background: saving ? "rgba(13,148,136,0.4)" : "#0D9488",
              color: "#fff",
              boxShadow: saving ? "none" : "0 6px 16px rgba(13,148,136,0.25)",
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "保存中..." : "保存する"}
          </button>

        </form>
      </div>
      <BottomNav isAdmin={user.isAdmin} />
    </div>
  );
}
