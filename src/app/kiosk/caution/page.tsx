"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function CautionPage() {
  const router = useRouter();

  return (
    <div className="w-screen h-screen overflow-hidden select-none" style={{
      display: "flex", flexDirection: "column", background: "#FFFFFF",
    }}>
      {/* ━━ 警告ストライプ（上部） ━━ */}
      <div style={{
        height: 16, flexShrink: 0,
        background: "repeating-linear-gradient(-45deg, #FACC15 0 22px, #000 22px 44px)",
      }} />

      {/* ━━ ヘッダー ━━ */}
      <div style={{
        background: "#0F172A", height: 72, flexShrink: 0,
        display: "flex", alignItems: "center", padding: "0 28px", gap: 20,
      }}>
        <button
          onPointerDown={() => router.push("/kiosk")}
          style={{
            height: 48, padding: "0 24px", fontSize: 20, fontWeight: 700,
            color: "#E2E8F0", background: "transparent",
            border: "1.5px solid rgba(255,255,255,0.3)", borderRadius: 10,
            cursor: "pointer", letterSpacing: "0.04em",
          }}
        >
          ◀ 戻る
        </button>
        <div style={{ flex: 1 }} />
        <div style={{
          fontSize: 14, color: "rgba(255,255,255,0.5)",
          letterSpacing: "0.3em", fontWeight: 700,
        }}>
          SAFETY CHECK
        </div>
      </div>

      {/* ━━ メインコンテンツ ━━ */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "row",
        alignItems: "center", justifyContent: "center",
        padding: "0 60px", gap: 40,
      }}>
        {/* 左：画像 */}
        <div style={{
          flexShrink: 0,
          width: 520, height: 360,
          position: "relative",
        }}>
          <Image
            src="/images/safety-equipment.png"
            alt="ヘルメットと安全靴"
            fill
            style={{ objectFit: "contain" }}
            priority
          />
        </div>

        {/* 右：メッセージ + ボタン */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          gap: 24, maxWidth: 560,
        }}>
          <div>
            <div style={{
              fontSize: 18, fontWeight: 800, color: "#B45309",
              letterSpacing: "0.28em", marginBottom: 10,
            }}>
              CAUTION
            </div>
            <div style={{
              fontSize: 46, fontWeight: 900, color: "#0F172A",
              letterSpacing: "0.04em", lineHeight: 1.2,
              marginBottom: 14,
            }}>
              場内では必ず<br />着用してください
            </div>
            <div style={{
              fontSize: 17, color: "#64748B",
              letterSpacing: "0.08em", lineHeight: 1.7,
            }}>
              安全のため、ヘルメットと安全靴の着用を<br />
              お願いしております。ご協力よろしくお願いします。
            </div>
          </div>

          {/* 必須装備リスト */}
          <div style={{
            background: "#FEF3C7",
            border: "2px solid #F59E0B",
            borderRadius: 12,
            padding: "14px 20px",
            display: "flex", gap: 28,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: "#D97706",
              }} />
              <div style={{ fontSize: 20, fontWeight: 900, color: "#78350F" }}>
                ヘルメット
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: "#D97706",
              }} />
              <div style={{ fontSize: 20, fontWeight: 900, color: "#78350F" }}>
                安全靴
              </div>
            </div>
          </div>

          {/* 確認ボタン */}
          <button
            onPointerDown={() => router.push("/kiosk/phone")}
            style={{
              width: "100%", height: 96, fontSize: 30, fontWeight: 900,
              background: "#0F172A", color: "#fff",
              border: "none", borderRadius: 14,
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 14, letterSpacing: "0.08em",
              boxShadow: "0 6px 0 #000",
            }}
          >
            着用を確認しました
            <span style={{ fontSize: 26, marginLeft: 4 }}>→</span>
          </button>
        </div>
      </div>

      {/* ━━ 警告ストライプ（下部） ━━ */}
      <div style={{
        height: 16, flexShrink: 0,
        background: "repeating-linear-gradient(-45deg, #FACC15 0 22px, #000 22px 44px)",
      }} />
    </div>
  );
}
