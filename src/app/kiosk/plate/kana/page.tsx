"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getKioskSession, setKioskSession } from "@/lib/kioskState";
import PlateDisplay from "@/components/PlateDisplay";

const REGION_MAP: Record<string, string[]> = {
  あ: ["会津","足立","厚木","旭川","安曇野","青森","秋田","奄美"],
  い: ["いわき","一宮","伊勢志摩","伊豆","石川","出雲","市川","市原","板橋","岩手","茨城","和泉"],
  う: ["宇都宮","宇部"],
  え: ["江戸川"],
  お: ["帯広","岡崎","岡山","小山","大宮","大分","大阪","沖縄","尾張小牧"],
  か: ["加古川","香川","葛飾","鹿児島","柏","春日井","春日部","川越","川口","川崎","金沢"],
  き: ["京都","岐阜","北九州","北見","木更津"],
  く: ["釧路","久留米","熊谷","熊本","倉敷"],
  こ: ["江東","越谷","甲府","古河","神戸","高知","郡山"],
  さ: ["佐賀","佐世保","堺","相模","相模原","札幌"],
  し: ["滋賀","下関","庄内","知床","品川","島根","静岡"],
  す: ["諏訪","鈴鹿","杉並"],
  せ: ["世田谷","仙台"],
  そ: ["袖ヶ浦"],
  た: ["高崎","高松","多摩","高槻"],
  ち: ["千葉","千代田","筑豊"],
  つ: ["つくば","土浦","鶴見"],
  と: ["十勝","徳島","とちぎ","苫小牧","豊田","豊橋","所沢","鳥取","富山"],
  な: ["長岡","長崎","長野","名古屋","なにわ","奈良","那須","那覇","成田","習志野"],
  に: ["新潟","西宮","日光"],
  ぬ: ["沼津"],
  ね: ["練馬"],
  の: ["野田"],
  は: ["八王子","八戸","函館","浜松"],
  ひ: ["東大阪","飛騨","弘前","広島","姫路","平泉"],
  ふ: ["福井","福岡","福島","福山","富士","富士山","府中","船橋"],
  ま: ["前橋","町田","松江","松戸","松山","松本"],
  み: ["三河","三重","宮城","宮崎","宮古","水戸","南大阪","南信州"],
  む: ["室蘭","武蔵野","武蔵府中"],
  め: ["目黒"],
  も: ["盛岡","茂原"],
  や: ["八尾","八重山","山形","山口","山梨"],
  よ: ["横須賀","横浜","米子","四日市"],
  ら: [], り: [], る: [], れ: [], ろ: [],
  わ: ["和歌山"],
  を: [], ん: [],
};

// 五十音表: 左から右へ（あ行が上、わ行が下）
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

  const regionList: string[] = selectedKana ? (REGION_MAP[selectedKana] ?? []) : [];

  function selectRegion(region: string) {
    setKioskSession({ plate: { ...session.plate, region } });
    router.push("/kiosk/plate/classnum");
  }

  const GAP = 8;
  const BTN_SIZE = 96;

  return (
    <div
      className="w-screen h-screen flex flex-col select-none overflow-hidden"
      style={{ background: "#F5F0E8" }}
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
            地名の最初の文字をタッチ
          </p>

          {/* カーナビ方式グリッド */}
          <div className="flex flex-col" style={{ gap: GAP }}>
            {HIRA_ROWS.map((row, ri) => (
              <div key={ri} className="flex" style={{ gap: GAP }}>
                {row.map((kana, ci) => {
                  if (kana === null) {
                    return <div key={ci} style={{ width: BTN_SIZE, height: BTN_SIZE }} />;
                  }
                  const hasItems = (REGION_MAP[kana] ?? []).length > 0;
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
                        border: isSelected ? "3px solid" : "3px solid",
                        borderColor: isSelected ? "#1d4ed8" : hasItems ? "#e5e7eb" : "#e5e7eb",
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

        {/* 右カラム: 地名リスト（残り全幅） */}
        <div className="flex-1 flex flex-col px-6 py-5 overflow-y-auto" style={{ background: "rgba(255,255,255,0.6)" }}>
          {!selectedKana ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-3xl text-gray-400 font-bold text-center leading-relaxed">
                ← 地名の最初のひと文字を選んでください
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
                    key={r}
                    onPointerDown={() => selectRegion(r)}
                    className="bg-white border-4 border-gray-300 rounded-2xl font-bold text-gray-900
                               active:bg-green-100 active:border-green-500 transition-all duration-75
                               flex items-center justify-center shadow-sm"
                    style={{ height: 180, fontSize: 40 }}
                  >
                    {r}
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
