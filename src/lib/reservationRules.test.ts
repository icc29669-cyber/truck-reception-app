import { describe, expect, it } from "vitest";
import { canChangeReservationStatus, normalizeReservationStatus } from "./reservationStatus";
import { validateReservationSchedule, validateReservationTime } from "./reservationValidation";
import { parseVehicleNumber, vehicleSnapshotUpdate } from "./vehiclePlate";

describe("予約の共通ルール", () => {
  it.each(["pending", "confirmed"])("%sは未受付として扱う", status => {
    expect(normalizeReservationStatus(status)).toBe("pending");
    expect(canChangeReservationStatus(status, "cancelled", "driver")).toBe(true);
  });
  it.each(["checked_in", "completed", "cancelled", "no_show"])("ドライバーは%sを取り消せない", status => {
    expect(canChangeReservationStatus(status, "cancelled", "driver")).toBe(false);
  });
  it("管理者でも完了済みを取消に戻せない", () => {
    expect(canChangeReservationStatus("completed", "cancelled", "admin")).toBe(false);
    expect(canChangeReservationStatus("checked_in", "completed", "admin")).toBe(true);
    expect(canChangeReservationStatus("pending", "pending", "admin")).toBe(true);
  });
  it.each([["25:00", "26:00"], ["10:60", "12:00"], ["12:00", "10:00"], [10, "11:00"]])("不正な時刻 %s/%s を拒否", (start, end) => {
    expect(validateReservationTime(start, end)).not.toBeNull();
  });
  it("日付と部分更新後の前後関係を検証", () => {
    expect(validateReservationSchedule("2026-02-30", "10:00", "11:00")).not.toBeNull();
    expect(validateReservationTime("12:00", "11:00")).not.toBeNull();
    expect(validateReservationSchedule("2026-09-26", "10:00", "11:00")).toBeNull();
  });
});

describe("車番の共通モデル", () => {
  const current = { plateRegion: "品川", plateClassNum: "100", plateHira: "あ", plateNumber: "1234", vehicleNumber: "品川 100 あ 1234" };
  it("番号だけ修正しても検索用文字列が同期する", () => {
    expect(vehicleSnapshotUpdate(current, { plateNumber: "5678" })).toEqual({ ...current, plateNumber: "5678", vehicleNumber: "品川 100 あ 5678" });
    expect(vehicleSnapshotUpdate(current, {})).toEqual({});
  });
  it("文字列だけの編集でも4項目が同期する", () => {
    expect(vehicleSnapshotUpdate(current, { vehicleNumber: "横浜30AY12" })).toEqual({ plateRegion: "横浜", plateClassNum: "30A", plateHira: "Y", plateNumber: "12", vehicleNumber: "横浜 30A Y 12" });
  });
  it("管理画面が古い4項目も送信した場合、変更した車番を失わない", () => {
    expect(vehicleSnapshotUpdate(current, { ...current, vehicleNumber: "横浜30AY12" })).toEqual({ plateRegion: "横浜", plateClassNum: "30A", plateHira: "Y", plateNumber: "12", vehicleNumber: "横浜 30A Y 12" });
  });
  it("入力途中の番号空欄を復元し、空白形式と共通に扱う", () => {
    expect(parseVehicleNumber("品川 100 あ ")).toEqual({ region: "品川", classNum: "100", hira: "あ", number: "" });
  });
});
