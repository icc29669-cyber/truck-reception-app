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
          50%       { transform: translateY(-10px); }
        }
        .floating { animation: float 3.2s ease-in-out infinite; }

        /* ── ボタン上のシマー（光の走り） ── */
        @keyframes shimmer {
          0%   { transform: translateX(-120%) skewX(-12deg); }
          100% { transform: translateX(220%)  skewX(-12deg); }
        }
        .shimmer-wrap { position: absolute; inset: 0; overflow: hidden; border-radius: 3vh; pointer-events: none; }
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

          {/* あいさつ：上からバウンス */}
          <div className="slide-down" style={{
            fontSize: "5vh", fontWeight: 900,
            color: "#2B4A7A",
            letterSpacing: "0.1em",
            marginBottom: "5vh",
          }}>
            いらっしゃいませ
          </div>

          {/* ボタン：ポップ登場 → ふわふわ浮遊 */}
          <div className="pop-in" style={{ width: "58vw", height: "52vh", position: "relative" }}>
            <div className="floating" style={{ width: "100%", height: "100%", position: "relative" }}>

              {/* パルスリング */}
              <div className="ring1 absolute inset-0 rounded-3xl"
                style={{ border: `3px solid ${RING}` }} />
              <div className="ring2 absolute inset-0 rounded-3xl"
                style={{ border: `2px solid ${RING}` }} />

              {/* ボタン本体 */}
              <button
                className="w-full h-full flex flex-col items-center justify-center relative"
                style={{
                  borderRadius: "3vh",
                  background: BTN,
                  border: "none",
                  boxShadow: pressed
                    ? `inset 0 6px 20px rgba(0,0,0,0.25)`
                    : `0 10px 0 ${BTN_SH}, 0 16px 48px rgba(74,127,193,0.4)`,
                  transform: pressed ? "scale(0.96)" : "scale(1)",
                  transition: "transform 0.08s cubic-bezier(.34,1.56,.64,1), box-shadow 0.08s",
                  cursor: "pointer",
                  gap: "1.8vh",
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
                  fontSize: "5.5vh", fontWeight: 900, color: "#fff",
                  letterSpacing: "0.18em",
                  lineHeight: 1.45,
                  textAlign: "center",
                  position: "relative",
                }}>
                  受付は<br/>こちらから
                </div>
                <div style={{
                  fontSize: "2vh", color: "rgba(255,255,255,0.75)",
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
