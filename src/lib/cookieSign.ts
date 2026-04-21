import crypto from "crypto";

// Cookie を HMAC-SHA256 で署名 / 検証するユーティリティ。
// SESSION_SECRET 環境変数を使い、サーバー側でしか扱わないこと。

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error(
      "SESSION_SECRET environment variable is missing or too short (require 32+ chars). " +
      "Generate one with: openssl rand -hex 32"
    );
  }
  return s;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function sign(payload: string): string {
  const mac = crypto.createHmac("sha256", getSecret()).update(payload).digest();
  return base64url(mac);
}

/**
 * ペイロード文字列に署名を付けた cookie 値を作成する。
 * フォーマット: "<base64url(payload)>.<base64url(HMAC-SHA256(payload))>"
 */
export function signPayload(payload: string): string {
  const pEnc = base64url(payload);
  const sig = sign(pEnc);
  return `${pEnc}.${sig}`;
}

/**
 * 署名付き cookie 値を検証し、成功すれば元のペイロードを返す。
 * 失敗（改竄・不正フォーマット）は null。
 */
export function verifyPayload(cookieValue: string | undefined | null): string | null {
  if (!cookieValue || typeof cookieValue !== "string") return null;
  const parts = cookieValue.split(".");
  if (parts.length !== 2) return null;
  const [pEnc, sig] = parts;
  const expected = sign(pEnc);
  // timingSafeEqual は同じ長さのバッファが必要
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;
  try {
    const padded = pEnc + "=".repeat((4 - (pEnc.length % 4)) % 4);
    return Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
  } catch {
    return null;
  }
}
