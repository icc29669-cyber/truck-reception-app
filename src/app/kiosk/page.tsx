"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearKioskSession, setKioskSession } from "@/lib/kioskState";

export default function KioskTop() {
  const router  = useRouter();
  const [mounted, setMounted] = useState(false);
  const [now, setNow]         = useState(new Date());
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
  const dateStr = `${now.getMonth()+1}月${now.getDate()}日（${days[now.getDay()]}）`;
  const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  // パステル中間色
  const BG     = "#E4EDF8";          // 淡いスカイブルー
  const BTN    = pressed ? "#3A6BB0" : "#4A7FC1";   // ミディアムブルー
  const BTN_SH = "#2D5A94";          // ボタンの影色
  const RING   = "#7AAEE0";          // パルスリングの色

  return (
    <>
      <style>{`
        @keyframes pulse-ring {
          0%   { transform: scale(1);    opacity: 0.55; }
          70%  { transform: scale(1.2);  opacity: 0; }
          100% { transform: scale(1.2);  opacity: 0; }
        }
        @keyframes pulse-ring2 {
          0%   { transform: scale(1);    opacity: 0.35; }
          70%  { transform: scale(1.36); opacity: 0; }
          100% { transform: scale(1.36); opacity: 0; }
        }
        .ring1 { animation: pulse-ring  2.4s ease-out infinite; }
        .ring2 { animation: pulse-ring2 2.4s ease-out infinite 0.45s; }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up   { animation: fade-up 0.6s ease both; }
        .fade-up-d { animation: fade-up 0.6s ease 0.12s both; }
        .fade-up-dd{ animation: fade-up 0.6s ease 0.24s both; }
      `}</style>

      <div className="w-screen h-screen flex flex-col select-none overflow-hidden"
        style={{ background: BG }}>

        {/* ── ヘッダー ── */}
        <div
          className="flex items-center justify-between flex-shrink-0 px-10"
          style={{
            height: "11vh",
            background: "#fff",
            borderBottom: "1.5px solid #D0DEF0",
          }}
        >
          <div>
            <div style={{ fontSize: "1.3vh", color: "#8FAAC8", letterSpacing: "0.15em", marginBottom: "0.3vh" }}>
              日本セイフティー株式会社
            </div>
            <div style={{ fontSize: "2.8vh", fontWeight: 900, color: "#2B4A7A", letterSpacing: "0.07em" }}>
              {centerName}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "1.3vh", color: "#9BBAD4", marginBottom: "0.3vh" }}>
              {dateStr}
            </div>
            <div style={{
              fontSize: "4.5vh", fontWeight: 900, color: "#2B4A7A",
              lineHeight: 1, letterSpacing: "0.06em",
              fontVariantNumeric: "tabular-nums",
            }}>
              {timeStr}
            </div>
          </div>
        </div>

        {/* ── メイン ── */}
        <div className="flex-1 relative flex flex-col items-center justify-center overflow-hidden">

          {/* 背景の淡い光彩 */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "radial-gradient(ellipse 65% 55% at 50% 58%, rgba(100,160,230,0.18) 0%, transparent 70%)",
          }} />

          {/* あいさつ */}
          <div className="fade-up" style={{
            fontSize: "5vh", fontWeight: 900,
            color: "#2B4A7A",
            letterSpacing: "0.1em",
            marginBottom: "5vh",
          }}>
            いらっしゃいませ
          </div>

          {/* ボタン */}
          <div className="fade-up-d relative flex items-center justify-center"
            style={{ width: "58vw", height: "52vh" }}>

            {/* パルスリング */}
            <div className="ring1 absolute inset-0 rounded-3xl"
              style={{ border: `3px solid ${RING}` }} />
            <div className="ring2 absolute inset-0 rounded-3xl"
              style={{ border: `2px solid ${RING}` }} />

            {/* ボタン本体 */}
            <button
              className="w-full h-full flex flex-col items-center justify-center"
              style={{
                borderRadius: "3vh",
                background: BTN,
                border: "none",
                boxShadow: pressed
                  ? `inset 0 6px 20px rgba(0,0,0,0.25)`
                  : `0 10px 0 ${BTN_SH}, 0 14px 40px rgba(74,127,193,0.35)`,
                transform: pressed ? "translateY(8px)" : "translateY(0)",
                transition: "all 0.08s",
                cursor: "pointer",
                gap: "1.8vh",
              }}
              onPointerDown={() => { setPressed(true); start(); }}
              onPointerUp={() => setPressed(false)}
              onPointerLeave={() => setPressed(false)}
            >
              <div style={{
                fontSize: "5.5vh", fontWeight: 900, color: "#fff",
                letterSpacing: "0.18em",
                lineHeight: 1.45,
                textAlign: "center",
              }}>
                受付は<br/>こちらから
              </div>
              <div style={{
                fontSize: "2vh", color: "rgba(255,255,255,0.75)",
                letterSpacing: "0.12em",
              }}>
                タッチしてください
              </div>
            </button>
          </div>

          {/* 安全注意 */}
          <div className="fade-up-dd" style={{
            position: "absolute", bottom: "3.5vh",
            color: "#9BBAD4",
            fontSize: "1.5vh",
            letterSpacing: "0.1em",
          }}>
            ⚠️　保護帽・安全靴を着用の上ご入場ください
          </div>
        </div>
      </div>
    </>
  );
}
