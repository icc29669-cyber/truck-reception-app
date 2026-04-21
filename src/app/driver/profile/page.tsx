"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { UserIcon, CheckIcon, AlertIcon, PhoneIcon, PencilIcon } from "@/components/Icon";
import PwaInstallPanel from "@/components/PwaInstallPanel";
import { normalizePhone } from "@/lib/phone";

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
    fetch("/api/auth")
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

  async function handlePhoneSubmit() {
    if (!/^\d{4}$/.test(phonePin)) {
      setPhoneError("PINを4桁の数字で入力してください"); return;
    }
    const normalized = normalizePhone(newPhone);
    if (!/^0\d{9,10}$/.test(normalized)) {
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
                    <span style={{ fontSize: 20, fontWeight: 900, color: "#0D9488" }}>{normalizePhone(newPhone)}</span>
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
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value.replace(/[^0-9\-\s]/g, ""))}
                    placeholder="09012345678"
                    style={{
                      width: "100%", border: "1.5px solid #d6d4cd", borderRadius: 10,
                      padding: "13px 15px", fontSize: 18, fontWeight: 800,
                      background: "#fff", color: "#26251e",
                    }}
                  />
                  <p style={{ fontSize: 12, color: "#9a978c", marginTop: 4 }}>
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
              <button
                type="button"
                onClick={handlePhoneSubmit}
                disabled={phoneSaving}
                style={{
                  padding: "16px 0", background: phoneSaving ? "rgba(13,148,136,0.5)" : "#0D9488",
                  color: "#fff", fontWeight: 900, fontSize: 16, borderRadius: 12, border: "none",
                  boxShadow: phoneSaving ? "none" : "0 6px 16px rgba(13,148,136,0.25)",
                }}
              >
                {phoneSaving ? "変更中..." : phoneConfirming ? "変更を確定" : "次へ"}
              </button>
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
