"use client";
import { useState, useEffect, useCallback } from "react";

type Reception = {
  id: number;
  centerDailyNo: number;
  arrivedAt: string;
  centerName: string;
  companyName: string;
  driverName: string;
  phone: string;
  vehicleNumber: string;
  maxLoad: string;
};

type Center = { id: number; name: string };

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}
function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function AdminPage() {
  const [centers, setCenters] = useState<Center[]>([]);
  const [centerId, setCenterId] = useState<string>("");
  const [date, setDate] = useState<string>(fmtDate(new Date()));
  const [receptions, setReceptions] = useState<Reception[]>([]);
  const [loading, setLoading] = useState(false);
  const [exportFrom, setExportFrom] = useState(fmtDate(new Date()));
  const [exportTo, setExportTo]   = useState(fmtDate(new Date()));
  const [refreshKey, setRefreshKey] = useState(0);

  // センター一覧取得
  useEffect(() => {
    fetch("/api/centers")
      .then((r) => r.json())
      .then((d) => setCenters(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  // 受付一覧取得
  const fetchReceptions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ date });
      if (centerId) params.set("centerId", centerId);
      const res = await fetch(`/api/admin/receptions?${params}`);
      const data = await res.json();
      setReceptions(Array.isArray(data) ? data : []);
    } catch {
      setReceptions([]);
    } finally {
      setLoading(false);
    }
  }, [date, centerId]);

  useEffect(() => { fetchReceptions(); }, [fetchReceptions, refreshKey]);

  // CSV出力
  function handleExport() {
    const params = new URLSearchParams({ from: exportFrom, to: exportTo });
    if (centerId) params.set("centerId", centerId);
    window.open(`/api/admin/export?${params}`, "_blank");
  }

  return (
    <div className="min-h-screen" style={{ background: "#F8FAFC", color: "#111827", overflow: "auto" }}>
      {/* ヘッダー */}
      <div className="bg-[#1a3a6b] text-white px-8 py-4 flex items-center gap-6">
        <h1 className="text-2xl font-black tracking-wide flex-1">
          🚛 トラック受付　管理画面
        </h1>
        <span className="text-sm text-blue-200">
          {new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* ─── フィルターバー ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow p-5 flex flex-wrap gap-4 items-end">
          {/* センター選択 */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-600">センター</label>
            <select
              value={centerId}
              onChange={(e) => setCenterId(e.target.value)}
              className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none"
              style={{ minWidth: 200 }}
            >
              <option value="">全センター</option>
              {centers.map((c) => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* 日付選択 */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-600">日付</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none"
            />
          </div>

          {/* 更新ボタン */}
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="px-5 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 更新
          </button>

          {/* 今日に戻る */}
          <button
            onClick={() => setDate(fmtDate(new Date()))}
            className="px-4 py-2 border-2 border-gray-300 text-gray-600 font-bold rounded-lg hover:bg-gray-50 transition-colors"
          >
            今日
          </button>

          {/* 件数バッジ */}
          <div className="ml-auto flex items-center gap-3">
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-2 text-center">
              <div className="text-3xl font-black text-blue-700">{receptions.length}</div>
              <div className="text-xs font-semibold text-blue-500">本日受付</div>
            </div>
          </div>
        </div>

        {/* ─── 受付一覧テーブル ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">受付一覧</h2>
            {loading && <span className="text-sm text-gray-400">読込中...</span>}
          </div>

          {receptions.length === 0 && !loading ? (
            <div className="py-16 text-center text-gray-400">
              <div className="text-4xl mb-3">📋</div>
              <div className="text-lg font-semibold">この日の受付はありません</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {["No.", "時刻", "センター", "運送会社", "ドライバー名", "電話番号", "車番", "積載量(kg)"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {receptions.map((r, i) => (
                    <tr
                      key={r.id}
                      className={`hover:bg-blue-50 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                    >
                      <td className="px-4 py-3 font-black text-blue-600 text-base">
                        {r.centerDailyNo}
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-mono text-sm whitespace-nowrap">
                        {fmtTime(r.arrivedAt)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {r.centerName}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">
                        {r.companyName}
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900 whitespace-nowrap">
                        {r.driverName}
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-mono whitespace-nowrap">
                        {r.phone.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3")}
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-800 whitespace-nowrap">
                        {r.vehicleNumber || "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700 whitespace-nowrap">
                        {r.maxLoad ? Number(r.maxLoad).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ─── CSV出力 ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow p-5">
          <h2 className="text-lg font-bold text-gray-800 mb-4">📥 CSV出力</h2>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-600">開始日</label>
              <input
                type="date"
                value={exportFrom}
                onChange={(e) => setExportFrom(e.target.value)}
                className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-600">終了日</label>
              <input
                type="date"
                value={exportTo}
                onChange={(e) => setExportTo(e.target.value)}
                className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none"
              />
            </div>
            <button
              onClick={handleExport}
              className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              📥 CSVダウンロード
            </button>
            <p className="text-sm text-gray-500">
              ※ BOM付きUTF-8形式（Excelで直接開けます）
            </p>
          </div>
        </div>

        {/* ─── リンク ───────────────────────────────────────────── */}
        <div className="text-center">
          <a
            href="/kiosk"
            className="text-blue-600 hover:underline text-sm"
          >
            ← キオスク画面に戻る
          </a>
        </div>
      </div>
    </div>
  );
}
