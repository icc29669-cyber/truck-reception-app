import { NextRequest } from "next/server";

/**
 * In-memory レート制限（Vercel serverless では instance ごと）
 * キオスクは同一オリジン強制なので、targeted 攻撃（curl で sec-fetch-site 偽装）に対する
 * 防御の深さとして使う。厳密なクロスインスタンス制限は期待しない。
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/** windowSec 秒間に max 回まで許容、超過したら true を返す */
export function hitRateLimit(key: string, max: number, windowSec: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    // GC: 古いバケツを掃除（1%の確率）
    if (Math.random() < 0.01) {
      Array.from(buckets.entries()).forEach(([k, v]) => {
        if (now > v.resetAt) buckets.delete(k);
      });
    }
    return false;
  }
  b.count += 1;
  return b.count > max;
}
