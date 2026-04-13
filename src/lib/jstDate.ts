/**
 * JST日付ユーティリティ
 * サーバーのタイムゾーンに依存せず、常にJST基準で日付を扱う
 */

/** 現在のJST日付を "YYYY-MM-DD" 形式で返す */
export function getJSTToday(): string {
  const now = new Date();
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
