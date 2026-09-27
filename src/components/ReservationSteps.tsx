import { CheckIcon } from "@/components/Icon";
type StepLabel = { label: string; state: "done" | "active" | "pending" };
export default function ReservationSteps({ steps }: { steps: StepLabel[] }) {
  return (
    <div className="flex items-center gap-1" style={{ padding: "0 2px" }}>
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-2" style={{ flex: 1 }}>
          <div
            style={{
              width: 26, height: 26, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 900,
              background: s.state === "done" ? "#047857" : s.state === "active" ? "#1a3a6b" : "#E7E5DF",
              color: s.state === "pending" ? "#9a978c" : "#fff",
              flexShrink: 0,
            }}
          >
            {s.state === "done" ? <CheckIcon size={14} strokeWidth={3} /> : (i + 1)}
          </div>
          <span style={{
            fontSize: 12,
            fontWeight: s.state === "active" ? 900 : 700,
            color: s.state === "active" ? "#1a3a6b" : s.state === "done" ? "#5a5852" : "#9a978c",
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
          }}>{s.label}</span>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: 1, background: "#E7E5DF" }} />
          )}
        </div>
      ))}
    </div>
  );
}
