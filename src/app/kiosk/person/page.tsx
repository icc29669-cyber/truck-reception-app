"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getKioskSession, setKioskSession } from "@/lib/kioskState";
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
                color: done ? "#166534" : active ? "#1e3a6b" : "rgba(255,255,255,0.5)",
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
  candidate, isFirst, onSelect,
}: {
  candidate: DriverCandidate;
  isFirst: boolean;
  onSelect: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onPointerDown={() => { setPressed(true); onSelect(); }}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className="w-full flex items-center text-left select-none touch-none transition-all duration-75"
      style={{
        height: 152, borderRadius: 22,
        background: pressed ? "#EFF6FF" : "#fff",
        border: `2px solid ${pressed ? "#1565C0" : "#D1D5DB"}`,
        boxShadow: pressed ? "0 2px 8px rgba(21,101,192,0.18)" : "0 4px 14px rgba(0,0,0,0.09)",
        borderLeft: isFirst ? "6px solid #16a34a" : undefined,
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
          color: "#166534", borderRadius: 8, padding: "4px 14px",
          marginRight: 20, flexShrink: 0,
        }}>最近</span>
      )}

      {/* 矢印 */}
      <span style={{ fontSize: 36, color: "#9CA3AF", flexShrink: 0 }}>▶</span>
    </button>
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

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const params = new URLSearchParams(window.location.search);
    const fromParam = params.get("from");
    const fieldParam = params.get("field");
    const isFromFinal = fromParam === "final-confirm";
    setFromFinal(isFromFinal);

    const s = getKioskSession();
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
      } else if (n === 1) {
        setConfirmTarget(s.driverCandidates[0]);
        setMode("confirm");
      } else {
        setMode("select");
      }
    }
    setMounted(true);
  }, []);

  /* 候補を選択 → 車両ページへ（final-confirmから来た場合はfinal-confirmへ） */
  function selectCandidate(c: DriverCandidate) {
    const s = getKioskSession();
    setKioskSession({
      selectedDriver: c,
      driverInput: { ...s.driverInput, companyName: c.companyName, driverName: c.name },
    });
    router.push(fromFinal ? "/kiosk/final-confirm" : "/kiosk/vehicle");
  }

  /* 手入力を確定 */
  function submitInput() {
    if (!company || !name) return;
    const s = getKioskSession();
    setKioskSession({
      selectedDriver: null,
      driverInput: { ...s.driverInput, companyName: company, driverName: name },
    });
    router.push(fromFinal ? "/kiosk/final-confirm" : "/kiosk/vehicle");
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

  const bgStyle = "linear-gradient(160deg, #E8F4FD 0%, #D0E8FA 50%, #B8D8F6 100%)";

  if (!mounted) return <div className="w-screen h-screen" style={{ background: "#1e3a5f" }} />;

  return (
    <div className="w-screen h-screen flex flex-col select-none overflow-hidden" style={{ background: bgStyle }}>

      {/* ━━ ヘッダー ━━ */}
      <div className="flex flex-col flex-shrink-0 items-center"
        style={{
          background: "linear-gradient(160deg,#1a3a6b 0%,#1E5799 100%)",
          paddingBottom: mode === "input" ? 52 : 24,
        }}>
        <div className="flex items-center px-8 gap-6 w-full" style={{ height: 84 }}>
          <button
            onPointerDown={() => router.push(fromFinal ? "/kiosk/final-confirm" : "/kiosk/phone")}
            className="flex items-center justify-center font-bold rounded-xl border-2 border-white text-white active:bg-blue-800 flex-shrink-0"
            style={{ height: 60, width: 160, fontSize: 28 }}
          >◀ 戻る</button>
          <div style={{ flex: 1 }} />
          <StepDots current={2} />
        </div>
        <div style={{ marginBottom: mode === "input" ? 20 : 0 }}>
          <span style={{ fontSize: 48, fontWeight: 800, color: "#FFFFFF", letterSpacing: "0.12em" }}>
            {mode === "select" ? "お名前を選んでください" :
             mode === "confirm" ? "ご本人の確認" :
             inputField === "company" ? "運送会社名を入力してください" :
             "お名前を入力してください"}
          </span>
        </div>
        {/* 入力モードのみ：入力表示ボックスをヘッダー内に表示 */}
        {mode === "input" && (
          <div
            suppressHydrationWarning
            className="rounded-2xl border-4 flex items-center px-8 transition-colors"
            style={{
              width: 1200,
              height: 110,
              borderColor: (inputField === "company" ? company : name) ? "#F59E0B" : "rgba(255,255,255,0.55)",
              background: "#FFFFFF",
            }}
          >
            <span style={{
              fontSize: 64, fontWeight: 900,
              color: (inputField === "company" ? company : name) ? "#111827" : "#94a3b8",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {inputField === "company"
                ? (company || "（運送会社名を入力してください）")
                : (name || "（お名前を入力してください）")}
            </span>
          </div>
        )}
      </div>

      {/* ━━ メインコンテンツ ━━ */}
      <div className="flex-1 overflow-hidden">

        {/* ── 選択モード ── */}
        {mode === "select" && (
          <div className="h-full flex flex-col px-10 pt-8 pb-6 gap-4">
            <p style={{ fontSize: 28, fontWeight: 600, color: "#374151", flexShrink: 0 }}>
              以前ご来場時の記録が見つかりました。ご自身をタップしてください。
            </p>
            {/* 候補カード（最大4件） */}
            <div className="flex flex-col gap-4 flex-shrink-0">
              {candidates.slice(0, 4).map((c, i) => (
                <CandidateCard
                  key={c.id}
                  candidate={c}
                  isFirst={i === 0}
                  onSelect={() => selectCandidate(c)}
                />
              ))}
            </div>
            {/* 新しく入力するボタン */}
            <div className="flex-1 flex items-end">
              <button
                onPointerDown={() => { setCompany(""); setName(""); setMode("input"); }}
                className="w-full flex items-center justify-center gap-3 font-bold rounded-2xl active:bg-blue-50 transition-all select-none touch-none"
                style={{
                  height: 100, border: "2px dashed #1565C0",
                  background: "rgba(255,255,255,0.7)", color: "#1565C0", fontSize: 32,
                }}
              >
                <span style={{ fontSize: 40 }}>＋</span>
                一覧にない場合は新しく入力する
              </button>
            </div>
          </div>
        )}

        {/* ── 確認モード（候補1件）── */}
        {mode === "confirm" && confirmTarget && (
          <div className="h-full flex flex-col items-center justify-center px-10 gap-8">
            {/* 確認カード */}
            <div style={{
              width: 1200, borderRadius: 22,
              border: "3px solid #16a34a",
              background: "#fff",
              boxShadow: "0 12px 48px rgba(0,0,0,0.14)",
              overflow: "hidden",
            }}>
              {/* カードヘッダー */}
              <div style={{
                background: "linear-gradient(90deg,#166534,#16a34a)",
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
                  <span style={{ fontSize: 24, fontWeight: 600, color: "#9CA3AF", width: 200, flexShrink: 0 }}>
                    運送会社名
                  </span>
                  <span style={{ fontSize: 36, fontWeight: 700, color: "#111827" }}>
                    {confirmTarget.companyName || "（未登録）"}
                  </span>
                </div>
                <div style={{ height: 1, background: "#E5E7EB" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <span style={{ fontSize: 24, fontWeight: 600, color: "#9CA3AF", width: 200, flexShrink: 0 }}>
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
                  background: "linear-gradient(180deg,#22C55E,#16A34A)",
                  boxShadow: "0 6px 0 #14532d, 0 8px 24px rgba(22,163,74,0.4)",
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

        {/* ── 入力モード：運送会社名 ── */}
        {mode === "input" && inputField === "company" && (
          <div className="h-full flex flex-col items-center justify-center px-10 py-6 gap-4">
            <div className="flex-1 flex items-center justify-center overflow-hidden py-8">
              <KatakanaKeyboard
                value={company}
                onChange={saveCompany}
                onComplete={() => setInputField("name")}
              />
            </div>
            {candidates.length > 0 && (
              <button
                onPointerDown={() => setMode("select")}
                style={{ fontSize: 24, color: "#6B7280", textDecoration: "underline", flexShrink: 0 }}
              >
                ← 一覧から選ぶに戻る
              </button>
            )}
          </div>
        )}

        {/* ── 入力モード：お名前 ── */}
        {mode === "input" && inputField === "name" && (
          <div className="h-full flex flex-col items-center justify-center px-10 py-6 gap-4">
            <div className="flex-1 flex items-center justify-center overflow-hidden py-8">
              <KatakanaKeyboard
                value={name}
                onChange={saveName}
                onComplete={() => {
                  if (!name.trim()) return;
                  if (fromFinal) {
                    const s = getKioskSession();
                    setKioskSession({ driverInput: { ...s.driverInput, companyName: company, driverName: name } });
                    router.push("/kiosk/final-confirm");
                  } else {
                    submitInput();
                  }
                }}
              />
            </div>
            <button
              onPointerDown={() => setInputField("company")}
              style={{ fontSize: 24, color: "#6B7280", textDecoration: "underline", flexShrink: 0 }}
            >
              ← 運送会社名の入力に戻る
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
