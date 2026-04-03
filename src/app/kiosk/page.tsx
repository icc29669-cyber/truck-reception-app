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
  const centerName =
    process.env.NEXT_PUBLIC_CENTER_NAME || "だんじり機材センター";

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
      style={{ background: "linear-gradient(160deg, #E8F4FD 0%, #D0E8FA 50%, #B8D8F6 100%)" }}
    >
      {/* 上部ヘッダー */}
      <div
        className="flex items-center justify-between px-16 py-6"
        style={{ background: "linear-gradient(90deg, #1a3a6b 0%, #1E5799 100%)" }}
      >
        <div>
          <p className="text-white text-3xl font-bold opacity-90 tracking-widest">
            日本セイフティー株式会社
          </p>
          <h1 className="text-white font-black tracking-[0.12em] mt-1" style={{ fontSize: 52 }}>
            {centerName}
          </h1>
        </div>
        {/* 時計 */}
        <div className="text-right">
          <p className="text-white font-bold opacity-80" style={{ fontSize: 28 }}>
            {dateStr}{weekStr}
          </p>
          <p className="text-white font-black tabular-nums" style={{ fontSize: 80, lineHeight: 1 }}>
            {timeStr}
          </p>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col items-center justify-center gap-12">
        {/* 案内テキスト */}
        <div className="text-center">
          <p
            className="font-black text-[#1a3a6b] tracking-[0.08em]"
            style={{ fontSize: 56 }}
          >
            ご来場ありがとうございます
          </p>
          <p className="font-bold text-gray-600 mt-4" style={{ fontSize: 36 }}>
            受付はこちらのボタンを押してください
          </p>
        </div>

        {/* トラックアイコン */}
        <div style={{ fontSize: 100 }}>🚛</div>

        {/* 受付するボタン */}
        <button
          onPointerDown={start}
          className="bg-[#2E7D32] text-white font-black rounded-3xl
                     shadow-[0_14px_0_#1B5E20] active:shadow-[0_3px_0_#1B5E20]
                     active:translate-y-[11px] transition-all duration-75 tracking-widest
                     flex items-center justify-center border-4 border-[#4CAF50]"
          style={{ width: 700, height: 220, fontSize: 68 }}
        >
          受　付　す　る
        </button>

        {/* 注意書き */}
        <p className="text-gray-500 font-bold" style={{ fontSize: 28 }}>
          ※ 保護帽・安全靴を着用の上ご入場ください
        </p>
      </div>
    </div>
  );
}
