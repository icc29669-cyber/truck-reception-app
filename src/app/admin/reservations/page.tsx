"use client";

import { useState, useEffect, useCallback } from "react";

type Center = { id: number; name: string };

type Reservation = {
  id: number;
  centerId: number;
  phone: string;
  driverName: string;
  companyName: string;
  plateRegion: string;
  plateClassNum: string;
  plateHira: string;
  plateNumber: string;
  vehicleNumber: string;
  maxLoad: string;
  reservationDate: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string;
  center: { id: number; name: string };
};

type FormData = {
  centerId: string;
  phone: string;
  driverName: string;
  companyName: string;
  plateRegion: string;
  plateClassNum: string;
  plateHira: string;
  plateNumber: string;
  vehicleNumber: string;
  maxLoad: string;
  reservationDate: string;
  startTime: string;
  endTime: string;
  notes: string;
};

const emptyForm: FormData = {
  centerId: "",
  phone: "",
  driverName: "",
  companyName: "",
  plateRegion: "",
  plateClassNum: "",
  plateHira: "",
  plateNumber: "",
  vehicleNumber: "",
  maxLoad: "",
  reservationDate: "",
  startTime: "",
  endTime: "",
  notes: "",
};

function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

const STATUS_LIST = [
  { key: "", label: "全て" },
  { key: "pending", label: "予約済" },
  { key: "checked_in", label: "受付済" },
  { key: "completed", label: "完了" },
  { key: "cancelled", label: "キャンセル" },
  { key: "no_show", label: "不来" },
];

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    pending: "bg-blue-100 text-blue-700",
    checked_in: "bg-green-100 text-green-700",
    completed: "bg-gray-100 text-gray-700",
    cancelled: "bg-red-100 text-red-700",
    no_show: "bg-orange-100 text-orange-700",
  };
  return map[s] || "bg-gray-100 text-gray-700";
};

