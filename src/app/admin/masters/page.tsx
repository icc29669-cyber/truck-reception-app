"use client";

import { useState, useEffect, useCallback } from "react";

/* ─── Types ─── */
type PlateRegion = { id: number; name: string; kana: string; sortOrder: number; isActive: boolean };
type PlateHiragana = { id: number; char: string; category: string; sortOrder: number; isActive: boolean };
type PlateAlphabet = { id: number; char: string; sortOrder: number; isActive: boolean };
type Center = { id: number; name: string; secretKey: string; isActive: boolean };

type Tab = "regions" | "hiragana" | "alphabet" | "centers";

const TABS: { key: Tab; label: string }[] = [
  { key: "regions", label: "地名マスタ" },
  { key: "hiragana", label: "ひらがなマスタ" },
  { key: "alphabet", label: "アルファベットマスタ" },
  { key: "centers", label: "センターマスタ" },
];

export default function MastersPage() {
  const [tab, setTab] = useState<Tab>("regions");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6" style={{ color: "#111827" }}>
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg font-semibold">
          {toast}
        </div>
      )}

      {/* Tab Bar */}
      <div className="bg-white rounded-2xl shadow p-2 flex gap-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={
              "px-5 py-2.5 rounded-xl text-sm font-bold transition-colors " +
              (tab === t.key
                ? "bg-[#1a3a6b] text-white"
                : "text-gray-600 hover:bg-gray-100")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "regions" && <RegionsTab showToast={showToast} />}
      {tab === "hiragana" && <HiraganaTab showToast={showToast} />}
      {tab === "alphabet" && <AlphabetTab showToast={showToast} />}
      {tab === "centers" && <CentersTab showToast={showToast} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Tab 1: PlateRegion
   ═══════════════════════════════════════════════════════════════ */
function RegionsTab({ showToast }: { showToast: (m: string) => void }) {
  const [items, setItems] = useState<PlateRegion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", kana: "", sortOrder: 0, isActive: true });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/plate-regions");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => { setEditId(null); setForm({ name: "", kana: "", sortOrder: 0, isActive: true }); setShowModal(true); };
  const openEdit = (r: PlateRegion) => { setEditId(r.id); setForm({ name: r.name, kana: r.kana, sortOrder: r.sortOrder, isActive: r.isActive }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    try {
      if (editId) {
        await fetch("/api/admin/plate-regions/" + editId, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        showToast("更新しました");
      } else {
        await fetch("/api/admin/plate-regions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        showToast("追加しました");
      }
      setShowModal(false);
      fetchData();
    } catch { showToast("エラーが発生しました"); }
  };

  const toggleActive = async (r: PlateRegion) => {
    try {
      await fetch("/api/admin/plate-regions/" + r.id, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !r.isActive }) });
      showToast(r.isActive ? "無効にしました" : "有効にしました");
      fetchData();
    } catch { showToast("エラーが発生しました"); }
  };

  const handleDelete = async (r: PlateRegion) => {
    if (!confirm("「" + r.name + "」を削除しますか？")) return;
    try {
      await fetch("/api/admin/plate-regions/" + r.id, { method: "DELETE" });
      showToast("削除しました");
      fetchData();
    } catch { showToast("エラーが発生しました"); }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">地名マスタ</h2>
          <div className="flex items-center gap-3">
            {loading && <span className="text-sm text-gray-400">読込中...</span>}
            <span className="text-sm text-gray-500">{items.length}件</span>
            <button onClick={openAdd} className="px-4 py-1.5 bg-[#1a3a6b] text-white font-bold rounded-lg text-sm hover:bg-[#1E5799] transition-colors">+ 追加</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["ID", "地名", "読み仮名", "表示順", "状態", "操作"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((r, i) => (
                <tr key={r.id} className={"hover:bg-blue-50 transition-colors " + (i % 2 === 0 ? "bg-white" : "bg-gray-50/50")}>
                  <td className="px-4 py-3 font-mono text-gray-500">{r.id}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{r.name}</td>
                  <td className="px-4 py-3 text-gray-600">{r.kana || "\u2014"}</td>
                  <td className="px-4 py-3 text-gray-600">{r.sortOrder}</td>
                  <td className="px-4 py-3">
                    <span className={"px-2 py-1 rounded-full text-xs font-bold " + (r.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                      {r.isActive ? "有効" : "無効"}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(r)} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-200 transition-colors">編集</button>
                      <button onClick={() => toggleActive(r)} className={"px-3 py-1 rounded-lg text-xs font-bold transition-colors " + (r.isActive ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200" : "bg-green-100 text-green-700 hover:bg-green-200")}>{r.isActive ? "無効化" : "有効化"}</button>
                      <button onClick={() => handleDelete(r)} className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold hover:bg-red-200 transition-colors">削除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{editId ? "地名を編集" : "地名を追加"}</h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-600">地名 *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none" placeholder="例: 多摩" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-600">読み仮名</label>
                <input type="text" value={form.kana} onChange={(e) => setForm({ ...form, kana: e.target.value })} className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none" placeholder="例: たま" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-600">表示順</label>
                <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} id="region-active" className="w-4 h-4" />
                <label htmlFor="region-active" className="text-sm font-semibold text-gray-600">有効</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-5 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition-colors">キャンセル</button>
              <button onClick={handleSave} className="px-5 py-2 bg-[#1a3a6b] text-white font-bold rounded-lg hover:bg-[#1E5799] transition-colors">{editId ? "更新" : "追加"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Tab 2: PlateHiragana
   ═══════════════════════════════════════════════════════════════ */
function HiraganaTab({ showToast }: { showToast: (m: string) => void }) {
  const [items, setItems] = useState<PlateHiragana[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ char: "", category: "business", sortOrder: 0, isActive: true });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/plate-hiragana");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => { setEditId(null); setForm({ char: "", category: "business", sortOrder: 0, isActive: true }); setShowModal(true); };
  const openEdit = (h: PlateHiragana) => { setEditId(h.id); setForm({ char: h.char, category: h.category, sortOrder: h.sortOrder, isActive: h.isActive }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.char.trim()) return;
    try {
      if (editId) {
        await fetch("/api/admin/plate-hiragana/" + editId, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        showToast("更新しました");
      } else {
        await fetch("/api/admin/plate-hiragana", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        showToast("追加しました");
      }
      setShowModal(false);
      fetchData();
    } catch { showToast("エラーが発生しました"); }
  };

  const toggleActive = async (h: PlateHiragana) => {
    try {
      await fetch("/api/admin/plate-hiragana/" + h.id, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !h.isActive }) });
      showToast(h.isActive ? "無効にしました" : "有効にしました");
      fetchData();
    } catch { showToast("エラーが発生しました"); }
  };

  const handleDelete = async (h: PlateHiragana) => {
    if (!confirm("「" + h.char + "」を削除しますか？")) return;
    try {
      await fetch("/api/admin/plate-hiragana/" + h.id, { method: "DELETE" });
      showToast("削除しました");
      fetchData();
    } catch { showToast("エラーが発生しました"); }
  };

  const categoryLabel = (c: string) => {
    switch (c) {
      case "business": return "事業用";
      case "private": return "自家用";
      case "rental": return "レンタカー";
      case "unavailable": return "使用不可";
      default: return c;
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">ひらがなマスタ</h2>
          <div className="flex items-center gap-3">
            {loading && <span className="text-sm text-gray-400">読込中...</span>}
            <span className="text-sm text-gray-500">{items.length}件</span>
            <button onClick={openAdd} className="px-4 py-1.5 bg-[#1a3a6b] text-white font-bold rounded-lg text-sm hover:bg-[#1E5799] transition-colors">+ 追加</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["ID", "文字", "カテゴリ", "表示順", "状態", "操作"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((h, i) => (
                <tr key={h.id} className={"hover:bg-blue-50 transition-colors " + (i % 2 === 0 ? "bg-white" : "bg-gray-50/50")}>
                  <td className="px-4 py-3 font-mono text-gray-500">{h.id}</td>
                  <td className="px-4 py-3 font-bold text-gray-900 text-lg">{h.char}</td>
                  <td className="px-4 py-3 text-gray-600">{categoryLabel(h.category)}</td>
                  <td className="px-4 py-3 text-gray-600">{h.sortOrder}</td>
                  <td className="px-4 py-3">
                    <span className={"px-2 py-1 rounded-full text-xs font-bold " + (h.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                      {h.isActive ? "有効" : "無効"}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(h)} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-200 transition-colors">編集</button>
                      <button onClick={() => toggleActive(h)} className={"px-3 py-1 rounded-lg text-xs font-bold transition-colors " + (h.isActive ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200" : "bg-green-100 text-green-700 hover:bg-green-200")}>{h.isActive ? "無効化" : "有効化"}</button>
                      <button onClick={() => handleDelete(h)} className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold hover:bg-red-200 transition-colors">削除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{editId ? "ひらがなを編集" : "ひらがなを追加"}</h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-600">文字 *</label>
                <input type="text" value={form.char} onChange={(e) => setForm({ ...form, char: e.target.value })} maxLength={1} className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none w-20 text-center text-xl" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-600">カテゴリ</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none">
                  <option value="business">事業用</option>
                  <option value="private">自家用</option>
                  <option value="rental">レンタカー</option>
                  <option value="unavailable">使用不可</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-600">表示順</label>
                <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} id="hira-active" className="w-4 h-4" />
                <label htmlFor="hira-active" className="text-sm font-semibold text-gray-600">有効</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-5 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition-colors">キャンセル</button>
              <button onClick={handleSave} className="px-5 py-2 bg-[#1a3a6b] text-white font-bold rounded-lg hover:bg-[#1E5799] transition-colors">{editId ? "更新" : "追加"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Tab 3: PlateAlphabet
   ═══════════════════════════════════════════════════════════════ */
function AlphabetTab({ showToast }: { showToast: (m: string) => void }) {
  const [items, setItems] = useState<PlateAlphabet[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ char: "", sortOrder: 0, isActive: true });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/plate-alphabet");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => { setEditId(null); setForm({ char: "", sortOrder: 0, isActive: true }); setShowModal(true); };
  const openEdit = (a: PlateAlphabet) => { setEditId(a.id); setForm({ char: a.char, sortOrder: a.sortOrder, isActive: a.isActive }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.char.trim()) return;
    try {
      if (editId) {
        await fetch("/api/admin/plate-alphabet/" + editId, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        showToast("更新しました");
      } else {
        await fetch("/api/admin/plate-alphabet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        showToast("追加しました");
      }
      setShowModal(false);
      fetchData();
    } catch { showToast("エラーが発生しました"); }
  };

  const toggleActive = async (a: PlateAlphabet) => {
    try {
      await fetch("/api/admin/plate-alphabet/" + a.id, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !a.isActive }) });
      showToast(a.isActive ? "無効にしました" : "有効にしました");
      fetchData();
    } catch { showToast("エラーが発生しました"); }
  };

  const handleDelete = async (a: PlateAlphabet) => {
    if (!confirm("「" + a.char + "」を削除しますか？")) return;
    try {
      await fetch("/api/admin/plate-alphabet/" + a.id, { method: "DELETE" });
      showToast("削除しました");
      fetchData();
    } catch { showToast("エラーが発生しました"); }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">アルファベットマスタ</h2>
          <div className="flex items-center gap-3">
            {loading && <span className="text-sm text-gray-400">読込中...</span>}
            <span className="text-sm text-gray-500">{items.length}件</span>
            <button onClick={openAdd} className="px-4 py-1.5 bg-[#1a3a6b] text-white font-bold rounded-lg text-sm hover:bg-[#1E5799] transition-colors">+ 追加</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["ID", "文字", "表示順", "状態", "操作"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((a, i) => (
                <tr key={a.id} className={"hover:bg-blue-50 transition-colors " + (i % 2 === 0 ? "bg-white" : "bg-gray-50/50")}>
                  <td className="px-4 py-3 font-mono text-gray-500">{a.id}</td>
                  <td className="px-4 py-3 font-bold text-gray-900 text-lg">{a.char}</td>
                  <td className="px-4 py-3 text-gray-600">{a.sortOrder}</td>
                  <td className="px-4 py-3">
                    <span className={"px-2 py-1 rounded-full text-xs font-bold " + (a.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                      {a.isActive ? "有効" : "無効"}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(a)} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-200 transition-colors">編集</button>
                      <button onClick={() => toggleActive(a)} className={"px-3 py-1 rounded-lg text-xs font-bold transition-colors " + (a.isActive ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200" : "bg-green-100 text-green-700 hover:bg-green-200")}>{a.isActive ? "無効化" : "有効化"}</button>
                      <button onClick={() => handleDelete(a)} className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold hover:bg-red-200 transition-colors">削除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{editId ? "アルファベットを編集" : "アルファベットを追加"}</h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-600">文字 *</label>
                <input type="text" value={form.char} onChange={(e) => setForm({ ...form, char: e.target.value.toUpperCase() })} maxLength={1} className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none w-20 text-center text-xl" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-600">表示順</label>
                <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} id="alpha-active" className="w-4 h-4" />
                <label htmlFor="alpha-active" className="text-sm font-semibold text-gray-600">有効</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-5 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition-colors">キャンセル</button>
              <button onClick={handleSave} className="px-5 py-2 bg-[#1a3a6b] text-white font-bold rounded-lg hover:bg-[#1E5799] transition-colors">{editId ? "更新" : "追加"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Tab 4: Center
   ═══════════════════════════════════════════════════════════════ */
function CentersTab({ showToast }: { showToast: (m: string) => void }) {
  const [items, setItems] = useState<Center[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", secretKey: "", isActive: true });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/centers");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => { setEditId(null); setForm({ name: "", secretKey: "", isActive: true }); setShowModal(true); };
  const openEdit = (c: Center) => { setEditId(c.id); setForm({ name: c.name, secretKey: c.secretKey, isActive: c.isActive }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    try {
      if (editId) {
        await fetch("/api/admin/centers/" + editId, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        showToast("更新しました");
      } else {
        await fetch("/api/admin/centers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        showToast("追加しました");
      }
      setShowModal(false);
      fetchData();
    } catch { showToast("エラーが発生しました"); }
  };

  const toggleActive = async (c: Center) => {
    try {
      await fetch("/api/admin/centers/" + c.id, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !c.isActive }) });
      showToast(c.isActive ? "無効にしました" : "有効にしました");
      fetchData();
    } catch { showToast("エラーが発生しました"); }
  };

  const handleDelete = async (c: Center) => {
    if (!confirm("「" + c.name + "」を削除しますか？")) return;
    try {
      await fetch("/api/admin/centers/" + c.id, { method: "DELETE" });
      showToast("削除しました");
      fetchData();
    } catch { showToast("エラーが発生しました"); }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">センターマスタ</h2>
          <div className="flex items-center gap-3">
            {loading && <span className="text-sm text-gray-400">読込中...</span>}
            <span className="text-sm text-gray-500">{items.length}件</span>
            <button onClick={openAdd} className="px-4 py-1.5 bg-[#1a3a6b] text-white font-bold rounded-lg text-sm hover:bg-[#1E5799] transition-colors">+ 追加</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["ID", "センター名", "シークレットキー", "状態", "操作"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((c, i) => (
                <tr key={c.id} className={"hover:bg-blue-50 transition-colors " + (i % 2 === 0 ? "bg-white" : "bg-gray-50/50")}>
                  <td className="px-4 py-3 font-mono text-gray-500">{c.id}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{c.name}</td>
                  <td className="px-4 py-3 font-mono text-gray-500">{c.secretKey ? "****" : "\u2014"}</td>
                  <td className="px-4 py-3">
                    <span className={"px-2 py-1 rounded-full text-xs font-bold " + (c.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                      {c.isActive ? "有効" : "無効"}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(c)} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-200 transition-colors">編集</button>
                      <button onClick={() => toggleActive(c)} className={"px-3 py-1 rounded-lg text-xs font-bold transition-colors " + (c.isActive ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200" : "bg-green-100 text-green-700 hover:bg-green-200")}>{c.isActive ? "無効化" : "有効化"}</button>
                      <button onClick={() => handleDelete(c)} className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold hover:bg-red-200 transition-colors">削除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{editId ? "センターを編集" : "センターを追加"}</h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-600">センター名 *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none" placeholder="例: 東京センター" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-600">シークレットキー</label>
                <input type="text" value={form.secretKey} onChange={(e) => setForm({ ...form, secretKey: e.target.value })} className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none font-mono" placeholder="キオスク認証用キー" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} id="center-active" className="w-4 h-4" />
                <label htmlFor="center-active" className="text-sm font-semibold text-gray-600">有効</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-5 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition-colors">キャンセル</button>
              <button onClick={handleSave} className="px-5 py-2 bg-[#1a3a6b] text-white font-bold rounded-lg hover:bg-[#1E5799] transition-colors">{editId ? "更新" : "追加"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
