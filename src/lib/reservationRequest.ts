import { clearPendingRequest } from "./pendingRequest";

type ReservationSlot = { date: string; startTime: string; endTime: string; centerId: number | null };

export function getReservationRequestKey(driverId: number, slot: ReservationSlot): string {
  return `reservation_request_${driverId}_${slot.date}_${slot.startTime}_${slot.endTime}_${slot.centerId}`;
}

/** 完了画面から明示的に離れるか、取消が成功した後にだけ次の予約操作へ進める。 */
export function clearCompletedReservationRequest(driverId: number, slot: ReservationSlot): void {
  const key = getReservationRequestKey(driverId, slot);
  sessionStorage.removeItem(`${key}_done`);
  clearPendingRequest(key);
}
