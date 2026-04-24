"use client";

import { useState, useEffect, useCallback } from "react";

/* --- Types --- */
type BreakPeriod = { type: "lunch" | "break"; start: string; end: string; message: string };
type Center = {
  id: number; code: string; name: string; secretKey: string; isActive: boolean;
  openTime: string; closeTime: string;
  hasBreak: boolean; breakStart: string; breakEnd: string;
  breaks: string; // JSON
  closedOnSunday: boolean; closedOnHoliday: boolean;
  messageOpen: string; messageBreak: string; messageClosed: string; messageOutsideHours: string;
  showInDriverApp: boolean;
};

/* --- Helpers --- */
function parseBreaks(raw: string | undefined): BreakPeriod[] {
  try { const p = JSON.parse(raw || "[]"); return Array.isArray(p) ? p : []; } catch { return []; }
}

export default function CentersPage() {
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

      <CentersTab showToast={showToast} />
    </div>
  );
}

/* ===============================================================
   CentersTab
   =============================================================== */
function CentersTab({ showToast }: { showToast: (m: string) => void }) {
  const [items, setItems] = useState<Center[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const defaultForm = {
    code: "", name: "", secretKey: "", isActive: true,
    openTime: "08:00", closeTime: "18:00",
    closedOnSunday: true, closedOnHoliday: true,
    messageOpen: "いらっしゃいませ",
    messageClosed: "本日の受付は終了しました",
    messageOutsideHours: "受付時間外です",
    showInDriverApp: true,
  };
  const [form, setForm] = useState(defaultForm);
  const [breaks, setBreaks] = useState<BreakPeriod[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const res = await fetch("/api/admin/centers");
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch { setItems([]); setFetchError(true); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => {
    setEditId(null); setForm({ ...defaultForm }); setBreaks([]); setShowModal(true);
  };
  const openEdit = (c: Center) => {
    setEditId(c.id);
    // breaks を解析（旧形式フォールバック）
    let bks = parseBreaks(c.breaks);
    if (bks.length === 0 && c.hasBreak) {
      bks = [{ type: "lunch", start: c.breakStart || "12:00", end: c.breakEnd || "13:00", message: c.messageBreak || "ただいま昼休みです　しばらくお待ちください" }];
    }
    setBreaks(bks);
    setForm({
      code: c.code || "", name: c.name, secretKey: c.secretKey, isActive: c.isActive,
      openTime: c.openTime || "08:00", closeTime: c.closeTime || "18:00",
      closedOnSunday: c.closedOnSunday ?? true, closedOnHoliday: c.closedOnHoliday ?? true,
      messageOpen: c.messageOpen || "いらっしゃいませ",
      messageClosed: c.messageClosed || "本日の受付は終了しました",
      messageOutsideHours: c.messageOutsideHours || "受付時間外です",
      showInDriverApp: c.showInDriverApp ?? true,
    });
    setShowModal(true);
  };

  const addBreak = (type: "lunch" | "break") => {
    const msg = type === "lunch" ? "ただいま昼休みです　しばらくお待ちください" : "ただいま休憩中です　しばらくお待ちください";
    const start = type === "lunch" ? "12:00" : "15:00";
    const end = type === "lunch" ? "13:00" : "15:15";
    setBreaks([...breaks, { type, start, end, message: msg }]);
  };

  const updateBreak = (idx: number, field: keyof BreakPeriod, value: string) => {
    const next = [...breaks];
    (next[idx] as Record<string, string>)[field] = value;
    setBreaks(next);
  };

  const removeBreak = (idx: number) => {
    setBreaks(breaks.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.code.trim()) return;
    // 旧フィールドとの互換性を保つ
    const hasBreak = breaks.length > 0;
    const firstLunch = breaks.find(b => b.type === "lunch");
    const payload = {
      ...form,
      breaks: JSON.stringify(breaks),
      hasBreak,
      breakStart: firstLunch?.start || "12:00",
      breakEnd: firstLunch?.end || "13:00",
      messageBreak: firstLunch?.message || "ただいま昼休みです　しばらくお待ちください",
    };
    try {
      if (editId) {
        const res = await fetch("/api/admin/centers/" + editId, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || `操作に失敗しました (${res.status})`); }
        showToast("更新しました");
      } else {
        const res = await fetch("/api/admin/centers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: form.code, name: form.name, secretKey: form.secretKey }) });
        if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || `操作に失敗しました (${res.status})`); }
        showToast("追加しました");
      }
      setShowModal(false);
      fetchData();
    } catch (e) { showToast(e instanceof Error ? e.message : "エラーが発生しました"); }
  };

  const toggleActive = async (c: Center) => {
    try {
      const res = await fetch("/api/admin/centers/" + c.id, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !c.isActive }) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || `操作に失敗しました (${res.status})`); }
      showToast(c.isActive ? "無効にしました" : "有効にしました");
      fetchData();
    } catch (e) { showToast(e instanceof Error ? e.message : "エラーが発生しました"); }
  };

  const handleDelete = async (c: Center) => {
    if (!confirm("「" + c.name + "」を削除しますか？\n関連データがあると削除できません")) return;
    try {
      const res = await fetch("/api/admin/centers/" + c.id, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "削除に失敗しました"); return; }
      showToast("削除しました");
      fetchData();
    } catch (e) { showToast(e instanceof Error ? e.message : "エラーが発生しました"); }
  };

  // テーブル用: breaks表示
  const renderBreaks = (c: Center) => {
    const bks = parseBreaks(c.breaks);
    if (bks.length === 0 && c.hasBreak) {
      return <span className="text-amber-600 font-bold text-xs">{c.breakStart}〜{c.breakEnd}</span>;
    }
    if (bks.length === 0) return <span className="text-gray-400 text-xs">なし</span>;
    return (
      <div className="flex flex-col gap-0.5">
        {bks.map((b, i) => (
          <span key={i} className={`text-xs font-bold ${b.type === "lunch" ? "text-amber-600" : "text-orange-500"}`}>
            {b.type === "lunch" ? "昼" : "休"} {b.start}〜{b.end}
          </span>
        ))}
      </div>
    );
  };

  return (
    <>
      {fetchError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">&#x26A0;&#xFE0F;</span>
            <div>
              <div className="font-bold text-red-700">データの取得に失敗しました</div>
              <div className="text-sm text-red-600">時間を置いて再読み込みしてください</div>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700"
          >
            再読み込み
          </button>
        </div>
      )}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">センター管理</h2>
          <div className="flex items-center gap-3">
            {loading && <span className="text-sm text-gray-400">読込中...</span>}
            <span className="text-sm text-gray-500">{items.length}件</span>
            <button onClick={openAdd} className="px-4 py-1.5 bg-[#1a3a6b] text-white font-bold rounded-lg text-sm hover:bg-[#1E5799] transition-colors">+ 追加</button>
          </div>
        </div>
        {items.length === 0 && !loading && !fetchError && (
          <div className="py-16 text-center text-gray-400">
            <div className="text-4xl mb-3">{"\u{1F3ED}"}</div>
            <div className="text-lg font-semibold">センターが登録されていません</div>
            <button
              onClick={openAdd}
              className="mt-4 px-5 py-2 bg-[#1a3a6b] text-white font-bold rounded-lg hover:bg-[#1E5799] transition-colors"
            >
              + 新規センターを追加
            </button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["CD", "センター名", "営業時間", "昼休み・休憩", "状態", "予約表示", "操作"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((c, i) => (
                <tr key={c.id} className={"hover:bg-blue-50 transition-colors " + (i % 2 === 0 ? "bg-white" : "bg-gray-50/50")}>
                  <td className="px-4 py-3 font-mono text-gray-700 font-bold">{c.code || "\u2014"}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{c.openTime || "08:00"} 〜 {c.closeTime || "18:00"}</td>
                  <td className="px-4 py-3">{renderBreaks(c)}</td>
                  <td className="px-4 py-3">
                    <span className={"px-2 py-1 rounded-full text-xs font-bold " + (c.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                      {c.isActive ? "有効" : "無効"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={"px-2 py-1 rounded-full text-xs font-bold " + (c.showInDriverApp !== false ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400")}>
                      {c.showInDriverApp !== false ? "表示" : "非表示"}
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
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center overflow-y-auto py-8">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{editId ? "センターを編集" : "センターを追加"}</h3>
            <div className="space-y-5">

              {/* -- 基本情報 -- */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">基本情報</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-600">センターCD *</label>
                    <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none font-mono" placeholder="例: 3101" maxLength={4} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-600">センター名 *</label>
                    <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none" placeholder="例: 東京センター" />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-600">シークレットキー</label>
                  <input type="text" value={form.secretKey} onChange={(e) => setForm({ ...form, secretKey: e.target.value })} className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none font-mono" placeholder="キオスク認証用キー" />
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} id="center-active" className="w-4 h-4" />
                    <label htmlFor="center-active" className="text-sm font-semibold text-gray-600">有効</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={form.showInDriverApp} onChange={(e) => setForm({ ...form, showInDriverApp: e.target.checked })} id="center-driver" className="w-4 h-4" />
                    <label htmlFor="center-driver" className="text-sm font-semibold text-gray-600">
                      予約アプリに表示
                      <span className="ml-1 text-xs text-gray-400 font-normal">（ドライバー予約画面のセンター選択肢）</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* -- 営業時間 -- */}
              <div className="bg-blue-50 rounded-xl p-4 space-y-3">
                <div className="text-xs font-bold text-blue-400 uppercase tracking-wider">営業時間</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-600">開始時間</label>
                    <input type="time" value={form.openTime} onChange={(e) => setForm({ ...form, openTime: e.target.value })} className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none font-mono" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-600">終了時間</label>
                    <input type="time" value={form.closeTime} onChange={(e) => setForm({ ...form, closeTime: e.target.value })} className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-blue-500 outline-none font-mono" />
                  </div>
                </div>
                <p className="text-xs text-blue-400">営業開始前 → 「時間外メッセージ」 / 営業終了後 → 「受付終了メッセージ」がTOP画面に表示されます</p>
              </div>

              {/* -- 昼休み・休憩 -- */}
              <div className="bg-amber-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-amber-500 uppercase tracking-wider">昼休み・休憩時間</div>
                  <div className="flex gap-2">
                    <button onClick={() => addBreak("lunch")} className="px-3 py-1 bg-amber-200 text-amber-800 rounded-lg text-xs font-bold hover:bg-amber-300 transition-colors">+ 昼休み</button>
                    <button onClick={() => addBreak("break")} className="px-3 py-1 bg-orange-200 text-orange-800 rounded-lg text-xs font-bold hover:bg-orange-300 transition-colors">+ 休憩</button>
                  </div>
                </div>
                {breaks.length === 0 && (
                  <p className="text-sm text-gray-400">昼休み・休憩は設定されていません</p>
                )}
                {breaks.map((b, i) => (
                  <div key={i} className={`rounded-lg p-3 space-y-2 ${b.type === "lunch" ? "bg-amber-100/60 border border-amber-200" : "bg-orange-100/60 border border-orange-200"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${b.type === "lunch" ? "bg-amber-500 text-white" : "bg-orange-500 text-white"}`}>
                          {b.type === "lunch" ? "昼休み" : "休憩"}
                        </span>
                        <select value={b.type} onChange={(e) => updateBreak(i, "type", e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-1 bg-white">
                          <option value="lunch">昼休み</option>
                          <option value="break">休憩</option>
                        </select>
                      </div>
                      <button onClick={() => removeBreak(i)} className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs font-bold hover:bg-red-200 transition-colors">削除</button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500">開始</label>
                        <input type="time" value={b.start} onChange={(e) => updateBreak(i, "start", e.target.value)} className="border-2 border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:border-amber-500 outline-none font-mono" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500">終了</label>
                        <input type="time" value={b.end} onChange={(e) => updateBreak(i, "end", e.target.value)} className="border-2 border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:border-amber-500 outline-none font-mono" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-gray-500">表示メッセージ</label>
                      <input type="text" value={b.message} onChange={(e) => updateBreak(i, "message", e.target.value)} className="border-2 border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:border-amber-500 outline-none" />
                    </div>
                  </div>
                ))}
              </div>

              {/* -- TOP画面メッセージ -- */}
              <div className="bg-teal-50 rounded-xl p-4 space-y-3">
                <div className="text-xs font-bold text-teal-500 uppercase tracking-wider">TOP画面メッセージ</div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-600">営業中メッセージ</label>
                  <input type="text" value={form.messageOpen} onChange={(e) => setForm({ ...form, messageOpen: e.target.value })} className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-teal-500 outline-none" placeholder="いらっしゃいませ" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-600">受付終了メッセージ <span className="text-xs text-gray-400 font-normal">(営業終了後に表示)</span></label>
                  <input type="text" value={form.messageClosed} onChange={(e) => setForm({ ...form, messageClosed: e.target.value })} className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-gray-400 outline-none" placeholder="本日の受付は終了しました" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-600">時間外メッセージ <span className="text-xs text-gray-400 font-normal">(営業開始前に表示)</span></label>
                  <input type="text" value={form.messageOutsideHours} onChange={(e) => setForm({ ...form, messageOutsideHours: e.target.value })} className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:border-gray-400 outline-none" placeholder="受付時間外です" />
                </div>
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
