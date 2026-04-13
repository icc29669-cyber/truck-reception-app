import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BERTH_API_URL = process.env.BERTH_API_URL || "";
const BERTH_KIOSK_SECRET = process.env.BERTH_KIOSK_SECRET || "";

/**
 * 予約システム（berth-app）からセンターマスタを同期
 * POST /api/admin/sync/centers
 */
export async function POST() {
  if (!BERTH_API_URL || !BERTH_KIOSK_SECRET) {
    return NextResponse.json(
      { error: "予約システムとの連携が設定されていません (BERTH_API_URL / BERTH_KIOSK_SECRET)" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`${BERTH_API_URL}/api/reception/centers`, {
      headers: { "X-Kiosk-Secret": BERTH_KIOSK_SECRET },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `予約システムからの取得に失敗: ${res.status} ${text}` },
        { status: 502 }
      );
    }

    const remoteCenters = (await res.json()) as {
      id: number;
      code: string;
      name: string;
      openTime: string;
      closeTime: string;
      slotDurationMinutes: number;
      closedOnSunday: boolean;
      closedOnHoliday: boolean;
      hasBreak: boolean;
      breakStart: string;
      breakEnd: string;
    }[];

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const rc of remoteCenters) {
      if (!rc.code) {
        skipped++;
        continue;
      }

      const existing = await prisma.center.findFirst({ where: { code: rc.code } });

      const syncData = {
        name: rc.name,
        isActive: true,
        openTime: rc.openTime || "08:00",
        closeTime: rc.closeTime || "18:00",
        slotDurationMinutes: rc.slotDurationMinutes || 60,
        closedOnSunday: rc.closedOnSunday ?? true,
        closedOnHoliday: rc.closedOnHoliday ?? true,
        hasBreak: rc.hasBreak ?? false,
        breakStart: rc.breakStart || "12:00",
        breakEnd: rc.breakEnd || "13:00",
      };

      if (existing) {
        await prisma.center.update({
          where: { id: existing.id },
          data: syncData,
        });
        updated++;
      } else {
        await prisma.center.create({
          data: { code: rc.code, ...syncData },
        });
        created++;
      }
    }

    // 同期日時を保存
    await prisma.setting.upsert({
      where: { key: "last_center_sync" },
      update: { value: new Date().toISOString() },
      create: { key: "last_center_sync", value: new Date().toISOString() },
    });

    return NextResponse.json({
      success: true,
      total: remoteCenters.length,
      created,
      updated,
      skipped,
      syncedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Center sync error:", e);
    return NextResponse.json({ error: "同期処理に失敗しました" }, { status: 500 });
  }
}

/**
 * 最終同期日時を返す
 * GET /api/admin/sync/centers
 */
export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: "last_center_sync" } });
    return NextResponse.json({ lastSyncedAt: setting?.value || null });
  } catch {
    return NextResponse.json({ lastSyncedAt: null });
  }
}
