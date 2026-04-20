import { describe, it, expect } from "vitest";
import { fmtPhone, isMobilePrefix } from "./phoneFormat";

describe("isMobilePrefix", () => {
  it("090/080/070 は携帯と判定", () => {
    expect(isMobilePrefix("09012345678")).toBe(true);
    expect(isMobilePrefix("08098765432")).toBe(true);
    expect(isMobilePrefix("07011112222")).toBe(true);
  });

  it("03/0120/0467 などの固定・特番は携帯ではない", () => {
    expect(isMobilePrefix("0312345678")).toBe(false);
    expect(isMobilePrefix("0120123456")).toBe(false);
    expect(isMobilePrefix("0467221234")).toBe(false);
  });

  it("空文字や短い文字列は携帯ではない", () => {
    expect(isMobilePrefix("")).toBe(false);
    expect(isMobilePrefix("09")).toBe(false);
  });
});

describe("fmtPhone - 携帯番号", () => {
  it("完全な携帯番号は 3-4-4 でハイフン整形", () => {
    expect(fmtPhone("09012345678")).toBe("090-1234-5678");
    expect(fmtPhone("08011112222")).toBe("080-1111-2222");
  });

  it("途中まで入力された携帯は途中段階でもハイフンを入れる", () => {
    expect(fmtPhone("090")).toBe("090");
    expect(fmtPhone("0901234")).toBe("090-1234");
    expect(fmtPhone("090123456")).toBe("090-1234-56");
  });
});

describe("fmtPhone - 固定番号 (2桁市外局番 03/06)", () => {
  it("東京03は 2-4-4", () => {
    expect(fmtPhone("0312345678")).toBe("03-1234-5678");
  });

  it("大阪06は 2-4-4", () => {
    expect(fmtPhone("0612345678")).toBe("06-1234-5678");
  });
});

describe("fmtPhone - 固定番号 (3桁市外局番)", () => {
  it("045横浜は 3-3-4", () => {
    expect(fmtPhone("0451234567")).toBe("045-123-4567");
  });

  it("072大阪は 3-3-4", () => {
    expect(fmtPhone("0721234567")).toBe("072-123-4567");
  });
});

describe("fmtPhone - 固定番号 (4桁市外局番)", () => {
  it("0120 フリーダイヤルは 4-2-4", () => {
    expect(fmtPhone("0120123456")).toBe("0120-12-3456");
  });

  it("0467藤沢は 4-2-4", () => {
    expect(fmtPhone("0467221234")).toBe("0467-22-1234");
  });
});

describe("fmtPhone - エッジケース", () => {
  it("空文字は空文字を返す", () => {
    expect(fmtPhone("")).toBe("");
  });

  it("短すぎる桁は整形せずそのまま", () => {
    expect(fmtPhone("09")).toBe("09");
    expect(fmtPhone("045")).toBe("045");
  });

  it("未知の市外局番は 3-3-4 フォールバック", () => {
    expect(fmtPhone("0998765432")).toBe("099-876-5432");
  });
});
