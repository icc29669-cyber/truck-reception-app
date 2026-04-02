"use client";
import { useRouter } from "next/navigation";

export default function CautionPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 px-8">
      <div className="w-full max-w-xl space-y-8">
        <h2 className="text-3xl font-black text-center text-yellow-400">⚠️ ご注意事項</h2>

        <div className="bg-gray-800 rounded-3xl p-8 space-y-5 text-lg text-gray-100 leading-relaxed">
          <p>① 構内では<span className="text-yellow-300 font-bold">徐行運転</span>をお守りください。</p>
          <p>② 指定された場所以外への<span className="text-yellow-300 font-bold">駐車・停車はご遠慮</span>ください。</p>
          <p>③ 荷役作業中は<span className="text-yellow-300 font-bold">安全確認</span>を徹底してください。</p>
          <p>④ 構内での<span className="text-yellow-300 font-bold">喫煙は禁止</span>です。</p>
          <p>⑤ スタッフの指示に必ず従ってください。</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onPointerDown={() => router.push("/kiosk")}
            className="py-6 bg-gray-600 hover:bg-gray-500 active:bg-gray-700 text-white rounded-2xl text-2xl font-bold transition-colors"
          >
            戻る
          </button>
          <button
            onPointerDown={() => router.push("/kiosk/phone")}
            className="py-6 bg-green-500 hover:bg-green-400 active:bg-green-600 text-white rounded-2xl text-2xl font-bold transition-colors"
          >
            同意して進む
          </button>
        </div>
      </div>
    </div>
  );
}
