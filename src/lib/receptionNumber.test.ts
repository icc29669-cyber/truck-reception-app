import { describe, expect, it } from "vitest";
import { formatReceptionNumber, getReceptionFiscalYear } from "./receptionNumber";

describe("NHSと同じ構成の受付番号", () => {
  it("88・センター・年月日・4桁連番を16桁の文字列で返す", () => {
    expect(formatReceptionNumber("3101", new Date("2026-09-26T00:00:00Z"), 1)).toBe("8831012609260001");
    expect(formatReceptionNumber("0101", new Date("2026-09-26T00:00:00Z"), 9999)).toBe("8801012609269999");
  });
  it("JSTの午前0時に年月日が変わる", () => {
    expect(formatReceptionNumber("3101", new Date("2026-12-31T14:59:59.999Z"), 1)).toBe("8831012612310001");
    expect(formatReceptionNumber("3101", new Date("2026-12-31T15:00:00Z"), 1)).toBe("8831012701010001");
  });
  it.each(["", "123", "12345", "3A01"])("不正なセンターコード %s で採番しない", (code) => {
    expect(() => formatReceptionNumber(code, new Date(), 1)).toThrow("INVALID_CENTER_CODE");
  });
  it.each([0, -1, 10000, 1.5])("連番 %s は受け付けない", (no) => {
    expect(() => formatReceptionNumber("3101", new Date(), no)).toThrow();
  });
  it("会計年度はJSTの4月1日に切り替わる", () => {
    expect(getReceptionFiscalYear(new Date("2026-03-31T14:59:59.999Z"))).toBe("25");
    expect(getReceptionFiscalYear(new Date("2026-03-31T15:00:00Z"))).toBe("26");
  });
});
