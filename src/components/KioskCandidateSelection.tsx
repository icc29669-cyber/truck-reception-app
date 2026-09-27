import type { ReactNode } from "react";

export const MULTI_CANDIDATE_CARD_HEIGHT = "clamp(140px, 16.8vh, 182px)";
export const ROOMY_CANDIDATE_CARD_HEIGHT = "clamp(160px, 20vh, 220px)";
export const candidateArtworkWidth = (roomy: boolean) => roomy ? "clamp(160px, 18vw, 300px)" : 200;
export const candidateArtworkHeight = (roomy: boolean) => roomy ? "clamp(80px, 9vw, 150px)" : 100;

export default function KioskCandidateSelection({
  step,
  instruction,
  roomy,
  children,
}: {
  step: 2 | 3;
  instruction: string;
  roomy: boolean;
  children: ReactNode;
}) {
  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="flex items-center flex-shrink-0" style={{ padding: "20px 40px 18px", gap: 22 }}>
        <div style={{
          fontSize: 16, color: "#64748B", letterSpacing: "0.22em", fontWeight: 800,
          padding: "6px 14px", background: "#E2E8F0", borderRadius: 6, flexShrink: 0,
        }}>
          STEP {step} / 4
        </div>
        <div style={{
          fontSize: 30, fontWeight: 900, color: "#26251e", letterSpacing: "0.04em",
          lineHeight: 1.25,
        }}>
          {instruction}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 lg:px-10">
        <div className="w-full pt-8 pb-6">
          <div className={`flex flex-col ${roomy ? "gap-4 xl:gap-6" : "gap-4"}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
