"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import AppInstallBar from "@/components/AppInstallBar";
import LicensePlateInput, { PlateView, parsePlate, Step } from "@/components/LicensePlateInput";
import {
  CenterIcon, TruckIcon, PencilIcon, CheckIcon,
  ChevronLeftIcon, ChevronRightIcon, InstallIcon,
} from "@/components/Icon";

type StepLabel = { label: string; state: "done" | "active" | "pending" };
function StepIndicator({ steps }: { steps: StepLabel[] }) {
  return (
    <div className="flex items-center gap-1" style={{ padding: "0 2px" }}>
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-2" style={{ flex: 1 }}>
          <div
            style={{
              width: 26, height: 26, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 900,
              background: s.state === "done" ? "#047857" : s.state === "active" ? "#1a3a6b" : "#E7E5DF",
              color: s.state === "pending" ? "#9a978c" : "#fff",
              flexShrink: 0,
            }}
          >
            {s.state === "done" ? <CheckIcon size={14} strokeWidth={3} /> : (i + 1)}
          </div>
          <span style={{
            fontSize: 12,
            fontWeight: s.state === "active" ? 900 : 700,
            color: s.state === "active" ? "#1a3a6b" : s.state === "done" ? "#5a5852" : "#9a978c",
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
          }}>{s.label}</span>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: 1, background: "#E7E5DF" }} />
          )}
        </div>
      ))}
    </div>
  );
}

function ReserveForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const date = searchParams.get("date") || "";
  const startTime = searchParams.get("startTime") || "";
  const endTime = searchParams.get("endTime") || "";
  const centerIdParam = searchParams.get("centerId");
  const centerId = centerIdParam ? parseInt(centerIdParam) : null;

  const [user, setUser] = useState<{
    name: string;
    isAdmin: boolean;
    companyName: string;
    defaultVehicle: string;
    defaultMaxLoad: string;
  } | null>(null);
  const [centerName, setCenterName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [driverName, setDriverName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [maxLoad, setMaxLoad] = useState("");
  const [plateMode, setPlateMode] = useState<"view" | "select" | Step>("view");
  const plateRef = useRef<HTMLDivElement>(null);
  const driverNameRef = useRef<HTMLInputElement>(null);
  const maxLoadRef = useRef<HTMLInputElement>(null);
  const editFromSelect = useRef(false);
  const scrollToPlate = () => setTimeout(() => plateRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  const focusMaxLoad = () => setTimeout(() => {
    maxLoadRef.current?.focus();
    maxLoadRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 100);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(() => {
    if (typeof window === "undefined") return false;
    const key = `reservation_done_${date}_${startTime}_${centerId}`;
    return sessionStorage.getItem(key) === "1";
  });
  const defaultsLoaded = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);

  useEffect(() => {
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    fetch("/api/auth")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((u) => {
        setUser(u);
        const savedCompany = u.companyName || "";
        const savedName = u.name || "";
        const savedVehicle = u.defaultVehicle || "";
        const savedMaxLoad = u.defaultMaxLoad || "";
        setCompanyName(savedCompany);
        setDriverName(savedName);
        setVehicleNumber(savedVehicle);
        setMaxLoad(savedMaxLoad);
        if (!savedVehicle) setPlateMode("area");
        defaultsLoaded.current = true;
      })
      .catch(() => router.push("/driver"));

    if (centerId) {
      fetch("/api/centers?forDriver=1")
        .then((r) => r.json())
        .then((centers: { id: number; name: string }[]) => {
          const c = centers.find((c) => c.id === centerId);
          if (c) setCenterName(c.name);
        });
    }
  }, [router]);

  const plateParts = parsePlate(vehicleNumber);
  const vehicleComplete = !!plateParts.area && !!plateParts.num3 && !!plateParts.kana && !!plateParts.num4;

  const isReady =
    companyName.trim() !== "" &&
    driverName.trim() !== "" &&
    vehicleComplete &&
    maxLoad.trim() !== "" &&
    Number(maxLoad) > 0;

  useEffect(() => {
    if (!defaultsLoaded.current || done) return;
    const isDirty = companyName.trim() !== "" || driverName.trim() !== "" || vehicleNumber.length > 0;
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [companyName, driverName, vehicleNumber, done]);

  function handleConfirmOpen(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim()) { setError("会社名を入力してください"); return; }
    if (!driverName.trim()) { setError("お名前を入力してください"); return; }
    if (!vehicleComplete) { setError("車番を入力してください"); return; }
    if (!maxLoad.trim() || Number(maxLoad) <= 0) { setError("最大積載量を正しく入力してください"); return; }
    setError("");
    setShowConfirm(true);
  }

  async function handleSubmit() {
    setShowConfirm(false);
    setSubmitting(true);

    try {
      const res = await fetch("/api/driver/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, startTime, endTime, vehicleNumber, maxLoad, companyName, driverName, centerId }),
      });

      if (res.ok) {
        await fetch("/api/driver/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: driverName, companyName, defaultVehicle: vehicleNumber, defaultMaxLoad: maxLoad }),
        });

        setDone(true);
        try { sessionStorage.setItem(`reservation_done_${date}_${startTime}_${centerId}`, "1"); } catch { /* ignore */ }
      } else {
        const data = await res.json();
        setError(data.error || "予約に失敗しました");
      }
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4"
        style={{ background: "#f2f1ed" }}>
        <style>{`@keyframes rv-spin { to { transform: rotate(360deg) } }`}</style>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "#eef1f7", color: "#1a3a6b",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <TruckIcon size={36} strokeWidth={1.75} />
        </div>
        <p style={{ fontSize: 17, color: "#5a5852", fontWeight: 800 }}>読み込み中...</p>
        <div style={{
          width: 28, height: 28,
          border: "3px solid #E7E5DF", borderTopColor: "#1a3a6b",
          borderRadius: "50%", animation: "rv-spin 0.8s linear infinite",
        }} />
      </div>
    );
  }

  const weekday = date ? ["日", "月", "火", "水", "木", "金", "土"][new Date(date + "T00:00:00").getDay()] : "";

  const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);

  async function handleInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setIsStandalone(true);
      setDeferredPrompt(null);
    } else {
      setShowInstallModal(true);
    }
  }

  // ━━ 予約完了画面 ━━
  if (done) {
    return (
      <div style={{ minHeight: "100vh", background: "#f2f1ed" }}>
        <Header driverName={user.name || driverName} isAdmin={user.isAdmin} />
        <AppInstallBar />

        {showInstallModal && (
          <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.55)" }}>
            <div style={{
              width: "100%", background: "#faf9f5",
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              padding: "24px 24px 32px", display: "flex", flexDirection: "column", gap: 20,
            }}>
              <div className="text-center">
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "#eef1f7", color: "#1a3a6b",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 10,
                }}>
                  <InstallIcon size={32} strokeWidth={2} />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: "#26251e" }}>
                  ホーム画面に追加する方法
                </h2>
              </div>
              <div style={{
                background: "#eef1f7", borderRadius: 14, padding: 16,
                display: "flex", flexDirection: "column", gap: 12, textAlign: "left",
              }}>
                {isIOS ? (
                  <>
                    {[
                      <>Safari 画面<span style={{ fontWeight: 800 }}>下部中央</span>の <span style={{ fontWeight: 800 }}>「□↑」</span>をタップ</>,
                      <>スクロールして <span style={{ fontWeight: 800 }}>「ホーム画面に追加」</span>をタップ</>,
                      <>右上の <span style={{ fontWeight: 800 }}>「追加」</span>をタップして完了</>,
                    ].map((text, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span style={{
                          width: 26, height: 26, borderRadius: "50%",
                          background: "#1a3a6b", color: "#fff", fontWeight: 800,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0, fontSize: 12,
                        }}>{i + 1}</span>
                        <span style={{ fontSize: 14, color: "#26251e" }}>{text}</span>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    {[
                      <>Chrome 右上の <span style={{ fontWeight: 800 }}>「⋮」</span>メニューをタップ</>,
                      <><span style={{ fontWeight: 800 }}>「ホーム画面に追加」</span>をタップ</>,
                    ].map((text, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span style={{
                          width: 26, height: 26, borderRadius: "50%",
                          background: "#1a3a6b", color: "#fff", fontWeight: 800,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0, fontSize: 12,
                        }}>{i + 1}</span>
                        <span style={{ fontSize: 14, color: "#26251e" }}>{text}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
              <button
                onClick={() => setShowInstallModal(false)}
                style={{
                  width: "100%", padding: "18px 0", background: "#1a3a6b",
                  color: "#fff", fontWeight: 900, fontSize: 19, borderRadius: 14, border: "none",
                }}
              >
                閉じる
              </button>
            </div>
          </div>
        )}

        <div className="max-w-lg mx-auto" style={{ padding: 20 }}>
          <div style={{
            background: "#faf9f5", borderRadius: 18, overflow: "hidden",
            border: "1px solid #E7E5DF", boxShadow: "0 6px 18px rgba(26,37,30,0.06)",
          }}>
            {/* 完了ヘッダー */}
            <div style={{ padding: "32px 24px 20px", textAlign: "center" }}>
              <div style={{
                width: 88, height: 88, borderRadius: "50%",
                background: "#047857", color: "#fff",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                marginBottom: 14, boxShadow: "0 10px 24px rgba(4,120,87,0.28)",
              }}>
                <CheckIcon size={52} strokeWidth={3} />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: "#26251e", letterSpacing: "0.04em" }}>
                予約が完了しました
              </h2>
            </div>

            {/* 予約サマリー */}
            <div style={{
              margin: "0 16px 16px", borderRadius: 14, overflow: "hidden",
              background: "#fff", border: "1px solid #E7E5DF",
            }}>
              <div style={{ padding: "18px 20px 14px", textAlign: "center", borderBottom: "1px solid #E7E5DF" }}>
                {centerName && (
                  <p style={{
                    fontSize: 16, fontWeight: 900, color: "#26251e",
                    display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 6,
                  }}>
                    <CenterIcon size={18} strokeWidth={1.75} style={{ color: "#5a5852" }} />
                    {centerName}
                  </p>
                )}
                <p style={{ fontSize: 14, fontWeight: 700, color: "#5a5852", marginBottom: 6 }}>
                  {date}（{weekday}）
                </p>
                <p style={{ fontSize: 30, fontWeight: 900, color: "#1a3a6b", letterSpacing: "0.04em" }}>
                  {startTime}　〜　{endTime}
                </p>
              </div>
              <div style={{ padding: "16px", display: "flex", justifyContent: "center", borderBottom: "1px solid #E7E5DF" }}>
                <div style={{ width: 224, height: 112, overflow: "hidden" }}>
                  <div style={{ transform: "scale(0.70)", transformOrigin: "top left", width: 320 }}>
                    <PlateView value={vehicleNumber} />
                  </div>
                </div>
              </div>
              <div style={{ padding: "14px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 16, rowGap: 10 }}>
                <div>
                  <p style={{ fontSize: 11, color: "#9a978c", letterSpacing: "0.16em", fontWeight: 700 }}>運送会社</p>
                  <p style={{ fontSize: 15, fontWeight: 800, color: "#26251e", marginTop: 2 }}>{companyName}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: "#9a978c", letterSpacing: "0.16em", fontWeight: 700 }}>ドライバー</p>
                  <p style={{ fontSize: 15, fontWeight: 800, color: "#26251e", marginTop: 2 }}>{driverName}</p>
                </div>
                {maxLoad && (
                  <div style={{ gridColumn: "1 / -1", paddingTop: 10, borderTop: "1px solid #E7E5DF" }}>
                    <p style={{ fontSize: 11, color: "#9a978c", letterSpacing: "0.16em", fontWeight: 700 }}>最大積載量</p>
                    <p style={{ fontSize: 19, fontWeight: 900, color: "#26251e", marginTop: 2 }}>
                      {Number(maxLoad).toLocaleString()} <span style={{ fontSize: 13, fontWeight: 700, color: "#5a5852" }}>kg</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: "0 16px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={() => { try { sessionStorage.removeItem(`reservation_done_${date}_${startTime}_${centerId}`); } catch {} router.replace("/driver/dashboard"); }}
                style={{
                  width: "100%", padding: "20px 0", background: "#1a3a6b",
                  color: "#fff", fontWeight: 900, fontSize: 19, borderRadius: 14, border: "none",
                  letterSpacing: "0.08em",
                }}
              >
                TOPに戻る
              </button>
              <button
                onClick={() => { try { sessionStorage.removeItem(`reservation_done_${date}_${startTime}_${centerId}`); } catch {} router.replace("/driver/my-reservations"); }}
                style={{
                  width: "100%", padding: "16px 0", background: "#fff",
                  color: "#1a3a6b", fontWeight: 800, fontSize: 15, borderRadius: 14,
                  border: "1.5px solid #c9dbe8",
                }}
              >
                予約一覧を確認する
              </button>
              {!isStandalone && (
                <button
                  onClick={handleInstall}
                  style={{
                    width: "100%", padding: "16px 0", background: "#0D9488",
                    color: "#fff", fontWeight: 800, fontSize: 16, borderRadius: 14,
                    border: "none",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  }}
                >
                  <InstallIcon size={20} strokeWidth={2} />
                  ホーム画面に追加する
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f2f1ed" }}>
      <Header driverName={user.name || "ゲスト"} isAdmin={user.isAdmin} />
      <AppInstallBar />

      {/* ━━ 予約確認モーダル ━━ */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.55)" }}>
          <div style={{
            width: "100%", background: "#faf9f5",
            borderTopLeftRadius: 24, borderTopRightRadius: 24,
            padding: "24px 22px 32px", display: "flex", flexDirection: "column", gap: 18,
          }}>
            <div className="text-center">
              <div style={{ marginBottom: 10 }}>
                <StepIndicator steps={[
                  { label: "センター", state: "done" },
                  { label: "時間", state: "done" },
                  { label: "情報入力", state: "done" },
                  { label: "最終確認", state: "active" },
                ]} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "#26251e", letterSpacing: "0.04em" }}>
                この内容で予約しますか？
              </h2>
            </div>
            <div style={{
              background: "#fff", borderRadius: 14, overflow: "hidden",
              border: "1px solid #E7E5DF",
            }}>
              <div style={{ padding: "14px 20px 12px", textAlign: "center", borderBottom: "1px solid #E7E5DF" }}>
                {centerName && (
                  <p style={{
                    fontSize: 15, fontWeight: 900, color: "#26251e",
                    display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 4,
                  }}>
                    <CenterIcon size={16} strokeWidth={1.75} style={{ color: "#5a5852" }} />
                    {centerName}
                  </p>
                )}
                <p style={{ fontSize: 13, fontWeight: 700, color: "#5a5852", marginBottom: 4 }}>
                  {date}（{weekday}）
                </p>
                <p style={{ fontSize: 24, fontWeight: 900, color: "#1a3a6b", letterSpacing: "0.04em" }}>
                  {startTime}　〜　{endTime}
                </p>
              </div>
              <div style={{ padding: 12, display: "flex", justifyContent: "center", borderBottom: "1px solid #E7E5DF" }}>
                <div style={{ width: 208, height: 104, overflow: "hidden" }}>
                  <div style={{ transform: "scale(0.65)", transformOrigin: "top left", width: 320 }}>
                    <PlateView value={vehicleNumber} />
                  </div>
                </div>
              </div>
              <div style={{ padding: "12px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 16, rowGap: 8 }}>
                <div>
                  <span style={{ fontSize: 11, color: "#9a978c", letterSpacing: "0.16em", fontWeight: 700, display: "block" }}>運送会社</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#26251e" }}>{companyName}</span>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: "#9a978c", letterSpacing: "0.16em", fontWeight: 700, display: "block" }}>ドライバー</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#26251e" }}>{driverName}</span>
                </div>
                {maxLoad && (
                  <div style={{ gridColumn: "1 / -1", paddingTop: 8, borderTop: "1px solid #E7E5DF" }}>
                    <span style={{ fontSize: 11, color: "#9a978c", letterSpacing: "0.16em", fontWeight: 700, display: "block" }}>最大積載量</span>
                    <span style={{ fontSize: 18, fontWeight: 900, color: "#26251e" }}>
                      {Number(maxLoad).toLocaleString()} <span style={{ fontSize: 13, fontWeight: 700, color: "#5a5852" }}>kg</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  padding: "18px 0", background: "#E7E5DF", color: "#26251e",
                  fontWeight: 800, fontSize: 18, borderRadius: 14, border: "none",
                }}
              >
                修正する
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  padding: "18px 0", background: submitting ? "rgba(13,148,136,0.5)" : "#0D9488",
                  color: "#fff", fontWeight: 900, fontSize: 18, borderRadius: 14, border: "none",
                  boxShadow: "0 6px 16px rgba(13,148,136,0.25)",
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? "登録中..." : "予約する"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto" style={{ padding: "18px 16px 32px", display: "flex", flexDirection: "column", gap: 14 }}>

        <StepIndicator steps={[
          { label: "センター", state: "done" },
          { label: "時間", state: "done" },
          { label: "情報入力", state: "active" },
          { label: "最終確認", state: "pending" },
        ]} />

        {/* センター＋時間帯 */}
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            width: "100%", background: "#1a3a6b", color: "#fff",
            borderRadius: 14, padding: "18px 20px",
            textAlign: "left", border: "none", cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div>
              {centerName && (
                <p style={{
                  fontSize: 14, color: "rgba(255,255,255,0.7)",
                  display: "flex", alignItems: "center", gap: 6, marginBottom: 6,
                }}>
                  <CenterIcon size={16} strokeWidth={1.75} />
                  {centerName}
                </p>
              )}
              <p style={{ fontSize: 28, fontWeight: 900, letterSpacing: "0.04em" }}>
                {startTime}　〜　{endTime}
              </p>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.72)", fontWeight: 700, marginTop: 4 }}>
                {date}（{weekday}）
              </p>
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 4,
              color: "rgba(255,255,255,0.68)", fontSize: 13, fontWeight: 700,
              background: "rgba(255,255,255,0.1)", borderRadius: 999, padding: "4px 10px",
              flexShrink: 0,
            }}>
              <PencilIcon size={14} strokeWidth={2} />
              変更
            </div>
          </div>
        </button>

        <form
          onSubmit={handleConfirmOpen}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") e.preventDefault(); }}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          {/* 会社名 */}
          <div style={{
            background: "#faf9f5", borderRadius: 14, padding: 16,
            border: "1px solid #E7E5DF",
          }}>
            <label style={{ display: "block", fontSize: 15, fontWeight: 800, color: "#26251e", marginBottom: 8 }}>
              会社名 <span style={{ color: "#BE123C" }}>*</span>
            </label>
            <input
              type="text"
              enterKeyHint="next"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); driverNameRef.current?.focus(); } }}
              placeholder="例：〇〇運輸"
              style={{
                width: "100%", border: "1.5px solid #d6d4cd", borderRadius: 10,
                padding: "14px 16px", fontSize: 19, fontWeight: 600, color: "#26251e",
                background: "#fff",
              }}
            />
          </div>

          {/* お名前 */}
          <div style={{
            background: "#faf9f5", borderRadius: 14, padding: 16,
            border: "1px solid #E7E5DF",
          }}>
            <label style={{ display: "block", fontSize: 15, fontWeight: 800, color: "#26251e", marginBottom: 8 }}>
              お名前 <span style={{ color: "#BE123C" }}>*</span>
            </label>
            <input
              type="text"
              enterKeyHint="done"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              ref={driverNameRef}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLInputElement).blur(); scrollToPlate(); } }}
              placeholder="例：山田 太郎"
              style={{
                width: "100%", border: "1.5px solid #d6d4cd", borderRadius: 10,
                padding: "14px 16px", fontSize: 19, fontWeight: 600, color: "#26251e",
                background: "#fff",
              }}
            />
          </div>

          {/* 車番 */}
          <div ref={plateRef} style={{
            background: "#faf9f5", borderRadius: 14, padding: 16,
            border: "1px solid #E7E5DF",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <label style={{ fontSize: 15, fontWeight: 800, color: "#26251e" }}>
                車番 <span style={{ color: "#BE123C" }}>*</span>
              </label>
              {plateMode === "view" && vehicleNumber && (
                <button type="button" onClick={() => {
                  editFromSelect.current = true;
                  setPlateMode("select");
                  scrollToPlate();
                }}
                  style={{
                    fontSize: 14, color: "#1a3a6b", fontWeight: 800,
                    background: "transparent", border: "none", cursor: "pointer",
                  }}>
                  修正する
                </button>
              )}
              {plateMode === "select" && (
                <button type="button" onClick={() => {
                  editFromSelect.current = false;
                  setPlateMode("view");
                }}
                  style={{
                    fontSize: 14, color: "#1a3a6b", fontWeight: 800,
                    background: "transparent", border: "none", cursor: "pointer",
                  }}>
                  修正完了
                </button>
              )}
            </div>
            {plateMode === "view" && vehicleNumber ? (
              <PlateView value={vehicleNumber} />
            ) : plateMode === "select" ? (
              <>
                <PlateView value={vehicleNumber} selectableMode
                  onPartClick={(part) => { setPlateMode(part); scrollToPlate(); }} />
                <p style={{
                  textAlign: "center", fontSize: 14, fontWeight: 800, marginTop: 12,
                  color: "#1a3a6b",
                }}>
                  修正したい箇所をタップしてください
                </p>
              </>
            ) : (
              <LicensePlateInput
                value={vehicleNumber}
                onChange={setVehicleNumber}
                onComplete={() => {
                  if (editFromSelect.current) {
                    setPlateMode("select");
                    editFromSelect.current = false;
                    scrollToPlate();
                  } else {
                    setPlateMode("view");
                    // 初回入力完了時：最大積載量が未入力なら自動フォーカス
                    if (!maxLoad) {
                      focusMaxLoad();
                    } else {
                      scrollToPlate();
                    }
                  }
                }}
                initialStep={plateMode as Step}
                singleStepMode={editFromSelect.current}
              />
            )}
          </div>

          {/* 最大積載量 */}
          <div style={{
            background: "#faf9f5", borderRadius: 14, padding: 16,
            border: "1px solid #E7E5DF",
          }}>
            <label style={{ display: "block", fontSize: 15, fontWeight: 800, color: "#26251e", marginBottom: 8 }}>
              最大積載量（kg）<span style={{ color: "#BE123C" }}>*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                enterKeyHint="done"
                value={maxLoad}
                ref={maxLoadRef}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9]/g, "");
                  if (v.length <= 6) setMaxLoad(v);
                }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }}
                placeholder="例：2000"
                style={{
                  flex: 1, border: "1.5px solid #d6d4cd", borderRadius: 10,
                  padding: "14px 16px", fontSize: 19, fontWeight: 800,
                  textAlign: "right", background: "#fff", color: "#26251e",
                }}
              />
              <span style={{ fontSize: 19, fontWeight: 800, color: "#5a5852", flexShrink: 0 }}>kg</span>
            </div>
            {maxLoad && (
              <p style={{ fontSize: 13, color: "#9a978c", textAlign: "right", marginTop: 4 }}>
                {Number(maxLoad).toLocaleString()} kg
              </p>
            )}
          </div>

          {error && (
            <div style={{
              background: "#fdecef", border: "1px solid #f5bcc7", color: "#BE123C",
              padding: 14, borderRadius: 12, fontSize: 16, fontWeight: 800, textAlign: "center",
            }}>
              {error}
            </div>
          )}

          {!isReady && (
            <div style={{
              background: "#fef6db", border: "1px solid #f4d27a",
              borderRadius: 12, padding: "12px 16px",
              fontSize: 13, color: "#8a4a15",
              display: "flex", flexDirection: "column", gap: 2,
            }}>
              <p style={{ fontWeight: 800, marginBottom: 4 }}>以下を入力してください：</p>
              {!companyName.trim() && <p>・会社名</p>}
              {!driverName.trim() && <p>・お名前</p>}
              {!vehicleComplete && <p>・車番（地名・分類番号・ひらがな・一連番号）</p>}
              {!maxLoad.trim() && <p>・最大積載量</p>}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !isReady}
            style={{
              width: "100%", padding: "22px 0", fontSize: 20, fontWeight: 900,
              borderRadius: 14, border: "none", letterSpacing: "0.06em",
              background: (submitting || !isReady) ? "rgba(13,148,136,0.35)" : "#0D9488",
              color: "#fff",
              boxShadow: (submitting || !isReady) ? "none" : "0 10px 24px rgba(13,148,136,0.28)",
              cursor: (submitting || !isReady) ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            }}
          >
            {submitting ? "登録中..." : (<>予約内容を確認する<ChevronRightIcon size={22} strokeWidth={2.5} /></>)}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ReservePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen gap-4"
        style={{ background: "#f2f1ed" }}>
        <style>{`@keyframes rv-spin { to { transform: rotate(360deg) } }`}</style>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "#eef1f7", color: "#1a3a6b",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <TruckIcon size={36} strokeWidth={1.75} />
        </div>
        <p style={{ fontSize: 17, color: "#5a5852", fontWeight: 800 }}>読み込み中...</p>
      </div>
    }>
      <ReserveForm />
    </Suspense>
  );
}
