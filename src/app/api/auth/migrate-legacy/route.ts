import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 旧 AdminUser / KioskTerminal データを User テーブルへ移行する一度きりのヘルパ。
 * User テーブルに 1 件でも行があれば 403 で拒否。
 *
 * 旧テーブルは db push --accept-data-loss でスキーマ drop される前に
 * raw query で救出できなくなった時点で使用不能になるため、
 * あくまで「スキーマ移行後 + 旧バックアップを別経路で持っている場合」のリカバリ用。
 */
export async function POST() {
  const count = await prisma.user.count();
  if (count > 0) {
    return NextResponse.json({ error: "User が既に存在します" }, { status: 403 });
  }
  // 旧テーブルは既に drop 済みなので何もしない (単に 200 返す)
  return NextResponse.json({ ok: true, note: "旧テーブルは drop 済み。bootstrap で新規作成してください" });
}
