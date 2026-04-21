"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import AppInstallBar from "@/components/AppInstallBar";
import {
  CenterIcon, TruckIcon, ListIcon, AlertIcon,
  ChevronRightIcon, ChevronLeftIcon,
} from "@/components/Icon";
import { toLocalDateStr } from "@/lib/dateFormat";

interface Reservation {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  vehicleNumber: string;
  companyName: string;
  driverName: string;
  maxLoad: string;
  status: string;
  center?: { id: number; name: string } | null;
}

interface User {
  name: string;
  isAdmin: boolean;
}

export default function MyReservationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [cancelError, setCancelError] = useState("");
  const [confirmTarget, setConfirmTarget] = useState<Reservation | null>(null);
  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    fetch("/api/auth")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setUser)
      .catch(() => router.push("/driver"));
    fetchReservations();
  }, [router]);

  function fetchReservations() {
    setLoadingReservations(true);
    setFetchError(false);
    fetch("/api/driver/reservations?mine=true")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        setReservations(data);
        setLoadingReservations(false);
      })
      .catch(() => {
        setFetchError(true);
        setLoadingReservations(false);
      });
  }

  async function handleCancelConfirmed() {
    if (!confirmTarget) return;
    const r = confirmTarget;
    setConfirmTarget(null);
    setCancelling(r.id);
    setCancelError("");
    try {
      const res = await fetch(`/api/driver/reservations/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (res.ok) {
        fetchReservations();
      } else {
        setCancelError("取り消しに失敗しました");
      }
    } catch {
      setCancelError("通信エラーが発生しました");
    } finally {
      setCancelling(null);
    }
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4"
        style={{ background: "#f2f1ed" }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "#eef1f7", color: "#1a3a6b",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <TruckIcon size={36} strokeWidth={1.75} />
        </div>
        <p style={{ fontSize: 17, color: "#5a5852", fontWeight: 800 }}>読み込み中...</p>
      </div>
    );
  }

  const today = toLocalDateStr(new Date());
  const upcoming = reservations.filter((r) => r.date >= today && r.status !== "cancelled");
  const past = reservations.filter((r) => r.date < today || r.status === "cancelled");

  return (
    <div style={{ minHeight: "100vh", background: "#f2f1ed", paddingBottom: 100 }}>
      <Header driverName={user.name} isAdmin={user.isAdmin} />
      <AppInstallBar />

      {/* キャンセル確認モーダル */}
      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.55)" }}>
          <div style={{
            width: "100%", background: "#faf9f5",
            borderTopLeftRadius: 24, borderTopRightRadius: 24,
            padding: "28px 24px 32px", display: "flex", flexDirection: "column", gap: 18,
          }}>
            <div className="text-center">
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "#fdecef", color: "#BE123C",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                marginBottom: 10,
              }}>
                <AlertIcon size={36} strokeWidth={1.75} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "#26251e", letterSpacing: "0.04em" }}>
                予約を取り消しますか？
              </h2>
            </div>
            <div style={{
              background: "#fff", borderRadius: 14, padding: "14px 18px",
              border: "1px solid #E7E5DF",
            }}>
              {confirmTarget.center && (
                <p style={{
                  fontSize: 14, color: "#1a3a6b", fontWeight: 800, marginBottom: 6,
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <CenterIcon size={16} strokeWidth={1.75} />
                  {confirmTarget.center.name}
                </p>
              )}
              <p style={{ fontSize: 22, fontWeight: 900, color: "#26251e", marginBottom: 4 }}>
                {confirmTarget.vehicleNumber}
              </p>
              <p style={{ fontSize: 16, color: "#5a5852", fontWeight: 700 }}>
                {confirmTarget.date}　{confirmTarget.startTime}〜{confirmTarget.endTime}
              </p>
              {confirmTarget.maxLoad && (
                <p style={{ fontSize: 13, color: "#9a978c", marginTop: 4 }}>
                  最大積載量: {Number(confirmTarget.maxLoad).toLocaleString()} kg
                </p>
              )}
            </div>
            <p style={{ textAlign: "center", fontSize: 14, color: "#5a5852" }}>取り消すと元に戻せません</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setConfirmTarget(null)}
                style={{
                  padding: "18px 0", background: "#E7E5DF", color: "#26251e",
                  fontWeight: 800, fontSize: 18, borderRadius: 14, border: "none",
                }}
              >
                やめる
              </button>
              <button
                onClick={handleCancelConfirmed}
                style={{
                  padding: "18px 0", background: "#BE123C", color: "#fff",
                  fontWeight: 900, fontSize: 18, borderRadius: 14, border: "none",
                  boxShadow: "0 6px 16px rgba(190,18,60,0.25)",
                }}
              >
                取り消す
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto" style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 14 }}>

        {cancelError && (
          <div style={{
            background: "#fdecef", border: "1px solid #f5bcc7", color: "#BE123C",
            padding: 14, borderRadius: 12, fontSize: 15, fontWeight: 800, textAlign: "center",
          }}>
            {cancelError}
          </div>
        )}

        {loadingReservations && (
          <div className="flex flex-col items-center justify-center" style={{ padding: "60px 20px", gap: 16 }}>
            <style>{`@keyframes mr-spin { to { transform: rotate(360deg) } }`}</style>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "#eef1f7", color: "#1a3a6b",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ListIcon size={32} strokeWidth={1.75} />
            </div>
            <p style={{ fontSize: 17, color: "#5a5852", fontWeight: 800 }}>予約を確認中...</p>
            <div style={{
              width: 24, height: 24,
              border: "3px solid #E7E5DF", borderTopColor: "#1a3a6b",
              borderRadius: "50%", animation: "mr-spin 0.8s linear infinite",
            }} />
          </div>
        )}

        {!loadingReservations && fetchError && (
          <div style={{
            background: "#faf9f5", borderRadius: 14, padding: 32,
            textAlign: "center", border: "1px solid #E7E5DF",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "#fdecef", color: "#BE123C",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <AlertIcon size={32} strokeWidth={1.75} />
            </div>
            <p style={{ fontSize: 18, color: "#26251e", fontWeight: 800 }}>読み込みに失敗しました</p>
            <button
              onClick={fetchReservations}
              style={{
                padding: "16px 32px", background: "#1a3a6b", color: "#fff",
                borderRadius: 14, fontSize: 17, fontWeight: 800, border: "none",
              }}
            >
              もう一度試す
            </button>
          </div>
        )}

        {!loadingReservations && !fetchError && upcoming.length === 0 && (
          <div style={{
            background: "#faf9f5", borderRadius: 14, padding: 36,
            textAlign: "center", border: "1px solid #E7E5DF",
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "#eef1f7", color: "#1a3a6b",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              marginBottom: 14,
            }}>
              <ListIcon size={36} strokeWidth={1.75} />
            </div>
            <p style={{ fontSize: 19, color: "#5a5852", fontWeight: 800, marginBottom: 20 }}>
              予約はありません
            </p>
            <button
              onClick={() => router.push("/driver/dashboard")}
              style={{
                padding: "18px 36px", background: "#0D9488", color: "#fff",
                borderRadius: 14, fontSize: 18, fontWeight: 900, border: "none",
                boxShadow: "0 6px 16px rgba(13,148,136,0.25)",
                display: "inline-flex", alignItems: "center", gap: 10,
              }}
            >
              予約する
              <ChevronRightIcon size={20} strokeWidth={2.5} />
            </button>
          </div>
        )}

        {!loadingReservations && !fetchError && upcoming.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between" style={{ padding: "0 2px" }}>
              <h2 style={{ fontSize: 13, fontWeight: 800, color: "#5a5852", letterSpacing: "0.18em" }}>
                今後の予約
              </h2>
              <button
                onClick={fetchReservations}
                style={{
                  fontSize: 13, color: "#1a3a6b", fontWeight: 800,
                  background: "transparent", border: "none", cursor: "pointer",
                }}
              >
                更新
              </button>
            </div>
            {upcoming.map((r) => {
              const weekday = ["日", "月", "火", "水", "木", "金", "土"][new Date(r.date + "T00:00:00").getDay()];
              return (
                <div key={r.id} style={{
                  background: "#faf9f5", borderRadius: 14, overflow: "hidden",
                  border: "1px solid #E7E5DF",
                }}>
                  <div style={{ padding: "18px 20px" }}>
                    {r.center && (
                      <p style={{
                        fontSize: 13, fontWeight: 800, color: "#1a3a6b",
                        display: "flex", alignItems: "center", gap: 6, marginBottom: 6,
                      }}>
                        <CenterIcon size={15} strokeWidth={1.75} />
                        {r.center.name}
                      </p>
                    )}
                    <p style={{ fontSize: 22, fontWeight: 900, color: "#26251e", marginBottom: 4, letterSpacing: "0.02em" }}>
                      {r.vehicleNumber}
                    </p>
                    <p style={{ fontSize: 16, color: "#5a5852", fontWeight: 700 }}>
                      {r.date}（{weekday}）
                    </p>
                    <p style={{ fontSize: 20, fontWeight: 900, color: "#1a3a6b", marginTop: 4, letterSpacing: "0.04em" }}>
                      {r.startTime}　〜　{r.endTime}
                    </p>
                    {r.maxLoad && (
                      <p style={{ fontSize: 13, color: "#9a978c", marginTop: 4 }}>
                        最大積載量: {Number(r.maxLoad).toLocaleString()} kg
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setConfirmTarget(r)}
                    disabled={cancelling === r.id}
                    style={{
                      width: "100%", padding: "16px 0",
                      background: "#fff5f7", borderTop: "1px solid #f5bcc7",
                      color: "#BE123C", fontSize: 16, fontWeight: 800,
                      border: "none", cursor: cancelling === r.id ? "not-allowed" : "pointer",
                      opacity: cancelling === r.id ? 0.5 : 1,
                    }}
                  >
                    {cancelling === r.id ? "取り消し中..." : "この予約を取り消す"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {!loadingReservations && !fetchError && past.length > 0 && (
          <div className="space-y-3">
            <button
              onClick={() => setShowPast((v) => !v)}
              style={{
                width: "100%", display: "flex", alignItems: "center",
                justifyContent: "space-between", padding: "10px 2px",
                fontSize: 14, fontWeight: 800, color: "#5a5852",
                background: "transparent", border: "none", cursor: "pointer",
              }}
            >
              <span>過去・取消済みを見る（{past.length}件）</span>
              <span style={{ display: "inline-flex", transform: showPast ? "rotate(90deg)" : "rotate(-90deg)" }}>
                <ChevronLeftIcon size={18} strokeWidth={2} />
              </span>
            </button>
            {showPast && past.map((r) => (
              <div key={r.id} style={{
                background: "#faf9f5", borderRadius: 12, padding: "16px 18px",
                border: "1px solid #E7E5DF", opacity: 0.6,
              }}>
                {r.center && (
                  <p style={{
                    fontSize: 12, color: "#1a3a6b", fontWeight: 700, marginBottom: 4,
                    display: "flex", alignItems: "center", gap: 4,
                  }}>
                    <CenterIcon size={13} strokeWidth={1.75} />
                    {r.center.name}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <p style={{ fontSize: 17, fontWeight: 800, color: "#26251e" }}>{r.vehicleNumber}</p>
                    <p style={{ fontSize: 13, color: "#5a5852" }}>{r.date}　{r.startTime}〜{r.endTime}</p>
                    {r.maxLoad && (
                      <p style={{ fontSize: 11, color: "#9a978c" }}>積載: {Number(r.maxLoad).toLocaleString()} kg</p>
                    )}
                  </div>
                  <span style={{
                    padding: "4px 12px", borderRadius: 999,
                    fontSize: 12, fontWeight: 800,
                    background: r.status === "cancelled" ? "#fdecef" : "#E7E5DF",
                    color: r.status === "cancelled" ? "#BE123C" : "#5a5852",
                  }}>
                    {r.status === "cancelled" ? "取消済" : "完了"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
      <BottomNav isAdmin={user.isAdmin} />
    </div>
  );
}
