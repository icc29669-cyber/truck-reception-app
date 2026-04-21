"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Center = { id: number; code: string; name: string };

function LoginInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/admin";

  const [mode, setMode] = useState<"checking" | "login" | "bootstrap">("checking");
  const [centers, setCenters] = useState<Center[]>([]);
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [centerId, setCenterId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/bootstrap")
      .then((r) => r.json())
      .then((d) => {
        if (d.bootstrappable) {
          setMode("bootstrap");
          setCenters(d.centers || []);
        } else {
          setMode("login");
        }
      })
      .catch(() => setMode("login"));
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "ログインに失敗しました"); setLoading(false); return; }
      router.replace(next);
    } catch { setError("通信エラーが発生しました"); setLoading(false); }
  }

  async function handleBootstrap(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 4) { setError("パスワードは4文字以上"); return; }
    if (!centerId) { setError("センターを選択してください"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId, password, name, centerId: parseInt(centerId, 10) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "作成失敗"); setLoading(false); return; }
      // 続けてログイン
      await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId, password }),
      });
      router.replace(next);
    } catch { setError("通信エラーが発生しました"); setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#f2f1ed", color: "#111827", colorScheme: "light" }}>
      <div className="bg-white rounded-2xl shadow-xl p-10 w-[460px]" style={{ color: "#111827" }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center text-white font-black text-xl rounded-xl"
            style={{ background: "#1a3a6b", width: 48, height: 48 }}>
            {"\u{1F69B}"}
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-800">
              {mode === "bootstrap" ? "初回セットアップ" : "ログイン"}
            </h1>
            <p className="text-xs text-gray-500">トラック受付システム</p>
          </div>
        </div>

        {mode === "checking" && <div className="py-12 text-center text-gray-400">読み込み中...</div>}

        {mode === "bootstrap" && (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800 mb-4">
              {"\u26A0\uFE0F"} 初回セットアップです。最初のユーザーを作成してください
            </div>
            <form onSubmit={handleBootstrap} className="space-y-3">
              <Field label="ログインID">
                <input type="text" value={loginId} onChange={(e) => setLoginId(e.target.value)}
                  autoFocus autoComplete="username"
                  placeholder="例: 100001"
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none font-mono text-gray-900 placeholder-gray-400 bg-white" />
              </Field>
              <Field label="パスワード (4文字以上)">
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none text-gray-900 placeholder-gray-400 bg-white" />
              </Field>
              <Field label="表示名">
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="例: 東京センター管理者"
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none text-gray-900 placeholder-gray-400 bg-white" />
              </Field>
              <Field label="所属センター">
                <select value={centerId} onChange={(e) => setCenterId(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none text-gray-900 placeholder-gray-400 bg-white">
                  <option value="">-- 選択 --</option>
                  {centers.map((c) => <option key={c.id} value={c.id}>{c.code} {c.name}</option>)}
                </select>
              </Field>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
              <button type="submit" disabled={loading || !loginId || !password || !centerId}
                className="w-full py-3 rounded-lg font-bold text-white disabled:opacity-50"
                style={{ background: "#1a3a6b" }}>
                {loading ? "作成中..." : "作成してログイン"}
              </button>
            </form>
          </>
        )}

        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <Field label="ログインID">
              <input type="text" value={loginId} onChange={(e) => setLoginId(e.target.value)}
                autoFocus autoComplete="username"
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none font-mono text-gray-900 placeholder-gray-400 bg-white" />
            </Field>
            <Field label="パスワード">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none text-gray-900 placeholder-gray-400 bg-white" />
            </Field>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
            <button type="submit" disabled={loading || !loginId || !password}
              className="w-full py-3 rounded-lg font-bold text-white disabled:opacity-50"
              style={{ background: "#1a3a6b" }}>
              {loading ? "ログイン中..." : "ログイン"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-bold text-gray-600 mb-1 block">{label}</label>
      {children}
    </div>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<div />}><LoginInner /></Suspense>;
}
