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
type CenterFull = { id: number; code: string; name: string; secretKey: string; isActive: boolean; createdAt: string };

type Tab = "reception" | "centers";

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}
function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("reception");

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

  /* ─── センターマスタ state ─── */
  const [allCenters, setAllCenters] = useState<CenterFull[]>([]);
  const [centersLoading, setCentersLoading] = useState(false);
  const [centerEdit, setCenterEdit] = useState<CenterFull | null>(null);
  const [centerForm, setCenterForm] = useState({ code: "", name: "", secretKey: "" });
  const [centerSaving, setCenterSaving] = useState(false);
  const [showNewCenter, setShowNewCenter] = useState(false);
  const [kioskCenterId, setKioskCenterId] = useState<string>("");
  const [kioskSaving, setKioskSaving] = useState(false);

  useEffect(() => {
    const today = fmtDate(new Date());
    setDate(today);
    setExportFrom(today);
    setExportTo(today);
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
    } catch {
      showToast("通信エラーが発生しました");
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

  /* ─── センターマスタ管理 ─── */
  const fetchAllCenters = useCallback(async () => {
    setCentersLoading(true);
    try {
      const res = await fetch("/api/admin/centers");
      const data = await res.json();
      setAllCenters(Array.isArray(data) ? data : []);
    } catch { setAllCenters([]); }
    finally { setCentersLoading(false); }
  }, []);

  useEffect(() => {
    if (tab === "centers") {
      fetchAllCenters();
      // キオスク設定を取得
      fetch("/api/admin/settings").then(r => r.json()).then(data => {
        if (data.kiosk_center_id) setKioskCenterId(data.kiosk_center_id);
      }).catch(() => {});
    }
  }, [tab, fetchAllCenters]);

  function openCenterEdit(c: CenterFull) {
    setCenterEdit(c);
    setCenterForm({ code: c.code, name: c.name, secretKey: c.secretKey });
  }

  async function saveCenterEdit() {
    if (!centerEdit) return;
    setCenterSaving(true);
    try {
      const res = await fetch(`/api/admin/centers/${centerEdit.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(centerForm),
      });
      if (!res.ok) { const err = await res.json(); showToast(err.error || "更新失敗"); return; }
      setCenterEdit(null);
      fetchAllCenters();
      // 公開API側のキャッシュも更新
      fetch("/api/centers").then(r => r.json()).then(d => setCenters(Array.isArray(d) ? d : []));
      showToast("センターを更新しました");
    } catch { showToast("通信エラー"); }
    finally { setCenterSaving(false); }
  }

  async function createCenter() {
    setCenterSaving(true);
    try {
      const res = await fetch("/api/admin/centers", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(centerForm),
      });
      if (!res.ok) { const err = await res.json(); showToast(err.error || "作成失敗"); return; }
      setShowNewCenter(false);
      setCenterForm({ code: "", name: "", secretKey: "" });
      fetchAllCenters();
      fetch("/api/centers").then(r => r.json()).then(d => setCenters(Array.isArray(d) ? d : []));
      showToast("センターを追加しました");
    } catch { showToast("通信エラー"); }
    finally { setCenterSaving(false); }
  }

  async function toggleCenterActive(c: CenterFull) {
    try {
      await fetch(`/api/admin/centers/${c.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !c.isActive }),
      });
      fetchAllCenters();
      fetch("/api/centers").then(r => r.json()).then(d => setCenters(Array.isArray(d) ? d : []));
      showToast(c.isActive ? "無効化しました" : "有効化しました");
    } catch { showToast("通信エラー"); }
  }

  async function saveKioskCenter(newId: string) {
    setKioskCenterId(newId);
    setKioskSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "kiosk_center_id", value: newId }),
      });
      if (!res.ok) { showToast("保存に失敗しました"); return; }
      const c = allCenters.find(c => String(c.id) === newId);
      showToast(c ? `キオスクセンターを「${c.name}」に設定しました` : "設定を保存しました");
    } catch { showToast("通信エラー"); }
    finally { setKioskSaving(false); }
  }

  const tabBtn = (t: Tab, label: string) => (
    <button
      onClick={() => setTab(t)}
      className="px-6 py-3 font-bold rounded-t-xl transition-colors"
      style={{
        background: tab === t ? "#fff" : "transparent",
        color: tab === t ? "#1a3a6b" : "#94A3B8",
        borderBottom: tab === t ? "3px solid #1a3a6b" : "3px solid transparent",
        fontSize: 15,
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ color: "#111827" }}>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ─── タブ切替 ─── */}
        <div className="flex gap-1 bg-gray-100 rounded-xl px-2 pt-2">
          {tabBtn("reception", "受付一覧")}
          {tabBtn("centers", "センターマスタ")}
        </div>

        {/* ═══ 受付一覧タブ ═══ */}
        {tab === "reception" && (
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
        )}

        {/* ═══ センターマスタタブ ═══ */}
        {tab === "centers" && (
          <>
          {/* キオスク設定 */}
          <div className="bg-white rounded-2xl shadow p-5">
            <h2 className="text-lg font-bold text-gray-800 mb-3">キオスク表示センター</h2>
            <p className="text-sm text-gray-500 mb-4">キオスクTOP画面に表示するセンターを選択してください。この設定はキオスク端末に即時反映されます。</p>
            <div className="flex items-center gap-4">
              <select
                value={kioskCenterId}
                onChange={(e) => saveKioskCenter(e.target.value)}
                disabled={kioskSaving}
                className="border-2 border-gray-200 rounded-lg px-4 py-3 text-base font-bold focus:border-blue-500 outline-none"
                style={{ minWidth: 320 }}
              >
                <option value="">-- 未設定 --</option>
                {allCenters.filter(c => c.isActive).map(c => (
                  <option key={c.id} value={String(c.id)}>{c.code} {c.name}</option>
                ))}
              </select>
              {kioskSaving && <span className="text-sm text-gray-400">保存中...</span>}
            </div>
          </div>

          {/* センター一覧 */}
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">機材センター 一覧</h2>
              <button onClick={() => { setShowNewCenter(true); setCenterForm({ code: "", name: "", secretKey: "" }); }}
                className="px-5 py-2 bg-[#1a3a6b] text-white font-bold rounded-lg hover:bg-[#1E5799] transition-colors">
                + 新規追加
              </button>
            </div>

            {centersLoading ? (
              <div className="py-16 text-center text-gray-400">読込中...</div>
            ) : allCenters.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <div className="text-4xl mb-3">🏢</div>
                <div className="text-lg font-semibold">センターが登録されていません</div>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {["CD", "センター名", "ステータス", "作成日", "操作"].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allCenters.map((c, i) => (
                    <tr key={c.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                      <td className="px-6 py-4 font-mono font-black text-lg text-blue-700">{c.code || "—"}</td>
                      <td className="px-6 py-4 font-bold text-gray-800 text-base">{c.name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${c.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                          {c.isActive ? "有効" : "無効"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">{new Date(c.createdAt).toLocaleDateString("ja-JP")}</td>
                      <td className="px-6 py-4 flex gap-2">
                        <button onClick={() => openCenterEdit(c)}
                          className="px-4 py-1.5 bg-blue-50 text-blue-700 font-bold rounded-lg hover:bg-blue-100 transition-colors text-sm">
                          編集
                        </button>
                        <button onClick={() => toggleCenterActive(c)}
                          className={`px-4 py-1.5 font-bold rounded-lg transition-colors text-sm ${c.isActive ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-700 hover:bg-green-100"}`}>
                          {c.isActive ? "無効化" : "有効化"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          </>
        )}

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

      {/* ─── センター編集モーダル ─── */}
      {(centerEdit || showNewCenter) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { setCenterEdit(null); setShowNewCenter(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-800">{centerEdit ? "センター編集" : "センター新規追加"}</h3>
              <button onClick={() => { setCenterEdit(null); setShowNewCenter(false); }} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500">センターコード（4桁数字）</label>
                <input value={centerForm.code} onChange={(e) => setCenterForm((f) => ({ ...f, code: e.target.value }))}
                  maxLength={4} placeholder="例: 3101"
                  className="border-2 border-gray-200 rounded-lg px-3 py-2 text-lg font-mono font-bold focus:border-blue-500 outline-none" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500">センター名</label>
                <input value={centerForm.name} onChange={(e) => setCenterForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="例: 狭山機材センター"
                  className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500">シークレットキー（任意）</label>
                <input value={centerForm.secretKey} onChange={(e) => setCenterForm((f) => ({ ...f, secretKey: e.target.value }))}
                  placeholder="API認証用（空欄可）"
                  className="border-2 border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:border-blue-500 outline-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button onClick={() => { setCenterEdit(null); setShowNewCenter(false); }}
                className="px-5 py-2 border-2 border-gray-300 text-gray-600 font-bold rounded-lg hover:bg-gray-50 transition-colors">
                キャンセル
              </button>
              <button onClick={centerEdit ? saveCenterEdit : createCenter} disabled={centerSaving}
                className="px-6 py-2 bg-[#1a3a6b] text-white font-bold rounded-lg hover:bg-[#1E5799] transition-colors disabled:opacity-50">
                {centerSaving ? "保存中..." : centerEdit ? "更新" : "追加"}
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
