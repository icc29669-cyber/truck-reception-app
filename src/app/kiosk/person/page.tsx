"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getKioskSession, setKioskSession } from "@/lib/kioskState";
import { deleteCandidate as apiDeleteCandidate } from "@/lib/api";
import type { DriverCandidate } from "@/types/reception";
import KatakanaKeyboard from "@/components/KatakanaKeyboard";

type Mode = "select" | "confirm" | "input";
type InputField = "company" | "name";

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

/* ━━ 候補選択カード ━━ */
function CandidateCard({
  candidate, isFirst, onSelect, onDelete,
}: {
  candidate: DriverCandidate;
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
          height: 152, borderRadius: 22,
          background: pressed ? "#EFF6FF" : "#fff",
          border: `2px solid ${pressed ? "#1565C0" : "#D1D5DB"}`,
          boxShadow: pressed ? "0 2px 8px rgba(21,101,192,0.18)" : "0 4px 14px rgba(0,0,0,0.09)",
          borderLeft: isFirst ? "6px solid #0d9488" : undefined,
          paddingLeft: isFirst ? 26 : 32,
          paddingRight: 28,
          overflow: "hidden",
        }}
      >
        {/* 人アイコン */}
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "#EFF6FF", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 32, flexShrink: 0, marginRight: 24,
        }}>👤</div>

        {/* テキスト */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <span style={{ fontSize: 28, fontWeight: 600, color: "#6B7280", lineHeight: 1.3 }}>
            {candidate.companyName || "（会社名なし）"}
          </span>
          <span style={{ fontSize: 40, fontWeight: 900, color: "#111827", lineHeight: 1.2, letterSpacing: "0.04em" }}>
            {candidate.name || "（名前なし）"}
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

/* ━━ メインページ ━━ */
export default function PersonPage() {
  const router = useRouter();
  const initRef = useRef(false);

  const [mode, setMode] = useState<Mode>("select");
  const [candidates, setCandidates] = useState<DriverCandidate[]>([]);
  const [confirmTarget, setConfirmTarget] = useState<DriverCandidate | null>(null);

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
    await apiDeleteCandidate("driver", deleteTarget.id);
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

  const bgStyle = "#F5F0E8";

  if (!mounted) return <div className="w-screen h-screen" style={{ background: "#F5F0E8" }} />;

  return (
    <div className="w-screen h-screen flex flex-col select-none overflow-hidden" style={{ background: bgStyle }}>

      {/* ━━ ヘッダー（TOP同様の薄いバー）━━ */}
      <div className="flex items-center px-8 gap-6 flex-shrink-0"
        style={{ background: "#1a3a6b", height: 88 }}>
        <button
          onPointerDown={() => router.push(fromFinal ? "/kiosk/final-confirm" : "/kiosk/phone")}
          className="flex items-center justify-center font-bold rounded-xl border-2 border-white text-white active:bg-blue-800 flex-shrink-0"
          style={{ height: 60, width: 160, fontSize: 28 }}
        >◀ 戻る</button>
        <div style={{ flex: 1 }} />
        <StepDots current={2} />
      </div>

      {/* タイトル（ベージュ背景上）*/}
      <div className="flex flex-col items-center flex-shrink-0" style={{ padding: mode === "input" ? "16px 0 10px" : "20px 0 16px" }}>
        <span style={{ fontSize: 48, fontWeight: 800, color: "#1E293B", letterSpacing: "0.12em" }}>
          {mode === "select" ? "お名前を選んでください" :
           mode === "confirm" ? "ご本人の確認" :
           inputField === "company" ? "運送会社名を入力してください" :
           "お名前を入力してください"}
        </span>

        {/* 入力モードのみ：会社名 + お名前 を並べて表示 */}
        {mode === "input" && (
          <div suppressHydrationWarning style={{
            width: 1200, display: "flex", alignItems: "center", gap: 12,
          }}>
            {/* ① 運送会社名フィールド */}
            <div
              onPointerDown={() => setInputField("company")}
              style={{
                flex: 1, borderRadius: 14, height: 96,
                background: "#fff",
                border: `3px solid ${inputField === "company" ? "#F59E0B" : "#E2E8F0"}`,
                display: "flex", flexDirection: "column", justifyContent: "center",
                padding: "0 22px", cursor: "pointer",
                opacity: inputField === "company" ? 1 : 0.6,
              }}
            >
              <div style={{
                fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", marginBottom: 4,
                color: inputField === "company" ? "#D97706" : "#94A3B8",
              }}>
                ① 運送会社名
              </div>
              <div style={{
                fontSize: 36, fontWeight: 900, lineHeight: 1,
                color: company ? "#111827" : "#CBD5E1",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {company || "－"}
              </div>
            </div>

            {/* 矢印 */}
            <div style={{ fontSize: 28, color: "#94A3B8", flexShrink: 0 }}>▶</div>

            {/* ② お名前フィールド */}
            <div
              onPointerDown={() => { if (company.trim()) setInputField("name"); }}
              style={{
                flex: 1, borderRadius: 14, height: 96,
                background: "#fff",
                border: `3px solid ${inputField === "name" ? "#F59E0B" : "#E2E8F0"}`,
                display: "flex", flexDirection: "column", justifyContent: "center",
                padding: "0 22px", cursor: company.trim() ? "pointer" : "default",
                opacity: inputField === "name" ? 1 : company.trim() ? 0.6 : 0.3,
              }}
            >
              <div style={{
                fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", marginBottom: 4,
                color: inputField === "name" ? "#D97706" : "#94A3B8",
              }}>
                ② お名前
              </div>
              <div style={{
                fontSize: 36, fontWeight: 900, lineHeight: 1,
                color: name ? "#111827" : "#CBD5E1",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {name || "－"}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ━━ メインコンテンツ ━━ */}
      <div className="flex-1 overflow-hidden">

        {/* ── 選択モード ── */}
        {mode === "select" && (
          <div className="h-full flex flex-col px-10 pt-6 pb-6 gap-4">
            <p style={{ fontSize: 28, fontWeight: 600, color: "#374151", flexShrink: 0 }}>
              以前ご来場時の記録が見つかりました。ご自身をタップしてください。
            </p>
            {/* 候補カード + 新しく入力するカード（同じサイズ・スクロール対応） */}
            <div className="flex-1 overflow-y-auto" style={{ paddingRight: 4 }}>
              <div className="flex flex-col gap-4">
                {candidates.map((c, i) => (
                  <CandidateCard
                    key={c.id}
                    candidate={c}
                    isFirst={i === 0}
                    onSelect={() => selectCandidate(c)}
                    onDelete={() => setDeleteTarget(c)}
                  />
                ))}
                {/* 新しく入力するカード（候補カードと同じサイズ） */}
                <div className="w-full flex items-center gap-3">
                  <button
                    onPointerDown={() => { setCompany(""); setName(""); setMode("input"); }}
                    className="flex-1 flex items-center justify-center gap-4 font-bold select-none touch-none transition-all duration-75 active:bg-blue-50"
                    style={{
                      height: 152, borderRadius: 22,
                      background: "rgba(255,255,255,0.7)",
                      border: "3px dashed #1565C0",
                      color: "#1565C0",
                      fontSize: 32,
                      boxShadow: "0 4px 14px rgba(21,101,192,0.08)",
                    }}
                  >
                    <span style={{ fontSize: 42 }}>＋</span>
                    一覧にない場合は新しく入力する
                  </button>
                  {/* 削除ボタンの幅と合わせる（ダミースペース） */}
                  <div style={{ width: 100, flexShrink: 0 }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 確認モード（候補1件）── */}
        {mode === "confirm" && confirmTarget && (
          <div className="h-full flex flex-col items-center justify-center px-10 gap-8">
            {/* 確認カード */}
            <div style={{
              width: 1200, borderRadius: 22,
              border: "3px solid #0d9488",
              background: "#fff",
              boxShadow: "0 12px 48px rgba(0,0,0,0.14)",
              overflow: "hidden",
            }}>
              {/* カードヘッダー */}
              <div style={{
                background: "linear-gradient(90deg,#0f766e,#0d9488)",
                padding: "20px 40px", display: "flex", alignItems: "center", gap: 16,
              }}>
                <span style={{ fontSize: 36, color: "#fff" }}>✓</span>
                <span style={{ fontSize: 32, fontWeight: 800, color: "#fff" }}>
                  以前ご来場の記録があります
                </span>
              </div>
              {/* カードボディ */}
              <div style={{ padding: "36px 56px", display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <span style={{ fontSize: 22, fontWeight: 600, color: "#9CA3AF", width: 200, flexShrink: 0 }}>
                    運送会社名
                  </span>
                  <span style={{ fontSize: 36, fontWeight: 700, color: "#111827" }}>
                    {confirmTarget.companyName || "（未登録）"}
                  </span>
                </div>
                <div style={{ height: 1, background: "#E5E7EB" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <span style={{ fontSize: 22, fontWeight: 600, color: "#9CA3AF", width: 200, flexShrink: 0 }}>
                    お名前
                  </span>
                  <span style={{ fontSize: 52, fontWeight: 900, color: "#111827", letterSpacing: "0.06em" }}>
                    {confirmTarget.name}
                  </span>
                </div>
              </div>
            </div>

            {/* はい・いいえ */}
            <div className="flex gap-8" style={{ width: 1200 }}>
              <button
                onPointerDown={() => selectCandidate(confirmTarget)}
                className="flex-1 flex items-center justify-center gap-4 font-black rounded-2xl text-white active:brightness-90 select-none touch-none transition-all"
                style={{
                  height: 132, fontSize: 44,
                  background: "linear-gradient(180deg,#2DD4BF,#0D9488)",
                  boxShadow: "0 6px 0 #0f766e, 0 8px 24px rgba(13,148,136,0.4)",
                }}
              >
                <span style={{ fontSize: 48 }}>✓</span>
                はい、この情報で続けます
              </button>
              <button
                onPointerDown={() => setMode("input")}
                className="flex items-center justify-center gap-3 font-bold rounded-2xl active:bg-red-50 select-none touch-none transition-all"
                style={{
                  height: 132, minWidth: 380, fontSize: 32,
                  border: "2px solid #DC2626", background: "#fff", color: "#DC2626",
                }}
              >
                <span style={{ fontSize: 36 }}>✎</span>
                違います・修正する
              </button>
            </div>
          </div>
        )}

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
            <span style={{ fontSize: 32, fontWeight: 800, color: "#1E293B" }}>
              この記録を削除しますか？
            </span>
            <div style={{
              background: "#F8FAFC", borderRadius: 16, padding: "20px 32px",
              width: "100%", textAlign: "center",
            }}>
              <div style={{ fontSize: 22, color: "#64748B" }}>{deleteTarget.companyName}</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: "#111827", marginTop: 4 }}>{deleteTarget.name}</div>
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
