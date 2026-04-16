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

      {/* ━━ ヘッダー（他画面と統一: navy #1a3a6b） ━━ */}
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
        padding: "20px 80px 40px", gap: 0,
      }}>

        {/* 見出し */}
        <div style={{
          fontSize: 48, fontWeight: 900, color: "#1E293B",
          letterSpacing: "0.08em", textAlign: "center",
          marginBottom: 8,
        }}>
          場内では必ず着用してください
        </div>
        <div style={{
          fontSize: 18, color: "#94A3B8",
          letterSpacing: "0.24em", fontWeight: 600,
          marginBottom: 20,
        }}>
          PLEASE WEAR PROTECTIVE GEAR
        </div>

        {/* 装備イラスト（透過PNG・ベージュ背景にそのまま乗せる） */}
        <div style={{
          width: 680, height: 340,
          position: "relative",
          marginBottom: 12,
        }}>
          <Image
            src="/images/safety-equipment.png"
            alt="ヘルメットと安全靴"
            fill
            style={{ objectFit: "contain" }}
            priority
          />
        </div>

        {/* ラベル帯（イラストと対応） */}
        <div style={{
          display: "flex", gap: 140,
          marginBottom: 28,
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#1E293B", letterSpacing: "0.08em" }}>
              ヘルメット
            </div>
            <div style={{ fontSize: 15, color: "#92400E", marginTop: 4, letterSpacing: "0.14em", fontWeight: 600 }}>
              HARD HAT
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#1E293B", letterSpacing: "0.08em" }}>
              安全靴
            </div>
            <div style={{ fontSize: 15, color: "#475569", marginTop: 4, letterSpacing: "0.14em", fontWeight: 600 }}>
              SAFETY SHOES
            </div>
          </div>
        </div>

        {/* セパレータ */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, width: "100%", maxWidth: 680, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 2, background: "#E8D8B8" }} />
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#D97706" }} />
          <div style={{ flex: 1, height: 2, background: "#E8D8B8" }} />
        </div>

        {/* 確認ボタン（他のキオスク画面と同じteal系） */}
        <button
          onPointerDown={() => router.push("/kiosk/phone")}
          style={{
            width: 780, height: 120, fontSize: 42, fontWeight: 900,
            background: "linear-gradient(180deg, #2DD4BF 0%, #0D9488 100%)",
            color: "#fff", border: "none", borderRadius: 18,
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 16, letterSpacing: "0.1em",
            animation: "caution-pulse 2.4s ease-in-out infinite",
          }}
        >
          確認しました
          <span style={{ fontSize: 36, marginLeft: 4 }}>→</span>
        </button>
      </div>
    </div>
  );
}
