import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const BERTH_API_URL = process.env.BERTH_API_URL || "";
const BERTH_KIOSK_SECRET = process.env.BERTH_KIOSK_SECRET || "";

/**
 * 予約システム（berth-app）からドライバーマスタを同期
 * POST /api/admin/sync/drivers
 */
export async function POST() {
  if (!BERTH_API_URL || !BERTH_KIOSK_SECRET) {
    return NextResponse.json(
      { error: "予約システムとの連携が設定されていません (BERTH_API_URL / BERTH_KIOSK_SECRET)" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`${BERTH_API_URL}/api/reception/drivers`, {
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

    const remoteDrivers = (await res.json()) as {
      id: number;
      phone: string;
      name: string;
      companyName: string;
      defaultVehicle: string;
      defaultMaxLoad: string;
    }[];

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const rd of remoteDrivers) {
      if (!rd.phone) {
        skipped++;
        continue;
      }

      // phone + name + companyName でマッチ
      const existing = await prisma.driver.findFirst({
        where: {
          phone: rd.phone,
          name: rd.name,
          companyName: rd.companyName,
        },
      });

      if (existing) {
        // 既存ドライバーの updatedAt を更新
        await prisma.driver.update({
          where: { id: existing.id },
          data: { updatedAt: new Date() },
        });
        updated++;
      } else {
        // 新規ドライバーを作成
        await prisma.driver.create({
          data: {
            phone: rd.phone,
            name: rd.name,
            companyName: rd.companyName,
            isActive: true,
          },
        });
        created++;
      }
    }

    // 同期日時を保存
    await prisma.setting.upsert({
      where: { key: "last_driver_sync" },
      update: { value: new Date().toISOString() },
      create: { key: "last_driver_sync", value: new Date().toISOString() },
    });

    return NextResponse.json({
      success: true,
      total: remoteDrivers.length,
      created,
      updated,
      skipped,
      syncedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Driver sync error:", e);
    return NextResponse.json({ error: "ドライバー同期に失敗しました" }, { status: 500 });
  }
}

/**
 * 最終同期日時を返す
 * GET /api/admin/sync/drivers
 */
export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: "last_driver_sync" } });
    return NextResponse.json({ lastSyncedAt: setting?.value || null });
  } catch {
    return NextResponse.json({ lastSyncedAt: null });
  }
}
