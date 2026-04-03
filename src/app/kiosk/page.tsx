"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearKioskSession, setKioskSession } from "@/lib/kioskState";

export default function KioskTop() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    setMounted(true);
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const centerId = Number(process.env.NEXT_PUBLIC_CENTER_ID ?? "1") || 1;
  const centerName = process.env.NEXT_PUBLIC_CENTER_NAME || "だんじり機材センター";

  function start() {
    clearKioskSession();
    setKioskSession({ centerId, centerName });
    router.push("/kiosk/caution");
  }

  if (!mounted) return null;

  const pad = (n: number) => String(n).padStart(2, "0");
  const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
  const weekDays = ["日", "月", "火", "水", "木", "金", "土"];
  const weekStr = `（${weekDays[now.getDay()]}）`;

  return (
    <div
      className="w-screen h-screen flex flex-col select-none overflow-hidden"
      style={{ background: "#EDF4FB" }}
    >
      {/* ━━ 上部：ブルー帯（約45%） ━━ */}
      <div
        className="flex items-center justify-between px-14 flex-shrink-0"
        style={{
          background: "linear-gradient(135deg, #0d2b6b 0%, #1a4fa8 60%, #1565C0 100%)",
          height: "44vh",
        }}
      >
        {/* 左：会社名・センター名 */}
        <div className="flex flex-col justify-center gap-2">
          <p
            className="text-white font-semibold tracking-widest"
            style={{ fontSize: "clamp(18px, 2vw, 28px)", opacity: 0.75 }}
          >
            日本セイフティー株式会社
          </p>
          <h1
            className="text-white font-black leading-tight"
            style={{ fontSize: "clamp(36px, 5.5vw, 72px)", letterSpacing: "0.06em" }}
          >
            {centerName}
          </h1>
        </div>

        {/* 右：日付・時計 */}
        <div className="text-right flex-shrink-0">
          <p
            className="text-white font-medium"
            style={{ fontSize: "clamp(16px, 2vw, 26px)", opacity: 0.7, letterSpacing: "0.05em" }}
          >
            {dateStr}{weekStr}
          </p>
          <p
            className="text-white font-black tabular-nums"
            style={{ fontSize: "clamp(56px, 8vw, 108px)", lineHeight: 1, letterSpacing: "0.04em" }}
          >
            {timeStr}
          </p>
        </div>
      </div>

      {/* ━━ 下部：受付エリア（約56%） ━━ */}
      <div
        className="flex-1 flex flex-col items-center justify-center gap-8"
        style={{ background: "#EDF4FB" }}
      >
        <p
          className="font-black text-center"
          style={{ fontSize: "clamp(28px, 4vw, 54px)", color: "#1a3a6b", letterSpacing: "0.06em" }}
        >
          ご来場ありがとうございます
        </p>

        <p
          className="font-bold text-center"
          style={{ fontSize: "clamp(18px, 2.4vw, 32px)", color: "#4a6fa5" }}
        >
          下のボタンを押して受付を開始してください
        </p>

        {/* 受付ボタン */}
        <button
          onPointerDown={start}
          className="flex items-center justify-center font-black text-white rounded-3xl
                     tracking-widest select-none touch-none transition-all duration-75
                     active:translate-y-[6px]"
          style={{
            width: "clamp(320px, 45vw, 640px)",
            height: "clamp(100px, 13vh, 160px)",
            fontSize: "clamp(28px, 4.5vw, 60px)",
            background: "linear-gradient(180deg, #43A047 0%, #2E7D32 100%)",
            boxShadow: "0 8px 0 #1B5E20, 0 12px 32px rgba(46,125,50,0.35)",
            border: "3px solid #66BB6A",
            letterSpacing: "0.18em",
          }}
        >
          受　付　す　る
        </button>

        <p
          className="font-semibold text-center"
          style={{ fontSize: "clamp(14px, 1.8vw, 22px)", color: "#7a9abf" }}
        >
          ※ 保護帽・安全靴を着用の上ご入場ください
        </p>
      </div>
    </div>
  );
}
