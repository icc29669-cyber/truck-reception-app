"use client";
import VehicleCard, { MULTI_CANDIDATE_CARD_HEIGHT } from "@/components/VehicleCandidateCard";
import VehiclePlateEditor, { type PlateSection } from "@/components/VehiclePlateEditor";
import MaxLoadInput from "@/components/MaxLoadInput";
import KioskSteps from "@/components/KioskSteps";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getKioskSession, setKioskSession } from "@/lib/kioskState";
import { detectPlateColor, COLOR_CONFIG } from "@/components/PlateDisplay";
import { formatPlate } from "@/types/reception";
import { deleteCandidate as apiDeleteCandidate } from "@/lib/api";
import type { VehicleCandidate, PlateInput } from "@/types/reception";

type Mode = "select" | "input";



/* ━━ メインページ ━━ */
export default function VehiclePage() {
  const router = useRouter();
  const initRef = useRef(false);

  const [mode, setMode] = useState<Mode>("select");
  const [candidates, setCandidates] = useState<VehicleCandidate[]>([]);
  const [plate, setPlate] = useState<PlateInput>({ region: "", classNum: "", hira: "", number: "" });
  const [maxLoad, setMaxLoad] = useState("");
  const [inputStep, setInputStep] = useState<"plate" | "maxload">("plate");
  const [plateSection, setPlateSection] = useState<PlateSection>("region");
  const [mounted, setMounted] = useState(false);
  const [fromFinal, setFromFinal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<VehicleCandidate | null>(null);

  function handleSectionChange(s: PlateSection) {
    setPlateSection(s);
  }

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const params = new URLSearchParams(window.location.search);
    const fromParam = params.get("from");
    const sectionParam = params.get("section");
    const isFromFinal = fromParam === "final-confirm";
    // ?back=true: final-confirm の「1つ前に戻る」から来たとき。候補があれば select、なければ region から
    const isBackFromFinal = params.get("back") === "true";
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
      const n = s.vehicleCandidates?.length ?? 0;
      if (n === 0) {
        setMode("input");
        // 候補なし: final-confirm から戻ってきた場合は地名から打ち直し、通常起動は埋まっている続きから
        setPlateSection(
          isBackFromFinal ? "region"
            : !p.region ? "region" : !p.classNum ? "classNum" : !p.hira ? "hira" : "number"
        );
      } else {
        // 候補あり: 必ず選択画面を表示(戻り時も同じ)
        setMode("select");
        setPlateSection(!p.region ? "region" : !p.classNum ? "classNum" : !p.hira ? "hira" : "number");
      }
    }
    setMounted(true);
  }, []);

  async function confirmDelete() {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    setDeleteTarget(null); // 即座にモーダルを閉じて二重タップ防止
    try {
      // phone 所有権チェックのため現在の session.phone を送る
      await apiDeleteCandidate("vehicle", targetId, getKioskSession().phone);
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
  const shownCandidates = candidates.slice(0, 10);
  const roomyCandidates = shownCandidates.length <= 2;

  if (!mounted) return <div className="w-screen h-screen" style={{ background: "#f2f1ed" }} />;

  return (
    <div className="w-screen h-screen flex flex-col select-none overflow-hidden" style={{ background: bgStyle }}>

      {/* ━━ ヘッダー（TOP同様の薄いバー）━━ */}
      <div className="flex items-center px-8 gap-6 flex-shrink-0"
        style={{ background: "#1a3a6b", height: 96 }}>
        <button
          onPointerDown={() => router.push(fromFinal ? "/kiosk/final-confirm" : "/kiosk/person")}
          className="flex items-center justify-center font-bold rounded-xl border-2 border-white text-white active:bg-blue-800 flex-shrink-0"
          style={{ height: 60, width: 240, fontSize: 24 }}
        >◀ {fromFinal ? "最終確認へ戻る" : "お名前へ戻る"}</button>
        <div style={{ flex: 1 }} />
        <KioskSteps current={3} />
      </div>

      {/* ━━ プレート入力モード ━━ */}
      {mode === "input" && inputStep === "plate" && (() => {
        const color = detectPlateColor(plate.classNum, plate.hira);
        const { bg, text, dim, border } = COLOR_CONFIG[color];
        const pf = '"Hiragino Kaku Gothic ProN","Meiryo","MS Gothic",Arial,sans-serif';
        const len = plate.number.length;
        // 黄色プレート(軽自動車)の時は黄色ハイライトが同化するので青/シアン系に切替。
        // それ以外(白/緑/黒)はデフォルトの黄色ハイライトが視認性◎。
        const isYellowPlate = color === "yellow";
        const hlColor = isYellowPlate
          ? { ring: "#2563EB", glow: "rgba(37,99,235,0.35)", fill: "rgba(37,99,235,0.15)" }
          : { ring: "#FFE600", glow: "rgba(255,230,0,0.3)",  fill: "rgba(255,230,0,0.15)" };
        const hl = (s: PlateSection): React.CSSProperties => plateSection === s
          ? { boxShadow: `inset 0 0 0 3px ${hlColor.ring}, 0 0 8px 2px ${hlColor.glow}`, borderRadius: 8, background: hlColor.fill, cursor: "pointer" }
          : { borderRadius: 6, cursor: "pointer" };

        const sectionNum = plateSection === "region" ? "①" : plateSection === "classNum" ? "②" : plateSection === "hira" ? "③" : "④";
        const instruction =
          plateSection === "region" ? "地名の読み仮名の最初の文字を選んでください" :
          plateSection === "classNum" ? "分類番号（3桁の数字）を入力してください" :
          plateSection === "hira" ? "ひらがなを選んでください" :
          "一連番号（4桁の数字）を入力してください";

        return (
          <>
            {/* サブヘッダー：STEPバッジ+大きな見出し */}
            <div className="flex items-center flex-shrink-0" style={{ padding: "20px 40px 16px", gap: 22 }}>
              <div style={{
                fontSize: 16, color: "#64748B", letterSpacing: "0.22em", fontWeight: 800,
                padding: "6px 14px", background: "#E2E8F0", borderRadius: 6,
                flexShrink: 0,
              }}>
                STEP 3 / 4
              </div>
              <div style={{
                fontSize: 36, fontWeight: 900, color: "#26251e", letterSpacing: "0.04em",
                display: "flex", alignItems: "baseline", gap: 14,
              }}>
                <span style={{
                  fontSize: 28, fontWeight: 900, color: "#fff",
                  background: "#0D9488", borderRadius: "50%",
                  width: 48, height: 48, display: "inline-flex",
                  alignItems: "center", justifyContent: "center",
                  alignSelf: "center",
                }}>{sectionNum}</span>
                {instruction.split("を").length > 1 ? (
                  <>
                    {instruction.split("を")[0]}
                    <span style={{ fontSize: 28, color: "#0D9488", fontWeight: 800 }}>
                      を{instruction.split("を").slice(1).join("を")}
                    </span>
                  </>
                ) : instruction}
              </div>
            </div>

            {/* プレートは常に画面中央に配置(セクションが変わっても位置が動かない)。
                region 時のヒントは absolute で右側に浮かせてプレート位置に影響させない */}
            <div className="flex flex-shrink-0" style={{ padding: "0 40px 8px", alignItems: "center", justifyContent: "center", position: "relative" }}>
            {/* 中央：プレート */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
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
            {/* region セクション時のみ、プレート右隣にヒントを絶対配置で表示
                → プレート本体は常にページ中央、classNum/hira/number と同じ位置を保持 */}
            {plateSection === "region" && (
              <div style={{
                position: "absolute",
                right: 200, top: "50%", transform: "translateY(-50%)",
                display: "flex", alignItems: "flex-start", gap: 14,
                padding: "16px 22px", borderRadius: 12,
                background: "#FFFBEB", border: "2px solid #FCD34D",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}>
                {/* 電球アイコンのみ(「ヒント」テキストは削除) */}
                <div style={{ fontSize: 32, lineHeight: 1, paddingTop: 4 }}>💡</div>
                {/* 頭文字を大きな緑で強調 + 残りは小さい灰色で「読み」として補足 */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, color: "#26251e" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                    <span style={{ fontSize: 26, fontWeight: 900 }}>所沢</span>
                    <span style={{ fontSize: 18, color: "#9CA3AF", fontWeight: 700 }}>→</span>
                    <span style={{ fontSize: 40, color: "#0D9488", fontWeight: 900, lineHeight: 1 }}>と</span>
                    <span style={{ fontSize: 16, color: "#9CA3AF", fontWeight: 600 }}>ころざわ</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                    <span style={{ fontSize: 26, fontWeight: 900 }}>富士山</span>
                    <span style={{ fontSize: 18, color: "#9CA3AF", fontWeight: 700 }}>→</span>
                    <span style={{ fontSize: 40, color: "#0D9488", fontWeight: 900, lineHeight: 1 }}>ふ</span>
                    <span style={{ fontSize: 16, color: "#9CA3AF", fontWeight: 600 }}>じさん</span>
                  </div>
                </div>
              </div>
            )}
            </div>
          </>
        );
      })()}

      {/* ━━ 確認モードのみタイトル表示 ━━
          select モード(候補選択)のタイトルは削除。副文(以前ご使用の車両記録が…)で用件が伝わる */}


      {/* ━━ 積載量入力モード ━━ */}
      {mode === "input" && inputStep === "maxload" && (
        <>
          <div className="flex items-center flex-shrink-0" style={{ padding: "20px 40px 18px", gap: 22 }}>
            <div style={{
              fontSize: 16, color: "#64748B", letterSpacing: "0.22em", fontWeight: 800,
              padding: "6px 14px", background: "#E2E8F0", borderRadius: 6,
              flexShrink: 0,
            }}>
              STEP 3 / 4
            </div>
            <div style={{
              fontSize: 40, fontWeight: 900, color: "#26251e", letterSpacing: "0.04em",
              display: "flex", alignItems: "baseline", gap: 14,
            }}>
              最大積載量
              <span style={{ fontSize: 28, color: "#0D9488", fontWeight: 800 }}>
                を数字で入力してください（kg）
              </span>
            </div>
          </div>
          <div className="flex justify-center flex-shrink-0" style={{ padding: "0 40px 12px" }}>
            <div className="rounded-2xl border-4 flex items-center px-8" style={{ width: 620, height: 84, borderColor: maxLoad ? "#F59E0B" : "#CBD5E1", background: "#FFFFFF", justifyContent: "flex-end" }}>
              <span style={{ fontSize: 50, fontWeight: 900, color: maxLoad ? "#26251e" : "#94a3b8" }}>
                {maxLoad ? `${Number(maxLoad).toLocaleString()} kg` : "例: 2,000"}
              </span>
            </div>
          </div>
        </>
      )}

      {/* ━━ メインコンテンツ ━━ */}
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">

        {/* ── 選択モード ── */}
        {mode === "select" && (
          <div className="h-full flex flex-col pb-6">
            {/* STEP バッジ + 案内文(他画面と同じヘッダーパターンで揃える) */}
            <div style={{
              display: "flex", alignItems: "center", flexShrink: 0,
              padding: "20px 40px 18px", gap: 22,
            }}>
              <div style={{
                fontSize: 16, color: "#64748B", letterSpacing: "0.22em", fontWeight: 800,
                padding: "6px 14px", background: "#E2E8F0", borderRadius: 6,
                flexShrink: 0,
              }}>
                STEP 3 / 4
              </div>
              <div style={{
                fontSize: 30, fontWeight: 900, color: "#26251e", letterSpacing: "0.04em",
                lineHeight: 1.25,
              }}>
                以前ご使用の車両記録が見つかりました。今回ご使用の車両をタッチしてください
              </div>
            </div>
            {/* 候補が少ない場合は画面中央で選びやすい大きさにする */}
            <div className="flex-1 min-h-0 overflow-y-auto px-5 lg:px-10">
              <div className={`w-full max-w-[1280px] mx-auto min-h-full flex flex-col justify-center ${roomyCandidates ? "py-3 xl:py-6" : "py-6"}`}>
                <div className={`flex flex-col ${roomyCandidates ? "gap-4 xl:gap-6" : "gap-4"}`}>
                {shownCandidates.map((c, i) => (
                  <VehicleCard key={c.id} candidate={c} isFirst={i === 0} roomy={roomyCandidates} onSelect={() => selectCandidate(c)} onDelete={() => setDeleteTarget(c)} />
                ))}
                {/* 新しく入力するカード（候補カードと統一感のあるデザイン） */}
                <div className="w-full flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      // 入力開始時はプレート・最大積載量をクリアして白紙から始める
                      const s = getKioskSession();
                      const emptyPlate = { region: "", classNum: "", hira: "", number: "" };
                      setPlate(emptyPlate);
                      setMaxLoad("");
                      setKioskSession({
                        selectedVehicle: null,
                        plate: emptyPlate,
                        driverInput: { ...s.driverInput, maxLoad: "" },
                      });
                      setPlateSection("region");
                      setMode("input");
                    }}
                    className="flex-1 flex items-center text-left select-none touch-pan-y transition-all duration-75 active:scale-[0.99]"
                    style={{
                      height: roomyCandidates ? "clamp(160px, 20vh, 220px)" : MULTI_CANDIDATE_CARD_HEIGHT, borderRadius: 22,
                      background: "#fff",
                      border: "2px solid #D1D5DB",
                      borderLeft: "6px solid #1565C0",
                      paddingLeft: 20, paddingRight: 20,
                      boxShadow: "0 4px 14px rgba(0,0,0,0.09)",
                    }}
                  >
                    {/* +アイコンバッジ（プレートと同じ配置） */}
                    <div className="flex-shrink-0 mr-4 xl:mr-8" style={{
                      width: roomyCandidates ? "clamp(160px, 18vw, 300px)" : 200,
                      height: roomyCandidates ? "clamp(80px, 9vw, 150px)" : 100, borderRadius: 10,
                      background: "#EFF6FF",
                      border: "3px dashed #60A5FA",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      gap: 8,
                    }}>
                      <span style={{ fontSize: 56, color: "#1565C0", fontWeight: 300, lineHeight: 1 }}>+</span>
                    </div>
                    {/* テキスト情報(VehicleCard と同じ 2 行構造) */}
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className={roomyCandidates ? "text-[26px] lg:text-[32px] xl:text-[38px]" : "text-[32px]"} style={{ fontWeight: 900, color: "#1565C0", letterSpacing: "0.06em" }}>
                        新しく入力する
                      </span>
                      <span className={roomyCandidates ? "text-[20px] lg:text-[24px] xl:text-[28px]" : "text-[24px]"} style={{ fontWeight: 600, color: "#6B7280", marginTop: 6 }}>
                        上記にない車両の場合
                      </span>
                    </div>
                    <span style={{ fontSize: 36, color: "#1565C0", flexShrink: 0 }}>▶</span>
                  </button>
                  <div style={{ width: 100, flexShrink: 0 }} />
                </div>
              </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 確認モード（候補1件）── */}


        {/* ── 入力モード：プレート ── */}
        {mode === "input" && inputStep === "plate" && <VehiclePlateEditor key={plateSection} plate={plate} plateSection={plateSection} fromFinal={fromFinal} savePlate={savePlate} onSectionChange={setPlateSection} onComplete={() => fromFinal ? router.push("/kiosk/final-confirm") : setInputStep("maxload")} />}

        {/* ── 入力モード：最大積載量 ── */}
        {mode === "input" && inputStep === "maxload" && <MaxLoadInput maxLoad={maxLoad} saveMaxLoad={saveMaxLoad} submitInput={submitInput} />}

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
