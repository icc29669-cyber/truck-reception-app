import { describe, expect, it } from "vitest";
import { getJSTDayRange, getJSTToday, isValidJSTDate } from "./jstDate";
import { parseVehicleNumber } from "./vehiclePlate";

describe("予約日と既存データの互換性", () => {
  it("同じ日の旧UTC0時・JST0時を含み、前日・翌日を含めない", () => {
    const { start, end } = getJSTDayRange("2026-09-26");
    const dates = ["2026-09-24T15:00:00Z", "2026-09-25T00:00:00Z", "2026-09-25T15:00:00Z", "2026-09-26T00:00:00Z", "2026-09-26T15:00:00Z", "2026-09-27T00:00:00Z"];
    expect(dates.filter((value) => new Date(value) >= start && new Date(value) <= end))
      .toEqual(["2026-09-25T15:00:00Z", "2026-09-26T00:00:00Z"]);
    expect(end.getTime() - start.getTime() + 1).toBe(24 * 60 * 60 * 1000);
  });
  it.each(["2026-09-25T15:00:00Z", "2026-09-26T00:00:00Z"])("%s の一覧表示は同じ予約日になる", (date) => {
    expect(getJSTToday(new Date(date))).toBe("2026-09-26");
  });
  it.each(["2026-02-30", "2026-02-29", "2026-13-01", "2026-9-26", "bad", null])("実在しない日付 %s を拒否", (date) => {
    expect(isValidJSTDate(date)).toBe(false);
  });
  it("うるう日を認める", () => expect(isValidJSTDate("2028-02-29")).toBe(true));
});

describe("予約の保存車番からプレートを復元", () => {
  it.each(["品川 100 あ 1234", "品川100あ1234", "品川　１００　あ　１２３４", "品川 100 あ12-34"])("%s", (value) => {
    expect(parseVehicleNumber(value)).toEqual({ region: "品川", classNum: "100", hira: "あ", number: "1234" });
  });
  it("英字の分類番号・用途文字を保持", () => {
    expect(parseVehicleNumber("横浜 30A Y 12")).toEqual({ region: "横浜", classNum: "30A", hira: "Y", number: "12" });
  });
  it("不明な車番を誤って分解しない", () => {
    expect(parseVehicleNumber("不明")).toEqual({ region: "", classNum: "", hira: "", number: "" });
  });
});
