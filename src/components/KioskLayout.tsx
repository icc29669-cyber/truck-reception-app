"use client";
import { useRouter } from "next/navigation";
import { clearKioskSession, getKioskSession } from "@/lib/kioskState";

interface Props {
  step: number;
  totalSteps: number;
  stepLabel: string;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  hideFooter?: boolean;
  children: React.ReactNode;
}

export default function KioskLayout({
  step, totalSteps, stepLabel,
  onBack, onNext, nextLabel = "次へ ▶",
  nextDisabled = false, hideFooter = false,
  children,
}: Props) {
  const router = useRouter();
  const session = getKioskSession();
  const centerName = session.centerName || "";

  const progressPct = Math.round((step / totalSteps) * 100);

  function handleReset() {
    clearKioskSession();
    router.push("/kiosk");
  }

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden bg-kb-bg select-none">

      {/* ── ヘッダー ── */}
      <header className="h-[120px] bg-kb-header flex flex-col shrink-0 shadow-lg z-10">
        {/* メインヘッダー行 */}
        <div className="flex-1 flex items-center justify-between px-10">
          {/* ステップ表示 */}
          <div className="flex flex-col gap-0.5 min-w-[200px]">
            <span className="text-white/60 text-k-sm font-bold tracking-wider">ステップ</span>
            <span className="text-white text-k-3xl font-black leading-none">
              {step} <span className="text-white/50 text-k-xl font-bold">/ {totalSteps}</span>
            </span>
          </div>

          {/* センター名 + ステップラベル（中央） */}
          <div className="flex flex-col items-center gap-0.5">
            {centerName && (
              <span className="text-white/80 text-k-xl font-bold tracking-wider">{centerName}</span>
            )}
            <span className="text-white text-k-xl font-bold">{stepLabel}</span>
          </div>

          {/* やり直すボタン */}
          <div className="min-w-[200px] flex justify-end">
            <button
              onPointerDown={handleReset}
              className="h-[72px] px-10 bg-kb-danger text-white text-k-base font-bold rounded-xl
                         shadow-[0_5px_0_#7B1818] active:shadow-[0_1px_0_#7B1818]
                         active:translate-y-[4px] active:scale-[0.97] transition-all duration-75"
            >
              やり直す
            </button>
          </div>
        </div>

        {/* プログレスバー（ヘッダー最下部） */}
        <div className="h-[6px] bg-white/20 mx-0">
          <div
            className="h-full bg-white/80 rounded-r-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </header>

      {/* ── メインコンテンツ ── */}
      <main className="flex-1 flex overflow-hidden">
        {children}
      </main>

      {/* ── フッター ── */}
      {!hideFooter && (
        <footer className="h-[100px] bg-white/40 flex items-center justify-between px-10 shrink-0 border-t-2 border-white/60">
          <button
            onPointerDown={onBack}
            className="h-[76px] px-12 bg-gray-400 text-white text-k-lg font-bold rounded-2xl
                       shadow-[0_5px_0_#757575] active:shadow-[0_2px_0_#757575]
                       active:translate-y-[3px] active:scale-[0.97] transition-all duration-75"
          >
            ◀ 戻る
          </button>
          <button
            onPointerDown={onNext}
            disabled={nextDisabled}
            className={`h-[76px] px-16 text-white text-k-xl font-bold rounded-2xl transition-all duration-75
              ${nextDisabled
                ? "bg-gray-300 text-gray-400 cursor-not-allowed shadow-none"
                : "bg-kb-primary shadow-[0_5px_0_#0D47A1] active:shadow-[0_2px_0_#0D47A1] active:translate-y-[3px] active:scale-[0.97]"
              }`}
          >
            {nextLabel}
          </button>
        </footer>
      )}
    </div>
  );
}
