import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BERTH_API_URL = process.env.BERTH_API_URL || "";
const BERTH_KIOSK_SECRET = process.env.BERTH_KIOSK_SECRET || "";

/**
 * 予約システム（berth-app）から祝日マスタを同期
 * POST /api/admin/sync/holidays
 */
export async function POST() {
  if (!BERTH_API_URL || !BERTH_KIOSK_SECRET) {
    return NextResponse.json(
      { error: "予約システムとの連携が設定されていません" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`${BERTH_API_URL}/api/reception/holidays`, {
      headers: { "X-Kiosk-Secret": BERTH_KIOSK_SECRET },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `祝日取得失敗: ${res.status}` },
        { status: 502 }
      );
    }

    const remoteHolidays = (await res.json()) as { date: string; name: string }[];

    // 祝日をSettingテーブルにJSON保存（受付アプリにHolidayモデルは不要）
    await prisma.setting.upsert({
      where: { key: "holidays" },
      update: { value: JSON.stringify(remoteHolidays) },
      create: { key: "holidays", value: JSON.stringify(remoteHolidays) },
    });

    // 同期日時を保存
    await prisma.setting.upsert({
      where: { key: "last_holiday_sync" },
      update: { value: new Date().toISOString() },
      create: { key: "last_holiday_sync", value: new Date().toISOString() },
    });

    return NextResponse.json({
      success: true,
      count: remoteHolidays.length,
      syncedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Holiday sync error:", e);
    return NextResponse.json({ error: "祝日同期に失敗しました" }, { status: 500 });
  }
}

/**
 * 同期済みの祝日一覧と最終同期日時を返す
 * GET /api/admin/sync/holidays
 */
export async function GET() {
  try {
    const [holidaysSetting, syncSetting] = await Promise.all([
      prisma.setting.findUnique({ where: { key: "holidays" } }),
      prisma.setting.findUnique({ where: { key: "last_holiday_sync" } }),
    ]);

    const holidays = holidaysSetting?.value ? JSON.parse(holidaysSetting.value) : [];
    return NextResponse.json({
      holidays,
      lastSyncedAt: syncSetting?.value || null,
    });
  } catch {
    return NextResponse.json({ holidays: [], lastSyncedAt: null });
  }
}
