"use client";

import { useState, useEffect, useCallback } from "react";

type Company = {
  id: number;
  name: string;
  phone: string;
  isActive: boolean;
  driverCount?: number;
};

type FormData = { name: string; phone: string };
const emptyForm: FormData = { name: "", phone: "" };

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch("/api/admin/companies?" + params);
      const data = await res.json();
      setCompanies(Array.isArray(data) ? data : []);
    } catch {
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (c: Company) => {
    setEditId(c.id);
    setForm({ name: c.name, phone: c.phone });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    try {
      if (editId) {
        await fetch("/api/admin/companies/" + editId, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        showToast("更新しました");
      } else {
        await fetch("/api/admin/companies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        showToast("追加しました");
      }
      setShowModal(false);
      fetchData();
    } catch {
      showToast("エラーが発生しました");
    }
  };

  const toggleActive = async (c: Company) => {
    try {
      await fetch("/api/admin/companies/" + c.id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !c.isActive }),
      });
      showToast(c.isActive ? "無効にしました" : "有効にしました");
      fetchData();
    } catch {
      showToast("エラーが発生しました");
    }
  };

  const handleDelete = async (c: Company) => {
    if (!confirm("「" + c.name + "」を削除（無効化）しますか？")) return;
    try {
      await fetch("/api/admin/companies/" + c.id, { method: "DELETE" });
      showToast("削除しました");
      fetchData();
    } catch {
      showToast("エラーが発生しました");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6" style={{ color: "#111827" }}>
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg font-semibold">
          {toast}
        </div>
      )}

      {/* Search & Add */}
      <div className="bg-white rounded-2xl shadow p-5 flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-sm font-semibold text-gray-600">検索</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="会社名・電話番号で検索..."
            className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none"
          />
        </div>
        <button
          onClick={openAdd}
          className="px-5 py-2 bg-[#1a3a6b] text-white font-bold rounded-lg hover:bg-[#1E5799] transition-colors"
        >
          + 新規追加
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">運送会社一覧</h2>
          {loading && <span className="text-sm text-gray-400">読込中...</span>}
          <span className="text-sm text-gray-500">{companies.length}件</span>
        </div>
        {companies.length === 0 && !loading ? (
          <div className="py-16 text-center text-gray-400">
            <div className="text-4xl mb-3">{"\u{1F3E2}"}</div>
            <div className="text-lg font-semibold">データがありません</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {["ID", "会社名", "電話番号", "ドライバー数", "状態", "操作"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {companies.map((c, i) => (
                  <tr
                    key={c.id}
                    className={
                      "hover:bg-blue-50 transition-colors " +
                      (i % 2 === 0 ? "bg-white" : "bg-gray-50/50")
                    }
                  >
                    <td className="px-4 py-3 font-mono text-gray-500">{c.id}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{c.name}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono">{c.phone || "\u2014"}</td>
                    <td className="px-4 py-3 text-center">
                      {c.driverCount != null ? (
                        <span
                          className={
                            "inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-xs font-bold " +
                            (c.driverCount > 0
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-400")
                          }
                        >
                          {c.driverCount}
                        </span>
                      ) : (
                        <span className="text-gray-300">{"\u2014"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          "px-2 py-1 rounded-full text-xs font-bold " +
                          (c.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700")
                        }
                      >
                        {c.isActive ? "有効" : "無効"}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(c)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-200 transition-colors"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => toggleActive(c)}
                          className={
                            "px-3 py-1 rounded-lg text-xs font-bold transition-colors " +
                            (c.isActive
                              ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                              : "bg-green-100 text-green-700 hover:bg-green-200")
                          }
                        >
                          {c.isActive ? "無効化" : "有効化"}
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold hover:bg-red-200 transition-colors"
                        >
                          削除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {editId ? "運送会社を編集" : "運送会社を追加"}
            </h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-600">会社名 *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none"
                  placeholder="例: 〇〇運送株式会社"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-600">電話番号</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none"
                  placeholder="例: 03-1234-5678"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 bg-[#1a3a6b] text-white font-bold rounded-lg hover:bg-[#1E5799] transition-colors"
              >
                {editId ? "更新" : "追加"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
