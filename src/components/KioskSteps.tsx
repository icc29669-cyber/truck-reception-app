export default function KioskSteps({ current, completed, large = false }: { current: number; completed?: boolean[]; large?: boolean }) {
  const labels = ["電話番号", "お名前", "車　両", "最終確認"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: large ? 16 : 10 }}>
      {labels.map((label, i) => {
        const step = i + 1;
        const done = completed ? (completed[i] ?? false) : step < current;
        const active = step === current;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: large ? 16 : 10 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: large ? 72 : 66 }}>
              <div style={{
                width: large ? 52 : 44, height: large ? 52 : 44, borderRadius: "50%",
                background: done ? "#4ade80" : active ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.12)",
                border: `2.5px solid ${done ? "#22c55e" : active ? "#fff" : "rgba(255,255,255,0.25)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: large ? 22 : 18, fontWeight: 900,
                color: done ? "#166534" : active ? "#1e3a6b" : "rgba(255,255,255,0.35)",
                transition: "all 0.3s ease",
              }}>
                {done ? "✓" : step}
              </div>
              <span style={{
                fontSize: large ? 15 : 12.5, fontWeight: 700, marginTop: 3,
                color: active ? "#fff" : done ? "#bbf7d0" : "rgba(255,255,255,0.3)",
                whiteSpace: "nowrap",
              }}>{label}</span>
            </div>
            {i < labels.length - 1 && (
              <div style={{
                width: large ? 56 : 36, height: large ? 3 : 2.5,
                background: done ? "#4ade80" : "rgba(255,255,255,0.12)",
                borderRadius: 2, marginBottom: 16,
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
