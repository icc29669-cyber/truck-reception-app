"use client";
import { useRouter } from "next/navigation";

export default function CautionPage() {
  const router = useRouter();

  return (
    <div className="w-screen h-screen overflow-hidden select-none" style={{
      display: "flex", flexDirection: "column", background: "#F5F0E8",
    }}>
      <style>{`
        @keyframes caution-pulse {
          0%, 100% { box-shadow: 0 8px 0 #0F766E, 0 12px 28px rgba(13,148,136,0.18); }
          50%      { box-shadow: 0 8px 0 #0F766E, 0 12px 36px rgba(13,148,136,0.28), 0 0 0 8px rgba(45,212,191,0.06); }
        }
        @keyframes caution-enter-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes caution-enter-scale {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* ━━ ヘッダー ━━ */}
      <div style={{
        background: "#1a3a6b", height: 72, flexShrink: 0,
        display: "flex", alignItems: "center", padding: "0 32px", gap: 24,
      }}>
        <button
          onPointerDown={() => router.push("/kiosk")}
          style={{
            height: 48, width: 130, fontSize: 20, fontWeight: 700,
            color: "#fff", background: "transparent",
            border: "2px solid rgba(255,255,255,0.5)", borderRadius: 10,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            letterSpacing: "0.04em",
          }}
        >
          ◀ 戻る
        </button>
        <div style={{ width: 1, height: 36, background: "rgba(255,255,255,0.2)" }} />
        <div style={{ fontSize: 18, color: "rgba(255,255,255,0.78)", letterSpacing: "0.24em", fontWeight: 700 }}>
          SAFETY CHECK
        </div>
      </div>

      {/* ━━ アンバー警戒帯 ━━ */}
      <div style={{ height: 5, flexShrink: 0, background: "#D97706" }} />

      {/* ━━ メインコンテンツ ━━ */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "16px 40px 20px",
        minHeight: 0,
      }}>

        {/* 見出し */}
        <div style={{
          textAlign: "center",
          animation: "caution-enter-up 0.34s ease-out 0.12s both",
          marginBottom: 4,
          display: "flex", flexDirection: "column", alignItems: "center",
        }}>
          <div style={{
            fontSize: 12, color: "#D97706",
            letterSpacing: "0.4em", fontWeight: 800, marginBottom: 10,
            padding: "4px 14px",
            background: "#FEF3C7", borderRadius: 4,
            border: "1px solid #FCD34D",
          }}>
            ご入場のお客様へ
          </div>
          <div style={{
            fontSize: 46, fontWeight: 900, color: "#0F172A",
            letterSpacing: "0.08em", lineHeight: 1.2,
          }}>
            場内では必ず<span style={{ color: "#D97706" }}>着用</span>してください
          </div>
          <div style={{
            fontSize: 12, color: "#94A3B8",
            letterSpacing: "0.32em", fontWeight: 700, marginTop: 4,
          }}>
            PLEASE WEAR PROTECTIVE GEAR BEFORE ENTERING
          </div>
        </div>

        {/* 装備イラスト */}
        <div style={{
          flex: 1,
          display: "flex", alignItems: "stretch", justifyContent: "center",
          gap: 20,
          width: "100%", maxWidth: 1600,
          minHeight: 0,
          position: "relative",
        }}>
          {/* ヘルメット */}
          <div style={{
            flex: 1,
            display: "flex", flexDirection: "column", alignItems: "center",
            animation: "caution-enter-scale 0.38s ease-out 0.24s both",
            position: "relative",
            minWidth: 0,
          }}>
            <div style={{
              flex: 1, width: "100%",
              display: "flex", alignItems: "flex-end", justifyContent: "center",
              overflow: "hidden", paddingBottom: 12,
              position: "relative",
            }}>
              {/* 背景円（ステージ） */}
              <div style={{
                position: "absolute", bottom: "10%",
                width: "70%", aspectRatio: "1",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(251,191,36,0.18) 0%, rgba(251,191,36,0.05) 50%, transparent 75%)",
                pointerEvents: "none",
              }} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/helmet.png"
                alt="ヘルメット"
                style={{
                  maxWidth: "100%", maxHeight: "100%",
                  objectFit: "contain",
                  filter: "drop-shadow(0 24px 40px rgba(26,58,107,0.22))",
                  position: "relative",
                }}
              />
            </div>
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 6, flexShrink: 0,
              paddingTop: 16, marginTop: 8,
              borderTop: "3px solid #D97706",
              minWidth: 240,
            }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: "#0F172A", letterSpacing: "0.12em", lineHeight: 1 }}>
                ヘルメット
              </div>
              <div style={{ fontSize: 12, color: "#92400E", letterSpacing: "0.3em", fontWeight: 700 }}>
                HARD HAT
              </div>
            </div>
          </div>

          {/* プラス（大きめのアンバーバッジ） */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: "caution-enter-scale 0.38s ease-out 0.3s both",
            flexShrink: 0, paddingBottom: 80,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "#FEF3C7", border: "2px solid #F59E0B",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#D97706", fontSize: 32, fontWeight: 800,
              fontFamily: "Inter, sans-serif",
              boxShadow: "0 4px 12px rgba(217,119,6,0.15)",
            }}>
              +
            </div>
          </div>

          {/* 安全靴 */}
          <div style={{
            flex: 1,
            display: "flex", flexDirection: "column", alignItems: "center",
            animation: "caution-enter-scale 0.38s ease-out 0.36s both",
            position: "relative",
            minWidth: 0,
          }}>
            <div style={{
              flex: 1, width: "100%",
              display: "flex", alignItems: "flex-end", justifyContent: "center",
              overflow: "hidden", paddingBottom: 12,
              position: "relative",
            }}>
              {/* 背景円（ステージ） */}
              <div style={{
                position: "absolute", bottom: "10%",
                width: "70%", aspectRatio: "1",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(26,58,107,0.12) 0%, rgba(26,58,107,0.03) 50%, transparent 75%)",
                pointerEvents: "none",
              }} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/safety-shoes.png"
                alt="安全靴"
                style={{
                  maxWidth: "100%", maxHeight: "100%",
                  objectFit: "contain",
                  filter: "drop-shadow(0 24px 40px rgba(26,58,107,0.22))",
                  position: "relative",
                }}
              />
            </div>
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 6, flexShrink: 0,
              paddingTop: 16, marginTop: 8,
              borderTop: "3px solid #1a3a6b",
              minWidth: 240,
            }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: "#0F172A", letterSpacing: "0.12em", lineHeight: 1 }}>
                安全靴
              </div>
              <div style={{ fontSize: 12, color: "#475569", letterSpacing: "0.3em", fontWeight: 700 }}>
                SAFETY SHOES
              </div>
            </div>
          </div>
        </div>

        {/* 確認ボタン */}
        <button
          onPointerDown={() => router.push("/kiosk/phone")}
          style={{
            width: 720, height: 96, fontSize: 32, fontWeight: 900,
            background: "linear-gradient(180deg, #2DD4BF 0%, #0D9488 100%)",
            color: "#fff", border: "none", borderRadius: 18,
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 14, letterSpacing: "0.1em",
            animation: "caution-enter-up 0.34s ease-out 0.52s both, caution-pulse 3.2s ease-in-out 1.2s infinite",
            marginTop: 28, flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.28em", opacity: 0.75, marginRight: 8 }}>OK</span>
          <span style={{ width: 1, height: 28, background: "rgba(255,255,255,0.35)" }} />
          確認しました
          <span style={{ fontSize: 26, marginLeft: 6 }}>→</span>
        </button>
      </div>
    </div>
  );
}
