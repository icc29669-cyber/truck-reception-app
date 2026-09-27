export type PrinterSettings = { paperWidth: "58" | "80"; autoPrint: boolean };

export function validatePrinterSettings(value: { paperWidth?: unknown; autoPrint?: unknown }): string | null {
  if (value.paperWidth !== undefined && value.paperWidth !== "58" && value.paperWidth !== "80") return "用紙幅は58mmまたは80mmを選んでください";
  if (value.autoPrint !== undefined && typeof value.autoPrint !== "boolean") return "自動印刷の設定が不正です";
  return null;
}

export async function loadPrinterSettings(signal?: AbortSignal): Promise<PrinterSettings> {
  const res = await fetch("/api/auth/me", { cache: "no-store", signal });
  if (!res.ok) throw new Error("印刷設定を取得できませんでした");
  const { user } = await res.json();
  if (!user || user.paperWidth === undefined || user.autoPrint === undefined || validatePrinterSettings(user)) {
    throw new Error("印刷設定を確認してください");
  }
  return { paperWidth: user.paperWidth, autoPrint: user.autoPrint };
}
