import { NextRequest } from "next/server";
import { prisma } from "./prisma";

// ── DB ベースのレート制限 (berth 互換: login / sensitive 操作向け) ──
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const RATE_LIMIT_LOGIN_MAX = 10;       // 15分以内に10回失敗でブロック
export const RATE_LIMIT_SENSITIVE_MAX = 5;    // 電話変更等は厳しめ

export async function isRateLimited(ip: string, max: number): Promise<boolean> {
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const count = await prisma.loginAttempt.count({
    where: { ip, createdAt: { gte: since } },
  });
  return count >= max;
}

export async function recordFailure(ip: string) {
  await prisma.loginAttempt.create({ data: { ip } });
  if (Math.random() < 0.01) {
    await prisma.loginAttempt.deleteMany({
      where: { createdAt: { lt: new Date(Date.now() - 60 * 60 * 1000) } },
    });
  }
}

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
