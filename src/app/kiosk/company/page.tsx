"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getKioskSession, setKioskSession } from "@/lib/kioskState";
import KatakanaKeyboard from "@/components/KatakanaKeyboard";

export default function CompanyPage() {
  const router = useRouter();
  const [value, setValue] = useState("");

  useEffect(() => {
    const s = getKioskSession();
    setValue(s.driverInput.companyName ?? "");
  }, []);

  function handleComplete() {
    const session = getKioskSession();
    setKioskSession({
      driverInput: { ...session.driverInput, companyName: value.trim() },
    });
    router.push("/kiosk/data-confirm");
  }

  return (
    <div
      className="w-screen h-screen flex flex-col select-none overflow-hidden"
      style={{ background: "linear-gradient(160deg, #E8F4FD 0%, #D0E8FA 50%, #B8D8F6 100%)" }}
    >
      {/* ── 濃い青ヘッダー（タイトル＋入力表示） ── */}
      <div
        className="flex flex-col flex-shrink-0 items-center"
        style={{ background: "linear-gradient(90deg,#1a3a6b 0%,#1E5799 100%)", paddingBottom: 52 }}
      >
        <div className="flex items-center px-8 w-full" style={{ height: 80 }}>
          <button
            onPointerDown={() => router.push("/kiosk/data-confirm")}
            className="flex items-center justify-center font-bold rounded-xl border-2 border-white text-white active:bg-blue-800 flex-shrink-0"
            style={{ height: 56, width: 140, fontSize: 26 }}
          >
            戻る
          </button>
          <div style={{ flex: 1 }} />
          <div style={{ width: 140 }} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <span style={{ fontSize: 48, fontWeight: 800, color: "#FFFFFF", letterSpacing: "0.12em" }}>
            運送会社名を入力してください
          </span>
        </div>

        {/* 入力表示ボックス */}
        <div
          suppressHydrationWarning
          className="rounded-2xl border-4 flex items-center px-8 transition-colors"
          style={{
            width: 1200,
            height: 110,
            borderColor: value ? "#F59E0B" : "rgba(255,255,255,0.55)",
            background: "#FFFFFF",
          }}
        >
          <span
            suppressHydrationWarning
            className="font-black tracking-widest"
            style={{ fontSize: 64, color: value ? "#1a1a1a" : "#94a3b8" }}
          >
            {value || "（会社名を入力）"}
          </span>
        </div>
      </div>

      {/* ── 明るい青エリア（キーボードのみ）── */}
      <div className="flex-1 flex items-center justify-center overflow-hidden px-10 py-8">
        <KatakanaKeyboard
          value={value}
          onChange={setValue}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}
