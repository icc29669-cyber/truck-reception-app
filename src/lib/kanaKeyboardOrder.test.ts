import { describe, expect, it } from "vitest";
import { kanaKeyboardOrderForLoginId } from "./kanaKeyboardOrder";

describe("カタカナキーの試用対象", () => {
  it("岸和田02だけ右始まりにする", () => {
    expect(kanaKeyboardOrderForLoginId("510102")).toBe("right-first");
    expect(kanaKeyboardOrderForLoginId("510101")).toBe("left-first");
    expect(kanaKeyboardOrderForLoginId("310102")).toBe("left-first");
    expect(kanaKeyboardOrderForLoginId(undefined)).toBe("left-first");
  });
});