const statusLabel = (s: string) => {
  const map: Record<string, string> = {
    pending: "予約済",
    checked_in: "受付済",
    completed: "完了",
    cancelled: "キャンセル",
    no_show: "不来",
  };
  return map[s] || s;
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState("");
  const [filterCenterId, setFilterCenterId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetch("/api/admin/centers")
      .then((r) => r.json())
      .then((d) => setCenters(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setDate(fmtDate(new Date()));
  }, []);

  const fetchData = useCallback(async () => {
    if (!date) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (date) params.set("date", date);
      if (filterCenterId) params.set("centerId", filterCenterId);
      if (filterStatus) params.set("status", filterStatus);
      const res = await fetch("/api/admin/reservations?" + params);
      const data = await res.json();
      setReservations(Array.isArray(data) ? data : []);
    } catch {
      setReservations([]);
    } finally {
      setLoading(false);
    }
  }, [date, filterCenterId, filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openAdd = () => {
    setEditId(null);
    setForm({ ...emptyForm, reservationDate: date });
    setShowModal(true);
  };

  const openEdit = (r: Reservation) => {
    setEditId(r.id);
    setForm({
      centerId: String(r.centerId),
      phone: r.phone,
      driverName: r.driverName,
      companyName: r.companyName,
      plateRegion: r.plateRegion,
      plateClassNum: r.plateClassNum,
      plateHira: r.plateHira,
      plateNumber: r.plateNumber,
      vehicleNumber: r.vehicleNumber,
      maxLoad: r.maxLoad,
      reservationDate: r.reservationDate.slice(0, 10),
      startTime: r.startTime,
      endTime: r.endTime,
      notes: r.notes,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.centerId || !form.reservationDate || !form.startTime || !form.endTime) return;
    try {
      if (editId) {
        await fetch("/api/admin/reservations/" + editId, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        showToast("更新しました");
      } else {
        await fetch("/api/admin/reservations", {
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

  const handleCancel = async (r: Reservation) => {
    if (!confirm("この予約をキャンセルしますか？")) return;
    try {
      await fetch("/api/admin/reservations/" + r.id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      showToast("キャンセルしました");
      fetchData();
    } catch {
      showToast("エラーが発生しました");
    }
  };

  const handleDelete = async (r: Reservation) => {
    if (!confirm("この予約を削除しますか？")) return;
    try {
      await fetch("/api/admin/reservations/" + r.id, { method: "DELETE" });
      showToast("削除しました");
      fetchData();
    } catch {
      showToast("エラーが発生しました");
    }
  };

  const handleStatusChange = async (r: Reservation, newStatus: string) => {
    try {
      await fetch("/api/admin/reservations/" + r.id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      showToast("ステータス���変更しました");
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

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow p-5 flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-600">予約日</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-600">センター</label>
          <select
            value={filterCenterId}
            onChange={(e) => setFilterCenterId(e.target.value)}
            className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none"
            style={{ minWidth: 180 }}
          >
            <option value="">全センター</option>
            {centers.map((c) => (
              <option key={c.id} value={String(c.id)}>{c.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setDate(fmtDate(new Date()))}
          className="px-4 py-2 border-2 border-gray-300 text-gray-600 font-bold rounded-lg hover:bg-gray-50 transition-colors"
        >
          今日
        </button>
        <button
          onClick={openAdd}
          className="px-5 py-2 bg-[#1a3a6b] text-white font-bold rounded-lg hover:bg-[#1E5799] transition-colors ml-auto"
        >
          + 新規予約
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl shadow p-2">
        {STATUS_LIST.map((s) => (
          <button
            key={s.key}
            onClick={() => setFilterStatus(s.key)}
            className={
              "px-4 py-2 rounded-xl text-sm font-bold transition-colors " +
              (filterStatus === s.key
                ? "bg-[#1a3a6b] text-white"
                : "text-gray-600 hover:bg-gray-100")
            }
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">予約一覧</h2>
          {loading && <span className="text-sm text-gray-400">読込中...</span>}
          <span className="text-sm text-gray-500">{reservations.length}件</span>
        </div>
        {reservations.length === 0 && !loading ? (
          <div className="py-16 text-center text-gray-400">
            <div className="text-4xl mb-3">{"\u{1F4C5}"}</div>
            <div className="text-lg font-semibold">予約がありません</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {["予約日", "時間帯", "センター", "ドライバー名", "会社名", "車両番号", "積載量", "電話番号", "ステータス", "メモ", "操作"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reservations.map((r, i) => (
                  <tr
                    key={r.id}
                    className={
                      "hover:bg-blue-50 transition-colors " +
                      (i % 2 === 0 ? "bg-white" : "bg-gray-50/50")
                    }
                  >
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {r.reservationDate.slice(0, 10)}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-700 whitespace-nowrap">
                      {r.startTime} - {r.endTime}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {r.center?.name || "\u2014"}
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900 whitespace-nowrap">
                      {r.driverName || "\u2014"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">
                      {r.companyName || "\u2014"}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-800 whitespace-nowrap">
                      {r.vehicleNumber || "\u2014"}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 whitespace-nowrap">
                      {r.maxLoad ? Number(r.maxLoad).toLocaleString() + " kg" : "\u2014"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono whitespace-nowrap">
                      {r.phone || "\u2014"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={"px-2 py-1 rounded-full text-xs font-bold " + statusBadge(r.status)}>
                        {statusLabel(r.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-[150px] truncate" title={r.notes || ""}>
                      {r.notes || "\u2014"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(r)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-200 transition-colors"
                        >
                          編集
                        </button>
                        {r.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleStatusChange(r, "checked_in")}
                              className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold hover:bg-green-200 transition-colors"
                            >
                              受付
                            </button>
                            <button
                              onClick={() => handleCancel(r)}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold hover:bg-red-200 transition-colors"
                            >
                              キャンセル
                            </button>
                          </>
                        )}
                        {r.status === "checked_in" && (
                          <button
                            onClick={() => handleStatusChange(r, "completed")}
                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-300 transition-colors"
                          >
                            完了
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(r)}
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
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center overflow-y-auto py-8">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {editId ? "予約を編集" : "新規予約を追加"}
            </h3>
            <div className="space-y-4">
              {/* Row 1: Center & Date */}
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-600">センター *</label>
                  <select
                    value={form.centerId}
                    onChange={(e) => setForm({ ...form, centerId: e.target.value })}
                    className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none"
                  >
                    <option value="">選択...</option>
                    {centers.map((c) => (
                      <option key={c.id} value={String(c.id)}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-600">予約日 *</label>
                  <input
                    type="date"
                    value={form.reservationDate}
                    onChange={(e) => setForm({ ...form, reservationDate: e.target.value })}
                    className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-600">電話番号</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none"
                    placeholder="09012345678"
                  />
                </div>
              </div>

              {/* Row 2: Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-600">開始時刻 *</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-600">終了時刻 *</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Row 3: Driver & Company */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-600">ドライバー名</label>
                  <input
                    type="text"
                    value={form.driverName}
                    onChange={(e) => setForm({ ...form, driverName: e.target.value })}
                    className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none"
                    placeholder="ヤマダ タロウ"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-600">会社名</label>
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none"
                    placeholder="〇〇運送"
                  />
                </div>
              </div>

              {/* Row 4: Vehicle */}
              <div className="grid grid-cols-4 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-600">地域</label>
                  <input
                    type="text"
                    value={form.plateRegion}
                    onChange={(e) => setForm({ ...form, plateRegion: e.target.value })}
                    className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none"
                    placeholder="多摩"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-600">分類</label>
                  <input
                    type="text"
                    value={form.plateClassNum}
                    onChange={(e) => setForm({ ...form, plateClassNum: e.target.value })}
                    className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none"
                    placeholder="500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-600">ひらがな</label>
                  <input
                    type="text"
                    value={form.plateHira}
                    onChange={(e) => setForm({ ...form, plateHira: e.target.value })}
                    className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none"
                    placeholder="あ"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-600">番号</label>
                  <input
                    type="text"
                    value={form.plateNumber}
                    onChange={(e) => setForm({ ...form, plateNumber: e.target.value })}
                    className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none"
                    placeholder="7917"
                  />
                </div>
              </div>

              {/* Row 5: Vehicle number & Load */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-600">車両番号</label>
                  <input
                    type="text"
                    value={form.vehicleNumber}
                    onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })}
                    className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none"
                    placeholder="多摩 500 あ 7917"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-600">最大積載量 (kg)</label>
                  <input
                    type="text"
                    value={form.maxLoad}
                    onChange={(e) => setForm({ ...form, maxLoad: e.target.value })}
                    className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none"
                    placeholder="4000"
                  />
                </div>
              </div>

              {/* Row 6: Notes */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-600">備考</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none"
                  rows={2}
                  placeholder="メモ・備考"
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
