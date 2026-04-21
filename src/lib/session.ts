/**
 * セッション管理 (統合版)
 *   - 1 ID = 1 User = 1 センター + 1 印刷設定
 *   - 同じ cookie で /admin と /kiosk 両方にアクセスできる
 *   - パスワード: PBKDF2-SHA256 100k iter + salt (edge 互換)
 *   - セッション: HMAC-SHA256 署名、期限なし (sliding cookie 更新)
 */

const te = new TextEncoder();
const td = new TextDecoder();

function b64urlEncode(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(s: string): Uint8Array {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/* ───────── パスワード hashing (PBKDF2) ───────── */

const PBKDF2_ITER = 100_000;
const PBKDF2_HASH_LEN = 32;

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw", te.encode(password), { name: "PBKDF2" }, false, ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITER, hash: "SHA-256" },
    key, PBKDF2_HASH_LEN * 8
  );
  return `pbkdf2$${PBKDF2_ITER}$${b64urlEncode(salt)}$${b64urlEncode(bits)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, iterStr, saltB64, hashB64] = stored.split("$");
  if (scheme !== "pbkdf2") return false;
  const iter = parseInt(iterStr, 10);
  const salt = b64urlDecode(saltB64);
  const expected = b64urlDecode(hashB64);
  const key = await crypto.subtle.importKey(
    "raw", te.encode(password), { name: "PBKDF2" }, false, ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: iter, hash: "SHA-256" },
    key, expected.length * 8
  );
  const bits = new Uint8Array(derived);
  if (bits.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < bits.length; i++) diff |= bits[i] ^ expected[i];
  return diff === 0;
}

/* ───────── セッション署名 (HMAC-SHA256) ───────── */

let hmacKeyCache: CryptoKey | null = null;
async function getHmacKey(): Promise<CryptoKey> {
  if (hmacKeyCache) return hmacKeyCache;
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET env が未設定または短すぎます (32文字以上推奨)");
  }
  hmacKeyCache = await crypto.subtle.importKey(
    "raw", te.encode(secret), { name: "HMAC", hash: "SHA-256" },
    false, ["sign", "verify"]
  );
  return hmacKeyCache;
}

export type UserSession = {
  sub: number;       // User.id
  loginId: string;
  name: string;
  centerId: number;
  iat: number;
};

export async function signSession(payload: UserSession): Promise<string> {
  const body = b64urlEncode(te.encode(JSON.stringify(payload)));
  const key = await getHmacKey();
  const sig = await crypto.subtle.sign("HMAC", key, te.encode(body));
  return `${body}.${b64urlEncode(sig)}`;
}

export async function verifySession(token: string): Promise<UserSession | null> {
  if (!token || typeof token !== "string") return null;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const body = token.slice(0, dot);
  const sigB64 = token.slice(dot + 1);
  const key = await getHmacKey();
  const ok = await crypto.subtle.verify(
    "HMAC", key, b64urlDecode(sigB64) as BufferSource, te.encode(body)
  );
  if (!ok) return null;
  try {
    return JSON.parse(td.decode(b64urlDecode(body))) as UserSession;
  } catch {
    return null;
  }
}

/* ───────── cookie ヘルパ ───────── */

export const SESSION_COOKIE = "truck_session";
// ブラウザの上限に合わせて 400日 (RFC 6265bis / Chrome 104+)
// /me のたびに sliding refresh するため実運用上は期限なし
export const SESSION_TTL_SEC = 400 * 24 * 60 * 60;

export function cookieOptions(maxAgeSec: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSec,
  };
}
