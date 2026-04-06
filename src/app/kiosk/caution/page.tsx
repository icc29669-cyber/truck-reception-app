"use client";
import { useRouter } from "next/navigation";

/* ━━ SVGアイコン：ヘルメット（正面からの建設用ヘルメット） ━━ */
function HardHatIcon() {
  return (
    <svg width="220" height="190" viewBox="0 0 220 190" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* ブリム影 */}
      <ellipse cx="110" cy="128" rx="96" ry="18" fill="#92400E"/>
      {/* ブリム */}
      <ellipse cx="110" cy="124" rx="96" ry="15" fill="#D97706"/>
      {/* ドーム本体（下からの弧で台形に近い形） */}
      <path d="M16 124 C16 58 44 20 110 16 C176 20 204 58 204 124 Z" fill="#FBBF24"/>
      {/* ドーム左ハイライト */}
      <path d="M32 112 C32 60 52 28 110 20 C76 28 52 64 50 112 Z" fill="rgba(255,255,255,0.20)"/>
      {/* クラウンノブ */}
      <rect x="85" y="12" width="50" height="16" rx="8" fill="#92400E"/>
      {/* チンストラップ取り付け部 左 */}
      <rect x="20" y="122" width="14" height="28" rx="5" fill="#78350F"/>
      {/* チンストラップ取り付け部 右 */}
      <rect x="186" y="122" width="14" height="28" rx="5" fill="#78350F"/>
      {/* ベンチレーション溝 */}
      <path d="M72 80 Q88 68 110 66 Q132 68 148 80" stroke="rgba(180,83,9,0.30)" strokeWidth="3" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

/* ━━ SVGアイコン：安全靴（くるぶし以下の低いワークシューズ） ━━ */
function SafetyShoeIcon() {
  return (
    <svg width="280" height="150" viewBox="0 0 280 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* ── ソール ── */}
      {/* アウトソール（黒） */}
      <rect x="8" y="120" width="264" height="22" rx="9" fill="#0F172A"/>
      {/* グリップ溝 */}
      {[28,50,72,94,116,138,160,182,204,226,248].map(x => (
        <rect key={x} x={x} y="122" width="14" height="18" rx="2" fill="#1E293B"/>
      ))}
      {/* ミッドソール（グレー） */}
      <rect x="12" y="106" width="258" height="18" rx="5" fill="#94A3B8"/>

      {/* ── アッパー ── */}
      {/* メインアッパー全体（横長・低い） */}
      <path d="
        M 22 106
        L 22 68
        Q 22 44 50 42
        L 195 42
        Q 218 42 226 54
        L 248 72
        Q 268 76 270 92
        Q 272 104 262 106
        Z
      " fill="#334155"/>
      {/* ヒールカウンター（かかと部分） */}
      <path d="M 22 106 L 22 68 Q 22 46 50 44 L 62 44 L 62 106 Z" fill="#1E293B"/>
      {/* スチールトゥキャップ（つま先の補強） */}
      <path d="M 24 76 Q 22 106 60 106" stroke="#64748B" strokeWidth="6" fill="none" strokeLinecap="round"/>

      {/* レースパネル（靴ひも部分） */}
      <rect x="76" y="44" width="128" height="60" rx="5" fill="#475569"/>
      {/* タング（べろ） */}
      <rect x="110" y="40" width="48" height="68" rx="8" fill="#64748B"/>
      {/* 靴ひも */}
      {[58, 70, 82, 94, 104].map(y => (
        <line key={y} x1="112" y1={y} x2="156" y2={y} stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round"/>
      ))}
    </svg>
  );
}

export default function CautionPage() {
  const router = useRouter();

  return (
    <div className="w-screen h-screen overflow-hidden select-none" style={{
      display: "flex", flexDirection: "column",
      background: "#F5F0E8",
    }}>

      {/* ── ヘッダー（戻るボタン） ── */}
      <div
        style={{
          background: "linear-gradient(160deg,#1a3a6b 0%,#1E5799 100%)",
          height: 84, flexShrink: 0,
          display: "flex", alignItems: "center", padding: "0 32px",
        }}
      >
        <button
          onPointerDown={() => router.push("/kiosk")}
          style={{
            height: 60, width: 160, fontSize: 28, fontWeight: 700,
            color: "#fff", background: "transparent",
            border: "2px solid #fff", borderRadius: 12,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            letterSpacing: "0.04em",
          }}
        >
          ◀ 戻る
        </button>
      </div>

      {/* ── コンテンツ ── */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 28, padding: "0 80px",
      }}>

        {/* 小ラベル */}
        <div style={{
          fontSize: 14, color: "#D97706",
          letterSpacing: "0.28em", fontWeight: 600,
        }}>
          SAFETY CHECK — 入場前のご確認
        </div>

        {/* 2アイコン（SVG・コンテナなし） */}
        <div style={{ display: "flex", gap: 80, alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <HardHatIcon />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: "#1E293B", letterSpacing: "0.06em" }}>ヘルメット</div>
              <div style={{ fontSize: 16, color: "#92400E", marginTop: 4, letterSpacing: "0.1em", fontWeight: 500 }}>保護帽</div>
            </div>
          </div>

          {/* 区切り */}
          <div style={{ width: 1, height: 180, background: "#D9C9A8", alignSelf: "center" }} />

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <SafetyShoeIcon />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: "#1E293B", letterSpacing: "0.06em" }}>安全靴</div>
              <div style={{ fontSize: 16, color: "#475569", marginTop: 4, letterSpacing: "0.1em", fontWeight: 500 }}>Safety Shoes</div>
            </div>
          </div>
        </div>

        {/* アンバー区切り */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, width: "100%", maxWidth: 680 }}>
          <div style={{ flex: 1, height: 2, background: "#E8D8B8" }} />
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#D97706" }} />
          <div style={{ flex: 1, height: 2, background: "#E8D8B8" }} />
        </div>

        {/* メインメッセージ */}
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontSize: 48, fontWeight: 900, color: "#1E293B",
            letterSpacing: "0.06em", lineHeight: 1.6,
          }}>
            場内ではヘルメット・安全靴を<br />着用願います
          </div>
        </div>

        {/* 確認ボタン */}
        <button
          onPointerDown={() => router.push("/kiosk/phone")}
          style={{
            width: 760, height: 128, fontSize: 50, fontWeight: 900,
            background: "linear-gradient(180deg, #2DD4BF 0%, #0D9488 100%)",
            color: "#fff", border: "none",
            borderRadius: 16,
            boxShadow: "0 8px 0 #0F766E, 0 14px 40px rgba(13,148,136,0.22)",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            letterSpacing: "0.1em",
          }}
        >
          確認しました ✓
        </button>


      </div>
    </div>
  );
}
