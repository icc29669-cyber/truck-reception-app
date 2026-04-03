"use client";
import { useRouter } from "next/navigation";

export default function CautionPage() {
  const router = useRouter();

  return (
    <div
      className="w-screen h-screen flex flex-col select-none overflow-hidden"
      style={{ background: "linear-gradient(160deg, #E8F4FD 0%, #D0E8FA 50%, #B8D8F6 100%)" }}
    >
      {/* ヘッダー */}
      <div
        className="flex items-center justify-center px-16"
        style={{ background: "linear-gradient(90deg, #1a3a6b 0%, #1E5799 100%)", height: 120 }}
      >
        <h1 className="text-white font-black tracking-widest" style={{ fontSize: 52 }}>
          場内への入場前にご確認ください
        </h1>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col items-center justify-center gap-10 px-20">
        {/* 2カード横並び */}
        <div className="flex gap-12 w-full" style={{ maxWidth: 1400 }}>
          {/* ヘルメットカード */}
          <div
            className="flex-1 flex flex-col items-center gap-6 bg-white rounded-3xl border-4 border-blue-300 shadow-lg py-12"
          >
            <span style={{ fontSize: 140 }}>🪖</span>
            <p className="font-black text-center text-gray-800" style={{ fontSize: 44 }}>
              保護帽（ヘルメット）<br />の着用
            </p>
          </div>

          {/* 安全靴カード */}
          <div
            className="flex-1 flex flex-col items-center gap-6 bg-white rounded-3xl border-4 border-blue-300 shadow-lg py-12"
          >
            <span style={{ fontSize: 140 }}>👟</span>
            <p className="font-black text-center text-gray-800" style={{ fontSize: 44 }}>
              安全靴の着用
            </p>
          </div>
        </div>

        {/* 強調メッセージ */}
        <p className="font-black text-red-600 tracking-widest" style={{ fontSize: 48 }}>
          ご協力をお願いします
        </p>

        {/* 次へボタン */}
        <button
          onPointerDown={() => router.push("/kiosk/phone")}
          className="bg-[#2E7D32] text-white font-black rounded-3xl
                     shadow-[0_14px_0_#1B5E20] active:shadow-[0_3px_0_#1B5E20]
                     active:translate-y-[11px] transition-all duration-75 tracking-widest
                     flex items-center justify-center border-4 border-[#4CAF50]"
          style={{ width: 600, height: 180, fontSize: 60 }}
        >
          確認しました ✓
        </button>
      </div>
    </div>
  );
}
