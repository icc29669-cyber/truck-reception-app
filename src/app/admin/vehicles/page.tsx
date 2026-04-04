"use client";

import { useState, useEffect, useCallback } from "react";

type Vehicle = {
  id: number;
  region: string;
  classNum: string;
  hira: string;
  number: string;
  vehicleNumber: string;
  maxLoad: string;
  phone: string;
  isActive: boolean;
};

type FormData = {
  region: string;
  classNum: string;
  hira: string;
  number: string;
  vehicleNumber: string;
  maxLoad: string;
  phone: string;
};

const emptyForm: FormData = {
  region: "",
  classNum: "",
  hira: "",
  number: "",
  vehicleNumber: "",
  maxLoad: "",
  phone: "",
};

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
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
      const res = await fetch("/api/admin/vehicles?" + params);
      const data = await res.json();
      setVehicles(Array.isArray(data) ? data : []);
    } catch {
      setVehicles([]);
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

  const openEdit = (v: Vehicle) => {
    setEditId(v.id);
    setForm({
      region: v.region,
      classNum: v.classNum,
      hira: v.hira,
      number: v.number,
      vehicleNumber: v.vehicleNumber,
      maxLoad: v.maxLoad,
      phone: v.phone,
    });
    setShowModal(true);
  };

  const buildVehicleNumber = (f: FormData) => {
    if (f.region || f.classNum || f.hira || f.number) {
      return [f.region, f.classNum, f.hira, f.number].filter(Boolean).join(" ");
    }
    return f.vehicleNumber;
  };

  const handleSave = async () => {
    const vn = buildVehicleNumber(form);
    if (!vn.trim()) return;
    const body = { ...form, vehicleNumber: vn };
    try {
      if (editId) {
        await fetch("/api/admin/vehicles/" + editId, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        showToast("更新しました");
      } else {
        await fetch("/api/admin/vehicles", {
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

  const toggleActive = async (v: Vehicle) => {
    try {
      await fetch("/api/admin/vehicles/" + v.id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !v.isActive }),
      });
      showToast(v.isActive ? "無効にしました" : "有効にしました");
      fetchData();
    } catch {
      showToast("エラーが発生しました");
    }
  };

  const handleDelete = async (v: Vehicle) => {
    if (!confirm("「" + v.vehicleNumber + "」を削除（無効化）しますか？")) return;
    try {
      await fetch("/api/admin/vehicles/" + v.id, { method: "DELETE" });
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
            placeholder="車両番号・地域・電話番号で検索..."
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
          <h2 className="text-lg font-bold text-gray-800">車両一覧</h2>
          {loading && <span className="text-sm text-gray-400">読込中...</span>}
          <span className="text-sm text-gray-500">{vehicles.length}件</span>
        </div>
        {vehicles.length === 0 && !loading ? (
          <div className="py-16 text-center text-gray-400">
            <div className="text-4xl mb-3">{"\u{1F69B}"}</div>
            <div className="text-lg font-semibold">データがありません</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {["ID", "車両番号", "地域", "分類", "ひらがな", "番号", "最大積載量", "電話番号", "状態", "操作"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vehicles.map((v, i) => (
                  <tr
                    key={v.id}
                    className={
                      "hover:bg-blue-50 transition-colors " +
                      (i % 2 === 0 ? "bg-white" : "bg-gray-50/50")
                    }
                  >
                    <td className="px-4 py-3 font-mono text-gray-500">{v.id}</td>
                    <td className="px-4 py-3 font-mono font-bold text-gray-900">{v.vehicleNumber}</td>
                    <td className="px-4 py-3 text-gray-700">{v.region || "\u2014"}</td>
                    <td className="px-4 py-3 text-gray-700">{v.classNum || "\u2014"}</td>
                    <td className="px-4 py-3 text-gray-700">{v.hira || "\u2014"}</td>
                    <td className="px-4 py-3 font-mono text-gray-700">{v.number || "\u2014"}</td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {v.maxLoad ? Number(v.maxLoad).toLocaleString() + " kg" : "\u2014"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono">{v.phone || "\u2014"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          "px-2 py-1 rounded-full text-xs font-bold " +
                          (v.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")
                        }
                      >
                        {v.isActive ? "有効" : "無効"}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(v)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-200 transition-colors"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => toggleActive(v)}
                          className={
                            "px-3 py-1 rounded-lg text-xs font-bold transition-colors " +
                            (v.isActive
                              ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                              : "bg-green-100 text-green-700 hover:bg-green-200")
                          }
                        >
                          {v.isActive ? "無効化" : "有効化"}
                        </button>
                        <button
                          onClick={() => handleDelete(v)}
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
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {editId ? "車両を編集" : "車両を追加"}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-600">地域</label>
                  <input
                    type="text"
                    value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value })}
                    className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none"
                    placeholder="例: 多摩"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-600">分類番号</label>
                  <input
                    type="text"
                    value={form.classNum}
                    onChange={(e) => setForm({ ...form, classNum: e.target.value })}
                    className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none"
                    placeholder="例: 500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-600">ひらがな</label>
                  <input
                    type="text"
                    value={form.hira}
                    onChange={(e) => setForm({ ...form, hira: e.target.value })}
                    className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none"
                    placeholder="例: あ"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-600">番号（4桁）</label>
                  <input
                    type="text"
                    value={form.number}
                    onChange={(e) => setForm({ ...form, number: e.target.value })}
                    className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none"
                    placeholder="例: 7917"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-600">車両番号（フォーマット済み）</label>
                <input
                  type="text"
                  value={form.vehicleNumber}
                  onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })}
                  className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none bg-gray-50"
                  placeholder="自動生成: 多摩 500 あ 7917"
                />
                <p className="text-xs text-gray-400">空欄の場合、地域+分類+ひらがな+番号から自動生成</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-600">最大積載量 (kg)</label>
                  <input
                    type="text"
                    value={form.maxLoad}
                    onChange={(e) => setForm({ ...form, maxLoad: e.target.value })}
                    className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none"
                    placeholder="例: 4000"
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
