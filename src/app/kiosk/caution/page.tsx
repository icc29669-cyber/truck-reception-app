"use client";
import { useRouter } from "next/navigation";

export default function CautionPage() {
  const router = useRouter();

  return (
    <div className="w-screen h-screen overflow-hidden" style={{
      display: "flex", flexDirection: "column",
      userSelect: "none",
      background: "linear-gradient(160deg,#1a3a6b 0%,#1E5799 100%)",
    }}>
      {/* ── ヘッダー ── */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        flexShrink: 0, paddingTop: 48, paddingBottom: 36,
      }}>
        <span style={{ fontSize: 52, fontWeight: 800, color: "#FFFFFF", letterSpacing: "0.12em" }}>
          場内への入場前にご確認ください
        </span>
        <span style={{ fontSize: 22, color: "rgba(255,255,255,0.6)", marginTop: 8, letterSpacing: "0.08em" }}>
          以下の安全装備を必ず着用してください
        </span>
      </div>

      {/* ── メインエリア ── */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 40, padding: "0 80px",
      }}>
        {/* 2カード横並び */}
        <div style={{ display: "flex", gap: 48, width: "100%", maxWidth: 1600 }}>
          {/* ヘルメットカード */}
          <div style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            gap: 24, background: "#fff", borderRadius: 22,
            boxShadow: "0 2px 20px rgba(0,0,0,0.08)",
            padding: "56px 40px",
          }}>
            <span style={{ fontSize: 180, lineHeight: 1 }}>🪖</span>
            <p style={{ fontSize: 52, fontWeight: 900, color: "#1f2937", textAlign: "center", lineHeight: 1.4 }}>
              保護帽（ヘルメット）<br />の着用
            </p>
          </div>
          {/* 安全靴カード */}
          <div style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            gap: 24, background: "#fff", borderRadius: 22,
            boxShadow: "0 2px 20px rgba(0,0,0,0.08)",
            padding: "56px 40px",
          }}>
            <span style={{ fontSize: 180, lineHeight: 1 }}>👟</span>
            <p style={{ fontSize: 52, fontWeight: 900, color: "#1f2937", textAlign: "center", lineHeight: 1.4 }}>
              安全靴の着用
            </p>
          </div>
        </div>

        {/* 注意テキスト */}
        <p style={{ fontSize: 52, fontWeight: 900, color: "#FCA5A5", letterSpacing: "0.12em" }}>
          ご協力をお願いします
        </p>

        {/* 確認ボタン */}
        <button
          onPointerDown={() => router.push("/kiosk/phone")}
          style={{
            width: 860, height: 200, fontSize: 68, fontWeight: 900,
            background: "linear-gradient(180deg,#22C55E 0%,#16A34A 100%)",
            color: "#fff", border: "none",
            borderRadius: 28,
            boxShadow: "0 8px 0 #14532d, 0 14px 48px rgba(22,163,74,0.4)",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            letterSpacing: "0.1em",
            transition: "transform 0.08s, box-shadow 0.08s",
          }}
          onPointerUp={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 8px 0 #14532d, 0 14px 48px rgba(22,163,74,0.4)";
          }}
          onPointerLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 8px 0 #14532d, 0 14px 48px rgba(22,163,74,0.4)";
          }}
        >
          確認しました ✓
        </button>
      </div>
    </div>
  );
}
