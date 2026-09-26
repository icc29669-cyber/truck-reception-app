/**
 * JST日付ユーティリティ
 * サーバーのタイムゾーンに依存せず、常にJST基準で日付を扱う
 */

/** 指定日時（省略時は現在）のJST日付を "YYYY-MM-DD" 形式で返す */
export function getJSTToday(now: Date = new Date()): string {
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const yyyy = jst.getUTCFullYear();
  const mm = String(jst.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(jst.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** JST日付文字列からその日の開始・終了のDateオブジェクトを返す */
export function getJSTDayRange(dateStr?: string): { start: Date; end: Date } {
  const today = dateStr || getJSTToday();
  return {
    start: new Date(today + "T00:00:00+09:00"),
    end: new Date(today + "T23:59:59.999+09:00"),
  };
}

/** YYYY-MM-DD の実在する日付かを検証する（2月30日等の自動繰り上がりを拒否）。 */
export function isValidJSTDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00+09:00");
  return !Number.isNaN(date.getTime()) && getJSTToday(date) === value;
}
