"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CHANGELOG, type ChangelogTag } from "@/lib/changelog";

// タグごとの見た目設定(config を1箇所に)
const TAG_STYLE: Record<ChangelogTag, { bg: string; fg: string; border: string; label: string }> = {
  機能追加:     { bg: "#dcfce7", fg: "#166534", border: "#bbf7d0", label: "機能追加" },
  改善:         { bg: "#dbeafe", fg: "#1e3a8a", border: "#bfdbfe", label: "改善" },
  修正:         { bg: "#fef3c7", fg: "#92400e", border: "#fde68a", label: "修正" },
  セキュリティ: { bg: "#fecaca", fg: "#991b1b", border: "#fca5a5", label: "セキュリティ" },
  内部改善:     { bg: "#f3f4f6", fg: "#374151", border: "#e5e7eb", label: "内部改善" },
};

function formatJaDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const dow = ["日", "月", "火", "水", "木", "金", "土"][new Date(y, m - 1, d).getDay()];
  return `${y} 年 ${m} 月 ${d} 日 (${dow})`;
}

export default function ChangelogPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(() => setAuthed(true))
      .catch(() => router.push("/login"));
  }, [router]);

  if (!authed) {
    return <div className="flex items-center justify-center min-h-screen text-gray-400">読み込み中...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* ── ヘッダー ── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">更新履歴</h1>
        <p className="text-sm text-gray-500 mt-1">
          システムの改善・修正・機能追加の履歴(最新が上)
        </p>
      </div>

      {CHANGELOG.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          まだ履歴がありません
        </div>
      )}

      {/* ── 縦タイムライン ── */}
      <ol className="relative space-y-6 before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-[2px] before:bg-gray-200">
        {CHANGELOG.map((entry, i) => (
          <li key={entry.date + "-" + i} className="relative pl-10">
            {/* タイムラインのドット */}
            <span
              className="absolute left-0 top-2 w-6 h-6 rounded-full border-[3px] border-white"
              style={{ background: i === 0 ? "#0d9488" : "#94a3b8", boxShadow: "0 0 0 2px #e2e8f0" }}
              aria-hidden
            />
            <article className="bg-white rounded-xl border border-gray-200 p-5">
              {/* 日付 + タグ */}
              <div className="flex items-center flex-wrap gap-2 mb-3">
                <time
                  dateTime={entry.date}
                  className="font-bold text-gray-800 text-base"
                >
                  {formatJaDate(entry.date)}
                </time>
                {entry.tags.map((t) => {
                  const s = TAG_STYLE[t];
                  return (
                    <span
                      key={t}
                      className="text-xs font-bold rounded-full px-2.5 py-0.5 border"
                      style={{ background: s.bg, color: s.fg, borderColor: s.border }}
                    >
                      {s.label}
                    </span>
                  );
                })}
              </div>

              {/* 項目リスト */}
              <ul className="space-y-2 text-sm text-gray-700 leading-relaxed">
                {entry.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <span className="flex-shrink-0 text-emerald-600 font-bold mt-0.5">・</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </li>
        ))}
      </ol>

      {/* ── 追加方法の案内(運用者向け) ── */}
      <div className="mt-12 bg-amber-50 border-l-4 border-amber-300 rounded-r-lg p-4 text-xs text-gray-600">
        <p className="font-bold text-amber-800 mb-1">※ 運用メモ</p>
        <p>
          更新履歴は <code className="px-1.5 py-0.5 bg-white rounded border border-amber-200 font-mono text-[11px]">src/lib/changelog.ts</code> を編集して追記します。
          コミット・デプロイと同時に更新してください。
        </p>
      </div>
    </div>
  );
}
