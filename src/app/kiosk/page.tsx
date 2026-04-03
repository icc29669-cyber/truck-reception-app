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

  const centerId   = Number(process.env.NEXT_PUBLIC_CENTER_ID ?? "1") || 1;
  const centerName = process.env.NEXT_PUBLIC_CENTER_NAME || "だんじり機材センター";

  function start() {
    clearKioskSession();
    setKioskSession({ centerId, centerName });
    router.push("/kiosk/caution");
  }

  if (!mounted) return null;

  const pad  = (n: number) => String(n).padStart(2, "0");
  const hh   = pad(now.getHours());
  const mm   = pad(now.getMinutes());
  const days = ["日","月","火","水","木","金","土"];
  const dateStr = `${now.getMonth()+1}月${now.getDate()}日（${days[now.getDay()]}）`;

  return (
    <div
      className="w-screen h-screen flex flex-col select-none overflow-hidden"
      style={{ background: "#F0F4F8" }}
    >

      {/* ── ヘッダー ── */}
      <div
        className="flex items-center justify-between flex-shrink-0 px-10"
        style={{
          background: "#1a3a6b",
          height: "14vh",
        }}
      >
        {/* 左：センター名 */}
        <div>
          <div style={{ fontSize: "1.5vh", color: "rgba(255,255,255,0.55)", letterSpacing: "0.12em", marginBottom: "0.4vh" }}>
            日本セイフティー株式会社
          </div>
          <div style={{ fontSize: "3.6vh", fontWeight: 900, color: "#fff", letterSpacing: "0.06em" }}>
            {centerName}
          </div>
        </div>

        {/* 右：時計 */}
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "1.4vh", color: "rgba(255,255,255,0.5)", marginBottom: "0.3vh" }}>
            {dateStr}
          </div>
          <div style={{ fontSize: "5.5vh", fontWeight: 900, color: "#fff", lineHeight: 1, letterSpacing: "0.05em", fontVariantNumeric: "tabular-nums" }}>
            {hh}<span style={{ opacity: 0.6 }}>:</span>{mm}
          </div>
        </div>
      </div>

      {/* ── メイン ── */}
      <div
        className="flex-1 flex flex-col items-center justify-around px-8"
        style={{ paddingTop: "3vh", paddingBottom: "3vh" }}
      >

        {/* あいさつ */}
        <div className="text-center">
          <div style={{ fontSize: "3.8vh", fontWeight: 900, color: "#1a3a6b", letterSpacing: "0.06em", lineHeight: 1.4 }}>
            おつかれさまです！
          </div>
          <div style={{ fontSize: "2.2vh", color: "#5a7a9a", marginTop: "1.2vh", fontWeight: 600 }}>
            受付をされていない方は、下のボタンをタッチしてください
          </div>
        </div>

        {/* ── 受付ボタン ── */}
        <button
          onPointerDown={start}
          className="flex flex-col items-center justify-center select-none touch-none"
          style={{
            width: "62vw",
            height: "28vh",
            background: "linear-gradient(170deg, #2563EB 0%, #1a3a6b 100%)",
            borderRadius: "2.4vh",
            boxShadow: "0 1vh 0 #0f2347, 0 1.5vh 4vh rgba(26,58,107,0.35)",
            border: "none",
            cursor: "pointer",
            transition: "transform 0.07s, box-shadow 0.07s",
          }}
          onPointerDown={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0.8vh)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0.2vh 0 #0f2347";
            start();
          }}
          onPointerUp={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 1vh 0 #0f2347, 0 1.5vh 4vh rgba(26,58,107,0.35)";
          }}
        >
          <div style={{ fontSize: "8vh", marginBottom: "0.5vh" }}>🚛</div>
          <div style={{ fontSize: "3.8vh", fontWeight: 900, color: "#fff", letterSpacing: "0.2em" }}>
            受　付　開　始
          </div>
          <div style={{ fontSize: "1.6vh", color: "rgba(255,255,255,0.6)", marginTop: "0.8vh", letterSpacing: "0.06em" }}>
            ここをタッチ
          </div>
        </button>

        {/* 注意書き */}
        <div
          className="flex items-center gap-3"
          style={{
            background: "#fff",
            border: "2px solid #dce6f0",
            borderRadius: "1.2vh",
            padding: "1.4vh 3vh",
          }}
        >
          <span style={{ fontSize: "2.6vh" }}>⚠️</span>
          <span style={{ fontSize: "1.8vh", fontWeight: 700, color: "#5a7a9a" }}>
            入場前に保護帽・安全靴の着用をご確認ください
          </span>
        </div>

      </div>
    </div>
  );
}
