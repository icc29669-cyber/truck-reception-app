/**
 * 基幹互換のバーコード値(16桁固定)を扱うユーティリティ。
 *
 * 構造: `<企業プレフィックス 6桁><会計年度 2桁><連番 8桁>` = 計 16 桁
 * 例  : `043101` + `26` + `00000042` → `0431012600000042`
 *
 * 以前は 3 ファイルで `"043101" + fiscalYear.padStart(2, "0") + seq.toString().padStart(8, "0")` が
 * コピペされており、プレフィックスがマジックストリング化していた。parse 側 (external/reception)
 * の 16 桁・先頭6桁チェックもここに集約する。
 */

export const BARCODE_PREFIX = "043101";
export const BARCODE_FISCAL_YEAR_LEN = 2;
export const BARCODE_SEQ_LEN = 8;
export const BARCODE_TOTAL_LEN =
  BARCODE_PREFIX.length + BARCODE_FISCAL_YEAR_LEN + BARCODE_SEQ_LEN; // 16

/**
 * 生成: fiscalYear と barcodeSeq から 16 桁のバーコード値を組み立てる。
 * barcodeSeq は Prisma スキーマ上 BigInt のため bigint も受け付ける。
 */
export function buildBarcode(
  fiscalYear: string,
  barcodeSeq: number | string | bigint,
): string {
  const fy = String(fiscalYear).padStart(BARCODE_FISCAL_YEAR_LEN, "0");
  const seq = String(barcodeSeq).padStart(BARCODE_SEQ_LEN, "0");
  return `${BARCODE_PREFIX}${fy}${seq}`;
}

/**
 * 解析: 16 桁のバーコードから fiscalYear と barcodeSeq を取り出す。不正なら null。
 *
 * parseInt("00000abc", 10) は JavaScript の仕様で先頭の数字だけ読んで `0` を返すため、
 * 全桁が数字か `/^\d+$/` で厳格に検証してから Number 化する(旧コード混在時のバグ防止)。
 */
export function parseBarcode(value: string): { fiscalYear: string; barcodeSeq: number } | null {
  if (value.length !== BARCODE_TOTAL_LEN) return null;
  if (!value.startsWith(BARCODE_PREFIX)) return null;
  const fyStart = BARCODE_PREFIX.length;
  const seqStart = fyStart + BARCODE_FISCAL_YEAR_LEN;
  const fiscalYear = value.slice(fyStart, seqStart);
  const seqStr = value.slice(seqStart);
  if (!/^\d+$/.test(fiscalYear) || !/^\d+$/.test(seqStr)) return null;
  const barcodeSeq = Number(seqStr);
  if (!Number.isSafeInteger(barcodeSeq)) return null;
  return { fiscalYear, barcodeSeq };
}
