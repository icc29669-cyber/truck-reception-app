import { isValidJSTDate } from "./jstDate";

export function validateReservationTime(startTime: unknown, endTime: unknown): string | null {
  const time = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (typeof startTime !== "string" || !time.test(startTime)) return "開始時刻の形式が不正です (HH:mm)";
  if (typeof endTime !== "string" || !time.test(endTime)) return "終了時刻の形式が不正です (HH:mm)";
  if (startTime >= endTime) return "終了時刻は開始時刻より後にしてください";
  return null;
}

export function validateReservationSchedule(date: unknown, startTime: unknown, endTime: unknown): string | null {
  if (!isValidJSTDate(date)) return "日付の形式が不正です (YYYY-MM-DD)";
  return validateReservationTime(startTime, endTime);
}
