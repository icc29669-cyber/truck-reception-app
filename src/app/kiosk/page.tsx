"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearKioskSession, setKioskSession } from "@/lib/kioskState";
import { fetchCenters } from "@/lib/api";

export default function KioskTop() {
  const router = useRouter();
  const [centers, setCenters] = useState<{ id: number; name: string }[]>([]);
  const [selectedId, setSelectedId] = useState<number>(
    Number(process.env.NEXT_PUBLIC_CENTER_ID ?? 1)
  );

  useEffect(() => {
    clearKioskSession();
    fetchCenters().then((list) => {
      if (list.length > 0) setCenters(list);
    });
  }, []);

  function start() {
    const center = centers.find((c) => c.id === selectedId);
    setKioskSession({
      centerId: selectedId,
      centerName: center?.name ?? "",
    });
    router.push("/kiosk/caution");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-900 px-8">
      <div className="text-center space-y-8 w-full max-w-lg">
        {/* ロゴ・タイトル */}
        <div>
          <div className="text-7xl mb-4">🚛</div>
          <h1 className="text-4xl font-black text-white">来場受付</h1>
          <p className="text-blue-300 text-xl mt-2">ご来場の方はこちらで受付をお願いします</p>
        </div>

        {/* センター選択（複数センターある場合） */}
        {centers.length > 1 && (
          <div className="bg-blue-800 rounded-3xl p-6">
            <p className="text-blue-300 text-lg mb-3">センターを選んでください</p>
            <div className="space-y-3">
              {centers.map((c) => (
                <button
                  key={c.id}
                  onPointerDown={() => setSelectedId(c.id)}
                  className={`w-full py-4 rounded-2xl text-xl font-bold transition-colors ${
                    selectedId === c.id
                      ? "bg-white text-blue-900"
                      : "bg-blue-700 text-white"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 受付開始ボタン */}
        <button
          onPointerDown={start}
          className="w-full py-10 bg-green-500 hover:bg-green-400 active:bg-green-600 text-white rounded-3xl text-5xl font-black shadow-2xl transition-colors"
        >
          受 付 開 始
        </button>
      </div>
    </div>
  );
}
