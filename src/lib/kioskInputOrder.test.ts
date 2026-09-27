import { describe, expect, it } from "vitest";
import { kioskInputOrderForLoginId, orderedInputRow } from "./kioskInputOrder";

describe("受付入力キーの試用対象", () => {
  it("岸和田02だけ右始まりにする", () => {
    expect(kioskInputOrderForLoginId("510102")).toBe("right-first");
    expect(kioskInputOrderForLoginId("510101")).toBe("left-first");
    expect(kioskInputOrderForLoginId("310102")).toBe("left-first");
    expect(kioskInputOrderForLoginId(undefined)).toBe("left-first");
  });

  it("表示行だけ反転し、元のキー配列を変えない", () => {
    const row = ["あ", null, "わ"];
    expect(orderedInputRow(row, "right-first")).toEqual(["わ", null, "あ"]);
    expect(orderedInputRow(row, "left-first")).toEqual(row);
    expect(row).toEqual(["あ", null, "わ"]);
  });
});
