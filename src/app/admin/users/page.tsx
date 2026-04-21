"use client";
import { useState, useEffect, useCallback } from "react";

type User = {
  id: number; loginId: string; name: string;
  centerId: number; centerName: string; centerCode: string;
  paperWidth: string; autoPrint: boolean; isActive: boolean;
  lastLoginAt: string | null; createdAt: string;
};
type Center = { id: number; code: string; name: string };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ loginId: "", password: "", name: "", centerId: "", paperWidth: "80", autoPrint: true });
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<Partial<User> & { password?: string }>({});

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        fetch("/api/admin/users").then((r) => r.json()),
        fetch("/api/centers").then((r) => r.json()),
      ]);
      setUsers(Array.isArray(r1) ? r1 : []);
      setCenters(Array.isArray(r2) ? r2 : []);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  async function createUser() {
    if (!form.loginId || !form.password || !form.name || !form.centerId) {
      showToast("すべての項目を入力してください"); return;
    }
    const res = await fetch("/api/admin/users", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, centerId: parseInt(form.centerId, 10) }),
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.error || "作成失敗"); return; }
    setCreating(false);
    setForm({ loginId: "", password: "", name: "", centerId: "", paperWidth: "80", autoPrint: true });
    showToast("ユーザーを作成しました"); refresh();
  }
  async function saveEdit() {
    if (!editTarget) return;
    const body: Record<string, unknown> = {
      loginId: editForm.loginId, name: editForm.name, centerId: editForm.centerId,
      paperWidth: editForm.paperWidth, autoPrint: editForm.autoPrint, isActive: editForm.isActive,
    };
    if (editForm.password) body.password = editForm.password;
    const res = await fetch(`/api/admin/users/${editTarget.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.error || "更新失敗"); return; }
    setEditTarget(null); showToast("更新しました"); refresh();
  }
  async function deleteUser(id: number, loginId: string) {
    if (!confirm(`ユーザー「${loginId}」を削除しますか？`)) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { showToast(data.error || "削除失敗"); return; }
    showToast("削除しました"); refresh();
  }

  return (
    <div style={{ color: "#111827" }}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-gray-800">ユーザー管理</h1>
            <p className="text-gray-400 text-sm">1 ID = 1 センター + 1 印刷設定。admin/kiosk どちらもこのIDでログイン可能</p>
          </div>
          <button onClick={() => setCreating(true)}
            className="px-5 py-2 bg-[#1a3a6b] text-white font-bold rounded-lg hover:bg-[#1E5799]">
            + 新規ユーザー
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">登録ユーザー ({users.length})</h2>
            {loading && <span className="text-sm text-gray-400">読込中...</span>}
          </div>
          {users.length === 0 && !loading ? (
            <div className="py-16 text-center text-gray-400">
              <p className="font-bold">ユーザー未登録です</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {["状態", "ログインID", "表示名", "センター", "用紙幅", "自動印刷", "最終ログイン", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-blue-50/50">
                      <td className="px-4 py-3">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                            <span className="w-2 h-2 rounded-full bg-green-500" /> 有効
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-200 text-gray-600">停止</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold">{u.loginId}</td>
                      <td className="px-4 py-3 font-semibold">{u.name}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{u.centerCode} {u.centerName}</td>
                      <td className="px-4 py-3 text-gray-600">{u.paperWidth}mm</td>
                      <td className="px-4 py-3">{u.autoPrint ? "ON" : "OFF"}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {u.lastLoginAt
                          ? new Date(u.lastLoginAt).toLocaleString("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
                          : "未ログイン"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <button onClick={() => { setEditTarget(u); setEditForm({ ...u }); }}
                          className="text-blue-600 hover:text-blue-800 font-semibold mr-3">編集</button>
                        <button onClick={() => deleteUser(u.id, u.loginId)}
                          className="text-red-500 hover:text-red-700 font-semibold">削除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 新規発行 */}
      {creating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setCreating(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-4">新規ユーザー</h3>
            <div className="space-y-3">
              <Fld label="ログインID">
                <input value={form.loginId} onChange={(e) => setForm((f) => ({ ...f, loginId: e.target.value }))}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" />
              </Fld>
              <Fld label="パスワード (4文字以上)">
                <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" />
              </Fld>
              <Fld label="表示名">
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="例: 東京センター 1号機"
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </Fld>
              <Fld label="所属センター">
                <select value={form.centerId} onChange={(e) => setForm((f) => ({ ...f, centerId: e.target.value }))}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option value="">-- 選択 --</option>
                  {centers.map((c) => <option key={c.id} value={c.id}>{c.code} {c.name}</option>)}
                </select>
              </Fld>
              <div className="grid grid-cols-2 gap-3">
                <Fld label="用紙幅">
                  <select value={form.paperWidth} onChange={(e) => setForm((f) => ({ ...f, paperWidth: e.target.value }))}
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm">
                    <option value="58">58mm</option><option value="80">80mm</option>
                  </select>
                </Fld>
                <Fld label="自動印刷">
                  <select value={form.autoPrint ? "on" : "off"} onChange={(e) => setForm((f) => ({ ...f, autoPrint: e.target.value === "on" }))}
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm">
                    <option value="on">ON</option><option value="off">OFF</option>
                  </select>
                </Fld>
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button onClick={() => setCreating(false)} className="px-5 py-2 border-2 border-gray-300 text-gray-600 font-bold rounded-lg">キャンセル</button>
              <button onClick={createUser} className="px-6 py-2 bg-[#1a3a6b] text-white font-bold rounded-lg">発行</button>
            </div>
          </div>
        </div>
      )}

      {/* 編集 */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditTarget(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-4">編集: {editTarget.loginId}</h3>
            <div className="space-y-3">
              <Fld label="ログインID">
                <input value={editForm.loginId ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, loginId: e.target.value }))}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" />
              </Fld>
              <Fld label="表示名">
                <input value={editForm.name ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </Fld>
              <Fld label="所属センター">
                <select value={editForm.centerId ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, centerId: parseInt(e.target.value, 10) }))}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm">
                  {centers.map((c) => <option key={c.id} value={c.id}>{c.code} {c.name}</option>)}
                </select>
              </Fld>
              <div className="grid grid-cols-2 gap-3">
                <Fld label="用紙幅">
                  <select value={editForm.paperWidth ?? "80"} onChange={(e) => setEditForm((f) => ({ ...f, paperWidth: e.target.value }))}
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm">
                    <option value="58">58mm</option><option value="80">80mm</option>
                  </select>
                </Fld>
                <Fld label="自動印刷">
                  <select value={editForm.autoPrint ? "on" : "off"} onChange={(e) => setEditForm((f) => ({ ...f, autoPrint: e.target.value === "on" }))}
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm">
                    <option value="on">ON</option><option value="off">OFF</option>
                  </select>
                </Fld>
              </div>
              <Fld label="パスワード再発行 (空欄で変更なし)">
                <input type="password" value={editForm.password ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="4文字以上"
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" />
              </Fld>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                <input type="checkbox" checked={editForm.isActive ?? true} onChange={(e) => setEditForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4" />
                有効 (OFF でログイン不可)
              </label>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button onClick={() => setEditTarget(null)} className="px-5 py-2 border-2 border-gray-300 text-gray-600 font-bold rounded-lg">キャンセル</button>
              <button onClick={saveEdit} className="px-6 py-2 bg-[#1a3a6b] text-white font-bold rounded-lg">保存</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg font-bold text-sm">{toast}</div>
      )}
    </div>
  );
}

function Fld({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-bold text-gray-500 block mb-1">{label}</label>
      {children}
    </div>
  );
}
