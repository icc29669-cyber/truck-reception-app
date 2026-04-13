import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// 不足カラムをALTER TABLEで追加する管理用エンドポイント
export async function POST() {
  const results: string[] = [];

  const cols: [string, string][] = [
    ['"openTime"',           "TEXT NOT NULL DEFAULT '08:00'"],
    ['"closeTime"',          "TEXT NOT NULL DEFAULT '18:00'"],
    ['"slotDurationMinutes"',"INTEGER NOT NULL DEFAULT 60"],
    ['"closedOnSunday"',     "BOOLEAN NOT NULL DEFAULT true"],
    ['"closedOnHoliday"',    "BOOLEAN NOT NULL DEFAULT true"],
    ['"hasBreak"',           "BOOLEAN NOT NULL DEFAULT false"],
    ['"breakStart"',         "TEXT NOT NULL DEFAULT '12:00'"],
    ['"breakEnd"',           "TEXT NOT NULL DEFAULT '13:00'"],
    ['"breaks"',             "TEXT NOT NULL DEFAULT '[]'"],
    ['"messageOpen"',        "TEXT NOT NULL DEFAULT ''"],
    ['"messageBreak"',       "TEXT NOT NULL DEFAULT ''"],
    ['"messageClosed"',      "TEXT NOT NULL DEFAULT ''"],
    ['"messageOutsideHours"',"TEXT NOT NULL DEFAULT ''"],
  ];

  for (const [col, def] of cols) {
    try {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "Center" ADD COLUMN IF NOT EXISTS ${col} ${def}`
      );
      results.push(`OK: ${col}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      results.push(`FAIL: ${col} - ${msg}`);
    }
  }

  // デフォルトメッセージを設定
  try {
    await prisma.$executeRawUnsafe(`UPDATE "Center" SET "messageOpen" = 'いらっしゃいませ' WHERE "messageOpen" = ''`);
    await prisma.$executeRawUnsafe(`UPDATE "Center" SET "messageBreak" = 'ただいま昼休みです　しばらくお待ちください' WHERE "messageBreak" = ''`);
    await prisma.$executeRawUnsafe(`UPDATE "Center" SET "messageClosed" = '本日の受付は終了しました' WHERE "messageClosed" = ''`);
    await prisma.$executeRawUnsafe(`UPDATE "Center" SET "messageOutsideHours" = '受付時間外です' WHERE "messageOutsideHours" = ''`);
    results.push("OK: default messages set");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    results.push(`FAIL: default messages - ${msg}`);
  }

  // 既存のhasBreak/breakStart/breakEndデータをbreaksに移行
  try {
    const centers = await prisma.$queryRawUnsafe<Array<{id: number; hasBreak: boolean; breakStart: string; breakEnd: string; breaks: string; messageBreak: string}>>(
      `SELECT "id", "hasBreak", "breakStart", "breakEnd", "breaks", "messageBreak" FROM "Center"`
    );
    for (const c of centers) {
      if (c.hasBreak && (!c.breaks || c.breaks === "[]")) {
        const breakData = JSON.stringify([{
          type: "lunch",
          start: c.breakStart || "12:00",
          end: c.breakEnd || "13:00",
          message: c.messageBreak || "ただいま昼休みです　しばらくお待ちください",
        }]);
        await prisma.$executeRawUnsafe(
          `UPDATE "Center" SET "breaks" = '${breakData.replace(/'/g, "''")}' WHERE "id" = ${c.id}`
        );
      }
    }
    results.push("OK: breaks migration");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    results.push(`FAIL: breaks migration - ${msg}`);
  }

  return NextResponse.json({ results });
}
