"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearKioskSession, setKioskSession } from "@/lib/kioskState";

export default function KioskTop() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [now, setNow]   = useState(new Date());
  const [pressed, setPressed] = useState(false);

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
  const days = ["日","月","火","水","木","金","土"];
  const dateStr = `${now.getMonth()+1}/${now.getDate()}（${days[now.getDay()]}）`;
  const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  return (
    <div className="w-screen h-screen flex flex-col select-none overflow-hidden">

      {/* ── 上部バー（情報だけ、最小限） ── */}
      <div
        className="flex items-center justify-between flex-shrink-0 px-8"
        style={{ background: "#1a3a6b", height: "11vh" }}
      >
        <div style={{ color: "#fff", fontWeight: 800, fontSize: "2.8vh", letterSpacing: "0.06em" }}>
          {centerName}
        </div>
        <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "2.4vh", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
          {dateStr}　{timeStr}
        </div>
      </div>

      {/* ── ボタン＝残り全画面 ── */}
      <button
        className="flex-1 flex flex-col items-center justify-center w-full"
        style={{
          background: pressed ? "#163060" : "#1a3a6b",
          border: "none",
          cursor: "pointer",
          transform: pressed ? "scale(0.995)" : "scale(1)",
          transition: "background 0.08s, transform 0.08s",
        }}
        onPointerDown={() => { setPressed(true); start(); }}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
      >
        {/* メインメッセージ */}
        <div style={{
          color: "#fff",
          fontSize: "5.5vh",
          fontWeight: 900,
          letterSpacing: "0.08em",
          lineHeight: 1.3,
          textAlign: "center",
          marginBottom: "4vh",
        }}>
          おつかれさまです
        </div>

        {/* タッチ誘導 */}
        <div style={{
          background: "rgba(255,255,255,0.12)",
          border: "3px solid rgba(255,255,255,0.35)",
          borderRadius: "2vh",
          padding: "3vh 10vw",
          textAlign: "center",
        }}>
          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: "2vh", letterSpacing: "0.12em", marginBottom: "1.5vh" }}>
            受付がお済みでない方
          </div>
          <div style={{ color: "#fff", fontSize: "4.5vh", fontWeight: 900, letterSpacing: "0.2em" }}>
            画面をタッチ
          </div>
        </div>

        {/* 安全注意（最下部、控えめに） */}
        <div style={{
          position: "absolute",
          bottom: "3vh",
          color: "rgba(255,255,255,0.35)",
          fontSize: "1.6vh",
          letterSpacing: "0.08em",
        }}>
          ⚠️　保護帽・安全靴を着用の上ご入場ください
        </div>
      </button>
    </div>
  );
}
