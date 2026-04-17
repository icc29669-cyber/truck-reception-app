"use client";
import { useRouter } from "next/navigation";

export default function CautionPage() {
  const router = useRouter();

  return (
    <div className="w-screen h-screen overflow-hidden select-none" style={{
      display: "flex", flexDirection: "column", background: "#f2f1ed",
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

        {/* 右端：ステップインジケータ */}
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: "0.2em", fontWeight: 700, marginRight: 4 }}>
            STEP
          </span>
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} style={{
              width: s === 1 ? 24 : 8, height: 8, borderRadius: 4,
              background: s === 1 ? "#FACC15" : "rgba(255,255,255,0.22)",
              transition: "all 0.2s ease",
            }} />
          ))}
          <span style={{
            fontSize: 13, color: "rgba(255,255,255,0.8)",
            fontWeight: 800, marginLeft: 10, letterSpacing: "0.04em",
          }}>
            1 <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>/ 5</span>
          </span>
        </div>
      </div>

      {/* ━━ アンバー警戒帯 ━━ */}
      <div style={{ height: 5, flexShrink: 0, background: "#D97706" }} />

      {/* ━━ メインコンテンツ ━━ */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "24px 40px 24px",
        minHeight: 0, gap: 8,
      }}>

        {/* 見出し */}
        <div style={{
          textAlign: "center",
          animation: "caution-enter-up 0.34s ease-out 0.12s both",
          marginBottom: 4,
          display: "flex", flexDirection: "column", alignItems: "center",
        }}>
          <div style={{
            fontSize: 14, color: "#D97706",
            letterSpacing: "0.32em", fontWeight: 800, marginBottom: 10,
            padding: "5px 16px",
            background: "#FEF3C7", borderRadius: 4,
            border: "1px solid #FCD34D",
          }}>
            入場前の確認
          </div>
          <div style={{
            fontSize: 42, fontWeight: 900, color: "#26251e",
            letterSpacing: "0.06em", lineHeight: 1.25,
          }}>
            <span style={{ color: "#D97706" }}>ヘルメット</span>と<span style={{ color: "#26251e" }}>安全靴</span>を必ず<span style={{
              borderBottom: "4px solid #FCD34D", paddingBottom: 2,
            }}>着用</span>してください
          </div>
          <div style={{
            fontSize: 15, color: "#64748B",
            letterSpacing: "0.18em", fontWeight: 700, marginTop: 8,
          }}>
            PLEASE WEAR HARD HAT & SAFETY SHOES BEFORE ENTERING
          </div>
        </div>

        {/* 装備イラスト（大きめ配置） */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 48, marginTop: 8,
          width: "100%",
        }}>
          {/* ヘルメット */}
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            animation: "caution-enter-scale 0.38s ease-out 0.24s both",
            position: "relative",
          }}>
            <div style={{
              width: 540, height: 440, position: "relative",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {/* 背景円 */}
              <div style={{
                position: "absolute", inset: 0,
                background: "radial-gradient(circle, rgba(251,191,36,0.20) 0%, rgba(251,191,36,0.06) 50%, transparent 75%)",
                pointerEvents: "none",
              }} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/helmet.png"
                alt="ヘルメット"
                style={{
                  maxWidth: "95%", maxHeight: "95%",
                  objectFit: "contain",
                  filter: "drop-shadow(0 24px 40px rgba(26,58,107,0.25))",
                  position: "relative",
                }}
              />
            </div>
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 4, paddingTop: 16, marginTop: 8,
              borderTop: "4px solid #D97706",
              minWidth: 280,
            }}>
              <div style={{ fontSize: 38, fontWeight: 900, color: "#26251e", letterSpacing: "0.12em", lineHeight: 1 }}>
                ヘルメット
              </div>
              <div style={{ fontSize: 15, color: "#92400E", letterSpacing: "0.18em", fontWeight: 700 }}>
                HARD HAT
              </div>
            </div>
          </div>

          {/* プラス（イラスト中央と水平揃え） */}
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            animation: "caution-enter-scale 0.38s ease-out 0.3s both",
            flexShrink: 0,
            paddingTop: 0, paddingBottom: 90, // ラベル分を考慮してイラスト中央に合わせる
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "#FFFBEB", border: "2.5px solid #FCD34D",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#D97706", fontSize: 38, fontWeight: 700,
              fontFamily: "Inter, sans-serif",
              boxShadow: "0 4px 12px rgba(217,119,6,0.14)",
            }}>
              +
            </div>
          </div>

          {/* 安全靴 */}
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            animation: "caution-enter-scale 0.38s ease-out 0.36s both",
            position: "relative",
          }}>
            <div style={{
              width: 540, height: 440, position: "relative",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {/* 背景円 */}
              <div style={{
                position: "absolute", inset: 0,
                background: "radial-gradient(circle, rgba(26,58,107,0.14) 0%, rgba(26,58,107,0.04) 50%, transparent 75%)",
                pointerEvents: "none",
              }} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/safety-shoes.png"
                alt="安全靴"
                style={{
                  maxWidth: "95%", maxHeight: "95%",
                  objectFit: "contain",
                  filter: "drop-shadow(0 24px 40px rgba(26,58,107,0.25))",
                  position: "relative",
                }}
              />
            </div>
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 4, paddingTop: 16, marginTop: 8,
              borderTop: "4px solid #1a3a6b",
              minWidth: 280,
            }}>
              <div style={{ fontSize: 38, fontWeight: 900, color: "#26251e", letterSpacing: "0.12em", lineHeight: 1 }}>
                安全靴
              </div>
              <div style={{ fontSize: 15, color: "#475569", letterSpacing: "0.18em", fontWeight: 700 }}>
                SAFETY SHOES
              </div>
            </div>
          </div>
        </div>

        {/* 確認ボタン */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          gap: 6, flexShrink: 0,
          animation: "caution-enter-up 0.34s ease-out 0.52s both",
        }}>
          <button
            onPointerDown={() => router.push("/kiosk/phone")}
            style={{
              width: 720, height: 96, fontSize: 32, fontWeight: 900,
              background: "linear-gradient(180deg, #2DD4BF 0%, #0D9488 100%)",
              color: "#fff", border: "none", borderRadius: 18,
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 14, letterSpacing: "0.1em",
              animation: "caution-pulse 3.2s ease-in-out 1.2s infinite",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.28em", opacity: 0.75, marginRight: 8 }}>OK</span>
            <span style={{ width: 1, height: 28, background: "rgba(255,255,255,0.35)" }} />
            確認しました
            <span style={{ fontSize: 26, marginLeft: 6 }}>→</span>
          </button>
          <div style={{
            fontSize: 14, color: "#64748B", letterSpacing: "0.14em", fontWeight: 600,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: 16 }}>👆</span>
            タッチして次に進みます
          </div>
        </div>
      </div>
    </div>
  );
}
