"use client";

type Props = { maxLoad: string; saveMaxLoad: (value: string) => void; submitInput: () => void };
export default function MaxLoadInput({ maxLoad, saveMaxLoad, submitInput }: Props) {
  return (
          <div className="min-h-full flex items-center justify-center gap-6 px-12 py-4">
            <div className="flex flex-col gap-4 flex-shrink-0">
              {[["1","2","3"],["4","5","6"],["7","8","9"]].map((row, ri) => (
                <div key={ri} className="flex gap-4">{row.map(k => (
                  <button key={k} onClick={() => { if (maxLoad.length < 6) saveMaxLoad(maxLoad + k); }} className="flex items-center justify-center font-black rounded-xl border-2 border-gray-200 bg-white text-gray-900 active:bg-gray-100 shadow-[0_5px_0_#BDBDBD] active:shadow-[0_1px_0_#BDBDBD] active:translate-y-[3px] transition-all select-none touch-pan-y" style={{ width: 200, height: 144, fontSize: 64 }}>{k}</button>
                ))}</div>
              ))}
              <button onClick={() => { if (maxLoad.length < 6) saveMaxLoad(maxLoad + "0"); }} className="flex items-center justify-center font-black rounded-xl border-2 border-gray-200 bg-white text-gray-900 active:bg-gray-100 shadow-[0_5px_0_#BDBDBD] active:shadow-[0_1px_0_#BDBDBD] active:translate-y-[3px] transition-all select-none touch-pan-y" style={{ width: 624, height: 144, fontSize: 64 }}>0</button>
            </div>
            <div className="flex flex-col gap-4 flex-shrink-0">
              <button onClick={() => saveMaxLoad("")} className="flex items-center justify-center font-bold rounded-xl border-2 border-red-500 bg-red-500 text-white active:bg-red-600 shadow-[0_5px_0_#B91C1C] active:shadow-[0_1px_0_#B91C1C] active:translate-y-[3px] transition-all select-none touch-pan-y" style={{ width: 200, height: 144, fontSize: 28, textAlign: "center", lineHeight: 1.3 }}>すべて<br/>消す</button>
              <button onClick={() => saveMaxLoad(maxLoad.slice(0, -1))} className="flex items-center justify-center font-bold rounded-xl border-2 border-orange-400 bg-orange-400 text-white active:bg-orange-500 shadow-[0_5px_0_#C2410C] active:shadow-[0_1px_0_#C2410C] active:translate-y-[3px] transition-all select-none touch-pan-y" style={{ width: 200, height: 144, fontSize: 28, textAlign: "center", lineHeight: 1.3 }}>1文字<br/>消す</button>
              <button onClick={() => { if (maxLoad) submitInput(); }} className="flex items-center justify-center font-black rounded-2xl text-white active:brightness-90 select-none touch-pan-y" style={{ width: 220, height: 308, fontSize: 52, background: maxLoad ? "linear-gradient(180deg,#0d9488,#0f766e)" : "#9CA3AF", boxShadow: maxLoad ? "0 6px 0 #0f766e, 0 8px 24px rgba(13,148,136,0.4)" : "0 4px 0 #6B7280", opacity: maxLoad ? 1 : 0.6, transition: "all 0.2s" }}>次へ<br/>▶</button>
            </div>
          </div>
  );
}
