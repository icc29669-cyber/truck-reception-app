import { createHash } from "node:crypto";

/** 呼び出し側で検証・正規化した業務項目だけを渡す。日時や生成IDは含めない。 */
export function hashRequest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function isValidRequestId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{16,64}$/.test(value);
}
