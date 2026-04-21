"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type Dashboard = {
  center: { id: number; code: string; name: string; openTime: string; closeTime: string };
  kpi: {
    receptionsToday: number;
    reservationsToday: number;
    uncheckedInToday: number;
    userCount: number;
    lastReceptionAt: string | null;
    isOpenNow: boolean;
  };
  nextReservations: Array<{
    id: number; startTime: string; endTime: string;
    companyName: string; driverName: string; plateNumber: string;
  }>;
  recentReceptions: Array<{
    id: number; centerDailyNo: number; arrivedAt: string;
    companyName: string; driverName: string; vehicleNumber: string;
  }>;
  jstDate: string;
};

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

export default function AdminDashboard() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/dashboard");
      if (!res.ok) return;
      setData(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);
  useEffect(() => {
    const t = setInterval(() => setRefreshKey((k) => k + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  if (!data) {
    return <div className="text-center text-gray-400 py-20">{loading ? "読み込み中..." : "データなし"}</div>;
  }
  const { center, kpi, nextReservations, recentReceptions } = data;

  return (
    <div style={{ color: "#111827" }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ── センターヘッダー ── */}
        <div className="bg-white rounded-2xl shadow p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl`}
              style={{ background: kpi.isOpenNow ? "#1a3a6b" : "#64748b" }}>
              {"\u{1F3ED}"}
            </div>
            <div>
              <div className="text-xs font-bold text-gray-500">{center.code}</div>
              <div className="text-2xl font-black text-gray-800">{center.name}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                営業時間 {center.openTime}–{center.closeTime}
                <span className={`ml-3 px-2 py-0.5 rounded-full text-xs font-bold ${
                  kpi.isOpenNow ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"
                }`}>{kpi.isOpenNow ? "営業中" : "時間外"}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400">{data.jstDate}</div>
            <button onClick={() => setRefreshKey((k) => k + 1)}
              className="mt-2 px-4 py-1.5 bg-[#1a3a6b] text-white text-sm font-bold rounded-lg hover:bg-[#1E5799]">
              {loading ? "更新中..." : "更新"}
            </button>
          </div>
        </div>

        {/* ── KPI ── */}
        <div className="grid grid-cols-4 gap-4">
          <KpiTile label="本日受付数" value={kpi.receptionsToday} color="#2563eb" href="/admin/receptions" />
          <KpiTile label="本日予約数" value={kpi.reservationsToday} color="#16a34a" href="/admin/reservations" />
          <KpiTile label="未チェックイン" value={kpi.uncheckedInToday} color={kpi.uncheckedInToday > 0 ? "#ea580c" : "#94a3b8"} href="/admin/reservations?status=pending" />
          <KpiTile label="最終受付" value={fmtTime(kpi.lastReceptionAt)} color="#7c3aed" />
        </div>

        {/* ── 本日の予約 + 最近の受付 ── */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-gray-800">今日の予約 (未受付)</h3>
              <Link href="/admin/reservations" className="text-xs text-blue-600 hover:underline">一覧へ →</Link>
            </div>
            {nextReservations.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">未チェックインの予約はありません</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {nextReservations.map((r) => (
                  <div key={r.id} className="py-2 flex items-center gap-3 text-sm">
                    <span className="font-mono font-bold text-blue-600 w-24">{r.startTime}–{r.endTime}</span>
                    <span className="font-semibold flex-1 truncate">{r.companyName} {r.driverName}</span>
                    {r.plateNumber && <span className="text-gray-500 font-mono text-xs">{r.plateNumber}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-gray-800">最近の受付</h3>
              <Link href="/admin/receptions" className="text-xs text-blue-600 hover:underline">一覧へ →</Link>
            </div>
            {recentReceptions.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">本日の受付はまだありません</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentReceptions.map((r) => (
                  <div key={r.id} className="py-2 flex items-center gap-3 text-sm">
                    <span className="font-mono font-black text-blue-600 w-10 text-right">#{r.centerDailyNo}</span>
                    <span className="font-mono text-gray-500 w-12">{fmtTime(r.arrivedAt)}</span>
                    <span className="font-semibold flex-1 truncate">{r.companyName} {r.driverName}</span>
                    {r.vehicleNumber && <span className="text-gray-400 text-xs font-mono">{r.vehicleNumber}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiTile({ label, value, color, href }: { label: string; value: number | string; color: string; href?: string }) {
  const body = (
    <div className="bg-white rounded-2xl shadow p-5 flex flex-col hover:shadow-md transition">
      <span className="text-xs font-bold text-gray-500">{label}</span>
      <span className="text-4xl font-black mt-1" style={{ color }}>{value}</span>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}
