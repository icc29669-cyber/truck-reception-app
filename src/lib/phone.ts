/**
 * 電話番号の正規化ユーティリティ。
 * - ハイフン・半角/全角スペースを除去して数字だけの形に揃える
 * - null/undefined/数値/文字列のどれが来ても安全に空文字を返す
 *
 * 以前は 6 ファイルで同じ `x?.replace(/[-\s]/g, "") ?? ""` が重複していた。
 * 仕様が揺れてバグになる前にここで一本化する。
 */
export function normalizePhone(raw: unknown): string {
  if (raw == null) return "";
  return String(raw).replace(/[-\s]/g, "");
}
