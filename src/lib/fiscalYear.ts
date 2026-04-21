/**
 * 日本の会計年度（4月始まり）を2桁の文字列で返す
 * 例: 2026年4月以降 → "26"、2026年3月以前 → "25"
 * ※ JST (UTC+9) で判定する
 */
export function getFiscalYear(date: Date = new Date()): string {
  // JSTに変換
  const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const year = jst.getUTCMonth() >= 3 // 4月 = index 3
    ? jst.getUTCFullYear()
    : jst.getUTCFullYear() - 1;
  return String(year).slice(-2);
}

/**
 * JSTの今日の日付を YYYY-MM-DD で返す
 */
export function getTodayJST(date: Date = new Date()): string {
  const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}
