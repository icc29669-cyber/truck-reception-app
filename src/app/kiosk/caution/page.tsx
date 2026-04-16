"use client";
import { useRouter } from "next/navigation";

/* ━━ 警告三角アイコン（JIS準拠の注意サイン） ━━ */
function WarningIcon({ size = 120 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.9} viewBox="0 0 120 108" fill="none">
      {/* 黒縁 */}
      <path d="M60 4 L116 100 L4 100 Z" fill="#000" />
      {/* 黄色 */}
      <path d="M60 14 L107 96 L13 96 Z" fill="#FACC15" />
      {/* エクスクラメーション */}
      <rect x="55" y="38" width="10" height="36" rx="2" fill="#000" />
      <circle cx="60" cy="84" r="5" fill="#000" />
    </svg>
  );
}

/* ━━ チェックマーク ━━ */
function CheckIcon({ size = 32, color = "#0D9488" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 13l4 4L19 7" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function CautionPage() {
  const router = useRouter();

  return (
    <div className="w-screen h-screen overflow-hidden select-none" style={{
      display: "flex", flexDirection: "column", background: "#FFFFFF",
    }}>
      {/* ━━ 警告ストライプ（上部） ━━ */}
      <div style={{
        height: 20, flexShrink: 0,
        background: "repeating-linear-gradient(-45deg, #FACC15 0 24px, #000 24px 48px)",
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
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "0 80px", gap: 0,
      }}>

        {/* 警告アイコン + メイン見出し */}
        <div style={{ display: "flex", alignItems: "center", gap: 36, marginBottom: 48 }}>
          <WarningIcon size={110} />
          <div>
            <div style={{
              fontSize: 20, fontWeight: 800, color: "#B45309",
              letterSpacing: "0.28em", marginBottom: 8,
            }}>
              CAUTION
            </div>
            <div style={{
              fontSize: 52, fontWeight: 900, color: "#0F172A",
              letterSpacing: "0.04em", lineHeight: 1.1,
            }}>
              安全装備の着用
            </div>
          </div>
        </div>

        {/* 必須アイテムリスト */}
        <div style={{
          width: "100%", maxWidth: 820,
          background: "#F8FAFC",
          border: "2px solid #E2E8F0",
          borderRadius: 16,
          padding: "28px 48px",
          marginBottom: 48,
        }}>
          <div style={{
            fontSize: 18, fontWeight: 700, color: "#64748B",
            letterSpacing: "0.1em", marginBottom: 16,
          }}>
            場内では必ず着用してください
          </div>
          <div style={{ display: "flex", gap: 0, alignItems: "stretch" }}>
            {/* ヘルメット */}
            <div style={{
              flex: 1, display: "flex", alignItems: "center", gap: 16,
              padding: "12px 0",
            }}>
              <CheckIcon size={36} color="#0D9488" />
              <div>
                <div style={{ fontSize: 32, fontWeight: 900, color: "#0F172A", lineHeight: 1 }}>
                  ヘルメット
                </div>
                <div style={{ fontSize: 14, color: "#64748B", marginTop: 4, letterSpacing: "0.08em" }}>
                  保護帽
                </div>
              </div>
            </div>
            {/* 縦区切り */}
            <div style={{ width: 1, background: "#E2E8F0", margin: "8px 24px" }} />
            {/* 安全靴 */}
            <div style={{
              flex: 1, display: "flex", alignItems: "center", gap: 16,
              padding: "12px 0",
            }}>
              <CheckIcon size={36} color="#0D9488" />
              <div>
                <div style={{ fontSize: 32, fontWeight: 900, color: "#0F172A", lineHeight: 1 }}>
                  安全靴
                </div>
                <div style={{ fontSize: 14, color: "#64748B", marginTop: 4, letterSpacing: "0.08em" }}>
                  Safety Shoes
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 確認ボタン */}
        <button
          onPointerDown={() => router.push("/kiosk/phone")}
          style={{
            width: 620, height: 104, fontSize: 36, fontWeight: 900,
            background: "#0F172A", color: "#fff",
            border: "none", borderRadius: 14,
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 14, letterSpacing: "0.08em",
            boxShadow: "0 6px 0 #000",
          }}
        >
          着用を確認しました
          <span style={{ fontSize: 30, marginLeft: 4 }}>→</span>
        </button>
      </div>

      {/* ━━ 警告ストライプ（下部） ━━ */}
      <div style={{
        height: 20, flexShrink: 0,
        background: "repeating-linear-gradient(-45deg, #FACC15 0 24px, #000 24px 48px)",
      }} />
    </div>
  );
}
