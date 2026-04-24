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
  plateRegion: string;
  plateClassNum: string;
  plateHira: string;
  plateNumber: string;
  maxLoad: string;
  reservation: { id: number; startTime: string; endTime: string; status: string } | null;
};

type Center = { id: number; code: string; name: string };
// 受付一覧専用ページ（センター管理は /admin/centers に分離済み）

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}
function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function AdminPage() {
  // 受付一覧専用ページ

  /* ─── 受付管理 state ─── */
  const [centers, setCenters] = useState<Center[]>([]);
  const [centerId, setCenterId] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [receptions, setReceptions] = useState<Reception[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo]   = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<string>("");
  const [search, setSearch] = useState("");
  const [editTarget, setEditTarget] = useState<Reception | null>(null);
  const [editForm, setEditForm] = useState<Partial<Reception>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  // センターマスタは /admin/centers に移動済み

  useEffect(() => {
    const today = fmtDate(new Date());
    setDate(today);
    setExportFrom(today);
    setExportTo(today);
    // ログイン中ユーザーの所属センターを初期値にする
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.authenticated) setCenterId(String(d.user.centerId)); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/centers")
      .then((r) => r.json())
      .then((d) => setCenters(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const fetchReceptions = useCallback(async () => {
    if (!date) return;
    setLoading(true);
    setFetchError(false);
    try {
      const params = new URLSearchParams({ date });
      if (centerId) params.set("centerId", centerId);
      const res = await fetch(`/api/admin/receptions?${params}`);
      const data = await res.json();
      setReceptions(Array.isArray(data) ? data : []);
      setLastRefresh(new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch {
      setReceptions([]);
      setFetchError(true);
      showToast("受付データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [date, centerId]);

  useEffect(() => { fetchReceptions(); }, [fetchReceptions, refreshKey]);

  useEffect(() => {
    const interval = setInterval(() => { setRefreshKey((k) => k + 1); }, 30000);
    return () => clearInterval(interval);
  }, []);

  function handleExport() {
    const params = new URLSearchParams({ from: exportFrom, to: exportTo });
    if (centerId) params.set("centerId", centerId);
    window.open(`/api/admin/export?${params}`, "_blank");
  }

  function openEdit(r: Reception) {
    setEditTarget(r);
    setEditForm({
      companyName: r.companyName, driverName: r.driverName, phone: r.phone,
      plateRegion: r.plateRegion, plateClassNum: r.plateClassNum,
      plateHira: r.plateHira, plateNumber: r.plateNumber, maxLoad: r.maxLoad,
    });
  }

  async function saveEdit() {
    if (!editTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/receptions/${editTarget.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) {
        const err = await res.json();
        showToast(err.error || "更新に失敗しました");
        return;
      }
      setEditTarget(null);
      setRefreshKey((k) => k + 1);
      showToast("更新しました");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setSaving(false);
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  const filtered = search
    ? receptions.filter((r) => {
        const q = search.toLowerCase();
        return r.companyName.toLowerCase().includes(q) || r.driverName.toLowerCase().includes(q) ||
          r.phone.includes(q) || r.vehicleNumber.toLowerCase().includes(q) ||
          r.plateNumber.includes(q) || r.plateRegion.includes(q);
      })
    : receptions;

  return (
    <div style={{ color: "#111827" }}>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── ページタイトル ── */}
        <div>
          <h1 className="text-xl font-black text-gray-800">受付一覧</h1>
          <p className="text-gray-400 text-sm">本日の受付（チェックイン）記録</p>
        </div>

        {/* ═══ 受付一覧 ═══ */}
        <>
            {/* フィルターバー */}
            <div className="bg-white rounded-2xl shadow p-5 flex flex-wrap gap-4 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-600">センター</label>
                <select value={centerId} onChange={(e) => setCenterId(e.target.value)}
                  className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none"
                  style={{ minWidth: 200 }}>
                  <option value="">全センター</option>
                  {centers.map((c) => (
                    <option key={c.id} value={String(c.id)}>{c.code} {c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-600">日付</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none" />
              </div>
              <button onClick={() => setRefreshKey((k) => k + 1)}
                className="px-5 py-2 bg-[#1a3a6b] text-white font-bold rounded-lg hover:bg-[#1E5799] transition-colors">
                更新
              </button>
              <button onClick={() => setDate(fmtDate(new Date()))}
                className="px-4 py-2 border-2 border-gray-300 text-gray-600 font-bold rounded-lg hover:bg-gray-50 transition-colors">
                今日
              </button>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-600">検索</label>
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="会社名 / ドライバー / 電話番号 / 車番"
                  className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none"
                  style={{ minWidth: 280 }} />
              </div>
              <div className="ml-auto flex items-center gap-3">
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-2 text-center">
                  <div className="text-3xl font-black text-blue-700">{filtered.length}</div>
                  <div className="text-xs font-semibold text-blue-500">{search ? `${filtered.length}/${receptions.length} 件` : "本日受付"}</div>
                </div>
              </div>
            </div>

            {/* 受付一覧テーブル */}
            <div className="bg-white rounded-2xl shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-gray-800">受付一覧</h2>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">行クリックで編集</span>
                </div>
                {loading ? <span className="text-sm text-gray-400">読込中...</span> : lastRefresh && <span className="text-sm text-gray-400">最終更新: {lastRefresh}（30秒ごと自動更新）</span>}
              </div>
              {filtered.length === 0 && !loading ? (
                <div className="py-16 text-center text-gray-400">
                  {fetchError ? (
                    <>
                      <div className="text-4xl mb-3 text-red-400">&#x26A0;&#xFE0F;</div>
                      <div className="text-lg font-semibold text-red-500">データ取得に失敗しました。更新ボタンをクリックしてリトライしてください。</div>
                    </>
                  ) : (
                    <>
                      <div className="text-4xl mb-3">📋</div>
                      <div className="text-lg font-semibold">{search ? "該当する受付はありません" : "この日の受付はありません"}</div>
                    </>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        {["受付No", "時刻", "センター", "運送会社", "ドライバー名", "電話番号", "ナンバープレート", "積載量(kg)", "予約"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filtered.map((r, i) => (
                        <tr key={r.id} onClick={() => openEdit(r)}
                          className={`hover:bg-blue-50 transition-colors cursor-pointer ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                          <td className="px-4 py-3 font-black text-blue-600 text-base">{r.centerDailyNo}</td>
                          <td className="px-4 py-3 text-gray-700 font-mono text-sm whitespace-nowrap">{fmtTime(r.arrivedAt)}</td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.centerName}</td>
                          <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">{r.companyName}</td>
                          <td className="px-4 py-3 font-bold text-gray-900 whitespace-nowrap">{r.driverName}</td>
                          <td className="px-4 py-3 text-gray-600 font-mono whitespace-nowrap">{r.phone.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3")}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {r.plateRegion ? (
                              <span className="inline-flex items-center gap-1 bg-gray-100 rounded-lg px-3 py-1 font-mono text-sm">
                                <span className="font-bold">{r.plateRegion}</span>
                                <span className="text-gray-400">{r.plateClassNum}</span>
                                <span className="text-gray-500 mx-0.5">{r.plateHira}</span>
                                <span className="font-black text-gray-800">{r.plateNumber}</span>
                              </span>
                            ) : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700 whitespace-nowrap">{r.maxLoad ? Number(r.maxLoad).toLocaleString() : "—"}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {r.reservation ? (
                              <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                                {r.reservation.startTime}〜{r.reservation.endTime}
                              </span>
                            ) : <span className="text-gray-300">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* CSV出力 */}
            <div className="bg-white rounded-2xl shadow p-5">
              <h2 className="text-lg font-bold text-gray-800 mb-4">CSV出力</h2>
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-600">開始日</label>
                  <input type="date" value={exportFrom} onChange={(e) => setExportFrom(e.target.value)}
                    className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-600">終了日</label>
                  <input type="date" value={exportTo} onChange={(e) => setExportTo(e.target.value)}
                    className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none" />
                </div>
                <button onClick={handleExport}
                  className="px-6 py-2 bg-[#1a3a6b] text-white font-bold rounded-lg hover:bg-[#1E5799] transition-colors flex items-center gap-2">
                  CSVダウンロード
                </button>
                <p className="text-sm text-gray-500">※ BOM付きUTF-8形式（Excelで直接開けます）</p>
              </div>
            </div>
          </>
      </div>

      {/* ─── 受付編集モーダル ─── */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditTarget(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-800">受付情報の編集 (No.{editTarget.centerDailyNo})</h3>
              <button onClick={() => setEditTarget(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500">運送会社名</label>
                <input value={editForm.companyName ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, companyName: e.target.value }))}
                  className="border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500">ドライバー名</label>
                <input value={editForm.driverName ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, driverName: e.target.value }))}
                  className="border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500">電話番号</label>
                <input value={editForm.phone ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                  className="border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none font-mono" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500">最大積載量 (kg)</label>
                <input value={editForm.maxLoad ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, maxLoad: e.target.value }))}
                  className="border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none font-mono" />
              </div>
            </div>
            <div className="mt-4">
              <label className="text-xs font-bold text-gray-500 block mb-2">ナンバープレート</label>
              <div className="grid grid-cols-4 gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-gray-400">地名</span>
                  <input value={editForm.plateRegion ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, plateRegion: e.target.value }))}
                    className="border-2 border-gray-200 rounded-lg px-2 py-2 text-sm focus:border-blue-500 outline-none text-center" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-gray-400">分類番号</span>
                  <input value={editForm.plateClassNum ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, plateClassNum: e.target.value }))}
                    className="border-2 border-gray-200 rounded-lg px-2 py-2 text-sm focus:border-blue-500 outline-none text-center font-mono" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-gray-400">ひらがな</span>
                  <input value={editForm.plateHira ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, plateHira: e.target.value }))}
                    className="border-2 border-gray-200 rounded-lg px-2 py-2 text-sm focus:border-blue-500 outline-none text-center" maxLength={1} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-gray-400">番号</span>
                  <input value={editForm.plateNumber ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, plateNumber: e.target.value }))}
                    className="border-2 border-gray-200 rounded-lg px-2 py-2 text-sm focus:border-blue-500 outline-none text-center font-mono" maxLength={4} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button onClick={() => setEditTarget(null)}
                className="px-5 py-2 border-2 border-gray-300 text-gray-600 font-bold rounded-lg hover:bg-gray-50 transition-colors">
                キャンセル
              </button>
              <button onClick={saveEdit} disabled={saving}
                className="px-6 py-2 bg-[#1a3a6b] text-white font-bold rounded-lg hover:bg-[#1E5799] transition-colors disabled:opacity-50">
                {saving ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── トースト通知 ─── */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg font-bold text-sm animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}
