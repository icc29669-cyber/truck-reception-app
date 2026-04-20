import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getJSTToday, getJSTDayRange } from "./jstDate";

describe("getJSTToday", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("JSTの正午時点では YYYY-MM-DD を返す", () => {
    vi.setSystemTime(new Date("2026-04-20T03:00:00Z")); // JST 12:00
    expect(getJSTToday()).toBe("2026-04-20");
  });

  it("UTC深夜15:01 = JST翌日0:01 で日付が繰り上がる", () => {
    vi.setSystemTime(new Date("2026-04-20T15:01:00Z")); // JST 00:01 翌日
    expect(getJSTToday()).toBe("2026-04-21");
  });

  it("UTC深夜14:59 = JST当日23:59 は当日のまま", () => {
    vi.setSystemTime(new Date("2026-04-20T14:59:00Z")); // JST 23:59 当日
    expect(getJSTToday()).toBe("2026-04-20");
  });
});

describe("getJSTDayRange", () => {
  it("指定日の開始と終了が JST の 00:00〜23:59:59.999", () => {
    const { start, end } = getJSTDayRange("2026-04-20");
    expect(start.toISOString()).toBe("2026-04-19T15:00:00.000Z"); // JST 00:00 = UTC 15:00 前日
    expect(end.toISOString()).toBe("2026-04-20T14:59:59.999Z"); // JST 23:59:59.999
  });

  it("引数なしのとき今日の range を返す", () => {
    const { start, end } = getJSTDayRange();
    expect(end.getTime() - start.getTime()).toBe(24 * 60 * 60 * 1000 - 1);
  });
});
