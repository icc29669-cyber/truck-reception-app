import { NextRequest, NextResponse } from "next/server";
import { prisma, getOrCreateSetting } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const setting = await getOrCreateSetting();
    return NextResponse.json(setting);
  } catch (e) {
    console.error("settings-get error:", e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await checkAdminAuth())) {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const body = await request.json();
  // id を除いた更新可能フィールドのみ抽出
  const {
    slotDurationMinutes,
    openTime,
    closeTime,
    maxReservationsPerSlot,
    closedOnSunday,
    saturdayOddHalfDay,
    saturdayOddCloseTime,
    saturdayEvenClosed,
    closedOnHoliday,
  } = body;

  // バリデーション
  const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (slotDurationMinutes !== undefined && (typeof slotDurationMinutes !== "number" || slotDurationMinutes < 15 || slotDurationMinutes > 480)) {
    return NextResponse.json({ error: "スロット時間は15〜480分で指定してください" }, { status: 400 });
  }
  if (maxReservationsPerSlot !== undefined && (typeof maxReservationsPerSlot !== "number" || maxReservationsPerSlot < 1 || maxReservationsPerSlot > 100)) {
    return NextResponse.json({ error: "最大予約数は1〜100で指定してください" }, { status: 400 });
  }
  if (openTime !== undefined && !timeRegex.test(openTime)) {
    return NextResponse.json({ error: "開始時刻の形式が不正です (HH:MM)" }, { status: 400 });
  }
  if (closeTime !== undefined && !timeRegex.test(closeTime)) {
    return NextResponse.json({ error: "終了時刻の形式が不正です (HH:MM)" }, { status: 400 });
  }
  if (saturdayOddCloseTime !== undefined && !timeRegex.test(saturdayOddCloseTime)) {
    return NextResponse.json({ error: "土曜終了時刻の形式が不正です (HH:MM)" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (slotDurationMinutes !== undefined) data.slotDurationMinutes = slotDurationMinutes;
  if (openTime !== undefined) data.openTime = openTime;
  if (closeTime !== undefined) data.closeTime = closeTime;
  if (maxReservationsPerSlot !== undefined) data.maxReservationsPerSlot = maxReservationsPerSlot;
  if (closedOnSunday !== undefined) data.closedOnSunday = closedOnSunday;
  if (saturdayOddHalfDay !== undefined) data.saturdayOddHalfDay = saturdayOddHalfDay;
  if (saturdayOddCloseTime !== undefined) data.saturdayOddCloseTime = saturdayOddCloseTime;
  if (saturdayEvenClosed !== undefined) data.saturdayEvenClosed = saturdayEvenClosed;
  if (closedOnHoliday !== undefined) data.closedOnHoliday = closedOnHoliday;

  try {
    const setting = await prisma.appSetting.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    });

    return NextResponse.json(setting);
  } catch (e) {
    console.error("settings-put error:", e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
