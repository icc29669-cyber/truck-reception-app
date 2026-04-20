import { prisma } from "./prisma";

/**
 * センター情報の in-memory キャッシュ(Vercel serverless 単位)。
 *
 * キオスクの lookup-phone / lookup-reservation / register は毎回センター情報を引くが、
 * センターはほぼ変更されないため TTL 60 秒でキャッシュする。
 * コールドスタート時は初回の findUnique で 1 rtt コストが発生するが、
 * 以降 60 秒は DB hit なし = 約 50-200ms 短縮(Neon の pgbouncer 経由で)。
 */

type CenterRow = {
  id: number;
  code: string;
  name: string;
  openTime: string;
  closeTime: string;
  messageClosed: string;
  messageOutsideHours: string;
};

const TTL_MS = 60_000;

type Entry = { value: CenterRow | null; expiresAt: number };
const cache = new Map<number, Entry>();

export async function getCenterCached(centerId: number): Promise<CenterRow | null> {
  const now = Date.now();
  const hit = cache.get(centerId);
  if (hit && hit.expiresAt > now) return hit.value;

  const row = await prisma.center.findUnique({
    where: { id: centerId },
    select: {
      id: true, code: true, name: true,
      openTime: true, closeTime: true,
      messageClosed: true, messageOutsideHours: true,
    },
  });
  cache.set(centerId, { value: row, expiresAt: now + TTL_MS });
  // GC: 1% 確率で古いエントリを削除
  if (Math.random() < 0.01) {
    Array.from(cache.entries()).forEach(([k, v]) => {
      if (v.expiresAt < now) cache.delete(k);
    });
  }
  return row;
}

/** テスト/管理画面からキャッシュを明示的に無効化する用 */
export function invalidateCenterCache(centerId?: number) {
  if (centerId === undefined) cache.clear();
  else cache.delete(centerId);
}
