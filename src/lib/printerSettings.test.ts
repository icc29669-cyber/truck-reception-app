import { describe, expect, it } from "vitest";
import { validatePrinterSettings } from "./printerSettings";

describe("印刷設定の保存契約", () => {
  it.each(["58", "80"])("%smmを受け付ける", paperWidth => expect(validatePrinterSettings({ paperWidth, autoPrint: false })).toBeNull());
  it.each(["57", "80; color:red", 80, null])("不正な用紙幅 %s を拒否する", paperWidth => expect(validatePrinterSettings({ paperWidth })).not.toBeNull());
  it("文字列falseを自動印刷ONとして扱わない", () => expect(validatePrinterSettings({ autoPrint: "false" })).not.toBeNull());
});
