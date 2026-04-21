"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import AppInstallBar from "@/components/AppInstallBar";
import {
  CenterIcon, CalendarIcon, PencilIcon, CoffeeIcon,
  AlertIcon, BlockIcon, ChevronLeftIcon, ChevronRightIcon, CheckIcon,
} from "@/components/Icon";
import { toLocalDateStr } from "@/lib/dateFormat";

interface Reservation {
  id: number;
  startTime: string;
  endTime: string;
}

interface Setting {
  slotDurationMinutes: number;
  openTime: string;
  closeTime: string;
  maxReservationsPerSlot: number;
  closedOnSunday?: boolean;
  hasBreak?: boolean;
  breakStart?: string;
  breakEnd?: string;
  extraBreaks?: { start: string; end: string }[];
}

interface User {
  name: string;
  isAdmin: boolean;
}

interface Center {
  id: number;
  name: string;
}

function getTimeSlots(openTime: string, closeTime: string, duration: number): string[] {
  const slots: string[] = [];
  const [openH, openM] = openTime.split(":").map(Number);
  const [closeH, closeM] = closeTime.split(":").map(Number);
  let current = openH * 60 + openM;
  const end = closeH * 60 + closeM;
  while (current < end) {
    const h = Math.floor(current / 60).toString().padStart(2, "0");
    const m = (current % 60).toString().padStart(2, "0");
    slots.push(`${h}:${m}`);
    current += duration;
  }
  return slots;
}

function getEndTime(startTime: string, duration: number): string {
  const [h, m] = startTime.split(":").map(Number);
  const total = h * 60 + m + duration;
  return `${Math.floor(total / 60).toString().padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`;
}

function jaTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  return m === 0 ? `${h}時` : `${h}時${m}分`;
}


