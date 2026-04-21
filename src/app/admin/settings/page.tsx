"use client";

import { useState, useEffect, useCallback } from "react";

/* --- Types --- */
type PlateRegion = { id: number; name: string; kana: string; sortOrder: number; isActive: boolean };
type PlateHiragana = { id: number; char: string; category: string; sortOrder: number; isActive: boolean };
type PlateAlphabet = { id: number; char: string; sortOrder: number; isActive: boolean };

type SettingsTab = "numberplate" | "printer";

const SETTINGS_TABS: { key: SettingsTab; label: string }[] = [
  { key: "numberplate", label: "ナンバープレート" },
  { key: "printer", label: "プリンタ設定" },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>("numberplate");
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
        {SETTINGS_TABS.map((t) => (
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
      {tab === "numberplate" && <NumberPlateSection showToast={showToast} />}
      {tab === "printer" && <PrinterTab showToast={showToast} />}
    </div>
  );
}

/* ===============================================================
   ナンバープレート Section (Regions + Hiragana + Alphabet)
   =============================================================== */
function NumberPlateSection({ showToast }: { showToast: (m: string) => void }) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    regions: true,
    hiragana: false,
    alphabet: false,
  });

  const toggle = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4">
      {/* Regions Accordion */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <button
          onClick={() => toggle("regions")}
          className="w-full px-6 py-4 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-lg font-bold text-gray-800">地名マスタ</h2>
          <span className="text-gray-400 text-xl">{openSections.regions ? "\u25B2" : "\u25BC"}</span>
        </button>
        {openSections.regions && <RegionsTab showToast={showToast} />}
      </div>

      {/* Hiragana Accordion */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <button
          onClick={() => toggle("hiragana")}
          className="w-full px-6 py-4 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-lg font-bold text-gray-800">ひらがなマスタ</h2>
          <span className="text-gray-400 text-xl">{openSections.hiragana ? "\u25B2" : "\u25BC"}</span>
        </button>
        {openSections.hiragana && <HiraganaTab showToast={showToast} />}
      </div>

      {/* Alphabet Accordion */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <button
          onClick={() => toggle("alphabet")}
          className="w-full px-6 py-4 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-lg font-bold text-gray-800">アルファベットマスタ</h2>
          <span className="text-gray-400 text-xl">{openSections.alphabet ? "\u25B2" : "\u25BC"}</span>
        </button>
        {openSections.alphabet && <AlphabetTab showToast={showToast} />}
      </div>
    </div>
  );
}

/* ===============================================================
   RegionsTab
   =============================================================== */
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
    if (!confirm("\u300C" + r.name + "\u300D\u3092\u524A\u9664\u3057\u307E\u3059\u304B\uFF1F")) return;
    try {
      await fetch("/api/admin/plate-regions/" + r.id, { method: "DELETE" });
      showToast("削除しました");
      fetchData();
    } catch { showToast("エラーが発生しました"); }
  };

  return (
    <>
      <div>
        <div className="px-6 py-3 flex items-center justify-end gap-3 border-b border-gray-100">
          {loading && <span className="text-sm text-gray-400">読込中...</span>}
          <span className="text-sm text-gray-500">{items.length}件</span>
          <button onClick={openAdd} className="px-4 py-1.5 bg-[#1a3a6b] text-white font-bold rounded-lg text-sm hover:bg-[#1E5799] transition-colors">+ 追加</button>
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

/* ===============================================================
   HiraganaTab
   =============================================================== */
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
    if (!confirm("\u300C" + h.char + "\u300D\u3092\u524A\u9664\u3057\u307E\u3059\u304B\uFF1F")) return;
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
      <div>
        <div className="px-6 py-3 flex items-center justify-end gap-3 border-b border-gray-100">
          {loading && <span className="text-sm text-gray-400">読込中...</span>}
          <span className="text-sm text-gray-500">{items.length}件</span>
          <button onClick={openAdd} className="px-4 py-1.5 bg-[#1a3a6b] text-white font-bold rounded-lg text-sm hover:bg-[#1E5799] transition-colors">+ 追加</button>
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

/* ===============================================================
   AlphabetTab
   =============================================================== */
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
    if (!confirm("\u300C" + a.char + "\u300D\u3092\u524A\u9664\u3057\u307E\u3059\u304B\uFF1F")) return;
    try {
      await fetch("/api/admin/plate-alphabet/" + a.id, { method: "DELETE" });
      showToast("削除しました");
      fetchData();
    } catch { showToast("エラーが発生しました"); }
  };

  return (
    <>
      <div>
        <div className="px-6 py-3 flex items-center justify-end gap-3 border-b border-gray-100">
          {loading && <span className="text-sm text-gray-400">読込中...</span>}
          <span className="text-sm text-gray-500">{items.length}件</span>
          <button onClick={openAdd} className="px-4 py-1.5 bg-[#1a3a6b] text-white font-bold rounded-lg text-sm hover:bg-[#1E5799] transition-colors">+ 追加</button>
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

/* ===============================================================
   PrinterTab
   =============================================================== */
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
      <div>プリンタ: ${printerName || "\uFF08\u672A\u8A2D\u5B9A\uFF09"}</div>
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
        <p className="text-sm text-gray-500">※ この設定はこの端末（ブラウザ）にのみ保存されます（端末ごとに異なるプリンタ構成に対応するため）</p>
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

