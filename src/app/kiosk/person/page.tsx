"use client";
import KioskSteps from "@/components/KioskSteps";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getKioskSession, setKioskSession } from "@/lib/kioskState";
import { deleteCandidate as apiDeleteCandidate } from "@/lib/api";
import type { DriverCandidate } from "@/types/reception";
import KatakanaKeyboard from "@/components/KatakanaKeyboard";
import KioskCandidateSelection, {
  MULTI_CANDIDATE_CARD_HEIGHT,
  ROOMY_CANDIDATE_CARD_HEIGHT,
  candidateArtworkWidth,
  candidateArtworkHeight,
} from "@/components/KioskCandidateSelection";

type Mode = "select" | "input";
type InputField = "company" | "name";


/* ━━ 候補選択カード ━━ */
function CandidateCard({
  candidate, isFirst, roomy, onSelect, onDelete,
}: {
  candidate: DriverCandidate;
  isFirst: boolean;
  roomy: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <div className="w-full flex items-center gap-3">
      <button
        type="button"
        onClick={onSelect}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        onPointerCancel={() => setPressed(false)}
        className="flex-1 flex items-center text-left select-none touch-pan-y transition-all duration-75"
        style={{
          minHeight: roomy ? ROOMY_CANDIDATE_CARD_HEIGHT : MULTI_CANDIDATE_CARD_HEIGHT,
          borderRadius: 22,
          background: pressed ? "#EFF6FF" : "#fff",
          border: `2px solid ${pressed ? "#1565C0" : "#D1D5DB"}`,
          boxShadow: pressed ? "0 2px 8px rgba(21,101,192,0.18)" : "0 4px 14px rgba(0,0,0,0.09)",
          borderLeft: isFirst ? "6px solid #0d9488" : undefined,
          paddingLeft: isFirst ? 20 : 26,
          paddingRight: 20,
          paddingTop: 12,
          paddingBottom: 12,
        }}
      >
        {/* ナンバープレートと同じ幅を使い、名前と車番の開始位置を揃える */}
        <div className="flex-shrink-0 mr-4 xl:mr-8 flex items-center justify-center" style={{
          width: candidateArtworkWidth(roomy), height: candidateArtworkHeight(roomy),
          borderRadius: 10, background: "#EFF6FF",
        }}>
          <svg aria-hidden="true" viewBox="0 0 100 100" fill="#3D3B78"
            style={{ width: roomy ? 108 : 76, height: roomy ? 108 : 76 }}>
            <circle cx="50" cy="33" r="19" />
            <path d="M14 89c0-20 16-35 36-35s36 15 36 35H14Z" />
          </svg>
        </div>

        <div className="flex flex-col flex-1 min-w-0">
          <span className={roomy ? "text-[26px] lg:text-[32px] xl:text-[38px]" : "text-[32px]"} style={{ fontWeight: 900, color: "#26251e", lineHeight: 1.2, letterSpacing: "0.04em", overflowWrap: "anywhere" }}>
            {candidate.name || "（名前なし）"}
          </span>
          <span className={roomy ? "text-[21px] lg:text-[26px] xl:text-[30px]" : "text-[28px]"} style={{ fontWeight: 600, color: "#6B7280", lineHeight: 1.3, marginTop: 6, overflowWrap: "anywhere" }}>
            {candidate.companyName || "（会社名なし）"}
          </span>
        </div>

        {/* 最近バッジ */}
        {isFirst && (
          <span className={roomy ? "max-lg:hidden" : ""} style={{
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
        type="button"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="flex items-center justify-center select-none touch-pan-y active:scale-95 transition-transform flex-shrink-0"
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

/* ━━ メインページ ━━ */
export default function PersonPage() {
  const router = useRouter();
  const initRef = useRef(false);

  const [mode, setMode] = useState<Mode>("select");
  const [candidates, setCandidates] = useState<DriverCandidate[]>([]);

  // 入力モード用
  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [inputField, setInputField] = useState<InputField>("company");
  const [mounted, setMounted] = useState(false);
  const [fromFinal, setFromFinal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DriverCandidate | null>(null);
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const params = new URLSearchParams(window.location.search);
    const fromParam = params.get("from");
    const fieldParam = params.get("field");
    const isFromFinal = fromParam === "final-confirm";
    setFromFinal(isFromFinal);

    const s = getKioskSession();
    // セッションに電話番号がなければトップに戻す
    if (!s.phone && !isFromFinal) {
      router.replace("/kiosk");
      return;
    }
    setCandidates(s.driverCandidates ?? []);
    // 既存入力値を復元
    setCompany(s.driverInput?.companyName ?? "");
    setName(s.driverInput?.driverName ?? "");

    if (isFromFinal) {
      setMode("input");
      setInputField(fieldParam === "name" ? "name" : "company");
    } else {
      const n = s.driverCandidates?.length ?? 0;
      if (n === 0) {
        setMode("input");
      } else {
        // 1件でも必ず選択画面を表示（自動スキップしない）
        setMode("select");
      }
    }
    setMounted(true);
  }, []);

  /* 候補を選択 → 車両ページへ（final-confirmから来た場合はfinal-confirmへ） */
  function selectCandidate(c: DriverCandidate) {
    if (navigating) return;
    setNavigating(true);
    const s = getKioskSession();
    setKioskSession({
      selectedDriver: c,
      driverInput: { ...s.driverInput, companyName: c.companyName, driverName: c.name },
    });
    router.push(fromFinal ? "/kiosk/final-confirm" : "/kiosk/vehicle");
  }

  /* 手入力を確定 */
  function submitInput() {
    if (navigating) return;
    if (!company.trim() || !name.trim()) return;
    setNavigating(true);
    const s = getKioskSession();
    setKioskSession({
      selectedDriver: null,
      driverInput: { ...s.driverInput, companyName: company.trim(), driverName: name.trim() },
    });
    router.push(fromFinal ? "/kiosk/final-confirm" : "/kiosk/vehicle");
  }

  /* 候補を削除（確認後にDB+セッション両方から削除） */
  async function confirmDelete() {
    if (!deleteTarget) return;
    // phone 所有権チェックのため現在の session.phone を送る
    await apiDeleteCandidate("driver", deleteTarget.id, getKioskSession().phone);
    const updated = candidates.filter((c) => c.id !== deleteTarget.id);
    setCandidates(updated);
    setKioskSession({ driverCandidates: updated });
    setDeleteTarget(null);
    if (updated.length === 0) {
      setMode("input");
    }
  }

  /* companyとnameをセッションに保存 */
  function saveCompany(v: string) {
    setCompany(v);
    const s = getKioskSession();
    setKioskSession({ driverInput: { ...s.driverInput, companyName: v } });
  }
  function saveName(v: string) {
    setName(v);
    const s = getKioskSession();
    setKioskSession({ driverInput: { ...s.driverInput, driverName: v } });
  }

  /* 入力完了ハンドラ（会社名・名前共通） */
  function handleInputComplete() {
    if (navigating) return;
    if (inputField === "company") {
      if (!company.trim()) return;
      if (fromFinal) {
        setNavigating(true);
        const s = getKioskSession();
        setKioskSession({ driverInput: { ...s.driverInput, companyName: company.trim(), driverName: name.trim() } });
        router.push("/kiosk/final-confirm");
      } else {
        setInputField("name");
      }
    } else {
      if (!name.trim()) return;
      if (fromFinal) {
        setNavigating(true);
        const s = getKioskSession();
        setKioskSession({ driverInput: { ...s.driverInput, companyName: company.trim(), driverName: name.trim() } });
        router.push("/kiosk/final-confirm");
      } else {
        submitInput();
      }
    }
  }

  const bgStyle = "#f2f1ed";
  const roomyCandidates = candidates.length <= 2;

  if (!mounted) return <div className="w-screen h-screen" style={{ background: "#f2f1ed" }} />;

  return (
    <div className="w-screen h-screen flex flex-col select-none overflow-hidden" style={{ background: bgStyle }}>

      {/* ━━ ヘッダー（TOP同様の薄いバー）━━ */}
      <div className="flex items-center px-8 gap-6 flex-shrink-0"
        style={{ background: "#1a3a6b", height: 96 }}>
        <button
          onPointerDown={() => router.push(fromFinal ? "/kiosk/final-confirm" : "/kiosk/phone")}
          className="flex items-center justify-center font-bold rounded-xl border-2 border-white text-white active:bg-blue-800 flex-shrink-0"
          style={{ height: 60, width: 240, fontSize: 24 }}
        >◀ {fromFinal ? "最終確認へ戻る" : "電話番号へ戻る"}</button>
        <div style={{ flex: 1 }} />
        <KioskSteps current={2} />
      </div>

      {/* 入力画面の見出し。候補選択時は車両画面と共通の見出しを使う */}
      {mode === "input" && <div className="flex items-center flex-shrink-0" style={{ padding: "20px 40px 18px", gap: 22 }}>
        <div style={{
          fontSize: 16, color: "#64748B", letterSpacing: "0.22em", fontWeight: 800,
          padding: "6px 14px", background: "#E2E8F0", borderRadius: 6,
          flexShrink: 0,
        }}>
          STEP 2 / 4
        </div>
        <div style={{
          fontSize: 40, fontWeight: 900, color: "#26251e", letterSpacing: "0.04em",
          display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap",
          lineHeight: 1.25,
        }}>
          {inputField === "company" ? (
            <>運送会社名<span style={{ fontSize: 28, color: "#0D9488", fontWeight: 800 }}>をカタカナで入力してください</span></>
          ) : (
            <>お名前<span style={{ fontSize: 28, color: "#0D9488", fontWeight: 800 }}>をカタカナで入力してください</span></>
          )}
        </div>
      </div>}

      {/* 入力モード：会社名 + お名前 を並べて表示（高齢者配慮でハイライト強化） */}
      {mode === "input" && (
        <div className="flex justify-center flex-shrink-0" style={{ padding: "0 40px 14px" }}>
          <div suppressHydrationWarning style={{
            width: 1200, maxWidth: "100%", display: "flex", alignItems: "center", gap: 14,
          }}>
            {/* ① 運送会社名フィールド */}
            <button
              type="button"
              onPointerDown={() => setInputField("company")}
              style={{
                flex: 1, borderRadius: 16, height: 96,
                background: inputField === "company" ? "#FFFBEB" : "#fff",
                border: `4px solid ${inputField === "company" ? "#F59E0B" : "#E2E8F0"}`,
                display: "flex", flexDirection: "column", justifyContent: "center",
                alignItems: "stretch", textAlign: "left",
                padding: "0 24px", cursor: "pointer",
                opacity: inputField === "company" ? 1 : 0.55,
                boxShadow: inputField === "company" ? "0 6px 16px rgba(245,158,11,0.25)" : "none",
                transition: "all 0.15s",
              }}
            >
              <div style={{
                fontSize: 16, fontWeight: 800, letterSpacing: "0.1em", marginBottom: 6,
                color: inputField === "company" ? "#D97706" : "#94A3B8",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                {inputField === "company" && <span style={{ fontSize: 18 }}>▼</span>}
                ① 運送会社名　<span style={{ fontSize: 13, fontWeight: 600, color: "#94A3B8" }}>例: ニホンセイフティー</span>
              </div>
              <div style={{
                fontSize: 36, fontWeight: 900, lineHeight: 1,
                color: company ? "#26251e" : "#CBD5E1",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {company || "ニホンセイフティー"}
              </div>
            </button>

            <div style={{ fontSize: 32, color: "#94A3B8", flexShrink: 0, fontWeight: 900 }}>▶</div>

            {/* ② お名前フィールド */}
            <button
              type="button"
              disabled={!company.trim()}
              onPointerDown={() => { if (company.trim()) setInputField("name"); }}
              style={{
                flex: 1, borderRadius: 16, height: 96,
                background: inputField === "name" ? "#FFFBEB" : "#fff",
                border: `4px solid ${inputField === "name" ? "#F59E0B" : "#E2E8F0"}`,
                display: "flex", flexDirection: "column", justifyContent: "center",
                alignItems: "stretch", textAlign: "left",
                padding: "0 24px", cursor: company.trim() ? "pointer" : "default",
                opacity: inputField === "name" ? 1 : company.trim() ? 0.55 : 0.3,
                boxShadow: inputField === "name" ? "0 6px 16px rgba(245,158,11,0.25)" : "none",
                transition: "all 0.15s",
              }}
            >
              <div style={{
                fontSize: 16, fontWeight: 800, letterSpacing: "0.1em", marginBottom: 6,
                color: inputField === "name" ? "#D97706" : "#94A3B8",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                {inputField === "name" && <span style={{ fontSize: 18 }}>▼</span>}
                ② ドライバー お名前　<span style={{ fontSize: 13, fontWeight: 600, color: "#94A3B8" }}>例: タナカ タロウ</span>
              </div>
              <div style={{
                fontSize: 36, fontWeight: 900, lineHeight: 1,
                color: name ? "#26251e" : "#CBD5E1",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {name || (company.trim() ? "タナカ タロウ" : "← 先に会社名を入力")}
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ━━ メインコンテンツ ━━ */}
      <div className="min-h-0 flex-1 overflow-hidden">

        {/* ── 選択モード ── */}
        {mode === "select" && (
          <KioskCandidateSelection
            step={2}
            instruction="以前ご来場時の記録が見つかりました。ご自身のお名前をタッチしてください"
            roomy={roomyCandidates}
          >
                {candidates.map((c, i) => (
                  <CandidateCard
                    key={c.id}
                    candidate={c}
                    isFirst={i === 0}
                    roomy={roomyCandidates}
                    onSelect={() => selectCandidate(c)}
                    onDelete={() => setDeleteTarget(c)}
                  />
                ))}
                {/* 新しく入力するカード(候補カードと同じ高さ・同じ構造) */}
                <div className="w-full flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      // 入力開始時はローカル state + セッションの名前関連を完全クリア
                      const s = getKioskSession();
                      setCompany("");
                      setName("");
                      setKioskSession({
                        selectedDriver: null,
                        driverInput: { ...s.driverInput, companyName: "", driverName: "" },
                      });
                      setMode("input");
                    }}
                    className="flex-1 flex items-center text-left select-none touch-pan-y transition-all duration-75 active:scale-[0.99]"
                    style={{
                      height: roomyCandidates ? ROOMY_CANDIDATE_CARD_HEIGHT : MULTI_CANDIDATE_CARD_HEIGHT,
                      borderRadius: 22,
                      background: "#fff",
                      border: "2px solid #D1D5DB",
                      borderLeft: "6px solid #1565C0",
                      paddingLeft: 20, paddingRight: 20,
                      boxShadow: "0 4px 14px rgba(0,0,0,0.09)",
                    }}
                  >
                    {/* 名前候補・車両候補と同じ左側の幅 */}
                    <div className="flex-shrink-0 mr-4 xl:mr-8" style={{
                      width: candidateArtworkWidth(roomyCandidates),
                      height: candidateArtworkHeight(roomyCandidates), borderRadius: 10,
                      background: "#EFF6FF",
                      border: "3px dashed #60A5FA",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 56,
                      color: "#1565C0", fontWeight: 300, lineHeight: 1,
                    }}>+</div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className={roomyCandidates ? "text-[26px] lg:text-[32px] xl:text-[38px]" : "text-[32px]"} style={{ fontWeight: 900, color: "#1565C0", lineHeight: 1.2, letterSpacing: "0.04em" }}>
                        新しく入力する
                      </span>
                      <span className={roomyCandidates ? "text-[20px] lg:text-[24px] xl:text-[28px]" : "text-[24px]"} style={{ fontWeight: 600, color: "#6B7280", lineHeight: 1.3, marginTop: 6 }}>
                        上記にない場合
                      </span>
                    </div>
                    <span style={{ fontSize: 36, color: "#1565C0", flexShrink: 0 }}>▶</span>
                  </button>
                  {/* 削除ボタンの幅と合わせる(ダミースペース) */}
                  <div style={{ width: 100, flexShrink: 0 }} />
                </div>
          </KioskCandidateSelection>
        )}

        {/* ── 確認モード（候補1件）── */}


        {/* ── 入力モード：会社名・名前 共通レイアウト ── */}
        {mode === "input" && (
          <div className="h-full flex flex-col items-center px-10 py-4 gap-2">
            <div className="flex-1 flex items-center justify-center overflow-hidden py-4">
              <KatakanaKeyboard
                value={inputField === "company" ? company : name}
                onChange={inputField === "company" ? saveCompany : saveName}
                onComplete={handleInputComplete}
              />
            </div>
            {/* バックリンク：常に同じ高さで確保してレイアウトを固定 */}
            <div style={{ height: 40, flexShrink: 0, display: "flex", alignItems: "center" }}>
              {inputField === "name" ? (
                <button
                  onPointerDown={() => setInputField("company")}
                  style={{ fontSize: 24, color: "#6B7280", textDecoration: "underline" }}
                >
                  ← 運送会社名の入力に戻る
                </button>
              ) : candidates.length > 0 ? (
                <button
                  onPointerDown={() => setMode("select")}
                  style={{ fontSize: 24, color: "#6B7280", textDecoration: "underline" }}
                >
                  ← 一覧から選ぶに戻る
                </button>
              ) : null}
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
              この記録を削除しますか？
            </span>
            <div style={{
              background: "#F8FAFC", borderRadius: 16, padding: "20px 32px",
              width: "100%", textAlign: "center",
            }}>
              <div style={{ fontSize: 22, color: "#64748B" }}>{deleteTarget.companyName}</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: "#26251e", marginTop: 4 }}>{deleteTarget.name}</div>
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
