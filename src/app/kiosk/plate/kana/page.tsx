"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getKioskSession, setKioskSession } from "@/lib/kioskState";
import PlateDisplay from "@/components/PlateDisplay";

interface PlateRegion {
  id: number;
  name: string;
  kana: string;
  sortOrder: number;
  isActive: boolean;
}

// 五十音表
const HIRA_ROWS: (string | null)[][] = [
  ["あ", "い", "う", "え", "お"],
  ["か", "き", "く", "け", "こ"],
  ["さ", "し", "す", "せ", "そ"],
  ["た", "ち", "つ", "て", "と"],
  ["な", "に", "ぬ", "ね", "の"],
  ["は", "ひ", "ふ", "へ", "ほ"],
  ["ま", "み", "む", "め", "も"],
  ["や", null, "ゆ", null, "よ"],
  ["ら", "り", "る", "れ", "ろ"],
  ["わ", "を", null, null, "ん"],
];

export default function PlateKanaPage() {
  const router = useRouter();
  const session = getKioskSession();
  const [selectedKana, setSelectedKana] = useState<string | null>(null);
  const [regions, setRegions] = useState<PlateRegion[]>([]);

  // DBから地名マスタ取得
  useEffect(() => {
    fetch("/api/plate-masters")
      .then((r) => r.json())
      .then((data) => {
        if (data.regions) setRegions(data.regions);
      })
      .catch(() => {});
  }, []);

  // ひらがな頭文字でフィルタした地名リスト
  const regionList = selectedKana
    ? regions.filter((r) => r.kana.startsWith(selectedKana))
    : [];

  // 各ひらがなに対応する地名があるかチェック
  function hasRegionsForKana(kana: string): boolean {
    return regions.some((r) => r.kana.startsWith(kana));
  }

  function selectRegion(region: PlateRegion) {
    setKioskSession({ plate: { ...session.plate, region: region.name } });
    router.push("/kiosk/plate/classnum");
  }

  const GAP = 8;
  const BTN_SIZE = 96;

  return (
    <div
      className="w-screen h-screen flex flex-col select-none overflow-hidden"
      style={{ background: "#f2f1ed" }}
    >
      {/* ヘッダー */}
      <div
        className="flex items-center justify-between px-8 py-3 flex-shrink-0"
        style={{ background: "#1a3a6b" }}
      >
        <button
          onPointerDown={() => router.push("/kiosk/data-confirm")}
          className="min-h-[56px] px-8 rounded-xl border-2 text-2xl font-bold active:opacity-80 transition-opacity"
          style={{ borderColor: "white", color: "white", background: "transparent" }}
        >
          戻る
        </button>
        <PlateDisplay plate={session.plate} highlight="region" size="sm" />
        <div style={{ width: 120 }} />
      </div>

      {/* メインコンテンツ: 2カラム */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左カラム: ひらがな選択グリッド */}
        <div
          className="flex flex-col items-center px-4 py-5 border-r border-blue-200 flex-shrink-0 overflow-y-auto"
          style={{ background: "transparent" }}
        >
          <p className="text-3xl font-bold text-gray-800 mb-4 text-center">
            地名の読みの最初の文字をタッチ
          </p>

          {/* 五十音グリッド */}
          <div className="flex flex-col" style={{ gap: GAP }}>
            {HIRA_ROWS.map((row, ri) => (
              <div key={ri} className="flex" style={{ gap: GAP }}>
                {row.map((kana, ci) => {
                  if (kana === null) {
                    return <div key={ci} style={{ width: BTN_SIZE, height: BTN_SIZE }} />;
                  }
                  const hasItems = hasRegionsForKana(kana);
                  const isSelected = selectedKana === kana;
                  return (
                    <button
                      key={ci}
                      onPointerDown={() => hasItems ? setSelectedKana(kana) : undefined}
                      disabled={!hasItems}
                      className={`rounded-xl text-3xl font-bold flex items-center justify-center transition-all duration-75
                        ${isSelected
                          ? "bg-blue-600 text-white border-blue-700 shadow-lg"
                          : hasItems
                            ? "bg-white text-gray-800 active:bg-blue-100 shadow-sm"
                            : "bg-gray-100 text-gray-300"
                        }`}
                      style={{
                        width: BTN_SIZE,
                        height: BTN_SIZE,
                        border: "3px solid",
                        borderColor: isSelected ? "#1d4ed8" : "#e5e7eb",
                      }}
                    >
                      {kana}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* 右カラム: 地名リスト */}
        <div className="flex-1 flex flex-col px-6 py-5 overflow-y-auto" style={{ background: "rgba(255,255,255,0.6)" }}>
          {!selectedKana ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-3xl text-gray-400 font-bold text-center leading-relaxed">
                ← 地名の読みの最初のひと文字を選んでください
              </p>
            </div>
          ) : regionList.length > 0 ? (
            <>
              <p className="text-5xl font-bold text-gray-800 mb-5 text-center">
                ナンバーの地名をタッチしてください
              </p>
              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                {regionList.map((r) => (
                  <button
                    key={r.id}
                    onPointerDown={() => selectRegion(r)}
                    className="bg-white border-4 border-gray-300 rounded-2xl font-bold text-gray-900
                               active:bg-green-100 active:border-green-500 transition-all duration-75
                               flex flex-col items-center justify-center shadow-sm"
                    style={{ height: 180, fontSize: 40 }}
                  >
                    <span>{r.name}</span>
                    <span className="text-lg text-gray-400 mt-1">({r.kana})</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-2xl text-gray-400 font-bold">該当する地名がありません</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
