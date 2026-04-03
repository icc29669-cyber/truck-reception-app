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

  return (
    <>
      <style>{`
        @keyframes pulse-ring {
          0%   { transform: scale(1);    opacity: 0.5; }
          70%  { transform: scale(1.18); opacity: 0;   }
          100% { transform: scale(1.18); opacity: 0;   }
        }
        @keyframes pulse-ring2 {
          0%   { transform: scale(1);    opacity: 0.3; }
          70%  { transform: scale(1.32); opacity: 0;   }
          100% { transform: scale(1.32); opacity: 0;   }
        }
        .ring1 { animation: pulse-ring  2.4s ease-out infinite; }
        .ring2 { animation: pulse-ring2 2.4s ease-out infinite 0.4s; }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fade-up 0.7s ease both; }
        .fade-up-d { animation: fade-up 0.7s ease 0.15s both; }
        .fade-up-dd { animation: fade-up 0.7s ease 0.3s both; }
      `}</style>

      <div className="w-screen h-screen flex flex-col select-none overflow-hidden">

        {/* ── ヘッダー ── */}
        <div
          className="flex items-center justify-between flex-shrink-0 px-10"
          style={{
            height: "11vh",
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            position: "relative",
            zIndex: 10,
            // ヘッダーは背景の上に重なるため背景色が必要
            backgroundColor: "#0d2347",
          }}
        >
          <div>
            <div style={{ fontSize: "1.3vh", color: "rgba(255,255,255,0.45)", letterSpacing: "0.15em", marginBottom: "0.3vh" }}>
              日本セイフティー株式会社
            </div>
            <div style={{ fontSize: "2.8vh", fontWeight: 900, color: "#fff", letterSpacing: "0.07em" }}>
              {centerName}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "1.3vh", color: "rgba(255,255,255,0.4)", marginBottom: "0.3vh" }}>
              {dateStr}
            </div>
            <div style={{
              fontSize: "4.5vh", fontWeight: 900, color: "#fff",
              lineHeight: 1, letterSpacing: "0.06em",
              fontVariantNumeric: "tabular-nums",
            }}>
              {timeStr}
            </div>
          </div>
        </div>

        {/* ── メイン（＝ボタン全体） ── */}
        <button
          className="flex-1 relative w-full flex flex-col items-center justify-center"
          style={{
            border: "none",
            cursor: "pointer",
            outline: "none",
            overflow: "hidden",
            // 美しいグラデーション
            background: pressed
              ? "linear-gradient(160deg, #091d3e 0%, #0d2a55 50%, #102f60 100%)"
              : "linear-gradient(160deg, #0d2347 0%, #143566 50%, #1a4080 100%)",
            transition: "background 0.1s",
          }}
          onPointerDown={() => { setPressed(true); start(); }}
          onPointerUp={() => setPressed(false)}
          onPointerLeave={() => setPressed(false)}
        >
          {/* 背景の光彩 */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "radial-gradient(ellipse 70% 60% at 50% 55%, rgba(60,120,220,0.22) 0%, transparent 70%)",
          }} />

          {/* あいさつ */}
          <div className="fade-up" style={{
            color: "#fff",
            fontSize: "5vh",
            fontWeight: 900,
            letterSpacing: "0.1em",
            marginBottom: "6vh",
            textShadow: "0 2px 20px rgba(0,0,0,0.3)",
          }}>
            おつかれさまです
          </div>

          {/* タッチターゲット（パルスリング付き） */}
          <div className="fade-up-d relative flex items-center justify-center" style={{ width: "38vw", height: "38vw", maxWidth: 420, maxHeight: 420 }}>

            {/* パルスリング */}
            <div className="ring1 absolute inset-0 rounded-full" style={{ border: "2px solid rgba(255,255,255,0.4)" }} />
            <div className="ring2 absolute inset-0 rounded-full" style={{ border: "1px solid rgba(255,255,255,0.25)" }} />

            {/* 円形ボタン本体 */}
            <div style={{
              width: "75%", height: "75%",
              borderRadius: "50%",
              background: pressed
                ? "rgba(255,255,255,0.14)"
                : "rgba(255,255,255,0.1)",
              border: "2px solid rgba(255,255,255,0.3)",
              boxShadow: pressed
                ? "inset 0 4px 24px rgba(0,0,0,0.3)"
                : "0 0 60px rgba(100,160,255,0.15), inset 0 1px 0 rgba(255,255,255,0.15)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "1.2vh",
              transition: "all 0.1s",
              transform: pressed ? "scale(0.96)" : "scale(1)",
            }}>
              <div style={{ fontSize: "3vh", color: "rgba(255,255,255,0.5)", letterSpacing: "0.18em" }}>
                受付がお済みでない方
              </div>
              <div style={{
                fontSize: "4.5vh", fontWeight: 900, color: "#fff",
                letterSpacing: "0.2em",
                textShadow: "0 0 30px rgba(150,200,255,0.6)",
              }}>
                タッチ
              </div>
            </div>
          </div>

          {/* 安全注意 */}
          <div className="fade-up-dd" style={{
            position: "absolute",
            bottom: "3.5vh",
            color: "rgba(255,255,255,0.28)",
            fontSize: "1.5vh",
            letterSpacing: "0.1em",
          }}>
            ⚠️　保護帽・安全靴を着用の上ご入場ください
          </div>
        </button>
      </div>
    </>
  );
}
