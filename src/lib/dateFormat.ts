/**
 * ローカル時刻で日付を整形するユーティリティ。
 *
 * 注意: `Date.prototype.toISOString()` は UTC に変換してから整形するため、
 * 日本時間の「今日」を取る用途で使うと日付が 1 日ずれる可能性がある。
 * 本関数群は getFullYear/getMonth/getDate をそのまま使い、実行環境のタイムゾーンで
 * 決まる「そのマシンにとっての今日」を返す。
 *
 * 以前は 6 ファイルで同じテンプレートが重複していた。書式違い(ハイフン/スラッシュ)も
 * ここに集めて、表示と内部用で使い分ける。
 */

/** `YYYY-MM-DD` (内部用/Prisma where の日付キー。<input type="date"> の value と互換) */
export function toLocalDateStr(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** `YYYY/MM/DD` (画面表示用) */
export function formatDateSlash(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd}`;
}
