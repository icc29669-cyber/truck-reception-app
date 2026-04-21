/**
 * 予約ステータスの単一の真実。
 *
 * - `confirmed`  : 予約確定(チェックインも完了もまだ)
 * - `checked_in` : キオスクで受付済み(バースへ案内中)
 * - `completed`  : 作業完了
 * - `cancelled`  : 取消済み
 *
 * 以前は validation 配列 `["confirmed", "cancelled", "completed", "checked_in"]` がコピペされており、
 * ステータス追加時に 1 ファイルだけ更新されてバグる危険があった。
 */

export const RESERVATION_STATUSES = [
  "confirmed",
  "checked_in",
  "completed",
  "cancelled",
] as const;

export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

/** 任意の値が有効な予約ステータスかを判定する */
export function isReservationStatus(v: unknown): v is ReservationStatus {
  return typeof v === "string" && (RESERVATION_STATUSES as readonly string[]).includes(v);
}
