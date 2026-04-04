"use client";

import { useState, useEffect, useCallback } from "react";

type Company = { id: number; name: string };

type Driver = {
  id: number;
  name: string;
  companyName: string;
  phone: string;
  isActive: boolean;
  companyId: number | null;
  company: Company | null;
};

type FormData = {
  name: string;
  companyName: string;
  phone: string;
  companyId: string;
};
const emptyForm: FormData = { name: "", companyName: "", phone: "", companyId: "" };

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCompanyId, setFilterCompanyId] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetch("/api/admin/companies")
      .then((r) => r.json())
      .then((d) => setCompanies(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterCompanyId) params.set("companyId", filterCompanyId);
      const res = await fetch("/api/admin/drivers?" + params);
      const data = await res.json();
      setDrivers(Array.isArray(data) ? data : []);
    } catch {
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  }, [search, filterCompanyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (d: Driver) => {
    setEditId(d.id);
    setForm({
      name: d.name,
      companyName: d.companyName,
      phone: d.phone,
      companyId: d.companyId ? String(d.companyId) : "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const body = {
      name: form.name,
      companyName: form.companyName || companies.find((c) => c.id === Number(form.companyId))?.name || "",
      phone: form.phone,
      companyId: form.companyId ? Number(form.companyId) : null,
    };
    try {
      if (editId) {
        await fetch("/api/admin/drivers/" + editId, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        showToast("更新しました");
      } else {
        await fetch("/api/admin/drivers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        showToast("追加しました");
      }
      setShowModal(false);
      fetchData();
    } catch {
      showToast("エラーが発生しました");
    }
  };

  const toggleActive = async (d: Driver) => {
    try {
      await fetch("/api/admin/drivers/" + d.id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !d.isActive }),
      });
      showToast(d.isActive ? "無効にしました" : "有効にしました");
      fetchData();
    } catch {
      showToast("エラーが発生しました");
    }
  };

  const handleDelete = async (d: Driver) => {
    if (!confirm("「" + d.name + "」を削除（無効化）しますか？")) return;
    try {
      await fetch("/api/admin/drivers/" + d.id, { method: "DELETE" });
      showToast("削除しました");
      fetchData();
    } catch {
      showToast("エラーが発生しました");
    }
  };

  // Auto-fill company name when company is selected in form
  const handleCompanySelect = (companyId: string) => {
    const comp = companies.find((c) => c.id === Number(companyId));
    setForm({
      ...form,
      companyId,
      companyName: comp ? comp.name : form.companyName,
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6" style={{ color: "#111827" }}>
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg font-semibold">
          {toast}
        </div>
      )}

      {/* Search & Filter */}
      <div className="bg-white rounded-2xl shadow p-5 flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-sm font-semibold text-gray-600">検索</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="氏名・会社名・電話番号で検索..."
            className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-600">会社フィルタ</label>
          <select
            value={filterCompanyId}
            onChange={(e) => setFilterCompanyId(e.target.value)}
            className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none"
            style={{ minWidth: 200 }}
          >
            <option value="">全会社</option>
            {companies.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
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
          <h2 className="text-lg font-bold text-gray-800">ドライバー一覧</h2>
          {loading && <span className="text-sm text-gray-400">読込中...</span>}
          <span className="text-sm text-gray-500">{drivers.length}件</span>
        </div>
        {drivers.length === 0 && !loading ? (
          <div className="py-16 text-center text-gray-400">
            <div className="text-4xl mb-3">{"\u{1F464}"}</div>
            <div className="text-lg font-semibold">データがありません</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {["ID", "氏名", "会社名", "電話番号", "状態", "操作"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {drivers.map((d, i) => (
                  <tr
                    key={d.id}
                    className={
                      "hover:bg-blue-50 transition-colors " +
                      (i % 2 === 0 ? "bg-white" : "bg-gray-50/50")
                    }
                  >
                    <td className="px-4 py-3 font-mono text-gray-500">{d.id}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">{d.name}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{d.companyName || (d.company?.name ?? "\u2014")}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono">{d.phone || "\u2014"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          "px-2 py-1 rounded-full text-xs font-bold " +
                          (d.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")
                        }
                      >
                        {d.isActive ? "有効" : "無効"}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(d)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-200 transition-colors"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => toggleActive(d)}
                          className={
                            "px-3 py-1 rounded-lg text-xs font-bold transition-colors " +
                            (d.isActive
                              ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                              : "bg-green-100 text-green-700 hover:bg-green-200")
                          }
                        >
                          {d.isActive ? "無効化" : "有効化"}
                        </button>
                        <button
                          onClick={() => handleDelete(d)}
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
              {editId ? "ドライバーを編集" : "ドライバーを追加"}
            </h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-600">氏名 *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none"
                  placeholder="例: ヤマダ タロウ"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-600">運送会社</label>
                <select
                  value={form.companyId}
                  onChange={(e) => handleCompanySelect(e.target.value)}
                  className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none"
                >
                  <option value="">未選択</option>
                  {companies.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-600">会社名（手入力）</label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none"
                  placeholder="会社選択で自動入力されます"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-600">電話番号</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none"
                  placeholder="例: 09012345678"
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
