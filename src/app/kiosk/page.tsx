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

  // ティール繊細カラー
  const BG     = "#E6F4F3";
  const BTN    = pressed
    ? "linear-gradient(135deg,#3ABAB4 0%,#1FA09A 100%)"
    : "linear-gradient(135deg,#50C9C3 0%,#2BB5AF 55%,#1EA8A3 100%)";
  const BTN_SH = "#178A87";
  const RING   = "#6DCFCA";
  const TEXT   = "#1A6B6A";

  return (
    <>
      <style>{`
        /* ── パルスリング ── */
        @keyframes pulse-ring {
          0%   { transform: scale(1);    opacity: 0.6; }
          60%  { transform: scale(1.22); opacity: 0; }
          100% { transform: scale(1.22); opacity: 0; }
        }
        @keyframes pulse-ring2 {
          0%   { transform: scale(1);    opacity: 0.35; }
          60%  { transform: scale(1.4);  opacity: 0; }
          100% { transform: scale(1.4);  opacity: 0; }
        }
        .ring1 { animation: pulse-ring  1.8s ease-out infinite; }
        .ring2 { animation: pulse-ring2 1.8s ease-out infinite 0.35s; }

        /* ── ポップ登場（バウンス） ── */
        @keyframes pop-in {
          0%   { opacity: 0; transform: scale(0.6); }
          65%  { opacity: 1; transform: scale(1.08); }
          80%  { transform: scale(0.96); }
          100% { transform: scale(1); }
        }
        @keyframes slide-down {
          0%   { opacity: 0; transform: translateY(-20px); }
          60%  { transform: translateY(5px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .pop-in    { animation: pop-in    0.55s cubic-bezier(.34,1.56,.64,1) 0.1s both; }
        .slide-down{ animation: slide-down 0.45s cubic-bezier(.34,1.56,.64,1) both; }

        /* ── ボタンのふわふわ浮遊 ── */
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-12px); }
        }
        .floating { animation: float 3.2s ease-in-out infinite; }

        /* ── ボタン上のシマー（光の走り） ── */
        @keyframes shimmer {
          0%   { transform: translateX(-120%) skewX(-12deg); }
          100% { transform: translateX(220%)  skewX(-12deg); }
        }
        .shimmer-wrap { position: absolute; inset: 0; overflow: hidden; border-radius: 32px; pointer-events: none; }
        .shimmer-line {
          position: absolute; top: 0; bottom: 0; width: 40%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
          animation: shimmer 3s ease-in-out infinite 1.2s;
        }

        /* ── 注意テキストのフェード ── */
        @keyframes fade-in {
          from { opacity: 0; } to { opacity: 1; }
        }
        .fade-late { animation: fade-in 0.6s ease 0.5s both; }
      `}</style>

      <div className="w-screen h-screen overflow-hidden" style={{
        display: "flex", flexDirection: "column",
        userSelect: "none",
        background: BG,
      }}>

        {/* ── ヘッダー ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0, padding: "0 48px",
          height: 110,
          background: "#fff",
          borderBottom: "2px solid #C8E8E6",
        }}>
          <div>
            <div style={{ fontSize: 16, color: "#8ABFBB", letterSpacing: "0.15em", marginBottom: 4 }}>
              日本セイフティー株式会社
            </div>
            <div style={{ fontSize: 34, fontWeight: 700, color: TEXT, letterSpacing: "0.07em" }}>
              {centerName}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 16, color: "#8ABFBB", marginBottom: 4 }}>
              {dateStr}
            </div>
            <div style={{
              fontSize: 52, fontWeight: 700, color: TEXT,
              lineHeight: 1, letterSpacing: "0.06em",
              fontVariantNumeric: "tabular-nums",
            }}>
              {timeStr}
            </div>
          </div>
        </div>

        {/* ── メイン ── */}
        <div style={{
          flex: 1, position: "relative",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          overflow: "hidden",
        }}>

          {/* 背景の淡い光彩 */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "radial-gradient(ellipse 65% 55% at 50% 58%, rgba(80,200,195,0.15) 0%, transparent 70%)",
          }} />

          {/* あいさつ */}
          <div className="slide-down" style={{
            fontSize: 60, fontWeight: 700,
            color: TEXT,
            letterSpacing: "0.1em",
            marginBottom: 48,
          }}>
            いらっしゃいませ
          </div>

          {/* ボタン：ポップ登場 → ふわふわ浮遊 */}
          <div className="pop-in" style={{ width: 900, height: 480, position: "relative" }}>
            <div className="floating" style={{ width: "100%", height: "100%", position: "relative" }}>

              {/* パルスリング */}
              <div className="ring1" style={{
                position: "absolute", inset: 0, borderRadius: 32,
                border: `3px solid ${RING}`,
              }} />
              <div className="ring2" style={{
                position: "absolute", inset: 0, borderRadius: 32,
                border: `2px solid ${RING}`,
              }} />

              {/* ボタン本体 */}
              <button
                style={{
                  width: "100%", height: "100%",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  position: "relative",
                  borderRadius: 32,
                  background: BTN,
                  border: "none",
                  boxShadow: pressed
                    ? "inset 0 6px 20px rgba(0,0,0,0.2)"
                    : `0 8px 0 ${BTN_SH}, 0 14px 48px rgba(43,181,175,0.38)`,
                  transform: pressed ? "scale(0.96)" : "scale(1)",
                  transition: "transform 0.08s cubic-bezier(.34,1.56,.64,1), box-shadow 0.08s",
                  cursor: "pointer",
                  gap: 16,
                  overflow: "hidden",
                }}
                onPointerDown={() => { setPressed(true); start(); }}
                onPointerUp={() => setPressed(false)}
                onPointerLeave={() => setPressed(false)}
              >
                {/* シマー */}
                <div className="shimmer-wrap">
                  <div className="shimmer-line" />
                </div>

                <div style={{
                  fontSize: 72, fontWeight: 900, color: "#fff",
                  letterSpacing: "0.18em",
                  lineHeight: 1.45,
                  textAlign: "center",
                  position: "relative",
                }}>
                  受付は<br/>こちらから
                </div>
                <div style={{
                  fontSize: 26, color: "rgba(255,255,255,0.75)",
                  letterSpacing: "0.12em",
                  position: "relative",
                }}>
                  タッチしてください
                </div>
              </button>
            </div>
          </div>

          {/* 安全注意 */}
          <div className="fade-late" style={{
            position: "absolute", bottom: 36,
            color: "#8ABFBB",
            fontSize: 20,
            letterSpacing: "0.1em",
          }}>
            ⚠️　保護帽・安全靴を着用の上ご入場ください
          </div>
        </div>
      </div>
    </>
  );
}
