"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function CautionPage() {
  const router = useRouter();

  return (
    <div className="w-screen h-screen overflow-hidden select-none" style={{
      display: "flex", flexDirection: "column", background: "#F5F0E8",
    }}>
      {/* ━━ キーフレーム ━━ */}
      <style>{`
        @keyframes caution-pulse {
          0%, 100% {
            box-shadow: 0 8px 0 #0F766E, 0 12px 28px rgba(13,148,136,0.18);
          }
          50% {
            box-shadow: 0 8px 0 #0F766E, 0 12px 36px rgba(13,148,136,0.28), 0 0 0 8px rgba(45,212,191,0.06);
          }
        }
        @keyframes caution-enter-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes caution-enter-scale {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* ━━ ヘッダー（96px） ━━ */}
      <div style={{
        background: "#1a3a6b", height: 96, flexShrink: 0,
        display: "flex", alignItems: "center", padding: "0 32px", gap: 24,
      }}>
        <button
          onPointerDown={() => router.push("/kiosk")}
          style={{
            height: 64, width: 160, fontSize: 26, fontWeight: 700,
            color: "#fff", background: "transparent",
            border: "2px solid rgba(255,255,255,0.5)", borderRadius: 14,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            letterSpacing: "0.04em",
          }}
        >
          ◀ 戻る
        </button>
        <div style={{ width: 1, height: 48, background: "rgba(255,255,255,0.2)" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{
            fontSize: 22, color: "rgba(255,255,255,0.78)",
            letterSpacing: "0.2em", fontWeight: 700,
          }}>
            SAFETY CHECK
          </div>
          <div style={{
            fontSize: 14, color: "rgba(255,255,255,0.5)",
            letterSpacing: "0.24em", fontWeight: 600,
          }}>
            安全確認
          </div>
        </div>
      </div>

      {/* ━━ アンバー警戒帯（8px） ━━ */}
      <div style={{
        height: 8, flexShrink: 0, background: "#D97706",
      }} />

      {/* ━━ メインコンテンツ ━━ */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "32px 80px 36px",
      }}>

        {/* 見出し */}
        <div style={{
          textAlign: "center",
          animation: "caution-enter-up 0.34s ease-out 0.12s both",
          marginBottom: 36,
        }}>
          <div style={{
            fontSize: 56, fontWeight: 900, color: "#0F172A",
            letterSpacing: "0.06em", lineHeight: 1.15,
          }}>
            場内では必ず着用してください
          </div>
          <div style={{
            fontSize: 16, color: "#94A3B8",
            letterSpacing: "0.28em", fontWeight: 600, marginTop: 12,
          }}>
            PLEASE WEAR PROTECTIVE GEAR
          </div>
        </div>

        {/* 装備カード */}
        <div style={{
          display: "flex", alignItems: "center", gap: 36,
          marginBottom: 32,
        }}>
          {/* ヘルメットカード */}
          <div style={{
            width: 420, height: 480,
            background: "#FFFFFF", borderRadius: 28,
            boxShadow: "0 12px 36px rgba(26,58,107,0.08), 0 2px 6px rgba(26,58,107,0.04)",
            display: "flex", flexDirection: "column",
            padding: "28px 28px 0",
            animation: "caution-enter-scale 0.38s ease-out 0.24s both",
          }}>
            <div style={{
              flex: 1, position: "relative",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{
                position: "relative", width: "100%", height: "100%",
              }}>
                <Image
                  src="/images/helmet.png"
                  alt="ヘルメット"
                  fill
                  style={{ objectFit: "contain" }}
                  priority
                />
              </div>
            </div>
            <div style={{
              paddingTop: 16, paddingBottom: 20,
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 6,
            }}>
              <div style={{
                width: 80, height: 5, background: "#D97706", borderRadius: 3,
                marginBottom: 6,
              }} />
              <div style={{
                fontSize: 34, fontWeight: 900, color: "#0F172A",
                letterSpacing: "0.08em", lineHeight: 1,
              }}>
                ヘルメット
              </div>
              <div style={{
                fontSize: 13, color: "#92400E",
                letterSpacing: "0.24em", fontWeight: 700,
              }}>
                HARD HAT
              </div>
            </div>
          </div>

          {/* プラス記号 */}
          <div style={{
            fontSize: 72, color: "#D97706", fontWeight: 300,
            fontFamily: "Inter, sans-serif",
            animation: "caution-enter-scale 0.38s ease-out 0.3s both",
          }}>
            +
          </div>

          {/* 安全靴カード */}
          <div style={{
            width: 420, height: 480,
            background: "#FFFFFF", borderRadius: 28,
            boxShadow: "0 12px 36px rgba(26,58,107,0.08), 0 2px 6px rgba(26,58,107,0.04)",
            display: "flex", flexDirection: "column",
            padding: "28px 28px 0",
            animation: "caution-enter-scale 0.38s ease-out 0.36s both",
          }}>
            <div style={{
              flex: 1, position: "relative",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{
                position: "relative", width: "100%", height: "100%",
              }}>
                <Image
                  src="/images/safety-shoes.png"
                  alt="安全靴"
                  fill
                  style={{ objectFit: "contain" }}
                  priority
                />
              </div>
            </div>
            <div style={{
              paddingTop: 16, paddingBottom: 20,
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 6,
            }}>
              <div style={{
                width: 80, height: 5, background: "#1a3a6b", borderRadius: 3,
                marginBottom: 6,
              }} />
              <div style={{
                fontSize: 34, fontWeight: 900, color: "#0F172A",
                letterSpacing: "0.08em", lineHeight: 1,
              }}>
                安全靴
              </div>
              <div style={{
                fontSize: 13, color: "#475569",
                letterSpacing: "0.24em", fontWeight: 700,
              }}>
                SAFETY SHOES
              </div>
            </div>
          </div>
        </div>

        {/* 確認ボタン */}
        <button
          onPointerDown={() => router.push("/kiosk/phone")}
          style={{
            width: 820, height: 118, fontSize: 38, fontWeight: 900,
            background: "linear-gradient(180deg, #2DD4BF 0%, #0D9488 100%)",
            color: "#fff", border: "none", borderRadius: 18,
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 16, letterSpacing: "0.1em",
            animation: "caution-enter-up 0.34s ease-out 0.52s both, caution-pulse 3.2s ease-in-out 1.2s infinite",
          }}
        >
          確認しました
          <span style={{ fontSize: 32, marginLeft: 4 }}>→</span>
        </button>
      </div>
    </div>
  );
}