// ── ステップインジケーター ──
type StepLabel = { label: string; state: "done" | "active" | "pending" };
function StepIndicator({ steps }: { steps: StepLabel[] }) {
  return (
    <div className="flex items-center gap-1" style={{ padding: "0 2px", marginBottom: 14 }}>
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

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [setting, setSetting] = useState<Setting | null>(null);
  const [settingError, setSettingError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [holiday, setHoliday] = useState<{ date: string; name: string } | null>(null);
  const [centers, setCenters] = useState<Center[]>([]);
  const [centersLoaded, setCentersLoaded] = useState(false);
  const [selectedCenterId, setSelectedCenterId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => toLocalDateStr(new Date()));
  const [toast, setToast] = useState("");
  const [, setTick] = useState(0);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible") setTick((t) => t + 1);
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  useEffect(() => {
    fetch("/api/auth")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setUser)
      .catch(() => router.push("/driver"));

    fetch("/api/centers?forDriver=1")
      .then((r) => r.json())
      .then((data: Center[]) => {
        setCenters(data);
        setCentersLoaded(true);
      })
      .catch(() => setCentersLoaded(true));

    const params = new URLSearchParams(window.location.search);
    const cid = params.get("centerId");
    if (cid) {
      setSelectedCenterId(parseInt(cid));
      window.history.replaceState({}, "", "/driver/dashboard");
    }
  }, [router]);

  useEffect(() => {
    if (!selectedDate || selectedCenterId === null) return;
    setSetting(null);
    setSettingError(false);

    const timer = setTimeout(() => setSettingError(true), 10000);

    fetch(`/api/driver/berths?date=${selectedDate}&centerId=${selectedCenterId}`)
      .then((r) => r.json())
      .then((data) => {
        clearTimeout(timer);
        setSetting(data.setting);
        setReservations(data.reservations || []);
        setHoliday(data.holiday || null);

        const today = toLocalDateStr(new Date());
        if (selectedDate === today && data.setting) {
          const now = new Date();
          const [closeH, closeM] = (data.setting.closeTime as string).split(":").map(Number);
          const isPastClose = now.getHours() * 60 + now.getMinutes() >= closeH * 60 + closeM;
          const isClosed = !!data.holiday;
          if (isPastClose || isClosed) {
            const next = new Date(today + "T00:00:00");
            next.setDate(next.getDate() + 1);
            if (data.setting.closedOnSunday !== false) {
              while (next.getDay() === 0) next.setDate(next.getDate() + 1);
            }
            setSelectedDate(toLocalDateStr(next));
          }
        }
      })
      .catch(() => {
        clearTimeout(timer);
        setSettingError(true);
      });

    return () => clearTimeout(timer);
  }, [selectedDate, selectedCenterId, retryCount]);

  function handleCenterSelect(id: number) {
    setSelectedCenterId(id);
  }

  function changeDate(days: number) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    const next = toLocalDateStr(d);
    const today = toLocalDateStr(new Date());
    if (next >= today) setSelectedDate(next);
  }

  function getSlotReservations(slotTime: string, endTime: string): Reservation[] {
    return reservations.filter(
      (r) => r.startTime < endTime && r.endTime > slotTime
    );
  }

  function handleSlotClick(slotTime: string) {
    if (nowMinutes !== null) {
      const [h, m] = slotTime.split(":").map(Number);
      if (h * 60 + m < nowMinutes) {
        showToast("この時間帯は受付終了です");
        return;
      }
    }
    const endTime = getEndTime(slotTime, setting!.slotDurationMinutes);
    const count = getSlotReservations(slotTime, endTime).length;
    if (count >= setting!.maxReservationsPerSlot) {
      showToast("この時間帯は満車です");
      return;
    }
    const params = new URLSearchParams({
      date: selectedDate,
      startTime: slotTime,
      endTime,
      centerId: String(selectedCenterId),
    });
    router.push(`/driver/reserve?${params.toString()}`);
  }

  // ━━ ローディング ━━
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-5"
        style={{ background: "#f2f1ed" }}>
        <style>{`@keyframes dash-spin { to { transform: rotate(360deg) } }`}</style>
        <div style={{
          width: 44, height: 44,
          border: "3px solid #E7E5DF", borderTopColor: "#1a3a6b",
          borderRadius: "50%", animation: "dash-spin 0.8s linear infinite",
        }} />
        <p style={{ fontSize: 16, color: "#5a5852", fontWeight: 700, letterSpacing: "0.04em" }}>
          読み込み中...
        </p>
      </div>
    );
  }

  const now = new Date();
  const todayStr = toLocalDateStr(now);
  const nowMinutes = selectedDate === todayStr
    ? now.getHours() * 60 + now.getMinutes()
    : null;

  // ━━ STEP 1: センター選択 ━━
  if (selectedCenterId === null) {
    return (
      <div style={{ minHeight: "100vh", background: "#f2f1ed", paddingBottom: 100 }}>
        <Header driverName={user.name} isAdmin={user.isAdmin} />
        <AppInstallBar />

        <div style={{ padding: "24px 20px 8px" }}>
          <StepIndicator steps={[
            { label: "センター", state: "active" },
            { label: "時間", state: "pending" },
            { label: "情報入力", state: "pending" },
            { label: "最終確認", state: "pending" },
          ]} />

          <div className="flex items-center gap-3" style={{ marginBottom: 20, padding: "0 2px" }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: "#1a3a6b", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 900, fontSize: 20,
            }}>1</div>
            <div>
              <div style={{ fontSize: 12, color: "#5a5852", fontWeight: 700, letterSpacing: "0.2em" }}>STEP 1</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#26251e", letterSpacing: "0.04em" }}>
                センターを選んでください
              </div>
            </div>
          </div>

          {!centersLoaded && (
            <div style={{ textAlign: "center", color: "#5a5852", fontSize: 16, marginTop: 40 }}>
              読み込み中...
            </div>
          )}

          {centersLoaded && centers.length === 0 && (
            <div style={{
              background: "#faf9f5", borderRadius: 14, padding: 32,
              textAlign: "center", border: "1px solid #E7E5DF",
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "#eef1f7", color: "#1a3a6b",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                marginBottom: 12,
              }}>
                <CenterIcon size={32} strokeWidth={1.75} />
              </div>
              <p style={{ fontSize: 18, fontWeight: 800, color: "#26251e" }}>
                利用可能なセンターがありません
              </p>
              <p style={{ fontSize: 14, color: "#5a5852", marginTop: 6 }}>
                管理者にお問い合わせください
              </p>
            </div>
          )}

          {centersLoaded && centers.length > 0 && (
            <div className="space-y-3">
              {centers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleCenterSelect(c.id)}
                  style={{
                    width: "100%", background: "#faf9f5",
                    borderRadius: 14, border: "1px solid #E7E5DF",
                    padding: "22px 20px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    textAlign: "left", cursor: "pointer",
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div style={{
                      width: 52, height: 52, borderRadius: 12,
                      background: "#eef1f7", color: "#1a3a6b",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <CenterIcon size={28} strokeWidth={1.75} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#5a5852", letterSpacing: "0.18em", fontWeight: 700 }}>
                        CENTER
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: "#26251e", letterSpacing: "0.04em", marginTop: 2 }}>
                        {c.name}
                      </div>
                    </div>
                  </div>
                  <div style={{ color: "#1a3a6b" }}>
                    <ChevronRightIcon size={24} strokeWidth={2.5} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <BottomNav isAdmin={user.isAdmin} />
      </div>
    );
  }

  const selectedCenter = centers.find((c) => c.id === selectedCenterId);

  // ━━ STEP 2: 読み込み中／エラー ━━
  if (!setting) {
    return (
      <div style={{ minHeight: "100vh", background: "#f2f1ed", paddingBottom: 100 }}>
        <Header driverName={user.name} isAdmin={user.isAdmin} />
        <AppInstallBar />
        <style>{`@keyframes dash-spin { to { transform: rotate(360deg) } }`}</style>
        <div className="flex flex-col items-center justify-center gap-4" style={{ padding: "80px 24px" }}>
          {settingError ? (
            <>
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "#fdecef", color: "#BE123C",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <AlertIcon size={36} strokeWidth={1.75} />
              </div>
              <p style={{ fontSize: 18, color: "#26251e", fontWeight: 800, textAlign: "center" }}>
                読み込みに失敗しました
              </p>
              <button
                onClick={() => { setSettingError(false); setSetting(null); setRetryCount((c) => c + 1); }}
                style={{
                  padding: "16px 36px", background: "#1a3a6b", color: "#fff",
                  borderRadius: 14, fontSize: 17, fontWeight: 800, border: "none",
                }}
              >
                もう一度試す
              </button>
              <button onClick={() => setSelectedCenterId(null)}
                style={{
                  color: "#5a5852", fontSize: 14, fontWeight: 700,
                  background: "transparent", border: "none", textDecoration: "underline",
                }}>
                センター選択に戻る
              </button>
            </>
          ) : (
            <>
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "#eef1f7", color: "#1a3a6b",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <CalendarIcon size={36} strokeWidth={1.75} />
              </div>
              <p style={{ fontSize: 18, color: "#5a5852", fontWeight: 800 }}>
                空き状況を確認中...
              </p>
              <div style={{
                width: 32, height: 32,
                border: "3px solid #E7E5DF", borderTopColor: "#1a3a6b",
                borderRadius: "50%", animation: "dash-spin 0.8s linear infinite",
              }} />
            </>
          )}
        </div>
        <BottomNav isAdmin={user.isAdmin} />
      </div>
    );
  }

  // ━━ STEP 2: 時間選択 ━━
  const slots = getTimeSlots(setting.openTime, setting.closeTime, setting.slotDurationMinutes);
  const weekday = ["日", "月", "火", "水", "木", "金", "土"][new Date(selectedDate).getDay()];

  const isSaturdayHalfDay = (() => {
    const d = new Date(selectedDate + "T00:00:00");
    return d.getDay() === 6 && Math.ceil(d.getDate() / 7) % 2 === 1 && !holiday;
  })();

  return (
    <div style={{ minHeight: "100vh", background: "#f2f1ed", paddingBottom: 100 }}>
      <Header driverName={user.name} isAdmin={user.isAdmin} />
        <AppInstallBar />

      {toast && (
        <div
          className="fixed top-4 left-1/2 z-50 flex items-center gap-2"
          style={{
            transform: "translateX(-50%)",
            background: "#26251e", color: "#fff",
            padding: "12px 20px", borderRadius: 14,
            fontSize: 15, fontWeight: 700,
            boxShadow: "0 8px 24px rgba(26,37,30,0.32)",
            whiteSpace: "nowrap",
          }}
        >
          <BlockIcon size={18} strokeWidth={2} />
          <span>{toast}</span>
        </div>
      )}

      <div className="max-w-lg mx-auto" style={{ padding: "18px 16px", display: "flex", flexDirection: "column", gap: 12 }}>

        <StepIndicator steps={[
          { label: "センター", state: "done" },
          { label: "時間", state: "active" },
          { label: "情報入力", state: "pending" },
          { label: "最終確認", state: "pending" },
        ]} />

        {/* 選択中センター */}
        <button
          onClick={() => setSelectedCenterId(null)}
          style={{
            width: "100%", background: "#1a3a6b", color: "#fff",
            borderRadius: 14, padding: "16px 18px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            border: "none", textAlign: "left", cursor: "pointer",
          }}
        >
          <div className="flex items-center gap-3">
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: "rgba(255,255,255,0.14)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <CenterIcon size={22} strokeWidth={1.75} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", letterSpacing: "0.22em", fontWeight: 700 }}>
                CENTER — タップで変更
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: "0.04em", marginTop: 2 }}>
                {selectedCenter?.name}
              </div>
            </div>
          </div>
          <PencilIcon size={22} strokeWidth={1.75} />
        </button>

        {/* 日付選択 */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#faf9f5", borderRadius: 14, border: "1px solid #E7E5DF",
        }}>
          <button
            onClick={() => changeDate(-1)}
            disabled={selectedDate <= todayStr}
            style={{
              padding: "18px 18px", color: "#1a3a6b",
              background: "transparent", border: "none",
              opacity: selectedDate <= todayStr ? 0.3 : 1,
              cursor: selectedDate <= todayStr ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center",
            }}
          >
            <ChevronLeftIcon size={24} strokeWidth={2.5} />
          </button>
          <div style={{ textAlign: "center", flex: 1 }}>
            <input
              type="date"
              value={selectedDate}
              min={todayStr}
              onChange={(e) => { if (e.target.value >= todayStr) setSelectedDate(e.target.value); }}
              style={{
                fontSize: 20, fontWeight: 800, color: "#26251e",
                textAlign: "center", border: "none", background: "transparent",
                width: "100%", padding: "4px 0",
              }}
            />
            <div style={{ fontSize: 13, color: "#5a5852", fontWeight: 700 }}>({weekday})</div>
          </div>
          <button onClick={() => changeDate(1)}
            style={{
              padding: "18px 18px", color: "#1a3a6b",
              background: "transparent", border: "none",
              display: "flex", alignItems: "center", cursor: "pointer",
            }}
          >
            <ChevronRightIcon size={24} strokeWidth={2.5} />
          </button>
        </div>

        {/* 休日バナー */}
        {holiday && (
          <div style={{
            background: "#fdecef", border: "1px solid #f5bcc7", borderRadius: 12,
            padding: "12px 16px", color: "#BE123C", fontWeight: 700, fontSize: 14,
            display: "flex", alignItems: "center", gap: 10, justifyContent: "center",
          }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#BE123C", flexShrink: 0 }} />
            <span>{holiday.name}のため予約を受け付けていません</span>
          </div>
        )}
        {isSaturdayHalfDay && (
          <div style={{
            background: "#fef6db", border: "1px solid #f4d27a", borderRadius: 12,
            padding: "12px 16px", color: "#8a4a15", fontSize: 14, fontWeight: 700,
            display: "flex", alignItems: "center", gap: 10, justifyContent: "center",
          }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#D97706", flexShrink: 0 }} />
            <span>第1・3・5土曜のため午前のみ営業（〜{setting.closeTime}）</span>
          </div>
        )}

        {/* 凡例 */}
        <div className="flex gap-4" style={{ padding: "4px 2px", fontSize: 13, color: "#5a5852" }}>
          <span className="flex items-center gap-1.5">
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#047857" }} />空きあり
          </span>
          <span className="flex items-center gap-1.5">
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#D97706" }} />残りわずか
          </span>
          <span className="flex items-center gap-1.5">
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#BE123C" }} />満車
          </span>
        </div>

        {/* 時間枠一覧 */}
        {(() => {
          const allBreaks: { start: string; end: string }[] = [];
          if (setting.hasBreak && setting.breakStart && setting.breakEnd) {
            allBreaks.push({ start: setting.breakStart, end: setting.breakEnd });
          }
          (setting.extraBreaks ?? []).forEach((b) => allBreaks.push(b));

          type SlotItem =
            | { type: "break"; start: string; end: string }
            | { type: "slot"; slot: string };

          const items: SlotItem[] = [];
          let idx = 0;
          while (idx < slots.length) {
            const slot = slots[idx];
            const endTime = getEndTime(slot, setting.slotDurationMinutes);
            const overlapping = allBreaks.filter((b) => slot < b.end && endTime > b.start);
            const isFullBreak = overlapping.some((b) => b.start <= slot && b.end >= endTime);

            if (isFullBreak) {
              let j = idx + 1;
              while (j < slots.length) {
                const ns = slots[j];
                const ne = getEndTime(ns, setting.slotDurationMinutes);
                const no = allBreaks.filter((b) => ns < b.end && ne > b.start);
                const nf = no.some((b) => b.start <= ns && b.end >= ne);
                if (!nf) break;
                j++;
              }
              items.push({ type: "break", start: slot, end: getEndTime(slots[j - 1], setting.slotDurationMinutes) });
              idx = j;
            } else {
              items.push({ type: "slot", slot });
              idx++;
            }
          }

          return (
            <div className="space-y-2">
              {items.map((item) => {
                if (item.type === "break") {
                  return (
                    <div key={`break-${item.start}`}
                      style={{
                        borderRadius: 12, padding: "14px 16px",
                        background: "#eceae4", border: "1px solid #d6d4cd",
                        display: "flex", alignItems: "center", gap: 10,
                      }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#9a978c", flexShrink: 0 }} />
                      <span style={{ fontSize: 15, fontWeight: 800, color: "#5a5852" }}>
                        {item.start} 〜 {item.end}
                      </span>
                      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, color: "#5a5852", fontSize: 13, fontWeight: 700 }}>
                        <CoffeeIcon size={16} strokeWidth={1.75} />
                        <span>休憩</span>
                      </div>
                    </div>
                  );
                }

                const { slot } = item;
                const endTime = getEndTime(slot, setting.slotDurationMinutes);
                const overlapping = allBreaks.filter((b) => slot < b.end && endTime > b.start);
                const partialBreaks = overlapping.filter((b) => !(b.start <= slot && b.end >= endTime));

                const slotReservations = getSlotReservations(slot, endTime);
                const count = slotReservations.length;
                const max = setting.maxReservationsPerSlot;
                const available = max - count;
                const isFull = available <= 0;
                const isLow = available === 1 && max > 1;
                const [slotH, slotM] = slot.split(":").map(Number);
                const isPast = nowMinutes !== null && slotH * 60 + slotM < nowMinutes;
                const isDisabled = !!holiday || isPast;

                const palette = isPast
                  ? { bg: "#eceae4", border: "#d6d4cd", dot: "#9a978c", text: "#5a5852", title: "#5a5852" }
                  : isFull
                  ? { bg: "#fdecef", border: "#f5bcc7", dot: "#BE123C", text: "#BE123C", title: "#26251e" }
                  : isLow
                  ? { bg: "#fef6db", border: "#f4d27a", dot: "#D97706", text: "#8a4a15", title: "#26251e" }
                  : { bg: "#e7f4ed", border: "#a7d6bb", dot: "#047857", text: "#047857", title: "#26251e" };

                return (
                  <div
                    key={slot}
                    onClick={() => !isDisabled && handleSlotClick(slot)}
                    style={{
                      background: isDisabled ? "#eceae4" : palette.bg,
                      border: `1px solid ${isDisabled ? "#d6d4cd" : palette.border}`,
                      borderRadius: 12, padding: "16px 18px",
                      cursor: isDisabled ? "not-allowed" : "pointer",
                      opacity: isDisabled ? 0.55 : 1,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span style={{ width: 10, height: 10, borderRadius: "50%", background: palette.dot, flexShrink: 0 }} />
                        <span style={{ fontSize: 18, fontWeight: 800, color: palette.title, letterSpacing: "0.02em" }}>
                          {slot} 〜 {endTime}
                        </span>
                      </div>
                      <div style={{
                        fontSize: 14, fontWeight: 800, color: palette.text,
                        display: "flex", alignItems: "center", gap: 4,
                      }}>
                        {isPast
                          ? "受付終了"
                          : isFull
                          ? (<><BlockIcon size={15} strokeWidth={2} /><span>満車</span></>)
                          : `空き ${available}/${max}`}
                      </div>
                    </div>

                    {partialBreaks.map((b, i) => (
                      <div key={i}
                        style={{
                          marginTop: 6, fontSize: 12, color: "#8a4a15", paddingLeft: 22,
                          display: "flex", alignItems: "center", gap: 6,
                        }}>
                        <AlertIcon size={12} strokeWidth={2} />
                        <span>{jaTime(b.start)}〜{jaTime(b.end)}は休憩</span>
                      </div>
                    ))}
                    {/* 他ドライバーの会社名・車番はプライバシー上表示しない。空き枠数のみで十分。 */}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
      <BottomNav isAdmin={user.isAdmin} />
    </div>
  );
}
