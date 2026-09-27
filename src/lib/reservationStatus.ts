/** DBの正規状態。統合前のconfirmedは読み取り時にpendingとして扱う。 */
export const RESERVATION_STATUSES = ["pending", "checked_in", "completed", "cancelled", "no_show"] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];
export const PENDING_RESERVATION_STATUSES = ["pending", "confirmed"];

export function normalizeReservationStatus(value: unknown): ReservationStatus | null {
  if (value === "confirmed") return "pending";
  return typeof value === "string" && (RESERVATION_STATUSES as readonly string[]).includes(value)
    ? value as ReservationStatus : null;
}

export function isReservationStatus(value: unknown): boolean {
  return normalizeReservationStatus(value) !== null;
}

const transitions: Record<ReservationStatus, readonly ReservationStatus[]> = {
  pending: ["checked_in", "completed", "cancelled", "no_show"],
  checked_in: ["completed", "cancelled"],
  completed: [], cancelled: [], no_show: [],
};

export function canChangeReservationStatus(current: unknown, next: unknown, actor: "admin" | "driver"): boolean {
  const from = normalizeReservationStatus(current), to = normalizeReservationStatus(next);
  if (!from || !to) return false;
  if (actor === "driver") return from === "pending" && to === "cancelled";
  return from === to || transitions[from].includes(to);
}

export function reservationStatusLabel(value: string): string {
  const status = normalizeReservationStatus(value);
  return status ? ({ pending: "予約済", checked_in: "受付済", completed: "完了", cancelled: "取消済", no_show: "未来場" })[status] : value;
}
