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
          0%, 100% { box-shadow: 0 8px 0 #0F766E, 0 14px 40px rgba(13,148,136,0.22); }
          50%      { box-shadow: 0 8px 0 #0F766E, 0 14px 56px rgba(13,148,136,0.36), 0 0 0 10px rgba(45,212,191,0.10); }
        }
      `}</style>

      {/* ━━ ヘッダー ━━ */}
      <div style={{
        background: "#1a3a6b", height: 84, flexShrink: 0,
        display: "flex", alignItems: "center", padding: "0 32px", gap: 24,
      }}>
        <button
          onPointerDown={() => router.push("/kiosk")}
          style={{
            height: 54, width: 140, fontSize: 24, fontWeight: 700,
            color: "#fff", background: "transparent",
            border: "2px solid rgba(255,255,255,0.5)", borderRadius: 12,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            letterSpacing: "0.04em",
          }}
        >
          ◀ 戻る
        </button>
        <div style={{
          fontSize: 22, color: "rgba(255,255,255,0.6)",
          letterSpacing: "0.14em", fontWeight: 600,
        }}>
          SAFETY CHECK
        </div>
      </div>

      {/* ━━ メインコンテンツ ━━ */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "12px 80px 32px", gap: 0,
      }}>

        {/* 見出し */}
        <div style={{
          fontSize: 44, fontWeight: 900, color: "#1E293B",
          letterSpacing: "0.08em", textAlign: "center",
        }}>
          場内では必ず着用してください
        </div>
        <div style={{
          fontSize: 16, color: "#94A3B8",
          letterSpacing: "0.24em", fontWeight: 600,
          marginTop: 6, marginBottom: 16,
        }}>
          PLEASE WEAR PROTECTIVE GEAR
        </div>

        {/* 装備：2カラム（画像 + ラベル） */}
        <div style={{
          display: "flex", alignItems: "flex-end", gap: 60,
          marginBottom: 20,
        }}>
          {/* ヘルメット */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: 300, height: 240, position: "relative" }}>
              <Image
                src="/images/helmet.png"
                alt="ヘルメット"
                fill
                style={{ objectFit: "contain" }}
                priority
              />
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#1E293B", letterSpacing: "0.08em" }}>
              ヘルメット
            </div>
            <div style={{ fontSize: 13, color: "#92400E", letterSpacing: "0.14em", fontWeight: 600 }}>
              HARD HAT
            </div>
          </div>

          {/* プラス記号 */}
          <div style={{
            fontSize: 48, color: "#D97706", fontWeight: 300,
            paddingBottom: 80,
          }}>
            +
          </div>

          {/* 安全靴 */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: 300, height: 240, position: "relative" }}>
              <Image
                src="/images/safety-shoes.png"
                alt="安全靴"
                fill
                style={{ objectFit: "contain" }}
                priority
              />
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#1E293B", letterSpacing: "0.08em" }}>
              安全靴
            </div>
            <div style={{ fontSize: 13, color: "#475569", letterSpacing: "0.14em", fontWeight: 600 }}>
              SAFETY SHOES
            </div>
          </div>
        </div>

        {/* セパレータ */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, width: "100%", maxWidth: 680, marginBottom: 18 }}>
          <div style={{ flex: 1, height: 2, background: "#E8D8B8" }} />
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#D97706" }} />
          <div style={{ flex: 1, height: 2, background: "#E8D8B8" }} />
        </div>

        {/* 確認ボタン */}
        <button
          onPointerDown={() => router.push("/kiosk/phone")}
          style={{
            width: 780, height: 110, fontSize: 40, fontWeight: 900,
            background: "linear-gradient(180deg, #2DD4BF 0%, #0D9488 100%)",
            color: "#fff", border: "none", borderRadius: 18,
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 16, letterSpacing: "0.1em",
            animation: "caution-pulse 2.4s ease-in-out infinite",
          }}
        >
          確認しました
          <span style={{ fontSize: 34, marginLeft: 4 }}>→</span>
        </button>
      </div>
    </div>
  );
}
