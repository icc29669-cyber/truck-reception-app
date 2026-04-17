"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getKioskSession, setKioskSession } from "@/lib/kioskState";
import { detectPlateColor, COLOR_CONFIG } from "@/components/PlateDisplay";
import { formatPlate } from "@/types/reception";
import { deleteCandidate as apiDeleteCandidate } from "@/lib/api";
import type { VehicleCandidate, PlateInput } from "@/types/reception";

type Mode = "select" | "confirm" | "input";
type PlateSection = "region" | "classNum" | "hira" | "number";

/* ━━ ステップインジケーター ━━ */
function StepDots({ current }: { current: number }) {
  const labels = ["電話番号", "お名前", "車　両", "最終確認"];
  return (
    <div className="flex items-center gap-4">
      {labels.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <div key={i} className="flex items-center gap-4">
            <div className="flex flex-col items-center" style={{ minWidth: 72 }}>
              <div style={{
                width: 52, height: 52, borderRadius: "50%",
                background: done ? "#4ade80" : active ? "#fff" : "rgba(255,255,255,0.25)",
                border: `3px solid ${done ? "#4ade80" : active ? "#fff" : "rgba(255,255,255,0.4)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, fontWeight: 900,
                color: done ? "#0f766e" : active ? "#1e3a6b" : "rgba(255,255,255,0.5)",
              }}>
                {done ? "✓" : step}
              </div>
              <span style={{
                fontSize: 15, fontWeight: 700, marginTop: 4,
                color: active ? "#fff" : done ? "#bbf7d0" : "rgba(255,255,255,0.4)",
                whiteSpace: "nowrap",
              }}>{label}</span>
            </div>
            {i < labels.length - 1 && (
              <div style={{
                width: 56, height: 3,
                background: done ? "#4ade80" : "rgba(255,255,255,0.2)",
                borderRadius: 2,
                marginBottom: 20,
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ━━ プレート表示（小型） ━━ */
function MiniPlate({ plate, size = "md" }: { plate: PlateInput; size?: "sm" | "md" | "lg" }) {
  const color = detectPlateColor(plate.classNum, plate.hira);
  const { bg, text, dim, border } = COLOR_CONFIG[color];
  const pf = '"Hiragino Kaku Gothic ProN","Meiryo","MS Gothic",Arial,sans-serif';
  const dims = size === "sm" ? { w: 200, h: 100, r: 36, c: 18, n: 42 }
             : size === "lg" ? { w: 480, h: 240, r: 52, c: 24, n: 90 }
             : { w: 320, h: 160, r: 42, c: 20, n: 64 };
  const { w, h, r, c, n } = dims;
  const len = plate.number.length;
  return (
    <div style={{
      width: w, height: h, background: bg, border: `4px solid ${border}`,
      borderRadius: 10, display: "flex", flexDirection: "column",
      padding: "6px 14px 8px", boxSizing: "border-box", userSelect: "none",
      boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <span style={{ fontSize: c, fontWeight: 900, fontFamily: pf, color: plate.region ? text : dim }}>
          {plate.region || "地名"}
        </span>
        <span style={{ fontSize: c, fontWeight: 900, fontFamily: pf, letterSpacing: 2, color: plate.classNum ? text : dim }}>
          {plate.classNum || "・・・"}
        </span>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", position: "relative" }}>
        <span style={{ position: "absolute", left: 0, fontSize: r, fontWeight: 900, fontFamily: pf, color: plate.hira ? text : dim, lineHeight: 1 }}>
          {plate.hira || "あ"}
        </span>
        <span style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          paddingLeft: r + 4, fontSize: n, color: plate.number ? text : dim,
          transform: "scaleX(0.85)", transformOrigin: "center", fontFamily: pf, fontWeight: 900,
        }}>
          {[0, 1, 2, 3].map(pos => {
            const hasDigit = pos >= (4 - len);
            const ch = hasDigit ? plate.number[pos - (4 - len)] : null;
            return (
              <span key={pos} style={{ display: "inline-flex", alignItems: "center" }}>
                {pos === 2 && <span style={{ visibility: len >= 3 ? "visible" : "hidden" }}>-</span>}
                {ch !== null ? <span style={{ display: "inline-block", width: "0.6em", textAlign: "center" }}>{ch}</span> : <span style={{ display: "inline-block", width: "0.6em", textAlign: "center", opacity: 0.35 }}>・</span>}
              </span>
            );
          })}
        </span>
      </div>
    </div>
  );
}

/* ━━ 候補選択カード ━━ */
function VehicleCard({
  candidate, isFirst, onSelect, onDelete,
}: {
  candidate: VehicleCandidate;
  isFirst: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <div className="w-full flex items-center gap-3">
      <button
        onPointerDown={() => { setPressed(true); onSelect(); }}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        className="flex-1 flex items-center text-left select-none touch-none transition-all duration-75"
        style={{
          height: 140, borderRadius: 22,
          background: pressed ? "#EFF6FF" : "#fff",
          border: `2px solid ${pressed ? "#1565C0" : "#D1D5DB"}`,
          boxShadow: pressed ? "0 2px 8px rgba(21,101,192,0.18)" : "0 4px 14px rgba(0,0,0,0.09)",
          borderLeft: isFirst ? "6px solid #0d9488" : undefined,
          paddingLeft: isFirst ? 26 : 32,
          paddingRight: 28,
        }}
      >
        {/* プレート */}
        <div className="flex-shrink-0 mr-8">
          <MiniPlate plate={candidate.plate} size="sm" />
        </div>

        {/* テキスト情報 */}
        <div className="flex flex-col flex-1">
          <span style={{ fontSize: 32, fontWeight: 900, color: "#26251e", letterSpacing: "0.06em" }}>
            {formatPlate(candidate.plate) || candidate.vehicleNumber}
          </span>
          <span style={{ fontSize: 28, fontWeight: 600, color: "#6B7280", marginTop: 6 }}>
            最大積載量　{candidate.maxLoad ? Number(candidate.maxLoad).toLocaleString() + " kg" : "未登録"}
          </span>
        </div>

        {/* 最近バッジ */}
        {isFirst && (
          <span style={{
            fontSize: 20, fontWeight: 800, background: "#dcfce7",
            color: "#0f766e", borderRadius: 8, padding: "4px 14px",
            marginRight: 20, flexShrink: 0,
        }}>最近</span>
      )}

        {/* 矢印 */}
        <span style={{ fontSize: 36, color: "#9CA3AF", flexShrink: 0 }}>▶</span>
      </button>

      {/* 削除ボタン */}
      <button
        onPointerDown={(e) => { e.stopPropagation(); onDelete(); }}
        className="flex items-center justify-center select-none touch-none active:scale-95 transition-transform flex-shrink-0"
        style={{
          width: 100, height: 60, borderRadius: 14,
          background: "#FEE2E2", border: "2px solid #FECACA",
          color: "#DC2626", fontSize: 22, fontWeight: 800,
        }}
      >
        削除
      </button>
    </div>
  );
}

/* ━━ 定数 ━━ */
const REGION_MAP: Record<string, string[]> = {
  あ: ["会津","足立","厚木","旭川","安曇野","青森","秋田","奄美"],
  い: ["いわき","一宮","伊勢志摩","伊豆","石川","出雲","市川","市原","板橋","岩手","茨城","和泉"],
  う: ["宇都宮","宇部"], え: ["江戸川"],
  お: ["帯広","岡崎","岡山","小山","大宮","大分","大阪","沖縄","尾張小牧"],
  か: ["加古川","香川","葛飾","鹿児島","柏","春日井","春日部","川越","川口","川崎","金沢"],
  き: ["京都","岐阜","北九州","北見","木更津"],
  く: ["釧路","久留米","熊谷","熊本","倉敷"],
  こ: ["江東","越谷","甲府","古河","神戸","高知","郡山"],
  さ: ["佐賀","佐世保","堺","相模","相模原","札幌"],
  し: ["滋賀","下関","庄内","知床","品川","島根","静岡"],
  す: ["諏訪","鈴鹿","杉並"], せ: ["世田谷","仙台"], そ: ["袖ヶ浦"],
  た: ["高崎","高松","多摩","高槻"], ち: ["千葉","千代田","筑豊"],
  つ: ["つくば","土浦","鶴見"],
  と: ["十勝","徳島","とちぎ","苫小牧","豊田","豊橋","所沢","鳥取","富山"],
  な: ["長岡","長崎","長野","名古屋","なにわ","奈良","那須","那覇","成田","習志野"],
  に: ["新潟","西宮","日光"], ぬ: ["沼津"], ね: ["練馬"], の: ["野田"],
  は: ["八王子","八戸","函館","浜松"],
  ひ: ["東大阪","飛騨","弘前","広島","姫路","平泉"],
  ふ: ["福井","福岡","福島","福山","富士","富士山","府中","船橋"],
  ま: ["前橋","町田","松江","松戸","松山","松本"],
  み: ["三河","三重","宮城","宮崎","宮古","水戸","南大阪","南信州"],
  む: ["室蘭","武蔵野","武蔵府中"], め: ["目黒"], も: ["盛岡","茂原"],
  や: ["八尾","八重山","山形","山口","山梨"],
  よ: ["横須賀","横浜","米子","四日市"],
  ら: [],り: [],る: [],れ: [],ろ: [], わ: ["和歌山"], を: [], ん: [],
};
const KANA_ROWS: (string | null)[][] = [
  ["わ","ら","や","ま","は","な","た","さ","か","あ"],
  ["を","り",null,"み","ひ","に","ち","し","き","い"],
  ["ん","る","ゆ","む","ふ","ぬ","つ","す","く","う"],
  [null,"れ",null,"め","へ","ね","て","せ","け","え"],
  [null,"ろ","よ","も","ほ","の","と","そ","こ","お"],
];
const HIRA_UNUSABLE = new Set(["し","へ","ん","お"]);
const HIRA_JIGYOYO = new Set(["あ","い","う","え","か","き","く","け","こ","を"]);
const HIRA_RENTAL  = new Set(["わ","れ"]);
const ALPHA_KEYS   = ["A","C","F","H","K","L","M","P","X","Y"];

// ひらがな列カラー（KatakanaKeyboard と同じ配色）
const HIRA_COL_COLORS = [
  { bg: "#FFFFFF", border: "#D1D5DB", shadow: "#9E9E9E" }, // わ行
  { bg: "#EFF6FF", border: "#BFDBFE", shadow: "#93C5FD" }, // ら行
  { bg: "#FFFFFF", border: "#D1D5DB", shadow: "#9E9E9E" }, // や行
  { bg: "#EFF6FF", border: "#BFDBFE", shadow: "#93C5FD" }, // ま行
  { bg: "#FFFFFF", border: "#D1D5DB", shadow: "#9E9E9E" }, // は行
  { bg: "#EFF6FF", border: "#BFDBFE", shadow: "#93C5FD" }, // な行
  { bg: "#FFFFFF", border: "#D1D5DB", shadow: "#9E9E9E" }, // た行
  { bg: "#EFF6FF", border: "#BFDBFE", shadow: "#93C5FD" }, // さ行
  { bg: "#FFFFFF", border: "#D1D5DB", shadow: "#9E9E9E" }, // か行
  { bg: "#EFF6FF", border: "#BFDBFE", shadow: "#93C5FD" }, // あ行
];
const HIRA_COL_LABELS = ["わ","ら","や","ま","は","な","た","さ","か","あ"];
const HIRA_HINTS = [
  { place: "所沢", hira: "と" },
  { place: "横浜", hira: "よ" },
  { place: "神戸", hira: "こ" },
  { place: "名古屋", hira: "な" },
  { place: "浦和", hira: "う" },
  { place: "大阪", hira: "お" },
  { place: "品川", hira: "し" },
  { place: "多摩", hira: "た" },
];

/* ━━ メインページ ━━ */
export default function VehiclePage() {
  const router = useRouter();
  const initRef = useRef(false);

  const [mode, setMode] = useState<Mode>("select");
  const [candidates, setCandidates] = useState<VehicleCandidate[]>([]);
  const [confirmTarget, setConfirmTarget] = useState<VehicleCandidate | null>(null);
  const [plate, setPlate] = useState<PlateInput>({ region: "", classNum: "", hira: "", number: "" });
  const [maxLoad, setMaxLoad] = useState("");
  const [inputStep, setInputStep] = useState<"plate" | "maxload">("plate");
  const [plateSection, setPlateSection] = useState<PlateSection>("region");
  const [kanaFilter, setKanaFilter] = useState<string | null>(null);
  const [alphaMode, setAlphaMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [fromFinal, setFromFinal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<VehicleCandidate | null>(null);

  function handleSectionChange(s: PlateSection) {
    setPlateSection(s);
    setAlphaMode(false);
    if (s !== "region") setKanaFilter(null);
  }

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const params = new URLSearchParams(window.location.search);
    const fromParam = params.get("from");
    const sectionParam = params.get("section");
    const isFromFinal = fromParam === "final-confirm";
    setFromFinal(isFromFinal);

    const s = getKioskSession();
    // セッションに電話番号がなければトップに戻す
    if (!s.phone && !isFromFinal) {
      router.replace("/kiosk");
      return;
    }
    setCandidates(s.vehicleCandidates ?? []);
    const p = s.plate ?? { region: "", classNum: "", hira: "", number: "" };
    setPlate(p);
    setMaxLoad(s.driverInput?.maxLoad ?? "");

    if (isFromFinal && sectionParam) {
      setMode("input");
      if (sectionParam === "maxload") {
        setInputStep("maxload");
        setPlateSection("region");
      } else if (["region", "classNum", "hira", "number"].includes(sectionParam)) {
        setInputStep("plate");
        setPlateSection(sectionParam as PlateSection);
        // 分類番号・車番は打ち替え（既存値クリア）
        if (sectionParam === "classNum") {
          p.classNum = "";
          setPlate({ ...p });
          setKioskSession({ plate: { ...p } });
        } else if (sectionParam === "number") {
          p.number = "";
          setPlate({ ...p });
          setKioskSession({ plate: { ...p } });
        }
      } else {
        setPlateSection(!p.region ? "region" : !p.classNum ? "classNum" : !p.hira ? "hira" : "number");
      }
    } else {
      setPlateSection(!p.region ? "region" : !p.classNum ? "classNum" : !p.hira ? "hira" : "number");
      const n = s.vehicleCandidates?.length ?? 0;
      if (n === 0) {
        setMode("input");
      } else {
        // 1件でも必ず選択画面を表示（自動スキップしない）
        setMode("select");
      }
    }
    setMounted(true);
  }, []);

  async function confirmDelete() {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    setDeleteTarget(null); // 即座にモーダルを閉じて二重タップ防止
    try {
      await apiDeleteCandidate("vehicle", targetId);
    } catch {
      // API失敗しても UI 上は削除を反映（次回起動時に復活する可能性あり）
    }
    const updated = candidates.filter((c) => c.id !== targetId);
    setCandidates(updated);
    setKioskSession({ vehicleCandidates: updated });
    if (updated.length === 0) {
      setMode("input");
    }
  }

  function selectCandidate(c: VehicleCandidate) {
    const s = getKioskSession();
    setKioskSession({
      selectedVehicle: c,
      plate: c.plate,
      driverInput: { ...s.driverInput, maxLoad: c.maxLoad },
    });
    router.push("/kiosk/final-confirm");
  }

  function savePlate(partial: Partial<PlateInput>) {
    const next = { ...plate, ...partial };
    setPlate(next);
    setKioskSession({ plate: next });
  }

  function saveMaxLoad(v: string) {
    if (v.length > 6) return;
    setMaxLoad(v);
    const s = getKioskSession();
    setKioskSession({ driverInput: { ...s.driverInput, maxLoad: v } });
  }

  function submitInput() {
    const s = getKioskSession();
    setKioskSession({
      selectedVehicle: null,
      plate,
      driverInput: { ...s.driverInput, maxLoad },
    });
    router.push("/kiosk/final-confirm");
  }

  const bgStyle = "#f2f1ed";

  if (!mounted) return <div className="w-screen h-screen" style={{ background: "#f2f1ed" }} />;

  return (
    <div className="w-screen h-screen flex flex-col select-none overflow-hidden" style={{ background: bgStyle }}>

      {/* ━━ ヘッダー（TOP同様の薄いバー）━━ */}
      <div className="flex items-center px-8 gap-6 flex-shrink-0"
        style={{ background: "#1a3a6b", height: 88 }}>
        <button
          onPointerDown={() => router.push(fromFinal ? "/kiosk/final-confirm" : "/kiosk/person")}
          className="flex items-center justify-center font-bold rounded-xl border-2 border-white text-white active:bg-blue-800 flex-shrink-0"
          style={{ height: 60, width: 160, fontSize: 28 }}
        >◀ 戻る</button>
        <div style={{ flex: 1 }} />
        <StepDots current={3} />
      </div>

      {/* ━━ プレート入力モード ━━ */}
      {mode === "input" && inputStep === "plate" && (() => {
        const color = detectPlateColor(plate.classNum, plate.hira);
        const { bg, text, dim, border } = COLOR_CONFIG[color];
        const pf = '"Hiragino Kaku Gothic ProN","Meiryo","MS Gothic",Arial,sans-serif';
        const len = plate.number.length;
        const hl = (s: PlateSection): React.CSSProperties => plateSection === s
          ? { boxShadow: "inset 0 0 0 3px #FFE600, 0 0 8px 2px rgba(255,230,0,0.3)", borderRadius: 8, background: "rgba(255,230,0,0.15)", cursor: "pointer" }
          : { borderRadius: 6, cursor: "pointer" };

        const sectionNum = plateSection === "region" ? "①" : plateSection === "classNum" ? "②" : plateSection === "hira" ? "③" : "④";
        const instruction =
          plateSection === "region" ? "地名の読みの最初の文字を選んでください" :
          plateSection === "classNum" ? "分類番号（3桁の数字）を入力してください" :
          plateSection === "hira" ? "ひらがなを選んでください" :
          "一連番号（4桁の数字）を入力してください";

        return (
          <>
            {/* サブヘッダー：左にSTEP、中央に大きな指示 */}
            <div className="flex items-center flex-shrink-0" style={{ padding: "10px 40px 12px", gap: 20, position: "relative" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 14, position: "absolute", left: 40 }}>
                <div style={{
                  fontSize: 13, color: "#64748B", letterSpacing: "0.22em", fontWeight: 800,
                  padding: "4px 10px", background: "#E2E8F0", borderRadius: 4,
                }}>
                  STEP 3 / 4
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#26251e", letterSpacing: "0.04em" }}>
                  ナンバープレート
                </div>
              </div>
              {/* 中央に大きな指示 */}
              <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                <div style={{
                  fontSize: 26, fontWeight: 900, color: "#0D9488", letterSpacing: "0.04em",
                  display: "flex", alignItems: "center", gap: 14,
                  background: "#F0FDFA", padding: "12px 28px", borderRadius: 14,
                  border: "3px solid #5EEAD4",
                  boxShadow: "0 4px 12px rgba(13,148,136,0.12)",
                }}>
                  <span style={{
                    fontSize: 26, fontWeight: 900, color: "#fff",
                    background: "#0D9488", borderRadius: "50%",
                    width: 40, height: 40, display: "flex",
                    alignItems: "center", justifyContent: "center",
                  }}>{sectionNum}</span>
                  {instruction}
                </div>
              </div>
            </div>

            <div className="flex flex-shrink-0" style={{ padding: "0 40px 8px", gap: 24, alignItems: "flex-start", justifyContent: "center" }}>
            {/* 中央：プレート */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              {/* プレート */}
              <div style={{ width: 520, height: 220, background: bg, border: `5px solid ${border}`, borderRadius: 14, display: "flex", flexDirection: "column", padding: "8px 18px 10px", boxSizing: "border-box", boxShadow: "0 6px 24px rgba(0,0,0,0.35)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  <div onPointerDown={() => handleSectionChange("region")} style={hl("region")}>
                    <span style={{ fontSize: 40, fontWeight: 900, fontFamily: pf, color: plate.region ? text : dim, padding: "0 6px", display: "block" }}>{plate.region || "地名"}</span>
                  </div>
                  <div onPointerDown={() => handleSectionChange("classNum")} style={{ minWidth: 132, textAlign: "center", ...hl("classNum") }}>
                    <span style={{ fontSize: 40, fontWeight: 900, fontFamily: pf, letterSpacing: 3, color: plate.classNum ? text : dim, padding: "0 6px", display: "block" }}>{plate.classNum || "・・・"}</span>
                  </div>
                </div>
                <div style={{ flex: 1, display: "flex", alignItems: "center", position: "relative" }}>
                  <div onPointerDown={() => handleSectionChange("hira")} style={{ position: "absolute", left: 4, ...hl("hira") }}>
                    <span style={{ fontSize: 58, fontWeight: 900, fontFamily: pf, color: plate.hira ? text : dim, lineHeight: 1, display: "block" }}>{plate.hira || "あ"}</span>
                  </div>
                  <div onPointerDown={() => handleSectionChange("number")} style={{ flex: 1, marginLeft: 72, display: "flex", alignItems: "center", justifyContent: "center", transform: "scaleX(0.85)", transformOrigin: "center", alignSelf: "center", overflow: "hidden", ...hl("number") }}>
                    <span style={{ fontSize: 104, color: plate.number ? text : dim, fontFamily: pf, fontWeight: 900, display: "flex", alignItems: "center", lineHeight: 1 }}>
                      {[0,1,2,3].map(pos => {
                        const hasDigit = pos >= (4 - len);
                        const ch = hasDigit ? plate.number[pos - (4 - len)] : null;
                        return (
                          <span key={pos} style={{ display: "inline-flex", alignItems: "center" }}>
                            {pos === 2 && <span style={{ visibility: len >= 3 ? "visible" : "hidden" }}>-</span>}
                            {ch !== null ? <span style={{ display: "inline-block", width: "0.6em", textAlign: "center" }}>{ch}</span> : <span style={{ display: "inline-block", width: "0.6em", textAlign: "center", opacity: 0.35 }}>・</span>}
                          </span>
                        );
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </>
        );
      })()}

      {/* ━━ 選択・確認モードのタイトル ━━ */}
      {mode !== "input" && (
        <div className="flex flex-col items-center flex-shrink-0" style={{ padding: "20px 0 16px" }}>
          <span style={{ fontSize: 44, fontWeight: 800, color: "#26251e", letterSpacing: "0.08em" }}>
            {mode === "select" ? "ご使用の車両を選んでください" : "車両の確認"}
          </span>
        </div>
      )}

      {/* ━━ 積載量入力モード ━━ */}
      {mode === "input" && inputStep === "maxload" && (
        <>
          <div className="flex items-center flex-shrink-0" style={{ padding: "10px 40px 12px", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, position: "absolute", left: 40 }}>
              <div style={{
                fontSize: 13, color: "#64748B", letterSpacing: "0.22em", fontWeight: 800,
                padding: "4px 10px", background: "#E2E8F0", borderRadius: 4,
              }}>
                STEP 3 / 4
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#26251e", letterSpacing: "0.04em" }}>
                最大積載量
              </div>
            </div>
            <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
              <div style={{
                fontSize: 26, fontWeight: 900, color: "#0D9488", letterSpacing: "0.04em",
                display: "flex", alignItems: "center", gap: 14,
                background: "#F0FDFA", padding: "12px 28px", borderRadius: 14,
                border: "3px solid #5EEAD4",
                boxShadow: "0 4px 12px rgba(13,148,136,0.12)",
              }}>
                <span style={{ fontSize: 28 }}>👉</span>最大積載量を数字で入力してください（kg）
              </div>
            </div>
          </div>
          <div className="flex justify-center flex-shrink-0" style={{ padding: "0 40px 12px" }}>
            <div className="rounded-2xl border-4 flex items-center px-8" style={{ width: 620, height: 84, borderColor: maxLoad ? "#F59E0B" : "#CBD5E1", background: "#FFFFFF", justifyContent: "flex-end" }}>
              <span style={{ fontSize: 50, fontWeight: 900, color: maxLoad ? "#26251e" : "#94a3b8" }}>
                {maxLoad ? `${Number(maxLoad).toLocaleString()} kg` : "（未入力）"}
              </span>
            </div>
          </div>
        </>
      )}

      {/* ━━ メインコンテンツ ━━ */}
      <div className="flex-1 overflow-hidden">

        {/* ── 選択モード ── */}
        {mode === "select" && (
          <div className="h-full flex flex-col px-10 pt-8 pb-6 gap-4 overflow-y-auto">
            <p style={{ fontSize: 28, fontWeight: 600, color: "#374151", flexShrink: 0 }}>
              以前ご使用の車両記録が見つかりました。今回ご使用の車両をタップしてください。
            </p>
            <div className="flex flex-col gap-4 flex-shrink-0">
              {candidates.slice(0, 4).map((c, i) => (
                <VehicleCard key={c.id} candidate={c} isFirst={i === 0} onSelect={() => selectCandidate(c)} onDelete={() => setDeleteTarget(c)} />
              ))}
              {/* 新しく入力するカード（車両カードと同じサイズ） */}
              <div className="w-full flex items-center gap-3">
                <button
                  onPointerDown={() => setMode("input")}
                  className="flex-1 flex items-center justify-center gap-4 font-bold select-none touch-none transition-all duration-75 active:bg-blue-50"
                  style={{
                    height: 140, borderRadius: 22,
                    background: "rgba(255,255,255,0.7)",
                    border: "3px dashed #1565C0",
                    color: "#1565C0",
                    fontSize: 32,
                    boxShadow: "0 4px 14px rgba(21,101,192,0.08)",
                  }}
                >
                  <span style={{ fontSize: 42 }}>＋</span>
                  新しく入力する
                </button>
                {/* 削除ボタンの幅と合わせる（ダミースペース） */}
                <div style={{ width: 100, flexShrink: 0 }} />
              </div>
            </div>
          </div>
        )}

        {/* ── 確認モード（候補1件）── */}
        {mode === "confirm" && confirmTarget && (
          <div className="h-full flex flex-col items-center justify-center px-10 gap-8">
            <div style={{
              width: 1200, borderRadius: 22,
              border: "3px solid #0d9488", background: "#fff",
              boxShadow: "0 12px 48px rgba(0,0,0,0.14)", overflow: "hidden",
            }}>
              <div style={{
                background: "linear-gradient(90deg,#0f766e,#0d9488)",
                padding: "20px 40px", display: "flex", alignItems: "center", gap: 16,
              }}>
                <span style={{ fontSize: 36, color: "#fff" }}>✓</span>
                <span style={{ fontSize: 32, fontWeight: 800, color: "#fff" }}>
                  以前ご使用の車両記録があります
                </span>
              </div>
              <div style={{ padding: "32px 48px", display: "flex", alignItems: "center", gap: 48 }}>
                <MiniPlate plate={confirmTarget.plate} size="md" />
                <div className="flex flex-col gap-4">
                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <span style={{ fontSize: 22, fontWeight: 600, color: "#9CA3AF", width: 200 }}>車番</span>
                    <span style={{ fontSize: 40, fontWeight: 900, color: "#26251e" }}>
                      {formatPlate(confirmTarget.plate) || confirmTarget.vehicleNumber}
                    </span>
                  </div>
                  <div style={{ height: 1, background: "#E5E7EB" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <span style={{ fontSize: 22, fontWeight: 600, color: "#9CA3AF", width: 200 }}>最大積載量</span>
                    <span style={{ fontSize: 40, fontWeight: 900, color: "#26251e" }}>
                      {confirmTarget.maxLoad ? Number(confirmTarget.maxLoad).toLocaleString() + " kg" : "未登録"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-8" style={{ width: 1200 }}>
              <button
                onPointerDown={() => selectCandidate(confirmTarget)}
                className="flex-1 flex items-center justify-center gap-4 font-black rounded-2xl text-white active:brightness-90 select-none touch-none"
                style={{
                  height: 120, fontSize: 42,
                  background: "linear-gradient(180deg,#0d9488,#0f766e)",
                  boxShadow: "0 6px 0 #0f766e, 0 8px 24px rgba(13,148,136,0.4)",
                }}
              >
                <span style={{ fontSize: 46 }}>✓</span>
                はい、この車両で続けます
              </button>
              <button
                onPointerDown={() => setMode("input")}
                className="flex items-center justify-center gap-3 font-bold rounded-2xl active:bg-red-50 select-none touch-none"
                style={{ height: 120, minWidth: 380, fontSize: 32, border: "3px solid #DC2626", background: "#fff", color: "#DC2626", boxShadow: "0 4px 12px rgba(220,38,38,0.15)" }}
              >
                <span style={{ fontSize: 36 }}>✎</span>
                違います・修正する
              </button>
            </div>
          </div>
        )}

        {/* ── 入力モード：プレート ── */}
        {mode === "input" && inputStep === "plate" && (() => {
          const sectionLabels: Record<PlateSection, string> = { region: "① 地名", classNum: "② 分類番号", hira: "③ ひらがな", number: "④ 4桁番号" };
          const sectionColors: Record<PlateSection, string> = { region: "#1565C0", classNum: "#BF360C", hira: "#4A148C", number: "#1B5E20" };
          const numBtnStyle = "flex items-center justify-center font-black rounded-xl border-2 border-gray-200 bg-white text-gray-900 active:bg-gray-100 shadow-[0_4px_0_#BDBDBD] active:shadow-[0_1px_0_#BDBDBD] active:translate-y-[3px] transition-all duration-75 select-none touch-none";
          const plateFilled = !!(plate.region && plate.classNum && plate.hira && plate.number.length >= 1);
          return (
            <div className="h-full flex flex-col overflow-hidden">
              {/* Colored section banner */}
              <div className="flex items-center px-10 flex-shrink-0" style={{ height: 72, background: sectionColors[plateSection], boxShadow: "0 4px 0 rgba(0,0,0,0.2)" }}>
                <span style={{ fontSize: 34, fontWeight: 900, color: "#fff" }}>{sectionLabels[plateSection]}</span>
                {plateSection === "classNum" && (
                  <button onPointerDown={() => setAlphaMode(!alphaMode)} className="ml-auto flex items-center justify-center font-bold rounded-xl border-2 select-none touch-none" style={{ height: 52, padding: "0 28px", fontSize: 24, background: alphaMode ? "#fff" : "rgba(255,255,255,0.2)", borderColor: alphaMode ? "#BF360C" : "rgba(255,255,255,0.5)", color: alphaMode ? "#BF360C" : "#fff" }}>
                    {alphaMode ? "数字に切替" : "英字を入力"}
                  </button>
                )}
              </div>
              {/* Section content */}
              <div className="flex-1 overflow-hidden px-8 py-4">
                {/* 地名 */}
                {plateSection === "region" && (kanaFilter === null ? (
                  <div>
                    <p style={{ fontSize: 24, fontWeight: 700, color: "#475569", marginBottom: 10 }}>頭文字を選んでください</p>
                    <div className="flex flex-col" style={{ gap: 8 }}>
                      {KANA_ROWS.map((row, ri) => (
                        <div key={ri} className="flex" style={{ gap: 8 }}>
                          {row.map((k, ci) => {
                            if (k === null) return <div key={ci} style={{ width: 180, height: 100, flexShrink: 0 }} />;
                            const col = HIRA_COL_COLORS[ci];
                            const isTopRow = ri === 0;
                            return (
                              <button
                                key={ci}
                                onPointerDown={() => setKanaFilter(k)}
                                className="flex items-center justify-center font-bold rounded-xl border-2 transition-all active:translate-y-[3px] select-none touch-none"
                                style={{
                                  width: 180, height: 100, fontSize: 42, flexShrink: 0,
                                  background: col.bg,
                                  borderColor: col.border,
                                  boxShadow: `0 4px 0 ${col.shadow}`,
                                  color: "#26251e",
                                  fontWeight: isTopRow ? 900 : 700,
                                  position: "relative",
                                }}
                              >
                                {k}
                                {isTopRow && (
                                  <span style={{
                                    position: "absolute", top: 3, left: 5,
                                    fontSize: 11, fontWeight: 800, color: "#9CA3AF",
                                    lineHeight: 1, letterSpacing: "0.02em",
                                  }}>{HIRA_COL_LABELS[ci]}行</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <button
                        onPointerDown={() => setKanaFilter(null)}
                        className="flex items-center justify-center font-bold rounded-xl select-none touch-none transition-all active:scale-95"
                        style={{
                          height: 68, padding: "0 28px", fontSize: 22, fontWeight: 800,
                          border: "3px solid #F59E0B",
                          background: "#FFFBEB",
                          color: "#92400E",
                          display: "flex", alignItems: "center", gap: 10,
                        }}
                      >
                        <span style={{ fontSize: 26 }}>◀</span>
                        別の文字を選ぶ
                      </button>
                      <span style={{ fontSize: 26, fontWeight: 700, color: "#475569" }}>
                        「<span style={{ color: "#D97706", fontWeight: 900 }}>{kanaFilter}</span>」から始まる地名
                      </span>
                    </div>
                    <div className="flex flex-wrap" style={{ gap: 14 }}>
                      {(REGION_MAP[kanaFilter] || []).map(r => (
                        <button key={r} onPointerDown={() => { savePlate({ region: r }); setKanaFilter(null); setTimeout(() => fromFinal ? router.push("/kiosk/final-confirm") : handleSectionChange("classNum"), 100); }} className="flex items-center justify-center font-black rounded-xl border-2 border-gray-200 bg-white active:bg-blue-50 shadow-[0_5px_0_#BDBDBD] active:translate-y-[3px] transition-all select-none touch-none" style={{ height: 120, padding: "0 36px", fontSize: 44, minWidth: 190, color: "#26251e" }}>{r}</button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* 分類番号 */}
                {plateSection === "classNum" && (
                  <div className="h-full flex items-center justify-center">
                    {!alphaMode ? (
                      <div className="flex items-stretch" style={{ gap: 20 }}>
                        {/* テンキー */}
                        <div className="flex flex-col" style={{ gap: 16 }}>
                          {[["1","2","3"],["4","5","6"],["7","8","9"]].map((row, ri) => (
                            <div key={ri} className="flex" style={{ gap: 16 }}>{row.map(k => (
                              <button key={k} onPointerDown={() => { if (plate.classNum.length < 3) { const n = plate.classNum + k; savePlate({ classNum: n }); if (n.length === 3) setTimeout(() => fromFinal ? router.push("/kiosk/final-confirm") : handleSectionChange("hira"), 150); } }} className={numBtnStyle} style={{ width: 180, height: 130, fontSize: 56 }}>{k}</button>
                            ))}</div>
                          ))}
                          <button onPointerDown={() => { if (plate.classNum.length < 3) { const n = plate.classNum + "0"; savePlate({ classNum: n }); if (n.length === 3) setTimeout(() => fromFinal ? router.push("/kiosk/final-confirm") : handleSectionChange("hira"), 150); } }} className={numBtnStyle} style={{ width: 572, height: 130, fontSize: 56 }}>0</button>
                        </div>
                        {/* 操作ボタン */}
                        <div className="flex flex-col" style={{ gap: 16 }}>
                          <button onPointerDown={() => savePlate({ classNum: "" })} className="flex items-center justify-center font-bold rounded-xl border-2 border-red-500 bg-red-500 text-white active:bg-red-600 shadow-[0_5px_0_#B91C1C] active:shadow-[0_1px_0_#B91C1C] active:translate-y-[3px] transition-all select-none touch-none" style={{ width: 180, flex: 1, fontSize: 28 }}>全消し</button>
                          <button onPointerDown={() => savePlate({ classNum: plate.classNum.slice(0, -1) })} className="flex items-center justify-center font-bold rounded-xl border-2 border-orange-400 bg-orange-400 text-white active:bg-orange-500 shadow-[0_5px_0_#C2410C] active:shadow-[0_1px_0_#C2410C] active:translate-y-[3px] transition-all select-none touch-none" style={{ width: 180, flex: 1, fontSize: 24, textAlign: "center", lineHeight: 1.3 }}>1文字<br/>消す</button>
                        </div>
                      </div>
                    ) : (
                      /* 英字モード */
                      <div className="flex items-stretch" style={{ gap: 20 }}>
                        <div className="flex flex-wrap" style={{ gap: 16, maxWidth: 940 }}>
                          {ALPHA_KEYS.map(k => (
                            <button key={k} onPointerDown={() => { if (plate.classNum.length < 3) { const n = plate.classNum + k; savePlate({ classNum: n }); if (n.length === 3) setTimeout(() => fromFinal ? router.push("/kiosk/final-confirm") : handleSectionChange("hira"), 150); } }} className={numBtnStyle} style={{ width: 180, height: 130, fontSize: 56, background: "#fefce8", borderColor: "#fde047" }}>{k}</button>
                          ))}
                        </div>
                        <div className="flex flex-col" style={{ gap: 16 }}>
                          <button onPointerDown={() => savePlate({ classNum: "" })} className="flex items-center justify-center font-bold rounded-xl border-2 border-red-500 bg-red-500 text-white active:bg-red-600 shadow-[0_5px_0_#B91C1C] active:translate-y-[3px] transition-all select-none touch-none" style={{ width: 180, height: 130, fontSize: 28 }}>全消し</button>
                          <button onPointerDown={() => savePlate({ classNum: plate.classNum.slice(0, -1) })} className="flex items-center justify-center font-bold rounded-xl border-2 border-orange-400 bg-orange-400 text-white active:bg-orange-500 shadow-[0_5px_0_#C2410C] active:translate-y-[3px] transition-all select-none touch-none" style={{ width: 180, height: 130, fontSize: 24, textAlign: "center", lineHeight: 1.3 }}>1文字<br/>消す</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ひらがな */}
                {plateSection === "hira" && (
                  <div>
                    <div className="flex gap-6 mb-3 flex-wrap" style={{ fontSize: 20, fontWeight: 700 }}>
                      <span style={{ color: "#2563eb" }}>■ 事業用（緑ナンバー）</span>
                      <span style={{ color: "#ea580c" }}>■ レンタカー</span>
                    </div>
                    <div className="flex flex-col" style={{ gap: 8 }}>
                      {KANA_ROWS.map((row, ri) => (
                        <div key={ri} className="flex" style={{ gap: 8 }}>
                          {row.map((k, ci) => {
                            if (k === null || HIRA_UNUSABLE.has(k)) {
                              return <div key={ci} style={{ width: 180, height: 100, flexShrink: 0 }} />;
                            }
                            const jigyoyo = HIRA_JIGYOYO.has(k);
                            const rental = HIRA_RENTAL.has(k);
                            const col = HIRA_COL_COLORS[ci];
                            const isTopRow = ri === 0;
                            const bg = jigyoyo ? "#dbeafe" : rental ? "#ffedd5" : col.bg;
                            const borderColor = jigyoyo ? "#93c5fd" : rental ? "#fb923c" : col.border;
                            const shadow = jigyoyo ? "#93c5fd" : rental ? "#fb923c" : col.shadow;
                            const color = jigyoyo ? "#1d4ed8" : rental ? "#ea580c" : "#26251e";
                            return (
                              <button
                                key={ci}
                                onPointerDown={() => { savePlate({ hira: k }); setTimeout(() => fromFinal ? router.push("/kiosk/final-confirm") : handleSectionChange("number"), 120); }}
                                className="flex items-center justify-center font-bold rounded-xl border-2 transition-all active:translate-y-[3px] select-none touch-none"
                                style={{
                                  width: 180, height: 100, fontSize: 42, flexShrink: 0,
                                  background: bg,
                                  borderColor: borderColor,
                                  boxShadow: `0 4px 0 ${shadow}`,
                                  color: color,
                                  fontWeight: isTopRow ? 900 : 700,
                                  position: "relative",
                                }}
                              >
                                {k}
                                {isTopRow && (
                                  <span style={{
                                    position: "absolute", top: 3, left: 5,
                                    fontSize: 11, fontWeight: 800, color: "#9CA3AF",
                                    lineHeight: 1, letterSpacing: "0.02em",
                                  }}>{HIRA_COL_LABELS[ci]}行</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4桁番号 */}
                {plateSection === "number" && (
                  <div className="h-full flex items-center justify-center">
                    <div className="flex items-stretch" style={{ gap: 20 }}>
                      {/* テンキー */}
                      <div className="flex flex-col" style={{ gap: 16 }}>
                        {[["1","2","3"],["4","5","6"],["7","8","9"]].map((row, ri) => (
                          <div key={ri} className="flex" style={{ gap: 16 }}>{row.map(k => (
                            <button key={k} onPointerDown={() => { if (plate.number.length < 4) savePlate({ number: plate.number + k }); }} className={numBtnStyle} style={{ width: 180, height: 130, fontSize: 56 }}>{k}</button>
                          ))}</div>
                        ))}
                        <button onPointerDown={() => { if (plate.number.length < 4) savePlate({ number: plate.number + "0" }); }} className={numBtnStyle} style={{ width: 572, height: 130, fontSize: 56 }}>0</button>
                      </div>
                      {/* 操作ボタン */}
                      <div className="flex flex-col" style={{ gap: 16 }}>
                        <button onPointerDown={() => savePlate({ number: "" })} className="flex items-center justify-center font-bold rounded-xl border-2 border-red-500 bg-red-500 text-white active:bg-red-600 shadow-[0_5px_0_#B91C1C] active:shadow-[0_1px_0_#B91C1C] active:translate-y-[3px] transition-all select-none touch-none" style={{ width: 200, flex: 1, fontSize: 28 }}>全消し</button>
                        <button onPointerDown={() => savePlate({ number: plate.number.slice(0, -1) })} className="flex items-center justify-center font-bold rounded-xl border-2 border-orange-400 bg-orange-400 text-white active:bg-orange-500 shadow-[0_5px_0_#C2410C] active:shadow-[0_1px_0_#C2410C] active:translate-y-[3px] transition-all select-none touch-none" style={{ width: 200, flex: 1, fontSize: 24, textAlign: "center", lineHeight: 1.3 }}>1文字<br/>消す</button>
                        <button
                          onPointerDown={() => { if (plateFilled) { if (fromFinal) { router.push("/kiosk/final-confirm"); } else { setInputStep("maxload"); } } }}
                          className="flex items-center justify-center font-black rounded-2xl text-white select-none touch-none active:brightness-90"
                          style={{
                            width: 200, flex: 1.5, fontSize: 28,
                            background: plateFilled ? "linear-gradient(180deg,#0d9488,#0f766e)" : "#9CA3AF",
                            boxShadow: plateFilled ? "0 6px 0 #0f766e, 0 8px 24px rgba(13,148,136,0.4)" : "0 4px 0 #6B7280",
                            opacity: plateFilled ? 1 : 0.5,
                            transition: "all 0.2s",
                            textAlign: "center", lineHeight: 1.3,
                          }}
                        >{fromFinal ? <>確定して<br/>戻る ▶</> : <>この車番で<br/>次へ ▶</>}</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── 入力モード：最大積載量 ── */}
        {mode === "input" && inputStep === "maxload" && (
          <div className="h-full flex items-center justify-center gap-6 px-12">
            <div className="flex flex-col gap-4 flex-shrink-0">
              {[["1","2","3"],["4","5","6"],["7","8","9"]].map((row, ri) => (
                <div key={ri} className="flex gap-4">{row.map(k => (
                  <button key={k} onPointerDown={() => { if (maxLoad.length < 6) saveMaxLoad(maxLoad + k); }} className="flex items-center justify-center font-black rounded-xl border-2 border-gray-200 bg-white text-gray-900 active:bg-gray-100 shadow-[0_5px_0_#BDBDBD] active:shadow-[0_1px_0_#BDBDBD] active:translate-y-[3px] transition-all select-none touch-none" style={{ width: 200, height: 144, fontSize: 64 }}>{k}</button>
                ))}</div>
              ))}
              <button onPointerDown={() => { if (maxLoad.length < 6) saveMaxLoad(maxLoad + "0"); }} className="flex items-center justify-center font-black rounded-xl border-2 border-gray-200 bg-white text-gray-900 active:bg-gray-100 shadow-[0_5px_0_#BDBDBD] active:shadow-[0_1px_0_#BDBDBD] active:translate-y-[3px] transition-all select-none touch-none" style={{ width: 624, height: 144, fontSize: 64 }}>0</button>
            </div>
            <div className="flex flex-col gap-4 flex-shrink-0">
              <button onPointerDown={() => saveMaxLoad("")} className="flex items-center justify-center font-bold rounded-xl border-2 border-red-500 bg-red-500 text-white active:bg-red-600 shadow-[0_5px_0_#B91C1C] active:shadow-[0_1px_0_#B91C1C] active:translate-y-[3px] transition-all select-none touch-none" style={{ width: 200, height: 144, fontSize: 28, textAlign: "center", lineHeight: 1.3 }}>すべて<br/>消す</button>
              <button onPointerDown={() => saveMaxLoad(maxLoad.slice(0, -1))} className="flex items-center justify-center font-bold rounded-xl border-2 border-orange-400 bg-orange-400 text-white active:bg-orange-500 shadow-[0_5px_0_#C2410C] active:shadow-[0_1px_0_#C2410C] active:translate-y-[3px] transition-all select-none touch-none" style={{ width: 200, height: 144, fontSize: 28, textAlign: "center", lineHeight: 1.3 }}>1文字<br/>消す</button>
              <button onPointerDown={() => { if (maxLoad) submitInput(); }} className="flex items-center justify-center font-black rounded-2xl text-white active:brightness-90 select-none touch-none" style={{ width: 220, height: 308, fontSize: 52, background: maxLoad ? "linear-gradient(180deg,#0d9488,#0f766e)" : "#9CA3AF", boxShadow: maxLoad ? "0 6px 0 #0f766e, 0 8px 24px rgba(13,148,136,0.4)" : "0 4px 0 #6B7280", opacity: maxLoad ? 1 : 0.6, transition: "all 0.2s" }}>次へ<br/>▶</button>
            </div>
          </div>
        )}

      </div>

      {/* ━━ 削除確認ダイアログ ━━ */}
      {deleteTarget && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onPointerDown={() => setDeleteTarget(null)}
        >
          <div
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 24, padding: "40px 48px",
              boxShadow: "0 12px 48px rgba(0,0,0,0.3)",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 24,
              maxWidth: 600,
            }}
          >
            <span style={{ fontSize: 32, fontWeight: 800, color: "#26251e" }}>
              この車両を削除しますか？
            </span>
            <div style={{
              background: "#F8FAFC", borderRadius: 16, padding: "20px 32px",
              width: "100%", textAlign: "center",
            }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#26251e" }}>
                {formatPlate(deleteTarget.plate) || deleteTarget.vehicleNumber}
              </div>
              <div style={{ fontSize: 20, color: "#64748B", marginTop: 4 }}>
                最大積載量　{deleteTarget.maxLoad ? Number(deleteTarget.maxLoad).toLocaleString() + " kg" : "未登録"}
              </div>
            </div>
            <span style={{ fontSize: 20, color: "#94A3B8" }}>
              次回の受付時に表示されなくなります
            </span>
            <div className="flex gap-4 w-full">
              <button
                onPointerDown={() => setDeleteTarget(null)}
                className="flex-1 flex items-center justify-center select-none touch-none active:scale-95 transition-transform"
                style={{
                  height: 72, borderRadius: 16, fontSize: 28, fontWeight: 700,
                  background: "#F1F5F9", color: "#64748B", border: "2px solid #E2E8F0",
                }}
              >
                キャンセル
              </button>
              <button
                onPointerDown={confirmDelete}
                className="flex-1 flex items-center justify-center select-none touch-none active:scale-95 transition-transform"
                style={{
                  height: 72, borderRadius: 16, fontSize: 28, fontWeight: 800,
                  background: "#DC2626", color: "#fff", border: "none",
                }}
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
