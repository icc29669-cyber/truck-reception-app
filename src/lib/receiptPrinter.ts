import type { PrinterSettings } from "./printerSettings";

/** 印刷呼出しまでを保証する。実際の紙出力の成否はブラウザでは取得できない。 */
export async function printReceipt(paperWidth: PrinterSettings["paperWidth"], signal: AbortSignal): Promise<void> {
  const source = document.getElementById("print-receipt");
  const sourceImage = source?.querySelector("img");
  if (!source || !sourceImage?.complete || !sourceImage.naturalWidth) throw new Error("QRコードの準備ができていません");
  signal.throwIfAborted();
  document.getElementById("print-frame")?.remove();
  const frame = document.createElement("iframe");
  frame.id = "print-frame";
  frame.style.cssText = "position:fixed;width:0;height:0;border:none;left:-9999px;top:-9999px;";
  document.body.appendChild(frame);
  const remove = () => frame.remove();
  signal.addEventListener("abort", remove, { once: true });
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const doc = frame.contentDocument;
    if (!doc || !frame.contentWindow) throw new Error("印刷用の画面を作成できません");
    doc.open();
    doc.write(`<!doctype html><html><head><style>@page{size:${paperWidth}mm auto;margin:3mm}body{margin:0}*{font-family:"MS Gothic",monospace}img{max-width:100%}</style></head><body>${source.innerHTML}</body></html>`);
    doc.close();
    const img = doc.querySelector("img");
    if (!img) throw new Error("印刷用QRコードがありません");
    await Promise.race([
      img.decode(),
      new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new Error("QRコードの読み込みが時間切れになりました")), 5000); }),
    ]);
    signal.throwIfAborted();
    if (!img.naturalWidth) throw new Error("QRコードを読み込めませんでした");
    frame.contentWindow.print();
    setTimeout(remove, 2000);
  } catch (error) {
    remove();
    throw error;
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener("abort", remove);
  }
}
