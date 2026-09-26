import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearPendingRequest, getPendingRequestId, readPendingRequest } from "./pendingRequest";

describe("成否不明の送信ID", () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });
  });
  afterEach(() => vi.unstubAllGlobals());
  it("再試行と保存データを読み直す再読込で同じIDを使える", () => {
    const id = getPendingRequestId("receipt", { phone: "08000000000", centerId: 1 });
    expect(getPendingRequestId("receipt", { phone: "08000000000", centerId: 1 })).toBe(id);
    expect(readPendingRequest("receipt")).toEqual({ requestId: id, payload: { phone: "08000000000", centerId: 1 } });
  });
  it("内容変更または次の来場では別のIDを使う", () => {
    const first = getPendingRequestId("receipt", { phone: "08000000000" });
    const changed = getPendingRequestId("receipt", { phone: "08000000001" });
    expect(changed).not.toBe(first);
    clearPendingRequest("receipt");
    expect(getPendingRequestId("receipt", { phone: "08000000001" })).not.toBe(changed);
  });
  it("保存できない場合は再送防止情報なしで送信を始めない", () => {
    vi.stubGlobal("sessionStorage", { getItem: () => null, setItem: () => { throw new Error("storage unavailable"); } });
    expect(() => getPendingRequestId("receipt", {})).toThrow("storage unavailable");
  });
  it("不正な保存データは復元しない", () => {
    sessionStorage.setItem("receipt", "invalid JSON");
    expect(readPendingRequest("receipt")).toBeNull();
    expect(getPendingRequestId("receipt", {})).toMatch(/^[a-f0-9]{32}$/);
  });
});
