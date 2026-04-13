"use client";

import { useState, useEffect, useCallback } from "react";

/* ─── Types ─── */
type PlateRegion = { id: number; name: string; kana: string; sortOrder: number; isActive: boolean };
type PlateHiragana = { id: number; char: string; category: string; sortOrder: number; isActive: boolean };
type PlateAlphabet = { id: number; char: string; sortOrder: number; isActive: boolean };
type Center = { id: number; code: string; name: string; secretKey: string; isActive: boolean };

type Tab = "regions" | "hiragana" | "alphabet" | "centers" | "printer" | "sync";

const TABS: { key: Tab; label: string }[] = [
  { key: "regions", label: "地名マスタ" },
  { key: "hiragana", label: "ひらがなマスタ" },
  { key: "alphabet", label: "アルファベットマスタ" },
  { key: "centers", label: "センターマスタ" },
  { key: "printer", label: "プリンタ設定" },
  { key: "sync", label: "予約システム連携" },
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
      {tab === "printer" && <PrinterTab showToast={showToast} />}
      {tab === "sync" && <SyncTab showToast={showToast} />}
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
  const [form, setForm] = useState({ code: "", name: "", secretKey: "", isActive: true });
  const [syncing, setSyncing] = useState(false);

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

  const openAdd = () => { setEditId(null); setForm({ code: "", name: "", secretKey: "", isActive: true }); setShowModal(true); };
  const openEdit = (c: Center) => { setEditId(c.id); setForm({ code: c.code || "", name: c.name, secretKey: c.secretKey, isActive: c.isActive }); setShowModal(true); };

  const handleSyncCenters = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/sync/centers", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        showToast(`同期完了: 新規${data.created}件, 更新${data.updated}件`);
        fetchData();
      } else {
        showToast(data.error || "同期に失敗しました");
      }
    } catch { showToast("同期に失敗しました"); }
    finally { setSyncing(false); }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.code.trim()) return;
    try {
      if (editId) {
        await fetch("/api/admin/centers/" + editId, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        showToast("更新しました");
      } else {
        await fetch("/api/admin/centers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: form.code, name: form.name, secretKey: form.secretKey }) });
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
            <button onClick={handleSyncCenters} disabled={syncing} className="px-4 py-1.5 bg-green-600 text-white font-bold rounded-lg text-sm hover:bg-green-700 transition-colors disabled:opacity-50">
              {syncing ? "同期中..." : "予約システムから同期"}
            </button>
            <button onClick={openAdd} className="px-4 py-1.5 bg-[#1a3a6b] text-white font-bold rounded-lg text-sm hover:bg-[#1E5799] transition-colors">+ 追加</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["CD", "センター名", "シークレットキー", "状態", "操作"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((c, i) => (
                <tr key={c.id} className={"hover:bg-blue-50 transition-colors " + (i % 2 === 0 ? "bg-white" : "bg-gray-50/50")}>
                  <td className="px-4 py-3 font-mono text-gray-700 font-bold">{c.code || "—"}</td>
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
                <label className="text-sm font-semibold text-gray-600">センターCD *</label>
                <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none font-mono" placeholder="例: 3101" maxLength={4} />
              </div>
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

/* ═══════════════════════════════════════════════════════════════
   Tab 5: Printer Settings
   ═══════════════════════════════════════════════════════════════ */
function PrinterTab({ showToast }: { showToast: (m: string) => void }) {
  const [printerName, setPrinterName] = useState("");
  const [autoPrint, setAutoPrint] = useState(true);
  const [paperWidth, setPaperWidth] = useState("80");
  const [loaded, setLoaded] = useState(false);

  // localStorageから読み込み
  useEffect(() => {
    const saved = localStorage.getItem("printer_settings");
    if (saved) {
      try {
        const s = JSON.parse(saved);
        setPrinterName(s.printerName || "");
        setAutoPrint(s.autoPrint ?? true);
        setPaperWidth(s.paperWidth || "80");
      } catch { /* ignore */ }
    }
    setLoaded(true);
  }, []);

  function handleSave() {
    const settings = { printerName, autoPrint, paperWidth };
    localStorage.setItem("printer_settings", JSON.stringify(settings));
    showToast("プリンタ設定を保存しました");
  }

  function handleTestPrint() {
    const w = window.open("", "_blank", "width=400,height=600");
    if (!w) return;
    w.document.write(`
      <html><head><title>テスト印刷</title>
      <style>
        @page { size: ${paperWidth}mm auto; margin: 0; }
        body { font-family: "MS Gothic", monospace; width: ${paperWidth}mm; padding: 4mm; font-size: 12px; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .big { font-size: 24px; }
        hr { border: none; border-top: 1px dashed #000; margin: 8px 0; }
      </style></head><body>
      <div class="center bold">テスト印刷</div>
      <hr />
      <div class="center big bold">No. 001</div>
      <hr />
      <div>用紙幅: ${paperWidth}mm</div>
      <div>プリンタ: ${printerName || "（未設定）"}</div>
      <div>自動印刷: ${autoPrint ? "ON" : "OFF"}</div>
      <div>日時: ${new Date().toLocaleString("ja-JP")}</div>
      <hr />
      <div class="center">受付カウンターへお持ちください</div>
      </body></html>
    `);
    w.document.close();
    setTimeout(() => { w.print(); }, 300);
  }

  if (!loaded) return null;

  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">プリンタ設定</h2>
        <p className="text-sm text-gray-500">※ この設定はこの端末（ブラウザ）にのみ保存されます</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-600">プリンタ名（メモ用）</label>
            <input
              type="text"
              value={printerName}
              onChange={(e) => setPrinterName(e.target.value)}
              className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none"
              placeholder="例: EPSON TM-T88VI"
            />
            <p className="text-xs text-gray-400">ブラウザの印刷ダイアログでこのプリンタを選択してください</p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-600">用紙幅</label>
            <select
              value={paperWidth}
              onChange={(e) => setPaperWidth(e.target.value)}
              className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none"
            >
              <option value="58">58mm（小型レシートプリンタ）</option>
              <option value="80">80mm（標準レシートプリンタ）</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={autoPrint}
              onChange={(e) => setAutoPrint(e.target.checked)}
              id="auto-print"
              className="w-5 h-5"
            />
            <label htmlFor="auto-print" className="text-sm font-semibold text-gray-600">
              受付完了時に自動で印刷ダイアログを開く
            </label>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-gray-700">セットアップ手順</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
            <li>レシートプリンタをPCにUSB接続</li>
            <li>プリンタメーカーのドライバをインストール</li>
            <li>Windowsの「プリンターとスキャナー」で認識を確認</li>
            <li>レシートプリンタを<strong>通常使うプリンター</strong>に設定</li>
            <li>用紙サイズを {paperWidth}mm に設定</li>
            <li>「テスト印刷」ボタンで動作確認</li>
          </ol>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-bold text-blue-800 text-sm mb-2">ダイアログなしで自動印刷するには</h4>
            <p className="text-xs text-blue-700 mb-2">
              Chromeのショートカットに以下のオプションを追加してください：
            </p>
            <code className="block bg-white p-2 rounded text-xs text-gray-800 border font-mono break-all">
              --kiosk-printing
            </code>
            <p className="text-xs text-blue-600 mt-2">
              例: &quot;C:\Program Files\Google\Chrome\...\chrome.exe&quot; --kiosk-printing
            </p>
            <p className="text-xs text-gray-500 mt-1">
              このオプションで起動すると、受付完了時に印刷ダイアログを表示せず直接プリンタに送信されます
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSave}
          className="px-6 py-2.5 bg-[#1a3a6b] text-white font-bold rounded-lg hover:bg-[#1E5799] transition-colors"
        >
          設定を保存
        </button>
        <button
          onClick={handleTestPrint}
          className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors"
        >
          テスト印刷
        </button>
      </div>
    </div>
  );
}

/* ═══���═══════════════════════════════════════════════════════════
   Tab 6: 予約システム連携 (Sync with berth-app)
   ═══════════���═════════════════��═════════════════════════════════ */
type SyncStatus = { lastSyncedAt: string | null };
type HolidayEntry = { date: string; name: string };

function SyncTab({ showToast }: { showToast: (m: string) => void }) {
  const [centerSync, setCenterSync] = useState<SyncStatus>({ lastSyncedAt: null });
  const [reservationSync, setReservationSync] = useState<SyncStatus>({ lastSyncedAt: null });
  const [holidaySync, setHolidaySync] = useState<SyncStatus>({ lastSyncedAt: null });
  const [driverSync, setDriverSync] = useState<SyncStatus>({ lastSyncedAt: null });
  const [holidays, setHolidays] = useState<HolidayEntry[]>([]);
  const [syncingCenters, setSyncingCenters] = useState(false);
  const [syncingReservations, setSyncingReservations] = useState(false);
  const [syncingHolidays, setSyncingHolidays] = useState(false);
  const [syncingDrivers, setSyncingDrivers] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const fetchSyncStatus = useCallback(async () => {
    try {
      const [cRes, rRes, hRes, dRes] = await Promise.all([
        fetch("/api/admin/sync/centers"),
        fetch("/api/admin/sync/reservations"),
        fetch("/api/admin/sync/holidays"),
        fetch("/api/admin/sync/drivers"),
      ]);
      setCenterSync(await cRes.json());
      setReservationSync(await rRes.json());
      const hData = await hRes.json();
      setHolidaySync({ lastSyncedAt: hData.lastSyncedAt });
      setHolidays(hData.holidays || []);
      setDriverSync(await dRes.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchSyncStatus(); }, [fetchSyncStatus]);

  const formatDate = (iso: string | null) => {
    if (!iso) return "未同期";
    return new Date(iso).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
  };

  const handleSyncCenters = async () => {
    setSyncingCenters(true);
    setLastResult(null);
    try {
      const res = await fetch("/api/admin/sync/centers", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setLastResult(`センター同期完了: 新規${data.created}件, 更新${data.updated}件, スキップ${data.skipped}件`);
        showToast("センター同期完了");
      } else {
        setLastResult(`エラー: ${data.error}`);
      }
      fetchSyncStatus();
    } catch { setLastResult("通信エラー"); }
    finally { setSyncingCenters(false); }
  };

  const handleSyncReservations = async () => {
    setSyncingReservations(true);
    setLastResult(null);
    try {
      const res = await fetch("/api/admin/sync/reservations", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setLastResult(`予約同期完了: 新規${data.created}件, 取消${data.cancelled}件, スキップ${data.skipped}件 (受信${data.eventsReceived}件)`);
        showToast("予約同期完了");
      } else {
        setLastResult(`エラー: ${data.error}`);
      }
      fetchSyncStatus();
    } catch { setLastResult("��信エラー"); }
    finally { setSyncingReservations(false); }
  };

  const handleSyncHolidays = async () => {
    setSyncingHolidays(true);
    setLastResult(null);
    try {
      const res = await fetch("/api/admin/sync/holidays", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setLastResult(`祝日同期完了: ${data.count}件`);
        showToast("祝日同期完了");
      } else {
        setLastResult(`エラー: ${data.error}`);
      }
      fetchSyncStatus();
    } catch { setLastResult("通信エラー"); }
    finally { setSyncingHolidays(false); }
  };

  const handleSyncDrivers = async () => {
    setSyncingDrivers(true);
    setLastResult(null);
    try {
      const res = await fetch("/api/admin/sync/drivers", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setLastResult(`ドライバー同期完了: 新規${data.created}件, 更新${data.updated}件, スキップ${data.skipped}件`);
        showToast("ドライバー同期完了");
      } else {
        setLastResult(`エラー: ${data.error}`);
      }
      fetchSyncStatus();
    } catch { setLastResult("通信エラー"); }
    finally { setSyncingDrivers(false); }
  };

  const handleSyncAll = async () => {
    await handleSyncCenters();
    await handleSyncReservations();
    await handleSyncHolidays();
    await handleSyncDrivers();
  };

  return (
    <div className="space-y-6">
      {/* 接続状態 */}
      <div className="bg-white rounded-2xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">予約システム連携</h2>
          <button
            onClick={handleSyncAll}
            disabled={syncingCenters || syncingReservations || syncingHolidays || syncingDrivers}
            className="px-5 py-2 bg-[#1a3a6b] text-white font-bold rounded-lg hover:bg-[#1E5799] transition-colors disabled:opacity-50"
          >
            全て同期
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          予約システム（バース予約アプリ）からマスタデータと予約情報を同期します。
        </p>

        {lastResult && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            {lastResult}
          </div>
        )}

        {/* Sync Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Centers */}
          <div className="border-2 border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <h3 className="font-bold text-gray-800">センターマスタ</h3>
            </div>
            <p className="text-xs text-gray-500">予約システムのセンター情報をこのアプリに反映</p>
            <div className="text-xs text-gray-400">
              最終同期: {formatDate(centerSync.lastSyncedAt)}
            </div>
            <button
              onClick={handleSyncCenters}
              disabled={syncingCenters}
              className="w-full px-3 py-2 bg-blue-600 text-white font-bold rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {syncingCenters ? "同期中..." : "センターを同期"}
            </button>
          </div>

          {/* Reservations */}
          <div className="border-2 border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <h3 className="font-bold text-gray-800">予約データ</h3>
            </div>
            <p className="text-xs text-gray-500">予約システムの予約をローカルに取り込み（差分同期��</p>
            <div className="text-xs text-gray-400">
              最終同期: {formatDate(reservationSync.lastSyncedAt)}
            </div>
            <button
              onClick={handleSyncReservations}
              disabled={syncingReservations}
              className="w-full px-3 py-2 bg-green-600 text-white font-bold rounded-lg text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {syncingReservations ? "同期���..." : "予約を同期"}
            </button>
          </div>

          {/* Holidays */}
          <div className="border-2 border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <h3 className="font-bold text-gray-800">祝日マスタ</h3>
            </div>
            <p className="text-xs text-gray-500">予約システムの祝日設定を取り込み</p>
            <div className="text-xs text-gray-400">
              最終同期: {formatDate(holidaySync.lastSyncedAt)}
            </div>
            <button
              onClick={handleSyncHolidays}
              disabled={syncingHolidays}
              className="w-full px-3 py-2 bg-orange-600 text-white font-bold rounded-lg text-sm hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              {syncingHolidays ? "同期中..." : "祝日を同期"}
            </button>
          </div>

          {/* Drivers */}
          <div className="border-2 border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <h3 className="font-bold text-gray-800">ドライバーマスタ</h3>
            </div>
            <p className="text-xs text-gray-500">予約システムのドライバー情報を取り込み</p>
            <div className="text-xs text-gray-400">
              最終同期: {formatDate(driverSync.lastSyncedAt)}
            </div>
            <button
              onClick={handleSyncDrivers}
              disabled={syncingDrivers}
              className="w-full px-3 py-2 bg-purple-600 text-white font-bold rounded-lg text-sm hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {syncingDrivers ? "同期中..." : "ドライバーを同期"}
            </button>
          </div>
        </div>
      </div>

      {/* Synced Holidays Display */}
      {holidays.length > 0 && (
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="font-bold text-gray-800 mb-3">同期済み祝日一覧 ({holidays.length}件)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {holidays.map((h) => (
              <div key={h.date} className="flex items-center gap-2 text-sm px-3 py-1.5 bg-orange-50 rounded-lg">
                <span className="font-mono text-gray-600">{h.date}</span>
                <span className="text-gray-800">{h.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-gray-50 rounded-2xl p-6 space-y-3">
        <h3 className="font-bold text-gray-700">連携設定について</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
          <li><b>BERTH_API_URL</b>: 予約システムのURL（環境変数で設定）</li>
          <li><b>BERTH_KIOSK_SECRET</b>: キオスク認証キー（環境変数で設定）</li>
          <li><b>BERTH_SYNC_KEY</b>: 予約同期用キー（環境変数で設定、予約システム側のCSV_SYNC_KEYと同じ値）</li>
          <li>センターマスタ同期: 予約システムのセンターCDで紐づけ。新規センターは自動追加</li>
          <li>予約同期: 差分同期。前回同期以降の新規・取消イベントを取り込み</li>
          <li>祝日同期: 全件置換。予約システムの祝日設定をそのまま取り込み</li>
          <li>ドライバー同期: 電話番号+名前+会社名で照合。新規ドライバーは自動追加</li>
        </ul>
      </div>
    </div>
  );
}
